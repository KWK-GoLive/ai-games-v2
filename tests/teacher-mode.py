"""Teacher mode on all 5 game pages: the 🎓 button and code (wrong code refused, KWK-TEACH unlocks), jump to any
lesson/stage, paused timer, Show answer (right for the item), NOTHING sent to the scoreboard, the student's saved run
untouched, stays on after a reload, Leave works.   python3 tests/teacher-mode.py"""
import http.server, threading, functools, os, sys, json
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT))
H.RequestHandlerClass.log_message = lambda *a: None
threading.Thread(target=H.serve_forever, daemon=True).start()
B = f"http://127.0.0.1:{H.server_address[1]}"
fails = []
def check(c, m):
    if not c: fails.append(m); print("  FAIL ", m, flush=True)
PAGES = [("warmup/index.html", "warmup", False), ("llm/index.html", "llm2", True), ("final/index.html", "llmfinal", False),
         ("agent/index.html", "agent2", True), ("agent-final/index.html", "agentfinal", False)]
CFG = 'window.AIG_CONFIG={SCOREBOARD_URL:"https://scoreboard.example/exec",BOARD_REFRESH_SECONDS:3,TIME_FACTOR:1.5};'
with sync_playwright() as p:
    br = p.chromium.launch()
    for path, game, has_lessons in PAGES:
        ctx = br.new_context(viewport={"width": 1100, "height": 900})
        sent = []
        ctx.route("**/config.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=CFG))
        ctx.route("https://scoreboard.example/**", lambda r: (sent.append(r.request.url), r.fulfill(status=200, content_type="application/json", body='{"ok":true,"players":[]}')))
        ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(status=200, content_type="text/css", body=""))
        pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        # a student's run in progress on this device (must stay untouched)
        pg.goto(B + "/" + path + "?test=1"); pg.wait_for_timeout(300)
        student = {"player": {"nickname": "Stu", "team": "", "classCode": "T1"}, "official": {"runId": "ABCD-EFGH", "seed": "ABCD-EFGH", "mode": "official", "stage": 0, "item": 0, "results": [], "complete": False, "player": {"nickname": "Stu", "team": "", "classCode": "T1"}}, "practice": None, "queue": []}
        pg.evaluate("s => localStorage.setItem('aig-arena-%s', JSON.stringify(s))" % game, student)
        pg.reload(); pg.wait_for_timeout(300); sent.clear()
        tb = pg.locator(".topbar .teacher-btn")
        check(tb.count() == 1 and "Teacher" in tb.get_attribute("aria-label"), f"{path}: 🎓 Teacher button in the top bar")
        tb.click(); pg.fill("#teacherCode", "WRONG"); pg.locator("#teacherDialog button[type=submit]").click(); pg.wait_for_timeout(300)
        check("isn't right" in pg.locator("#teacherDialog").inner_text() and pg.locator(".teacher-panel").count() == 0, f"{path}: a wrong code is refused")
        pg.fill("#teacherCode", "kwk-teach"); pg.locator("#teacherDialog button[type=submit]").click(); pg.wait_for_timeout(300)
        check(pg.locator(".teacher-panel").count() == 1 and pg.locator("#teacherDialog").count() == 0 and "✓" in tb.inner_text(), f"{path}: KWK-TEACH unlocks teacher mode (any case)")
        pg.reload(); pg.wait_for_timeout(300)
        check(pg.locator(".teacher-panel").count() == 1, f"{path}: teacher mode stays on after a reload")
        if has_lessons:
            pg.locator(".teacher-panel button:has-text('Lesson 4')").click(); pg.wait_for_timeout(300)
            t = pg.locator("main").inner_text().lower(); check("lesson 4" in t and "teacher mode" in t, f"{path}: lesson 4 opens directly, labelled teacher mode")
            pg.locator(".topbar .teacher-btn").click(); pg.wait_for_timeout(200)
        last = pg.locator(".teacher-panel button.primary").last; last.click(); pg.wait_for_timeout(300)
        pg.locator("button:has-text('Start')").first.click(); pg.wait_for_timeout(400)
        n = pg.locator(".teacher-panel button.primary").count()
        hud = pg.locator(".hud-card").inner_text()
        check("paused" in hud and "Teacher" in hud, f"{path}: the last stage opens directly; the timer is paused ({hud[:60]!r})")
        pg.wait_for_timeout(1500)
        check("paused" in pg.locator(".hud-card").inner_text() and pg.locator(".result-card").count() == 0, f"{path}: the timer doesn't run down")
        pg.locator("button:has-text('Show answer')").click(); pg.wait_for_timeout(200)
        right = pg.evaluate("(() => { const it = ARENA_TEST.item; return it.grade(typeof it.solve === 'function' ? it.solve() : it.key).frac; })()")
        check(pg.locator(".teacher-answer-card").count() == 1 and right == 1, f"{path}: Show answer shows the right answer (scores {right})")
        pg.evaluate("(() => { const it = ARENA_TEST.item; ARENA_TEST.submit(typeof it.solve === 'function' ? it.solve() : it.key); })()"); pg.wait_for_timeout(300)
        check(pg.locator(".result-card").count() == 1, f"{path}: an answer can still be submitted for the demo")
        pg.wait_for_timeout(500)
        check(len(sent) == 0, f"{path}: nothing sent to the scoreboard in teacher mode ({sent[:2]})")
        stu = pg.evaluate("localStorage.getItem('aig-arena-%s')" % game)
        check(json.loads(stu)["official"] == student["official"] and json.loads(stu)["queue"] == [], f"{path}: the student's own run is untouched")
        check(not pg.evaluate("Object.keys(localStorage).some(k => /done/.test(k) && /%s/.test(localStorage.getItem(k)))" % game), f"{path}: no 'done' tick for the game")
        pg.locator(".topbar .teacher-btn").click(); pg.wait_for_timeout(200)
        pg.locator("button:has-text('Leave teacher mode')").click(); pg.wait_for_timeout(200)
        check(pg.locator(".teacher-panel").count() == 0 and "✓" not in tb.inner_text() and pg.evaluate("localStorage.getItem('aig-teacher')") is None, f"{path}: Leave turns teacher mode off")
        check(not errs, f"{path}: no page errors {errs[:2]}")
        ctx.close()
    # control: in the same set-up, a normal official run DOES talk to the scoreboard (so "nothing sent" above means something)
    ctx = br.new_context(viewport={"width": 1100, "height": 900}); sent = []
    ctx.route("**/config.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=CFG))
    ctx.route("https://scoreboard.example/**", lambda r: (sent.append(r.request.url), r.fulfill(status=200, content_type="application/json", body='{"ok":true,"players":[]}')))
    pg = ctx.new_page(); pg.goto(B + "/llm/index.html?test=1"); pg.wait_for_timeout(300)
    pg.fill("#nick", "Ctrl"); pg.fill("#classCode", "ZZ1"); pg.locator("button:has-text('Start my run')").first.click(); pg.wait_for_timeout(1200)
    check(len(sent) >= 1, f"control: an official run does send to the scoreboard in this set-up ({len(sent)} requests)")
    ctx.close()
    # a teacher run played to the end: the results page leads back to the teacher menu, nothing is saved or ticked
    ctx = br.new_context(viewport={"width": 1100, "height": 900}); sent = []
    ctx.route("**/config.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=CFG))
    ctx.route("https://scoreboard.example/**", lambda r: (sent.append(r.request.url), r.fulfill(status=200, content_type="application/json", body='{"ok":true}')))
    pg = ctx.new_page(); pg.goto(B + "/warmup/index.html?test=1"); pg.wait_for_timeout(300)
    pg.evaluate("localStorage.setItem('aig-teacher','1')"); pg.reload(); pg.wait_for_timeout(300)
    before = pg.evaluate("[localStorage.getItem('aig-arena-warmup'), localStorage.getItem('aig2-done')]")
    pg.locator(".teacher-panel button.primary").first.click(); pg.wait_for_timeout(300)
    pg.locator("button:has-text('Start')").first.click(); pg.wait_for_timeout(300)
    for i in range(20):
        if pg.locator("h1:has-text('points')").count() and pg.locator("button:has-text('Back to teacher menu')").count(): break
        if pg.locator(".hud-card").count() and not pg.locator(".result-card").count():
            pg.evaluate("(() => { const it = ARENA_TEST.item; ARENA_TEST.submit(typeof it.solve === 'function' ? it.solve() : it.key); })()"); pg.wait_for_timeout(150)
        pg.evaluate("(() => { const b = [...document.querySelectorAll('main button')].filter(x => !x.disabled && /Next item|done →|See my results|Next:/.test(x.textContent)); if (b.length) b[b.length - 1].click(); })()"); pg.wait_for_timeout(200)
    check(pg.locator("button:has-text('Back to teacher menu')").count() == 1 and pg.locator("button:has-text('Practice run')").count() == 0, "teacher run to the end: 'Back to teacher menu', no 'Practice run' button")
    after = pg.evaluate("[localStorage.getItem('aig-arena-warmup'), localStorage.getItem('aig2-done')]")
    check(after[1] == before[1] and (after[0] is None or '"official":null' in after[0] or after[0] == before[0]) and '"teacher"' not in (after[0] or ""), f"teacher run to the end: no 'done' tick and no run saved ({after})")
    check(len(sent) == 0, "teacher run to the end: nothing sent")
    pg.locator("button:has-text('Back to teacher menu')").click(); pg.wait_for_timeout(200)
    check(pg.locator(".teacher-panel").count() == 1 and pg.locator("#nick").count() == 1, "back at the teacher menu; the sign-in form is still there for students")
    ctx.close()
    # phone width: the button fits, no sideways scroll
    ctx = br.new_context(viewport={"width": 360, "height": 740}, has_touch=True, is_mobile=True)
    ctx.route("**/config.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=CFG))
    pg = ctx.new_page(); pg.goto(B + "/agent/index.html?test=1"); pg.wait_for_timeout(300)
    pg.locator(".topbar .teacher-btn").tap(); pg.fill("#teacherCode", "KWK-TEACH"); pg.locator("#teacherDialog button[type=submit]").tap(); pg.wait_for_timeout(300)
    w = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check(w <= 1 and pg.locator(".teacher-panel").count() == 1, f"phone 360px: teacher mode works, no sideways scroll ({w}px)")
    if os.environ.get("SHOTS"): pg.screenshot(path=os.path.join(os.environ["SHOTS"], "teacher-panel-360.png"), full_page=True)
    br.close()
print(f"{len(fails)} check(s) FAILED" if fails else "All teacher-mode checks passed")
sys.exit(1 if fails else 0)
