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
| `npm run lint` | **동작 안 함**: eslint 패키지 미설치 (`eslint.config.js`는 Expo가 생성함) |
| `npm audit` | 취약점 29건(moderate 11, high 18) 보고됨. 템플릿 의존성의 하위 패키지이며 아직 원인과 영향을 조사하지 않음. `audit fix --force`는 사용하지 않는다. |

## 3. 개발 서버 포트

이 PC의 8081 포트는 ssh 프로세스가 사용 중이라(처음에 접속 실패 "Failed to parse manifest JSON"의 원인으로 추정) **8082**를 쓴다. `package.json`의 `start/ios/android/web` 스크립트에 `--port 8082`가 지정되어 있다.

## 4. 폴더 구조

```
src/app/         화면과 라우팅 (파일 이름 = 주소). 화면은 얇게 유지. _layout.tsx(스택), index.tsx(제조사), cars.tsx(차종)
src/components/  여러 화면에서 실제로 재사용하는 UI 조각 (list-row.tsx 등)
src/constants/   템플릿 테마 값, brands.ts(지원 제조사 목록)
src/hooks/       템플릿 훅 (색상 테마 등)
src/api/         제조사 사이트 호출 코드 (hyundai.ts). 화면에서 fetch를 직접 쓰지 않는다
src/storage/     저장 코드. cache.ts(JSON 파일 저장, 하루 1회 규칙), vehicleData.ts(화면이 호출하는 getCars/getTrims/getTrimPrice)
src/types/       공통 TypeScript 타입 (car.ts: 차종/트림/사양/옵션/색상/가격)
assets/          이미지, 아이콘
docs/            APP_SPEC.md, ARCHITECTURE.md
```

규칙: 화면은 보여주기와 사용자 동작만 담당하고, 저장은 `src/storage/` 함수를 호출한다. 같은 UI가 2곳 이상에서 쓰일 때만 `components/`로 분리한다. 경로 별칭 `@/`는 `src/`를 가리킨다.

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

## 7. 템플릿 정리 후보 (미결정, 승인 후 진행)

기본 템플릿에는 현재 기능에 불필요할 수 있는 항목이 있다. 기능이 정해진 뒤 필요 여부를 판단해 정리한다.

- 사용하지 않게 된 템플릿 파일: `components/hint-row.tsx`, `components/ui/collapsible.tsx`, `web-badge.tsx`, `external-link.tsx`, 탭 아이콘 이미지(`assets/images/tabIcons/`), `scripts/reset-project.js` 등
- 패키지: `@expo/ui`, `expo-glass-effect`, `react-native-web`/`react-dom`, `expo-web-browser`, `expo-symbols` 등 (템플릿 예제 코드가 사용 중이라 지금 제거하면 예제가 깨질 수 있음)
- 실험 옵션 `reactCompiler: true`: 초보자 디버깅이 어려워질 수 있어 재검토. `typedRoutes: true`는 잘못된 화면 주소를 잡아 주므로 유지 권장.

## 8. 결정 기록

| 날짜 | 결정 | 상태 |
|---|---|---|
| 2026-10-15 | Expo SDK 57 + TypeScript + Expo Router, npm | 확정 (생성 완료) |
| 2026-10-15 | 앱 이름 `itsolvers-01`, 프로젝트를 현재 폴더에 직접 생성 | 확정 |
| 2026-10-15 | 앱 이름과 폴더명을 `itsolvers-app-001`로 변경 (기존 `itsolvers-01`) | 확정 |
| 2026-10-15 | 내비게이션: 탭 → 스택으로 교체. 템플릿 예제 화면(explore)과 탭 컴포넌트 삭제 (승인) | 확정 |
| 2026-10-15 | 개발 서버 포트 8082 | 확정 |
| 2026-10-15 | `.git`: 생성 도구가 자동 생성한 저장소(Initial commit 1개)를 유지 | 임시 (변경 가능) |
| 2026-10-15 | 앱 기능: 국내 승용차 가격 조회 (차량→트림→옵션). 1단계는 현대자동차 승용차만 | 확정 |
| 2026-10-15 | 데이터 출처: 앱이 제조사 사이트에서 직접 스크랩(서버 없음) | 확정 |
| 2026-10-15 | 흐름: 제조사 → 차종 → 트림 → 옵션(색상 포함). 가격은 참고용 문구 표시 | 확정 |
| 2026-10-15 | 가격 데이터는 조건별로 하루 1회 가져와 로컬 JSON으로 저장, 새 조건은 실시간 조회 | 확정 |
| 2026-10-15 | JSON 저장: `expo-file-system`, 앱 문서 폴더의 `price-cache/` (승인 후 설치) | 확정 |
| - | 최소 OS 버전, 테스트 기기, 배포 방식 | 미결정 |
| - | 데이터 백업/내보내기 | 미결정 |
| - | eslint 설치 여부 | 미결정 (승인 필요) |

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

가격 구조: 한 트림(`saleModelCode`) 안에 **사양 선택**(`classChoice`: 예 "기본" 28,760,000 / "인포테인먼트내비Ⅰ" 30,160,000 = +1,400,000)이 있고, 선택 옵션은 `saleSpecCode`("A,N" 등)로 어느 사양에서 고를 수 있는지 정해진다. 그래서 화면 흐름은 제조사 → 차종 → 트림 → **사양** → 옵션/색상이다. 합계 = 사양 가격 + 선택 옵션 + 색상 가격.

확인된 예: 쏘나타 디 엣지(DN26) 가솔린 2.0 Premium(`DNJS4SBT8`) 기본 가격 28,760,000원, 선택 옵션 예 "하이패스" 200,000원.

아직 모르는 것

- 1단계가 승용 외 차종까지 섞여 오는지, 승용만 필터링하는 방법 (`/car/type`은 `carTypeFlag`와 `siteTypeCode=E` 필요)
- 색상: 내장 색상은 `/interior-color/{saleModelCode}`에 `interiorColorPrice`가 있다(확인한 트림은 모두 0). 외장 색상은 `/options`의 `carClassExteriorColor`에 이름만 있고 가격 필드가 안 보였다. `/exterior-color/{saleModelCode}`는 파라미터 불명으로 오류. 구현 때 확인
- `/trims`, `/car/sale-model-code/info`는 파라미터 조합이 복잡해 사용하지 않았다. 2단계의 `trimList`로 충분한지
- 가격 필드가 문자열(`"28760000"`)로 오므로 숫자 변환·검증 필요
- 선택 옵션끼리의 제약(함께 선택 불가/필수 선택)은 `/disable-option/`, `/option-required-choice` 등에 있을 수 있으나 미조사
- 호출 빈도 제한 (앱에서 직접 호출은 시뮬레이터/에뮬레이터에서 성공함)
- 승용 필터 결과는 6종(쏘나타·아반떼·그랜저와 각 Hybrid)이다. 그랜저 등 다른 승용(예: 택시/렌터카용 트림 `HS` 코드 등)이 트림 목록에 섞여 오는지 미확인
