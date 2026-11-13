# 낭독에서 고른 문장만 다시 만들어 끼워 넣습니다 — 나머지 문장은 그대로 둡니다.
#
#   python scripts/voice/retake.py golden-axe omni-m:0,2,24 vox-f:1              (문장 번호 = verify.py 의 #번호)
#   python scripts/voice/retake.py golden-axe omni-m:0=금도끼,은도끼 vox-f:1=산골   (= 뒤 낱말이 모두 들리는 것을 먼저 고릅니다)
#   python scripts/voice/retake.py golden-axe omni-m:0 --takes 16
#
# 한 번 실행에서 목소리마다 MP3 를 한 번만 다시 굽습니다. MP3 는 다시 구울 때마다 조금씩 낡으니,
# 고칠 문장은 한 번에 모아 넘깁니다(같은 목소리를 여러 인자로 나눠 써도 됩니다).
#
# 언제 쓰나: verify.py 가 "다르다"고 한 문장 가운데, 자르는 여백을 바꿔 받아 적어도 늘 같게 틀리는 것(CLAUDE.md).
# 고르는 법: 문장마다 TAKES 번 새로 만들어, 하나씩 **실제 MP3 에 끼워 넣어 본 뒤** 그 자리를 앞뒤 여백 네 가지로 잘라
#   받아 적습니다. 낱개 소리로 재면 맞게 들리던 것이 MP3 에 들어간 뒤에는 틀리게 들리기도 해서
#   (2026-11-04 '산골'·'도끼'에서 확인), 실제로 나갈 소리로 잽니다. 지금 들어 있는 소리도 같은 방법으로 재서
#   새것이 더 나을 때만 바꿉니다. 끼워 넣는 소리는 빼낸 소리와 같은 음량으로 맞춥니다.
# = 낱말: 문장 전체 점수는 받아쓰기 버릇(나무꾼 → '나뭇군')에 묻혀 비슷해지기 쉽습니다. 고치려는 낱말을 주면
#   여백 네 가지 가운데 그 낱말이 모두 들린 횟수로 먼저 줄을 세우고, 같으면 문장 점수로 고릅니다.
# 바꾼 문장 뒤의 구간 시각은 길이 차이만큼 밀고 data/voice.json 을 고칩니다. 글이 그대로라 파일 이름도 그대로입니다.
# 주의: build.py --force 로 그 책을 다시 만들면 여기서 고른 것도 새로 뽑힙니다.
import json
import subprocess
import sys
import tempfile
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import (BITRATE, BOOKS, MANIFEST, PEAK, ROOT, WHISPER,  # noqa: E402
                   ffmpeg, norm, segments_of, spoken, trim)
from engine import Speaker  # noqa: E402
from verify import decode, spans  # noqa: E402

SR = 24000                                                 # MP3 의 표본 주파수(build.py 와 같음)
PADS = [(0.0, 0.05), (0.1, 0.15), (0.3, 0.3), (0.5, 0.5)]  # 자를 때 문장 앞뒤로 더 넣는 길이(초)
TAKES = 12


