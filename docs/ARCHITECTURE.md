# ARCHITECTURE.md

> 상태: 초안 (기능 방향 확정: 현대자동차 승용차 가격 조회, 2026-10-15). 세부 항목은 **미결정**으로 표시한다.
> 요구사항은 `docs/APP_SPEC.md`, 공통 작업 규칙은 `CLAUDE.md`를 따른다.

## 1. 기술 구성 (설치된 실제 버전)

| 항목 | 내용 |
|---|---|
| 프레임워크 | Expo SDK `~57.0.29` (관리형), React Native `0.86.3`, React `19.2.3` |
| 언어 | TypeScript `~6.0.3` (strict) |
| 라우팅 | Expo Router `~57.0.27` (파일 기반, 라우트 루트 `src/app`) |
| 패키지 관리자 | npm 11.19.1 |
| 템플릿 | `create-expo-app` default 템플릿. 예제 화면과 탭은 제거하고 스택 내비게이션으로 교체함 |
| 데이터 저장 | 기기 내부 저장소. 가져온 가격 데이터를 JSON 파일로 저장 (`expo-file-system`, 6장) |
| 백엔드/계정/분석 | 없음 (앱이 제조사 사이트 API를 직접 호출) |

앱 이름은 `itsolvers-app-001` (`package.json` name, `app.json` name/slug/scheme). 프로젝트 폴더명도 동일하다.

## 2. 검증 현황 (2026-10-15)

| 항목 | 결과 |
|---|---|
| Node v26.8.2 + `npm install` | 성공 (607 패키지) |
| `npx tsc --noEmit` | 오류 없음 (`expo start` 1회 실행 후. 그 전에는 CSS 타입 오류 2건이 있었음: 자동 생성 파일 `expo-env.d.ts`가 없어서) |
| `npx expo-doctor` | 21/21 통과 |
| iOS 시뮬레이터 (iPhone 16e, iOS 26.0) | 템플릿 Home 화면 정상 표시 |
| Android 에뮬레이터 (Galaxy_S23 AVD, API 36) | 템플릿 Home 화면 정상 표시 |
| 실기기 | 미확인 |
| `npm run lint` | 오류 0건 (eslint 9 + eslint-config-expo, 설정은 `eslint.config.js`). 처음에는 `set-state-in-effect` 오류 2건이 있어 `use-load.ts`와 `use-color-scheme.web.ts`를 고쳤다 |
| `npm audit` | 취약점 29건(moderate 11, high 18) 보고됨. 템플릿 의존성의 하위 패키지이며 아직 원인과 영향을 조사하지 않음. `audit fix --force`는 사용하지 않는다. |

## 3. 개발 서버 포트

이 PC의 8081 포트는 ssh 프로세스가 사용 중이라(처음에 접속 실패 "Failed to parse manifest JSON"의 원인으로 추정) **8082**를 쓴다. `package.json`의 `start/ios/android/web` 스크립트에 `--port 8082`가 지정되어 있다.

## 4. 폴더 구조

```
src/app/         화면과 라우팅 (파일 이름 = 주소). 로고 헤더는 시작·제조사 화면만 쓰고, 제조사 이후 화면은 앱 기본 제목줄을 쓴다. +html.tsx(웹 HTML 틀), _layout.tsx(스택), index.tsx(시작/랜딩), brands.tsx(제조사), cars.tsx(차종), trims.tsx(트림), price.tsx(가격), summary.tsx(차량 선택 완료)
src/components/  여러 화면에서 쓰는 UI 조각: list-row, select-row(선택 행), section(제목이 붙은 구역), load-status(로딩/오류), data-notice(데이터 기준일), study-notice("학습용" 안내 배너와 하단 문구), web-head(웹 head 지정), site-header/screen-top(시작·제조사 화면의 헤더 틀. site-footer는 미사용), car-card(차량 카드), brand-logo(제조사 엠블럼), header-logo(제목줄 오른쪽의 작은 회사 로고), coin-logo("차량가격 직접 입력" 줄의 금빛 동전 로고), amount-percent-field(선수금·보증금·잔존가치 카드: 금액 입력 칸 + 비율 슬라이더), percent-slider(비율 슬라이더 본체. 손잡이 위 확대 글자와 눈금 점 확대 효과), color-dot(색상 동그라미), remote-image(인터넷 이미지), amount-input(숫자 입력 칸), 스플래시용 animated-icon
src/constants/   템플릿 테마 값, brands.ts(지원 제조사 목록), site.ts(웹 검색/공유 정보), notices.ts(학습용 안내 문구)
src/hooks/       use-load(화면 데이터 불러오기), use-option-selection(사양·옵션·색상 선택과 선택 규칙), 템플릿 훅(색상 테마 등)
src/utils/       price.ts(가격 표시, 선택한 항목 목록, 합계 계산), options.ts(옵션 선택 목록 변경 규칙), trim.ts(트림 구매 용도), lease.ts(리스료 계산과 입력 글자 정리), images.ts(제조사 이미지 주소)
src/api/         제조사 사이트 호출 코드 (hyundai.ts). 화면에서 fetch를 직접 쓰지 않는다
src/storage/     저장 코드. cache.ts(JSON 파일 저장, 하루 1회 규칙), vehicleData.ts(화면이 호출하는 getCars/getTrims/getTrimPrice)
src/types/       공통 TypeScript 타입 (car.ts: 차종/트림/사양/옵션/색상/가격)
assets/          이미지, 아이콘
docs/            APP_SPEC.md, ARCHITECTURE.md
```

