/*
 * AI games v2 · how each kind of arena item is drawn (used by the LLM Arena and the final Be the LLM Arena).
 * The items come from items.js; the stacked bars from shared/tempviz.js.
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, M = window.BTL.Model, TV = window.TV;
  function W() { return A.w; } // widgets.js loads after this file

  function ds(str) { return M.tokenize(str).map(M.displayWord).join(" "); } // "mr lee" -> "Mr Lee"
  function worldText(world, opts) {
    opts = opts || {};
    var box = h("div", { class: "textbox", "aria-label": "training text" });
    world.text.forEach(function (line, i) {
      box.appendChild(document.createTextNode((i ? "\n" : "") + (i + 1) + "  " + M.tokenize(line).map(M.displayWord).join(" ")));
    });
    return h("div", { class: "stack" }, h("div", { class: "small muted", text: "Training text: " + world.name + " (" + world.text.length + " sentences; each ends with [end])" }), box);
  }

  function keyhole(prefix, k, backoff) {
    var sent = h("div", { class: "kh" });
    prefix.forEach(function (w, i) {
      if (i) sent.appendChild(document.createTextNode(" "));
      var inWin = i >= prefix.length - k;
      sent.appendChild(h("span", { class: inWin ? "kh-in" : "kh-out", text: M.displayWord(w) }));
    });
    sent.appendChild(document.createTextNode(" "));
    sent.appendChild(h("span", { class: "kh-gap", text: "?" }));
    return h("div", { class: "stack" },
      h("div", { class: "small muted", text: backoff
        ? (k === 3 ? "The model can see up to the last 3 words (highlighted). If they never appear together in the text, it backs off to 2, then 1."
          : k === 2 ? "The model can see up to the last 2 words (highlighted). If they never appear together in the text, it backs off to the last word."
          : "The model sees only the last word (highlighted).")
        : "The model only sees the last " + k + " word" + (k === 1 ? "" : "s") + " (highlighted):" }), sent);
  }

  function diceCounts(dice) {
    return h("div", { class: "card soft stack" },
      h("div", { text: "Training text, after “" + dice.ctx + "”, the model counted:" }),
      h("div", { class: "counts" }, dice.dist.map(function (d) { return h("div", { class: "c" }, h("b", { text: d.word }), d.count + (d.count === 1 ? " time" : " times")); })));
  }

  function drawMcq(it, box, api) {
    if (it.world && it.prefix) {
      box.appendChild(keyhole(it.prefix, it.k, it.backoff));
      box.appendChild(worldText(it.world));
    } else if (it.world) {
      box.appendChild(worldText(it.world));
    }
    if (it.dice) box.appendChild(diceCounts(it.dice));
    // "Which bar is temperature X?": each option is a small stacked bar
    var options = it.stacks ? it.options.map(function (o) {
      return { value: o.value, label: h("span", { class: "mini-stack", style: "display:grid;gap:4px;width:100%" }, h("b", { text: o.label }), TV.stack(o.shares, { compact: true }).el) };
    }) : it.options;
    var c = W().choices(options, function (v) { api.submit(v); }, { oneCol: !!it.stacks });
    box.appendChild(c.el);
    return { collect: c.collect, reveal: function () { c.reveal(it.key); } };
  }

  function drawSpin(it, box, api) {
    box.appendChild(diceCounts(it.dice));
    var s = TV.stack(it.shares, { label: "Temperature " + it.T + ": each word owns a part of the 0–100 track." });
    box.appendChild(s.el);
    var c = W().choices(it.options, function (v) { api.submit(v); });
    var spin = h("button", { class: "btn primary", type: "button", text: "🎯 Spin", "data-focus": "1" });
    var said = h("p", { class: "tv-out", "aria-live": "polite" });
    var ask = h("div", { class: "stack hidden" }, h("b", { text: "Where did the pointer stop? The model writes:" }), c.el);
    spin.addEventListener("click", function () {
      spin.disabled = true;
      s.point(it.spot, true, function () { spin.remove(); said.textContent = "The pointer stopped at " + it.spot + "."; ask.classList.remove("hidden"); });
    });
    box.appendChild(h("div", { class: "row" }, spin, said));
    box.appendChild(ask);
    return { collect: c.collect, reveal: function () { s.point(it.spot, false); said.textContent = "The pointer stopped at " + it.spot + "."; ask.classList.remove("hidden"); c.reveal(it.key); } };
  }

  function drawNumber(it, box, api) {
    box.appendChild(worldText(it.world));
    var inp = W().inputBox({ type: "text", inputmode: "numeric", label: "count", placeholder: "e.g. 2", onSubmit: function (v) { api.submit(v); } });
    box.appendChild(inp.el);
    return { collect: inp.collect };
  }

  function drawTiles(it, box, api) {
    box.appendChild(worldText(it.world));
    box.appendChild(h("p", { class: "small muted", text: it.k === 1
      ? "Temperature 0, 1-word keyhole: after each word, write the word that most often follows it."
      : "Temperature 0, 2-word keyhole: look up the last two words together; if that pair never appears, use only the last word." }));
    var b = W().tileBuilder({ seed: it.seed.map(M.displayWord), tiles: it.tiles, max: it.max, onSubmit: function (words) { api.submit(words); } });
    box.appendChild(b.el);
    return { collect: b.collect, reveal: function () { b.reveal(it.key); } };
  }

  function drawChat(it, box, api) {
    box.appendChild(h("div", { class: "stack" },
      h("div", { class: "small muted", text: "The example chats this model was trained on (" + it.chat.name + "):" }),
      h("div", { class: "textbox" }, it.chat.qa.map(function (p, i) { return (i ? "\n" : "") + "Q: " + ds(p[0]) + "  A: " + ds(p[1]); }))));
    var ans = null;
    var c = W().choices(it.options, function (v) { ans = v; ready(); });
    // allow changing the pick until Submit
    Array.prototype.forEach.call(c.el.querySelectorAll(".choice"), function (b) {
      b.addEventListener("click", function () {
        ans = b.getAttribute("data-value");
        Array.prototype.forEach.call(c.el.querySelectorAll(".choice"), function (x) { x.classList.toggle("picked", x === b); });
        ready();
      });
    });
    var t = W().toggle(["Supported", "Made up"], ready);
    var sub = h("button", { class: "btn primary", type: "button", text: "Submit", disabled: true });
    function ready() { sub.disabled = !(ans && t.get()); }
    sub.addEventListener("click", function () { api.submit({ answer: ans, support: t.get() }); });
    box.appendChild(h("div", { class: "stack" },
      h("b", { text: "1. What does the model answer (temperature 0)?" }), c.el,
      h("b", { text: "2. Is that answer backed by the example chats?" }), t.el,
      h("div", { class: "row end" }, sub)));
    return {
      collect: function () { return { answer: ans, support: t.get() }; },
      reveal: function () {
        Array.prototype.forEach.call(c.el.querySelectorAll(".choice"), function (b) {
          var v = b.getAttribute("data-value");
          if (v === it.key.answer) b.classList.add("correct"); else if (v === ans) b.classList.add("wrong");
        });
        t.buttons.forEach(function (b) { if (b.textContent === it.key.support) b.style.boxShadow = "inset 0 0 0 3px var(--good)"; });
      }
    };
  }

  function drawer(it) {
    return function (box, api) {
      if (it.kind === "mcq") return drawMcq(it, box, api);
      if (it.kind === "spin") return drawSpin(it, box, api);
      if (it.kind === "number") return drawNumber(it, box, api);
      if (it.kind === "tiles") return drawTiles(it, box, api);
      return drawChat(it, box, api);
    };
  }
  function wrap(fn, D) {
    return function (rng) { return fn(D, rng).map(function (it) { it.render = drawer(it); return it; }); };
  }
  function windowBadge(n, extra) {
    return function (h) { return h("div", {}, h("span", { class: "win-badge" }, "🔑 " + (typeof n === "number" ? n + "-WORD KEYHOLE" : n), extra ? h("small", { text: extra }) : null)); };
  }

  window.LLMA_DRAW = { wrap: wrap, drawer: drawer, worldText: worldText, keyhole: keyhole, windowBadge: windowBadge };
})();
