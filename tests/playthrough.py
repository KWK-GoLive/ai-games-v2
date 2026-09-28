"""
AI games v2 — browser tests (Playwright + Chromium).   python3 tests/playthrough.py
Plays everything through the real pages, with a local copy of the scoreboard script (tests/mock-server.js runs
apps-script/Code.gs): the front page, the warm-up, all 7 lessons (answering every practice question, the spinner,
the guided writers, the sentence builder) and all 7 stages of Be the LLM Arena (Part A on one computer, Part B
continued on "another computer" with the resume code), the final arena, the scoreboard (tabs, Part A/B views),
the 1.5x timers, and page widths from phone to desktop. SHOTS=dir saves screenshots.
"""
import functools, http.server, json, os, socket, socketserver, subprocess, sys, threading, urllib.request, urllib.parse
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
    if not c: fails.append(m); print("  FAIL ", m)
def shot(page, name):
    if SHOTS: page.screenshot(path=os.path.join(SHOTS, name + ".png"), full_page=True)

def new_ctx(browser, factor=1.5, viewport=None):
    ctx = browser.new_context(viewport=viewport or {"width": 1100, "height": 900})
    body = f'window.AIG_CONFIG = {{ SCOREBOARD_URL: "{MOCK_URL}", BOARD_REFRESH_SECONDS: 3, TIME_FACTOR: {factor} }};'
    ctx.route("**/config.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=body))
    return ctx
def new_page(ctx):
    page = ctx.new_page(); page.errors = []
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    page.on("console", lambda m: page.errors.append("console: " + m.text) if m.type == "error" else None)
    return page

def no_hscroll(page, what):
    w = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check(w <= 1, f"{what}: no sideways scroll (overflow {w}px)")

def solve_practice(page):
    """Answer every open practice question (trying options, as a student may), and step through guided writers."""
    for _ in range(60):
        busy = False
        for c in page.locator(".practice").all():
            if c.locator(".feedback.good").count(): continue
            busy = True
            for j in range(c.locator(".choice").count()):
                if c.locator(".feedback.good").count(): break
                b = c.locator(".choice").nth(j)
                if b.is_enabled(): b.click(); page.wait_for_timeout(30)
        add = page.locator("button:has-text('Add '), button:has-text('Done ✓')")
        if add.count(): add.first.click(); page.wait_for_timeout(60); continue
        if not busy: return

def do_lesson(page, n, stats):
    for i in range(12):
        page.wait_for_timeout(60)
        title = page.locator("section.card h2").first.inner_text() if page.locator("section.card h2").count() else ""
        if "Spin and read" in title:
            for _ in range(2):
                page.locator("section.card button:has-text('Spin')").first.click(); page.wait_for_timeout(1700); solve_practice(page)
            stats["spins"] += 1
        if "the whole sentence" in title:
            key = page.evaluate("LLM_LESSONS.model('L2').generateTrail(['the'],1,0,8).trail.map(t=>BTL.Model.displayWord(t.word))")
            # a wrong try first: the feedback must say how many pieces were right
            page.locator(".tile").filter(has_text="dog").first.click(); page.locator(".tile").filter(has_text="runs").first.click()
            page.locator("button:has-text('Submit')").first.click(); page.wait_for_timeout(60)
            check("first 1 piece is right" in page.locator(".feedback.bad").last.inner_text(), "L2 builder: a wrong try says how much was right")
            page.locator("button:has-text('Clear')").first.click()
            for w in key: page.locator(".tile").filter(has_text=w).first.click()
            page.locator("button:has-text('Submit')").first.click(); page.wait_for_timeout(60)
            stats["builder"] += 1
        if "temperature dial" in title:
            # the slider really changes the bar: at 0 the top word gets 100%
            page.locator(".tv-slider").first.fill("0"); page.wait_for_timeout(50)
            check("play 100%" in page.locator(".tv-legend").first.inner_text() and page.locator(".tv-calc button:has-text('Spin')").first.is_disabled(), "L3 calculator at temperature 0: play 100%, no spin")
            page.locator(".tv-slider").first.fill("3"); page.wait_for_timeout(50)
            check("play 47%" in page.locator(".tv-legend").first.inner_text(), "L3 calculator at temperature 2 gives play 47%")
        solve_practice(page)
        no_hscroll(page, f"lesson {n} step {i+1} at {page.viewport_size['width']}px")
        if n in (3, 4, 6) and i == 2: shot(page, f"lesson{n}-step{i+1}")
        nxt = page.locator("button:has-text('Next →'), button:has-text('Start stage')")
        check(nxt.count() > 0, f"lesson {n} step {i+1} has a Next button")
        if not nxt.count(): return
        check(nxt.first.is_enabled(), f"lesson {n} step {i+1} ({title}) unlocks after the practice")
        if not nxt.first.is_enabled(): return
        txt = nxt.first.inner_text(); nxt.first.click()
        if "Start stage" in txt: stats["lessons"] += 1; return

def play_stage(page, sno, right=True):
    page.click("button:has-text('Start stage')")
    k = 0
    while True:
        page.wait_for_timeout(80)
        if k == 0:
            lim = page.evaluate("ARENA_TEST.item.limit")
            secs = int(page.locator(".hud + .row b, .row b").first.inner_text().rstrip("s"))
            check(abs(secs - round(lim * 1.5)) <= 1, f"stage {sno}: the timer is 1.5x ({secs}s for a {lim}s item)")
            if sno in (3, 5, 7): no_hscroll(page, f"stage {sno} item"); shot(page, f"stage{sno}-item")
            if sno in (5, 7): check(page.locator(".win-badge").count() == 1 and ("2-WORD" if sno == 5 else "3-WORD") in page.locator(".win-badge").inner_text(), f"stage {sno} item shows the window badge")
        if right: page.evaluate("ARENA_TEST.submit(ARENA_TEST.item.key)")
        else: page.evaluate("ARENA_TEST.submit(null)")
        page.wait_for_timeout(60)
        b = page.locator(".result-card button").first; t = b.inner_text(); b.click(); k += 1
        if "Next item" not in t: return k

with sync_playwright() as p:
    br = p.chromium.launch()
    # ---------- front page ----------
    ctx = new_ctx(br); page = new_page(ctx)
    page.goto(BASE + "/index.html")
    page.fill("#p-nick", "Ann"); page.fill("#p-team", "Red"); page.fill("#p-class", "t1"); page.click("#signin-body button[type=submit]")
    check("Playing as Ann" in page.locator("#signin-body").inner_text(), "front-page sign-in saved")
    check(page.locator("#games a.game").count() == 5, "5 games linked (3 LLM, 2 agent)")
    check(page.locator("#games a.game .right.go").count() == 1, "first game marked 'Play'")
    # ---------- warm-up ----------
    page.goto(BASE + "/warmup/index.html?test=1")
    page.click("button:has-text('Start my run')"); page.wait_for_timeout(300)
    check(page.locator(".rules, .v-rules").count() > 0, "warm-up rules shown")
    n = play_stage(page, 0)
    check(n == 8, f"warm-up has 8 questions ({n})")
    page.locator("button:has-text('See my results')").first.click(); page.wait_for_timeout(1500)
    b = board("warmup", "T1")
    check(b["players"] and b["players"][0]["nickname"] == "Ann" and b["players"][0]["points"] > 0 and b["players"][0]["perStage"] and len(b["players"][0]["perStage"]) == 1, "warm-up result on the scoreboard: " + json.dumps(b["players"][:1]))
    # ---------- main game: Part A ----------
    stats = {"lessons": 0, "spins": 0, "builder": 0}
    page.set_viewport_size({"width": 360, "height": 780})   # Part A on a small phone
    page.goto(BASE + "/llm/index.html?test=1"); page.wait_for_timeout(300)
    check("7 stages" in page.locator("main").inner_text(), "home says 7 stages")
    page.click("button:has-text('Start my run')"); page.wait_for_timeout(400)
    code = None
    for sno in range(1, 5):
        check(page.locator(".kicker", has_text=f"Lesson {sno} of 7").count() == 1, f"lesson {sno} comes before stage {sno}")
        do_lesson(page, sno, stats)
        page.wait_for_timeout(100)
        check(page.locator(".kicker", has_text=f"Stage {sno} of 7").count() == 1, f"stage {sno} intro after lesson {sno}")
        play_stage(page, sno)
        page.wait_for_timeout(150)
        if sno == 4:
            check(page.locator("h2", has_text="Part A complete").count() == 1, "Part A break card after stage 4")
            code = page.locator(".small.muted b.mono").first.inner_text()
            shot(page, "partA-done")
        else:
            page.locator("button:has-text('Next: lesson')").first.click()
    page.wait_for_timeout(1500)
    check(stats["spins"] == 1 and stats["builder"] == 1, "lesson 3 spinner and lesson 2 builder were played")
    # ---------- Part B on "another computer" ----------
    ctx2 = new_ctx(br, viewport={"width": 390, "height": 844}); page2 = new_page(ctx2)
    page2.goto(BASE + "/llm/index.html?test=1"); page2.wait_for_timeout(300)
    page2.locator("summary:has-text('Continue on another computer')").click()
    page2.fill("#rNick", "Ann"); page2.fill("#rClass", "T1"); page2.fill("#rCode", code); page2.click("button:has-text('Continue my run')"); page2.wait_for_timeout(1200)
    check(page2.locator(".kicker", has_text="Lesson 5 of 7").count() == 1, "resumed run starts at lesson 5 (Part B)")
    check(page2.locator(".win-badge").count() >= 1, "lesson 5 header shows the 2-word badge")
    for sno in range(5, 8):
        do_lesson(page2, sno, stats)
        page2.wait_for_timeout(100)
        play_stage(page2, sno)
        page2.wait_for_timeout(150)
        nb = page2.locator("button:has-text('Next: lesson'), button:has-text('See my results')")
        nb.first.click()
    page2.wait_for_timeout(1500)
    check(stats["lessons"] == 7, f"all 7 lessons completed ({stats['lessons']})")
    check("points" in page2.locator(".big-points").inner_text(), "results screen")
    no_hscroll(page2, "results on a phone"); shot(page2, "llm-results-phone")
    b = board("llm2", "T1")
    pl = b["players"][0] if b["players"] else {}
    check(pl.get("done") == 7 and len(pl.get("perStage", [])) == 7 and all(v for v in pl["perStage"]), "all 7 stages on the scoreboard: " + json.dumps(pl))
    # ---------- lesson skip when done before (practice run) ----------
    page2.locator("button:has-text('Practice run')").first.click(); page2.wait_for_timeout(300)
    check(page2.locator("button:has-text('Skip the lesson')").count() == 0, "lesson 1 can't be skipped on this device (only lessons 5-7 were done here)")
    # ---------- final arena ----------
    page.set_viewport_size({"width": 1100, "height": 900})
    page.goto(BASE + "/final/index.html?test=1"); page.wait_for_timeout(300)
    page.click("button:has-text('Start my run')"); page.wait_for_timeout(300)
    page.click("button:has-text('Start stage')")
    skills = []
    for i in range(12):
        page.wait_for_timeout(80)
        skills.append(page.locator(".kicker", has_text="Skill:").first.inner_text())
        if i in (4, 10): no_hscroll(page, f"final item {i+1}")
        page.evaluate("ARENA_TEST.submit(ARENA_TEST.item.key)"); page.wait_for_timeout(50)
        page.locator(".result-card button").first.click()
    check(len(skills) == 12 and "count it" in skills[0].lower() and "three-word" in skills[11].lower(), "final: 12 items in skill order: " + str(skills))
    page.locator("button:has-text('See my results')").first.click(); page.wait_for_timeout(1500)
    check(board("llmfinal", "T1")["players"][0]["items"] == 12, "final result on the scoreboard (12 items)")
    # front page ticks
    page.goto(BASE + "/index.html"); page.wait_for_timeout(200)
    check(page.locator("#games .right.done").count() == 2, "ticks: warm-up and final done on this device (main game was finished on the other one)")
    # ---------- scoreboard page ----------
    # a second player, only Part A
    import time
    for s_, pts in ((1, 900), (2, 100)):
        urllib.request.urlopen(MOCK_URL + "?" + urllib.parse.urlencode({"action": "post", "payload": json.dumps({"game": "llm2", "classCode": "T1", "nickname": "Bo", "runId": "BOBO-BOBO", "stage": s_, "stageName": "x", "items": 5, "correct": 5, "points": pts, "seconds": 30, "hints": 0})})).read()
    page.goto(BASE + "/board.html?class=T1"); page.wait_for_timeout(1200)
    check(page.locator(".tabs [aria-selected=true]").inner_text() == "Be the LLM Arena", "board opens on Be the LLM Arena")
    check(page.locator("table.board").first.locator("thead th").count() == 2 + 7 + 3, "7 stage columns + right + % right + points")
    page.locator("button:has-text('Part B')").click(); page.wait_for_timeout(200)
    rows = page.locator("table.board").first.locator("tbody tr").all_inner_texts()
    check(len(rows) == 1 and "Ann" in rows[0], "Part B view lists only players with Part B stages")
    page.locator("button:has-text('Part A')").click(); page.wait_for_timeout(200)
    check("part=A" in page.url and page.locator("table.board").first.locator("thead th").count() == 2 + 4 + 1, "Part A view: 4 stage columns + part points, URL keeps the part")
    for g_, st_ in (("agent2", 1), ("agent2", 5), ("agentfinal", 1)):
        urllib.request.urlopen(MOCK_URL + "?" + urllib.parse.urlencode({"action": "post", "payload": json.dumps({"game": g_, "classCode": "T1", "nickname": "Bo", "runId": "BOBO-AGNT" if g_ == "agent2" else "BOBO-AGFN", "stage": st_, "stageName": "x", "items": 4, "correct": 4, "points": 400, "seconds": 40, "hints": 0})})).read()
    page.locator("button:has-text('All 7 stages')").click(); page.wait_for_timeout(200)
    for tab, cols in (("Warm-up", 2 + 1 + 3), ("LLM final", 2 + 1 + 3), ("Be the Agent Arena", 2 + 7 + 3), ("Agent Arena", 2 + 1 + 3)):
        page.get_by_role("tab", name=tab, exact=True).click(); page.wait_for_timeout(900)
        check(page.locator("table.board").first.locator("thead th").count() == cols, f"board tab {tab}")
    for w in (360, 390, 768, 1024, 1366):
        for url in ("/index.html", "/board.html?class=T1", "/llm/index.html", "/warmup/index.html", "/final/index.html", "/agent/index.html", "/agent-final/index.html"):
            page.set_viewport_size({"width": w, "height": 800}); page.goto(BASE + url); page.wait_for_timeout(250)
            no_hscroll(page, f"{url} at {w}px")

    # live positions were sent while playing (the LLM games use the same arena code as Be the Agent)
    live = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{MOCK}/__live").read())
    games = sorted(set(k.split("|")[1] for k in live))
    check("llm2" in games and "llmfinal" in games, f"live positions sent for the LLM games ({games})")
    for pg in (page, page2):
        check(not pg.errors, "no page errors: " + "; ".join(pg.errors[:5]))
    br.close()
mock.terminate(); httpd.shutdown()
print(f"{len(fails)} check(s) FAILED" if fails else "All browser checks passed")
sys.exit(1 if fails else 0)
