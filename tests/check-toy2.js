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
check(most.length >= 10 && share.length >= 10, `stage 8 pools are big enough (most ${most.length}, share ${share.length})`);
most.forEach(x => check(indep(x.set.qa, x.q).margin >= 2, `most-say "${x.q}": a clear winner (margin >= 2)`));
check(G.mostPool(D.final.sets).length >= 3 && G.sharePool(D.final.sets).length >= 3, "final pools are big enough");

/* ---------- 4. no overlap between lesson, stage and final ---------- */
const qsOf = arr => arr.flatMap(s => s.qa.map(p => p[0]).concat(s.ask || []));
const lessonQ = D.lesson.chats.qa.map(p => p[0]).concat([D.lesson.meaning, D.lesson.most, D.lesson.share]);
const stageQ = qsOf(D.sets), finalQ = qsOf(D.final.sets);
check(!lessonQ.some(q => stageQ.includes(q) || finalQ.includes(q)) && !stageQ.some(q => finalQ.includes(q)), "no question shared between lesson 8, stage 8 and the final");
const sets3 = [D.lesson.chats.name].concat(D.sets.map(s => s.name), D.final.sets.map(s => s.name));
check(set(sets3).length === sets3.length, "every chat set has its own name");
const lp = [D.lesson.copy.prompt], sp = D.copy.map(c => c.prompt), fp = D.final.copy.map(c => c.prompt);
check(set(lp.concat(sp, fp)).length === lp.length + sp.length + fp.length, "copy prompts never repeat across lesson/stage/final");
const la = D.lesson.addon.map(x => x.text), sa = D.addon.map(x => x.text), fa = D.final.addon.map(x => x.text);
check(set(la.concat(sa, fa)).length === la.length + sa.length + fa.length, "add-on requests never repeat across lesson/stage/final");
check(D.addon.filter(x => x.needs).length >= 3 && D.addon.filter(x => !x.needs).length >= 3, "stage add-on pool has both kinds");

/* ---------- 5. 300 runs of stage 8 and of the final ---------- */
const OPTS_S = [], OPTS_F = [];
function checkItem(it, where) {
  const vals = it.options.map(o => String(o.value));
  check(set(vals).length === vals.length && vals.includes(String(it.key)), `${where} ${it.kind}: distinct options with the key`);
  check(it.grade(it.key).frac === 1 && vals.filter(v => v !== String(it.key)).every(v => it.grade(v).frac === 0), `${where} ${it.kind}: only the key scores`);
  if (it.kind === "t2most") {
    const r = indep(it.chat.qa, it.question); check(String(r.best) === String(it.key), `${where} most-say key "${it.question}"`);
    const runner = r.scores.map((x, i) => [x, i]).filter(x => x[1] !== r.best).sort((a, b) => b[0] - a[0] || a[1] - b[1])[0][1];
    check(vals.includes(String(runner)), `${where} most-say: the runner-up chat is an option`);
  }
  if (it.kind === "t2share") {
    const r = indep(it.chat.qa, it.question);
    check(String(Math.round(r.pct(it.answer))) === String(it.key), `${where} share key "${it.question}" / "${it.answer}"`);
    const ps = vals.map(Number); for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) check(Math.abs(ps[i] - ps[j]) >= 5, `${where} share options at least 5 apart (${ps})`);
    const k = Number(it.key); check(ps.length === 4, `${where} share: 4 options`); (where.startsWith('final') ? OPTS_F : OPTS_S).push({ ps, k });
  }
  if (it.kind === "t2copy") check(copyIndep(it.prompt).word === it.key, `${where} copy key`);
  if (it.kind === "t2addon") { const x = D.addon.concat(D.final.addon).filter(y => y.text === it.request)[0]; check(x && (x.needs ? "tool" : "plain") === it.key, `${where} add-on key`); }
}
for (let s = 1; s <= 1500; s++) {
  const its = G.stage8(M.makeRng(s));
  check(its.map(i => i.kind).join() === "t2most,t2share,t2copy,t2addon", `seed ${s}: stage 8 has the 4 kinds in order`);
  its.forEach(it => { checkItem(it, `stage 8 seed ${s}`); check(D.sets.includes(it.chat) || !it.chat, `seed ${s}: stage 8 uses stage data only`); });
  const f = L.FINAL(global.LLMA_DATA, M.makeRng(s));
  check(f.length === 14, `seed ${s}: the final has 14 questions`);
  check(["t2most", "t2share"].includes(f[12].kind) && ["t2copy", "t2addon"].includes(f[13].kind) && f[12].skill === "Meaning brain" && f[13].skill === "Meaning brain", `seed ${s}: final 13-14 are toy-v2 items`);
  f.slice(12).forEach(it => {
    checkItem(it, `final seed ${s}`);
    if (it.chat) check(D.final.sets.includes(it.chat), `final seed ${s}: uses final data only`);
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
  "middle without 100": ps => { const q = ps.filter(x => x !== 100).sort((a, b) => a - b); return q[Math.floor((q.length - 1) / 2)]; }
};
[["stage 8", OPTS_S], ["final", OPTS_F]].forEach(([nm, list]) => {
  Object.entries(STRATS).forEach(([sn, f]) => {
    const hit = list.filter(o => f(o.ps) === o.k).length / list.length;
    check(list.length > 50 && hit <= 0.4, `${nm} share items: guessing rule "${sn}" is right ${(100 * hit).toFixed(1)}% of the time (must be <= 40%, n=${list.length})`);
  });
});
/* ---------- 6. v2.1 game definition ---------- */
check(L.STAGES.length === 8 && L.STAGES[7].id === "meaning", "v2.1 items: 8 stages, the 8th is 'meaning'");

console.log(bad ? `${bad} of ${n} toy-v2 checks FAILED` : `All ${n} toy-v2 checks passed`);
process.exit(bad ? 1 : 0);
