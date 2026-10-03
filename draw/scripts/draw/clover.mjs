import { bench } from './lib.mjs';

// ================================================================ 네잎클로버 — 참조 없음(직접 디자인)
// 하트 네 장이 가운데에서 만나는 잎을 한 획으로 긋습니다(극좌표로 점을 만들어 둥글게 잇습니다).
const leafPts = (cx, cy, R, n = 64) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  const k = Math.abs(Math.cos(2 * (a - Math.PI / 4)));
  const near = Math.min(...[0, 1, 2, 3, 4].map((j) => Math.abs(a - (Math.PI / 4 + (j * Math.PI) / 2))));
  const r = R * Math.pow(k, 0.55) * (1 - 0.22 * Math.exp(-((near / 0.16) ** 2)));
  return [cx + Math.cos(a) * Math.max(r, 3), cy + Math.sin(a) * Math.max(r, 3)];
});
const grass = (x, y) => [[x - 30, y], [x - 22, y - 30], [x - 12, y - 8], [x, y - 40], [x + 10, y - 8], [x + 22, y - 32], [x + 30, y]];

export default function draw() {
  const b = bench();
  const leaf = b.closed('leaf', leafPts(200, 196, 132), 0.6);
  b.step('네 잎', '종이 위쪽 가운데에 하트 네 장이 모인 잎을 그려요.', leaf);

  const stem = b.closed('stem', [[196, 212], [198, 300], [206, 380], [222, 456], [232, 452], [216, 378], [208, 300], [206, 212]], 0.7);
  b.step('줄기', '잎 가운데 아래에서 길게 휘어진 줄기를 그려요.', stem);

  const veins = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]
    .map((a, i) => b.open(`v${i}`, [[200 + Math.cos(a) * 4, 196 + Math.sin(a) * 4], [200 + Math.cos(a) * 50, 196 + Math.sin(a) * 50], [200 + Math.cos(a) * 100, 196 + Math.sin(a) * 100]], ['leaf', 'leaf']));
  b.step('잎맥', '가운데에서 잎마다 하트 홈까지 줄을 그어요.', ...veins);

  const small = b.closed('small', leafPts(96, 372, 44), 0.6);
  b.step('작은 잎', '줄기 왼쪽 아래에 작은 클로버를 하나 더 그려요.', small);

  const smallStem = b.closed('smallStem', [[94, 378], [96, 420], [104, 460], [112, 458], [104, 420], [102, 378]], 0.7);
  b.step('작은 줄기', '작은 클로버 아래에 짧은 줄기를 그려요.', smallStem);

  const g1 = b.closed('g1', grass(160, 470), 0.5);
  const g2 = b.closed('g2', grass(300, 470), 0.5);
  b.step('풀', '종이 아래쪽에 뾰족뾰족한 풀을 두 덤불 그려요.', g1, g2);

  return {
    id: 'clover', title: '네잎클로버', theme: 'plant', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽 가운데에 손바닥만큼 큰 잎부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['식물', '봄', '행운'],
  };
}
