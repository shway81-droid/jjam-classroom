import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 크리스마스트리 — 참조: refs/christmas-tree.png
// 나무 테두리는 층마다 끝이 살짝 말려 나온 한 획이고, 아래 가장자리는 물결입니다.
// 작은 장식은 굵은 선에서 점처럼 뭉쳐 빼고, 장식 공은 크게 몇 개만 남겼습니다. 장식 줄 두 개는 양 끝이 나무 테두리에 놓입니다.

// 오른쪽 테두리 점들(위에서 아래로) — 왼쪽은 좌우를 뒤집어 씁니다.
const RIGHT = [
  [206, 116], [216, 138], [230, 154], [248, 162], [242, 168], [234, 170],
  [246, 186], [264, 198], [256, 205], [246, 207],
  [258, 228], [278, 244], [268, 250], [258, 252],
  [274, 272], [294, 284], [286, 290], [276, 292],
  [296, 324], [316, 348], [332, 366], [330, 380], [316, 388], [298, 392],
];

export default function draw() {
  const b = bench();
  const left = RIGHT.map(([x, y]) => [400 - x, y]).reverse();
  const tree = b.closed('tree', [
    [200, 104], ...RIGHT,
    // 물결치는 아래 가장자리
    [278, 404], [252, 402], [232, 396], [212, 408], [188, 408], [168, 396], [148, 402], [122, 404],
    ...left,
  ], 0.8);
  b.step('나무', '종이 가운데에 층층이 끝이 말린 커다란 나무를 그려요.', tree);

  const topStar = b.closed('star', star(200, 74, 30, 13), 0.3);
  b.step('별', '나무 꼭대기에 반짝이는 별을 그려요.', topStar);

  const trunk = b.open('trunk', [[180, 406], [180, 428], [178, 448], [200, 450], [222, 448], [220, 428], [220, 406]], ['tree', 'tree'], 0.6);
  b.step('나무 기둥', '나무 아래 가운데에 짧고 굵은 기둥을 그려요.', trunk);

  const band = b.open('band', [[180, 426], [200, 428], [220, 426]], ['trunk', 'trunk']);
  b.step('기둥 띠', '기둥 가운데를 가로질러 띠를 그어요.', band);

  const garland1 = b.open('garland1', [[150, 206], [178, 226], [214, 230], [258, 228]], ['tree', 'tree']);
  b.step('위쪽 장식 줄', '나무 위쪽에 한쪽에서 다른 쪽으로 장식 줄을 걸어요.', garland1);

  const garland2 = b.open('garland2', [[124, 292], [160, 316], [210, 322], [258, 312], [296, 324]], ['tree', 'tree']);
  b.step('아래쪽 장식 줄', '장식 줄 아래에 길게 늘어진 장식 줄을 하나 더 걸어요.', garland2);

  const o1 = b.closed('o1', ellipse(200, 170, 11, 11, 10));
  const o2 = b.closed('o2', ellipse(172, 196, 10, 10, 10));
  b.step('위쪽 장식 공', '나무 꼭대기 쪽에 작은 장식 공을 두 개 그려요.', o1, o2);

  const o3 = b.closed('o3', ellipse(160, 264, 14, 14, 10));
  const o4 = b.closed('o4', ellipse(236, 264, 14, 14, 10));
  b.step('가운데 장식 공', '두 장식 줄 사이에 장식 공을 두 개 그려요.', o3, o4);

  const o5 = b.closed('o5', ellipse(132, 358, 15, 15, 10));
  const o6 = b.closed('o6', ellipse(200, 366, 15, 15, 10));
  const o7 = b.closed('o7', ellipse(268, 354, 15, 15, 10));
  b.step('아래 장식 공', '아래쪽 장식 줄 밑에 장식 공을 세 개 그려요.', o5, o6, o7);

  return {
    id: 'christmas-tree', title: '크리스마스트리', theme: 'season', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 큰 나무부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['겨울', '크리스마스', '나무'],
  };
}
