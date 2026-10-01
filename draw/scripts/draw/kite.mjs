import { bench, ellipse } from './lib.mjs';

// ================================================================ 방패연 — 참조 없음(직접 디자인)
// 귀퉁이가 둥근 네모 연 + 가운데 둥근 방구멍 + 위쪽 색 띠와 꼭지 동그라미 + 살(세로·가로·엇갈린) + 리본 단 꼬리.
// 살은 방구멍을 지나가지 않게 테두리에서 방구멍까지 나눠 긋습니다.

// 귀퉁이가 살짝 둥근 네모를 지나가는 점들
const rr = (x0, y0, x1, y1, r) => [
  [x0 + r, y0], [(x0 + x1) / 2, y0 - 2], [x1 - r, y0], [x1 - r * 0.3, y0 + r * 0.3],
  [x1, y0 + r], [x1 + 2, (y0 + y1) / 2], [x1, y1 - r], [x1 - r * 0.3, y1 - r * 0.3],
  [x1 - r, y1], [(x0 + x1) / 2, y1 + 2], [x0 + r, y1], [x0 + r * 0.3, y1 - r * 0.3],
  [x0, y1 - r], [x0 - 2, (y0 + y1) / 2], [x0, y0 + r], [x0 + r * 0.3, y0 + r * 0.3],
];

export default function draw() {
  const b = bench();
  const X0 = 84; const Y0 = 34; const X1 = 296; const Y1 = 296;
  const kite = b.closed('kite', rr(X0, Y0, X1, Y1, 24), 0.8);
  b.step('연 몸', '종이 위쪽에 귀퉁이가 둥근 큰 네모 연을 그려요.', kite);

  const hole = b.closed('hole', ellipse(190, 182, 36, 36, 10));
  b.step('가운데 구멍', '연 가운데에 동그란 구멍을 하나 그려요.', hole);

  const band = b.open('band', [[X0, 98], [140, 100], [190, 100], [240, 100], [X1, 98]], ['kite', 'kite']);
  b.step('위쪽 띠', '연 위쪽에 가로로 띠 줄을 하나 그어요.', band);

  const knob = b.closed('knob', ellipse(190, 66, 19, 19, 10));
  b.step('꼭지 동그라미', '띠 위 가운데에 동그라미를 하나 그려요.', knob);

  const midUp = b.open('midUp', [[190, 100], [190, 124], [190, 146]], ['band', 'hole']);
  const midDn = b.open('midDn', [[190, 218], [190, 258], [190, 298]], ['hole', 'kite']);
  b.step('세로 살', '띠에서 구멍까지, 구멍에서 아래까지 세로 살을 그어요.', midUp, midDn);

  // 엇갈린 살 — 띠 양 끝에서 구멍을 지나 아래 귀퉁이로 가는 곧은 줄(구멍 안은 긋지 않음)
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const diag = (name, p, q, ends) => b.open(name, [p, lerp(p, q, 0.5), q], ends);
  const TL = [X0 + 8, 100]; const TR = [X1 - 8, 100]; const BL = [X0 + 10, Y1 - 10]; const BR = [X1 - 10, Y1 - 10];
  const C = [190, 182]; const at = (p) => { const dx = p[0] - C[0]; const dy = p[1] - C[1]; const l = Math.hypot(dx, dy); return [C[0] + (dx / l) * 36, C[1] + (dy / l) * 36]; };
  // 띠 끝과 아래 귀퉁이를 잇는 곧은 줄이 구멍 가운데를 지나도록 두 끝을 구멍 쪽으로 잇습니다.
  const dA = diag('dA', TL, at(TL), ['band', 'hole']);
  const dB = diag('dB', TR, at(TR), ['band', 'hole']);
  const dC = diag('dC', at(BL), BL, ['hole', 'kite']);
  const dD = diag('dD', at(BR), BR, ['hole', 'kite']);
  const waistL = b.open('waistL', [[X0, 182], [120, 182], [154, 182]], ['kite', 'hole']);
  const waistR = b.open('waistR', [[226, 182], [260, 182], [X1, 182]], ['hole', 'kite']);
  b.step('가로 살', '구멍 양옆에서 연 가장자리까지 가로 살을 그어요.', waistL, waistR);

  b.step('엇갈린 살', '띠 귀퉁이에서 아래 귀퉁이로 엇갈린 살을 그어요.', dA, dB, dC, dD);

  // 꼬리 끝 리본 — 가운데 매듭과 양옆 날개
  const K = [190, 446];
  const knot = b.closed('knot', ellipse(K[0], K[1], 9, 9));
  const wing = (sx) => [[K[0] + sx * 11, K[1] - 5], [K[0] + sx * 28, K[1] - 20], [K[0] + sx * 40, K[1] - 16],
    [K[0] + sx * 42, K[1]], [K[0] + sx * 40, K[1] + 16], [K[0] + sx * 28, K[1] + 20], [K[0] + sx * 11, K[1] + 5]];
  const wingL = b.closed('wingL', wing(-1), 0.8);
  const wingR = b.closed('wingR', wing(1), 0.8);
  b.step('꼬리 리본', '연 아래쪽 멀리 가운데에 작은 리본을 그려요.', knot, wingL, wingR);

  const tail = b.open('tail', [
    [190, 298], [168, 322], [172, 350], [204, 372], [210, 400], [194, 426], [190, 437],
  ], ['kite', 'knot']);
  b.step('긴 꼬리', '연 아래 가운데에서 리본까지 구불구불 꼬리를 그어요.', tail);

  return {
    id: 'kite', title: '방패연', theme: 'season', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 손바닥만큼 큰 네모 연을 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['설날', '연', '민속놀이'],
  };
}
