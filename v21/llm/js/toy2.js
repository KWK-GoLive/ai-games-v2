/*
 * AI games v2.1 · stage 8 "Meaning brain" and final questions 13-14: items for toy model v2.
 * No DOM here (tests run it in Node). Keys come from v21/shared/model2.js (TOY2); tests/check-toy2.js
 * recomputes every key with its own separate implementation.
 */
(function (root) {
  "use strict";
  var T = root.TOY2, D = root.LLMA_TOY2_DATA, M = root.BTL.Model;
  function pick(a, rng) { return a[Math.floor(rng() * a.length)]; }
  function shuffle(a, rng) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ds(s) { return M.tokenize(s).map(T.dw).join(" "); }
  function cap(s) { s = ds(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function q(w) { return "“" + w + "”"; }
  function pctRound(x) { return Math.round(x); }
  var MARGIN = 2;          // "which chat gets the most say": the top chat beats the next by at least 2 points
  var MIN_GAP = 5;         // % options at least 5 apart

  function wordsLine(r) { return r.words.map(function (w) { return ds(w.word) + " " + w.points; }).join(", "); }
  function scoreLine(row) {
    return "Chat " + (row.index + 1) + " (" + cap(row.q) + "?) shares " + (row.shared.length ? row.shared.map(ds).join(", ") : "nothing") + " → " + row.score + " point" + (row.score === 1 ? "" : "s");
  }

  /* ---- 1. Which chat gets the most say? ---- */
  function mostItem(set, question, rng) {
    var r = T.analyse(set.qa, question), top = r.topChat;
    // wrong options: always the runner-up (the tempting near-miss); one chat whose question starts differently from
    // the runner-up's (so "the odd one out" is not a shortcut), preferring chats with points; and one more of the next chats
    var rest = r.rows.filter(function (x) { return x.index !== top.index; }).sort(function (a, b) { return b.score - a.score || a.index - b.index; });
    var first = function (x) { return T.tokenize(x.q)[0]; };
    var others = [rest[0]];
    var diff = shuffle(rest.slice(1).filter(function (x) { return first(x) !== first(rest[0]); }), rng).sort(function (a, b) { return (b.score > 0) - (a.score > 0); });
    if (diff.length) others.push(diff[0]);
    shuffle(rest.slice(1, 6), rng).forEach(function (x) { if (others.length < 3 && others.indexOf(x) < 0) others.push(x); });
    var opts = shuffle([top].concat(others), rng).map(function (x) { return { value: String(x.index), label: "Chat " + (x.index + 1) + ": “" + cap(x.q) + "?”" }; });
    var key = String(top.index);
    return { kind: "t2most", chat: set, question: question, limit: 90, key: key, analysis: r,
      title: "New question: “" + cap(question) + "?” Which chat gets the most say?",
      hint: "Give each word of the question its points: count how many chats' questions contain it (1 chat = 8, 2 = 4, 3–4 = 2, 5 or more = 1, every chat (or none) = 0). Then add up the points each chat shares.",
      options: opts,
      grade: function (a) {
        var lines = ["Word points: " + wordsLine(r) + "."];
        [top].concat(others).forEach(function (x) { lines.push(scoreLine(x)); });
        var mostShared = Math.max.apply(null, r.rows.map(function (x) { return x.shared.length; }));
        lines.push("Chat " + (top.index + 1) + " has the most points, so its answer “" + ds(top.a) + "” gets the biggest share." + (top.shared.length < mostShared
          ? " Another chat shares more words, but they are common ones: a rare word counts more." : " It shares the most words, and they are worth the most points."));
        return { frac: String(a) === key ? 1 : 0, explain: lines };
      },
      sample: function (rr) { return pick(opts, rr).value; } };
  }

  /* ---- 2. Share of an answer (%) ---- */
  // 4 options: the key and 3 wrong ones. The tempting "forgot to divide" mistakes (points x 2, points x 3) are always
  // offered when they fit; the rest are drawn from the same spread of values the real keys have (all answer % in the
  // pools), so the key does not stand out by size. All at least 5 apart. tests/check-toy2.js checks many guessing rules.
  var KEY_SPREAD = null, ANCHORS = [20, 25, 30, 33, 40, 50, 60, 66, 70, 75];
  function keySpread() {
    if (KEY_SPREAD) return KEY_SPREAD;
    KEY_SPREAD = [];
    D.sets.concat(D.final.sets).forEach(function (s) { s.ask.forEach(function (qn) { T.analyse(s.qa, qn).answers.forEach(function (a) { var p = pctRound(a.pct); if (p >= 5 && p <= 95) KEY_SPREAD.push(p); }); }); });
    return KEY_SPREAD;
  }
  function shareOptions(r, ans, rng) {
    var right = pctRound(ans.pct), sc = ans.score, spread = keySpread();
    var maxOpt = r.answers.length >= 2 ? 94 : 100;   // with 2+ answers sharing, 95-100% would look silly
    function ok(c, out) { return c >= 1 && c <= maxOpt && out.every(function (o) { return Math.abs(o - c) >= MIN_GAP; }); }
    for (var attempt = 0; attempt < 300; attempt++) {
      var nBelow = Math.floor(rng() * 4), out = [right], below = 0, above = 0;
      // the tempting mistakes first (each only if its side still has room)
      shuffle([2 * sc, 3 * sc], rng).forEach(function (c) {
        if (rng() < 0.75 && ok(c, out) && (c < right ? below < nBelow : above < 3 - nBelow)) { out.push(c); if (c < right) below++; else above++; }
      });
      var lowS = spread.filter(function (v) { return v < right - 2; }), highS = spread.filter(function (v) { return v > right + 2; });
      for (var tries = 0; tries < 300 && (below < nBelow || above < 3 - nBelow); tries++) {
        var wantLow = below < nBelow, list = wantLow ? lowS : highS;
        var c = list.length ? list[Math.floor(rng() * list.length)] + Math.floor(rng() * 5) - 2 : (wantLow ? right - 5 - Math.floor(rng() * 20) : right + 5 + Math.floor(rng() * 20));
        if ((wantLow ? c < right : c > right) && ok(c, out)) { out.push(c); if (wantLow) below++; else above++; }
      }
      // avoid "the option nearest a round number (25, 33, 40, 50 ...)" being the key, when a wrong option could be nearer
      var giveaway = rng() < 0.9 && ANCHORS.some(function (A) {
        var d = Math.abs(right - A); return d >= 3 && out.every(function (o) { return o === right || Math.abs(o - A) > d; });
      });
      if (out.length === 4 && (!giveaway || attempt > 200)) return shuffle(out, rng).map(function (p) { return { value: String(p), label: p + "%" }; });
    }
    throw new Error("shareOptions: no options for " + right);
  }
  // an answer is fair to ask about if its % is at least 10 and not (by chance) within 4 of its points, x 2 or x 3
  function fairAns(a) { if (!a || a.pct < 10) return false; var p = pctRound(a.pct); return [a.score, 2 * a.score, 3 * a.score].every(function (v) { return Math.abs(v - p) > 4; }); }
  function shareItem(set, question, rng, which) {
    var r = T.analyse(set.qa, question);
    var ans = which === "second" && fairAns(r.answers[1]) ? r.answers[1] : fairAns(r.answers[0]) ? r.answers[0] : r.answers[1];
    var opts = shareOptions(r, ans, rng), key = String(pctRound(ans.pct));
    return { kind: "t2share", chat: set, question: question, limit: 90, key: key, analysis: r, answer: ans.answer, showPoints: true,
      title: "New question: “" + cap(question) + "?” What % chance does the answer “" + ds(ans.answer) + "” get?",
      hint: "Add up all the chats' points to get the total. The answer's % = its chats' points ÷ the total, × 100. The options are at least 5 apart, so a close estimate is enough.",
      options: opts,
      grade: function (a) {
        var lines = ["Word points: " + wordsLine(r) + "."];
        r.rows.filter(function (x) { return x.score > 0; }).forEach(function (x) { lines.push(scoreLine(x)); });
        lines.push("All points: " + r.total + ". “" + ds(ans.answer) + "” gets " + ans.score + " ÷ " + r.total + " = " + key + "% (rounded).");
        lines.push(r.answers[0] === ans ? "It's the biggest share, so at temperature 0 the model writes it. But it is blended: a spin could still give another answer."
          : "It isn't the top answer, but it still has a real chance: the answer is blended from several chats, not copied from one.");
        return { frac: String(a) === key ? 1 : 0, explain: lines };
      },
      sample: function (rr) { return pick(opts, rr).value; } };
  }

  /* ---- 3. Copy from the prompt ---- */
  function copyItem(c, rng) {
    var w = T.tokenize(c.prompt), hit = T.copyNext(w), key = hit.word, last = w[w.length - 1];
    var opts = shuffle(c.options, rng).map(function (x) { return { value: x, label: T.dw(x) }; });
    return { kind: "t2copy", prompt: c.prompt, limit: 40, key: key,
      title: "The prompt ends with “" + T.dw(last) + "”. What does toy v2 write next?",
      hint: "Look earlier in the prompt: where did “" + T.dw(last) + "” appear before, and what came right after it?",
      options: opts,
      grade: function (a) {
        return { frac: a === key ? 1 : 0, explain: [
          "Earlier in the prompt: “" + T.dw(last) + " " + T.dw(key) + "”. Now the prompt ends with “" + T.dw(last) + "” again, so the model copies “" + T.dw(key) + "”.",
          "Real models tend to do this too (researchers call the parts that do it induction heads): they are more likely to copy a pattern that is already in the prompt."] };
      },
      sample: function (rr) { return pick(opts, rr).value; } };
  }

  /* ---- 4. Needs an add-on? ---- */
  var ADDON_OPTS = [{ value: "plain", label: "A plain model can do it (training text or the prompt is enough)" }, { value: "tool", label: "It needs a lookup add-on (a tool that looks it up: files, web, email\u2026)" }];
  function addonItem(x) {
    var key = x.needs ? "tool" : "plain";
    return { kind: "t2addon", request: x.text, limit: 35, key: key,
      title: "Someone asks a chatbot: “" + x.text + "”",
      hint: "Is the information in the prompt or common knowledge? Or is it new, live or private?",
      options: ADDON_OPTS.slice(),
      grade: function (a) { return { frac: a === key ? 1 : 0, explain: [x.why, "A plain model knows only patterns from its training text plus the prompt. Looking things up is an add-on (Part 2: Be the Agent)."] }; },
      sample: function (rr) { return pick(ADDON_OPTS, rr).value; } };
  }

  /* pools that pass the clarity checks */
  function mostPool(sets) {
    var out = [];
    sets.forEach(function (s) { s.ask.forEach(function (qn) {
      var r = T.analyse(s.qa, qn);
      if (r.topChat.score - r.second.score < MARGIN) return;
      var most = Math.max.apply(null, r.rows.map(function (x) { return x.shared.length; }));
      out.push({ set: s, q: qn, rare: r.topChat.shared.length < most });   // rare: a chat sharing MORE (common) words loses
    }); });
    return out;
  }
  function sharePool(sets) {
    var out = [];
    sets.forEach(function (s) { s.ask.forEach(function (qn) {
      var r = T.analyse(s.qa, qn);
      if (r.answers.length < 2 || r.answers[0].score === r.answers[1].score) return;
      if (r.answers[0].pct >= 99.5) return;
      if (!fairAns(r.answers[0]) && !fairAns(r.answers[1])) return;
      out.push({ set: s, q: qn });
    }); });
    return out;
  }

  // about 2 in 3 "which chat" questions are ones where a rare word beats a chat sharing more words (the lesson's point)
  var RARE_SHARE = 0.65;
  function pickMost(pool, rng) {
    var rare = pool.filter(function (x) { return x.rare; }), other = pool.filter(function (x) { return !x.rare; });
    return rare.length && (rng() < RARE_SHARE || !other.length) ? pick(rare, rng) : pick(other, rng);
  }
  // the chat order is shuffled for every question, so "pick the highest-numbered chat" is no shortcut
  // (ties are excluded by MARGIN and the share filter, so the order never changes a key)
  function reorder(set, rng) { return { id: set.id, name: set.name, qa: shuffle(set.qa, rng), ask: set.ask }; }
  function stage8(rng) {
    var m = pickMost(mostPool(D.sets), rng);
    var sp = sharePool(D.sets).filter(function (x) { return x.set !== m.set || x.q !== m.q; }), s = pick(sp, rng);
    return shuffle([
      mostItem(reorder(m.set, rng), m.q, rng),
      shareItem(reorder(s.set, rng), s.q, rng, rng() < 0.5 ? "top" : "second"),
      copyItem(pick(D.copy, rng), rng),
      addonItem(pick(D.addon, rng))
    ], rng).sort(function (a, b) { return ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind); });
  }
  var ORDER = ["t2most", "t2share", "t2copy", "t2addon"];

  /* final questions 13-14 */
  function final2(rng) {
    var F = D.final, first, second;
    if (rng() < 0.5) { var m = pickMost(mostPool(F.sets), rng); first = mostItem(reorder(m.set, rng), m.q, rng); }
    else { var s = pick(sharePool(F.sets), rng); first = shareItem(reorder(s.set, rng), s.q, rng, rng() < 0.5 ? "top" : "second"); }
    second = rng() < 0.5 ? copyItem(pick(F.copy, rng), rng) : addonItem(pick(F.addon, rng));
    return [first, second];
  }

  var api = { stage8: stage8, final2: final2, mostItem: mostItem, shareItem: shareItem, copyItem: copyItem, addonItem: addonItem,
    mostPool: mostPool, sharePool: sharePool, pickMost: pickMost, RARE_SHARE: RARE_SHARE, fairAns: fairAns, ADDON_OPTS: ADDON_OPTS, MARGIN: MARGIN, MIN_GAP: MIN_GAP };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LLMA_TOY2 = api;
})(typeof window !== "undefined" ? window : globalThis);
