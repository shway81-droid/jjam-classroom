import { bench, ellipse } from './lib.mjs';

// ================================================================ 달팽이 — 참조 없음(직접 디자인), 왼쪽을 보고 기어갑니다
// 큰 동그라미 집을 첫 획으로 긋고, 몸은 집 아래에서 나와 머리를 들었다가 꼬리로 돌아 집에 붙습니다.
export default function draw() {
  const b = bench();
  const shell = b.closed('shell', ellipse(290, 190, 118, 118, 12));
  b.step('동그란 집', '종이 가운데 오른쪽에 크고 동그란 달팽이 집을 그려요.', shell);

  const body = b.open('body', [
    [182, 236], [162, 196], [150, 160], [126, 146], [102, 154], [94, 182],
    [102, 216], [114, 252], [108, 292], [146, 318], [250, 324], [360, 324],
    [420, 316], [446, 300], [396, 270],
  ], ['shell', 'shell']);
  b.step('긴 몸', '집 아래에서 고개를 든 머리와 긴 몸을 이어서 그려요.', body);

  // 나선 — 집 가운데 작은 점에서 바깥으로 돌아 나와 집 테두리에 닿습니다.
  const core = b.closed('core', ellipse(292, 190, 6, 6));
  const spiral = b.open('spiral', [
    [298, 190], [310, 180], [306, 158], [282, 150], [258, 166], [254, 196],
    [270, 224], [304, 232], [334, 214], [346, 180], [336, 140], [304, 116],
    [262, 116], [226, 140], [204, 180], [174, 196],
  ], ['core', 'shell']);
  b.step('빙글 무늬', '집 가운데 점에서 바깥으로 빙글빙글 도는 무늬를 그려요.', core, spiral);

  const tipL = b.closed('tipL', ellipse(96, 84, 10, 10));
  const tipR = b.closed('tipR', ellipse(146, 82, 10, 10));
  b.step('더듬이 끝', '머리 위쪽에 더듬이 끝 동그라미를 두 개 그려요.', tipL, tipR);

  const antL = b.open('antL', [[110, 152], [102, 120], [98, 92]], ['body', 'tipL']);
  const antR = b.open('antR', [[138, 150], [144, 118], [146, 90]], ['body', 'tipR']);
  b.step('더듬이', '머리에서 더듬이 끝까지 줄을 하나씩 이어 그어요.', antL, antR);

  const eye = b.closed('eye', ellipse(118, 190, 7, 9));
  const mouth = b.closed('mouth', [[104, 222], [116, 226], [128, 222], [124, 232], [116, 236], [108, 232]], 0.8);
  b.step('눈과 입', '머리에 동그란 눈과 방긋 웃는 입을 그려요.', eye, mouth);

  return {
    id: 'snail', title: '달팽이', theme: 'animal', difficulty: 'easy', grades: ['lower'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데 오른쪽에 손바닥만큼 큰 집부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['동물', '달팽이', '비'],
  };
}
