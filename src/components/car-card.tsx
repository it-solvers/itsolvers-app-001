// ============================================================================
// 차종 카드. 위에 차량 이미지를 크게, 아래에 차종 이름을 보여주고 누르면 다음 화면으로 간다.
// 차량 이미지는 흰 바탕 위에 놓는다. (제조사 이미지가 흰 배경이라 어두운 화면에서도 자연스럽다)
// ============================================================================

import { Pressable, StyleSheet, View } from 'react-native';

import { RemoteImage } from '@/components/remote-image';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CarCardProps = {
  name: string; // 차종 이름
  imageUri: string | undefined; // 차량 이미지 주소. 없으면 회색 자리표시
  onPress: () => void;
};

export function CarCard({ name, imageUri, onPress }: CarCardProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      // 누르고 있는 동안에는 배경을 살짝 진하게 바꿔 눌렸다는 것을 알려 준다
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      {/* 이미지 영역: 가로 2 : 세로 1 비율로 고정하고, 차량이 잘리지 않게 contain 으로 맞춘다 */}
      <View style={styles.imageArea}>
        <RemoteImage uri={imageUri} placeholder="gray" style={styles.image} />
      </View>
      <View style={styles.footer}>
        <ThemedText type="default" style={styles.name}>
          {name}
        </ThemedText>
        <ThemedText themeColor="textSecondary">›</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 테두리를 둬서 흰 이미지 영역이 흰 화면 배경과 섞이지 않고 카드로 보이게 한다
  card: { borderRadius: Spacing.three, overflow: 'hidden', borderWidth: 1 },
  imageArea: {
    aspectRatio: 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
  },
  image: { width: '100%', height: '100%' },
  footer: {
    minHeight: 56, // 누르기 쉬운 터치 영역
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  name: { flex: 1, fontWeight: 600 },
});
