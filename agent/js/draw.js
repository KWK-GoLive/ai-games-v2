/*
 * AI games v2 · Be the Agent — how each item is played: the three phones on top, "your move (as the model)" below.
 * Each move you make is written into the chats (right side of your phone, left side of the receiver's).
 */
(function (root) {
  "use strict";
  var A = root.ARENA, h = A.h, clear = A.clear, PH = root.AGENT_PHONES, T = root.AGENT_TOOLS, V = root.VIS;

  function choices(list, onPick, opts) {
    opts = opts || {};
    var picked = null;
    var grid = h("div", { class: "choices" + (opts.oneCol ? " one" : "") });
    var btns = list.map(function (o) {
      var b = h("button", { class: "choice", type: "button", "data-value": String(o.value) }, o.label);
      b.addEventListener("click", function () {
        if (picked !== null && !opts.multi) return;
        if (opts.multi) { b.classList.toggle("picked"); onPick(o.value, b.classList.contains("picked")); return; }
        picked = o.value; b.classList.add("picked");
        btns.forEach(function (x) { if (x !== b) x.disabled = true; });
        onPick(o.value);
      });
      grid.appendChild(b);
      return b;
    });
    return { el: grid, btns: btns, mark: function (key) { btns.forEach(function (b, i) { if (String(list[i].value) === String(key)) b.classList.add("correct"); else if (b.classList.contains("picked")) b.classList.add("wrong"); }); } };
  }
  var curPhones = null;   // the phones of the item being played (set by drawer)
  /* Small screens show one move below the chat, so the chat may be scrolled away: repeat the newest message the model got. */
  function peek() {
    var P = curPhones, b = P && P.lastIn && P.lastIn();
    if (!b) return null;
    var from = b.querySelector(".b-from"), txt = b.textContent.slice(from ? from.textContent.length : 0).trim();
    if (!txt && b.querySelector(".v-file")) txt = "a file card (View / Download are in your phone)";
    var go = h("button", { class: "btn ghost small", type: "button", text: "↑ Show my phone" });
    go.addEventListener("click", function () { P.show("model"); P.el.scrollIntoView({ block: "start", behavior: "smooth" }); });
    return h("div", { class: "ph-peek", role: "note" }, h("div", { class: "small muted", text: "Newest in your phone" + (from ? " — " + from.textContent : "") + ":" }),
      h("div", { class: "ph-peek-t", text: txt.length > 320 ? txt.slice(0, 317) + "…" : txt }), go);
  }
  function move(n, title, body) {
    var el = h("div", { class: "move stack" }, h("div", { class: "kicker", text: "Your move " + n + " (as the model)" }), h("h3", { text: title }), n > 1 ? peek() : null, body);
    if (n > 1) setTimeout(function () { A.reveal(el); }, 0);   // phones: the next move appears below; bring it into view
    return el;
  }
  function hitsEl(list) { return function () { return h("span", {}, list.map(function (x, i) { return h("span", { class: i ? "ph-hit" : "" }, h("b", { text: x.head }), " " + x.body); })); }; }

  /* a made file as a card (view / download), for the File maker's result and for the reply that sends it to Ploy */
  function fileCard(f, note) {
    var spec = f.preview.kind === "sheet" ? { type: "xlsx", sheets: [{ name: "Sheet1", rows: f.preview.rows }] } : { type: "docx", blocks: [{ h1: f.preview.title }].concat(f.preview.paragraphs.map(function (p) { return { p: p }; })) };
    return function () { return V.fileActions({ name: f.name, spec: spec, note: note, download: function () { T.F.download(f.bytes, f.name, f.mime); } }); };
  }
  /* Ploy's request, with the café files she shares (📎) */
  /* Ploy's message: the café's own files are already in the shared folder (shown once as a note), so she attaches only a NEW file */
  function ask(P, it) {
    if (P.folder) P.folder();
    var fresh = (it.files || []).filter(function (f) { return root.AGENT_PHONES.FOLDER.indexOf(f) < 0; });
    P.add({ from: "human", to: "model", text: it.ask, files: fresh.length ? fresh : null });
  }

  /* ---------- Stage 1: which app? ---------- */
  function drawToolpick(it, box, api, P) {
    var ans = {};
    ask(P, it);
    var step2 = h("div");
    var made = it.madeFile ? T.makeFile(root.AGENT_ITEMS.spec(it.madeFile.type, it.madeFile.name, it.madeFile.content)) : null;
    var c1 = choices(it.tools, function (v) {
      ans.tool = v;
      if (v !== it.tool) {
        var asked = v === "none" ? "✗ You chose to answer yourself." : "✗ You asked the " + root.AGENT_PHONES.APPS[v].name + ".";
        P.note(it.tool === "none" ? asked + " The right move was to answer yourself: no app was needed here."
          : asked + " Teacher's replay (not your move): this is what the right app would send back.");
      }
      (it.calls || []).forEach(function (c, i) {
        P.add({ from: "model", to: it.tool, text: c[0] });
        P.add({ from: it.tool, to: "model", text: c[1], el: made && i === 0 ? function () { return h("span", { class: "b-body" }, h("span", { text: c[1] }), fileCard(made, "made by the File maker")()); } : null });
      });
      step2.appendChild(move(2, it.tool === "none" ? "Now write your reply to Ploy." : "The app sent its result (see your phone). Now reply to Ploy.",
        (c2 = choices(it.replies, function (r) {
          ans.reply = r;
          var label = it.replies.filter(function (x) { return x.value === r; })[0].label;
          P.add({ from: "model", to: "human", text: label, attach: made && /^Done/.test(label) ? fileCard(made, "sent to Ploy") : null });   // the file goes with the reply
          api.submit(ans);
        }, { oneCol: true })).el));
    });
    var c2 = null;
    box.appendChild(move(1, "Which app do you ask?", c1.el));
    box.appendChild(step2);
    return { collect: function () { return ans; }, reveal: function () { c1.mark(it.key.tool); if (c2) c2.mark(it.key.reply); } };
  }

  /* ---------- Stage 2: file search ---------- */
  function drawFilesearch(it, box, api, P) {
    var ans = { words: [] }, sel = [], searches = 0, hits = [];
    ask(P, it);
    var status = h("p", { class: "small muted", text: "Tap 1 to 3 words, then Search." });
    var go = h("button", { class: "btn primary", type: "button", text: "🔍 Search", disabled: true });
    var c1 = choices(it.chips.map(function (w) { return { value: w, label: w }; }), function (v, on) {
      if (on) { if (sel.length >= 3) { c1.btns.filter(function (b) { return b.getAttribute("data-value") === v; })[0].classList.remove("picked"); return; } sel.push(v); }
      else sel = sel.filter(function (x) { return x !== v; });
      go.disabled = !sel.length; status.textContent = sel.length ? "Search for: " + sel.join(" ") : "Tap 1 to 3 words, then Search.";
    }, { multi: true });
    var step2 = h("div"), step3 = h("div");
    go.addEventListener("click", function () {
      if (!sel.length) return;
      searches++; ans.words = sel.slice();
      hits = it.search(sel);
      P.add({ from: "model", to: "files", text: "search: " + sel.join(" ") });
      P.add({ from: "files", to: "model", text: hits.length ? "" : "No matching pieces.", el: hits.length ? hitsEl(hits.map(function (x, i) { return { head: (i + 1) + ". " + x.where + ", “" + x.piece.title + "”:", body: x.piece.text.slice(0, 60) + "… (matched: " + x.matched.join(", ") + ")" }; })) : null });
      clear(step2);
      if (!hits.length) { step2.appendChild(h("p", { class: "feedback bad", text: "Nothing found. Try other words." })); return; }
      if (searches >= 2) { go.disabled = true; c1.btns.forEach(function (b) { b.disabled = true; }); }
      var c2 = choices(hits.map(function (x) { return { value: x.piece.id, label: x.where + ": “" + x.piece.title + "”" }; }), function (id) {
        ans.open = id;
        go.disabled = true; c1.btns.forEach(function (b) { b.disabled = true; });
        var p = T.piece(id);
        P.add({ from: "model", to: "files", text: "open: " + T.where(p) });
        P.add({ from: "files", to: "model", text: "“" + p.title + "”: " + p.text });
        step3.appendChild(move(3, "Reply to Ploy (and say where it came from).", (c3 = choices(it.answers, function (r) {
          ans.answer = r; P.add({ from: "model", to: "human", text: it.answers.filter(function (x) { return x.value === r; })[0].label }); api.submit(ans);
        }, { oneCol: true })).el));
      }, { oneCol: true });
      step2.appendChild(move(2, "Which piece do you open and read?", h("div", { class: "stack" }, searches < 2 ? h("p", { class: "small muted", text: "Not the right piece? You may search once more with other words." }) : null, c2.el)));
      step2.c2 = c2;
    });
    var c3 = null;
    box.appendChild(move(1, "Choose your search words.", h("div", { class: "stack" }, c1.el, h("div", { class: "row" }, status, h("span", { style: "flex:1" }), go))));
    box.appendChild(step2); box.appendChild(step3);
    return { collect: function () { return ans; }, reveal: function () { if (step2.c2) step2.c2.mark(it.key.piece); if (c3) c3.mark(it.key.answer); } };
  }

  /* ---------- Stage 3: web search ---------- */
  function drawWebsearch(it, box, api, P) {
    var ans = {};
    ask(P, it);
    var step2 = h("div"), step3 = h("div"), c2 = null, c3 = null;
    var c1 = choices(it.queries.map(function (q) { return { value: q, label: "🔍 " + q }; }), function (q) {
      ans.query = q;
      var hits = it.search(q);
      P.add({ from: "model", to: "web", text: "search the web: " + q });
      P.add({ from: "web", to: "model", text: hits.length ? "" : "No results.", el: hits.length ? hitsEl(hits.map(function (x, i) { return { head: (i + 1) + ". " + x.page.title, body: "(" + x.page.site + ", " + x.page.date + ") " + x.snippet }; })) : null });
      if (!hits.length) { step2.appendChild(h("p", { class: "feedback bad", text: "No results for that search." })); api.submit(ans); return; }
      c2 = choices(hits.map(function (x) { return { value: x.page.id, label: h("span", {}, h("b", { text: x.page.title }), h("br"), h("span", { class: "small muted", text: x.page.site + " · " + x.page.who + " · " + x.page.date })) }; }), function (id) {
        ans.open = id;
        var pg = T.page(id);
        P.add({ from: "model", to: "web", text: "open page: " + pg.url });
        P.add({ from: "web", to: "model", text: pg.title + " (" + pg.site + ", " + pg.who + ", " + pg.date + "):\n" + pg.text });
        step3.appendChild(move(3, "Reply to Ploy, with the source.", (c3 = choices(it.answers, function (r) {
          ans.answer = r; P.add({ from: "model", to: "human", text: it.answers.filter(function (x) { return x.value === r; })[0].label }); api.submit(ans);
        }, { oneCol: true })).el));
      }, { oneCol: true });
      step2.appendChild(move(2, "Which page do you open? (Look at who wrote it and when.)", c2.el));
    }, { oneCol: true });
    box.appendChild(move(1, "What do you search for?", c1.el));
    box.appendChild(step2); box.appendChild(step3);
    return { collect: function () { return ans; }, reveal: function () { c1.mark(it.key.query); if (c2) c2.mark(it.key.page); if (c3) c3.mark(it.key.answer); } };
  }

  /* ---------- Stage 4: calculator ---------- */
  function drawCalc(it, box, api, P) {
    var ans = { tokens: [] };
    if (P.folder) P.folder();
    if (it.show === "rows") {
      var rows = T.totals().rows.filter(function (r) { return r.item === it.rowsItem; });
      P.note("Earlier in this chat you looked at the " + it.rowsItem + " rows of the sales file:\n" + rows.map(function (r) { return r.date + "  " + r.item + "  " + r.qty + " × " + r.price + " = " + r.total; }).join("\n"));
    }
    if (it.dayTotals) P.note("Earlier in this chat: sales per day\n" + it.dayTotals.map(function (d) { return d[0] + ": " + T.fmt(d[1]); }).join("\n"));
    ask(P, it);
    var line = h("div", { class: "built", "aria-live": "polite" });
    function paint() { line.textContent = ans.tokens.length ? ans.tokens.join(" ") : "(tap below)"; }
    paint();
    var tiles = h("div", { class: "tiles" }, it.chips.map(function (c) {
      var b = h("button", { class: "tile", type: "button", text: c });
      b.addEventListener("click", function () { if (ans.tokens.length < 9) { ans.tokens.push(c); paint(); } });
      return b;
    }));
    var undo = h("button", { class: "btn small", type: "button", text: "⌫ Undo" });
    undo.addEventListener("click", function () { ans.tokens.pop(); paint(); });
    var send = h("button", { class: "btn primary", type: "button", text: "Send to 🧮 Calculator" });
    var step2 = h("div"), c2 = null;
    send.addEventListener("click", function () {
      if (!ans.tokens.length) return;
      send.disabled = true; undo.disabled = true; Array.prototype.forEach.call(tiles.children, function (b) { b.disabled = true; });
      var r = it.run(ans.tokens);
      P.add({ from: "model", to: "calc", text: ans.tokens.join(" ") });
      P.add({ from: "calc", to: "model", text: r.text });
      step2.appendChild(move(2, "Reply to Ploy.", (c2 = choices(it.replies, function (v) { ans.reply = v; P.add({ from: "model", to: "human", text: "It's " + T.fmt(Number(v)) + " " + (it.unit || "baht") + "." }); api.submit(ans); })).el));
    });
    box.appendChild(move(1, "Write your request to the Calculator.", h("div", { class: "stack" }, line, tiles, h("div", { class: "row" }, undo, h("span", { style: "flex:1" }), send))));
    box.appendChild(step2);
    return { collect: function () { return ans; }, reveal: function () { if (c2) c2.mark(it.key.reply); } };
  }

  /* ---------- Stage 5: file maker ---------- */
  function drawMaker(it, box, api, P) {
    var ans = {};
    ask(P, it);
    var send = h("button", { class: "btn primary", type: "button", text: "Send to 🗂️ File maker", disabled: true });
    function ready() { send.disabled = !(ans.type && ans.name && ans.content); }
    function group(title, list, key) {
      var c = choices(list, function (v) { ans[key] = v; ready(); });
      return { el: h("div", { class: "stack" }, h("b", { text: title }), c.el), c: c };
    }
    var g1 = group("File type", it.types.map(function (t) { return { value: t, label: "." + t + (t === "xlsx" ? " (Excel)" : t === "docx" ? " (Word)" : " (plain rows)") }; }), "type");
    var g2 = group("File name", it.names.map(function (n) { return { value: n, label: n }; }), "name");
    var g3 = group("What goes in it", it.contents, "content");
    var step2 = h("div"), c4 = null;
    send.addEventListener("click", function () {
      send.disabled = true;
      var f = it.make(ans);
      var label = it.contents.filter(function (x) { return x.value === ans.content; })[0].label;
      var C = root.AGENT_ITEMS.CONTENTS[ans.content], src = C.source || T.D.salesFile, table = !!C.rows && ans.type !== "docx";
      var n = C.rows ? C.rows().length - 1 : 0;
      // instruct, then check: the model says what to take from which file; the app reports what it made; the model opens it to check
      P.add({ from: "model", to: "maker", text: "make file: " + f.name + " from " + src + "\ncontents: " + label });
      P.add({ from: "maker", to: "model", text: "", el: function () { return h("span", { class: "b-body" }, h("span", { text: "✅ " + f.name + " made" + (table ? ": " + n + " row" + (n === 1 ? "" : "s") + " (+ a header row)." : ".") }), fileCard(f, "made by the File maker")()); } });
      P.add({ from: "model", to: "maker", text: "open file: " + f.name + " (check it)" });
      P.add({ from: "maker", to: "model", text: C.rows ? f.name + ":\n" + root.AGENT_ITEMS.checkText(ans.content, ans.type) : f.name + " says: " + C.paragraphs.join(" ") });
      var replies = it.replies.map(function (x) { return { value: x.value, label: it.replyLabel(x.value, ans) }; });
      step2.appendChild(move(2, "You opened the file to check it (👁 View here in your phone too). Now reply to Ploy.", (c4 = choices(replies, function (v) {
        ans.reply = v; P.add({ from: "model", to: "human", text: replies.filter(function (x) { return x.value === v; })[0].label, attach: fileCard(f, "sent to Ploy") }); api.submit(ans);
      }, { oneCol: true })).el));
    });
    box.appendChild(move(1, "Tell the File maker what to make.", h("div", { class: "stack" }, g1.el, g2.el, g3.el, h("div", { class: "row end" }, send))));
    box.appendChild(step2);
    return { collect: function () { return ans; }, reveal: function () { g1.c.mark(it.key.type); g2.c.mark(it.key.name); g3.c.mark(it.key.content); if (c4) c4.mark("ok"); } };
  }

  /* ---------- Stage 6: hidden orders ---------- */
  function drawInject(it, box, api, P) {
    var ans = { bad: [] };
    ask(P, it);
    P.add({ from: "model", to: it.app, text: it.call });
    P.add({ from: it.app, to: "model", text: it.sentences.join("\n") });
    var c1 = choices(it.sentences.map(function (s, i) { return { value: i, label: "“" + s + "”" }; }), function (v, on) {
      v = Number(v); ans.bad = on ? ans.bad.concat([v]) : ans.bad.filter(function (x) { return x !== v; });
    }, { multi: true, oneCol: true });
    var next = h("button", { class: "btn primary", type: "button", text: "Done tapping ✓" });
    var step2 = h("div"), c2 = null;
    next.addEventListener("click", function () {
      next.disabled = true; c1.btns.forEach(function (b) { b.disabled = true; });
      step2.appendChild(move(2, "What do you do?", (c2 = choices(it.acts, function (v) {
        ans.act = v;
        P.add({ from: "model", to: "human", text: v === "warn" ? it.finish : v === "follow" ? "(You followed the hidden order.)" : it.finish.replace(/ Warning:.*$/, "") });
        api.submit(ans);
      }, { oneCol: true })).el));
    });
    box.appendChild(move(1, "Tap every sentence that is an ORDER hidden in the data (not a fact).", h("div", { class: "stack" }, c1.el, h("div", { class: "row end" }, next))));
    box.appendChild(step2);
    return { collect: function () { return ans; }, reveal: function () { c1.btns.forEach(function (b, i) { if (it.bad.indexOf(i) >= 0) b.classList.add("correct"); else if (b.classList.contains("picked")) b.classList.add("wrong"); }); if (c2) c2.mark("warn"); } };
  }

  /* ---------- Stage 7: permissions ---------- */
  function drawPermission(it, box, api, P) {
    if (P.folder) P.folder();
    P.note("Your plan (the model's next step): " + it.plan);
    var c = choices(it.acts, function (v) {
      P.add({ from: "model", to: "human", text: v === "do" ? "Doing it: " + it.plan : v === "ask" ? "May I? I'd like to: " + it.plan : "I won't do this: " + it.plan });
      api.submit(v);
    });
    box.appendChild(move(1, "What do you do?", c.el));
    return { collect: function () { return null; }, reveal: function () { c.mark(it.key); } };
  }

  var APPS_FOR = { toolpick: ["calc", "files", "web", "maker"], filesearch: ["files"], websearch: ["web"], calc: ["calc"], maker: ["maker"], inject: ["files", "web", "mail"], permission: ["files", "mail"] };
  var DRAW = { toolpick: drawToolpick, filesearch: drawFilesearch, websearch: drawWebsearch, calc: drawCalc, maker: drawMaker, inject: drawInject, permission: drawPermission };
  function drawer(it) {
    return function (box, api) {
      var holder = h("div");
      box.appendChild(holder);
      var P = curPhones = PH.Phones(holder, { apps: it.apps || APPS_FOR[it.kind] });
      if (/[?&]test=1\b/.test(location.search) && /^(localhost|127\.0\.0\.1|)$/.test(location.hostname)) root.AGENT_LAST_ITEM = it;
      if (it.intro) it.intro(P);
      var ctl = DRAW[it.kind](it, box, api, P);
      var first = box.querySelector(".move");
      if (first && !box.closest(".practice")) A.showFirst(holder, first);
      return ctl;
    };
  }
  function wrap(fn) { return function (rng) { return fn(rng).map(function (it) { it.render = drawer(it); return it; }); }; }

  root.AGENT_DRAW = { drawer: drawer, wrap: wrap, choices: choices, move: move, fileCard: fileCard, DRAW: DRAW, APPS_FOR: APPS_FOR };
})(typeof window !== "undefined" ? window : globalThis);
