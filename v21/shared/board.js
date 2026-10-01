/*
 * AI games v2.1 PREVIEW — scoreboard for the preview games llm21 (8 stages) and llmfinal21 only (v21/board.html). Tabs: Be the LLM Arena v2.1
 * (Part A / Part B views) and the v2.1 final. Reads the Google Sheet through the Apps Script web app; refreshes every few seconds.
 * URL options: ?class=SEC1  &game=llm21|llmfinal21  &part=A|B  &projector=1 (big text)
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, clear = A.clear;
  var CFG = window.AIG_CONFIG || {};
  var app = document.getElementById("app");
  var updated = document.getElementById("updated");
  var params = new URLSearchParams(location.search);
  var GAMES = [{ id: "llm21", name: "Be the LLM Arena v2.1" }, { id: "llmfinal21", name: "LLM final v2.1" }];
  var HAS_PARTS = { llm21: true };
  var game = GAMES.some(function (g) { return g.id === params.get("game"); }) ? params.get("game") : "llm21";
  var PARTS = { A: [0, 1, 2, 3], B: [4, 5, 6, 7] };   // Be the LLM Arena v2.1: stages 1-4 and 5-8
  var part = PARTS[params.get("part")] ? params.get("part") : "all";
  var classCode = A.cleanClass(params.get("class") || "");
  var refresh = Math.max(3, Number(CFG.BOARD_REFRESH_SECONDS) || 5) * 1000;
  var STAGE_NAMES = {
    warmup: ["What comes next?"],
    llm21: ["Count it", "Greedy writer", "Temperature", "Keyhole", "Two-word boss", "Three-word boss", "Chat brain", "Meaning brain"],
    llmfinal21: ["All skills"],
    agent2: ["Which app?", "File search", "Web search", "Calculator", "File maker", "Hidden orders", "Permissions"],
    agentfinal: ["Ploy's memo"]
  };
  if (params.get("projector") === "1") document.documentElement.classList.add("projector");

  if (!A.boardEnabled) {
    app.appendChild(h("section", { class: "card stack" },
      h("div", { class: "kicker", text: "Class scoreboard" }),
      h("h1", { text: "The scoreboard isn't connected yet" }),
      h("p", { text: "Paste your Google Apps Script web-app URL into SCOREBOARD_URL in config.js (see README, “Scoreboard”). Until then, the arenas still work and each student sees their own score." })));
    return;
  }

  var codeIn = h("input", { class: "text-input", id: "cc", maxlength: "20", value: classCode, style: "max-width:14em" });
  var tabs = h("div", { class: "tabs", role: "tablist" });
  var tabBtns = GAMES.map(function (g) {
    var b = h("button", { type: "button", role: "tab", "aria-selected": String(g.id === game), "data-game": g.id, text: g.name });
    b.addEventListener("click", function () { game = g.id; tabBtns.forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); }); partRow.classList.toggle("hidden", !HAS_PARTS[game]); syncUrl(); load(true); });
    tabs.appendChild(b);
    return b;
  });
  var csvBtn = h("button", { class: "btn", type: "button", text: "Download results (CSV)" });
  var partRow = h("div", { class: "tabs toggle" + (HAS_PARTS[game] ? "" : " hidden"), role: "group", "aria-label": "which part" });
  [["all", "All 7 stages"], ["A", "Part A (1\u20134)"], ["B", "Part B (5\u20137)"]].forEach(function (pp) {
    var b = h("button", { type: "button", "aria-pressed": String(part === pp[0]), text: pp[1] });
    b.addEventListener("click", function () { part = pp[0]; Array.prototype.forEach.call(partRow.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); }); syncUrl(); if (last) render(last); });
    partRow.appendChild(b);
  });
  var last = null;
  var projBtn = h("button", { class: "btn ghost", type: "button", text: "Big text" });
  var teacherLink = h("a", { class: "btn", href: "teacher.html", text: "All 4 boards in one window ↗" });
  function teacherHref() { teacherLink.href = "teacher.html" + (classCode ? "?class=" + encodeURIComponent(classCode) : ""); }
  teacherHref();
  var form = h("form", { class: "row" },
    h("label", { class: "field", for: "cc", style: "display:flex;gap:8px;align-items:center" }, "Class code", codeIn),
    h("button", { class: "btn primary", type: "submit", text: "Show" }));
  form.addEventListener("submit", function (e) { e.preventDefault(); classCode = A.cleanClass(codeIn.value); codeIn.value = classCode; syncUrl(); load(true); });
  projBtn.addEventListener("click", function () { document.documentElement.classList.toggle("projector"); });
  app.appendChild(h("section", { class: "card stack" },
    h("div", { class: "kicker", text: "Class scoreboard" }),
    h("div", { class: "row" }, tabs, h("span", { style: "flex:1" }), teacherLink, projBtn, csvBtn),
    partRow,
    form));
  var msg = h("p", { class: "feedback", "aria-live": "polite" });
  var body = h("div");
  app.appendChild(msg);
  app.appendChild(body);

  function syncUrl() {
    teacherHref();
    var q = new URLSearchParams(location.search);
    q.set("game", game); if (HAS_PARTS[game] && part !== "all") q.set("part", part); else q.delete("part"); if (classCode) q.set("class", classCode); else q.delete("class");
    try { history.replaceState(null, "", "?" + q.toString()); } catch (e) { /* file:// */ }
  }

  /* the stage a player is on right now: "📖 lesson" or "▶ 2/5" (answered/items) with the points so far */
  function liveCell(lv) {
    var t = lv.phase === "lesson" ? "📖 lesson" : "▶ " + lv.item + "/" + lv.items;
    return h("td", { class: "num live", title: lv.phase === "lesson" ? "Reading the lesson" : "Playing this stage: " + lv.item + " of " + lv.items + " items answered, " + lv.points + " points so far" },
      h("span", { class: "live-pos", text: t }), lv.points ? h("span", { class: "live-pts", text: " " + lv.points }) : null);
  }
  var seq = 0;
  function load(show) {
    if (!classCode) { clear(body); msg.className = "feedback muted"; msg.textContent = "Type the class code to show its scoreboard."; return; }
    var my = ++seq;
    if (show) { msg.className = "feedback muted"; msg.textContent = "Loading…"; }
    A.apiGet({ action: "board", game: game, classCode: classCode }).then(function (r) {
      if (my !== seq) return;
      if (!r || !r.ok) throw new Error((r && r.error) || "bad reply");
      msg.textContent = ""; last = r; render(r);
      updated.textContent = "Updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }).catch(function (e) {
      if (my !== seq) return;
      msg.className = "feedback bad"; msg.textContent = "Can't reach the scoreboard right now (" + e.message + "). Retrying…";
    });
  }

  function render(r0) {
    clear(body);
    var allNames = STAGE_NAMES[game];
    var idx = HAS_PARTS[game] && part !== "all" ? PARTS[part] : allNames.map(function (n, i) { return i; });
    var partView = idx.length !== allNames.length;
    var names = idx.map(function (i) { return allNames[i]; });
    // In a Part view, rank by that part's points only (right answers per stage aren't sent separately, so no "Right" column).
    var r = r0;
    if (partView) {
      var players = r0.players.map(function (p) {
        var per = idx.map(function (i) { return p.perStage[i]; });
        var lv = p.live && idx.indexOf(p.live.stage - 1) >= 0 ? p.live : null;   // a live position inside this part counts too
        return { nickname: p.nickname, team: p.team, perStage: per, live: lv, points: per.reduce(function (a, v) { return a + (v || 0); }, 0) + (lv ? lv.points : 0), done: per.filter(function (v) { return v != null; }).length + (lv ? 1 : 0), seconds: p.seconds };
      }).filter(function (p) { return p.done; });
      players.sort(function (a, b) { return b.points - a.points || b.done - a.done || (a.nickname < b.nickname ? -1 : 1); });
      var teams = {};
      players.forEach(function (p) { if (!p.team) return; var k = p.team.toLowerCase(); var t = teams[k] || (teams[k] = { team: p.team, members: 0, total: 0 }); t.members++; t.total += p.points; });
      var tl = Object.keys(teams).map(function (k) { var t = teams[k]; return { team: t.team, members: t.members, average: Math.round(t.total / t.members) }; });
      tl.sort(function (a, b) { return b.average - a.average || b.members - a.members; });
      r = { players: players, teams: tl };
    } else {
      r = { players: r0.players.map(function (p) { return Object.assign({}, p, { perStage: idx.map(function (i) { return p.perStage[i]; }), points: p.livePoints != null ? p.livePoints : p.points }); }), teams: r0.teams };
    }
    var gname = GAMES.filter(function (g) { return g.id === game; })[0].name + (partView ? " \u00b7 Part " + part : "");
    if (!r.players.length) {
      body.appendChild(h("section", { class: "card" }, h("p", { class: "muted", text: "No results yet for " + classCode + " in " + gname + ". Rows appear after each player finishes a stage." })));
      return;
    }
    var tb = h("tbody");
    r.players.forEach(function (p, i) {
      tb.appendChild(h("tr", { class: i === 0 ? "top1" : null },
        h("td", { class: "rank", text: String(i + 1) }),
        h("td", {}, h("b", { text: p.nickname }), p.team ? h("div", { class: "small muted", text: p.team }) : null),
        p.perStage.map(function (v, j) { return p.live && p.live.stage - 1 === idx[j] ? liveCell(p.live) : h("td", { class: "num", text: v == null ? "·" : String(v) }); }),
        partView ? null : h("td", { class: "num", text: p.correct + "/" + p.items }),
        partView ? null : h("td", { class: "num acc", text: p.items ? Math.round(100 * p.correct / p.items) + "%" : "–" }),
        h("td", { class: "num" }, h("b", { text: String(p.points) }))));
    });
    body.appendChild(h("section", { class: "card stack" },
      h("h2", { text: gname + " · " + classCode + " · " + r.players.length + " player" + (r.players.length === 1 ? "" : "s") }),
      h("div", { class: "table-wrap" }, h("table", { class: "board" },
        h("thead", {}, h("tr", {}, h("th", { text: "#" }), h("th", { text: "Player" }),
          names.map(function (n, i) { return h("th", { class: "num", title: n, text: names.length === 1 ? "Stage" : "S" + (idx[i] + 1) }); }),
          partView ? null : h("th", { class: "num", text: "Right" }), partView ? null : h("th", { class: "num", title: "Share of answers fully right (speed doesn't count here)", text: "% right" }), h("th", { class: "num", text: partView ? "Part points" : "Points" }))),
        tb)),
      h("p", { class: "muted small", text: "Points include speed bonuses and the items already answered in a stage that is still going (▶ answered/items; 📖 = reading the lesson). “% right” counts finished stages." }),
      h("p", { class: "muted small", text: (names.length > 1 ? "Stages: " + names.map(function (n, i) { return "S" + (idx[i] + 1) + " " + n; }).join(" · ") + ". " : "") + "Only each nickname's first run counts. " + (partView ? "Ranked by this part's points." : "Ties: more fully right answers, then less time.") })));
    if (r.teams.length) {
      body.appendChild(h("section", { class: "card stack" },
        h("h2", { text: "Teams" }),
        h("div", { class: "table-wrap" }, h("table", { class: "board" },
          h("thead", {}, h("tr", {}, h("th", { text: "#" }), h("th", { text: "Team" }), h("th", { class: "num", text: "Members" }), h("th", { class: "num", text: "Average points" }))),
          h("tbody", {}, r.teams.map(function (t, i) {
            return h("tr", { class: i === 0 ? "top1" : null }, h("td", { class: "rank", text: String(i + 1) }), h("td", {}, h("b", { text: t.team })),
              h("td", { class: "num", text: String(t.members) }), h("td", { class: "num" }, h("b", { text: String(t.average) })));
          })))),
        h("p", { class: "muted small", text: "A team's score is the average of its members' points, so big and small teams are compared fairly." })));
    }
  }

  function csvCell(v) {
    var s = v == null ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // don't let a spreadsheet treat it as a formula
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  csvBtn.addEventListener("click", function () {
    if (!classCode) { msg.className = "feedback bad"; msg.textContent = "Type the class code first."; return; }
    csvBtn.disabled = true;
    A.apiGet({ action: "rows", classCode: classCode }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.error) || "bad reply");
      var lines = [r.headers].concat(r.rows).map(function (row) { return row.map(csvCell).join(","); });
      var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
      var a = h("a", { href: URL.createObjectURL(blob), download: "scoreboard-" + classCode + "-" + new Date().toISOString().slice(0, 10) + ".csv" });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
      msg.className = "feedback good"; msg.textContent = "✓ Downloaded " + r.rows.length + " rows (one per player per stage, all games of this class).";
    }).catch(function (e) { msg.className = "feedback bad"; msg.textContent = "Download failed (" + e.message + ")."; })
      .then(function () { csvBtn.disabled = false; });
  });

  load(true);
  setInterval(function () { if (!document.hidden) load(false); }, refresh);
})();
