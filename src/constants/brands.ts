// 지원하는 제조사 목록. 새 제조사를 추가하려면 api, storage에 해당 제조사 코드를 만든 뒤 여기에 추가한다.

export type BrandId = 'hyundai';

export type Brand = {
  id: BrandId;
  name: string;
};

export const BRANDS: Brand[] = [{ id: 'hyundai', name: '현대자동차' }];

export function findBrand(id: string | undefined): Brand | undefined {
  return BRANDS.find((brand) => brand.id === id);
}
