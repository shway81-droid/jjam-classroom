import { bench, ellipse } from './lib.mjs';

// ================================================================ 부엉이 — 참조: refs/owl.png (귀깃 부엉이, 나뭇가지 위)
// 배의 떠 있는 깃털 무늬는 날개에서 날개까지 이어지는 물결 줄 두 개로 바꿨고,
// 나뭇가지는 발 뒤로 지나가도록 발에서 시작해 발로 돌아옵니다.

// 아래로 볼록한 반 동그라미를 n 개 잇는 점들 — 점을 촘촘히 찍어 이음매가 뾰족하게 남습니다.
const cups = (x0, x1, y, n, h, dir = 1) => {
  const pts = [];
  const w = (x1 - x0) / n;
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < 6; j++) {
      const t = (j / 6) * Math.PI;
      pts.push([x0 + w * k + (w / 2) * (1 - Math.cos(t)), y + dir * h * Math.sin(t)]);
    }
  }
  pts.push([x1, y]);
  return pts;
};

export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    [200, 97], [240, 98], [268, 100], [286, 90], [292, 82], [296, 102], [289, 124],
    [294, 158], [292, 190], [280, 212], [262, 227], [286, 248], [298, 276], [300, 306],
    [290, 336], [266, 358], [234, 369], [200, 372], [166, 369], [134, 358], [110, 336],
    [100, 306], [102, 276], [114, 248], [138, 227], [120, 212], [108, 190], [106, 158],
    [111, 124], [104, 102], [108, 82], [114, 90], [132, 100], [160, 98],
  ]);
  b.step('귀 달린 몸', '종이 가운데에 귀가 뾰족하게 솟은 통통한 몸을 그려요.', body);

  const eyeL = b.closed('eyeL', ellipse(158, 173, 23, 23, 10));
  const eyeR = b.closed('eyeR', ellipse(242, 173, 23, 23, 10));
  const pupilL = b.closed('pupilL', ellipse(160, 175, 11, 11, 8));
  const pupilR = b.closed('pupilR', ellipse(240, 175, 11, 11, 8));
  b.step('큰 눈 두 개', '머리 가운데에 큰 눈을 두 개 그리고 눈동자를 넣어요.', eyeL, eyeR, pupilL, pupilR);

  // 눈 위를 감싸는 얼굴 테 — 양 끝은 머리 옆, 가운데는 부리 위에서 만납니다.
  const mask = b.open('mask', [
    [108, 168], [118, 146], [138, 132], [164, 130], [186, 142], [198, 162], [200, 174],
    [202, 162], [214, 142], [236, 130], [262, 132], [282, 146], [292, 168],
  ], ['body', 'body']);
  b.step('얼굴 테', '두 눈 위를 둥글게 감싸는 얼굴 테를 그려요.', mask);

  const beak = b.closed('beak', [[186, 186], [200, 183], [214, 186], [208, 200], [200, 212], [192, 200]], 0.7);
  b.step('부리', '두 눈 사이 아래에 아래로 뾰족한 부리를 그려요.', beak);

  const chin = b.open('chin', [[138, 227], [168, 225], [200, 214], [232, 225], [262, 227]], ['body', 'body']);
  b.step('얼굴 아래', '부리 끝을 지나 양옆으로 얼굴 아래 줄을 그어요.', chin);

  const wingL = b.open('wingL', [[146, 226], [134, 262], [124, 300], [118, 333]], ['chin', 'body']);
  const wingR = b.open('wingR', [[254, 226], [266, 262], [276, 300], [282, 333]], ['chin', 'body']);
  b.step('날개 두 개', '몸 양옆에 아래로 길게 내려오는 날개를 그려요.', wingL, wingR);

  const feather1 = b.open('feather1', cups(129, 271, 282, 4, 12), ['wingL', 'wingR'], 0.6);
  const feather2 = b.open('feather2', cups(122, 278, 318, 4, 12), ['wingL', 'wingR'], 0.6);
  b.step('배 깃털', '날개 사이에 물결 모양 깃털 줄을 두 개 그어요.', feather1, feather2);

  const footL = b.open('footL', [[152, 364], [151, 384], ...cups(151, 197, 386, 3, 9).slice(1), [197, 384], [196, 370]], ['body', 'body'], 0.6);
  const footR = b.open('footR', [[204, 370], [203, 384], ...cups(203, 249, 386, 3, 9).slice(1), [249, 384], [248, 364]], ['body', 'body'], 0.6);
  b.step('발 두 개', '몸 아래에 발가락이 세 개씩인 발을 그려요.', footL, footR);

  const branchL = b.open('branchL', [[150, 378], [100, 376], [52, 373], [44, 386], [52, 399], [100, 398], [150, 394]], ['footL', 'footL']);
  const branchR = b.open('branchR', [[251, 378], [292, 371], [326, 350], [350, 330], [360, 338], [338, 362], [298, 388], [251, 394]], ['footR', 'footR']);
  b.step('나뭇가지', '발 양옆으로 길게 뻗은 나뭇가지를 그려요.', branchL, branchR);

  const leaf1 = b.closed('leaf1', [[355, 333], [358, 308], [374, 288], [386, 304], [376, 326]], 0.8);
  const leaf2 = b.closed('leaf2', [[318, 379], [338, 388], [356, 408], [332, 410], [318, 396]], 0.8);
  b.step('나뭇잎 두 개', '나뭇가지 끝과 아래에 작은 나뭇잎을 붙여 그려요.', leaf1, leaf2);

  return {
    id: 'owl', title: '부엉이', theme: 'animal', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 크게 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['동물', '부엉이', '새'],
  };
}
