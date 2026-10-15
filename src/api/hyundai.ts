// 현대자동차 공식 사이트의 내부 JSON API 호출.
// 공개 API가 아니라서 예고 없이 바뀔 수 있다. 응답 모양이 다르면 HyundaiApiError를 던진다.
// 조사 내용: docs/ARCHITECTURE.md 10장

import type { Car, CarColor, CarOption, Spec, Trim, TrimPrice } from '@/types/car';

const BASE_URL = 'https://www.hyundai.com/kr/ko/e/api/product';
const PASSENGER_TYPE_CODE = 'P'; // 승용

export class HyundaiApiError extends Error {}

type ApiResponse<T> = {
  data: T | null;
  rspStatus?: { rspCode?: string; rspMessage?: string };
};

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${path}${query ? `?${query}` : ''}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new HyundaiApiError('네트워크에 연결할 수 없습니다.');
  }
  if (!response.ok) {
    throw new HyundaiApiError(`서버 응답 오류 (${response.status})`);
  }

  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new HyundaiApiError('응답을 읽을 수 없습니다. 사이트가 바뀌었을 수 있습니다.');
  }
  if (body.rspStatus?.rspCode !== '0000' || body.data == null) {
    throw new HyundaiApiError(body.rspStatus?.rspMessage ?? '데이터가 없습니다.');
  }
  return body.data;
}

function toNumber(value: unknown, label: string): number {
  const n = Number(value);
  if (value === null || value === '' || !Number.isFinite(n)) {
    throw new HyundaiApiError(`가격 형식이 올바르지 않습니다. (${label})`);
  }
  return n;
}

function requireArray<T>(value: T[] | null | undefined, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new HyundaiApiError(`응답 형식이 달라졌습니다. (${label})`);
  }
  return value;
}

// ---- 1. 차종 목록 ----

type CarItem = { carCode: string; carName: string; carTypeCode: string };

export async function fetchCars(): Promise<Car[]> {
  const data = await get<CarItem[]>('/car/catalog-price');
  return requireArray(data, '차종 목록')
    .filter((c) => c.carTypeCode === PASSENGER_TYPE_CODE)
    .map((c) => ({ code: c.carCode, name: c.carName }));
}

// ---- 2. 트림 목록 ----

type TrimResponse = {
  engineTypes: { carEnginCode: string; carEnginName: string }[];
  trimList: { trimName: string; saleModelCode: string; engineTypeCd: string }[];
};

export async function fetchTrims(carCode: string): Promise<Trim[]> {
  const data = await get<TrimResponse>('/dictionary/applied-trim-list', {
    repnCarnCd: carCode,
    carSpcCd: '',
  });
  const engineNames = new Map(
    requireArray(data.engineTypes, '엔진 목록').map((e) => [e.carEnginCode, e.carEnginName]),
  );
  return requireArray(data.trimList, '트림 목록').map((t) => ({
    saleModelCode: t.saleModelCode,
    name: t.trimName,
    engineCode: t.engineTypeCd,
    engineName: engineNames.get(t.engineTypeCd) ?? t.engineTypeCd,
  }));
}

// ---- 3. 가격과 옵션 ----

type InteriorColorItem = {
  interiorColorCode: string;
  interiorColorName: string;
  interiorColorPrice: string;
  choiceYn: string; // "Y"면 이 트림에서 선택 가능
};
type ExteriorColorItem = {
  exteriorColorCode: string;
  exteriorColorName: string;
  exteriorColorPrice: string;
  choiceYn: string;
};

type OptionsResponse = {
  classChoice: {
    saleSpecCode: string;
    saleModelName: string;
    carPrice: string;
    specPrice: string;
  }[];
  optionChoice: {
    choiceOptionCode: string;
    choiceOptionName: string;
    choiceOptionPrice: string;
    saleSpecCode: string;
    choiceOptionGroupCodes: string | null;
  }[];
  optionTuix: { tuixOptionCode: string; tuixOptionName: string; tuixOptionPrice: string }[];
};

