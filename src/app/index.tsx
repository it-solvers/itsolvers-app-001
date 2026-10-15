import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

// 시작(랜딩) 화면. 안내 문구를 보여주고 "견적하기"로 제조사 선택부터 시작한다.
export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.four },
        ]}>
        <ThemedView style={styles.hero}>
          <ThemedText type="subtitle" style={styles.heading}>
            승용차 견적 확인
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            제조사, 차종, 트림, 옵션을 골라 가격을 확인해 볼 수 있습니다.
          </ThemedText>
        </ThemedView>

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

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/brands')}
          style={({ pressed }) => [styles.startButton, { opacity: pressed ? 0.8 : 1 }]}>
          <ThemedText style={styles.startButtonText}>견적하기</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.two },
  heading: { textAlign: 'center' },
  centerText: { textAlign: 'center' },
  notice: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  startButton: {
    minHeight: 56, // 누르기 쉬운 터치 영역
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
    backgroundColor: '#3c87f7',
  },
  startButtonText: { color: '#ffffff', fontWeight: 700, fontSize: 18 },
});
