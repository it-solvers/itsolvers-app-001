// ============================================================================
// 제조사 선택 화면 ("/brands").
// constants/brands.ts 의 목록을 그대로 보여주고, 누르면 차종 화면("/cars")으로 이동한다.
// 이 화면은 서버에서 가져올 것이 없는(앱 안에 있는 고정 목록) 가장 단순한 목록 화면이다.
// ============================================================================

import { useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { ListRow } from '@/components/list-row';
import { StudyNotice } from '@/components/study-notice';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRANDS } from '@/constants/brands';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function BrandsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      {/* 모든 화면 위쪽에 보이는 "학습용" 안내 배너 */}
      <StudyNotice />
      {/*
        FlatList: 긴 목록을 효율적으로 그리는 도구. 화면에 보이는 항목만 그려서 항목이 많아도 가볍다.
          data                  보여줄 배열
          keyExtractor          항목마다 겹치지 않는 열쇠(key). React 가 항목을 구별하는 데 쓴다.
          renderItem            항목 하나를 어떻게 그릴지 (item 이 배열의 한 항목)
          ItemSeparatorComponent  항목 사이에 끼울 것(여기서는 간격)
          ListFooterComponent   목록 맨 아래에 붙일 것
      */}
      <FlatList
        data={BRANDS}
        keyExtractor={(brand) => brand.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.four }]}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            // 글자 왼쪽에 제조사 엠블럼을 보여준다
            leading={<BrandLogo uri={item.logoUrl} name={item.name} />}
            // router.push 의 params 는 다음 화면에 "주소 값"으로 전달된다. (다음 화면은 useLocalSearchParams 로 읽는다)
            onPress={() => router.push({ pathname: '/cars', params: { brand: item.id } })}
          />
        )}
        ListFooterComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
            현재는 현대자동차 승용차만 지원합니다. 다른 제조사는 추후 추가할 예정입니다.
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    padding: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  separator: { height: Spacing.two },
  footer: { marginTop: Spacing.three },
});
