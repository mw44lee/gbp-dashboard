# GBP Ops Board — Claude Code 작업 가이드

@docs/STATUS.md

## 이 프로젝트

Samsung Experience Store 글로벌 매장(현재 58개, 16개국)의 Google Business Profile(GBP)을 한 화면에서 모니터링하는 풀스택 대시보드. 목표는 두 가지다: 사용자의 풀스택 학습, 그리고 실제로 쓸 수 있는 도구.

## 사용자와 일하는 방식

- **한국어로 답한다.** 대시보드 UI 기본 언어는 영어(en)이고 한국어(ko)로 전환할 수 있다.
- 사용자는 직접 코딩하지 않지만 구조를 이해하려 한다. 구현하면서 왜 그렇게 설계했는지 설명한다. 큰 기능은 코딩 전에 접근 방식을 제안하고 합의한 뒤 진행한다.
- 답변은 간결하게, 결과를 먼저 말한다. 모르는 것, 검증하지 못한 것은 검증하지 못했다고 분명히 말한다.
- 사용자가 선택할 만한 갈림길(보안, 비용, 외부 계정)은 임의로 정하지 말고 선택지를 보여주고 묻는다.
- API 키 같은 비밀값은 채팅에 붙여넣게 하지 않는다. 사용자가 `backend/.env`에 직접 넣게 안내한다.

## 데이터 정직성 규칙 (중요)

시뮬레이션이나 플레이스홀더 값을 실제 데이터처럼 보여주지 않는다. 알림, 긴급 개수, 리뷰는 실제 근거가 있는 데이터만 반영한다.

- 알림 규칙은 `backend/src/services/alerts.ts`. 실제 필드(운영 상태, 평점 추이)로만 켜져 있고, 시뮬레이션 값을 쓰는 규칙은 `USE_ESTIMATED_METRICS = false`로 꺼져 있다. 실제 GBP 활동 데이터가 연결되기 전에는 켜지 않는다.
- 새 데이터를 붙일 때는 무엇이 실제이고 무엇이 추정인지 화면과 문서에 표시하고, 사용자가 나중에 발견하게 두지 않는다.
- 이전에 8개 매장이 가짜 "대표 이미지 경과일"만으로 긴급 처리돼서 사용자가 문제 삼은 적이 있다.

## Git

- 저장소: github.com/mw44lee/gbp-dashboard (**PUBLIC**), 브랜치 `master`.
- **커밋한 뒤에는 자동으로 push해도 된다**(사용자가 허가함, 이 저장소 한정, force push 제외).
- push 전에 `git diff --name-only origin/master..HEAD`로 `.env`, `*.db`, 키·토큰이 섞이지 않았는지 확인한다. public 저장소다.
- 커밋 메시지는 영어, 제목 한 줄과 무엇을·왜 바꿨는지 불릿 본문.
- `.git/config`는 동기화되지 않으니 새 환경에서는 `git config user.name`, `git config user.email`을 설정한다(GitHub 계정에 인증된 이메일).

## 스택과 구조

모노레포(npm workspaces). Node 20 이상이면 되고, 개발은 Node 24~26에서 했다.

```
backend/   Express + Prisma + SQLite, TypeScript (tsx로 실행)   :4000
frontend/  React 18 + Vite 5 + TypeScript, react-i18next          :5173 (/api는 백엔드로 프록시)
```

- **DB 모델** (`backend/prisma/schema.prisma`): `Store`, `Product`, `Review`(+`externalId`), `ReviewTranslation`(번역 캐시), `DailyReport`.
- **상태/이슈는 DB에 저장하지 않는다.** `alerts.ts`가 읽을 때마다 계산한다.
- **AI**: `services/aiProvider.ts`가 리뷰 번역과 답변 초안을 모두 Claude API(`claude-sonnet-5`)로 처리한다. `ANTHROPIC_API_KEY`가 없으면 `[mock ...]` 텍스트를 반환하는 MockProvider로 동작한다. 키는 서버에만 있고 브라우저에는 노출되지 않는다.
- **번역은 두 갈래로 완전히 별개다.** UI 언어는 `frontend/src/i18n/locales/*.json`(정적), 리뷰 내용은 백엔드가 AI로 번역하고 `ReviewTranslation`에 캐시한다.
- **API**: `GET /api/stores`, `GET /api/stores/:id`, `GET /api/stores/:id/reviews?lang=`, `POST /api/reviews/:id/reply-draft`, `POST /api/import/gbp-urls`(xlsx 업로드), `GET /api/reports/latest`, `GET /api/health`.

