import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { SectionList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataNotice } from '@/components/data-notice';
import { ListRow } from '@/components/list-row';
import { LoadStatus } from '@/components/load-status';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { getTrims } from '@/storage/vehicleData';
import type { Trim } from '@/types/car';

type Section = { title: string; data: Trim[] };

// 엔진별로 묶는다. (API가 준 순서를 유지)
function groupByEngine(trims: Trim[]): Section[] {
  const sections = new Map<string, Section>();
  for (const trim of trims) {
    const section = sections.get(trim.engineCode) ?? { title: trim.engineName, data: [] };
    section.data.push(trim);
    sections.set(trim.engineCode, section);
  }
  return [...sections.values()];
}

export default function TrimsScreen() {
  const { brand, car, carName } = useLocalSearchParams<{ brand?: string; car?: string; carName?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const load = useCallback(() => getTrims(car ?? ''), [car]);
  const { state, retry } = useLoad(load);
  const sections = useMemo(
    () => (state.status === 'ready' ? groupByEngine(state.result.data) : []),
    [state],
  );

  if (!car) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>차종 정보가 없습니다.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: carName ?? '트림 선택' }} />
      <LoadStatus
        state={state}
        loadingText="트림을 불러오는 중입니다."
        errorText="트림을 불러오지 못했습니다."
        onRetry={retry}
      />
      {state.status === 'ready' && (
        <SectionList
          sections={sections}
          keyExtractor={(trim) => trim.saleModelCode}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.four }]}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          renderSectionHeader={({ section }) => (
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
              {section.title}
            </ThemedText>
          )}
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              // 같은 이름의 트림이 있어서 구분용으로 모델 코드를 함께 보여준다.
              subtitle={`모델 코드 ${item.saleModelCode}`}
              onPress={() =>
                router.push({
                  pathname: '/price',
                  params: {
                    brand: brand ?? '',
                    saleModelCode: item.saleModelCode,
                    title: `${carName ?? ''} ${item.engineName} ${item.name}`.trim(),
                  },
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
            <ThemedText themeColor="textSecondary">표시할 트림이 없습니다.</ThemedText>
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
  header: { marginBottom: Spacing.two },
  sectionHeader: { marginTop: Spacing.three, marginBottom: Spacing.two },
});
