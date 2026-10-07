import re, sys
cov = set()
for line in open('/home/user/jjam-classroom/word/assets/fonts/coverage.txt'):
    if line.startswith('#') or line.startswith('!'): continue
    for tok in re.findall(r'U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?', line):
        a = int(tok[0], 16); b = int(tok[1], 16) if tok[1] else a
        cov.update(range(a, b + 1))
def missing(s):
    return sorted({c for c in s if ord(c) not in cov and not c.isspace()})
if __name__ == '__main__':
    text = open(sys.argv[1]).read() if len(sys.argv) > 1 else sys.stdin.read()
    for line in text.splitlines():
        m = missing(line)
        if m: print(''.join(m), '\t', line[:80])
