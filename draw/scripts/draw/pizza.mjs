import { bench, ellipse } from './lib.mjs';

// ================================================================ 피자 한 조각 — 참조 없음(직접 디자인)
// 아래로 뾰족한 조각을 먼저 긋고, 빵 테두리는 조각 윗변 양 끝에 붙인 한 획입니다.
export default function draw() {
  const b = bench();
  const slice = b.closed('slice', [[86, 130], [200, 122], [314, 130], [258, 290], [200, 450], [142, 290]], 0.3);
  b.step('피자 조각', '종이 가운데에 아래로 뾰족한 피자 조각을 그려요.', slice);

  const crust = b.open('crust', [[86, 130], [80, 100], [200, 80], [320, 100], [314, 130]], ['slice', 'slice']);
  b.step('빵 테두리', '조각 위쪽에 볼록한 빵 테두리를 그려요.', crust);

  const peps = [[165, 176, 24], [240, 200, 22], [195, 284, 22]].map(([x, y, r], i) => b.closed(`p${i}`, ellipse(x, y, r, r, 10)));
  b.step('페퍼로니', '조각 위에 동그란 페퍼로니를 세 개 그려요.', ...peps);

  const leafA = b.closed('leafA', ellipse(232, 250, 14, 6, 8, -0.6));
  const leafB = b.closed('leafB', ellipse(180, 226, 13, 6, 8, 0.5));
  b.step('초록 잎', '페퍼로니 사이에 작고 길쭉한 잎을 두 개 그려요.', leafA, leafB);

  const olA = b.closed('olA', ellipse(150, 236, 12, 12));
  const olB = b.closed('olB', ellipse(276, 150, 12, 12));
  b.step('올리브', '빈자리에 작고 동그란 올리브를 두 개 그려요.', olA, olB);

  const olA2 = b.closed('olA2', ellipse(150, 236, 4, 4, 6));
  const olB2 = b.closed('olB2', ellipse(276, 150, 4, 4, 6));
  b.step('올리브 구멍', '올리브 가운데에 작은 구멍을 그려요.', olA2, olB2);

  const mush = b.closed('mush', [[186, 352], [190, 338], [200, 332], [210, 338], [214, 352], [205, 352], [205, 368], [195, 368], [195, 352]], 0.5);
  b.step('버섯', '조각 아래쪽에 작은 버섯 조각을 그려요.', mush);

  const drip = b.open('drip', [[282, 206], [298, 226], [300, 248], [288, 258], [276, 240]], ['slice', 'slice']);
  b.step('치즈 방울', '조각 오른쪽에 흘러내리는 치즈를 그려요.', drip);

  const seeds = [[140, 104], [200, 96], [260, 104]].map(([x, y], i) => b.closed(`s${i}`, ellipse(x, y, 6, 3.5, 8)));
  b.step('깨', '빵 테두리에 작은 깨를 세 개 그려요.', ...seeds);

  return {
    id: 'pizza', title: '피자 한 조각', theme: 'food', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 종이를 거의 채우는 조각부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['음식', '피자', '간식'],
  };
}