규칙: 화면은 보여주기와 사용자 동작만 담당하고, 저장은 `src/storage/` 함수를 호출한다. 같은 UI가 2곳 이상에서 쓰일 때만 `components/`로 분리한다. 경로 별칭 `@/`는 `src/`를 가리킨다.

## 4-1. 코드 읽는 순서 (학습용 주석 안내)

핵심 소스 22개에는 "왜 이렇게 했는지"와 React/TypeScript 개념(훅, 비동기, 제네릭 등)을 설명하는 주석이 달려 있다. 처음 읽는다면 아래 순서가 이해하기 쉽다.

1. `src/types/car.ts`: 앱이 다루는 데이터의 모양 (차종 → 트림 → 가격)
2. `src/api/hyundai.ts`: 제조사 사이트에서 데이터를 가져와 위 모양으로 바꾸는 곳
3. `src/storage/cache.ts`, `src/storage/vehicleData.ts`: 하루 1회 저장 규칙
4. `src/hooks/use-load.ts`: 화면이 데이터를 불러오고 상태(로딩/오류/완료)를 받는 방법
5. `src/app/_layout.tsx` → `index.tsx` → `brands.tsx` → `cars.tsx` → `trims.tsx`: 화면 이동과 목록 화면
6. `src/utils/price.ts`, `src/utils/options.ts`: 합계와 옵션 선택 계산(순수 함수)
7. `src/hooks/use-option-selection.ts` → `src/app/price.tsx` → `src/app/summary.tsx`: 가장 복잡한 부분

주석을 추가할 때 코드는 바꾸지 않았다. (주석을 제거하고 변환한 결과가 이전 커밋과 같은지 22개 파일 모두 확인함)

## 5. 데이터 흐름

```
화면(src/app) → src/storage/vehicleData → (오늘 저장본이 있으면) 기기 내부 JSON 파일
                                         → (없거나 날짜가 지났으면) src/api(제조사 사이트) → 결과를 JSON 파일로 저장
```

저장 실패는 `storage`에서 잡아 화면이 사용자에게 알릴 수 있는 형태로 돌려준다. 전역 상태 라이브러리는 도입하지 않는다.

## 6. 저장 방식 (확정)

`expo-file-system`(`~57.0.7`)으로 앱 문서 폴더의 `price-cache/{key}.json`에 저장한다. 문서 폴더는 시스템이 저장 공간 부족 때 임의로 지우지 않는 위치다. 작은 JSON 몇 개라서 DB(expo-sqlite)나 AsyncStorage는 쓰지 않는다.

파일 형식: `{ "fetchedDate": "2026-10-15", "data": ... }` (`fetchedDate`는 기기 현지 날짜)

| key | 내용 |
|---|---|
| `hyundai-cars` | 차종 목록 |
| `hyundai-trims-{carCode}` | 차종별 트림 목록 |
| `hyundai-price-{saleModelCode}` | 트림별 사양·옵션·색상 가격 |

규칙 (`loadWithDailyCache`)

1. `fetchedDate`가 오늘이면 저장본을 그대로 쓴다. 네트워크 호출 없음. (`source: 'cache'`)
2. 저장본이 없거나 날짜가 지났으면 새로 가져와 저장한다. (`'network'`)
3. 새로 가져오기에 실패하면 이전 저장본을 보여주고 `errorMessage`를 돌려준다. (`'stale-cache'`) 저장본도 없으면 오류를 던진다.
4. 저장에 실패해도 가져온 데이터는 돌려준다. (`saveFailed: true`)
5. 파일이 깨졌으면 없는 것으로 보고 새로 가져온다.

한계

- 백업/복구, 다른 기기로 옮기기는 지원하지 않는다. 앱을 삭제하면 저장본도 사라진다. 다시 열면 새로 가져온다.
- 저장본 삭제/초기화 기능은 아직 없다. 만들 때는 결과를 사용자에게 명확히 알린다.
- 저장본이 쌓이는 만큼 파일이 늘어난다(트림 하나당 1개). 오래된 파일 정리는 아직 하지 않는다.

