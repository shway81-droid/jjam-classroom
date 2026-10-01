import { bench, ellipse } from './lib.mjs';

// ================================================================ 외계인 — 참조: refs/alien.png
// 큰 머리를 먼저 그리고, 더듬이는 공을 먼저 그린 뒤 머리와 공을 잇는 줄로 긋습니다(떠 있는 끝 없음).
export default function draw() {
  const b = bench();
  const head = b.closed('head', [
    [200, 112], [244, 118], [278, 140], [298, 175], [302, 212], [292, 246],
    [266, 270], [230, 281], [200, 283], [170, 281], [134, 270], [108, 246],
    [98, 212], [102, 175], [122, 140], [156, 118],
  ]);
  b.step('큰 머리', '종이 위쪽에 주먹만큼 크고 동그란 머리를 그려요.', head);

  const eyeL = b.closed('eyeL', ellipse(152, 208, 33, 26, 10, 0.2));
  const eyeR = b.closed('eyeR', ellipse(248, 208, 33, 26, 10, -0.2));
  const pupL = b.closed('pupL', ellipse(162, 214, 15, 15));
  const pupR = b.closed('pupR', ellipse(238, 214, 15, 15));
  b.step('큰 눈 두 개', '머리 가운데에 옆으로 길쭉한 큰 눈을 두 개 그려요.', eyeL, eyeR);
  b.step('눈동자', '눈 안에 동그란 눈동자를 하나씩 넣어요.', pupL, pupR);

  const mouth = b.closed('mouth', [[188, 250], [200, 253], [212, 250], [207, 258], [200, 260], [193, 258]], 0.8);
  b.step('웃는 입', '두 눈 사이 아래에 작게 웃는 입을 그려요.', mouth);

  const ballL = b.closed('ballL', ellipse(106, 66, 15, 15));
  const ballR = b.closed('ballR', ellipse(294, 66, 15, 15));
  const antL = b.open('antL', [[150, 124], [136, 106], [124, 90], [116, 78]], ['head', 'ballL']);
  const antR = b.open('antR', [[250, 124], [264, 106], [276, 90], [284, 78]], ['head', 'ballR']);
  b.step('더듬이 두 개', '머리 위 양쪽에 동그란 공이 달린 더듬이를 그려요.', ballL, antL, ballR, antR);

  const body = b.open('body', [
    [180, 281], [176, 296], [162, 314], [152, 345], [150, 380], [154, 408],
    [172, 420], [200, 423], [228, 420], [246, 408], [250, 380], [248, 345],
    [238, 314], [224, 296], [220, 281],
  ], ['head', 'head']);
  b.step('작은 몸', '머리 아래에 작고 통통한 몸을 그려요.', body);

  const armL = b.open('armL', [[160, 318], [136, 334], [116, 344], [110, 354], [120, 360], [140, 352], [153, 344]], ['body', 'body']);
  const armR = b.open('armR', [[240, 318], [264, 334], [284, 344], [290, 354], [280, 360], [260, 352], [247, 344]], ['body', 'body']);
  b.step('팔 두 개', '몸 양옆에 짧고 동그란 팔을 하나씩 그려요.', armL, armR);

  const legL = b.open('legL', [[166, 418], [164, 434], [146, 442], [146, 452], [176, 454], [190, 446], [190, 421]], ['body', 'body']);
  const legR = b.open('legR', [[234, 418], [236, 434], [254, 442], [254, 452], [224, 454], [210, 446], [210, 421]], ['body', 'body']);
  b.step('다리 두 개', '몸 아래에 발이 동그란 짧은 다리를 두 개 그려요.', legL, legR);

  return {
    id: 'alien', title: '외계인', theme: 'fantasy', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 주먹만큼 큰 머리부터 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['상상', '외계인', '우주'],
  };
}
