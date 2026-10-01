/*
 * AI games v2.1 · Toy model v2 ("closer to a real LLM"): a see-through cartoon of how a model can weigh some
 * words more than others. NOT how a real model works: a real model keeps no chats and uses no points table (its
 * attention works on the words in the prompt, with learned weights). Giving rarer words more weight is our own
 * whole-number teaching rule, in the spirit of search engines' word weighting. Rules (all whole numbers):
 *  1. Word points, counted from the chats' questions: a word in 1 chat = 8, 2 chats = 4, 3-4 chats = 2,
 *     5 or more = 1, every chat = 0 (twice as rare = twice the points).
 *  2. Chat score = the points of the words its question shares with the new question (each word once).
 *  3. Blended answer: chat share = its score / all scores; an answer's % = the shares of the chats that give it.
 *     Temperature 0 writes the answer with the biggest %, a tie goes to the chat higher up the list.
 *  4. Copy from the prompt: if the last word already appeared earlier in the prompt, write the word that came
 *     right after it (the most recent earlier time).
 */
(function (root) {
  "use strict";
  var tokenize = (root.BTL && root.BTL.Model && root.BTL.Model.tokenize) || function (s) {
    return String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
  };
  function uniq(a) { var s = {}, o = []; a.forEach(function (x) { if (!s[x]) { s[x] = 1; o.push(x); } }); return o; }
  function chatsWith(chats, w) { return chats.filter(function (c) { return uniq(tokenize(c[0])).indexOf(w) >= 0; }).length; }
  function pointsFor(n, total) { if (n === 0 || n === total) return 0; return n === 1 ? 8 : n === 2 ? 4 : n <= 4 ? 2 : 1; }
  function wordPoints(chats, w) { var n = chatsWith(chats, w); return { word: w, chats: n, points: pointsFor(n, chats.length) }; }
  function analyse(chats, question) {
    var qw = uniq(tokenize(question));
    var pts = {}; qw.forEach(function (w) { pts[w] = wordPoints(chats, w); });
    var rows = chats.map(function (c, i) {
      var cw = uniq(tokenize(c[0]));
      var shared = qw.filter(function (w) { return cw.indexOf(w) >= 0; });
      var score = shared.reduce(function (s, w) { return s + pts[w].points; }, 0);
      return { index: i, q: c[0], a: c[1], shared: shared, score: score };
    });
    var total = rows.reduce(function (s, r) { return s + r.score; }, 0);
    var answers = [];
    rows.forEach(function (r) {
      if (!r.score) return;
      var e = answers.filter(function (x) { return x.answer === r.a; })[0];
      if (!e) { e = { answer: r.a, score: 0, first: r.index }; answers.push(e); }
      e.score += r.score;
    });
    answers.forEach(function (e) { e.pct = total ? (100 * e.score) / total : 0; });
    var ranked = answers.slice().sort(function (x, y) { return y.score - x.score || x.first - y.first; });
    var byScore = rows.slice().sort(function (x, y) { return y.score - x.score || x.index - y.index; });
    return { words: qw.map(function (w) { return pts[w]; }), rows: rows, total: total, answers: ranked, top: ranked[0] || null, topChat: byScore[0], second: byScore[1] };
  }
  function copyNext(promptWords) {
    var last = promptWords[promptWords.length - 1];
    for (var i = promptWords.length - 2; i >= 0; i--) if (promptWords[i] === last && i + 1 < promptWords.length - 1) return { at: i, word: promptWords[i + 1] };
    return null;
  }
  // v2.1 only: capitalise the made-up names in the toy-v2 chats and prompts (shared/model.js stays as in v2.0)
  var NAMES = { mrs: "Mrs", kim: "Kim", dan: "Dan", coach: "Coach", mint: "Mint", uncle: "Uncle", tam: "Tam", korn: "Korn",
    sir: "Sir", fluffy: "Fluffy", captain: "Captain", biscuit: "Biscuit", zibo: "Zibo", max: "Max", joe: "Joe", french: "French", b: "B" };
  if (root.BTL && root.BTL.Model && !root.BTL.Model.toy2Names) {
    var base = root.BTL.Model.displayWord;
    root.BTL.Model.displayWord = function (w) { return NAMES[w] || base(w); };
    root.BTL.Model.toy2Names = true;
  }
  var api = { tokenize: tokenize, pointsFor: pointsFor, wordPoints: wordPoints, analyse: analyse, copyNext: copyNext,
    TABLE: [["in 1 chat", 8], ["in 2 chats", 4], ["in 3–4 chats", 2], ["in 5 or more", 1], ["in every chat", 0]] };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TOY2 = api;
})(typeof window !== "undefined" ? window : globalThis);
