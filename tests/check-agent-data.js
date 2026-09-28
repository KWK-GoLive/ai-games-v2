/*
 * AI games v2 — Be the Agent data checks (Node).   node tests/check-agent-data.js
 * - the café files in agent/files/ really contain the texts the File search app uses (PDF pages, Word sections, CSV);
 * - every real-recording quote shown in lesson 1 is in the raw record (agent/data/raw/agent-runs-v2.json);
 * - the sales numbers are recomputed here independently, and every answer key of all 7 stages and the Agent Arena
 *   gets full marks, over many seeds; the facts in the right answers match their sources.
 */
"use strict";
var fs = require("fs"), path = require("path"), cp = require("child_process");
var ROOT = path.join(__dirname, "..");
global.window = undefined;
var D = require("../agent/data/cafe.js");
var T = require("../agent/js/tools.js");
var I = require("../agent/js/items.js");
var R = require("../agent/js/arena.js");
var LS = require("../agent/js/lessons.js");
var RAW = JSON.parse(fs.readFileSync(path.join(ROOT, "agent/data/raw/agent-runs-v2.json"), "utf8"));
var fails = 0, checks = 0;
function check(c, m) { checks++; if (!c) { fails++; console.log("  FAIL  " + m); } }
function norm(s) { return String(s).replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim(); }

/* ---------- 1. the files ---------- */
var csvFile = fs.readFileSync(path.join(ROOT, "agent/files/moonbean_sales_aug2026.csv"), "utf8").trim();
check(csvFile === D.salesCsv, "sales CSV in the game = agent/files CSV");
var v1 = fs.readFileSync(path.join(ROOT, "../ai-games/be-the-agent/data/cafe.js"), "utf8");
check(v1.indexOf(D.salesCsv.replace(/\n/g, "\\n")) >= 0, "sales CSV = the v1 Be the Agent file");
var rows = csvFile.split("\n").slice(1).map(function (l) { var c = l.split(","); return { date: c[0], item: c[1], qty: +c[2], price: +c[3], total: +c[4] }; });
check(rows.length === 30 && rows.every(function (r) { return r.qty * r.price === r.total; }), "30 rows, qty × price = total on every row");
var sum = function (f) { return rows.filter(f).reduce(function (a, r) { return a + r.total; }, 0); };
check(sum(function () { return true; }) === 21445 && sum(function (r) { return r.item === "Latte"; }) === 8580 && sum(function (r) { return r.item === "Mocha"; }) === 4350, "independent totals 21,445 / Latte 8,580 / Mocha 4,350");
D.docs.forEach(function (d) {
  var f = path.join(ROOT, "agent/files", d.file);
  d.pieces.forEach(function (p) {
    var txt;
    if (d.kind === "PDF") txt = cp.execFileSync("pdftotext", ["-f", String(p.page), "-l", String(p.page), f, "-"]).toString();
    else txt = cp.execFileSync("unzip", ["-p", f, "word/document.xml"]).toString().replace(/<[^>]+>/g, " ").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    check(norm(txt).indexOf(norm(p.text)) >= 0, d.file + " " + (p.page ? "page " + p.page : "section " + p.section) + " contains: " + p.text.slice(0, 40));
  });
});
check(D.REAL.vat.quote === "Currently, the rate is 7 percent." && T.page("w1").text === D.REAL.vat.quote && T.page("w1").url === D.REAL.vat.url, "the one real web quote is exactly the Revenue Department sentence");
check(D.web.filter(function (w) { return w.id !== "w1"; }).every(function (w) { return /\.example$/.test(w.site); }), "every other mini-web site is a made-up .example address");

