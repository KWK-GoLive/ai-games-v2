"""
AI games v2 — phone and tablet tests: an emulated iPhone 13 and iPad (gen 7) in Chromium, with a touch screen.
Taps (not clicks) through lesson 1, checks every tap target is at least 40 px tall and nothing scrolls sideways,
and uses the temperature calculator by touch (Spin, the + button, tapping the slider).   python3 tests/touch.py
"""
import functools, http.server, os, socketserver, sys, threading
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
def shot(page, name):
    if SHOTS: page.screenshot(path=os.path.join(SHOTS, name + ".png"), full_page=True)
def new_page(ctx):
    page = ctx.new_page(); page.errors = []; page.set_default_timeout(8000)
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    return page
def no_hscroll(page, what):
    w = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check(w <= 1, f"{what}: no sideways scroll (overflow {w}px)")
with sync_playwright() as p:
    br = p.chromium.launch()
    # ---------- touch devices: iPhone and iPad (emulated, tapping instead of clicking) ----------
    for dev in ("iPhone 13", "iPad (gen 7)"):
        d = dict(p.devices[dev]); d.pop("default_browser_type", None)
        body = f'window.AIG_CONFIG = {{ SCOREBOARD_URL: "", BOARD_REFRESH_SECONDS: 3, TIME_FACTOR: 1.5 }};'
        tctx = br.new_context(**d)
        tctx.route("**/config.js", (lambda b: (lambda r: r.fulfill(status=200, content_type="application/javascript", body=b)))(body))  # (a 2-argument handler would get the request as 2nd argument)
        tp = new_page(tctx)
        tp.goto(BASE + "/llm/index.html?test=1", wait_until="domcontentloaded"); tp.wait_for_timeout(300)
        tp.fill("#nick", "Tap"); tp.locator("button:has-text('Start my run')").tap(); tp.wait_for_timeout(300)
        # lesson 1 by tapping: every practice answered with taps
        for i in range(8):
            for c in tp.locator(".practice").all():
                for j in range(c.locator(".choice").count()):
                    if c.locator(".feedback.good").count(): break
                    b = c.locator(".choice").nth(j)
                    if b.is_enabled(): b.tap(); tp.wait_for_timeout(30)
            no_hscroll(tp, f"{dev}: lesson 1 step {i+1}")
            small = tp.evaluate("""[...document.querySelectorAll('main button, main .choice, main .tile, main input')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).map(e => e.textContent.trim().slice(0, 20))""")
            check(not small, f"{dev}: lesson 1 step {i+1}: every tap target is at least 40px tall ({small})")
            nxt = tp.locator("button:has-text('Next →'), button:has-text('Start stage')").first
            t = nxt.inner_text(); nxt.tap(); tp.wait_for_timeout(120)
            if "Start stage" in t: break
        check(tp.locator(".kicker", has_text="Stage 1 of 7").count() == 1, f"{dev}: lesson 1 finished by tapping")
        tp.locator("button:has-text('Start stage')").tap(); tp.wait_for_timeout(200)
        no_hscroll(tp, f"{dev}: stage 1 item")
        # the temperature calculator on a touch screen: the slider and the Spin button
        tp.evaluate("ARENA._renderHome && 0")
        tp.goto(BASE + "/llm/index.html?test=1", wait_until="domcontentloaded"); tp.wait_for_timeout(200)
        tp.evaluate("""(() => { const box = document.createElement('div'); box.id = 'calcTest'; document.querySelector('main').prepend(box);
            box.appendChild(TV.calculator({ ctx: 'x', dist: [{word:'a',count:6},{word:'b',count:3},{word:'c',count:1}], T: 1, spin: true, editable: true }).el); })()""")
        tp.locator("#calcTest button:has-text('Spin')").tap(); tp.wait_for_timeout(1700)
        check("The pointer stopped at" in tp.locator("#calcTest .tv-out").inner_text(), f"{dev}: Spin works by tapping")
        tp.locator("#calcTest button[aria-label='one more c']").tap(); tp.wait_for_timeout(50)
        check("2 times" in tp.locator("#calcTest .counts .c").nth(2).inner_text(), f"{dev}: + button works by tapping")
        box = tp.locator("#calcTest .tv-slider").bounding_box()
        tp.touchscreen.tap(box["x"] + 4, box["y"] + box["height"] / 2); tp.wait_for_timeout(80)
        check("100%" in tp.locator("#calcTest .tv-legend").inner_text() and tp.locator("#calcTest button:has-text('Spin')").is_disabled(), f"{dev}: tapping the slider's left end sets temperature 0")
        no_hscroll(tp, f"{dev}: calculator")
        shot(tp, dev.replace(" ", "_").replace("(", "").replace(")", "") + "-calculator")
        # ---------- Be the Agent: lesson 1 replays and the 3 phones by tapping ----------
        tp.goto(BASE + "/agent/index.html?test=1", wait_until="domcontentloaded"); tp.wait_for_timeout(300)
        if tp.locator("#nick").is_visible(): tp.fill("#nick", "Tap2")
        tp.locator("button:has-text('Start my run'):visible").first.tap(); tp.wait_for_timeout(300)
        for i in range(6):
            while tp.locator("button:has-text('Next message'):not([disabled])").count():
                tp.locator("button:has-text('Next message'):not([disabled])").first.tap(); tp.wait_for_timeout(40)
            no_hscroll(tp, f"{dev}: agent lesson 1 step {i+1}")
            small = tp.evaluate("""[...document.querySelectorAll('main button, main .choice, main input')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).map(e => e.textContent.trim().slice(0, 20))""")
            check(not small, f"{dev}: agent lesson 1 step {i+1}: every tap target is at least 40px tall ({small})")
            if i == 1:
                tabs = tp.locator(".ph-tabs").first
                if tabs.is_visible():  # phone: one phone at a time, with tabs
                    tabs.locator("button:has-text('Ploy')").tap(); tp.wait_for_timeout(60)
                    check(tp.locator(".phones").first.locator(".ph-human.on").is_visible(), f"{dev}: tapping the Ploy tab shows the Human phone")
                else:
                    check(tp.locator(".phones").first.locator(".ph-apps").is_visible(), f"{dev}: 3 phones side by side")
                shot(tp, dev.replace(" ", "_").replace("(", "").replace(")", "") + "-agent-lesson1")
            if tp.locator(".move").count() and not tp.locator(".feedback.good").count():
                it = tp.evaluate("(() => { const it = window.AGENT_LAST_ITEM; return { kind: it.kind, key: it.key }; })()")
                check(it["kind"] == "toolpick", f"{dev}: lesson 1 practice is a Which-app item")
                tp.locator(f'.move >> nth=0 >> .choice[data-value="{it["key"]["tool"]}"]').first.tap(); tp.wait_for_timeout(80)
                tp.locator(f'.move >> nth=1 >> .choice[data-value="{it["key"]["reply"]}"]').first.tap(); tp.wait_for_timeout(80)
                check(tp.locator(".feedback.good").count() == 1, f"{dev}: lesson 1 practice solved by tapping")
                no_hscroll(tp, f"{dev}: agent lesson 1 practice")
            nxt = tp.locator("button:has-text('Next →'), button:has-text('Start stage')").first
            if not nxt.count(): break
            t = nxt.inner_text(); nxt.tap(); tp.wait_for_timeout(120)
            if "Start stage" in t: break
        check(tp.locator("button:has-text('Start stage')").count() == 1 or tp.locator(".kicker", has_text="Stage 1 of 7").count() == 1, f"{dev}: agent lesson 1 finished by tapping")
        check(not tp.errors, f"{dev}: no page errors: " + "; ".join(tp.errors[:3]))
        tctx.close()
    br.close()
httpd.shutdown()
print(f"{len(fails)} check(s) FAILED" if fails else "All phone/tablet checks passed")
sys.exit(1 if fails else 0)
