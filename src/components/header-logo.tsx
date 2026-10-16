// ============================================================================
// 앱 기본 제목줄(차종 선택 ~ 차량 선택 완료 화면)의 오른쪽 끝에 보이는 작은 회사 로고.
// 화면이 작아서 로고 헤더 전체를 두지 못하는 대신, 남는 자리에 작게만 보여준다.
// 누르면 회사 사이트(itsolvers.co.kr)가 열린다. _layout.tsx 의 Stack screenOptions 에서 쓴다.
// ============================================================================

import { Image } from 'expo-image';
import { Linking, Pressable } from 'react-native';

import { COMPANY_NAME, COMPANY_URL } from '@/constants/site';

export function HeaderLogo() {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${COMPANY_NAME} 사이트로 이동`}
      onPress={() => Linking.openURL(COMPANY_URL)}
      // 눈에 보이는 로고는 작지만 누르는 영역은 넉넉하게 (hitSlop)
      hitSlop={10}>
      {/* 로고 원본은 300x177(약 7:4). 높이만 정하고 비율은 유지한다. 흰 배경이라 모서리를 살짝 둥글게 */}
      <Image
        source={require('@/assets/images/company-logo.png')}
        contentFit="contain"
        accessibilityLabel={`${COMPANY_NAME} 로고`}
        style={{ height: 26, aspectRatio: 7 / 4, borderRadius: 4 }}
      />
    </Pressable>
  );
}
