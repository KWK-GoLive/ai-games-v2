/**
 * AI games — class scoreboard for LLM Arena and Agent Arena (v1 site) and, since v2, for
 * the warm-up, Be the LLM Arena, the LLM final, Be the Agent Arena and the Agent Arena (ai-games-v2 site). One sheet for both sites.
 *
 * Paste this whole file into Extensions → Apps Script of a Google Sheet you own,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * See README.md, "Scoreboard".
 *
 * The games send one row per finished stage (sheet "arena"). Since v2 the arenas also send their live position
 * when a lesson opens and after every answered item, so the teacher's board moves during a stage. Live positions
 * are kept in the script cache (CacheService, up to 6 hours), not in the sheet: no sheet write and no lock per item,
 * and nothing to clean up. The finished-stage rows stay the permanent record. Nothing but a nickname, optional team,
 * class code and the results is stored. Only a player's FIRST run counts on the board.
 */

var SHEET = "arena";
var HEADERS = ["time", "classCode", "game", "runId", "nickname", "team", "stage", "stageName",
  "items", "correct", "points", "seconds", "hints"];
var GAMES = ["llm", "agent", "warmup", "llm2", "llmfinal", "agent2", "agentfinal", "llm21", "llmfinal21"];
// How many stages each game has (v1: llm, agent; v2: warmup, llm2, llmfinal, agent2, agentfinal;
// v2.1 preview: llm21 = Be the LLM Arena with toy model v2 (8 stages), llmfinal21 = its 14-question final).
var STAGES_BY_GAME = { llm: 6, agent: 6, warmup: 1, llm2: 7, llmfinal: 1, agent2: 7, agentfinal: 1, llm21: 8, llmfinal21: 1 };
var LIVE_TTL = 21600;   // seconds a live position is kept (6 h, CacheService's maximum)
function stages_(game) { return STAGES_BY_GAME[game] || 6; }
var MAX_ITEM_POINTS = 225;   // 100 + 50 speed, x1.5 streak: the most one item can give

