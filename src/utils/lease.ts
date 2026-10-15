// ============================================================================
// 리스료(월 납입금액) 계산. 화면과 분리한 순수 함수라서 값을 넣어 보며 맞는지 확인하기 쉽다.
// 계산식과 가정은 docs/APP_SPEC.md 5장 "리스료 계산"에 같은 내용이 적혀 있다.
//
// [용어]
//   차량가격   P   사용자가 고른 사양, 옵션, 색상의 합계
//   기간       n   개월 수 (12, 24, 36, 48, 60 중 하나)
//   선납금     S   처음에 내는 돈(장기선수금). 기간 동안 균등하게 나눠 월 납입금에서 뺀다.
//   보증금     D   처음에 맡기고 만기에 돌려받는 돈. 맡긴 돈의 이자만큼 월 납입금이 줄어든다.
//   잔존가치   R   만기 때 차량의 가치. 클수록 월 납입금이 줄어든다.
//   월 금리    i   연 금리(%) ÷ 100 ÷ 12
//
// [식]
//   기본 리스료   = (P − R ÷ (1+i)^n) × i ÷ (1 − (1+i)^−n)    (i가 0이면 (P − R) ÷ n)
//   선납금 차감   = S ÷ n
//   보증금 효과   = D × i
//   월 납입금액   = 기본 리스료 − 선납금 차감 − 보증금 효과
//   (각 항목을 먼저 원 단위로 반올림한 뒤 빼서, 화면에 보이는 숫자가 정확히 맞아떨어지게 한다.
//    정확한 값으로 한 번에 계산해서 반올림하는 것과 1원 정도 다를 수 있다.)
// 기본 리스료는 아이티해결단 사이트의 리스료 계산기와 같은 식이다.
//
// [넣지 않은 것] 부가세, 취득세·등록세, 보험료, 정비·수수료. 단순 계산이다.
// ============================================================================

/** 선택할 수 있는 리스 기간(개월) */
export const LEASE_TERMS = [12, 24, 36, 48, 60] as const;
export type LeaseTerm = (typeof LEASE_TERMS)[number];

/** 선납금, 보증금, 잔존가치에서 고를 수 있는 비율(%). 차량가격에 곱해서 금액을 채운다. */
export const LEASE_PERCENTS = [5, 10, 15, 20, 25, 30] as const;

/** 차량가격의 percent% 금액(원 단위 반올림). 예: percentAmount(28_760_000, 10) → 2876000 */
export function percentAmount(vehiclePrice: number, percent: number): number {
  return Math.round((vehiclePrice * percent) / 100);
}

export type LeaseInput = {
  vehiclePrice: number; // 차량가격(원)
  termMonths: number; // 기간(개월)
  prepaid: number; // 선납금(원)
  deposit: number; // 보증금(원)
  residual: number; // 잔존가치(원)
  annualRatePercent: number; // 연 금리(%)
};

/** 계산 결과. ok 가 true 면 금액이 있고, false 면 사용자에게 보여줄 이유가 있다. */
export type LeaseResult =
  | {
      ok: true;
      monthlyPayment: number; // 월 납입금액(원) = baseMonthly − prepaidDeduction − depositEffect
      baseMonthly: number; // 기본 리스료(원, 반올림)
      prepaidDeduction: number; // 선납금 차감(원, 반올림)
      depositEffect: number; // 보증금 효과(원, 반올림)
    }
  | { ok: false; error: string };

/** 입력값이 계산할 수 있는 값인지 검사한다. 문제가 있으면 이유 글자를, 없으면 null 을 돌려준다. */
function validate(input: LeaseInput): string | null {
  const { vehiclePrice, termMonths, prepaid, deposit, residual, annualRatePercent } = input;
  const numbers = [vehiclePrice, termMonths, prepaid, deposit, residual, annualRatePercent];
  if (!numbers.every(Number.isFinite)) return '입력값에 숫자가 아닌 값이 있습니다.';
  if (vehiclePrice <= 0) return '차량가격이 0원 이하입니다. 차량 선택을 확인해 주세요.';
  if (!Number.isInteger(termMonths) || termMonths <= 0) return '기간을 선택해 주세요.';
  if (prepaid < 0 || deposit < 0 || residual < 0) return '선납금, 보증금, 잔존가치는 0원 이상이어야 합니다.';
  if (annualRatePercent < 0 || annualRatePercent > 100) return '금리는 0% 이상 100% 이하로 입력해 주세요.';
  if (residual > vehiclePrice) return '잔존가치는 차량가격을 넘을 수 없습니다.';
  if (prepaid + deposit > vehiclePrice) return '선납금과 보증금의 합은 차량가격을 넘을 수 없습니다.';
  return null;
}

/** 월 납입금액을 계산한다. 입력이 잘못되었거나 결과가 0원 이하면 { ok: false, error } 를 돌려준다. */
export function calcLeasePayment(input: LeaseInput): LeaseResult {
  const error = validate(input);
  if (error) return { ok: false, error };

  const { vehiclePrice: P, termMonths: n, prepaid: S, deposit: D, residual: R, annualRatePercent } = input;
  const i = annualRatePercent / 100 / 12;

  // 1) 기본 리스료. 금리가 0이면 식의 분모가 0이 되므로 따로 계산한다. (차량가격에서 잔존가치를 뺀 만큼을 n개월로 나눔)
  const baseMonthly = i === 0 ? (P - R) / n : ((P - R / Math.pow(1 + i, n)) * i) / (1 - Math.pow(1 + i, -n));
  // 2) 선납금: 기간 동안 균등하게 나눠서 뺀다. 3) 보증금: 맡긴 돈의 월 이자만큼 뺀다.
  const prepaidDeduction = S / n;
  const depositEffect = D * i;

  // 항목별로 원 단위 반올림한 값으로 월 납입금액을 계산한다.
  const base = Math.round(baseMonthly);
  const prepaid = Math.round(prepaidDeduction);
  const deposit = Math.round(depositEffect);
  const monthly = base - prepaid - deposit;

  if (!Number.isFinite(monthly) || monthly <= 0) {
    return { ok: false, error: '입력하신 값으로는 월 납입금액이 0원 이하가 됩니다. 값을 확인해 주세요.' };
  }
  return { ok: true, monthlyPayment: monthly, baseMonthly: base, prepaidDeduction: prepaid, depositEffect: deposit };
}

/**
 * 입력 칸에 친 글자에서 숫자(금액)만 남긴다. "1,234원" → "1234". 너무 긴 입력은 12자리까지만 받는다.
 * 비어 있으면 빈 글자를 돌려준다.
 */
export function cleanAmountText(text: string): string {
  return text.replace(/[^0-9]/g, '').slice(0, 12);
}

/** 숫자 글자에 천 단위 쉼표를 넣는다. 입력 칸에 보여주는 용도다. "1234567" → "1,234,567", 빈 글자는 그대로 빈 글자 */
export function formatWithCommas(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 금리 입력 글자 정리: 숫자와 점 하나만 남기고, 소수 둘째 자리까지만 받는다. "5.256" → "5.25" */
export function cleanRateText(text: string): string {
  const only = text.replace(/[^0-9.]/g, '');
  const [intPart, ...rest] = only.split('.');
  if (rest.length === 0) return intPart.slice(0, 3);
  return `${intPart.slice(0, 3)}.${rest.join('').slice(0, 2)}`;
}

/** 입력 글자를 숫자로 바꾼다. 비어 있으면 fallback(기본 0)을 돌려준다. */
export function parseNumberText(text: string, fallback = 0): number {
  if (text.trim() === '' || text === '.') return fallback;
  return Number(text);
}
