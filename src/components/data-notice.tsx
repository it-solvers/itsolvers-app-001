// ============================================================================
// 목록과 가격 화면 위쪽에 붙는 한 줄 안내. 데이터가 "어디서, 언제 것인지"를 알려준다.
//   - 평소: "데이터 기준일: 2026-10-15"
//   - 인터넷이 안 돼서 예전 저장본을 보여줄 때: 그 사실과 저장 날짜, 이유
//   - 저장에 실패했을 때: "(기기에 저장하지 못했습니다.)" 를 덧붙임
// ============================================================================

import { ThemedText } from '@/components/themed-text';
import type { LoadResult } from '@/storage/cache';

/** 데이터를 가져온 날짜와, 이전 저장본/저장 실패 안내를 보여준다. */
export function DataNotice({ result }: { result: LoadResult<unknown> }) {
  // result.source 가 'stale-cache' 면 "새로 가져오기에 실패해서 옛 저장본을 보여주는 중"이라는 뜻이다. (src/storage/cache.ts)
  const base =
    result.source === 'stale-cache'
      ? `인터넷에 연결할 수 없어 ${result.fetchedDate}에 저장한 데이터를 보여줍니다. (${result.errorMessage})`
      : `데이터 기준일: ${result.fetchedDate}`;
  return (
    <ThemedText type="small" themeColor="textSecondary">
      {base}
      {result.saveFailed ? ' (기기에 저장하지 못했습니다.)' : ''}
    </ThemedText>
  );
}
