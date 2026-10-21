// ============================================================================
// "학습용" 안내 컴포넌트 두 가지. 눈에 띄도록 노란(호박색) 계열을 쓴다.
//   StudyNotice     모든 화면 위쪽에 붙는 한 줄 배너
//   PriceDisclaimer 금액이 보이는 화면(가격, 차량 선택 완료) 하단의 안내 문장
// 문구는 i18n/ko.ts, en.ts 의 notice 항목에 있다.
// ============================================================================

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { KRW_PER_USD } from '@/constants/currency';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { t } from '@/i18n';
import { withCommas } from '@/utils/price';

// 라이트/다크 모드에 맞는 안내 색. 일반 글자(회색 계열)와 확실히 구별되도록 노란 계열로 정했다.
const NOTICE_COLORS = {
  light: { background: '#FFF4D6', border: '#E0A100', text: '#6B4200' },
  dark: { background: '#3D2F00', border: '#B88A00', text: '#FFE08A' },
} as const;

// 지금 모드(라이트/다크)의 색을 돌려준다.
function useNoticeColors() {
  const scheme = useColorScheme();
  return NOTICE_COLORS[scheme === 'dark' ? 'dark' : 'light'];
}

/** 화면 위쪽에 붙이는 한 줄 안내 배너 */
export function StudyNotice() {
  const colors = useNoticeColors();
  return (
    // accessibilityRole="alert": 화면 낭독 기능이 이 문구를 눈에 띄는 안내로 읽어 준다
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <ThemedText type="smallBold" style={[styles.bannerText, { color: colors.text }]}>
        {t('notice.study')}
      </ThemedText>
    </View>
  );
}

/** 금액 아래에 붙이는 안내 문장 (일반 글자보다 진하고 눈에 띄는 색) */
export function PriceDisclaimer() {
  const colors = useNoticeColors();
  return (
    <ThemedText type="small" style={[styles.disclaimer, { color: colors.text }]}>
      {t('notice.price', { rate: withCommas(KRW_PER_USD) })}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 2,
  },
  bannerText: { textAlign: 'center' },
  disclaimer: { fontWeight: 600 },
});