## 명령어

```bash
npm install                                   # 루트에서 한 번 (workspaces)
cp backend/.env.example backend/.env          # 필요하면 키 입력 (둘 다 선택 사항)
cd backend && npx prisma migrate deploy && npx prisma db seed && cd ..
npm run dev                                   # 백엔드 + 프론트 동시 실행

npx tsc --noEmit -p backend && npx tsc --noEmit -p frontend    # 타입 체크 (테스트는 아직 없음)

npm run report:ingest -w backend -- <메일본문.txt> "<제목>"     # 일일 점검 메일 반영
npm run reviews:sync -w backend                                 # 실제 리뷰 (GOOGLE_PLACES_API_KEY 필요)
python3 backend/data/convert_real_dataset.py [입력.xlsx]        # 매장 xlsx 정규화 (openpyxl 필요)
```

사전 준비: Node 20+, `python3` + `openpyxl`(Ubuntu 24.04는 venv 사용), Prisma용 `openssl`(`sudo apt install openssl`).

매장 목록을 갱신하는 흐름: 새 xlsx → `convert_real_dataset.py` → `backend/data/gbp-urls.real.xlsx` 생성 → `npx prisma db seed`. gbp_url 기준 upsert이고 새 매장만 시뮬레이션 값이 채워진다.

## 주의사항

- **`prisma migrate dev`는 대화형이라 비대화형 셸에서 실패한다.** 유니크 제약 추가처럼 경고가 있으면 확인 프롬프트에서 막힌다. 우회 방법: 스키마를 고친 뒤 `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`로 SQL을 만들고, `prisma/migrations/<timestamp>_<이름>/migration.sql`에 직접 저장한 다음 `npx prisma migrate deploy`와 `npx prisma generate`를 실행한다. 기존 마이그레이션 4개가 이 방식의 예다.
- **운영 상태 문자열이 두 가지다.** 매장 시트는 `정상 영업`, `임시 휴업`, `폐업`이고, 일일 보고서 경로는 `임시 휴업 (Temporarily closed)`, `폐업 (Permanently closed)`를 쓴다. `alerts.ts`와 `reportIngest.ts`는 부분 문자열 포함으로 판단한다(정확히 일치 비교로 바꾸지 말 것). 새 문구를 추가하면 `CLOSED_PATTERNS`를 확인한다.
- **시드는 멱등이다.** `backfillSimulatedData`는 상품이 없는 매장만 채운다. 시뮬레이션 로직을 바꾼 뒤 기존 DB에 반영하려면 `npx prisma migrate reset --force`가 필요하다. 이때 모든 데이터가 지워지므로 `DailyReport`도 사라지고 `report:ingest`를 다시 실행해야 한다.
- **재import하면 이전 평점이 `ratingPrev`로 넘어간다.** 평점 하락 알림이 실제 추이를 보게 하려는 것이다.
- **외부 입력은 신뢰하지 않는다.** 메일 본문은 정규식 파서(`reportParser.ts`)가 알려진 필드만 뽑고 형식이 다르면 에러를 낸다. 파싱한 이상 매장 수가 보고서의 숫자와 다르면 매장 상태를 건드리지 않는다. 시트의 `-`, `#ERROR!` 같은 셀은 importer와 변환 스크립트가 null로 처리한다.
- **언어 목록은 세 곳을 같이 고친다.** 리뷰·답변 언어: `frontend/src/components/ReviewList.tsx`, `AiReplyAssistant.tsx`, `backend/src/services/aiProvider.ts`의 `LANG_NAMES`. 시드의 `LANG_BY_COUNTRY`에 없는 국가(NL, BE, PT, IT, MY, AU)는 영어로 폴백된다.
- 보드의 "주간 액션", "방문 추정", "대표 이미지" 열과 퍼널은 시뮬레이션 값이다(위 정직성 규칙 참고).
