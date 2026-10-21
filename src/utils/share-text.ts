// ============================================================================
// 리스료 견적을 카카오톡, 문자, 메모 등으로 보낼 "글자"로 만든다. 이미지 저장 없이 글자 공유만 한다.
// 순수 함수라서 값을 넣어 보며 모양을 확인하기 쉽다. 보내는 동작(공유창 열기)은 utils/share.ts 가 한다.
// 학습용 앱이므로 "실제 견적이 아니다"라는 문구를 반드시 끝에 넣는다.
// ============================================================================

import { KRW_PER_USD } from '@/constants/currency';
import { SITE_URL } from '@/constants/site';
import { t } from '@/i18n';
import { formatPrice, withCommas } from '@/utils/price';

export type ShareTextInput = {
  vehicleLines: string[]; // 차량 정보 줄들 (직접 입력 모드에서는 빈 배열)
  vehiclePrice: number;
  termMonths: number;
  prepaid: number; // 선수금(원)
  deposit: number; // 보증금(원)
  residual: number; // 잔존가치(원)
  annualRatePercent: number;
  monthlyPayment: number;
};

const LINE = '━━━━━━━━━━━━━━';

/** 금액과 차량가격 대비 비율을 함께 보여준다. 예) "2,876,000원 (10%)". 0원이면 "0원" */
function amountWithPercent(amount: number, vehiclePrice: number): string {
  if (!(amount > 0) || !(vehiclePrice > 0)) return formatPrice(amount);
  return `${formatPrice(amount)} (${Math.round((amount / vehiclePrice) * 1000) / 10}%)`;
}

export function buildLeaseShareText(input: ShareTextInput): string {
  const { vehicleLines, vehiclePrice, termMonths, prepaid, deposit, residual, annualRatePercent, monthlyPayment } = input;
  const lines: string[] = [t('share.title'), LINE];
  if (vehicleLines.length > 0) {
    lines.push(...vehicleLines, '');
  }
  lines.push(
    t('share.price', { amount: formatPrice(vehiclePrice) }),
    '',
    t('share.term', { months: termMonths }),
    t('share.prepaid', { value: amountWithPercent(prepaid, vehiclePrice) }),
    t('share.deposit', { value: amountWithPercent(deposit, vehiclePrice) }),
    t('share.residual', { value: amountWithPercent(residual, vehiclePrice) }),
    t('share.rate', { rate: annualRatePercent }),
    LINE,
    t('share.monthly', { amount: formatPrice(monthlyPayment) }),
    LINE,
    t('share.footnote', { rate: withCommas(KRW_PER_USD) }),
    SITE_URL,
  );
  return lines.join('\n');
}
