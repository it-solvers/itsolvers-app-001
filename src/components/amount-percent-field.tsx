// ============================================================================
// 금액이 주인인 입력 칸 + 비율 버튼. 선수금, 보증금, 잔존가치에 쓴다.
//   - 금액(원)을 직접 입력하는 것이 기본이다. 고객이 "1000만원으로 할게요"처럼 금액으로 말하는 경우가 많기 때문이다.
//   - 칸 아래의 [−] 비율 [+] 버튼은 금액을 빠르게 정하는 도구다. 누르면 차량가격의 5% 단위 금액이 칸에 들어간다.
//   - 가운데 비율은 "입력한 금액 ÷ 차량가격"으로 다시 계산해 보여준다. (금액을 바꾸면 비율이 따라 바뀐다. 예: 34.8%)
//   - 금액이 5% 단위에 딱 맞지 않을 때 [+]는 바로 위 5% 단위로, [−]는 바로 아래 5% 단위로 간다.
//   - 길게 누르고 있으면 빠르게 계속 바뀐다. 0%에서 90%(STEP_MAX)까지 버튼으로 움직일 수 있다.
//     (금액 입력은 90%를 넘겨도 되지만, 차량가격을 넘는 값은 계산 단계의 검증이 막는다.)
// 값(글자)은 부모 화면이 들고 있다. 이 컴포넌트는 "바뀐 금액 글자"만 부모에게 알려 준다.
// ============================================================================

import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AmountInput } from '@/components/amount-input';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { percentAmount } from '@/utils/lease';

const BLUE = '#2563eb';
const REPEAT_MS = 120; // 길게 누르고 있을 때 값이 바뀌는 간격
const STEP = 5; // 버튼 한 번에 바뀌는 비율(%)
const STEP_MAX = 90; // 버튼으로 갈 수 있는 가장 큰 비율(%)
const EPS = 1e-9; // 소수 계산 오차 방지

type AmountPercentFieldProps = {
  label: string; // 항목 이름 (예: "선수금")
  vehiclePrice: number; // 비율의 기준이 되는 차량가격(원). 0이면 비율 버튼은 쓸 수 없다
  amountText: string; // 입력된 금액 글자. 숫자만("10000000"), 비어 있으면 "" (= 0원)
  onChangeAmount: (digits: string) => void;
  hint?: string; // 칸 아래의 작은 설명
};

/** 입력한 금액이 차량가격의 몇 %인지 (원 단위 입력이라 소수가 나올 수 있다) */
function toPercent(amount: number, price: number): number {
  return price > 0 ? (amount / price) * 100 : 0;
}

/** 화면에 보일 비율 글자. 소수 첫째 자리까지, 뒤의 .0은 뺀다. 34.77 → "34.8", 15 → "15" */
function formatPercent(percent: number): string {
  return String(Math.round(percent * 10) / 10);
}

export function AmountPercentField({ label, vehiclePrice, amountText, onChangeAmount, hint }: AmountPercentFieldProps) {
  const theme = useTheme();
  const amount = amountText === '' ? 0 : Number(amountText);
  const percent = toPercent(amount, vehiclePrice);
  const hasPrice = vehiclePrice > 0;

  // 길게 누르는 동안 반복되는 타이머는 그 사이에 바뀐 값을 알아야 하므로, 항상 "최신 값"을 ref 에 적어 두고 읽는다.
  const latest = useRef({ amount, vehiclePrice, onChangeAmount });
  useEffect(() => {
    latest.current = { amount, vehiclePrice, onChangeAmount };
  }, [amount, vehiclePrice, onChangeAmount]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = (direction: 1 | -1) => {
    const { amount: now, vehiclePrice: price, onChangeAmount: change } = latest.current;
    if (!(price > 0)) return;
    const p = toPercent(now, price);
    // 지금 비율의 바로 위/아래 5% 단위. 예) 34.8% → 위 35%, 아래 30% / 정확히 35% → 위 40%, 아래 30%
    const next =
      direction === 1 ? (Math.floor(p / STEP + EPS) + 1) * STEP : (Math.ceil(p / STEP - EPS) - 1) * STEP;
    if (next < 0 || next > STEP_MAX) return;
    const nextAmount = percentAmount(price, next);
    latest.current.amount = nextAmount; // 다음 반복에서 바로 쓰도록 먼저 갱신
    change(nextAmount === 0 ? '' : String(nextAmount));
  };
  const stopRepeat = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  const startRepeat = (direction: 1 | -1) => {
    stopRepeat();
    timer.current = setInterval(() => step(direction), REPEAT_MS);
  };
  // 화면을 벗어날 때 타이머를 정리한다
  useEffect(() => stopRepeat, []);

  const button = (direction: 1 | -1) => {
    // 더 못 가는 쪽은 흐리게 하고 누를 수 없게 한다
    const disabled = !hasPrice || (direction === 1 ? percent >= STEP_MAX - EPS : amount <= 0);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${direction === 1 ? '5퍼센트 늘리기' : '5퍼센트 줄이기'}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => step(direction)}
        // 0.3초 이상 누르면 반복 시작, 손을 떼면 멈춘다
        delayLongPress={300}
        onLongPress={() => startRepeat(direction)}
        onPressOut={stopRepeat}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed ? theme.backgroundSelected : theme.background,
            borderColor: theme.backgroundSelected,
            opacity: disabled ? 0.35 : 1,
          },
        ]}>
        <ThemedText style={styles.buttonText}>{direction === 1 ? '+' : '−'}</ThemedText>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* 주인공: 금액 입력 칸 */}
      <AmountInput
        label={label}
        unit="원"
        kind="amount"
        value={amountText}
        onChangeText={onChangeAmount}
        placeholder="0"
        hint={hint}
      />
      {/* 도구: 비율로 빠르게 정하기. 가운데는 입력한 금액에서 거꾸로 계산한 비율 */}
      <View
        style={styles.row}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${label} 비율`}
        accessibilityValue={{ text: `차량가격의 ${formatPercent(percent)}퍼센트` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}>
        {button(-1)}
        <View style={styles.center}>
          <ThemedText style={styles.percent}>{formatPercent(percent)}%</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            차량가격 대비
          </ThemedText>
        </View>
        {button(1)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  // 누르기 쉬운 크기(48 이상)의 동그란 버튼
  button: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 26, lineHeight: 30, fontWeight: 500 },
  center: { flex: 1, alignItems: 'center' },
  percent: { color: BLUE, fontSize: 22, lineHeight: 28, fontWeight: 700 },
});
