import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void; // 없으면 눌러도 반응하지 않는 행
};

export function ListRow({ title, subtitle, onPress }: ListRowProps) {
  const theme = useTheme();
  const content = (
    <>
      <View style={styles.texts}>
        <ThemedText type="default">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {onPress ? <ThemedText themeColor="textSecondary">›</ThemedText> : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56, // 누르기 쉬운 터치 영역
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: Spacing.half,
  },
});
