import { bench, ellipse } from './lib.mjs';

// ================================================================ 돼지 얼굴 — 참조 없음(직접 디자인)
// 넓적한 얼굴을 먼저 긋고, 귀는 얼굴 위에 양 끝을 붙인 한 획으로 그립니다.
export default function draw() {
  const b = bench();
  const face = b.closed('face', ellipse(200, 262, 150, 128, 14));
  b.step('얼굴', '종이 가운데에 옆으로 조금 넓은 둥근 얼굴을 그려요.', face);

  const earL = b.open('earL', [[96, 178], [72, 146], [70, 108], [92, 96], [128, 112], [158, 140]], ['face', 'face']);
  const earR = b.open('earR', [[304, 178], [328, 146], [330, 108], [308, 96], [272, 112], [242, 140]], ['face', 'face']);
  b.step('둥근 귀', '얼굴 위쪽 양옆에 끝이 둥근 귀를 그려요.', earL, earR);

  const nose = b.closed('nose', ellipse(200, 292, 62, 42, 12));
  b.step('큰 코', '얼굴 가운데 아래에 넓적한 코를 그려요.', nose);

  const holeL = b.closed('holeL', ellipse(180, 292, 9, 15));
  const holeR = b.closed('holeR', ellipse(220, 292, 9, 15));
  b.step('콧구멍', '코 안에 길쭉한 콧구멍을 두 개 그려요.', holeL, holeR);

  const eyeL = b.closed('eyeL', ellipse(146, 218, 10, 13));
  const eyeR = b.closed('eyeR', ellipse(254, 218, 10, 13));
  b.step('눈 두 개', '코 위 양쪽에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const cheekL = b.closed('cheekL', ellipse(112, 300, 18, 11));
  const cheekR = b.closed('cheekR', ellipse(288, 300, 18, 11));
  b.step('볼 두 개', '코 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  const mouth = b.closed('mouth', [[178, 348], [200, 355], [222, 348], [216, 361], [200, 368], [184, 361]], 0.8);
  b.step('웃는 입', '코 아래에 방긋 웃는 입을 그려요.', mouth);

  return {
    id: 'pig-face', title: '돼지 얼굴', theme: 'animal', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 큰 얼굴부터 그릴 거예요.',
    coloringSeconds: 120, steps: b.steps, keywords: ['동물', '돼지', '얼굴'],
  };
}
