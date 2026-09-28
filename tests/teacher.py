"""
AI games v2 — live progress and the teacher view (Playwright + Chromium + tests/mock-server.js running the real Code.gs).
   python3 tests/teacher.py        (SHOTS=dir saves screenshots)
A student plays ALL of Be the Agent Arena and the Agent Arena through the real pages (class T9). After every lesson
opens and after every answered item, the scoreboard must show exactly where the student is: the stage, "lesson" or
items answered, and the points so far (compared with the game's own numbers); a finished stage replaces the live
position. Meanwhile teacher.html shows the 4 boards in one window, refreshes by itself, fits one 1280x720 screen,
and has no sideways scroll from 390 to 1920 px.
"""
import importlib.util, json, os, subprocess, socket, sys, time, urllib.request, urllib.parse
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("agentplay", os.path.join(HERE, "agent-play.py"))
AP = importlib.util.module_from_spec(spec); spec.loader.exec_module(AP)
check, fails, SHOTS = AP.check, AP.fails, os.environ.get("SHOTS")

def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p
MOCK = free_port()
mock = subprocess.Popen(["node", os.path.join(HERE, "mock-server.js"), str(MOCK)], stdout=subprocess.PIPE)
mock.stdout.readline()
MOCK_URL = f"http://127.0.0.1:{MOCK}/exec"
for _ in range(50):   # wait until the mock scoreboard answers
    try: urllib.request.urlopen(MOCK_URL + "?action=ping", timeout=1).read(); break
    except Exception: time.sleep(0.1)
def api(**q): return json.loads(urllib.request.urlopen(MOCK_URL + "?" + urllib.parse.urlencode(q)).read())
def me(game, nick):
    ps = [p for p in api(action="board", game=game, classCode="T9")["players"] if p["nickname"] == nick]
    return ps[0] if ps else None
def wait_for(fn, what, secs=6):
    t = time.time()
    while time.time() - t < secs:
        v = fn()
        if v: return v
        time.sleep(0.2)
    check(False, what); return None

# a few classmates so the boards aren't empty
def seed():
    for g, nick, run, st, pts in (("agent2", "Nok", "N1", 1, 520), ("agent2", "Nok", "N1", 2, 400), ("llm2", "Pim", "P1", 1, 610), ("llmfinal", "Pim", "P2", 1, 1900), ("agentfinal", "Nok", "N2", 0, 0)):
        api(action="post", payload=json.dumps({"game": g, "classCode": "T9", "nickname": nick, "runId": run, "stage": st, "stageName": "x", "items": 5 if st else 0, "correct": 3, "points": pts, "seconds": 60, "hints": 0, "team": "Blue"}))
    api(action="progress", payload=json.dumps({"game": "agent2", "classCode": "T9", "nickname": "Nok", "runId": "N1", "stage": 3, "phase": "lesson", "item": 0, "items": 4, "points": 0, "correct": 0}))
    api(action="progress", payload=json.dumps({"game": "agentfinal", "classCode": "T9", "nickname": "Nok", "runId": "N2", "stage": 1, "phase": "item", "item": 5, "items": 12, "points": 700, "correct": 5}))
seed()

NICK = "t1100"   # agent-play.py types "t" + W as the nickname
CFG = f'window.AIG_CONFIG={{SCOREBOARD_URL:"{MOCK_URL}",BOARD_REFRESH_SECONDS:3,TIME_FACTOR:1.5}};'
PROFILE = "try { if (!localStorage.getItem('aig-player')) localStorage.setItem('aig-player', JSON.stringify({ nickname: '', team: 'Red', classCode: 'T9' })); } catch (e) {}"

