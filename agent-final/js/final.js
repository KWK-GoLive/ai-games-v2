/*
 * AI games v2 · Agent Arena: one task from Ploy, 12 timed steps. You are the model in the middle of the 3 chats.
 * The chats keep growing from step to step; after each step the story carries on with the right move.
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, R = window.AGENT_ARENA, PH = window.AGENT_PHONES, DR = window.AGENT_DRAW, T = window.AGENT_TOOLS, V = window.VIS;
  var TEST = /[?&]test=1\b/.test(location.search) && /^(localhost|127\.0\.0\.1|)$/.test(location.hostname);

  function memoCard(text) {
    return function () {
      var bytes = T.F.docx([{ h1: "Memo for the owner" }, { p: text }]);
      return V.fileActions({ name: "Owner_memo.docx", spec: { type: "docx", blocks: [{ h1: "Memo for the owner" }, { p: text }] }, note: "made by the File maker",
        download: function () { T.F.download(bytes, "Owner_memo.docx", T.F.DOCX_MIME); } });
    };
  }
  function make(rng) {
    var S = R.steps(rng);
    return S.map(function (st, si) {
      return {
        title: "Step " + (si + 1) + " of " + S.length + ": " + st.title, limit: st.limit, key: st.kind === "calc" ? st.solution : st.key,
        skill: st.kind === "calc" ? "Calculator" : st.kind === "search" ? "File search" : /query|open/.test(st.id) ? "Web search" : st.id === "inject" ? "Hidden orders" : st.id === "perm" ? "Permissions" : st.id === "memo" ? "File maker" : st.id === "reply" ? "Reply" : "Which app?",
        hint: st.hint,
        grade: function (a) { return R.grade(st, a); },
        solve: function () { return st.kind === "calc" ? st.solution : st.kind === "search" ? ["coffee", "price"] : st.key; },
        render: function (box, api) {   // on short screens, show the first move below the chat history
          var ctl = this.renderStep(box, api), first = box.querySelector(".move");
          if (first) A.showFirst(box.firstChild, first);
          return ctl;
        },
        renderStep: function (box, api) {
          var holder = h("div"); box.appendChild(holder);
          var P = PH.Phones(holder, { apps: ["calc", "web", "files", "maker"], filesBase: "../agent/files/" });
          P.folder();   // the café's files are in the shared folder: Ploy attaches nothing
          P.add({ from: "human", to: "model", text: R.TASK });
          for (var j = 0; j < si; j++) S[j].after.forEach(function (m) { P.add(m.file ? Object.assign({}, m, { el: memoCard(S[j].memo) }) : m); });
          if (TEST) window.AGENT_STEP = st;
          if (st.kind === "calc") {
            var toks = [];
            var line = h("div", { class: "built", text: "(tap below)" });
            var tiles = h("div", { class: "tiles" }, st.chips.map(function (c) {
              var b = h("button", { class: "tile", type: "button", text: c });
              b.addEventListener("click", function () { if (toks.length < 9) { toks.push(c); line.textContent = toks.join(" "); } });
              return b;
            }));
            var undo = h("button", { class: "btn small", type: "button", text: "⌫ Undo" });
            undo.addEventListener("click", function () { toks.pop(); line.textContent = toks.length ? toks.join(" ") : "(tap below)"; });
            var send = h("button", { class: "btn primary", type: "button", text: "Send to 🧮 Calculator" });
            send.addEventListener("click", function () {
              if (!toks.length) return;
              P.add({ from: "model", to: "calc", text: toks.join(" ") });
              P.add({ from: "calc", to: "model", text: window.AGENT_ITEMS.evalChips(toks).text });
              api.submit(toks.slice());
            });
            box.appendChild(DR.move(1, st.title, h("div", { class: "stack" }, line, tiles, h("div", { class: "row" }, undo, h("span", { style: "flex:1" }), send))));
            return { collect: function () { return toks.slice(); } };
          }
          if (st.kind === "search") {
            var sel = [];
            var go = h("button", { class: "btn primary", type: "button", text: "🔍 Search", disabled: true });
            var c = DR.choices(st.chips.map(function (w) { return { value: w, label: w }; }), function (v, on) {
              if (on && sel.length >= 3) { c.btns.filter(function (b) { return b.getAttribute("data-value") === v; })[0].classList.remove("picked"); return; }
              sel = on ? sel.concat([v]) : sel.filter(function (x) { return x !== v; }); go.disabled = !sel.length;
            }, { multi: true });
            go.addEventListener("click", function () {
              var hits = T.fileSearch(sel.join(" "), 3);
              P.add({ from: "model", to: "files", text: "search: " + sel.join(" ") });
              P.add({ from: "files", to: "model", text: hits.length ? hits.map(function (x, i) { return (i + 1) + ". " + x.where + ": " + x.piece.title + " (matched: " + x.matched.join(", ") + ")"; }).join("\n") : "No matching pieces." });
              api.submit(sel.slice());
            });
            box.appendChild(DR.move(1, st.title + " (1–3 words)", h("div", { class: "stack" }, c.el, h("div", { class: "row end" }, go))));
            return { collect: function () { return sel.slice(); } };
          }
          var ch = DR.choices(st.options, function (v) {
            // the final reply goes to Ploy, with the memo file attached
            if (st.id === "reply") P.add({ from: "model", to: "human", text: st.options.filter(function (o) { return o.value === v; })[0].label, attach: memoCard(S.filter(function (x) { return x.id === "memo"; })[0].memo) });
            api.submit(v);
          }, { oneCol: true });
          box.appendChild(DR.move(1, st.title, ch.el));
          return { collect: function () { return null; }, reveal: function () { ch.mark(st.key); } };
        }
      };
    });
  }

  A.start({
    game: "agentfinal",
    kicker: "Part 2 · final",
    title: "The Agent Arena",
    intro: [
      "One real task from Ploy, in 12 timed steps. You are the model: choose apps, write the requests, check what comes back, stay safe, and reply.",
      "After each step the story carries on with the right move, so one slip doesn't spoil the rest."
    ],
    minutes: "15–20",
    stages: [
      { id: "task", icon: "🏁", name: "Ploy's memo", make: make,
        goal: "Ploy: “" + R.TASK + "”",
        rules: ["Each step has its own timer.", "Calculator steps: tap the request in order; SUM(...) adds up a column of the sales file.", "Only Ploy gives orders. Ask before sending anything.", "One mark per step (the search step can give half)."],
        lesson: "That's a whole agent loop: plan, use tools, check the results, stay safe, and report honestly with sources." }
    ],
    finalCard: function () {
      return h("section", { class: "card soft stack" }, h("div", { class: "kicker", text: "Well done" }), h("h2", { text: "You've played every part of an AI agent." }),
        h("div", { class: "row end" }, h("a", { class: "btn", href: "../index.html", text: "All games" })));
    }
  });
})();
