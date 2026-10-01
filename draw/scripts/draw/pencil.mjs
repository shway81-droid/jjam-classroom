import { bench, ellipse } from './lib.mjs';

// ================================================================ 연필 — 참조: refs/pencil.png
// 참조보다 조금 통통하게 그려 몸통에 작은 얼굴을 넣었습니다. 세로 줄무늬는 얼굴과 겹쳐 뺐습니다.
export default function draw() {
  const b = bench();
  const L = 152; const R = 248; const T = 100; const B = 392;
  const body = b.closed('body', [
    [200, T], [R - 6, T], [R, T + 6], [R, 180], [R, 260], [R, 340], [R, B - 6], [R - 6, B],
    [200, B], [L + 6, B], [L, B - 6], [L, 340], [L, 260], [L, 180], [L, T + 6], [L + 6, T],
  ], 0.5);
  b.step('긴 몸통', '종이 가운데에 손바닥만큼 길쭉한 네모를 그려요.', body);

  const eyeL = b.closed('eyeL', ellipse(180, 236, 8, 9));
  const eyeR = b.closed('eyeR', ellipse(220, 236, 8, 9));
  b.step('눈 두 개', '몸통 가운데에 작고 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[187, 258], [200, 262], [213, 258], [208, 270], [200, 273], [192, 270]], 0.8);
  b.step('웃는 입', '두 눈 사이 아래에 작게 웃는 입을 그려요.', mouth);

  const eraser = b.open('eraser', [[L + 2, T], [L, 72], [160, 54], [200, 48], [240, 54], [R, 72], [R - 2, T]], ['body', 'body']);
  b.step('지우개', '몸통 위에 둥그스름한 지우개를 얹어요.', eraser);

  const band1 = b.open('band1', [[L, 124], [200, 124], [R, 124]], ['body', 'body']);
  const band2 = b.open('band2', [[L, 148], [200, 148], [R, 148]], ['body', 'body']);
  b.step('쇠 띠', '지우개 아래 몸통에 가로줄을 두 개 그어요.', band1, band2);

  const tip = b.open('tip', [[L + 4, B], [170, 420], [188, 448], [200, 462], [212, 448], [230, 420], [R - 4, B]], ['body', 'body'], 0.8);
  b.step('뾰족한 끝', '몸통 아래에 뾰족하게 깎은 끝을 그려요.', tip);

  const wood = b.bumps('wood', 'body', [R - 6, B], [L + 6, B], 3, 12, 1);
  b.step('깎은 무늬', '몸통 아래 끝에 물결 무늬를 그어요.', wood);

  const lead = b.open('lead', [[182, 434], [192, 440], [200, 441], [208, 440], [218, 434]], ['tip', 'tip']);
  b.step('연필심', '뾰족한 끝 가까이에 줄을 그어 연필심을 만들어요.', lead);

  return {
    id: 'pencil', title: '연필', theme: 'thing', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 길게 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['사물', '연필', '학교'],
  };
}
