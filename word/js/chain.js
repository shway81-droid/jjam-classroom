/* —— 끝말잇기 도우미 — 차례 진행 규칙 ——
   처음에는 입력 없이 *차례*만 기록했다(1번 ✓ 2번 ✓ 3번 ✗). 그러면 화면에는 끝까지
   시작 단어만 떠 있어 "지금 무슨 글자로 이어야 하나"를 아무도 모른다.
   그래서 교사가 원할 때만 낱말을 적는다(2026-09-28, 선생님 요청). 적으면 그 낱말이
   화면의 주인이 되고 다음 글자가 뜬다. 안 적고 [성공]만 눌러도 예전처럼 흐른다.

   낱말 검사(checkWord)는 *알려 주기만* 한다. 판정은 교실을 보고 있는 교사 몫이다 —
   화면이 "틀렸다"고 막으면 표준어가 아닌 사투리·새말 앞에서 수업이 멈춘다.

   mode — 'chain' 끝말잇기: 방금 나온 낱말의 끝 글자로 잇는다.
          'relay' 줄줄이 말해요: 제시 글자(word) 하나로 모두 시작한다.

   불변 객체로 다룬다 — 화면이 이전 상태를 붙들고 있어도 어긋나지 않는다. */

const MIN_GROUPS = 2;
const MIN_SECONDS = 5;

const SYLLABLE_START = 0xac00;
const SYLLABLE_COUNT = 11172;
const LEAD_N = 2;    // ㄴ
const LEAD_R = 5;    // ㄹ
const LEAD_O = 11;   // ㅇ
// 두음법칙에서 ㄴ·ㄹ 이 ㅇ 으로 바뀌는 모음 — ㅑ ㅕ ㅖ ㅛ ㅠ ㅣ
const Y_VOWELS = new Set([2, 6, 7, 12, 17, 20]);

/** 이 글자로 시작해도 되는 글자들. 두음법칙을 따른다 — 력 → 력·역, 락 → 락·낙, 녀 → 녀·여. */
export function heads(ch) {
  const at = ch.charCodeAt(0) - SYLLABLE_START;
  if (at < 0 || at >= SYLLABLE_COUNT) return [ch];
  const lead = Math.floor(at / 588);
  const vowel = Math.floor((at % 588) / 28);
  const rest = at % 588;
  let to = null;
  if (lead === LEAD_R) to = Y_VOWELS.has(vowel) ? LEAD_O : LEAD_N;
  else if (lead === LEAD_N && Y_VOWELS.has(vowel)) to = LEAD_O;
  return to === null ? [ch] : [ch, String.fromCharCode(SYLLABLE_START + to * 588 + rest)];
}

/** 화면 가운데 띄우는 낱말 — 끝말잇기는 방금 나온 말, 줄줄이는 제시 글자. */
export function currentWord(round) {
  return round.mode === 'relay' ? round.word : round.words[round.words.length - 1];
}

/** 다음 차례가 시작해야 하는 글자들. */
export function nextHeads(round) {
  if (round.mode === 'relay') return [round.word];
  const w = currentWord(round);
  return heads(w[w.length - 1]);
}

/** 적은 낱말에 걸리는 점이 있으면 이유를, 없으면 null.
    'hangul' 한글이 아님 · 'short' 한 글자 · 'head' 첫 글자가 안 맞음 · 'used' 이미 나온 말 */
export function checkWord(round, word) {
  const w = String(word).replace(/\s/g, '');
  if (!/^[\uAC00-\uD7A3]+$/.test(w)) return 'hangul';
  if (w.length < 2) return 'short';
  if (!nextHeads(round).includes(w[0])) return 'head';
  if (round.words.includes(w)) return 'used';
  return null;
}

export function createRound({ word, groups, seconds, mode = 'chain' }) {
  return {
    word,
    mode,
    // 이 판에 나온 낱말. 끝말잇기는 시작 단어부터 센다 — 시작 단어를 다시 말해도 '이미 나온 말'이다.
    words: mode === 'relay' ? [] : [word],
    groups: Math.max(MIN_GROUPS, Number(groups) || MIN_GROUPS),
    seconds: Math.max(MIN_SECONDS, Number(seconds) || MIN_SECONDS),
    turn: 1,
    log: [],
    expired: false,
    done: false,
  };
}

/** 시간이 다 됐다 — 판을 끝내지는 *않는다*.
    화면이 멋대로 탈락시키면 "방금 말했는데!" 하는 순간에 되돌릴 길이 없다.
    시간 초과로 칠지 그래도 인정할지는 교실을 보고 있는 교사가 정한다
    (PRD 4절 "자동 진행 없음"과 같은 이유). */
export function expire(round) {
  if (round.done || round.expired) return round;
  return { ...round, expired: true };
}

/** result: 'ok' 성공 → 다음 차례 / 'out' 탈락 · 'timeout' 시간 초과 → 판 종료
    word: 성공한 차례에 교사가 적은 낱말(없어도 된다). */
export function advance(round, result, word) {
  if (round.done) return round;
  const w = result === 'ok' && word ? String(word).replace(/\s/g, '') : '';
  const entry = w ? { turn: round.turn, result, word: w } : { turn: round.turn, result };
  const log = [...round.log, entry];
  if (result !== 'ok') return { ...round, log, expired: false, done: true };
  const words = w ? [...round.words, w] : round.words;
  return { ...round, log, words, expired: false, turn: (round.turn % round.groups) + 1 };
}

/** 이 판에서 성공한 차례 수 — 낱말을 적었든 안 적었든 센다. */
export function okCount(round) {
  return round.log.filter((e) => e.result === 'ok').length;
}

/** 적은 낱말이 하나라도 있나 — 없으면 기록 줄은 예전처럼 차례(1번 ✓)를 보여 준다. */
export function hasWords(round) {
  return round.log.some((e) => e.word);
}
