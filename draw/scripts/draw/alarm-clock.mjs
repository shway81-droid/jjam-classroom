import { bench, ellipse } from './lib.mjs';

// ================================================================ 자명종 시계 — 참조 없음(직접 디자인)
// 큰 동그라미를 첫 획으로, 종과 다리는 양 끝이 시계에 붙고, 바늘은 가운데 점 둘레의 가는 닫힌 획입니다.
const R = 140; const CX = 200; const CY = 270;
const on = (deg) => [CX + Math.cos((deg * Math.PI) / 180) * R, CY + Math.sin((deg * Math.PI) / 180) * R];
const mirror = (pts) => pts.map(([x, y]) => [400 - x, y]);

export default function draw() {
  const b = bench();
  const clock = b.closed('clock', ellipse(CX, CY, R, R, 12));
  b.step('큰 동그라미', '종이 가운데에 크고 동그란 시계를 그려요.', clock);

  const ring = b.closed('ring', ellipse(CX, CY, 114, 114, 12));
  b.step('안쪽 테', '시계 안쪽에 조금 작은 동그라미를 하나 더 그려요.', ring);

  const bellPts = [on(222), [92, 140], [112, 104], [148, 100], on(252)];
  const bellL = b.open('bellL', bellPts, ['clock', 'clock']);
  const bellR = b.open('bellR', mirror(bellPts), ['clock', 'clock']);
  b.step('종 두 개', '시계 위 양쪽에 둥근 종을 하나씩 그려요.', bellL, bellR);

  const legPts = [on(118), [126, 430], [144, 438], on(106)];
  const legL = b.open('legL', legPts, ['clock', 'clock']);
  const legR = b.open('legR', mirror(legPts), ['clock', 'clock']);
  b.step('다리 두 개', '시계 아래 양쪽에 짧은 다리를 그려요.', legL, legR);

  const dots = [[200, 176], [294, 270], [200, 364], [106, 270]].map(([x, y], i) => b.closed(`d${i}`, ellipse(x, y, 7, 7)));
  b.step('시간 점', '안쪽 테 위아래 양옆에 작은 점을 네 개 그려요.', ...dots);

  const center = b.closed('center', ellipse(CX, CY, 9, 9));
  const hour = b.closed('hour', [[196, 266], [232, 230], [238, 236], [204, 274]], 0.3);
  const minute = b.closed('minute', [[196, 266], [198, 196], [206, 196], [204, 266]], 0.3);
  b.step('바늘', '가운데에 점을 찍고 길고 짧은 바늘을 그려요.', center, hour, minute);

  return {
    id: 'alarm-clock', title: '자명종 시계', theme: 'thing', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 큰 동그라미부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['사물', '시계', '아침'],
  };
}
