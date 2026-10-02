import { bench, ellipse } from './lib.mjs';

// ================================================================ 산타 할아버지 — 참조 없음(직접 디자인)
// 모자 털 띠·얼굴·수염을 한 바퀴에 긋고(첫 획 40% 규칙), 모자·몸·팔·장화를 그 위에 붙입니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];

export default function draw() {
  const b = bench();
  const head = b.closed('head', [
    [200, 106], [290, 110], [298, 128], [292, 150], [276, 180], [282, 215], [292, 248], [282, 282], [262, 306],
    [230, 326], [200, 332], [170, 326], [138, 306], [118, 282], [108, 248], [118, 215], [124, 180], [108, 150], [102, 128], [110, 110],
  ], 0.8);
  b.step('얼굴과 수염', '종이 위쪽에 아래로 수염이 풍성한 얼굴을 그려요.', head);

  const fur = b.open('fur', [[106, 150], [200, 162], [294, 150]], ['head', 'head']);
  b.step('모자 털', '얼굴 위쪽을 가로지르는 줄을 그어 털 띠를 만들어요.', fur);

  const hat = b.open('hat', [[126, 108], [170, 60], [240, 34], [292, 46], [270, 76], [262, 108]], ['head', 'head']);
  b.step('모자', '털 띠 위로 끝이 옆으로 접힌 모자를 그려요.', hat);

  const pom = b.closed('pom', ellipse(306, 50, 18, 18, 10));
  b.step('방울', '모자 끝에 동그란 방울을 그려요.', pom);

  const eyeL = b.closed('eyeL', ellipse(172, 182, 7, 9));
  const eyeR = b.closed('eyeR', ellipse(228, 182, 7, 9));
  b.step('눈 두 개', '털 띠 아래에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const nose = b.closed('nose', ellipse(200, 202, 13, 11));
  b.step('코', '두 눈 사이 아래에 둥근 코를 그려요.', nose);

  const mus = b.closed('mus', [[200, 214], [180, 210], [160, 218], [148, 232], [168, 230], [186, 234], [200, 226], [214, 234], [232, 230], [252, 232], [240, 218], [220, 210]], 0.7);
  b.step('콧수염', '코 아래 양쪽으로 둥근 콧수염을 그려요.', mus);

  const bl = b.open('bl', [[114, 226], [132, 236], [150, 232]], ['head', 'mus']);
  const br = b.open('br', [[286, 226], [268, 236], [250, 232]], ['head', 'mus']);
  b.step('수염 줄', '콧수염 양 끝에서 얼굴 옆까지 줄을 그어요.', bl, br);

  const mouth = b.closed('mouth', ellipse(200, 250, 9, 6));
  b.step('입', '콧수염 아래에 작고 동그란 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(148, 200, 12, 8));
  const cheekR = b.closed('cheekR', ellipse(252, 200, 12, 8));
  b.step('볼 두 개', '눈 아래 양쪽에 발그레한 볼을 그려요.', cheekL, cheekR);

  const coat = b.open('coat', [[150, 312], [120, 340], [104, 390], [104, 430], [200, 436], [296, 430], [296, 390], [280, 340], [250, 312]], ['head', 'head']);
  b.step('옷', '수염 아래에 아래로 넓게 퍼지는 옷을 그려요.', coat);

  const belt1 = b.open('belt1', [[104, 384], [200, 386], [296, 384]], ['coat', 'coat']);
  const belt2 = b.open('belt2', [[104, 404], [200, 406], [296, 404]], ['coat', 'coat']);
  const buckle = b.closed('buckle', rect(184, 380, 216, 410), 0.2);
  b.step('허리띠', '옷 아래쪽에 허리띠와 네모난 고리를 그려요.', belt1, belt2, buckle);

  const armL = b.open('armL', [[116, 350], [90, 378], [76, 410], [98, 418], [114, 392]], ['coat', 'coat']);
  const armR = b.open('armR', [[284, 350], [310, 378], [324, 410], [302, 418], [286, 392]], ['coat', 'coat']);
  b.step('팔 두 개', '옷 양옆에 아래로 내린 팔을 그려요.', armL, armR);

  const gL = b.closed('gL', ellipse(84, 424, 16, 14));
  const gR = b.closed('gR', ellipse(316, 424, 16, 14));
  b.step('장갑', '팔 끝마다 동그란 장갑을 그려요.', gL, gR);

  const bootL = b.open('bootL', [[140, 434], [138, 456], [134, 470], [190, 470], [194, 435]], ['coat', 'coat']);
  const bootR = b.open('bootR', [[260, 434], [262, 456], [266, 470], [210, 470], [206, 435]], ['coat', 'coat']);
  b.step('장화', '옷 아래에 장화를 두 개 그려요.', bootL, bootR);

  return {
    id: 'santa', title: '산타 할아버지', theme: 'person', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 손바닥보다 큰 얼굴과 수염부터 그릴 거예요.',
    coloringSeconds: 200, steps: b.steps, keywords: ['계절', '겨울', '성탄절'],
  };
}
