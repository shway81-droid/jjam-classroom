import { bench, ellipse } from './lib.mjs';

// ================================================================ 주먹밥 — 참조 없음(직접 디자인), 웃는 세모 주먹밥
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];

export default function draw() {
  const b = bench();
  const rice = b.closed('rice', [[200, 110], [250, 150], [310, 260], [332, 340], [302, 402], [200, 414], [98, 402], [68, 340], [90, 260], [150, 150]], 0.8);
  b.step('세모 밥', '종이 가운데에 모서리가 둥근 큰 세모를 그려요.', rice);

  const nori = b.closed('nori', rect(150, 308, 250, 420), 0.3);
  b.step('김', '밥 아래 가운데에 네모난 김을 붙여 그려요.', nori);

  const eyeL = b.closed('eyeL', ellipse(166, 240, 8, 10));
  const eyeR = b.closed('eyeR', ellipse(234, 240, 8, 10));
  b.step('눈 두 개', '밥 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[184, 266], [200, 272], [216, 266], [210, 278], [200, 282], [190, 278]], 0.8);
  b.step('웃는 입', '두 눈 사이 아래에 방긋 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(140, 264, 14, 9));
  const cheekR = b.closed('cheekR', ellipse(260, 264, 14, 9));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  const grains = [[200, 150, -0.3], [124, 300, 0.8], [276, 300, -0.8], [100, 362, 0.5], [300, 362, -0.5]].map(([x, y, r], i) => b.closed(`g${i}`, ellipse(x, y, 9, 5, 8, r)));
  b.step('밥알', '밥 여기저기에 작은 밥알을 다섯 개 그려요.', ...grains);

  return {
    id: 'rice-ball', title: '주먹밥', theme: 'food', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 큰 세모부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['음식', '소풍', '주먹밥'],
  };
}
