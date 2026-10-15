// ============================================================================
// 가져온 데이터를 기기 내부에 JSON 파일로 저장하고, 하루에 한 번만 새로 가져오는 규칙을 적용한다.
// 파일 위치: 앱 문서 폴더/price-cache/{key}.json (시스템이 임의로 지우지 않는 위치)
//
// [왜 필요한가?]
// 차종/트림/가격은 하루에 크게 바뀌지 않는다. 화면을 열 때마다 제조사 사이트에 요청하면
// 느리고 사이트에도 부담이 된다. 그래서 "오늘 이미 가져왔으면 저장된 파일을 보여주고,
// 날짜가 바뀌었을 때만 새로 가져온다"는 규칙을 한곳(loadWithDailyCache)에 모아 두었다.
//
// [저장되는 파일 모양]  { "fetchedDate": "2026-10-15", "data": ...가져온 데이터... }
//
// [참고] expo-file-system 은 웹(브라우저)에서는 지원되지 않는다. 웹에서는 저장이 실패하지만
// 아래 코드가 오류를 잡아서(saveFailed) 화면은 정상으로 보여준다.
// ============================================================================

import { Directory, File, Paths } from 'expo-file-system';

// 파일에 실제로 저장되는 한 건. <T> 는 "저장하는 데이터의 종류는 쓰는 쪽이 정한다"는 뜻(제네릭).
// 차종 목록이면 T = Car[], 가격이면 T = TrimPrice 가 된다.
type CacheEntry<T> = {
  fetchedDate: string; // 기기 현지 날짜 "YYYY-MM-DD"
  data: T;
};

// 화면이 받는 결과. 데이터와 함께 "어디서 왔는지"를 알려줘서 화면이 안내 문구를 정할 수 있다.
export type LoadResult<T> = {
  data: T;
  fetchedDate: string;
  // cache: 오늘 이미 가져온 저장본 / network: 방금 새로 가져옴 / stale-cache: 가져오기에 실패해서 이전 날짜 저장본을 보여줌
  source: 'cache' | 'network' | 'stale-cache';
  errorMessage?: string; // stale-cache일 때 가져오기 실패 이유
  saveFailed: boolean; // 가져오기는 성공했지만 저장에 실패함 (데이터는 그대로 보여줄 수 있음)
};

// 저장 폴더. Paths.document 는 앱 전용 "문서" 폴더다 (앱을 지우면 같이 지워짐).
function cacheDirectory(): Directory {
  return new Directory(Paths.document, 'price-cache');
}

// key 를 파일 이름으로 바꾼다. 영문/숫자/_/- 외의 글자는 _ 로 바꿔서 파일 이름에 쓸 수 없는 글자를 막는다.
function cacheFile(key: string): File {
  const safeKey = key.replace(/[^A-Za-z0-9_-]/g, '_');
  return new File(cacheDirectory(), `${safeKey}.json`);
}

/** 오늘 날짜를 기기 현지 시간 기준 "YYYY-MM-DD" 글자로 만든다. (월은 0부터 세므로 +1, 한 자리는 앞에 0을 붙인다) */
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
    // 파일 내용은 글자이므로 JSON.parse 로 객체로 바꾼다. 파일이 깨졌으면 여기서 오류가 나서 catch 로 간다.
    const parsed: unknown = JSON.parse(await file.text());
    // 읽은 내용이 우리가 기대한 모양(fetchedDate 글자 + data 항목)인지 직접 확인한다.
    // 파일은 외부 입력이라 타입만 믿을 수 없기 때문이다.
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

/** 데이터를 파일로 저장한다. fetchedDate 는 기본값이 오늘이고, 테스트에서 옛 날짜를 넣을 수 있게 열어 두었다. */
export async function writeCache<T>(key: string, data: T, fetchedDate = todayString()): Promise<void> {
  const directory = cacheDirectory();
  if (!directory.exists) {
    // intermediates: 중간 폴더가 없으면 함께 만든다
    directory.create({ intermediates: true });
  }
  const file = cacheFile(key);
  const entry: CacheEntry<T> = { fetchedDate, data };
  file.create({ overwrite: true }); // 이미 있으면 덮어쓴다
  file.write(JSON.stringify(entry)); // 객체를 글자(JSON)로 바꿔 쓴다
}

/**
 * 하루 1회 규칙으로 데이터를 가져온다.
 * 1) 오늘 가져온 저장본이 있으면 그대로 사용 (네트워크 호출 없음)
 * 2) 없거나 날짜가 지났으면 fetcher로 새로 가져와 저장
 * 3) 새로 가져오기에 실패하면 이전 저장본이 있을 때 그것을 보여주고, 없으면 오류를 던진다
 *
 * fetcher 는 "실제로 데이터를 가져오는 함수"다. (예: () => fetchCars())
 * 이렇게 함수를 받으면 이 파일은 차종/트림/가격을 구분하지 않고 같은 규칙을 모두에게 적용할 수 있다.
 */
export async function loadWithDailyCache<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<LoadResult<T>> {
  const today = todayString();
  const cached = await readCache<T>(key);

  // 1) 오늘 저장한 것이 있으면 네트워크를 쓰지 않고 바로 돌려준다.
  if (cached && cached.fetchedDate === today) {
    return { data: cached.data, fetchedDate: cached.fetchedDate, source: 'cache', saveFailed: false };
  }

  // 2) 새로 가져온다.
  let data: T;
  try {
    data = await fetcher();
  } catch (error) {
    // 3) 실패했을 때: 옛날 저장본이라도 있으면 그것을 보여주고(stale = "오래된"), 이유를 함께 알려준다.
    if (cached) {
      return {
        data: cached.data,
        fetchedDate: cached.fetchedDate,
        source: 'stale-cache',
        errorMessage: error instanceof Error ? error.message : String(error),
        saveFailed: false,
      };
    }
    // 보여줄 것이 아무것도 없으면 오류를 그대로 위로 던진다. 화면이 오류 안내와 "다시 시도"를 보여준다.
    throw error;
  }

  // 가져온 데이터를 저장한다. 저장에 실패해도 방금 가져온 데이터는 정상이므로 화면에는 그대로 보여주고,
  // saveFailed 로만 알려준다. (저장 실패 때문에 멀쩡한 화면을 오류로 만들지 않기 위해서다.)
  let saveFailed = false;
  try {
    await writeCache(key, data, today);
  } catch {
    saveFailed = true;
  }
  return { data, fetchedDate: today, source: 'network', saveFailed };
}
