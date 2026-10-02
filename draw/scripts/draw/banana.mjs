import { bench, ellipse } from './lib.mjs';

// ================================================================ 바나나 — 참조 없음(직접 디자인), 웃는 바나나
// 초승달처럼 굽은 몸을 첫 획으로, 꼭지·끝·줄은 몸에 붙입니다.
export default function draw() {
  const b = bench();
  const banana = b.closed('banana', [
    [60, 170], [110, 250], [190, 300], [280, 314], [370, 292], [430, 242], [452, 198],
    [434, 194], [372, 234], [290, 252], [200, 244], [128, 212], [80, 164],
  ], 0.8);
  b.step('긴 몸', '종이 가운데에 초승달처럼 굽은 긴 몸을 그려요.', banana);

  const stem = b.open('stem', [[446, 202], [456, 174], [466, 156], [478, 160], [474, 178], [438, 200]], ['banana', 'banana'], 0.7);
  b.step('꼭지', '오른쪽 끝에 위로 솟은 짧은 꼭지를 그려요.', stem);

  const tip = b.closed('tip', ellipse(68, 168, 7, 7));
  b.step('끝', '왼쪽 끝에 작고 동그란 끝을 그려요.', tip);

  const lineL = b.open('lineL', [[100, 236], [112, 224], [124, 210]], ['banana', 'banana']);
  const lineR = b.open('lineR', [[410, 264], [398, 250], [388, 238]], ['banana', 'banana']);
  b.step('끝 줄', '몸 양 끝 가까이에 짧은 줄을 하나씩 그어요.', lineL, lineR);

  const eyeL = b.closed('eyeL', ellipse(256, 280, 7, 9));
  const eyeR = b.closed('eyeR', ellipse(306, 278, 7, 9));
  b.step('눈 두 개', '몸 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[268, 296], [281, 300], [294, 296], [290, 306], [281, 309], [272, 306]], 0.8);
  b.step('웃는 입', '두 눈 사이 아래에 작게 웃는 입을 그려요.', mouth);

  return {
    id: 'banana', title: '바나나', theme: 'food', difficulty: 'easy', grades: ['lower'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥만큼 긴 몸부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['음식', '과일', '바나나'],
  };
}
