import { bench } from './lib.mjs';

// ================================================================ 단풍잎 — 참조 없음(직접 디자인), 가을 단풍
// 뾰족한 잎을 첫 획으로(텐션을 낮춰 끝이 뾰족하게), 잎맥은 양 끝이 잎과 가운데 줄에 붙습니다.
const half = [[200, 60], [224, 128], [260, 104], [254, 152], [330, 140], [300, 190], [318, 212], [270, 250], [296, 302], [240, 292], [208, 322]];
const leafPts = (cx, cy, s) => {
  const right = half.map(([x, y]) => [cx + (x - 200) * s, cy + (y - 200) * s]);
  const left = half.slice(1).reverse().map(([x, y]) => [cx - (x - 200) * s, cy + (y - 200) * s]);
  return [...right, [cx, cy + 126 * s], ...left];
};

export default function draw() {
  const b = bench();
  const leaf = b.closed('leaf', leafPts(200, 200, 1), 0.45);
  b.step('뾰족한 잎', '종이 가운데에 끝이 뾰족뾰족한 큰 잎을 그려요.', leaf);

  const stem = b.closed('stem', [[196, 324], [194, 380], [198, 440], [208, 440], [206, 380], [204, 324]], 0.6);
  b.step('줄기', '잎 아래 가운데에 길쭉한 줄기를 그려요.', stem);

  const vein = b.open('vein', [[200, 320], [200, 200], [200, 64]], ['leaf', 'leaf']);
  b.step('가운데 줄', '줄기 위에서 잎 꼭대기까지 가운데 줄을 그어요.', vein);

  const upR = b.open('upR', [[200, 240], [262, 190], [326, 144]], ['vein', 'leaf']);
  const upL = b.open('upL', [[200, 240], [138, 190], [74, 144]], ['vein', 'leaf']);
  b.step('위쪽 잎맥', '가운데 줄에서 양옆 뾰족한 끝으로 줄을 그어요.', upR, upL);

  const lowR = b.open('lowR', [[200, 292], [248, 292], [292, 300]], ['vein', 'leaf']);
  const lowL = b.open('lowL', [[200, 292], [152, 292], [108, 300]], ['vein', 'leaf']);
  b.step('아래 잎맥', '그 아래에도 양옆 아래 끝으로 줄을 그어요.', lowR, lowL);

  const small = b.closed('small', leafPts(330, 400, 0.3), 0.45);
  b.step('작은 잎', '줄기 오른쪽 아래에 떨어지는 작은 잎을 그려요.', small);

  return {
    id: 'maple-leaf', title: '단풍잎', theme: 'season', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 큰 잎부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['계절', '가을', '나뭇잎'],
  };
}
