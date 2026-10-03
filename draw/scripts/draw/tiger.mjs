import { bench, ellipse } from './lib.mjs';

// ================================================================ 호랑이 얼굴 — 참조 없음(직접 디자인)
// 볼털이 삐죽한 넓은 얼굴을 먼저 긋고, 줄무늬는 얼굴 테두리 위에 양 끝을 붙인 쐐기 모양으로 그립니다.
export default function draw() {
  const b = bench();
  const face = b.closed('face', [
    [200, 130], [270, 140], [318, 180], [336, 240], [352, 280], [326, 300], [316, 330], [270, 370],
    [200, 386], [130, 370], [84, 330], [74, 300], [48, 280], [64, 240], [82, 180], [130, 140],
  ], 0.8);
  b.step('얼굴', '종이 가운데에 볼털이 삐죽한 넓은 얼굴을 그려요.', face);

  const earL = b.open('earL', [[98, 170], [90, 112], [120, 86], [160, 106], [168, 140]], ['face', 'face']);
  const earR = b.open('earR', [[302, 170], [310, 112], [280, 86], [240, 106], [232, 140]], ['face', 'face']);
  b.step('귀 두 개', '얼굴 위쪽 양옆에 둥근 귀를 그려요.', earL, earR);

  const inL = b.closed('inL', ellipse(124, 120, 12, 14));
  const inR = b.closed('inR', ellipse(276, 120, 12, 14));
  b.step('귀 안쪽', '귀 안에 작은 동그라미를 하나씩 그려요.', inL, inR);

  const f1 = b.open('f1', [[186, 131], [200, 186], [214, 131]], ['face', 'face'], 0.3);
  const f2 = b.open('f2', [[150, 140], [164, 172], [174, 136]], ['face', 'face'], 0.3);
  const f3 = b.open('f3', [[250, 140], [236, 172], [226, 136]], ['face', 'face'], 0.3);
  b.step('이마 무늬', '이마에 아래로 뾰족한 줄무늬를 세 개 그려요.', f1, f2, f3);

  const l1 = b.open('l1', [[66, 236], [114, 248], [70, 262]], ['face', 'face'], 0.3);
  const l2 = b.open('l2', [[58, 284], [106, 292], [76, 304]], ['face', 'face'], 0.3);
  b.step('왼쪽 무늬', '왼쪽 볼에 안쪽으로 뾰족한 줄무늬를 두 개 그려요.', l1, l2);

  const r1 = b.open('r1', [[334, 236], [286, 248], [330, 262]], ['face', 'face'], 0.3);
  const r2 = b.open('r2', [[342, 284], [294, 292], [324, 304]], ['face', 'face'], 0.3);
  b.step('오른쪽 무늬', '오른쪽 볼에도 줄무늬를 두 개 그려요.', r1, r2);

  const bL = b.closed('bL', ellipse(152, 202, 14, 8));
  const bR = b.closed('bR', ellipse(248, 202, 14, 8));
  b.step('눈썹 점', '눈이 들어갈 자리 위에 작은 눈썹 점을 그려요.', bL, bR);

  const eyeL = b.closed('eyeL', ellipse(158, 236, 13, 16));
  const eyeR = b.closed('eyeR', ellipse(242, 236, 13, 16));
  b.step('눈 두 개', '눈썹 아래에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const pL = b.closed('pL', ellipse(161, 240, 5, 7, 6));
  const pR = b.closed('pR', ellipse(239, 240, 5, 7, 6));
  b.step('눈동자', '눈 안에 작은 눈동자를 하나씩 그려요.', pL, pR);

  const puffL = b.closed('puffL', ellipse(176, 308, 31, 22));
  const puffR = b.closed('puffR', ellipse(224, 308, 31, 22));
  b.step('주둥이', '얼굴 아래쪽에 통통한 동그라미 두 개를 나란히 그려요.', puffL, puffR);

  const nose = b.closed('nose', [[180, 262], [200, 258], [220, 262], [213, 278], [200, 285], [187, 278]], 0.8);
  b.step('코', '주둥이 위 가운데에 둥근 코를 그려요.', nose);

  const chin = b.closed('chin', ellipse(200, 344, 16, 11));
  b.step('턱', '주둥이 아래에 작고 동그란 턱을 그려요.', chin);

  const dots = [[160, 302], [176, 314], [162, 320], [240, 302], [224, 314], [238, 320]]
    .map(([x, y], i) => b.closed(`d${i}`, ellipse(x, y, 3.5, 3.5, 6)));
  b.step('수염 점', '주둥이 양쪽에 작은 점을 세 개씩 그려요.', ...dots);

  return {
    id: 'tiger', title: '호랑이 얼굴', theme: 'animal', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 종이를 거의 채우는 얼굴부터 그릴 거예요.',
    coloringSeconds: 200, steps: b.steps, keywords: ['동물', '호랑이', '옛이야기'],
  };
}
