# 진행 상황 (2026-11-08 기준, 마지막 커밋 `3eb292f`)

이 파일은 계속 바뀌는 상태 문서다. 작업을 끝낼 때마다 갱신한다.

## 완료된 것

- 풀스택 구조: React + Vite 프론트, Express + Prisma + SQLite 백엔드. 원본 단일 HTML 프로토타입을 이 구조로 재구성했다.
- 실제 매장 58개(16개국)를 시드한다. 이름, 주소, 전화번호, 평점, 리뷰 수, 운영 상태, GBP URL, 공식 웹사이트가 실제 데이터다.
- 알림은 실제 근거만 반영한다: 영구 폐업(긴급), 임시 휴업(주의), 평점 하락. 현재 긴급 2(Cardiff, Frankfurt Zeil), 주의 2(Westfield Stratford City, Norwich), 정상 54.
- 일일 점검 메일(제목에 "Samsung Experience Store")을 파싱해 DB에 반영하고 화면 상단 "Daily Profile Check"에 표시한다 (`report:ingest`).
- UI 언어 전환(en/ko), 리뷰 원문 → 다른 언어 번역(AI + 캐시), AI 답변 초안(가이드라인 적용).
- 매장 xlsx를 올리는 `POST /api/import/gbp-urls`. 나중에 GBP URL을 수집하는 에이전트가 호출할 접점이다.
- 실제 리뷰를 가져오는 Places API 동기화 코드(`reviews:sync`).

## 실제 / 시뮬레이션 / 플레이스홀더

| 구분 | 필드 |
|---|---|
| 실제 | 매장 신원 정보, 평점, 리뷰 수, 운영 상태, 일일 점검 요약 |
| 시뮬레이션 | 조회수, 클릭, 길찾기, 통화, 방문·구매 추정, 대표 이미지 경과일 (평점·리뷰 수로 결정론적 계산) |
| 플레이스홀더 | 상품 2개(일반 카테고리명), 리뷰 1건(작성자 "Sample Reviewer") |

## 사용자 결정 대기 / 사용자가 해야 할 일

1. **Places API 키 발급** → `backend/.env`의 `GOOGLE_PLACES_API_KEY`에 입력 → `npm run reviews:sync -w backend`. 실제 API 호출은 아직 한 번도 검증하지 못했다(응답 매핑만 샘플 응답으로 확인). 첫 실행 결과를 사용자와 함께 확인한다.
2. **보드의 시뮬레이션 열**(주간 액션, 방문 추정, 대표 이미지)과 퍼널을 "추정"으로 표시할지, 실제 데이터가 생길 때까지 숨길지.
3. **자동 갱신 방식**. 아직 만들지 않았다. 선택지: (A) 시트를 링크 공유로 열고 백엔드가 CSV 주소를 호출, (B) 서비스 계정 + Sheets API, (C) 스케줄 작업이 Drive·Gmail 연결로 읽어서 반영. 메일은 어느 쪽이든 Gmail 접근 수단이 필요하다. 이전 환경(Windows)의 Claude 앱 스케줄 작업은 만들어진 게 없고, Ubuntu에서는 cron이나 systemd timer를 쓰게 된다.
4. **구글 시트 전화번호 열**이 `#ERROR!`로 깨져 있다(`+`로 시작해서 수식으로 해석됨). 열을 "일반 텍스트"로 바꿔 다시 넣어야 한다. 그때까지는 xlsx 내보내기 파일이 더 정확하다.
5. **일일 점검 메일 문제**: 권역별 숫자가 시트와 다르다(아시아 20 vs 21, 유럽 29 vs 28, 15개국 vs 16개국. 총 58/정상 54/이상 4는 맞음). 발송 시각도 오전 10시가 아니라 한국 시간 23:37에 온 적이 있다. 화면의 권역 칩은 메일 숫자를 그대로 보여주므로, 메일을 고치거나 DB 기준으로 계산하도록 바꿔야 한다.

## 백로그 (대략 우선순위 순)

- 위 결정 사항 반영 (특히 2, 3번).
- 테스트가 없다. `reportParser`, `mapPlacesReview`, `alerts`는 순수 함수라 테스트하기 쉽다(vitest 등). 파서와 매퍼는 임시 스크립트로만 확인했고 저장소에는 없다.
- `multer` 1.x는 npm이 취약점을 경고한다. 2.x로 올린다. Prisma 5 → 최신은 큰 변경이라 별도 작업으로.
- 리뷰·답변 언어 목록에 nl, it, pt, ms 추가 (매장 국가에 맞춤). 시드의 `LANG_BY_COUNTRY`도 확장.
- 실제 GBP 상품은 Places API로 못 가져온다(Business Profile API, 계정 소유자 OAuth 필요). 상품 표시 정책은 "앞 2개만"(`ProductList.tsx`)이다.
- 실제 GBP 활동 지표(조회, 길찾기, 통화)는 Business Profile Performance API가 필요하다. 연결되면 시뮬레이션 열을 대체하고 `USE_ESTIMATED_METRICS`를 켜는 것을 검토한다.
- GBP URL 자동 수집 에이전트: 구글 지도 HTML을 직접 긁는 것은 이용약관 위반 소지가 있어서 공식 API(Business Profile API 또는 Places API)를 권장했다. 결과는 `POST /api/import/gbp-urls`로 넣으면 된다.

## 외부 데이터 소스

- **마스터 매장 시트**: 사용자 소유 Google Sheet(58행, 한국어 헤더 12열). 링크는 사용자에게 받는다. Drive 연결이 있으면 `get_file_metadata`, `read_file_content`로 첨부 없이 읽을 수 있다. 내장 브라우저로는 로그인 벽에 막힌다. 이 Drive/Gmail 연결이 새 환경에서도 켜져 있는지는 확인하지 못했다. 없으면 사용자가 xlsx를 첨부한다.
- **일일 점검 메일**: 사용자의 Gmail에 오는 `[점검 보고] Samsung Experience Store ...` (본인이 본인에게 보낸 메일). 본문을 txt로 저장해 `report:ingest`에 넣는다. 구조는 1) 종합 현황 2) 이상 매장(지도 링크의 place_id) 3) 권역별 요약.
- 저장소에 시트 ID, 이메일 주소, API 키는 넣지 않는다(public 저장소).

## 참고

- 원본 프로토타입(`gbp-store-ops-dashboard.html`, 단일 파일, 한국어, 더미 데이터)은 이 저장소에 없다. 필요하면 사용자에게 요청한다.
- 개발은 Windows에서 시작했다. 로컬 DB(`backend/prisma/dev.db`)와 `backend/.env`는 git에 올라가지 않으므로 새 환경에서 다시 만든다. 새 DB에는 `DailyReport`가 비어 있어서 `report:ingest`를 한 번 실행해야 "Daily Profile Check" 패널이 나타난다.
