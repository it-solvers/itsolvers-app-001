// ============================================================================
// 현대 사이트가 주는 한글 이름(색상, 사양, 옵션, 트림, 엔진)을 영어로 바꿔 보여주는 보조 함수.
// 이름의 대부분이 영어를 한글로 소리 나는 대로 쓴 것이라서, 단어 사전으로 단어별로 바꾼다.
//   "어비스 블랙 펄"              → "Abyss Black Pearl"
//   "17인치 알로이 휠 & 타이어Ⅰ"   → "17 inch Alloy wheel & Tire Ⅰ"
//   "블랙 모노톤_더블라셀 시트"      → "Black Monotone - 더블라셀 Seat"   (사전에 없는 단어는 한글 그대로)
// 한국어 모드에서는 이름을 바꾸지 않는다. 사전에 없는 단어는 그대로 두므로 새 이름이 나와도 앱이 깨지지 않는다.
// 한글이 남아 보이면 아래 WORDS 에 "한글: 'English'," 한 줄을 추가하면 된다.
// ============================================================================

import { getLocale } from '@/i18n';

// 한글 → 영어. 긴 단어를 먼저 바꿔야 해서(예: "그레이지"가 "그레이"보다 먼저) 길이 순으로 정렬해서 쓴다.
const WORDS: Record<string, string> = {
  // 색
  레드: 'Red',
  블랙: 'Black',
  블루: 'Blue',
  그레이지: 'Greige',
  그레이: 'Gray',
  화이트: 'White',
  실버: 'Silver',
  그린: 'Green',
  카퍼: 'Copper',
  버건디: 'Burgundy',
  브라운: 'Brown',
  네이비: 'Navy',
  카멜: 'Camel',
  꼬냑: 'Cognac',
  베이지: 'Beige',
  오렌지: 'Orange',
  옐로우: 'Yellow',
  골드: 'Gold',
  퍼플: 'Purple',
  라이트: 'Light',
  // 마감
  펄: 'Pearl',
  메탈릭: 'Metallic',
  매트: 'Matte',
  // 색상 별칭
  얼티메이트: 'Ultimate',
  어비스: 'Abyss',
  바이오필릭: 'Biophilic',
  녹턴: 'Nocturne',
  트랜스미션: 'Transmission',
  세레니티: 'Serenity',
  에어로: 'Aero',
  볼케닉: 'Volcanic',
  에코트로닉: 'Ecotronic',
  퀀텀: 'Quantum',
  그라펜: 'Graphene',
  아틀라스: 'Atlas',
  코디악: 'Kodiak',
  랩터: 'Raptor',
  아티스널: 'Artisanal',
  // 내장
  모노톤: 'Monotone',
  원톤: 'One-tone',
  투톤: 'Two-tone',
  '인조 가죽': 'Faux leather',
  가죽: 'Leather',
  패브릭: 'Fabric',
  시트: 'Seat',
  // 사양(운전 방식, 구성)
  기본: 'Base',
  내장: 'Interior',
  잉크: 'Ink',
  // 손과 발이 함께 있는 조합은 따로 적어야 "Left hand · Right foot" 처럼 가운데 점으로 나뉜다
  왼손오른발: 'Left hand · Right foot',
  오른손오른발: 'Right hand · Right foot',
  왼손왼발: 'Left hand · Left foot',
  오른손왼발: 'Right hand · Left foot',
  양발: 'Both feet',
  오른발: 'Right foot',
  왼발: 'Left foot',
  오른손: 'Right hand',
  왼손: 'Left hand',
  '장애인 전용': 'Disabled drivers only',
  장애: '(Disability)',
  나파: 'Nappa',
  인포테인먼트: 'Infotainment',
  컨비니언스: 'Convenience',
  컴포트: 'Comfort',
  하이패스: 'Hi-Pass',
  룸미러: 'Rearview mirror',
  // 옵션
  인치: 'inch',
  '알로이 휠': 'Alloy wheel',
  타이어: 'Tire',
  슬림: 'Slim',
  디스플레이: 'Display',
  사운드: 'Sound',
  프리미엄: 'Premium',
  패키지: 'Package',
  스피커: 'Speaker',
  외장앰프: 'External amp',
  증강현실: 'Augmented reality',
  내비게이션: 'Navigation',
  내비: 'Navi',
  빌트인: 'Built-in',
  캠: 'Cam',
  스마트: 'Smart',
  비전: 'Vision',
  루프: 'Roof',
  카드키: 'Card key',
  선루프: 'Sunroof',
  와이드: 'Wide',
  파노라마: 'Panorama',
  익스테리어: 'Exterior',
  디자인: 'Design',
  파킹: 'Parking',
  어시스트: 'Assist',
  초이스: 'Choice',
  플래티넘: 'Platinum',
  플러스: 'Plus',
  플레오스: 'Pleos',
  커넥트: 'Connect',
  헤드업: 'Head-up',
  현대: 'Hyundai',
  센스: 'Sense',
  '1열': '1st row',
  '2열': '2nd row',
  편의: 'Convenience',
  // 튜익스(추가 옵션)
  라이팅: 'Lighting',
  메탈: 'Metal',
  스킨: 'Skin',
  공기청정기: 'Air purifier',
  차량: 'Vehicle',
  보호: 'Protection',
  필름: 'Film',
  퍼포먼스: 'Performance',
  파츠: 'Parts',
  경량: 'Lightweight',
  휠: 'Wheel',
  서스펜션: 'Suspension',
  모노블록: 'Monoblock',
  브레이크: 'Brake',
  // 트림, 엔진
  모던: 'Modern',
  익스클루시브: 'Exclusive',
  인스퍼레이션: 'Inspiration',
  캘리그래피: 'Calligraphy',
  라인: 'Line',
  가솔린: 'Gasoline',
  하이브리드: 'Hybrid',
};

const SORTED_WORDS = Object.entries(WORDS).sort((a, b) => b[0].length - a[0].length);

/** 영어 모드에서 이름을 영어 단어로 바꾼다. 한국어 모드이거나 사전에 없는 단어는 그대로 둔다. */
export function translateName(name: string): string {
  if (getLocale() !== 'en') return name;
  let result = name;
  // 단어 앞뒤에 공백을 넣어서 "바이오필릭블루펄" 처럼 붙어 있는 이름도 "Biophilic Blue Pearl" 로 만든다.
  for (const [ko, en] of SORTED_WORDS) result = result.replaceAll(ko, ` ${en} `);
  return result
    .replace(/_/g, ' - ')
    .replace(/\s+/g, ' ')
    .replace(/([(\[]) /g, '$1')
    .replace(/ ([)\]])/g, '$1')
    .replace(/ ?\/ ?/g, '/')
    .replace(/ ?\+ ?/g, ' + ')
    .replace(/ ?& ?/g, ' & ')
    .replace(/ ,/g, ',')
    .replace(/(\S)\(/g, '$1 (')
    .trim();
}
