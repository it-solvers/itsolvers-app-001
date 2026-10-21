// ============================================================================
// 현대자동차 공식 사이트의 내부 JSON API 호출.
// 공개 API가 아니라서 예고 없이 바뀔 수 있다. 응답 모양이 다르면 HyundaiApiError를 던진다.
// 조사 내용: docs/ARCHITECTURE.md 10장
//
// [이 파일이 하는 일]
// 1) 제조사 사이트에 요청을 보내고(get 함수)
// 2) 돌아온 응답(JSON)을 검사해서
// 3) 앱이 쓰는 단순한 타입(src/types/car.ts)으로 "번역"해서 돌려준다.
// 화면은 이 파일의 함수만 알면 되고, 응답이 어떻게 생겼는지는 몰라도 된다.
//
// [이 파일의 함수들은 "정보를 가져오는 것"만 한다]
// 저장(하루 1회 규칙)은 src/storage/ 가, 화면 표시는 src/app/ 이 맡는다.
// ============================================================================

import { t } from '@/i18n';
import type { Car, CarColor, CarOption, Spec, Trim, TrimPrice } from '@/types/car';

const BASE_URL = 'https://www.hyundai.com/kr/ko/e/api/product';
const PASSENGER_TYPE_CODE = 'P'; // 승용

// 이 파일에서 발생하는 오류를 구분하기 위한 오류 종류. 메시지는 그대로 화면에 보여줄 수 있는 한국어 문장이다.
export class HyundaiApiError extends Error {}

// 제조사 API 응답의 겉모양: 실제 내용은 data 에, 성공 여부는 rspStatus 에 들어 있다.
type ApiResponse<T> = {
  data: T | null;
  rspStatus?: { rspCode?: string; rspMessage?: string };
};

/**
 * 제조사 API에 GET 요청을 보내고 data 부분만 돌려준다. 이 파일의 모든 요청이 이 함수를 거친다.
 * 실패하면 이유를 알 수 있는 한국어 메시지로 HyundaiApiError 를 던진다.
 *   path   : BASE_URL 뒤에 붙는 주소 (예: '/car/catalog-price')
 *   params : 주소 뒤에 붙는 ?이름=값 (예: { carCode: 'DN26' } → ?carCode=DN26)
 * <T> 는 "돌려줄 data 의 종류"로, 부르는 쪽이 정한다. (제네릭)
 */
