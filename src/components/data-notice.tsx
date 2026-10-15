import { ThemedText } from '@/components/themed-text';
import type { LoadResult } from '@/storage/cache';

/** 데이터를 가져온 날짜와, 이전 저장본/저장 실패 안내를 보여준다. */
export function DataNotice({ result }: { result: LoadResult<unknown> }) {
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
