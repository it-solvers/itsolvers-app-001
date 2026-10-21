// ============================================================================
// 제조사 엠블럼. 엠블럼이 검은색이라서 어두운 화면에서도 보이도록 항상 흰 바탕 위에 놓는다.
// ============================================================================

import { StyleSheet, View } from 'react-native';

import { RemoteImage } from '@/components/remote-image';
import { t } from '@/i18n';

export function BrandLogo({ uri, name, size = 48 }: { uri: string; name: string; size?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 4 }]}>
      <RemoteImage uri={uri} label={t('brands.emblem', { name })} style={{ width: size * 0.7, height: size * 0.7 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
