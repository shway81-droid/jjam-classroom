import { bench, ellipse } from './lib.mjs';

// ================================================================ 도넛 — 참조 없음(직접 디자인), 위에서 본 도넛
// 큰 동그라미를 첫 획으로, 구멍·크림·뿌린 알갱이를 안쪽에 그립니다.
const icing = (cx, cy) => Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2;
  const r = i % 2 ? 112 : 126;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
});
const sprinkle = (x, y, rot, i, b) => b.closed(`sp${i}`, ellipse(x, y, 11, 4, 8, rot));

export default function draw() {
  const b = bench();
  const donut = b.closed('donut', ellipse(200, 250, 146, 146, 12));
  b.step('큰 동그라미', '종이 가운데에 크고 동그란 도넛을 그려요.', donut);

  const hole = b.closed('hole', ellipse(200, 250, 40, 40));
  b.step('구멍', '도넛 한가운데에 작은 구멍을 그려요.', hole);

  const cream = b.closed('cream', icing(200, 250), 0.9);
  b.step('크림', '구멍 둘레에 물결치는 크림을 둘러 그려요.', cream);

  const sp1 = [[140, 180, 0.6], [200, 160, 0], [262, 178, -0.6], [130, 250, 1.4], [280, 236, 1.2], [250, 312, 0.4]].map(([x, y, r], i) => sprinkle(x, y, r, i, b));
  b.step('알갱이 하나', '크림 위에 길쭉한 알갱이를 여섯 개 뿌려 그려요.', ...sp1);

  const sp2 = [[160, 306, -0.8], [200, 336, 0.2], [112, 210, -0.4], [290, 290, -1], [234, 196, 1.6], [168, 214, 1.1]].map(([x, y, r], i) => sprinkle(x, y, r, i + 6, b));
  b.step('알갱이 둘', '빈 곳에 알갱이를 여섯 개 더 뿌려 그려요.', ...sp2);

  const shine = b.closed('shine', [[96, 300], [86, 268], [88, 236], [96, 240], [96, 270], [104, 296]], 0.7);
  b.step('반짝', '도넛 왼쪽 아래에 반짝이는 빛을 그려요.', shine);

  return {
    id: 'donut', title: '도넛', theme: 'food', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 크게 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['음식', '간식', '도넛'],
  };
}
