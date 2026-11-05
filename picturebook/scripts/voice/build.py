# 그림책 낭독 음성 생성기 — 책마다 제목·장면 글·마지막 질문을 AI 음성으로 미리 만듭니다.
#
# 짬짬이 그리기의 draw/scripts/voice/build.py 를 그림책에 맞게 옮긴 것입니다.
# 음성은 Supertonic 3(Supertone, OpenRAIL-M)으로 이 컴퓨터에서 만듭니다. 키·사용량 제한이 없습니다.
# 책 하나 · 목소리 하나가 MP3 파일 하나이고(PRD F3), 문장마다의 구간(시작·길이 초)을 data/voice.json 에 적습니다.
# 파일 이름에 글 해시가 들어 있어, 글을 고친 책만 다시 만들고 브라우저 캐시도 그 파일만 바뀝니다.
#
#   pip install supertonic soundfile imageio-ffmpeg faster-whisper   (처음 한 번 — 모델은 첫 실행 때 받습니다)
#   python scripts/voice/build.py                         → 바뀐 책만 다시 만듭니다
#   python scripts/voice/build.py --force                 → 전부 다시 만듭니다
#   python scripts/voice/build.py --force golden-axe      → 고른 책만 무조건 다시 만듭니다
#
# 그리기와 다른 점
#   - 한 파일 안에 [제목] [장면 1] … [장면 N] [질문] 이 차례로 들어 있습니다. 읽기 화면은 장면 구간만 틀고
#     멈춘 뒤 다음 장으로 넘깁니다. 구간 사이 무음(SEGMENT_GAP)을 문장 사이(GAP)보다 길게 두어, 멈추는 시점이
#     조금 늦어도 다음 장면 첫 소리가 새어 나오지 않게 했습니다.
#   - 음량 정규화(PRD 8장 4): 말소리 구간의 RMS 를 TARGET_DBFS 에 맞추고, 봉우리는 PEAK 를 넘지 않게 합니다.
#     목소리·책이 바뀌어도 교실 스피커 음량이 비슷합니다.
#   - 큰따옴표는 화면에만 쓰고 읽을 때는 뺍니다.
#   - 여러 번 읽혀 보고 고르기(TAKES): Supertonic 은 같은 문장도 만들 때마다 조금씩 다르게 읽습니다
#     (2026-11-04 시험: '퐁당'이 어떤 때는 [폭당]처럼 들림). 문장마다 최대 TAKES 번 만들어 Whisper 로 받아 적고,
#     원문과 가장 가까운 것을 씁니다. 받아쓰기가 원문과 똑같으면 바로 멈춥니다. faster-whisper 가 필요합니다.
#   - ffmpeg 가 PATH 에 없으면 imageio-ffmpeg 에 든 실행 파일을 씁니다(이 컴퓨터가 그렇습니다).
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
BOOKS = ROOT / 'books'
MANIFEST = ROOT / 'data' / 'voice.json'
AUDIO = ROOT / 'audio'

MODEL = 'supertonic-3'
# 화면에서 고르는 목소리 — 순서가 곧 화면의 단추 순서입니다(PRD D4·F4). 책마다 둘 다 만듭니다.
# 2026-11-04 사용자가 같은 문단 비교 청취(Supertonic 10명, Qwen3-TTS, Chatterbox, 엣지, OmniVoice)로 F5·M2 를 골랐습니다.
VOICES = {'F5': '여자 목소리', 'M2': '남자 목소리'}
SPEED = 1.0          # 그리기에서 샘플을 듣고 고른 속도
STEPS = 10           # 품질 단계(클수록 좋고 느립니다)
GAP = 0.4            # 한 장면 안 문장 사이 무음(초)
SEGMENT_GAP = 1.0    # 제목·장면·질문 사이 무음(초)
BITRATE = '32k'      # 말소리 모노 — 1초에 약 4KB
TARGET_DBFS = -20.0  # 말소리 구간 RMS 목표
PEAK = 0.95          # 봉우리 상한(약 -0.4dBFS)
TAKES = 4            # 문장마다 최대 몇 번 만들어 보고 고를지
WHISPER = 'small'    # 고를 때 쓰는 받아쓰기 모델(verify.py 기본값과 같음)


def ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def segments_of(book):
    """읽는 차례대로 [(구간 이름, [문장, ...]), ...]."""
    segs = [('title', [book['title']])]
    segs += [(f'p{i + 1:02d}', page['text']) for i, page in enumerate(book['pages'])]
    segs.append(('question', [book['question']]))
    return segs


# 검증 스크립트(앞으로 만들 validate)와 같은 계산이어야 합니다 — 글이 바뀌었는지 같은 기준으로 봅니다.
def text_hash(book):
    texts = [t for _, seg in segments_of(book) for t in seg]
    return hashlib.sha1('\n'.join(texts).encode('utf-8')).hexdigest()[:10]


# 읽을 때만 바꾸는 표기 — 화면 글은 그대로 두고, 음성 합성에 넘기는 글만 표준 발음대로 적습니다.
# 2026-11-04 F5 가 '산골'을 열두 번 만들어도 늘 [상골]로 읽었습니다. '산꼴'·쉼표·'산골짜기'도 그대로였고,
# '산 골'처럼 띄어 넘기면 네 번 모두 [산골]로 들렸습니다.
# 여기를 고쳐도 글 해시는 그대로라 build.py 가 저절로 다시 만들지 않습니다 — retake.py 로 그 문장만 다시 만듭니다.
SAY = {'산골': '산 골'}


def spoken(text):
    text = text.replace('"', '').replace('“', '').replace('”', '').strip()
    for written, said in SAY.items():
        text = text.replace(written, said)
    return text


# 띄어쓰기·문장 부호를 빼고 글자만 남깁니다(verify.py 도 이것을 씁니다).
def norm(s):
    return ''.join(c for c in s if unicodedata.category(c)[0] in 'LN')


class Judge:
    """받아쓰기가 원문과 얼마나 같은지(0~1) 잽니다."""

    def __init__(self):
        from faster_whisper import WhisperModel
        self.model = WhisperModel(WHISPER, device='cpu', compute_type='int8')

    def score(self, wav, sr, text):
        n = int(len(wav) * 16000 / sr)
        x = np.interp(np.linspace(0, len(wav) - 1, n), np.arange(len(wav)), wav).astype(np.float32)
        segs, _ = self.model.transcribe(x, language='ko', beam_size=5)
        heard = ''.join(s.text for s in segs)
        return SequenceMatcher(None, norm(text), norm(heard)).ratio()


def normalize(x, sr):
    frame = int(sr * 0.02)
    n = len(x) // frame
    rms = np.sqrt(np.mean(x[: n * frame].reshape(n, frame) ** 2, axis=1) + 1e-12)
    voiced = rms > 10 ** (-45 / 20)
    level = np.sqrt(np.mean(rms[voiced] ** 2)) if voiced.any() else np.sqrt(np.mean(x ** 2) + 1e-12)
    gain = 10 ** (TARGET_DBFS / 20) / level
    peak = np.max(np.abs(x)) + 1e-12
    gain = min(gain, PEAK / peak)
    return (x * gain).astype(np.float32), round(20 * np.log10(gain), 2)


def synthesize(tts, judge, voice, book):
    style = tts.get_voice_style(voice)
    sr = tts.sample_rate
    chunks, t = [], 0.0
    entry = {'pages': []}
    scores = []

    def take(text):
        best, best_r = None, -1.0
        for _ in range(TAKES if judge else 1):
            wav, _ = tts.synthesize(spoken(text), style, total_steps=STEPS, speed=SPEED, lang='ko')
            wav = np.asarray(wav, dtype=np.float32).reshape(-1)
            if not judge:
                return wav
            r = judge.score(wav, sr, text)
            if r > best_r:
                best, best_r = wav, r
            if r >= 1:
                break
        scores.append((round(best_r, 2), text))
        return best

    def silence(sec):
        nonlocal t
        chunks.append(np.zeros(int(sr * sec), dtype=np.float32))
        t += int(sr * sec) / sr

    silence(GAP)
    segs = segments_of(book)
    for k, (name, texts) in enumerate(segs):
        parts = []
        for j, text in enumerate(texts):
            if j:
                silence(GAP)
            wav = take(text)
            parts.append([round(t, 3), round(len(wav) / sr, 3)])
            chunks.append(wav)
            t += len(wav) / sr
        if name == 'title':
            entry['title'] = parts[0]
        elif name == 'question':
            entry['question'] = parts[0]
        else:
            entry['pages'].append(parts)
        silence(SEGMENT_GAP if k < len(segs) - 1 else GAP)
    audio, gain_db = normalize(np.concatenate(chunks), sr)
    entry['duration'] = round(t, 3)
    return audio, sr, entry, gain_db, scores


