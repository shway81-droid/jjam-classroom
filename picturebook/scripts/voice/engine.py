# 그림책 낭독 목소리 — 어떤 엔진으로 어떻게 읽힐지 한곳에 모았습니다. build.py·retake.py 가 같이 씁니다.
#
# 2026-11-13 사용자가 같은 문단 비교 청취로 목소리를 바꿨습니다(Supertonic F5·M2 → 아래 둘).
#   - 여자: VoxCPM2 '말로 설계' 견본(VS5) — Apache-2.0
#   - 남자: OmniVoice '말로 설계' 견본(VS2, seed 23) — 모델 가중치 CC-BY-NC(비상업). 무료 교육용으로만 씁니다.
# 두 엔진 모두 무료 로컬 앱 VoiceStudio(debpalash/VoiceStudio) 안에서 돌고, 그 앱의 로컬 API(localhost:3900)로 부릅니다.
# 그래서 음성을 만들 때는 VoiceStudio 를 켜 두어야 합니다(엔진 설치·라이선스 동의는 picturebook/CLAUDE.md).
#
# 문장마다 따로 '말로 설계'를 하면 문장마다 목소리가 조금씩 달라질 수 있습니다. 그래서 고른 견본 문단 자체를
# 본뜰 목소리(refs/*.wav)로 넘겨, 모든 문장이 같은 목소리로 읽히게 합니다. 견본에서 읽은 글이 REF_TEXT 입니다.
import io
import json
import urllib.error
import urllib.request
import uuid
from pathlib import Path

import soundfile as sf

HERE = Path(__file__).resolve().parent
API = 'http://localhost:3900'

# 견본 문단('금도끼 은도끼' 3·4장면) — refs/*.wav 가 읽은 글입니다. 본뜨기 엔진에 함께 넘깁니다.
REF_TEXT = ' '.join([
    '그때 연못에서 보글보글 물방울이 올라왔어요.',
    '하얀 수염 산신령이 쑥 나타났지요.',
    '울지 마라. 내가 도끼를 찾아 주마.',
    '산신령이 반짝반짝 금도끼를 들고 물었어요.',
    '이 금도끼가 네 도끼냐?',
    '아니요, 제 도끼는 금도끼가 아니에요.',
])

# 화면에서 고르는 목소리 — 순서가 곧 화면의 단추 순서입니다(PRD D4·F4). 책마다 둘 다 만듭니다.
# id 는 음성 파일 폴더 이름(audio/<id>/)이자 화면이 기억하는 값입니다.
VOICES = {
    'vox-f': {'label': '여자 목소리', 'engine': 'voxcpm2', 'ref': 'refs/vox-f.wav', 'seed': 7},
    'omni-m': {'label': '남자 목소리', 'engine': 'omnivoice', 'ref': 'refs/omni-m.wav', 'seed': 23},
}
CREDIT = ('AI 음성 — 여자 VoxCPM2(OpenBMB), 남자 OmniVoice(Han Zhu 외, CC-BY-NC). '
          'VoiceStudio 로 만들었습니다')
SPEED = 1.0


def settings():
    """data/voice.json 의 settings 에 들어갈 목소리 설정 — 바뀌면 build.py 가 전부 다시 만듭니다."""
    return {'app': 'VoiceStudio', 'speed': SPEED,
            'voices': {v: {k: c[k] for k in ('engine', 'ref', 'seed')} for v, c in VOICES.items()}}


def _multipart(fields, files):
    b = uuid.uuid4().hex
    out = []
    for k, v in fields.items():
        if v is not None:
            out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode('utf-8'))
    for k, p in files.items():
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="{Path(p).name}"\r\n'
                   f'Content-Type: audio/wav\r\n\r\n'.encode('utf-8') + Path(p).read_bytes() + b'\r\n')
    out.append(f'--{b}--\r\n'.encode())
    return b''.join(out), f'multipart/form-data; boundary={b}'


class Speaker:
    """voice id 와 글을 받아 (소리, 표본 주파수)를 돌려줍니다. take 가 다르면 seed 를 바꿔 다르게 읽힙니다."""

    def __init__(self):
        try:
            with urllib.request.urlopen(API + '/health', timeout=5) as r:
                json.load(r)
        except (urllib.error.URLError, OSError) as e:
            raise SystemExit(f'VoiceStudio 가 켜져 있지 않습니다({API}). 앱을 켠 뒤 다시 실행하세요: {e}')

    def say(self, voice, text, take=0):
        c = VOICES[voice]
        body, ctype = _multipart({
            'text': text, 'language': 'ko', 'engine': c['engine'], 'ref_text': REF_TEXT,
            'seed': c['seed'] + take * 101, 'speed': SPEED, 'effect_preset': 'raw', 'pronounce': 'false',
        }, {'ref_audio': HERE / c['ref']})
        req = urllib.request.Request(API + '/generate', data=body, headers={'Content-Type': ctype}, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=1800) as r:
                data = r.read()
        except urllib.error.HTTPError as e:
            raise RuntimeError(f'{voice} "{text}" — VoiceStudio HTTP {e.code}: '
                               f'{e.read()[:300].decode("utf-8", "replace")}') from None
        wav, sr = sf.read(io.BytesIO(data), dtype='float32', always_2d=True)
        return wav.mean(axis=1), sr

    def unload(self, voice):
        """엔진을 바꾸기 전에 메모리에서 내립니다(두 엔진을 함께 올리면 메모리가 빠듯합니다)."""
        req = urllib.request.Request(f'{API}/model/unload/sidecar:{VOICES[voice]["engine"]}', method='POST')
        try:
            urllib.request.urlopen(req, timeout=60).read()
        except (urllib.error.URLError, OSError):
            pass
