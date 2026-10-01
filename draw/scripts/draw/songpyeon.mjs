import { bench, ellipse, smooth } from './lib.mjs';
import { sample } from '../path-geom.mjs';

// ================================================================ 송편 — 참조: refs/songpyeon.png (접시에 담긴 송편과 솔잎)
// 참조의 둥근 떡은 송편다운 반달 모양으로 바꿨습니다. 앞 송편부터 그리고, 뒤 송편은 앞 송편에 가려
// 보이는 부분만 긋습니다(양 끝이 앞 송편 위에 놓입니다). 솔잎은 가지에 뿌리를 둔 가늘고 긴 잎(닫힌 모양)입니다.

// 반달 — 아래는 거의 평평한 바닥, 위는 반 동그라미처럼 둥근 등, 양 끝은 살짝 튀어나온 뾰족한 끝.
// (cx, cy)는 바닥 가운데, rot 은 기울기(라디안).
const dome = (x) => Math.pow(Math.max(0, 1 - x * x), 0.55);
function halfMoon(cx, cy, w, h, rot = 0) {
  const pts = [[-w * 0.53, -h * 0.03]];
  for (let i = 1; i < 16; i++) {
    const x = -1 + (i / 16) * 2;
    pts.push([x * w / 2, -dome(x) * h]);
  }
  pts.push([w * 0.53, -h * 0.03]);
  for (let i = 1; i < 6; i++) {
    const x = 1 - (i / 6) * 2;
    pts.push([x * w / 2 * 0.96, h * 0.07 * (1 - x * x)]);
  }
  const c = Math.cos(rot); const s = Math.sin(rot);
  return pts.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

// 반달 등을 따라 안쪽으로 한 줄 — 송편 무늬. 양 끝은 송편 테두리에 붙입니다.
function ridge(cx, cy, w, h, rot = 0, inset = 24) {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const x = -1 + (i / 8) * 2;
    pts.push([x * w * 0.53, -dome(x) * h * 0.66 - h * 0.03]);
  }
  const c = Math.cos(rot); const s = Math.sin(rot);
  return pts.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

// 점이 닫힌 꺾은선 안에 있는지
function inside(poly, [x, y]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// 뒤에 놓인 닫힌 모양에서 앞 모양들에 가리지 않는 가장 긴 구간의 점들(약 n 개)
function visible(pts, fronts, n = 14) {
  const ring = sample(smooth(pts, true), 12).slice(0, -1);
  const polys = fronts.map((f) => sample(smooth(f, true), 12));
  const vis = ring.map((p) => !polys.some((q) => inside(q, p)));
  const N = ring.length;
  const start = vis.findIndex((v, i) => v && !vis[(i - 1 + N) % N]);
  let best = []; let cur = [];
  for (let k = 0; k <= N; k++) {
    const i = (start + k) % N;
    if (vis[i] && k < N) cur.push(ring[i]);
    else { if (cur.length > best.length) best = cur; cur = []; }
  }
  const step = Math.max(1, Math.floor(best.length / n));
  const out = best.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== best[best.length - 1]) out.push(best[best.length - 1]);
  return out;
}

// 열린 줄에서 앞 모양들에 가리지 않는 가장 긴 구간의 점들
function clipOpen(pts, fronts, n = 10) {
  const line = sample(smooth(pts, false), 12);
  if (!fronts.length) return pts;
  const polys = fronts.map((f) => sample(smooth(f, true), 12));
  let best = []; let cur = [];
  for (const p of line) {
    if (!polys.some((q) => inside(q, p))) cur.push(p);
    else { if (cur.length > best.length) best = cur; cur = []; }
  }
  if (cur.length > best.length) best = cur;
  const step = Math.max(1, Math.floor(best.length / n));
  const out = best.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== best[best.length - 1]) out.push(best[best.length - 1]);
  return out;
}

// 가늘고 긴 솔잎 — base 에서 각도 a 쪽으로 길이 len
function needle(base, a, len = 30, wd = 3.5) {
  const ux = Math.cos(a); const uy = Math.sin(a);
  const nx = -uy; const ny = ux;
  const at = (t, k) => [base[0] + ux * len * t + nx * wd * k, base[1] + uy * len * t + ny * wd * k];
  return [at(0, 0), at(0.35, 1), at(0.75, 0.6), at(1, 0), at(0.75, -0.6), at(0.35, -1)];
}

