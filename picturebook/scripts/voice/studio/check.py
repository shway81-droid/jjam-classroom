# gen.py 로 만든 견본(DIR/out/*.mp3)을 받아쓰기(faster-whisper small)로 다시 적어 원문과 견줍니다.
# 빠진 문장·크게 틀린 곳을 찾는 용도입니다. 받아쓰기는 '도끼'→'돋기'처럼 자주 틀리니 점수만 믿지 않습니다.
#   python check.py [--out DIR] [이름 ...]
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

from faster_whisper import WhisperModel

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gen import TEXT, out_dir  # noqa: E402


def norm(s):
    return ''.join(c for c in s if unicodedata.category(c)[0] in 'LN')


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    args = sys.argv[1:]
    if '--out' in args:
        i = args.index('--out')
        del args[i:i + 2]
    only = set(args)
    model = WhisperModel('small', device='cpu', compute_type='int8')
    for p in sorted((out_dir() / 'out').glob('*.mp3')):
        if only and p.stem not in only:
            continue
        segs, _ = model.transcribe(str(p), language='ko', beam_size=5)
        heard = ' '.join(s.text.strip() for s in segs)
        r = SequenceMatcher(None, norm(TEXT), norm(heard)).ratio()
        print(f'{p.stem}\t{r:.3f}\t{heard}', flush=True)


if __name__ == '__main__':
    main()
