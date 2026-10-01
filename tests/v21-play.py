"""
AI games v2.1 PREVIEW (/v21/) — browser tests (Playwright + Chromium).   python3 tests/v21-play.py
- Be the LLM Arena v2.1: home says 8 stages; lesson 8 (toy model v2) is walked to the end at 1100 px and 360 px
  (every practice answered, no sideways scroll, no page errors); stage 8 plays with 4 item kinds and the keys score
  full marks; Show answer (teacher mode) scores full marks.
- An official run sends to the scoreboard as game llm21 (8 stage columns), never as llm2.
- The v2.1 final has 14 questions; 13-14 are toy-v2 items.
- The live v2.0 pages are unchanged (still 7 stages, game llm2; final 12 questions, game llmfinal).
SHOTS=dir saves screenshots.
"""
import functools, http.server, json, os, socket, socketserver, subprocess, threading, urllib.request
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.environ.get("SHOTS")
def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=httpd.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{httpd.server_address[1]}"
MOCK = free_port()
mock = subprocess.Popen(["node", os.path.join(ROOT, "tests", "mock-server.js"), str(MOCK)], stdout=subprocess.PIPE)
mock.stdout.readline()
MOCK_URL = f"http://127.0.0.1:{MOCK}/exec"
def board(game, cls):
    return json.loads(urllib.request.urlopen(f"{MOCK_URL}?action=board&game={game}&classCode={cls}").read())

fails = []
def check(c, m):
    if not c: fails.append(m); print("  FAIL ", m, flush=True)
def shot(page, name):
    if SHOTS: page.screenshot(path=os.path.join(SHOTS, name + ".png"), full_page=True)
def new_ctx(br, viewport=None):
    ctx = br.new_context(viewport=viewport or {"width": 1100, "height": 900})
    body = f'window.AIG_CONFIG = {{ SCOREBOARD_URL: "{MOCK_URL}", BOARD_REFRESH_SECONDS: 3, TIME_FACTOR: 1.5 }};'
    ctx.route("**/config.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=body))
    ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(status=200, content_type="text/css", body=""))
    return ctx
def new_page(ctx):
    page = ctx.new_page(); page.errors = []; page.set_default_timeout(8000)
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    page.on("console", lambda m: page.errors.append("console: " + m.text) if m.type == "error" else None)
    return page
def hscroll(page):
    return page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
def solve_practice(page):
    for _ in range(40):
        busy = False
        for c in page.locator(".practice").all():
            if c.locator(".feedback.good").count(): continue
            busy = True
            for j in range(c.locator(".choice").count()):
                if c.locator(".feedback.good").count(): break
                b = c.locator(".choice").nth(j)
                if b.is_enabled(): b.click(); page.wait_for_timeout(30)
        if not busy: return

def walk_lesson8(page, width):
    titles = []
    for i in range(10):
        page.wait_for_timeout(80)
        t = page.locator("section.card h2").first.inner_text() if page.locator("section.card h2").count() else ""
        titles.append(t)
        solve_practice(page)
        check(hscroll(page) <= 1, f"lesson 8 step {i+1} ({t}) at {width}px: no sideways scroll ({hscroll(page)}px)")
        if i in (0, 2, 3): shot(page, f"v21-lesson8-step{i+1}-{width}")
        nxt = page.locator("button:has-text('Next →'), button:has-text('Start stage')")
        if not nxt.count(): check(False, f"lesson 8 step {i+1}: Next button"); return titles
        check(nxt.first.is_enabled(), f"lesson 8 step {i+1} ({t}) unlocks after its practice")
        if not nxt.first.is_enabled(): return titles
        txt = nxt.first.inner_text(); nxt.first.click()
        if "Start stage" in txt: return titles
    return titles

