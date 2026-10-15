// ============================================================================
// 가격 표시와 합계 계산. 화면과 분리해서 계산이 맞는지 따로 확인할 수 있게 한다.
//
// [왜 화면 코드가 아니라 별도 파일인가?]
// 이 파일의 함수들은 "같은 입력이면 항상 같은 출력"을 내는 순수 함수다. 화면(React)이나
// 네트워크와 상관없어서, 터미널에서 값을 넣어 보는 것만으로 맞는지 검증할 수 있다.
// 그리고 가격 화면과 차량 선택 완료 화면이 같은 함수를 쓰므로 두 화면의 합계가 어긋날 수 없다.
// ============================================================================

import type { CarColor, CarOption, Spec, TrimPrice } from '@/types/car';

/** 28760000 -> "28,760,000원" */
export function formatPrice(price: number): string {
  // 정규식 \B(?=(\d{3})+(?!\d)) 풀이:
  //   (?=(\d{3})+(?!\d))  "뒤에 숫자가 3의 배수 개만큼 이어지고 그 뒤에는 숫자가 없는" 위치
  //   \B                  단어 경계가 아닌 위치 (= 숫자 사이)
  // 즉 "오른쪽 끝에서부터 세 자리마다" 쉼표를 넣을 위치를 찾아 ','로 바꾼다.
  return `${String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`;
}

/** 추가 금액 표시: 0이면 "추가 금액 없음", 아니면 "+100,000원" */
export function formatExtra(price: number): string {
  return price === 0 ? '추가 금액 없음' : `+${formatPrice(price)}`;
}

/**
 * 사용자가 지금까지 고른 내용. 화면 상태와 견적 화면 주소 값이 모두 이 모양이다.
 * 이름이 아니라 "코드"만 들고 있다. 이름이나 가격은 TrimPrice에서 코드로 찾아서 쓴다.
 * (같은 내용을 두 군데에 저장하면 서로 달라질 수 있기 때문이다.)
 */
export type Selection = {
  specCode: string;
  optionCodes: string[]; // 일반 옵션과 튜익스 코드가 함께 들어간다
  interiorCode: string | null; // 선택하지 않으면 null
  exteriorCode: string | null;
};

/** 합계와 항목별 소계 (화면 하단의 "사양 + 옵션 + 색상" 표시에 쓴다) */
export type PriceBreakdown = {
  specPrice: number; // 선택한 사양의 차량 가격 (기본 가격 + 사양 추가금)
  optionsPrice: number;
  colorsPrice: number;
  total: number;
};

/** 이 사양에서 고를 수 있는 옵션인지 */
export function isOptionAvailable(option: CarOption, specCode: string): boolean {
  return option.specCodes.includes(specCode);
}

/** "고른 코드"를 실제 사양/옵션/색상 객체로 바꾼 결과 */
export type SelectedItems = {
  spec: Spec | undefined;
  options: CarOption[];
  interior: CarColor | undefined;
  exterior: CarColor | undefined;
};

/**
 * 선택한 사양, 옵션, 색상 목록. 선택한 사양에서 고를 수 없는 옵션은 뺀다.
 * 합계 계산과 차량 선택 완료 화면이 같은 결과를 쓰도록 한곳에서 정한다.
 */
export function selectedItems(price: TrimPrice, selection: Selection): SelectedItems {
  return {
    // find: 조건에 맞는 첫 항목을 돌려준다. 못 찾으면 undefined.
    spec: price.specs.find((s) => s.code === selection.specCode),
    // filter: 조건에 맞는 항목만 골라 새 배열을 만든다.
    // "고른 옵션이면서, 현재 사양에서 쓸 수 있는 것"만 남긴다.
    // (사양을 바꿨는데 이전 사양 전용 옵션이 남아 합계에 들어가는 일을 막는다.)
    options: price.options.filter(
      (o) => selection.optionCodes.includes(o.code) && isOptionAvailable(o, selection.specCode),
    ),
    interior: price.interiorColors.find((c) => c.code === selection.interiorCode),
    exterior: price.exteriorColors.find((c) => c.code === selection.exteriorCode),
  };
}

/** 선택한 사양, 옵션, 색상으로 합계를 계산한다. */
export function calcBreakdown(price: TrimPrice, selection: Selection): PriceBreakdown {
  const { spec, options, interior, exterior } = selectedItems(price, selection);
  // ?. 는 "앞이 undefined면 멈추고 undefined", ?? 는 "앞이 undefined/null이면 뒤의 값(0)을 쓴다".
  // 사양을 못 찾는 비정상 상황에서도 오류 없이 0원으로 계산되게 한다.
  const specPrice = spec?.price ?? 0;
  // reduce: 배열을 돌면서 값을 하나로 합친다. (sum 은 지금까지의 합, 시작값은 0)
  const optionsPrice = options.reduce((sum, o) => sum + o.price, 0);
  const colorsPrice = (interior?.price ?? 0) + (exterior?.price ?? 0);
  return { specPrice, optionsPrice, colorsPrice, total: specPrice + optionsPrice + colorsPrice };
}