## 7. 템플릿 정리 현황 (2026-10-15)

삭제함 (사용자 승인): 예제 화면 explore, 탭 컴포넌트, 사용하지 않는 컴포넌트(`hint-row`, `external-link`, `web-badge`, `ui/collapsible`), 사용하지 않는 이미지(react-logo, tabIcons, tutorial-web, expo-badge), `scripts/reset-project.js`와 npm 스크립트 `reset-project`.

유지: 앱 아이콘/스플래시 이미지(`app.json`이 사용), `animated-icon`(스플래시), `expo.icon`.

패키지 정리 (사용자 승인, 2026-10-15): 코드와 `app.json`에서 import하지 않던 `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser`, `expo-device`를 `npm uninstall`로 제거했다. 제거 후 `npx tsc --noEmit`, `npx expo-doctor`(21/21), Android·iOS 실행으로 확인했다.
- 직접 import하지 않아도 Expo Router 등이 요구하므로 남긴 것: `expo-constants`, `expo-linking`, `expo-font`, `expo-status-bar`, `expo-system-ui`, `react-native-screens`, `react-native-gesture-handler`, `react-dom`/`react-native-web`(웹 실행용)
- 실험 옵션 `reactCompiler: true`: 초보자 디버깅이 어려워질 수 있어 재검토. `typedRoutes: true`는 잘못된 화면 주소를 잡아 주므로 유지 권장.

## 8. 결정 기록

| 날짜 | 결정 | 상태 |
|---|---|---|
| 2026-10-15 | Expo SDK 57 + TypeScript + Expo Router, npm | 확정 (생성 완료) |
| 2026-10-15 | 앱 이름 `itsolvers-01`, 프로젝트를 현재 폴더에 직접 생성 | 확정 |
| 2026-10-15 | 앱 이름과 폴더명을 `itsolvers-app-001`로 변경 (기존 `itsolvers-01`) | 확정 |
| 2026-10-15 | 내비게이션: 탭 → 스택으로 교체. 템플릿 예제 화면(explore)과 탭 컴포넌트 삭제 (승인) | 확정 |
| 2026-10-15 | 옵션 선택 규칙은 제조사 사이트와 동일하게 구현. 규칙은 선택할 때마다 실시간 조회하고 저장하지 않음 | 확정 |
| 2026-10-15 | 사용하지 않는 템플릿 파일 삭제 (승인) | 확정 |
| 2026-10-15 | 미사용 패키지 5개 제거 (승인) | 확정 |
| 2026-10-15 | 옵션 규칙 조회 실패 시: 변경을 적용하지 않고 오류 표시, 재시도는 다시 누르기 | 확정 |
| 2026-10-15 | 차량 선택 완료 화면 추가(처음 이름은 "견적 확인", 이후 이름 변경. 화면 주소 `/summary`는 그대로). 가격 화면에서 고른 내용(사양·옵션·색상 코드)을 화면 주소 값으로 넘기고, 견적 화면이 가격 데이터를 다시 불러(보통 오늘 저장본)와 같은 계산으로 보여줌. 선택 상태를 저장하거나 공유하지 않음 | 확정 |
| 2026-10-15 | 시작(랜딩) 화면 추가: 학습용이며 데이터가 정확하지 않을 수 있다는 안내와 "견적하기" 버튼. 첫 화면(`/`)을 시작 화면으로 바꾸고 제조사 선택은 `/brands`로 이동 | 확정 |
| 2026-10-15 | 모든 화면 위쪽에 "학습용" 배너(노란 계열), 금액 화면 하단 문구에 "학습용" 포함. 문구는 `constants/notices.ts` 한곳 | 확정 |
| 2026-10-15 | 웹 SEO: 시작 화면만 검색 노출, 나머지 noindex. 파비콘·공유 이미지는 회사 사이트(`itsolvers/web/html`) 기준 | 확정 |
| 2026-10-15 | 차량 선택 완료 화면: 합계 고정 영역을 없애고 차량 정보 마지막에 "차량가격", 아래에 리스료 계산(기간·선수금·보증금·잔존가치·금리 → 월 납입금액). 회사 사이트 계산식 기반 | 확정 |
| 2026-10-15 | 차종 목록은 카드(큰 이미지), 제조사 엠블럼, 색상 이름 앞 동그라미를 제조사 사이트 이미지로 표시 | 확정 |
| 2026-10-15 | 모든 화면에 시작 화면과 같은 로고 헤더와 푸터 적용. 앱 기본 제목줄은 끄고(`headerShown: false`) 헤더에 뒤로 가기 버튼, 헤더 아래에 화면 제목을 둠. 웹 파비콘은 모든 페이지 회사 로고 | 확정 |
| 2026-10-15 | 로고 헤더·푸터는 시작·제조사 선택 화면만 유지하고, 제조사 이후 화면은 앱 기본 제목줄로 되돌림 (폰에서 화면이 부족하다는 사용자 의견) | 확정 |
| 2026-10-15 | 선수금·보증금·잔존가치는 0~30%(5% 단위) 슬라이더로만 선택(금액 입력 불가), 금리는 직접 입력. 슬라이더는 새 패키지 없이 React Native 터치 이벤트로 구현 | 확정 |
| 2026-10-15 | 제조사 화면에 "차량가격 직접 입력" 줄(재미있는 동전 로고) 추가. 누르면 차량 정보 없이 차량가격 입력과 리스료 계산부터 시작 | 확정 |
| 2026-10-15 | 개발 서버 포트 8082 | 확정 |
| 2026-10-15 | `.git`: 생성 도구가 자동 생성한 저장소(Initial commit 1개)를 유지 | 임시 (변경 가능) |
| 2026-10-15 | 앱 기능: 국내 승용차 가격 조회 (차량→트림→옵션). 1단계는 현대자동차 승용차만 | 확정 |
| 2026-10-15 | 데이터 출처: 앱이 제조사 사이트에서 직접 스크랩(서버 없음) | 확정 |
| 2026-10-15 | 흐름: 제조사 → 차종 → 트림 → 옵션(색상 포함). 가격은 참고용 문구 표시 | 확정 |
| 2026-10-15 | 가격 데이터는 조건별로 하루 1회 가져와 로컬 JSON으로 저장, 새 조건은 실시간 조회 | 확정 |
| 2026-10-15 | JSON 저장: `expo-file-system`, 앱 문서 폴더의 `price-cache/` (승인 후 설치) | 확정 |
| - | 최소 OS 버전, 테스트 기기, 배포 방식 | 미결정 |
| - | 데이터 백업/내보내기 | 미결정 |
| 2026-10-15 | eslint: 이미 설치되어 있음(`eslint`, `eslint-config-expo`). 새로 설치하지 않고 lint 오류만 수정 | 확정 |

