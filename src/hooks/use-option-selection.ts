// ============================================================================
// 가격 화면의 "사양, 옵션, 색상 선택"을 관리하는 훅. 이 앱에서 가장 복잡한 부분이다.
//
// [하는 일]
// - 사용자가 고른 내용(selection)을 기억한다.
// - 선택이 바뀔 때마다 제조사 사이트에 "지금 조합에서 못 고르는 옵션이 뭔지" 물어보고(실시간),
//   고를 수 없는 옵션을 disabledReasons 에 이유와 함께 담아 화면이 흐리게 표시하게 한다.
// - 옵션을 고르면 함께 골라야 하는 옵션도 같이 선택하고, 빼면 묶인 옵션도 같이 뺀다.
// - 확인에 실패하면 선택을 바꾸지 않고 오류를 알린다. (확인되지 않은 조합이 합계에 들어가는 것을 막는다)
//
// [왜 화면 파일이 아니라 훅으로 분리했나?]
// 이 규칙들은 화면 모양과 상관없는 "선택 상태 관리"다. 화면(price.tsx)은 그리기에만 집중하고,
// 복잡한 로직은 여기서 따로 읽고 고칠 수 있게 하려는 것이다.
// ============================================================================

import { useCallback, useRef, useState } from 'react';

import { fetchDisabledTuix, fetchOptionRules, fetchRequiredOptions } from '@/api/hyundai';
import type { TrimPrice } from '@/types/car';
import { addWithRequired, blockedChoiceCodes, removeWithDependents } from '@/utils/options';
import { isOptionAvailable, type Selection } from '@/utils/price';

// 옵션이 비활성일 때 화면에 보여줄 이유 문구
const REASON_CHOICE = '지금 선택한 옵션 조합에서는 고를 수 없습니다';
const REASON_TUIX = '선택한 옵션·색상·추가 옵션과 함께 고를 수 없습니다';

/** 화면을 처음 열었을 때의 선택 상태: 추가금이 없는 사양(기본)만 골라져 있고 옵션/색상은 비어 있다. */
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
 * - 규칙을 조회하지 못하면 선택을 바꾸지 않고(이전 상태 유지) 오류를 알린다. 다시 누르면 다시 시도한다.
 *   확인되지 않은 조합이 합계에 들어가는 것을 막기 위해서다.
 */
