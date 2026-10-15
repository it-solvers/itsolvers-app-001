import { useCallback, useRef, useState } from 'react';

import { fetchDisabledTuix, fetchOptionRules, fetchRequiredOptions } from '@/api/hyundai';
import type { TrimPrice } from '@/types/car';
import { addWithRequired, blockedChoiceCodes, removeWithDependents } from '@/utils/options';
import { isOptionAvailable, type Selection } from '@/utils/price';

const REASON_CHOICE = '지금 선택한 옵션 조합에서는 고를 수 없습니다';
const REASON_TUIX = '선택한 옵션·색상·추가 옵션과 함께 고를 수 없습니다';

function initialSelection(price: TrimPrice): Selection {
  return {
    // 추가금이 없는 사양(기본)을 먼저 고른다.
    specCode: (price.specs.find((s) => s.extraPrice === 0) ?? price.specs[0])?.code ?? '',
    optionCodes: [],
    interiorCode: null,
    exteriorCode: null,
  };
}

/**
 * 사양, 옵션, 색상 선택과 제조사의 옵션 선택 규칙을 함께 관리한다.
 * - 옵션을 고를 때 함께 선택되어야 하는 옵션이 있으면 같이 선택한다.
 * - 지금 선택 상태에서 고를 수 없는 옵션은 disabledReasons에 사유와 함께 담는다.
 * - 규칙은 선택이 바뀔 때마다 제조사 사이트에서 실시간으로 조회한다. (저장하지 않음)
 */
export function useOptionSelection(price: TrimPrice) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(price));
  const [disabledReasons, setDisabledReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const busyRef = useRef(false); // 조회 중에 다시 눌러도 선택이 꼬이지 않게 막는다

  const nameOf = (code: string) => price.options.find((o) => o.code === code)?.name ?? code;
  const kindOf = (code: string) => price.options.find((o) => o.code === code)?.kind;

  // next 선택에서 고를 수 없는 옵션을 조회한다. 튜익스는 선택돼 있어도 고를 수 없게 되면 해제한다.
  const applySelection = async (next: Selection, notes: string[]) => {
    let current = next;
    let blocked: Record<string, string> = {};
    try {
      for (let round = 0; round < 3; round++) {
        const choiceSelected = current.optionCodes.filter((c) => kindOf(c) === 'choice');
        const tuixSelected = current.optionCodes.filter((c) => kindOf(c) === 'tuix');
        const allTuix = price.options.filter((o) => o.kind === 'tuix').map((o) => o.code);

        const [optionRules, disabledTuix] = await Promise.all([
          choiceSelected.length > 0
            ? fetchOptionRules(price.saleModelCode, current.specCode, choiceSelected)
            : Promise.resolve({ disabled: [], enabled: [] }),
          allTuix.length > 0
            ? fetchDisabledTuix(price.saleModelCode, {
                specCode: current.specCode,
                selectedOptions: choiceSelected,
                selectedTuix: tuixSelected,
                allTuix,
                exteriorCode: current.exteriorCode,
                interiorCode: current.interiorCode,
              })
            : Promise.resolve([] as string[]),
        ]);

        blocked = {};
        for (const code of blockedChoiceCodes(price.options, current.specCode, current.optionCodes, optionRules)) {
          blocked[code] = REASON_CHOICE;
        }
        for (const code of disabledTuix) blocked[code] = REASON_TUIX;

        const dropped = tuixSelected.filter((code) => blocked[code]);
        if (dropped.length === 0) break;
        notes.push(`함께 고를 수 없어 선택이 해제됨: ${dropped.map(nameOf).join(', ')}`);
        current = { ...current, optionCodes: current.optionCodes.filter((c) => !dropped.includes(c)) };
      }
      setRuleError(null);
    } catch (error) {
      blocked = {};
      setRuleError(
        `옵션 선택 규칙을 확인하지 못했습니다. 실제로는 함께 고를 수 없는 조합일 수 있습니다. (${
          error instanceof Error ? error.message : String(error)
        })`,
      );
    }
    setSelection(current);
    setDisabledReasons(blocked);
    setMessage(notes.length > 0 ? notes.join('\n') : null);
  };

  const run = useCallback(async (task: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await task();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const selectSpec = (specCode: string) =>
    run(async () => {
      const kept = selection.optionCodes.filter((code) => {
        const option = price.options.find((o) => o.code === code);
        return option ? isOptionAvailable(option, specCode) : false;
      });
      const removed = selection.optionCodes.filter((code) => !kept.includes(code));
      const notes = removed.length > 0 ? [`선택한 사양에서 고를 수 없어 해제됨: ${removed.map(nameOf).join(', ')}`] : [];
      await applySelection({ ...selection, specCode, optionCodes: kept }, notes);
    });

  const toggleOption = (code: string) =>
    run(async () => {
      const notes: string[] = [];
      let optionCodes: string[];

      if (selection.optionCodes.includes(code)) {
        const { remaining, alsoRemoved } = removeWithDependents(price.options, selection.optionCodes, code);
        optionCodes = remaining;
        if (alsoRemoved.length > 0) notes.push(`함께 선택이 해제됨: ${alsoRemoved.map(nameOf).join(', ')}`);
      } else if (kindOf(code) === 'choice') {
        let required: string[] = [];
        try {
          required = await fetchRequiredOptions(price.saleModelCode, selection.specCode, selection.optionCodes, code);
        } catch (error) {
          setRuleError(
            `함께 선택해야 하는 옵션을 확인하지 못했습니다. (${error instanceof Error ? error.message : String(error)})`,
          );
        }
        // 이 사양에서 고를 수 있는 옵션만 추가한다.
        const addable = required.filter((c) => {
          const option = price.options.find((o) => o.code === c);
          return option ? isOptionAvailable(option, selection.specCode) : false;
        });
        optionCodes = addWithRequired(selection.optionCodes, code, addable);
        const together = optionCodes.filter((c) => c !== code && !selection.optionCodes.includes(c));
        if (together.length > 0) notes.push(`함께 선택됨: ${together.map(nameOf).join(', ')}`);
      } else {
        optionCodes = [...selection.optionCodes, code];
      }
      await applySelection({ ...selection, optionCodes }, notes);
    });

  const setInterior = (code: string | null) =>
    run(() => applySelection({ ...selection, interiorCode: selection.interiorCode === code ? null : code }, []));

  const setExterior = (code: string | null) =>
    run(() => applySelection({ ...selection, exteriorCode: selection.exteriorCode === code ? null : code }, []));

  return { selection, disabledReasons, busy, message, ruleError, selectSpec, toggleOption, setInterior, setExterior };
}
