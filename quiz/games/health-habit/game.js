/* games/health-habit/game.js */

'use strict';

// ── Constants ────────────────────────────────────────────────
const TOTAL_QUESTIONS  = 10;
const TIMEOUT_MS       = 6000;   // per question
const RESULT_PAUSE_MS  = 1900;   // pause before next question

// Player config
const PLAYER_CONFIG = [
  { label: 'P1', dot: '#0288D1', cls: 'p1' },
  { label: 'P2', dot: '#E53935', cls: 'p2' },
  { label: 'P3', dot: '#388E3C', cls: 'p3' },
  { label: 'P4', dot: '#F57C00', cls: 'p4' },
];

// ── Question pool ────────────────────────────────────────────
// { q: 문제, a: 정답, o: [오답 3개] } — 정답이 하나로 확정되도록 구성
const QUESTION_POOL = [
  { q: "밥을 먹기 전에 꼭 해야 하는 것은?", a: "손 씻기", o: ["머리 감기", "이 닦기", "세수하기"] },
  { q: "자기 전에 이를 깨끗이 하려면 무엇을 할까요?", a: "양치질", o: ["손 씻기", "세수하기", "발 씻기"] },
  { q: "눈을 보호하려면 텔레비전을 어떻게 볼까요?", a: "멀리 떨어져서", o: ["아주 가까이서", "불을 끄고", "누워서"] },
  { q: "뼈와 이를 튼튼하게 해 주는 음식은?", a: "우유", o: ["사탕", "과자", "탄산음료"] },
  { q: "몸을 튼튼하게 하려면 매일 무엇을 할까요?", a: "운동", o: ["게임만 하기", "밤새우기", "군것질하기"] },
  { q: "키가 크고 건강하려면 밤에 어떻게 할까요?", a: "일찍 자기", o: ["밤새우기", "게임하기", "야식 먹기"] },
  { q: "바르게 앉으려면 허리를 어떻게 할까요?", a: "곧게 펴기", o: ["구부리기", "비틀기", "눕히기"] },
  { q: "이가 썩지 않게 하려면 무엇을 적게 먹을까요?", a: "단 음식", o: ["채소", "물", "생선"] },
  { q: "화장실에 다녀온 뒤에는 무엇을 할까요?", a: "손 씻기", o: ["그냥 나오기", "옷에 닦기", "물만 묻히기"] },
  { q: "몸에 좋은, 여러 색깔의 반찬은?", a: "채소", o: ["사탕", "과자", "아이스크림"] },
  { q: "감기에 걸리지 않으려면 사람이 많은 곳에서 무엇을 쓸까요?", a: "마스크", o: ["장갑", "모자", "목도리"] },
  { q: "기침할 때 입을 무엇으로 가릴까요?", a: "옷소매", o: ["안 가려요", "친구 옷", "공책"] },
  { q: "손을 비누로 몇 초 이상 씻을까요?", a: "30초", o: ["1초", "3초", "5초"] },
  { q: "목이 마를 때 몸에 가장 좋은 마실 것은?", a: "물", o: ["콜라", "사이다", "커피"] },
  { q: "이를 한 번 닦을 때 몇 분쯤 닦을까요?", a: "3분", o: ["3초", "10초", "30분"] },
  { q: "이는 하루에 몇 번 닦을까요?", a: "하루 3번", o: ["일주일에 1번", "한 달에 1번", "1년에 1번"] },
  { q: "햇빛이 강한 날 피부를 지켜 주는 것은?", a: "자외선 차단제", o: ["물감", "치약", "비누"] },
  { q: "과자 대신 먹으면 좋은 간식은?", a: "과일", o: ["사탕", "초콜릿", "탄산음료"] },
  { q: "아침밥은 어떻게 하는 게 좋을까요?", a: "꼭 먹기", o: ["굶기", "과자만 먹기", "사탕만 먹기"] },
  { q: "책은 어디에서 읽어야 눈에 좋을까요?", a: "밝은 곳에서", o: ["어두운 곳에서", "이불 속에서", "눈을 가리고"] },
  { q: "눈이 피곤할 때 하면 좋은 것은?", a: "먼 곳 보기", o: ["눈 비비기", "화면 더 보기", "눈 누르기"] },
  { q: "코피가 나면 고개를 어떻게 할까요?", a: "앞으로 숙이기", o: ["뒤로 젖히기", "옆으로 돌리기", "위로 들기"] },
  { q: "코피가 나면 코의 어디를 꼭 누를까요?", a: "콧방울", o: ["이마", "귀", "턱"] },
  { q: "운동하기 전에 몸을 푸는 것은?", a: "준비 운동", o: ["낮잠", "군것질", "양치질"] },
  { q: "음식은 어떻게 씹어 먹을까요?", a: "천천히 꼭꼭", o: ["급하게 빨리", "씹지 않고", "말하면서"] },
  { q: "손톱은 어떻게 관리할까요?", a: "짧게 깎기", o: ["손톱 씹기", "길게 기르기", "때 묻히기"] },
  { q: "스마트폰은 어떻게 쓰는 게 좋을까요?", a: "시간 정하기", o: ["밤새 쓰기", "누워서 쓰기", "밥 먹으며"] },
  { q: "책가방은 어떻게 메는 게 좋을까요?", a: "두 어깨로", o: ["한쪽 어깨로", "손가락으로", "목에 걸어"] },
  { q: "과일을 먹기 전에 어떻게 할까요?", a: "물에 씻기", o: ["그냥 먹기", "흙 묻히기", "바닥에 두기"] },
  { q: "열이 나고 아플 때는 어떻게 할까요?", a: "푹 쉬기", o: ["운동장 뛰기", "밤새 게임", "찬물 목욕"] },
  { q: "미세먼지가 아주 나쁜 날에는?", a: "실내에서 놀기", o: ["밖에서 뛰기", "창문 열기", "마스크 벗기"] },
  { q: "귀를 지키려면 이어폰 소리는?", a: "작게", o: ["최대로", "아주 크게", "귀 아플 만큼"] },
]

