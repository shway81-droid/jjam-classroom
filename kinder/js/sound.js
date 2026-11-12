/* —— Web Audio 합성 효과음 ——
   음원 파일을 두지 않는다: 저작권 0, 용량 0, 오프라인 완전 동작.
   AudioContext 는 첫 조작 뒤에 만든다 — 브라우저 자동재생 정책 때문.
   소리는 늘 보조다. 음소거로도 놀이는 모두 된다. */

let ctx = null;
let master = null;
let muted = false;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

function tone(freq, at, dur, peak, type = 'sine') {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + at;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/* 새 카드 — 통통 튀는 두 음. "다음 그림이 나왔다" 정도의 신호. */
export function card() {
  if (!ensure()) return;
  tone(520, 0, 0.12, 0.06, 'triangle');
  tone(780, 0.08, 0.16, 0.06, 'triangle');
}

/* 정답 — 도-미-솔 올라가는 소리. */
export function reveal() {
  if (!ensure()) return;
  [[523.25, 0], [659.25, 0.09], [783.99, 0.18]].forEach(([f, at]) => tone(f, at, 0.5, 0.08));
}

/* 힌트 — 아주 작은 한 음. */
export function hint() {
  if (!ensure()) return;
  tone(660, 0, 0.18, 0.05, 'triangle');
}

export function setMuted(on) {
  muted = !!on;
  if (master) master.gain.value = muted ? 0 : 1;
}
