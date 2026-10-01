import { bench, ellipse } from './lib.mjs';

// ================================================================ 버스 — 참조 없음(직접 디자인), 왼쪽을 보는 통통한 버스 옆모습
// 바퀴 덮개(아치)는 자동차처럼 몸통 테두리의 일부로 그립니다 — 바퀴가 그 아래로 쏙 들어갑니다.
const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy - Math.sin(a) * r];
});

// 귀퉁이가 둥근 네모를 지나가는 점들
const rr = (x0, y0, x1, y1, r) => [
  [x0 + r, y0], [(x0 + x1) / 2, y0], [x1 - r, y0], [x1 - r * 0.3, y0 + r * 0.3],
  [x1, y0 + r], [x1, (y0 + y1) / 2], [x1, y1 - r], [x1 - r * 0.3, y1 - r * 0.3],
  [x1 - r, y1], [(x0 + x1) / 2, y1], [x0 + r, y1], [x0 + r * 0.3, y1 - r * 0.3],
  [x0, y1 - r], [x0, (y0 + y1) / 2], [x0, y0 + r], [x0 + r * 0.3, y0 + r * 0.3],
];

export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    [58, 290],
    ...arc(122, 292, 50, 178, 2, 8),
    [190, 294], [250, 295], [304, 294],
    ...arc(368, 292, 50, 178, 2, 8),
    [432, 292], [446, 284], [452, 262], [454, 200], [452, 140], [446, 108], [430, 92],
    [400, 86], [320, 84], [240, 84], [160, 85], [104, 88], [78, 98], [62, 118],
    [52, 160], [48, 210], [48, 250], [50, 278],
  ], 0.8);
  b.step('버스 몸', '종이 가운데에 길쭉하고 둥근 버스 몸을 크게 그려요.', body);

  const wheelF = b.closed('wheelF', ellipse(122, 293, 40, 40, 10));
  const wheelR = b.closed('wheelR', ellipse(368, 293, 40, 40, 10));
  b.step('바퀴 두 개', '바퀴 자리 아래에 동그란 바퀴를 두 개 그려요.', wheelF, wheelR);

  const hubF = b.closed('hubF', ellipse(122, 293, 16, 16));
  const hubR = b.closed('hubR', ellipse(368, 293, 16, 16));
  b.step('바퀴 가운데', '바퀴 가운데에 작은 동그라미를 하나씩 넣어요.', hubF, hubR);

  const shield = b.closed('shield', [
    [86, 106], [104, 102], [116, 106], [118, 140], [116, 186], [104, 192], [76, 192], [66, 186],
    [64, 160], [68, 130], [74, 114],
  ], 0.7);
  b.step('앞 유리', '버스 앞쪽에 위아래로 긴 큰 앞 유리를 그려요.', shield);

  const door = b.closed('door', rr(180, 102, 236, 280, 16), 0.7);
  b.step('문', '앞바퀴 뒤에 위아래로 긴 문을 그려요.', door);

  const doorWin = b.closed('doorWin', rr(193, 116, 223, 186, 11), 0.7);
  b.step('문 창문', '문 위쪽 안에 길쭉한 창문을 작게 그려요.', doorWin);

  const w1 = b.closed('w1', rr(248, 104, 302, 164, 14), 0.7);
  const w2 = b.closed('w2', rr(314, 104, 368, 164, 14), 0.7);
  const w3 = b.closed('w3', rr(380, 104, 434, 164, 14), 0.7);
  b.step('옆 창문 세 개', '문 옆에 귀퉁이가 둥근 창문을 세 개 나란히 그려요.', w1, w2, w3);

  const stripeF = b.open('stripeF', [[48, 216], [120, 214], [180, 214]], ['body', 'door']);
  const stripeB = b.open('stripeB', [[236, 214], [340, 214], [454, 214]], ['door', 'body']);
  b.step('옆 띠', '창문 아래에 버스를 가로지르는 띠를 그어요.', stripeF, stripeB);

  const light = b.closed('light', ellipse(74, 246, 12, 14));
  const tail = b.closed('tail', ellipse(436, 244, 7, 14, 8));
  b.step('앞뒤 불빛', '버스 앞에 동그란 불빛을, 뒤에 길쭉한 불빛을 그려요.', light, tail);

  const mirror = b.closed('mirror', ellipse(28, 150, 8, 16, 8));
  const arm = b.open('arm', [[62, 114], [42, 112], [30, 122], [28, 134]], ['body', 'mirror']);
  b.step('거울', '앞 유리 옆에 작은 거울을 달아요.', mirror, arm);

  const roof = b.open('roof', [[200, 85], [206, 70], [230, 66], [300, 66], [324, 70], [330, 85]], ['body', 'body']);
  b.step('지붕 위 상자', '지붕 위 가운데에 납작한 상자를 얹어요.', roof);

  return {
    id: 'bus', title: '버스', theme: 'thing', difficulty: 'normal', grades: ['middle'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥 두 개만큼 길게 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['탈것', '버스', '학교'],
  };
}
