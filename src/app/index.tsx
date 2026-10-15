// ============================================================================
// 시작(랜딩) 화면 ("/"). 앱을 열면 가장 먼저 보이는 화면이다.
// 안내 문구(학습용, 데이터가 정확하지 않을 수 있음)를 보여주고 "견적하기"로 제조사 선택부터 시작한다.
// ============================================================================

import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StudyNotice } from '@/components/study-notice';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebHead } from '@/components/web-head';
import {
  GOOGLE_SITE_VERIFICATION,
  LANDING_DESCRIPTION,
  LANDING_KEYWORDS,
  LANDING_TITLE,
  OG_IMAGE_ALT,
  OG_IMAGE_URL,
  SITE_NAME,
  SITE_URL,
} from '@/constants/site';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 검색엔진에 알려 주는 구조화 데이터(JSON-LD). "이 페이지는 어떤 웹앱이고 누가 만들었는지"를 기계가 읽기 쉬운 형태로 적은 것이다.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '승용차 견적 확인 (학습용)',
  url: `${SITE_URL}/`,
  description: LANDING_DESCRIPTION,
  inLanguage: 'ko',
  applicationCategory: 'UtilitiesApplication',
  publisher: { '@type': 'Organization', name: SITE_NAME, url: 'https://itsolvers.co.kr/' },
};

// 시작(랜딩) 화면. 안내 문구를 보여주고 "견적하기"로 제조사 선택부터 시작한다.
export default function LandingScreen() {
  // useRouter: 다른 화면으로 이동하는 도구를 준다. (router.push('/brands') 처럼 사용)
  const router = useRouter();
  // 라이트/다크 모드. 회사 사이트처럼 본문 영역 배경(옅은 파랑 계열)을 모드마다 다르게 쓴다.
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <ThemedView style={styles.container}>
      {/* 이 화면의 제목줄(헤더)을 숨긴다 */}
      <Stack.Screen options={{ headerShown: false }} />
      {/*
        웹 전용: 시작 화면만 검색엔진에 노출한다 (SEO). 앱에서는 아무것도 하지 않는다.
        _layout.tsx 의 기본값(noindex)을 같은 이름의 robots 태그로 덮어쓴다.
          title / description / keywords  검색 결과에 보이는 제목, 설명, 키워드
          canonical                       이 페이지의 대표 주소(같은 내용의 다른 주소가 있어도 이 주소로 모아 달라는 뜻)
          og:*                            카카오톡, 페이스북, 네이버 밴드 등으로 링크를 공유할 때의 미리보기
          twitter:*                       트위터(X) 공유 미리보기
          application/ld+json             위에서 정의한 구조화 데이터
          google-site-verification        구글 서치콘솔에서 이 사이트의 주인임을 확인하는 값
      */}
      <WebHead>
        <title>{LANDING_TITLE}</title>
        <meta name="description" content={LANDING_DESCRIPTION} />
        <meta name="keywords" content={LANDING_KEYWORDS} />
        <meta name="author" content={SITE_NAME} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/`} />
        {/* 구글 서치콘솔 소유권 확인 (구글이 시작 화면(/)에서 이 태그를 찾는다) */}
        <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={LANDING_TITLE} />
        <meta property="og:description" content={LANDING_DESCRIPTION} />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:image" content={OG_IMAGE_URL} />
        <meta property="og:image:alt" content={OG_IMAGE_ALT} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={LANDING_TITLE} />
        <meta name="twitter:description" content={LANDING_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE_URL} />

        <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      </WebHead>
      {/* 맨 위: 회사 로고와 이름이 있는 헤더 (노치 아래에 오도록 헤더 안에서 안전 영역을 비운다) */}
      <SiteHeader />
      {/* 그 아래: 모든 화면에 보이는 "학습용" 안내 배너 */}
      <StudyNotice />
      {/* ScrollView: 글자가 커지거나 화면이 작아도 내용이 잘리지 않고 스크롤되게 한다 */}
      <ScrollView
        // 본문 영역 배경: 회사 사이트 첫 화면(hero)처럼 라이트는 옅은 파랑 흰색, 다크는 짙은 남색
        style={{ backgroundColor: isDark ? '#0f172a' : '#f8faff' }}
        contentContainerStyle={styles.scroll}>
        <ThemedView style={styles.hero}>
          <ThemedText type="subtitle" style={styles.heading}>
            승용차 <Text style={styles.accent}>견적</Text> 확인
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            제조사, 차종, 트림, 옵션을 골라 가격을 확인해 볼 수 있습니다.
          </ThemedText>
        </ThemedView>

        {/* accessibilityRole: 화면 낭독 기능(보이스오버/톡백)이 이 요소를 어떻게 읽을지 알려 준다 */}
        <ThemedView type="backgroundElement" style={styles.notice} accessibilityRole="summary">
          <ThemedText type="smallBold">안내</ThemedText>
          <ThemedText>이것은 학습을 위한 것입니다. 데이터는 정확하지 않을 수 있습니다.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            실제 구매 가격과 옵션 구성은 제조사 또는 영업점에서 반드시 확인하세요.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            가격 정보는 현대자동차 사이트에서 가져오며, 제조사의 공식 서비스가 아닙니다. 현재는 현대자동차 승용차만
            지원합니다.
          </ThemedText>
        </ThemedView>

        {/* Pressable: 눌렀을 때 반응하는 영역. style 에 함수를 넘기면 "누르고 있는 중(pressed)"에 모양을 바꿀 수 있다. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/brands')}
          style={({ pressed }) => [styles.startButton, { opacity: pressed ? 0.8 : 1 }]}>
          <ThemedText style={styles.startButtonText}>견적하기</ThemedText>
        </Pressable>
      </ScrollView>
      {/* 맨 아래: 회사 정보 푸터 (스크롤과 상관없이 화면 아래에 붙어 있다) */}
      <SiteFooter />
    </ThemedView>
  );
}

// 스타일은 StyleSheet.create 로 모아 둔다. (웹의 CSS 와 비슷하지만 이름이 camelCase 이고 단위는 숫자다)
// flex: 1 = 남는 공간을 모두 차지, gap = 자식 사이의 간격, Spacing.* = 앱 공통 여백 크기(constants/theme.ts)
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
    maxWidth: MaxContentWidth, // 큰 화면(태블릿, 웹)에서 내용이 너무 넓게 퍼지지 않도록 한다
    width: '100%',
    alignSelf: 'center',
  },
  // 배경을 투명하게 둔다. (기본 배경색이 있으면 본문 영역 색 위에 상자가 도드라져 보인다)
  hero: { alignItems: 'center', gap: Spacing.two, backgroundColor: 'transparent' },
  heading: { textAlign: 'center' },
  // 회사 사이트의 hero 제목처럼 핵심 단어를 파란 강조색으로 보인다
  accent: { color: '#2563eb' },
  centerText: { textAlign: 'center' },
  notice: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  startButton: {
    minHeight: 56, // 누르기 쉬운 터치 영역
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
    backgroundColor: '#2563eb', // 회사 사이트의 강조색
  },
  startButtonText: { color: '#ffffff', fontWeight: 700, fontSize: 18 },
});
