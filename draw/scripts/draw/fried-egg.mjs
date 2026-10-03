import { bench, ellipse } from './lib.mjs';

// ================================================================ 달걀 프라이 — 참조 없음(직접 디자인)
// 울퉁불퉁한 흰자를 먼저 크게 긋고, 노른자 위에 얼굴을 넣습니다.
export default function draw() {
  const b = bench();
  const white = b.closed('white', [[250, 70], [320, 84], [380, 80], [420, 130], [404, 190], [430, 250], [390, 310], [320, 320], [260, 340], [190, 320], [120, 330], [76, 280], [90, 220], [66, 160], [110, 100], [180, 92]], 0.9);
  b.step('흰자', '종이 가운데에 울퉁불퉁한 흰자를 크게 그려요.', white);

  const yolk = b.closed('yolk', ellipse(244, 204, 64, 60, 12));
  b.step('노른자', '흰자 가운데에 동그란 노른자를 그려요.', yolk);

  const eyeL = b.closed('eyeL', ellipse(224, 200, 7, 9));
  const eyeR = b.closed('eyeR', ellipse(264, 200, 7, 9));
  b.step('눈 두 개', '노른자 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[232, 222], [244, 228], [256, 222], [252, 233], [244, 237], [236, 233]], 0.8);
  b.step('웃는 입', '두 눈 아래에 작게 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(208, 224, 10, 6));
  const cheekR = b.closed('cheekR', ellipse(280, 224, 10, 6));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  const shine = b.closed('shine', ellipse(282, 168, 6, 11, 8, 0.7));
  b.step('반짝이', '노른자 오른쪽 위에 작은 반짝이를 그려요.', shine);

  return {
    id: 'fried-egg', title: '달걀 프라이', theme: 'food', difficulty: 'easy', grades: ['lower'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 종이를 거의 채우는 흰자부터 그릴 거예요.',
    coloringSeconds: 120, steps: b.steps, keywords: ['음식', '아침', '달걀'],
  };
}
