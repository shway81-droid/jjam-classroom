import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 아기 공룡 — 참조: refs/dino.png (FLUX.1 schnell), 오른쪽을 봅니다
export default function draw() {
  const b = bench();
  const head = b.closed('head', [
    [162, 170], [170, 128], [190, 100], [220, 84], [260, 80], [300, 84],
    [335, 100], [360, 125], [370, 155], [364, 180], [345, 196], [310, 220],
    [270, 240], [235, 246], [200, 244], [176, 232], [162, 210], [158, 190],
  ]);
  b.step('큰 머리', '종이 위쪽에 옆으로 넓적한 큰 머리를 그려요.', head);

  const eye = b.closed('eye', ellipse(232, 148, 15, 19));
  const shine = b.closed('shine', ellipse(227, 141, 5, 5));
  b.step('큰 눈', '머리 가운데에 큰 눈을 그리고 안에 반짝이를 넣어요.', eye, shine);

  const nL = b.closed('nL', ellipse(318, 120, 4, 5));
  const nR = b.closed('nR', ellipse(336, 109, 4, 5));
  // 위아래 입술이 얼굴선에서 만나는 웃는 입 — 양 끝이 모두 머리 테두리 위에 놓입니다.
  const mouth = b.open('mouth', [[360, 172], [330, 180], [298, 183], [266, 178], [260, 182], [272, 194], [302, 199], [332, 192], [358, 184]], ['head', 'head']);
  b.step('콧구멍', '머리 앞쪽 끝에 작은 콧구멍을 두 개 그려요.', nL, nR);
  b.step('웃는 입', '눈 아래에서 머리 끝까지 활짝 웃는 입을 그려요.', mouth);

  const body = b.open('body', [
    [168, 236], [146, 262], [120, 290], [104, 318], [110, 360], [126, 394],
    [150, 408], [200, 412], [250, 410], [284, 398], [292, 360], [286, 320],
    [276, 282], [266, 246],
  ], ['head', 'head']);
  b.step('몸', '머리 아래에 배가 볼록한 몸을 그려요.', body);

  const tail = b.open('tail', [
    [106, 316], [80, 318], [56, 312], [38, 304], [32, 318], [42, 342],
    [70, 372], [104, 396], [140, 406],
  ], ['body', 'body']);
  b.step('꼬리', '몸 뒤로 끝이 살짝 말려 올라간 꼬리를 그려요.', tail);

  const thigh = b.open('thigh', [[134, 396], [136, 356], [160, 332], [196, 336], [214, 366], [210, 410]], ['body', 'body']);
  const footB = b.open('footB', [[152, 410], [148, 430], [162, 440], [200, 440], [214, 428], [208, 411]], ['body', 'body']);
  b.step('뒷다리', '몸 아래쪽에 동그랗고 통통한 다리를 그려요.', thigh);
  b.step('뒷발', '다리 아래에 둥근 발을 붙여 그려요.', footB);

  const footF = b.open('footF', [[258, 410], [258, 426], [276, 432], [310, 428], [326, 410], [316, 388], [290, 384]], ['body', 'body']);
  b.step('앞발', '몸 앞쪽 아래에 앞으로 내민 발을 그려요.', footF);

  const arm = b.open('arm', [[286, 286], [306, 296], [314, 316], [304, 330], [290, 326]], ['body', 'body']);
  b.step('작은 팔', '몸 앞쪽에 쏙 내민 작은 팔을 하나 그려요.', arm);

  const belly = b.open('belly', [[290, 350], [256, 362], [226, 360], [212, 352]], ['body', 'thigh']);
  b.step('배', '팔 아래에서 다리까지 배를 따라 줄을 그어요.', belly);

  const spikesH = b.bumps('spikesH', 'head', [172, 230], [250, 80], 4, 27, 1, true);
  const spikesB = b.bumps('spikesB', 'body', [158, 250], [106, 314], 2, 24, -1);
  b.step('머리 뿔', '머리 뒤를 따라 동글동글한 뿔을 네 개 그려요.', spikesH);
  b.step('등 뿔', '등을 따라 뿔을 두 개 더 이어서 그려요.', spikesB);

  const spikesT = b.bumps('spikesT', 'tail', [96, 318], [52, 310], 2, 12, -1);
  b.step('꼬리 뿔', '꼬리 위에도 작은 뿔을 두 개 그려요.', spikesT);

  return {
    id: 'dino', title: '공룡', theme: 'animal', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 크게 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['동물', '공룡', '옛날'],
  };
}
