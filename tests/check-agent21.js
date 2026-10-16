/*
 * AI games v2.1 PREVIEW — checks for Be the Agent v2.1 (v21/agent, v21/agent-final).   node tests/check-agent21.js   (SEEDS=n for more runs)
 * - an INDEPENDENT re-implementation of the toy context window (word count + newest-first fill) recomputes every key;
 * - every item scores full marks with its solve(), and wrong answers score 0;
 * - stage 4 is 6 items (2 "what can it see", 2 "why", 2 "fix"); the two "why"/"fix" items always differ;
 * - guessing rules a student could try without counting stay low;
 * - lesson practice, the worked example, the stage and the Arena never share a chat;
 * - stage 1 scores the app only; the Agent Arena has 10 steps, its context-window step greys only Ploy's first message
 *   (as it was when the memo was written), and its numbers match the answer key (21,445; 22,946.15 with 7% VAT; beans 520 baht/kg from 480).
 */
"use strict";
var path = require("path");
var V = path.join(__dirname, "..", "v21", "agent", "js");
global.AGENT_TOOLS = require(path.join(__dirname, "..", "agent", "js", "tools.js"));
var I = require(path.join(V, "items.js"));
var W = require(path.join(V, "window.js"));
var R = require(path.join(V, "arena.js"));
var SEEDS = Number(process.env.SEEDS) || 1500;
var n = 0, bad = 0;
function check(c, m) { n++; if (!c) { bad++; if (bad < 40) console.log("FAIL " + m); } }
function rng(seed) { var a = (seed * 2654435761) >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }   // mulberry32

/* ---------- independent toy context window ---------- */
function wc(t) { var c = 0; String(t).trim().split(/[ \n\t]+/).forEach(function (w) { if (w.length && /[0-9a-z]/i.test(w)) c++; }); return c; }
function oldestInside(texts, size) {   // walk from the newest message back while the whole message still fits
  var total = 0, k;
  for (k = texts.length - 1; k >= 0; k--) { if (total + wc(texts[k]) > size) break; total += wc(texts[k]); }
  return k + 1;
}
var SIZE = 60;
check(W.SIZE === SIZE, "the toy window is 60 words");
function texts(c) { return c.msgs.map(function (m) { return m.text; }); }
W.SEE.concat(W.PRACTICE_SEE, [W.EXAMPLE]).forEach(function (c) {
  var k = oldestInside(texts(c), SIZE);
  check(W.firstInside(c.msgs, SIZE) === k, c.id + ": game key " + W.firstInside(c.msgs, SIZE) + " = independent " + k);
  c.msgs.forEach(function (m) { check(W.words(m.text) === wc(m.text), c.id + ": word count of “" + m.text + "”"); check(!/[฀-๿]/.test(m.text), c.id + ": no Thai text (no spaces between Thai words, so counts would be unclear)"); });
  var used = 0; for (var j = k; j < c.msgs.length; j++) used += wc(c.msgs[j].text);
  check(k === 0 || used + wc(c.msgs[k - 1].text) > SIZE, c.id + ": the message before the key really doesn't fit");
});
/* the lesson example: the instruction message is out by the end, and the final reply shows the mistake */
check(/Khun Somsak/.test(W.EXAMPLE.msgs[0].text) && oldestInside(texts(W.EXAMPLE), SIZE) > 0 && /Dear owner/.test(W.EXAMPLE.msgs[W.EXAMPLE.msgs.length - 1].text), "lesson example: Khun Somsak slides out, the reply says Dear owner");
/* stage "see" keys are spread: no single key value in more than a third of the stage chats */
var keyCount = {};
W.SEE.forEach(function (c) { var k = oldestInside(texts(c), SIZE); keyCount[k] = (keyCount[k] || 0) + 1; });
Object.keys(keyCount).forEach(function (k) { check(keyCount[k] <= Math.ceil(W.SEE.length / 3), "stage 'see' key " + k + " is used by " + keyCount[k] + " of " + W.SEE.length + " chats"); });
/* "why" chats: an "out" cause really has message 1 outside; "never"/"newchat" chats fit completely */
W.WHY.concat(W.PRACTICE_WHY).forEach(function (c) {
  var k = oldestInside(texts(c), SIZE);
  if (c.cause === "out") check(k >= 1, c.id + ": the fact's message (1) slid out");
  else if (c.cause === "newchat") check(k === 0, c.id + ": the whole (new) chat fits");
  if (c.cause === "never") check(k === 0 || c.id === "why-delivery", c.id + ": a 'never' chat fits, except the one long chat whose slid-out part is about something else");
  check(c.newChat === (c.cause === "newchat"), c.id + ": a 'New chat' note exactly when the cause is newchat");
  check(W.CAUSES.some(function (x) { return x.value === c.cause; }), c.id + ": a known cause");
});
/* ---------- no shared chats or cases between teaching and testing ---------- */
function sig(c) { return texts(c).join(" | ").toLowerCase(); }
var stageS = W.SEE.concat(W.WHY).map(sig), pracS = W.PRACTICE_SEE.concat(W.PRACTICE_WHY).map(sig).concat([sig(W.EXAMPLE)]);
pracS.forEach(function (s) { check(stageS.indexOf(s) < 0, "practice/example chat not in the stage: " + s.slice(0, 50)); });
var allMsgs = {};
W.SEE.concat(W.WHY, W.PRACTICE_SEE, W.PRACTICE_WHY, [W.EXAMPLE]).forEach(function (c) { var grp = (W.SEE.indexOf(c) >= 0 || W.WHY.indexOf(c) >= 0) ? "stage" : "teach";
  c.msgs.forEach(function (m) { if (m.from !== "human") return; var t = m.text.toLowerCase(); if (allMsgs[t] && allMsgs[t] !== grp) check(false, "the Ploy message “" + m.text + "” is in both a stage and a lesson chat"); allMsgs[t] = grp; }); });
