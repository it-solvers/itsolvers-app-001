import { t } from '@/i18n';
import { HYUNDAI_EMBLEM_URL } from '@/utils/images';

// 지원하는 제조사 목록. 새 제조사를 추가하려면 api, storage에 해당 제조사 코드를 만든 뒤 여기에 추가한다.
//
// [왜 상수 파일로 두나?]
// 제조사 이름과 코드가 화면 여기저기에 흩어져 있으면 바꾸기 어렵다. 한곳에 모아 두면
// 제조사를 추가할 때 이 배열만 늘리면 제조사 선택 화면에 자동으로 나타난다.

// 'hyundai' 하나만 허용하는 타입. 제조사를 추가하면 'hyundai' | 'kia' 처럼 늘린다.
// 오타(예: 'hyunda')를 내면 TypeScript가 바로 오류로 알려 준다.
export type BrandId = 'hyundai';

export type Brand = {
  id: BrandId; // 코드에서 쓰는 이름 (화면 주소의 brand=hyundai 로도 전달된다)
  name: string; // 화면에 보여줄 이름
  logoUrl: string; // 제조사 엠블럼 이미지 주소 (제조사 사이트에서 불러온다)
};

// name 을 get 으로 적은 이유: 화면에 보일 때마다 지금 언어의 이름을 가져오게 하려는 것이다. (값이 아니라 호출할 때 계산된다)
export const BRANDS: Brand[] = [
  {
    id: 'hyundai',
    get name() {
      return t('brands.hyundai');
    },
    logoUrl: HYUNDAI_EMBLEM_URL,
  },
];

/**
 * 주소로 전달받은 id 글자로 제조사를 찾는다. 없으면 undefined.
 * (주소 값은 아무 글자나 올 수 있어서 string | undefined 를 받는다. 그래서 못 찾을 수도 있고,
 *  호출하는 화면이 "지원하지 않는 제조사입니다"를 보여줄 수 있다.)
 */
export function findBrand(id: string | undefined): Brand | undefined {
  return BRANDS.find((brand) => brand.id === id);
}
