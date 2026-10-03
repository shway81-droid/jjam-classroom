import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 왕관 — 참조 없음(직접 디자인)
// 뾰족한 왕관을 첫 획으로(텐션을 낮춰 끝을 살립니다), 띠·구슬·보석을 얹습니다.
export default function draw() {
  const b = bench();
  const crown = b.closed('crown', [[100, 310], [90, 130], [130, 210], [170, 110], [210, 210], [250, 90], [290, 210], [330, 110], [370, 210], [410, 130], [400, 310]], 0.25);
  b.step('뾰족 왕관', '종이 가운데에 끝이 다섯 개 솟은 왕관을 그려요.', crown);

  const band = b.open('band', [[96, 262], [250, 262], [404, 262]], ['crown', 'crown']);
  b.step('띠', '왕관 아래쪽에 옆으로 긴 띠 줄을 그어요.', band);

  const balls = [[90, 116], [170, 96], [250, 76], [330, 96], [410, 116]].map(([x, y], i) => b.closed(`ball${i}`, ellipse(x, y, 12, 12)));
  b.step('끝 구슬', '뾰족한 끝마다 동그란 구슬을 하나씩 얹어 그려요.', ...balls);

  const gem = b.closed('gem', [[250, 270], [266, 286], [250, 302], [234, 286]], 0.3);
  const gemL = b.closed('gemL', ellipse(170, 286, 12, 12));
  const gemR = b.closed('gemR', ellipse(330, 286, 12, 12));
  b.step('띠 보석', '띠 가운데와 양옆에 보석을 세 개 그려요.', gem, gemL, gemR);

  const tops = [[170, 196], [250, 176], [330, 196]].map(([x, y], i) => b.closed(`top${i}`, [[x, y - 18], [x + 12, y], [x, y + 18], [x - 12, y]], 0.3));
  b.step('위 보석', '왕관 위쪽 가운데에 작은 보석을 세 개 그려요.', ...tops);

  const sp1 = b.closed('sp1', star(56, 70, 18, 7));
  const sp2 = b.closed('sp2', star(446, 60, 16, 6));
  b.step('반짝 별', '왕관 양옆 위에 반짝이는 별을 두 개 그려요.', sp1, sp2);

  return {
    id: 'crown', title: '왕관', theme: 'fantasy', difficulty: 'easy', grades: ['lower'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥만큼 큰 왕관부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['상상', '왕관', '보석'],
  };
}