W.PRACTICE_FIX.forEach(function (f) { check(W.FIX.every(function (g) { return g.text !== f.text; }), "practice fix case not in the stage: " + f.id); });
var arenaText = R.chatBefore(R.steps(rng(1)), 10).map(function (m) { return m.text.toLowerCase(); }).join(" ");
W.SEE.concat(W.WHY, W.PRACTICE_SEE, W.PRACTICE_WHY, [W.EXAMPLE]).forEach(function (c) { c.msgs.forEach(function (m) { if (m.text.length > 25) check(arenaText.indexOf(m.text.toLowerCase()) < 0, "Arena doesn't reuse “" + m.text + "”"); }); });

/* ---------- items, stage 4 and guessing rules ---------- */
var rules = { afterLongest: 0, firstOpt: 0, lastOpt: 0, secondOpt: 0, middle: 0, longest: 0, shortest: 0, firstModel: 0, oldestHuman2: 0, newestFour: 0 }, seeN = 0;
var whyRules = { alwaysOut: 0, firstOpt: 0, longIsOut: 0 }, whyN = 0, fixRules = { firstOpt: 0, lastOpt: 0 }, fixN = 0, fixKey = {}, whyKey = {};
for (var s = 1; s <= SEEDS; s++) {
  var r = rng(s), st = W.stage(r);
  check(st.length === 6 && st.map(function (it) { return it.kind; }).join() === "window,why,fix,window,why,fix", "stage 4 has 2 of each kind, in order (seed " + s + ")");
  check(st[1].key !== st[4].key, "the two 'why' items have different causes (seed " + s + ")");
  check(st[2].key !== st[5].key, "the two 'fix' items have different fixes (seed " + s + ")");
  check(st[0].id !== st[3].id, "two different 'see' chats (seed " + s + ")");
  st.forEach(function (it) {
    check(it.grade(it.solve()).frac === 1, it.id + ": solve() scores full marks");
    var wrong = it.options.filter(function (o) { return String(o.value) !== String(it.key); })[0];
    check(it.grade(wrong.value).frac === 0, it.id + ": a wrong answer scores 0");
    check(typeof it.limit === "number" && it.limit >= 40, it.id + ": a time limit");
    if (it.kind === "window") {
      seeN++;
      var len = it.msgs.map(function (m) { return wc(m.text); }), K = it.key, L = it.msgs.length;
      if (K === 0) rules.firstOpt++;
      if (K === L - 1) rules.lastOpt++;
      if (K === 1) rules.secondOpt++;
      if (K === Math.floor(L / 2)) rules.middle++;
      var mx = len.indexOf(Math.max.apply(null, len)), mn = len.indexOf(Math.min.apply(null, len));
      if (K === mx) rules.longest++;
      if (K === mx + 1) rules.afterLongest++;
      if (K === mn) rules.shortest++;
      if (it.msgs[K].from === "model" && it.msgs.slice(0, K).every(function (m) { return m.from !== "model"; })) rules.firstModel++;
      if (K === 2) rules.oldestHuman2++;
      if (K === Math.max(0, L - 4)) rules.newestFour++;
      check(it.options.length === L && it.options.every(function (o, i) { return o.value === i; }), it.id + ": the options are the messages in chat order");
    }
    if (it.kind === "why") { whyN++; whyKey[it.key] = (whyKey[it.key] || 0) + 1; if (it.key === "out") whyRules.alwaysOut++; if ((it.newChat ? "newchat" : oldestInside(texts(it), SIZE) > 0 ? "out" : "never") === it.key) whyRules.longIsOut++; if (it.options[0].value === it.key) whyRules.firstOpt++; }
    if (it.kind === "fix") { fixN++; fixKey[it.key] = (fixKey[it.key] || 0) + 1; if (it.options[0].value === it.key) fixRules.firstOpt++; if (it.options[it.options.length - 1].value === it.key) fixRules.lastOpt++; check(it.key !== "nothing", it.id + ": 'nothing' is never the fix"); }
  });
}
Object.keys(rules).forEach(function (k) { var p = 100 * rules[k] / seeN; console.log("  'see' rule " + k + ": " + p.toFixed(1) + "%"); check(p <= 40, "'see' guessing rule " + k + " is right " + p.toFixed(1) + "% (must be <= 40%)"); });
console.log("  'why' causes: " + JSON.stringify(whyKey) + "; 'fix' keys: " + JSON.stringify(fixKey));
check(100 * whyRules.alwaysOut / whyN <= 50, "'why' rule always-'slid out' is right " + (100 * whyRules.alwaysOut / whyN).toFixed(1) + "% (<= 50%)");
console.log("  (info) 'why' rule \"New chat note → new chat; too long → slid out; else never\": " + (100 * whyRules.longIsOut / whyN).toFixed(1) + "% (concept-aligned: it is the lesson's counting; one long 'never' chat breaks it)");
check(100 * whyRules.firstOpt / whyN <= 40, "'why' first option " + (100 * whyRules.firstOpt / whyN).toFixed(1) + "% (<= 40%)");
check(100 * fixRules.firstOpt / fixN <= 40 && 100 * fixRules.lastOpt / fixN <= 40, "'fix' first/last option <= 40%");
Object.keys(fixKey).forEach(function (k) { check(100 * fixKey[k] / fixN <= 50, "'fix' key " + k + " is " + (100 * fixKey[k] / fixN).toFixed(1) + "% of fix items (<= 50%)"); });
/* practice decks: every practice item solvable */
["see", "why", "fix"].forEach(function (k) { for (var j = 0; j < 12; j++) { var it = W.PRACTICE[k](rng(900 + j)); check(it.grade(it.solve()).frac === 1, "practice " + k + " " + it.id + " solvable"); } });