/* ---------- helpers ---------- */
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sh.setFrozenRows(1);
  }
  return sh;
}
// Add a row. The text columns of the new row are set to Plain text BEFORE the values go in,
// so Sheets never turns a class code like "01" or "1-2" into a number or a date.
function addRow_(sh, values) {
  var r = sh.getLastRow() + 1;
  if (r > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 100);
  while (String(sh.getRange(r, 1).getValue()) !== "") r++; // never overwrite a row (belt and braces with the lock)
  sh.getRange(r, 2, 1, 7).setNumberFormat("@"); // columns B-H in one call (fast); readRows_ turns stage back into a number
  sh.getRange(r, 1, 1, values.length).setValues([values]);
  SpreadsheetApp.flush(); // write now, before the lock is released, so the next request sees this row
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
// Letters (any language), digits, spaces, - and _ only. A leading = + - @ can't start a formula because
// the cell is plain text and we also strip those characters from the start.
function clean_(s, max) {
  s = String(s == null ? "" : s).replace(/[^\p{L}\p{M}\p{N} _\-]/gu, "").replace(/\s+/g, " ").trim();
  s = s.replace(/^[=+\-@]+/, "");
  return s.slice(0, max);
}
function cleanClass_(s) { return clean_(s, 20).replace(/[^A-Za-z0-9\-]/g, "-").toUpperCase(); }
function cleanNick_(s) { return clean_(s, 16); }
function num_(v, lo, hi) {
  var n = Math.round(Number(v));
  if (!isFinite(n)) n = 0;
  return Math.max(lo, Math.min(hi, n));
}
function cleanGame_(g) { g = String(g || "").toLowerCase(); return GAMES.indexOf(g) >= 0 ? g : ""; }

function readRows_() {
  var sh = sheet_();
  var n = sh.getLastRow() - 1;
  if (n < 1) return [];
  var vals = sh.getRange(2, 1, n, HEADERS.length).getValues();
  return vals.map(function (r) {
    var o = {};
    HEADERS.forEach(function (h, i) { o[h] = r[i]; });
    o.time = o.time instanceof Date ? o.time.getTime() : Number(o.time) || 0;
    // (a stray leading apostrophe, e.g. from a row typed in by hand, is ignored)
    ["classCode", "runId", "nickname", "team", "stageName"].forEach(function (k) { o[k] = String(o[k] == null ? "" : o[k]).replace(/^'/, ""); });
    o.team = String(o.team || ""); o.game = String(o.game); o.stage = Number(o.stage) || 0;
    return o;
  });
}

/* The run that counts for each nickname = the first run we ever heard from under that nickname. */
function countedRuns_(rows) {
  var first = {};
  rows.forEach(function (r) {
    var k = r.nickname.toLowerCase();
    if (!first[k] || r.time < first[k].time) first[k] = { runId: r.runId, time: r.time };
  });
  return first;
}

/* ---------- live positions (CacheService) ---------- */
function liveKey_(game, classCode, runId) { return "live|" + game + "|" + classCode + "|" + runId; }
function posOf_(stage, phase, item) { return stage * 100 + (phase === "lesson" ? 0 : item + 1); }

/* Save a player's live position. An older position never replaces a newer one, except the START of the same stage
 * (its lesson or item 0): that happens when a run is resumed on another computer and the stage starts again. */
function progress_(d) {
  var game = cleanGame_(d.game), classCode = cleanClass_(d.classCode), nick = cleanNick_(d.nickname), runId = clean_(d.runId, 40);
  var stage = Number(d.stage), phase = d.phase === "lesson" ? "lesson" : "item", items = num_(d.items, 0, 50), item = num_(d.item, 0, items);
  if (!game || !classCode || !nick || !runId || !(stage >= 1 && stage <= stages_(game) && stage === Math.floor(stage)))
    return { ok: false, fatal: true, error: "missing or invalid fields" };
  var cache = CacheService.getScriptCache(), key = liveKey_(game, classCode, runId);
  var old = null;
  try { old = JSON.parse(cache.get(key) || "null"); } catch (e) { old = null; }
  var pos = posOf_(stage, phase, item);
  if (old && pos < posOf_(old.stage, old.phase, old.item) && !(stage === old.stage && (phase === "lesson" || item === 0)))
    return { ok: true, stale: true };
  cache.put(key, JSON.stringify({ stage: stage, phase: phase, item: item, items: items, points: num_(d.points, 0, items * MAX_ITEM_POINTS),
    correct: num_(d.correct, 0, items), time: Date.now() }), LIVE_TTL);
  return { ok: true };
}
/* the live positions of these runs: { runId: {...} } */
function readLive_(game, classCode, runIds) {
  var out = {}, cache = CacheService.getScriptCache();
  for (var i = 0; i < runIds.length; i += 100) {   // in chunks, to stay well inside any batch limit
    var chunk = runIds.slice(i, i + 100);
    var got = cache.getAll(chunk.map(function (r) { return liveKey_(game, classCode, r); })) || {};
    chunk.forEach(function (r) { var v = got[liveKey_(game, classCode, r)]; if (v) { try { out[r] = JSON.parse(v); } catch (e) { /* ignore */ } } });
  }
  return out;
}

function board_(game, classCode, allRows) {
  var rows = (allRows || readRows_()).filter(function (r) { return r.game === game && r.classCode === classCode; });
  var first = countedRuns_(rows);
  var players = {};
  rows.forEach(function (r) {
    var k = r.nickname.toLowerCase();
    if (first[k].runId !== r.runId) return; // a later run under the same nickname: ignored
    var p = players[k] || (players[k] = { nickname: r.nickname, team: r.team, runId: r.runId, stages: {}, points: 0, correct: 0, items: 0, seconds: 0, hints: 0 });
    if (r.stage < 1) { if (r.team) p.team = r.team; return; } // stage 0 = "joined" (nickname claimed at sign-in)
    if (p.stages[r.stage] != null) return; // duplicate send of the same stage
    p.stages[r.stage] = Number(r.points);
    p.points += Number(r.points); p.correct += Number(r.correct); p.items += Number(r.items);
    p.seconds += Number(r.seconds); p.hints += Number(r.hints);
    if (r.team) p.team = r.team;
  });
  var live = readLive_(game, classCode, Object.keys(players).map(function (k) { return players[k].runId; }));
  var list = Object.keys(players).map(function (k) {
    var p = players[k];
    var per = [];
    for (var s = 1; s <= stages_(game); s++) per.push(p.stages[s] == null ? null : p.stages[s]);
    // the live position counts only for a stage that isn't finished yet (a finished stage's row replaces it)
    var lv = live[p.runId], cur = lv && p.stages[lv.stage] == null ? lv : null;
    return { nickname: p.nickname, team: p.team, perStage: per, done: Object.keys(p.stages).length,
      points: p.points, correct: p.correct, items: p.items, seconds: p.seconds, hints: p.hints,
      live: cur ? { stage: cur.stage, phase: cur.phase, item: cur.item, items: cur.items, points: cur.points, correct: cur.correct, time: cur.time } : null,
      livePoints: p.points + (cur ? cur.points : 0) };
  });
  // ranked by live points: finished stages + the items already answered in the current stage
  list.sort(function (a, b) { return b.livePoints - a.livePoints || b.correct - a.correct || a.seconds - b.seconds || (a.nickname < b.nickname ? -1 : 1); });
  var teams = {};
  list.forEach(function (p) {
    if (!p.team || (!p.done && !p.livePoints)) return; // players who have only joined don't pull their team down
    var k = p.team.toLowerCase();
    var t = teams[k] || (teams[k] = { team: p.team, members: 0, total: 0 });
    t.members++; t.total += p.livePoints;
  });
  var tlist = Object.keys(teams).map(function (k) { var t = teams[k]; return { team: t.team, members: t.members, average: Math.round(t.total / t.members) }; });
  tlist.sort(function (a, b) { return b.average - a.average || b.members - a.members; });
  return { ok: true, game: game, classCode: classCode, players: list, teams: tlist, updated: Date.now() };
}


/* ---------- web app ---------- */
// Body: { game, classCode, nickname, team, runId, stage (0 = joining), stageName, items, correct, points, seconds, hints }
// Reply: { ok, duplicate, counted } or, when joining with a nickname someone else already uses, { ok, taken: true }.
// fatal: true means "this row can never be accepted", so the game can stop re-sending it.
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var game = cleanGame_(d.game), classCode = cleanClass_(d.classCode), nick = cleanNick_(d.nickname);
    var runId = clean_(d.runId, 40), stage = Number(d.stage);
    if (!game || !classCode || !nick || !runId || d.stage === "" || d.stage == null || !(stage >= 0 && stage <= stages_(game) && stage === Math.floor(stage)))
      return json_({ ok: false, fatal: true, error: "missing or invalid fields" });
    lock.waitLock(28000);
    var sh = sheet_();
    var mine = readRows_().filter(function (r) { return r.game === game && r.classCode === classCode; });
    var first = countedRuns_(mine.filter(function (r) { return r.nickname.toLowerCase() === nick.toLowerCase(); }))[nick.toLowerCase()];
    var counted = !first || first.runId === runId;
    if (stage === 0 && !counted) return json_({ ok: true, taken: true });
    var dup = mine.some(function (r) { return r.runId === runId && r.stage === stage; });
    if (!dup) {
      var items = num_(d.items, 0, 50);
      addRow_(sh, [new Date(), classCode, game, runId, nick, clean_(d.team, 20), stage, stage ? clean_(d.stageName, 30) : "joined",
        items, num_(d.correct, 0, items), num_(d.points, 0, items * MAX_ITEM_POINTS), num_(d.seconds, 0, 36000), num_(d.hints, 0, items)]);
    }
    return json_({ ok: true, duplicate: dup, counted: counted });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) }); // e.g. busy: the game will try again
  } finally {
    try { lock.releaseLock(); } catch (x) { /* not held */ }
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = String(p.action || "board");
  var classCode = cleanClass_(p.classCode || p["class"]);
  try {
    if (action === "ping") return json_({ ok: true, time: Date.now() });
    // The games send results as a GET (action=post&payload=...): a browser POST to Apps Script is redirected,
    // and some browsers then lose the reply. The payload is the same JSON doPost takes.
    if (action === "post") return doPost({ postData: { contents: String(p.payload || "{}") } });
    if (action === "progress") return json_(progress_(JSON.parse(String(p.payload || "{}"))));
    if (!classCode) return json_({ ok: false, error: "class code needed" });
    if (action === "board") {
      var game = cleanGame_(p.game);
      if (!game) return json_({ ok: false, error: "unknown game" });
      return json_(board_(game, classCode));
    }
    if (action === "boards") {
      // several boards in one call (the teacher's all-in-one window): the sheets are read once
      var list = String(p.games || "").split(",").map(cleanGame_).filter(function (g, i, a) { return g && a.indexOf(g) === i; }).slice(0, 7);
      if (!list.length) return json_({ ok: false, error: "unknown game" });
      var all = readRows_(), out = {};
      list.forEach(function (g) { out[g] = board_(g, classCode, all); });
      return json_({ ok: true, classCode: classCode, boards: out, updated: Date.now() });
    }
    if (action === "check") {
      // Is this nickname already used by a different run in this class and game?
      var g2 = cleanGame_(p.game), nick = cleanNick_(p.nickname).toLowerCase(), run = clean_(p.runId, 40);
      var rows = readRows_().filter(function (r) { return r.game === g2 && r.classCode === classCode && r.nickname.toLowerCase() === nick; });
      var first = countedRuns_(rows)[nick];
      return json_({ ok: true, taken: !!(first && first.runId !== run) });
    }
    if (action === "resume") {
      // Continue a run on another computer: the nickname, class and resume code (= runId) must all match.
      var g3 = cleanGame_(p.game), nick3 = cleanNick_(p.nickname).toLowerCase(), run3 = clean_(p.runId, 40).toUpperCase();
      var mine3 = readRows_().filter(function (r) { return r.game === g3 && r.classCode === classCode && r.nickname.toLowerCase() === nick3; });
      var rows3 = mine3.filter(function (r) { return r.runId.toUpperCase() === run3; });
      if (!g3 || !rows3.length) return json_({ ok: true, found: false });
      var first3 = countedRuns_(mine3)[nick3];
      var seen3 = {}, stages3 = [], team3 = "";
      rows3.forEach(function (r) {
        if (r.team) team3 = r.team;
        if (r.stage < 1 || seen3[r.stage]) return;
        seen3[r.stage] = true;
        stages3.push({ stage: r.stage, items: Number(r.items) || 0, correct: Number(r.correct) || 0, points: Number(r.points) || 0, seconds: Number(r.seconds) || 0, hints: Number(r.hints) || 0 });
      });
      stages3.sort(function (a, b) { return a.stage - b.stage; });
      return json_({ ok: true, found: true, counted: !!(first3 && first3.runId.toUpperCase() === run3), team: team3, stages: stages3 });
    }
    if (action === "rows") {
      // Every row for one class (both games) for the teacher's CSV download. "counted" marks first runs.
      var all = readRows_().filter(function (r) { return r.classCode === classCode; });
      var counted = {};
      GAMES.forEach(function (g) {
        var f = countedRuns_(all.filter(function (r) { return r.game === g; }));
        Object.keys(f).forEach(function (k) { counted[g + "|" + f[k].runId] = true; });
      });
      return json_({ ok: true, headers: HEADERS.concat(["counted"]), rows: all.map(function (r) {
        return HEADERS.map(function (h) { return h === "time" ? new Date(r.time).toISOString() : r[h]; })
          .concat([counted[r.game + "|" + r.runId] ? "yes" : "no"]);
      }) });
    }
    return json_({ ok: false, error: "unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/* Run once from the editor to create the sheet and check permissions. */
function testSetup() {
  sheet_();
  doPost({ postData: { contents: JSON.stringify({ game: "llm", classCode: "TEST", nickname: "setup-check", runId: "setup", stage: 1, stageName: "test", items: 1, correct: 1, points: 100, seconds: 5, hints: 0 }) } });
  Logger.log(JSON.stringify(board_("llm", "TEST")));
}
