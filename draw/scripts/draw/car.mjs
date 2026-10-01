import { bench, ellipse } from './lib.mjs';

// ================================================================ 자동차 — 참조: refs/car.png, 왼쪽을 봅니다
// 바퀴 덮개(아치)는 몸통 테두리의 일부로 그립니다 — 바퀴가 그 아래로 쏙 들어갑니다.
const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy - Math.sin(a) * r];
});

export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    // 앞 범퍼 아래 → 앞 바퀴 덮개 → 바닥 → 뒤 바퀴 덮개 → 뒤 → 지붕 → 앞 유리 → 보닛
    [64, 282],
    ...arc(128, 280, 55, 178, 2, 8),
    [190, 287], [250, 288], [310, 287],
    ...arc(372, 280, 55, 178, 2, 8),
    [434, 282], [440, 276], [445, 255], [442, 228], [432, 198], [414, 170],
    [398, 143], [384, 116], [364, 96], [330, 86], [280, 83], [240, 86], [206, 98],
    [172, 124], [144, 153], [118, 163], [92, 176], [72, 196], [60, 222], [56, 250], [58, 272],
  ], 0.9);
  b.step('자동차 몸', '종이 가운데에 지붕이 둥근 자동차 몸을 크게 그려요.', body);

  const wheelF = b.closed('wheelF', ellipse(128, 279, 40, 40, 10));
  const wheelR = b.closed('wheelR', ellipse(372, 279, 40, 40, 10));
  b.step('바퀴 두 개', '바퀴 자리 아래에 동그란 바퀴를 두 개 그려요.', wheelF, wheelR);

  const hubF = b.closed('hubF', ellipse(128, 279, 17, 17));
  const hubR = b.closed('hubR', ellipse(372, 279, 17, 17));
  b.step('바퀴 가운데', '바퀴 가운데에 작은 동그라미를 하나씩 넣어요.', hubF, hubR);

  const winF = b.closed('winF', [
    [178, 154], [198, 128], [226, 107], [258, 100], [290, 99], [294, 152],
  ], 0.5);
  const winR = b.closed('winR', [
    [306, 100], [330, 104], [352, 120], [364, 140], [366, 152], [308, 153],
  ], 0.5);
  b.step('창문 두 개', '지붕 아래에 둥근 창문을 두 개 나란히 그려요.', winF, winR);

  const door = b.open('door', [
    [300, 156], [312, 172], [318, 210], [314, 246], [300, 260], [274, 268], [230, 269], [184, 268],
  ], ['winF', 'body']);
  b.step('문', '창문 아래에서 앞바퀴까지 문 줄을 그어요.', door);

  const handle = b.closed('handle', ellipse(282, 190, 16, 6, 8));
  b.step('문손잡이', '문 위쪽에 길쭉한 손잡이를 작게 그려요.', handle);

  const lightF = b.closed('lightF', ellipse(80, 202, 10, 18, 8, 0.45));
  const lightR = b.closed('lightR', ellipse(426, 212, 9, 15, 8, -0.45));
  b.step('앞뒤 불빛', '자동차 앞과 뒤에 길쭉한 불빛을 하나씩 그려요.', lightF, lightR);

  return {
    id: 'car', title: '자동차', theme: 'thing', difficulty: 'easy', grades: ['lower'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥만큼 크게 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['탈것', '자동차', '차'],
  };
}
