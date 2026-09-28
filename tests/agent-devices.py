"""
AI games v2 — Be the Agent on phones and tablets (Playwright, emulated devices with a touch screen).
Plays ALL lessons, stages and the Agent Arena by TAPPING on: iPhone SE (smallest common iPhone), iPhone 13,
Galaxy S9+ (320 px wide Android), iPad (gen 7) portrait and landscape.   python3 tests/agent-devices.py   (SHOTS=dir saves screenshots)
Checks on every item/step: no sideways scroll; every visible tap target at least 44 px tall (Apple's guideline);
no text smaller than 12 px; the timer stays in view while playing; each new "Your move" box and each result card is
scrolled into view when it appears (nobody has to hunt for it); the open app's chip is visible; no page errors.
Also reports (info) items whose first move still starts below the screen.
"""
import importlib.util, os, sys
from playwright.sync_api import sync_playwright, Locator
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("agentplay", os.path.join(HERE, "agent-play.py"))
AP = importlib.util.module_from_spec(spec); spec.loader.exec_module(AP)
check, fails = AP.check, AP.fails

# tap instead of click everywhere (the solver in agent-play.py uses .click())
_click = Locator.click
def _tap(self, *a, **k):
    try: self.tap(); return None
    except Exception: return _click(self, *a, **k)
Locator.click = _tap

WATCH = r"""
(() => { window.__vis = []; const seen = new WeakSet();
  const look = (el, kind) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => { const r = el.getBoundingClientRect(); if (!el.isConnected || !el.offsetParent) return;
    const top = document.querySelector('.topbar'); const tb = top ? top.getBoundingClientRect().bottom : 0;
        const hud = document.querySelector('.hud-card'); const hb = hud && hud.getBoundingClientRect().top < tb + 5 ? hud.getBoundingClientRect().bottom : tb;
    const first = kind === 'move' && /Your move 1 /.test(el.textContent);
    window.__vis.push({ kind: first ? 'move1' : kind, ok: r.top >= hb - 6 && r.top < innerHeight - 60, top: Math.round(r.top), vh: innerHeight }); })), 20);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType !== 1) return;
    [n, ...n.querySelectorAll('.move, .result-card')].forEach(el => { if (seen.has(el)) return;
      if (el.matches && el.matches('.move') && el.closest('.item-box') && !el.closest('.practice')) { seen.add(el); look(el, 'move'); }
      if (el.matches && el.matches('.result-card')) { seen.add(el); look(el, 'result'); } }); })))
    .observe(document, { childList: true, subtree: true }); })();
"""

def per_item(pg, what):
    AP.no_hscroll(pg, what)
    small = pg.evaluate("""[...document.querySelectorAll('main button, main .choice, main .tile, main input, main summary')]
        .filter(e => e.offsetParent && !e.disabled && e.getBoundingClientRect().height < 44).map(e => (e.className + ':' + e.textContent.trim()).slice(0, 30))""")
    check(not small, f"{what}: tap targets at least 44 px ({small[:4]})")
    tiny = pg.evaluate("""[...document.querySelectorAll('main *')].filter(e => e.offsetParent && e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
        && parseFloat(getComputedStyle(e).fontSize) < 12).map(e => e.className + ':' + e.textContent.trim().slice(0, 20))""")
    check(not tiny, f"{what}: no text under 12 px ({tiny[:4]})")
    hud = pg.evaluate("""(() => { const t = document.querySelector('.timer'); if (!t || !t.offsetParent) return 'none';
        const r = t.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? 'ok' : 'hidden'; })()""")
    check(hud != "hidden", f"{what}: the timer is in view while answering")
    chips = pg.evaluate("""[...document.querySelectorAll('.ph-app[aria-pressed=true]')].filter(c => c.offsetParent).every(c => { const b = c.parentNode.getBoundingClientRect(), r = c.getBoundingClientRect(); return r.left >= b.left - 1 && r.right <= b.right + 1; })""")
    check(chips, f"{what}: the open app's chip is in view in the Apps phone")
    vis = pg.evaluate("window.__vis.splice(0)")
    first = [v for v in vis if v["kind"] == "move1"]
    if first and not first[0]["ok"]: INFO.append((what, first[0]))
    bad = [v for v in vis if not v["ok"] and v["kind"] != "move1"]
    check(not bad, f"{what}: new move/result boxes appear in view ({bad[:3]})")

INFO = []
DEVICES = [("iPhone SE", None), ("iPhone 13", None), ("Galaxy S9+", None), ("iPad (gen 7)", None), ("iPad (gen 7) landscape", None)]
with sync_playwright() as p:
    br = p.chromium.launch()
    for name, _ in DEVICES:
        d = dict(p.devices[name]); d.pop("default_browser_type", None)
        ctx = br.new_context(**d, accept_downloads=True, reduced_motion="reduce")
        AP.config_route(ctx)
        ctx.add_init_script(WATCH)
        n0 = len(fails)
        AP.play(ctx, name, name.replace(" ", ""), per_item)
        print(f"{name}: {len(fails) - n0} problem(s)", flush=True)
        ctx.close()
    br.close()
AP.httpd.shutdown()
print(f"info: first move of an item starts below the screen in {len(INFO)} items/steps:"); [print("   ", w, v["top"], v["vh"]) for w, v in INFO]
import re, collections
cat = collections.Counter(re.sub(r"^@[^:]*: ", "", re.sub(r" \(.*$", "", re.sub(r"(stage|step|item) \d+", r"\1 N", f))) for f in fails)
for k, v in cat.most_common(40): print(f"{v:4d}  {k}")
print(f"{len(fails)} check(s) FAILED" if fails else "All phone/tablet agent checks passed")
sys.exit(1 if fails else 0)
