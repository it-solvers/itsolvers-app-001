// ============================================================================
// 숫자를 입력하는 칸(제목 + 입력 + 단위). 리스료 계산의 선수금, 보증금, 잔존가치, 금리에 쓴다.
//   kind="amount"  금액(원): 숫자만 받고 천 단위 쉼표를 붙여 보여준다.  예) 3600000 → 3,600,000
//   kind="rate"    금리(%): 숫자와 소수점(둘째 자리까지)을 받는다.      예) 5.25
// 부모 화면이 값(value)을 들고 있고, 이 컴포넌트는 "입력이 바뀌었다"는 것만 알려 준다.
// (이렇게 값을 부모가 들고 있는 입력 칸을 "제어되는 입력"이라고 부른다)
// ============================================================================

import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextStyle } from 'react-native';

import { useKeyboardScroll } from '@/components/keyboard-scroll';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cleanAmountText, cleanRateText, formatWithCommas } from '@/utils/lease';

type AmountInputProps = {
  label: string; // 입력 칸 제목 (예: "선수금")
  unit: string; // 단위 글자 (예: "원", "%")
  kind: 'amount' | 'rate';
  value: string; // 입력된 글자. 금액이면 숫자만("3600000"), 금리면 "5.25"처럼 들어 있다
  onChangeText: (cleaned: string) => void; // 정리된 글자를 부모에게 돌려준다
  placeholder?: string;
  hint?: string; // 칸 아래의 작은 설명
  showLabel?: boolean; // false 면 제목 글자를 보이지 않는다(부모가 더 큰 제목을 따로 보여줄 때). 화면 낭독용 이름은 그대로 남는다
};

export function AmountInput({ label, unit, kind, value, onChangeText, placeholder, hint, showLabel = true }: AmountInputProps) {
  const theme = useTheme();
  // 입력 중인지. 입력 중이면 칸 테두리를 파랗게 해서 "여기에 입력 중"임을 보여준다. (기기 기본 포커스 표시를 대신한다)
  const [focused, setFocused] = useState(false);
  // 키보드가 올라와도 이 칸이 가려지지 않도록, 눌렀을 때 화면을 스크롤해 주는 기능 (components/keyboard-scroll.tsx)
  const { ensureVisible } = useKeyboardScroll();
  const fieldRef = useRef<View>(null);
  // 안의 글자가 전부 선택된 상태인지. 선택되면 파란 배경이 깔리므로 글자색을 흰색으로 바꿔 읽을 수 있게 한다.
  const [allSelected, setAllSelected] = useState(false);
  // 금액은 쉼표를 붙여 보여주고, 금리는 그대로 보여준다.
  const shown = kind === 'amount' ? formatWithCommas(value) : value;

  return (
    <View style={styles.wrapper}>
      {showLabel ? <ThemedText type="smallBold">{label}</ThemedText> : null}
      <View
        ref={fieldRef}
        style={[
          styles.field,
          { backgroundColor: theme.background, borderColor: focused ? FOCUS_COLOR : theme.backgroundSelected },
        ]}>
        <TextInput
          // 화면 낭독 기능이 칸의 이름을 읽을 수 있게 한다
          accessibilityLabel={`${label} (${unit})`}
          value={shown}
          // 사용자가 글자를 바꿀 때마다 숫자 외의 글자를 걸러서 부모에게 알린다
          onChangeText={(text) => onChangeText(kind === 'amount' ? cleanAmountText(text) : cleanRateText(text))}
          // 숫자 키패드를 띄운다. 금리는 소수점이 필요해서 decimal-pad
          keyboardType={kind === 'amount' ? 'number-pad' : 'decimal-pad'}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          onFocus={() => {
            setFocused(true);
            // 키보드가 아직 올라오는 중일 수 있어서 잠깐 뒤에 위치를 맞춘다 (키보드가 다 올라온 뒤에도 한 번 더 맞춘다)
            setTimeout(() => ensureVisible(fieldRef.current), 100);
          }}
          onBlur={() => {
            setFocused(false);
            setAllSelected(false);
          }}
          // 선택 범위가 바뀔 때마다 "처음부터 끝까지 전부 선택"인지 확인한다. (칸을 누르면 전체 선택, 한 글자 입력하면 해제)
          onSelectionChange={(event) => {
            const { start, end } = event.nativeEvent.selection;
            setAllSelected(kind === 'amount' && shown.length > 0 && start === 0 && end === shown.length);
          }}
          // 입력 칸을 눌렀을 때 기기가 기본으로 그리는 어두운 네모(포커스 배경, 밑줄, 자동 채우기 표시)를 없앤다.
          underlineColorAndroid="transparent"
          importantForAutofill="no"
          autoComplete="off"
          autoCorrect={false}
          // 금액 칸은 누르면 안의 숫자를 모두 선택한다. 그대로 새 숫자를 치면 기존 값이 지워지고 바뀐다.
          // 금리 칸은 소수점(3.5)을 입력하는 도중에 다시 선택되어 앞 숫자가 지워지는 문제가 있어 전체 선택을 하지 않는다.
          selectTextOnFocus={kind === 'amount'}
          selectionColor={FOCUS_COLOR}
          cursorColor={FOCUS_COLOR}
          style={[styles.input, { color: allSelected ? '#ffffff' : theme.text }]}
        />
        <ThemedText themeColor="textSecondary" style={styles.unit}>
          {unit}
        </ThemedText>
      </View>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const FOCUS_COLOR = '#2563eb';

// 웹 브라우저가 입력 칸에 기본으로 그리는 포커스 테두리(outline)를 없앤다. (대신 위의 파란 테두리를 쓴다) 앱에서는 무시된다.
const noOutline = { outlineStyle: 'none' } as unknown as TextStyle;

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one },
  field: {
    minHeight: 52, // 누르기 쉬운 터치 영역
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.three,
  },
  // minWidth: 0 → 글자가 길거나 글자 크기를 키워도 입력 칸이 카드 밖으로 밀려나지 않고 칸 안에서 줄어든다.
  // backgroundColor: 'transparent' → 포커스 때 기기가 깔아 주는 기본 배경(어두운 네모)이 보이지 않게 한다.
  input: { flex: 1, minWidth: 0, fontSize: 18, paddingVertical: Spacing.two, textAlign: 'right', backgroundColor: 'transparent', ...noOutline },
  unit: { flexShrink: 0 },
});
