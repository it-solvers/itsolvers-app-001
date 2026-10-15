// ============================================================================
// "불러오는 중"과 "불러오지 못했습니다(다시 시도)" 화면. 데이터를 불러오는 모든 화면이 공통으로 쓴다.
// useLoad 훅이 알려주는 state 를 그대로 받아서, 상태에 맞는 화면을 그린다.
// ============================================================================

import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { LoadState } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';

type LoadStatusProps = {
  state: LoadState<unknown>; // useLoad 가 알려주는 상태 (loading / error / ready)
  loadingText: string; // 불러오는 중에 보여줄 문구 (화면마다 다르다: "차종을 불러오는 중입니다." 등)
  errorText: string; // 실패했을 때 보여줄 제목 문구
  onRetry: () => void; // "다시 시도" 버튼을 눌렀을 때 부를 함수
};

/** 불러오는 중, 오류 상태를 보여준다. 불러오기가 끝났으면(ready) 아무것도 그리지 않는다. */
export function LoadStatus({ state, loadingText, errorText, onRetry }: LoadStatusProps) {
  const theme = useTheme();
  // ready 면 이 컴포넌트는 그릴 것이 없다. (null 을 돌려주면 아무것도 그려지지 않는다)
  if (state.status === 'ready') return null;

  return (
    <ThemedView style={styles.center}>
      {state.status === 'loading' ? (
        <>
          {/* 빙글빙글 도는 로딩 표시 */}
          <ActivityIndicator size="large" color={theme.textSecondary} />
          <ThemedText themeColor="textSecondary">{loadingText}</ThemedText>
        </>
      ) : (
        <>
          <ThemedText style={styles.text}>{errorText}</ThemedText>
          {/* state.message: 실패한 구체적인 이유 (예: "네트워크에 연결할 수 없습니다.") */}
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
