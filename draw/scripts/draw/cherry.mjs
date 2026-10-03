import { bench, ellipse } from './lib.mjs';

// ================================================================ 체리 — 참조 없음(직접 디자인)
// 두 알을 먼저 긋고, 꼭지는 왼쪽 알에서 올라갔다가 오른쪽 알로 내려오는 한 획입니다.
export default function draw() {
  const b = bench();
  const L = b.closed('L', ellipse(128, 340, 68, 66, 12));
  const R = b.closed('R', ellipse(274, 352, 68, 66, 12));
  b.step('체리 두 알', '종이 아래쪽에 동그란 체리 두 알을 나란히 그려요.', L, R);

  const stem = b.open('stem', [[134, 276], [158, 176], [212, 102], [222, 98], [246, 180], [268, 288]], ['L', 'R']);
  b.step('꼭지', '두 알 위에서 만나는 뾰족한 꼭지를 한 번에 그려요.', stem);

  const leaf = b.closed('leaf', [[222, 98], [250, 72], [296, 62], [284, 94], [246, 110]], 0.9);
  b.step('잎', '꼭지 꼭대기 오른쪽에 길쭉한 잎을 그려요.', leaf);

  const vein = b.open('vein', [[226, 100], [258, 86], [290, 66]], ['leaf', 'leaf']);
  b.step('잎맥', '잎 가운데에 잎맥을 하나 그어요.', vein);

  const sh1 = b.closed('sh1', ellipse(98, 312, 8, 15, 8, 0.6));
  const sh2 = b.closed('sh2', ellipse(244, 324, 8, 15, 8, 0.6));
  b.step('반짝이', '두 알 왼쪽 위에 길쭉한 반짝이를 그려요.', sh1, sh2);

  const d1 = b.closed('d1', ellipse(92, 340, 4, 4, 6));
  const d2 = b.closed('d2', ellipse(238, 352, 4, 4, 6));
  b.step('작은 반짝이', '반짝이 아래에 작은 점을 하나씩 그려요.', d1, d2);

  return {
    id: 'cherry', title: '체리', theme: 'food', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 아래쪽에 주먹만큼 큰 체리 두 알부터 그릴 거예요.',
    coloringSeconds: 120, steps: b.steps, keywords: ['과일', '음식', '여름'],
  };
}
