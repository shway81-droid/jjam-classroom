import { bench, star } from './lib.mjs';

// ================================================================ 벙어리장갑 — 참조 없음(직접 디자인)
// 엄지가 옆으로 나온 장갑을 첫 획으로 긋고, 아래 손목 띠와 무늬를 얹습니다.
export default function draw() {
  const b = bench();
  const glove = b.closed('glove', [
    [158, 382], [150, 322], [120, 302], [94, 266], [92, 232], [112, 216], [140, 230],
    [146, 180], [170, 124], [220, 100], [268, 118], [296, 170], [300, 250], [294, 320], [288, 382], [220, 384],
  ], 0.7);
  b.step('장갑', '종이 가운데에 엄지가 옆으로 나온 장갑을 그려요.', glove);

  const cuff = b.closed('cuff', [[140, 380], [220, 378], [302, 380], [308, 420], [302, 462], [220, 464], [140, 462], [134, 420]], 0.4);
  b.step('손목 띠', '장갑 아래에 옆으로 넓은 손목 띠를 그려요.', cuff);

  const thumb = b.open('thumb', [[142, 230], [156, 266], [150, 306]], ['glove', 'glove']);
  b.step('엄지 줄', '엄지와 손바닥 사이에 짧은 줄을 그어요.', thumb);

  const ribs = [166, 194, 222, 250, 278].map((x, i) => b.open(`rib${i}`, [[x, 376], [x, 420], [x, 466]], ['cuff', 'cuff']));
  b.step('띠 줄무늬', '손목 띠에 세로줄을 다섯 개 그어요.', ...ribs);

  const st = b.closed('star', star(222, 238, 36, 15));
  b.step('별 무늬', '장갑 가운데에 반짝이는 별을 그려요.', st);

  const s2 = b.closed('s2', star(266, 168, 13, 5));
  const s3 = b.closed('s3', star(176, 318, 13, 5));
  b.step('작은 별', '큰 별 위아래에 작은 별을 하나씩 그려요.', s2, s3);

  return {
    id: 'mitten', title: '벙어리장갑', theme: 'season', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 큰 장갑부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['계절', '겨울', '옷'],
  };
}
