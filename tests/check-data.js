/*
 * AI games v2 — data and answer-key checks (Node, no browser).  node tests/check-data.js
 * Every answer key the games use is recomputed here with a SEPARATE, simple counting model
 * (not shared/model.js), for many random seeds. The lesson texts are checked to still show
 * what each lesson says about them.
 */
"use strict";
global.window = undefined;
var M = require("../shared/model.js");
globalThis.BTL = { Model: M };
var D = (function () { var w = {}; global.window = w; require("../llm/data/worlds.js"); global.window = undefined; return w.LLMA_DATA; })();
var L = require("../llm/js/items.js");
var LS = require("../llm/js/lessons.js");
var WU = require("../warmup/js/items.js");
var fails = 0, checks = 0;
function check(c, m) { checks++; if (!c) { fails++; console.log("  FAIL  " + m); } }

/* ---------- the independent model ---------- */
var S0 = "<s>", E0 = "</s>";
function toks(s) { return String(s).toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean); }
function seqsOf(lines) { return lines.map(function (l) { return [S0].concat(Array.isArray(l) ? l : toks(l), [E0]); }); }
// followers of ctx, in the order first met reading the text from the top: [{w, n}]
function follow(seqs, ctx) {
  var out = [], idx = {};
  seqs.forEach(function (sq) {
    for (var i = ctx.length; i < sq.length; i++) {
      var ok = true;
      for (var j = 0; j < ctx.length; j++) if (sq[i - ctx.length + j] !== ctx[j]) { ok = false; break; }
      if (!ok) continue;
      var w = sq[i];
      if (idx[w] == null) { idx[w] = out.length; out.push({ w: w, n: 0 }); }
      out[idx[w]].n++;
    }
  });
  return out;
}
function top(f) { var b = null; f.forEach(function (x) { if (!b || x.n > b.n) b = x; }); return b ? b.w : null; }
function ctxOf(words, k) { var c = [S0].concat(words).slice(-k); return c; }
function backoff(seqs, words, K) { for (var k = K; k >= 1; k--) { var f = follow(seqs, ctxOf(words, k)); if (f.length) return { f: f, k: k }; } return { f: [], k: 0 }; }
function greedy(seqs, seed, K, max) { var ws = seed.slice(), out = []; for (var i = 0; i < max; i++) { var r = backoff(seqs, ws, K); if (!r.f.length) break; var w = top(r.f); out.push(w); if (w === E0) break; ws.push(w); } return out; }
function shares(counts, T) {
  if (T === 0) return counts.map(function (c, i) { return i === 0 ? 100 : 0; });
  var mx = Math.max.apply(null, counts), w = counts.map(function (c) { return Math.pow(c / mx, 1 / T); }), s = w.reduce(function (a, b) { return a + b; }, 0);
  var raw = w.map(function (x) { return Math.round(1e6 * 100 * x / s) / 1e6; }), fl = raw.map(Math.floor), left = 100 - fl.reduce(function (a, b) { return a + b; }, 0);
  raw.map(function (v, i) { return { i: i, r: v - fl[i] }; }).sort(function (a, b) { return b.r - a.r || a.i - b.i; }).slice(0, left).forEach(function (x) { fl[x.i]++; });
  return fl;
}
function rng(seed) { var a = seed >>> 0 || 1; return function () { a = (a + 0x6d2b79f5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- 1. every arena item, many seeds ---------- */
var SEEDS = 150, n = 0;
var chatSeqs = {};
function chatSeqsOf(chat) { return chatSeqs[chat.id] || (chatSeqs[chat.id] = chat.qa.map(function (p) { return [S0, "[q]"].concat(toks(p[0]), ["[a]"], toks(p[1]), [E0]); })); }
function checkItem(it, where) {
  n++;
  var g = it.grade(it.key);
  check(g && g.frac === 1, where + ": the key scores full marks");
  check(it.grade(it.sample(rng(n))).frac >= 0, where + ": a random answer is graded");
  if (it.options) it.options.forEach(function (o) { if (typeof o.label === "string") check(!/\bdon t\b/.test(o.label), where + ": option label reads cleanly: " + o.label); });
  if (it.options) check(it.options.some(function (o) { return String(o.value) === String(it.key) || (it.kind === "chat"); }), where + ": the key is one of the options");
  var seqs = it.world ? seqsOf(it.world.text) : null;
  if (it.kind === "number") { var f = follow(seqs, [it.ctx]); check(f.filter(function (x) { return x.w === it.target; })[0].n === it.key, where + ": count"); }
  else if (it.ctx && it.target) { var f2 = follow(seqs, [it.ctx]), tot = f2.reduce(function (a, x) { return a + x.n; }, 0); check(Math.round(100 * f2.filter(function (x) { return x.w === it.target; })[0].n / tot) === it.key, where + ": %"); }
  else if (it.ctx) { check(top(follow(seqs, [it.ctx])) === it.key, where + ": top word after " + it.ctx); }
  if (it.kind === "tiles") check(JSON.stringify(greedy(seqs, it.seed, it.k, 8)) === JSON.stringify(it.key), where + ": greedy continuation of " + it.seed.join(" ") + " k=" + it.k);
  if (it.prefix && !it.backoff) { var f4 = follow(seqs, it.prefix.slice(-it.k)); check((f4.length ? top(f4) : "none") === it.key, where + ": keyhole " + it.k + " " + it.prefix.join(" ")); }
  if (it.prefix && it.backoff) { var r = backoff(seqs, it.prefix, 3); check(top(r.f) === it.key, where + ": 3-word boss " + it.prefix.join(" ")); }
  if (it.kind === "chat") {
    var cs = chatSeqsOf(it.chat), ws = ["[q]"].concat(toks(it.question), ["[a]"]), out = [];
    for (var i = 0; i < 14; i++) { var rr = backoff(cs, ws, 8); if (!rr.f.length) break; var w = top(rr.f); if (w === E0) break; out.push(w); ws.push(w); }
    check(out.join(" ") === it.key.answer, where + ": chat answer to " + it.question + " = " + out.join(" "));
    // Supported = some example chat asks the same question (same question word, same content words) and has that answer
    var STOP = ["when", "does", "do", "is", "are", "the", "a", "where", "who", "what", "at", "on"];
    var qt = toks(it.question), content = function (w) { return w.filter(function (x) { return STOP.indexOf(x) < 0; }).sort().join(" "); };
    var sup = it.chat.qa.some(function (p) { var pt = toks(p[0]); return pt[0] === qt[0] && content(pt) === content(qt) && toks(p[1]).join(" ") === out.join(" "); });
    check((sup ? "Supported" : "Made up") === it.key.support, where + ": supported / made up for " + it.question);
  }
  if (it.dice) {
    var counts = it.dice.dist.map(function (d) { return d.count; });
    check(counts.every(function (c, i) { return !i || c <= counts[i - 1]; }), where + ": counts listed biggest first");
    if (it.kind === "spin") {
      var sh = shares(counts, it.T), acc = 0, owner = null;
      sh.forEach(function (p, i) { if (owner == null && it.spot >= acc + 5 && it.spot <= acc + p - 5) owner = it.dice.dist[i].word; acc += p; });
      check(owner === it.key, where + ": the pointer (" + it.spot + ") is well inside the key's part");
      check(JSON.stringify(sh) === JSON.stringify(it.shares.map(function (x) { return x.pct; })), where + ": spin shares");
    }
    if (it.stacks) { it.options.forEach(function (o) { check(JSON.stringify(shares(counts, Number(o.value))) === JSON.stringify(o.shares.map(function (x) { return x.pct; })), where + ": bar for T=" + o.value); }); }
    if (it.pkind === "up" || it.pkind === "down") {
      var wi = it.dice.dist.map(function (d) { return d.word; }).indexOf(it.word);
      var p1 = shares(counts, 1)[wi], p2 = shares(counts, it.to)[wi];
      check((p2 > p1 ? "more" : p2 < p1 ? "less" : "same") === it.key, where + ": direction");
      check(wi === 0 || wi === counts.length - 1, where + ": asks about the top or bottom word only");
    }
  }
}
for (var s = 1; s <= SEEDS; s++) {
  L.STAGES.forEach(function (st, si) {
    var items = st.make(D, rng(s * 31 + si));
    items.forEach(function (it, i) { checkItem(it, "seed " + s + " stage " + (si + 1) + " (" + st.id + ") item " + (i + 1)); });
  });
  var fin = L.FINAL(D, rng(s * 7));
  check(fin.length === 12, "final has 12 items");
  fin.forEach(function (it, i) { checkItem(it, "seed " + s + " final item " + (i + 1)); });
  var wu = WU.stage(rng(s * 13));
  check(wu.length === 8, "warm-up has 8 items");
  wu.forEach(function (it, i) {
    var f = follow(seqsOf(it.world.text), [it.ctx]);
    check(top(f) === it.key && (f.length < 2 || f[0].n > f[1].n || f.slice().sort(function (a, b) { return b.n - a.n; })[0].n > f.slice().sort(function (a, b) { return b.n - a.n; })[1].n), "seed " + s + " warm-up item " + (i + 1) + ": clear top word");
    check(it.grade(it.key).frac === 1 && it.options.some(function (o) { return o.value === it.key; }) && it.options.length === 4, "warm-up item key");
  });
}
console.log("  arena, final and warm-up items checked: " + n + " (+ " + SEEDS * 8 + " warm-up)");

/* ---------- 2. stage 7 pools, warm-up worlds, stage counts ---------- */
D.boss3.forEach(function (w) {
  var pools = L.boss3Pools(w);
  [1, 2, 3].forEach(function (u) { check(pools[u - 1].length >= 2, "boss3 world " + w.id + " has >= 2 starts that use " + u + " word(s)"); });
});
WU.WORLDS.forEach(function (w) { check(w.text.length === 5 && WU.contexts(w).length >= 4, "warm-up world " + w.id + ": 5 sentences, >= 4 clear questions"); });
// every world's two-word boss can test backing off to 1 word (a new pair) — for every seed
D.worlds.forEach(function (w, wi) {
  var hits = 0;
  for (var s2 = 1; s2 <= 40; s2++) {
    var its = L.STAGES[4].make({ worlds: [w], boss3: D.boss3, chats: D.chats, diceCounts: D.diceCounts, diceContexts: D.diceContexts }, rng(s2 * 97 + wi));
    if (its.some(function (it) { return it.seed.length === 2 && backoff(seqsOf(w.text), it.seed, 2).k === 1; })) hits++;
  }
  check(hits === 40, "two-word boss in world " + w.id + " has a new pair (back-off to 1 word) in every run: " + hits + "/40");
});
var sizes = L.STAGES.map(function (st) { return st.make(D, rng(5)).length; });
check(JSON.stringify(sizes) === "[5,3,5,6,3,6,4]", "stage sizes 5,3,5,6,3,6,4: " + sizes);
check(JSON.stringify(L.STAGES.map(function (x) { return x.id; })) === '["count","greedy","temp","keyhole","boss2","boss3","chat"]', "stage order");

/* ---------- 3. the lessons say true things about their texts ---------- */
var T = LS.TEXTS, C = LS.CASES;
function fl(lines, ctx) { return follow(seqsOf(lines), toks(ctx)).map(function (x) { return x.w + " " + x.n; }).join(", "); }
function eq(a, b, m) { check(a === b, m + ": expected " + b + ", got " + a); }
eq(fl(T.L1, "drink"), "tea 2, coffee 1, water 1", "L1 after drink");
eq(fl(T.L1, "i"), "drink 3, eat 1", "L1 after I (75%)");
eq(fl(T.L1, "night"), E0 + " 3", "L1 after night = [end] x3");
eq(fl(T.L1, "tea"), "in 1, at 1", "L1 tie after tea, 'in' first");
eq(greedy(seqsOf(T.L2), ["my"], 1, 8).join(" "), "cat sleeps all day " + E0, "L2 guided sentence");
eq(greedy(seqsOf(T.L2), ["the"], 1, 8).join(" "), "dog sleeps all day " + E0, "L2 practice sentence");
eq(fl(T.L2, "all"), "day 2, night 1", "L2 after all");
eq(fl(T.L2, "day"), E0 + " 2", "L2 after day");
eq(JSON.stringify(shares([6, 3, 1], 1)), "[60,30,10]", "L3 shares at 1");
// hand-computed (the stage 3 example): counts 9, 4, 1 -> T=0.5: 81/98, 16/98, 1/98 ; T=1: 9/14 ... ; T=2: 3/6, 2/6, 1/6
eq(JSON.stringify([0.5, 1, 2].map(function (t) { return shares([9, 4, 1], t); })), "[[83,16,1],[64,29,7],[50,33,17]]", "stage 3 example shares");
eq(JSON.stringify(L.sharesAt([{ word: "a", count: 9 }, { word: "b", count: 4 }, { word: "c", count: 1 }], 0.5).map(function (x) { return x.pct; })), "[83,16,1]", "the game's sharesAt agrees");
check(shares([6, 3, 1], 2)[0] < 60 && shares([6, 3, 1], 0.5)[2] < 10, "L3: play shrinks at 2, swim shrinks at 0.5");
eq(JSON.stringify(shares([2, 1], 1)), "[67,33]", "L3 day/night bar");
eq([1, 2, 3].map(function (k) { return top(follow(seqsOf(T.L4), toks(C.L4.prefix).slice(-k))); }).join(","), "apples,tea,apples", "L4 keyholes 1/2/3");
eq(follow(seqsOf(T.L4), toks(C.L4.nodata)).length, 0, "L4 no data");
eq(top(follow(seqsOf(T.L5), ["dog"])) + "/" + top(follow(seqsOf(T.L5), ["the", "dog"])), "ran/sat", "L5 1 word vs 2 words");
var b5 = backoff(seqsOf(T.L5), toks(C.L5.backoff), 2);
eq(b5.k + " " + top(b5.f), "1 sat", "L5 back-off for 'a cat'");
eq(greedy(seqsOf(T.L5), C.L5.whole, 2, 8).join(" "), "sat on the mat " + E0, "L5 whole sentence with 2 words");
var cs6 = T.L6.qa.map(function (p) { return [S0, "[q]"].concat(toks(p[0]), ["[a]"], toks(p[1]), [E0]); });
function ans6(qn) { var ws = ["[q]"].concat(toks(qn), ["[a]"]), out = []; for (var i = 0; i < 14; i++) { var r = backoff(cs6, ws, 8); if (!r.f.length) break; var w = top(r.f); if (w === E0) break; out.push(w); ws.push(w); } return out.join(" "); }
eq(ans6(C.L6.exact), "next to the bank", "L6 exact question");
eq(ans6(C.L6.partial), "at nine am", "L6 new question (made up)");
eq(ans6(C.L6.onlyA), "at nine am", "L6 only 'A:' matches");
eq(follow(cs6, ["[a]"]).map(function (x) { return x.w + " " + x.n; }).join(", "), "at 2, next 1, mr 1, yes 1", "L6 first answer words");
eq(follow(cs6, ["[a]", "at"]).map(function (x) { return x.w + " " + x.n; }).join(", "), "nine 1, six 1", "L6 tie after 'A: at'");
eq(backoff(cs6, ["[q]"].concat(toks(C.L6.partial), ["[a]"]), 8).k, 2, "L6: 'open A:' is the longest ending found");
[["three", 3, "kite"], ["two", 2, "car"], ["one", 1, "bus"]].forEach(function (x) {
  var r = backoff(seqsOf(T.L7), toks(C.L7[x[0]]), 3);
  eq(r.k + " " + top(r.f), x[1] + " " + x[2], "L7 " + C.L7[x[0]]);
});
eq([1, 2].map(function (k) { return top(follow(seqsOf(T.L7), toks(C.L7.three).slice(-k))); }).join(","), "bus,car", "L7: 1 and 2 words disagree with 3");
// lesson texts: 4-6 sentences, none of them used in the stage texts
var stageSent = {};
D.worlds.concat(D.boss3).forEach(function (w) { w.text.forEach(function (x) { stageSent[x] = w.id; }); });
["L1", "L2", "L4", "L5", "L7"].forEach(function (k) {
  check(T[k].length >= 4 && T[k].length <= 6, k + " has 4-6 sentences");
  T[k].forEach(function (x) { check(!stageSent[x], k + " sentence also in a stage text: " + x); });
});
check(T.L6.qa.length === 5 && !D.chats.some(function (c) { return c.id === T.L6.id; }), "L6 has its own 5 chats");
check(/2,048 tokens/.test(LS.REAL.gpt3) && /Brown et al\., 2020/.test(LS.REAL.gpt3) && /1,000,000 tokens/.test(LS.REAL.claude), "real context-window facts as sourced");

console.log(fails ? fails + " of " + checks + " check(s) FAILED" : "All " + checks + " data checks passed");
process.exit(fails ? 1 : 0);
