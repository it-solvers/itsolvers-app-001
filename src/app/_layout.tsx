import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="index" options={{ title: '제조사 선택' }} />
        <Stack.Screen name="cars" options={{ title: '차종 선택' }} />
        <Stack.Screen name="trims" options={{ title: '트림 선택' }} />
        <Stack.Screen name="price" options={{ title: '가격 확인' }} />
      </Stack>
    </ThemeProvider>
  );
}
