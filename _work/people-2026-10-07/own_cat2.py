"""본인 분류 규칙: 사진이 그 사람 본인의 공용 분류에 있고, 그 분류가 연예인 분류에 속해야 한다.
out/<key>/allowed.json 에 통과한 파일 제목과 근거 분류를 쓴다. 분류 조회는 cats_cache.json 에 쌓는다."""
import sys, os, json, re, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from commons import get

ENT = re.compile(r'(comedian|presenter|television|actor|actress|singer|rapper|idol|k-pop|musician|entertainer|'
                 r'youtuber|chef|model|announcer|magician|broadcaster|personalit|film|drama|voice|members of|'
                 r'mixed martial|martial art|footballer|esports|cooks|creators|performers|celebrit|dancer|'
                 r'twice|akmu|ive \(|mamamoo|shinee|girls\' generation|block b|ze:a|h\.o\.t)', re.I)
BAD = re.compile(r'(politician|members of the national assembly|pastor|clergy|theolog|diplomat|minister|'
                 r'ambassador|governor|mayor|judge|lawyer|prosecutor|military|general|scientist|professor|bishop|priest)', re.I)

def squash(s): return re.sub(r'[\s\-_.,\'’]', '', s).lower()
def base_unused(c):
    c = re.sub(r'\s+in\s+\d{4}.*$', '', c)
    c = re.sub(r'\s*\(.*?\)\s*', '', c)
    return c.strip()

NAMES = {}
def split_paren(c):
    c = re.sub(r'\s+in\s+\d{4}.*$', '', c).strip()
    m = re.match(r'^(.*?)\s*\((.*?)\)\s*$', c)
    if not m: return c, None
    p = re.sub(r',?\s*born\s+\d{4}', '', m.group(2)).strip().lower()
    return m.group(1).strip(), (p or None)
for f in ('cand_ent.tsv', 'cand_ent2.tsv', 'cand_ent3.tsv', 'cand_actor.tsv', 'cand_singer.tsv'):
    for line in open(f, encoding='utf-8'):
        if not line.strip() or line.startswith('#'): continue
        t, ko, cats, q = (line.rstrip('\n').split('\t') + ['', '', ''])[:4]
        NAMES[t + '_' + ko.replace(' ', '_')] = (ko, [split_paren(c) for c in cats.split('|') if c])
GROUPS = [{'comedian', 'entertainer', 'television personality', 'presenter', 'television presenter', 'broadcaster', 'tv personality', 'comedienne'},
          {'fighter', 'martial artist', 'mixed martial artist'},
          {'singer', 'rapper', 'musician', 'entertainer'},
          {'actor', 'actress', 'south korean actor', 'south korean actress'},
          {'chef'}, {'model'}, {'magician'}, {'announcer', 'presenter', 'broadcaster', 'television presenter'},
          {'producer', 'television producer'}]
def compat(a, b):
    return a == b or any(a in g and b in g for g in GROUPS)
cache = json.load(open('cats_cache.json')) if os.path.exists('cats_cache.json') else {}
def fetch_cats(titles):
    todo = [t for t in dict.fromkeys(titles) if t not in cache]
    for i in range(0, len(todo), 40):
        chunk = todo[i:i + 40]
        got = {t: [] for t in chunk}
        cont = {}
        while True:
            r = get(dict({'action': 'query', 'titles': '|'.join(chunk), 'prop': 'categories', 'cllimit': 'max', 'clshow': '!hidden'}, **cont))
            q = r.get('query', {})
            norm = {n['to']: n['from'] for n in q.get('normalized', [])}
            for pg in q.get('pages', []):
                t = norm.get(pg['title'], pg['title'])
                got.setdefault(t, []).extend(c['title'][9:] for c in pg.get('categories', []))
            if 'continue' not in r: break
            cont = r['continue']
        cache.update(got)
        json.dump(cache, open('cats_cache.json', 'w'), ensure_ascii=False)

def person_cat(key, c):
    ko, exp = NAMES.get(key, ('', []))
    cb, cp = split_paren(c)
    for eb, ep in exp:
        if re.sub(r'[\s_]+', ' ', cb).strip().lower() != re.sub(r'[\s_]+', ' ', eb).strip().lower(): continue
        if ep is None: return True            # 후보가 구분 말 없이 적혔으면 이름 분류를 그대로 받는다
        if cp is not None and compat(ep, cp): return True   # 구분 말이 있으면 같은 계열이어야 한다
    return bool(ko) and cp is None and cb.replace(' ', '') == ko.replace(' ', '')

def allowed_for(keys, verbose=True):
    keys = keys or [os.path.basename(os.path.dirname(p)) for p in sorted(glob.glob('out/*/info.json'))]
    infos = {}
    for k in keys:
        p = f'out/{k}/info.json'
        if not os.path.exists(p): continue
        infos[k] = json.load(open(p))
    # 1) 후보 파일들의 분류
    fetch_cats([m['title'] for i in infos.values() for m in i['good']])
    # 2) 본인 분류처럼 보이는 것들의 상위 분류 (year 하위 분류는 이름 분류로 올라가 본다)
    pc = set()
    for k, i in infos.items():
        for m in i['good']:
            for c in cache.get(m['title'], []):
                if person_cat(k, c): pc.add(c); pc.add(re.sub(r'\s+in\s+\d{4}.*$', '', c))
    fetch_cats(['Category:' + c for c in pc])
    def ent_ok(c):
        parents = cache.get('Category:' + c, [])
        b = re.sub(r'\s+in\s+\d{4}.*$', '', c)
        parents = parents + cache.get('Category:' + b, [])
        if '(' in c and ENT.search(c) and not BAD.search(c): return True, c
        if any(BAD.search(x) for x in parents): return False, 'BAD:' + ';'.join(x for x in parents if BAD.search(x))
        hit = [x for x in parents if ENT.search(x)]
        return (bool(hit), ';'.join(hit[:2]) if hit else 'noent:' + ';'.join(parents[:3]))
    for k, i in infos.items():
        allowed = {}
        for m in i['good']:
            for c in cache.get(m['title'], []):
                if person_cat(k, c):
                    ok, why = ent_ok(c)
                    if ok: allowed[m['title']] = f'{c} <- {why}'; break
        json.dump(allowed, open(f'out/{k}/allowed.json', 'w'), ensure_ascii=False, indent=1)
        if verbose: print(f'{k}\tgood={len(i["good"])}\tallowed={len(allowed)}\t' + (next(iter(allowed.values()))[:90] if allowed else ''), flush=True)

if __name__ == '__main__':
    allowed_for(sys.argv[1:])
    print('OWNCAT_DONE', flush=True)
