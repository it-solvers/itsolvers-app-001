// ============================================================================
// 가격 화면과 견적 화면에서 쓰는 "제목이 붙은 구역". 제목, (선택) 설명, 그 아래 내용으로 이루어진다.
// 예) "선택 옵션" 제목 아래에 옵션 줄들이 쌓인다.
// ============================================================================

import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/** 제목(과 설명)이 붙은 화면 구역 */
// children 은 이 컴포넌트 태그 "사이에 넣은 내용"을 받는 특별한 props 다.
//   <Section title="사양"> ...여기 들어간 것들이 children... </Section>
export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
      <ThemedView style={styles.body}>{children}</ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.one, marginTop: Spacing.two },
  body: { gap: Spacing.two, marginTop: Spacing.one },
});
