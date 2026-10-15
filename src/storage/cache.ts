// 가져온 데이터를 기기 내부에 JSON 파일로 저장하고, 하루에 한 번만 새로 가져오는 규칙을 적용한다.
// 파일 위치: 앱 문서 폴더/price-cache/{key}.json (시스템이 임의로 지우지 않는 위치)

import { Directory, File, Paths } from 'expo-file-system';

type CacheEntry<T> = {
  fetchedDate: string; // 기기 현지 날짜 "YYYY-MM-DD"
  data: T;
};

export type LoadResult<T> = {
  data: T;
  fetchedDate: string;
  // cache: 오늘 이미 가져온 저장본 / network: 방금 새로 가져옴 / stale-cache: 가져오기에 실패해서 이전 날짜 저장본을 보여줌
  source: 'cache' | 'network' | 'stale-cache';
  errorMessage?: string; // stale-cache일 때 가져오기 실패 이유
  saveFailed: boolean; // 가져오기는 성공했지만 저장에 실패함 (데이터는 그대로 보여줄 수 있음)
};

function cacheDirectory(): Directory {
  return new Directory(Paths.document, 'price-cache');
}

function cacheFile(key: string): File {
  const safeKey = key.replace(/[^A-Za-z0-9_-]/g, '_');
  return new File(cacheDirectory(), `${safeKey}.json`);
}

export function todayString(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** 저장본을 읽는다. 없거나 깨진 파일이면 null (깨진 파일은 없는 것으로 취급해 새로 가져오게 한다) */
export async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const file = cacheFile(key);
    if (!file.exists) return null;
    const parsed: unknown = JSON.parse(await file.text());
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as CacheEntry<T>).fetchedDate === 'string' &&
      'data' in parsed
    ) {
      return parsed as CacheEntry<T>;
    }
    return null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T, fetchedDate = todayString()): Promise<void> {
  const directory = cacheDirectory();
  if (!directory.exists) {
    directory.create({ intermediates: true });
  }
  const file = cacheFile(key);
  const entry: CacheEntry<T> = { fetchedDate, data };
  file.create({ overwrite: true });
  file.write(JSON.stringify(entry));
}

/**
 * 하루 1회 규칙으로 데이터를 가져온다.
 * 1) 오늘 가져온 저장본이 있으면 그대로 사용 (네트워크 호출 없음)
 * 2) 없거나 날짜가 지났으면 fetcher로 새로 가져와 저장
 * 3) 새로 가져오기에 실패하면 이전 저장본이 있을 때 그것을 보여주고, 없으면 오류를 던진다
 */
export async function loadWithDailyCache<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<LoadResult<T>> {
  const today = todayString();
  const cached = await readCache<T>(key);

  if (cached && cached.fetchedDate === today) {
    return { data: cached.data, fetchedDate: cached.fetchedDate, source: 'cache', saveFailed: false };
  }

  let data: T;
  try {
    data = await fetcher();
  } catch (error) {
    if (cached) {
      return {
        data: cached.data,
        fetchedDate: cached.fetchedDate,
        source: 'stale-cache',
        errorMessage: error instanceof Error ? error.message : String(error),
        saveFailed: false,
      };
    }
    throw error;
  }

  let saveFailed = false;
  try {
    await writeCache(key, data, today);
  } catch {
    saveFailed = true;
  }
  return { data, fetchedDate: today, source: 'network', saveFailed };
}
