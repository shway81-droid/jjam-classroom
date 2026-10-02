import { bench, ellipse } from './lib.mjs';

// ================================================================ 돛단배 — 참조 없음(직접 디자인)
// 큰 돛을 첫 획으로 길게 긋고 작은 돛·돛대·배를 차례로 붙입니다. 물결은 닫힌 띠 한 획입니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];

export default function draw() {
  const b = bench();
  const big = b.closed('big', [[206, 64], [256, 160], [304, 256], [334, 318], [270, 318], [206, 318], [206, 190]], 0.5);
  b.step('큰 돛', '종이 가운데에서 오른쪽으로 크고 뾰족한 돛을 그려요.', big);

  const small = b.closed('small', [[194, 112], [194, 220], [194, 318], [146, 318], [98, 318], [128, 248], [164, 172]], 0.5);
  b.step('작은 돛', '큰 돛 왼쪽에 조금 작은 돛을 그려요.', small);

  const mast = b.closed('mast', rect(194, 48, 206, 340), 0);
  b.step('돛대', '두 돛 사이에 위아래로 긴 돛대를 그려요.', mast);

  const hull = b.closed('hull', [[66, 340], [200, 340], [334, 340], [304, 400], [200, 402], [100, 400]], 0.3);
  b.step('배', '돛대 아래에 위가 넓고 아래가 좁은 배를 그려요.', hull);

  const flag = b.open('flag', [[206, 50], [240, 58], [206, 72]], ['mast', 'mast'], 0.3);
  b.step('깃발', '돛대 꼭대기 오른쪽에 작은 깃발을 그려요.', flag);

  const holes = [140, 200, 260].map((x, i) => b.closed(`h${i}`, ellipse(x, 370, 10, 10)));
  b.step('둥근 창', '배 가운데에 동그란 창을 세 개 그려요.', ...holes);

  const st1 = b.open('st1', [[206, 210], [262, 210], [300, 210]], ['big', 'big']);
  const st2 = b.open('st2', [[206, 262], [270, 262], [330, 262]], ['big', 'big']);
  b.step('돛 줄무늬', '큰 돛에 가로줄을 두 개 그어요.', st1, st2);

  const wavePts = [];
  for (let x = 30; x <= 370; x += 34) wavePts.push([x, (x - 30) % 68 ? 420 : 406]);
  wavePts.push([370, 448], [200, 450], [30, 448]);
  const wave = b.closed('wave', wavePts, 0.7);
  b.step('물결', '배 아래에 출렁이는 물결을 길게 그려요.', wave);

  const sun = b.closed('sun', ellipse(72, 92, 28, 28, 10));
  b.step('해', '종이 왼쪽 위에 동그란 해를 그려요.', sun);

  return {
    id: 'sailboat', title: '돛단배', theme: 'thing', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 종이 반만큼 큰 돛부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['탈것', '바다', '여름'],
  };
}
