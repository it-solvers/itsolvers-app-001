import { useCallback, useEffect, useState } from 'react';

import type { LoadResult } from '@/storage/cache';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; result: LoadResult<T> };

/**
 * 화면이 열릴 때 데이터를 불러온다. load 함수는 useCallback으로 감싸서 넘긴다. (바뀌면 다시 불러옴)
 * retry()를 부르면 다시 불러온다.
 */
export function useLoad<T>(load: () => Promise<LoadResult<T>>) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    load()
      .then((result) => {
        if (!cancelled) setState({ status: 'ready', result });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
