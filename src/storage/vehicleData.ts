// ============================================================================
// 화면이 차량 데이터를 가져올 때 쓰는 함수. 하루 1회 저장 규칙은 cache.ts가 처리한다.
// 현재는 현대자동차만 지원한다. 브랜드를 추가할 때 brand 인자를 늘린다.
//
// [층 구조]  화면 → (이 파일) → cache.ts(저장 규칙) → api/hyundai.ts(실제 요청)
// 화면은 "어디서 가져오는지"를 몰라도 된다. 저장본일 수도, 네트워크일 수도 있지만
// 어느 쪽이든 같은 모양(LoadResult)으로 받는다.
// ============================================================================

import { fetchCars, fetchTrimPrice, fetchTrims } from '@/api/hyundai';
import { loadWithDailyCache, type LoadResult } from '@/storage/cache';
import type { Car, Trim, TrimPrice } from '@/types/car';

const BRAND = 'hyundai';

// 아래 세 함수의 첫 번째 인자(key)가 저장 파일 이름이 된다.
// 차종/트림/가격마다 key 가 달라야 서로 덮어쓰지 않는다.
// 예) hyundai-cars.json, hyundai-trims-FN01.json, hyundai-price-FNJS4RST1.json

/** 차종 목록 */
export function getCars(): Promise<LoadResult<Car[]>> {
  return loadWithDailyCache(`${BRAND}-cars`, fetchCars);
}

/** 한 차종의 트림 목록 (carCode 마다 따로 저장) */
export function getTrims(carCode: string): Promise<LoadResult<Trim[]>> {
  return loadWithDailyCache(`${BRAND}-trims-${carCode}`, () => fetchTrims(carCode));
}

/** 한 트림의 사양/옵션/색상 가격 (saleModelCode 마다 따로 저장) */
export function getTrimPrice(saleModelCode: string): Promise<LoadResult<TrimPrice>> {
  return loadWithDailyCache(`${BRAND}-price-${saleModelCode}`, () => fetchTrimPrice(saleModelCode));
}
