"""v2.1 self-check (ask-and-plan step 7): literature quotes vs saved source texts, guide quotes vs sources, citation coverage.
python3 tests/selfcheck-v21.py  -> writes selfcheck-v21.md"""
import os, re, openpyxl
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def norm(s):
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("–", "-").replace("—", "-")
    s = s.replace("\U0001d458", "k")  # math italic k in the ar5iv text
    return re.sub(r"\s+", " ", re.sub(r"-\n", "", s)).strip()
SRC = {"Vaswani et al., 2017": "Vaswani2017", "Olsson et al., 2022": "Olsson2022", "Khandelwal et al., 2020": "Khandelwal2020", "Lewis et al., 2020": "Lewis2020"}
texts = {k: norm(open(os.path.join(ROOT, "v21src/sources-text", v, "web.txt"), encoding="utf-8").read()) for k, v in SRC.items()}
wb = openpyxl.load_workbook(os.path.join(ROOT, "literature-report-v21.xlsx"))
ev = list(wb["Evidence"].iter_rows(min_row=2, values_only=True)); srcs = [r[0] for r in wb["Sources"].iter_rows(min_row=2, values_only=True)]
out = ["# Self-check v2.1 (literature)", "", "Scope: the 6 Evidence quotes against the saved source excerpts (v21src/sources-text), every quote of 25+ characters in the guide's \"What to say about it\" block, and citation coverage of the guide's v2.1 section. Paraphrases are checked by the reviewer, not by this script.", ""]
res = []
for r in ev:
    q = norm(r[5]); t = texts.get(r[3], "")
    res.append((r[0], r[3], "Match" if q and q in t else ("No full text" if not t else "Not found")))
out.append(f"## Evidence quotes: {len(res)} checked / {len(ev)} rows (exact substring after whitespace/quote normalisation)")
out += [f"- row {a}: {b}: **{c}**" for a, b, c in res]
out.append(f"\n## Every Evidence row points to a Sources row: {sum(1 for r in ev if r[3] in srcs)} / {len(ev)}")
g = open(os.path.join(ROOT, "TEACHING_GUIDE.md"), encoding="utf-8").read()
sec = g[g.index("## v2.1 preview"):g.index("## Sources used in the games")]
say = sec[sec.index("**What to say about it"):sec.index("**Time")]
quotes = [m for line in say.splitlines() for m in re.findall(r'"([^"]+)"', line)]
src_quotes = [q for q in quotes if len(q) >= 25]   # skip short labels such as section names
found = []
for q in src_quotes:
    nq = norm(q)
    hit = [k for k, t in texts.items() if nq in t]
    found.append((q, hit))
out.append(f"\n## Quotes in the guide's v2.1 section: {len(found)} checked / {len(src_quotes)}")
out += [f"- \"{q[:70]}…\": {'**Match** in ' + ', '.join(h) if h else '**Not found**'}" for q, h in found]
cites = re.findall(r"\(([A-Z][a-z]+ et al\.), (\d{4})", sec) + re.findall(r"([A-Z][a-z]+ et al\.) \((\d{4})", sec)
cited = sorted(set(f"{a}, {b}" for a, b in cites))
out.append(f"\n## Citations in the guide's v2.1 section: {len(cited)} distinct; with an Evidence row: {sum(1 for c in cited if any(r[3] == c for r in ev))} / {len(cited)}")
out += [f"- {c}" for c in cited]
bad = [x for x in res if x[2] != "Match"] + [x for x in found if not x[1]] + [c for c in cited if not any(r[3] == c for r in ev)]
out.append("\n**Result: " + ("all clean**" if not bad else f"{len(bad)} problem(s)**"))
open(os.path.join(ROOT, "selfcheck-v21.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("\n".join(out[-1:])); raise SystemExit(1 if bad else 0)