export function useOptionSelection(price: TrimPrice) {
  // ---- 화면이 기억하는 값들 (바뀌면 화면이 다시 그려진다) ----
  // useState(() => ...) 처럼 함수를 넘기면 처음 한 번만 계산한다.
  const [selection, setSelection] = useState<Selection>(() => initialSelection(price));
  // 옵션 코드 → "왜 못 고르는지" 문구. 여기에 없으면 고를 수 있는 옵션이다.
  const [disabledReasons, setDisabledReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); // 규칙을 확인하는 중인지 (버튼 비활성, 안내 문구에 사용)
  const [message, setMessage] = useState<string | null>(null); // "함께 선택됨: ..." 같은 안내
  const [ruleError, setRuleError] = useState<string | null>(null); // 확인 실패 시 오류 문구
  // useRef: 값이 바뀌어도 화면을 다시 그리지 않는 "기억 상자".
  // 사용자가 빠르게 두 번 눌렀을 때 두 번째 눌림을 막아야 하는데, useState 는 값이 반영되는 시점이
  // 늦어서(다음 그리기 때) 막지 못하므로, 즉시 읽고 바꿀 수 있는 ref 를 쓴다.
  const busyRef = useRef(false); // 조회 중에 다시 눌러도 선택이 꼬이지 않게 막는다

  // 옵션 코드로 이름/종류를 찾는 작은 도우미 함수
  const nameOf = (code: string) => price.options.find((o) => o.code === code)?.name ?? code;
  const kindOf = (code: string) => price.options.find((o) => o.code === code)?.kind;

  // ---- 핵심: 새 선택(next)을 검증하고 적용한다 ----
  // next 선택에서 고를 수 없는 옵션을 조회하고 선택을 적용한다.
  // 튜익스는 선택돼 있어도 고를 수 없게 되면 해제한다. 조회에 실패하면 오류를 던지고 아무것도 바꾸지 않는다.
  //
  // [왜 최대 3번 반복하나?]
  // 선택한 튜익스 하나를 "고를 수 없음"으로 판정해 해제하면, 선택 상태가 바뀌었으므로 다른 튜익스의
  // 가능 여부도 달라질 수 있다. 그래서 해제가 더 일어나지 않을 때까지 다시 확인한다.
  // (무한 반복을 막으려고 최대 3번으로 제한한다.)
  //
  // [실패하면?] 아래에서 await 한 요청이 실패하면 오류가 위로 던져져서(throw) 이 함수의 마지막 줄들
  // (setSelection 등)에 도달하지 못한다. 그래서 선택이 바뀌지 않고 이전 상태가 유지된다.
  const applySelection = async (next: Selection, notes: string[]) => {
    let current = next;
    let blocked: Record<string, string> = {};
    for (let round = 0; round < 3; round++) {
      const choiceSelected = current.optionCodes.filter((c) => kindOf(c) === 'choice');
      const tuixSelected = current.optionCodes.filter((c) => kindOf(c) === 'tuix');
      const allTuix = price.options.filter((o) => o.kind === 'tuix').map((o) => o.code);

      // 일반 옵션 규칙과 튜익스 규칙을 동시에 조회한다. 물어볼 필요가 없으면(선택이 없거나 튜익스가 없으면)
      // 요청을 보내지 않고 빈 결과를 쓴다.
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

      // 못 고르는 옵션들을 "코드 → 이유" 표로 정리한다.
      blocked = {};
      for (const code of blockedChoiceCodes(price.options, current.specCode, current.optionCodes, optionRules)) {
        blocked[code] = REASON_CHOICE;
      }
      for (const code of disabledTuix) blocked[code] = REASON_TUIX;

      // 이미 선택했는데 지금은 못 고르게 된 튜익스가 있으면 선택에서 빼고, 안내 문구를 남기고 다시 확인한다.
      const dropped = tuixSelected.filter((code) => blocked[code]);
      if (dropped.length === 0) break;
      notes.push(`함께 고를 수 없어 선택이 해제됨: ${dropped.map(nameOf).join(', ')}`);
      current = { ...current, optionCodes: current.optionCodes.filter((c) => !dropped.includes(c)) };
    }
    // 여기까지 오류 없이 왔을 때만 실제 상태를 바꾼다.
    setSelection(current);
    setDisabledReasons(blocked);
    setMessage(notes.length > 0 ? notes.join('\n') : null);
    setRuleError(null);
  };

  /**
   * 사용자 동작(task)을 안전하게 실행하는 공통 틀. 모든 선택 동작이 이 함수를 거친다.
   *  - 이미 확인 중이면(busyRef) 새 동작을 무시한다. (선택이 꼬이는 것을 막음)
   *  - 확인 중에는 busy 를 켜서 화면이 안내를 보여주게 한다.
   *  - 동작이 실패하면(task 안에서 오류가 던져지면) 오류 문구를 남긴다. 선택은 바뀌지 않은 채다.
   *  - 성공하든 실패하든 마지막에는(finally) 반드시 busy 를 끈다.
   */
  const run = useCallback(async (task: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await task();
    } catch (error) {
      setRuleError(
        `옵션 조건을 확인하지 못해 선택을 바꾸지 않았습니다. 인터넷 연결을 확인하고 다시 눌러 주세요. (${
          error instanceof Error ? error.message : String(error)
        })`,
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  // ---- 화면에 내어 주는 동작들 ----

  /** 사양을 바꾼다. 새 사양에서 고를 수 없는 옵션은 선택에서 빼고 안내한다. */
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

  /**
   * 옵션을 누르면 켜고 끈다(토글). 세 가지 경우가 있다.
   *  1) 이미 선택된 옵션 → 뺀다 (묶인 옵션도 함께 빠진다)
   *  2) 선택 안 된 일반 옵션 → 제조사에 "함께 골라야 하는 옵션"을 물어보고 같이 추가한다
   *  3) 선택 안 된 튜익스 → 그냥 추가한다 (맞지 않는 조합은 applySelection 이 걸러낸다)
   */
  const toggleOption = (code: string) =>
    run(async () => {
      const notes: string[] = [];
      let optionCodes: string[];

      if (selection.optionCodes.includes(code)) {
        // 1) 해제
        const { remaining, alsoRemoved } = removeWithDependents(price.options, selection.optionCodes, code);
        optionCodes = remaining;
        if (alsoRemoved.length > 0) notes.push(`함께 선택이 해제됨: ${alsoRemoved.map(nameOf).join(', ')}`);
      } else if (kindOf(code) === 'choice') {
        // 2) 일반 옵션 추가
        const required = await fetchRequiredOptions(
          price.saleModelCode,
          selection.specCode,
          selection.optionCodes,
          code,
        );
        // 이 사양에서 고를 수 있는 옵션만 추가한다.
        const addable = required.filter((c) => {
          const option = price.options.find((o) => o.code === c);
          return option ? isOptionAvailable(option, selection.specCode) : false;
        });
        optionCodes = addWithRequired(selection.optionCodes, code, addable);
        // 사용자가 직접 누른 것이 아니라 "덩달아 선택된" 옵션을 안내 문구에 알려준다.
        const together = optionCodes.filter((c) => c !== code && !selection.optionCodes.includes(c));
        if (together.length > 0) notes.push(`함께 선택됨: ${together.map(nameOf).join(', ')}`);
      } else {
        // 3) 튜익스 추가
        optionCodes = [...selection.optionCodes, code];
      }
      await applySelection({ ...selection, optionCodes }, notes);
    });

  /** 내장 색상을 고른다. 같은 색을 다시 누르면 선택이 해제된다(null). 색상은 튜익스 가능 여부에 영향을 준다. */
  const setInterior = (code: string | null) =>
    run(() => applySelection({ ...selection, interiorCode: selection.interiorCode === code ? null : code }, []));

  /** 외장 색상을 고른다. 같은 색을 다시 누르면 선택이 해제된다(null). */
  const setExterior = (code: string | null) =>
    run(() => applySelection({ ...selection, exteriorCode: selection.exteriorCode === code ? null : code }, []));

  return { selection, disabledReasons, busy, message, ruleError, selectSpec, toggleOption, setInterior, setExterior };
}
