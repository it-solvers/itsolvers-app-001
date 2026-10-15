// ============================================================================
// 목록의 한 줄(행). 제조사, 차종, 트림 목록이 모두 이 컴포넌트를 쓴다.
// 컴포넌트 = 화면 조각. 같은 모양을 여러 화면에서 쓰려고 한 번만 만들어 두었다.
// ============================================================================

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 컴포넌트가 받는 값(props)의 모양. ? 가 붙은 것은 생략할 수 있다.
type ListRowProps = {
  title: string; // 크게 보이는 글자
  subtitle?: string; // 그 아래 작게 보이는 보조 글자
  onPress?: () => void; // 없으면 눌러도 반응하지 않는 행
  leading?: ReactNode; // 글자 왼쪽에 놓을 그림 (예: 제조사 엠블럼)
};

export function ListRow({ title, subtitle, onPress, leading }: ListRowProps) {
  // 라이트/다크 모드에 맞는 색상 표
  const theme = useTheme();
  // 행의 안쪽 내용. 눌리는 행과 눌리지 않는 행이 같은 내용을 쓰므로 변수에 담아 재사용한다.
  const content = (
    <>
      {leading}
      <View style={styles.texts}>
        <ThemedText type="default">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {/* 눌리는 행에만 오른쪽에 '›' 화살표를 붙여 "누르면 다음으로 간다"는 것을 알려 준다 */}
      {onPress ? <ThemedText themeColor="textSecondary">›</ThemedText> : null}
    </>
  );

  // 눌러도 되는 동작(onPress)이 없으면 일반 상자로, 있으면 눌림 효과가 있는 Pressable 로 그린다.
  if (!onPress) {
    return <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      // 누르고 있는 동안(pressed)에는 배경색을 살짝 진하게 바꿔 눌렸다는 피드백을 준다.
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
