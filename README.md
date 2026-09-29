# GBP Ops Board

Google Business Profile(GBP)를 관리하는 매장 운영 대시보드. Full-stack 아키텍처 학습을 목적으로 만든 개인 프로젝트로, 실제로 쓸 수 있는 형태를 목표로 설계했습니다.

매장별 GBP 노출/액션 지표, 판매 제품, 리뷰를 한 화면에서 모니터링하고, 평점 하락·리뷰 급증·매장 휴/폐업 같은 이슈를 자동으로 감지해 알림 피드에 띄웁니다. 리뷰는 원문 언어와 무관하게 다른 언어로 번역해서 볼 수 있고, AI가 브랜드 가이드라인에 맞춘 답변 초안을 생성해줍니다.

## 데이터

`backend/data/Samsung_Experience_Store_Global_Master_Dataset.xlsx`에 담긴 실제 데이터(한국/영국/미국/캐나다/프랑스/독일/스페인/싱가포르/태국/필리핀, 36개 매장)로 시딩됩니다. 다만 모든 필드가 실데이터는 아닙니다.

| 종류 | 필드 | 출처 |
|---|---|---|
| **실제** | 매장명, 주소, 전화번호, 평점, 리뷰 수, 운영 상태, GBP URL, 공식 웹사이트 | 제공된 데이터셋 |
| **시뮬레이션** | 조회수/클릭/방문·구매 추정, 대표 이미지 갱신일 | 평점·리뷰 수 기반으로 결정론적 계산 (GBP Performance API 미연동) |
| **플레이스홀더** | 상품 2개, 샘플 리뷰 1건 | 데이터셋에 없어 채운 더미 (리뷰 작성자는 항상 "Sample Reviewer"로 표기해 실제 후기와 구분) |

`backend/data/convert_real_dataset.py`가 원본 시트(한국어 헤더)를 앱의 import 스키마(영문 snake_case, `POST /api/import/gbp-urls`가 기대하는 형식)로 정규화합니다. 이 엔드포인트는 나중에 GBP URL을 실시간으로 수집하는 AI 에이전트가 그대로 호출할 수 있도록 설계된 접점입니다.

## 아키텍처

```
gbp-dashboard/
  backend/    Node.js + Express + Prisma + SQLite   (:4000)
  frontend/   React + Vite + TypeScript              (:5173, /api는 백엔드로 프록시)
```

- **DB**: `Store` / `Product` / `Review` / `ReviewTranslation` (Prisma + SQLite). 매장 상태(정상/주의/긴급)와 이슈 문구는 저장하지 않고 [`services/alerts.ts`](backend/src/services/alerts.ts)가 매번 지표에서 계산합니다.
- **AI 연동**: [`services/aiProvider.ts`](backend/src/services/aiProvider.ts)가 리뷰 번역·답변 초안 생성을 모두 Claude API로 처리합니다. API 키는 백엔드 `.env`에만 두고 브라우저는 우리 서버만 호출하므로 키가 노출되지 않습니다. 키가 없으면 mock 응답으로 대체되어 전체 플로우가 동작합니다.
- **i18n**: UI 언어(react-i18next, en/ko, 기본 영어)와 리뷰 콘텐츠 번역(AI 호출, 캐시)은 서로 완전히 다른 경로입니다 — 전자는 정적 리소스 파일, 후자는 매번 백엔드를 호출합니다.

## 시작하기

```bash
npm install
npm run db:migrate   # Prisma 마이그레이션 (최초 1회, 시드까지 자동 실행)
npm run dev           # 백엔드(:4000) + 프론트엔드(:5173) 동시 실행
```

`http://localhost:5173` 접속. `backend/.env`에 `ANTHROPIC_API_KEY`를 넣으면 실제 Claude 응답으로, 비워두면 mock 텍스트로 동작합니다 (`backend/.env.example` 참고).

DB를 실데이터로 다시 시딩하려면:

```bash
cd backend
npx prisma migrate reset --force
```

## 앞으로 할 일

- 지금은 `backend/data/*.xlsx`를 통한 수동 import이지만, 최종적으로는 Google Business Profile API(계정 소유 시) 또는 Places API로 매장 URL/정보를 실시간 수집하는 에이전트를 붙일 예정입니다. `POST /api/import/gbp-urls`가 그 접점입니다.
- 상품/리뷰는 현재 placeholder이며, 실제 GBP 상품·리뷰 데이터 연동이 남아 있습니다.
