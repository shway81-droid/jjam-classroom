import { bench, ellipse } from './lib.mjs';

// ================================================================ 기린 — 참조 없음(직접 디자인), 앞을 보고 서 있습니다
// 긴 목과 몸통을 한 획으로 먼저 그어 크기를 정하고(첫 획 40% 규칙), 머리·다리는 거기에 붙입니다.
export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    [170, 140], [168, 200], [162, 258], [130, 280], [100, 300], [92, 338],
    [110, 370], [170, 380], [260, 380], [310, 368], [326, 336], [312, 300],
    [272, 284], [234, 268], [226, 208], [222, 140],
  ]);
  b.step('긴 목과 몸', '종이 가운데에 길쭉한 목과 통통한 몸을 이어 그려요.', body);

  const head = b.open('head', [[172, 146], [148, 132], [136, 106], [142, 80], [166, 64], [200, 60], [228, 70], [242, 94], [238, 122], [220, 146]], ['body', 'body']);
  b.step('머리', '목 위에 동그스름한 머리를 붙여 그려요.', head);

  const knobL = b.closed('knobL', ellipse(174, 30, 9, 9));
  const knobR = b.closed('knobR', ellipse(214, 28, 9, 9));
  const hornL = b.open('hornL', [[178, 62], [176, 48], [174, 38]], ['head', 'knobL']);
  const hornR = b.open('hornR', [[208, 60], [212, 46], [214, 36]], ['head', 'knobR']);
  b.step('뿔 두 개', '머리 위에 끝이 동그란 작은 뿔을 두 개 그려요.', knobL, knobR, hornL, hornR);

  const earL = b.open('earL', [[142, 90], [118, 82], [108, 96], [138, 108]], ['head', 'head'], 0.8);
  const earR = b.open('earR', [[240, 88], [264, 78], [274, 92], [242, 106]], ['head', 'head'], 0.8);
  b.step('귀 두 개', '머리 양옆에 나뭇잎처럼 생긴 귀를 그려요.', earL, earR);

  const eyeL = b.closed('eyeL', ellipse(172, 98, 7, 9));
  const eyeR = b.closed('eyeR', ellipse(210, 98, 7, 9));
  b.step('눈 두 개', '머리 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const noseL = b.closed('noseL', ellipse(182, 128, 5, 4));
  const noseR = b.closed('noseR', ellipse(202, 128, 5, 4));
  b.step('콧구멍', '눈 아래 머리 끝에 작은 콧구멍을 두 개 그려요.', noseL, noseR);

  const leg = (name, x) => b.open(name, [[x - 14, 376], [x - 15, 420], [x - 16, 462], [x, 468], [x + 14, 462], [x + 13, 420], [x + 12, 376]], ['body', 'body'], 0.8);
  const fl1 = leg('fl1', 132); const fl2 = leg('fl2', 180);
  b.step('앞다리', '몸 아래 앞쪽에 길쭉한 다리를 두 개 그려요.', fl1, fl2);

  const bl1 = leg('bl1', 248); const bl2 = leg('bl2', 294);
  b.step('뒷다리', '몸 아래 뒤쪽에도 길쭉한 다리를 두 개 그려요.', bl1, bl2);

  const blob = (cx, cy, s) => [[cx - 14 * s, cy - 8 * s], [cx + 2 * s, cy - 14 * s], [cx + 16 * s, cy - 6 * s], [cx + 12 * s, cy + 10 * s], [cx - 4 * s, cy + 14 * s], [cx - 16 * s, cy + 6 * s]];
  const spots = [[196, 190, 1], [194, 240, 1], [160, 320, 1.3], [220, 336, 1.2], [276, 320, 1.1]].map(([x, y, s], i) => b.closed(`p${i}`, blob(x, y, s), 0.8));
  b.step('무늬', '목과 몸에 울퉁불퉁한 무늬를 다섯 개 그려요.', ...spots);

  const tuft = b.closed('tuft', ellipse(354, 394, 8, 13));
  const tail = b.open('tail', [[322, 324], [342, 350], [352, 380]], ['body', 'tuft']);
  b.step('꼬리', '몸 뒤에 끝에 털이 달린 꼬리를 그려요.', tuft, tail);

  return {
    id: 'giraffe', title: '기린', theme: 'animal', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 긴 목과 몸부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['동물', '기린', '동물원'],
  };
}
