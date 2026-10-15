// ============================================================================
// 인터넷에서 불러오는 이미지(제조사 서버의 그림). 불러오지 못해도 화면이 깨지지 않게 감싼 컴포넌트다.
//   - uri 가 없으면(차종 이미지 표에 없는 차종 등) 아무것도 그리지 않거나 회색 자리표시를 보여준다.
//   - 불러오다 실패하면(주소가 바뀌었거나 인터넷이 안 될 때) 같은 방식으로 자리표시를 보여준다.
// 이미지는 expo-image 가 기기에 저장해 두므로 같은 이미지를 다시 보여줄 때는 빠르다.
// ============================================================================

import { Image, type ImageContentFit } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type RemoteImageProps = {
  uri: string | undefined;
  style?: StyleProp<ImageStyle>; // 크기와 모양 (width, height, borderRadius 등)
  contentFit?: ImageContentFit; // contain: 잘리지 않게 전체를 보여줌, cover: 영역을 꽉 채우고 넘치는 부분은 자름
  placeholder?: 'none' | 'gray'; // 이미지가 없을 때: 비워 둘지, 회색 자리표시를 보여줄지
  label?: string; // 화면 낭독 기능이 읽을 이름. 없으면 장식 이미지로 본다
};

export function RemoteImage({ uri, style, contentFit = 'contain', placeholder = 'none', label }: RemoteImageProps) {
  const theme = useTheme();
  // 불러오기에 실패했는지. uri 가 바뀌면 다시 시도해야 하므로 "실패한 주소"를 기억한다.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = !uri || failedUri === uri;

  if (failed) {
    return placeholder === 'gray' ? (
      <View style={[style as StyleProp<ViewStyle>, styles.fallback, { backgroundColor: theme.backgroundSelected }]} />
    ) : (
      <View style={style as StyleProp<ViewStyle>} />
    );
  }
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      onError={() => setFailedUri(uri)}
      accessible={!!label}
      accessibilityLabel={label}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { opacity: 0.6 },
});
