"""
AI games v2 — Be the Agent browser tests (Playwright + Chromium).   python3 tests/agent-play.py
Plays all 7 lessons (replays + practice) and all 7 stages of Be the Agent Arena by clicking the real buttons,
then the Agent Arena's 12 steps. Checks: every item can be finished with full marks; the 3-phone rule (every message
is in the Model phone once and in exactly one other phone); no sideways scroll at 390 and 1100 px (playthrough.py and touch.py cover other widths and iPhone/iPad); no page errors;
a real .xlsx/.docx/.csv is offered by the File maker. SHOTS=dir saves screenshots.
"""
import functools, http.server, json, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.environ.get("SHOTS")
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=httpd.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{httpd.server_address[1]}"
fails = []
def check(c, m):
    if not c: fails.append(m); print("  FAIL ", m, flush=True)
def shot(pg, name):
    if SHOTS: pg.screenshot(path=os.path.join(SHOTS, name + ".png"), full_page=True)
def no_hscroll(pg, what):
    w = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check(w <= 1, f"{what}: no sideways scroll (overflow {w}px)")
def phone_rule(pg, what):
    # every message is in exactly 2 phones: right in the sender's, left in the receiver's.
    # So: Model-phone LEFT bubbles = Human RIGHT + Apps RIGHT, and Model-phone RIGHT bubbles = Human LEFT + Apps LEFT,
    # and each side's bubbles have the sender's colour class (checked on the last phones widget on the page).
    r = pg.evaluate("""(() => { const all = [...document.querySelectorAll('.phones')]; const w = all[all.length - 1];
        const n = (s) => w.querySelectorAll(s).length;
        return { hr: n('.ph-human .b.right'), hl: n('.ph-human .b.left'), ml: n('.ph-model .b.left'), mr: n('.ph-model .b.right'),
                 ar: n('.ph-apps .b.right'), al: n('.ph-apps .b.left'),
                 humanFromModel: n('.ph-human .b.left.c-model'), modelToHuman: n('.ph-model .b.right.c-model') - n('.ph-apps .b.left'),
                 appsLeftAreModel: n('.ph-apps .b.left') === n('.ph-apps .b.left.c-model'), appsRightAreApps: n('.ph-apps .b.right') === n('.ph-apps .b.right.c-app'),
                 humanRightIsHuman: n('.ph-human .b.right') === n('.ph-human .b.right.c-human') }; })()""")
    ok = (r["ml"] == r["hr"] + r["ar"] and r["mr"] == r["hl"] + r["al"] and r["humanFromModel"] == r["modelToHuman"]
          and r["appsLeftAreModel"] and r["appsRightAreApps"] and r["humanRightIsHuman"] and r["ml"] + r["mr"] > 0)
    check(ok, f"{what}: 3-phone rule, sides and senders ({r})")
def mv(pg, n): return pg.locator(".move").nth(n)
def click_val(loc, v):
    loc.locator(f'.choice[data-value="{v}"]').first.click()

