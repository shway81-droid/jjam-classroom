import { bench, ellipse } from './lib.mjs';

// ================================================================ 임금님 — 참조 없음(직접 디자인)
// 동그란 얼굴을 먼저 긋고, 왕관은 얼굴 위쪽 양옆에 끝을 붙인 들쭉날쭉한 한 획입니다.
export default function draw() {
  const b = bench();
  const face = b.closed('face', ellipse(200, 260, 90, 90, 14));
  b.step('얼굴', '종이 가운데에 크고 동그란 얼굴을 그려요.', face);

  const crown = b.open('crown', [[126, 208], [118, 120], [156, 150], [178, 92], [200, 140], [222, 92], [244, 150], [282, 120], [274, 208]], ['face', 'face'], 0.1);
  b.step('왕관', '얼굴 위에 끝이 뾰족뾰족한 왕관을 씌워요.', crown);

  const gems = [[160, 168], [200, 152], [240, 168]].map(([x, y], i) => b.closed(`g${i}`, ellipse(x, y, 8, 8)));
  b.step('보석', '왕관 가운데에 동그란 보석을 세 개 그려요.', ...gems);

  const earL = b.open('earL', [[112, 246], [96, 254], [96, 284], [114, 292]], ['face', 'face']);
  const earR = b.open('earR', [[288, 246], [304, 254], [304, 284], [286, 292]], ['face', 'face']);
  b.step('귀 두 개', '얼굴 양옆에 둥근 귀를 붙여 그려요.', earL, earR);

  const eyeL = b.closed('eyeL', ellipse(170, 248, 8, 10));
  const eyeR = b.closed('eyeR', ellipse(230, 248, 8, 10));
  b.step('눈 두 개', '얼굴 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const nose = b.closed('nose', ellipse(200, 274, 11, 10));
  b.step('코', '두 눈 사이 아래에 둥근 코를 그려요.', nose);

  const mus = b.closed('mus', [[200, 288], [184, 284], [166, 290], [156, 302], [174, 302], [188, 306], [200, 298], [212, 306], [226, 302], [244, 302], [234, 290], [216, 284]], 0.7);
  b.step('콧수염', '코 아래 양쪽으로 둥근 콧수염을 그려요.', mus);

  const beard = b.open('beard', [[132, 318], [154, 362], [200, 402], [246, 362], [268, 318]], ['face', 'face']);
  b.step('턱수염', '턱 아래로 뾰족하게 내려오는 수염을 그려요.', beard);

  const cheekL = b.closed('cheekL', ellipse(146, 282, 12, 8));
  const cheekR = b.closed('cheekR', ellipse(254, 282, 12, 8));
  b.step('볼 두 개', '콧수염 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  return {
    id: 'king', title: '임금님', theme: 'person', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥보다 큰 얼굴부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['사람', '동화', '왕관'],
  };
}
