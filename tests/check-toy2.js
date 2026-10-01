/*
 * AI games v2.1 · checks for toy model v2 (v21/): lesson 8, stage 8 "Meaning brain", final questions 13-14.
 * Every key is recomputed here with a SEPARATE implementation (no code shared with v21/shared/model2.js).
 *   node tests/check-toy2.js
 */
"use strict";
global.window = global;
require("../shared/model.js");
const T2 = require("../v21/shared/model2.js");
require("../v21/llm/data/toy2.js");
require("../llm/data/worlds.js");
const G = require("../v21/llm/js/toy2.js");
const L = require("../v21/llm/js/items.js");
const M = global.BTL.Model, D = global.LLMA_TOY2_DATA;

let n = 0, bad = 0;
function check(c, m) { n++; if (!c) { bad++; console.log("FAIL", m); } }

/* ---------- the independent toy v2 ---------- */
const words = s => s.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(" ").filter(x => x.length);
const set = a => Array.from(new Set(a));
function pts(chats, w) {
  let c = 0; for (const qa of chats) if (set(words(qa[0])).includes(w)) c++;
  if (c === 0 || c === chats.length) return 0;
  if (c === 1) return 8; if (c === 2) return 4; if (c <= 4) return 2; return 1;
}
function indep(chats, question) {
  const qw = set(words(question));
  const scores = chats.map(qa => { const cw = set(words(qa[0])); return qw.filter(w => cw.includes(w)).reduce((s, w) => s + pts(chats, w), 0); });
  const total = scores.reduce((a, b) => a + b, 0);
  const byAns = {}; const order = [];
  chats.forEach((qa, i) => { if (!scores[i]) return; if (!(qa[1] in byAns)) { byAns[qa[1]] = 0; order.push(qa[1]); } byAns[qa[1]] += scores[i]; });
  let best = -1; scores.forEach((s, i) => { if (best < 0 || s > scores[best]) best = i; });
  const sorted = scores.slice().sort((a, b) => b - a);
  return { scores, total, pct: a => 100 * byAns[a] / total, answers: order, byAns, best, margin: sorted[0] - sorted[1] };
}
function copyIndep(prompt) {
  const w = words(prompt), last = w[w.length - 1];
  let at = -1; for (let i = 0; i < w.length - 1; i++) if (w[i] === last) at = i;
  return { word: w[at + 1], earlier: w.slice(0, -1).filter(x => x === last).length };
}

/* ---------- 1. the engine agrees with the independent version on every question in the data ---------- */
const allSets = [D.lesson.chats].concat(D.sets, D.final.sets);
const asksOf = s => s === D.lesson.chats ? [D.lesson.meaning, D.lesson.most, D.lesson.share] : s.ask;
allSets.forEach(s => asksOf(s).forEach(q => {
  const a = T2.analyse(s.qa, q), b = indep(s.qa, q);
  check(a.rows.map(r => r.score).join() === b.scores.join(), `${s.id} "${q}": chat scores ${a.rows.map(r => r.score)} vs ${b.scores}`);
  check(a.total === b.total, `${s.id} "${q}": total`);
  a.answers.forEach(x => check(Math.abs(x.pct - b.pct(x.answer)) < 1e-9, `${s.id} "${q}": % of "${x.answer}"`));
  a.words.forEach(w => check(Number.isInteger(w.points) && [0, 1, 2, 4, 8].includes(w.points) && w.points === pts(s.qa, w.word), `${s.id} "${q}": points of "${w.word}"`));
  check(s.qa.length === 8, `${s.id}: 8 chats`);
}));

