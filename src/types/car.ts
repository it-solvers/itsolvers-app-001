// ============================================================================
// 앱 전체가 함께 쓰는 "차량 가격 데이터"의 모양(타입)을 정의하는 파일이다.
//
// [왜 따로 정의하나?]
// 제조사 사이트가 내려주는 응답(JSON)은 필드 이름이 길고 일관되지 않다.
// (예: carEnginCode, choiceOptionGroupCodes ...) 이걸 화면 코드가 직접 쓰면
// 사이트가 조금만 바뀌어도 화면 코드를 전부 고쳐야 한다.
// 그래서 src/api/hyundai.ts 가 응답을 아래의 단순한 타입으로 "번역"해서 넘기고,
// 화면과 계산 코드는 이 타입만 바라본다. 사이트가 바뀌면 api 파일만 고치면 된다.
//
// [데이터의 흐름]
//   Car(차종) → Trim(트림) → TrimPrice(그 트림의 사양/옵션/색상 가격 전체)
//   예) 쏘나타 디 엣지 → 가솔린 2.0 Premium → 사양 2개, 옵션 7개, 색상 20개
//
// [TypeScript 문법 메모]
// - type 은 "이런 모양의 객체"라는 설명서다. 실행될 때는 사라지고 검사용으로만 쓰인다.
// - string[] 은 "문자열이 여러 개 든 배열"이다.
// - 'choice' | 'tuix' 는 "둘 중 하나의 글자만 허용"하는 타입(유니온)이다.
// ============================================================================

/** 차종 (예: 쏘나타 디 엣지) */
export type Car = {
  code: string; // 예: "DN26"  (트림 목록을 조회할 때 쓰는 열쇠)
  name: string; // 제조사가 준 한글 이름
  engName?: string; // 영문 슬러그 (예: "sonata-the-edge"). 영어 화면의 이름으로 쓴다. 예전 저장본에는 없을 수 있다
};

/** 트림 (예: 가솔린 2.0 Premium). saleModelCode로 가격과 옵션을 조회한다. */
export type Trim = {
  saleModelCode: string; // 예: "DNJS4SBT8"  (트림을 구분하는 고유 코드, 가격 조회의 열쇠)
  name: string; // 예: "Premium"
  engineCode: string; // 엔진 종류 코드 (트림 목록을 엔진별로 묶을 때 사용)
  engineName: string; // 예: "가솔린 2.0"
};

/** 사양 선택 (예: 기본, 인포테인먼트내비Ⅰ). 기본 가격에 specPrice가 더해진다. */
export type Spec = {
  code: string; // 예: "A"
  name: string;
  price: number; // 이 사양을 골랐을 때의 차량 가격 (기본 가격 + 추가금이 이미 합쳐진 값)
  extraPrice: number; // 기본 사양 대비 추가 금액 (기본 사양이면 0)
};

/** 선택 옵션. specCodes에 포함된 사양에서만 고를 수 있다. */
export type CarOption = {
  code: string;
  name: string;
  price: number;
  specCodes: string[]; // 이 옵션을 고를 수 있는 사양 코드들 (예: ["A", "N"])
  kind: 'choice' | 'tuix'; // choice: 일반 선택 옵션, tuix: 제조사 추가 옵션(튜익스)
  groupCodes: string[]; // 함께 묶인 옵션 코드(자기 자신 포함). 일반 옵션만 사용
};

/** 색상. 가격이 없으면 0 */
export type CarColor = {
  code: string;
  name: string;
  price: number;
};

/** 한 트림의 가격 정보 전체 (가격 화면과 견적 화면이 이 한 덩어리를 받아서 쓴다) */
export type TrimPrice = {
  saleModelCode: string;
  specs: Spec[];
  options: CarOption[]; // 일반 옵션과 튜익스가 kind 값으로 구분되어 한 배열에 섞여 있다
  interiorColors: CarColor[]; // 내장 색상 (이 트림에서 고를 수 있는 것만)
  exteriorColors: CarColor[]; // 외장 색상 (이 트림에서 고를 수 있는 것만)
};
