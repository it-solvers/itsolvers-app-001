// ============================================================================
// 시작 화면이 아닌 모든 화면의 맨 위 묶음: 로고 헤더(뒤로 가기 버튼 포함) + "학습용" 배너 + 화면 제목.
// 화면마다 같은 세 가지를 반복해서 쓰지 않도록 한 번에 묶었다.
// 앱 기본 제목줄은 쓰지 않으므로(_layout.tsx 에서 headerShown: false) 화면 제목은 여기서 보여준다.
// ============================================================================

import { StyleSheet, View } from 'react-native';

import { SiteHeader } from '@/components/site-header';
import { StudyNotice } from '@/components/study-notice';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export function ScreenTop({ title }: { title: string }) {
  return (
    <View>
      <SiteHeader showBack />
      <StudyNotice />
      {/* 화면 제목. 아래 내용과 같은 폭(MaxContentWidth)과 좌우 여백을 맞춘다 */}
      <View style={styles.titleRow}>
        <ThemedText type="subtitle" style={styles.title} accessibilityRole="header">
          {title}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 24, lineHeight: 32 },
});
