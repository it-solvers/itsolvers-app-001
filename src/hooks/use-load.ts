import { useCallback, useEffect, useState } from 'react';

import type { LoadResult } from '@/storage/cache';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; result: LoadResult<T> };

// 어떤 load 함수와 몇 번째 시도의 결과인지 함께 보관한다.
type Stored<T> = { load: () => Promise<LoadResult<T>>; attempt: number; state: LoadState<T> };

/**
 * 화면이 열릴 때 데이터를 불러온다. load 함수는 useCallback으로 감싸서 넘긴다. (바뀌면 다시 불러옴)
 * retry()를 부르면 다시 불러온다.
 */
export function useLoad<T>(load: () => Promise<LoadResult<T>>) {
  const [stored, setStored] = useState<Stored<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
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
    return () => {
      cancelled = true;
    };
  }, [load, attempt]);

  // 보관된 결과가 지금의 load/attempt 것이 아니면(막 바뀌었거나 다시 시도 중이면) 불러오는 중으로 본다.
  const state: LoadState<T> =
    stored && stored.load === load && stored.attempt === attempt ? stored.state : { status: 'loading' };

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