## 8-1. 웹 배포 (Vercel, 확인용)

내용 확인용으로 웹 버전을 Vercel에 올릴 수 있다. 앱이 아니라 브라우저에서 보는 정적 사이트다.

- 빌드: `npm run build:web` (= `expo export --platform web`) → `dist/`에 정적 파일 생성 (git 제외 대상)
- 설정: `vercel.json`에 빌드 명령, 출력 폴더(`dist`), `cleanUrls`(`/cars` → `cars.html`)를 지정. 이 설정이 없으면 Vercel이 빌드 없이 `index.html`이 없는 곳을 보여줘서 404가 난다.
- 현대자동차 API는 `access-control-allow-origin: *`를 보내고 이 앱은 단순 `GET`만 쓰므로, 브라우저에서 서버 중계 없이 직접 호출된다. (실제 브라우저 동작은 배포 후 확인 필요)
- 웹에서는 `expo-file-system`이 지원되지 않아 "하루 1회 저장"이 동작하지 않는다(화면을 열 때마다 새로 불러오고, 저장 실패 안내가 보일 수 있음).
- 공개 링크이므로 아는 사람에게만 공유하고, 확인이 끝나면 배포를 삭제한다. 제조사 사이트 이용약관은 아직 읽지 않았다.

### 웹 검색(SEO)과 사이트 설정 (2026-10-15)

기준: `/Users/dlgurpro/itsolvers/web/html/`(회사 사이트)의 방식. 파비콘과 공유 이미지는 그 사이트의 파일을 그대로 복사했고(해시 동일 확인), 그 폴더는 수정하지 않았다.

