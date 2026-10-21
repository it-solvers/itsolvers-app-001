// ============================================================================
// 차량 선택 완료 화면 ("/summary?...").  가격 화면에서 "차량 선택 완료"를 눌렀을 때 열린다.
//
// [화면 구성]
//   1) 차량 선택 정보: 제조사, 차종, 트림, 사양, 선택 옵션, 색상, 그리고 마지막에 "차량가격"
//   2) 리스료 계산: 기간, 선수금, 보증금, 잔존가치, 금리를 고르거나 입력하면 월 납입금액이 바로 계산된다
//   (합계를 화면 맨 아래에 고정해 두지 않는다. 입력 칸이 많아서 고정 영역이 키보드를 가리기 때문이다.)
//
// [선택한 내용을 어떻게 받나?]
// 가격 화면은 고른 내용을 "코드 글자"로 주소에 실어 보낸다. (예: optionCodes=HIE,PA1)
// 이 화면은 그 코드를 읽어서 가격 데이터(오늘 저장된 것이 있어 보통 바로 열린다)에서
// 이름과 가격을 찾아 보여준다. 이름과 가격을 직접 넘기지 않고 코드만 넘기는 이유는, 같은 정보를
// 두 군데에 두면 서로 달라질 수 있고, 차량가격도 가격 화면과 같은 계산 함수를 그대로 쓰기 위해서다.
// 리스료 계산 자체는 화면과 분리된 순수 함수(src/utils/lease.ts)가 한다.
// ============================================================================

import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AmountInput } from '@/components/amount-input';
import { BrandLogo } from '@/components/brand-logo';
import { ColorDot } from '@/components/color-dot';
import { DataNotice } from '@/components/data-notice';
import { KeyboardScrollView } from '@/components/keyboard-scroll';
import { LoadStatus } from '@/components/load-status';
import { AmountPercentField } from '@/components/amount-percent-field';
import { RemoteImage } from '@/components/remote-image';
import { Section } from '@/components/section';
import { PriceDisclaimer, StudyNotice } from '@/components/study-notice';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { findBrand } from '@/constants/brands';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import type { LoadResult } from '@/storage/cache';
import { getTrimPrice } from '@/storage/vehicleData';
import type { TrimPrice } from '@/types/car';
import {
  calcLeasePayment,
  LEASE_TERMS,
  percentAmount,
  parseNumberText,
} from '@/utils/lease';
import { translateName } from '@/utils/name-dict';
import { carImageUrl, colorChipUrl } from '@/utils/images';
import { shareText, type ShareOutcome } from '@/utils/share';
import { buildLeaseShareText } from '@/utils/share-text';
import { calcBreakdown, formatExtra, formatPrice, selectedItems, type Selection } from '@/utils/price';
import { trimPurposeName } from '@/utils/trim';

// 가격 화면이 주소로 넘겨주는 값들. 주소 값은 글자만 가능하므로 모두 string 이고, 없을 수도 있다(?).
type Params = {
  manual?: string; // "1" 이면 차량을 고르지 않고 차량가격을 직접 입력하는 모드 (제조사 선택 화면의 "차량가격 직접 입력")
  brand?: string;
  car?: string; // 차종 코드 (이미지 주소를 만드는 데 쓴다)
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
  const { saleModelCode, specCode, optionCodes, interiorCode, exteriorCode, manual } = params;
  const isManual = manual === '1';

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

  // 직접 입력 모드: 차량 정보 없이 차량가격만 입력받는다. 가격 데이터를 불러오지 않으므로 바로 그린다.
  if (isManual) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: t('nav.summary') }} />
        <StudyNotice />
        <ManualBody />
      </ThemedView>
    );
  }

  // 필요한 값이 없으면(주소를 직접 입력해서 들어온 경우 등) 안내만 보여준다.
  if (!saleModelCode || !specCode) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>{t('summary.noInfo')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t('nav.summary') }} />
      {/* 앱 기본 제목줄(뒤로 가기 + 제목) 아래에 "학습용" 안내 배너 */}
      <StudyNotice />
      <LoadStatus
        state={state}
        loadingText={t('summary.loading')}
        errorText={t('summary.error')}
        onRetry={retry}
      />
      {state.status === 'ready' && <SummaryBody params={params} selection={selection} result={state.result} />}
    </ThemedView>
  );
}

