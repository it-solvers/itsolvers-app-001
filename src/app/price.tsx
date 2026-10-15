import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataNotice } from '@/components/data-notice';
import { LoadStatus } from '@/components/load-status';
import { SelectRow } from '@/components/select-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import type { LoadResult } from '@/storage/cache';
import { getTrimPrice } from '@/storage/vehicleData';
import type { TrimPrice } from '@/types/car';
import { calcBreakdown, formatExtra, formatPrice, isOptionAvailable, type Selection } from '@/utils/price';

const DISCLAIMER =
  '참고용 가격입니다. 실제 구매 가격은 제조사 또는 영업점에서 반드시 확인하세요.';

export default function PriceScreen() {
  const { saleModelCode, title } = useLocalSearchParams<{ saleModelCode?: string; title?: string }>();
  const load = useCallback(() => getTrimPrice(saleModelCode ?? ''), [saleModelCode]);
  const { state, retry } = useLoad(load);

  if (!saleModelCode) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>트림 정보가 없습니다.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '가격 확인' }} />
      <LoadStatus
        state={state}
        loadingText="가격을 불러오는 중입니다."
        errorText="가격을 불러오지 못했습니다."
        onRetry={retry}
      />
      {state.status === 'ready' && <PriceBody title={title ?? ''} result={state.result} />}
    </ThemedView>
  );
}

// 가격 데이터가 준비된 뒤에 그려서, 선택 상태의 처음 값을 데이터로 정할 수 있게 한다.
function PriceBody({ title, result }: { title: string; result: LoadResult<TrimPrice> }) {
  const price = result.data;
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [selection, setSelection] = useState<Selection>(() => ({
    // 추가금이 없는 사양(기본)을 먼저 고른다.
    specCode: (price.specs.find((s) => s.extraPrice === 0) ?? price.specs[0])?.code ?? '',
    optionCodes: [],
    interiorCode: null,
    exteriorCode: null,
  }));
  const breakdown = useMemo(() => calcBreakdown(price, selection), [price, selection]);

  const toggleOption = (code: string) =>
    setSelection((s) => ({
      ...s,
      optionCodes: s.optionCodes.includes(code) ? s.optionCodes.filter((c) => c !== code) : [...s.optionCodes, code],
    }));

  // 사양을 바꾸면 새 사양에서 고를 수 없는 옵션은 선택에서 뺀다.
  const selectSpec = (specCode: string) =>
    setSelection((s) => ({
      ...s,
      specCode,
      optionCodes: s.optionCodes.filter((code) => {
        const option = price.options.find((o) => o.code === code);
        return option ? isOptionAvailable(option, specCode) : false;
      }),
    }));

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scroll, { paddingBottom: Spacing.four }]}>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        <DataNotice result={result} />

        <Section title="사양">
          {price.specs.map((spec) => (
            <SelectRow
              key={spec.code}
              mode="radio"
              title={spec.name}
              rightText={formatPrice(spec.price)}
              subtitle={spec.extraPrice === 0 ? '기본 사양' : `기본 사양 대비 ${formatExtra(spec.extraPrice)}`}
              selected={selection.specCode === spec.code}
              onPress={() => selectSpec(spec.code)}
            />
          ))}
        </Section>

        <Section title="선택 옵션">
          {price.options.length === 0 && (
            <ThemedText themeColor="textSecondary">선택할 수 있는 옵션이 없습니다.</ThemedText>
          )}
          {price.options.map((option) => {
            const available = isOptionAvailable(option, selection.specCode);
            return (
              <SelectRow
                key={option.code}
                mode="check"
                title={option.name}
                rightText={formatExtra(option.price)}
                subtitle={available ? undefined : '선택한 사양에서는 고를 수 없습니다'}
                disabled={!available}
                selected={available && selection.optionCodes.includes(option.code)}
                onPress={() => toggleOption(option.code)}
              />
            );
          })}
        </Section>

        <Section title="내장 색상" hint="한 번 더 누르면 선택이 해제됩니다. 선택하지 않으면 합계에 색상 가격이 포함되지 않습니다.">
          {price.interiorColors.map((color) => (
            <SelectRow
              key={color.code}
              mode="radio"
              title={color.name}
              rightText={formatExtra(color.price)}
              selected={selection.interiorCode === color.code}
              onPress={() =>
                setSelection((s) => ({ ...s, interiorCode: s.interiorCode === color.code ? null : color.code }))
              }
            />
          ))}
        </Section>

        <Section title="외장 색상" hint="한 번 더 누르면 선택이 해제됩니다.">
          {price.exteriorColors.map((color) => (
            <SelectRow
              key={color.code}
              mode="radio"
              title={color.name}
              rightText={formatExtra(color.price)}
              selected={selection.exteriorCode === color.code}
              onPress={() =>
                setSelection((s) => ({ ...s, exteriorCode: s.exteriorCode === color.code ? null : color.code }))
              }
            />
          ))}
        </Section>
      </ScrollView>

      <ThemedView
        type="backgroundElement"
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two, borderTopColor: theme.backgroundSelected }]}>
        <ThemedView type="backgroundElement" style={styles.totalRow}>
          <ThemedText type="smallBold">합계</ThemedText>
          <ThemedText type="subtitle" accessibilityLabel={`합계 ${formatPrice(breakdown.total)}`}>
            {formatPrice(breakdown.total)}
          </ThemedText>
        </ThemedView>
        <ThemedText type="small" themeColor="textSecondary">
          {`사양 ${formatPrice(breakdown.specPrice)} + 옵션 ${formatPrice(breakdown.optionsPrice)} + 색상 ${formatPrice(breakdown.colorsPrice)}`}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {DISCLAIMER}
        </ThemedText>
      </ThemedView>
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
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
      <ThemedView style={styles.sectionBody}>{children}</ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 24, lineHeight: 32 },
  section: { gap: Spacing.one, marginTop: Spacing.two },
  sectionBody: { gap: Spacing.two, marginTop: Spacing.one },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
