# ARCHITECTURE.md

> 상태: 초안 (프로젝트 생성 직후, 기능 미확정). 기능 관련 항목은 **미결정**으로 표시한다.
> 요구사항은 `docs/APP_SPEC.md`, 공통 작업 규칙은 `CLAUDE.md`를 따른다.

## 1. 기술 구성 (설치된 실제 버전)

| 항목 | 내용 |
|---|---|
| 프레임워크 | Expo SDK `~57.0.29` (관리형), React Native `0.86.3`, React `19.2.3` |
| 언어 | TypeScript `~6.0.3` (strict) |
| 라우팅 | Expo Router `~57.0.27` (파일 기반, 라우트 루트 `src/app`) |
| 패키지 관리자 | npm 11.19.1 |
| 템플릿 | `create-expo-app` default 템플릿 (예제 화면 Home/Explore 포함) |
| 데이터 저장 | 기기 내부 저장소. 방식은 미결정 (4장) |
| 백엔드/계정/분석 | 없음 |

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
src/app/         화면과 라우팅 (파일 이름 = 주소). 화면은 얇게 유지
src/components/  여러 화면에서 실제로 재사용하는 UI 조각
src/constants/   템플릿 테마 값
src/hooks/       템플릿 훅 (색상 테마 등)
src/storage/     저장/조회 코드 (필요해질 때 생성)
src/types/       공통 TypeScript 타입 (필요해질 때 생성)
assets/          이미지, 아이콘
docs/            APP_SPEC.md, ARCHITECTURE.md
```

규칙: 화면은 보여주기와 사용자 동작만 담당하고, 저장은 `src/storage/` 함수를 호출한다. 같은 UI가 2곳 이상에서 쓰일 때만 `components/`로 분리한다. 경로 별칭 `@/`는 `src/`를 가리킨다.

## 5. 데이터 흐름

```
화면(src/app) → src/storage 함수 → 기기 내부 저장소
```

저장 실패는 `storage`에서 잡아 화면이 사용자에게 알릴 수 있는 형태로 돌려준다. 전역 상태 라이브러리는 도입하지 않는다.

## 6. 저장 방식 선택 기준 (미결정)

기능과 데이터 모양이 정해진 뒤 결정한다. 설치는 `npx expo install`로 SDK 호환 버전을 사용한다.

| 데이터 특징 | 후보 |
|---|---|
| 설정값, 소량의 단순 목록 | AsyncStorage |
| 항목이 많고 검색/정렬/필터가 필요 | expo-sqlite |
| 비밀번호 등 민감 정보 | 별도 검토 (expo-secure-store 등) |

## 7. 템플릿 정리 후보 (미결정, 승인 후 진행)

기본 템플릿에는 현재 기능에 불필요할 수 있는 항목이 있다. 기능이 정해진 뒤 필요 여부를 판단해 정리한다.

- 예제 화면 Home/Explore, `scripts/reset-project.js`, 템플릿 이미지
- 패키지: `@expo/ui`, `expo-glass-effect`, `react-native-web`/`react-dom`, `expo-web-browser`, `expo-symbols` 등 (템플릿 예제 코드가 사용 중이라 지금 제거하면 예제가 깨질 수 있음)
- 실험 옵션 `reactCompiler: true`: 초보자 디버깅이 어려워질 수 있어 재검토. `typedRoutes: true`는 잘못된 화면 주소를 잡아 주므로 유지 권장.

## 8. 결정 기록

| 날짜 | 결정 | 상태 |
|---|---|---|
| 2026-10-15 | Expo SDK 57 + TypeScript + Expo Router, npm | 확정 (생성 완료) |
| 2026-10-15 | 앱 이름 `itsolvers-01`, 프로젝트를 현재 폴더에 직접 생성 | 확정 |
| 2026-10-15 | 앱 이름과 폴더명을 `itsolvers-app-001`로 변경 (기존 `itsolvers-01`) | 확정 |
| 2026-10-15 | 개발 서버 포트 8082 | 확정 |
| 2026-10-15 | `.git`: 생성 도구가 자동 생성한 저장소(Initial commit 1개)를 유지 | 임시 (변경 가능) |
| - | 저장 방식 | 미결정 (기능 확정 후) |
| - | 최소 OS 버전, 테스트 기기, 배포 방식 | 미결정 |
| - | 데이터 백업/내보내기 | 미결정 |
| - | eslint 설치 여부 | 미결정 (승인 필요) |

## 9. 의도적으로 하지 않는 것

- 서버, 로그인, 외부 분석/크래시 수집 서비스
- 승인되지 않은 라이브러리 추가
- 기능이 확정되기 전의 화면/데이터 모델 구현
