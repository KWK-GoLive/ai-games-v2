"""Contrast of the Chula theme's text/background pairs (WCAG 2 formula). Reads the colours from the CSS files,
so a later colour change is checked too. Text needs 4.5:1 (large/bold >= 18.7px: 3:1)."""
import re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def css(p): return open(os.path.join(ROOT, p), encoding="utf-8").read()
V = {}
for f in ("shared/arena.css", "shared/theme-chula.css"):   # theme loads last, so it wins
    for k, v in re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{6})", css(f)): V[k] = v.lower()
theme = css("shared/theme-chula.css")
def rule(sel, prop):
    m = re.findall(re.escape(sel) + r"\s*\{[^}]*?" + prop + r":\s*(#[0-9a-fA-F]{6})", theme)
    return m[-1].lower() if m else None
def lum(h):
    c = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in c]
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
def cr(a, b): a, b = lum(a), lum(b); return (max(a, b) + .05) / (min(a, b) + .05)
OPAQUE = ".b.right .b-from { opacity: 1; }" in theme   # the theme shows sender names at full opacity on right bubbles
def mix(fg, bg, a):   # text with opacity a over bg
    f = [int(fg[i:i+2], 16) for i in (1, 3, 5)]; g = [int(bg[i:i+2], 16) for i in (1, 3, 5)]
    return "#" + "".join("%02x" % round(a * x + (1 - a) * y) for x, y in zip(f, g))
W = "#ffffff"
pairs = [  # (what, text, background, needed)
 ("body text", V["ink"], V["bg"], 4.5), ("muted text", V["ink-2"], V["surface"], 4.5), ("muted on surface-2", V["ink-2"], V["surface-2"], 4.5),
 ("dim text", V["ink-3"], V["surface"], 4.5), ("dim on surface-2", V["ink-3"], V["surface-2"], 4.5),
 ("links / kicker", V["accent"], V["surface"], 4.5), ("accent on surface-2", V["accent"], V["surface-2"], 4.5),
 ("primary button", V["accent-ink"], V["accent"], 4.5), ("model bubble (right)", W, V["accent"], 4.5),
 ("app bubble (right)", W, rule(".b.right.c-app", "background"), 4.5), ("human bubble (right)", W, rule(".b.right.c-human", "background"), 4.5),
 ("app bubble (left)", V["ink"], rule(".b.left.c-app", "background"), 4.5), ("human bubble (left)", V["ink"], rule(".b.left.c-human", "background"), 4.5),
 ("sender name on human (right)", mix(W, rule(".b.right.c-human", "background"), 1 if OPAQUE else .8), rule(".b.right.c-human", "background"), 4.5),
 ("sender name on app (right)", mix(W, rule(".b.right.c-app", "background"), 1 if OPAQUE else .8), rule(".b.right.c-app", "background"), 4.5),
 ("sender name on model (right)", mix(W, V["accent"], 1 if OPAQUE else .8), V["accent"], 4.5),
 ("unread badge", W, rule(".ph-badge", "background"), 4.5),
 ("Part A/B chip", rule(".part-chip", "color"), V["accent-soft"], 4.5),
 ("picked choice text", V["ink"], V["accent-soft"], 4.5),
 ("right answer text", V["good"], V["surface"], 4.5), ("wrong answer text", V["warn"], V["surface"], 4.5),
 ("mode pill / front-page game numbers", V["mode-ink"], V["warn-soft"], 4.5),
]
bad = 0
for what, t, b, need in pairs:
    r = cr(t, b); ok = r >= need; bad += not ok
    print(f"  {'ok  ' if ok else 'FAIL'} {r:5.2f}:1  {what}  ({t} on {b})")
print(f"{len(pairs)} pairs checked, {bad} below the WCAG AA minimum")
sys.exit(1 if bad else 0)
