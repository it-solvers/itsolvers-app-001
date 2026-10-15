// ============================================================================
// 웹 페이지의 가장 바깥 틀(<html>, <head>, <body>). 웹으로 빌드할 때만 사용되고 앱에는 쓰이지 않는다.
// 이름이 +html.tsx 인 것은 Expo Router 가 약속한 특별한 파일이라서 화면(주소)이 되지 않는다.
//
// 여기서는 문서 언어를 한국어(ko)로 지정한다. 기본값은 영어(en)라서, 그대로 두면 검색엔진과
// 브라우저가 이 페이지를 영어로 오해할 수 있다. (제목, 설명 같은 페이지별 정보는 각 화면의 WebHead 에서 지정)
// ============================================================================

import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* 모바일에서 화면 폭에 맞게 보이게 한다 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* React Native 의 스크롤 영역이 웹에서도 올바르게 동작하도록 하는 기본 스타일 */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
