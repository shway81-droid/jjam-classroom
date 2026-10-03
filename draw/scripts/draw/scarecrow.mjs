import { bench, ellipse } from './lib.mjs';

// ================================================================ 허수아비 — 참조 없음(직접 디자인), 가을 들판
// 옷과 막대를 첫 획으로 그어 높이를 정하고, 팔 막대·얼굴·모자를 차례로 얹습니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];

export default function draw() {
  const b = bench();
  // 옷과 그 아래 막대를 한 획으로 — 막대가 얼굴·옷을 꿰뚫고 지나가 보이지 않게 합니다(첫 획 40% 규칙도 이 획이 맡습니다).
  const body = b.closed('body', [[132, 200], [268, 200], [302, 228], [292, 252], [262, 240], [262, 330], [207, 330], [207, 470], [193, 470], [193, 330], [138, 330], [138, 240], [108, 252], [98, 228]], 0.5);
  b.step('옷과 막대', '종이 가운데에 팔을 벌린 옷과 그 아래 막대를 그려요.', body);

  const barL = b.closed('barL', rect(84, 204, 104, 218), 0.3);
  const barR = b.closed('barR', rect(296, 204, 316, 218), 0.3);
  b.step('팔 막대', '옷 소매 양 끝에 짧은 막대를 하나씩 그려요.', barL, barR);

  const head = b.closed('head', ellipse(200, 142, 50, 50, 10));
  b.step('얼굴', '옷 위에 동그란 얼굴을 그려요.', head);

  const brim = b.closed('brim', ellipse(200, 96, 96, 17, 10));
  b.step('모자 챙', '얼굴 위에 옆으로 넓적한 모자 챙을 그려요.', brim);

  const crown = b.open('crown', [[150, 94], [156, 60], [200, 46], [244, 60], [250, 94]], ['brim', 'brim']);
  b.step('모자 위', '모자 챙 위에 둥근 모자 윗부분을 그려요.', crown);

  const strawL = b.closed('strawL', [[88, 200], [56, 182], [68, 202], [32, 194], [62, 210], [30, 226], [64, 220], [50, 242], [88, 224]], 0.4);
  const strawR = b.closed('strawR', [[312, 200], [344, 182], [332, 202], [368, 194], [338, 210], [370, 226], [336, 220], [350, 242], [312, 224]], 0.4);
  b.step('짚 손', '팔 막대 끝에 빗자루처럼 퍼진 짚 손을 그려요.', strawL, strawR);

  const eyeL = b.closed('eyeL', ellipse(182, 136, 6, 8));
  const eyeR = b.closed('eyeR', ellipse(218, 136, 6, 8));
  b.step('눈 두 개', '얼굴 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[180, 160], [200, 166], [220, 160], [214, 172], [200, 176], [186, 172]], 0.8);
  b.step('웃는 입', '눈 아래에 방긋 웃는 입을 그려요.', mouth);

  const cheekL = b.closed('cheekL', ellipse(166, 156, 11, 7));
  const cheekR = b.closed('cheekR', ellipse(234, 156, 11, 7));
  b.step('볼 두 개', '입 양옆에 발그레한 볼을 그려요.', cheekL, cheekR);

  const btn1 = b.closed('btn1', ellipse(200, 252, 8, 8));
  const btn2 = b.closed('btn2', ellipse(200, 290, 8, 8));
  const patch = b.closed('patch', rect(226, 280, 250, 304), 0.3);
  b.step('단추와 천', '옷 가운데에 단추 두 개와 네모난 천 조각을 그려요.', btn1, btn2, patch);

  return {
    id: 'scarecrow', title: '허수아비', theme: 'season', difficulty: 'normal', grades: ['middle'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 팔을 벌린 옷과 막대부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['계절', '가을', '들판'],
  };
}
