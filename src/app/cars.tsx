// ============================================================================
// 차종 선택 화면 ("/cars?brand=hyundai").
//
// [이 화면이 보여주는 "서버에서 가져오는 목록 화면"의 표준 패턴]  (트림 화면도 같은 모양이다)
//   1) useLocalSearchParams 로 앞 화면이 넘긴 값을 읽는다
//   2) useLoad 로 데이터를 불러온다  → state.status 가 loading / error / ready
//   3) LoadStatus 가 "불러오는 중"과 "오류(다시 시도)"를 그린다
//   4) ready 일 때만 목록(FlatList)을 그린다
// 목록에서 차종을 누르면 트림 화면("/trims")으로 이동한다.
// ============================================================================

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarCard } from '@/components/car-card';
import { DataNotice } from '@/components/data-notice';
import { LoadStatus } from '@/components/load-status';
import { StudyNotice } from '@/components/study-notice';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { findBrand } from '@/constants/brands';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { getCars } from '@/storage/vehicleData';
import { carImageUrl } from '@/utils/images';

export default function CarsScreen() {
  // 앞 화면(제조사 선택)이 router.push 로 넘긴 brand 값을 읽는다.
  // 주소로 전달된 값은 항상 글자(string)이고 없을 수도 있어서 brand?: string 으로 적는다.
  const { brand: brandParam } = useLocalSearchParams<{ brand?: string }>();
  const brand = findBrand(brandParam);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // 화면 폭이 넓으면(태블릿, 웹) 카드를 2열로, 좁으면(폰) 1열로 보여준다.
  const { width } = useWindowDimensions();
  const numColumns = width >= 700 ? 2 : 1;
  // useCallback: 화면이 다시 그려져도 같은 함수를 유지한다. useLoad 는 이 함수가 바뀌면 "다른 요청"으로
  // 보고 다시 불러오기 때문에, 매번 새 함수를 만들면 무한히 다시 불러오게 된다.
  const load = useCallback(() => getCars(), []);
  const { state, retry } = useLoad(load);

  // 조기 반환(early return): 잘못된 주소(지원하지 않는 제조사)로 들어온 경우 안내만 보여주고 끝낸다.
  // (훅은 모두 위에서 먼저 부른 뒤에 이런 return 을 둔다. 훅은 조건문 안에서 부르면 안 되는 규칙이 있다.)
  if (!brand) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>지원하지 않는 제조사입니다.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* 제목줄 글자를 이 화면 안에서 동적으로 정한다 (제조사 이름이 들어간다) */}
      <Stack.Screen options={{ title: `${brand.name} 차종` }} />
      {/* 모든 화면 위쪽에 보이는 "학습용" 안내 배너 */}
      <StudyNotice />
      {/* 불러오는 중이거나 오류일 때만 무언가를 그리고, 완료(ready)면 아무것도 그리지 않는다 */}
      <LoadStatus
        state={state}
        loadingText="차종을 불러오는 중입니다."
        errorText="차종을 불러오지 못했습니다."
        onRetry={retry}
      />
      {/* && : 앞의 조건이 참일 때만 뒤의 화면을 그린다. 불러오기가 끝났을 때만 목록을 보여준다. */}
      {state.status === 'ready' && (
        <FlatList
          data={state.result.data}
          keyExtractor={(car) => car.code}
          // 열 개수가 바뀌면 FlatList 를 새로 만들어야 하므로 key 에 열 개수를 넣는다. (FlatList 의 규칙)
          key={numColumns}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnRow : undefined}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.four }]}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          renderItem={({ item }) => (
            // 카드 하나. 2열일 때는 두 카드가 같은 폭을 나눠 가진다(flex: 1).
            <ThemedView style={styles.cell}>
              <CarCard
                name={item.name}
                imageUri={carImageUrl(item.code)}
                // 다음 화면(트림)에 차종 코드(car)와 이름(carName)을 넘긴다.
                // 코드는 트림 조회와 이미지·색상 이미지 주소를 만드는 데, 이름은 제목과 마지막 화면에 쓴다.
                onPress={() =>
                  router.push({
                    pathname: '/trims',
                    params: { brand: brand.id, car: item.code, carName: item.name },
                  })
                }
              />
            </ThemedView>
          )}
          // 목록 맨 위에 "데이터 기준일" 안내를 붙인다
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <DataNotice result={state.result} />
            </ThemedView>
          }
          // 목록이 비었을 때 보여줄 것
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
  separator: { height: Spacing.three },
  header: { marginBottom: Spacing.three },
  columnRow: { gap: Spacing.three }, // 2열일 때 카드 사이 간격
  cell: { flex: 1 },
});