// ── Sound Manager ────────────────────────────────────────────
const sound = createSoundManager();

// ── State ────────────────────────────────────────────────────
let playerCount   = 2;
let questionIdx   = 0;
let scores        = [];
let questionLog   = [];      // { q, answer, winnerIdx, dqSet, timedOut }
let currentQuestion = null;  // { q, choices:[], answerIdx }
let dqSet         = new Set();
let phase         = 'idle';
let timeoutHandle = null;
let nextHandle    = null;
let gameQuestions = [];

// ── DOM refs ─────────────────────────────────────────────────
const introScreen     = document.getElementById('introScreen');
const countdownScreen = document.getElementById('countdownScreen');
const countdownNumber = document.getElementById('countdownNumber');
const gameScreen    = document.getElementById('gameScreen');
const resultScreen  = document.getElementById('resultScreen');

const backBtn       = document.getElementById('backBtn');
const playBtn       = document.getElementById('playBtn');
const closeBtn      = document.getElementById('closeBtn');
const retryBtn      = document.getElementById('retryBtn');
const homeBtn       = document.getElementById('homeBtn');

const zonesWrap     = document.getElementById('zonesWrap');
const questionCounter = document.getElementById('questionCounter');
const problemExpr   = document.getElementById('problemExpr');
const problemStatus = document.getElementById('problemStatus');
const scoreBar      = document.getElementById('scoreBar');

const soundToggleIntro = document.getElementById('soundToggleIntro');

const resultTitle      = document.getElementById('resultTitle');
const resultWinner     = document.getElementById('resultWinner');
const resultTableHead  = document.getElementById('resultTableHead');
const resultTableBody  = document.getElementById('resultTableBody');
const totalRow         = document.getElementById('totalRow');

// ── Helpers ──────────────────────────────────────────────────
function showScreen(s) {
  [introScreen, countdownScreen, gameScreen, resultScreen].forEach(x => x.classList.remove('active'));
  s.classList.add('active');
}

