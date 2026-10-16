// ============================================================================
// 글자를 공유한다.
//   앱(iOS/Android): 휴대폰의 기본 공유창을 연다 (React Native 기본 기능 Share, 새 패키지 없음).
//   웹: 브라우저가 공유창(navigator.share)을 지원하면 그것을 쓰고(주로 휴대폰 브라우저),
//       지원하지 않으면(주로 PC 브라우저) 클립보드에 복사한다.
// 결과를 알려 주어 화면이 안내 문구를 보여줄 수 있게 한다.
// ============================================================================

import { Platform, Share } from 'react-native';

/** shared: 공유창으로 보냄 / copied: 클립보드에 복사함 / cancelled: 사용자가 닫음 / failed: 실패 */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

// 웹 브라우저의 navigator 중 필요한 부분만 적은 타입 (React Native 의 타입에는 없다)
type WebNavigator = {
  share?: (data: { text: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

export async function shareText(text: string): Promise<ShareOutcome> {
  try {
    if (Platform.OS === 'web') {
      const nav = (globalThis as { navigator?: WebNavigator }).navigator;
      if (nav?.share) {
        await nav.share({ text });
        return 'shared';
      }
      if (nav?.clipboard) {
        await nav.clipboard.writeText(text);
        return 'copied';
      }
      return 'failed';
    }
    // 앱: 공유창에서 아무것도 고르지 않고 닫으면 dismissedAction 이 돌아온다 (iOS 에서만 구분됨)
    const result = await Share.share({ message: text });
    return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
  } catch (error) {
    // 웹의 navigator.share 는 사용자가 닫으면 AbortError 를 던진다. 실패가 아니라 취소로 본다.
    if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    return 'failed';
  }
}
