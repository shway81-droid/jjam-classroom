import { bench, ellipse } from './lib.mjs';

// ================================================================ 등대 — 참조 없음(직접 디자인)
// 아래가 넓은 등대 몸을 첫 획으로 긋고, 난간·등불 방·지붕을 위로 쌓습니다. 빛줄기는 닫힌 쐐기입니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];
const cloud = (cx, cy) => [[cx - 40, cy + 12], [cx - 46, cy], [cx - 30, cy - 14], [cx - 12, cy - 24], [cx + 10, cy - 26], [cx + 28, cy - 14], [cx + 44, cy - 4], [cx + 42, cy + 12], [cx, cy + 14]];
const bird = (x, y) => [[x - 16, y], [x - 8, y - 6], [x, y], [x + 8, y - 6], [x + 16, y], [x + 8, y - 2], [x, y + 3], [x - 8, y - 2]];

export default function draw() {
  const b = bench();
  const tower = b.closed('tower', [[150, 440], [160, 315], [170, 192], [200, 192], [230, 192], [240, 315], [250, 440], [200, 440]], 0);
  b.step('등대 몸', '종이 가운데에 아래가 넓고 위가 좁은 등대를 그려요.', tower);

  const deck = b.closed('deck', rect(150, 176, 250, 192), 0.1);
  b.step('난간', '등대 꼭대기에 옆으로 긴 난간을 그려요.', deck);

  const lamp = b.closed('lamp', rect(174, 120, 226, 176), 0);
  b.step('등불 방', '난간 위에 네모난 등불 방을 그려요.', lamp);

  const dome = b.open('dome', [[174, 120], [178, 98], [200, 86], [222, 98], [226, 120]], ['lamp', 'lamp']);
  b.step('지붕', '등불 방 위에 둥근 지붕을 그려요.', dome);

  const ball = b.closed('ball', ellipse(200, 76, 10, 10, 8));
  b.step('꼭대기 공', '지붕 꼭대기에 작은 공을 하나 올려요.', ball);

  const light = b.closed('light', ellipse(200, 148, 14, 14, 10));
  b.step('불빛', '등불 방 가운데에 동그란 불빛을 그려요.', light);

  const beamL = b.closed('beamL', [[172, 140], [90, 112], [90, 172], [172, 156]], 0);
  const beamR = b.closed('beamR', [[228, 140], [310, 112], [310, 172], [228, 156]], 0);
  b.step('빛줄기', '등불 방 양옆으로 넓게 퍼지는 빛을 그려요.', beamL, beamR);

  const st = [250, 290, 340, 384].map((y, i) => b.open(`st${i}`, [[150, y], [200, y], [250, y]], ['tower', 'tower']));
  b.step('줄무늬', '등대 몸에 가로줄을 네 개 그어 줄무늬를 만들어요.', ...st);

  const w1 = b.closed('w1', ellipse(200, 222, 8, 11));
  const w2 = b.closed('w2', ellipse(200, 315, 8, 11));
  b.step('창문', '줄무늬 사이에 작은 창문을 두 개 그려요.', w1, w2);

  const door = b.open('door', [[186, 440], [186, 406], [200, 394], [214, 406], [214, 440]], ['tower', 'tower']);
  b.step('문', '등대 맨 아래 가운데에 작은 문을 그려요.', door);

  const rock = b.open('rock', [[150, 440], [124, 434], [100, 448], [94, 470], [200, 476], [306, 470], [300, 448], [276, 434], [250, 440]], ['tower', 'tower']);
  b.step('바위', '등대 아래에 울퉁불퉁한 바위를 그려요.', rock);

  const wave = (x) => [[x - 34, 470], [x - 24, 452], [x - 6, 446], [x + 10, 452], [x + 2, 458], [x - 4, 470]];
  const wvL = b.closed('wvL', wave(46), 0.7);
  const wvR = b.closed('wvR', wave(350), 0.7);
  b.step('파도', '바위 양옆에 둥글게 말린 파도를 그려요.', wvL, wvR);

  const b1 = b.closed('b1', bird(80, 250), 0.6);
  const b2 = b.closed('b2', bird(320, 230), 0.6);
  b.step('갈매기', '등대 양옆 하늘에 갈매기를 한 마리씩 그려요.', b1, b2);

  const cl = b.closed('cl', cloud(330, 54), 0.8);
  b.step('구름', '종이 오른쪽 위에 몽실몽실한 구름을 그려요.', cl);

  return {
    id: 'lighthouse', title: '등대', theme: 'thing', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 종이 반만큼 높은 등대부터 그릴 거예요.',
    coloringSeconds: 200, steps: b.steps, keywords: ['바다', '등대', '여행'],
  };
}
