# 교사 멘트 음성 생성기 — 준비 안내(setupSay)와 단계 멘트(teacherSay)를 AI 음성으로 미리 만듭니다.
#
# 음성은 Supertonic 3(Supertone, OpenRAIL-M)으로 이 컴퓨터에서 만듭니다. 키·사용량 제한이 없습니다.
# 그림 하나 · 목소리 하나가 MP3 파일 하나이고, 문장마다의 구간(시작·길이 초)을 data/voice.json 에 적습니다.
# 파일 이름에 문장 해시가 들어 있어, 문장을 고친 그림만 다시 만들고 브라우저 캐시도 그 파일만 바뀝니다.
#
#   pip install supertonic soundfile      (처음 한 번 — 모델은 첫 실행 때 받습니다)
#   npm run voice                          → 바뀐 그림만 다시 만듭니다
#   npm run voice -- --force               → 전부 다시 만듭니다
#   npm run voice -- --force cat-face      → 고른 그림만 무조건 다시 만듭니다
#
# 문장을 고치면 이것을 돌려야 npm test 가 통과합니다(통합본과 같은 단일 소스 원칙).
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'data' / 'voice.json'
AUDIO = ROOT / 'audio'

MODEL = 'supertonic-3'
# 화면에서 고르는 목소리 — 순서가 곧 화면의 단추 순서입니다.
VOICES = {'F1': '여자 목소리', 'M1': '남자 목소리'}
SPEED = 1.0          # 샘플을 듣고 고른 속도
STEPS = 10           # 품질 단계(클수록 좋고 느립니다)
GAP = 0.4            # 문장 사이 무음(초) — 구간 경계가 조금 어긋나도 말이 잘리지 않게 넉넉히 둡니다
BITRATE = '32k'      # 말소리 모노 — 1초에 약 4KB


def texts_of(drawing):
    return [drawing['setupSay']] + [s['teacherSay'] for s in drawing['steps']]


# validate.mjs 와 같은 계산입니다 — 문장이 바뀌었는지 둘이 같은 기준으로 봅니다.
def text_hash(texts):
    return hashlib.sha1('\n'.join(texts).encode('utf-8')).hexdigest()[:10]


def main(argv):
    force_all = '--force' in argv
    force_ids = {a for a in argv if not a.startswith('--')}
    drawings = json.loads((ROOT / 'data' / 'drawings.json').read_text('utf-8'))['drawings']
    old = json.loads(MANIFEST.read_text('utf-8')) if MANIFEST.exists() else {}
    settings = {'model': MODEL, 'speed': SPEED, 'steps': STEPS, 'gap': GAP, 'bitrate': BITRATE}
    same_settings = old.get('settings') == settings

    tts = None
    out = {
        'settings': settings,
        'voices': [{'id': v, 'label': label} for v, label in VOICES.items()],
        'credit': 'Supertonic 3 (Supertone) 로 만든 AI 음성',
        'drawings': {},
    }
    made = 0
    for d in drawings:
        texts = texts_of(d)
        h = text_hash(texts)
        entry = {'hash': h}
        prev = old.get('drawings', {}).get(d['id'], {})
        for v in VOICES:
            rel = f'audio/{v}/{d["id"]}-{h}.mp3'
            forced = force_all and (not force_ids or d['id'] in force_ids)
            keep = same_settings and prev.get('hash') == h and v in prev and (ROOT / rel).exists() and not forced
            if keep:
                entry[v] = prev[v]
                continue
            if tts is None:
                from supertonic import TTS
                tts = TTS(model=MODEL)
            style = tts.get_voice_style(v)
            sr = tts.sample_rate
            gap = np.zeros(int(sr * GAP), dtype=np.float32)
            chunks, parts, t = [gap], [], GAP
            for text in texts:
                wav, _ = tts.synthesize(text, style, total_steps=STEPS, speed=SPEED, lang='ko')
                wav = np.asarray(wav, dtype=np.float32).reshape(-1)
                parts.append([round(t, 3), round(len(wav) / sr, 3)])
                chunks += [wav, gap]
                t += len(wav) / sr + GAP
            (ROOT / rel).parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
                sf.write(tmp.name, np.concatenate(chunks), sr)
                subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp.name,
                                '-ac', '1', '-ar', '24000', '-b:a', BITRATE, str(ROOT / rel)], check=True)
            # 같은 그림의 옛 파일은 지웁니다.
            for f in (ROOT / rel).parent.glob(f'{d["id"]}-*.mp3'):
                if f.name != Path(rel).name:
                    f.unlink()
            entry[v] = {'file': rel, 'parts': parts}
            made += 1
            print(f'{d["id"]:<15} {v} {len(texts)}문장 {round(t, 1)}초')
        out['drawings'][d['id']] = entry

    # 목록에서 빠진 그림의 파일도 지웁니다.
    live = {e[v]['file'] for e in out['drawings'].values() for v in VOICES}
    for f in AUDIO.glob('*/*.mp3'):
        if str(f.relative_to(ROOT)) not in live:
            f.unlink()

    MANIFEST.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    size = sum(f.stat().st_size for f in AUDIO.glob('*/*.mp3'))
    print(f'data/voice.json — 그림 {len(drawings)}개 · 새로 만든 파일 {made}개 · 음성 전체 {size / 1e6:.1f}MB')


if __name__ == '__main__':
    main(sys.argv[1:])