- **시작 화면(`/`)만 검색에 노출**: `index, follow`, 제목, 설명, 키워드, `canonical`, 공유 미리보기(`og:*`, `twitter:*`), 구조화 데이터(JSON-LD `WebApplication`)를 `src/app/index.tsx`에서 지정한다.
- **나머지 화면은 검색 제외**: `src/app/_layout.tsx`의 기본 head에 `noindex, nofollow`를 두고, 시작 화면만 같은 이름의 태그로 덮어쓴다. (빌드한 HTML에서 6개 화면 모두 확인)
- **한국어 표시**: `src/app/+html.tsx`에서 `lang="ko"`(기본값은 영어)
- **시작 화면 헤더/푸터**: 회사 사이트(index.html)의 헤더(왼쪽 로고와 "아이티해결단", 오른쪽 링크)와 푸터(어두운 배경의 회사 정보)를 따랐다. `src/components/site-header.tsx`, `site-footer.tsx`, 문구는 `constants/site.ts`의 `FOOTER_LINES`. 로고(`assets/images/company-logo.png`)는 불투명한 흰 배경이라 회사 사이트처럼 다크 모드에서도 헤더를 흰색으로 둔다. 푸터의 대표자명과 사업자등록번호는 회사 사이트에 공개된 내용과 같다. 다른 화면(제조사 이후)에는 로고 헤더가 없다. **푸터는 화면이 작아 시작·제조사 화면에서도 뺐다.** `site-footer.tsx`와 `FOOTER_LINES`는 현재 어디서도 쓰지 않는다(다시 넣을 때를 위해 남겨 둠).
- **파비콘**: 회사 로고. 웹 탭은 `public/images/logo.png`, 앱/웹 기본 아이콘은 `assets/images/favicon.png`(로고를 투명한 192x192 정사각형 안에 넣어 만듦)
- **정적 파일(`public/`)**: `robots.txt`(`/_sitemap` 차단과 사이트맵 주소), `sitemap.xml`(시작 화면만), `images/logo.png`, `images/og-image.png`. 빌드하면 `dist/`로 복사된다.
- **사이트 정보 한곳 관리**: `src/constants/site.ts`(주소, 제목, 설명, 이미지). **배포 주소(`SITE_URL`)를 바꾸면** `public/robots.txt`와 `public/sitemap.xml`의 주소도 함께 고쳐야 한다.
- **앱(iOS/Android)에는 영향 없음**: head 지정은 `web-head.tsx`(앱: 아무 일 안 함)와 `web-head.web.tsx`(웹: 실제 지정)로 나눴다.
- **구글 서치콘솔 소유권 확인**: `google-site-verification` 메타 태그를 시작 화면(`/`)에만 넣었다(값은 `src/constants/site.ts`의 `GOOGLE_SITE_VERIFICATION`). 확인이 끝난 뒤에도 지우지 않는다. 확인과 사이트맵 제출은 배포 후 서치콘솔에서 사용자가 직접 한다(사이트맵 주소: `/sitemap.xml`).
- **알아 둘 점**: 회사 사이트에 있는 구글 애널리틱스, 애드센스, 검색엔진 소유 확인 태그는 이 앱에 넣지 않았다(승인 없이 외부 분석 서비스를 추가하지 않는 규칙). 검색 노출을 원하면 구글 서치콘솔에 이 주소를 따로 등록해야 한다. 가격과 견적 등 나머지 화면은 검색 제외와 별개로, 내용이 화면을 연 뒤 불러와지는 구조라 검색용 페이지가 아니다.

## 8-2. 리스료 계산과 이미지 (2026-10-15)

**리스료 계산** (`src/utils/lease.ts`, 화면은 `src/app/summary.tsx`의 `LeaseSection`)
- 기본 리스료 식은 회사 사이트 리스료 계산기(`itsolvers/web/html/insights/lease-payment-calculator.html`)와 같다. 원본 파일에서 식을 꺼내 무작위 5,000개 조합(선수금·보증금 0)과 대조해 모두 같은 값(차이 0원)임을 확인했다. 회사 계산기에 없는 선수금(월 `S÷n` 차감)과 보증금(월 `D×i` 차감, 만기 반환 가정)은 이 앱에서 더한 것이다. 상세 식과 가정은 `docs/APP_SPEC.md` 5장.
- 화면의 기본 리스료, 선수금 차감, 보증금 효과는 각각 원 단위로 반올림해서 월 납입금액과 정확히 맞는다.
- 선수금·보증금·잔존가치는 차량가격 기준 비율(5~30%) 버튼으로 금액을 채우거나 금액을 직접 입력한다. 계산에는 항상 금액을 쓴다.
- 보증금을 "만기에 돌려받는 돈"으로 보고 월 이자만큼 월 납입금을 줄이는 방식은 이 앱의 가정이다. 금융사마다 다를 수 있다.

**이미지** (`src/utils/images.ts`, 제조사 사이트에서 앱 실행 중 불러오며 저장소에는 파일을 두지 않는다)
- 차종 이미지: `/contents/repn-car/side-45/{이름}-45side.png`. 파일 이름이 차종 영문 이름과 다른 경우가 있어서 6개 차종은 `CAR_IMAGE_NAMES` 표로 지정했다(직접 불러 보고 현재 판매 모델 그림이 나오는 이름을 골랐다). **새 차종이 생기면 이 표에 추가해야 한다.**
- 색상 칩: `/contents/vr360/{차종코드}/exterior|interior/{색상코드}/colorchip-*.png`. 내장 색상은 사이트가 쓰는 "실제 색상 코드" 대신 일반 색상 코드로도 두 차종에서 그림이 왔고, 없는 코드는 오류(307)로 응답한다.
- 제조사 엠블럼: `/static/images/logo_mobile_black.png`(검은색이라 흰 바탕 위에 놓는다).
- 이미지가 없거나 불러오지 못해도 화면은 정상이다(`RemoteImage`가 빈 자리나 회색으로 처리).
- 이 주소들은 공개된 약속이 아니라 사이트가 쓰는 것을 확인한 것이라 바뀔 수 있다. 제조사의 엠블럼과 이미지는 저작물·상표이므로 학습용 안내와 함께 쓰고 수정하거나 재배포하지 않는다.

