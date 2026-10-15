// ============================================================================
// 색상 이름 앞에 붙이는 동그란 색상 표시. 제조사가 제공하는 색상 칩 이미지를 동그랗게 잘라서 보여준다.
// 이미지가 없거나 불러오지 못하면 회색 동그라미로 보인다. (글자색은 바꾸지 않는다)
// ============================================================================

import { StyleSheet, View } from 'react-native';

import { RemoteImage } from '@/components/remote-image';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 26;

export function ColorDot({ uri }: { uri: string | undefined }) {
  const theme = useTheme();
  return (
    // 바깥 View 가 동그란 테두리를 만들고(overflow: hidden 으로 모서리 밖은 잘라냄), 안에 색상 이미지를 꽉 채운다.
    <View style={[styles.dot, { borderColor: theme.textSecondary }]}>
      <RemoteImage uri={uri} contentFit="cover" placeholder="gray" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1, // 흰색, 검은색 색상도 배경과 구별되도록 얇은 테두리를 둔다
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
});
