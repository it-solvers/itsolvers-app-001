import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { LoadState } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';

type LoadStatusProps = {
  state: LoadState<unknown>;
  loadingText: string;
  errorText: string;
  onRetry: () => void;
};

/** 불러오는 중, 오류 상태를 보여준다. 불러오기가 끝났으면(ready) 아무것도 그리지 않는다. */
export function LoadStatus({ state, loadingText, errorText, onRetry }: LoadStatusProps) {
  const theme = useTheme();
  if (state.status === 'ready') return null;

  return (
    <ThemedView style={styles.center}>
      {state.status === 'loading' ? (
        <>
          <ActivityIndicator size="large" color={theme.textSecondary} />
          <ThemedText themeColor="textSecondary">{loadingText}</ThemedText>
        </>
      ) : (
        <>
          <ThemedText style={styles.text}>{errorText}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
            {state.message}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={[styles.retry, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText>다시 시도</ThemedText>
          </Pressable>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  text: { textAlign: 'center' },
  retry: {
    marginTop: Spacing.three,
    minHeight: 48, // 누르기 쉬운 터치 영역
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
});
