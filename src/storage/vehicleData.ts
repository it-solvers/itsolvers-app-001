// 화면이 차량 데이터를 가져올 때 쓰는 함수. 하루 1회 저장 규칙은 cache.ts가 처리한다.
// 현재는 현대자동차만 지원한다. 브랜드를 추가할 때 brand 인자를 늘린다.

import { fetchCars, fetchTrimPrice, fetchTrims } from '@/api/hyundai';
import { loadWithDailyCache, type LoadResult } from '@/storage/cache';
import type { Car, Trim, TrimPrice } from '@/types/car';

const BRAND = 'hyundai';

export function getCars(): Promise<LoadResult<Car[]>> {
  return loadWithDailyCache(`${BRAND}-cars`, fetchCars);
}

export function getTrims(carCode: string): Promise<LoadResult<Trim[]>> {
  return loadWithDailyCache(`${BRAND}-trims-${carCode}`, () => fetchTrims(carCode));
}

export function getTrimPrice(saleModelCode: string): Promise<LoadResult<TrimPrice>> {
  return loadWithDailyCache(`${BRAND}-price-${saleModelCode}`, () => fetchTrimPrice(saleModelCode));
}
