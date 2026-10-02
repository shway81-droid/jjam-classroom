import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 호박 등불 — 참조 없음(직접 디자인), 가을 수확
// 넓적한 호박을 먼저 긋고, 세로 골은 호박 테두리 위에 양 끝을 붙입니다. 눈·코·입은 세모 조각입니다.
export default function draw() {
  const b = bench();
  const body = b.closed('body', ellipse(250, 235, 170, 130, 16));
  b.step('호박', '종이 가운데에 옆으로 넓적한 호박을 그려요.', body);

  const in1 = b.open('in1', [[178, 118], [134, 235], [182, 352]], ['body', 'body']);
  const in2 = b.open('in2', [[322, 118], [366, 235], [318, 352]], ['body', 'body']);
  b.step('안쪽 골', '호박 양쪽에 위아래로 둥근 골을 하나씩 그어요.', in1, in2);

  const out1 = b.open('out1', [[124, 146], [96, 235], [124, 324]], ['body', 'body']);
  const out2 = b.open('out2', [[376, 146], [404, 235], [376, 324]], ['body', 'body']);
  b.step('바깥 골', '바깥쪽에도 골을 하나씩 더 그어요.', out1, out2);

  const stem = b.closed('stem', [[236, 110], [234, 80], [244, 56], [262, 52], [266, 66], [256, 84], [262, 110]], 0.6);
  b.step('꼭지', '호박 꼭대기에 짧고 굵은 꼭지를 그려요.', stem);

  const leaf = b.closed('leaf', [[262, 92], [290, 66], [332, 62], [318, 90], [284, 104]], 0.9);
  b.step('잎', '꼭지 오른쪽에 넓적한 잎을 그려요.', leaf);

  const eyeL = b.closed('eyeL', [[178, 200], [222, 200], [200, 162]], 0.1);
  const eyeR = b.closed('eyeR', [[278, 200], [322, 200], [300, 162]], 0.1);
  b.step('세모 눈', '호박 가운데 위쪽에 세모 눈을 두 개 그려요.', eyeL, eyeR);

  const nose = b.closed('nose', [[238, 242], [262, 242], [250, 220]], 0.1);
  b.step('세모 코', '두 눈 사이 아래에 작은 세모 코를 그려요.', nose);

  const mouth = b.closed('mouth', [
    [170, 268], [196, 280], [212, 268], [230, 284], [250, 270], [270, 284], [288, 268], [304, 280], [330, 268],
    [314, 304], [250, 322], [186, 304],
  ], 0.15);
  b.step('웃는 입', '코 아래에 이가 들쑥날쑥한 큰 입을 그려요.', mouth);

  const s1 = b.closed('s1', star(60, 70, 22, 9));
  const s2 = b.closed('s2', star(444, 76, 18, 7));
  b.step('별', '종이 위쪽 양 끝에 작은 별을 하나씩 그려요.', s1, s2);

  return {
    id: 'pumpkin', title: '호박 등불', theme: 'season', difficulty: 'normal', grades: ['middle'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 종이를 거의 채우는 호박부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['계절', '가을', '수확'],
  };
}
