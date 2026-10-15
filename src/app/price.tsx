// ============================================================================
// 가격 확인 화면 ("/price?saleModelCode=...&..."). 이 앱의 핵심 화면이다.
// 사양, 옵션, 내장/외장 색상을 고르면 아래에 합계가 바로 계산된다.
//
// [구조]
//   PriceScreen  : 주소 값을 읽고 가격 데이터를 불러온다 (불러오는 중/오류 처리까지)
//   PriceBody    : 데이터가 준비된 뒤에 실제 화면(선택 목록 + 하단 합계)을 그린다
//
// [왜 둘로 나눴나?]
// 선택 상태(useOptionSelection)는 "가격 데이터가 있어야" 처음 값을 정할 수 있다
// (예: 추가금 없는 사양을 기본으로 고름). 훅은 조건문 안에서 부를 수 없으므로,
// 데이터가 준비됐을 때만 PriceBody 를 그리게 해서 PriceBody 안에서는 항상 데이터가 있도록 했다.
// ============================================================================

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataNotice } from '@/components/data-notice';
import { LoadStatus } from '@/components/load-status';
import { Section } from '@/components/section';
import { SelectRow } from '@/components/select-row';
import { PriceDisclaimer, StudyNotice } from '@/components/study-notice';
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

// 견적 확인 화면에 넘겨서 쓰는 트림 정보
type TrimInfo = { brand: string; carName: string; engineName: string; trimName: string; saleModelCode: string };

export default function PriceScreen() {
  // 트림 화면이 넘긴 값들을 읽는다. 모두 선택적(?)이다. 주소로 전달되는 값은 항상 있다고 보장할 수 없기 때문이다.
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

  // 트림 코드가 없으면 가격을 조회할 수 없으므로 안내만 보여준다.
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
      {/* 모든 화면 위쪽에 보이는 "학습용" 안내 배너 (불러오는 중이나 오류일 때도 보인다) */}
      <StudyNotice />
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

  // 선택 상태와 선택 동작을 모두 훅에서 받는다. 복잡한 규칙은 훅 안에 있고, 이 화면은 그리기만 한다.
  //   selection        지금 고른 내용 (사양/옵션/색상 코드)
  //   disabledReasons  못 고르는 옵션 코드 → 이유
  //   busy             규칙을 확인하는 중인지
  //   message          "함께 선택됨: ..." 같은 안내 문구
  //   ruleError        규칙 확인 실패 시 오류 문구
  //   selectSpec ...   각각 사양/옵션/색상을 누를 때 부르는 함수
  const { selection, disabledReasons, busy, message, ruleError, selectSpec, toggleOption, setInterior, setExterior } =
    useOptionSelection(price);
  // 합계: 선택이 바뀔 때만 다시 계산한다.
  const breakdown = useMemo(() => calcBreakdown(price, selection), [price, selection]);

  return (
    <>
      {/* 위쪽: 스크롤되는 선택 목록 */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scroll, { paddingBottom: Spacing.four }]}>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        <DataNotice result={result} />

        {/* 사양: 하나만 고르는 라디오 버튼 */}
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

        {/* 선택 옵션: 여러 개를 고르는 체크박스 */}
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
            // specOk: 지금 고른 사양에서 쓸 수 있는 옵션인가
            const specOk = isOptionAvailable(option, selection.specCode);
            const selected = specOk && selection.optionCodes.includes(option.code);
            // reason: 제조사 규칙상 지금은 못 고르는 이유 (없으면 undefined = 고를 수 있음)
            const reason = disabledReasons[option.code];
            return (
              <SelectRow
                key={option.code}
                mode="check"
                title={option.name}
                rightText={formatExtra(option.price)}
                // 보조 문구: 이 사양에서 못 쓰는 옵션이면 그 안내를, 쓸 수 있는 옵션이면 (선택하지 않았고 못 고르는
                // 이유가 있을 때만) 그 이유를 보여준다.
                subtitle={specOk ? (selected ? undefined : reason) : '선택한 사양에서는 고를 수 없습니다'}
                // 선택된 옵션은 언제나 해제할 수 있어야 한다.
                disabled={!specOk || (!selected && !!reason)}
                selected={selected}
                onPress={() => toggleOption(option.code)}
              />
            );
          })}
        </Section>

        {/* 색상: 같은 색을 다시 누르면 선택이 해제된다 (선택하지 않으면 색상 가격이 합계에 들어가지 않는다) */}
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

      {/* 아래쪽: 스크롤과 상관없이 항상 보이는 합계 영역 (오류 안내, 합계, 견적 확인 버튼, 참고용 문구) */}
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
        {/*
          견적 확인 버튼. 지금 고른 내용을 주소 값으로 만들어 다음 화면에 넘긴다.
          주소 값은 글자만 전달되므로, 옵션 코드 배열은 쉼표로 이어 한 글자로 만들고(join),
          선택하지 않은 색상(null)은 빈 글자('')로 바꿔 보낸다. 견적 화면이 이것을 다시 풀어서 쓴다.
          규칙을 확인하는 중(busy)에는 아직 확정되지 않은 선택일 수 있어서 누를 수 없게 한다.
        */}
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
        {/* 금액이 보이는 화면에는 항상 "학습용" 안내를 눈에 띄는 색으로 함께 보여준다 (문구는 constants/notices.ts) */}
        <PriceDisclaimer />
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