## 9. 의도적으로 하지 않는 것

- 서버, 로그인, 외부 분석/크래시 수집 서비스
- 승인되지 않은 라이브러리 추가
- 기능이 확정되기 전의 화면/데이터 모델 구현

## 10. 데이터 출처 조사: 현대자동차 (2026-10-15)

구현: `src/api/hyundai.ts`의 `fetchCars`, `fetchTrims`, `fetchTrimPrice`. Node와 iOS(iPhone 16e)·Android(Galaxy_S23 에뮬레이터) 앱에서 실제 호출이 성공했다. 실기기는 미확인.

읽기 전용 GET 요청으로 조사했다. 로그인이 필요 없고 JSON으로 응답한다. **공개 API가 아니라 사이트 내부용**이어서 예고 없이 바뀔 수 있다. HTML 파싱은 필요 없다. 가격 화면의 HTML에는 데이터가 비어 있고, 값은 아래 API로 따로 받아온다.

- 기본 주소: `https://www.hyundai.com/kr/ko/e/api/product`
- 응답 형태: `{ "data": ..., "rspStatus": { "rspCode": "0000", ... } }` (정상은 `0000`)
- 필수 파라미터가 빠지면 `EXP.4000`과 누락된 파라미터 이름이 돌아온다.
- `robots.txt`는 로그인·마이페이지 등만 막는다. 이용약관은 아직 읽지 않았다.

| 단계 | 요청 | 얻는 값 |
|---|---|---|
| 1. 차종 목록 | `/car/catalog-price` | `carCode`(예: DN26), `carAbbreviation`(DN), `carName`, `carTypeCode`(P=승용) |
| 2. 엔진/트림 | `/dictionary/applied-trim-list?repnCarnCd={carCode}&carSpcCd=` | `engineTypes`, `trimList`(트림명, `saleModelCode`, 엔진·변속기 코드) |
| 3. 가격과 옵션 | `/options/{saleModelCode}` | `classChoice[].carPrice`(기본 가격), `optionChoice[].choiceOptionPrice`, `optionTuix[].tuixOptionPrice`, `optionBasic`(기본 옵션 목록) |
| 4. 내장 색상 | `/interior-color/{saleModelCode}?saleModelCode=...` | `interiorColorPrice`, `choiceYn`(Y면 이 트림에서 선택 가능) |
| 5. 외장 색상 | `/exterior-color/{saleModelCode}?siteTypeCode=&saleModelCode=...&interiorColorCode=&exteriorColorCode=` | `exteriorColorPrice`(예: 세레니티 화이트 펄 +100,000, 매트 +300,000), `choiceYn` |

색상 가격 필드는 차종마다 다르다. 내장 색상 응답에서 쏘나타·그랜저는 `interiorColorPrice`가 "0" 같은 값으로 오지만, **아반떼(7개 트림)는 필드 자체가 없다**. 사이트 코드도 색상 가격이 없으면 0으로 처리하므로(`price||0`), 색상 가격이 없으면 0원으로 본다(`toOptionalPrice`). 기본 가격·옵션 가격은 값이 없거나 숫자가 아니면 오류로 처리한다. 모든 승용 차종·트림 44개를 한 번에 조회해 모두 성공하는 것을 확인했다(2026-10-15).

가격 구조: 한 트림(`saleModelCode`) 안에 **사양 선택**(`classChoice`: 예 "기본" 28,760,000 / "인포테인먼트내비Ⅰ" 30,160,000 = +1,400,000)이 있고, 선택 옵션은 `saleSpecCode`("A,N" 등)로 어느 사양에서 고를 수 있는지 정해진다. 그래서 화면 흐름은 제조사 → 차종 → 트림 → **사양** → 옵션/색상이다. 합계 = 사양 가격 + 선택 옵션 + 색상 가격.

확인된 예: 쏘나타 디 엣지(DN26) 가솔린 2.0 Premium(`DNJS4SBT8`) 기본 가격 28,760,000원, 선택 옵션 예 "하이패스" 200,000원.

아직 모르는 것

