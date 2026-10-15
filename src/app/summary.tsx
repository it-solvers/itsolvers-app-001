import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataNotice } from '@/components/data-notice';
import { LoadStatus } from '@/components/load-status';
import { Section } from '@/components/section';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { findBrand } from '@/constants/brands';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import type { LoadResult } from '@/storage/cache';
import { getTrimPrice } from '@/storage/vehicleData';
import type { TrimPrice } from '@/types/car';
import { calcBreakdown, formatExtra, formatPrice, selectedItems, type Selection } from '@/utils/price';
import { trimPurposeName } from '@/utils/trim';

const DISCLAIMER =
  '참고용 가격입니다. 실제 구매 가격은 제조사 또는 영업점에서 반드시 확인하세요.';

type Params = {
  brand?: string;
  carName?: string;
  engineName?: string;
  trimName?: string;
  saleModelCode?: string;
  specCode?: string;
  optionCodes?: string;
  interiorCode?: string;
  exteriorCode?: string;
};

export default function SummaryScreen() {
  const params = useLocalSearchParams<Params>();
  const { saleModelCode, specCode, optionCodes, interiorCode, exteriorCode } = params;

  // 가격 화면에서 고른 내용을 주소 값으로 받아서 다시 만든다.
  const selection: Selection = useMemo(
    () => ({
      specCode: specCode ?? '',
      optionCodes: (optionCodes ?? '').split(',').filter(Boolean),
      interiorCode: interiorCode || null,
      exteriorCode: exteriorCode || null,
    }),
    [specCode, optionCodes, interiorCode, exteriorCode],
  );
  // 가격 데이터는 오늘 이미 불러온 것이 저장되어 있어서 보통 바로 열린다.
  const load = useCallback(() => getTrimPrice(saleModelCode ?? ''), [saleModelCode]);
  const { state, retry } = useLoad(load);

  if (!saleModelCode || !specCode) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>견적 정보가 없습니다. 가격 화면에서 다시 선택해 주세요.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '견적 확인' }} />
      <LoadStatus
        state={state}
        loadingText="견적을 불러오는 중입니다."
        errorText="견적을 불러오지 못했습니다."
        onRetry={retry}
      />
      {state.status === 'ready' && <SummaryBody params={params} selection={selection} result={state.result} />}
    </ThemedView>
  );
}

function SummaryBody({
  params,
  selection,
  result,
}: {
  params: Params;
  selection: Selection;
  result: LoadResult<TrimPrice>;
}) {
  const price = result.data;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const items = useMemo(() => selectedItems(price, selection), [price, selection]);
  const breakdown = useMemo(() => calcBreakdown(price, selection), [price, selection]);
  const brand = findBrand(params.brand);
  const purpose = trimPurposeName(price.saleModelCode);
  const trimLabel = [params.engineName, params.trimName].filter(Boolean).join(' ');

  if (!items.spec) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>선택한 사양을 찾을 수 없습니다. 가격 화면에서 다시 선택해 주세요.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <DataNotice result={result} />

        <Section title="차량">
          <Card>
            <Line label="제조사" value={brand?.name ?? '-'} />
            <Line label="차종" value={params.carName || '-'} />
            <Line label="트림" value={trimLabel || '-'} />
            <Line label="구매 용도" value={purpose ?? '-'} />
            <Line label="모델 코드" value={price.saleModelCode} />
          </Card>
        </Section>

        <Section title="사양">
          <Card>
            <Line label={items.spec.name} value={formatPrice(items.spec.price)} />
          </Card>
        </Section>

        <Section title="선택 옵션">
          <Card>
            {items.options.length === 0 ? (
              <ThemedText themeColor="textSecondary">선택한 옵션 없음</ThemedText>
            ) : (
              items.options.map((option) => (
                <Line
                  key={option.code}
                  label={option.kind === 'tuix' ? `${option.name} (추가 옵션)` : option.name}
                  value={formatExtra(option.price)}
                />
              ))
            )}
          </Card>
        </Section>

        <Section title="색상">
          <Card>
            <Line
              label={`내장 · ${items.interior?.name ?? '선택 안 함'}`}
              value={items.interior ? formatExtra(items.interior.price) : '-'}
            />
            <Line
              label={`외장 · ${items.exterior?.name ?? '선택 안 함'}`}
              value={items.exterior ? formatExtra(items.exterior.price) : '-'}
            />
          </Card>
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {children}
    </ThemedView>
  );
}

// 왼쪽에 항목, 오른쪽에 값. 항목이 길면 줄바꿈된다.
function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <ThemedText style={styles.lineLabel}>{label}</ThemedText>
      <ThemedText type="smallBold" style={styles.lineValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.three },
  lineLabel: { flex: 1 },
  lineValue: { flexShrink: 0, textAlign: 'right' },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