async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  // URLSearchParams 가 값을 주소에 안전한 글자로 바꿔(인코딩) 준다. 한글이나 쉼표도 문제없다.
  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${path}${query ? `?${query}` : ''}`;

  // 1단계: 요청 보내기. fetch 가 실패하면 보통 인터넷 연결 문제다.
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new HyundaiApiError(t('api.network'));
  }
  // 2단계: HTTP 상태 확인. 200대가 아니면(404, 500 등) 서버 쪽 문제다.
  if (!response.ok) {
    throw new HyundaiApiError(t('api.server', { status: response.status }));
  }

  // 3단계: 응답을 JSON 으로 읽기. 글자가 JSON 이 아니면(사이트가 오류 페이지를 줄 때 등) 여기서 실패한다.
  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new HyundaiApiError(t('api.unreadable'));
  }
  // 4단계: 제조사가 "성공"이라고 했는지 확인. rspCode '0000' 이 성공이고 data 가 있어야 한다.
  // 필수 인자가 빠진 경우 등에는 data 가 null 이고 rspMessage 에 이유가 들어 있다.
  if (body.rspStatus?.rspCode !== '0000' || body.data == null) {
    throw new HyundaiApiError(body.rspStatus?.rspMessage ?? t('api.noData'));
  }
  return body.data;
}

/**
 * 가격 글자(예: "28760000")를 숫자로 바꾼다. 숫자가 아니면 오류를 던진다.
 * 가격이 잘못 읽힌 채로 계산하면 틀린 금액이 나오기 때문에, 조용히 넘어가지 않고 멈춘다.
 * label 은 오류 메시지에 넣을 이름이다(어떤 항목의 가격이 잘못됐는지 알 수 있게).
 */
function toNumber(value: unknown, label: string): number {
  const n = Number(value);
  // Number(null) 과 Number('') 은 0이 되어 버리므로, 비어 있는 값을 따로 막는다.
  if (value === null || value === '' || !Number.isFinite(n)) {
    throw new HyundaiApiError(t('api.badPrice', { label }));
  }
  return n;
}

/** 색상 가격처럼 없을 수도 있는 값. 값이 없으면 추가 금액이 없는 것(0)으로 본다. 값이 있는데 숫자가 아니면 오류. */
function toOptionalPrice(value: unknown, label: string): number {
  return value === undefined || value === null ? 0 : toNumber(value, label);
}

/** 배열이어야 하는 값이 배열이 아니면 오류. (응답 형식이 달라졌는지 일찍 알아채기 위한 검사) */
function requireArray<T>(value: T[] | null | undefined, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new HyundaiApiError(t('api.badShape', { label }));
  }
  return value;
}

// ---- 1. 차종 목록 ----

// 제조사 응답에서 우리가 쓰는 필드만 적은 타입. (응답에는 더 많은 필드가 있지만 쓰지 않는 것은 적지 않는다)
type CarItem = { carCode: string; carName: string; carEngName?: string; carTypeCode: string };

/** 승용차 차종 목록을 가져온다. */
export async function fetchCars(): Promise<Car[]> {
  const data = await get<CarItem[]>('/car/catalog-price');
  return requireArray(data, t('api.labelCars'))
    .filter((c) => c.carTypeCode === PASSENGER_TYPE_CODE) // 승용만 (SUV, 상용 등 제외)
    .map((c) => ({ code: c.carCode, name: c.carName, engName: c.carEngName })); // 응답 이름 → 앱 이름으로 번역
}

// ---- 2. 트림 목록 ----

type TrimResponse = {
  engineTypes: { carEnginCode: string; carEnginName: string }[];
  trimList: { trimName: string; saleModelCode: string; engineTypeCd: string }[];
};

/** 한 차종의 트림 목록. 엔진 코드를 엔진 이름으로 바꿔서 함께 돌려준다. */
export async function fetchTrims(carCode: string): Promise<Trim[]> {
  const data = await get<TrimResponse>('/dictionary/applied-trim-list', {
    repnCarnCd: carCode, // (제조사 API가 쓰는 이름 그대로. 오타처럼 보여도 실제 필드 이름이다)
    carSpcCd: '',
  });
  // 엔진 코드 → 엔진 이름 표(Map)를 만들어 두고, 트림마다 이름을 찾아 붙인다.
  const engineNames = new Map(
    requireArray(data.engineTypes, t('api.labelEngines')).map((e) => [e.carEnginCode, e.carEnginName]),
  );
  return requireArray(data.trimList, t('api.labelTrims')).map((t) => ({
    saleModelCode: t.saleModelCode,
    name: t.trimName,
    engineCode: t.engineTypeCd,
    // 이름을 못 찾으면(??) 코드 글자라도 보여준다.
    engineName: engineNames.get(t.engineTypeCd) ?? t.engineTypeCd,
  }));
}

// ---- 3. 가격과 옵션 ----

// 색상 응답. 같은 모양이지만 필드 이름이 내장/외장에서 서로 다르다.
type InteriorColorItem = {
  interiorColorCode: string;
  interiorColorName: string;
  interiorColorPrice?: string | null; // 일부 차종(아반떼)은 필드 자체가 없다
  choiceYn: string; // "Y"면 이 트림에서 선택 가능
};
type ExteriorColorItem = {
  exteriorColorCode: string;
  exteriorColorName: string;
  exteriorColorPrice?: string | null;
  choiceYn: string;
};

// 사양/옵션 응답. 이름이 헷갈리지만 classChoice 가 "사양", optionChoice 가 "일반 옵션", optionTuix 가 "튜익스"다.
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
    saleSpecCode: string; // 이 옵션을 고를 수 있는 사양 코드들 (쉼표로 이어진 글자, 예: "A,N")
    choiceOptionGroupCodes: string | null; // 함께 묶이는 옵션 코드들 (예: "HUD,PA2")
  }[];
  optionTuix: { tuixOptionCode: string; tuixOptionName: string; tuixOptionPrice: string }[];
};

/**
 * 한 트림의 사양, 옵션, 색상 가격을 모두 가져온다.
 * 서로 다른 요청 3개(사양+옵션 / 내장 색상 / 외장 색상)를 합쳐 TrimPrice 하나로 만든다.
 */
export async function fetchTrimPrice(saleModelCode: string): Promise<TrimPrice> {
  // Promise.all: 요청 3개를 "동시에" 보내고 모두 끝나면 한꺼번에 결과를 받는다.
  // 하나씩 차례로 보내면 시간이 3배 걸리기 때문이다. 하나라도 실패하면 전체가 실패한다.
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

  // 사양: 가격이 숫자여야 하므로 toNumber 로 검사하며 바꾼다.
  const specs: Spec[] = requireArray(data.classChoice, t('api.labelSpecs')).map((s) => ({
    code: s.saleSpecCode,
    name: s.saleModelName,
    price: toNumber(s.carPrice, s.saleModelName),
    extraPrice: toNumber(s.specPrice, s.saleModelName),
  }));

  // 일반 옵션: "A,N" 같은 쉼표 글자를 배열로 쪼개고(split) 앞뒤 공백을 지운다(trim).
  // 묶음 코드가 없으면(null) 자기 자신만 묶음으로 본다.
  const choiceOptions: CarOption[] = requireArray(data.optionChoice, t('api.labelChoiceOptions')).map((o) => ({
    code: o.choiceOptionCode,
    name: o.choiceOptionName,
    price: toNumber(o.choiceOptionPrice, o.choiceOptionName),
    specCodes: o.saleSpecCode.split(',').map((c) => c.trim()),
    kind: 'choice',
    groupCodes: (o.choiceOptionGroupCodes ?? o.choiceOptionCode).split(',').map((c) => c.trim()),
  }));
  // 튜익스(제조사 추가 옵션)에는 사양 제한 정보가 없어 모든 사양에서 고를 수 있는 것으로 둔다.
  const allSpecCodes = specs.map((s) => s.code);
  const tuixOptions: CarOption[] = requireArray(data.optionTuix, t('api.labelTuixOptions')).map((o) => ({
    code: o.tuixOptionCode,
    name: o.tuixOptionName,
    price: toNumber(o.tuixOptionPrice, o.tuixOptionName),
    specCodes: allSpecCodes,
    kind: 'tuix',
    groupCodes: [o.tuixOptionCode],
  }));

  // choiceYn이 "Y"인 색상만 이 트림에서 고를 수 있다.
  // 색상 가격은 차종에 따라 필드가 없을 수 있어 toOptionalPrice 로 읽는다(없으면 0원).
  const interiorColors: CarColor[] = requireArray(interior, t('api.labelInterior'))
    .filter((c) => c.choiceYn === 'Y')
    .map((c) => ({
      code: c.interiorColorCode,
      name: c.interiorColorName,
      price: toOptionalPrice(c.interiorColorPrice, c.interiorColorName),
    }));

  const exteriorColors: CarColor[] = requireArray(exterior, t('api.labelExterior'))
    .filter((c) => c.choiceYn === 'Y')
    .map((c) => ({
      code: c.exteriorColorCode,
      name: c.exteriorColorName,
      price: toOptionalPrice(c.exteriorColorPrice, c.exteriorColorName),
    }));

  return {
    saleModelCode,
    specs,
    // 일반 옵션과 튜익스를 한 배열로 합친다. (각 항목의 kind 로 구분할 수 있다)
    options: [...choiceOptions, ...tuixOptions],
    interiorColors,
    exteriorColors,
  };
}

// ---- 4. 옵션 선택 규칙 (선택할 때마다 실시간으로 조회, 저장하지 않음) ----
//
// 제조사 사이트에는 "이 옵션을 고르면 저 옵션도 같이 골라야 한다", "이 조합은 같이 못 고른다" 같은
// 규칙이 있다. 사용자가 선택을 바꿀 때마다 "지금 선택 상태에서의 규칙"을 물어봐야 하므로
// (선택 조합이 매번 달라진다) 하루 1회 저장 대상이 아니고 항상 실시간으로 조회한다.
// 이 결과를 어떻게 쓰는지는 src/hooks/use-option-selection.ts 를 본다.

type OptionDelResponse = { carAddOptionList: { optionCode: string }[] | null };

/**
 * 옵션 하나를 새로 골랐을 때 함께 선택되어야 하는 옵션 코드들.
 * 응답은 선택된 옵션 일부를 빠뜨릴 수 있어서, 호출하는 쪽에서 기존 선택과 합쳐서 써야 한다.
 * (예: 헤드업 디스플레이를 고르면 파킹 어시스트 II가 같이 와야 한다)
 */
export async function fetchRequiredOptions(
  saleModelCode: string,
  specCode: string,
  selected: string[], // 이미 고른 옵션들
  added: string, // 방금 새로 고른 옵션
): Promise<string[]> {
  const data = await get<OptionDelResponse>(`/option/del/${saleModelCode}`, {
    saleSpecCode: specCode,
    afterOption: added,
    beforOption: selected.join(','), // 쉼표로 이어 한 글자로 만들어 보낸다 (이 이름이 실제 필드 이름이다)
  });
  return (data.carAddOptionList ?? []).map((o) => o.optionCode);
}

// 지금 선택 상태에서의 일반 옵션 규칙
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
  // "고를 수 없는 것"과 "다시 고를 수 있는 것"은 서로 다른 요청이라 동시에 보낸다.
  const [disabled, enabled] = await Promise.all([
    get<{ optionCode: string }[]>(`/disable-option/${saleModelCode}`, params),
    get<{ optionCode: string }[]>(`/add-possible-option/${saleModelCode}`, params),
  ]);
  return {
    disabled: requireArray(disabled, t('api.labelDisabled')).map((o) => o.optionCode),
    enabled: requireArray(enabled, t('api.labelEnabled')).map((o) => o.optionCode),
  };
}

// 튜익스 규칙을 물어볼 때 필요한 "지금 선택 상태" 전체
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
  // 요청을 "보내기만" 하고 결과는 아래에서 한꺼번에 기다린다. (await 를 붙이지 않았다)
  const check = get<{ tuixOptionCode: string }[]>(`/options/tuix-check/${saleModelCode}`, {
    saleModelCode,
    saleSpecCode: input.specCode,
    optionCode: input.selectedOptions.join(','),
    exteriorColorCode: input.exteriorCode ?? '', // 선택하지 않았으면 빈 글자로 보낸다
    interiorColorCode: input.interiorCode ?? '',
    tuixCode: input.allTuix.join(','),
  });
  // 이미 고른 튜익스가 하나도 없으면 물어볼 필요가 없으므로 요청을 생략하고 빈 목록을 쓴다.
  const conflict =
    input.selectedTuix.length > 0
      ? get<{ tuixCode: string }[]>(`/disable-tuix/${saleModelCode}`, {
          saleModelCode,
          tuixCode: input.selectedTuix.join(','),
        })
      : Promise.resolve([] as { tuixCode: string }[]);

  const [checked, conflicts] = await Promise.all([check, conflict]);
  // 두 규칙의 결과(고를 수 없는 튜익스 코드들)를 하나의 목록으로 합친다.
  return [
    ...requireArray(checked, t('api.labelTuixCheck')).map((t) => t.tuixOptionCode),
    ...requireArray(conflicts, t('api.labelTuixConflict')).map((t) => t.tuixCode),
  ];
}