- 1단계가 승용 외 차종까지 섞여 오는지, 승용만 필터링하는 방법 (`/car/type`은 `carTypeFlag`와 `siteTypeCode=E` 필요)
- 색상 가격은 위 4, 5번 API로 해결했다. 외장 색상 API는 `siteTypeCode`, `interiorColorCode`, `exteriorColorCode`를 빈 값으로 보내도 전체 목록을 준다(사이트 코드에서 호출 인자를 확인). 내장 색상 선택에 따라 외장 색상 목록이 달라지는지는 확인하지 않았다.
- `/trims`, `/car/sale-model-code/info`는 파라미터 조합이 복잡해 사용하지 않았다. 2단계의 `trimList`로 충분한지
- 가격 필드가 문자열(`"28760000"`)로 오므로 숫자 변환·검증 필요
- 선택 옵션끼리의 제약(함께 선택 불가/필수 선택)은 `/disable-option/`, `/option-required-choice` 등에 있을 수 있으나 미조사
- 호출 빈도 제한 (앱에서 직접 호출은 시뮬레이터/에뮬레이터에서 성공함)
- 승용 필터 결과는 6종(쏘나타·아반떼·그랜저와 각 Hybrid), 44개 트림이다. 같은 이름의 트림이 중복되는 것은 구매 용도가 다른 트림이다. **모델 코드 3번째 글자가 구매 용도**로 보인다(J 자가용, R 렌터카, H 장애인). 근거는 제조사 API의 구매 용도 목록(자가용 J / 렌터카 R / 장애인 H)과 글자가 일치하는 점, H 트림 3개는 모두 운전 방식 사양(왼손오른발 등, 아반떼는 이름에 "장애")이고 J 트림 39개에는 없는 점이다. 제조사가 공식으로 알려준 구분은 아니며, 트림 목록에 용도로 표시한다(`src/utils/trim.ts`).
- 옵션 간 제약(함께 선택 불가, 필수 선택)은 `/disable-option/`, `/option-required-choice` 등에 있을 것으로 보이나 조회하지 않았다.

### 옵션 선택 규칙 API (2026-10-15 조사, 모두 `product` 서비스)

사이트가 옵션을 고를 때마다 쓰는 API다. 인자는 사이트 코드와 실제 호출 결과로 확인했다. 전체 승용 트림을 훑어서 확인한 결과, "서로 같이 못 고르는 조합"(`carDelOptionList`)은 하나도 없었고, 제약은 아래 세 가지 형태다.

| 목적 | 요청 | 설명 |
|---|---|---|
| 함께 선택되는 옵션 | `/option/del/{saleModelCode}?saleSpecCode&afterOption={새로 고른 옵션}&beforOption={이미 고른 옵션들}` | `carAddOptionList`가 함께 선택되어야 하는 옵션. 이미 고른 옵션을 빠뜨릴 수 있어 기존 선택과 합쳐서 쓴다. (HUD→PA2, 그랜저 20W→PLA, 아반떼 SDP→CV1 등) |
| 지금 고를 수 없는/다시 고를 수 있는 옵션 | `/disable-option/{code}`, `/add-possible-option/{code}` (`saleSpecCode`, `optionCode`=이미 고른 옵션들) | 선택이 하나도 없으면 호출하지 않는다. 사양에서 고를 수 있는 일반 옵션이 하나뿐이면 제약이 없는 것으로 본다(사이트와 같음). |
| 튜익스 제약 | `/options/tuix-check/{code}` (선택 옵션·색상·모든 튜익스 코드) / `/disable-tuix/{code}` (이미 고른 튜익스) | 앞의 것은 옵션·색상과 맞지 않는 튜익스(그랜저 PAS ↔ 블랙 루프 스킨), 뒤의 것은 튜익스끼리 못 고르는 조합(DN0025 ↔ DN0024). |

- `/options` 응답의 `choiceOptionGroupCodes`(예: HUD → "HUD,PA2")는 함께 묶이는 옵션이다. 해제할 때 묶여 있던 다른 옵션을 같이 해제하는 데 쓴다. 묶음 코드에 빠진 선행 옵션(아반떼 SDP→CV1)이 있어서, 선택할 때의 필수 옵션은 `option/del` 결과를 따른다.
- 묶음 가격은 개별 가격의 합이다. (HUD 660,000 + PA2 650,000 = 1,310,000. `/option-mix-info`로 확인)
- 구현: `src/api/hyundai.ts`의 `fetchRequiredOptions`, `fetchOptionRules`, `fetchDisabledTuix`, 선택 상태는 `src/hooks/use-option-selection.ts`.
- 실패 처리: 선택을 바꿀 때 위 API 조회가 하나라도 실패하면 그 변경을 적용하지 않고(이전 선택 유지) 하단에 오류를 표시한다. 다시 누르면 재시도한다. (검증하지 못한 조합이 합계에 들어가는 것을 막는 방식)
- 확인하지 못한 것: 사이트가 선택 중에 띄우는 "함께 추가/삭제됩니다" 확인 팝업 단계(우리는 확인 없이 적용하고 안내 문구로 알림), 사이트의 옵션 해제 동작(우리는 묶음 코드 기준으로 함께 해제), `unityChoiceYn`이 `N`인 옵션(HUD, 20W)의 별도 처리, 튜익스 간 규칙을 색상별로 모두 훑어보지는 않음.

