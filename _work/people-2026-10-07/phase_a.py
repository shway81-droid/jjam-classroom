"""1단계: API 만 써서 후보 사진 정보를 모은다(내려받기 없음). out/<key>/info.json"""
import sys, os, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from gather import gen_infos, norm_license, OK_LIC

def collect(cats, query):
    metas = []
    for c in cats:
        if not c: continue
        got, subs = gen_infos({'generator': 'categorymembers', 'gcmtitle': 'Category:' + c, 'gcmtype': 'file|subcat',
                               'gcmlimit': 40, 'gcmsort': 'timestamp', 'gcmdir': 'desc'})
        metas += got
        if len(got) < 6:
            for sc in sorted([x for x in subs if re.search(r'20\d\d', x)], reverse=True)[:1]:
                metas += gen_infos({'generator': 'categorymembers', 'gcmtitle': 'Category:' + sc, 'gcmtype': 'file', 'gcmlimit': 30})[0]
        if metas: break
    if len(metas) < 3 and query:
        metas += gen_infos({'generator': 'search', 'gsrsearch': query, 'gsrnamespace': 6, 'gsrlimit': 20})[0]
    good, seen = [], set()
    for m in metas:
        if m['title'] in seen: continue
        seen.add(m['title'])
        m['nlicense'] = norm_license(m['license'])
        if not OK_LIC.match(m['nlicense']): continue
        if min(m['w'], m['h']) < 450: continue
        good.append(m)
    def pre(m):
        y = re.search(r'(20\d\d)', (m.get('date') or '') + ' ' + m['title'])
        return (int(y.group(1)) if y else 2000) + (1.5 if m['h'] >= m['w'] else 0)
    good.sort(key=pre, reverse=True)
    return len(metas), good

if __name__ == '__main__':
    for f in sys.argv[1:]:
        for line in open(f, encoding='utf-8'):
            if not line.strip() or line.startswith('#'): continue
            topic, ko, cats, query = (line.rstrip('\n').split('\t') + ['', '', ''])[:4]
            key = topic + '_' + ko.replace(' ', '_')
            d = os.path.join('out', key); os.makedirs(d, exist_ok=True)
            p = os.path.join(d, 'info.json')
            if os.path.exists(p): continue
            n, good = collect(cats.split('|'), query)
            json.dump({'key': key, 'topic': topic, 'ko': ko, 'n': n, 'good': good}, open(p, 'w'), ensure_ascii=False, indent=1)
            print(f'{topic}\t{ko}\tfiles={n}\tok={len(good)}', flush=True)
    print('PHASE_A_DONE', flush=True)
