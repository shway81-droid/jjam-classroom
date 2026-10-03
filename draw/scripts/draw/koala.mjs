import { bench, ellipse } from './lib.mjs';

// ================================================================ 코알라 얼굴 — 참조 없음(직접 디자인)
// 넓적한 얼굴을 먼저 긋고, 크고 둥근 귀는 얼굴 위에 양 끝을 붙입니다. 코는 세로로 긴 타원 모양입니다.
export default function draw() {
  const b = bench();
  const face = b.closed('face', ellipse(250, 222, 130, 110, 14));
  b.step('얼굴', '종이 가운데에 옆으로 넓적한 얼굴을 그려요.', face);

  const earL = b.open('earL', [[152, 150], [110, 72], [52, 88], [38, 150], [70, 202], [124, 196]], ['face', 'face']);
  const earR = b.open('earR', [[348, 150], [390, 72], [448, 88], [462, 150], [430, 202], [376, 196]], ['face', 'face']);
  b.step('큰 귀', '얼굴 위쪽 양옆에 크고 둥근 귀를 그려요.', earL, earR);

  const inL = b.closed('inL', ellipse(86, 140, 24, 30, 10, -0.3));
  const inR = b.closed('inR', ellipse(414, 140, 24, 30, 10, 0.3));
  b.step('귀 안쪽', '귀 안에 조금 작은 동그라미를 그려요.', inL, inR);

  const nose = b.closed('nose', ellipse(250, 232, 30, 42, 12));
  b.step('큰 코', '얼굴 한가운데에 세로로 긴 큰 코를 그려요.', nose);

  const eyeL = b.closed('eyeL', ellipse(190, 206, 8, 10));
  const eyeR = b.closed('eyeR', ellipse(310, 206, 8, 10));
  b.step('눈 두 개', '코 양옆에 작고 동그란 눈을 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[238, 290], [250, 296], [262, 290], [258, 300], [250, 304], [242, 300]], 0.8);
  b.step('입', '코 아래에 작게 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(174, 256, 14, 9));
  const cheekR = b.closed('cheekR', ellipse(326, 256, 14, 9));
  b.step('볼 두 개', '눈 아래 양쪽에 발그레한 볼을 그려요.', cheekL, cheekR);

  const shine = b.closed('shine', ellipse(238, 212, 5, 10, 8, 0.2));
  b.step('코 반짝이', '코 왼쪽 위에 작은 반짝이를 그려요.', shine);

  const tuft = b.open('tuft', [[220, 116], [230, 96], [240, 112], [250, 92], [260, 112], [270, 96], [280, 116]], ['face', 'face'], 0.6);
  b.step('머리털', '얼굴 꼭대기에 삐죽삐죽한 머리털을 그려요.', tuft);

  return {
    id: 'koala', title: '코알라 얼굴', theme: 'animal', difficulty: 'normal', grades: ['middle'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥보다 큰 얼굴부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['동물', '코알라', '동물원'],
  };
}
