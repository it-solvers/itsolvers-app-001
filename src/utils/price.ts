// 가격 표시와 합계 계산. 화면과 분리해서 계산이 맞는지 따로 확인할 수 있게 한다.

import type { CarColor, CarOption, Spec, TrimPrice } from '@/types/car';

/** 28760000 -> "28,760,000원" */
export function formatPrice(price: number): string {
  return `${String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`;
}

/** 추가 금액 표시: 0이면 "추가 금액 없음", 아니면 "+100,000원" */
export function formatExtra(price: number): string {
  return price === 0 ? '추가 금액 없음' : `+${formatPrice(price)}`;
}

export type Selection = {
  specCode: string;
  optionCodes: string[];
  interiorCode: string | null; // 선택하지 않으면 null
  exteriorCode: string | null;
};

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

export type SelectedItems = {
  spec: Spec | undefined;
  options: CarOption[];
  interior: CarColor | undefined;
  exterior: CarColor | undefined;
};

/**
 * 선택한 사양, 옵션, 색상 목록. 선택한 사양에서 고를 수 없는 옵션은 뺀다.
 * 합계 계산과 견적 확인 화면이 같은 결과를 쓰도록 한곳에서 정한다.
 */
export function selectedItems(price: TrimPrice, selection: Selection): SelectedItems {
  return {
    spec: price.specs.find((s) => s.code === selection.specCode),
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
  const specPrice = spec?.price ?? 0;
  const optionsPrice = options.reduce((sum, o) => sum + o.price, 0);
  const colorsPrice = (interior?.price ?? 0) + (exterior?.price ?? 0);
  return { specPrice, optionsPrice, colorsPrice, total: specPrice + optionsPrice + colorsPrice };
}
