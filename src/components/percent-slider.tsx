// ============================================================================
// 비율 슬라이더. 선수금, 보증금, 잔존가치 카드 안에서 차량가격 대비 비율(0% ~ 90%, 5% 단위)을 막대를 끌어서 고른다.
//   - 눈금(점) 19개에 딱딱 맞춰 움직인다. 막대를 눌러도 가장 가까운 눈금으로 바로 간다.
//   - 확대 효과: 손잡이에 가까운 눈금 점일수록 크게 보이고(돋보기처럼), 손잡이 위에는 지금 비율이 큰 글자로 떠 있다.
//     끌고 있는 동안에는 손잡이와 글자가 더 커진다.
//   - 눈금 숫자는 두지 않는다(지금 비율은 손잡이 위의 큰 글자로 보인다). 다만 범위를 알 수 있게 막대 양 끝 옆에 0과 90만 작게 둔다.
//   - 금액을 직접 입력해서 5% 단위가 아닌 비율(예: 32.5%)이 되면, 손잡이는 그 위치에 그대로 놓이고 글자도 32.5%로 보인다.
//   - 화면 낭독 기능(보이스오버/톡백)에서는 위아래로 쓸어서 5%씩 조절할 수 있다.
// 새 패키지 없이 React Native 기본 터치 이벤트(onResponder...: 손가락이 닿고 움직일 때 알려 주는 것)로 만들었다.
// 값(비율)은 부모가 들고 있고, 이 컴포넌트는 "바뀐 비율"만 알려 준다. (금액 계산은 부모의 일)
// ============================================================================

import { useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { snapIndex } from '@/utils/lease';

const BLUE = '#2563eb';
const STEP = 5; // 눈금 간격(%)
const MAX = 90; // 가장 큰 비율(%)
const COUNT = MAX / STEP + 1; // 눈금 개수 (0, 5, ... 90 → 19개)
const THUMB = 28; // 동그란 손잡이 크기
const TRACK_HEIGHT = 6;
const TOUCH_HEIGHT = 44; // 누르기 쉬운 터치 영역 높이
const BUBBLE_WIDTH = 72; // 비율 글자 알약의 폭
const BUBBLE_AREA = 40; // 손잡이 위에 뜨는 비율 글자 자리
const MAGNIFY_RANGE = 2.5; // 손잡이에서 눈금 몇 칸 안까지 점이 커지는지

type PercentSliderProps = {
  label: string; // 항목 이름 (화면 낭독용. 예: "선수금")
  percent: number; // 지금 비율(%). 5의 배수가 아니어도 된다 (예: 32.5)
  onChange: (percent: number) => void; // 5% 단위로 고른 비율
  disabled?: boolean; // true 면 흐리게 보이고 움직이지 않는다 (차량가격이 없을 때)
  percentText: string; // 손잡이 위에 크게 보일 글자 (예: "32.5%")
};

export function PercentSlider({ label, percent, onChange, disabled = false, percentText }: PercentSliderProps) {
  const theme = useTheme();
  // 막대의 가로 길이는 화면에 그려진 뒤에야 알 수 있어서, onLayout 으로 받아 둔다.
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false); // 끌고 있는 동안 손잡이와 글자를 더 크게

  const onLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

  // 손가락(또는 마우스)이 막대 안에서 놓인 가로 위치를 가장 가까운 눈금으로 바꿔 선택한다.
  // 눈금은 막대 양쪽에서 손잡이 반지름(THUMB / 2)만큼 안쪽에 있으므로, 같은 만큼 빼서 눈금 위치와 맞춘다.
  const selectAt = (event: GestureResponderEvent) => {
    if (disabled) return;
    const index = snapIndex(event.nativeEvent.locationX - THUMB / 2, trackWidth - THUMB, COUNT);
    const next = index * STEP;
    if (next !== percent) onChange(next);
  };

  // "눈금 번호"로 나타낸 손잡이 위치 (0 ~ 18, 소수 가능). 90%를 넘는 비율은 끝에 붙여 둔다.
  const position = Math.min(MAX, Math.max(0, percent)) / STEP;
  const usable = Math.max(0, trackWidth - THUMB);
  const xOf = (index: number) => (index / (COUNT - 1)) * usable + THUMB / 2; // 눈금 번호 → 가로 위치(중심)
  const thumbCenter = xOf(position);
  // 알약은 손잡이 위 가운데에 두되, 양 끝에서 막대 밖으로 삐져나가지 않게 가장자리 안쪽으로 맞춘다.
  const bubbleLeft = Math.min(Math.max(0, trackWidth - BUBBLE_WIDTH), Math.max(0, thumbCenter - BUBBLE_WIDTH / 2));

  return (
    // 가로 한 줄: [0] [막대(+ 위에 뜨는 글자)] [90]. 양 끝 숫자는 막대 옆에 붙여서 따로 한 줄을 차지하지 않는다.
    <View style={[styles.row, disabled && { opacity: 0.4 }]}>
      <View style={styles.endLabel} pointerEvents="none">
        <ThemedText type="small" themeColor="textSecondary" allowFontScaling={false}>
          0
        </ThemedText>
      </View>
      <View style={styles.middle} onLayout={onLayout}>
      {/* 손잡이 위에 떠 있는 비율 글자 (확대 효과). 손잡이를 따라 움직인다 */}
      <View style={styles.bubbleArea} pointerEvents="none">
        <View style={[styles.bubble, { left: bubbleLeft, transform: [{ scale: dragging ? 1.25 : 1 }] }]}>
          <ThemedText style={styles.bubbleText} allowFontScaling={false} numberOfLines={1}>{percentText}</ThemedText>
        </View>
      </View>

      <View
        style={styles.touch}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${label} 비율`}
        accessibilityValue={{ min: 0, max: MAX, now: Math.round(percent), text: `차량가격의 ${percentText}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (disabled) return;
          const index = Math.round(position) + (event.nativeEvent.actionName === 'increment' ? 1 : -1);
          if (index >= 0 && index < COUNT) onChange(index * STEP);
        }}
        // 누르는 순간부터 이 막대가 손가락을 맡고, 위쪽 스크롤 화면이 가로채지 못하게 한다.
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(event) => {
          setDragging(true);
          selectAt(event);
        }}
        onResponderMove={selectAt}
        onResponderRelease={() => setDragging(false)}
        onResponderTerminate={() => setDragging(false)}>
        {/* 막대(회색) */}
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]} pointerEvents="none" />
        {/* 지금 값까지 채워진 부분(파랑) */}
        <View pointerEvents="none" style={[styles.fill, { width: thumbCenter - THUMB / 2 }]} />
        {/* 눈금 점. 손잡이에 가까울수록 크게 보인다(확대 효과): 거리 0칸이면 3배, MAGNIFY_RANGE 칸 밖이면 원래 크기 */}
        {Array.from({ length: COUNT }, (_, i) => {
          const near = Math.max(0, 1 - Math.abs(i - position) / MAGNIFY_RANGE); // 0(멀다) ~ 1(손잡이 위)
          const size = 4 + near * 8;
          return (
            <View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                left: xOf(i) - size / 2,
                top: TOUCH_HEIGHT / 2 - size / 2,
                backgroundColor: i <= position ? BLUE : theme.textSecondary,
                opacity: near > 0.05 ? 1 : 0.7,
              }}
            />
          );
        })}
        {/* 손잡이(동그라미). 끌고 있으면 더 크게 */}
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: thumbCenter - THUMB / 2, transform: [{ scale: dragging ? 1.3 : 1 }] }]}
        />
      </View>

      </View>
      <View style={styles.endLabel} pointerEvents="none">
        <ThemedText type="small" themeColor="textSecondary" allowFontScaling={false}>
          {MAX}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  middle: { flex: 1, gap: 2 },
  // 막대 높이에 맞춰 세로 가운데에 놓는 양 끝 숫자(0, 90)
  endLabel: { width: 24, height: TOUCH_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  bubbleArea: { height: BUBBLE_AREA, justifyContent: 'flex-end' },
  // 비율 글자를 담는 파란 알약. left 는 계산해서 넣는다(bubbleLeft).
  bubble: {
    position: 'absolute',
    bottom: 4,
    width: BUBBLE_WIDTH,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: BLUE,
  },
  bubbleText: { color: '#ffffff', fontSize: 18, lineHeight: 24, fontWeight: 800 },
  touch: { height: TOUCH_HEIGHT, justifyContent: 'center' },
  track: { position: 'absolute', left: THUMB / 2, right: THUMB / 2, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2 },
  fill: { position: 'absolute', left: THUMB / 2, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, backgroundColor: BLUE },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: BLUE,
    top: (TOUCH_HEIGHT - THUMB) / 2,
  },
});
