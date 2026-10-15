// ============================================================================
// 선택 목록의 한 줄. 가격 화면의 사양, 옵션, 색상 목록에서 쓴다.
// 왼쪽에 선택 표시(◉ ○ ☑ ☐), 가운데에 이름, 오른쪽에 가격이 보인다.
// ============================================================================

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SelectRowProps = {
  title: string;
  subtitle?: string;
  rightText?: string; // 가격 등
  selected: boolean; // 지금 선택되어 있는지 (이 값은 부모 화면이 정한다)
  mode: 'radio' | 'check'; // radio: 하나만 선택, check: 여러 개 선택
  disabled?: boolean; // true 면 흐리게 보이고 눌러도 반응하지 않는다
  onPress: () => void;
};

export function SelectRow({ title, subtitle, rightText, selected, mode, disabled, onPress }: SelectRowProps) {
  const theme = useTheme();
  // 선택 표시 글자. 라디오는 ◉(선택) / ○(미선택), 체크는 ☑(선택) / ☐(미선택).
  const marker = mode === 'radio' ? (selected ? '◉' : '○') : selected ? '☑' : '☐';

  return (
    <Pressable
      // 화면 낭독 기능이 "라디오 버튼" / "체크박스"와 선택·비활성 상태를 읽어 줄 수 있게 알려 준다.
      accessibilityRole={mode === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ selected, checked: selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          // 눌리고 있거나 선택된 행은 진한 배경, 비활성은 투명도를 낮춰 흐리게 보인다.
          backgroundColor: pressed || selected ? theme.backgroundSelected : theme.backgroundElement,
          opacity: disabled ? 0.45 : 1,
        },
      ]}>
      <ThemedText style={styles.marker}>{marker}</ThemedText>
      <View style={styles.texts}>
        <ThemedText type="default">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {rightText ? (
        <ThemedText type="small" themeColor="textSecondary">
          {rightText}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56, // 누르기 쉬운 터치 영역
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  marker: { fontSize: 20, lineHeight: 24 },
  texts: { flex: 1, gap: Spacing.half },
});
