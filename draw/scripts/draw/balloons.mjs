import { bench, ellipse } from './lib.mjs';

// ================================================================ 풍선 세 개 — 참조 없음(직접 디자인)
// 풍선 셋을 먼저 긋고, 아래 리본을 그린 다음 줄로 매듭과 리본을 잇습니다.
const heart = (cx, cy, s) => [[cx, cy + s * 0.9], [cx - s * 0.7, cy + s * 0.2], [cx - s, cy - s * 0.3], [cx - s * 0.55, cy - s * 0.75], [cx, cy - s * 0.4], [cx + s * 0.55, cy - s * 0.75], [cx + s, cy - s * 0.3], [cx + s * 0.7, cy + s * 0.2]];

export default function draw() {
  const b = bench();
  const C = [[96, 212], [200, 136], [304, 212]];
  const balls = C.map(([x, y], i) => b.closed(`ba${i}`, ellipse(x, y, 56, 68, 12)));
  b.step('풍선 셋', '종이 위쪽에 둥근 풍선을 세 개 그려요.', ...balls);

  const knots = C.map(([x, y], i) => b.closed(`k${i}`, [[x, y + 66], [x + 8, y + 78], [x - 8, y + 78]], 0.2));
  b.step('매듭', '풍선마다 아래에 작은 매듭을 그려요.', ...knots);

  const bowK = b.closed('bowK', ellipse(200, 420, 11, 10));
  const bowL = b.closed('bowL', [[190, 418], [164, 400], [148, 408], [150, 432], [166, 440], [190, 424]], 0.8);
  const bowR = b.closed('bowR', [[210, 418], [236, 400], [252, 408], [250, 432], [234, 440], [210, 424]], 0.8);
  b.step('리본', '풍선 아래 가운데에 리본을 그려요.', bowK, bowL, bowR);

  const strings = C.map(([x, y], i) => b.open(`s${i}`, [[x, y + 78], [x + (200 - x) * 0.4 + (i === 1 ? 6 : 0), y + 170], [200, 410]], [`k${i}`, 'bowK']));
  b.step('풍선 줄', '매듭에서 리본까지 줄을 하나씩 이어요.', ...strings);

  const shines = C.map(([x, y], i) => b.closed(`sh${i}`, ellipse(x - 24, y - 30, 6, 13, 8, 0.6)));
  b.step('반짝이', '풍선마다 왼쪽 위에 반짝이를 그려요.', ...shines);

  const h = b.closed('heart', heart(204, 144, 22), 0.8);
  b.step('하트', '가운데 풍선에 하트를 하나 그려요.', h);

  return {
    id: 'balloons', title: '풍선', theme: 'thing', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 주먹만큼 큰 풍선 세 개부터 그릴 거예요.',
    coloringSeconds: 120, steps: b.steps, keywords: ['사물', '생일', '축하'],
  };
}
