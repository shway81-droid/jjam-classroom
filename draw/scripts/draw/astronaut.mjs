import { bench, ellipse } from './lib.mjs';

// ================================================================ 우주인 — 참조: refs/astronaut.png (AI 생성 선화)
// 큰 헬멧 속 아이 얼굴이 먼저 보이게 하고, 옷의 잔 무늬(멜빵·주름·무릎 줄)는 뺐습니다.
const mirror = (pts) => pts.map(([x, y]) => [400 - x, y]);

export default function draw() {
  const b = bench();
  const helmet = b.closed('helmet', [
    [200, 50], [256, 64], [292, 104], [302, 150], [290, 200], [256, 236],
    [200, 250], [144, 236], [110, 200], [98, 150], [108, 104], [144, 64],
  ]);
  b.step('큰 헬멧', '종이 위쪽에 주먹만큼 큰 동그라미 헬멧을 그려요.', helmet);

  const visor = b.closed('visor', [
    [200, 92], [246, 99], [274, 124], [282, 160], [272, 196], [240, 218],
    [200, 224], [160, 218], [128, 196], [118, 160], [126, 124], [154, 99],
  ]);
  b.step('얼굴 창', '헬멧 안에 조금 작은 동그라미를 하나 더 그려요.', visor);

  const eyeL = b.closed('eyeL', ellipse(164, 177, 17, 19));
  const eyeR = b.closed('eyeR', ellipse(236, 177, 17, 19));
  b.step('눈 두 개', '얼굴 창 가운데에 큰 눈을 두 개 그려요.', eyeL, eyeR);

  // 앞머리 — 가르마에서 양쪽으로 내려오는 두 획. 양 끝이 모두 얼굴 창 위에 놓입니다.
  const bangL = b.open('bangL', [[121, 150], [156, 146], [188, 138], [214, 120], [236, 96]], ['visor', 'visor']);
  const bangR = b.open('bangR', [[236, 96], [246, 116], [262, 134], [280, 152]], ['visor', 'visor']);
  b.step('앞머리', '눈 위에 옆으로 넘긴 앞머리를 그려요.', bangL, bangR);

  const mouth = b.closed('mouth', [[188, 201], [200, 203], [212, 201], [208, 210], [200, 213], [192, 210]], 0.8);
  b.step('웃는 입', '두 눈 사이 아래에 작게 웃는 입을 그려요.', mouth);

  const earPtsL = [[104, 128], [92, 134], [88, 152], [88, 170], [94, 186], [106, 190]];
  const earL = b.open('earL', earPtsL, ['helmet', 'helmet']);
  const earR = b.open('earR', mirror(earPtsL), ['helmet', 'helmet']);
  b.step('헬멧 귀', '헬멧 양옆에 작은 귀마개를 붙여 그려요.', earL, earR);

  // 몸통과 바지 — 헬멧 아래에서 시작해 두 다리를 지나 헬멧으로 돌아옵니다.
  const body = b.open('body', [
    [146, 238], [138, 262], [140, 300], [144, 340], [144, 376], [148, 412],
    [172, 414], [194, 412], [196, 372], [200, 362], [204, 372], [206, 412],
    [228, 414], [252, 412], [256, 376], [256, 340], [260, 300], [262, 262], [254, 238],
  ], ['helmet', 'helmet']);
  b.step('몸과 다리', '헬멧 아래에 다리가 두 개인 몸을 그려요.', body);

  const armPtsL = [[141, 252], [122, 268], [110, 296], [106, 322], [124, 330], [142, 326]];
  const armL = b.open('armL', armPtsL, ['body', 'body']);
  const armR = b.open('armR', mirror(armPtsL), ['body', 'body']);
  b.step('팔 두 개', '몸 양옆에 통통한 팔을 하나씩 그려요.', armL, armR);

  const gloveL = b.open('gloveL', [[110, 326], [100, 342], [102, 360], [116, 368], [130, 360], [134, 344], [130, 330]], ['armL', 'armL']);
  const gloveR = b.open('gloveR', mirror([[110, 326], [100, 342], [102, 360], [116, 368], [130, 360], [134, 344], [130, 330]]), ['armR', 'armR']);
  b.step('장갑 두 개', '팔 끝에 둥근 장갑을 하나씩 그려요.', gloveL, gloveR);

  const bootPtsL = [[150, 412], [144, 428], [142, 444], [168, 448], [192, 446], [194, 428], [192, 412]];
  const bootL = b.open('bootL', bootPtsL, ['body', 'body']);
  const bootR = b.open('bootR', mirror(bootPtsL), ['body', 'body']);
  b.step('신발 두 개', '다리 아래에 뭉툭한 신발을 하나씩 그려요.', bootL, bootR);

  const panel = b.closed('panel', [[172, 262], [228, 262], [232, 268], [232, 292], [228, 298], [172, 298], [168, 292], [168, 268]], 0.6);
  const button = b.closed('button', ellipse(186, 280, 7, 7));
  b.step('가슴 상자', '헬멧 아래 가슴에 작은 네모와 단추를 그려요.', panel, button);

  const belt = b.open('belt', [[142, 322], [170, 326], [200, 327], [230, 326], [258, 322]], ['body', 'body']);
  b.step('허리띠', '가슴 상자 아래에 허리를 가로지르는 줄을 그어요.', belt);

  return {
    id: 'astronaut', title: '우주인', theme: 'fantasy', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 주먹만큼 큰 헬멧부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['상상', '우주인', '우주'],
  };
}