/* ---------- 2. the real recordings ---------- */
Object.keys(LS.CASES).forEach(function (k) {
  var raw = RAW[k];
  check(raw && raw.model === "claude-sonnet-5" && raw.steps.length > 0, "raw case " + k + " exists");
  LS.CASES[k].script.forEach(function (m, i) {
    (m.raw || []).forEach(function (j) { check(raw.steps[j], k + " message " + (i + 1) + " points to raw step " + j); });
    if (m.q) {
      var hay = m.q[0] === "prompt" ? raw.prompt : JSON.stringify(raw.steps[m.q[1]]).replace(/\\n/g, "\n").replace(/\\"/g, '"');
      if (m.q[0] === "step") { var s = raw.steps[m.q[1]]; hay = [s.text, s.content, s.input && (s.input.message || s.input.command || s.input.query)].filter(Boolean).join("\n"); }
      check(hay && hay.indexOf(m.q[m.q.length - 1]) >= 0, k + " message " + (i + 1) + " quotes the raw record: " + m.q[m.q.length - 1].slice(0, 50));
    }
  });
});
var toolsUsed = function (k) { return RAW[k].steps.filter(function (s) { return s.kind === "tool_use"; }).map(function (s) { return s.name; }); };
check(toolsUsed("notool").join() === "SubagentHandback", "case 4 really used no tool (only the hand-back)");
check(toolsUsed("websearch").indexOf("WebSearch") >= 0 && toolsUsed("calculator").indexOf("Bash") >= 0, "cases 1 and 3 used code and web search");
check(!RAW.calculator.steps.some(function (s) { return s.kind === "tool_use" && /qty|\$3/.test(JSON.stringify(s.input)) && s.name === "Bash" && /awk.*\$3/.test(s.input.command || ""); }), "case 1: no tool step computed qty × price (as the lesson says)");
check(rows.filter(function (r) { return r.item === "Latte"; }).reduce(function (a, r) { return a + r.qty; }, 0) === 132, "132 Latte cups (the model's own claim) is right");
check(Math.abs(8580 * 0.07 - 600.6) < 1e-9 && Math.abs(8580 * 1.07 - 9180.6) < 1e-9, "case 3's 600.60 / 9,180.60 are right");

/* ---------- 3. every stage item and the Agent Arena, many seeds ---------- */
function rng(seed) { var a = seed >>> 0 || 1; return function () { a = (a + 0x6d2b79f5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function fullAnswer(it) {
  if (it.kind === "toolpick") return { tool: it.key.tool, reply: it.key.reply };
  if (it.kind === "filesearch") {
    var c = it.chips, w = null;
    c.forEach(function (a) { if (!w && T.topIs(T.fileSearch(a, 3), it.key.piece)) w = [a]; });
    for (var i = 0; i < c.length && !w; i++) for (var j = i + 1; j < c.length && !w; j++) { if (T.topIs(T.fileSearch(c[i] + " " + c[j], 3), it.key.piece)) w = [c[i], c[j]]; }
    check(!!w, "file search " + it.id + ": some 1-2 chips put the right piece alone on top");
    c.forEach(function (a) { var r = T.fileSearch(a, 3); if (r.length > 1 && r[0].piece.id === it.key.piece && r[1].score === r[0].score) check(it.grade({ words: [a], open: it.key.piece, answer: it.key.answer }).frac < 1, "file search " + it.id + ": a word that only ties (" + a + ") doesn't get full marks"); });
    return { words: w || [], open: it.key.piece, answer: it.key.answer };
  }
  if (it.kind === "websearch") {
    var good = it.queries.filter(function (x) { return T.webSearch(x, 4).some(function (h) { return h.page.id === it.key.page; }); });
    check(good.length === 1 && good[0] === it.key.query, "web " + it.id + ": exactly one query (the key) finds the key page; the other two don't");
    check(it.queries.every(function (x) { return T.webSearch(x, 4).length > 0; }), "web " + it.id + ": every query finds something (no dead end)");
    return { query: it.key.query, open: it.key.page, answer: it.key.answer };
  }
  if (it.kind === "calc") return { tokens: it.solution, reply: it.key.reply };
  if (it.kind === "maker") return { type: it.key.type, name: it.key.name, content: it.key.content, reply: "ok" };
  if (it.kind === "inject") return { bad: it.bad, act: "warn" };
  return it.key;
}
var n = 0;
for (var s = 1; s <= 120; s++) {
  I.STAGES.forEach(function (st, si) {
    st.make(rng(s * 17 + si)).forEach(function (it) {
      n++;
      var g = it.grade(fullAnswer(it));
      check(g.frac === 1, "stage " + (si + 1) + " " + it.kind + " " + it.id + ": the right moves score full marks");
      if (it.kind === "calc") check(it.chips.every(function (c) { var r = I.evalChips([c]); return /^SUM\(/.test(c) || !(r.ok && Math.abs(r.value - it.key.value) < 0.01); }), "stage 4 " + it.id + ": no single number chip is already the answer");
      check(it.grade(it.sample(rng(n))).frac >= 0, "a random answer is graded");
      check(it.grade(null).frac === 0 || it.kind === "permission", "no answer scores 0");
    });
  });
  var steps = R.steps(rng(s));
  check(steps.length === 12, "Agent Arena has 12 steps");
  steps.forEach(function (st) {
    var a = st.kind === "calc" ? st.solution : st.kind === "search" ? ["coffee", "price"] : st.key;
    if (st.kind === "calc") check(st.chips.indexOf(T.fmt(st.value).replace(/,/g, "")) < 0 && st.chips.indexOf(String(st.value)) < 0, "arena step " + st.id + ": the answer itself is not a chip");
    check(R.grade(st, a).frac === 1, "arena step " + st.id + " right answer scores 1");
    if (st.options) check(st.options.some(function (o) { return o.value === st.key; }), "arena step " + st.id + ": the key is an option");
  });
}
console.log("  stage items checked: " + n);

/* ---------- 3b. the Agent Arena's app results are the real tools' output; stage 7 mix; the File maker reply ---------- */
var st0 = R.steps(rng(7));
st0.forEach(function (st) {
  for (var i = 0; i + 1 < st.after.length; i += 2) {
    var call = st.after[i], res = st.after[i + 1];
    check(call.from === "model" && res.to === "model" && res.from === call.to, "arena " + st.id + ": every app result answers the model's request");
    var out = null;
    if (call.to === "calc") out = T.calculator(call.text).text;
    else if (/^search: /.test(call.text) && call.to === "files") out = T.fileSearch(call.text.slice(8), 3).map(function (x, j) { return (j + 1) + ". " + x.where + ", “" + x.piece.title + "”"; }).join("\n");
    else if (/^open: Supplier/.test(call.text)) out = D.docs.filter(function (d) { return d.file === R.LETTER; })[0].pieces.map(function (p) { return "Page " + p.page + ": " + p.text; }).join("\n");
    else if (/^search the web: /.test(call.text)) out = T.webSearch(call.text.slice(16), 4).map(function (x, j) { return (j + 1) + ". " + x.page.title + " (" + x.page.site + ", " + x.page.date + ")"; }).join("\n");
    else if (/^open page: /.test(call.text)) { var pg = D.web.filter(function (w) { return w.url === call.text.slice(11); })[0]; out = pg.title + " (" + pg.site + "): " + pg.text; }
    else if (call.to === "maker") out = res.text;
    check(out !== null && out === res.text, "arena " + st.id + ": the " + call.to + " result shown = the real tool's output for “" + call.text.slice(0, 40) + "”");
  }
});
var inj = st0.filter(function (s) { return s.id === "inject"; })[0], srch = st0.filter(function (s) { return s.id === "search"; })[0];
check(srch.after[3].text.indexOf(T.piece("s4").text) >= 0 && st0.indexOf(inj) === st0.indexOf(srch) + 1, "arena: the hidden order reaches the model by opening the whole letter, right before the hidden-order step");
check(R.grade(srch, ["coffee", "price"]).frac === 1 && R.grade(srch, ["staff"]).frac === 0, "arena search: 'coffee price' puts the letter alone on top; 'staff' doesn't find it");
for (var s7 = 1; s7 <= 50; s7++) { var ks = I.STAGES[6].make(rng(s7)).map(function (it) { return it.key; }).sort().join(); check(ks === "ask,ask,do,do,no,no", "stage 7 has 2 do / 2 ask / 2 don't"); }
var mk = I.makerItem(I.MAKEQ[0], rng(3)), made = { type: "csv", name: "file1", content: "all" };
check(mk.replyLabel("ok", made).indexOf("file1.csv") >= 0 && mk.replyLabel("ok", made).indexOf("every row") >= 0, "File maker: the honest reply describes the file really made (file1.csv, every row)");

/* ---------- 4. the facts in the right answers ---------- */
I.PICKS.forEach(function (p) { if (p.tool === "calc") { var r = T.calculator(p.call).value; check(p.replies[0][0].indexOf(T.fmt(r)) >= 0, "pick " + p.id + ": the right reply shows the tool's result " + T.fmt(r)); } });
check(1284 * 37 === 47508, "1,284 × 37 = 47,508");
I.FILEQ.forEach(function (f) {
  var p = T.piece(f.key), right = f.answers[0][0];
  var m = /\((Handbook|Supplier letter|Menu)[^)]*?(page|section) (\d)\)/.exec(right);
  check(m && +m[3] === (p.page || p.section), "file question " + f.id + ": the right answer cites the right page/section");
  (right.match(/\d+/g) || []).filter(function (x) { return x !== m[3]; }).forEach(function (num) { check(p.text.indexOf(num) >= 0 || (f.id === "iced" && num === "75"), "file question " + f.id + ": " + num + " is in the source piece"); });
});
check(65 + 10 === 75, "iced latte 65 + 10 = 75");
I.WEBQ.forEach(function (w) {
  var p = T.page(w.key), right = w.answers[0][0];
  (right.match(/\d+(?:,\d+)?/g) || []).filter(function (x) { return !/^20\d\d$|^1[05]$|^\d$/.test(x); }).forEach(function (num) { check(p.text.indexOf(num) >= 0 || right.indexOf(p.date) >= 0, "web question " + w.id + ": " + num + " is on the source page"); });
  check(right.indexOf(p.site) >= 0, "web question " + w.id + ": the right answer names the site " + p.site);
});
check(I.evalChips(["(", "520", "−", "480", ")", "×", "15"]).value === 600 && Math.abs(21445 * 1.07 - R.numbers.withVat) < 0.001 && R.numbers.extra === 600, "arena numbers 22,946.15 and 600");
var byItem = I.CONTENTS.byItem.rows(); check(byItem.length === 7 && byItem[1][0] === "Latte" && byItem[1][1] === 8580, "file maker: totals by item start with Latte 8,580");
check(I.CONTENTS.latte.rows().length === 9 && I.CONTENTS.byDay.rows().length === 11, "file maker: 8 Latte rows / 10 days (+ header)");
I.INJQ.forEach(function (q) { q.result.forEach(function (x, i) { var order = /\bAI\b|SYSTEM|Do not tell/.test(x); check(order === (q.bad.indexOf(i) >= 0), "hidden order " + q.id + " sentence " + (i + 1) + (order ? " is" : " is not") + " marked bad"); }); });
var f = T.makeFile(I.spec("xlsx", "t", "byItem")); check(f.bytes[0] === 0x50 && f.bytes[1] === 0x4b, "the File maker writes a real zip-based .xlsx");
var d = T.makeFile(I.spec("docx", "t", "memoLatte")); check(d.bytes[0] === 0x50 && d.name === "t.docx", "…and .docx");

console.log(fails ? fails + " of " + checks + " check(s) FAILED" : "All " + checks + " agent data checks passed");
process.exit(fails ? 1 : 0);
