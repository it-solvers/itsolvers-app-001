// ============================================================================
// 한국어/영어 문구를 꺼내 쓰는 곳. 화면과 컴포넌트는 글자를 직접 적지 않고 t('키') 로 가져온다.
//   t('cars.loading')                  → "차종을 불러오는 중입니다." / "Loading models..."
//   t('price.format', { amount: '1,000' }) → "1,000원" / "₩1,000"
//
// [언어 고르는 규칙] 기기(브라우저) 언어가 한국어면 한국어, 그 밖에는 영어. 앱 안에서 바꾸는 버튼은 없다.
// 번역이 없는 키는 한국어로 대신 보여준다 (enableFallback). 현대 사이트에서 받아온 이름(트림, 옵션, 색상 등)은
// 번역하지 않고 한글 그대로 보여준다.
//
// [웹 주의] 웹은 미리 만들어 둔 HTML(한국어)을 먼저 보여주고 그 위에 앱을 입히기 때문에, 처음에는 항상 한국어로 시작한 뒤
// _layout.tsx 가 브라우저 언어에 맞춰 바꾼다. (처음부터 영어로 시작하면 미리 만든 HTML 과 달라서 화면이 어긋난다)
// ============================================================================

import { getLocales } from 'expo-localization';
import { I18n, type TranslateOptions } from 'i18n-js';
import { Platform } from 'react-native';

import { en } from './en';
import { ko } from './ko';

export type Locale = 'ko' | 'en';

const i18n = new I18n({ ko, en });
i18n.defaultLocale = 'ko';
i18n.enableFallback = true;

/** 기기(브라우저)의 첫 번째 언어가 한국어면 'ko', 아니면 'en' */
export function detectLocale(): Locale {
  return getLocales()[0]?.languageCode === 'ko' ? 'ko' : 'en';
}

// 앱(iOS/Android)은 시작할 때 바로 기기 언어로, 웹은 위 설명대로 한국어로 시작한다.
i18n.locale = Platform.OS === 'web' ? 'ko' : detectLocale();

export function getLocale(): Locale {
  return i18n.locale === 'en' ? 'en' : 'ko';
}

export function setLocale(locale: Locale) {
  i18n.locale = locale;
}

/** 키에 해당하는 문구. options 로 %{이름} 자리에 들어갈 값을 넘긴다. */
export function t(key: string, options?: TranslateOptions): string {
  return i18n.t(key, options);
}
