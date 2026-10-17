// ============================================================================
// 웹 버전(검색엔진, 공유 미리보기)에서 쓰는 사이트 정보. 값이 한곳에 있어야 바꿀 때 편하다.
//
// [주의] SITE_URL 은 배포된 실제 주소와 같아야 한다. (canonical, 공유 이미지 주소, sitemap 에 쓰인다)
// 도메인을 바꾸면(예: 회사 도메인의 하위 주소로 연결) 이 값과 함께 아래 두 파일도 같이 고쳐야 한다.
//   - public/robots.txt   (Sitemap: 줄)
//   - public/sitemap.xml  (<loc> 줄)
// 앱(iOS/Android)에는 쓰이지 않고 웹에서만 쓰인다.
// ============================================================================

export const SITE_URL = 'https://itsolvers-app-001.vercel.app';
export const SITE_NAME = '아이티해결단 (IT Solvers)';

// 브라우저 탭과 검색 결과에 보이는 제목. 시작 화면만 검색에 노출되므로 LANDING_* 이 실제 검색 결과에 쓰인다.
export const LANDING_TITLE = '리스료 견적 (학습용) | 아이티해결단';
export const LANDING_DESCRIPTION =
  '제조사·차종·트림·옵션을 골라 승용차 가격을 확인해 보는 학습용 웹앱입니다. 금액과 데이터는 정확하지 않을 수 있습니다.';
export const LANDING_KEYWORDS = '리스료 견적, 승용차 견적, 자동차 가격, 트림 옵션 가격, 아이티해결단, IT Solvers, 학습용';

// 시작 화면이 아닌 화면의 기본 제목 (이 화면들은 검색에 노출하지 않지만 탭 제목은 필요하다)
export const DEFAULT_TITLE = '리스료 견적 (학습용)';

// 파비콘과 공유 미리보기 이미지 (public/images/ 에 있는 파일. 아이티해결단 사이트의 이미지와 같은 파일)
export const FAVICON_URL = '/images/logo.png';
export const OG_IMAGE_URL = `${SITE_URL}/images/og-image.png`;
export const OG_IMAGE_ALT = '아이티해결단 로고 및 대표 서비스';

// 구글 서치콘솔 소유권 확인 값. 구글이 "이 사이트의 주인이 맞다"고 확인하는 데 쓰며, 공개되어도 되는 값이다.
// 서치콘솔에서 확인이 끝난 뒤에도 지우지 않는다. (지우면 소유권 확인이 풀릴 수 있다)
export const GOOGLE_SITE_VERIFICATION = 'XkM_cxWA2-T6lbfCmju_esNcvG67RDEw7AtEqtjdomo';

// ---- 시작 화면 상단(헤더)과 하단(푸터)에 보이는 회사 정보 ----
// 아이티해결단 회사 사이트(/Users/dlgurpro/itsolvers/web/html/index.html)의 헤더와 푸터를 따랐다.
// 푸터 문구는 회사 사이트에 공개된 내용과 같다. 빼고 싶으면 FOOTER_LINES 에서 해당 줄을 지우면 된다.
export const COMPANY_NAME = '아이티해결단';
export const COMPANY_URL = 'https://itsolvers.co.kr/';
export const FOOTER_LINES = ['아이티해결단 (IT Solvers)', '대표 이혁', '사업자등록번호 364-11-03265'];
export const COPYRIGHT = `© ${new Date().getFullYear()} 아이티해결단 (IT Solvers). All rights reserved.`;
