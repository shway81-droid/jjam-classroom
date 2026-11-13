# VoiceStudio(무료 로컬 음성 앱)의 로컬 API(localhost:3900)로 같은 문단(금도끼 은도끼 3·4장면)을
# 여러 엔진으로 읽혀 들어 볼 견본을 만듭니다. 그림책 음성을 바꿀지 비교할 때만 씁니다.
#   python gen.py samples.json [--out DIR] [--only 이름 ...]
# samples.json: [{"name", "engine", "instruct"?, "ref"?, "ref_text"?, "seed"?, "speed"?}, ...]
#   ref 에 "F5"·"M2" 를 쓰면 지금 그림책 MP3 의 1장면(3.02~12.54초)을 잘라 본뜰 목소리로 넘깁니다.
#   (2026-11-13 그림책 목소리를 vox-f·omni-m 으로 바꾸며 audio/F5·M2 를 지웠습니다. 옛 MP3 는 커밋 54acb13 에 있습니다 —
#    git show 54acb13:picturebook/audio/F5/golden-axe-8f60d7c841.mp3 > ... 로 꺼낸 뒤 ref 에 그 파일 경로를 적습니다.)
#   ref_text 는 넣지 않으면 보내지 않습니다("scene1" 이면 1장면 글). 엔진에 따라 이어 읽기 방식이 바뀔 수 있습니다.
# 결과(저장소 밖): DIR/raw/<name>.wav (앱이 준 그대로), DIR/out/<name>.mp3 (음량 맞춤), DIR/log.jsonl
#   DIR 기본값은 %TEMP%\jjam-voicestudio 입니다. 견본은 커밋하지 않습니다.
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
PB = HERE.parents[2]  # picturebook/
TEXT = ' '.join([
    '그때 연못에서 보글보글 물방울이 올라왔어요.',
    '하얀 수염 산신령이 쑥 나타났지요.',
    '"울지 마라. 내가 도끼를 찾아 주마."',
    '산신령이 반짝반짝 금도끼를 들고 물었어요.',
    '"이 금도끼가 네 도끼냐?"',
    '"아니요, 제 도끼는 금도끼가 아니에요."',
])
# 본뜰 목소리로 자르는 1장면의 글(ref_text 를 받는 엔진에 넘깁니다)
REF_TEXT = '옛날 옛날 깊은 산골에 나무꾼이 살았어요. 나무꾼은 날마다 쿵! 쿵! 나무를 했지요.'
REF_CUT = (3.02, 12.54)
API = 'http://localhost:3900'


def out_dir():
    if '--out' in sys.argv:
        return Path(sys.argv[sys.argv.index('--out') + 1]).resolve()
    return Path(tempfile.gettempdir()) / 'jjam-voicestudio'


def ffmpeg():
    import shutil
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def ref_wav(voice, out):
    """'F5'·'M2' 같은 이름이면 그림책 MP3 에서 1장면을 잘라 wav 로 만들고 그 경로를 돌려줍니다."""
    if not voice or os.path.exists(voice):
        return voice
    mp3 = sorted((PB / 'audio' / voice).glob('golden-axe-*.mp3'))
    if not mp3:
        raise SystemExit(f'본뜰 목소리 {voice!r} 의 MP3 가 picturebook/audio/{voice}/ 에 없습니다')
    wav = out / 'refs' / f'ref-{voice}.wav'
    if not wav.exists():
        wav.parent.mkdir(parents=True, exist_ok=True)
        a, b = REF_CUT
        subprocess.run([ffmpeg(), '-loglevel', 'error', '-y', '-ss', str(a), '-to', str(b), '-i', str(mp3[-1]),
                        '-ar', '24000', '-ac', '1', str(wav)], check=True)
    return str(wav)


def multipart(fields, files):
    b = uuid.uuid4().hex
    out = []
    for k, v in fields.items():
        if v is None:
            continue
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode('utf-8'))
    for k, p in files.items():
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="{Path(p).name}"\r\n'
                   f'Content-Type: audio/wav\r\n\r\n'.encode('utf-8') + Path(p).read_bytes() + b'\r\n')
    out.append(f'--{b}--\r\n'.encode())
    return b''.join(out), f'multipart/form-data; boundary={b}'


def generate(c, out):
    ref = ref_wav(c.get('ref'), out)
    fields = {
        'text': c.get('text', TEXT), 'language': 'ko', 'engine': c.get('engine'),
        'instruct': c.get('instruct'), 'ref_text': REF_TEXT if c.get('ref_text') == 'scene1' else c.get('ref_text'),
        'seed': c.get('seed'), 'speed': c.get('speed', 1.0), 'effect_preset': 'raw', 'pronounce': 'false',
    }
    files = {'ref_audio': ref} if ref else {}
    body, ctype = multipart(fields, files)
    req = urllib.request.Request(API + '/generate', data=body, headers={'Content-Type': ctype}, method='POST')
    t = time.time()
    with urllib.request.urlopen(req, timeout=3600) as r:
        wav = r.read()
        hdr = {k: v for k, v in r.headers.items() if k.lower().startswith('x-')}
    return wav, time.time() - t, hdr


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    configs = json.loads(Path(sys.argv[1]).read_text('utf-8'))
    only = set(sys.argv[sys.argv.index('--only') + 1:]) if '--only' in sys.argv else None
    out = out_dir()
    (out / 'raw').mkdir(parents=True, exist_ok=True)
    (out / 'out').mkdir(exist_ok=True)
    print('결과 폴더:', out, flush=True)
    for c in configs:
        name = c['name']
        if only and name not in only:
            continue
        try:
            wav, secs, hdr = generate(c, out)
        except urllib.error.HTTPError as e:
            print(name, 'HTTP', e.code, e.read()[:400].decode('utf-8', 'replace'), flush=True)
            continue
        except Exception as e:  # noqa: BLE001
            print(name, 'FAIL', repr(e)[:300], flush=True)
            continue
        raw = out / 'raw' / f'{name}.wav'
        raw.write_bytes(wav)
        mp3 = out / 'out' / f'{name}.mp3'
        subprocess.run([ffmpeg(), '-loglevel', 'error', '-y', '-i', str(raw), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
                        '-ar', '44100', '-ac', '1', '-b:a', '128k', str(mp3)], check=True)
        dur = float(hdr.get('X-Audio-Duration') or 0)
        rec = {'name': name, 'engine': c.get('engine'), 'secs': round(secs, 1), 'audio': round(dur, 1),
               'rtf': round(secs / dur, 1) if dur else None, 'dropped': hdr.get('X-OmniVoice-Dropped-Chunks'),
               'routing': hdr.get('X-OmniVoice-Routing')}
        with open(out / 'log.jsonl', 'a', encoding='utf-8') as f:
            f.write(json.dumps(rec, ensure_ascii=False) + '\n')
        print(json.dumps(rec, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