/* ---------- 2. lesson 8 teaches what it claims ---------- */
{
  const C = D.lesson.chats.qa, m = indep(C, D.lesson.meaning);
  check(m.best === 4 && C[4][0].includes("bank") && m.margin >= 2, "lesson 8: the bank chat gets the most say for 'when does the bank open' (meaning beats matching)");
  check(m.scores[0] === 6 && m.scores[4] === 8, "lesson 8: shop chat 6, bank chat 8 (the numbers in the lesson)");
  const v1 = L.chatAnswer({ id: "chk-l8", qa: C }, D.lesson.meaning);
  check(v1.answer !== C[4][1], `lesson 8: toy v1 gives a different (borrowed) answer: "${v1.answer}"`);
  const mo = indep(C, D.lesson.most);
  check(mo.best === 6 && !C[6][0].includes("pool"), "lesson 8: 'who owns the pool' → chat 7 (about the cafe): a made-up answer");
  const sh = indep(C, D.lesson.share), second = sh.answers.slice().sort((x, y) => sh.byAns[y] - sh.byAns[x])[1];
  check(Math.round(sh.pct(second)) === 33 && sh.total === 24, `lesson 8: the blended example: "${second}" gets 33% of 24 points`);
  const cp = copyIndep(D.lesson.copy.prompt);
  check(cp.word === "fizz" && cp.earlier === 1 && D.lesson.copy.options.includes("fizz"), "lesson 8: copy example → fizz (one earlier match)");
  check(D.lesson.addon.length === 3 && D.lesson.addon.some(x => x.needs) && D.lesson.addon.some(x => !x.needs), "lesson 8: add-on practice has both kinds");
}

/* ---------- 3. clarity of the pools ---------- */
[D.copy, D.final.copy].forEach(pool => pool.forEach(c => {
  const r = copyIndep(c.prompt);
  check(r.earlier === 1, `copy "${c.prompt}": the last word appears exactly once earlier`);
  check(c.options.includes(r.word) && set(c.options).length === 4, `copy "${c.prompt}": 4 different options, key ${r.word} among them`);
  check(T2.copyNext(words(c.prompt)).word === r.word, `copy "${c.prompt}": engine agrees`);
}));
const most = G.mostPool(D.sets), share = G.sharePool(D.sets);
check(most.length >= 10 && share.length >= 9, `stage 8 pools are big enough (most ${most.length}, share ${share.length})`);
most.forEach(x => check(indep(x.set.qa, x.q).margin >= 2, `most-say "${x.q}": a clear winner (margin >= 2)`));
check(G.mostPool(D.final.sets).length >= 3 && G.sharePool(D.final.sets).length >= 3, "final pools are big enough");

/* ---------- 4. no overlap between lesson, stage and final ---------- */
const qsOf = arr => arr.flatMap(s => s.qa.map(p => p[0]).concat(s.ask || []));
const lessonQ = D.lesson.chats.qa.map(p => p[0]).concat([D.lesson.meaning, D.lesson.most, D.lesson.share]);
const stageQ = qsOf(D.sets), finalQ = qsOf(D.final.sets);
check(!lessonQ.some(q => stageQ.includes(q) || finalQ.includes(q)) && !stageQ.some(q => finalQ.includes(q)), "no question shared between lesson 8, stage 8 and the final");
const v1Q = global.LLMA_DATA.chats.flatMap(c => c.qa.map(p => p[0]).concat(c.ask));
check(!stageQ.concat(finalQ, lessonQ.filter(q => !["when does the shop open", "when does the shop close", "where is the shop"].includes(q))).some(q => v1Q.includes(q)),
  "no lesson 8 / stage 8 / final question repeats a stage 7 (toy v1) chat or question (lesson 8 reuses 3 corner-shop questions from lesson 7 on purpose)");
check(!global.LLMA_DATA.chats.some(c => [D.lesson.chats.name].concat(D.sets.map(s => s.name), D.final.sets.map(s => s.name)).some(n => n.split(" ")[0] === c.name.split(" ")[0])), "set names don't echo stage 7 set names (Sunny / Hilltop)");
const sets3 = [D.lesson.chats.name].concat(D.sets.map(s => s.name), D.final.sets.map(s => s.name));
check(set(sets3).length === sets3.length, "every chat set has its own name");
const lp = [D.lesson.copy.prompt], sp = D.copy.map(c => c.prompt), fp = D.final.copy.map(c => c.prompt);
check(set(lp.concat(sp, fp)).length === lp.length + sp.length + fp.length, "copy prompts never repeat across lesson/stage/final");
const la = D.lesson.addon.map(x => x.text), sa = D.addon.map(x => x.text), fa = D.final.addon.map(x => x.text);
check(set(la.concat(sa, fa)).length === la.length + sa.length + fa.length, "add-on requests never repeat across lesson/stage/final");
check(D.addon.filter(x => x.needs).length >= 3 && D.addon.filter(x => !x.needs).length >= 3, "stage add-on pool has both kinds");

