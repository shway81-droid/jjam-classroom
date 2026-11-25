# 낭독에서 고른 문장만 다시 만들어 끼워 넣습니다 — 나머지 문장은 그대로 둡니다.
#
#   python scripts/voice/retake.py golden-axe omni-m:0,2,24 vox-f:1              (문장 번호 = verify.py 의 #번호)
#   python scripts/voice/retake.py golden-axe omni-m:0=금도끼,은도끼 vox-f:1=산골   (= 뒤 낱말이 모두 들리는 것을 먼저 고릅니다)
#   python scripts/voice/retake.py golden-axe omni-m:0 --takes 16
#   python scripts/voice/retake.py goblin-club vox-f:0=도깨비,방망이 --redo   (지금 소리는 빼고 새것 가운데서 고름 — 귀로 틀렸다고 확인한 때)
#   python scripts/voice/retake.py bremen-musicians vox-f:0 --only 12       (사람이 들어 고른 후보 번호를 그대로 끼움 — 받아쓰기로 못 고를 때)
#     같은 seed 는 같은 소리를 내므로, 앞선 실행에서 찍힌 '후보 N' 이 그대로 다시 나옵니다. --redo 를 함께 씁니다.
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
# 끝소리 검사: 받아쓰기는 끝이 살짝 잘린 소리도 맞게 적습니다. 2026-11-24 여자 목소리(VoxCPM2) 제목 세 개가
#   끝 음절 중간에서 10ms 만에 무음으로 뚝 끊겼는데(진단 docs/제목_잘림_진단.md), 하나('도깨비 방망이')는 받아쓰기가 완벽했습니다.
#   그래서 문장 끝 10ms 칸에서 소리가 CUT_DROP dB 넘게 한 번에 떨어지면 '잘림'으로 보고, 받아쓰기가 같으면 안 잘린 것을 고릅니다.
#   지금 들어 있는 소리도 같은 잣대로 재므로, 잘린 소리는 받아쓰기가 완벽해도 바꿀 후보가 됩니다.
#   (재 본 값: 잘린 셋 16~27dB, 정상 아홉 12dB 이하.)
#   진짜 원인은 VoxCPM2 가 짧은 글을 끝 음절 도중에 멈추는 것이라(engine.py 의 title_twice), 제목은 build.say_title 로 두 번 읽혀
#   첫 번째만 씁니다. 그러면 '북'처럼 받침으로 막히며 끝나는 소리는 자연스러워도 낙차가 15dB 를 넘기도 하니, 숫자보다 귀로 확인합니다.
#   = 낱말은 받아쓰기가 실제로 적을 수 있는 것으로 줍니다. '브레멘'은 늘 '프레멘'으로 적혀 낱말 점수가 0 이 되므로 '레멘'으로 줍니다.
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
                   ffmpeg, norm, say_title, segments_of, spoken, trim)
from engine import Speaker  # noqa: E402
from verify import decode, spans  # noqa: E402

SR = 24000                                                 # MP3 의 표본 주파수(build.py 와 같음)
PADS = [(0.0, 0.05), (0.1, 0.15), (0.3, 0.3), (0.5, 0.5)]  # 자를 때 문장 앞뒤로 더 넣는 길이(초)
TAKES = 12
CUT_DROP = 15.0  # 문장 끝 10ms 칸 하나에서 이보다 크게 떨어지면 끝이 잘린 소리로 봅니다(dB)
MIN_RATIO = 0.75  # 새것은 문장 점수가 이 아래면 끝이 깨끗해도 쓰지 않습니다(2026-11-25 '프레멘 음악데?'가 뽑힐 뻔함)


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


def tail_drop(x, sr, s, d):
    """[s, s+d] 문장의 끝에서 10ms 칸 하나에 소리가 가장 크게 떨어진 폭(dB) — 마지막 말소리(-30dB 위) 언저리만 봅니다."""
    seg = x[int(s * sr): int((s + d + 0.1) * sr)]
    f = int(sr * 0.01)
    n = len(seg) // f
    db = 20 * np.log10(np.sqrt(np.mean(seg[: n * f].reshape(n, f) ** 2, axis=1) + 1e-12))
    loud = np.flatnonzero(db > -30)
    if not len(loud):
        return 0.0
    k = loud[-1]
    return round(float(max(db[i] - db[i + 1] for i in range(max(k - 3, 0), min(k + 1, n - 1)))), 1)