teacher = {}
def open_teacher(br):
    ctx = br.new_context(viewport={"width": 1280, "height": 720})
    ctx.route("**/config.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=CFG))
    pg = ctx.new_page(); pg.errors = []; pg.on("pageerror", lambda e: pg.errors.append(str(e)))
    pg.goto(AP.BASE + "/teacher.html?class=T9"); pg.wait_for_timeout(1200)
    teacher["pg"] = pg
    check(pg.locator(".tv-board").count() == 4, "teacher view: 4 boards")
    check([t.strip() for t in pg.locator(".tv-head h2").all_inner_texts()] == ["Be the LLM Arena", "LLM final", "Be the Agent Arena", "Agent Arena"], "teacher view: the 4 main boards in order")
    fits = pg.evaluate("[...document.querySelectorAll('.tv-board')].every(b => b.getBoundingClientRect().bottom <= innerHeight + 1)")
    check(fits, "teacher view: all 4 boards fit one 1280x720 screen")
    return pg
def teacher_row(nick, board_index):
    """the row's texts: 'rank|nick+team|position|points', and its tooltip"""
    pg = teacher["pg"]
    row = pg.locator(".tv-board").nth(board_index).locator(f'.tv-row[data-nick="{nick}"]')
    if not row.count(): return ""
    return " | ".join([row.locator(".pos").inner_text(), row.locator(".pts").inner_text(), row.get_attribute("title") or "", row.get_attribute("class")])

state = {"n": 0}
def expected(pg):
    return pg.evaluate("""(() => { const t = window.ARENA_TEST; if (!t) return null; const r = t.run;
        const sr = (r.results[r.stage] || []).filter(Boolean);
        return { stage: r.stage + 1, item: r.item, complete: r.complete, points: sr.reduce((a, x) => a + x.points, 0),
                 lastStage: r.stage, lastPoints: (r.results[r.stage - 1] || []).reduce((a, x) => a + (x ? x.points : 0), 0) }; })()""")

def per_item(pg, what):
    game = "agentfinal" if "arena step" in what else "agent2"
    e = expected(pg)
    if not e: check(False, f"{what}: test hook"); return
    if e["item"] == 0:   # that item finished its stage: the finished row replaces the live position
        p = wait_for(lambda: (lambda x: x if x and x["perStage"][e["lastStage"] - 1] is not None and x["live"] is None else None)(me(game, NICK)), f"{what}: finished stage on the board, live position cleared")
        if p: check(p["perStage"][e["lastStage"] - 1] == e["lastPoints"], f"{what}: finished stage points {e['lastPoints']} on the board ({p['perStage']})")
    else:
        p = wait_for(lambda: (lambda x: x if x and x["live"] and x["live"]["stage"] == e["stage"] and x["live"]["item"] == e["item"] else None)(me(game, NICK)), f"{what}: live position stage {e['stage']} item {e['item']} on the board")
        if p: check(p["live"]["phase"] == "item" and p["live"]["points"] == e["points"] and p["livePoints"] == p["points"] + e["points"], f"{what}: live points {e['points']} (board {p['live']}, {p['livePoints']})")
    state["n"] += 1
    if state["n"] == 9 and "pg" in teacher:   # mid-game: the teacher view shows the same thing after its own refresh
        tp = teacher["pg"]; before = teacher_row(NICK, 2)
        tp.wait_for_timeout(3600)
        row = teacher_row(NICK, 2)
        check(row != before, f"teacher view refreshed by itself ({before!r} -> {row!r})")
        want = f"S{e['stage']} ▶ {e['item']}/" if e["item"] else "S"
        check(want in row, f"teacher view shows {want!r} for {NICK}: {row!r}")
        if SHOTS: tp.screenshot(path=os.path.join(SHOTS, "teacher-1280x720.png"))

orig_lesson = AP.do_lesson
def lesson_hook(pg, n):
    p = wait_for(lambda: (lambda x: x if x and x["live"] and x["live"]["phase"] == "lesson" and x["live"]["stage"] == n else None)(me("agent2", NICK)), f"lesson {n}: the board shows 'reading lesson {n}'")
    return orig_lesson(pg, n)
AP.do_lesson = lesson_hook

with sync_playwright() as p:
    br = p.chromium.launch()
    open_teacher(br)
    check("📖 L3" in teacher_row("Nok", 2) and "Reading lesson 3" in teacher_row("Nok", 2), f"teacher view: a classmate reading lesson 3 ({teacher_row('Nok', 2)!r})")
    check("▶ 5/12" in teacher_row("Nok", 3) and "| 700 |" in teacher_row("Nok", 3), f"teacher view: the Agent Arena shows 5/12 answered, 700 points ({teacher_row('Nok', 3)!r})")
    check("idle" not in teacher_row("Nok", 3), "a fresh position is not idle")
    ctx = br.new_context(viewport={"width": 1100, "height": 900}, accept_downloads=True)
    ctx.route("**/config.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=CFG))
    ctx.add_init_script(PROFILE)
    AP.play(ctx, "live", 1100, per_item)
    tp = teacher["pg"]; tp.wait_for_timeout(3600)
    row = teacher_row(NICK, 2)
    check("✓ done" in row and "Finished all 7 stages" in row, f"teacher view: {NICK} finished Be the Agent Arena ({row!r})")
    check("✓ done" in teacher_row(NICK, 3), f"teacher view: {NICK} finished the Agent Arena ({teacher_row(NICK, 3)!r})")
    b = api(action="board", game="agent2", classCode="T9")
    check(b["players"][0]["nickname"] == NICK and f"| {b['players'][0]['livePoints']} |" in teacher_row(NICK, 2), "teacher view points = board live points, ranked first")
    # idle: a position with no news for 10 minutes is faded
    urllib.request.urlopen(f"http://127.0.0.1:{MOCK}/__agelive?ms=600000").read(); tp.wait_for_timeout(3600)
    check("idle" in teacher_row("Nok", 2) and "no answer for 5 minutes" in teacher_row("Nok", 2), f"teacher view: an old position is marked idle ({teacher_row('Nok', 2)!r})")
    # a real class size: 40 players per board -> 2 columns inside each board, slow auto-scroll, still one screen
    for g in ("llm2", "llmfinal", "agent2", "agentfinal"):
        for k in range(40):
            run = f"B{g}{k}"
            api(action="post", payload=json.dumps({"game": g, "classCode": "T9", "nickname": f"Student{k:02d}", "runId": run, "stage": 0, "stageName": "joined", "items": 0, "correct": 0, "points": 0, "seconds": 0, "hints": 0, "team": "Team" + str(k % 5)}))
            api(action="progress", payload=json.dumps({"game": g, "classCode": "T9", "nickname": f"Student{k:02d}", "runId": run, "stage": 1 if g.endswith("final") else 1 + k % 7, "phase": "item", "item": k % 4, "items": 12 if g.endswith("final") else 5, "points": 37 * k, "correct": 1}))
    tp.set_viewport_size({"width": 1280, "height": 720}); tp.wait_for_timeout(3800)
    lay = tp.evaluate("""[...document.querySelectorAll('.tv-board')].map(b => { const body = b.querySelector('.tv-body'), rows = [...b.querySelectorAll('.tv-row')], br = body.getBoundingClientRect();
        return { two: !!b.querySelector('.tv-list.two'), rows: rows.length, visible: rows.filter(r => { const q = r.getBoundingClientRect(); return q.top >= br.top - 1 && q.bottom <= br.bottom + 1 && q.width > 0; }).length,
                 rowH: rows.length ? Math.round(rows[0].getBoundingClientRect().height) : 0, bottom: Math.round(b.getBoundingClientRect().bottom) }; })""")
    print("  40 players per board at 1280x720:", lay)
    check(all(x["two"] for x in lay), "40 players: two columns inside each board")
    check(all(x["bottom"] <= 721 for x in lay), "40 players: the 4 boards still fit one 1280x720 screen")
    check(all(x["visible"] >= 20 for x in lay), f"40 players: at least 20 players visible per board at once ({[x['visible'] for x in lay]})")
    s0 = tp.evaluate("document.querySelectorAll('.tv-body')[0].scrollTop"); tp.wait_for_timeout(2500); s1 = tp.evaluate("document.querySelectorAll('.tv-body')[0].scrollTop")
    check(s1 > s0, f"a board that doesn't fit scrolls slowly by itself ({s0} -> {s1})")
    if SHOTS: tp.screenshot(path=os.path.join(SHOTS, "teacher-40-1280x720.png"))
    for w, hgt in ((1920, 1080), (1280, 720), (1024, 768), (390, 844)):
        tp.set_viewport_size({"width": w, "height": hgt}); tp.wait_for_timeout(400)
        AP.no_hscroll(tp, f"teacher view at {w}px")
        if w >= 1024: check(tp.evaluate("document.documentElement.scrollHeight <= innerHeight + 1"), f"teacher view at {w}x{hgt}: no page scroll (boards fit under the top bar)")
        if SHOTS and w in (1920, 390): tp.screenshot(path=os.path.join(SHOTS, f"teacher-{w}.png"), full_page=(w == 390))
    # the single board shows the live cell too
    bp = tp.context.new_page(); bp.errors = []; bp.on("pageerror", lambda e: bp.errors.append(str(e))); bp.goto(AP.BASE + "/board.html?class=T9&game=agent2"); bp.wait_for_timeout(1200)
    check("📖 lesson" in bp.locator("table.board").first.inner_text(), "single board: a live 'lesson' cell for the classmate")
    check(bp.locator("a:has-text('All 4 boards')").get_attribute("href") == "teacher.html?class=T9", "single board links to the teacher view with the class")
    check(not tp.errors and not bp.errors, "no page errors: " + "; ".join((tp.errors + bp.errors)[:3]))
    br.close()
mock.terminate(); AP.httpd.shutdown()
print(f"{len(fails)} check(s) FAILED" if fails else "All live-progress and teacher-view checks passed")
sys.exit(1 if fails else 0)
