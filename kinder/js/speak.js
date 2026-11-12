/* —— 낱말 읽어 주기 (브라우저 음성 합성) ——
   글자를 아직 못 읽는 아이가 그림과 소리를 함께 잇게 한다.
   음성 파일은 두지 않는다 — 기기에 깔린 한국어 목소리를 빌려 쓴다.
   한국어 목소리가 없는 기기(일부 전자칠판·리눅스)에서는 버튼을 아예 숨긴다.
   눌러도 아무 소리가 안 나는 버튼은 아이들 앞에서 선생님을 곤란하게 만든다. */

let voice = null;

function pickVoice() {
  const all = window.speechSynthesis.getVoices();
  voice = all.find((v) => v.lang === 'ko-KR') || all.find((v) => /^ko/i.test(v.lang)) || null;
}

/** 한국어 목소리가 있는지 알려 준다. 목소리 목록은 늦게 오기도 해서 바뀔 때마다 다시 알린다. */
export function initSpeech(onReady) {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    onReady(false);
    return;
  }
  pickVoice();
  onReady(!!voice);
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    pickVoice();
    onReady(!!voice);
  });
}

/** 천천히, 또박또박. 앞에 읽던 것은 끊는다. */
export function say(text) {
  if (!voice) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.8;
  u.pitch = 1.1;
  synth.speak(u);
}

export function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
