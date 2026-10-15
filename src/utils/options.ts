// ============================================================================
// 옵션 선택 목록을 바꾸는 순수 함수들 (네트워크 호출 없음).
//
// 제조사 사이트에는 "옵션 A를 고르면 옵션 B도 같이 골라야 한다" 같은 규칙이 있다.
// 어떤 규칙인지는 사이트에서 받아오고(src/api/hyundai.ts), 받은 결과로 선택 목록을
// "어떻게 바꿀지"의 계산만 여기서 한다. 계산만 있으니 값을 넣어 보며 확인하기 쉽다.
// ============================================================================

import type { CarOption } from '@/types/car';

/** 중복을 없앤다. Set 은 같은 값을 한 번만 담는 자료구조라서 배열 → Set → 배열로 바꾸면 된다. */
function unique(codes: string[]): string[] {
  return [...new Set(codes)];
}

/**
 * 옵션을 선택 목록에 추가한다. 함께 선택되어야 하는 옵션(required)도 같이 넣는다.
 * 제조사 응답은 이미 선택한 옵션을 빠뜨릴 수 있어서, 기존 선택은 항상 유지한다.
 *
 * 예) 이미 [PA2, SRF]를 골랐고 HUD를 새로 골랐을 때 사이트가 [HUD, PA2]만 알려줘도
 *     결과는 [PA2, SRF, HUD]가 된다. (SRF를 잃어버리지 않는다)
 */
export function addWithRequired(selected: string[], added: string, required: string[]): string[] {
  return unique([...selected, added, ...required]);
}

/**
 * 옵션을 선택 목록에서 뺀다. 이 옵션과 묶여 있던(groupCodes에 포함) 다른 선택 옵션도 함께 뺀다.
 * 예: 헤드업 디스플레이(HUD)의 묶음은 HUD+PA2라서, PA2를 빼면 HUD도 빠진다.
 *
 * [알고리즘]
 * 빼야 할 코드 집합(removedSet)에서 시작해서, "묶음에 removedSet의 코드가 들어 있는 선택 옵션"을
 * 계속 추가한다. 더 추가할 것이 없을 때(changed 가 false) 멈춘다.
 * (A를 빼서 B가 빠지고, B를 빼서 C가 또 빠지는 연쇄도 처리하기 위해 반복한다.)
 */
export function removeWithDependents(
  options: CarOption[],
  selected: string[],
  removed: string,
): { remaining: string[]; alsoRemoved: string[] } {
  const removedSet = new Set([removed]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const code of selected) {
      if (removedSet.has(code)) continue; // 이미 뺄 것으로 정해졌으면 건너뜀
      const option = options.find((o) => o.code === code);
      // 튜익스(tuix)는 묶음 개념이 없으므로 일반 옵션(choice)만 검사한다.
      if (option && option.kind === 'choice' && option.groupCodes.some((g) => removedSet.has(g))) {
        removedSet.add(code);
        changed = true; // 새로 추가했으니 한 바퀴 더 돌아서 연쇄 여부를 확인한다
      }
    }
  }
  return {
    remaining: selected.filter((code) => !removedSet.has(code)), // 남는 옵션
    // 사용자가 직접 누른 것(removed)을 제외하고 "덩달아 빠진" 옵션 (안내 문구에 쓴다)
    alsoRemoved: selected.filter((code) => code !== removed && removedSet.has(code)),
  };
}

/**
 * 일반 옵션 중 지금 고를 수 없는 코드들.
 * 비활성 목록에서, 다시 허용된 옵션을 빼고, 선택된 옵션은 해제할 수 있어야 하므로 뺀다.
 * 이 사양에서 고를 수 있는 일반 옵션이 하나뿐이면 제약이 없는 것으로 본다. (제조사 사이트와 같은 규칙)
 *
 * rules.disabled: 사이트가 "지금은 못 고른다"고 알려준 옵션
 * rules.enabled : 그중에서도 "다시 고를 수 있다"고 알려준 옵션 (예외로 허용)
 */
export function blockedChoiceCodes(
  options: CarOption[],
  specCode: string,
  selected: string[],
  rules: { disabled: string[]; enabled: string[] },
): string[] {
  const availableCount = options.filter((o) => o.kind === 'choice' && o.specCodes.includes(specCode)).length;
  if (availableCount <= 1) return [];
  return rules.disabled.filter((code) => !rules.enabled.includes(code) && !selected.includes(code));
}
