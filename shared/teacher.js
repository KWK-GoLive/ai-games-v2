/*
 * AI games v2 — teacher view (teacher.html): the 4 main scoreboards in one window, for the projector.
 * Be the LLM Arena, LLM final, Be the Agent Arena, Agent Arena. One request per refresh (action=boards).
 * Each row (one line): rank, nickname (team), progress (one segment per stage; the current stage fills as items are
 * answered, striped = reading the lesson; the finals have one segment per item), where the player is now, and live
 * points (finished stages + items answered so far). A big class gets two columns inside a board, and a board that
 * still doesn't fit scrolls slowly by itself (it stops while the mouse is over it).
 * URL options: ?class=SEC1  &projector=1 (big text)
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, clear = A.clear;
  var CFG = window.AIG_CONFIG || {};
  var URL_ = String(CFG.SCOREBOARD_URL || "").trim();
  var app = document.getElementById("app"), updated = document.getElementById("updated");
  var params = new URLSearchParams(location.search);
  var BOARDS = [
    { id: "llm2", name: "Be the LLM Arena", stages: 7 },
    { id: "llmfinal", name: "LLM final", stages: 1 },
    { id: "agent2", name: "Be the Agent Arena", stages: 7 },
    { id: "agentfinal", name: "Agent Arena", stages: 1 }
  ];
  var IDLE_MS = 5 * 60 * 1000;   // no new answer for 5 minutes: the row is faded
  var refresh = Math.max(3, Number(CFG.BOARD_REFRESH_SECONDS) || 5) * 1000;
  var classCode = A.cleanClass(params.get("class") || "");
  var cc = document.getElementById("cc"), single = document.getElementById("single");
  cc.value = classCode;

  /* the boards fill the screen under the top bar, whatever its height (it can wrap) */
  var topbar = document.querySelector(".topbar");
  function fit() { document.documentElement.style.setProperty("--top", (topbar ? topbar.offsetHeight : 64) + "px"); }
  fit(); window.addEventListener("resize", fit);
  if (window.ResizeObserver && topbar) new ResizeObserver(fit).observe(topbar);
  if (params.get("projector") === "1") document.documentElement.classList.add("projector");
  document.getElementById("big").addEventListener("click", function () { document.documentElement.classList.toggle("projector"); fit(); relayout(); });

  if (!A.boardEnabled) {
    app.appendChild(h("section", { class: "card stack" }, h("h1", { text: "The scoreboard isn't connected yet" }),
      h("p", { text: "Paste your Google Apps Script web-app URL into SCOREBOARD_URL in config.js (see README, “Scoreboard”)." })));
    return;
  }
  var msg = h("p", { class: "feedback", "aria-live": "polite" });
  var grid = h("div", { class: "tv-grid" });
  app.appendChild(msg); app.appendChild(grid);
  var panels = {};
  BOARDS.forEach(function (b) {
    var count = h("span", { class: "muted" });
    var open = h("a", { class: "open", text: "details ↗" });
    var body = h("div", { class: "tv-body" });
    var el = h("section", { class: "tv-board", "aria-label": b.name }, h("div", { class: "tv-head" }, h("h2", { text: b.name }), count, open), body);
    grid.appendChild(el);
    var P = panels[b.id] = { count: count, open: open, body: body, hover: false, pause: 0 };
    body.addEventListener("mouseenter", function () { P.hover = true; });
    body.addEventListener("mouseleave", function () { P.hover = false; });
  });
  function links() {
    BOARDS.forEach(function (b) { panels[b.id].open.href = "board.html?game=" + b.id + (classCode ? "&class=" + encodeURIComponent(classCode) : ""); });
    single.href = "board.html" + (classCode ? "?class=" + encodeURIComponent(classCode) : "");
  }
  links();
  document.getElementById("cf").addEventListener("submit", function (e) {
    e.preventDefault();
    classCode = A.cleanClass(cc.value); cc.value = classCode;
    var q = new URLSearchParams(location.search); if (classCode) q.set("class", classCode); else q.delete("class");
    try { history.replaceState(null, "", "?" + q.toString()); } catch (x) { /* file:// */ }
    links(); load(true);
  });

  /* where the player is now: a short text for the row, and a longer one for the tooltip */
  function position(b, p) {
    if (p.done >= b.stages) return { s: "✓ done", l: b.stages > 1 ? "Finished all " + b.stages + " stages" : "Finished", fin: true };
    var lv = p.live;
    if (!lv) return p.done ? { s: "S" + p.done + " ✓", l: "Stage " + p.done + " done" } : { s: "joined", l: "Joined, not started yet" };
    if (lv.phase === "lesson") return { s: "📖 L" + lv.stage, l: "Reading lesson " + lv.stage };
    return { s: (b.stages > 1 ? "S" + lv.stage + " " : "") + "▶ " + lv.item + "/" + lv.items,
      l: (b.stages > 1 ? "Stage " + lv.stage + ": " : "") + lv.item + " of " + lv.items + " answered, " + lv.points + " points so far" };
  }
  function segments(b, p) {
    var segs = [];
    if (b.stages === 1) {   // a final: one segment per item
      var n = (p.live && p.live.items) || 12, k = p.done >= 1 ? n : p.live && p.live.phase !== "lesson" ? p.live.item : 0;
      for (var i = 0; i < n; i++) segs.push(h("span", { class: i < k ? "done" : "" }));
    } else {
      for (var s = 1; s <= b.stages; s++) {
        var fin = p.perStage[s - 1] != null, cur = p.live && p.live.stage === s;
        if (fin) segs.push(h("span", { class: "done" }));
        else if (cur && p.live.phase === "lesson") segs.push(h("span", { class: "lesson" }));
        else if (cur) segs.push(h("span", { class: "cur" }, h("i", { style: "width:" + Math.round(100 * p.live.item / Math.max(1, p.live.items)) + "%" })));
        else segs.push(h("span", {}));
      }
    }
    return h("div", { class: "segs", "aria-hidden": "true" }, segs);
  }
  function renderBoard(b, r, now) {
    var P = panels[b.id], keep = P.body.scrollTop;
    clear(P.body);
    var players = (r && r.players) || [];
    var playing = players.filter(function (p) { return p.live && now - p.live.time < IDLE_MS && p.done < b.stages; }).length;
    P.count.textContent = players.length + " player" + (players.length === 1 ? "" : "s") + (playing ? " · " + playing + " playing now" : "");
    if (!players.length) { P.body.appendChild(h("p", { class: "tv-empty", text: classCode ? "No one yet." : "" })); P.list = null; return; }
    var list = h("div", { class: "tv-list" });
    players.forEach(function (p, i) {
      var pos = position(b, p);
      var idle = !!(p.live && !pos.fin && now - p.live.time >= IDLE_MS);
      var pts = p.livePoints != null ? p.livePoints : p.points;
      list.appendChild(h("div", { class: "tv-row" + (i === 0 ? " top1" : "") + (idle ? " idle" : ""), "data-nick": p.nickname, title: p.nickname + (p.team ? " (" + p.team + ")" : "") + ": " + pos.l + (idle ? " (no answer for 5 minutes)" : "") + " · " + pts + " points" },
        h("span", { class: "rank", text: String(i + 1) }),
        h("span", { class: "tv-nick" }, p.nickname, p.team ? h("small", { text: p.team }) : null),
        segments(b, p),
        h("span", { class: "pos" + (pos.fin ? " fin" : ""), text: pos.s }),
        h("span", { class: "pts", text: String(pts) })));
    });
    P.body.appendChild(list);
    P.list = list;
    layout(P);
    P.body.scrollTop = keep;
  }
  /* two columns inside a board when its rows don't fit in one column and the board is wide enough */
  function layout(P) {
    if (!P.list) return;
    P.list.classList.remove("two");
    if (P.body.clientWidth >= 560 && P.list.offsetHeight > P.body.clientHeight) P.list.classList.add("two");
  }
  function relayout() { BOARDS.forEach(function (b) { layout(panels[b.id]); }); }
  window.addEventListener("resize", relayout);

  /* slow auto-scroll for a board that still doesn't fit: down about 20 px a second, a pause at each end */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setInterval(function () {
    if (reduce || document.hidden) return;
    BOARDS.forEach(function (b) {
      var P = panels[b.id], el = P.body, max = el.scrollHeight - el.clientHeight;
      if (max <= 2 || P.hover) return;
      if (P.pause > 0) { P.pause -= 1; return; }
      if (el.scrollTop >= max - 1) { el.scrollTop = 0; P.pause = 40; return; }   // back to the top, then wait ~4 s
      el.scrollTop = Math.min(max, el.scrollTop + 2);
      if (el.scrollTop >= max - 1) P.pause = 40;
    });
  }, 100);

  /* refresh: one request at a time, aborted after 20 s, slower after errors, paused while the tab is hidden */
  var seq = 0, timer = null, delay = refresh, ctl = null;
  function getBoards() {
    ctl = window.AbortController ? new AbortController() : null;
    var c = ctl, t = setTimeout(function () { if (c) c.abort(); }, 20000);
    var q = "action=boards&games=" + BOARDS.map(function (b) { return b.id; }).join(",") + "&classCode=" + encodeURIComponent(classCode) + "&t=" + Date.now();
    return fetch(URL_ + (URL_.indexOf("?") >= 0 ? "&" : "?") + q, { cache: "no-store", signal: c ? c.signal : undefined })
      .then(function (r) { return r.json(); })
      .then(function (v) { clearTimeout(t); return v; }, function (e) { clearTimeout(t); throw (e && e.name === "AbortError") ? new Error("no answer from the scoreboard") : e; });
  }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(function () { load(false); }, ms); }
  function load(show) {
    clearTimeout(timer);
    if (ctl) { try { ctl.abort(); } catch (e) { /* done */ } }
    if (!classCode) {
      msg.className = "feedback muted"; msg.textContent = "Type the class code to show its four boards.";
      BOARDS.forEach(function (b) { renderBoard(b, null, Date.now()); });
      return;
    }
    if (document.hidden) { schedule(refresh); return; }
    var my = ++seq;
    if (show) { msg.className = "feedback muted"; msg.textContent = "Loading…"; }
    getBoards().then(function (r) {
      if (my !== seq) return;
      if (!r || !r.ok) throw new Error((r && r.error) || "bad reply");
      msg.textContent = ""; msg.className = "feedback";
      var now = r.updated || Date.now();
      BOARDS.forEach(function (b) { renderBoard(b, r.boards[b.id], now); });
      updated.textContent = "Class " + classCode + " · updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      delay = refresh;
    }).catch(function (e) {
      if (my !== seq) return;
      delay = Math.min(60000, delay * 2);
      msg.className = "feedback bad"; msg.textContent = "Can't reach the scoreboard right now (" + e.message + "). Trying again in " + Math.round(delay / 1000) + " s…";
    }).then(function () { if (my === seq) schedule(delay); });
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) load(false); });
  load(true);
})();
