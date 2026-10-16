// ============================================================================
// 리스료 견적을 카카오톡, 문자, 메모 등으로 보낼 "글자"로 만든다. 이미지 저장 없이 글자 공유만 한다.
// 순수 함수라서 값을 넣어 보며 모양을 확인하기 쉽다. 보내는 동작(공유창 열기)은 utils/share.ts 가 한다.
// 학습용 앱이므로 "실제 견적이 아니다"라는 문구를 반드시 끝에 넣는다.
// ============================================================================

import { SITE_URL } from '@/constants/site';
import { formatPrice } from '@/utils/price';

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
  const lines: string[] = ['🚗 리스료 견적 (학습용)', LINE];
  if (vehicleLines.length > 0) {
    lines.push(...vehicleLines, '');
  }
  lines.push(
    `💰 차량가격  ${formatPrice(vehiclePrice)}`,
    '',
    `📅 기간  ${termMonths}개월`,
    `선수금  ${amountWithPercent(prepaid, vehiclePrice)}`,
    `보증금  ${amountWithPercent(deposit, vehiclePrice)}`,
    `잔존가치  ${amountWithPercent(residual, vehiclePrice)}`,
    `금리  연 ${annualRatePercent}%`,
    LINE,
    `✅ 월 납입금액  ${formatPrice(monthlyPayment)}`,
    LINE,
    '※ 학습용 참고 금액입니다. 실제 견적과 다를 수 있으며, 부가세·취득세·보험료·수수료는 포함하지 않았습니다.',
    SITE_URL,
  );
  return lines.join('\n');
}
