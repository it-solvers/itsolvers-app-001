// ============================================================================
// 키보드가 올라와도 입력 중인 칸이 가려지지 않게 해 주는 스크롤 화면.
//   - 숫자 입력 칸(components/amount-input.tsx)을 누르면, 그 칸이 키보드 위에 보이도록 화면을 위로 스크롤한다.
//   - 키보드는 화면 위에 덮이기만 하고 스크롤은 해 주지 않아서, 아래쪽 칸이 가려졌다. 이를 보완한다.
//   - 맨 아래 칸(금리 등)도 올릴 수 있도록, 키보드 높이만큼 맨 아래 여백을 임시로 늘린다.
// 새 패키지 없이 React Native 기본 기능(Keyboard 이벤트, measureInWindow, scrollTo)으로 만들었다.
// 사용법: 기존 <ScrollView> 대신 <KeyboardScrollView> 를 쓰면, 그 안의 AmountInput 이 알아서 동작한다.
// ============================================================================

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Keyboard,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  View,
} from 'react-native';

const MARGIN = 56; // 입력 칸과 키보드(또는 화면 가장자리) 사이에 남기는 여유. 칸 아래 설명 글까지 함께 보이게 넉넉히 둔다

type KeyboardScrollContextValue = {
  /** 이 칸이 키보드에 가려지지 않게 화면을 스크롤한다. 입력 칸이 눌렸을 때 부른다. */
  ensureVisible: (target: View | null) => void;
};

// KeyboardScrollView 바깥에서는 아무것도 하지 않는다. (다른 화면에서 AmountInput 을 써도 문제없게)
const KeyboardScrollContext = createContext<KeyboardScrollContextValue>({ ensureVisible: () => {} });

export function useKeyboardScroll(): KeyboardScrollContextValue {
  return useContext(KeyboardScrollContext);
}

export function KeyboardScrollView({ children, contentContainerStyle, onScroll, ...rest }: ScrollViewProps & { children?: ReactNode }) {
  const scrollRef = useRef<ScrollView>(null);
  const boxRef = useRef<View>(null); // 스크롤 화면을 감싼 상자. 화면에서의 위치와 크기를 재는 데 쓴다
  const scrollY = useRef(0); // 지금 스크롤된 위치
  const keyboardTop = useRef<number | null>(null); // 키보드 윗면의 화면 위치. 키보드가 없으면 null
  const focused = useRef<View | null>(null); // 지금 입력 중인 칸
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 입력 칸을 키보드 위로 올린다. 칸의 화면 위치와 스크롤 화면의 화면 위치를 재서, 가려지는 만큼만 스크롤한다.
  const ensureVisible = useCallback((target: View | null) => {
    const scroll = scrollRef.current;
    if (!target || !scroll) return;
    focused.current = target;
    const box = boxRef.current;
    if (!box) return;
    box.measureInWindow((_sx, sy, _sw, sh) => {
      target.measureInWindow((_x, y, _w, h) => {
        // 보이는 영역의 아래쪽 끝: 스크롤 화면의 아래 끝과 키보드 윗면 중 더 위쪽
        const visibleBottom = Math.min(sy + sh, keyboardTop.current ?? Infinity);
        const overBottom = y + h + MARGIN - visibleBottom; // 양수면 아래가 가려진다
        const overTop = sy + MARGIN - y; // 양수면 위가 가려진다
        if (overBottom > 0) scroll.scrollTo({ y: scrollY.current + overBottom, animated: true });
        else if (overTop > 0) scroll.scrollTo({ y: Math.max(0, scrollY.current - overTop), animated: true });
      });
    });
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardHeight(event.endCoordinates.height);
      // 키보드가 완전히 올라온 뒤(화면 크기가 정해진 뒤)에 다시 한 번 맞춘다.
      setTimeout(() => ensureVisible(focused.current), 50);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
      setKeyboardHeight(0);
      focused.current = null;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [ensureVisible]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  };

  return (
    <KeyboardScrollContext.Provider value={{ ensureVisible }}>
      {/* 상자(View): ScrollView 자체는 위치를 재기 어려워서 같은 크기의 상자로 감싼다 */}
      <View ref={boxRef} collapsable={false} style={{ flex: 1 }}>
      <ScrollView
        {...rest}
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled" // 키보드가 떠 있어도 버튼과 슬라이더를 한 번에 누를 수 있게
        // 키보드가 화면을 덮으므로 키보드 높이만큼 맨 아래 여백을 늘린다. (여백이 있어야 맨 아래 칸도 키보드 위로 끌어올릴 수 있다)
        contentContainerStyle={[contentContainerStyle, { paddingBottom: keyboardHeight }]}>
        {children}
      </ScrollView>
      </View>
    </KeyboardScrollContext.Provider>
  );
}
