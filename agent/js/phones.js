/*
 * AI games v2 · Be the Agent — the three linked chat phones: Human 📱, Model 🤖, Apps 🧰.
 *
 * Every message is shown twice: on the RIGHT in the sender's phone and on the LEFT in the receiver's phone.
 *   Human → Model : Human phone (right)  + Model phone (left)
 *   Model → Human : Model phone (right)  + Human phone (left)
 *   Model → App   : Model phone (right)  + Apps phone, that app's thread (left)
 *   App → Model   : Apps phone (right)   + Model phone (left)
 * The Model phone is everything the model can see: its context window.
 * Wide screens show the 3 phones side by side; narrow screens show one phone with tabs and "new message" badges.
 */
(function (root) {
  "use strict";
  var A = root.ARENA, h = A.h, clear = A.clear;

  var APPS = {
    calc: { icon: "🧮", name: "Calculator" },
    files: { icon: "📂", name: "File search" },
    web: { icon: "🌐", name: "Web search" },
    maker: { icon: "🗂️", name: "File maker" },
    code: { icon: "💻", name: "Code runner" },
    mail: { icon: "✉️", name: "Email" }
  };
  var WHO = {
    human: { icon: "👩", name: "Ploy (human)" },
    model: { icon: "🤖", name: "Model (you)" },
    apps: { icon: "🧰", name: "Apps (harness)" }
  };

  /* opts: { apps: ["calc", "files", ...], humanName, modelName, compactAt (px) } */
  function Phones(container, opts) {
    opts = opts || {};
    var apps = (opts.apps || ["calc", "files", "web", "maker"]).slice();
    var who = { human: Object.assign({}, WHO.human, opts.humanName ? { name: opts.humanName } : {}),
      model: Object.assign({}, WHO.model, opts.modelName ? { name: opts.modelName } : {}), apps: WHO.apps };
    var wrap = h("div", { class: "phones" });
    var tabs = h("div", { class: "ph-tabs", role: "tablist", "aria-label": "Which phone to show" });
    var grid = h("div", { class: "ph-grid" });
    var ph = {}, badge = {}, tabBtn = {}, active = "model";
    var appThreads = {}, appChips = {}, appBadge = {}, curApp = apps[0], appBar = null;
    function addApp(a, bar, body) {
      var bd = h("span", { class: "ph-badge hidden" });
      var chip = h("button", { type: "button", class: "ph-app", "aria-pressed": String(a === curApp) }, APPS[a].icon + " " + APPS[a].name, bd);
      chip.addEventListener("click", function () { showApp(a); });
      appChips[a] = chip; appBadge[a] = bd;
      appThreads[a] = h("div", { class: "ph-thread" + (a === curApp ? "" : " hidden") }, h("p", { class: "ph-empty", text: "No messages with the " + APPS[a].name + " yet." }));
      body.appendChild(appThreads[a]);
      bar.appendChild(chip);
    }

    ["human", "model", "apps"].forEach(function (k) {
      var body = h("div", { class: "ph-body", role: "log", "aria-live": k === "model" ? "polite" : "off", "aria-label": who[k].name + " chat" });
      var head = h("div", { class: "ph-head" }, h("span", { class: "ph-ico", "aria-hidden": "true", text: who[k].icon }), h("b", { text: who[k].name }));
      var extra = null;
      if (k === "apps") {
        extra = appBar = h("div", { class: "ph-apps" });
        apps.forEach(function (a) { addApp(a, extra, body); });
      }
      var phone = h("section", { class: "phone ph-" + k + (k === active ? " on" : ""), "aria-label": who[k].name }, head, extra, body);
      ph[k] = { el: phone, body: body };
      grid.appendChild(phone);
      var b = h("span", { class: "ph-badge hidden" });
      var t = h("button", { type: "button", role: "tab", class: "ph-tab", "aria-selected": String(k === active) }, who[k].icon + " " + who[k].name.replace(/ \(.*\)/, ""), b);
      t.addEventListener("click", function () { show(k); });
      tabs.appendChild(t); badge[k] = b; tabBtn[k] = t;
    });
    wrap.appendChild(tabs); wrap.appendChild(grid);
    container.appendChild(wrap);

    function show(k) {
      active = k;
      ["human", "model", "apps"].forEach(function (x) {
        ph[x].el.classList.toggle("on", x === k);
        tabBtn[x].setAttribute("aria-selected", String(x === k));
        if (x === k) { badge[x].classList.add("hidden"); badge[x].textContent = ""; }
      });
    }
    function showApp(a) {
      curApp = a;
      apps.forEach(function (x) { appThreads[x].classList.toggle("hidden", x !== a); appChips[x].setAttribute("aria-pressed", String(x === a)); if (x === a) appBadge[x].classList.add("hidden"); });
    }
    function bump(k) {
      if (k === active) return;
      var n = Number(badge[k].textContent || 0) + 1;
      badge[k].textContent = String(n); badge[k].classList.remove("hidden");
    }
    function scroll(el) { try { el.scrollTop = el.scrollHeight; } catch (e) { /* hidden */ } }

    function content(m) {
      if (m.el) return typeof m.el === "function" ? m.el() : m.el.cloneNode(true);
      if (m.kind === "call") return h("code", { class: "ph-code", text: m.text });
      return h("span", { text: m.text });
    }
    function bubble(side, m, label, cls) {
      var b = h("div", { class: "b " + side + (cls ? " " + cls : "") + (m.kind ? " k-" + m.kind : "") },
        label ? h("div", { class: "b-from", text: label }) : null, content(m));
      b.classList.add("new");
      setTimeout(function () { b.classList.remove("new"); }, 900);
      return b;
    }
    function put(k, node, thread) {
      var target = thread || ph[k].body;
      var empty = target.querySelector(".ph-empty"); if (empty) empty.remove();
      target.appendChild(node);
      scroll(ph[k].body);
      bump(k);
    }

    /* m: { from: "human"|"model"|<app>, to: "human"|"model"|<app>, text, kind: "text"|"call"|"result", el } */
    function add(m) {
      var fromApp = APPS[m.from] ? m.from : null, toApp = APPS[m.to] ? m.to : null;
      [fromApp, toApp].forEach(function (a) { if (a && !appThreads[a]) { apps.push(a); addApp(a, appBar, ph.apps.body); } });  // an app not listed yet gets its own thread
      var known = (m.from === "human" && m.to === "model") || (m.from === "model" && (m.to === "human" || toApp)) || (fromApp && m.to === "model");
      if (!known) throw new Error("AGENT_PHONES: unknown message route " + m.from + " → " + m.to);
      if (m.from === "human") {
        put("human", bubble("right", m, null, "c-human"));
        put("model", bubble("left", m, who.human.name.replace(/ \(.*\)/, ""), "c-human"));
      } else if (m.from === "model" && m.to === "human") {
        put("model", bubble("right", m, "→ " + who.human.name.replace(/ \(.*\)/, ""), "c-model"));
        put("human", bubble("left", m, "🤖 Model", "c-model"));
      } else if (m.from === "model" && toApp) {
        put("model", bubble("right", Object.assign({ kind: "call" }, m), "→ " + APPS[toApp].icon + " " + APPS[toApp].name, "c-model"));
        put("apps", bubble("left", Object.assign({ kind: "call" }, m), "🤖 Model", "c-model"), appThreads[toApp]);
        showApp(toApp);
      } else if (fromApp) {
        put("apps", bubble("right", Object.assign({ kind: "result" }, m), APPS[fromApp].name, "c-app"), appThreads[fromApp]);
        put("model", bubble("left", Object.assign({ kind: "result" }, m), APPS[fromApp].icon + " " + APPS[fromApp].name, "c-app"));
        showApp(fromApp);
      }
    }
    /* a small grey note in the Model phone (e.g. what the harness adds before the chat) */
    function note(text, k) { put(k || "model", h("p", { class: "ph-note", text: text })); }

    return { el: wrap, add: add, apps: apps, note: note, show: show, showApp: showApp, phones: ph, threads: appThreads };
  }

  /* Step through a script of messages with Next / Play all buttons. script: [{...message, say: "explanation"}] */
  function replay(container, script, opts) {
    opts = opts || {};
    var P = Phones(container, opts);
    var i = 0;
    var say = h("p", { class: "ph-say", "aria-live": "polite" });
    var next = h("button", { class: "btn primary", type: "button", text: "Next message ▶" });
    var all = h("button", { class: "btn ghost", type: "button", text: "Show all" });
    var bar = h("div", { class: "row ph-ctl" }, next, all, h("span", { class: "small muted ph-count" }));
    container.appendChild(say); container.appendChild(bar);
    function paint() { bar.querySelector(".ph-count").textContent = i + " of " + script.length + " messages"; }
    function step() {
      if (i >= script.length) return;
      var m = script[i++];
      if (m.note) P.note(m.note); else P.add(m);
      say.textContent = m.say || "";
      if (m.focus) P.show(m.focus);
      paint();
      if (i >= script.length) { next.disabled = true; all.disabled = true; next.textContent = "Done ✓"; if (opts.onDone) opts.onDone(); }
    }
    next.addEventListener("click", step);
    all.addEventListener("click", function () { while (i < script.length) step(); });
    paint();
    if (opts.autoFirst) step();
    return { phones: P, step: step, done: function () { return i >= script.length; } };
  }

  root.AGENT_PHONES = { Phones: Phones, replay: replay, APPS: APPS, WHO: WHO };
})(typeof window !== "undefined" ? window : globalThis);
