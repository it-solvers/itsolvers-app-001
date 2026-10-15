// ============================================================================
// 트림 선택 화면 ("/trims?brand=...&car=...&carName=...").
// 차종 화면과 같은 패턴(불러오기 → 상태별 표시)이고, 두 가지가 더 있다.
//   - 트림을 "엔진별로 묶어서" 보여준다 (SectionList)
//   - 이름이 같은 트림(자가용/장애인용 등)을 구분할 수 있게 구매 용도와 모델 코드를 함께 보여준다
// 트림을 누르면 가격 화면("/price")으로 이동한다.
// ============================================================================

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { SectionList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataNotice } from '@/components/data-notice';
import { ListRow } from '@/components/list-row';
import { LoadStatus } from '@/components/load-status';
import { RemoteImage } from '@/components/remote-image';
import { StudyNotice } from '@/components/study-notice';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { getTrims } from '@/storage/vehicleData';
import type { Trim } from '@/types/car';
import { carImageUrl } from '@/utils/images';
import { trimPurposeName } from '@/utils/trim';

// SectionList 가 요구하는 묶음 모양: 제목(title)과 그 아래 항목들(data)
type Section = { title: string; data: Trim[] };

// 엔진별로 묶는다. (API가 준 순서를 유지)
// Map 은 "열쇠 → 값" 표다. 트림을 하나씩 보면서 그 엔진의 묶음이 이미 있으면 거기에 추가하고,
// 없으면 새 묶음을 만든다. Map 은 처음 넣은 순서를 기억하므로 API가 준 엔진 순서가 유지된다.
function groupByEngine(trims: Trim[]): Section[] {
  const sections = new Map<string, Section>();
  for (const trim of trims) {
    const section = sections.get(trim.engineCode) ?? { title: trim.engineName, data: [] };
    section.data.push(trim);
    sections.set(trim.engineCode, section);
  }
  return [...sections.values()];
}

// 가격 화면 제목. 자가용이 아닌 트림은 용도를 덧붙여 구분한다.
// 예) "디 올 뉴 아반떼 가솔린 모던 (장애인)"
function priceTitle(carName: string | undefined, trim: Trim): string {
  const purpose = trimPurposeName(trim.saleModelCode);
  const suffix = purpose && purpose !== '자가용' ? ` (${purpose})` : '';
  return `${carName ?? ''} ${trim.engineName} ${trim.name}${suffix}`.trim();
}

export default function TrimsScreen() {
  // 차종 화면이 넘긴 값들. car 는 트림을 조회하는 열쇠이고, brand 와 carName 은 다음 화면으로 그대로 이어서 넘긴다.
  const { brand, car, carName } = useLocalSearchParams<{ brand?: string; car?: string; carName?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // car 가 바뀌면(다른 차종으로 들어오면) 새 함수가 만들어져서 useLoad 가 다시 불러온다.
  const load = useCallback(() => getTrims(car ?? ''), [car]);
  const { state, retry } = useLoad(load);
  // useMemo: 계산 결과를 기억해 두고, [state] 가 바뀔 때만 다시 계산한다. (화면이 다시 그려질 때마다 묶는 계산을 반복하지 않으려는 것)
  const sections = useMemo(
    () => (state.status === 'ready' ? groupByEngine(state.result.data) : []),
    [state],
  );

  // 차종 정보 없이 이 화면에 들어온 경우의 안내
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
      {/* 앱 기본 제목줄(뒤로 가기 + 제목) 아래에 "학습용" 안내 배너 */}
      <StudyNotice />
      <LoadStatus
        state={state}
        loadingText="트림을 불러오는 중입니다."
        errorText="트림을 불러오지 못했습니다."
        onRetry={retry}
      />
      {state.status === 'ready' && (
        // SectionList: FlatList 처럼 목록이지만 "제목이 붙은 묶음"으로 나눠 보여준다.
        // stickySectionHeadersEnabled={false}: 묶음 제목이 스크롤할 때 화면 위에 붙어 있지 않게 한다.
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
              // 같은 이름의 트림이 있어서(자가용/장애인용 등) 구매 용도와 모델 코드를 함께 보여준다.
              // filter(Boolean) 은 용도를 알 수 없어 null 인 항목을 걸러낸다.
              subtitle={[trimPurposeName(item.saleModelCode), `모델 코드 ${item.saleModelCode}`]
                .filter(Boolean)
                .join(' · ')}
              // 가격 화면에는 트림 코드(saleModelCode)로 가격을 조회하고, 나머지는 제목과
              // 차량 선택 완료 화면에서 쓸 이름들이다. 주소 값은 글자만 전달할 수 있어서 없는 값은 빈 글자('')로 보낸다.
              onPress={() =>
                router.push({
                  pathname: '/price',
                  params: {
                    brand: brand ?? '',
                    car: car ?? '', // 가격 화면에서 차량 이미지와 색상 이미지 주소를 만드는 데 쓴다
                    saleModelCode: item.saleModelCode,
                    title: priceTitle(carName, item),
                    carName: carName ?? '',
                    engineName: item.engineName,
                    trimName: item.name,
                  },
                })
              }
            />
          )}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              {/* 목록 맨 위에 선택한 차종의 이미지를 보여준다 (흰 바탕 위) */}
              <ThemedView style={styles.carImageArea}>
                <RemoteImage uri={carImageUrl(car)} label={carName} style={styles.carImage} />
              </ThemedView>
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
  header: { marginBottom: Spacing.two, gap: Spacing.two },
  carImageArea: {
    backgroundColor: '#ffffff',
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
  },
  carImage: { width: '100%', height: 150 },
  sectionHeader: { marginTop: Spacing.three, marginBottom: Spacing.two },
});
