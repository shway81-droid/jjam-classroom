/* 우리말 퀴즈 — [순수] 문제 글자·힌트 단계 규칙. DOM 을 모른다.

   한 문제는 두세 글자 낱말이다. 화면에는 한 글자의 초성만 보이고 나머지는 빈칸(○)이다.
     장난 → '○ㄴ',  꽹과리 → '○ㄱ○'
   힌트는 셋이고, 몇 번째 힌트에서 맞혔는지가 점수다(30·20·10점). 점수는 화면이 모으지 않는다 —
   지금 몇 점짜리 힌트인지 보여 주기만 하고, 셈은 선생님이 한다(2026-11-09 선생님 결정).

   데이터(words.json)의 hint 는 힌트 셋을 ' · ' 로 이은 한 줄이다('손 · 말 · 불').
   다른 문답형과 같은 필드를 쓰므로 선생님용 정답 창이 고치지 않아도 그대로 읽는다.
   검증(scripts/validate-data.mjs)도 이 모듈을 불러 같은 규칙으로 본다 — 규칙을 두 번 적지 않는다. */

/** 힌트 차례대로의 점수. 길이가 곧 힌트 수다. */
export const POINTS = [30, 20, 10];

/** 데이터의 hint 한 줄에서 힌트를 가르는 말 */
export const HINT_SEP = ' · ';

/** 문제 글자에서 '여기는 비었다'를 뜻하는 표시 */
export const BLANK_MARK = '○';

// 한글 음절의 초성 19개 (유니코드 순서 그대로 — 이 순서로 나눠떨어진다)
const LEAD = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
              'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/** 한글 음절 하나의 초성. 음절이 아니면 null. 겹자음은 그대로(꼬 → ㄲ). */
export function leadOf(syllable) {
  const at = syllable.charCodeAt(0) - 0xac00;
  return at >= 0 && at < 11172 ? LEAD[Math.floor(at / 588)] : null;
}

/** 'hint' 한 줄 → 힌트 배열. '손 · 말 · 불' → ['손', '말', '불'] */
export function hintsOf(hint) {
  return String(hint).split(HINT_SEP).map((h) => h.trim());
}

/** n 번째 힌트(1부터)까지 열렸을 때 맞히면 받는 점수 */
export function pointsAt(step) {
  return POINTS[Math.min(Math.max(step, 1), POINTS.length) - 1];
}

/** 문제 글자를 칸으로 — '○ㄴ' → [{ blank: true }, { blank: false, text: 'ㄴ' }] */
export function tilesOf(prompt) {
  return [...prompt].map((ch) => (ch === BLANK_MARK ? { blank: true } : { blank: false, text: ch }));
}

/** 정답에서 문제 글자를 만든다 — at 번째(0부터) 글자의 초성만 남긴다. */
export function maskOf(answer, at) {
  return [...answer].map((ch, i) => (i === at ? leadOf(ch) : BLANK_MARK)).join('');
}

/** 문제 글자가 정답과 맞는가. 맞으면 null, 아니면 무엇이 틀렸는지 한 줄.
   - 정답은 한글 두세 글자
   - 칸 수가 정답 글자 수와 같다
   - 초성이 보이는 칸은 꼭 하나이고, 그 칸의 초성은 정답 그 글자의 초성이다(겹자음 그대로) */
export function maskProblem(prompt, answer) {
  // 한글 음절인지는 leadOf 로 본다 — 정규식으로 음절 구간을 적으면 구간의 끝 글자가
  // 웹폰트 서브셋에 없어 폰트 검사(주석·코드까지 읽는다)가 경고한다.
  const p = [...prompt];
  const a = [...answer];
  if (a.length < 2 || a.length > 3 || a.some((ch) => leadOf(ch) === null)) {
    return `정답은 한글 두세 글자여야 합니다 — '${answer}'`;
  }
  if (p.length !== a.length) return `칸 수(${p.length})가 정답 글자 수(${a.length})와 다릅니다 — '${prompt}'`;
  const shown = p.map((ch, i) => (ch === BLANK_MARK ? -1 : i)).filter((i) => i >= 0);
  if (shown.length !== 1) return `초성이 보이는 칸은 하나여야 합니다 — '${prompt}'`;
  const at = shown[0];
  const want = leadOf(a[at]);
  if (p[at] !== want) {
    return `${at + 1}번째 칸은 '${a[at]}' 의 초성 '${want}' 이어야 합니다 — '${prompt}'`;
  }
  return null;
}
