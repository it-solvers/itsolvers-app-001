import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/** 제목(과 설명)이 붙은 화면 구역 */
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
