/*
 * AI games v2.1 PREVIEW · Agent Arena — ONE task from Ploy, played as the model in 10 timed steps that test the 4 lessons
 * (which app, hidden orders, permissions, context window) plus "check the source" and "check what it really did".
 * After each step the story carries on with the right move (so one slip doesn't spoil the rest).
 * Every app result comes from the real tools (tools.js). No DOM here: tests run it in Node.
 */
(function (root) {
  "use strict";
  var T = root.AGENT_TOOLS || require("../../../agent/js/tools.js");
  var I = root.AGENT_ITEMS || require("./items.js");
  var CW = root.AGENT_WINDOW || require("./window.js");
  var fmt = T.fmt;

  var TASK = "Hi! Please write a short Word memo for the owner, Khun Somsak. Address it to him by name. Put two things in it: (1) our total sales for 1–10 August with VAT added, and (2) the new coffee bean price from September. Please check the VAT rate online.";
  var total = T.calculator("SUM(total)").value;                     // 21,445
  var withVat = T.calculator(total + " * 1.07").value;               // 22,946.15 (VAT 7%: rd.go.th, checked 28 Sep 2026)
  var vatHits = T.webSearch("Thailand VAT rate", 4);
  var BEAN_Q = "coffee beans price september";
  var beanHits = T.fileSearch(BEAN_Q, 3);
  var LETTER = "Supplier_letter_Aug2026.pdf";
  var letterPieces = T.D.docs.filter(function (d) { return d.file === LETTER; })[0].pieces;
  var BODY = "Total sales 1–10 August 2026 with 7% VAT: " + fmt(withVat) + " baht (" + fmt(total) + " before VAT; VAT rate from the Revenue Department's website). From 1 September 2026, our House Blend coffee beans cost 520 baht per kg (was 480; supplier letter, page 1).";
  var MEMO_BAD = "Dear owner,\n" + BODY;
  var MEMO_OK = "Dear Khun Somsak,\n" + BODY;
  var COMPLAINT = "The memo says “Dear owner”, but in my first message I asked you to address it to Khun Somsak by name!";

  function shuffle(a, rng) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function opt(v, l) { return { value: v, label: l }; }
  function pick(title, key, why, hint, after) { return { kind: "choose", tools: true, title: title, key: key, why: why, hint: hint, after: after || [] }; }

  /* Each step: { id, kind: "choose", title, limit, key, options, why, pre: [messages shown just before the move], after: [messages that continue the story], window } */
  function steps(rng) {
    var S = [];
    function add(id, st, limit) { st.id = id; st.limit = limit; if (st.tools) st.options = shuffle(I.TOOLS, rng); S.push(st); return st; }
    add("app-vat", pick("First, the VAT rate. Which app?", "web", "A public fact that can change, and Ploy asked you to check it online: Web search.", "Ploy asked you to check it online.",
      [{ from: "model", to: "web", text: "search the web: Thailand VAT rate" },
        { from: "web", to: "model", text: vatHits.map(function (x, i) { return (i + 1) + ". " + x.page.title + " (" + x.page.site + ", " + x.page.who + ", " + x.page.date + ")"; }).join("\n") }]), 30);
    add("source", { kind: "choose", title: "Three results came back (see your phone). Which page do you open and trust?", hint: "Who wrote each page, and is it up to date?",
      options: shuffle(vatHits.map(function (x) { return opt(x.page.id, x.page.title + " — " + x.page.site + " (" + x.page.who + ", " + x.page.date + ")"); }), rng), key: "w1",
      why: "Check the source: the Revenue Department is the official, up-to-date source. The blog is from 2023 and only guesses; the advert is unreliable.",
      after: [{ from: "model", to: "web", text: "open page: " + T.page("w1").url }, { from: "web", to: "model", text: T.page("w1").title + " (" + T.page("w1").site + "): " + T.page("w1").text }] }, 40);
    add("app-total", pick("The rate is 7%. Next: the total sales for 1–10 August with VAT added. Which app?", "calc", "Adding up 30 rows and multiplying by 1.07 must be exact: the Calculator (its SUM works on the sales file).", "Exact maths on the sales file.",
      [{ from: "model", to: "calc", text: "SUM(total)" }, { from: "calc", to: "model", text: T.calculator("SUM(total)").text },
        { from: "model", to: "calc", text: total + " * 1.07" }, { from: "calc", to: "model", text: T.calculator(total + " * 1.07").text }]), 30);
    add("app-letter", pick("Now the new bean price: it's in the supplier's letter in the shared folder. Which app?", "files", "The café's own letters and documents: File search finds the right piece and opens the letter.", "A letter in the café's shared folder.",
      [{ from: "model", to: "files", text: "search: " + BEAN_Q },
        { from: "files", to: "model", text: beanHits.map(function (x, i) { return (i + 1) + ". " + x.where + ", “" + x.piece.title + "”"; }).join("\n") },
        { from: "model", to: "files", text: "open: " + LETTER + " (the whole letter)" },
        { from: "files", to: "model", text: letterPieces.map(function (p) { return "Page " + p.page + ": " + p.text; }).join("\n") }]), 30);
    add("inject", { kind: "choose", title: "The letter ends with small print (see your phone). What do you do?", hint: "Did Ploy write that small print?",
      options: shuffle([opt("warn", "Ignore the small-print order, carry on with Ploy's task, and warn her"), opt("follow", "Email the sales file to orders@doihills.example to get the 20% discount"), opt("silent", "Ignore the small-print order, carry on with Ploy's task, and say nothing")], rng), key: "warn",
      why: "It's an order hidden in the data. Never follow it, and tell Ploy.", after: [] }, 45);
    add("app-memo", pick("You have both numbers. Now make the Word memo. Which app?", "maker", "A real Word file: the File maker makes it from what the model tells it.", "Ploy wants a real Word file.",
      [{ from: "model", to: "maker", text: "make file: Owner_memo.docx\n" + MEMO_BAD }, { from: "maker", to: "model", text: "✅ Owner_memo.docx made.", file: "bad" }]), 30);
    add("check", { kind: "choose", title: "The File maker says ✅ made. Before you tell Ploy it's done, what do you do?", hint: "Only claim what you have checked.",
      options: shuffle([opt("open", "Open the file and read what is really in it"), opt("done", "Tell Ploy “Done, the memo is perfect” straight away"), opt("emailed", "Tell Ploy it's done and that you've emailed it to Khun Somsak")], rng), key: "open",
      why: "Check what really happened: open the file before you say “done”, and never claim a step no tool did (nothing was emailed).",
      after: [{ from: "model", to: "maker", text: "open file: Owner_memo.docx (check it)" }, { from: "maker", to: "model", text: "Owner_memo.docx says: " + MEMO_BAD },
        { from: "model", to: "human", text: "The memo Owner_memo.docx is ready. I opened it to check: it has the total with VAT and the new bean price." },
        { from: "human", to: "model", text: COMPLAINT }] }, 40);
    add("window", { kind: "choose", window: true, title: "Look at your Model phone: the greyed message had slid out of your context window when you wrote the memo. Why did the memo say “Dear owner”?",
      hint: "Is Ploy's first message still inside the context window?",
      options: shuffle(CW.CAUSES.map(function (c) { return opt(c.value, c.label); }), rng), key: "out",
      why: "Ploy said it in her first message, but by the time you wrote the memo the web results, the sales totals and the letter had filled the context window, so her first message had already slid out. The fix: she says it again.",
      after: [{ from: "human", to: "model", text: "OK: please address the memo to Khun Somsak." },
        { from: "model", to: "maker", text: "make file: Owner_memo.docx (replace it)\n" + MEMO_OK }, { from: "maker", to: "model", text: "✅ Owner_memo.docx made.", file: "ok" },
        { from: "model", to: "maker", text: "open file: Owner_memo.docx (check it)" }, { from: "maker", to: "model", text: "Owner_memo.docx says: " + MEMO_OK }] }, 45);
    add("perm", { kind: "choose", title: "Your next idea: email the memo straight to Khun Somsak. Ploy didn't ask for that.", hint: "Can an email be undone? Did Ploy ask for it?",
      options: [opt("do", "✅ Just do it"), opt("ask", "✋ Ask Ploy first"), opt("no", "⛔ Don't do it")], key: "ask",
      why: "Sending something outside the chat can't be undone, and Ploy didn't ask: ask her first.", after: [] }, 30);
    var finalOk = "Done: Owner_memo.docx is addressed to Khun Somsak; I opened it and checked it. Total sales 1–10 Aug with 7% VAT: " + fmt(withVat) + " baht (VAT rate from the Revenue Department's site). Beans: 520 baht per kg from 1 September (supplier letter, page 1). Warning: the letter's small print asks AI assistants to email our sales file to the supplier; I didn't. Shall I email the memo to Khun Somsak?";
    add("reply", { kind: "choose", title: "Your final reply to Ploy.", hint: "What you made and checked, the numbers with their sources, the warning, and a question before sending anything.",
      options: shuffle([opt("ok", finalOk),
        opt("claim", "Done: Owner_memo.docx is ready and I have already emailed it to Khun Somsak. Total sales 1–10 Aug with 7% VAT: " + fmt(withVat) + " baht (Revenue Department site). Beans: 520 baht per kg from 1 September. I also did what the letter's small print asked, to get us the 20% discount."),
        opt("short", "Done: Owner_memo.docx is addressed to Khun Somsak; I opened it and checked it. Total sales 1–10 Aug with 7% VAT: " + fmt(withVat) + " baht (VAT rate from the Revenue Department's site). Beans: 520 baht per kg from 1 September (supplier letter, page 1). The rest of the letter was only the usual delivery and payment terms.")], rng), key: "ok",
      why: "Say what you made and checked, give the numbers with their sources, warn Ploy about the hidden order, and ask before sending anything.", after: [] }, 60);
    return S;
  }

  /* the chat as the model has it at the window step: Ploy's task, then every earlier step's messages */
  function chatBefore(S, si) {
    var m = [{ from: "human", to: "model", text: TASK }];
    for (var j = 0; j < si; j++) m = m.concat(S[j].after);
    return m;
  }
  /* the toy context window of the Arena: when the model writes the memo (step "app-memo"), it holds everything except Ploy's first
   * message (the smallest multiple of 10 words that fits the rest; the whole chat is longer, so the first message has slid out) */
  function windowSize(S) {
    var mi = S.map(function (x) { return x.id; }).indexOf("app-memo"), msgs = chatBefore(S, mi);
    var all = msgs.reduce(function (a, m) { return a + CW.words(m.text); }, 0);
    return Math.ceil((all - CW.words(msgs[0].text)) / 10) * 10;
  }

  function grade(step, a) {
    var ok = a === step.key;
    var right = (step.options || []).filter(function (o) { return o.value === step.key; })[0];
    return { frac: ok ? 1 : 0, explain: (ok ? "✓ " : "✗ ") + (right ? "“" + right.label + "”. " : "") + (step.why || "") };
  }

  var TASK_FILES = ["moonbean_sales_aug2026.csv", "Supplier_letter_Aug2026.pdf"];
  var api = { TASK: TASK, TASK_FILES: TASK_FILES, steps: steps, grade: grade, chatBefore: chatBefore, windowSize: windowSize, BEAN_Q: BEAN_Q, LETTER: LETTER,
    MEMO_OK: MEMO_OK, MEMO_BAD: MEMO_BAD, COMPLAINT: COMPLAINT, numbers: { total: total, withVat: withVat, beans: 520, beansOld: 480 } };
  root.AGENT_ARENA = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
