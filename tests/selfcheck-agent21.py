"""v2.1 Be the Agent self-check (ask-and-plan step 7): literature quotes vs saved source texts, the guide's quotes vs sources,
citation coverage, and that each Evidence row's position really exists in the game text.
python3 tests/selfcheck-agent21.py  -> writes selfcheck-agent21.md"""
import os, re, openpyxl
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def norm(s):
    s = str(s).replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", re.sub(r"-\n", "", s)).strip()
SRC = {"Liu et al., 2024": "Liu2024", "Anthropic, Context windows": "AnthropicCW", "Anthropic, Claude memory help page": "AnthropicMemory"}
texts = {k: norm(open(os.path.join(ROOT, "v21src/agent-sources", v, "web.txt"), encoding="utf-8").read()) for k, v in SRC.items()}
wb = openpyxl.load_workbook(os.path.join(ROOT, "literature-report-agent21.xlsx"))
ev = list(wb["Evidence"].iter_rows(min_row=2, values_only=True)); srcs = [r[0] for r in wb["Sources"].iter_rows(min_row=2, values_only=True)]
out = ["# Self-check: v2.1 Be the Agent (literature)", "",
       "Scope: every Evidence quote against the saved source text (v21src/agent-sources), every quote of 25+ characters in the guide's v2.1 Be the Agent \"What to say about it\" block, citation coverage, and that the lesson-4 card each row names exists in v21/agent/js/lessons.js. Whether a quote supports its claim is judged by the reviewer, not by this script.", ""]
res = []
for r in ev:
    q = norm(r[5]); t = texts.get(r[3], "")
    res.append((r[0], r[3], "Match" if q and q in t else ("No full text" if not t else "Not found"), r[8]))
out.append(f"## Evidence quotes: {len(res)} checked / {len(ev)} rows (exact substring after whitespace/quote normalisation)")
out += [f"- row {a}: {b}: **{c}** ({d})" for a, b, c, d in res]
out.append(f"\n## Every Evidence row points to a Sources row: {sum(1 for r in ev if r[3] in srcs)} / {len(ev)}")
les = open(os.path.join(ROOT, "v21/agent/js/lessons.js"), encoding="utf-8").read()
pos_ok = []
for r in ev:
    cards = re.findall(r"(?:card|step) '(.+?)'(?= \(|;|,| and| note|$)", r[1])
    pos_ok.append((r[0], cards, all(('title: "' + c.replace("“", "“") + '"') in les or ('“' in c and c in les) or c in les for c in cards)))
out.append(f"\n## Lesson-4 card named in each row exists: {sum(1 for x in pos_ok if x[2])} / {len(pos_ok)}")
out += [f"- row {a}: {', '.join(b) or '(guide only)'}: **{'OK' if c else 'MISSING'}**" for a, b, c in pos_ok]
g = open(os.path.join(ROOT, "TEACHING_GUIDE.md"), encoding="utf-8").read()
sec = g[g.index("## v2.1 preview: Be the Agent"):g.index("## Sources used in the games")]
say = sec[sec.index("**What to say about it"):sec.index("**Design choices")]
quotes = [m for line in say.splitlines() for m in re.findall(r'"([^"]+)"', line)]
src_quotes = [q for q in quotes if len(q) >= 25]
found = [(q, [k for k, t in texts.items() if norm(q) in t]) for q in src_quotes]
out.append(f"\n## Quotes in the guide's v2.1 Be the Agent section: {len(found)} checked / {len(src_quotes)}")
out += [f"- \"{q[:70]}...\": {'**Match** in ' + ', '.join(h) if h else '**Not found**'}" for q, h in found]
cited = sorted(set(f"{a}, {b}" for a, b in re.findall(r"([A-Z][a-z]+ et al\.) \((\d{4})", sec) + re.findall(r"\(([A-Z][a-z]+ et al\.), (\d{4})", sec)))
named = [k for k in SRC if k.startswith("Anthropic")]
out.append(f"\n## Citations in the section: {len(cited)} author-year ({', '.join(cited)}); with an Evidence row: {sum(1 for c in cited if any(r[3] == c for r in ev))} / {len(cited)}. Vendor pages with Evidence rows: {sum(1 for k in named if any(r[3] == k for r in ev))} / {len(named)}")
bad = [x for x in res if x[2] != "Match"] + [x for x in pos_ok if not x[2]] + [x for x in found if not x[1]] + [c for c in cited if not any(r[3] == c for r in ev)]
abstract = [x for x in res if x[3] == "Abstract only"]
out.append(f"\n## Rows resting on an abstract only: {len(abstract)} (" + ", ".join(f"row {a}" for a, *_ in abstract) + ")")
out.append("\n**Result: " + ("all clean**" if not bad else f"{len(bad)} problem(s)**"))
open(os.path.join(ROOT, "selfcheck-agent21.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("\n".join(out)); raise SystemExit(1 if bad else 0)