/* ---------- 5. 300 runs of stage 8 and of the final ---------- */
const OPTS_S = [], OPTS_F = [], MOST_S = [], MOST_F = [], COPY_S = [], COPY_F = [], ADD_S = [], ADD_F = [];
function checkItem(it, where) {
  const vals = it.options.map(o => String(o.value));
  check(set(vals).length === vals.length && vals.includes(String(it.key)), `${where} ${it.kind}: distinct options with the key`);
  check(it.grade(it.key).frac === 1 && vals.filter(v => v !== String(it.key)).every(v => it.grade(v).frac === 0), `${where} ${it.kind}: only the key scores`);
  if (it.kind === "t2most") {
    const r = indep(it.chat.qa, it.question); check(String(r.best) === String(it.key), `${where} most-say key "${it.question}"`);
    const runner = r.scores.map((x, i) => [x, i]).filter(x => x[1] !== r.best).sort((a, b) => b[0] - a[0] || a[1] - b[1])[0][1];
    check(vals.includes(String(runner)), `${where} most-say: the runner-up chat is an option`);
    const qw = set(words(it.question)), opts = vals.map(Number);
    const shared = opts.map(i => set(words(it.chat.qa[i][0])).filter(w => qw.includes(w)).length);
    const allShared = it.chat.qa.map(qa => set(words(qa[0])).filter(w => qw.includes(w)).length);
    (where.startsWith('final') ? MOST_F : MOST_S).push({ k: Number(it.key), kq: it.chat.qa[Number(it.key)][0], naive: opts[shared.indexOf(Math.max(...shared))],
      first: opts.find(i => words(it.chat.qa[i][0])[0] === words(it.question)[0]), rare: allShared[r.best] < Math.max(...allShared),
      highest: Math.max(...opts), lowest: Math.min(...opts),
      odd: (() => { const fw = opts.map(i => words(it.chat.qa[i][0])[0]); const lone = opts.filter((i, j) => fw.filter(x => x === fw[j]).length === 1); return lone.length === 1 ? lone[0] : -1; })() });
    if (it.kind === "t2most") check(true, "");
  }
  if (it.kind === "t2share") {
    const r = indep(it.chat.qa, it.question);
    check(String(Math.round(r.pct(it.answer))) === String(it.key), `${where} share key "${it.question}" / "${it.answer}"`);
    const ps = vals.map(Number); for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) check(Math.abs(ps[i] - ps[j]) >= 5, `${where} share options at least 5 apart (${ps})`);
    const k = Number(it.key); check(ps.length === 4, `${where} share: 4 options`);
    check(Object.keys(indep(it.chat.qa, it.question).byAns).length < 2 || ps.every(x => x <= 94), `${where} share: no 95-100% option when 2+ answers have points (${ps})`); (where.startsWith('final') ? OPTS_F : OPTS_S).push({ ps, k, sc: indep(it.chat.qa, it.question).byAns[it.answer] });
  }
  if (it.kind === "t2copy") {
    const pw0 = words(it.prompt), inp = vals.filter(v => pw0.includes(v)).sort((x, y) => pw0.indexOf(x) - pw0.indexOf(y)), byLen = vals.slice().sort((x, y) => x.length - y.length);
    const raw0 = it.prompt.split(" "), ai = raw0.indexOf("and");
    (where.startsWith('final') ? COPY_F : COPY_S).push({ k: String(it.key), earliest: inp[0], latest: inp[inp.length - 1], middle: inp[1], shortest: byLen[0], longest: byLen[3], beforeAnd: raw0[ai - 1], afterAnd: raw0[ai + 1] });
    check(copyIndep(it.prompt).word === it.key, `${where} copy key`);
    const pw = words(it.prompt), labels = it.options.map(o => o.label), cap = labels.filter(l => l[0] !== l[0].toLowerCase());
    check(!(cap.length === 1 && cap[0] === labels[vals.indexOf(String(it.key))]), `${where} copy: the key is not the only capitalised option (${labels})`);
    check(vals.filter(v => v !== it.key && pw.includes(v)).length >= 2, `${where} copy: at least 2 wrong options are words from the prompt (${vals})`);
  }
  if (it.kind === "t2addon") {
    const t0 = it.request, tool = it.key === "tool";
    (where.startsWith('final') ? ADD_F : ADD_S).push({ q: t0.trim().endsWith("?") === tool, wh: /^(what|which|how|when|where|who)/i.test(t0) === tool, len: (t0.length > 45) === tool,
      cue: /\b(my|our|today|tonight|now|tomorrow|yesterday)\b/i.test(t0) === tool, all: tool }); const x = D.addon.concat(D.final.addon).filter(y => y.text === it.request)[0]; check(x && (x.needs ? "tool" : "plain") === it.key, `${where} add-on key`); }
}
for (let s = 1; s <= (Number(process.env.SEEDS) || 1500); s++) {
  const its = G.stage8(M.makeRng(s));
  check(its.map(i => i.kind).join() === "t2most,t2share,t2copy,t2addon", `seed ${s}: stage 8 has the 4 kinds in order`);
  its.forEach(it => { checkItem(it, `stage 8 seed ${s}`); check(!it.chat || D.sets.some(x => x.id === it.chat.id), `seed ${s}: stage 8 uses stage data only`); });
  const f = L.FINAL(global.LLMA_DATA, M.makeRng(s));
  check(f.length === 14, `seed ${s}: the final has 14 questions`);
  check(f[12].kind === "t2most" && ["t2copy", "t2addon"].includes(f[13].kind) && f[12].skill === "Meaning brain" && f[13].skill === "Meaning brain", `seed ${s}: final 13-14 are toy-v2 items`);
  f.slice(12).forEach(it => {
    checkItem(it, `final seed ${s}`);
    if (it.chat) check(D.final.sets.some(x => x.id === it.chat.id), `final seed ${s}: uses final data only`);
    if (it.prompt) check(D.final.copy.some(c => c.prompt === it.prompt), `final seed ${s}: final copy prompt`);
    if (it.request) check(D.final.addon.some(c => c.text === it.request), `final seed ${s}: final add-on request`);
  });
}
/* no simple guessing rule may beat 40% on share items (checked separately for stage 8 and the final) */
const STRATS = {
  smallest: ps => Math.min(...ps), largest: ps => Math.max(...ps),
  "largest under 100": ps => Math.max(...ps.filter(x => x !== 100)),
  "second smallest": ps => ps.slice().sort((a, b) => a - b)[1], "second largest": ps => ps.slice().sort((a, b) => a - b)[2],
  "closest to 50": ps => ps.slice().sort((a, b) => Math.abs(a - 50) - Math.abs(b - 50))[0],
  "closest to the mean": ps => { const m = ps.reduce((a, b) => a + b, 0) / ps.length; return ps.slice().sort((a, b) => Math.abs(a - m) - Math.abs(b - m))[0]; },
  "middle without 100": ps => { const q = ps.filter(x => x !== 100).sort((a, b) => a - b); return q[Math.floor((q.length - 1) / 2)]; },
  "not a multiple of 5": ps => ps.find(x => x % 5 !== 0) || ps[0]
};
const near = (ps, t) => ps.slice().sort((a, b) => Math.abs(a - t) - Math.abs(b - t))[0];
for (let A = 5; A <= 95; A++) STRATS["closest to " + A] = ps => near(ps, A);
STRATS["the only multiple of 5 (else the first)"] = ps => { const m5 = ps.filter(x => x % 5 === 0); return m5.length === 1 ? m5[0] : ps[0]; };
check(OPTS_F.length === 0, "the final has no % question (question 13 is always 'which chat'; the final's chats give too few different % answers)");
[["stage 8", OPTS_S]].forEach(([nm, list]) => {
  Object.entries(STRATS).forEach(([sn, f]) => {
    const hit = list.filter(o => f(o.ps) === o.k).length / list.length;
    check(list.length > 50 && hit <= 0.4, `${nm} share items: guessing rule "${sn}" is right ${(100 * hit).toFixed(1)}% of the time (must be <= 40%, n=${list.length})`);
  });
  [2, 2.5, 3, 4, 5, 6].forEach(x => { const hit = list.filter(o => near(o.ps, x * o.sc) === o.k).length / list.length;
    check(hit <= 0.4, `${nm} share items: "closest to the points x ${x}" is right ${(100 * hit).toFixed(1)}% (must be <= 40%)`); });
});
/* most-say: the naive rules must fail often, and most items must be "a rare word beats more matching words" */
[["stage 8", MOST_S], ["final", MOST_F]].forEach(([nm, list]) => {
  const pct = f => list.filter(f).length / list.length;
  check(list.length > 50 && pct(m => m.naive === m.k) <= 0.4, `${nm} most-say: "the chat sharing the most words" is right ${(100 * pct(m => m.naive === m.k)).toFixed(1)}% (must be <= 40%)`);
  check(pct(m => m.first === m.k) <= 0.4, `${nm} most-say: "same first word" is right ${(100 * pct(m => m.first === m.k)).toFixed(1)}% (must be <= 40%)`);
  [["highest-numbered chat", m => m.highest], ["lowest-numbered chat", m => m.lowest], ["the one option whose question starts differently", m => m.odd]].forEach(([rn, f]) => {
    check(pct(m => f(m) === m.k) <= 0.4, `${nm} most-say: "${rn}" is right ${(100 * pct(m => f(m) === m.k)).toFixed(1)}% (must be <= 40%)`); });
  check(pct(m => m.rare) >= 0.55, `${nm} most-say: ${(100 * pct(m => m.rare)).toFixed(1)}% are "a rare word beats more matching words" (must be >= 55%)`);
});
{ const fr = G.mostPool(D.final.sets).filter(x => x.rare).length, kc = {};
  MOST_F.forEach(m => { kc[m.kq] = (kc[m.kq] || 0) + 1; });
  const top = Math.max(...Object.values(kc)) / MOST_F.length;
  check(fr >= 5, `final: at least 5 "rare word wins" questions (${fr})`);
  check(top <= 0.3, `final most-say: no winning chat in more than 30% of items (${(100 * top).toFixed(1)}%)`); }
