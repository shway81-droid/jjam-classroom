import { bench, ellipse } from './lib.mjs';

// ================================================================ 양갈래 머리 아이 — 참조 없음(직접 디자인)
// 동그란 얼굴을 먼저 긋고, 머리카락·앞머리는 얼굴 위에 양 끝을 붙입니다. 양갈래는 닫힌 묶음입니다.
export default function draw() {
  const b = bench();
  const face = b.closed('face', ellipse(200, 252, 100, 100, 14));
  b.step('얼굴', '종이 가운데에 크고 동그란 얼굴을 그려요.', face);

  const hair = b.open('hair', [[104, 272], [96, 200], [130, 140], [200, 124], [270, 140], [304, 200], [296, 272]], ['face', 'face']);
  b.step('머리카락', '얼굴 위를 감싸는 둥근 머리카락을 그려요.', hair);

  const bangs = b.open('bangs', [[110, 206], [140, 194], [160, 214], [180, 190], [200, 210], [220, 190], [240, 214], [260, 194], [290, 206]], ['hair', 'hair'], 0.7);
  b.step('앞머리', '이마에 물결치는 앞머리를 그려요.', bangs);

  const tL = b.closed('tL', [[94, 226], [60, 244], [40, 300], [56, 360], [86, 332], [98, 284]], 0.8);
  const tR = b.closed('tR', [[306, 226], [340, 244], [360, 300], [344, 360], [314, 332], [302, 284]], 0.8);
  b.step('양갈래', '머리 양옆에 길게 묶은 머리를 그려요.', tL, tR);

  const bL = b.closed('bL', ellipse(96, 232, 11, 11));
  const bR = b.closed('bR', ellipse(304, 232, 11, 11));
  b.step('머리끈', '묶은 자리에 동그란 머리끈을 그려요.', bL, bR);

  const eyeL = b.closed('eyeL', ellipse(166, 266, 9, 12));
  const eyeR = b.closed('eyeR', ellipse(234, 266, 9, 12));
  b.step('눈 두 개', '앞머리 아래에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[182, 304], [200, 311], [218, 304], [212, 318], [200, 324], [188, 318]], 0.8);
  b.step('웃는 입', '두 눈 사이 아래에 방긋 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(142, 300, 14, 9));
  const cheekR = b.closed('cheekR', ellipse(258, 300, 14, 9));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  const k = b.closed('k', ellipse(262, 150, 8, 8));
  const pL = b.closed('pL', [[254, 148], [234, 132], [226, 146], [232, 162], [254, 154]], 0.8);
  const pR = b.closed('pR', [[270, 148], [290, 132], [298, 146], [292, 162], [270, 154]], 0.8);
  b.step('리본 핀', '머리카락 오른쪽 위에 리본 핀을 그려요.', k, pL, pR);

  return {
    id: 'girl-face', title: '양갈래 머리 아이', theme: 'person', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥보다 큰 얼굴부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['사람', '친구', '얼굴'],
  };
}
