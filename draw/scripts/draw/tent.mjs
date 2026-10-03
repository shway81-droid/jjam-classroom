import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 캠핑 텐트 — 참조 없음(직접 디자인), 밤
// 큰 세모 텐트를 먼저 긋고, 문과 줄은 텐트 위에 양 끝을 붙입니다. 말뚝을 먼저 박고 줄을 잇습니다.
export default function draw() {
  const b = bench();
  const tent = b.closed('tent', [[130, 330], [250, 96], [370, 330]], 0);
  b.step('텐트', '종이 가운데에 크고 뾰족한 세모 텐트를 그려요.', tent);

  const door = b.open('door', [[200, 330], [250, 200], [300, 330]], ['tent', 'tent'], 0);
  b.step('문', '텐트 아래 가운데에 뾰족한 문을 그려요.', door);

  const mid = b.open('mid', [[250, 200], [250, 330]], ['door', 'tent']);
  b.step('문 가운데 줄', '문 꼭대기에서 바닥까지 줄을 하나 그어요.', mid);

  const flag = b.closed('flag', [[248, 98], [248, 54], [280, 64], [252, 74], [252, 98]], 0.1);
  b.step('깃발', '텐트 꼭대기에 작은 깃발을 꽂아요.', flag);

  const pegL = b.closed('pegL', [[52, 346], [68, 346], [60, 330]], 0.1);
  const pegR = b.closed('pegR', [[432, 346], [448, 346], [440, 330]], 0.1);
  b.step('말뚝', '텐트 양옆 바닥에 작은 말뚝을 하나씩 박아요.', pegL, pegR);

  const ropeL = b.open('ropeL', [[176, 240], [60, 332]], ['tent', 'pegL']);
  const ropeR = b.open('ropeR', [[324, 240], [440, 332]], ['tent', 'pegR']);
  b.step('줄', '텐트 옆면에서 말뚝까지 줄을 이어요.', ropeL, ropeR);

  const moon = b.closed('moon', [[60, 50], [84, 58], [96, 78], [86, 100], [62, 108], [74, 92], [78, 78], [74, 62]], 0.8);
  b.step('달', '종이 왼쪽 위에 가느다란 달을 그려요.', moon);

  const s1 = b.closed('s1', star(400, 70, 16, 7));
  const s2 = b.closed('s2', star(446, 140, 12, 5));
  const s3 = b.closed('s3', star(150, 70, 12, 5));
  b.step('별', '밤하늘에 반짝이는 별을 세 개 그려요.', s1, s2, s3);

  const grass = (x) => [[x - 14, 346], [x - 10, 330], [x - 4, 342], [x, 326], [x + 4, 342], [x + 10, 330], [x + 14, 346]];
  const g1 = b.closed('g1', grass(110), 0);
  const g2 = b.closed('g2', grass(390), 0);
  b.step('풀', '텐트 양쪽 아래에 뾰족한 풀을 그려요.', g1, g2);

  return {
    id: 'tent', title: '캠핑 텐트', theme: 'thing', difficulty: 'normal', grades: ['middle'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 종이 반만큼 큰 텐트부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['사물', '캠핑', '여름'],
  };
}
