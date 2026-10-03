import { bench, ellipse } from './lib.mjs';

// ================================================================ 버섯 집 — 참조 없음(직접 디자인)
// 큰 버섯 지붕을 첫 획으로 긋고, 벽은 지붕 아래 양 끝에 붙인 한 획입니다. 꽃과 나비로 마무리합니다.
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
const flower = (cx, cy) => Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? 9 : 17;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
});

export default function draw() {
  const b = bench();
  const cap = b.closed('cap', [[60, 250], [70, 180], [120, 110], [200, 84], [280, 110], [330, 180], [340, 250], [200, 262]], 0.8);
  b.step('버섯 지붕', '종이 위쪽에 둥글고 큰 버섯 지붕을 그려요.', cap);

  const wall = b.open('wall', [[120, 254], [116, 350], [112, 450], [200, 450], [288, 450], [284, 350], [280, 254]], ['cap', 'cap'], 0.3);
  b.step('벽', '지붕 아래에 아래가 조금 넓은 벽을 그려요.', wall);

  const spots = [[130, 170, 22], [200, 124, 18], [270, 168, 24], [176, 212, 14], [306, 226, 12]].map(([x, y, r], i) => b.closed(`sp${i}`, ellipse(x, y, r, r * 0.85, 10)));
  b.step('땡땡이', '지붕에 크고 작은 동그라미를 다섯 개 그려요.', ...spots);

  const door = b.open('door', [[176, 450], [176, 384], [184, 368], [200, 362], [216, 368], [224, 384], [224, 450]], ['wall', 'wall'], 0.6);
  b.step('문', '벽 가운데 아래에 위가 둥근 문을 그려요.', door);

  const knob = b.closed('knob', ellipse(214, 412, 4.5, 4.5, 6));
  b.step('문고리', '문 오른쪽에 작은 문고리를 그려요.', knob);

  const winL = b.closed('winL', ellipse(156, 314, 20, 20, 10));
  const winR = b.closed('winR', ellipse(248, 306, 18, 18, 10));
  b.step('동그란 창', '문 위 양쪽에 동그란 창을 하나씩 그려요.', winL, winR);

  const bars = [
    b.open('b1', [[156, 294], [156, 334]], ['winL', 'winL']), b.open('b2', [[136, 314], [176, 314]], ['winL', 'winL']),
    b.open('b3', [[248, 288], [248, 324]], ['winR', 'winR']), b.open('b4', [[230, 306], [266, 306]], ['winR', 'winR']),
  ];
  b.step('창살', '창마다 십자 모양으로 창살을 그어요.', ...bars);

  const stair = b.open('stair', [[168, 450], [164, 468], [236, 468], [232, 450]], ['wall', 'wall'], 0.2);
  b.step('계단', '문 아래에 납작한 계단을 그려요.', stair);

  const flL = b.closed('flL', flower(62, 380));
  const flR = b.closed('flR', flower(340, 392));
  b.step('꽃', '집 양옆에 꽃을 한 송이씩 그려요.', flL, flR);

  const stL = b.closed('stL', tube([[62, 398], [60, 430], [62, 466]], 3.5), 0.6);
  const stR = b.closed('stR', tube([[340, 410], [342, 440], [340, 466]], 3.5), 0.6);
  b.step('꽃줄기', '꽃 아래에 가느다란 줄기를 그려요.', stL, stR);

  const lfL = b.closed('lfL', [[64, 440], [80, 428], [96, 430], [86, 442]], 0.8);
  const lfR = b.closed('lfR', [[338, 446], [322, 434], [306, 436], [316, 448]], 0.8);
  b.step('잎', '줄기마다 작은 잎을 하나씩 붙여요.', lfL, lfR);

  const grass = (x) => [[x - 14, 468], [x - 10, 452], [x - 4, 464], [x, 448], [x + 4, 464], [x + 10, 452], [x + 14, 468]];
  const g1 = b.closed('g1', grass(100), 0);
  const g2 = b.closed('g2', grass(300), 0);
  b.step('풀', '벽 양쪽 아래에 뾰족한 풀을 그려요.', g1, g2);

  const wa = b.closed('wa', ellipse(352, 60, 12, 9, 8, -0.5));
  const wb = b.closed('wb', ellipse(372, 60, 12, 9, 8, 0.5));
  const bd = b.closed('bd', ellipse(362, 62, 3, 9, 6));
  b.step('나비', '지붕 오른쪽 위에 작은 나비를 그려요.', wa, wb, bd);

  return {
    id: 'mushroom-house', title: '버섯 집', theme: 'fantasy', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 종이를 거의 가로지르는 지붕부터 그릴 거예요.',
    coloringSeconds: 200, steps: b.steps, keywords: ['상상', '동화', '숲'],
  };
}