class Judge:
    def __init__(self):
        from faster_whisper import WhisperModel
        self.model = WhisperModel(WHISPER, device='cpu', compute_type='int8')

    def score(self, x16, s, d, text, must, cut=False):
        """16kHz 전체 소리에서 [s, s+d] 문장을 여백 네 가지로 잘라 받아 적습니다 → (줄 세울 값, 들린 것들).
        줄 세울 값 = (낱말이 들린 횟수, 끝이 안 잘렸는가, 문장 점수) — 같은 만큼 들리면 안 잘린 것이 앞섭니다."""
        rs, heard = [], []
        for pre, post in PADS:
            clip = x16[int(max(s - pre, 0) * 16000): int((s + d + post) * 16000)]
            segs, _ = self.model.transcribe(clip, language='ko', beam_size=5)
            h = ''.join(t.text for t in segs).strip()
            rs.append(SequenceMatcher(None, norm(text), norm(h)).ratio())
            heard.append(h)
        hits = sum(all(norm(w) in norm(h) for w in must) for h in heard) if must else 0
        return (hits, int(not cut), round(float(np.mean(rs)), 3)), heard


def perfect(rank, must):
    return rank == (len(PADS) if must else 0, 1, 1.0)


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

    redo = '--redo' in argv
    argv = [a for a in argv if a != '--redo']
    only = option('--only', None)
    only = {int(n) for n in only.split(',')} if only else None
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
                    now, now24 = decode(trial), decode(trial, SR)
                else:
                    now, now24 = decode(path), x
                drop = tail_drop(now24, SR, s, d)
                best_rank, best_heard = judge.score(now, s, d, texts[i], must, drop > CUT_DROP)
                print(f'{voice} #{i} "{texts[i]}"' + (f'  (꼭 들려야 할 낱말: {", ".join(must)})' if must else ''))
                print(f'    지금 {best_rank} 끝 {drop}dB  {" | ".join(best_heard)}', flush=True)
                if redo:  # 지금 것은 귀로 틀렸다고 확인했으니 후보에서 뺍니다(끝까지 다 만들어 보고 고름)
                    best_rank = (-1, -1, -1.0)
                best = None
                for k in range(takes if only is None else max(only)):
                    if only is not None and k + 1 not in only:
                        continue
                    if only is None and perfect(best_rank, must):
                        break
                    # build.py 가 쓴 seed(take 0~3)와 겹치지 않게 뒤에서부터 씁니다
                    if i == 0:  # 제목 — title_twice 목소리는 두 번 읽혀 첫 번째만(build.say_title)
                        wav, sr = say_title(speaker, voice, spoken(texts[i]), 1000 + k)
                    else:
                        wav, sr = speaker.say(voice, spoken(texts[i]), take=1000 + k)
                    new = resample(trim(wav, sr), sr, SR)
                    new *= voiced_rms(old, SR) / voiced_rms(new, SR)
                    new *= min(1.0, PEAK / (np.max(np.abs(new)) + 1e-12))
                    y = np.concatenate([x[:a], new, x[b:]])
                    encode(y, trial)  # 실제로 나갈 소리로 잽니다
                    drop = tail_drop(decode(trial, SR), SR, s, len(new) / SR)
                    rank, heard = judge.score(decode(trial), s, len(new) / SR, texts[i], must, drop > CUT_DROP)
                    print(f'      후보 {k + 1}: {rank} 끝 {drop}dB  {" | ".join(heard)}', flush=True)
                    if rank > best_rank and (rank[2] >= MIN_RATIO or only is not None):
                        best, best_rank, best_heard = (y, new), rank, heard
                if best is None:
                    print('    새로 만든 것 가운데 더 나은 것이 없어 그대로 둡니다.')
                    continue
                x, new = best
                delta = len(new) / SR - d
                set_span(entry, i, [round(s, 3), round(len(new) / SR, 3)], delta)
                changed += 1
                print(f'    새것 {best_rank}  {" | ".join(best_heard)}  (길이 {delta:+.2f}초)', flush=True)
                if not best_rank[1]:
                    print('    ⚠ 새것도 끝이 잘렸습니다 — --takes 를 늘려 다시 해 보세요.')
            if changed:
                encode(x, path)
                print(f'{entry["file"]} — 문장 {changed}개 바꿈 · 전체 {entry["duration"]:.1f}초')
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', 'utf-8')


if __name__ == '__main__':
    main(sys.argv[1:])
