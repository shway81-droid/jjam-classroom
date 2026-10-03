import { bench, ellipse } from './lib.mjs';

// ================================================================ 선물 상자 — 참조 없음(직접 디자인)
// 상자를 먼저 긋고 뚜껑을 얹습니다. 리본 고리는 뚜껑 위에 양 끝을 붙인 한 획씩입니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];

export default function draw() {
  const b = bench();
  const box = b.closed('box', rect(100, 240, 300, 440), 0);
  b.step('상자', '종이 가운데 아래쪽에 네모난 상자를 그려요.', box);

  const lid = b.closed('lid', rect(88, 200, 312, 240), 0.1);
  b.step('뚜껑', '상자 위에 양쪽으로 조금 넓은 뚜껑을 그려요.', lid);

  const bands = [
    b.open('v1', [[188, 240], [188, 440]], ['box', 'box']), b.open('v2', [[212, 240], [212, 440]], ['box', 'box']),
    b.open('v3', [[188, 200], [188, 240]], ['lid', 'lid']), b.open('v4', [[212, 200], [212, 240]], ['lid', 'lid']),
  ];
  b.step('세로 띠', '뚜껑과 상자 가운데에 세로 띠를 그려요.', ...bands);

  const loopL = b.open('loopL', [[194, 200], [160, 160], [130, 150], [126, 176], [160, 196], [192, 201]], ['lid', 'lid']);
  const loopR = b.open('loopR', [[206, 200], [240, 160], [270, 150], [274, 176], [240, 196], [208, 201]], ['lid', 'lid']);
  b.step('리본 고리', '뚜껑 위에 양쪽으로 둥근 리본 고리를 그려요.', loopL, loopR);

  const knot = b.closed('knot', ellipse(200, 192, 13, 11));
  b.step('리본 매듭', '두 고리 사이에 동그란 매듭을 그려요.', knot);

  const dots = [[144, 290], [256, 290], [144, 390], [256, 390]].map(([x, y], i) => b.closed(`d${i}`, ellipse(x, y, 13, 13)));
  b.step('땡땡이', '상자 양쪽에 동그란 무늬를 두 개씩 그려요.', ...dots);

  return {
    id: 'gift-box', title: '선물 상자', theme: 'thing', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데 아래쪽에 손바닥만큼 큰 상자부터 그릴 거예요.',
    coloringSeconds: 120, steps: b.steps, keywords: ['사물', '생일', '선물'],
  };
}
