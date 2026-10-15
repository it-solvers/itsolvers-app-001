// 트림 표시용 보조 함수.

/**
 * 현대자동차 모델 코드의 3번째 글자는 구매 용도와 같다. (J 자가용, R 렌터카, H 장애인)
 * 제조사 API의 구매 용도 목록(자가용 J / 렌터카 R / 장애인 H)과 글자가 일치하고, H 트림은 운전 방식 사양
 * (왼손오른발 등), J 트림은 일반 사양인 것을 전체 트림에서 확인했다. 제조사가 공식으로 알려준 구분은 아니다.
 * 알 수 없는 글자면 null.
 *
 * 예) "FNHS4RMT1"[2] 는 'H' → 장애인,  "FNJS4RMT1"[2] 는 'J' → 자가용
 *     (글자 번호는 0부터 센다. 0번 'F', 1번 'N', 2번 'H')
 * 이름이 같은 트림("모던"이 두 개 등)을 사용자가 구분할 수 있게 목록에 용도를 함께 보여주는 데 쓴다.
 */
export function trimPurposeName(saleModelCode: string): '자가용' | '렌터카' | '장애인' | null {
  switch (saleModelCode[2]) {
    case 'J':
      return '자가용';
    case 'R':
      return '렌터카';
    case 'H':
      return '장애인';
    default:
      return null;
  }
}
