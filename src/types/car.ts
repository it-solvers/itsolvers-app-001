// 앱 화면과 저장 코드가 함께 쓰는 차량 가격 데이터 타입.
// 제조사 API의 응답 모양과 분리해서, 사이트가 바뀌어도 이 타입은 유지한다.

/** 차종 (예: 쏘나타 디 엣지) */
export type Car = {
  code: string; // 예: "DN26"
  name: string;
};

/** 트림 (예: 가솔린 2.0 Premium). saleModelCode로 가격과 옵션을 조회한다. */
export type Trim = {
  saleModelCode: string; // 예: "DNJS4SBT8"
  name: string; // 예: "Premium"
  engineCode: string;
  engineName: string; // 예: "가솔린 2.0"
};

/** 사양 선택 (예: 기본, 인포테인먼트내비Ⅰ). 기본 가격에 specPrice가 더해진다. */
export type Spec = {
  code: string; // 예: "A"
  name: string;
  price: number; // 이 사양을 골랐을 때의 차량 가격
  extraPrice: number; // 기본 사양 대비 추가 금액
};

/** 선택 옵션. specCodes에 포함된 사양에서만 고를 수 있다. */
export type CarOption = {
  code: string;
  name: string;
  price: number;
  specCodes: string[];
  kind: 'choice' | 'tuix'; // choice: 일반 선택 옵션, tuix: 제조사 추가 옵션(튜익스)
  groupCodes: string[]; // 함께 묶인 옵션 코드(자기 자신 포함). 일반 옵션만 사용
};

/** 색상. 가격이 없으면 0 */
export type CarColor = {
  code: string;
  name: string;
  price: number;
};

/** 한 트림의 가격 정보 전체 */
export type TrimPrice = {
  saleModelCode: string;
  specs: Spec[];
  options: CarOption[];
  interiorColors: CarColor[];
  exteriorColors: CarColor[];
};
