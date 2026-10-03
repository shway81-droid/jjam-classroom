import { bench, ellipse } from './lib.mjs';

// ================================================================ 코코아 한 잔 — 참조 없음(직접 디자인)
// 컵을 먼저 긋고, 손잡이·마시멜로·접시는 컵 위에 양 끝을 붙입니다. 김은 닫힌 가는 띠입니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];
const heart = (cx, cy, s) => [[cx, cy + s * 0.9], [cx - s * 0.7, cy + s * 0.2], [cx - s, cy - s * 0.3], [cx - s * 0.55, cy - s * 0.75], [cx, cy - s * 0.4], [cx + s * 0.55, cy - s * 0.75], [cx + s, cy - s * 0.3], [cx + s * 0.7, cy + s * 0.2]];
const tube = (c, w) => {
  const side = (k) => c.map((p, i) => {
    const a = c[Math.max(0, i - 1)]; const z = c[Math.min(c.length - 1, i + 1)];
    const tx = z[0] - a[0]; const ty = z[1] - a[1]; const l = Math.hypot(tx, ty);
    return [p[0] + (-ty / l) * w * k, p[1] + (tx / l) * w * k];
  });
  const L = side(1); const R = side(-1); const n = c.length - 1;
  const tx = c[n][0] - c[n - 1][0]; const ty = c[n][1] - c[n - 1][1]; const l = Math.hypot(tx, ty);
  const cap = [c[n][0] + (tx / l) * w, c[n][1] + (ty / l) * w];
  return [...L, cap, ...R.reverse()];
};

export default function draw() {
  const b = bench();
  const mug = b.closed('mug', [[110, 220], [190, 220], [270, 220], [270, 320], [262, 400], [240, 420], [140, 420], [118, 400], [110, 320]], 0.3);
  b.step('컵', '종이 가운데에 위가 넓은 둥근 컵을 그려요.', mug);

  const h1 = b.open('h1', [[270, 258], [318, 262], [332, 310], [312, 360], [268, 372]], ['mug', 'mug']);
  const h2 = b.open('h2', [[270, 282], [302, 288], [310, 312], [298, 340], [268, 348]], ['mug', 'mug']);
  b.step('손잡이', '컵 오른쪽에 둥근 손잡이를 두 줄로 그려요.', h1, h2);

  const top = b.open('top', [[112, 236], [190, 250], [268, 236]], ['mug', 'mug']);
  b.step('코코아', '컵 위쪽 안에 코코아 윗면을 둥글게 그어요.', top);

  const m1 = b.open('m1', [[136, 220], [134, 198], [158, 190], [178, 198], [178, 220]], ['mug', 'mug']);
  const m2 = b.open('m2', [[196, 220], [198, 194], [222, 188], [238, 200], [238, 220]], ['mug', 'mug']);
  b.step('마시멜로', '컵 위로 솟은 말랑한 마시멜로를 두 개 그려요.', m1, m2);

  const s1 = b.closed('s1', tube([[170, 170], [160, 140], [176, 112], [166, 82]], 5), 0.8);
  const s2 = b.closed('s2', tube([[226, 168], [236, 138], [220, 110], [230, 80]], 5), 0.8);
  b.step('김', '마시멜로 위로 구불구불 올라가는 김을 그려요.', s1, s2);

  const h = b.closed('heart', heart(190, 330, 24), 0.8);
  b.step('하트', '컵 가운데에 하트를 하나 그려요.', h);

  const plate = b.open('plate', [[124, 412], [64, 422], [80, 446], [190, 452], [300, 446], [316, 422], [256, 412]], ['mug', 'mug']);
  b.step('접시', '컵 아래에 넓적한 접시를 그려요.', plate);

  const st1 = b.open('st1', [[110, 282], [190, 286], [270, 282]], ['mug', 'mug']);
  const st2 = b.open('st2', [[112, 382], [190, 386], [266, 382]], ['mug', 'mug']);
  b.step('줄무늬', '하트 위아래에 가로줄을 하나씩 그어요.', st1, st2);

  const shine = b.closed('shine', ellipse(128, 330, 5, 20));
  b.step('반짝이', '컵 왼쪽에 길쭉한 반짝이를 그려요.', shine);

  return {
    id: 'cocoa', title: '코코아 한 잔', theme: 'food', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 큰 컵부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['음식', '겨울', '간식'],
  };
}
