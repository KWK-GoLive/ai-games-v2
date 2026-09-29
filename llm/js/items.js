/*
 * AI games v2 · LLM Arena — the items of the 7 stages and of the final Be the LLM Arena.
 * Every answer key is computed by the real toy model (../../shared/model.js), never typed in by hand.
 * No DOM here, so tests can run it in Node.
 *
 * An item: { kind, title, limit, hint, key, grade(answer) -> {frac, explain}, sample(rng) -> a random answer, ...data for drawing }
 */
(function (root) {
  "use strict";
  var M = (root.BTL && root.BTL.Model) || require("../../shared/model.js");
  var END = M.END;

  function shuffle(a, rng) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a, rng) { return a[Math.floor(rng() * a.length)]; }
  function uniq(a) { var seen = {}; return a.filter(function (x) { var k = String(x); if (seen[k]) return false; seen[k] = 1; return true; }); }
  function dw(w) { return M.displayWord(w); }
  function ds(str) { return M.tokenize(str).map(M.displayWord).join(" "); }
  function q(w) { return "\u201c" + dw(w) + "\u201d"; }
  function qs(ws) { return "\u201c" + ws.map(dw).join(" ") + "\u201d"; }
  function countsText(dist) { return dist.map(function (d) { return dw(d.word) + " " + d.count; }).join(", "); }

  var cache = {};
  function modelFor(world) {
    if (!cache[world.id]) cache[world.id] = M.Model.train(world.text, 3);
    return cache[world.id];
  }
  function vocabOf(world) {
    var v = [];
    world.text.forEach(function (s) { M.tokenize(s).forEach(function (w) { if (v.indexOf(w) < 0) v.push(w); }); });
    return v;
  }
  // Ties: the follower that turned up first AFTER those words (reading the text from the top) wins.
  function tieNote(dist, ctx) {
    return dist.length > 1 && dist[0].count === dist[1].count
      ? " (a tie: reading from the top, " + q(dist[0].word) + " is the first of them to come right after " + qs(ctx) + ", so it wins)" : "";
  }

  /* ================= Stage 1: Count it ================= */
  function stage1(D, rng) {
    var world = pick(D.worlds, rng), m = modelFor(world), vocab = vocabOf(world);
    var ctxs = vocab.map(function (w) { return { w: w, dist: m.next([w], 1) }; }).filter(function (c) { return c.dist.length >= 2; });
    var counts = {};
    world.text.forEach(function (s) { M.tokenize(s).forEach(function (w) { counts[w] = (counts[w] || 0) + 1; }); });
    var byFreq = vocab.slice().sort(function (a, b) { return counts[b] - counts[a]; });
    var items = [];
    var used = {};
    function takeCtx(filter) {
      var pool = shuffle(ctxs.filter(function (c) { return !used[c.w] && filter(c); }), rng);
      if (!pool.length) pool = shuffle(ctxs.filter(filter), rng);
      var c = pool[0]; used[c.w] = 1; return c;
    }
    function hintFor(c) { return "Find every " + q(c.w) + " in the text and look at the word right after it. At the end of a line, the next word is [end]."; }
    // two "top word" items (no tie at the top, so there is one clear answer)
    for (var i = 0; i < 2; i++) (function () {
      var clear = ctxs.filter(function (c) { return !used[c.w] && c.dist[0].count > c.dist[1].count; }).length;
      var c = takeCtx(function (c) { return clear ? c.dist[0].count > c.dist[1].count : true; });
      var trap = byFreq.filter(function (w) { return w !== c.w && !c.dist.some(function (d) { return d.word === w; }); })[0];
      var opts = uniq(c.dist.slice(0, 3).map(function (d) { return d.word; }).concat([trap]));
      items.push({
        kind: "mcq", world: world, ctx: c.w, title: "Which word does the model pick after " + q(c.w) + " at temperature 0?", limit: 45,
        hint: hintFor(c), key: c.dist[0].word,
        options: shuffle(opts, rng).map(function (w) { return { value: w, label: dw(w) }; }),
        grade: function (a) { return { frac: a === c.dist[0].word ? 1 : 0, explain: "After " + q(c.w) + " the text has: " + countsText(c.dist) + ". Temperature 0 always takes the top count: " + q(c.dist[0].word) + tieNote(c.dist, [c.w]) + "." + (trap && a === trap ? " " + q(trap) + " is common in the text, but it never comes right after " + q(c.w) + "." : "") }; },
        sample: function (r) { return pick(opts, r); }
      });
    })();
    // two "what %" items
    for (var j = 0; j < 2; j++) (function () {
      var c = takeCtx(function () { return true; });
      var total = c.dist.reduce(function (a, d) { return a + d.count; }, 0);
      var d = pick(c.dist, rng);
      var pct = function (n) { return Math.round(100 * n / total); };
      var key = pct(d.count);
      var cand = uniq([key].concat(c.dist.map(function (x) { return pct(x.count); }), [Math.round(100 / c.dist.length), 100 - key, Math.round(100 * d.count / (total + 1)), 50, 25, 75, 10]))
        .filter(function (v) { return v > 0 && v <= 100; });
      var opts = [key].concat(shuffle(cand.slice(1), rng).slice(0, 3));
      items.push({
        kind: "mcq", world: world, ctx: c.w, target: d.word, title: "After " + q(c.w) + ", what % of the time does " + q(d.word) + " come next?", limit: 45,
        hint: hintFor(c), key: key,
        options: shuffle(opts, rng).map(function (v) { return { value: v, label: v + "%" }; }),
        grade: function (a) { return { frac: Number(a) === key ? 1 : 0, explain: "After " + q(c.w) + ": " + countsText(c.dist) + ". That's " + total + " in all, so " + q(d.word) + " = " + d.count + " \u00f7 " + total + " = " + key + "%." }; },
        sample: function (r) { return pick(opts, r); }
      });
    })();
    // one "how many" item
    (function () {
      var c = takeCtx(function (c) { return c.dist[0].count >= 2; });
      var d = c.dist.filter(function (x) { return x.count >= 2; });
      d = pick(d, rng);
      items.push({
        kind: "number", world: world, ctx: c.w, target: d.word, title: "How many times does " + q(d.word) + " come right after " + q(c.w) + "?", limit: 45,
        hint: hintFor(c), key: d.count,
        grade: function (a) { var n = parseInt(String(a).trim(), 10); return { frac: n === d.count ? 1 : 0, explain: "After " + q(c.w) + ": " + countsText(c.dist) + ". So " + q(d.word) + " comes next " + d.count + " times. This count table is all the model learns." }; },
        sample: function (r) { return String(1 + Math.floor(r() * 4)); }
      });
    })();
    return shuffle(items, rng);
  }

  /* ============ Stages 2 and 6: write exactly what the model writes ============ */
  var MAX_NEW = 8;
  function trailExplain(trail, k) {
    return trail.map(function (t) {
      var seen = t.seen.map(dw).join(" ");
      var note = k === 2 && t.used === 1 ? " (never saw these two words together, so it used only the last word)" : "";
      return "Sees \u201c" + seen + "\u201d" + note + " \u2192 " + countsText(t.raw.slice(0, 4)) + (t.raw.length > 4 ? ", \u2026" : "") + " \u2192 writes " + q(t.word) + tieNote(t.raw, t.seen.filter(function (w) { return w !== M.START; }));
    });
  }
  function writerItem(world, m, seed, k, limit, rng) {
    var r = m.generateTrail(seed, k, 0, MAX_NEW, rng);
    var key = r.trail.map(function (t) { return t.word; });
    var tiles = vocabOf(world).slice().sort().concat([END]).map(function (w) { return { value: w, label: dw(w) }; });
    return {
      kind: "tiles", world: world, seed: seed, k: k, limit: limit, key: key, tiles: tiles, max: MAX_NEW,
      title: "Continue " + qs(seed) + " exactly as the model would.",
      hint: k === 1 ? "Look up the word you just wrote: which word follows it most often in the text?"
        : "Look up the last TWO words together. If that pair never appears in the text, look up only the last word.",
      grade: function (a) {
        a = a || [];
        var n = 0; while (n < a.length && n < key.length && a[n] === key[n]) n++;
        var frac = Math.round(100 * n / Math.max(key.length, a.length)) / 100;
        var loop = key.length === MAX_NEW && key[key.length - 1] !== END;
        return { frac: frac, explain: ["The model writes: " + qs(seed.concat(key)) + (loop ? " \u2026 and it would go round in this loop forever, so it stops at " + MAX_NEW + " words." : ".") +
          " You matched the first " + n + " of " + key.length + " words."].concat(trailExplain(r.trail, k)) };
      },
      sample: function (rr) { var out = []; var n = 1 + Math.floor(rr() * 6); for (var i = 0; i < n; i++) out.push(pick(tiles, rr).value); return out; }
    };
  }
  function stage2(D, rng) {
    var world = pick(D.worlds, rng), m = modelFor(world);
    var seeds = vocabOf(world).filter(function (w) { return m.generateTrail([w], 1, 0, MAX_NEW).trail.length >= 3; });
    var longer = seeds.filter(function (w) { return m.generateTrail([w], 1, 0, MAX_NEW).trail.length >= 4; });
    if (longer.length >= 3) seeds = longer;
    return shuffle(seeds, rng).slice(0, 3).map(function (w) { return writerItem(world, m, [w], 1, 75, rng); });
  }
  function stage6(D, rng) {
    var world = pick(D.worlds, rng), m = modelFor(world), vocab = vocabOf(world);
    var novel = [], differs = [];
    // A new pair must still read naturally: "a robot" (the text has "the robot"), "they eat" (the text has "we eat"),
    // never "the eat". So: some other word x of the same kind as a (both determiners like the/a/our, or both not)
    // comes right before b in the text, and a is a determiner or starts a sentence.
    var DET = ["the", "a", "an", "my", "our", "their", "his", "her", "your", "its"];
    function isDet(w) { return DET.indexOf(w) >= 0; }
    var starts = {}, seconds = {};
    world.text.forEach(function (s) { var t = M.tokenize(s); starts[t[0]] = 1; if (t[1]) (seconds[t[1]] = seconds[t[1]] || []).push(t[0]); });
    var before = {};
    world.text.forEach(function (s) { var t = M.tokenize(s); for (var i = 1; i < t.length; i++) (before[t[i]] = before[t[i]] || []).push(t[i - 1]); });
    function natural(a, b) {
      if ((a === "a" || a === "an") && /s$/.test(b)) return false; // not "a fans"
      return (starts[a] || isDet(a)) && (before[b] || []).some(function (x) { return x !== a && isDet(x) === isDet(a) && (isDet(x) || starts[x]); });
    }
    vocab.forEach(function (a) {
      vocab.forEach(function (b) {
        if (a === b) return;
        var seed = [a, b];
        var r2 = m.generateTrail(seed, 2, 0, MAX_NEW);
        if (r2.trail.length < 3) return;
        var r1 = m.generateTrail(seed, 1, 0, MAX_NEW);
        var diff = r1.words.join(" ") !== r2.words.join(" ");
        if (r2.trail[0].used === 1 && natural(a, b)) novel.push(seed); // a new pair: the item tests backing off
        else if (r2.trail[0].used === 2 && diff) differs.push(seed);
      });
    });
    function len(seed) { return m.generateTrail(seed, 2, 0, MAX_NEW).trail.length; }
    var longDiff = differs.filter(function (sd) { return len(sd) >= 4; });
    if (longDiff.length >= 2) differs = longDiff;
    var chosen = shuffle(novel, rng).slice(0, 1).concat(shuffle(differs, rng).slice(0, novel.length ? 2 : 3));
    if (chosen.length < 3) {
      var more = [];
      vocab.forEach(function (a) { vocab.forEach(function (b) { if (a !== b && m.next([a, b], 2).length && m.generateTrail([a, b], 2, 0, MAX_NEW).trail.length >= 3) more.push([a, b]); }); });
      chosen = chosen.concat(shuffle(more, rng)).slice(0, 3);
    }
    return shuffle(chosen, rng).map(function (seed) { return writerItem(world, m, seed, 2, 90, rng); });
  }

  /* ================= Stage 3: Temperature =================
   * Two kinds of item (v2): "predict" (which stacked bar is which temperature, what temperature 0 allows,
   * which way a word's share moves) and "spin" (read where the pointer landed on the stacked bar).
   * All the % come from the model's real rule: p ~ count^(1/T) (M.applyTemperature). */
  function diceTable(D, rng) {
    var counts = pick(D.diceCounts, rng);
    var cx = pick(D.diceContexts, rng);
    var words = shuffle(cx.words, rng).slice(0, counts.length);
    var dist = counts.map(function (c, i) { return { word: words[i], count: c }; });
    return { ctx: cx.ctx, dist: dist };
  }
  // The shares at temperature T, in % that add up to exactly 100 (largest-remainder rounding).
  function sharesAt(dist, T) {
    var d = M.applyTemperature(dist, T);
    var raw = d.map(function (x) { return Math.round(1e6 * 100 * x.p) / 1e6; }); // (rounded first, so float noise never decides a tie)
    var fl = raw.map(Math.floor), left = 100 - fl.reduce(function (a, b) { return a + b; }, 0);
    raw.map(function (v, i) { return { i: i, r: v - fl[i] }; }).sort(function (a, b) { return b.r - a.r || a.i - b.i; })
      .slice(0, left).forEach(function (x) { fl[x.i]++; });
    return d.map(function (x, i) { return { word: x.word, count: x.count, p: x.p, pct: fl[i] }; });
  }
  function predictItem(kind, table, rng, T) {
    var it = predictItem0(kind, table, rng, T); it.pkind = kind; return it;
  }
  function predictItem0(kind, table, rng, T) {
    var dist = table.dist;
    var pctAt = function (T, w) { return sharesAt(dist, T).filter(function (x) { return x.word === w; })[0].pct; };
    var all = function (T) { return sharesAt(dist, T).map(function (d) { return dw(d.word) + " " + d.pct + "%"; }).join(", "); };
    if (kind === "chart") {
      var opts = shuffle([0.5, 1, 2], rng).map(function (t, i) { return { value: String(t), letter: "ABC"[i], label: "Bar " + "ABC"[i], shares: sharesAt(dist, t) }; });
      return { kind: "mcq", dice: table, limit: 50, key: String(T), stacks: true,
        title: "Which bar shows temperature " + T + "?",
        hint: T === 2 ? "A high temperature flattens the chances: the parts of the bar become more even." : "A low temperature sharpens the chances: the top word's part grows, the others shrink.",
        options: opts,
        grade: function (a) { return { frac: String(a) === String(T) ? 1 : 0, explain: "Temperature " + T + ": " + all(T) + ". Temperature 1 is the plain counts: " + all(1) + ". Low temperature sharpens (the top word grows); high temperature flattens (the parts even out)." }; },
        sample: function (r) { return pick(opts, r).value; } };
    }
    if (kind === "zero") {
      var o = [
        { value: "top", label: "Only " + q(dist[0].word) },
        { value: "two", label: dist.length > 2 ? q(dist[0].word) + " and " + q(dist[1].word) : "Both, but " + q(dist[0].word) + " more often" },
        { value: "all", label: "Any of them, wherever the pointer lands" },
        { value: "none", label: "None: it needs a higher temperature" }];
      return { kind: "mcq", dice: table, limit: 40, key: "top",
        title: "At temperature 0, which words can the model ever write here?",
        hint: "Temperature 0 means: no spin. What does the model do when it doesn't spin?",
        options: shuffle(o, rng),
        grade: function (a) { return { frac: a === "top" ? 1 : 0, explain: "Temperature 0 means no spin: the top word gets 100% every time, so only " + q(dist[0].word) + " can ever appear. The others can only show up at a temperature above 0." }; },
        sample: function (r) { return pick(o, r).value; } };
    }
    // "up" / "down": which way does one word's share move?
    var up = kind === "up";
    var w2 = up ? (rng() < 0.5 ? dist[0].word : dist[dist.length - 1].word) : dist[0].word; // top or bottom word only: the taught rule decides it
    var to = up ? 2 : 0.5, p1 = pctAt(1, w2), p2 = pctAt(to, w2);
    var dirKey = p2 > p1 ? "more" : p2 < p1 ? "less" : "same";
    var o2 = [{ value: "more", label: "Its part of the bar grows" }, { value: "less", label: "Its part of the bar shrinks" }, { value: "same", label: "No change" }, { value: "zero", label: "It can no longer appear" }];
    return { kind: "mcq", dice: table, limit: 45, key: dirKey, word: w2, to: to,
      title: "You turn the temperature " + (up ? "up" : "down") + " from 1 to " + to + ". What happens to " + q(w2) + (up ? "" : ", the top word") + "?",
      hint: up ? "A higher temperature flattens the chances: the parts move toward equal shares, so the biggest shrinks and the smallest grows." : "A lower temperature sharpens the chances: the top word grows.",
      options: o2,
      grade: function (a) { return { frac: a === dirKey ? 1 : 0, explain: q(w2) + " goes from " + p1 + "% (temperature 1) to " + p2 + "% (temperature " + to + "). " + (up ? "Higher temperature flattens the chances: the top word loses share and rare words gain." : "Lower temperature sharpens the chances: the top word gains, the others lose.") }; },
      sample: function (r) { return pick(o2, r).value; } };
  }
  /* "Spin": the stacked bar at temperature T, and a pointer at a spot on it (0-100). Which word is that?
   * The spot is kept at least 5 points inside a part (and is printed after the spin), so it is never unclear. */
  function spinItem(table, rng, T) {
    var shares = sharesAt(table.dist, T);
    var starts = [], acc = 0;
    shares.forEach(function (s) { starts.push(acc); acc += s.pct; });
    var ok = shares.map(function (s, i) { return i; }).filter(function (i) { return shares[i].pct >= 12; });
    var ti = pick(ok, rng);
    var lo = starts[ti] + 5, hi = starts[ti] + shares[ti].pct - 5;
    var spot = Math.round(lo + rng() * (hi - lo));
    var key = shares[ti].word;
    var opts = shares.map(function (s) { return { value: s.word, label: dw(s.word) }; });
    var ranges = shares.map(function (s, i) { return dw(s.word) + " " + starts[i] + "\u2013" + (starts[i] + s.pct); }).join(", ");
    return { kind: "spin", dice: table, T: T, shares: shares, spot: spot, limit: 40, key: key,
      title: "Temperature " + T + ": the model spins. Which word does it write?",
      hint: "The bar is a track from 0 to 100. Each word owns a part as wide as its %. Find the part the pointer is in.",
      options: opts,
      grade: function (a) { return { frac: a === key ? 1 : 0, explain: "At temperature " + T + " the parts are: " + ranges + ". The pointer stopped at " + spot + ", inside " + q(key) + "'s part, so the model writes " + q(key) + "." }; },
      sample: function (r) { return pick(opts, r).value; } };
  }
  function stage3(D, rng) {
    var kinds = shuffle(["chart", "zero", pick(["up", "down"], rng), "spin", "spin"], rng);
    var spinT = shuffle([1, pick([0.5, 2], rng)], rng);
    return kinds.map(function (kind) {
      var table = diceTable(D, rng);
      if (kind === "spin") return spinItem(table, rng, spinT.pop());
      return predictItem(kind, table, rng, pick([2, 0.5], rng));
    });
  }

  /* ================= Stage 4: Keyhole (context window) ================= */
  function stage4(D, rng) {
    var world = pick(D.worlds, rng), m = modelFor(world), vocab = vocabOf(world);
    var sents = world.text.map(M.tokenize);
    var cands = {}, list = [];
    sents.forEach(function (A) { sents.forEach(function (B) {
      // Splice two training sentences at a word they share: the start of A, then how B carries on after that word.
      // The result reads like a sentence, but the model may never have seen its last 2 or 3 words together.
      for (var a = 1; a < A.length; a++) for (var b = 1; b < B.length; b++) for (var j = 0; b + j <= B.length; j++) {
        if (A[a - 1] !== B[b - 1]) continue;
        var p = A.slice(0, a).concat(B.slice(b, b + j));
        if (p.length < 3 || p.length > 5) continue;
        var key = p.join(" ");
        if (cands[key]) continue;
        cands[key] = 1;
        var ans = [1, 2, 3].map(function (k) { var d = m.next(p, k); return d.length ? d[0].word : "none"; });
        if (ans[0] === "none") continue;
        list.push({ p: p, ans: ans });
      }
    }); });
    var ks = shuffle([1, 2, 3, 1, 2, 3], rng);
    var used = {};
    return ks.map(function (k) {
      var pool = list.filter(function (c) {
        var other = c.ans.filter(function (x, i) { return i !== k - 1; });
        return !used[c.p.join(" ")] && !used[k + ":" + c.p.slice(-k).join(" ")] && other.some(function (x) { return x !== c.ans[k - 1]; });
      });
      if (!pool.length) pool = list.filter(function (c) { return !used[c.p.join(" ")]; });
      var c = pick(pool, rng); used[c.p.join(" ")] = 1;
      var key = c.ans[k - 1];
      var seen = c.p.slice(-k);
      used[k + ":" + seen.join(" ")] = 1;
      var dist = m.next(c.p, k);
      var opts = uniq(c.ans.filter(function (x) { return x !== "none"; }).concat(shuffle(vocab, rng))).filter(function (x) { return x !== key; }).slice(0, 3);
      opts = shuffle(key === "none" ? opts : opts.slice(0, 3).concat([key]).slice(-4), rng);
      var options = opts.map(function (w) { return { value: w, label: dw(w) }; }).concat([{ value: "none", label: "No data: it has never seen this" }]);
      return { kind: "mcq", world: world, prefix: c.p, k: k, limit: 35, key: key,
        title: "With a " + k + "-word keyhole, what does the model write next?",
        hint: "Search the text for exactly " + qs(seen) + ", in that order. Only the word after it matters.",
        options: options,
        grade: function (a) {
          var what = key === "none" ? qs(seen) + " never appears in the text, so a " + k + "-word model has no data (a real model would still guess something)."
            : "After " + qs(seen) + " the text has: " + countsText(dist) + " \u2192 " + q(key) + tieNote(dist, seen) + ".";
          var cmp = [1, 2, 3].filter(function (x) { return x !== k; }).map(function (x) { return x + "-word keyhole: " + (c.ans[x - 1] === "none" ? "no data" : q(c.ans[x - 1])); }).join("; ");
          return { frac: a === key ? 1 : 0, explain: ["The model sees only " + qs(seen) + ". " + what, "Same sentence, other keyholes \u2192 " + cmp + ". The keyhole changes the answer."] };
        },
        sample: function (r) { return pick(options, r).value; } };
    });
  }

  /* ================= Chat brain (stage 7 since 29 Sep 2026; generator stage5) ================= */
  var QSTOP = ["when", "does", "do", "is", "are", "the", "a", "where", "who", "what", "at", "on"];
  function topicWords(words) { return words.filter(function (w) { return QSTOP.indexOf(w) < 0; }).sort().join(" "); }
  function sameQuestion(a, b) { return a[0] === b[0] && topicWords(a) === topicWords(b); }
  function chatModel(chat) {
    if (!cache["chat:" + chat.id]) {
      var m = new M.Model(8);
      chat.qa.forEach(function (p) { m.addSentence(M.qaSequence(p[0], p[1])); });
      cache["chat:" + chat.id] = m;
    }
    return cache["chat:" + chat.id];
  }
  function chatAnswer(chat, question) {
    var m = chatModel(chat), qw = M.tokenize(question);
    var r = m.answer(qw, 0);
    var ans = r.answer.join(" ");
    var backing = chat.qa.filter(function (p) { return sameQuestion(M.tokenize(p[0]), qw) && M.tokenize(p[1]).join(" ") === ans; })[0] || null;
    return { answer: ans, supported: !!backing, backing: backing, trail: r.trail, words: qw };
  }
  function stage5(D, rng) {
    var chat = pick(D.chats, rng);
    var all = chat.ask.map(function (qn) { return { q: qn, r: chatAnswer(chat, qn) }; });
    var sup = shuffle(all.filter(function (x) { return x.r.supported; }), rng);
    var made = shuffle(all.filter(function (x) { return !x.r.supported; }), rng);
    var chosen = shuffle(sup.slice(0, 1).concat(made.slice(0, 2), shuffle(sup.slice(1).concat(made.slice(2)), rng).slice(0, 1)), rng);
    var answers = uniq(chat.qa.map(function (p) { return p[1]; }));
    return chosen.map(function (x) {
      var key = { answer: x.r.answer, support: x.r.supported ? "Supported" : "Made up" };
      var others = shuffle(answers.filter(function (a) { return a !== x.r.answer; }), rng).slice(0, 2);
      var opts = shuffle([x.r.answer].concat(others), rng).concat(["I don't know"]);
      var first = x.r.trail[0];
      return { kind: "chat", chat: chat, question: x.q, limit: 60, key: key,
        title: "Someone asks: \u201c" + ds(x.q).charAt(0).toUpperCase() + ds(x.q).slice(1) + "?\u201d",
        hint: "Find the longest ending of \u201cQ: " + ds(x.q) + " A:\u201d that appears in the example chats, then continue from there, word by word.",
        options: opts.map(function (a) { return { value: a, label: a === "I don't know" ? a : ds(a) }; }),
        grade: function (a) {
          a = a || {};
          var f = (a.answer === key.answer ? 0.5 : 0) + (a.support === key.support ? 0.5 : 0);
          var seen = first ? first.seen.filter(function (w) { return w !== M.START; }).map(dw).join(" ") : "";
          var exact = chat.qa.some(function (p) { return M.tokenize(p[0]).join(" ") === x.r.words.join(" "); });
          var how = exact ? "It has seen this exact question, so it copies the answer."
            : "It has never seen this exact question. The longest ending it recognises is \u201c" + seen + "\u201d, so it continues from there.";
          var sup2 = x.r.supported ? "Supported: the chats contain \u201c" + ds(x.r.backing[0]) + "\u201d \u2192 \u201c" + ds(x.r.backing[1]) + "\u201d."
            : "Made up: no example chat asks this question with that answer. The model borrowed it from a different question, and it sounds just as sure.";
          var ties = x.r.trail.filter(function (t) { return t.raw.length > 1 && t.raw[0].count === t.raw[1].count; }).map(function (t) {
            return "Tie after \u201c" + t.seen.filter(function (w) { return w !== M.START; }).map(dw).join(" ") + "\u201d (" + countsText(t.raw) + "): reading the chats from the top, " + q(t.word) + " came first, so it wins.";
          });
          return { frac: f, explain: ["The model answers \u201c" + ds(x.r.answer) + "\u201d. " + how].concat(ties, [sup2, "It never says \u201cI don't know\u201d, because no example chat taught it to."]) };
        },
        sample: function (r) { return { answer: pick(opts, r), support: r() < 0.5 ? "Supported" : "Made up" }; } };
    });
  }

  /* ================= Three-word boss (stage 6 since 29 Sep 2026; generator stage7) =================
   * Single "what comes next?" questions at temperature 0 with a keyhole of up to 3 words:
   * use the last 3 words if they appear together in the text; if not, back off to 2, then to 1. */
  function boss3Case(world, text) {
    var m = modelFor(world), p = M.tokenize(text);
    var r = m.nextBackoff(p, 3);
    var ans = [1, 2, 3].map(function (k) { var d = m.next(p, k); return d.length ? d[0].word : "none"; });
    return { p: p, used: r.used, dist: r.dist, key: r.dist.length ? r.dist[0].word : "none", ans: ans };
  }
  function boss3Item(world, c, rng) {
    var vocab = vocabOf(world).concat([END]);
    var others = uniq(c.ans.filter(function (x) { return x !== "none" && x !== c.key; })
      .concat(c.dist.slice(1).map(function (d) { return d.word; }), shuffle(vocab, rng))).filter(function (x) { return x !== c.key; });
    var opts = shuffle([c.key].concat(others.slice(0, 3)), rng);
    var seen = c.p.slice(-c.used);
    return { kind: "mcq", world: world, prefix: c.p, k: 3, backoff: true, limit: 45, key: c.key,
      title: "Up to a 3-word keyhole, temperature 0: what does the model write after " + qs(c.p) + "?",
      hint: "Look for the last 3 words together in the text. Not there? Try the last 2. Still not? Use only the last word.",
      options: opts.map(function (w) { return { value: w, label: dw(w) }; }),
      grade: function (a) {
        var steps = [];
        for (var k = 3; k > c.used; k--) steps.push(qs(c.p.slice(-k)) + " never appears in the text, so it backs off to " + (k - 1) + " word" + (k - 1 === 1 ? "" : "s") + ".");
        steps.push("After " + qs(seen) + " the text has: " + countsText(c.dist) + " \u2192 " + q(c.key) + tieNote(c.dist, seen) + ".");
        var cmp = [1, 2, 3].filter(function (k) { return k < c.used; }).map(function (k) { return "a " + k + "-word keyhole would say " + (c.ans[k - 1] === "none" ? "nothing" : q(c.ans[k - 1])); });
        return { frac: a === c.key ? 1 : 0, explain: ["It uses " + c.used + " word" + (c.used === 1 ? "" : "s") + ": " + qs(seen) + "."].concat(steps, cmp.length ? ["For comparison: " + cmp.join("; ") + ". The longest keyhole with data wins."] : []) };
      },
      sample: function (r) { return pick(opts, r); } };
  }
  function boss3Pools(world) {
    var cases = world.ask.map(function (t) { return boss3Case(world, t); }).filter(function (c) { return c.used > 0; });
    function differs(c) { return c.ans.slice(0, c.used - 1).some(function (x) { return x !== c.key; }); }
    return [1, 2, 3].map(function (u) {
      var all = cases.filter(function (c) { return c.used === u; });
      var d = all.filter(function (c) { return u === 1 || differs(c); });
      return d.length >= 2 ? d : all;
    });
  }
  function stage7(D, rng) {
    var world = pick(D.boss3, rng), pools = boss3Pools(world);
    var chosen = [];
    [3, 2, 1].forEach(function (u) { chosen = chosen.concat(shuffle(pools[u - 1], rng).slice(0, 2)); });
    return shuffle(chosen, rng).map(function (c) { return boss3Item(world, c, rng); });
  }

  /* ================= Final: Be the LLM Arena (one stage, 12 items from all 7 skills) ================= */
  function finalStage(D, rng) {
    function take(fn, n, filter) { var its = fn(D, rng); if (filter) its = its.filter(filter).concat(its.filter(function (x) { return !filter(x); })); return its.slice(0, n); }
    var s1 = stage1(D, rng);
    var top = s1.filter(function (x) { return /Which word/.test(x.title); })[0], pctIt = s1.filter(function (x) { return /what %/.test(x.title); })[0];
    var s3 = stage3(D, rng);
    var items = [top, pctIt]
      .concat(take(stage2, 1))
      .concat([s3.filter(function (x) { return x.kind !== "spin"; })[0], s3.filter(function (x) { return x.kind === "spin"; })[0]])
      .concat(take(stage4, 2))
      .concat(take(stage6, 1))
      .concat(take(stage7, 2))
      .concat(take(stage5, 2));
    items.forEach(function (it, i) { it.skill = FINAL_SKILLS[i]; });
    return items;
  }
  var FINAL_SKILLS = ["Count it", "Count it", "Greedy writer", "Temperature", "Temperature", "Keyhole", "Keyhole",
    "Two-word boss", "Three-word boss", "Three-word boss", "Chat brain", "Chat brain"];

  // The v2 order: two-word boss (stage6 generator) 5th, three-word boss (stage7 generator) 6th, Chat brain (stage5 generator) 7th.
  var STAGES = [
    { id: "count", make: stage1 }, { id: "greedy", make: stage2 }, { id: "temp", make: stage3 },
    { id: "keyhole", make: stage4 }, { id: "boss2", make: stage6 }, { id: "boss3", make: stage7 }, { id: "chat", make: stage5 }
  ];
  var api = { STAGES: STAGES, FINAL: finalStage, modelFor: modelFor, vocabOf: vocabOf, chatAnswer: chatAnswer, sameQuestion: sameQuestion,
    sharesAt: sharesAt, boss3Case: boss3Case, boss3Pools: boss3Pools, MAX_NEW: MAX_NEW, M: M };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LLMA = api;
})(typeof window !== "undefined" ? window : globalThis);
