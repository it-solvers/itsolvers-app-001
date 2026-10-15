// ============================================================================
// 견적 확인 화면 ("/summary?...").  가격 화면에서 "견적 확인"을 눌렀을 때 열린다.
// 지금까지 고른 제조사, 차종, 트림, 사양, 옵션, 색상과 합계를 한 화면에 정리해서 "보여주기만" 한다.
//
// [선택한 내용을 어떻게 받나?]
// 가격 화면은 고른 내용을 "코드 글자"로 주소에 실어 보낸다. (예: optionCodes=HIE,PA1)
// 이 화면은 그 코드를 읽어서 가격 데이터(오늘 저장된 것이 있어 보통 바로 열린다)에서
// 이름과 가격을 찾아 보여준다. 이름과 가격을 직접 넘기지 않고 코드만 넘기는 이유는, 같은 정보를
// 두 군데에 두면 서로 달라질 수 있고, 합계도 가격 화면과 같은 계산 함수를 그대로 쓰기 위해서다.
// ============================================================================

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

// 가격 화면이 주소로 넘겨주는 값들. 주소 값은 글자만 가능하므로 모두 string 이고, 없을 수도 있다(?).
type Params = {
  brand?: string;
  carName?: string;
  engineName?: string;
  trimName?: string;
  saleModelCode?: string;
  specCode?: string;
  optionCodes?: string; // 쉼표로 이어진 옵션 코드들 (예: "HIE,PA1")
  interiorCode?: string; // 선택하지 않았으면 빈 글자
  exteriorCode?: string;
};

export default function SummaryScreen() {
  const params = useLocalSearchParams<Params>();
  const { saleModelCode, specCode, optionCodes, interiorCode, exteriorCode } = params;

  // 가격 화면에서 고른 내용을 주소 값으로 받아서 다시 만든다.
  //  - 쉼표로 이어진 글자를 배열로 쪼개고(split) 빈 글자를 걸러낸다(filter(Boolean)).
  //  - 빈 글자('')인 색상은 "선택 안 함"을 뜻하므로 null 로 바꾼다 (|| 는 앞이 빈 글자면 뒤의 값을 쓴다).
  //  - useMemo: 값이 같으면 같은 객체를 유지한다. (매번 새 객체를 만들면 아래 계산이 불필요하게 반복된다)
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

  // 필요한 값이 없으면(주소를 직접 입력해서 들어온 경우 등) 안내만 보여준다.
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

// 가격 데이터가 준비된 뒤에 실제 내용을 그린다. (가격 화면의 PriceBody 와 같은 방식)
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
  // items: 고른 코드를 실제 사양/옵션/색상 정보로 바꾼 것, breakdown: 합계.
  // 둘 다 가격 화면과 같은 함수(utils/price.ts)라서 두 화면의 금액이 어긋나지 않는다.
  const items = useMemo(() => selectedItems(price, selection), [price, selection]);
  const breakdown = useMemo(() => calcBreakdown(price, selection), [price, selection]);
  const brand = findBrand(params.brand);
  const purpose = trimPurposeName(price.saleModelCode);
  // 엔진 이름과 트림 이름을 공백으로 이어 붙인다. 비어 있는 것은 걸러낸다.
  const trimLabel = [params.engineName, params.trimName].filter(Boolean).join(' ');

  // 선택한 사양을 가격 데이터에서 찾지 못하는 비정상 상황의 안내
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
                  // 튜익스(제조사 추가 옵션)는 일반 옵션과 구별되도록 이름 뒤에 표시를 붙인다.
                  label={option.kind === 'tuix' ? `${option.name} (추가 옵션)` : option.name}
                  value={formatExtra(option.price)}
                />
              ))
            )}
          </Card>
        </Section>

        <Section title="색상">
          <Card>
            {/* 색상을 고르지 않았으면 "선택 안 함"과 가격 자리에 '-'를 보여준다 */}
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

      {/* 아래쪽: 스크롤과 상관없이 항상 보이는 합계 영역 (가격 화면과 같은 모양) */}
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

// 둥근 상자. 안의 내용(children)을 감싸서 구역을 눈에 띄게 한다.
function Card({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {children}
    </ThemedView>
  );
}

// 왼쪽에 항목, 오른쪽에 값. 항목이 길면 줄바꿈된다.
// (lineLabel 은 flex: 1 이라 남는 공간을 차지하며 줄바꿈되고, lineValue 는 flexShrink: 0 이라 가격이 줄어들거나 잘리지 않는다.)
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
