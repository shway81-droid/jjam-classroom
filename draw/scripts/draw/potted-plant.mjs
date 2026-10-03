import { bench, ellipse } from './lib.mjs';

// ================================================================ 화분 — 참조 없음(직접 디자인)
// 테두리가 있는 화분을 첫 획으로 긋고, 잎을 먼저 그린 다음 줄기로 화분과 잎을 잇습니다.
export default function draw() {
  const b = bench();
  const pot = b.closed('pot', [[108, 280], [200, 280], [292, 280], [292, 316], [278, 316], [258, 452], [142, 452], [122, 316], [108, 316]], 0.1);
  b.step('화분', '종이 아래쪽에 위에 테두리가 있는 화분을 그려요.', pot);

  const rim = b.open('rim', [[122, 316], [200, 316], [278, 316]], ['pot', 'pot']);
  b.step('테두리 줄', '화분 테두리 아래에 가로줄을 그어요.', rim);

  const lc = b.closed('lc', ellipse(200, 122, 30, 62, 12));
  const ll = b.closed('ll', ellipse(118, 168, 26, 54, 12, -0.7));
  const lr = b.closed('lr', ellipse(282, 168, 26, 54, 12, 0.7));
  b.step('큰 잎', '화분 위쪽에 길쭉한 큰 잎을 세 개 그려요.', lc, ll, lr);

  const sl = b.closed('sl', ellipse(146, 232, 17, 34, 10, -1.0));
  const sr = b.closed('sr', ellipse(256, 226, 17, 34, 10, 1.0));
  b.step('작은 잎', '큰 잎 아래 양쪽에 작은 잎을 하나씩 그려요.', sl, sr);

  const stems = [
    b.open('s0', [[200, 280], [200, 230], [200, 186]], ['pot', 'lc']),
    b.open('s1', [[186, 280], [160, 236], [146, 210]], ['pot', 'll']),
    b.open('s2', [[214, 280], [240, 236], [256, 210]], ['pot', 'lr']),
    b.open('s3', [[178, 280], [168, 262], [166, 250]], ['pot', 'sl']),
    b.open('s4', [[222, 280], [232, 260], [236, 246]], ['pot', 'sr']),
  ];
  b.step('줄기', '화분에서 잎마다 줄기를 하나씩 이어요.', ...stems);

  const veins = [
    b.open('v0', [[200, 64], [200, 122], [200, 180]], ['lc', 'lc']),
    b.open('v1', [[84, 128], [118, 168], [152, 208]], ['ll', 'll']),
    b.open('v2', [[316, 128], [282, 168], [248, 208]], ['lr', 'lr']),
  ];
  b.step('잎맥', '큰 잎마다 가운데에 잎맥을 그어요.', ...veins);

  const wave = b.open('wave', [[132, 410], [150, 400], [168, 412], [186, 400], [204, 412], [222, 400], [240, 412], [258, 402], [268, 410]], ['pot', 'pot'], 0.8);
  b.step('물결 무늬', '화분 아래쪽에 물결 무늬를 그어요.', wave);

  const eyeL = b.closed('eyeL', ellipse(178, 352, 7, 9));
  const eyeR = b.closed('eyeR', ellipse(222, 352, 7, 9));
  b.step('눈 두 개', '화분 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[188, 372], [200, 378], [212, 372], [208, 382], [200, 386], [192, 382]], 0.8);
  b.step('웃는 입', '두 눈 아래에 작게 웃는 입을 그려요.', mouth);

  return {
    id: 'potted-plant', title: '화분', theme: 'plant', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 아래쪽에 손바닥만큼 큰 화분부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['식물', '교실', '봄'],
  };
}
