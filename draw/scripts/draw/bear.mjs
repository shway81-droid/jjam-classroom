import { bench, ellipse } from './lib.mjs';

// ================================================================ 아기 곰 — 참조 선화 없음(직접 디자인), 앉아서 하트를 안은 정면
// 둥근 머리에 둥근 귀, 주둥이·코·입, 통통한 몸에 배 무늬, 하트를 안은 두 팔, 발바닥이 보이는 두 발.
export default function draw() {
  const b = bench();
  const head = b.closed('head', [
    [200, 62], [252, 68], [292, 94], [312, 134], [312, 176], [294, 214],
    [256, 240], [200, 250], [144, 240], [106, 214], [88, 176], [88, 134],
    [108, 94], [148, 68],
  ]);
  b.step('큰 머리', '종이 위쪽에 옆으로 조금 넓은 큰 머리를 그려요.', head);

  const earL = b.open('earL', [[104, 102], [86, 88], [80, 64], [94, 44], [118, 40], [136, 52], [142, 70]], ['head', 'head']);
  const earR = b.open('earR', [[296, 102], [314, 88], [320, 64], [306, 44], [282, 40], [264, 52], [258, 70]], ['head', 'head']);
  b.step('둥근 귀', '머리 위 양쪽에 동그란 귀를 하나씩 그려요.', earL, earR);

  const inL = b.closed('inL', [[100, 74], [106, 60], [120, 56], [128, 66], [118, 78], [106, 84]]);
  const inR = b.closed('inR', [[300, 74], [294, 60], [280, 56], [272, 66], [282, 78], [294, 84]]);
  b.step('귀 안쪽', '귀 안에 작은 동그라미를 하나씩 넣어요.', inL, inR);

  const eyeL = b.closed('eyeL', ellipse(152, 146, 9, 11));
  const eyeR = b.closed('eyeR', ellipse(248, 146, 9, 11));
  b.step('눈 두 개', '머리 가운데에 까만 눈을 두 개 그려요.', eyeL, eyeR);

  const muzzle = b.closed('muzzle', [
    [200, 160], [232, 164], [252, 180], [252, 202], [232, 220], [200, 226],
    [168, 220], [148, 202], [148, 180], [168, 164],
  ]);
  b.step('주둥이', '두 눈 사이 아래에 동글납작한 주둥이를 그려요.', muzzle);

  const nose = b.closed('nose', [[182, 174], [200, 170], [218, 174], [214, 184], [200, 192], [186, 184]], 0.8);
  b.step('코', '주둥이 위쪽에 동글납작한 코를 그려요.', nose);

  const mouth = b.closed('mouth', [[186, 200], [200, 204], [214, 200], [211, 210], [200, 215], [189, 210]], 0.8);
  b.step('웃는 입', '코 아래에 작게 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(122, 186, 12, 8));
  const cheekR = b.closed('cheekR', ellipse(278, 186, 12, 8));
  b.step('볼', '주둥이 양옆에 발그레한 볼을 하나씩 그려요.', cheekL, cheekR);

  const footL = b.closed('footL', ellipse(149, 450, 51, 40, 12));
  const footR = b.closed('footR', ellipse(251, 450, 51, 40, 12));
  b.step('두 발', '머리 아래 조금 떨어진 곳에 둥근 발을 두 개 그려요.', footL, footR);

  const bodyL = b.open('bodyL', [[140, 238], [114, 276], [98, 324], [94, 372], [104, 418]], ['head', 'footL']);
  const bodyR = b.open('bodyR', [[260, 238], [286, 276], [302, 324], [306, 372], [296, 418]], ['head', 'footR']);
  b.step('통통한 몸', '머리에서 발까지 몸 양옆을 둥글게 그어요.', bodyL, bodyR);

  const belly = b.closed('belly', ellipse(200, 370, 48, 34, 10));
  b.step('배 무늬', '두 발 위에 동그란 배 무늬를 그려요.', belly);

  const heart = b.closed('heart', [
    [200, 278], [212, 262], [230, 258], [242, 272], [236, 292], [218, 308],
    [200, 318], [182, 308], [164, 292], [158, 272], [170, 258], [188, 262],
  ]);
  b.step('하트', '배 무늬 위에 손바닥만큼 큰 하트를 그려요.', heart);

  const armL = b.open('armL', [[110, 268], [134, 270], [154, 280], [164, 296], [156, 314], [134, 320], [114, 318], [98, 316]], ['bodyL', 'bodyL']);
  const armR = b.open('armR', [[290, 268], [266, 270], [246, 280], [236, 296], [244, 314], [266, 320], [286, 318], [302, 316]], ['bodyR', 'bodyR']);
  b.step('두 팔', '몸 양옆에서 하트를 꼭 안은 팔을 그려요.', armL, armR);

  const padL = b.closed('padL', ellipse(149, 463, 19, 11, 10));
  const padR = b.closed('padR', ellipse(251, 463, 19, 11, 10));
  b.step('발바닥', '발 아래쪽에 동그란 발바닥을 하나씩 그려요.', padL, padR);

  const toes = [[125, 435], [149, 430], [173, 435], [227, 435], [251, 430], [275, 435]].map(([x, y], k) => b.closed(`toe${k}`, ellipse(x, y, 6, 5)));
  b.step('발가락', '발바닥 위에 작은 발가락을 세 개씩 그려요.', ...toes);

  return {
    id: 'bear', title: '곰', theme: 'animal', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 주먹만큼 큰 머리부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['동물', '곰', '숲'],
  };
}
