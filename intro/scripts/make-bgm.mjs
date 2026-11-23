// 소개 영상 배경음악을 **코드로 직접 만든다.** 남의 곡을 쓰지 않으므로 유튜브 저작권
// (Content ID) 걱정이 없다. 같은 코드면 늘 같은 소리가 난다(난수 씨앗 고정).
//
// 밝은 D장조, 100 BPM, 4/4 박자 23마디(약 55.2초) — 영상 길이·장면 흐름에 맞췄다.
//   1~2마디 : 패드와 마림바만 잔잔하게 (고민 → 제목)
//   3~20마디: 킥·박수·하이햇·베이스가 들어온 경쾌한 리듬 (여덟 사이트)
//   7마디~  : 종소리 멜로디가 얹힌다
//   21~23마디: 리듬이 빠지고 마지막 화음이 울리며 끝 (마무리)
//
//   cd intro && node scripts/make-bgm.mjs      → public/bgm.wav (44.1kHz 스테레오 16비트)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'bgm.wav');
const SR = 44100;
const BPM = 100;
const BEAT = 60 / BPM;
const BAR = BEAT * 4; // 2.4초
const BARS = 23;
const LENGTH = 55.4; // 초 (영상 55.1초보다 조금 길게)
const N = Math.ceil(LENGTH * SR);

// 버스: dry 는 그대로, wet 은 잔향을 거친다
const dryL = new Float32Array(N), dryR = new Float32Array(N);
const wetL = new Float32Array(N), wetR = new Float32Array(N);

let seed = 20261123;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

/** 소리 하나를 버스에 더한다. gen(t) 는 시작부터의 시간(초) → 표본 값 */
function add(start, dur, gen, { gain = 1, pan = 0, wet = 0 } = {}) {
  const s0 = Math.max(0, Math.round(start * SR));
  const s1 = Math.min(N, Math.round((start + dur) * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = s0; i < s1; i++) {
    const v = gen((i - s0) / SR);
    dryL[i] += v * gl * (1 - wet);
    dryR[i] += v * gr * (1 - wet);
    wetL[i] += v * gl * wet;
    wetR[i] += v * gr * wet;
  }
}

const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const TAU = Math.PI * 2;

// ── 악기 ──────────────────────────────────────────────
function pad(start, dur, notes, gain) {
  for (const [k, m] of notes.entries()) {
    const f = hz(m);
    add(start, dur + 1.2, (t) => {
      const a = Math.min(1, t / 0.6) * (t > dur ? Math.exp(-(t - dur) / 0.5) : 1);
      // 살짝 어긋난 두 사인 + 3배음 조금 = 부드러운 패드
      return a * (Math.sin(TAU * f * t) + 0.7 * Math.sin(TAU * f * 1.004 * t) + 0.12 * Math.sin(TAU * 3 * f * t)) * 0.33;
    }, { gain, pan: (k - 1) * 0.35, wet: 0.55 });
  }
}

function marimba(start, m, gain, pan) {
  const f = hz(m);
  add(start, 0.9, (t) => env(t, 0.003, 0.22) * (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 4 * f * t) * Math.exp(-t / 0.05)), { gain, pan, wet: 0.35 });
}

function bell(start, m, gain) {
  const f = hz(m);
  add(start, 2.4, (t) => env(t, 0.004, 0.7) * (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2.76 * f * t) * Math.exp(-t / 0.3) + 0.15 * Math.sin(TAU * 5.4 * f * t) * Math.exp(-t / 0.12)), { gain, pan: 0.15, wet: 0.5 });
}

function bass(start, dur, m, gain) {
  const f = hz(m);
  add(start, dur, (t) => {
    const a = Math.min(1, t / 0.01) * Math.exp(-t / 0.5) * (t > dur - 0.05 ? (dur - t) / 0.05 : 1);
    return a * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t));
  }, { gain });
}

function kick(start, gain) {
  let ph = 0;
  add(start, 0.4, (t) => {
    const f = 48 + 90 * Math.exp(-t / 0.035);
    ph += (TAU * f) / SR;
    return Math.sin(ph) * Math.exp(-t / 0.13);
  }, { gain });
}

function clap(start, gain) {
  add(start, 0.3, (t) => {
    const bursts = (t < 0.01 ? 1 : 0) + (t > 0.012 && t < 0.02 ? 0.8 : 0) + (t > 0.024 ? Math.exp(-(t - 0.024) / 0.07) : 0);
    return rand() * bursts * 0.6;
  }, { gain, pan: -0.05, wet: 0.3 });
}

function hat(start, gain, pan) {
  let prev = 0;
  add(start, 0.08, (t) => {
    const n = rand();
    const hp = n - prev; // 아주 간단한 고역 통과
    prev = n;
    return hp * Math.exp(-t / 0.018) * 0.5;
  }, { gain, pan });
}

