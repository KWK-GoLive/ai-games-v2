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
  function ds(s) { return M.tokenize(s).map(M.displayWord).join(" "); }
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
    // wrong options: always the runner-up (the tempting near-miss), plus 2 of the next 4 chats
    var rest = r.rows.filter(function (x) { return x.index !== top.index; }).sort(function (a, b) { return b.score - a.score || a.index - b.index; });
    var others = [rest[0]].concat(shuffle(rest.slice(1, 5), rng).slice(0, 2));
    var opts = shuffle([top].concat(others), rng).map(function (x) { return { value: String(x.index), label: "Chat " + (x.index + 1) + ": “" + cap(x.q) + "?”" }; });
    var key = String(top.index);
    return { kind: "t2most", chat: set, question: question, limit: 90, key: key, analysis: r,
      title: "New question: “" + cap(question) + "?” Which chat gets the most say?",
      hint: "Give each word of the question its points: count how many chats' questions contain it (1 chat = 8, 2 = 4, 3–4 = 2, 5 or more = 1, every chat (or none) = 0). Then add up the points each chat shares.",
      options: opts,
      grade: function (a) {
        var lines = ["Word points: " + wordsLine(r) + "."];
        [top].concat(others).forEach(function (x) { lines.push(scoreLine(x)); });
        lines.push("Chat " + (top.index + 1) + " has the most points, so its answer “" + ds(top.a) + "” gets the biggest share. Rare words count more than common ones like “the”.");
        return { frac: String(a) === key ? 1 : 0, explain: lines };
      },
      sample: function (rr) { return pick(opts, rr).value; } };
  }

  /* ---- 2. Share of an answer (%) ---- */
  // 4 options: the key and 3 wrong ones. Built so that no simple guessing rule works: how many wrong options sit
  // above the key is random (0-3), 100% ("copied one chat") appears only sometimes, and when the key is not near 50%
  // at least one wrong option is closer to 50% than the key (so "pick the one nearest the middle" fails too).
  function shareOptions(r, ans, rng) {
    var right = pctRound(ans.pct);
    function ok(c, out) { return c > 0 && c <= 100 && c !== right && out.every(function (o) { return Math.abs(o - c) >= MIN_GAP; }); }
    var others = r.answers.filter(function (x) { return x !== ans; }).map(function (x) { return pctRound(x.pct); });
    var steps = [6, 8, 10, 12, 15, 18, 20, 25, 30];
    function build() {
      var nAbove = Math.floor(rng() * 4), out = [right];
      var above = shuffle(others.filter(function (c) { return c > right; }).concat(steps.map(function (d) { return right + d; })), rng);
      var below = shuffle(others.filter(function (c) { return c < right; }).concat(steps.map(function (d) { return right - d; })), rng);
      if (rng() < 0.4) above.unshift(100);
      function take(list, n) { for (var i = 0; i < list.length && n > 0; i++) if (ok(list[i], out)) { out.push(list[i]); n--; } return n; }
      var left = take(above, nAbove); left = take(below, 3 - nAbove + left); if (left) take(above, left);
      return out;
    }
    function fair(out) {
      if (out.length !== 4) return false;
      if (Math.abs(right - 50) >= 6 && !out.some(function (c) { return c !== right && Math.abs(c - 50) < Math.abs(right - 50); })) return false;
      return true;
    }
    var out = build();
    for (var tries = 0; tries < 60 && !fair(out); tries++) out = build();
    return shuffle(out, rng).map(function (p) { return { value: String(p), label: p + "%" }; });
  }
  function shareItem(set, question, rng, which) {
    var r = T.analyse(set.qa, question);
    var ans = which === "second" && r.answers[1] && r.answers[1].pct >= 10 ? r.answers[1] : r.answers[0]; // never ask about a tiny share (< 10%)
    var opts = shareOptions(r, ans, rng), key = String(pctRound(ans.pct));
    return { kind: "t2share", chat: set, question: question, limit: 90, key: key, analysis: r, answer: ans.answer, showPoints: true,
      title: "New question: “" + cap(question) + "?” What % chance does the answer “" + ds(ans.answer) + "” get?",
      hint: "Add up all the chats' points to get the total. The answer's % = its chats' points ÷ the total, × 100.",
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
    var opts = shuffle(c.options, rng).map(function (x) { return { value: x, label: M.displayWord(x) }; });
    return { kind: "t2copy", prompt: c.prompt, limit: 40, key: key,
      title: "The prompt ends with “" + M.displayWord(last) + "”. What does toy v2 write next?",
      hint: "Look earlier in the prompt: where did “" + M.displayWord(last) + "” appear before, and what came right after it?",
      options: opts,
      grade: function (a) {
        return { frac: a === key ? 1 : 0, explain: [
          "Earlier in the prompt: “" + M.displayWord(last) + " " + M.displayWord(key) + "”. Now the prompt ends with “" + M.displayWord(last) + "” again, so the model copies “" + M.displayWord(key) + "”.",
          "Real models do this too (researchers call the parts that do it induction heads): they copy patterns from the prompt."] };
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
    sets.forEach(function (s) { s.ask.forEach(function (qn) { var r = T.analyse(s.qa, qn); if (r.topChat.score - r.second.score >= MARGIN) out.push({ set: s, q: qn }); }); });
    return out;
  }
  function sharePool(sets) {
    var out = [];
    sets.forEach(function (s) { s.ask.forEach(function (qn) {
      var r = T.analyse(s.qa, qn);
      if (r.answers.length < 2 || r.answers[0].score === r.answers[1].score) return;
      if (r.answers[0].pct >= 99.5) return;
      out.push({ set: s, q: qn });
    }); });
    return out;
  }

  function stage8(rng) {
    var mp = mostPool(D.sets), m = pick(mp, rng);
    var sp = sharePool(D.sets).filter(function (x) { return x.set !== m.set || x.q !== m.q; }), s = pick(sp, rng);
    return shuffle([
      mostItem(m.set, m.q, rng),
      shareItem(s.set, s.q, rng, rng() < 0.5 ? "top" : "second"),
      copyItem(pick(D.copy, rng), rng),
      addonItem(pick(D.addon, rng))
    ], rng).sort(function (a, b) { return ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind); });
  }
  var ORDER = ["t2most", "t2share", "t2copy", "t2addon"];

  /* final questions 13-14 */
  function final2(rng) {
    var F = D.final, first, second;
    if (rng() < 0.5) { var m = pick(mostPool(F.sets), rng); first = mostItem(m.set, m.q, rng); }
    else { var s = pick(sharePool(F.sets), rng); first = shareItem(s.set, s.q, rng, rng() < 0.5 ? "top" : "second"); }
    second = rng() < 0.5 ? copyItem(pick(F.copy, rng), rng) : addonItem(pick(F.addon, rng));
    return [first, second];
  }

  var api = { stage8: stage8, final2: final2, mostItem: mostItem, shareItem: shareItem, copyItem: copyItem, addonItem: addonItem,
    mostPool: mostPool, sharePool: sharePool, ADDON_OPTS: ADDON_OPTS, MARGIN: MARGIN, MIN_GAP: MIN_GAP };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LLMA_TOY2 = api;
})(typeof window !== "undefined" ? window : globalThis);
