// ============================================================================
// 숫자를 입력하는 칸(제목 + 입력 + 단위). 리스료 계산의 선납금, 보증금, 잔존가치, 금리에 쓴다.
//   kind="amount"  금액(원): 숫자만 받고 천 단위 쉼표를 붙여 보여준다.  예) 3600000 → 3,600,000
//   kind="rate"    금리(%): 숫자와 소수점(둘째 자리까지)을 받는다.      예) 5.25
// 부모 화면이 값(value)을 들고 있고, 이 컴포넌트는 "입력이 바뀌었다"는 것만 알려 준다.
// (이렇게 값을 부모가 들고 있는 입력 칸을 "제어되는 입력"이라고 부른다)
// ============================================================================

import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cleanAmountText, cleanRateText, formatWithCommas } from '@/utils/lease';

type AmountInputProps = {
  label: string; // 입력 칸 제목 (예: "선납금")
  unit: string; // 단위 글자 (예: "원", "%")
  kind: 'amount' | 'rate';
  value: string; // 입력된 글자. 금액이면 숫자만("3600000"), 금리면 "5.25"처럼 들어 있다
  onChangeText: (cleaned: string) => void; // 정리된 글자를 부모에게 돌려준다
  placeholder?: string;
  hint?: string; // 칸 아래의 작은 설명
};

export function AmountInput({ label, unit, kind, value, onChangeText, placeholder, hint }: AmountInputProps) {
  const theme = useTheme();
  // 금액은 쉼표를 붙여 보여주고, 금리는 그대로 보여준다.
  const shown = kind === 'amount' ? formatWithCommas(value) : value;

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View style={[styles.field, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
        <TextInput
          // 화면 낭독 기능이 칸의 이름을 읽을 수 있게 한다
          accessibilityLabel={`${label} (${unit})`}
          value={shown}
          // 사용자가 글자를 바꿀 때마다 숫자 외의 글자를 걸러서 부모에게 알린다
          onChangeText={(text) => onChangeText(kind === 'amount' ? cleanAmountText(text) : cleanRateText(text))}
          // 숫자 키패드를 띄운다. 금리는 소수점이 필요해서 decimal-pad
          keyboardType={kind === 'amount' ? 'number-pad' : 'decimal-pad'}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
        <ThemedText themeColor="textSecondary">{unit}</ThemedText>
      </View>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one },
  field: {
    minHeight: 52, // 누르기 쉬운 터치 영역
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.three,
  },
  input: { flex: 1, fontSize: 18, paddingVertical: Spacing.two, textAlign: 'right' },
});