// ── 곡 ────────────────────────────────────────────────
// D – A – Bm – G (I – V – vi – IV), 짬짬이답게 가볍고 둥글게
const CHORDS = [
  { pad: [62, 66, 69], bass: 38, arp: [74, 78, 81, 86, 81, 78, 74, 78], bell: [78, 81] },
  { pad: [61, 64, 69], bass: 45, arp: [73, 76, 81, 85, 81, 76, 73, 76], bell: [76, 73] },
  { pad: [59, 62, 66], bass: 47, arp: [71, 74, 78, 83, 78, 74, 71, 74], bell: [74, 78] },
  { pad: [59, 62, 67], bass: 43, arp: [71, 74, 79, 83, 79, 74, 71, 74], bell: [71, 74] },
];

for (let bar = 0; bar < BARS; bar++) {
  const t0 = bar * BAR;
  const last = bar === BARS - 2; // 마지막 화음은 두 마디를 울린다
  if (bar === BARS - 1) break;
  const c = last ? CHORDS[0] : CHORDS[bar % 4];
  const groove = bar >= 2 && bar < BARS - 3;
  const dur = last ? BAR * 2 : BAR;

  pad(t0, dur, c.pad, last ? 0.15 : 0.12);

  if (bar >= 1 && !last) {
    c.arp.forEach((m, i) => marimba(t0 + i * (BEAT / 2), m, 0.15 + (i % 2 === 0 ? 0.04 : 0), i % 2 ? 0.3 : -0.3));
  }
  if (last) marimba(t0, 86, 0.16, 0);

  if (groove) {
    // 베이스: 1박·2박 반·3박 (통통 튀게)
    bass(t0, BEAT * 1.4, c.bass, 0.26);
    bass(t0 + BEAT * 1.5, BEAT * 0.45, c.bass + 12, 0.14);
    bass(t0 + BEAT * 2, BEAT * 1.9, c.bass, 0.22);
    // 드럼: 킥 1·3박(+3박 반), 박수 2·4박, 하이햇 8분
    kick(t0, 0.36);
    kick(t0 + BEAT * 2, 0.32);
    if (bar % 2 === 1) kick(t0 + BEAT * 3.5, 0.22);
    clap(t0 + BEAT, 0.17);
    clap(t0 + BEAT * 3, 0.17);
    for (let i = 0; i < 8; i++) hat(t0 + i * (BEAT / 2), i % 2 ? 0.07 : 0.045, i % 2 ? 0.25 : -0.25);
  }
  if (last) bass(t0, BAR * 1.6, 38, 0.2);

  // 종소리 멜로디: 7마디부터, 반 마디마다
  if (bar >= 6 && groove) {
    bell(t0, c.bell[0], 0.1);
    bell(t0 + BAR / 2, c.bell[1], 0.085);
  }
}

// ── 잔향(Schroeder: 빗살 4개 + 전역 통과 2개) ─────────
function reverb(input, delaysMs) {
  const out = new Float32Array(N);
  for (const ms of delaysMs.comb) {
    const d = Math.round((ms / 1000) * SR);
    const buf = new Float32Array(d);
    let idx = 0, lp = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[idx];
      lp = y * 0.7 + lp * 0.3; // 고역을 조금 깎아 부드럽게
      buf[idx] = input[i] + lp * 0.8;
      out[i] += y * 0.25;
      idx = (idx + 1) % d;
    }
  }
  for (const ms of delaysMs.ap) {
    const d = Math.round((ms / 1000) * SR);
    const buf = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < N; i++) {
      const b = buf[idx];
      const x = out[i];
      const y = -0.7 * x + b;
      buf[idx] = x + 0.7 * y;
      out[i] = y;
      idx = (idx + 1) % d;
    }
  }
  return out;
}
const revL = reverb(wetL, { comb: [29.7, 37.1, 41.1, 43.7], ap: [5.0, 1.7] });
const revR = reverb(wetR, { comb: [30.3, 36.4, 40.7, 44.9], ap: [5.3, 1.9] });

// ── 섞기 · 끝 페이드 · 정규화 ─────────────────────────
const L = new Float32Array(N), R = new Float32Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.4) * Math.min(1, (LENGTH - t) / 2.5);
  L[i] = (dryL[i] + revL[i] * 0.9 + wetL[i] * 0.3) * fade;
  R[i] = (dryR[i] + revR[i] * 0.9 + wetR[i] * 0.3) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.85 / peak; // 최고점 약 -1.4dBFS

const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.tanh(L[i] * norm) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.tanh(R[i] * norm) * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(2, 22); // 스테레오
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, Buffer.concat([header, data]));
console.log(`배경음악: ${OUT} (${LENGTH}초, ${BPM} BPM)`);
