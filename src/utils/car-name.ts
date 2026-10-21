// 차종 이름 표시용 보조 함수.

import { getLocale } from '@/i18n';
import type { Car } from '@/types/car';

/**
 * 영문 슬러그를 화면용 영어 이름으로 바꾼다. 하이픈을 공백으로 바꾸고 단어마다 첫 글자를 대문자로 한다.
 * 예) "the-all-new-avante-hybrid" → "The All New Avante Hybrid"
 */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * 화면에 보여줄 차종 이름. 영어 모드이고 영문 슬러그가 있으면 영어 이름, 아니면 제조사가 준 한글 이름.
 * (예전에 저장된 데이터에는 engName 이 없을 수 있어서 그때는 한글 이름을 그대로 쓴다)
 */
export function carDisplayName(car: Car): string {
  return getLocale() === 'en' && car.engName ? slugToTitle(car.engName) : car.name;
}