export async function fetchTrimPrice(saleModelCode: string): Promise<TrimPrice> {
  const [data, interior, exterior] = await Promise.all([
    get<OptionsResponse>(`/options/${saleModelCode}`),
    get<InteriorColorItem[]>(`/interior-color/${saleModelCode}`, { saleModelCode }),
    get<ExteriorColorItem[]>(`/exterior-color/${saleModelCode}`, {
      siteTypeCode: '',
      saleModelCode,
      interiorColorCode: '',
      exteriorColorCode: '',
    }),
  ]);

  const specs: Spec[] = requireArray(data.classChoice, '사양 목록').map((s) => ({
    code: s.saleSpecCode,
    name: s.saleModelName,
    price: toNumber(s.carPrice, s.saleModelName),
    extraPrice: toNumber(s.specPrice, s.saleModelName),
  }));

  const choiceOptions: CarOption[] = requireArray(data.optionChoice, '선택 옵션').map((o) => ({
    code: o.choiceOptionCode,
    name: o.choiceOptionName,
    price: toNumber(o.choiceOptionPrice, o.choiceOptionName),
    specCodes: o.saleSpecCode.split(',').map((c) => c.trim()),
    kind: 'choice',
    groupCodes: (o.choiceOptionGroupCodes ?? o.choiceOptionCode).split(',').map((c) => c.trim()),
  }));
  // 튜익스(제조사 추가 옵션)에는 사양 제한 정보가 없어 모든 사양에서 고를 수 있는 것으로 둔다.
  const allSpecCodes = specs.map((s) => s.code);
  const tuixOptions: CarOption[] = requireArray(data.optionTuix, '튜익스 옵션').map((o) => ({
    code: o.tuixOptionCode,
    name: o.tuixOptionName,
    price: toNumber(o.tuixOptionPrice, o.tuixOptionName),
    specCodes: allSpecCodes,
    kind: 'tuix',
    groupCodes: [o.tuixOptionCode],
  }));

  // choiceYn이 "Y"인 색상만 이 트림에서 고를 수 있다.
  const interiorColors: CarColor[] = requireArray(interior, '내장 색상')
    .filter((c) => c.choiceYn === 'Y')
    .map((c) => ({
      code: c.interiorColorCode,
      name: c.interiorColorName,
      price: toNumber(c.interiorColorPrice, c.interiorColorName),
    }));

  const exteriorColors: CarColor[] = requireArray(exterior, '외장 색상')
    .filter((c) => c.choiceYn === 'Y')
    .map((c) => ({
      code: c.exteriorColorCode,
      name: c.exteriorColorName,
      price: toNumber(c.exteriorColorPrice, c.exteriorColorName),
    }));

  return {
    saleModelCode,
    specs,
    options: [...choiceOptions, ...tuixOptions],
    interiorColors,
    exteriorColors,
  };
}

// ---- 4. 옵션 선택 규칙 (선택할 때마다 실시간으로 조회, 저장하지 않음) ----

type OptionDelResponse = { carAddOptionList: { optionCode: string }[] | null };

/**
 * 옵션 하나를 새로 골랐을 때 함께 선택되어야 하는 옵션 코드들.
 * 응답은 선택된 옵션 일부를 빠뜨릴 수 있어서, 호출하는 쪽에서 기존 선택과 합쳐서 써야 한다.
 */
export async function fetchRequiredOptions(
  saleModelCode: string,
  specCode: string,
  selected: string[],
  added: string,
): Promise<string[]> {
  const data = await get<OptionDelResponse>(`/option/del/${saleModelCode}`, {
    saleSpecCode: specCode,
    afterOption: added,
    beforOption: selected.join(','),
  });
  return (data.carAddOptionList ?? []).map((o) => o.optionCode);
}

export type OptionRules = {
  disabled: string[]; // 지금 선택 상태에서 고를 수 없는 일반 옵션
  enabled: string[]; // disabled에 있어도 고를 수 있게 다시 허용된 옵션
};

/** 지금 선택한 일반 옵션들과 함께 고를 수 있는지/없는지 */
export async function fetchOptionRules(
  saleModelCode: string,
  specCode: string,
  selected: string[],
): Promise<OptionRules> {
  const params = { saleSpecCode: specCode, optionCode: selected.join(',') };
  const [disabled, enabled] = await Promise.all([
    get<{ optionCode: string }[]>(`/disable-option/${saleModelCode}`, params),
    get<{ optionCode: string }[]>(`/add-possible-option/${saleModelCode}`, params),
  ]);
  return {
    disabled: requireArray(disabled, '비활성 옵션').map((o) => o.optionCode),
    enabled: requireArray(enabled, '활성 옵션').map((o) => o.optionCode),
  };
}

export type TuixRuleInput = {
  specCode: string;
  selectedOptions: string[]; // 선택한 일반 옵션
  selectedTuix: string[]; // 선택한 튜익스
  allTuix: string[]; // 이 트림의 모든 튜익스
  exteriorCode: string | null;
  interiorCode: string | null;
};

/**
 * 지금 선택(일반 옵션, 색상, 다른 튜익스)과 함께 고를 수 없는 튜익스 코드들.
 * - tuix-check: 일반 옵션/색상과 맞지 않는 튜익스
 * - disable-tuix: 이미 고른 튜익스와 함께 고를 수 없는 튜익스
 */
export async function fetchDisabledTuix(saleModelCode: string, input: TuixRuleInput): Promise<string[]> {
  const check = get<{ tuixOptionCode: string }[]>(`/options/tuix-check/${saleModelCode}`, {
    saleModelCode,
    saleSpecCode: input.specCode,
    optionCode: input.selectedOptions.join(','),
    exteriorColorCode: input.exteriorCode ?? '',
    interiorColorCode: input.interiorCode ?? '',
    tuixCode: input.allTuix.join(','),
  });
  const conflict =
    input.selectedTuix.length > 0
      ? get<{ tuixCode: string }[]>(`/disable-tuix/${saleModelCode}`, {
          saleModelCode,
          tuixCode: input.selectedTuix.join(','),
        })
      : Promise.resolve([] as { tuixCode: string }[]);

  const [checked, conflicts] = await Promise.all([check, conflict]);
  return [
    ...requireArray(checked, '튜익스 확인').map((t) => t.tuixOptionCode),
    ...requireArray(conflicts, '튜익스 충돌').map((t) => t.tuixCode),
  ];
}
