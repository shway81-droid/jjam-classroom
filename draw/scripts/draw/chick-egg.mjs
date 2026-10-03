import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 알에서 나온 병아리 — 참조 없음(직접 디자인)
// 들쭉날쭉한 아래 껍질을 먼저 긋고, 병아리 몸은 껍질 위에 양 끝을 붙인 한 획입니다.
export default function draw() {
  const b = bench();
  const shell = b.closed('shell', [
    [100, 300], [125, 276], [150, 300], [175, 276], [200, 300], [225, 276], [250, 300], [275, 276], [300, 300],
    [306, 360], [280, 420], [200, 452], [120, 420], [94, 360],
  ], 0.35);
  b.step('아래 껍질', '종이 아래쪽에 위가 들쭉날쭉한 달걀 껍질을 그려요.', shell);

  const chick = b.open('chick', [[124, 290], [118, 230], [140, 170], [200, 146], [260, 170], [282, 230], [276, 290]], ['shell', 'shell']);
  b.step('병아리 몸', '껍질 위로 둥글게 솟은 병아리 몸을 그려요.', chick);

  const cap = b.closed('cap', [[150, 150], [156, 112], [200, 90], [244, 112], [250, 150], [237, 138], [225, 148], [212, 136], [200, 144], [188, 136], [175, 148], [163, 138]], 0.3);
  b.step('위 껍질', '병아리 머리 위에 껍질 모자를 씌워요.', cap);

  const eyeL = b.closed('eyeL', ellipse(176, 210, 8, 10));
  const eyeR = b.closed('eyeR', ellipse(224, 210, 8, 10));
  b.step('눈 두 개', '병아리 얼굴에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const beak = b.closed('beak', [[184, 234], [200, 226], [216, 234], [200, 250]], 0.3);
  b.step('부리', '두 눈 사이 아래에 작은 부리를 그려요.', beak);

  const cheekL = b.closed('cheekL', ellipse(154, 240, 11, 7));
  const cheekR = b.closed('cheekR', ellipse(246, 240, 11, 7));
  b.step('볼 두 개', '부리 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  const wingL = b.open('wingL', [[121, 252], [98, 262], [104, 282], [124, 282]], ['chick', 'chick']);
  const wingR = b.open('wingR', [[279, 252], [302, 262], [296, 282], [276, 282]], ['chick', 'chick']);
  b.step('날개', '몸 양옆에 작은 날개를 그려요.', wingL, wingR);

  const dots = [[140, 360], [262, 384], [176, 420]].map(([x, y], i) => b.closed(`d${i}`, ellipse(x, y, 9, 9)));
  b.step('껍질 무늬', '아래 껍질에 동그란 무늬를 세 개 그려요.', ...dots);

  const s1 = b.closed('s1', star(70, 190, 16, 7));
  const s2 = b.closed('s2', star(334, 214, 14, 6));
  b.step('반짝 별', '병아리 양옆에 반짝이는 별을 그려요.', s1, s2);

  return {
    id: 'chick-egg', title: '알에서 나온 병아리', theme: 'animal', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 아래쪽에 손바닥만큼 큰 달걀 껍질부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['동물', '봄', '병아리'],
  };
}
