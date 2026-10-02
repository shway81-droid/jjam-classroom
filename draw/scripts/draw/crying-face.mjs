import { bench, ellipse } from './lib.mjs';

// ================================================================ 우는 얼굴 — 참조 없음(직접 디자인), 웃는 얼굴·놀란 얼굴의 짝
// 동그란 얼굴을 첫 획으로, 감은 눈은 아래로 처진 얇은 초승달(닫힌 획), 눈물은 물방울입니다.
const drop = (x, y, s) => [[x, y - 16 * s], [x + 8 * s, y], [x + 10 * s, y + 10 * s], [x, y + 18 * s], [x - 10 * s, y + 10 * s], [x - 8 * s, y]];

export default function draw() {
  const b = bench();
  const face = b.closed('face', ellipse(200, 260, 148, 148, 12));
  b.step('얼굴', '종이 가운데에 크고 동그란 얼굴을 그려요.', face);

  const earL = b.open('earL', [[54, 236], [36, 240], [28, 262], [36, 284], [54, 288]], ['face', 'face']);
  const earR = b.open('earR', [[346, 236], [364, 240], [372, 262], [364, 284], [346, 288]], ['face', 'face']);
  b.step('귀 두 개', '얼굴 양옆에 동그란 귀를 하나씩 붙여 그려요.', earL, earR);

  const hair = b.open('hair', [[176, 114], [168, 86], [184, 70], [200, 84], [212, 66], [230, 74], [226, 96], [222, 114]], ['face', 'face'], 0.8);
  b.step('머리카락', '얼굴 꼭대기에 삐죽 솟은 머리카락을 그려요.', hair);

  const browL = b.closed('browL', [[118, 190], [150, 178], [168, 182], [150, 188], [120, 198]], 0.7);
  const browR = b.closed('browR', [[282, 190], [250, 178], [232, 182], [250, 188], [280, 198]], 0.7);
  b.step('눈썹', '얼굴 위쪽에 바깥이 처진 눈썹을 두 개 그려요.', browL, browR);

  const eyeL = b.closed('eyeL', [[124, 236], [140, 224], [160, 222], [174, 230], [160, 230], [140, 232]], 0.8);
  const eyeR = b.closed('eyeR', [[276, 236], [260, 224], [240, 222], [226, 230], [240, 230], [260, 232]], 0.8);
  b.step('감은 눈', '눈썹 아래에 꼭 감은 눈을 두 개 그려요.', eyeL, eyeR);

  const tearL = b.closed('tearL', drop(132, 270, 1), 0.8);
  const tearR = b.closed('tearR', drop(268, 270, 1), 0.8);
  b.step('눈물', '감은 눈 아래에 똑 떨어지는 눈물을 그려요.', tearL, tearR);

  const mouth = b.closed('mouth', [[160, 350], [176, 322], [200, 314], [224, 322], [240, 350], [222, 358], [200, 360], [178, 358]], 0.8);
  b.step('우는 입', '얼굴 아래쪽에 크게 벌리고 우는 입을 그려요.', mouth);

  return {
    id: 'crying-face', title: '우는 얼굴', theme: 'person', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 큰 얼굴부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['사람', '표정', '마음'],
  };
}
