// ============================================================================
// 금액이 주인인 입력 칸 + 비율 슬라이더. 선수금, 보증금, 잔존가치에 쓴다.
//   - 금액(원)을 직접 입력하는 것이 기본이다. 고객이 "1000만원으로 할게요"처럼 금액으로 말하는 경우가 많기 때문이다.
//   - 칸 아래의 슬라이더(components/percent-slider.tsx)는 금액을 빠르게 정하는 도구다. 끌면 차량가격의 5% 단위(0~90%) 금액이 칸에 들어간다.
//     손잡이에 닿은 비율은 크게 확대되어 보인다.
//   - 슬라이더의 비율은 "입력한 금액 ÷ 차량가격"으로 다시 계산한다. (금액을 바꾸면 손잡이가 따라 움직인다. 예: 32.5%)
//   - 금액 입력은 90%를 넘겨도 되지만, 차량가격을 넘는 값은 계산 단계의 검증이 막는다.
// 항목마다 제목이 큰 카드로 따로 보여서 선수금, 보증금, 잔존가치가 헷갈리지 않는다.
// 값(글자)은 부모 화면이 들고 있다. 이 컴포넌트는 "바뀐 금액 글자"만 부모에게 알려 준다.
// ============================================================================

import { StyleSheet, View } from 'react-native';

import { AmountInput } from '@/components/amount-input';
import { PercentSlider } from '@/components/percent-slider';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { percentAmount } from '@/utils/lease';

type AmountPercentFieldProps = {
  label: string; // 항목 이름 (예: "선수금")
  vehiclePrice: number; // 비율의 기준이 되는 차량가격(원). 0이면 슬라이더는 쓸 수 없다
  amountText: string; // 입력된 금액 글자. 숫자만("10000000"), 비어 있으면 "" (= 0원)
  onChangeAmount: (digits: string) => void;
  hint?: string; // 칸 아래의 작은 설명
};

/** 입력한 금액이 차량가격의 몇 %인지 (원 단위 입력이라 소수가 나올 수 있다) */
function toPercent(amount: number, price: number): number {
  return price > 0 ? (amount / price) * 100 : 0;
}

/** 화면에 보일 비율 글자. 소수 첫째 자리까지, 뒤의 .0은 뺀다. 34.77 → "34.8%", 15 → "15%" */
function formatPercent(percent: number): string {
  return `${Math.round(percent * 10) / 10}%`;
}

export function AmountPercentField({ label, vehiclePrice, amountText, onChangeAmount, hint }: AmountPercentFieldProps) {
  const theme = useTheme();
  const amount = amountText === '' ? 0 : Number(amountText);
  const percent = toPercent(amount, vehiclePrice);
  const hasPrice = vehiclePrice > 0;

  // 슬라이더로 고른 비율 → 차량가격의 그 비율만큼의 금액을 칸에 넣는다. (0원이면 칸을 비운다)
  const onSlide = (next: number) => {
    const nextAmount = percentAmount(vehiclePrice, next);
    onChangeAmount(nextAmount === 0 ? '' : String(nextAmount));
  };

  return (
    // 항목마다 따로 보이는 카드. 큰 제목으로 어느 항목의 입력인지 분명히 한다.
    <View style={[styles.wrapper, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
      <ThemedText type="subtitle" style={styles.title} accessibilityRole="header">
        {label}
      </ThemedText>
      {/* 주인공: 금액 입력 칸 (제목은 위에서 크게 보여주므로 칸의 작은 제목은 숨긴다) */}
      <AmountInput
        showLabel={false}
        label={label}
        unit="원"
        kind="amount"
        value={amountText}
        onChangeText={onChangeAmount}
        placeholder="0"
        hint={hint}
      />
      {/* 도구: 비율 슬라이더. 손잡이는 입력한 금액에서 거꾸로 계산한 비율에 놓인다 */}
      <View style={styles.sliderHead}>
        <ThemedText type="small" themeColor="textSecondary">
          차량가격 대비 비율
        </ThemedText>
      </View>
      <PercentSlider
        label={label}
        percent={percent}
        percentText={formatPercent(percent)}
        onChange={onSlide}
        disabled={!hasPrice}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two, padding: Spacing.three, borderWidth: 1, borderRadius: Spacing.three },
  title: { fontSize: 22, lineHeight: 30 },
  sliderHead: { marginTop: Spacing.one },
});