def solve_item(pg, what):
    it = pg.evaluate("""(() => { const it = window.AGENT_LAST_ITEM; const o = { kind: it.kind, key: it.key };
      if (it.kind === 'filesearch') { let best = null; const c = it.chips;
        const top = r => r.length && r[0].piece.id === it.key.piece && (r.length < 2 || r[1].score < r[0].score);
        for (const a of c) if (!best && top(it.search([a]))) best = [a];
        for (let i = 0; i < c.length && !best; i++) for (let j = i + 1; j < c.length && !best; j++) if (top(it.search([c[i], c[j]]))) best = [c[i], c[j]];
        o.words = best; }
      if (it.kind === 'websearch') o.query = it.key.query;
      if (it.kind === 'calc') o.solution = it.solution;
      if (it.kind === 'inject') o.bad = it.bad;
      o.files = (it.files || []).length; o.made = it.kind === 'maker' || !!it.madeFile;
      return o; })()""")
    if it["files"]:   # the files Ploy shares are shown as 📎 chips on her message, in her phone AND the model's
        w = "(() => { const all = [...document.querySelectorAll('.phones')]; return all[all.length - 1]; })()"
        n = pg.evaluate(f"[{w}.querySelectorAll('.ph-human .b.right .b-file').length, {w}.querySelectorAll('.ph-model .b.left .b-file').length]")
        check(n[0] >= it["files"] and n[1] >= it["files"], f"{what}: Ploy's shared files shown in both phones ({n})")
    k, key = it["kind"], it["key"]
    if k == "toolpick":
        click_val(mv(pg, 0), key["tool"]); pg.wait_for_timeout(60); click_val(mv(pg, 1), key["reply"])
    elif k == "filesearch":
        for w in it["words"]: click_val(mv(pg, 0), w)
        mv(pg, 0).locator("button:has-text('Search')").click(); pg.wait_for_timeout(60)
        click_val(mv(pg, 1), key["piece"]); pg.wait_for_timeout(60); click_val(mv(pg, 2), key["answer"])
    elif k == "websearch":
        click_val(mv(pg, 0), it["query"]); pg.wait_for_timeout(60); click_val(mv(pg, 1), key["page"]); pg.wait_for_timeout(60); click_val(mv(pg, 2), key["answer"])
    elif k == "calc":
        for t in it["solution"]: mv(pg, 0).get_by_role("button", name=t, exact=True).first.click()
        mv(pg, 0).locator("button:has-text('Send to')").click(); pg.wait_for_timeout(60); click_val(mv(pg, 1), key["reply"])
    elif k == "maker":
        for v in (key["type"], key["name"], key["content"]): click_val(mv(pg, 0), v)
        mv(pg, 0).locator("button:has-text('Send to')").click(); pg.wait_for_timeout(80)
        check(pg.locator(".ph-model .v-file button:has-text('Download')").count() >= 1, f"{what}: the made file can be downloaded")
        with pg.expect_download() as d: pg.locator(".ph-model .v-file button:has-text('Download')").first.click()
        name = d.value.suggested_filename
        check(name.endswith("." + key["type"]), f"{what}: downloaded {name}")
        click_val(mv(pg, 1), "ok")
    elif k == "inject":
        for b in it["bad"]: click_val(mv(pg, 0), b)
        mv(pg, 0).locator("button:has-text('Done tapping')").click(); pg.wait_for_timeout(60); click_val(mv(pg, 1), "warn")
    elif k == "permission":
        click_val(mv(pg, 0), key)
    pg.wait_for_timeout(80)
    phone_rule(pg, what)
    if it["made"] and (k == "maker" or "Done" in (pg.evaluate("(() => { const b = [...document.querySelectorAll('.ph-human .b.left')]; return b.length ? b[b.length - 1].textContent : ''; })()") or "")):
        check(pg.evaluate("(() => { const all = [...document.querySelectorAll('.phones')]; const w = all[all.length - 1]; return w.querySelectorAll('.ph-human .b.left .v-file').length; })()") >= 1, f"{what}: the made file arrives in Ploy's phone with the reply")

def do_lesson(pg, n):
    for i in range(10):
        pg.wait_for_timeout(80)
        while pg.locator("button:has-text('Show all'):not([disabled])").count():
            pg.locator("button:has-text('Show all'):not([disabled])").first.click(); pg.wait_for_timeout(60)
        if pg.locator(".move").count() and not pg.locator(".feedback.good").count():
            solve_item(pg, f"lesson {n} practice")
            check(pg.locator(".feedback.good").count() == 1, f"lesson {n} practice solved with full marks")
        no_hscroll(pg, f"lesson {n} step {i+1} @{pg.viewport_size['width']}")
        if n in (1, 6) and i in (1, 5): shot(pg, f"agent-lesson{n}-step{i+1}-{pg.viewport_size['width']}")
        nx = pg.locator("button:has-text('Next →'), button:has-text('Start stage')").first
        check(nx.is_enabled(), f"lesson {n} step {i+1} unlocks")
        if not nx.is_enabled(): return
        t = nx.inner_text(); nx.click()
        if "Start stage" in t: return