var countdownInterval = null;
function startCountdown(onDone) {
  showScreen(countdownScreen);
  countdownInterval = runCountdown(countdownNumber, onDone);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(item) {
  const choices = shuffle([item.a, item.o[0], item.o[1], item.o[2]]);
  const answerIdx = choices.indexOf(item.a);
  return { q: item.q, choices: choices, answerIdx: answerIdx };
}

// ── Sound toggle ─────────────────────────────────────────────
setupSoundToggle(sound, soundToggleIntro);

// ── Player count selection ───────────────────────────────────
setupPlayerSelect(function (n) { playerCount = n; });

// ── Navigation ───────────────────────────────────────────────
onTap(backBtn,  () => goHome());
onTap(closeBtn, () => { clearTimers(); goHome(); });
onTap(homeBtn,  () => goHome());
onTap(retryBtn, () => startCountdown(() => startGame()));
onTap(playBtn,  () => startCountdown(() => startGame()));

// ── Build zone grid ──────────────────────────────────────────
function buildZones() {
  zonesWrap.innerHTML = '';
  zonesWrap.className = `zones-wrap p${playerCount}`;

  for (let i = 0; i < playerCount; i++) {
    const cfg  = PLAYER_CONFIG[i];
    const zone = document.createElement('div');
    zone.className = `zone ${cfg.cls}`;
    zone.dataset.player = i;

    const header = document.createElement('div');
    header.className = 'zone-header';
    header.innerHTML = `
      <span class="zone-label">${cfg.label}</span>
      <span class="zone-score-chip" id="score-chip-${i}">0점</span>
    `;

    const grid = document.createElement('div');
    grid.className = 'answer-grid';
    grid.id = `answer-grid-${i}`;

    for (let j = 0; j < 4; j++) {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.dataset.player = i;
      btn.dataset.slot   = j;
      btn.textContent    = '?';
      onTap(btn, () => handleAnswerTap(i, j, btn));
      grid.appendChild(btn);
    }

    zone.appendChild(header);
    zone.appendChild(grid);
    zonesWrap.appendChild(zone);
  }
}

function getZone(idx) {
  return zonesWrap.querySelector(`.zone[data-player="${idx}"]`);
}

function getAnswerBtns(playerIdx) {
  return zonesWrap.querySelectorAll(`.answer-btn[data-player="${playerIdx}"]`);
}

function updateScoreChip(playerIdx) {
  const chip = document.getElementById(`score-chip-${playerIdx}`);
  if (chip) chip.textContent = `${scores[playerIdx]}점`;
}

// ── Build score bar ──────────────────────────────────────────
function buildScoreBar() {
  scoreBar.innerHTML = '';
  for (let i = 0; i < playerCount; i++) {
    const cfg  = PLAYER_CONFIG[i];
    const chip = document.createElement('div');
    chip.className = 'score-chip';
    chip.innerHTML = `
      <span class="score-chip-dot" style="background:${cfg.dot}"></span>
      <span>${cfg.label}</span>
      <span class="score-chip-val" id="bar-score-${i}">0</span>
    `;
    scoreBar.appendChild(chip);
  }
}

function updateBarScore(playerIdx) {
  const el = document.getElementById(`bar-score-${playerIdx}`);
  if (el) el.textContent = scores[playerIdx];
}

// ── Populate answer buttons for a question ───────────────────
function populateAnswers(question) {
  for (let i = 0; i < playerCount; i++) {
    const btns = getAnswerBtns(i);
    btns.forEach((btn, j) => {
      btn.textContent = question.choices[j];
      btn.className   = 'answer-btn';
      btn.disabled    = false;
      if (dqSet.has(i)) {
        btn.classList.add('state-disabled');
        btn.disabled = true;
      }
    });
  }
}

// ── Ripple effect ────────────────────────────────────────────
function spawnRipple(zone, e) {
  const rect  = zone.getBoundingClientRect();
  const touch = e && e.touches ? e.touches[0] : e;
  const x     = (touch ? touch.clientX : rect.left + rect.width / 2)  - rect.left;
  const y     = (touch ? touch.clientY : rect.top  + rect.height / 2) - rect.top;
  const r     = document.createElement('span');
  r.className = 'zone-ripple';
  r.style.left   = x + 'px';
  r.style.top    = y + 'px';
  r.style.width  = r.style.height = Math.max(rect.width, rect.height) + 'px';
  r.style.marginLeft = r.style.marginTop = `-${Math.max(rect.width, rect.height) / 2}px`;
  zone.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}

// ── Answer tap handler ───────────────────────────────────────
function handleAnswerTap(playerIdx, slotIdx, btn) {
  if (phase !== 'active') return;
  if (dqSet.has(playerIdx)) return;

  const zone   = getZone(playerIdx);
  spawnRipple(zone, window.event || null);

  const correct = slotIdx === currentQuestion.answerIdx;

  if (correct) {
    resolveQuestion(playerIdx, btn);
  } else {
    sound.play('buzz');
    btn.classList.add('state-wrong');
    disqualifyPlayer(playerIdx);
  }
}

function disqualifyPlayer(playerIdx) {
  if (dqSet.has(playerIdx)) return;
  dqSet.add(playerIdx);

  scores[playerIdx] = Math.max(0, scores[playerIdx] - 1);
  updateScoreChip(playerIdx);
  updateBarScore(playerIdx);

  const zone = getZone(playerIdx);
  if (zone) {
    const penalty = document.createElement('div');
    penalty.className = 'penalty-flash';
    penalty.textContent = '-1';
    zone.style.position = 'relative';
    zone.appendChild(penalty);
    penalty.addEventListener('animationend', () => penalty.remove());
  }

  getAnswerBtns(playerIdx).forEach(b => {
    b.classList.add('state-disabled');
    b.disabled = true;
  });

  const allDQ = Array.from({ length: playerCount }, (_, i) => i).every(i => dqSet.has(i));
  if (allDQ) {
    resolveQuestion(-1, null);
  }
}

// ── Resolve a question ───────────────────────────────────────
function resolveQuestion(winnerIdx, winBtn) {
  if (phase !== 'active') return;
  clearTimers();
  phase = 'result';

  if (winnerIdx >= 0) {
    sound.play('ding');
    scores[winnerIdx]++;
    updateScoreChip(winnerIdx);
    updateBarScore(winnerIdx);

    if (winBtn) winBtn.classList.add('state-correct');

    const cfg = PLAYER_CONFIG[winnerIdx];
    problemStatus.textContent = `${cfg.label} 정답! 🎉`;

    questionLog.push({
      q:         currentQuestion.q,
      answer:    currentQuestion.choices[currentQuestion.answerIdx],
      winnerIdx,
      dqSet:     new Set(dqSet),
      timedOut:  false,
    });
  } else {
    const timedOut = !Array.from({ length: playerCount }, (_, i) => i).every(i => dqSet.has(i));

    if (timedOut) {
      sound.play('timeout');
      problemStatus.textContent = `시간 초과 ⏱`;
      problemExpr.classList.add('timeout-flash');
      setTimeout(() => problemExpr.classList.remove('timeout-flash'), 400);
      revealAnswer();
    } else {
      sound.play('timeout');
      problemStatus.textContent = '모두 실격 😅';
      revealAnswer();
    }

    questionLog.push({
      q:         currentQuestion.q,
      answer:    currentQuestion.choices[currentQuestion.answerIdx],
      winnerIdx: -1,
      dqSet:     new Set(dqSet),
      timedOut,
    });
  }

  nextHandle = setTimeout(nextQuestion, RESULT_PAUSE_MS);
}

function revealAnswer() {
  for (let i = 0; i < playerCount; i++) {
    const btns = getAnswerBtns(i);
    btns.forEach(btn => {
      if (Number(btn.dataset.slot) === currentQuestion.answerIdx) {
        btn.classList.remove('state-disabled');
        btn.classList.add('state-reveal');
      }
    });
  }
}

// ── Question flow ─────────────────────────────────────────────
function startGame() {
  gameQuestions = shuffle(QUESTION_POOL).slice(0, TOTAL_QUESTIONS);
  scores      = new Array(playerCount).fill(0);
  questionLog = [];
  questionIdx = 0;

  showScreen(gameScreen);
  buildZones();
  buildScoreBar();
  nextQuestion();
}

function nextQuestion() {
  if (questionIdx >= TOTAL_QUESTIONS) {
    showResult();
    return;
  }

  const item = gameQuestions[questionIdx];
  questionIdx++;
  dqSet   = new Set();
  phase   = 'idle';

  questionCounter.textContent = `${questionIdx} / ${TOTAL_QUESTIONS}`;
  problemStatus.textContent   = '';

  for (let i = 0; i < playerCount; i++) {
    const z = getZone(i);
    if (z) z.classList.remove('dq-zone');
    getAnswerBtns(i).forEach(b => {
      b.className = 'answer-btn';
      b.disabled  = false;
      b.textContent = '?';
    });
  }

  currentQuestion = buildQuestion(item);
  problemExpr.innerHTML = currentQuestion.q;

  setTimeout(() => {
    populateAnswers(currentQuestion);
    phase = 'active';

    timeoutHandle = setTimeout(() => {
      if (phase === 'active') {
        resolveQuestion(-1, null);
      }
    }, TIMEOUT_MS);
  }, 300);
}

function clearTimers() {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = null; }
  if (nextHandle)    { clearTimeout(nextHandle);    nextHandle    = null; }
}