- **공유 미리보기 기본값**: 링크 공유 시 설명과 회사 로고(og-image)가 나오도록 og/twitter 태그를 `_layout.tsx`의 기본 head에도 넣었다. 시작 화면 외의 화면 주소를 공유해도 미리보기가 나오며, 검색에는 계속 노출하지 않는다(noindex).
- **비율 선택을 슬라이더에서 스테퍼로 변경 (2026-10-16)**: 비율 범위가 0~30%(7칸)에서 0~90%(19칸, 5% 단위)로 늘어 슬라이더로는 정확히 맞추기 어려워 [−][값][+] 버튼(길게 누르면 반복)으로 바꿨다. 용어도 선납금 → 선수금으로 통일. 선수금+보증금이 차량가격을 넘거나 월 납입금이 0원 이하가 되는 조합은 기존 검증이 오류 문구로 막는다. 대안으로 검토한 것: 드롭다운(19개 목록이 길다), 숫자 휠(웹 지원이 불편).
- **선수금·보증금·잔존가치는 금액이 주인 (2026-10-16)**: 고객이 금액으로 말하는 경우가 많아 금액 입력 칸을 주로 두고, 비율 버튼은 금액을 빠르게 넣는 도구로 바꿨다(`amount-percent-field.tsx`). 상태는 금액 글자만 들고, 비율은 "금액 ÷ 차량가격"으로 거꾸로 계산해 보여준다. 차량가격이 바뀌어도 금액은 유지한다. 5% 단위가 아닌 금액에서 버튼은 바로 위/아래 5% 단위로 간다.
- **비율 선택을 다시 슬라이더로 (2026-10-16)**: 금액이 주인이 되면서 비율은 보조 도구가 되었고, 사용자가 슬라이더를 선호해 [−][+] 버튼을 슬라이더로 되돌렸다. 눈금이 19개(0~90%)로 늘어난 점은 "손잡이 위에 지금 비율을 크게 띄우고 가까운 눈금 점을 확대"하는 효과로 보완했다. 슬라이더는 금액을 모르고 비율만 다루며(`percent-slider.tsx`), 금액 변환은 `amount-percent-field.tsx`가 한다. 5% 단위가 아닌 비율은 손잡이가 정확한 위치에 놓인다.
- **견적 공유는 글자로만 (2026-10-16)**: 이미지 저장·공유는 패키지(view-shot, sharing, media-library)와 저장 권한이 필요해 제외하고, 새 패키지 없이 React Native `Share`로 글자를 보낸다. 웹은 `navigator.share`, 없으면 클립보드 복사. 글자 모양은 `utils/share-text.ts` 한 곳에서 정한다. 이미지 버전은 나중에 필요하면 추가한다(학습용 문구를 눈에 띄게 넣고 엠블럼·직인은 넣지 않는다).
- **기본값 30%와 입력 칸 표시 (2026-10-16)**: 선수금·보증금·잔존가치는 "손대지 않음(null)"이면 차량가격의 30%를 보여주고, 손댄 뒤에는 입력한 글자를 유지한다(`summary.tsx`의 `*Edit` 상태). 입력 칸(`amount-input.tsx`)은 기기 기본 포커스 표시(어두운 네모, 밑줄, 자동 채우기)를 끄고 포커스 때 파란 테두리로 대신하며, `minWidth: 0`으로 글자 크기를 키운 기기에서도 카드 밖으로 밀리지 않게 했다. 슬라이더의 양 끝 숫자와 비율 글자는 글자 크기 배율을 따르지 않게 했다(`allowFontScaling={false}`).
- **키보드에 가려지는 입력 칸 (2026-10-16)**: 키보드는 화면을 덮기만 하고 스크롤은 해 주지 않아 아래쪽 칸(금리 등)이 가려졌다. `components/keyboard-scroll.tsx`(`KeyboardScrollView`)가 `Keyboard` 이벤트로 키보드 윗면 위치를 알아 두고, 입력 칸(`amount-input.tsx`)이 눌리면 그 칸이 키보드 위에 오도록 스크롤한다. 맨 아래 칸도 올릴 수 있게 키보드 높이만큼 아래 여백을 임시로 늘린다. 새 패키지 없음. 처음엔 ScrollView 자체의 `measureInWindow`가 응답하지 않아 감싸는 View 로 재도록 했다.