// 차량가격 직접 입력 모드의 본문.
// 차량 정보(제조사, 차종, 트림, 사양, 옵션, 색상, 이미지)는 고른 것이 없으므로 아예 보여주지 않고,
// 차량가격 입력부터 보여준다. 입력한 차량가격을 기준으로 아래 리스료 계산(LeaseSection)이 동작한다.
// 입력한 금액은 어디에도 저장하지 않는다.
function ManualBody() {
  // 차량가격 입력 글자. 숫자만 든 글자("28760000")로 보관하고, 비어 있으면 아직 입력하지 않은 것이다.
  const [priceText, setPriceText] = useState('');
  const vehiclePrice = parseNumberText(priceText);

  return (
    <KeyboardScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      {/* 맨 위가 바로 차량가격: 직접 입력한다 */}
      <Section title={t('summary.vehiclePrice')}>
        <Card>
          <AmountInput
            label={t('summary.manualLabel')}
            unit={t('amount.unit')}
            kind="amount"
            value={priceText}
            onChangeText={setPriceText}
            placeholder={t('summary.manualPlaceholder')}
            // PC(웹)에서는 화면이 열리면 바로 차량가격 칸에 커서를 둔다. 폰에서는 키보드가 갑자기 올라오지 않도록 쓰지 않는다.
            autoFocus={Platform.OS === 'web'}
            hint={t('summary.manualHint')}
          />
        </Card>
      </Section>

      <LeaseSection vehiclePrice={vehiclePrice} />
      <PriceDisclaimer />
    </KeyboardScrollView>
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
  // items: 고른 코드를 실제 사양/옵션/색상 정보로 바꾼 것, breakdown: 합계.
  // 둘 다 가격 화면과 같은 함수(utils/price.ts)라서 두 화면의 금액이 어긋나지 않는다.
  const items = useMemo(() => selectedItems(price, selection), [price, selection]);
  const breakdown = useMemo(() => calcBreakdown(price, selection), [price, selection]);
  const brand = findBrand(params.brand);
  const purpose = trimPurposeName(price.saleModelCode);
  // 엔진 이름과 트림 이름을 공백으로 이어 붙인다. 비어 있는 것은 걸러낸다.
  const trimLabel = [params.engineName, params.trimName].filter(Boolean).map((name) => translateName(name ?? '')).join(' ');

  // 공유 글자에 넣을 차량 정보 줄들 (제조사·차종, 트림, 사양, 옵션, 색상)
  const vehicleLines = [
    `${brand?.name ?? ''} ${params.carName ?? ''}`.trim(),
    t('summary.lineTrim', { value: `${trimLabel}${purpose ? ` (${purpose})` : ''}` }),
    items.spec ? t('summary.lineSpec', { value: translateName(items.spec.name) }) : '',
    items.options.length > 0 ? t('summary.lineOptions', { value: items.options.map((o) => translateName(o.name)).join(', ') }) : '',
    items.exterior ? t('summary.lineExterior', { value: translateName(items.exterior.name) }) : '',
    items.interior ? t('summary.lineInterior', { value: translateName(items.interior.name) }) : '',
  ].filter((line) => line !== '');

  // 선택한 사양을 가격 데이터에서 찾지 못하는 비정상 상황의 안내
  if (!items.spec) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>{t('summary.specNotFound')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <KeyboardScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <DataNotice result={result} />

        <Section title={t('summary.vehicle')}>
          <Card>
            {/* 제조사 엠블럼과 이름, 그 아래에 선택한 차종의 이미지 */}
            {brand ? (
              <View style={styles.brandRow}>
                <BrandLogo uri={brand.logoUrl} name={brand.name} />
                <ThemedText type="default" style={styles.brandName}>
                  {brand.name}
                </ThemedText>
              </View>
            ) : null}
            <ThemedView style={styles.carImageArea}>
              <RemoteImage uri={carImageUrl(params.car)} label={params.carName} style={styles.carImage} />
            </ThemedView>
            <Line label={t('summary.brand')} value={brand?.name ?? '-'} />
            <Line label={t('summary.car')} value={params.carName || '-'} />
            <Line label={t('summary.trim')} value={trimLabel || '-'} />
            <Line label={t('summary.purpose')} value={purpose ?? '-'} />
            <Line label={t('summary.modelCode')} value={price.saleModelCode} />
          </Card>
        </Section>

        <Section title={t('summary.spec')}>
          <Card>
            <Line label={translateName(items.spec.name)} value={formatPrice(items.spec.price)} />
          </Card>
        </Section>

        <Section title={t('summary.options')}>
          <Card>
            {items.options.length === 0 ? (
              <ThemedText themeColor="textSecondary">{t('summary.noOptions')}</ThemedText>
            ) : (
              items.options.map((option) => (
                <Line
                  key={option.code}
                  // 튜익스(제조사 추가 옵션)는 일반 옵션과 구별되도록 이름 뒤에 표시를 붙인다.
                  label={option.kind === 'tuix' ? t('summary.tuixSuffix', { name: translateName(option.name) }) : translateName(option.name)}
                  value={formatExtra(option.price)}
                />
              ))
            )}
          </Card>
        </Section>

        <Section title={t('summary.colors')}>
          <Card>
            {/* 색상을 고르지 않았으면 "선택 안 함"과 가격 자리에 '-'를 보여준다 */}
            <Line
              label={t('summary.interiorLine', { name: items.interior ? translateName(items.interior.name) : t('summary.notSelected') })}
              value={items.interior ? formatExtra(items.interior.price) : '-'}
              // 고른 색상이 있으면 이름 앞에 그 색상을 동그랗게 보여준다
              swatchUri={items.interior ? (colorChipUrl(params.car, 'interior', items.interior.code) ?? '') : undefined}
            />
            <Line
              label={t('summary.exteriorLine', { name: items.exterior ? translateName(items.exterior.name) : t('summary.notSelected') })}
              value={items.exterior ? formatExtra(items.exterior.price) : '-'}
              swatchUri={items.exterior ? (colorChipUrl(params.car, 'exterior', items.exterior.code) ?? '') : undefined}
            />
          </Card>
        </Section>

        {/* 차량 선택 정보의 마지막: 차량가격 (가격 화면의 합계와 같은 계산) */}
        <Section title={t('summary.vehiclePrice')}>
          <Card>
            <Line label={t('summary.spec')} value={formatPrice(breakdown.specPrice)} />
            <Line label={t('summary.optionsShort')} value={formatPrice(breakdown.optionsPrice)} />
            <Line label={t('summary.colorsShort')} value={formatPrice(breakdown.colorsPrice)} />
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <ThemedText type="smallBold">{t('summary.vehiclePrice')}</ThemedText>
              <ThemedText
                type="subtitle"
                accessibilityLabel={`${t('summary.vehiclePrice')} ${formatPrice(breakdown.total)}`}>
                {formatPrice(breakdown.total)}
              </ThemedText>
            </View>
          </Card>
        </Section>

        {/* 아래쪽: 리스료 계산. 입력이 바뀔 때마다 월 납입금액이 바로 계산된다. */}
        <LeaseSection vehiclePrice={breakdown.total} vehicleLines={vehicleLines} />

        {/* 금액이 보이는 화면에는 항상 "학습용" 안내를 눈에 띄는 색으로 함께 보여준다 (문구는 i18n 의 notice 항목) */}
        <PriceDisclaimer />
      </KeyboardScrollView>
    </>
  );
}

// 선수금, 보증금, 잔존가치의 처음 값(차량가격 대비 %)
const DEFAULT_PERCENT = 30;

// ---------------------------------------------------------------------------
// 리스료 계산 구역. 입력(기간, 선수금, 보증금, 잔존가치, 금리)과 결과(월 납입금액)를 보여준다.
// 계산식은 src/utils/lease.ts 와 docs/APP_SPEC.md 5장에 있다.
//   vehiclePrice  차량가격(원). 직접 입력 모드에서 아직 입력하지 않았으면 0 이다.
//   vehicleLines  공유할 때 글자에 넣을 차량 정보 줄들. 직접 입력 모드에서는 비어 있다.
// ---------------------------------------------------------------------------
function LeaseSection({ vehiclePrice, vehicleLines = [] }: { vehiclePrice: number; vehicleLines?: string[] }) {
  const theme = useTheme();
  // 오류 글자색: 어두운 배경에서도 잘 보이도록 다크 모드에서는 밝은 빨강을 쓴다.
  const errorColor = useColorScheme() === 'dark' ? '#ff8a80' : '#c0392b';
  // 입력 값들. 선수금, 보증금, 잔존가치는 "금액"이 주인이다. 숫자만 든 글자("10000000")로 보관하고,
  // 비율 버튼을 누르면 차량가격의 비율만큼의 금액이 이 글자에 들어간다. (비율은 금액에서 거꾸로 계산해 보여준다)
  // 금리는 "5.25"처럼 글자로 보관한다. (입력 중인 "5." 같은 중간 상태를 그대로 보여줄 수 있어야 하기 때문이다)
  const [termMonths, setTermMonths] = useState<number>(36); // 처음에는 36개월을 선택해 둔다
  // null = 아직 손대지 않음 → 기본값(차량가격의 30%)을 보여준다. 차량가격이 바뀌면 기본값도 따라 바뀐다.
  // 사용자가 금액을 고치거나 슬라이더를 움직이면 그 값(글자, 비우면 "")을 들고 있고, 이후에는 차량가격이 바뀌어도 유지한다.
  const [prepaidEdit, setPrepaidEdit] = useState<string | null>(null);
  const [depositEdit, setDepositEdit] = useState<string | null>(null);
  const [residualEdit, setResidualEdit] = useState<string | null>(null);
  const defaultText = vehiclePrice > 0 ? String(percentAmount(vehiclePrice, DEFAULT_PERCENT)) : '';
  const prepaidText = prepaidEdit ?? defaultText;
  const depositText = depositEdit ?? defaultText;
  const residualText = residualEdit ?? defaultText;
  const [rateText, setRateText] = useState('');
  // 공유 결과 안내 (복사했는지 등). 계산 입력이 바뀌면 지운다.
  const [shareNotice, setShareNotice] = useState('');

  // 입력 한도: 차량가격 > 선수금 + 보증금, 차량가격 > 잔존가치. 한도를 넘는 값은 입력할 수 없고 한도로 맞춰진다.
  // 선수금의 한도는 보증금에 따라, 보증금의 한도는 선수금에 따라 달라진다. 차량가격이 아직 없으면 한도를 두지 않는다.
  // (아래 deposit, prepaid 값은 이 줄 다음에 계산되므로, 한도는 입력한 글자에서 바로 구한다)
  const hasPrice = vehiclePrice > 0;
  const depositNow = parseNumberText(depositText);
  const prepaidNow = parseNumberText(prepaidText);
  const maxPrepaid = hasPrice ? Math.max(0, vehiclePrice - 1 - depositNow) : undefined;
  const maxDeposit = hasPrice ? Math.max(0, vehiclePrice - 1 - prepaidNow) : undefined;
  const maxResidual = hasPrice ? vehiclePrice - 1 : undefined;
  /** 입력 글자가 한도를 넘으면 한도로 맞춘 글자를 돌려준다. */
  const clampText = (digits: string, max: number | undefined) =>
    max === undefined || digits === '' || Number(digits) <= max ? digits : String(max);

  // 입력한 금액 글자 → 숫자. 비어 있으면 0원이다.
  const prepaid = parseNumberText(prepaidText);
  const deposit = parseNumberText(depositText);
  const residual = parseNumberText(residualText);

  // 금리를 비우면 계산하지 않고 안내만 보여준다. 차량가격이 없을 때도 마찬가지다.
  const rateEmpty = rateText === '' || rateText === '.';
  const noPrice = !(vehiclePrice > 0);
  const result = useMemo(
    () =>
      rateEmpty || noPrice
        ? null
        : calcLeasePayment({
            vehiclePrice,
            termMonths,
            prepaid,
            deposit,
            residual,
            annualRatePercent: parseNumberText(rateText),
          }),
    [vehiclePrice, termMonths, prepaid, deposit, residual, rateText, rateEmpty, noPrice],
  );

  // "견적 공유하기": 지금 계산 결과를 글자로 만들어 공유창을 연다 (웹 PC 에서는 복사)
  const onShare = async (monthlyPayment: number) => {
    const outcome: ShareOutcome = await shareText(
      buildLeaseShareText({
        vehicleLines,
        vehiclePrice,
        termMonths,
        prepaid,
        deposit,
        residual,
        annualRatePercent: parseNumberText(rateText),
        monthlyPayment,
      }),
    );
    setShareNotice(
      outcome === 'copied'
        ? t('lease.copied')
        : outcome === 'failed'
          ? t('lease.shareFailed')
          : '',
    );
  };

  return (
    <Section title={t('lease.title')}>
      <Card>
        {/* 기간: 5개 중 하나만 고르는 버튼 줄 */}
        <View style={styles.field}>
          <ThemedText type="smallBold">{t('lease.term')}</ThemedText>
          <View style={styles.termRow}>
            {LEASE_TERMS.map((term) => {
              const isSelected = term === termMonths;
              return (
                <Pressable
                  key={term}
                  accessibilityRole="radio"
                  // PC 에서 Tab 키는 입력 칸들만 차례로 이동하도록, 기간 버튼은 Tab 순서에서 뺀다(마우스와 터치로 선택)
                  tabIndex={-1}
                  accessibilityLabel={t('lease.termLabel', { term })}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setTermMonths(term)}
                  style={[
                    styles.termChip,
                    {
                      backgroundColor: isSelected ? '#2563eb' : theme.background,
                      borderColor: isSelected ? '#2563eb' : theme.backgroundSelected,
                    },
                  ]}>
                  <ThemedText type="smallBold" style={{ color: isSelected ? '#ffffff' : theme.text }}>
                    {term}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 선수금, 보증금, 잔존가치: 금액을 직접 입력한다. 아래 [−][+] 버튼으로 차량가격의 5% 단위 금액을 빠르게 넣을 수도 있다. */}
        <AmountPercentField
          label={t('lease.prepaid')}
          vehiclePrice={vehiclePrice}
          amountText={prepaidText}
          maxAmount={maxPrepaid}
          limitText={t('lease.prepaidDepositLimit')}
          onChangeAmount={(digits) => setPrepaidEdit(clampText(digits, maxPrepaid))}
          hint={t('lease.prepaidHint')}
        />
        <AmountPercentField
          label={t('lease.deposit')}
          vehiclePrice={vehiclePrice}
          amountText={depositText}
          maxAmount={maxDeposit}
          limitText={t('lease.prepaidDepositLimit')}
          onChangeAmount={(digits) => setDepositEdit(clampText(digits, maxDeposit))}
          hint={t('lease.depositHint')}
        />
        <AmountPercentField
          label={t('lease.residual')}
          vehiclePrice={vehiclePrice}
          amountText={residualText}
          maxAmount={maxResidual}
          limitText={t('lease.residualLimit')}
          onChangeAmount={(digits) => setResidualEdit(clampText(digits, maxResidual))}
          hint={t('lease.residualHint')}
        />

        {/* 금리는 직접 입력한다 */}
        <AmountInput
          label={t('lease.rate')}
          unit="%"
          kind="rate"
          value={rateText}
          onChangeText={setRateText}
          placeholder={t('lease.ratePlaceholder')}
        />
      </Card>

      {/* 결과: 월 납입금액. 차량가격이나 금리가 없으면 안내만, 입력이 잘못되면 이유를 보여준다 */}
      <Card>
        {noPrice ? (
          <ThemedText themeColor="textSecondary">{t('lease.needPrice')}</ThemedText>
        ) : result === null ? (
          <ThemedText themeColor="textSecondary">{t('lease.needRate')}</ThemedText>
        ) : result.ok ? (
          <>
            <View style={styles.totalRow}>
              <ThemedText type="smallBold">{t('lease.monthly')}</ThemedText>
              <ThemedText
                type="subtitle"
                accessibilityLabel={t('lease.monthlyLabel', { amount: formatPrice(result.monthlyPayment) })}>
                {formatPrice(result.monthlyPayment)}
              </ThemedText>
            </View>
            {/* 계산 과정: 기본 리스료에서 선수금 차감과 보증금 효과를 뺀 것이 월 납입금액이다 */}
            <Line label={t('lease.base')} value={formatPrice(result.baseMonthly)} />
            <Line label={t('lease.prepaidDeduction')} value={`− ${formatPrice(result.prepaidDeduction)}`} />
            <Line label={t('lease.depositEffect')} value={`− ${formatPrice(result.depositEffect)}`} />
            <ThemedText type="small" themeColor="textSecondary">
              {t('lease.excluded')}
            </ThemedText>
            {/* 공유하기: 결과를 글자로 보낸다. 복사만 된 경우(PC 웹)에는 아래에 안내를 보여준다 */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('lease.share')}
              onPress={() => onShare(result.monthlyPayment)}
              style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.8 : 1 }]}>
              <ThemedText type="smallBold" style={styles.shareButtonText}>
                {t('lease.share')}
              </ThemedText>
            </Pressable>
            {shareNotice ? (
              <ThemedText type="small" themeColor="textSecondary" accessibilityRole="alert">
                {shareNotice}
              </ThemedText>
            ) : null}
          </>
        ) : (
          // 입력이 잘못되었을 때: 경고 색으로 이유를 알려 준다 (화면 낭독 기능이 바로 읽도록 alert)
          <ThemedText accessibilityRole="alert" style={[styles.errorText, { color: errorColor }]}>
            {result.error}
          </ThemedText>
        )}
      </Card>
    </Section>
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
function Line({ label, value, swatchUri }: { label: string; value: string; swatchUri?: string }) {
  return (
    <View style={styles.line}>
      {/* swatchUri 가 있으면(색상 줄) 이름 앞에 색상 동그라미를 붙인다 */}
      {swatchUri !== undefined ? <ColorDot uri={swatchUri} /> : null}
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
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  shareButton: {
    minHeight: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  shareButtonText: { color: '#ffffff', fontSize: 16 },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.three },
  lineLabel: { flex: 1 },
  lineValue: { flexShrink: 0, textAlign: 'right' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  brandName: { fontWeight: 600 },
  carImageArea: {
    backgroundColor: '#ffffff',
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
  },
  carImage: { width: '100%', height: 150 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#98a2b3', marginVertical: Spacing.one },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  // 리스료 입력
  field: { gap: Spacing.two },
  // 기간 버튼 5개를 한 줄에 같은 폭으로 놓는다
  termRow: { flexDirection: 'row', gap: Spacing.two },
  termChip: {
    flex: 1,
    minHeight: 44, // 누르기 쉬운 터치 영역
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
  errorText: { fontWeight: 600 },
});