// ── Result screen ─────────────────────────────────────────────
function showResult() {
  sound.play('fanfare');

  const maxScore = Math.max(...scores);
  const winners  = scores.reduce((acc, s, i) => { if (s === maxScore) acc.push(i); return acc; }, []);

  if (maxScore === 0) {
    resultTitle.textContent  = '😅 게임 종료!';
    resultWinner.textContent = '아무도 점수를 얻지 못했어요.';
    resultWinner.style.color = '#5C6BC0';
  } else if (winners.length === 1) {
    const cfg = PLAYER_CONFIG[winners[0]];
    resultTitle.textContent  = '🏆 게임 종료!';
    resultWinner.textContent = `${cfg.label} 최종 우승! 🎉`;
    resultWinner.style.color = cfg.dot;
  } else {
    resultTitle.textContent  = '🤝 게임 종료!';
    resultWinner.textContent = `공동 우승: ${winners.map(i => PLAYER_CONFIG[i].label).join(', ')} 🎉`;
    resultWinner.style.color = '#5C6BC0';
  }

  const players = Array.from({ length: playerCount }, (_, i) => PLAYER_CONFIG[i]);
  resultTableHead.innerHTML = `
    <tr>
      <th>#</th>
      <th>정답</th>
      ${players.map(p => `<th><span class="player-dot" style="background:${p.dot}"></span>${p.label}</th>`).join('')}
    </tr>
  `;

  resultTableBody.innerHTML = questionLog.map((q, ri) => {
    const cells = players.map((_, pi) => {
      if (q.dqSet.has(pi) && q.winnerIdx !== pi) return `<td class="cell-dq">실격</td>`;
      if (q.winnerIdx === pi) return `<td class="cell-win">★</td>`;
      if (q.timedOut)  return `<td class="cell-timeout">시간초과</td>`;
      return `<td class="cell-none">—</td>`;
    }).join('');
    return `<tr>
      <td>${ri + 1}</td>
      <td style="font-size:0.8rem;font-weight:800">${q.answer}</td>
      ${cells}
    </tr>`;
  }).join('');

  totalRow.innerHTML = players.map((p, i) => `
    <div class="total-chip">
      <span class="chip-dot" style="background:${p.dot}"></span>
      <span>${p.label}</span>
      <span class="chip-score">${scores[i]}점</span>
    </div>
  `).join('');

  showScreen(resultScreen);
}
