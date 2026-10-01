import { bench, ellipse } from './lib.mjs';

// ================================================================ 놀란 얼굴 — 참조 없음(직접 디자인), 앞을 보는 아이
// 첫 획은 머리카락까지 덮인 얼굴 전체(smile-face 와 같은 짜임), 앞머리는 양 끝이 머리 옆에 붙습니다.
// 눈썹은 끝이 뜨지 않게 얇은 닫힌 아치로 그렸습니다.
export default function draw() {
  const b = bench();
  // 머리카락까지 한 획 — 정수리에 삐친 머리 한 가닥이 있고, 귀 높이에서 얼굴선으로 이어집니다.
  const head = b.closed('head', [
    [70, 244], [64, 196], [74, 148], [104, 112], [148, 90], [186, 82],
    [196, 62], [214, 54], [212, 78], [252, 86], [298, 108], [328, 148],
    [336, 196], [330, 244], [326, 300], [306, 356], [266, 398], [200, 416],
    [134, 398], [94, 356], [74, 300],
  ]);
  b.step('머리와 얼굴', '종이 가운데에 머리카락까지 덮인 큰 얼굴을 그려요.', head);

  // 앞머리 — 양 끝이 머리 옆에 붙고, 이마를 따라 물결칩니다.
  const bangs = b.open('bangs', [
    [72, 256], [80, 210], [102, 178], [132, 162], [150, 186], [172, 166],
    [200, 160], [220, 182], [240, 162], [270, 164], [298, 180], [320, 210], [328, 256],
  ], ['head', 'head']);
  b.step('앞머리', '이마를 따라 물결치는 앞머리를 그려요.', bangs);

  // 놀라서 동그래진 눈 — 큰 동그라미 안에 작은 눈동자
  const eyeL = b.closed('eyeL', ellipse(150, 268, 22, 25));
  const eyeR = b.closed('eyeR', ellipse(250, 268, 22, 25));
  const pupilL = b.closed('pupilL', ellipse(150, 272, 7, 8));
  const pupilR = b.closed('pupilR', ellipse(250, 272, 7, 8));
  b.step('동그란 눈', '얼굴 가운데에 크고 동그란 눈을 두 개 그려요.', eyeL, eyeR, pupilL, pupilR);

  // 높이 올라간 눈썹 — 얇은 아치 모양의 닫힌 획
  const brow = (cx) => [
    [cx - 24, 226], [cx - 14, 210], [cx, 205], [cx + 14, 210], [cx + 24, 226],
    [cx + 12, 218], [cx, 215], [cx - 12, 218],
  ];
  const browL = b.closed('browL', brow(150), 0.8);
  const browR = b.closed('browR', brow(250), 0.8);
  b.step('올라간 눈썹', '눈 위에 높이 올라간 눈썹을 하나씩 그려요.', browL, browR);

  // 동그랗게 벌린 입 — 세로로 조금 긴 동그라미
  const mouth = b.closed('mouth', ellipse(200, 352, 17, 22));
  b.step('동그란 입', '두 눈 사이 아래에 동그랗게 벌린 입을 그려요.', mouth);

  const earL = b.open('earL', [[76, 270], [56, 266], [44, 282], [44, 306], [56, 322], [80, 322]], ['head', 'head']);
  const earR = b.open('earR', [[324, 270], [344, 266], [356, 282], [356, 306], [344, 322], [320, 322]], ['head', 'head']);
  b.step('귀 두 개', '얼굴 양옆에 동그란 귀를 하나씩 붙여 그려요.', earL, earR);

  const cheekL = b.closed('cheekL', ellipse(112, 330, 17, 10));
  const cheekR = b.closed('cheekR', ellipse(288, 330, 17, 10));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 동그랗게 그려요.', cheekL, cheekR);

  return {
    id: 'surprised-face', title: '놀란 얼굴', theme: 'person', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 크게 얼굴을 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['표정', '얼굴', '놀람'],
  };
}
