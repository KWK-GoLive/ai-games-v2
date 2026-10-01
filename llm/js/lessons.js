/*
 * AI games v2 · the 7 lessons ("Be the LLM") that come right before each arena stage.
 * Each lesson uses its own tiny training text (4–6 sentences; different from the stage texts),
 * is untimed and unscored, and lets the student practise with instant feedback.
 * Every number shown is computed by the real toy model (shared/model.js); tests/check-data.js checks
 * that each lesson text still shows the effect it is meant to teach.
 */
(function (root) {
  "use strict";
  var M = (root.BTL && root.BTL.Model) || require("../../shared/model.js");
  var END = M.END;

  /* ---------- the lesson texts (also read by the tests in Node) ---------- */
  var TEXTS = {
    L1: ["i drink tea in the morning", "i drink coffee in the morning", "i drink tea at night", "you drink water at night", "i eat rice at night"],
    L2: ["my cat sleeps all day", "my cat sleeps all night", "the dog sleeps all day", "the dog runs to the park"],
    L3: { ctx: "at the weekend we", dist: [{ word: "play", count: 6 }, { word: "read", count: 3 }, { word: "swim", count: 1 }] },
    L4: ["i like green tea", "you like green tea", "we like green apples", "i eat green apples", "they eat green apples"],
    L5: ["the cat sat on the mat", "my cat sat on the mat", "the dog sat on the sofa", "a dog ran to the park", "the park is big", "my dog ran home"],
    L6: { id: "lesson6", name: "Corner Shop", qa: [
      ["when does the shop open", "at nine am"],
      ["when does the shop close", "at six pm"],
      ["where is the shop", "next to the bank"],
      ["who owns the shop", "mr lee"],
      ["is the shop open today", "yes it is"]] },
    L7: ["the red bus is slow", "the red bus is big", "my red bus is new", "a red car is fast", "a red car is new", "we saw a red kite"]
  };
  // The sentence starts each lesson works through (checked by the tests).
  var CASES = {
    L1: { counts: "drink", pct: ["i", "drink"], end: "night", tie: "tea" },
    L2: { guided: ["my"], practice: ["the"] },
    L4: { prefix: "we like green", nodata: "they like green" },
    L5: { compare: "the dog", backoff: "a cat", whole: ["the", "dog"] },
    L6: { exact: "where is the shop", partial: "when does the bank open", other: "when is the shop open", onlyA: "who owns the bank" },
    L7: { three: "we saw a red", two: "i like a red", one: "a big red" }
  };
  // Real context windows, for the end of lesson 4. Checked against the sources on 28 Sep 2026.
  var REAL = {
    gpt3short: "2,048 tokens at once.",
    claudeshort: "Claude Sonnet 5: up to 1,000,000 tokens at once. (Sources are in the teaching guide.)",
    gpt3: "GPT-3 (2020) could see 2,048 tokens at once (Brown et al., 2020, \u201cLanguage Models are Few-Shot Learners\u201d, NeurIPS; section 2.1).",
    claude: "Claude Sonnet 5 can see up to 1,000,000 tokens at once (Anthropic's documentation, \u201cContext windows\u201d, checked 28 Sep 2026)."
  };

  var cache = {};
  function model(key) { if (!cache[key]) cache[key] = M.Model.train(TEXTS[key], 3); return cache[key]; }

  var api = { TEXTS: TEXTS, CASES: CASES, REAL: REAL, model: model };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  /* ================= browser part ================= */
  var A = root.ARENA, h = A.h, clear = A.clear, V = root.VIS, TV = root.TV;
  function dw(w) { return M.displayWord(w); }
  function q(w) { return "\u201c" + dw(w) + "\u201d"; }
  function qs(ws) { return "\u201c" + ws.map(dw).join(" ") + "\u201d"; }
  function tok(s) { return M.tokenize(s); }
  function pct(n, total) { return Math.round(100 * n / total); }
  function sum(dist) { return dist.reduce(function (a, d) { return a + d.count; }, 0); }

  /* The training text with line numbers and an [end] chip after each sentence.
   * mark: array of words (a 1-, 2- or 3-word context): every place they appear together is highlighted,
   * and the piece right after them (a word or [end]) gets a green box. */
  function ltext(lines, mark) {
    var box = h("div", { class: "ltext", "aria-label": "training text" });
    lines.forEach(function (line, li) {
      var ws = tok(line).concat([END]);
      var cls = ws.map(function () { return ""; });
      if (mark && mark.length) {
        for (var i = 0; i + mark.length < ws.length; i++) {
          var ok = true;
          for (var j = 0; j < mark.length; j++) if (ws[i + j] !== mark[j]) { ok = false; break; }
          if (ok) { for (j = 0; j < mark.length; j++) cls[i + j] = "ctx"; cls[i + mark.length] = cls[i + mark.length] === "ctx" ? "ctx" : "nxt"; }
        }
      }
      var row = h("div", {}, h("span", { class: "ln", text: String(li + 1) }));
      ws.forEach(function (w, i) {
        if (i) row.appendChild(document.createTextNode(" "));
        if (w === END) row.appendChild(h("span", { class: "endchip" + (cls[i] ? " " + cls[i] : ""), text: "[end]" }));
        else row.appendChild(cls[i] ? h("span", { class: cls[i], text: dw(w) }) : document.createTextNode(dw(w)));
      });
      box.appendChild(row);
    });
    return box;
  }
  function chatText(chat, markAfterA) {
    return h("div", { class: "ltext" }, chat.qa.map(function (p, i) {
      return h("div", {}, h("span", { class: "ln", text: String(i + 1) }), "Q: " + tok(p[0]).map(dw).join(" ") + "  ", h("b", { text: "A:" }), " ",
        markAfterA ? h("span", { class: "nxt", text: dw(tok(p[1])[0]) }) : dw(tok(p[1])[0]), " " + tok(p[1]).slice(1).map(dw).join(" "));
    }));
  }

  /* A count table: word, count, bar, % */
  function ctable(dist, opts) {
    opts = opts || {};
    var total = sum(dist);
    return h("div", { class: "ctable" },
      opts.title ? h("div", { class: "small muted", text: opts.title }) : null,
      dist.map(function (d, i) {
        return h("div", { class: "r" + (i === 0 && opts.top ? " top" : "") },
          h("b", { text: dw(d.word) }), h("span", { text: "\u00d7 " + d.count }),
          h("span", { class: "bar" }, h("i", { style: "width:" + pct(d.count, total) + "%" })),
          h("span", { class: "pc", text: pct(d.count, total) + "%" }));
      }),
      h("div", { class: "small muted", text: "Total: " + total + (total === 1 ? " time" : " times") + ". % = count \u00f7 total." }));
  }

  function keyholeView(prefix, k, gapText) {
    var sent = h("div", { class: "kh" });
    prefix.forEach(function (w, i) {
      if (i) sent.appendChild(document.createTextNode(" "));
      sent.appendChild(h("span", { class: i >= prefix.length - k ? "kh-in" : "kh-out", text: dw(w) }));
    });
    sent.appendChild(document.createTextNode(" "));
    sent.appendChild(h("span", { class: "kh-gap", text: gapText || "?" }));
    return sent;
  }

  /* A practice question with instant feedback. You can try again after a wrong answer.
   * cfg: { q, options: [{value, label}], key, right: text|[texts], wrong: fn(value) -> text } ; onSolved() */
  function practice(cfg, onSolved) {
    var fb = h("div", { class: "fb stack", "aria-live": "polite" });
    var solved = false;
    var grid = h("div", { class: "choices" + (cfg.oneCol ? " one" : "") });
    var btns = cfg.options.map(function (o) {
      var b = h("button", { class: "choice", type: "button", "data-value": String(o.value) }, o.label);
      b.addEventListener("click", function () {
        if (solved) return;
        clear(fb);
        if (String(o.value) === String(cfg.key)) {
          solved = true; b.classList.add("correct");
          btns.forEach(function (x) { x.disabled = true; x.classList.add("unlock-ok"); });
          (Array.isArray(cfg.right) ? cfg.right : [cfg.right]).forEach(function (t, i) { fb.appendChild(h("p", { class: i ? "small" : "feedback good", text: (i ? "" : "\u2713 ") + t })); });
          if (onSolved) onSolved();
        } else {
          b.classList.add("wrong"); b.disabled = true;
          fb.appendChild(h("p", { class: "feedback bad", text: "\u2717 Not quite. " + (cfg.wrong ? (typeof cfg.wrong === "function" ? cfg.wrong(o.value) : cfg.wrong) : "Try again.") }));
        }
      });
      grid.appendChild(b);
      return b;
    });
    return h("div", { class: "card practice stack" }, h("div", { class: "kicker", text: "Try it" }), h("b", { text: cfg.q }), grid, fb);
  }
  function opts(words) { return words.map(function (w) { return { value: w, label: dw(w) }; }); }
  function shuffleFixed(a) { return a.slice(1).concat(a.slice(0, 1)); } // a fixed, non-first position for the key

  /* Write a sentence step by step (the student picks each next word; the model's counts are shown).
   * k: window size (1 or 2, with back-off). onDone() when [end] (or 8 pieces) is reached. */
  function guidedWrite(m, seed, k, onDone) {
    var words = seed.slice();
    var box = h("div", { class: "stack" });
    var line = h("div", { class: "kh" });
    var stepBox = h("div", { class: "stack" });
    box.appendChild(h("div", { class: "small muted", text: "The sentence so far:" }));
    box.appendChild(line);
    box.appendChild(stepBox);
    function paintLine(last) {
      clear(line);
      words.forEach(function (w, i) {
        if (i) line.appendChild(document.createTextNode(" "));
        line.appendChild(h("span", { class: last && i >= words.length - last ? "kh-in" : "", text: dw(w) }));
      });
    }
    // the followers, plus [end] and other words from the text, so there is always a real choice (4 options)
    var vocab = [];
    m.sentences.forEach(function (ws) { ws.forEach(function (w) { if (vocab.indexOf(w) < 0) vocab.push(w); }); });
    function pad(list) {
      var out = list.slice(0, 4);
      [END].concat(vocab).forEach(function (w, i) {
        if (out.length < 4 && out.indexOf(w) < 0 && words.indexOf(w) < 0) out.push(w);
      });
      // mix the order but deterministically: rotate by the number of words so far
      var r = words.length % out.length;
      return out.slice(r).concat(out.slice(0, r));
    }
    function step() {
      var r = m.nextBackoff([M.START].concat(words), k);
      var seen = [M.START].concat(words).slice(-r.used).filter(function (w) { return w !== M.START; });
      paintLine(seen.length);
      clear(stepBox);
      if (!r.dist.length || words.length - seed.length >= 8) { finish(); return; }
      var key = r.dist[0].word;
      var note = k === 2 && r.used === 1 ? qs([M.START].concat(words).slice(-2).filter(function (w) { return w !== M.START; })) + " never appears together in the text, so the model backs off to the last word only. " : "";
      var choices = r.dist.map(function (d) { return d.word; });
      stepBox.appendChild(h("p", {}, note, "The model looks at ", h("b", { text: qs(seen) }), ". In the text, right after it:"));
      stepBox.appendChild(ctable(r.dist, { top: false }));
      stepBox.appendChild(practice({
        q: "Temperature 0: which word does it write next?",
        options: opts(pad(choices)),
        key: key,
        right: key === END ? "[end]: the model stops. The sentence is finished." : q(key) + " has the biggest count" + (r.dist.length > 1 && r.dist[0].count === r.dist[1].count ? " (a tie: it came first right after " + qs(seen) + ", reading from the top)" : "") + ".",
        wrong: "Temperature 0 takes the biggest count. On a tie: the one that comes first right after it, reading from the top."
      }, function () {
        var next = h("button", { class: "btn primary", type: "button", text: key === END ? "Done \u2713" : "Add " + q(key) + " \u2192" });
        next.addEventListener("click", function () {
          if (key === END) { finish(); return; }
          words.push(key); step();
        });
        stepBox.appendChild(h("div", { class: "row end" }, next));
        next.focus({ preventScroll: true });
      }));
    }
    function finish() {
      paintLine(0);
      clear(stepBox);
      stepBox.appendChild(h("p", { class: "feedback good", text: "\u2713 Finished: " + qs(words) + " [end]" }));
      onDone();
    }
    step();
    return box;
  }

  /* The lesson frame: numbered steps with Back / Next. A step with locked: true opens Next only after unlock(). */
  function stepper(box, steps, done, ctx) {
    var i = 0;
    var bar = h("div", { class: "lesson-steps", "aria-hidden": "true" }, steps.map(function () { return h("span"); }));
    var card = h("section", { class: "card stack" });
    var nav = h("div", { class: "row end" });
    box.appendChild(h("section", { class: "card soft stack" }, bar, h("div", { class: "small muted", "aria-live": "polite" })));
    box.appendChild(card);
    box.appendChild(nav);
    var counter = bar.nextSibling;
    function show() {
      clear(card); clear(nav);
      Array.prototype.forEach.call(bar.children, function (s, j) { s.classList.toggle("on", j <= i); });
      counter.textContent = "Step " + (i + 1) + " of " + steps.length;
      var st = steps[i];
      var last = i === steps.length - 1;
      var next = h("button", { class: "btn primary", type: "button", text: last ? "Start stage " + ctx.stageNo + " \u2192" : "Next \u2192", disabled: !!st.locked });
      var back = h("button", { class: "btn ghost", type: "button", text: "\u2190 Back", disabled: i === 0 });
      back.addEventListener("click", function () { if (i > 0) { i--; show(); ctx.top(); } });
      next.addEventListener("click", function () { if (next.disabled) return; if (last) { done(); return; } i++; show(); ctx.top(); });
      if (st.title) card.appendChild(h("h2", { text: st.title }));
      var hint = st.locked ? h("p", { class: "small muted", text: "Answer the question to go on." }) : null;
      st.render(card, function unlock() { next.disabled = false; if (hint) hint.remove(); });
      nav.appendChild(back); if (hint) nav.appendChild(hint); nav.appendChild(next);
    }
    show();
  }
  // Several practice questions in one step: each opens the next; the last one unlocks the step.
  function chain(el, list, unlock) {
    var k = 0;
    function add() {
      if (k >= list.length) { unlock(); return; }
      var cfg = list[k++];
      var node = typeof cfg === "function" ? cfg(add) : practice(cfg, add);
      el.appendChild(node);
    }
    add();
  }
  function recap(el, items) { el.appendChild(V.cards(items, { cols: 2 })); }

  /* ======================= Lesson 1: Count it ======================= */
  function lesson1(box, done, ctx) {
    var m = model("L1"), C = CASES.L1;
    var dDrink = m.next([C.counts], 1), totD = sum(dDrink);
    var dI = m.next([C.pct[0]], 1), dEnd = m.next([C.end], 1), dTie = m.next([C.tie], 1);
    var pI = pct(dI.filter(function (d) { return d.word === C.pct[1]; })[0].count, sum(dI));
    stepper(box, [
      { title: "How a model learns", render: function (el) {
        el.appendChild(V.cards([
          { icon: "\ud83d\udcd6", title: "It reads example text", text: "This is called training. Our tiny model reads just these 5 sentences." },
          { icon: "\ud83d\udd22", title: "It counts", text: "For every word, it counts which word comes right after it." },
          { icon: "%", title: "Counts become chances", text: "Count \u00f7 total = the chance (%) that this word comes next." }], { cols: 3 }));
        el.appendChild(ltext(TEXTS.L1));
        el.appendChild(h("p", { class: "small muted" }, "The grey ", h("span", { class: "ltext", style: "padding:0 4px" }, h("span", { class: "endchip", text: "[end]" })), " marks where a sentence stops. The model counts it like a word."));
      } },
      { title: "Count what comes after \u201cdrink\u201d", locked: true, render: function (el, unlock) {
        el.appendChild(ltext(TEXTS.L1, [C.counts]));
        el.appendChild(h("p", {}, "Yellow = ", q(C.counts), ". Green = the word right after it. Count the greens:"));
        el.appendChild(ctable(dDrink, { top: true }));
        var cof = dDrink.filter(function (d) { return d.word === "coffee"; })[0];
        chain(el, [{ q: "After \u201cdrink\u201d, what % of the time does \u201ccoffee\u201d come next?", key: pct(cof.count, totD),
          options: [50, 25, 33, 100].map(function (v) { return { value: v, label: v + "%" }; }),
          right: "coffee came " + cof.count + " time out of " + totD + ": " + cof.count + " \u00f7 " + totD + " = " + pct(cof.count, totD) + "%.",
          wrong: "Count all the greens after \u201cdrink\u201d (" + totD + "), then divide coffee's count by that." }], unlock);
      } },
      { title: "Your turn: count it yourself", locked: true, render: function (el, unlock) {
        el.appendChild(ltext(TEXTS.L1));
        chain(el, [{ q: "After \u201cI\u201d, what % of the time does \u201cdrink\u201d come next?", key: pI,
          options: [75, 25, 50, 100].map(function (v) { return { value: v, label: v + "%" }; }),
          right: ["\u201cI\u201d is followed by: " + dI.map(function (d) { return dw(d.word) + " " + d.count; }).join(", ") + ". drink = " + dI[0].count + " \u00f7 " + sum(dI) + " = " + pI + "%."],
          wrong: "Find every \u201ci\u201d. Which word is right after it each time? Count them all, then divide." }], unlock);
      } },
      { title: "The end of a sentence counts too", locked: true, render: function (el, unlock) {
        el.appendChild(ltext(TEXTS.L1, [C.end]));
        chain(el, [{ q: "After \u201cnight\u201d, what comes next?", key: END, options: opts(["at", END, "i", "rice"]),
          right: "\u201cnight\u201d ends " + dEnd[0].count + " sentences, so [end] comes next " + dEnd[0].count + " out of " + sum(dEnd) + " times: 100%. [end] means: stop writing.",
          wrong: "Look at the green box after each \u201cnight\u201d." }], unlock);
      } },
      { title: "Temperature 0: always the top word", locked: true, render: function (el, unlock) {
        el.appendChild(h("p", { text: "When the model writes, the simplest rule is: take the word with the biggest count. We call this temperature 0: no randomness, always the top word (lesson 3 shows other temperatures). The arena stages use temperature 0." }));
        el.appendChild(ctable(dDrink, { top: true, title: "After \u201cdrink\u201d:" }));
        chain(el, [{ q: "Temperature 0: which word does the model write after \u201cdrink\u201d?", key: dDrink[0].word, options: opts(["coffee", "water", dDrink[0].word, "night"]),
          right: q(dDrink[0].word) + " has the biggest count (" + dDrink[0].count + "), so it wins every time.",
          wrong: "Temperature 0 takes the biggest count." }], unlock);
      } },
      { title: "A tie? The first one wins", locked: true, render: function (el, unlock) {
        el.appendChild(ltext(TEXTS.L1, [C.tie]));
        el.appendChild(ctable(dTie, { title: "After \u201ctea\u201d:" }));
        el.appendChild(h("p", {}, "Both have 1: a tie. Our model's rule: reading from line 1 down, pick the one you meet ", h("b", { text: "first" }), " right after \u201ctea\u201d."));
        chain(el, [{ q: "At temperature 0 the model writes " + q(dTie[0].word) + " after \u201ctea\u201d. Why?", key: "first", oneCol: true,
          options: [{ value: "count", label: "It has a bigger count" }, { value: "first", label: "Reading from the top, it comes right after \u201ctea\u201d first (sentence 1)" }, { value: "short", label: "It's a shorter word" }, { value: "random", label: "The model picks at random" }],
          right: "Sentence 1 says \u201ctea in\u201d; \u201ctea at\u201d only comes in sentence 3. Same count, so the first one wins.",
          wrong: "Both counts are 1. Look at which one you meet first, reading from sentence 1 down." }], unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "\ud83d\udd22", title: "Training = counting", text: "The model counts which word comes right after each word. That table is all it knows." },
          { icon: "%", title: "Count \u00f7 total", text: "gives the chance (%) of each next word." },
          { icon: "\ud83c\udfc1", title: "[end] counts too", text: "The end of a sentence counts like a word: [end]. Picking it means stop." },
          { icon: "\ud83e\udd47", title: "Temperature 0 + ties", text: "Take the biggest count. Tie? The one you meet first right after that word, reading from line 1 down." }]);
        el.appendChild(h("p", { class: "small muted", text: "Stage 1 uses a NEW, longer training text, so count carefully." }));
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 2: Greedy writer (1-word window, [end]) ======================= */
  function lesson2(box, done, ctx) {
    var m = model("L2"), C = CASES.L2;
    var practiceTrail = m.generateTrail(C.practice, 1, 0, 8);
    var key = practiceTrail.trail.map(function (t) { return t.word; });
    stepper(box, [
      { title: "Writing = guess, add, repeat", render: function (el) {
        el.appendChild(V.flow([{ icon: "\ud83d\udd11", label: "Look at the LAST word" }, { icon: "\ud83d\udd22", label: "Take its top next word" }, { icon: "\u2795", label: "Add it" }], { loop: "Repeat until it picks [end]" }));
        el.appendChild(h("p", { text: "The model sees only the last word: a 1-word keyhole (lesson 4 explains keyholes). It doesn't remember the start of the sentence." }));
        el.appendChild(ltext(TEXTS.L2));
      } },
      { title: "[end] is how the model stops", render: function (el) {
        el.appendChild(ltext(TEXTS.L2, ["day"]));
        el.appendChild(V.cards([
          { icon: "\ud83c\udfc1", title: "Every sentence ends with [end]", text: "So after \u201cday\u201d the model has counted [end] 2 times." },
          { icon: "\u270b", title: "Picking [end] = stop", text: "When [end] is the top next word, the sentence is finished. Without [end], the model would only stop when it hits a length limit." }], { cols: 2 }));
      } },
      { title: "Write with the model, one word at a time", locked: true, render: function (el, unlock) {
        el.appendChild(ltext(TEXTS.L2));
        el.appendChild(guidedWrite(m, C.guided, 1, unlock));
      } },
      { title: "Your turn: the whole sentence", locked: true, render: function (el, unlock) {
        el.appendChild(ltext(TEXTS.L2));
        el.appendChild(h("p", {}, "Start from ", h("b", { text: qs(C.practice) }), ". Temperature 0, 1-word keyhole. Tap the words in order and finish with [end]."));
        var fb = h("div", { class: "stack", "aria-live": "polite" });
        var tiles = [];
        TEXTS.L2.forEach(function (s) { tok(s).forEach(function (w) { if (tiles.indexOf(w) < 0) tiles.push(w); }); });
        tiles = tiles.sort().concat([END]).map(function (w) { return { value: w, label: dw(w) }; });
        var b = A.w.tileBuilder({ seed: C.practice.map(dw), tiles: tiles, max: 8, onSubmit: function (ws) {
          clear(fb);
          var n = 0; while (n < ws.length && n < key.length && ws[n] === key[n]) n++;
          if (n === key.length && ws.length === key.length) {
            fb.appendChild(h("p", { class: "feedback good", text: "\u2713 Exactly what the model writes: " + qs(C.practice.concat(key.slice(0, -1))) + " [end]" }));
            practiceTrail.trail.forEach(function (t) { fb.appendChild(h("p", { class: "small", text: "After " + q(t.seen[0]) + ": " + t.raw.map(function (d) { return dw(d.word) + " " + d.count; }).join(", ") + " \u2192 " + q(t.word) + (t.raw.length > 1 && t.raw[0].count === t.raw[1].count ? " (a tie: reading from line 1 down, it is the first one right after " + q(t.seen[0]) + ")" : "") })); });
            unlock();
          } else {
            var t = practiceTrail.trail[Math.min(n, practiceTrail.trail.length - 1)];
            fb.appendChild(h("p", { class: "feedback bad", text: "\u2717 The first " + n + " word" + (n === 1 ? " is" : "s are") + " right. Check the next one: after " + q(t.seen[0]) + " the text has " + t.raw.map(function (d) { return dw(d.word) + " " + d.count; }).join(", ") + ". Fix it and press Submit again." }));
          }
        } });
        el.appendChild(b.el); el.appendChild(fb);
      } },
      { title: "Notice: \u201cnight\u201d never wins", render: function (el) {
        el.appendChild(ltext(TEXTS.L2, ["all"]));
        el.appendChild(h("p", { text: "\u201call night\u201d is in the text, but after \u201call\u201d the counts are day 2, night 1. At temperature 0 the model writes \u201cday\u201d every single time. Lesson 3 shows how a real chatbot can still sometimes write \u201cnight\u201d." }));
        recap(el, [
          { icon: "\ud83d\udd11", title: "1-word keyhole", text: "Look only at the last word, take its top next word, add it, repeat." },
          { icon: "\ud83c\udfc1", title: "[end] stops it", text: "The sentence is finished when the top next word is [end]." },
          { icon: "\ud83d\udd01", title: "It can loop", text: "With such a tiny keyhole it may go round in circles. The stage stops it after 8 words." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 3: Temperature (calculator + spinner) ======================= */
  function lesson3(box, done, ctx) {
    var m2 = model("L2");
    var dAll = m2.next(["all"], 1);
    var L = TEXTS.L3;
    stepper(box, [
      { title: "Real chatbots spin a wheel", render: function (el) {
        el.appendChild(h("p", { text: "At temperature 0 the model always takes the top word. Real chatbots usually don't: they pick the next word at random, but weighted by the chances. Picture the chances as one long bar:" }));
        el.appendChild(ctable(dAll, { title: "From lesson 2: after \u201call\u201d" }));
        el.appendChild(TV.stack(TV.sharesAt(dAll, 1), { label: "The same chances as a stacked bar: a track from 0 to 100" }).el);
        el.appendChild(h("p", { text: "The computer picks a random spot on the track (like a spinning pointer). Whichever part it stops in is the word it writes. \u201cday\u201d owns 2 of every 3 spots, so it wins about 2 times in 3, and \u201cnight\u201d about 1 time in 3." }));
      } },
      { title: "Spin and read the pointer", locked: true, render: function (el, unlock) {
        var shares = TV.sharesAt(dAll, 1);
        var s = TV.stack(shares, {});
        el.appendChild(s.el);
        var spins = 0, need = 2;
        var area = h("div", { class: "stack" });
        var btn = h("button", { class: "btn primary", type: "button", text: "\ud83c\udfaf Spin" });
        el.appendChild(h("div", { class: "row" }, btn, h("span", { class: "small muted", text: "Spin, then say which word the model writes. Do it " + need + " times." })));
        el.appendChild(area);
        btn.addEventListener("click", function () {
          btn.disabled = true; clear(area);
          var spot = TV.randomSpot(shares, Math.random);
          var w = TV.wordAt(shares, spot);
          s.point(spot, true, function () {
            area.appendChild(practice({ q: "The pointer stopped at " + spot + ". Which word does the model write?", key: w, options: opts(shares.map(function (x) { return x.word; })),
              right: spot + " is inside " + q(w) + "'s part (" + shares.map(function (x, i) { var a = shares.slice(0, i).reduce(function (t, y) { return t + y.pct; }, 0); return dw(x.word) + " " + a + "\u2013" + (a + x.pct); }).join(", ") + ").",
              wrong: "Find the pointer's number on the 0\u2013100 scale, then the word whose range holds it." }, function () {
              spins++;
              if (spins >= need) unlock(); else btn.disabled = false;
              btn.disabled = false;
            }));
          });
        });
      } },
      { title: "The temperature dial", locked: true, render: function (el, unlock) {
        el.appendChild(h("p", { text: "Temperature changes how the bar is shared out. Move the slider and watch. (The counts never change; only the shares do.)" }));
        var calc = TV.calculator({ ctx: L.ctx, dist: L.dist, T: 1, spin: true });
        el.appendChild(calc.el);
        var top = L.dist[0].word, bottom = L.dist[L.dist.length - 1].word;
        chain(el, [
          { q: "Move the slider to 2. What happens to " + q(top) + "'s part?", key: "less", options: [{ value: "more", label: "It grows" }, { value: "less", label: "It shrinks" }, { value: "same", label: "No change" }],
            right: "At 2 the parts even out: " + q(top) + " goes from " + TV.sharesAt(L.dist, 1)[0].pct + "% to " + TV.sharesAt(L.dist, 2)[0].pct + "%. High temperature = flatter = more surprises.", wrong: "Set the slider to 2 and compare the bar with temperature 1." },
          { q: "Move it to 0.5. What happens to " + q(bottom) + "'s part?", key: "less", options: [{ value: "more", label: "It grows" }, { value: "less", label: "It shrinks" }, { value: "same", label: "No change" }],
            right: "At 0.5 the top word takes even more: " + q(bottom) + " drops from " + TV.sharesAt(L.dist, 1)[2].pct + "% to " + TV.sharesAt(L.dist, 0.5)[2].pct + "%. Low temperature = sharper = more predictable.", wrong: "Set the slider to 0.5 and look at the smallest part." },
          { q: "Move it to 0. Which words can the model write now?", key: "top", options: [{ value: "top", label: "Only " + q(top) }, { value: "all", label: "Any of the three" }, { value: "two", label: q(top) + " and " + q(L.dist[1].word) }],
            right: "Temperature 0: no spin needed. The top word has 100%, so the answer is the same every time. That's the rule the arena uses unless it says otherwise.", wrong: "At 0 the bar is all one colour." }
        ], unlock);
      } },
      { title: "Play with the counts (optional)", render: function (el) {
        el.appendChild(h("p", { text: "Change the counts with \u2212 and +, and move the slider. Try making two words equal, or one word very rare." }));
        el.appendChild(TV.calculator({ ctx: L.ctx, dist: L.dist, T: 1, spin: true, editable: true }).el);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "\ud83c\udfaf", title: "Spin = weighted random pick", text: "A random spot on the 0\u2013100 bar; the part it lands in is the word." },
          { icon: "\ud83d\udd25", title: "High temperature", text: "flattens the bar: rare words get more chances, answers vary more." },
          { icon: "\u2744\ufe0f", title: "Low temperature", text: "sharpens the bar: the top word takes more. At 0 it always wins." },
          { icon: "\u2705", title: "Different answers are normal", text: "Ask a chatbot the same thing twice and you may get different words. That's the spin, not a fault." }]);
        el.appendChild(h("p", { class: "small muted", text: "Stage 3 mixes two kinds of question: what the dial does to the bar, and where the pointer stopped." }));
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 4: Keyhole (context window) ======================= */
  function lesson4(box, done, ctx) {
    var m = model("L4"), C = CASES.L4, p = tok(C.prefix), nd = tok(C.nodata);
    function ans(k) { var d = m.next(p, k); return d.length ? d[0].word : "none"; }
    var choices = opts(["tea", "apples", "green", "like"]);
    stepper(box, [
      { title: "The model sees only the last few words", render: function (el) {
        el.appendChild(h("p", { text: "How many of the last words the model can see is called its context window. In this game we call it the keyhole. Words outside the keyhole don't exist for the model." }));
        el.appendChild(keyholeView(p, 1)); el.appendChild(h("p", { class: "small muted", text: "1-word keyhole: it sees only \u201cgreen\u201d." }));
        el.appendChild(keyholeView(p, 2)); el.appendChild(h("p", { class: "small muted", text: "2-word keyhole: it sees \u201clike green\u201d." }));
        el.appendChild(keyholeView(p, 3)); el.appendChild(h("p", { class: "small muted", text: "3-word keyhole: it sees \u201cwe like green\u201d." }));
      } },
      { title: "Same sentence, different keyholes", locked: true, render: function (el, unlock) {
        var holder = h("div", { class: "stack" });
        el.appendChild(holder);
        chain(holder, [1, 2, 3].map(function (k) {
          return function (next) {
            var seen = p.slice(-k), d = m.next(p, k);
            var wrap = h("div", { class: "stack" },
              h("h3", { text: k + "-word keyhole" }), keyholeView(p, k), ltext(TEXTS.L4, seen), ctable(d, { title: "After " + qs(seen) + ":" }));
            wrap.appendChild(practice({ q: "With a " + k + "-word keyhole, what does the model write next (temperature 0)?", key: ans(k), options: choices,
              right: "After " + qs(seen) + ": " + d.map(function (x) { return dw(x.word) + " " + x.count; }).join(", ") + " \u2192 " + q(ans(k)) + ".",
              wrong: "Find exactly " + qs(seen) + " (yellow) and count the green words after it." }, next));
            return wrap;
          };
        }), function () {
          holder.appendChild(h("p", { class: "feedback good", text: "1 word \u2192 " + q(ans(1)) + ", 2 words \u2192 " + q(ans(2)) + ", 3 words \u2192 " + q(ans(3)) + ". Change the keyhole, change the answer." }));
          unlock();
        });
      } },
      { title: "When the words never appear together", locked: true, render: function (el, unlock) {
        el.appendChild(keyholeView(nd, 3));
        el.appendChild(ltext(TEXTS.L4));
        chain(el, [{ q: "3-word keyhole: what does the model write after " + qs(nd) + "?", key: "none", oneCol: true,
          options: [{ value: "tea", label: "tea" }, { value: "apples", label: "apples" }, { value: "none", label: "No data: it has never seen these 3 words together" }],
          right: qs(nd) + " never appears in the text, so this tiny model has nothing to count. (Lesson 5 shows the fix: back off to fewer words.)",
          wrong: "Search the text for exactly \u201cthey like green\u201d, all three in that order." }], unlock);
      } },
      { title: "Real models: a much bigger keyhole", render: function (el) {
        el.appendChild(V.cards([
          { icon: "\ud83e\udde9", title: "Tokens, not words", text: "Real models count their keyhole in tokens: a word or a piece of a word. Other languages, including Thai, often need more tokens than English for the same meaning." },
          { icon: "\ud83d\udcdc", title: "GPT-3 (2020)", text: REAL.gpt3short },
          { icon: "\ud83d\udcda", title: "Today", text: REAL.claudeshort },
          { icon: "\ud83e\udde0", title: "No exact matching", text: "A real model doesn't search its training text for these exact words. It learned patterns, so it can still guess well when the wording is new." }], { cols: 2 }));
        el.appendChild(h("p", { class: "small muted", text: "Stage 4 asks for 1-, 2- and 3-word keyholes on a new text." }));
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 5: Two-word window + back-off ======================= */
  function lesson5(box, done, ctx) {
    var m = model("L5"), C = CASES.L5, pc = tok(C.compare), pb = tok(C.backoff);
    var d1 = m.next(pc, 1), d2 = m.next(pc, 2), b = m.nextBackoff(pb, 2);
    stepper(box, [
      { title: "Look at the last TWO words together", render: function (el) {
        el.appendChild(h("div", {}, h("span", { class: "win-badge" }, "\ud83d\udd11 2-WORD KEYHOLE")));
        el.appendChild(h("p", { text: "Now the model looks up its last two words as one pair, and counts what came right after that pair in the text. More context, better guesses." }));
        el.appendChild(ltext(TEXTS.L5));
      } },
      { title: "1 word vs 2 words", locked: true, render: function (el, unlock) {
        el.appendChild(keyholeView(pc, 1));
        el.appendChild(ctable(d1, { title: "1-word keyhole, after " + qs(pc.slice(-1)) + ":" }));
        el.appendChild(keyholeView(pc, 2));
        el.appendChild(ltext(TEXTS.L5, pc));
        el.appendChild(ctable(d2, { title: "2-word keyhole, after " + qs(pc) + ":" }));
        chain(el, [{ q: "With the 2-word keyhole, what does the model write after " + qs(pc) + "?", key: d2[0].word, options: opts([d1[0].word, d2[0].word, "the", END]),
          right: "The pair " + qs(pc) + " is followed by " + q(d2[0].word) + ". With only \u201cdog\u201d it would say " + q(d1[0].word) + " (" + d1.map(function (x) { return dw(x.word) + " " + x.count; }).join(", ") + ").",
          wrong: "Only count what comes right after the whole pair " + qs(pc) + " (yellow)." }], unlock);
      } },
      { title: "Never seen the pair? Back off", locked: true, render: function (el, unlock) {
        el.appendChild(keyholeView(pb, 2));
        el.appendChild(ltext(TEXTS.L5, pb.slice(-1)));
        el.appendChild(h("p", {}, qs(pb), " never appears in the text. So the model ", h("b", { text: "backs off" }), ": it uses only the last word, ", q(pb[pb.length - 1]), "."));
        el.appendChild(ctable(b.dist, { title: "After " + q(pb[pb.length - 1]) + ":" }));
        chain(el, [{ q: "2-word keyhole with back-off: what does the model write after " + qs(pb) + "?", key: b.dist[0].word, oneCol: true,
          options: [{ value: b.dist[0].word, label: dw(b.dist[0].word) }, { value: "none", label: "Nothing: it has no data" }, { value: "ran", label: "ran" }],
          right: "It backs off to " + q(pb[pb.length - 1]) + " and writes " + q(b.dist[0].word) + ". Back-off means this model never gets stuck.",
          wrong: "The pair is missing, so use only the last word." }], unlock);
      } },
      { title: "Write a whole sentence with 2 words", locked: true, render: function (el, unlock) {
        el.appendChild(h("div", {}, h("span", { class: "win-badge" }, "\ud83d\udd11 2-WORD KEYHOLE")));
        el.appendChild(ltext(TEXTS.L5));
        el.appendChild(guidedWrite(m, C.whole, 2, unlock));
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "\ud83d\udd11", title: "2-word keyhole", text: "Look up the last two words together. What came right after that pair?" },
          { icon: "\u21a9\ufe0f", title: "Back-off", text: "If the pair never appears, use only the last word." },
          { icon: "\ud83d\udc51", title: "Next: the 2-word boss", text: "Stage 5 asks you to write whole sentences this way, against the clock." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 7 (since 29 Sep 2026): Answering questions ======================= */
  function lesson6(box, done, ctx) {
    var L6 = TEXTS.L6, C = CASES.L6, LL = root.LLMA;
    var ex = LL.chatAnswer(L6, C.exact), pa = LL.chatAnswer(L6, C.partial), ot = LL.chatAnswer(L6, C.other), oa = LL.chatAnswer(L6, C.onlyA);
    var answers = L6.qa.map(function (p) { return p[1]; });
    function ansOpts(right) { var o = answers.filter(function (a) { return a !== right; }).slice(0, 2).concat([right]); return o.map(function (a) { return { value: a, label: tok(a).map(dw).join(" ") }; }); }
    function seenOf(r) { return r.trail[0].seen.filter(function (w) { return w !== M.START; }); }
    // Quick way (move 3): grow the ending from "A:" to the left; stop at the first ending that never appears.
    function endings(words) {
      var full = [M.Q].concat(words, [M.A]);
      var used = seenOf(LL.chatAnswer(L6, words.join(" "))).length;
      var list = h("div", { class: "stack" });
      for (var k = 1; k <= Math.min(full.length, 8); k++) {
        var e = full.slice(-k), ok = k <= used, best = k === used;
        list.appendChild(h("div", { class: "small" }, h("span", { "aria-hidden": "true", text: ok ? "\u2705 " : "\u274c " }), h("span", { class: best ? "kh-in" : "", text: "\u201c" + e.map(dw).join(" ") + "\u201d" }),
          best ? " appears: the longest ending, so continue from here." : ok ? " appears: add one more word." : " never appears: stop."));
        if (!ok) break;
      }
      return list;
    }
    stepper(box, [
      { title: "A chatbot continues after \u201cA:\u201d", render: function (el) {
        el.appendChild(h("p", { text: "Chatbots are also trained on example chats: a question (Q:), then an answer (A:). So the model learns: after \u201cA:\u201d come answer words. When you ask something, it writes \u201cQ: your question A:\u201d and simply continues the text." }));
        el.appendChild(chatText(L6));
        el.appendChild(h("p", { class: "small muted", text: "Same idea as lessons 5 and 6, with a longer keyhole: up to 8 words, so a whole short question fits. It uses the longest ending of your question that it can find in the chats (the next step shows a quick way to find it)." }));
      } },
      { title: "How to work it out", render: function (el) {
        el.appendChild(h("p", { text: "Use these moves for every question in this lesson and in stage 7:" }));
        el.appendChild(V.rules([
          "Write the question as \u201cQ: \u2026 A:\u201d.",
          "Seen this exact question in the chats? Copy its answer. Done.",
          "Not seen? Quick way: start from \u201cA:\u201d and add words to the left, one at a time. Stop when the ending never appears in the chats. The last ending that appeared is the longest one: the model continues from there.",
          "Continue word by word: take the word that comes next most often. A tie? The chat higher up the list wins. Stop at the end of the answer."]));
        el.appendChild(h("p", {}, "Then judge the answer: ", h("b", { text: "Supported" }), " if a chat asks the same question (even in other words) and gives that answer; ", h("b", { text: "Made up" }), " if the answer was borrowed from a different question."));
      } },
      { title: "A question it has seen", locked: true, render: function (el, unlock) {
        el.appendChild(chatText(L6));
        chain(el, [{ q: "Someone asks \u201c" + C.exact + "?\u201d What does the model answer?", key: ex.answer, options: ansOpts(ex.answer),
          right: "It has seen this exact question, so it copies the answer that came after it. That answer is supported by the chats.",
          wrong: "Find the same question in the chats." }], unlock);
      } },
      { title: "A new question: grow from \u201cA:\u201d", locked: true, render: function (el, unlock) {
        el.appendChild(chatText(L6));
        el.appendChild(h("p", {}, "Someone asks ", h("b", { text: "\u201c" + C.partial + "?\u201d" }), " That exact question is not in the chats, so use move 3: start from \u201cA:\u201d and add words to the left:"));
        el.appendChild(endings(tok(C.partial)));
        chain(el, [
          { q: "What does the model answer?", key: pa.answer, options: ansOpts(pa.answer),
            right: "From \u201c" + seenOf(pa).map(dw).join(" ") + "\u201d it continues just like the shop's opening time: \u201c" + pa.answer + "\u201d.", wrong: "Which chat has the ending \u201c" + seenOf(pa).map(dw).join(" ") + "\u201d? Copy what came after it." },
          { q: "Is \u201c" + pa.answer + "\u201d backed by the chats, for the bank?", key: "made", oneCol: true,
            options: [{ value: "sup", label: "Supported: a chat says when the bank opens" }, { value: "made", label: "Made up: that's the shop's time, borrowed for the bank" }],
            right: "Made up. No chat says when the bank opens. The model still answers, and sounds just as sure. This is a hallucination.", wrong: "Is there any chat about the bank's opening time?" }
        ], unlock);
      } },
      { title: "Same question, other words", locked: true, render: function (el, unlock) {
        el.appendChild(chatText(L6));
        el.appendChild(h("p", {}, "Someone asks ", h("b", { text: "\u201c" + C.other + "?\u201d" }), " Not in the chats word for word, so use move 3:"));
        el.appendChild(h("p", { class: "small muted", text: "Chat 5 has \u201cis the shop open\u201d, but then \u201ctoday\u201d, not \u201cA:\u201d. An ending only counts if it ends with \u201cA:\u201d." }));
        el.appendChild(endings(tok(C.other)));
        chain(el, [
          { q: "What does the model answer?", key: ot.answer, options: ansOpts(ot.answer),
            right: "From \u201c" + seenOf(ot).map(dw).join(" ") + "\u201d it continues like chat 1: \u201c" + ot.answer + "\u201d.", wrong: "Which chat has the ending \u201c" + seenOf(ot).map(dw).join(" ") + "\u201d? Copy what came after it." },
          { q: "Is \u201c" + ot.answer + "\u201d backed by the chats?", key: "sup", oneCol: true,
            options: [{ value: "sup", label: "Supported: chat 1 asks the same thing in other words" }, { value: "made", label: "Made up: the words are different, so it was borrowed" }],
            right: "Supported. \u201c" + C.other + "?\u201d and \u201c" + ot.backing[0] + "?\u201d mean the same, and chat 1 gives this answer. Judge by meaning, not by exact words.", wrong: "Does any chat ask the same thing, maybe in other words? What does it answer?" }
        ], unlock);
      } },
      { title: "Only \u201cA:\u201d matches", locked: true, render: function (el, unlock) {
        var first = oa.trail[0];
        el.appendChild(h("p", {}, "Now someone asks ", h("b", { text: "\u201c" + C.onlyA + "?\u201d" }), " Move 3 stops at once: only \u201cA:\u201d itself appears."));
        el.appendChild(endings(tok(C.onlyA)));
        el.appendChild(chatText(L6, true));
        el.appendChild(ctable(first.raw, { title: "Words right after \u201cA:\u201d in all the chats:" }));
        var tie = oa.trail[1] && oa.trail[1].raw.length > 1 && oa.trail[1].raw[0].count === oa.trail[1].raw[1].count;
        el.appendChild(h("p", { text: "So it starts with " + q(first.word) + " (the most common first answer word). Then, after \u201cA: " + dw(first.word) + "\u201d: " + oa.trail[1].raw.map(function (d) { return dw(d.word) + " " + d.count; }).join(", ") + (tie ? " \u2014 a tie, so the first one (chat 1) wins: " + q(oa.trail[1].word) + "." : ".") }));
        chain(el, [{ q: "What does the model answer to \u201c" + C.onlyA + "?\u201d", key: oa.answer, options: ansOpts(oa.answer),
          right: "\u201c" + oa.answer + "\u201d: a time, for a \u201cwho\u201d question! It looks like chat 1's answer, but the model didn't choose chat 1: \u201cat\u201d is the most common first word after \u201cA:\u201d, and the tie rule picked \u201cnine\u201d.",
          wrong: "Start with the most common word right after \u201cA:\u201d, then keep going with the tie rule." }], unlock);
      } },
      { title: "Toy model vs real chatbot", render: function (el) {
        el.appendChild(V.cards([
          { icon: "\ud83e\uddf8", title: "Our toy model", text: "Looks for the exact words in its training text, and backs off (shorter keyhole) when it can't find them." },
          { icon: "\ud83e\udd16", title: "A real LLM", text: "Doesn't search its training text, doesn't back off, and doesn't read from the end: it looks at all the words in its window at once. It doesn't look for the longest matching ending; it weighs what all the words mean together. It learned patterns from a huge amount of text, so it can answer new questions well." },
          { icon: "\u26a0\ufe0f", title: "Same weakness", text: "When a real LLM doesn't know, it still writes something that looks like an answer, and sounds just as sure. Always check important facts." },
          { icon: "\ud83d\udcac", title: "Stage 7", text: "Predict the answer, then judge: supported by the chats, or made up?" }], { cols: 2 }));
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 6 (since 29 Sep 2026): Three-word keyhole ======================= */
  function lesson7(box, done, ctx) {
    var m = model("L7"), C = CASES.L7;
    function info(text) { var p = tok(text), r = m.nextBackoff(p, 3); return { p: p, used: r.used, dist: r.dist, key: r.dist[0].word }; }
    var i3 = info(C.three), i2 = info(C.two), i1 = info(C.one);
    var choices = opts(["bus", "car", "kite", END]);
    function steps(inf) {
      var out = h("div", { class: "stack" });
      for (var k = 3; k >= inf.used; k--) {
        var seen = inf.p.slice(-k), ok = k === inf.used;
        out.appendChild(h("div", { class: "small" }, h("span", { "aria-hidden": "true", text: ok ? "\u2705 " : "\u274c " }), k + " words ", h("span", { class: ok ? "kh-in" : "", text: qs(seen) }), ok ? ": found. Use it." : ": never appears. Back off."));
      }
      return out;
    }
    stepper(box, [
      { title: "Up to 3 words: the longest that has data", render: function (el) {
        el.appendChild(h("div", {}, h("span", { class: "win-badge" }, "\ud83d\udd11 UP TO 3-WORD KEYHOLE")));
        el.appendChild(V.flow([{ label: "Try the last 3 words" }, { label: "Not found? Try 2" }, { label: "Still not? Use 1" }]));
        el.appendChild(h("p", { text: "The model always uses as many words as it can: the longest keyhole that appears in the text." }));
        el.appendChild(ltext(TEXTS.L7));
      } },
      { title: "3 words found", locked: true, render: function (el, unlock) {
        el.appendChild(keyholeView(i3.p, 3));
        el.appendChild(ltext(TEXTS.L7, i3.p.slice(-3)));
        el.appendChild(h("p", { class: "small", text: "Compare: 1 word " + qs(i3.p.slice(-1)) + " \u2192 " + q(m.next(i3.p, 1)[0].word) + " \u00b7 2 words " + qs(i3.p.slice(-2)) + " \u2192 " + q(m.next(i3.p, 2)[0].word) + " \u00b7 3 words " + qs(i3.p.slice(-3)) + " \u2192 " + q(i3.key) }));
        chain(el, [{ q: "Up to 3 words: what does the model write after " + qs(i3.p) + "?", key: i3.key, options: choices,
          right: qs(i3.p.slice(-3)) + " appears in the text, so the 3-word keyhole wins: " + q(i3.key) + ".", wrong: "Use the longest keyhole that appears in the text." }], unlock);
      } },
      { title: "Back off from 3 to 2", locked: true, render: function (el, unlock) {
        el.appendChild(keyholeView(i2.p, 3));
        el.appendChild(steps(i2));
        el.appendChild(ltext(TEXTS.L7, i2.p.slice(-i2.used)));
        chain(el, [{ q: "What does the model write after " + qs(i2.p) + "?", key: i2.key, options: choices,
          right: "It backs off to " + qs(i2.p.slice(-i2.used)) + ": " + i2.dist.map(function (d) { return dw(d.word) + " " + d.count; }).join(", ") + " \u2192 " + q(i2.key) + ".", wrong: "3 words aren't in the text. Try the last 2." }], unlock);
      } },
      { title: "Back off from 3 to 1", locked: true, render: function (el, unlock) {
        el.appendChild(keyholeView(i1.p, 3));
        el.appendChild(steps(i1));
        el.appendChild(ltext(TEXTS.L7, i1.p.slice(-1)));
        chain(el, [{ q: "What does the model write after " + qs(i1.p) + "?", key: i1.key, options: choices,
          right: "Only " + qs(i1.p.slice(-1)) + " has data: " + i1.dist.map(function (d) { return dw(d.word) + " " + d.count; }).join(", ") + " \u2192 " + q(i1.key) + ".", wrong: "Neither 3 nor 2 words appear. Use the last word only." }], unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "\ud83d\udd11", title: "Longest keyhole with data", text: "Try 3 words, then 2, then 1. The first one found decides." },
          { icon: "\ud83d\udd00", title: "Different keyholes, different words", text: "The same sentence can end in 3 different ways with 1, 2 or 3 words." },
          { icon: "\ud83c\udfc6", title: "Next: the three-word boss", text: "Stage 6: single \u201cwhat comes next?\u201d questions with up to 3 words, temperature 0." }]);
      } }
    ], done, ctx);
  }

  api.teach = { count: lesson1, greedy: lesson2, temp: lesson3, keyhole: lesson4, boss2: lesson5, chat: lesson6, boss3: lesson7 };
  api.ltext = ltext; api.ctable = ctable; api.practice = practice; api.keyholeView = keyholeView;
  root.LLM_LESSONS = api;
})(typeof window !== "undefined" ? window : globalThis);
