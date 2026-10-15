// 옵션 선택 목록을 바꾸는 순수 함수들 (네트워크 호출 없음).

import type { CarOption } from '@/types/car';

function unique(codes: string[]): string[] {
  return [...new Set(codes)];
}

/**
 * 옵션을 선택 목록에 추가한다. 함께 선택되어야 하는 옵션(required)도 같이 넣는다.
 * 제조사 응답은 이미 선택한 옵션을 빠뜨릴 수 있어서, 기존 선택은 항상 유지한다.
 */
export function addWithRequired(selected: string[], added: string, required: string[]): string[] {
  return unique([...selected, added, ...required]);
}

/**
 * 옵션을 선택 목록에서 뺀다. 이 옵션과 묶여 있던(groupCodes에 포함) 다른 선택 옵션도 함께 뺀다.
 * 예: 헤드업 디스플레이(HUD)의 묶음은 HUD+PA2라서, PA2를 빼면 HUD도 빠진다.
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
      if (removedSet.has(code)) continue;
      const option = options.find((o) => o.code === code);
      if (option && option.kind === 'choice' && option.groupCodes.some((g) => removedSet.has(g))) {
        removedSet.add(code);
        changed = true;
      }
    }
  }
  return {
    remaining: selected.filter((code) => !removedSet.has(code)),
    alsoRemoved: selected.filter((code) => code !== removed && removedSet.has(code)),
  };
}

/**
 * 일반 옵션 중 지금 고를 수 없는 코드들.
 * 비활성 목록에서, 다시 허용된 옵션을 빼고, 선택된 옵션은 해제할 수 있어야 하므로 뺀다.
 * 이 사양에서 고를 수 있는 일반 옵션이 하나뿐이면 제약이 없는 것으로 본다. (제조사 사이트와 같은 규칙)
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
