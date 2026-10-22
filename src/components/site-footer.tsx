// ============================================================================
// 시작 화면 맨 아래의 푸터. 아이티해결단 회사 사이트(index.html)의 푸터처럼
// 어두운 배경에 회색 글씨로 회사 정보를 한 줄(좁은 화면에서는 여러 줄)로 보여준다.
// 문구는 constants/site.ts 의 FOOTER_LINES 에서 정한다.
// ============================================================================

import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COPYRIGHT, FOOTER_LINES } from '@/constants/site';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SiteFooter() {
  // 아래쪽 홈 바에 가려지지 않도록 안전 영역만큼 여백을 더한다.
  const insets = useSafeAreaInsets();
  // 다크 모드 푸터는 회사 사이트 색상표의 #09090a
  const background = useColorScheme() === 'dark' ? '#09090a' : '#111827';
  return (
    <View style={[styles.footer, { backgroundColor: background, paddingBottom: insets.bottom + Spacing.three }]}>
      <View style={styles.inner}>
        {FOOTER_LINES.map((line, index) => (
          // 첫 줄(회사 이름)만 굵게, 나머지는 앞에 구분선(|)을 붙이고 흐리게 보인다 (회사 사이트와 같은 표현)
          <Text key={line} style={index === 0 ? styles.strong : styles.rest}>
            {index === 0 ? line : `| ${line}`}
          </Text>
        ))}
      </View>
      <Text style={styles.copyright}>{COPYRIGHT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { paddingTop: Spacing.three },
  inner: {
    paddingHorizontal: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
  },
  strong: { color: '#e5e7eb', fontSize: 13, fontWeight: 700, lineHeight: 20 },
  copyright: {
    color: '#98a2b3',
    fontSize: 12,
    lineHeight: 18,
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  rest: { color: '#98a2b3', fontSize: 13, lineHeight: 20 },
});
