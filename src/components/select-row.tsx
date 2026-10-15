import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SelectRowProps = {
  title: string;
  subtitle?: string;
  rightText?: string; // 가격 등
  selected: boolean;
  mode: 'radio' | 'check'; // radio: 하나만 선택, check: 여러 개 선택
  disabled?: boolean;
  onPress: () => void;
};

export function SelectRow({ title, subtitle, rightText, selected, mode, disabled, onPress }: SelectRowProps) {
  const theme = useTheme();
  const marker = mode === 'radio' ? (selected ? '◉' : '○') : selected ? '☑' : '☐';

  return (
    <Pressable
      accessibilityRole={mode === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ selected, checked: selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
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
