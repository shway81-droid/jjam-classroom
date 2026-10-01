import { bench, ellipse } from './lib.mjs';

// ================================================================ 사과나무 — 참조 선화 없음(직접 디자인)
// 구름처럼 몽실몽실한 나뭇잎 덩어리, 위가 두 갈래로 벌어져 잎 속으로 들어가는 줄기, 둥근 언덕,
// 꼭지와 잎이 달린 사과 다섯 개와 땅에 떨어진 사과 하나. 꼭지는 사과와 잎 사이를 잇습니다.

// 둥근 혹이 이어진 구름 모양 닫힌 점들 — 중심 (cx, cy), 반지름 rx·ry 의 길쭉한 동그라미 위에 혹 n 개.
const cloud = (cx, cy, rx, ry, n, h) => {
  const pts = [];
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < 4; j++) {
      const f = j / 4;
      const a = ((k + f) / n) * Math.PI * 2 - Math.PI / 2;
      const bump = Math.sin(f * Math.PI) ** 0.7 * h;
      pts.push([cx + Math.cos(a) * (rx + bump), cy + Math.sin(a) * (ry + bump)]);
    }
  }
  return pts;
};

// 사과 한 알 — 위가 살짝 오목한 둥근 모양
const apple = (x, y, r) => [
  [x, y - r * 0.72], [x + r * 0.5, y - r * 0.98], [x + r * 0.95, y - r * 0.55], [x + r, y + r * 0.1],
  [x + r * 0.7, y + r * 0.8], [x, y + r], [x - r * 0.7, y + r * 0.8], [x - r, y + r * 0.1],
  [x - r * 0.95, y - r * 0.55], [x - r * 0.5, y - r * 0.98],
];
const leaf = (x, y, dir) => [[x, y], [x + 10 * dir, y - 13], [x + 27 * dir, y - 14], [x + 18 * dir, y + 1]];

export default function draw() {
  const b = bench();
  const crown = b.closed('crown', cloud(200, 176, 136, 112, 11, 22), 0.9);
  b.step('나뭇잎', '종이 위쪽에 구름처럼 몽실몽실한 나뭇잎을 크게 그려요.', crown);

  const hill = b.closed('hill', [
    [200, 432], [270, 436], [340, 446], [372, 462], [340, 476], [200, 480],
    [60, 476], [28, 462], [60, 446], [130, 436],
  ]);
  b.step('언덕', '나뭇잎 아래 멀리에 납작한 언덕을 그려요.', hill);

  const trunkL = b.open('trunkL', [[134, 296], [160, 318], [174, 350], [174, 400], [164, 436]], ['crown', 'hill']);
  const trunkR = b.open('trunkR', [[266, 296], [240, 318], [226, 350], [226, 400], [236, 436]], ['crown', 'hill']);
  b.step('줄기', '나뭇잎 아래에서 언덕까지 줄기 양옆을 그어요.', trunkL, trunkR);

  const fork = b.open('fork', [[166, 300], [186, 316], [200, 342], [214, 316], [234, 300]], ['crown', 'crown']);
  b.step('가지', '줄기 위 가운데에 갈라진 가지를 그려요.', fork);

  const twig = b.open('twig', [[226, 362], [248, 344], [268, 332], [274, 346], [254, 364], [228, 384]], ['trunkR', 'trunkR']);
  const twigLeaf = b.closed('twigLeaf', [[282, 334], [290, 316], [310, 308], [306, 326], [290, 338]]);
  b.step('작은 가지', '줄기 옆에 잎이 달린 작은 가지를 그려요.', twig, twigLeaf);

  const hole = b.closed('hole', ellipse(200, 384, 10, 15));
  b.step('나무 구멍', '줄기 가운데에 작은 구멍을 그려요.', hole);

  const A = [[136, 134, 25], [254, 128, 25], [200, 206, 25], [116, 234, 25], [282, 230, 25]];
  const apples1 = A.slice(0, 3).map(([x, y, r], k) => b.closed(`apple${k}`, apple(x, y, r)));
  b.step('사과 세 개', '나뭇잎 위쪽과 가운데에 사과를 세 개 그려요.', ...apples1);
  const apples2 = A.slice(3).map(([x, y, r], k) => b.closed(`apple${k + 3}`, apple(x, y, r)));
  b.step('사과 두 개', '나뭇잎 아래쪽 양옆에 사과를 두 개 더 그려요.', ...apples2);

  const D = [1, -1, 1, 1, 1];
  const leaves = A.map(([x, y, r], k) => b.closed(`leaf${k}`, leaf(x + 5 * D[k], y - r - 10, D[k])));
  b.step('사과 잎', '사과마다 위에 작은 잎을 하나씩 그려요.', ...leaves);

  const stems = A.map(([x, y, r], k) => b.open(`stem${k}`, [[x, y - r * 0.72], [x + D[k], y - r - 4], [x + 5 * D[k], y - r - 10]], [`apple${k}`, `leaf${k}`]));
  b.step('꼭지', '사과와 잎 사이를 짧은 꼭지로 이어요.', ...stems);

  const fallen = b.closed('fallen', apple(310, 424, 20));
  b.step('떨어진 사과', '언덕 위 줄기 옆에 떨어진 사과를 그려요.', fallen);

  const fLeaf = b.closed('fLeaf', leaf(316, 396, 1));
  const fStem = b.open('fStem', [[310, 410], [312, 400], [316, 396]], ['fallen', 'fLeaf']);
  b.step('떨어진 사과 잎', '떨어진 사과 위에 꼭지와 잎을 그려요.', fLeaf, fStem);

  const grassL = b.bumps('grassL', 'hill', [60, 448], [130, 437], 2, 22, 1);
  const grassR = b.bumps('grassR', 'hill', [244, 436], [284, 439], 2, 18, 1);
  b.step('풀', '언덕 위에 작은 풀을 동글동글 그려요.', grassL, grassR);

  return {
    id: 'apple-tree', title: '사과나무', theme: 'plant', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 손바닥보다 큰 나뭇잎부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['식물', '나무', '가을'],
  };
}
