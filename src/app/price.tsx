import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataNotice } from '@/components/data-notice';
import { LoadStatus } from '@/components/load-status';
import { Section } from '@/components/section';
import { SelectRow } from '@/components/select-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { useOptionSelection } from '@/hooks/use-option-selection';
import { useTheme } from '@/hooks/use-theme';
import type { LoadResult } from '@/storage/cache';
import { getTrimPrice } from '@/storage/vehicleData';
import type { TrimPrice } from '@/types/car';
import { calcBreakdown, formatExtra, formatPrice, isOptionAvailable } from '@/utils/price';

const DISCLAIMER =
  '참고용 가격입니다. 실제 구매 가격은 제조사 또는 영업점에서 반드시 확인하세요.';

// 견적 확인 화면에 넘겨서 쓰는 트림 정보
type TrimInfo = { brand: string; carName: string; engineName: string; trimName: string; saleModelCode: string };

export default function PriceScreen() {
  const { saleModelCode, title, brand, carName, engineName, trimName } = useLocalSearchParams<{
    saleModelCode?: string;
    title?: string;
    brand?: string;
    carName?: string;
    engineName?: string;
    trimName?: string;
  }>();
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
      {state.status === 'ready' && (
        <PriceBody
          title={title ?? ''}
          trim={{
            brand: brand ?? '',
            carName: carName ?? '',
            engineName: engineName ?? '',
            trimName: trimName ?? '',
            saleModelCode,
          }}
          result={state.result}
        />
      )}
    </ThemedView>
  );
}

// 가격 데이터가 준비된 뒤에 그려서, 선택 상태의 처음 값을 데이터로 정할 수 있게 한다.
function PriceBody({ title, trim, result }: { title: string; trim: TrimInfo; result: LoadResult<TrimPrice> }) {
  const price = result.data;
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { selection, disabledReasons, busy, message, ruleError, selectSpec, toggleOption, setInterior, setExterior } =
    useOptionSelection(price);
  const breakdown = useMemo(() => calcBreakdown(price, selection), [price, selection]);

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

        <Section
          title="선택 옵션"
          hint={busy ? '옵션 선택 조건을 확인하는 중입니다...' : undefined}>
          {message ? (
            <ThemedText type="small" themeColor="textSecondary">
              {message}
            </ThemedText>
          ) : null}
          {price.options.length === 0 && (
            <ThemedText themeColor="textSecondary">선택할 수 있는 옵션이 없습니다.</ThemedText>
          )}
          {price.options.map((option) => {
            const specOk = isOptionAvailable(option, selection.specCode);
            const selected = specOk && selection.optionCodes.includes(option.code);
            const reason = disabledReasons[option.code];
            return (
              <SelectRow
                key={option.code}
                mode="check"
                title={option.name}
                rightText={formatExtra(option.price)}
                subtitle={specOk ? (selected ? undefined : reason) : '선택한 사양에서는 고를 수 없습니다'}
                // 선택된 옵션은 언제나 해제할 수 있어야 한다.
                disabled={!specOk || (!selected && !!reason)}
                selected={selected}
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
              onPress={() => setInterior(color.code)}
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
              onPress={() => setExterior(color.code)}
            />
          ))}
        </Section>
      </ScrollView>

      <ThemedView
        type="backgroundElement"
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two, borderTopColor: theme.backgroundSelected }]}>
        {ruleError ? (
          <ThemedText type="small" style={styles.warning} accessibilityRole="alert">
            {ruleError}
          </ThemedText>
        ) : null}
        <ThemedView type="backgroundElement" style={styles.totalRow}>
          <ThemedText type="smallBold">합계</ThemedText>
          <ThemedText type="subtitle" accessibilityLabel={`합계 ${formatPrice(breakdown.total)}`}>
            {formatPrice(breakdown.total)}
          </ThemedText>
        </ThemedView>
        <ThemedText type="small" themeColor="textSecondary">
          {`사양 ${formatPrice(breakdown.specPrice)} + 옵션 ${formatPrice(breakdown.optionsPrice)} + 색상 ${formatPrice(breakdown.colorsPrice)}`}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() =>
            router.push({
              pathname: '/summary',
              params: {
                ...trim,
                specCode: selection.specCode,
                optionCodes: selection.optionCodes.join(','),
                interiorCode: selection.interiorCode ?? '',
                exteriorCode: selection.exteriorCode ?? '',
              },
            })
          }
          style={[styles.summaryButton, { opacity: busy ? 0.5 : 1 }]}>
          <ThemedText style={styles.summaryButtonText}>{busy ? '옵션 조건 확인 중...' : '견적 확인'}</ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          {DISCLAIMER}
        </ThemedText>
      </ThemedView>
    </>
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
  warning: { color: '#c0392b' },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  summaryButton: {
    minHeight: 48, // 누르기 쉬운 터치 영역
    marginVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
    backgroundColor: '#3c87f7',
  },
  summaryButtonText: { color: '#ffffff', fontWeight: 700 },
});
