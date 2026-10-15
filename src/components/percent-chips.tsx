// ============================================================================
// 5%, 10% ... 30% 처럼 비율을 고르는 작은 버튼 줄(한 줄에 모두 보인다). 선납금, 보증금, 잔존가치 입력 칸 아래에 붙인다.
// 비율을 누르면 부모 화면이 "차량가격 × 비율" 금액을 입력 칸에 채운다. (계산은 부모가 한다)
// 지금 입력 칸의 금액이 어느 비율과 정확히 같으면 그 버튼이 선택된 것으로 보인다.
// ============================================================================

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PercentChipsProps = {
  percents: readonly number[]; // 보여줄 비율들 (예: [5, 10, 15, 20, 25, 30])
  selected: number | null; // 지금 선택된 비율. 없으면 null
  onSelect: (percent: number) => void; // 비율을 눌렀을 때. 선택된 것을 다시 누르면 해제는 부모가 처리한다
  label: string; // 화면 낭독용 이름 (예: "선납금")
};

export function PercentChips({ percents, selected, onSelect, label }: PercentChipsProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {percents.map((percent) => {
        const isSelected = selected === percent;
        return (
          <Pressable
            key={percent}
            accessibilityRole="radio"
            accessibilityLabel={`${label} 차량가격의 ${percent}퍼센트`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(percent)}
            style={[
              styles.chip,
              {
                // 선택된 버튼은 진한 파랑, 아닌 버튼은 일반 배경
                backgroundColor: isSelected ? '#2563eb' : theme.backgroundElement,
                borderColor: isSelected ? '#2563eb' : theme.backgroundSelected,
              },
            ]}>
            <ThemedText type="smallBold" style={{ color: isSelected ? '#ffffff' : theme.text }}>
              {percent}%
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // 버튼 6개가 한 줄에 같은 폭으로 들어가도록 한다. (flex: 1 = 남는 폭을 똑같이 나눠 가짐)
  row: { flexDirection: 'row', gap: Spacing.one },
  chip: {
    flex: 1,
    minHeight: 44, // 누르기 쉬운 터치 영역
    minWidth: 0, // 좁은 화면에서 글자 폭보다 더 줄어들 수 있게 한다
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
});