def main(argv):
    sys.stdout.reconfigure(encoding='utf-8')
    force_all = '--force' in argv
    force_ids = {a for a in argv if not a.startswith('--')}
    books = [json.loads(p.read_text('utf-8')) for p in sorted(BOOKS.glob('*/book.json'))]
    old = json.loads(MANIFEST.read_text('utf-8')) if MANIFEST.exists() else {}
    settings = {'model': MODEL, 'speed': SPEED, 'steps': STEPS, 'gap': GAP, 'segmentGap': SEGMENT_GAP,
                'bitrate': BITRATE, 'targetDbfs': TARGET_DBFS, 'takes': TAKES, 'whisper': WHISPER}
    same_settings = old.get('settings') == settings
    exe = ffmpeg()

    tts = judge = None
    out = {
        'settings': settings,
        'voices': [{'id': v, 'label': label} for v, label in VOICES.items()],
        'credit': 'Supertonic 3 (Supertone) 로 만든 AI 음성',
        'books': {},
    }
    made = 0
    for b in books:
        h = text_hash(b)
        entry = {'hash': h}
        prev = old.get('books', {}).get(b['id'], {})
        for v in VOICES:
            rel = f'audio/{v}/{b["id"]}-{h}.mp3'
            forced = force_all and (not force_ids or b['id'] in force_ids)
            keep = same_settings and prev.get('hash') == h and v in prev and (ROOT / rel).exists() and not forced
            if keep:
                entry[v] = prev[v]
                continue
            if tts is None:
                from supertonic import TTS
                tts = TTS(model=MODEL)
                judge = Judge() if TAKES > 1 else None
            audio, sr, info, gain_db, scores = synthesize(tts, judge, v, b)
            (ROOT / rel).parent.mkdir(parents=True, exist_ok=True)
            # Windows 에서는 열어 둔 임시 파일을 ffmpeg 가 다시 열 수 없어, 임시 폴더를 씁니다.
            with tempfile.TemporaryDirectory() as tmp:
                wav = Path(tmp) / 'voice.wav'
                sf.write(wav, audio, sr)
                subprocess.run([exe, '-loglevel', 'error', '-y', '-i', str(wav),
                                '-ac', '1', '-ar', '24000', '-b:a', BITRATE, str(ROOT / rel)], check=True)
            # 같은 책의 옛 파일은 지웁니다.
            for f in (ROOT / rel).parent.glob(f'{b["id"]}-*.mp3'):
                if f.name != Path(rel).name:
                    f.unlink()
            entry[v] = {'file': rel, **info}
            made += 1
            scenes = [round(sum(d for _, d in p) + GAP * (len(p) - 1), 1) for p in info['pages']]
            print(f'{b["id"]:<15} {v} 장면 {len(scenes)}개 · 전체 {info["duration"]:.0f}초 · 음량 {gain_db:+.1f}dB')
            print(f'{"":<15}    장면별 낭독(초) {scenes}')
            exact = sum(1 for r, _ in scores if r >= 1)
            if scores:
                print(f'{"":<15}    받아쓰기가 원문과 똑같은 문장 {exact}/{len(scores)}')
        out['books'][b['id']] = entry

    # 목록에서 빠진 책의 파일도 지웁니다.
    live = {e[v]['file'] for e in out['books'].values() for v in VOICES}
    for f in AUDIO.glob('*/*.mp3'):
        if f.relative_to(ROOT).as_posix() not in live:
            f.unlink()

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    size = sum(f.stat().st_size for f in AUDIO.glob('*/*.mp3'))
    print(f'data/voice.json — 책 {len(books)}권 · 새로 만든 파일 {made}개 · 음성 전체 {size / 1e6:.1f}MB')


if __name__ == '__main__':
    main(sys.argv[1:])
