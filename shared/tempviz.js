/*
 * AI games v2 — temperature pictures: the stacked bar, the spinning pointer and the temperature calculator.
 *
 * The stacked bar is a track from 0 to 100. Each word owns a part as wide as its chance (%).
 * "Spinning" = the computer picks a random spot on the track; the word whose part holds that spot is written.
 * That is how a real model samples the next word (the spot is a random number between 0 and 1).
 *
 * Needs window.BTL.Model (shared/model.js) and window.ARENA.h (shared/arena.js).
 */
(function () {
  "use strict";
  var M = window.BTL.Model;
  var h = window.ARENA.h, clear = window.ARENA.clear;
  var COLORS = ["#2563eb", "#d97706", "#059669", "#db2777", "#7c3aed"];
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function dw(w) { return M.displayWord(w); }

  // Shares at temperature T in whole % that add up to exactly 100 (largest-remainder rounding).
  function sharesAt(dist, T) {
    var d = M.applyTemperature(dist, T);
    var raw = d.map(function (x) { return Math.round(1e6 * 100 * x.p) / 1e6; }); // (rounded first, so float noise never decides a tie)
    var fl = raw.map(Math.floor), left = 100 - fl.reduce(function (a, b) { return a + b; }, 0);
    raw.map(function (v, i) { return { i: i, r: v - fl[i] }; }).sort(function (a, b) { return b.r - a.r || a.i - b.i; })
      .slice(0, left).forEach(function (x) { fl[x.i]++; });
    return d.map(function (x, i) { return { word: x.word, count: x.count, p: x.p, pct: fl[i] }; });
  }
  // A random spot 0.0-99.9 that is not within 0.5 of a border, so it is never unclear which part it is in.
  function randomSpot(shares, rng) {
    var borders = [], acc = 0;
    shares.forEach(function (s) { acc += s.pct; borders.push(acc); });
    for (var t = 0; t < 50; t++) {
      var spot = Math.floor((rng || Math.random)() * 1000) / 10;
      if (!borders.some(function (b) { return Math.abs(spot - b) < 0.5; }) && spot >= 0.5) return spot;
    }
    return shares[0].pct / 2;
  }
  function wordAt(shares, spot) {
    var acc = 0;
    for (var i = 0; i < shares.length; i++) { acc += shares[i].pct; if (spot < acc) return shares[i].word; }
    return shares[shares.length - 1].word;
  }

  /* The stacked bar. shares: [{word, pct}]. opts: { pointer: spot 0-100 or null, compact: bool, label: text }
   * Returns { el, set(shares), point(spot, animate, done) } */
  function stack(shares, opts) {
    opts = opts || {};
    var bar = h("div", { class: "tv-bar", role: "img" });
    var ptr = h("div", { class: "tv-ptr hidden", "aria-hidden": "true" }, h("span", { class: "tv-ptr-head", text: "▼" }), h("span", { class: "tv-ptr-line" }));
    var track = h("div", { class: "tv-track" }, ptr, bar);
    var scale = h("div", { class: "tv-scale", "aria-hidden": "true" }, [0, 25, 50, 75, 100].map(function (v) { return h("span", { style: "left:" + v + "%", text: String(v) }); }));
    var legend = h("div", { class: "tv-legend" });
    var el = h("div", { class: "tv-stack" + (opts.compact ? " compact" : "") }, opts.label ? h("div", { class: "small muted", text: opts.label }) : null, track, opts.compact ? null : scale, legend);
    var cur = shares;
    function paint(s) {
      cur = s;
      clear(bar); clear(legend);
      var acc = 0;
      s.forEach(function (x, i) {
        var col = COLORS[i % COLORS.length];
        var seg = h("div", { class: "tv-seg", style: "width:" + x.pct + "%;background:" + col, title: dw(x.word) + " " + x.pct + "% (" + acc + "–" + (acc + x.pct) + ")" },
          x.pct >= 14 ? h("span", { text: dw(x.word) + " " + x.pct + "%" }) : null);
        bar.appendChild(seg);
        legend.appendChild(h("span", { class: "tv-key" }, h("i", { style: "background:" + col }), h("b", { text: dw(x.word) }), " " + x.pct + "%" + (opts.compact || !x.pct ? "" : "  (" + acc + "–" + (acc + x.pct) + ")")));
        acc += x.pct;
      });
      bar.setAttribute("aria-label", "Stacked bar: " + s.map(function (x) { return dw(x.word) + " " + x.pct + "%"; }).join(", "));
    }
    paint(shares);
    function point(spot, animate, done) {
      ptr.classList.remove("hidden");
      if (!animate || reduced) { ptr.style.transition = "none"; ptr.style.left = spot + "%"; if (done) done(); return; }
      // a quick sweep across the bar, then it settles on the spot
      ptr.style.transition = "none"; ptr.style.left = "0%";
      void ptr.offsetWidth;
      ptr.style.transition = "left .55s ease-in-out"; ptr.style.left = "100%";
      setTimeout(function () {
        ptr.style.transition = "left .9s cubic-bezier(.2,.8,.3,1)"; ptr.style.left = spot + "%";
        setTimeout(function () { if (done) done(); }, 950);
      }, 560);
    }
    if (opts.pointer != null) point(opts.pointer, false);
    return { el: el, set: paint, point: point, hidePointer: function () { ptr.classList.add("hidden"); }, get: function () { return cur; } };
  }

  /* The temperature calculator.
   * cfg: { ctx: "at the weekend we", dist: [{word, count}], temps: [0, .5, 1, 2, 5], T: 1, editable: bool,
   *        spin: bool, rng: function, onChange(T, shares), onSpin(word, spot, T) }
   * Returns { el, setT(T), getT(), shares(), spin() } */
  function calculator(cfg) {
    var temps = cfg.temps || [0, 0.5, 1, 2, 5];
    var ti = Math.max(0, temps.indexOf(cfg.T == null ? 1 : cfg.T));
    var dist = cfg.dist.map(function (d) { return { word: d.word, count: d.count }; });
    var rng = cfg.rng || Math.random;
    var slider = h("input", { type: "range", min: "0", max: String(temps.length - 1), step: "1", value: String(ti), class: "tv-slider", "aria-label": "temperature" });
    var tLabel = h("b", { class: "tv-t" });
    var note = h("p", { class: "small muted tv-note" });
    var countsBox = h("div", { class: "counts" });
    var s = stack(sharesOf(), {});
    var out = h("p", { class: "tv-out", "aria-live": "polite" });
    function T() { return temps[ti]; }
    function ordered() { return dist.slice().sort(function (a, b) { return b.count - a.count; }); } // stable: ties keep their order
    function sharesOf() { return sharesAt(ordered(), T()); }
    function paintCounts() {
      clear(countsBox);
      dist.forEach(function (d, i) {
        var minus = cfg.editable ? h("button", { class: "btn small ghost", type: "button", "aria-label": "one less " + dw(d.word), text: "−" }) : null;
        var plus = cfg.editable ? h("button", { class: "btn small ghost", type: "button", "aria-label": "one more " + dw(d.word), text: "+" }) : null;
        if (minus) minus.addEventListener("click", function () { if (dist[i].count > 1) { dist[i].count--; refresh(); } });
        if (plus) plus.addEventListener("click", function () { if (dist[i].count < 20) { dist[i].count++; refresh(); } });
        countsBox.appendChild(h("div", { class: "c" }, h("b", { text: dw(d.word) }), minus, h("span", { text: d.count + (d.count === 1 ? " time" : " times") }), plus));
      });
    }
    function refresh() {
      tLabel.textContent = String(T());
      slider.setAttribute("aria-valuetext", "temperature " + T());
      paintCounts();
      var sh = sharesOf();
      s.set(sh); s.hidePointer(); out.textContent = "";
      spinId++; busy = false;
      if (spinBtn) spinBtn.disabled = T() === 0;
      if (T() === 0) out.textContent = "No spin needed: the top word always wins.";
      note.textContent = T() === 0 ? "Temperature 0: no spin. The top word gets 100%, every time."
        : T() < 1 ? "Low temperature: the top word's part grows, the others shrink (sharper)."
        : T() === 1 ? "Temperature 1: the plain counts. % = count ÷ total."
        : "High temperature: the parts even out (flatter). Rare words get more chances.";
      if (cfg.onChange) cfg.onChange(T(), sh);
    }
    slider.addEventListener("input", function () { ti = Number(slider.value); refresh(); });
    var spinBtn = cfg.spin ? h("button", { class: "btn primary", type: "button", text: "🎯 Spin" }) : null;
    var busy = false, spinId = 0; // a slider move cancels a spin that is still running
    function spin() {
      if (busy) return;
      if (T() === 0) return;
      busy = true; if (spinBtn) spinBtn.disabled = true;
      var my = ++spinId;
      var sh = sharesOf();
      var spot = randomSpot(sh, rng);
      var w = wordAt(sh, spot);
      out.textContent = "Spinning…";
      s.point(spot, true, function () {
        if (my !== spinId) return;
        busy = false; if (spinBtn) spinBtn.disabled = T() === 0;
        out.textContent = "The pointer stopped at " + spot + " → the model writes “" + dw(w) + "”.";
        if (cfg.onSpin) cfg.onSpin(w, spot, T());
      });
    }
    if (spinBtn) spinBtn.addEventListener("click", spin);
    var el = h("div", { class: "card soft stack tv-calc" },
      h("div", { class: "row" }, h("span", { text: "🧮 Temperature calculator" }), cfg.ctx ? h("span", { class: "muted small", text: "after “" + cfg.ctx + "”" }) : null),
      h("div", {}, h("div", { class: "small muted", text: cfg.editable ? "Counts from the training text (tap − / + to change them):" : "Counts from the training text:" }), countsBox),
      h("label", { class: "tv-slide" }, h("span", {}, "Temperature: ", tLabel), slider,
        h("span", { class: "tv-ticks", "aria-hidden": "true" }, temps.map(function (t) { return h("span", { text: String(t) }); }))),
      s.el, note,
      spinBtn ? h("div", { class: "row" }, spinBtn, out) : null,
      h("details", { class: "small" }, h("summary", { text: "What does the calculator do?" }),
        h("p", { text: "It raises each count to the power 1 ÷ temperature, then turns the results into % (each one ÷ their total). At temperature 1 that's just count ÷ total. At temperature 0 the top word simply gets 100%. Real models do the same kind of thing with their scores for every possible next token." })));
    refresh();
    return { el: el, setT: function (t) { var i = temps.indexOf(t); if (i >= 0) { ti = i; slider.value = String(i); refresh(); } }, getT: T, shares: sharesOf, spin: spin, spinBtn: spinBtn };
  }

  window.TV = { stack: stack, calculator: calculator, sharesAt: sharesAt, wordAt: wordAt, randomSpot: randomSpot, COLORS: COLORS };
})();
