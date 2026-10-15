// 웹에서만 쓰이는 버전. expo-router 의 Head 가 children 으로 받은 태그들(<title>, <meta> 등)을
// 웹 페이지의 <head> 안에 넣어 준다. 정적 빌드(npm run build:web) 때 각 페이지 HTML 에도 포함된다.
// 앱용 버전과 이름이 같은 이유는 web-head.tsx 의 설명을 본다.

import Head from 'expo-router/head';

export function WebHead({ children }: { children?: React.ReactNode }) {
  return <Head>{children}</Head>;
}