/* copy and add-on items: no position, length or sentence-form shortcut */
[["stage 8", COPY_S], ["final", COPY_F]].forEach(([nm, list]) => {
  ["earliest", "latest", "middle", "shortest", "longest", "beforeAnd", "afterAnd"].forEach(r => { const p = list.filter(c => c[r] === c.k).length / list.length;
    check(list.length > 50 && p <= 0.4, `${nm} copy: "${r} option" is right ${(100 * p).toFixed(1)}% (must be <= 40%)`); });
});
[["stage 8", ADD_S], ["final", ADD_F]].forEach(([nm, list]) => {
  // sentence-FORM rules must fail (<= 62%). Word rules that follow the concept itself (time words = new information,
  // "write" = generating) are reported only: see TEACHING_GUIDE "Design choices".
  [["question -> tool", "q"], ["what/which/how... -> tool", "wh"], ["long -> tool", "len"], ["always tool", "all"]].forEach(([rn, f]) => {
    const p = list.filter(c => c[f]).length / list.length; const p2 = Math.max(p, f === "all" ? 1 - p : 0);
    check(list.length > 50 && p2 <= 0.62, `${nm} add-on: "${rn}" is right ${(100 * p2).toFixed(1)}% (must be <= 62%; 2 options)`); });
  console.log(`  (info) ${nm} add-on: "my/our/today/now -> tool" is right ${(100 * list.filter(c => c.cue).length / list.length).toFixed(1)}% (concept-aligned, not enforced)`);
});
/* lesson 8: the "is its answer right?" practice contrasts the winner with a chat that really is about the pool */
{ const C = D.lesson.chats.qa, mo = indep(C, D.lesson.most); check(C.some((qa, i) => i !== mo.best && words(qa[0]).includes("pool")), "lesson 8: a chat about the pool exists for the made-up contrast"); }
/* ---------- 6. v2.1 game definition ---------- */
check(L.STAGES.length === 8 && L.STAGES[7].id === "meaning", "v2.1 items: 8 stages, the 8th is 'meaning'");

console.log(bad ? `${bad} of ${n} toy-v2 checks FAILED` : `All ${n} toy-v2 checks passed`);
process.exit(bad ? 1 : 0);
