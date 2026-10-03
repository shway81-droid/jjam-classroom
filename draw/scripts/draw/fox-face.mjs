import { bench, ellipse } from './lib.mjs';

// ================================================================ 여우 얼굴 — 참조 없음(직접 디자인)
// 볼이 넓고 턱이 뾰족한 얼굴을 먼저 긋고, 높은 귀와 흰 털 경계는 얼굴 위에 양 끝을 붙입니다.
export default function draw() {
  const b = bench();
  const face = b.closed('face', [[200, 140], [260, 150], [300, 190], [318, 250], [290, 300], [240, 340], [200, 370], [160, 340], [110, 300], [82, 250], [100, 190], [140, 150]], 0.8);
  b.step('얼굴', '종이 가운데에 볼이 넓고 턱이 뾰족한 얼굴을 그려요.', face);

  const earL = b.open('earL', [[110, 178], [96, 104], [104, 54], [150, 92], [168, 146]], ['face', 'face']);
  const earR = b.open('earR', [[290, 178], [304, 104], [296, 54], [250, 92], [232, 146]], ['face', 'face']);
  b.step('뾰족 귀', '얼굴 위쪽 양옆에 높고 뾰족한 귀를 그려요.', earL, earR);

  const inL = b.closed('inL', [[116, 150], [112, 88], [144, 112]], 0.4);
  const inR = b.closed('inR', [[284, 150], [288, 88], [256, 112]], 0.4);
  b.step('귀 안쪽', '귀 안에 작은 세모를 하나씩 그려요.', inL, inR);

  const mL = b.open('mL', [[86, 258], [136, 266], [168, 296], [194, 364]], ['face', 'face']);
  const mR = b.open('mR', [[314, 258], [264, 266], [232, 296], [206, 364]], ['face', 'face']);
  b.step('흰 털', '양 볼에서 턱까지 둥근 줄을 그어 흰 털을 나눠요.', mL, mR);

  const eyeL = b.closed('eyeL', ellipse(160, 232, 8, 11));
  const eyeR = b.closed('eyeR', ellipse(240, 232, 8, 11));
  b.step('눈 두 개', '얼굴 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const nose = b.closed('nose', ellipse(200, 316, 14, 10));
  b.step('코', '턱 가까이에 동그란 코를 그려요.', nose);

  const mouth = b.closed('mouth', [[188, 336], [200, 342], [212, 336], [208, 346], [200, 350], [192, 346]], 0.8);
  b.step('웃는 입', '코 아래에 작게 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(134, 290, 11, 7));
  const cheekR = b.closed('cheekR', ellipse(266, 290, 11, 7));
  b.step('볼 두 개', '흰 털 위에 발그레한 볼을 그려요.', cheekL, cheekR);

  const mark = b.closed('mark', [[200, 164], [212, 182], [200, 202], [188, 182]], 0.6);
  b.step('이마 무늬', '이마 가운데에 작은 무늬를 하나 그려요.', mark);

  return {
    id: 'fox-face', title: '여우 얼굴', theme: 'animal', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥보다 큰 얼굴부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['동물', '여우', '숲'],
  };
}
