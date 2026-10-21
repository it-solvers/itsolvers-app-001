// ============================================================================
// 앱 기본 제목줄(차종 선택 ~ 차량 선택 완료 화면)의 오른쪽 끝에 보이는 회사 로고.
// 화면이 작아서 로고 헤더 전체를 두지 못하는 대신, 제목줄 오른쪽에 로고만 보여준다.
// 누르면 회사 사이트(itsolvers.co.kr)가 열린다. _layout.tsx 의 Stack screenOptions 에서 쓴다.
// ============================================================================

import { Image } from 'expo-image';
import { Linking, Platform, Pressable } from 'react-native';

import { COMPANY_URL } from '@/constants/site';
import { t } from '@/i18n';

export function HeaderLogo() {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t('company.goToSite', { name: t('company.name') })}
      onPress={() => Linking.openURL(COMPANY_URL)}
      // 누르는 영역은 눈에 보이는 로고보다 넉넉하게 (hitSlop)
      hitSlop={10}
      // 웹에서는 제목줄이 로고를 화면 오른쪽 끝에 딱 붙여서 잘려 보이므로 오른쪽에 여백을 둔다 (앱은 제목줄이 알아서 띄운다)
      style={{ marginRight: Platform.OS === 'web' ? 16 : 0 }}>
      {/* 로고 원본은 300x177(약 7:4). 높이만 정하고 비율은 유지한다. 흰 배경이라 모서리를 살짝 둥글게 */}
      <Image
        source={require('@/assets/images/company-logo.png')}
        contentFit="contain"
        accessibilityLabel={t('company.logo', { name: t('company.name') })}
        style={{ height: 36, aspectRatio: 7 / 4, borderRadius: 4 }}
      />
    </Pressable>
  );
}
