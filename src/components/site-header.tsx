// ============================================================================
// 모든 화면 맨 위의 헤더. 아이티해결단 회사 사이트(index.html)의 헤더를 따랐다.
//   왼쪽: (돌아갈 화면이 있으면 뒤로 가기 버튼) + 로고 이미지 + "아이티해결단" 글자
//   오른쪽: 회사 사이트로 가는 링크
// 앱 기본 제목줄을 쓰지 않는 화면에서는 이 헤더가 뒤로 가기 버튼 역할도 한다. (showBack)
// 흰 배경과 아래쪽 얇은 선도 회사 사이트와 같은 느낌으로 맞췄다.
// ============================================================================

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COMPANY_URL } from '@/constants/site';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

// 회사 사이트(css/styles.css)의 헤더 색. 회사 사이트는 다크 모드에서도 헤더를 흰색으로 둔다.
// 로고 이미지가 불투명한 흰 배경이라서, 어두운 배경 위에 놓으면 흰 상자가 튀어 보이기 때문에 같은 방식을 따랐다.
const COLORS = { background: '#ffffff', border: '#e5e7eb', text: '#101828', link: '#475467' } as const;

export function SiteHeader({ showBack = false }: { showBack?: boolean }) {
  const colors = COLORS;
  const router = useRouter();
  // 돌아갈 이전 화면이 있을 때만 뒤로 가기 버튼을 보여준다. (주소를 직접 열어 들어온 첫 화면에는 없다)
  const canGoBack = showBack && router.canGoBack();
  // 노치(카메라 구멍)와 상태바에 가려지지 않도록 위쪽 안전 영역만큼 비운다.
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}>
      <View style={styles.inner}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('company.back')}
            onPress={() => router.back()}
            style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>‹</Text>
          </Pressable>
        ) : null}
        {/* 로고와 회사 이름. 누르면 회사 사이트가 열린다 (회사 사이트에서는 메인으로 이동하는 로고다) */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('company.goToSite', { name: t('company.name') })}
          onPress={() => Linking.openURL(COMPANY_URL)}
          style={styles.logo}>
          {/* 로고 원본은 300x177(약 7:4). 높이를 고정하고 비율은 유지한다(contentFit="contain") */}
          <Image
            source={require('@/assets/images/company-logo.png')}
            contentFit="contain"
            accessibilityLabel={t('company.logo', { name: t('company.name') })}
            style={styles.logoImage}
          />
          <Text style={[styles.logoText, { color: colors.text }]}>{t('company.name')}</Text>
        </Pressable>

        {/* 회사 사이트의 메뉴 대신 링크 하나만 둔다 (이 앱에는 이동할 구역이 없다) */}
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(COMPANY_URL)}
          style={styles.linkButton}>
          <Text style={[styles.linkText, { color: colors.link }]}>{t('company.about')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1 },
  inner: {
    minHeight: 64,
    paddingHorizontal: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, flex: 1 },
  // 누르기 쉬운 크기(44 이상)의 뒤로 가기 버튼
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -Spacing.two },
  backText: { fontSize: 32, lineHeight: 36, fontWeight: 300 },
  logoImage: { height: 40, aspectRatio: 7 / 4 },
  logoText: { fontSize: 18, fontWeight: 800, letterSpacing: -0.8 },
  linkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.two },
  linkText: { fontSize: 14, fontWeight: 600 },
});