export default function draw() {
  const b = bench();
  const plate = b.closed('plate', ellipse(250, 214, 176, 124, 16));
  b.step('접시', '종이 가운데에 옆으로 넓적한 큰 접시를 그려요.', plate);

  const rimPts = [];
  for (let i = 0; i <= 8; i++) {
    const f = (10 + (i / 8) * 160) * Math.PI / 180;
    const k = Math.sin(f);
    rimPts.push([250 + 176 * Math.cos(f) * (1 - 0.07 * k), 214 + 124 * k * (1 - 0.12 * k)]);
  }
  const rim = b.open('rim', rimPts, ['plate', 'plate']);
  b.step('접시 테두리', '접시 아래쪽 안에 테두리 줄을 하나 더 그어요.', rim);

  // 송편 네 개 — 앞 하나, 양옆 뒤 둘, 맨 뒤 가운데 하나. 접시보다 확실히 크게 보이도록 큼직하게 둡니다.
  const C = {
    c1: [246, 294, 204, 92, -0.05],
    c2: [168, 240, 152, 74, 0.12],
    c3: [336, 238, 152, 74, -0.1],
    c4: [256, 184, 168, 78, 0.03],
  };
  const shape = (k) => halfMoon(...C[k]);

  const c1 = b.closed('c1', shape('c1'), 0.6);
  b.step('앞 송편', '접시 아래쪽 가운데에 반달 모양 송편을 크게 그려요.', c1);

  const c2 = b.open('c2', visible(shape('c2'), [shape('c1')]), ['c1', 'c1'], 0.7);
  b.step('왼쪽 송편', '앞 송편 뒤 한쪽에 반달 송편을 하나 더 그려요.', c2);

  const c3 = b.open('c3', visible(shape('c3'), [shape('c1')]), ['c1', 'c1'], 0.7);
  b.step('오른쪽 송편', '앞 송편 뒤 다른 쪽에도 반달 송편을 그려요.', c3);

  const c4 = b.open('c4', visible(shape('c4'), [shape('c1'), shape('c2'), shape('c3')], 18), ['c2', 'c3'], 0.7);
  b.step('뒤 송편', '송편들 뒤 가운데에 반달 송편을 하나 더 그려요.', c4);

  // 솔가지 — 접시 왼쪽 위 테두리를 따라 송편 위로 비스듬히 지나갑니다.
  const branch = b.open('branch', [[76, 172], [112, 146], [150, 124], [188, 106], [228, 92]], ['plate', 'plate']);
  b.step('솔가지', '송편 위쪽에 접시를 비스듬히 가로지르는 솔가지를 그어요.', branch);

  const on = (p) => b.snap('branch', p);
  const fwd = Math.atan2(92 - 172, 228 - 76);
  const mk = (name, p, da, len) => b.closed(name, needle(on(p), fwd + da, len), 0.7);
  b.step('솔잎 하나', '솔가지 시작 쪽에 가늘고 긴 솔잎을 짝지어 붙여요.',
    mk('n1', [100, 154], -0.65, 40), mk('n2', [100, 154], 0.5, 36),
    mk('n3', [136, 132], -0.65, 40), mk('n4', [136, 132], 0.5, 36));
  b.step('솔잎 둘', '솔가지 끝 쪽에도 솔잎을 짝지어 붙여요.',
    mk('n5', [172, 114], -0.65, 38), mk('n6', [172, 114], 0.5, 32),
    mk('n7', [204, 100], -0.6, 30), mk('n8', [204, 100], 0.45, 26));

  // 작은 솔가지 — 뒤 송편 등에서 나와 접시 위쪽 테두리까지 뻗습니다.
  const twig = b.open('twig', [[306, 136], [330, 122], [352, 114], [372, 110]], ['c4', 'plate']);
  b.step('작은 솔가지', '뒤 송편 등에서 접시 끝까지 작은 솔가지를 그어요.', twig);

  const fwd2 = Math.atan2(110 - 136, 372 - 306);
  const mk2 = (name, p, da, len) => b.closed(name, needle(b.snap('twig', p), fwd2 + da, len), 0.7);
  b.step('작은 솔잎', '작은 솔가지에도 솔잎을 짝지어 붙여요.',
    mk2('m1', [326, 124], -0.7, 32), mk2('m3', [350, 115], -0.7, 28));

  // 무늬 줄 — 앞 송편에 가린 부분은 긋지 않고, 끝은 제 송편이나 앞 송편 테두리에 붙입니다.
  const pat = (k, fronts, ends) => b.open(`${k}p`, clipOpen(ridge(...C[k]), fronts.map(shape)), ends);
  b.step('앞 송편 무늬', '앞 송편 등을 따라 안쪽에 무늬 줄을 그어요.', pat('c1', [], ['c1', 'c1']));
  b.step('양옆 송편 무늬', '양옆 송편에도 등을 따라 무늬 줄을 그어요.', pat('c2', ['c1'], ['c2', 'c1']), pat('c3', ['c1'], ['c1', 'c3']));

  return {
    id: 'songpyeon', title: '송편', theme: 'food', difficulty: 'hard', grades: ['upper'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥만큼 큰 접시부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['추석', '송편', '명절'],
  };
}
