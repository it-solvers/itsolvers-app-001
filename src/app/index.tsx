// ============================================================================
// 시작(랜딩) 화면 ("/"). 앱을 열면 가장 먼저 보이는 화면이다.
// 안내 문구(학습용, 데이터가 정확하지 않을 수 있음)를 보여주고 "견적하기"로 제조사 선택부터 시작한다.
// ============================================================================

import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

// 시작(랜딩) 화면. 안내 문구를 보여주고 "견적하기"로 제조사 선택부터 시작한다.
export default function LandingScreen() {
  // useRouter: 다른 화면으로 이동하는 도구를 준다. (router.push('/brands') 처럼 사용)
  const router = useRouter();
  // 안전 영역: 노치(카메라 구멍), 상태바, 하단 홈 바에 내용이 가려지지 않도록 비워야 할 여백의 크기.
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      {/* 이 화면의 제목줄(헤더)을 숨긴다 */}
      <Stack.Screen options={{ headerShown: false }} />
      {/* ScrollView: 글자가 커지거나 화면이 작아도 내용이 잘리지 않고 스크롤되게 한다 */}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          // 스타일을 배열로 넘기면 앞에서 뒤로 합쳐진다. 안전 영역 여백은 기기마다 달라서 코드로 계산한다.
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
    paddingHorizontal: Spacing.three,
    maxWidth: MaxContentWidth, // 큰 화면(태블릿, 웹)에서 내용이 너무 넓게 퍼지지 않도록 한다
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
