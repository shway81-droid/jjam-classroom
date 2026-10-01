import { bench } from './lib.mjs';

// ================================================================ 수박 — 참조: refs/watermelon.png (살짝 기운 반달 조각)
// 껍질은 참조의 두 줄에 한 줄을 더해 초록 껍질·흰 속껍질·빨간 속살로 나눴고,
// 두 안쪽 줄은 바깥 테두리를 안으로 밀어 만든 뒤 양 끝을 윗변에 붙입니다.
// 씨는 끝이 윗변 가운데를 향하는 작은 물방울(닫힌 획)입니다.

const OUTER = [
  [60, 76], [53, 110], [52, 150], [62, 215], [96, 272], [150, 312], [220, 334], [290, 330], [355, 302],
  [408, 252], [438, 196], [447, 150], [447, 132],
];
const TOP_L = [70, 64]; const TOP_R = [440, 126];

// 바깥 곡선을 안쪽으로 d 만큼 민 점들
function inset(pts, d) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)]; const c = pts[Math.min(pts.length - 1, i + 1)];
    const tx = c[0] - a[0]; const ty = c[1] - a[1]; const l = Math.hypot(tx, ty);
    // 곡선이 왼쪽 위에서 오른쪽 위로 아래를 돌아가므로 안쪽은 (ty, -tx) 쪽
    return [p[0] + (ty / l) * d, p[1] - (tx / l) * d];
  });
}

// 끝이 (tx, ty) 쪽을 향하는 물방울
function seed(cx, cy, len, w, tx, ty) {
  const ang = Math.atan2(ty - cy, tx - cx);
  const u = [Math.cos(ang), Math.sin(ang)]; const n = [-u[1], u[0]];
  const at = (s, t) => [cx + u[0] * s * len + n[0] * t * w, cy + u[1] * s * len + n[1] * t * w];
  return [at(0.55, 0), at(0.15, 0.32), at(-0.2, 0.5), at(-0.45, 0.3), at(-0.5, 0), at(-0.45, -0.3), at(-0.2, -0.5), at(0.15, -0.32)];
}

export default function draw() {
  const b = bench();
  const slice = b.closed('slice', [
    TOP_L, [160, 78], [260, 94], [360, 110], TOP_R, ...OUTER.slice().reverse(),
  ], 0.7);
  b.step('수박 조각', '종이 가운데에 위가 평평한 반달 모양 수박을 그려요.', slice);

  const mid = inset(OUTER, 19);
  const rind = b.open('rind', [[mid[0][0], 66], ...mid.slice(1, -1), [mid[mid.length - 1][0], 120]], ['slice', 'slice']);
  b.step('초록 껍질', '아래 둥근 테두리를 따라 안쪽에 껍질 줄을 그어요.', rind);

  const inner = inset(OUTER, 40);
  const flesh = b.open('flesh', [[inner[0][0], 66], ...inner.slice(1, -1), [inner[inner.length - 1][0], 116]], ['slice', 'slice']);
  b.step('흰 껍질', '그 안쪽에 한 줄을 더 그어 속살을 나눠요.', flesh);

  const T = [250, 40];
  const s1 = b.closed('s1', seed(162, 128, 42, 21, T[0], T[1]));
  const s2 = b.closed('s2', seed(328, 140, 42, 21, T[0], T[1]));
  b.step('씨 두 개', '빨간 속살 위쪽 양옆에 물방울 씨를 하나씩 그려요.', s1, s2);

  const s3 = b.closed('s3', seed(212, 156, 42, 21, T[0], T[1]));
  const s4 = b.closed('s4', seed(272, 162, 42, 21, T[0], T[1]));
  b.step('가운데 씨', '두 씨 사이에 물방울 씨를 두 개 더 그려요.', s3, s4);

  const s5 = b.closed('s5', seed(186, 222, 42, 21, T[0], T[1]));
  const s6 = b.closed('s6', seed(300, 222, 42, 21, T[0], T[1]));
  b.step('아래 씨', '그 아래쪽에도 물방울 씨를 두 개 그려요.', s5, s6);

  return {
    id: 'watermelon', title: '수박', theme: 'food', difficulty: 'easy', grades: ['lower'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥만큼 크게 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['음식', '수박', '여름'],
  };
}
