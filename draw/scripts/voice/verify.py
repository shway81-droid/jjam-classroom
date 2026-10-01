# 만든 음성을 음성 인식(Whisper)으로 다시 받아 적어 원문과 비교합니다 — 잘못 읽은 문장을 찾습니다.
#
#   pip install faster-whisper
#   python3 scripts/voice/verify.py [모델 폴더 또는 이름(기본 small)] [그림 id ...]
#
# 띄어쓰기·문장 부호는 빼고 글자로만 비교합니다. 받아쓰기 자체도 틀릴 수 있으므로,
# 다르다고 나온 문장은 사람이 들어 보고 판단합니다.
import json
import subprocess
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[2]


def norm(s):
    return ''.join(c for c in s if unicodedata.category(c)[0] in 'LN')


def decode(path, sr=16000):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(path), '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def main(argv):
    model_name = argv[0] if argv else 'small'
    only = set(argv[1:])
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    drawings = json.loads((ROOT / 'data' / 'drawings.json').read_text('utf-8'))['drawings']
    manifest = json.loads((ROOT / 'data' / 'voice.json').read_text('utf-8'))
    voices = [v['id'] for v in manifest['voices']]
    total, bad = 0, []
    for d in drawings:
        if only and d['id'] not in only:
            continue
        texts = [d['setupSay']] + [s['teacherSay'] for s in d['steps']]
        for v in voices:
            e = manifest['drawings'][d['id']][v]
            x = decode(ROOT / e['file'])
            for i, (start, dur) in enumerate(e['parts']):
                clip = x[int((start - 0.1) * 16000): int((start + dur + 0.15) * 16000)]
                segs, _ = model.transcribe(clip, language='ko', beam_size=5)
                heard = ''.join(s.text for s in segs).strip()
                ratio = SequenceMatcher(None, norm(texts[i]), norm(heard)).ratio()
                total += 1
                if ratio < 1:
                    bad.append((ratio, d['id'], v, i, texts[i], heard))
        print(f'{d["id"]} 확인', flush=True)
    bad.sort()
    print(f'\n문장 {total}개 중 받아쓰기가 원문과 다른 것 {len(bad)}개')
    for ratio, id_, v, i, want, heard in bad:
        print(f'  {ratio:.2f} {id_} {v} #{i}  원문: {want}\n{"":>8}들림: {heard}')


if __name__ == '__main__':
    main(sys.argv[1:])
