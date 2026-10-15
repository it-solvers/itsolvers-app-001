import { useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRANDS } from '@/constants/brands';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function BrandScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={BRANDS}
        keyExtractor={(brand) => brand.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.four }]}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
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