CONFIG = 'window.AIG_CONFIG={SCOREBOARD_URL:"",TIME_FACTOR:1.5};'
def config_route(ctx):
    ctx.route("**/config.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=CONFIG))

def play(ctx, label, W, per_item=None):
    """Plays all 7 lessons, all 7 stages and the Agent Arena in this browser context. per_item(pg, what) runs extra checks."""
    pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/agent/index.html?test=1"); pg.wait_for_timeout(300)
    pg.fill("#nick", "t" + str(W)); pg.click("button:has-text('Start my run')"); pg.wait_for_timeout(300)
    for sno in range(1, 8):
        do_lesson(pg, sno)
        pg.click("button:has-text('Start stage')"); pg.wait_for_timeout(120)
        n = 0
        while True:
            n += 1
            solve_item(pg, f"@{label} stage {sno} item {n}")
            if n == 1: no_hscroll(pg, f"@{label} stage {sno} item"); shot(pg, f"agent-stage{sno}-{label}")
            if per_item: per_item(pg, f"@{label} stage {sno} item {n}")
            card = pg.locator(".result-card")
            check(card.count() == 1 and "Right" in card.inner_text(), f"@{label} stage {sno} item {n} full marks: " + (card.inner_text()[:120] if card.count() else "no result"))
            b = card.locator("button").first; t = b.inner_text(); b.click(); pg.wait_for_timeout(100)
            if "Next item" not in t: break
        nb = pg.locator("button:has-text('Next: lesson'), button:has-text('See my results')")
        if nb.count(): nb.first.click(); pg.wait_for_timeout(150)
    check(pg.locator(".big-points").count() == 1, f"@{label} results screen")
    # ---------- Agent Arena ----------
    pg.goto(BASE + "/agent-final/index.html?test=1"); pg.wait_for_timeout(300)
    pg.locator("button:has-text('Start my run'):visible").first.click(); pg.wait_for_timeout(300); pg.click("button:has-text('Start stage')"); pg.wait_for_timeout(150)
    for sidx in range(12):
        st = pg.evaluate("(() => { const s = window.AGENT_STEP; return { kind: s.kind, key: s.key, solution: s.solution, id: s.id }; })()")
        m = pg.locator(".move").last
        if st["kind"] == "calc":
            for t in st["solution"]: m.get_by_role("button", name=t, exact=True).first.click()
            m.locator("button:has-text('Send to')").click()
        elif st["kind"] == "search":
            for w in ("coffee", "price"): click_val(m, w)
            m.locator("button:has-text('Search')").click()
        else:
            click_val(m, st["key"])
        pg.wait_for_timeout(80)
        phone_rule(pg, f"@{label} arena step {sidx+1}")
        if sidx in (7, 10): no_hscroll(pg, f"@{label} arena step {sidx+1}"); shot(pg, f"agent-arena-step{sidx+1}-{label}")
        if per_item: per_item(pg, f"@{label} arena step {sidx+1}")
        if st["id"] == "reply": check(pg.locator(".ph-human .b.left .v-file").count() >= 1, f"@{label} arena: the memo file arrives in Ploy's phone with the final reply")
        if sidx == 0: check(pg.locator(".ph-human .b.right a.b-file").count() == 2, f"@{label} arena: Ploy's task shows the 2 shared files as links")
        card = pg.locator(".result-card")
        check("Right" in card.inner_text(), f"@{label} arena step {sidx+1} ({st['id']}) full marks")
        card.locator("button").first.click(); pg.wait_for_timeout(100)
    nb = pg.locator("button:has-text('See my results')")
    if nb.count(): nb.first.click(); pg.wait_for_timeout(150)
    check(pg.locator(".big-points").count() == 1, f"@{label} arena results")
    check(not errs, f"@{label} no page errors: " + "; ".join(errs[:3]))

def main():
    with sync_playwright() as p:
        br = p.chromium.launch()
        for width in (1100, 390):
            ctx = br.new_context(viewport={"width": width, "height": 900}, accept_downloads=True)
            config_route(ctx)
            play(ctx, str(width), width)
            ctx.close()
        br.close()
    httpd.shutdown()
    print(f"{len(fails)} check(s) FAILED" if fails else "All agent browser checks passed")
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
