import { bench, ellipse } from './lib.mjs';

// ================================================================ 집 — 참조 없음(직접 디자인)
// 네모난 벽을 먼저 긋고 지붕·굴뚝·문·창을 차례로 얹습니다. 굴뚝과 문은 앞 획 위에 양 끝을 붙입니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];

export default function draw() {
  const b = bench();
  const wall = b.closed('wall', rect(120, 196, 380, 350), 0);
  b.step('벽', '종이 가운데 아래쪽에 옆으로 긴 네모 벽을 그려요.', wall);

  const roof = b.closed('roof', [[96, 196], [250, 80], [404, 196]], 0);
  b.step('지붕', '벽 위에 양쪽으로 조금 넓은 뾰족 지붕을 그려요.', roof);

  const chim = b.open('chim', [[300, 120], [300, 84], [330, 84], [330, 142]], ['roof', 'roof'], 0);
  b.step('굴뚝', '지붕 오른쪽에 위로 솟은 굴뚝을 그려요.', chim);

  const smoke = [[322, 64, 10], [342, 44, 13], [370, 28, 15]].map(([x, y, r], i) => b.closed(`sm${i}`, ellipse(x, y, r, r * 0.85)));
  b.step('연기', '굴뚝 위로 점점 커지는 연기를 세 개 그려요.', ...smoke);

  const door = b.open('door', [[225, 350], [225, 266], [232, 252], [250, 246], [268, 252], [275, 266], [275, 350]], ['wall', 'wall'], 0.6);
  b.step('문', '벽 가운데 아래에 위가 둥근 문을 그려요.', door);

  const knob = b.closed('knob', ellipse(264, 304, 5, 5, 6));
  b.step('손잡이', '문 오른쪽에 작고 동그란 손잡이를 그려요.', knob);

  const winL = b.closed('winL', rect(146, 222, 198, 272), 0);
  const winR = b.closed('winR', rect(302, 222, 354, 272), 0);
  b.step('창문', '문 양쪽에 네모난 창문을 하나씩 그려요.', winL, winR);

  const bars = [
    b.open('bL1', [[172, 222], [172, 272]], ['winL', 'winL']), b.open('bL2', [[146, 247], [198, 247]], ['winL', 'winL']),
    b.open('bR1', [[328, 222], [328, 272]], ['winR', 'winR']), b.open('bR2', [[302, 247], [354, 247]], ['winR', 'winR']),
  ];
  b.step('창살', '창문마다 십자 모양으로 창살을 그어요.', ...bars);

  const attic = b.closed('attic', ellipse(250, 150, 18, 18, 10));
  b.step('동그란 창', '지붕 가운데에 동그란 창을 하나 그려요.', attic);

  return {
    id: 'house', title: '우리 집', theme: 'thing', difficulty: 'normal', grades: ['middle'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데 아래쪽에 옆으로 긴 벽부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['집', '가족', '마을'],
  };
}
