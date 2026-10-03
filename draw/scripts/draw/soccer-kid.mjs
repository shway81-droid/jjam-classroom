import { bench, ellipse } from './lib.mjs';

// ================================================================ 공 차는 아이 — 참조 없음(직접 디자인)
// 큰 얼굴을 먼저 긋고(첫 획 40% 규칙), 옷·바지·팔다리를 차례로 붙인 뒤 공을 그립니다.
export default function draw() {
  const b = bench();
  const face = b.closed('face', ellipse(190, 150, 90, 90, 14));
  b.step('얼굴', '종이 위쪽에 크고 동그란 얼굴을 그려요.', face);

  const hair = b.open('hair', [[104, 124], [116, 76], [150, 50], [190, 42], [230, 50], [264, 76], [276, 124]], ['face', 'face']);
  b.step('머리카락', '얼굴 위를 덮는 둥근 머리카락을 그려요.', hair);

  const bangs = b.open('bangs', [[108, 112], [132, 98], [150, 116], [170, 94], [190, 114], [210, 94], [230, 116], [250, 98], [272, 112]], ['hair', 'hair'], 0.5);
  b.step('앞머리', '이마에 삐죽삐죽한 앞머리를 그려요.', bangs);

  const eyeL = b.closed('eyeL', ellipse(158, 154, 8, 11));
  const eyeR = b.closed('eyeR', ellipse(222, 154, 8, 11));
  b.step('눈 두 개', '앞머리 아래에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[172, 188], [190, 194], [208, 188], [202, 204], [190, 210], [178, 204]], 0.8);
  b.step('웃는 입', '두 눈 사이 아래에 크게 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(134, 186, 12, 8));
  const cheekR = b.closed('cheekR', ellipse(246, 186, 12, 8));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  const shirt = b.open('shirt', [[150, 232], [130, 250], [126, 300], [130, 340], [250, 340], [254, 300], [250, 250], [230, 232]], ['face', 'face']);
  b.step('운동복', '얼굴 아래에 어깨가 둥근 운동복을 그려요.', shirt);

  const collar = b.open('collar', [[174, 238], [190, 258], [206, 238]], ['face', 'face']);
  b.step('옷깃', '운동복 목 아래에 뾰족한 옷깃을 그려요.', collar);

  const shorts = b.open('shorts', [[132, 338], [130, 380], [182, 382], [190, 360], [198, 382], [250, 380], [248, 338]], ['shirt', 'shirt'], 0.3);
  b.step('반바지', '운동복 아래에 짧은 반바지를 그려요.', shorts);

  const armL = b.open('armL', [[132, 256], [100, 280], [86, 310], [100, 318], [114, 296], [130, 284]], ['shirt', 'shirt']);
  const armR = b.open('armR', [[248, 256], [280, 240], [300, 214], [292, 204], [276, 226], [250, 240]], ['shirt', 'shirt']);
  b.step('팔 두 개', '한 팔은 아래로, 한 팔은 위로 번쩍 들어요.', armL, armR);

  const legL = b.open('legL', [[152, 381], [152, 436], [178, 436], [178, 381]], ['shorts', 'shorts'], 0.3);
  const legR = b.open('legR', [[204, 381], [226, 420], [244, 432], [258, 416], [240, 380]], ['shorts', 'shorts'], 0.5);
  b.step('다리 두 개', '한 다리는 곧게 서고 한 다리는 공 쪽으로 뻗어요.', legL, legR);

  const shoeL = b.closed('shoeL', ellipse(164, 446, 26, 12));
  const shoeR = b.closed('shoeR', ellipse(262, 434, 22, 12, 10, 0.5));
  b.step('운동화', '두 발 끝에 둥근 운동화를 그려요.', shoeL, shoeR);

  const ball = b.closed('ball', ellipse(326, 432, 36, 36, 12));
  b.step('축구공', '오른쪽 발 앞에 동그란 축구공을 그려요.', ball);

  const pent = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return [326 + Math.cos(a) * 12, 432 + Math.sin(a) * 12];
  });
  const pt = b.closed('pent', pent, 0.1);
  const spokes = pent.map((p, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return b.open(`sp${i}`, [p, [326 + Math.cos(a) * 36, 432 + Math.sin(a) * 36]], ['pent', 'ball']);
  });
  b.step('공 무늬', '공 가운데에 오각 무늬를 그리고 줄을 다섯 개 그어요.', pt, ...spokes);

  return {
    id: 'soccer-kid', title: '공 차는 아이', theme: 'person', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 손바닥보다 큰 얼굴부터 그릴 거예요.',
    coloringSeconds: 200, steps: b.steps, keywords: ['사람', '운동', '친구'],
  };
}
