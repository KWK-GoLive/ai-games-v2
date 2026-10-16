/*
 * AI games v2.1 PREVIEW · Agent Arena: one task from Ploy, 10 timed steps. You are the model in the middle of the 3 chats.
 * The chats keep growing from step to step; after each step the story carries on with the right move.
 * Step 8 shows the toy context window as it was when the memo was written (step 6): Ploy's first message had slid out (greyed).
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, R = window.AGENT_ARENA, PH = window.AGENT_PHONES, DR = window.AGENT_DRAW, T = window.AGENT_TOOLS, V = window.VIS;
  var TEST = /[?&]test=1\b/.test(location.search) && /^(localhost|127\.0\.0\.1|)$/.test(location.hostname);
  var SKILL = { "app-vat": "Which app?", source: "Check the source", "app-total": "Which app?", "app-letter": "Which app?", inject: "Hidden orders", "app-memo": "Which app?",
    check: "Check what it really did", window: "Context window", perm: "Permissions", reply: "Reply" };

  function memoCard(text) {
    var lines = text.split("\n");
    return function () {
      var blocks = [{ h1: "Memo" }].concat(lines.map(function (p) { return { p: p }; }));
      var bytes = T.F.docx(blocks);
      return V.fileActions({ name: "Owner_memo.docx", spec: { type: "docx", blocks: blocks }, note: "made by the File maker",
        download: function () { T.F.download(bytes, "Owner_memo.docx", T.F.DOCX_MIME); } });
    };
  }
  function make(rng) {
    var S = R.steps(rng);
    return S.map(function (st, si) {
      return {
        title: "Step " + (si + 1) + " of " + S.length + ": " + st.title, limit: st.limit, key: st.key,
        skill: SKILL[st.id] || "Which app?",
        hint: st.hint,
        grade: function (a) { return R.grade(st, a); },
        solve: function () { return st.key; },
        render: function (box, api) {   // on short screens, show the first move below the chat history
          var ctl = this.renderStep(box, api), first = box.querySelector(".move");
          if (first) A.showFirst(box.firstChild, first);
          return ctl;
        },
        renderStep: function (box, api) {
          var holder = h("div"); box.appendChild(holder);
          var P = PH.Phones(holder, { apps: ["calc", "web", "files", "maker"] });
          P.folder();   // the café's files are in the shared folder: Ploy attaches nothing
          var msgs = R.chatBefore(S, si), bubbles = [];
          msgs.forEach(function (m) {
            P.add(m.file ? Object.assign({}, m, { el: memoCard(m.file === "ok" ? R.MEMO_OK : R.MEMO_BAD) }) : m);
            var l = P.phones.model.body.querySelectorAll(".b"); bubbles.push(l[l.length - 1]);
          });
          if (st.window) {
            // the window as it was when the model wrote the memo (step "app-memo"): only Ploy's first message had slid out
            var mi = S.map(function (x) { return x.id; }).indexOf("app-memo"), atMemo = R.chatBefore(S, mi), size = R.windowSize(S);
            var used = atMemo.reduce(function (a, m) { return a + window.AGENT_WINDOW.words(m.text); }, 0);
            DR.markOut(P, bubbles, window.AGENT_WINDOW.firstInside(atMemo, size));
            P.note("Toy context window: " + size + " words. When you wrote the memo (step " + (mi + 1) + "), the chat already had " + used + " words, so Ploy's first message had slid out (greyed above).");
            P.show("model");
          }
          if (TEST) window.AGENT_STEP = st;
          var ch = DR.choices(st.options, function (v) {
            // the final reply goes to Ploy, with the memo file attached
            if (st.id === "reply") P.add({ from: "model", to: "human", text: st.options.filter(function (o) { return o.value === v; })[0].label, attach: memoCard(R.MEMO_OK) });
            api.submit(v);
          }, { oneCol: true });
          box.appendChild(DR.move(1, st.title, st.window ? h("div", { class: "stack" }, h("p", { class: "fix-case", text: "Greyed in your Model phone (slid out): Ploy's first message, “" + R.TASK + "”" }), ch.el) : ch.el, st.window ? "Your move: look into your context window" : null));
          return { collect: function () { return null; }, reveal: function () { ch.mark(st.key); } };
        }
      };
    });
  }

  A.start({
    game: "agentfinal21",
    kicker: "Part 2 · final · v2.1 preview",
    title: "The Agent Arena v2.1",
    intro: [
      "One real task from Ploy, in 10 timed steps. You are the model: choose the apps, check the source, spot a hidden order, check your work, keep track of your context window, ask before acting, and reply.",
      "After each step the story carries on with the right move, so one slip doesn't spoil the rest."
    ],
    minutes: "10–15",
    stages: [
      { id: "task", icon: "🏁", name: "Ploy's memo", make: make,
        goal: "Ploy: “" + R.TASK + "”",
        rules: ["Each step has its own timer and one mark.", "Only Ploy gives orders. Ask before sending anything.", "Check the source, and check what really happened before you say “done”.", "Step 8: the greyed message in your Model phone had slid out of your context window when you wrote the memo."],
        lesson: "That's a whole agent loop: choose the tools, check the results and the sources, stay safe, keep track of what you can still see, and report honestly." }
    ],
    finalCard: function () {
      return h("section", { class: "card soft stack" }, h("div", { class: "kicker", text: "Well done" }), h("h2", { text: "You've played every part of an AI agent." }),
        h("div", { class: "row end" }, h("a", { class: "btn", href: "../index.html", text: "v2.1 preview" })));
    }
  });
})();
