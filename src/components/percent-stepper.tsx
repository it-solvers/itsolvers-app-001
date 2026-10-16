// ============================================================================
// 비율 스테퍼. 선수금, 보증금, 잔존가치의 비율(0%, 5% ... 90%)을 [−] [값] [+] 버튼으로 고른다.
//   - 누를 때마다 5%씩 바뀐다. 길게 누르고 있으면 빠르게 계속 바뀐다. (0% ~ 90%에서 멈춘다)
//   - 가운데 값은 크게 보여주고, 그 아래에 비율로 계산된 금액을 보여준다. 금액은 입력할 수 없다.
//   - 슬라이더는 눈금이 19개로 늘어나면 손가락으로 정확히 맞추기 어려워서, 크고 누르기 쉬운 버튼으로 바꿨다.
//   - 화면 낭독 기능에서는 "조절 가능한 값"으로 읽혀 위아래로 쓸어서 한 칸씩 조절할 수 있다.
// 새 패키지 없이 Pressable 의 onPress / onLongPress 로 만들었다.
// ============================================================================

import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/utils/price';

const BLUE = '#2563eb';
const REPEAT_MS = 120; // 길게 누르고 있을 때 값이 바뀌는 간격

type PercentStepperProps = {
  label: string; // 항목 이름 (예: "선수금")
  percents: readonly number[]; // 고를 수 있는 값들 (0, 5, ... 90)
  value: number; // 지금 선택된 비율(%)
  onChange: (percent: number) => void;
  amount: number; // 선택한 비율로 계산된 금액(원). 보여주기만 한다
};

export function PercentStepper({ label, percents, value, onChange, amount }: PercentStepperProps) {
  const theme = useTheme();
  const count = percents.length;
  const index = Math.max(0, percents.indexOf(value));

  // 길게 누르는 동안 반복해서 실행되는 타이머는 그 사이에 값이 바뀌므로, 항상 "최신 번호"를 ref 에 적어 두고 읽는다.
  const indexRef = useRef(index);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const step = (direction: 1 | -1) => {
    const next = indexRef.current + direction;
    if (next < 0 || next >= count) return;
    indexRef.current = next; // 다음 반복에서 바로 쓰도록 먼저 갱신
    onChange(percents[next]);
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
    const disabled = direction === 1 ? index >= count - 1 : index <= 0;
    const sign = direction === 1 ? '+' : '−';
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${direction === 1 ? '늘리기' : '줄이기'}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => step(direction)}
        // 0.3초 이상 누르면 반복 시작, 손을 떼면 멈춘다
        delayLongPress={300}
        onLongPress={() => startRepeat(direction)}
        onPressOut={stopRepeat}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed ? theme.backgroundSelected : theme.background, borderColor: theme.backgroundSelected, opacity: disabled ? 0.35 : 1 },
        ]}>
        <ThemedText style={styles.buttonText}>{sign}</ThemedText>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View
        style={styles.row}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${label} 비율`}
        accessibilityValue={{ min: percents[0], max: percents[count - 1], now: value, text: `${value}퍼센트, ${formatPrice(amount)}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}>
        {button(-1)}
        <View style={styles.center}>
          <ThemedText style={styles.percent}>{value}%</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {`= ${formatPrice(amount)}`}
          </ThemedText>
        </View>
        {button(1)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  // 누르기 쉬운 크기(48 이상)의 동그란 버튼
  button: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 28, lineHeight: 32, fontWeight: 500 },
  center: { flex: 1, alignItems: 'center' },
  percent: { color: BLUE, fontSize: 26, lineHeight: 32, fontWeight: 700 },
});
