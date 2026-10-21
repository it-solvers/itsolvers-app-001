// ============================================================================
// 앱 전체의 뼈대(루트 레이아웃). 화면들을 어떤 방식으로 오가는지를 정한다.
//
// [Expo Router의 규칙: 파일 이름 = 화면 주소]
// src/app/ 폴더 안의 파일이 곧 화면이다.
//   index.tsx   → "/"         시작 화면
//   brands.tsx  → "/brands"   제조사 선택
//   cars.tsx    → "/cars"     차종 선택
//   trims.tsx   → "/trims"    트림 선택
//   price.tsx   → "/price"    가격 확인
//   summary.tsx → "/summary"  차량 선택 완료
// 이 파일(_layout.tsx)은 화면이 아니라, 위 화면들을 감싸는 공통 틀이다.
//
// [스택(Stack) 내비게이션]
// 화면을 카드처럼 위에 쌓아 올리고(router.push), 뒤로 가면 맨 위 한 장을 걷어낸다.
// 제조사 → 차종 → 트림처럼 "앞에서 고른 것이 다음 화면을 정하는" 흐름에 맞는 방식이다.
// 화면 위쪽의 제목줄(헤더)과 뒤로 가기 버튼도 Stack 이 자동으로 만들어 준다.
// ============================================================================

import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useSyncExternalStore } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { HeaderLogo } from '@/components/header-logo';
import { WebHead } from '@/components/web-head';
import {
  DEFAULT_TITLE,
  FAVICON_URL,
  LANDING_DESCRIPTION,
  LANDING_TITLE,
  OG_IMAGE_ALT,
  OG_IMAGE_URL,
  SITE_NAME,
} from '@/constants/site';
import { detectLocale, setLocale, t, type Locale } from '@/i18n';

// 앱이 시작될 때 보이는 스플래시(로고) 화면을, 첫 화면이 준비될 때까지 자동으로 닫지 않고 붙잡아 둔다.
SplashScreen.preventAutoHideAsync();

// 기기 언어는 앱이 켜져 있는 동안 바뀌지 않는다고 보고, 변경을 알려 줄 일이 없다.
const subscribeNothing = () => () => {};
const serverLocale = (): Locale => 'ko';

export default function RootLayout() {
  // 기기가 라이트 모드인지 다크 모드인지 알려 준다. ('light' | 'dark' | null 등)
  const colorScheme = useColorScheme();
  // 기기(브라우저) 언어. useSyncExternalStore 는 웹의 미리 만든 HTML 을 처음 그릴 때는 세 번째 함수의 값('ko')을 쓰고,
  // 곧바로 실제 언어로 다시 그려 준다. (i18n/index.ts 설명 참고) 앱에서는 처음부터 실제 언어를 쓴다.
  // 언어가 바뀌면 아래 화면 전체를 key 로 새로 그려서 모든 문구가 새 언어로 바뀐다.
  const locale = useSyncExternalStore(subscribeNothing, detectLocale, serverLocale);
  setLocale(locale);
  return (
    // ThemeProvider: 헤더와 배경색 같은 화면 공통 색을 라이트/다크에 맞춰 바꿔 준다.
    <ThemeProvider key={locale} value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {/*
        웹 전용 기본 head. 모든 페이지에 적용된다. (앱에서는 아무것도 하지 않는다)
          - robots noindex,nofollow: 검색에 노출하지 않는다. 시작 화면(index.tsx)만 같은 이름의 태그로
            "index, follow"를 지정해서 이 기본값을 덮어쓴다. (더 안쪽에서 지정한 값이 이긴다)
          - title: 시작 화면이 아닌 화면의 브라우저 탭 제목
          - icon: 브라우저 탭에 보이는 아이콘(파비콘)
      */}
      <WebHead>
        <title>{DEFAULT_TITLE}</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href={FAVICON_URL} type="image/png" />
        {/* 어느 화면 주소를 공유해도 설명과 회사 로고 미리보기가 나오도록 하는 기본값 (검색에는 노출하지 않음) */}
        <meta name="description" content={LANDING_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={DEFAULT_TITLE} />
        <meta property="og:description" content={LANDING_DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE_URL} />
        <meta property="og:image:alt" content={OG_IMAGE_ALT} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1066" />
        <meta property="og:image:height" content="532" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={DEFAULT_TITLE} />
        <meta name="twitter:description" content={LANDING_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE_URL} />
      </WebHead>
      {/* 아래 name 은 파일 이름(확장자 제외)과 같아야 한다. options 로 각 화면의 제목줄을 정한다. */}
      {/*
        시작 화면과 제조사 선택 화면은 앱 기본 제목줄을 끄고(headerShown: false) 로고 헤더(components/site-header.tsx)를 쓴다.
        제조사 선택 이후 화면(차종, 트림, 가격, 차량 선택 완료)은 화면이 부족해서 로고 헤더 없이 앱 기본 제목줄
        (뒤로 가기 + 제목)을 쓴다. 제목은 각 화면 파일의 <Stack.Screen options> 에서 정하고, 여기의 title 은
        웹 브라우저 탭 제목의 기본값이다.
      */}
      {/* screenOptions: 모든 화면 공통 옵션. headerRight = 제목줄 오른쪽 끝의 작은 회사 로고 (헤더를 끈 화면에는 보이지 않음) */}
      <Stack screenOptions={{ headerRight: () => <HeaderLogo /> }}>
        <Stack.Screen name="index" options={{ headerShown: false, title: LANDING_TITLE }} />
        <Stack.Screen name="brands" options={{ headerShown: false, title: t('nav.brands') }} />
        <Stack.Screen name="cars" options={{ title: t('nav.cars'), headerBackTitle: t('nav.carsBack') }} />
        <Stack.Screen name="trims" options={{ title: t('nav.trims') }} />
        <Stack.Screen name="price" options={{ title: t('nav.price') }} />
        <Stack.Screen name="summary" options={{ title: t('nav.summary') }} />
      </Stack>
    </ThemeProvider>
  );
}
