// ============================================================================
// 현대자동차 사이트의 이미지 주소를 만드는 함수들. (차종 이미지, 색상 칩 이미지)
// 이미지는 앱이 실행될 때 현대자동차 서버에서 직접 불러온다. 앱이나 저장소에 이미지 파일을 복사해 두지 않는다.
// 주소 규칙은 현대자동차 사이트가 쓰는 것을 확인한 것이고, 공개된 약속이 아니라서 바뀔 수 있다.
// 주소가 바뀌어도 이미지가 비어 보일 뿐 화면은 정상으로 동작한다. (RemoteImage 가 오류를 처리한다)
// ============================================================================

const HYUNDAI_ORIGIN = 'https://www.hyundai.com';

/**
 * 차종 코드 → 차종 옆모습 이미지 파일 이름.
 * 이미지 파일 이름은 차종 영문 이름과 다른 경우가 있어서(예: "the-all-new-avante"는 없고 "avante-27fc"가 있음)
 * 2026-10-15에 6개 차종을 하나씩 직접 불러 보고, 현재 판매 모델의 그림이 나오는 이름을 골랐다.
 * 새 차종이 생기면 이 표에 추가해야 이미지가 보인다. (없으면 이미지 없이 글자만 보여준다)
 */
const CAR_IMAGE_NAMES: Record<string, string> = {
  DN26: 'sonata-the-edge', // 쏘나타 디 엣지
  DN27: 'sonata-the-edge-hybrid', // 쏘나타 디 엣지 Hybrid
  FN01: 'avante-27fc', // 디 올 뉴 아반떼
  FN02: 'avante-hybrid-27fc', // 디 올 뉴 아반떼 Hybrid
  GN11: 'grandeur-27fl', // 더 뉴 그랜저
  GN12: 'grandeur-hybrid-27fl', // 더 뉴 그랜저 Hybrid
};

/** 차종 옆모습 이미지 주소. 표에 없는 차종이면 undefined (이미지를 보여주지 않는다) */
export function carImageUrl(carCode: string | undefined): string | undefined {
  const name = carCode ? CAR_IMAGE_NAMES[carCode] : undefined;
  return name ? `${HYUNDAI_ORIGIN}/contents/repn-car/side-45/${name}-45side.png` : undefined;
}

/**
 * 색상 칩(작은 색상 견본) 이미지 주소.
 *   carCode    차종 코드 (예: "DN26")
 *   kind       'exterior'(외장) | 'interior'(내장)
 *   colorCode  색상 코드 (외장: 예 "R2P", 내장: 예 "I67")
 * 차종 코드나 색상 코드가 없으면 undefined.
 */
export function colorChipUrl(
  carCode: string | undefined,
  kind: 'exterior' | 'interior',
  colorCode: string | undefined,
): string | undefined {
  if (!carCode || !colorCode) return undefined;
  return `${HYUNDAI_ORIGIN}/contents/vr360/${carCode}/${kind}/${colorCode}/colorchip-${kind}.png`;
}

/** 제조사 엠블럼(H 마크) 이미지 주소. 검은색 엠블럼이라 흰 바탕 위에서 쓴다. */
export const HYUNDAI_EMBLEM_URL = `${HYUNDAI_ORIGIN}/static/images/logo_mobile_black.png`;
