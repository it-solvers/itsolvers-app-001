// ============================================================================
// 비율 슬라이더. 선납금, 보증금, 잔존가치의 비율(0%, 5% ... 30%)을 막대를 끌어서 고른다.
//   - 눈금(점) 위치에 딱딱 맞춰 움직인다. (눈금 사이의 값은 고를 수 없다)
//   - 막대를 눌러도 가장 가까운 눈금으로 바로 간다.
//   - 위쪽에 "선택한 비율"과 "그 비율로 계산된 금액"을 함께 보여준다. 금액은 입력할 수 없다.
//   - 화면 낭독 기능(보이스오버/톡백)에서는 위아래로 쓸어서 한 칸씩 조절할 수 있다.
// 새 패키지 없이 React Native 기본 터치 이벤트(onTouchStart/onTouchMove: 손가락이 닿고 움직일 때 알려 주는 것)로 만들었다.
// ============================================================================

import { useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/utils/price';
import { snapIndex } from '@/utils/lease';

const THUMB = 28; // 동그란 손잡이 크기
const TRACK_HEIGHT = 6;
const TOUCH_HEIGHT = 44; // 누르기 쉬운 터치 영역 높이

type PercentSliderProps = {
  label: string; // 항목 이름 (예: "선납금")
  percents: readonly number[]; // 눈금 값들 (예: [0, 5, 10, 15, 20, 25, 30])
  value: number; // 지금 선택된 비율(%)
  onChange: (percent: number) => void;
  amount: number; // 선택한 비율로 계산된 금액(원). 보여주기만 한다
};

export function PercentSlider({ label, percents, value, onChange, amount }: PercentSliderProps) {
  const theme = useTheme();
  const count = percents.length;
  const index = Math.max(0, percents.indexOf(value));

  // 막대의 가로 길이는 화면에 그려진 뒤에야 알 수 있어서, onLayout 으로 받아 둔다.
  const [trackWidth, setTrackWidth] = useState(0);
  // 손가락(또는 마우스)이 막대 안에서 놓인 가로 위치를 가장 가까운 눈금으로 바꿔 선택한다.
  // locationX 는 이 막대의 왼쪽 끝에서 잰 가로 위치다. 이벤트 함수는 매번 새로 만들어지므로 항상 최신 값을 쓴다.
  const selectAt = (event: GestureResponderEvent) => {
    // 눈금은 막대 양쪽에서 손잡이 반지름(THUMB / 2)만큼 안쪽에 있으므로, 같은 만큼 빼서 눈금 위치와 맞춘다.
    const next = snapIndex(event.nativeEvent.locationX - THUMB / 2, trackWidth - THUMB, count);
    if (next !== index) onChange(percents[next]);
  };

  const onLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

  // 손잡이와 채워진 부분의 위치 계산 (막대 폭을 눈금 칸 수로 나눈다)
  const fraction = count > 1 ? index / (count - 1) : 0;
  const usable = Math.max(0, trackWidth - THUMB); // 손잡이가 막대 밖으로 나가지 않게 양쪽에 손잡이 반지름만큼 비워 둔다
  const thumbLeft = fraction * usable;

  return (
    <View style={styles.wrapper}>
      {/* 제목, 선택한 비율, 계산된 금액 */}
      <View style={styles.head}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="smallBold" style={styles.percent}>
          {value}%
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.amount}>
        {`= ${formatPrice(amount)}`}
      </ThemedText>

      {/*
        슬라이더 본체. accessibilityRole="adjustable" 은 화면 낭독 기능에 "조절할 수 있는 값"이라고 알려 준다.
        accessibilityActions 의 increment/decrement 가 위아래로 쓸었을 때 한 칸씩 움직이게 한다.
      */}
      <View
        style={styles.touch}
        onLayout={onLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${label} 비율`}
        accessibilityValue={{ min: percents[0], max: percents[count - 1], now: value, text: `${value}퍼센트, ${formatPrice(amount)}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const next = event.nativeEvent.actionName === 'increment' ? index + 1 : index - 1;
          if (next >= 0 && next < count) onChange(percents[next]);
        }}
        // 누르는 순간(Start)과 끌고 있는 동안(Move) 위치를 읽는다.
        // onStartShouldSetResponder: 누르는 순간부터 이 막대가 손가락을 맡고, 위쪽 스크롤 화면이 가로채지 못하게 한다.
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={selectAt}
        onResponderMove={selectAt}>
        {/* 막대(회색) */}
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]} pointerEvents="none" />
        {/* 지금 값까지 채워진 부분(파랑) */}
        <View
          pointerEvents="none"
          style={[styles.fill, { width: THUMB / 2 + thumbLeft }]}
        />
        {/* 눈금(작은 점) */}
        {percents.map((percent, i) => (
          <View
            key={percent}
            pointerEvents="none"
            style={[
              styles.tick,
              {
                left: (count > 1 ? i / (count - 1) : 0) * usable + THUMB / 2 - 2,
                backgroundColor: i <= index ? '#2563eb' : theme.textSecondary,
              },
            ]}
          />
        ))}
        {/* 손잡이(동그라미) */}
        <View pointerEvents="none" style={[styles.thumb, { left: thumbLeft, borderColor: '#2563eb' }]} />
      </View>

      {/* 눈금 글자 */}
      <View style={styles.labels} pointerEvents="none">
        {percents.map((percent) => (
          <ThemedText key={percent} type="small" themeColor="textSecondary" style={styles.labelText}>
            {percent}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  percent: { color: '#2563eb', fontSize: 18 },
  amount: { textAlign: 'right' },
  touch: { height: TOUCH_HEIGHT, justifyContent: 'center' },
  track: { position: 'absolute', left: THUMB / 2, right: THUMB / 2, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2 },
  fill: { position: 'absolute', left: THUMB / 2 - THUMB / 2, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, backgroundColor: '#2563eb' },
  tick: { position: 'absolute', width: 4, height: 4, borderRadius: 2, top: TOUCH_HEIGHT / 2 - 2 },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    top: (TOUCH_HEIGHT - THUMB) / 2,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: THUMB / 2 - 10 },
  labelText: { width: 20, textAlign: 'center' },
});
