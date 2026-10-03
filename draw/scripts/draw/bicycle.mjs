import { bench, ellipse } from './lib.mjs';

// ================================================================ 자전거 — 참조 없음(직접 디자인), 옆모습
// 두 바퀴를 먼저 긋고, 몸통 세모와 막대들은 바퀴 가운데와 몸통 위에 양 끝을 붙입니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];

export default function draw() {
  const b = bench();
  const wL = b.closed('wL', ellipse(130, 270, 85, 85, 14));
  b.step('뒷바퀴', '종이 왼쪽 아래에 손바닥보다 큰 바퀴를 그려요.', wL);

  const wR = b.closed('wR', ellipse(370, 270, 85, 85, 14));
  b.step('앞바퀴', '종이 오른쪽 아래에도 똑같은 바퀴를 그려요.', wR);

  const hL = b.closed('hL', ellipse(130, 270, 10, 10, 8));
  const hR = b.closed('hR', ellipse(370, 270, 10, 10, 8));
  b.step('바퀴 가운데', '두 바퀴 한가운데에 작은 동그라미를 그려요.', hL, hR);

  const spokes = [];
  [[130, 'hL', 'wL'], [370, 'hR', 'wR']].forEach(([cx, h, w]) => [90, 210, 330].forEach((deg) => {
    const a = (deg * Math.PI) / 180;
    spokes.push(b.open(`sp${cx}${deg}`, [[cx + Math.cos(a) * 10, 270 + Math.sin(a) * 10], [cx + Math.cos(a) * 85, 270 + Math.sin(a) * 85]], [h, w]));
  }));
  b.step('바퀴살', '바퀴 가운데에서 테두리까지 살을 세 개씩 그어요.', ...spokes);

  const frame = b.closed('frame', [[250, 280], [190, 172], [330, 172]], 0);
  b.step('몸통', '두 바퀴 사이에 아래가 뾰족한 몸통을 그려요.', frame);

  const cs = b.open('cs', [[130, 270], [250, 280]], ['hL', 'frame']);
  const ss = b.open('ss', [[130, 270], [190, 172]], ['hL', 'frame']);
  b.step('뒤 막대', '뒷바퀴 가운데에서 몸통으로 막대를 두 개 이어요.', cs, ss);

  const fork = b.open('fork', [[330, 172], [350, 220], [370, 270]], ['frame', 'hR']);
  b.step('앞 막대', '몸통 앞쪽에서 앞바퀴 가운데로 막대를 이어요.', fork);

  const bar = b.closed('bar', [[326, 174], [320, 132], [304, 118], [288, 120], [288, 129], [304, 130], [311, 138], [318, 174]], 0.5);
  b.step('핸들', '앞 막대 위로 손잡이가 굽은 핸들을 그려요.', bar);

  const seat = b.closed('seat', [[160, 164], [180, 156], [214, 158], [222, 166], [204, 172], [172, 172]], 0.7);
  b.step('안장', '몸통 왼쪽 꼭대기에 길쭉한 안장을 그려요.', seat);

  const ring = b.closed('ring', ellipse(250, 280, 22, 22, 10));
  b.step('톱니바퀴', '몸통 아래 꼭짓점에 동그란 톱니바퀴를 그려요.', ring);

  const pedal = b.closed('pedal', [[253, 296], [264, 316], [254, 316], [254, 326], [284, 326], [284, 316], [272, 316], [261, 294]], 0.1);
  b.step('페달', '톱니바퀴 아래에 발을 올리는 페달을 그려요.', pedal);

  const ch1 = b.open('ch1', [[250, 258], [130, 260]], ['ring', 'hL']);
  const ch2 = b.open('ch2', [[250, 302], [130, 280]], ['ring', 'hL']);
  b.step('체인', '톱니바퀴와 뒷바퀴 가운데를 줄 두 개로 이어요.', ch1, ch2);

  const basket = b.closed('basket', [[336, 136], [366, 136], [396, 136], [388, 178], [366, 178], [344, 178]], 0.15);
  b.step('바구니', '핸들 앞에 네모난 바구니를 달아요.', basket);

  const k1 = b.open('k1', [[338, 157], [366, 157], [392, 157]], ['basket', 'basket']);
  const k2 = b.open('k2', [[366, 136], [366, 178]], ['basket', 'basket']);
  b.step('바구니 줄', '바구니에 가로줄과 세로줄을 하나씩 그어요.', k1, k2);

  const petals = [0, 1, 2, 3, 4].map((k) => {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    return b.closed(`pt${k}`, ellipse(366 + Math.cos(a) * 12, 112 + Math.sin(a) * 12, 8, 6, 8, a));
  });
  const fc = b.closed('fc', ellipse(366, 112, 6, 6, 8));
  b.step('꽃', '바구니 위에 꽃잎이 다섯 장인 꽃을 그려요.', ...petals, fc);

  return {
    id: 'bicycle', title: '자전거', theme: 'thing', difficulty: 'hard', grades: ['upper'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 왼쪽 아래에 손바닥보다 큰 바퀴부터 그릴 거예요.',
    coloringSeconds: 200, steps: b.steps, keywords: ['탈것', '자전거', '운동'],
  };
}
