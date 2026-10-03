import { bench, ellipse } from './lib.mjs';

// ================================================================ 의사 선생님 — 참조 없음(직접 디자인)
// 큰 얼굴을 먼저 긋고(첫 획 40% 규칙), 가운·청진기·팔다리를 차례로 붙입니다.
const rect = (x0, y0, x1, y1) => [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];

export default function draw() {
  const b = bench();
  const face = b.closed('face', ellipse(200, 152, 86, 86, 14));
  b.step('얼굴', '종이 위쪽에 크고 동그란 얼굴을 그려요.', face);

  const hair = b.open('hair', [[118, 140], [124, 92], [160, 66], [200, 58], [240, 66], [276, 92], [282, 140]], ['face', 'face']);
  b.step('머리카락', '얼굴 위를 덮는 둥근 머리카락을 그려요.', hair);

  const bangs = b.open('bangs', [[120, 126], [164, 92], [226, 104], [280, 126]], ['hair', 'hair']);
  b.step('앞머리', '이마에 옆으로 넘긴 앞머리를 그려요.', bangs);

  const eyeL = b.closed('eyeL', ellipse(168, 158, 7, 9));
  const eyeR = b.closed('eyeR', ellipse(232, 158, 7, 9));
  b.step('눈 두 개', '얼굴 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[184, 190], [200, 196], [216, 190], [211, 202], [200, 207], [189, 202]], 0.8);
  const cheekL = b.closed('cheekL', ellipse(144, 186, 11, 7));
  const cheekR = b.closed('cheekR', ellipse(256, 186, 11, 7));
  b.step('입과 볼', '두 눈 아래에 웃는 입을 그리고 양 볼을 그려요.', mouth, cheekL, cheekR);

  const coat = b.open('coat', [[160, 228], [132, 246], [118, 300], [116, 400], [200, 404], [284, 400], [282, 300], [268, 246], [240, 228]], ['face', 'face']);
  b.step('흰 가운', '얼굴 아래에 무릎까지 오는 흰 가운을 그려요.', coat);

  const lapel = b.open('lapel', [[176, 234], [200, 290], [224, 234]], ['face', 'face']);
  b.step('옷깃', '가운 목 아래에 뾰족한 옷깃을 그려요.', lapel);

  const chest = b.closed('chest', ellipse(234, 322, 12, 12, 10));
  const tubeS = b.open('tubeS', [[186, 252], [174, 300], [196, 338], [222, 326]], ['lapel', 'chest']);
  b.step('청진기', '목에서 내려오는 줄 끝에 동그란 청진기를 그려요.', chest, tubeS);

  const pocket = b.closed('pocket', rect(134, 330, 168, 362), 0.2);
  const pen = b.open('pen', [[146, 330], [146, 312], [154, 312], [154, 330]], ['pocket', 'pocket'], 0.2);
  b.step('주머니와 펜', '가운 왼쪽에 주머니를 그리고 펜을 꽂아요.', pocket, pen);

  const btn1 = b.closed('btn1', ellipse(200, 340, 6, 6, 6));
  const btn2 = b.closed('btn2', ellipse(200, 374, 6, 6, 6));
  b.step('단추', '가운 가운데에 단추를 두 개 그려요.', btn1, btn2);

  const armL = b.open('armL', [[122, 270], [98, 318], [92, 358], [110, 362], [120, 330]], ['coat', 'coat']);
  const armR = b.open('armR', [[278, 270], [302, 318], [308, 358], [290, 362], [280, 330]], ['coat', 'coat']);
  b.step('팔 두 개', '가운 양옆에 아래로 내린 팔을 그려요.', armL, armR);

  const handL = b.closed('handL', ellipse(100, 372, 13, 13));
  const handR = b.closed('handR', ellipse(300, 372, 13, 13));
  b.step('손', '팔 끝마다 동그란 손을 그려요.', handL, handR);

  const legL = b.open('legL', [[150, 402], [150, 446], [190, 446], [190, 403]], ['coat', 'coat'], 0.2);
  const legR = b.open('legR', [[210, 403], [210, 446], [250, 446], [250, 402]], ['coat', 'coat'], 0.2);
  b.step('다리', '가운 아래에 다리를 두 개 그려요.', legL, legR);

  const shoeL = b.closed('shoeL', ellipse(166, 456, 28, 11));
  const shoeR = b.closed('shoeR', ellipse(234, 456, 28, 11));
  b.step('신발', '다리 아래에 둥근 신발을 그려요.', shoeL, shoeR);

  return {
    id: 'doctor', title: '의사 선생님', theme: 'person', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 손바닥보다 큰 얼굴부터 그릴 거예요.',
    coloringSeconds: 200, steps: b.steps, keywords: ['직업', '병원', '건강'],
  };
}
