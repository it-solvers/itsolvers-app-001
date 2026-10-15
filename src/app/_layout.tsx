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
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { WebHead } from '@/components/web-head';
import { DEFAULT_TITLE, FAVICON_URL, LANDING_TITLE } from '@/constants/site';

// 앱이 시작될 때 보이는 스플래시(로고) 화면을, 첫 화면이 준비될 때까지 자동으로 닫지 않고 붙잡아 둔다.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 기기가 라이트 모드인지 다크 모드인지 알려 준다. ('light' | 'dark' | null 등)
  const colorScheme = useColorScheme();
  return (
    // ThemeProvider: 헤더와 배경색 같은 화면 공통 색을 라이트/다크에 맞춰 바꿔 준다.
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
      </WebHead>
      {/* 아래 name 은 파일 이름(확장자 제외)과 같아야 한다. options 로 각 화면의 제목줄을 정한다. */}
      <Stack>
        {/*
          시작 화면은 제목줄을 숨긴다(headerShown: false).
          title 은 앱에서는 보이지 않지만, 웹에서는 화면 이동 시스템이 브라우저 탭 제목으로 쓰기 때문에
          검색용 제목과 같게 맞춰 둔다. (비워 두면 탭 제목이 "index"로 바뀔 수 있다)
          headerBackTitle: 다음 화면(제조사 선택)의 뒤로 가기 버튼 글자. (iOS에서 긴 제목이 그대로 보이지 않게 짧게 지정)
        */}
        <Stack.Screen name="index" options={{ headerShown: false, title: LANDING_TITLE }} />
        <Stack.Screen name="brands" options={{ title: '제조사 선택', headerBackTitle: '처음' }} />
        <Stack.Screen name="cars" options={{ title: '차종 선택' }} />
        <Stack.Screen name="trims" options={{ title: '트림 선택' }} />
        <Stack.Screen name="price" options={{ title: '가격 확인' }} />
        <Stack.Screen name="summary" options={{ title: '차량 선택 완료' }} />
      </Stack>
    </ThemeProvider>
  );
}
