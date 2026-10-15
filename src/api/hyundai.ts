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
  optionChoice: { choiceOptionCode: string; choiceOptionName: string; choiceOptionPrice: string; saleSpecCode: string }[];
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
  }));
  // 튜익스(제조사 추가 옵션)에는 사양 제한 정보가 없어 모든 사양에서 고를 수 있는 것으로 둔다.
  const allSpecCodes = specs.map((s) => s.code);
  const tuixOptions: CarOption[] = requireArray(data.optionTuix, '튜익스 옵션').map((o) => ({
    code: o.tuixOptionCode,
    name: o.tuixOptionName,
    price: toNumber(o.tuixOptionPrice, o.tuixOptionName),
    specCodes: allSpecCodes,
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
