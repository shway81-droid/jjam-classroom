import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 성 — 참조 없음(직접 디자인)
// 성가퀴가 있는 가운데 벽을 첫 획으로 긋고, 양쪽 탑·뾰족 지붕·깃발을 차례로 붙입니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];
const arch = (x, y, w, h) => [[x - w, y + h], [x - w, y + 6], [x - w * 0.7, y - w * 0.4], [x, y - w], [x + w * 0.7, y - w * 0.4], [x + w, y + 6], [x + w, y + h], [x, y + h]];

export default function draw() {
  const b = bench();
  const wall = b.closed('wall', [
    [110, 460], [110, 250], [130, 250], [130, 230], [155, 230], [155, 250], [180, 250], [180, 230],
    [220, 230], [220, 250], [245, 250], [245, 230], [270, 230], [270, 250], [290, 250], [290, 460], [200, 460],
  ], 0);
  b.step('성벽', '종이 가운데 아래쪽에 위가 울퉁불퉁한 성벽을 그려요.', wall);

  const towerL = b.open('towerL', [[110, 458], [46, 458], [46, 170], [110, 170], [110, 252]], ['wall', 'wall'], 0);
  b.step('왼쪽 탑', '성벽 왼쪽에 위로 높이 솟은 탑을 그려요.', towerL);

  const towerR = b.open('towerR', [[290, 458], [354, 458], [354, 170], [290, 170], [290, 252]], ['wall', 'wall'], 0);
  b.step('오른쪽 탑', '성벽 오른쪽에도 똑같이 높은 탑을 그려요.', towerR);

  const roofL = b.open('roofL', [[46, 170], [78, 92], [110, 170]], ['towerL', 'towerL'], 0);
  const roofR = b.open('roofR', [[290, 170], [322, 92], [354, 170]], ['towerR', 'towerR'], 0);
  b.step('탑 지붕', '두 탑 위에 뾰족한 지붕을 하나씩 그려요.', roofL, roofR);

  const mid = b.open('mid', [[160, 230], [160, 150], [240, 150], [240, 230]], ['wall', 'wall'], 0);
  b.step('가운데 탑', '성벽 가운데 뒤쪽에 조금 높은 탑을 그려요.', mid);

  const roofM = b.open('roofM', [[160, 150], [200, 62], [240, 150]], ['mid', 'mid'], 0);
  b.step('가운데 지붕', '가운데 탑 위에 가장 높은 뾰족 지붕을 그려요.', roofM);

  const flag = (x, y, n) => b.closed(n, [[x - 2, y], [x - 2, y - 32], [x + 26, y - 24], [x + 2, y - 16], [x + 2, y]], 0.1);
  b.step('깃발', '지붕 꼭대기마다 작은 깃발을 하나씩 꽂아요.', flag(200, 64, 'fM'), flag(78, 94, 'fL'), flag(322, 94, 'fR'));

  const door = b.open('door', [[170, 460], [170, 392], [180, 374], [200, 366], [220, 374], [230, 392], [230, 460]], ['wall', 'wall'], 0.6);
  b.step('큰 문', '성벽 가운데 아래에 위가 둥근 큰 문을 그려요.', door);

  const g1 = b.open('g1', [[190, 368], [190, 460]], ['door', 'wall']);
  const g2 = b.open('g2', [[210, 368], [210, 460]], ['door', 'wall']);
  b.step('문 창살', '문 안에 세로줄을 두 개 그어요.', g1, g2);

  const wL = b.closed('wL', arch(78, 236, 11, 26), 0.5);
  const wR = b.closed('wR', arch(322, 236, 11, 26), 0.5);
  const wM = b.closed('wM', ellipse(200, 190, 14, 14, 10));
  b.step('탑 창문', '탑마다 작은 창문을 하나씩 그려요.', wL, wR, wM);

  const w1 = b.closed('w1', arch(144, 300, 12, 30), 0.5);
  const w2 = b.closed('w2', arch(256, 300, 12, 30), 0.5);
  b.step('성벽 창문', '문 양쪽 성벽에 위가 둥근 창문을 그려요.', w1, w2);

  const bricks = [[64, 330], [80, 400], [320, 330], [336, 400]].map(([x, y], i) => b.closed(`br${i}`, rect(x - 12, y - 7, x + 12, y + 7), 0.2));
  b.step('벽돌', '두 탑에 작은 네모 벽돌을 두 개씩 그려요.', ...bricks);

  const s1 = b.closed('s1', star(26, 128, 14, 6));
  const s2 = b.closed('s2', star(376, 132, 14, 6));
  b.step('별', '두 탑 바깥쪽 하늘에 별을 하나씩 그려요.', s1, s2);

  const moon = b.closed('moon', [[352, 22], [372, 30], [380, 46], [372, 62], [352, 68], [362, 56], [366, 44], [362, 32]], 0.8);
  b.step('달', '종이 오른쪽 맨 위에 가느다란 달을 그려요.', moon);

  return {
    id: 'castle', title: '성', theme: 'fantasy', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데 아래쪽에 손바닥보다 큰 성벽부터 그릴 거예요.',
    coloringSeconds: 200, steps: b.steps, keywords: ['상상', '성', '동화'],
  };
}