def resample(wav, sr_in, sr_out):
    """ffmpeg 로 표본 주파수를 바꿉니다(build.py 가 MP3 로 바꿀 때와 같은 변환기)."""
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / 'in.wav'
        sf.write(src, wav, sr_in, subtype='FLOAT')
        raw = subprocess.run([ffmpeg(), '-loglevel', 'error', '-i', str(src), '-f', 'f32le', '-ac', '1',
                              '-ar', str(sr_out), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def encode(x, dst):
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / 'voice.wav'
        sf.write(wav, x, SR)
        subprocess.run([ffmpeg(), '-loglevel', 'error', '-y', '-i', str(wav),
                        '-ac', '1', '-ar', str(SR), '-b:a', BITRATE, str(dst)], check=True)


def voiced_rms(x, sr):
    frame = int(sr * 0.02)
    n = len(x) // frame
    rms = np.sqrt(np.mean(x[: n * frame].reshape(n, frame) ** 2, axis=1) + 1e-12)
    voiced = rms > 10 ** (-45 / 20)
    return float(np.sqrt(np.mean(rms[voiced] ** 2))) if voiced.any() else float(np.sqrt(np.mean(x ** 2)) + 1e-12)


class Judge:
    def __init__(self):
        from faster_whisper import WhisperModel
        self.model = WhisperModel(WHISPER, device='cpu', compute_type='int8')

    def score(self, x16, s, d, text, must):
        """16kHz 전체 소리에서 [s, s+d] 문장을 여백 네 가지로 잘라 받아 적습니다 → (줄 세울 값, 들린 것들)."""
        rs, heard = [], []
        for pre, post in PADS:
            clip = x16[int(max(s - pre, 0) * 16000): int((s + d + post) * 16000)]
            segs, _ = self.model.transcribe(clip, language='ko', beam_size=5)
            h = ''.join(t.text for t in segs).strip()
            rs.append(SequenceMatcher(None, norm(text), norm(h)).ratio())
            heard.append(h)
        hits = sum(all(norm(w) in norm(h) for w in must) for h in heard) if must else 0
        return (hits, round(float(np.mean(rs)), 3)), heard


def perfect(rank, must):
    return rank == (len(PADS) if must else 0, 1.0)


def parse_jobs(args):
    """'omni-m:0,24=금도끼' 같은 인자들 → {목소리: [(문장 번호, [낱말, ...]), ...]} (넘긴 차례 그대로)."""
    jobs = {}
    for arg in args:
        voice, rest = arg.split(':', 1)
        idxs, _, words = rest.partition('=')
        for i in idxs.split(','):
            jobs.setdefault(voice, []).append((int(i), [w for w in words.split(',') if w]))
    return jobs


def set_span(entry, i, span, delta):
    """i 번째 문장 구간을 span 으로 바꾸고, 그 뒤 구간들은 delta 초만큼 밉니다."""
    start = spans(entry)[i][0]
    refs = [('title', None)] + [('pages', (p, j)) for p, page in enumerate(entry['pages']) for j in range(len(page))]
    refs.append(('question', None))
    for k, (key, pos) in enumerate(refs):
        cur = entry[key] if pos is None else entry['pages'][pos[0]][pos[1]]
        if k == i:
            new = span
        elif cur[0] > start:
            new = [round(cur[0] + delta, 3), cur[1]]
        else:
            continue
        if pos is None:
            entry[key] = new
        else:
            entry['pages'][pos[0]][pos[1]] = new
    entry['duration'] = round(entry['duration'] + delta, 3)


def main(argv):
    sys.stdout.reconfigure(encoding='utf-8')

    def option(name, default):
        nonlocal argv
        if name not in argv:
            return default
        k = argv.index(name)
        value = argv[k + 1]
        argv = argv[:k] + argv[k + 2:]
        return value

    takes = int(option('--takes', TAKES))
    book_id, jobs = argv[0], parse_jobs(argv[1:])
    book = json.loads((BOOKS / book_id / 'book.json').read_text('utf-8'))
    texts = [t for _, seg in segments_of(book) for t in seg]
    manifest = json.loads(MANIFEST.read_text('utf-8'))

    speaker = Speaker()
    judge = Judge()
    with tempfile.TemporaryDirectory() as tmp:
        trial = Path(tmp) / 'trial.mp3'
        for voice, items in jobs.items():
            entry = manifest['books'][book_id][voice]
            path = ROOT / entry['file']
            x = decode(path, SR).copy()
            changed = 0
            for i, must in items:
                s, d = spans(entry)[i]
                a, b = int(round(s * SR)), int(round((s + d) * SR))
                old = x[a:b]
                if changed:  # 앞에서 바꾼 것까지 들어간 지금 소리로 잽니다
                    encode(x, trial)
                    now = decode(trial)
                else:
                    now = decode(path)
                best_rank, best_heard = judge.score(now, s, d, texts[i], must)
                print(f'{voice} #{i} "{texts[i]}"' + (f'  (꼭 들려야 할 낱말: {", ".join(must)})' if must else ''))
                print(f'    지금 {best_rank}  {" | ".join(best_heard)}', flush=True)
                best = None
                for k in range(takes):
                    if perfect(best_rank, must):
                        break
                    # build.py 가 쓴 seed(take 0~3)와 겹치지 않게 뒤에서부터 씁니다
                    wav, sr = speaker.say(voice, spoken(texts[i]), take=1000 + k)
                    new = resample(trim(wav, sr), sr, SR)
                    new *= voiced_rms(old, SR) / voiced_rms(new, SR)
                    new *= min(1.0, PEAK / (np.max(np.abs(new)) + 1e-12))
                    y = np.concatenate([x[:a], new, x[b:]])
                    encode(y, trial)  # 실제로 나갈 소리로 잽니다
                    rank, heard = judge.score(decode(trial), s, len(new) / SR, texts[i], must)
                    if rank > best_rank:
                        best, best_rank, best_heard = (y, new), rank, heard
                if best is None:
                    print('    새로 만든 것 가운데 더 나은 것이 없어 그대로 둡니다.')
                    continue
                x, new = best
                delta = len(new) / SR - d
                set_span(entry, i, [round(s, 3), round(len(new) / SR, 3)], delta)
                changed += 1
                print(f'    새것 {best_rank}  {" | ".join(best_heard)}  (길이 {delta:+.2f}초)', flush=True)
            if changed:
                encode(x, path)
                print(f'{entry["file"]} — 문장 {changed}개 바꿈 · 전체 {entry["duration"]:.1f}초')
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', 'utf-8')


if __name__ == '__main__':
    main(sys.argv[1:])
