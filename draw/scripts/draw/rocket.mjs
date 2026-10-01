import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 로켓 — 참조: refs/rocket.png (FLUX.1 schnell)
export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    [200, 46], [226, 66], [246, 100], [262, 150], [274, 210], [276, 260],
    [270, 304], [258, 330], [240, 342], [200, 345], [160, 342], [142, 330],
    [130, 304], [124, 260], [126, 210], [138, 150], [154, 100], [174, 66],
  ]);
  b.step('통통한 몸통', '종이 가운데에 위가 뾰족한 통통한 몸통을 그려요.', body);

  const band1 = b.open('band1', [[167, 86], [184, 92], [200, 94], [216, 92], [234, 86]], ['body', 'body']);
  const band2 = b.open('band2', [[156, 104], [178, 111], [200, 113], [222, 111], [244, 104]], ['body', 'body']);
  b.step('머리 줄 두 개', '몸통 위쪽에 아래로 볼록한 줄을 두 개 그어요.', band1, band2);

  const win = b.closed('win', ellipse(201, 186, 31, 31));
  const winIn = b.closed('winIn', ellipse(201, 186, 17, 17));
  b.step('큰 창', '줄 아래 가운데에 동그라미를 두 겹으로 그려요.', win, winIn);

  const w2 = b.closed('w2', ellipse(201, 246, 15, 15));
  const w3 = b.closed('w3', ellipse(201, 300, 15, 15));
  b.step('작은 창 두 개', '큰 창 아래에 작은 동그라미를 두 개 그려요.', w2, w3);

  const finL = b.open('finL', [[125, 245], [96, 262], [78, 292], [75, 332], [82, 367], [102, 344], [124, 328], [141, 322]], ['body', 'body']);
  const finR = b.open('finR', [[275, 245], [304, 262], [322, 292], [325, 332], [318, 367], [298, 344], [276, 328], [259, 322]], ['body', 'body']);
  b.step('날개 두 개', '몸통 양옆 아래에 끝이 뾰족한 날개를 그려요.', finL, finR);

  const finLi = b.open('finLi', [[131, 290], [106, 304], [92, 330], [86, 358]], ['body', 'finL']);
  const finRi = b.open('finRi', [[269, 290], [294, 304], [308, 330], [314, 358]], ['body', 'finR']);
  b.step('날개 안쪽 줄', '날개 안에 몸통에서 끝까지 줄을 하나씩 그어요.', finLi, finRi);

  const nozzle = b.open('nozzle', [[160, 343], [164, 360], [178, 368], [200, 371], [222, 368], [236, 360], [240, 343]], ['body', 'body']);
  b.step('불 나오는 곳', '몸통 바닥에 납작하고 둥근 통을 붙여요.', nozzle);

  const flame = b.open('flame', [[180, 369], [172, 398], [166, 410], [182, 413], [200, 452], [216, 418], [232, 398], [222, 369]], ['nozzle', 'nozzle']);
  const flameIn = b.open('flameIn', [[191, 370], [194, 394], [200, 410], [206, 394], [209, 370]], ['nozzle', 'nozzle']);
  b.step('불꽃', '통 아래로 출렁이는 불꽃을 두 겹으로 그려요.', flame, flameIn);

  const st1 = b.closed('st1', star(70, 130, 22, 10));
  const st2 = b.closed('st2', star(336, 176, 17, 8));
  b.step('별 두 개', '로켓 양옆 빈 곳에 반짝이는 별을 두 개 그려요.', st1, st2);

  return {
    id: 'rocket', title: '로켓', theme: 'thing', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 길게 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['탈것', '로켓', '우주'],
  };
}