with sync_playwright() as p:
    br = p.chromium.launch()
    # ---------- v2.1 main game: home, lesson 8 and stage 8 in teacher mode ----------
    for width in (1100, 360):
        ctx = new_ctx(br, {"width": width, "height": 900 if width > 400 else 780}); page = new_page(ctx)
        page.goto(BASE + "/v21/llm/index.html?test=1"); page.wait_for_timeout(300)
        check("8 stages" in page.locator("main").inner_text(), f"v2.1 home says 8 stages ({width}px)")
        page.evaluate("localStorage.setItem('aig-teacher','1')"); page.reload(); page.wait_for_timeout(300)
        page.locator(".teacher-panel button:has-text('Lesson 8')").click(); page.wait_for_timeout(300)
        titles = walk_lesson8(page, width)
        check(len(titles) == 7 and titles[0] == "Toy v1's weak spot" and titles[-1].startswith("Toy v1, toy v2"), f"lesson 8 has 7 steps at {width}px: {titles}")
        # stage 8: the button after the lesson opens the stage; Start begins it
        page.wait_for_timeout(200)
        if page.locator("button:has-text('Start')").count() and not page.locator(".hud-card").count(): page.locator("button:has-text('Start')").first.click()
        kinds = []
        for k in range(6):
            page.wait_for_timeout(150)
            if not page.locator(".hud-card").count(): break
            kind = page.evaluate("ARENA_TEST.item.kind"); kinds.append(kind)
            check(page.locator("main .choice").count() >= 2, f"stage 8 {kind}: options are shown")
            check(hscroll(page) <= 1, f"stage 8 {kind} at {width}px: no sideways scroll ({hscroll(page)}px)")
            shot(page, f"v21-stage8-{kind}-{width}")
            if k == 0:
                page.locator("button:has-text('Show answer')").click(); page.wait_for_timeout(100)
                check(page.locator(".teacher-answer-card").count() == 1, "stage 8: Show answer works")
            frac = page.evaluate("ARENA_TEST.item.grade(ARENA_TEST.item.key).frac")
            check(frac == 1, f"stage 8 {kind}: the key scores full marks")
            page.evaluate("ARENA_TEST.submit(ARENA_TEST.item.key)"); page.wait_for_timeout(120)
            check(page.locator(".result-card").count() == 1 and "points" in page.locator(".result-card").inner_text(), f"stage 8 {kind}: result shown")
            b = page.locator(".result-card button").first; t = b.inner_text(); b.click()
            if "Next item" not in t: break
        check(kinds == ["t2most", "t2share", "t2copy", "t2addon"], f"stage 8 has the 4 toy-v2 item kinds in order ({kinds})")
        check(not page.errors, f"no page errors at {width}px: {page.errors[:3]}")
        ctx.close()
    print("  v2.1 lesson/stage 8 done", flush=True)
    # ---------- an official v2.1 run goes to the llm21 board ----------
    ctx = new_ctx(br); page = new_page(ctx)
    page.goto(BASE + "/v21/llm/index.html?test=1"); page.wait_for_timeout(300)
    # lesson 1 counts as done before on this device, so the run can skip straight to stage 1
    page.evaluate("(() => { const k = 'aig-arena-llm21'; const s = JSON.parse(localStorage.getItem(k) || '{}'); s.taughtEver = { count: true }; localStorage.setItem(k, JSON.stringify(s)); })()")
    page.reload(); page.wait_for_timeout(300)
    page.fill("#nick", "Pia"); page.fill("#classCode", "V21"); page.click("button:has-text('Start my run')"); page.wait_for_timeout(400)
    check(page.locator("button:has-text('Skip the lesson')").count() == 1, "official run: lesson 1 can be skipped (done before)")
    page.locator("button:has-text('Skip the lesson')").click(); page.wait_for_timeout(200)
    if page.locator("button:has-text('Start')").count() and not page.locator(".hud-card").count(): page.locator("button:has-text('Start')").first.click()
    for _ in range(12):
        page.wait_for_timeout(100)
        if not page.locator(".hud-card").count(): break
        page.evaluate("ARENA_TEST.submit(ARENA_TEST.item.key)"); page.wait_for_timeout(80)
        b = page.locator(".result-card button").first; t = b.inner_text(); b.click()
        if "Next item" not in t: break
    page.wait_for_timeout(1500)
    b21 = board("llm21", "V21"); b2 = board("llm2", "V21")
    check(b21["players"] and len(b21["players"][0]["perStage"]) == 8 and b21["players"][0]["perStage"][0], "official v2.1 run: stage 1 on the llm21 board with 8 columns " + json.dumps(b21["players"][:1]))
    check(not b2["players"], "official v2.1 run: nothing on the v2.0 llm2 board")
    ctx.close()
    print("  official run done", flush=True)
    # ---------- the v2.1 final: 14 questions ----------
    ctx = new_ctx(br); page = new_page(ctx)
    page.goto(BASE + "/v21/final/index.html?test=1"); page.wait_for_timeout(300)
    page.evaluate("localStorage.setItem('aig-teacher','1')"); page.reload(); page.wait_for_timeout(300)
    page.locator(".teacher-panel button.primary").first.click(); page.wait_for_timeout(300)
    page.locator("button:has-text('Start')").first.click(); page.wait_for_timeout(300)
    seen = []
    for _ in range(20):
        page.wait_for_timeout(120)
        if not page.locator(".hud-card").count(): break
        seen.append(page.evaluate("ARENA_TEST.item.kind"))
        page.evaluate("ARENA_TEST.submit(ARENA_TEST.item.key)"); page.wait_for_timeout(100)
        b = page.locator(".result-card button").first; t = b.inner_text(); b.click()
        if "Next item" not in t: break
    check(len(seen) == 14 and seen[12] in ("t2most", "t2share") and seen[13] in ("t2copy", "t2addon"), f"v2.1 final: 14 questions, 13-14 toy v2 ({seen})")
    check(not page.errors, f"v2.1 final: no page errors {page.errors[:3]}")
    ctx.close()
    # ---------- the preview board and landing page ----------
    ctx = new_ctx(br); page = new_page(ctx)
    page.goto(BASE + "/v21/board.html?class=V21"); page.wait_for_timeout(1500)
    check("Meaning brain" in page.locator("main").inner_text() and "Pia" in page.locator("main").inner_text(), "preview board shows llm21 with the Meaning brain column")
    page.goto(BASE + "/v21/index.html"); page.wait_for_timeout(200)
    check(page.locator("a[href='llm/index.html']").count() == 1 and page.locator("a[href='final/index.html']").count() == 1, "preview landing page links both games")
    check(not page.errors, f"preview board/landing: no page errors {page.errors[:3]}")
    # ---------- v2.0 untouched ----------
    page.goto(BASE + "/llm/index.html?test=1"); page.wait_for_timeout(300)
    check("7 stages" in page.locator("main").inner_text(), "v2.0 main game still has 7 stages")
    page.goto(BASE + "/final/index.html?test=1"); page.wait_for_timeout(300)
    check("12 questions" in page.locator("main").inner_text(), "v2.0 final still has 12 questions")
    ctx.close()
    br.close()
mock.terminate()
print(f"{len(fails)} check(s) FAILED" if fails else "All v2.1 preview checks passed")
raise SystemExit(1 if fails else 0)