/* ---------- stage 1: the app only ---------- */
for (var s1 = 1; s1 <= 200; s1++) {
  I.STAGES[0].make(rng(s1)).forEach(function (it) {
    check(it.kind === "toolpick" && it.grade({ tool: it.tool }).frac === 1, it.id + ": right app = full marks");
    var other = I.TOOLS.filter(function (t) { return t.value !== it.tool; })[0].value;
    check(it.grade({ tool: other }).frac === 0, it.id + ": wrong app = 0");
    check(it.grade(it.solve()).frac === 1, it.id + ": solve()");
    check(it.replies.filter(function (x) { return x.ok; }).length === 1, it.id + ": exactly one good reply to show");
  });
}
check(I.STAGES.filter(function (x) { return x.id === "inject" || x.id === "perm"; }).length === 2, "hidden orders and permissions stages exist");

/* ---------- the Agent Arena v2.1 ---------- */
check(R.numbers.total === 21445 && Math.abs(R.numbers.withVat - 22946.15) < 0.001, "Arena numbers: 21,445 and 22,946.15");
for (var sa = 1; sa <= 300; sa++) {
  var S = R.steps(rng(sa));
  check(S.length === 10, "Arena has 10 steps");
  check(S.map(function (x) { return x.id; }).join() === "app-vat,source,app-total,app-letter,inject,app-memo,check,window,perm,reply", "Arena step order");
  S.forEach(function (st, si) {
    check(R.grade(st, st.key).frac === 1, "Arena " + st.id + ": the key scores 1");
    st.options.forEach(function (o) { if (o.value !== st.key) check(R.grade(st, o.value).frac === 0, "Arena " + st.id + ": " + o.value + " scores 0"); });
    var labels = st.options.map(function (o) { return o.label; });
    check(new Set(labels).size === labels.length, "Arena " + st.id + ": distinct options");
    if (st.window) {
      var mi = S.map(function (x) { return x.id; }).indexOf("app-memo"), atMemo = R.chatBefore(S, mi), size = R.windowSize(S), tx = atMemo.map(function (m) { return m.text; });
      check(mi < si, "Arena: the memo is written before the window step");
      check(oldestInside(tx, size) === 1, "Arena window: when the memo was written, only Ploy's first message was out (size " + size + ")");
      var later = R.chatBefore(S, si);
      check(/Khun Somsak/.test(later[0].text) && later[later.length - 1].text === R.COMPLAINT, "Arena window step: the task names Khun Somsak; Ploy's complaint is the newest message");
      check(later.slice(1, -1).every(function (m) { return !/Khun Somsak/.test(m.text) || m.from === "model"; }), "Arena window step: Ploy says Khun Somsak only in the first message before her complaint");
      check(atMemo.slice(1).every(function (m) { return !/Khun Somsak/.test(m.text); }), "Arena: nothing inside the window at memo time names Khun Somsak");
      check(R.MEMO_BAD.indexOf("Dear owner") === 0 && R.MEMO_OK.indexOf("Dear Khun Somsak") === 0, "Arena memos: bad then fixed");
    }
  });
  var keyPos = S.filter(function (x) { return !x.tools && x.id !== "perm"; }).map(function (x) { return x.options.map(function (o) { return o.value; }).indexOf(x.key); });
  check(keyPos.every(function (p) { return p >= 0; }), "Arena: every key is an option");
}
var reply = R.steps(rng(5)).filter(function (x) { return x.id === "reply"; })[0], ok = reply.options.filter(function (o) { return o.value === "ok"; })[0].label;
check(/22,946\.15/.test(ok) && /520 baht/.test(ok) && /Khun Somsak/.test(ok) && /didn't/.test(ok) && /Shall I/.test(ok), "Arena final reply has the numbers, the name, the warning and a question");

console.log(bad ? bad + " of " + n + " v2.1 agent checks FAILED" : "All " + n + " v2.1 agent checks passed");
process.exit(bad ? 1 : 0);
