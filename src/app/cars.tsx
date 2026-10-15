import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataNotice } from '@/components/data-notice';
import { ListRow } from '@/components/list-row';
import { LoadStatus } from '@/components/load-status';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { findBrand } from '@/constants/brands';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { getCars } from '@/storage/vehicleData';

export default function CarsScreen() {
  const { brand: brandParam } = useLocalSearchParams<{ brand?: string }>();
  const brand = findBrand(brandParam);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const load = useCallback(() => getCars(), []);
  const { state, retry } = useLoad(load);

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
      <LoadStatus
        state={state}
        loadingText="차종을 불러오는 중입니다."
        errorText="차종을 불러오지 못했습니다."
        onRetry={retry}
      />
      {state.status === 'ready' && (
        <FlatList
          data={state.result.data}
          keyExtractor={(car) => car.code}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.four }]}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              onPress={() =>
                router.push({
                  pathname: '/trims',
                  params: { brand: brand.id, car: item.code, carName: item.name },
                })
              }
            />
          )}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <DataNotice result={state.result} />
            </ThemedView>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  list: {
    padding: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  separator: { height: Spacing.two },
  header: { marginBottom: Spacing.three },
});
