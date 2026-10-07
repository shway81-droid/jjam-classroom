"""picks.json 에 고른 사진으로 words.json 에 인물을 넣고 WebP 를 굽는다.
picks.json: {"<topic>_<이름>": {"idx": 0, "box": [l,t,r,b] (선택, 0~1 비율)} 또는 "skip"}
hints.tsv: 분야·정답·난이도·설명·also"""
import json, os, re, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from gather import faces, crop_portrait, OK_LIC
def crop_box(img, face, r=0.78, mult=3.4, eye=0.36):
    W, H = img.size
    fx, fy, fw, fh = face
    ch = fh * mult; cw = ch * r
    if cw > W: cw = W; ch = cw / r
    if ch > H: ch = H; cw = ch * r
    cx = fx + fw / 2; cy = fy + fh / 2
    left = min(max(cx - cw / 2, 0), W - cw)
    top = min(max(cy - eye * ch, 0), H - ch)
    return (left / W, top / H, (left + cw) / W, (top + ch) / H)
WORD = '/home/user/jjam-classroom/word'
LEAD = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
def cho(w):
    return ''.join(LEAD[(ord(c) - 0xAC00) // 588] for c in w if 0 <= ord(c) - 0xAC00 < 11172)

hints = {}
for line in open('hints.tsv', encoding='utf-8'):
    if line.startswith('#') or not line.strip(): continue
    topic, ans, level, desc, also = (line.rstrip('\n').split('\t') + [''])[:5]
    hints[(topic, ans)] = dict(level=level, desc=desc, also=[a for a in also.split('/') if a])

picks = json.load(open('picks.json', encoding='utf-8'))
data = json.load(open(f'{WORD}/data/words.json', encoding='utf-8'))
items = data['items']
people = [it for it in items if it['type'] == 'person']
next_id = max(int(it['id'].split('-')[1]) for it in people) + 1
have = {it['answer'] for it in people}
order = ['가수', '배우', '예능인']
added = []
for topic in order:
    for key, p in picks.items():
        if p == 'skip' or not key.startswith(topic + '_'): continue
        meta = json.load(open(f'out/{key}/meta.json', encoding='utf-8'))
        ans = meta['ko']
        assert ans not in have, ans
        h = hints[(topic, ans)]
        c = next(c for c in meta['cands'] if c['idx'] == p['idx'])
        assert OK_LIC.match(c['nlicense']), (ans, c['nlicense'])
        img = Image.open(f"out/{key}/cand-{p['idx']}.jpg").convert('RGB')
        W, H = img.size
        if 'box' in p:
            l, t, r, b = p['box']
        else:
            fs = faces(img)
            # crop_portrait 가 고른 상자를 비율로 되돌린다
            l, t, r, b = crop_box(img, fs[0])
        crop = img.crop((int(l * W), int(t * H), int(r * W), int(b * H)))
        if max(crop.size) > 720:
            crop.thumbnail((720, 720), Image.LANCZOS)
        pid = f'person-{next_id:03d}'; next_id += 1
        crop.save(f'{WORD}/assets/people/{pid}.webp', 'WEBP', quality=80, method=6)
        author = re.sub(r'\s+', ' ', c['artist']).strip()
        if len(author) > 60: author = author[:58].rstrip() + ' …'
        it = {
            'id': pid, 'type': 'person', 'level': h['level'], 'topic': topic, 'prompt': '누구일까요?',
            'hint': f"{cho(ans)} · {h['desc']}", 'answer': ans, 'also': h['also'], 'note': '',
            'photo': {'file': f'assets/people/{pid}.webp', 'author': author, 'license': c['nlicense'], 'source': c['page']},
        }
        added.append(it)
        have.add(ans)
# 분야 묶음 끝에 끼워 넣는다 (번호 = 파일 안 순서)
for topic in order:
    new = [it for it in added if it['topic'] == topic]
    last = max(i for i, it in enumerate(items) if it['type'] == 'person' and it['topic'] == topic)
    items[last + 1:last + 1] = new
open(f'{WORD}/data/words.json', 'w', encoding='utf-8').write(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
from collections import Counter
print('added', len(added), Counter(it['topic'] for it in added), Counter(it['level'] for it in added))
