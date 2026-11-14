# 만든 낭독을 음성 인식(Whisper)으로 다시 받아 적어 원문과 비교합니다 — 잘못 읽은 문장을 찾습니다.
# 짬짬이 그리기의 draw/scripts/voice/verify.py 를 그림책 구간(제목·장면·질문)에 맞게 옮긴 것입니다.
#
#   pip install faster-whisper
#   python scripts/voice/verify.py [모델 폴더 또는 이름(기본 small)] [책 id ...]
#
# 띄어쓰기·문장 부호는 빼고 글자로만 비교합니다. 받아쓰기 자체도 틀릴 수 있으므로,
# 다르다고 나온 문장은 사람이 들어 보고 판단합니다.
import json
import subprocess
import sys
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import ROOT, BOOKS, MANIFEST, ffmpeg, norm, segments_of  # noqa: E402


def decode(path, sr=16000):
    raw = subprocess.run([ffmpeg(), '-loglevel', 'error', '-i', str(path), '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def spans(entry):
    """segments_of() 와 같은 차례로 문장 구간을 펼칩니다."""
    return [entry['title']] + [p for page in entry['pages'] for p in page] + [entry['question']]


def main(argv):
    sys.stdout.reconfigure(encoding='utf-8')
    model_name = argv[0] if argv else 'small'
    only = set(argv[1:])
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    manifest = json.loads(MANIFEST.read_text('utf-8'))
    voices = [v['id'] for v in manifest['voices']]
    total, bad = 0, []
    for p in sorted(BOOKS.glob('*/book.json')):
        book = json.loads(p.read_text('utf-8'))
        if only and book['id'] not in only:
            continue
        texts = [t for _, seg in segments_of(book) for t in seg]
        for v in voices:
            e = manifest['books'][book['id']][v]
            x = decode(ROOT / e['file'])
            sp = spans(e)
            assert len(sp) == len(texts), (book['id'], v, len(sp), len(texts))
            for i, (start, dur) in enumerate(sp):
                clip = x[int(max(start - 0.1, 0) * 16000): int((start + dur + 0.15) * 16000)]
                segs, _ = model.transcribe(clip, language='ko', beam_size=5)
                heard = ''.join(s.text for s in segs).strip()
                ratio = SequenceMatcher(None, norm(texts[i]), norm(heard)).ratio()
                total += 1
                if ratio < 1:
                    bad.append((ratio, book['id'], v, i, texts[i], heard))
        print(f'{book["id"]} 확인', flush=True)
    bad.sort()
    print(f'\n문장 {total}개 중 받아쓰기가 원문과 다른 것 {len(bad)}개')
    for ratio, id_, v, i, want, heard in bad:
        print(f'  {ratio:.2f} {id_} {v} #{i}  원문: {want}\n{"":>8}들림: {heard}')


if __name__ == '__main__':
    main(sys.argv[1:])
