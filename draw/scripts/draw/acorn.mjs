import { bench, ellipse } from './lib.mjs';

// ================================================================ 도토리 — 참조 없음(직접 디자인), 웃는 도토리
// 아래가 뾰족한 열매를 첫 획으로, 모자는 양 끝이 열매에 붙고 꼭지는 모자 위에 얹습니다.
export default function draw() {
  const b = bench();
  const nut = b.closed('nut', [[120, 220], [200, 214], [280, 220], [302, 280], [292, 350], [252, 410], [200, 446], [148, 410], [108, 350], [98, 280]]);
  b.step('동그란 열매', '종이 가운데 아래쪽에 끝이 뾰족한 열매를 그려요.', nut);

  const cap = b.open('cap', [[104, 252], [96, 204], [128, 156], [200, 138], [272, 156], [304, 204], [296, 252]], ['nut', 'nut']);
  b.step('모자', '열매 위에 둥글고 넓적한 모자를 씌워 그려요.', cap);

  const stem = b.closed('stem', [[194, 140], [192, 106], [202, 98], [210, 104], [206, 140]], 0.6);
  b.step('꼭지', '모자 꼭대기에 짧은 꼭지를 하나 그려요.', stem);

  const lines = [[148, 152, 156, 216], [184, 141, 188, 214], [216, 141, 212, 214], [252, 152, 244, 216]]
    .map(([x0, y0, x1, y1], i) => b.open(`ln${i}`, [[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2], [x1, y1]], ['cap', 'nut']));
  b.step('모자 무늬', '모자에 위에서 아래로 짧은 줄을 네 개 그어요.', ...lines);

  const eyeL = b.closed('eyeL', ellipse(170, 296, 8, 10));
  const eyeR = b.closed('eyeR', ellipse(230, 296, 8, 10));
  b.step('눈 두 개', '열매 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[184, 326], [200, 332], [216, 326], [210, 338], [200, 342], [190, 338]], 0.8);
  b.step('웃는 입', '두 눈 사이 아래에 방긋 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(146, 324, 14, 9));
  const cheekR = b.closed('cheekR', ellipse(254, 324, 14, 9));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  return {
    id: 'acorn', title: '도토리', theme: 'plant', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 큰 열매부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['식물', '가을', '도토리'],
  };
}
