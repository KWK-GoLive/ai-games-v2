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
    code: { icon: "💻", name: "Code tool" },
    mail: { icon: "✉️", name: "Email" }
  };
  var WHO = {
    human: { icon: "👩", name: "Ploy (human)" },
    model: { icon: "🤖", name: "Model (you)" },
    apps: { icon: "🧰", name: "Apps" }
  };

  /* the café's real files (in agent/files/): a 📎 chip on a message opens them */
  var REAL_FILES = ["moonbean_sales_aug2026.csv", "Moonbean_staff_handbook.pdf", "Moonbean_staff_handbook.docx", "Moonbean_menu_2026.docx", "Supplier_letter_Aug2026.pdf"];
  /* the café's shared folder: the apps can open these files; Ploy doesn't attach them (29 Sep 2026) */
  var FOLDER = ["Moonbean_staff_handbook.pdf", "Moonbean_staff_handbook.docx", "Moonbean_menu_2026.docx", "Supplier_letter_Aug2026.pdf", "moonbean_sales_aug2026.csv"];
  var FOLDER_NOTE = "📁 Shared folder (the apps can open these; the model can't open files itself): " + FOLDER.join(", ");
  /* chips show the real file names (29 Sep 2026), exactly as the apps list them */
  var SEARCH_ALL = "the café's 3 documents";
  /* the file the app opens for a model request (the model can't send a file: it names it). Given as m.opens, or read from the request. */
  function opensOf(app, text) {
    text = String(text || "");
    if (app === "calc" && /SUM\(/.test(text)) return ["moonbean_sales_aug2026.csv"];
    if (app === "files" && /^search: /.test(text)) return [SEARCH_ALL];
    if (app === "files" && /^open: /.test(text)) { var f = /^open: ([^,(\n]+?)(?:,| \(|\n|$)/.exec(text); return f ? [f[1].trim()] : null; }
    if (app === "maker") { var src = / from (\S+\.(?:csv|pdf|docx))/.exec(text), chk = /^open file: (\S+)/.exec(text); return src ? [src[1]] : chk ? [chk[1]] : null; }
    return null;
  }

  /* opts: { apps: ["calc", "files", ...], humanName, modelName, filesBase ("files/"), compactAt (px) } */
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
      var c = appChips[a], bar = c && c.parentNode;   // the chips are one row: keep the open app's chip in view
      if (bar) { var cr = c.getBoundingClientRect(), br = bar.getBoundingClientRect();
        if (cr.width && (cr.left < br.left || cr.right > br.right)) bar.scrollLeft += cr.left - br.left - 8; }
    }
    function bump(k) {
      if (k === active) return;
      var n = Number(badge[k].textContent || 0) + 1;
      badge[k].textContent = String(n); badge[k].classList.remove("hidden");
    }
    function scroll(el) { try { el.scrollTop = el.scrollHeight; } catch (e) { /* hidden */ } }

    function fileChip(name) {
      var real = REAL_FILES.indexOf(name) >= 0;
      var label = "📎 " + name;
      return real ? h("a", { class: "b-file", href: (opts.filesBase || "files/") + name, target: "_blank", rel: "noopener", title: name + " (opens the real file)", text: label })
        : h("span", { class: "b-file", title: name, text: label });
    }
    function openChip(name) {
      var real = REAL_FILES.indexOf(name) >= 0, label = "📂 " + (name === SEARCH_ALL ? "searches: " : "opens: ") + name;
      return real ? h("a", { class: "b-file b-open", href: (opts.filesBase || "files/") + name, target: "_blank", rel: "noopener", title: "The app opens " + name + " from the shared folder (the model only names it)", text: label })
        : h("span", { class: "b-file b-open", title: name === SEARCH_ALL ? "Moonbean_staff_handbook.pdf, Moonbean_menu_2026.docx, Supplier_letter_Aug2026.pdf" : name, text: label });
    }
    function content(m) {
      var base = m.el ? (typeof m.el === "function" ? m.el() : m.el.cloneNode(true))
        : m.kind === "call" ? h("code", { class: "ph-code", text: m.text }) : m.text ? h("span", { text: m.text }) : null;
      if (!m.files && !m.attach && !m.opens) return base || h("span", { text: "" });
      if (m.opens) return h("span", { class: "b-body" }, base, h("span", { class: "b-files" }, m.opens.map(openChip)));
      // a message with files: the text, then the 📎 files shared (Ploy) or the file card sent (the model's reply)
      return h("span", { class: "b-body" }, base, m.files ? h("span", { class: "b-files" }, m.files.map(fileChip)) : null, m.attach ? m.attach() : null);
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
      var cls2 = "";
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
        if (m.safer) cls2 = " b-safer";
        if (m.opens === undefined) { var op = opensOf(toApp, m.text); if (op) m = Object.assign({}, m, { opens: op }); }
        var tag = m.safer ? " (safer agent, not in the recording)" : "";
        put("model", bubble("right", Object.assign({ kind: "call" }, m), "→ " + APPS[toApp].icon + " " + APPS[toApp].name + tag, "c-model" + cls2));
        put("apps", bubble("left", Object.assign({ kind: "call" }, m), "🤖 Model" + tag, "c-model" + cls2), appThreads[toApp]);
        showApp(toApp);
      } else if (fromApp) {
        var tag2 = m.safer ? " (safer agent, not in the recording)" : "", c3 = m.safer ? " b-safer" : "";
        put("apps", bubble("right", Object.assign({ kind: "result" }, m), APPS[fromApp].name + tag2, "c-app" + c3), appThreads[fromApp]);
        put("model", bubble("left", Object.assign({ kind: "result" }, m), APPS[fromApp].icon + " " + APPS[fromApp].name + tag2, "c-app" + c3));
        showApp(fromApp);
      }
    }
    /* a small grey note in the Model phone (e.g. what the harness adds before the chat) */
    function note(text, k) { put(k || "model", h("p", { class: "ph-note", text: text })); }
    /* once per chat, before Ploy's first message: where the café's files are */
    var folderShown = false;
    function folder() { if (!folderShown) { folderShown = true; note(FOLDER_NOTE); } }

    /* the newest message the model received (for the "in your phone" reminder under the chat on small screens) */
    function lastIn() { var l = ph.model.body.querySelectorAll(".b.left"); return l.length ? l[l.length - 1] : null; }
    return { el: wrap, add: add, folder: folder, apps: apps, lastIn: lastIn, note: note, show: show, showApp: showApp, phones: ph, threads: appThreads };
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

  root.AGENT_PHONES = { Phones: Phones, replay: replay, APPS: APPS, WHO: WHO, FOLDER: FOLDER, FOLDER_NOTE: FOLDER_NOTE };
})(typeof window !== "undefined" ? window : globalThis);
