import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { findBrand } from '@/constants/brands';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCars } from '@/storage/vehicleData';
import type { LoadResult } from '@/storage/cache';
import type { Car } from '@/types/car';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; result: LoadResult<Car[]> };

export default function CarsScreen() {
  const { brand: brandParam } = useLocalSearchParams<{ brand?: string }>();
  const brand = findBrand(brandParam);
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', result: await getCars() });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    }
  }, []);

  useEffect(() => {
    if (brand) load();
  }, [brand, load]);

  if (!brand) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>지원하지 않는 제조사입니다.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `${brand.name} 차종` }} />

      {state.status === 'loading' && (
        <ThemedView style={styles.center}>
          <ActivityIndicator size="large" color={theme.textSecondary} />
          <ThemedText themeColor="textSecondary">차종을 불러오는 중입니다.</ThemedText>
        </ThemedView>
      )}

      {state.status === 'error' && (
        <ThemedView style={styles.center}>
          <ThemedText style={styles.centerText}>차종을 불러오지 못했습니다.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            {state.message}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={load}
            style={[styles.retry, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText>다시 시도</ThemedText>
          </Pressable>
        </ThemedView>
      )}

      {state.status === 'ready' && (
        <FlatList
          data={state.result.data}
          keyExtractor={(car) => car.code}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.four }]}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          renderItem={({ item }) => <ListRow title={item.name} />}
          ListHeaderComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.header}>
              {state.result.source === 'stale-cache'
                ? `인터넷에 연결할 수 없어 ${state.result.fetchedDate}에 저장한 데이터를 보여줍니다. (${state.result.errorMessage})`
                : `데이터 기준일: ${state.result.fetchedDate}`}
              {state.result.saveFailed ? ' (기기에 저장하지 못했습니다.)' : ''}
            </ThemedText>
          }
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary">표시할 차종이 없습니다.</ThemedText>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  centerText: { textAlign: 'center' },
  retry: {
    marginTop: Spacing.three,
    minHeight: 48, // 누르기 쉬운 터치 영역
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  list: {
    padding: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  separator: { height: Spacing.two },
  header: { marginBottom: Spacing.three },
});
