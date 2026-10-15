// ============================================================================
// "차량가격 직접 입력" 줄에 쓰는 재미있는 로고: 반짝이는 금빛 동전.
// 제조사 엠블럼(BrandLogo)과 같은 크기와 모양(모서리가 둥근 네모)이라 제조사 줄 옆에 놓아도 자연스럽다.
// 이미지 파일 없이 도형과 글자(₩, 반짝임 이모지)로만 그려서, 어디서든 깨지지 않고 라이트/다크 모두 잘 보인다.
// ============================================================================

import { StyleSheet, Text, View } from 'react-native';

export function CoinLogo({ size = 48 }: { size?: number }) {
  const coin = size * 0.76; // 동전 지름 (바깥 네모 안쪽에 여유를 둔다)
  return (
    // 장식이라서 화면 낭독 기능은 이 그림을 읽지 않는다 (줄 제목이 대신 읽힌다)
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.badge, { width: size, height: size, borderRadius: size / 4 }]}>
      {/* 동전 본체: 금색 원 + 안쪽 테두리 */}
      <View style={[styles.coin, { width: coin, height: coin, borderRadius: coin / 2 }]}>
        <View style={[styles.rim, { width: coin * 0.8, height: coin * 0.8, borderRadius: (coin * 0.8) / 2 }]}>
          <Text style={[styles.won, { fontSize: coin * 0.46 }]}>₩</Text>
        </View>
      </View>
      {/* 반짝임: 오른쪽 위에 하나, 왼쪽 아래에 작게 하나 */}
      <Text style={[styles.sparkle, { fontSize: size * 0.3, top: -size * 0.02, right: size * 0.0 }]}>✨</Text>
      <Text style={[styles.sparkle, { fontSize: size * 0.18, bottom: size * 0.04, left: size * 0.04 }]}>✨</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#fff4d6', // 학습용 배너와 같은 따뜻한 노란 바탕
    borderWidth: 1,
    borderColor: '#e0a100',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coin: {
    backgroundColor: '#f6c431',
    alignItems: 'center',
    justifyContent: 'center',
    // 동전이 살짝 떠 보이게 그림자 (Android 는 elevation, iOS/웹은 shadow*)
    shadowColor: '#7a5200',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  rim: {
    borderWidth: 2,
    borderColor: '#b57f00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  won: { color: '#8a5a00', fontWeight: '900' },
  sparkle: { position: 'absolute' },
});
