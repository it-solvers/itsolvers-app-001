// ============================================================================
// 내용이 긴 화면(차종, 트림, 가격, 차량 선택 완료)에서 스크롤 내용의 "맨 끝"에 붙는 푸터.
// 스크롤 내용은 좌우에 여백(Spacing.three)이 있는데, 푸터는 화면 가로를 꽉 채워야 하므로
// 같은 크기의 음수 여백으로 여백을 되돌린다. (회사 정보는 SiteFooter 가 그린다)
// 시작 화면과 제조사 선택 화면은 짧아서 화면 맨 아래에 고정하는 SiteFooter 를 직접 쓴다.
// ============================================================================

import { StyleSheet, View } from 'react-native';

import { SiteFooter } from '@/components/site-footer';
import { Spacing } from '@/constants/theme';

export function PageFooter() {
  return (
    <View style={styles.bleed}>
      <SiteFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -Spacing.three, marginTop: Spacing.four },
});
