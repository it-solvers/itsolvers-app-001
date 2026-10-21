// ============================================================================
// 제조사 선택 화면 ("/brands").
// constants/brands.ts 의 목록을 그대로 보여주고, 누르면 차종 화면("/cars")으로 이동한다.
// 이 화면은 서버에서 가져올 것이 없는(앱 안에 있는 고정 목록) 가장 단순한 목록 화면이다.
// ============================================================================

import { useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { CoinLogo } from '@/components/coin-logo';
import { ListRow } from '@/components/list-row';
import { ScreenTop } from '@/components/screen-top';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRANDS } from '@/constants/brands';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

export default function BrandsScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* 맨 위: 로고 헤더(뒤로 가기 포함) + "학습용" 배너 + 화면 제목 */}
      <ScreenTop title={t('nav.brands')} />
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
        contentContainerStyle={[styles.list, { paddingBottom: Spacing.four }]}
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
          <ThemedView style={styles.footer}>
            {/*
              차량을 고르지 않고 차량가격만 직접 입력해서 리스료를 계산하는 길. 차량 선택 완료 화면으로 바로 간다.
              제조사 줄과 똑같은 ListRow 모양으로 만들고, 엠블럼 자리에는 재미있는 로고(금빛 동전)를 넣었다.
              제목은 기능을 그대로 알려 주고(화면 낭독에도 읽힌다), 아래 보조 글에 가벼운 농담을 담았다.
            */}
            <ListRow
              title={t('brands.manualTitle')}
              subtitle={t('brands.manualSubtitle')}
              leading={<CoinLogo />}
              onPress={() => router.push({ pathname: '/summary', params: { manual: '1' } })}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {t('brands.onlyHyundai')}
            </ThemedText>
          </ThemedView>
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
  // 제조사 줄 바로 아래에 같은 간격(Spacing.two)으로 붙인다
  footer: { marginTop: Spacing.two, gap: Spacing.three },
});
