// ============================================================================
// 화면이 열릴 때 데이터를 불러오고, "불러오는 중 / 오류 / 완료" 상태를 알려주는 훅(hook).
//
// [훅이란?]
// use 로 시작하는 함수로, React 화면(컴포넌트) 안에서 상태를 기억하거나 "화면이 그려진 뒤에
// 할 일"을 등록할 수 있게 해 준다. 차종/트림/가격/견적 화면이 모두 같은 로딩 로직이 필요해서
// 한 번만 만들어 두고 재사용한다.
//
// [화면에서의 사용법]
//   const load = useCallback(() => getCars(), []);   // 불러올 방법
//   const { state, retry } = useLoad(load);          // 상태와 "다시 시도" 함수
//   state.status 가 'loading' | 'error' | 'ready' 중 무엇인지에 따라 화면을 다르게 그린다.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';

import type { LoadResult } from '@/storage/cache';

// 화면이 받는 상태. status 값에 따라 들고 있는 정보가 다르다. (오류일 때만 message, 완료일 때만 result)
export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; result: LoadResult<T> };

// 어떤 load 함수와 몇 번째 시도의 결과인지 함께 보관한다.
// (왜 함께 보관하는지는 아래 "state 계산" 부분의 설명을 본다.)
type Stored<T> = { load: () => Promise<LoadResult<T>>; attempt: number; state: LoadState<T> };

/**
 * 화면이 열릴 때 데이터를 불러온다. load 함수는 useCallback으로 감싸서 넘긴다. (바뀌면 다시 불러옴)
 * retry()를 부르면 다시 불러온다.
 */
export function useLoad<T>(load: () => Promise<LoadResult<T>>) {
  // useState: 화면이 기억하는 값. 값이 바뀌면 화면이 다시 그려진다.
  const [stored, setStored] = useState<Stored<T> | null>(null);
  const [attempt, setAttempt] = useState(0); // "다시 시도"를 누를 때마다 1씩 늘어난다

  // useEffect: 화면이 그려진 뒤에 실행할 일을 등록한다. 마지막 [load, attempt] 가 바뀔 때마다 다시 실행된다.
  useEffect(() => {
    // 이 불러오기가 "취소됨"인지 표시하는 깃발. 아래 return 의 설명 참고.
    let cancelled = false;
    load()
      .then((result) => {
        if (!cancelled) setStored({ load, attempt, state: { status: 'ready', result } });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
          setStored({ load, attempt, state: { status: 'error', message } });
        }
      });
    // 정리(cleanup) 함수: 화면을 떠나거나 load/attempt 가 바뀌어 effect 가 다시 실행되기 직전에 호출된다.
    // 이미 사라진 화면에 늦게 도착한 결과를 반영하거나, 먼저 시작한 오래된 요청이 나중에 도착해서
    // 새 결과를 덮어쓰는 문제(경쟁 상태)를 막기 위해 깃발을 세운다.
    return () => {
      cancelled = true;
    };
  }, [load, attempt]);

  // state 계산: 보관된 결과가 "지금의 load 와 attempt 에 해당하는 것"일 때만 사용한다.
  // 아니면(막 바뀌었거나 다시 시도 중이면) 불러오는 중으로 본다.
  // 이렇게 "계산해서" 얻으면, effect 안에서 setState('loading')을 직접 부르지 않아도 되어서
  // 불필요한 추가 화면 갱신이 없다. (eslint 의 react-hooks/set-state-in-effect 규칙도 이 방식을 권장한다)
  const state: LoadState<T> =
    stored && stored.load === load && stored.attempt === attempt ? stored.state : { status: 'loading' };

  // useCallback: 함수를 매번 새로 만들지 않고 같은 것을 재사용한다.
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
