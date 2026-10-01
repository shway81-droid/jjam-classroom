import { bench, ellipse } from './lib.mjs';

// ================================================================ 토끼 — 참조: refs/rabbit.png (앉아 있는 토끼, 정면)
// 첫 획은 긴 귀까지 한 번에 두르는 머리 테두리입니다(머리만으로는 완성본 높이의 절반에 못 미칩니다).
// 수염·엉덩이 잔 줄처럼 끝이 뜨는 선은 뺐고, 다리 줄은 턱에서 앞발까지 이어지게 바꿨습니다.

// 아래로 볼록한 반 동그라미를 n 개 잇는 점들(발가락) — owl.mjs 와 같은 모양입니다.
const cups = (x0, x1, y, n, h) => {
  const pts = [];
  const w = (x1 - x0) / n;
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < 6; j++) {
      const t = (j / 6) * Math.PI;
      pts.push([x0 + w * k + (w / 2) * (1 - Math.cos(t)), y + h * Math.sin(t)]);
    }
  }
  pts.push([x1, y]);
  return pts;
};

export default function draw() {
  const b = bench();
  // 왼쪽 귀를 그리고, 오른쪽 귀는 좌우를 뒤집어 바깥으로 조금 기울입니다.
  const earLo = [[168, 172], [150, 142], [138, 108], [133, 76], [140, 54], [158, 50], [178, 70], [192, 100], [198, 128], [200, 150]];
  const earLi = [[159, 156], [152, 126], [149, 96], [153, 76], [163, 74], [176, 96], [184, 122], [189, 146]];
  const flip = (pts) => pts.map(([x, y]) => [418 - x + (170 - y) * 0.12, y]).reverse();
  const head = b.closed('head', [
    ...earLo,
    [209, 146],
    ...flip(earLo),
    // 얼굴과 볼
    [256, 196], [264, 220], [274, 240], [272, 260], [256, 274], [230, 280], [209, 281], [188, 280], [162, 274],
    [146, 260], [144, 240], [154, 220], [162, 196],
  ]);
  b.step('귀 달린 머리', '종이 위쪽에 긴 귀가 두 개 달린 머리를 그려요.', head);

  const innerL = b.open('innerL', earLi, ['head', 'head']);
  const innerR = b.open('innerR', flip(earLi), ['head', 'head']);
  b.step('귀 안쪽', '긴 귀 안에 귀 모양을 하나씩 더 그려요.', innerL, innerR);

  const eyeL = b.closed('eyeL', ellipse(176, 212, 8, 11, 8));
  const eyeR = b.closed('eyeR', ellipse(242, 212, 8, 11, 8));
  b.step('눈 두 개', '머리 가운데에 까만 눈을 두 개 그려요.', eyeL, eyeR);

  const nose = b.closed('nose', [[197, 228], [209, 226], [221, 228], [215, 235], [209, 239], [203, 235]], 0.8);
  // 입은 코 아래 작은 웃는 입(닫힌 모양)이고, 코와 입 사이 짧은 줄은 양 끝이 코와 입 위에 놓입니다.
  const mouth = b.closed('mouth', [[197, 254], [209, 256], [221, 254], [217, 262], [209, 265], [201, 262]], 0.8);
  const philtrum = b.open('philtrum', [[209, 239], [209, 248], [209, 256]], ['nose', 'mouth']);
  b.step('코와 입', '두 눈 사이 아래에 작은 코와 웃는 입을 그려요.', nose, mouth, philtrum);

  const body = b.open('body', [
    [164, 278], [148, 302], [130, 330], [114, 362], [106, 396], [110, 424], [130, 440], [170, 442],
    [230, 442], [282, 440], [300, 426], [306, 398], [298, 372], [284, 350], [276, 318], [268, 296], [254, 274],
  ], ['head', 'head']);
  b.step('몸', '머리 아래에 엉덩이가 넓은 몸을 그려요.', body);

  const tail = b.bumps('tail', 'body', [110, 370], [110, 424], 3, 13, -1);
  b.step('꼬리', '몸 옆에 털이 복슬복슬한 꼬리를 그려요.', tail);

  const legL = b.open('legL', [[146, 304], [158, 340], [162, 380], [168, 420], [174, 442]], ['body', 'body']);
  const legR = b.open('legR', [[272, 304], [260, 340], [256, 380], [250, 420], [244, 442]], ['body', 'body']);
  b.step('앞다리', '몸 양옆에서 아래로 앞다리 줄을 하나씩 그어요.', legL, legR);

  const between = b.open('between', [[204, 442], [200, 410], [198, 384], [204, 368], [214, 366], [220, 384], [218, 410], [214, 442]], ['body', 'body']);
  b.step('다리 사이', '두 앞다리 사이에 둥근 줄을 그어요.', between);

  const pawL = b.open('pawL', [[174, 440], ...cups(174, 204, 442, 3, 9).slice(1)], ['body', 'body'], 0.6);
  const pawR = b.open('pawR', [[214, 440], ...cups(214, 244, 442, 3, 9).slice(1)], ['body', 'body'], 0.6);
  b.step('앞발 두 개', '앞다리 아래에 발가락이 세 개씩인 앞발을 그려요.', pawL, pawR);

  const thighL = b.open('thighL', [[116, 358], [138, 354], [150, 372], [148, 404], [140, 428], [134, 440]], ['body', 'body']);
  const thighR = b.open('thighR', [[294, 364], [274, 358], [264, 378], [266, 404], [274, 428], [280, 441]], ['body', 'body']);
  b.step('뒷다리', '몸 양옆에 둥근 뒷다리를 하나씩 그려요.', thighL, thighR);

  return {
    id: 'rabbit', title: '토끼', theme: 'animal', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 손바닥만큼 귀 달린 머리부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['동물', '토끼', '달'],
  };
}
