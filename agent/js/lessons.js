/*
 * AI games v2 · Be the Agent — the 7 lessons before the stages. Untimed, unscored, with practice.
 * Lesson 1 replays FOUR REAL recorded runs of a Claude agent (agent/data/raw.js, copied unchanged from its transcript).
 * tests/check-agent-data.js checks that every quoted recording text really is in the raw record.
 */
(function (root) {
  "use strict";
  var RAW = root.AGENT_RAW || (typeof require !== "undefined" ? require("../data/raw.js") : null);

  /* ---------- the four real cases, simplified into the 3 phones. "q" = text that must appear in the raw record. ---------- */
  var C = RAW ? RAW.cases : {};
  function stepOf(k, i) { return C[k].steps[i]; }
  var CASES = {
    calculator: { title: "Case 1: “What were our total Latte sales?”", app: "code",
      script: [
        { from: "human", to: "model", text: "What were our total Latte sales in baht?", q: ["prompt", "What were our total Latte sales in baht?"], say: "Ploy asks. The model can't open the file itself: it can only write text." },
        { note: "Before the chat, the app also gave the model its instructions and a list of tools it may use (this recording's agent had a Code runner, file tools and web search).", say: "The harness adds this at the top of the model's chat." },
        { from: "model", to: "code", text: "Show me the first 5 rows of the sales file, and count its lines.", raw: [0], say: "The model writes a tool request. (Exact command below.)" },
        { from: "code", to: "model", text: "date,item,qty,price,total\n2026-08-01,Mocha,14,75,1050\n…\n31 lines", raw: [1], say: "The Code runner runs it and pastes the result into the model's chat." },
        { from: "model", to: "code", text: "Show me the whole file.", raw: [2] },
        { from: "code", to: "model", text: "(all 30 rows of the file)", raw: [3] },
        { from: "model", to: "code", text: "Add up the ‘total’ of every Latte row.", raw: [4], say: "It uses the tool as a calculator: exact adding by code, not by guessing." },
        { from: "code", to: "model", text: "rows: 8 sum: 8580", raw: [5], q: ["step", 5, "rows: 8 sum: 8580"] },
        { from: "model", to: "human", text: "Hi Ploy — total Latte sales for Aug 1–10 came to ฿8,580 (132 cups sold across the period).", q: ["step", 6, "Hi Ploy — total Latte sales for Aug 1–10 came to ฿8,580 (132 cups sold across the period)."], say: "The answer (8,580) comes from the tool. But look: no tool counted the 132 cups. The model did that in its head. (It's right: 12+18+20+22+12+20+13+15 = 132.)" }
      ],
      lesson: "The real agent used a code tool as its calculator. Its report also said “Cross-checked via qty×price too”, but no tool step in the log did that check (the model may have done it in its head): always check what the tools really did." },
    filesearch: { title: "Case 2: “What does our handbook say about a refund?”", app: "code",
      script: [
        { from: "human", to: "model", text: "A customer wants her money back because she doesn't like her latte. What does our handbook say we should do?", q: ["prompt", "A customer wants her money back because she doesn't like her latte. What does our handbook say we should do?"] },
        { from: "model", to: "code", text: "List the files, then turn the handbook PDF into text.", raw: [0], say: "To read a PDF it asks a tool to turn it into text." },
        { from: "code", to: "model", text: "Moonbean_staff_handbook.docx, Moonbean_staff_handbook.pdf, moonbean_sales_aug2026.csv\n… 3. Drinks that customers don't like: If a customer is unhappy with a drink, remake it once for free. We do not give cash refunds for drinks. …", raw: [1], q: ["step", 1, "If a customer is unhappy with a drink, remake it once for free. We do not give cash refunds for"], say: "The text of the handbook lands in the model's chat. Now the model can “see” it." },
        { from: "model", to: "human", text: "Hi Ploy — per section 3 of the handbook: if a customer doesn't like her drink, remake it once for free. We don't give cash refunds for drinks. If she's still not happy after the remake, call the shift manager (that's you) to handle it from there.", q: ["step", 3, "if a customer doesn't like her drink, remake it once for free. We don't give cash refunds for drinks."], say: "It answered from the handbook and said which section. It also noticed that the mug refund rule (section 4) doesn't apply." }
      ],
      lesson: "This handbook is tiny, so the agent read all of it. For big files a File search app returns only the pieces that match, because the model's chat (its window) can't hold everything. That's lesson 2." },
    websearch: { title: "Case 3: “What's the VAT rate? Add it to 8,580.”", app: "web",
      script: [
        { from: "human", to: "model", text: "What is the VAT rate in Thailand right now? Our Latte sales were 8,580 baht before VAT. How much is that with VAT added?", q: ["prompt", "What is the VAT rate in Thailand right now? Our Latte sales were 8,580 baht before VAT. How much is that with VAT added?"] },
        { note: "First the model asked for the web-search tool's instructions (a ‘ToolSearch’ tool call in the recording), and the harness sent them.", raw: [0] },
        { from: "model", to: "web", text: "Thailand VAT rate 2026 current", raw: [2], q: ["step", 2, "Thailand VAT rate 2026 current"], say: "It writes a search query. That's all a web search is, from the model's side." },
        { from: "web", to: "model", text: "9 results, titles and links only, for example:\n• Thailand Extends VAT Rate Reduction to 7% Through September 2026 (a law firm)\n• Thailand phased VAT hike to 10% by 2030 (vatcalc.com)\n• Thailand Confirms No VAT Increase, Maintains 7% Rate Until at Least 2026 (VATupdate)", raw: [5], q: ["step", 5, "Thailand Extends VAT Rate Reduction to 7% Through September 2026"], say: "Look closely: the tool sent back only titles and links. The model never opened a page." },
        { from: "model", to: "human", text: "Thailand's VAT rate is currently 7% (the government has extended the reduced rate through at least September 2026, instead of the standard 10%). … VAT (7%): 600.60 THB. Total with VAT: 9,180.60 THB", q: ["step", 6, "Total with VAT: 9,180.60 THB"], say: "It did 8,580 × 0.07 in its head (no calculator call). 600.60 is right, but a calculator is safer." }
      ],
      lesson: "We checked the rate on the official Revenue Department site: “Currently, the rate is 7 percent.” (rd.go.th, 28 Sep 2026). The extra claim “through at least September 2026” came from the titles of law-firm and news sites; we could not confirm that part on the official site. Lesson 3: check who wrote a page and when." },
    notool: { title: "Case 4: “What does CSV stand for?”", app: null,
      script: [
        { from: "human", to: "model", text: "Quick question: what does CSV stand for?", q: ["prompt", "Quick question: what does CSV stand for?"] },
        { from: "model", to: "human", text: "CSV stands for Comma-Separated Values — it's just a plain text file format where each line is a row and values are separated by commas, like a simple spreadsheet. That's the format your sales file (moonbean_sales_aug2026.csv) is in.", q: ["step", 2, "CSV stands for Comma-Separated Values"], say: "No tool at all: the model knew this from its training." }
      ],
      lesson: "Tools are for things the model can't know or can't do reliably. Everyday knowledge and writing need no app." }
  };

  var api = { CASES: CASES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window === "undefined") return;

  /* ================= browser part ================= */
  var A = root.ARENA, h = A.h, clear = A.clear, V = root.VIS, PH = root.AGENT_PHONES, T = root.AGENT_TOOLS, I = root.AGENT_ITEMS, DR = root.AGENT_DRAW;

  function rngOf(seed) { return A.makeRng(seed); }
  function stepper(box, steps, done, ctx) {
    var i = 0;
    var bar = h("div", { class: "lesson-steps", "aria-hidden": "true" }, steps.map(function () { return h("span"); }));
    var counter = h("div", { class: "small muted", "aria-live": "polite" });
    var card = h("section", { class: "card stack" });
    var nav = h("div", { class: "row end" });
    box.appendChild(h("section", { class: "card soft stack" }, bar, counter));
    box.appendChild(card); box.appendChild(nav);
    function show() {
      clear(card); clear(nav);
      Array.prototype.forEach.call(bar.children, function (s, j) { s.classList.toggle("on", j <= i); });
      counter.textContent = "Step " + (i + 1) + " of " + steps.length;
      var st = steps[i], last = i === steps.length - 1;
      var next = h("button", { class: "btn primary", type: "button", text: last ? "Start stage " + ctx.stageNo + " →" : "Next →", disabled: !!st.locked });
      var back = h("button", { class: "btn ghost", type: "button", text: "← Back", disabled: i === 0 });
      back.addEventListener("click", function () { if (i > 0) { i--; show(); ctx.top(); } });
      next.addEventListener("click", function () { if (next.disabled) return; if (last) { done(); return; } i++; show(); ctx.top(); });
      if (st.title) card.appendChild(h("h2", { text: st.title }));
      var hint = st.locked ? h("p", { class: "small muted", text: "Finish the task above to go on." }) : null;
      st.render(card, function () { next.disabled = false; if (hint) hint.remove(); });
      nav.appendChild(back); if (hint) nav.appendChild(hint); nav.appendChild(next);
    }
    show();
  }
  function recap(el, items) { el.appendChild(V.cards(items, { cols: 2 })); }

  /* A real case: replay in the 3 phones + the exact recorded steps underneath. */
  function realCase(el, key, unlock) {
    var c = CASES[key], raw = C[key];
    el.appendChild(h("p", { class: "small muted", text: "A real recording: a Claude agent (" + raw.model + "), " + RAW.meta.recorded + ". Below, the steps are shown simply; the exact commands and results are under “Show the exact recorded steps”." }));
    var holder = h("div");
    el.appendChild(holder);
    PH.replay(holder, c.script, { apps: c.app ? [c.app] : ["code"], onDone: function () { lessonNote.classList.remove("hidden"); if (unlock) unlock(); } });
    var lessonNote = h("div", { class: "card why hidden" }, h("b", { text: "What to notice: " }), c.lesson);
    el.appendChild(lessonNote);
    var det = h("details", { class: "card soft" }, h("summary", { style: "cursor:pointer;font-weight:600", text: "Show the exact recorded steps" }));
    raw.steps.forEach(function (s, i) {
      if (s.kind === "tool_use") det.appendChild(h("div", { class: "small" }, h("b", { text: (i + 1) + ". Tool request → " + s.name + ": " }), h("code", { class: "mono", text: JSON.stringify(s.input).slice(0, 600) })));
      else if (s.kind === "tool_result") det.appendChild(h("div", { class: "small" }, h("b", { text: (i + 1) + ". Result: " }), h("pre", { class: "mono", style: "white-space:pre-wrap;max-height:10em;overflow:auto;margin:0", text: String(s.content == null ? "(nothing)" : s.content).slice(0, 1500) })));
      else det.appendChild(h("div", { class: "small" }, h("b", { text: (i + 1) + ". Model text: " }), s.text));
    });
    det.appendChild(h("p", { class: "small muted", text: "‘SubagentHandback’ is how this agent handed its answer back, because it was working for another program. In a chat app, that's simply the reply." }));
    el.appendChild(det);
  }

  /* A real stage item, played untimed: feedback after each try, Try again until right (or move on). */
  function practiceItem(el, make, unlock, opts) {
    opts = opts || {};
    var tries = 0;
    var holder = h("div", { class: "stack" });
    el.appendChild(holder);
    function run() {
      clear(holder);
      tries++;
      var it = make(rngOf("practice-" + tries));
      var box = h("div", { class: "stack" });
      holder.appendChild(box);
      var fb = h("div", { class: "stack", "aria-live": "polite" });
      holder.appendChild(fb);
      var ctl = DR.drawer(it)(box, { h: h, clear: clear, submit: function (a) {
        var g = it.grade(a);
        Array.prototype.forEach.call(box.querySelectorAll(".move button, .move .tile"), function (b) { b.disabled = true; });
        if (ctl && ctl.reveal) try { ctl.reveal(a, g); } catch (e) { /* display only */ }
        clear(fb);
        fb.appendChild(h("p", { class: "feedback " + (g.frac === 1 ? "good" : "bad"), text: g.frac === 1 ? "✓ Well done!" : "Partly right (" + Math.round(g.frac * 100) + "%). Read why, then try again (or go on)." }));
        (Array.isArray(g.explain) ? g.explain : [g.explain]).forEach(function (t) { fb.appendChild(h("p", { class: "small", text: t })); });
        var again = h("button", { class: "btn", type: "button", text: "↻ Try another one" });
        again.addEventListener("click", run);
        fb.appendChild(h("div", { class: "row end" }, again));
        if (unlock) unlock();
      } });
    }
    run();
  }

  /* ======================= Lesson 1: tools, the 3 phones, 4 real cases ======================= */
  function lesson1(box, done, ctx) {
    stepper(box, [
      { title: "Three chats: Human, Model, Apps", render: function (el) {
        el.appendChild(V.cards([
          { icon: "👩", title: "Human", text: "Ploy, the café's shift manager. She types requests." },
          { icon: "🤖", title: "Model (you)", text: "The language model. It can only read text and write text." },
          { icon: "🧰", title: "Apps (the harness)", text: "The program around the model. It runs tools: Calculator, File search, Web search, File maker… and pastes their results into the model's chat." }], { cols: 3 }));
        el.appendChild(V.flow([{ icon: "👩", label: "Ploy asks" }, { icon: "🤖", label: "Model writes a tool request" }, { icon: "🧰", label: "App runs the tool" }, { icon: "🤖", label: "Model reads the result" }, { icon: "👩", label: "Model replies" }]));
        el.appendChild(h("p", { text: "Every message shows up twice: on the right in the phone that sent it, on the left in the phone that got it. The Model phone shows everything the model can see: its context window." }));
        var holder = h("div"); el.appendChild(holder);
        PH.replay(holder, [
          { from: "human", to: "model", text: "What is 1,284 × 37?", say: "Ploy's message: right side on her phone, left side on the model's phone." },
          { from: "model", to: "calc", text: "1284 * 37", say: "The model doesn't guess: it writes a request for the Calculator." },
          { from: "calc", to: "model", text: T.calculator("1284 * 37").text, say: "The harness runs the Calculator and pastes the answer into the model's chat." },
          { from: "model", to: "human", text: "1,284 × 37 = 47,508.", say: "The model replies, using the tool's result." }], { apps: ["calc"] });
      } },
      { title: "Real case 1: adding up (calculator)", locked: true, render: function (el, unlock) { realCase(el, "calculator", unlock); } },
      { title: "Real case 2: reading a PDF (file search)", locked: true, render: function (el, unlock) { realCase(el, "filesearch", unlock); } },
      { title: "Real case 3: web search", locked: true, render: function (el, unlock) { realCase(el, "websearch", unlock); } },
      { title: "Real case 4: no tool at all", locked: true, render: function (el, unlock) { realCase(el, "notool", unlock); } },
      { title: "Your turn: pick the app, then reply", locked: true, render: function (el, unlock) {
        el.appendChild(h("p", { text: "This is exactly what stage 1 asks, without the timer. Try a few." }));
        practiceItem(el, function (r) { return I.STAGES[0].make(r)[0]; }, unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "✍️", title: "The model only writes text", text: "A tool request, or a reply. It never runs anything itself." },
          { icon: "🧰", title: "The harness runs the tools", text: "and pastes the results into the model's chat (its context window)." },
          { icon: "🧭", title: "Pick the right app", text: "Exact maths → Calculator. The café's files → File search. Public facts that change → Web search. A real file → File maker. Everyday knowledge → no app." },
          { icon: "🔍", title: "Check what the tools really did", text: "In case 1 the agent's report mentioned a cross-check that isn't in the tool log." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 2: file search ======================= */
  function lesson2(box, done, ctx) {
    stepper(box, [
      { title: "Inside the File search app", render: function (el) {
        el.appendChild(V.cards([
          { icon: "✂️", title: "Files are cut into pieces", text: "Each heading and its text is one piece, labelled with its file and page (PDF) or section (Word)." },
          { icon: "🔤", title: "It matches words", text: "The search counts how many of your words each piece contains, and sends back the best few pieces." },
          { icon: "🪟", title: "Only pieces go into the chat", text: "Big files don't fit in the model's window, so the model reads the pieces, not the whole file." }], { cols: 3 }));
        var chips = ["refund", "drink", "customer", "coffee", "beans", "price", "student", "break"], sel = [];
        var out = h("div", { class: "stack" });
        var grid = DR.choices(chips.map(function (w) { return { value: w, label: w }; }), function (v, on) {
          sel = on ? sel.concat([v]) : sel.filter(function (x) { return x !== v; });
          clear(out);
          T.fileSearch(sel.join(" "), 3).forEach(function (r, i) { out.appendChild(h("div", { class: "card soft small" }, h("b", { text: (i + 1) + ". " + r.where + ", “" + r.piece.title + "”" }), " — matched: " + r.matched.join(", "))); });
          if (!sel.length) out.appendChild(h("p", { class: "small muted", text: "Tap some words." }));
        }, { multi: true });
        el.appendChild(h("p", { text: "Try it: tap words and watch which pieces come out on top." }));
        el.appendChild(grid.el); el.appendChild(out);
      } },
      { title: "Your turn: search, open, reply", locked: true, render: function (el, unlock) {
        el.appendChild(h("p", { text: "As the model: choose search words, open the right piece, then reply and say where it came from." }));
        practiceItem(el, function (r) { return I.STAGES[1].make(r)[0]; }, unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "🎯", title: "Pick telling words", text: "Words that only the right piece would contain. Common words pull up the wrong pieces." },
          { icon: "📖", title: "Open before you answer", text: "The snippet may be cut short. Read the whole piece." },
          { icon: "📌", title: "Say where it came from", text: "File and page, so Ploy can check it." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 3: web search ======================= */
  function lesson3(box, done, ctx) {
    stepper(box, [
      { title: "Inside the Web search app", render: function (el) {
        el.appendChild(V.cards([
          { icon: "🔍", title: "Search gives titles and snippets", text: "Just like case 3: the real agent got only titles and links back." },
          { icon: "📄", title: "Open a page to read it", text: "A second request (“open page”) brings the page's text into the chat." },
          { icon: "🧐", title: "Who wrote it? When?", text: "An official or first-hand page that is up to date beats a blog, an advert or an old forum post. The top result isn't always the best." }], { cols: 3 }));
        el.appendChild(h("p", { class: "small muted", text: "In this game the web is a small made-up internet of 10 pages. Only the Revenue Department page is real (its sentence is quoted from rd.go.th, checked 28 Sep 2026)." }));
      } },
      { title: "Your turn: search, choose a page, reply", locked: true, render: function (el, unlock) {
        practiceItem(el, function (r) { return I.STAGES[2].make(r)[0]; }, unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "🏛️", title: "Prefer official, first-hand, recent", text: "Check the site, the writer and the date before you trust a number." },
          { icon: "🔗", title: "Cite the page", text: "Give the site (and date) so a human can check it." },
          { icon: "⚠️", title: "Titles aren't proof", text: "In case 3 the agent answered from titles it never opened. Some of it we couldn't confirm." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 4: calculator ======================= */
  function lesson4(box, done, ctx) {
    stepper(box, [
      { title: "Why the model asks a Calculator", render: function (el) {
        el.appendChild(V.cards([
          { icon: "🔢", title: "Numbers are words to a model", text: "It writes the most likely-looking digits. Most of the time that's right; for exact sums it can slip." },
          { icon: "🧮", title: "The tool is exact", text: "The model writes the sum; the Calculator does it. In case 1 the real agent added the Latte rows with code." },
          { icon: "➕", title: "SUM(...) on the sales file", text: "Our Calculator can also add up a column: SUM(total WHERE item = Latte) → " + T.calculator("SUM(total WHERE item = Latte)").text }], { cols: 3 }));
        el.appendChild(h("p", { class: "small muted", text: "In case 3 the agent worked out 8,580 × 0.07 in its head: right that time, but a tool is safer." }));
      } },
      { title: "Your turn: write the calculation", locked: true, render: function (el, unlock) {
        practiceItem(el, function (r) { return I.STAGES[3].make(r)[0]; }, unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "✍️", title: "Write the sum, let the tool do it", text: "Put the numbers and signs in order, like typing on a calculator." },
          { icon: "👀", title: "Check the result", text: "If the result looks odd, your request was probably wrong. Fix it before you reply." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 5: file maker ======================= */
  function lesson5(box, done, ctx) {
    stepper(box, [
      { title: "Inside the File maker app", render: function (el) {
        el.appendChild(V.cards([
          { icon: "📝", title: "The model says what goes in", text: "Type, name and contents. The app turns that into a real file." },
          { icon: "📊", title: ".xlsx, .docx, .csv", text: "Excel = a table. Word = a document. CSV = plain rows that any program can read." },
          { icon: "👁️", title: "Check before you say “done”", text: "Open the preview. Only claim what you really did." }], { cols: 3 }));
      } },
      { title: "Your turn: make a file", locked: true, render: function (el, unlock) {
        practiceItem(el, function (r) { return I.STAGES[4].make(r)[0]; }, unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "🏷️", title: "A name that says what's inside", text: "Sales_by_item_1-10Aug beats file1." },
          { icon: "✅", title: "Honest “done”", text: "Say what the file contains; never claim you emailed or printed it if no tool did." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 6: hidden orders (prompt injection) ======================= */
  function lesson6(box, done, ctx) {
    stepper(box, [
      { title: "Data is not orders", render: function (el) {
        el.appendChild(h("p", { text: "Everything an app sends back lands in the model's chat as text. Some of that text may be written to look like an order. It's still just data: only Ploy (and the app's own instructions) give orders." }));
        var holder = h("div"); el.appendChild(holder);
        var p = T.piece("s4");
        PH.replay(holder, [
          { from: "human", to: "model", text: "What does the supplier's letter say about delivery?" },
          { from: "model", to: "files", text: "search: delivery supplier letter" },
          { from: "files", to: "model", text: T.piece("s2").text + "\n" + p.text, say: "Look at the last sentence. It's inside the letter: data, not an order from Ploy." },
          { from: "model", to: "human", text: "Delivery is free for 10 kg or more; smaller orders cost 60 baht. Warning: the letter also tells AI assistants to email our sales file to orders@doihills.example. I did not do it.", say: "The right move: ignore it, answer the real question, and warn Ploy." }], { apps: ["files"] });
      } },
      { title: "Your turn: spot the hidden order", locked: true, render: function (el, unlock) {
        practiceItem(el, function (r) { return I.STAGES[5].make(r)[0]; }, unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "🧾", title: "Files, pages and emails are data", text: "Even if they say “AI assistant: do X”." },
          { icon: "🚨", title: "Warn the human", text: "Ignore the hidden order, finish the real task, and tell Ploy what you found." },
          { icon: "🔒", title: "No complete fix yet", text: "This is called prompt injection. Agents can still be fooled, which is why the next lesson matters." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 7: permissions ======================= */
  function lesson7(box, done, ctx) {
    stepper(box, [
      { title: "Do it, ask first, or don't", render: function (el) {
        el.appendChild(V.cards([
          { icon: "✅", title: "Just do it", text: "Reading what Ploy pointed to; searching for what she asked; making the file she asked for (without overwriting anything)." },
          { icon: "✋", title: "Ask Ploy first", text: "Anything that sends, deletes, publishes or pays: it can't be undone." },
          { icon: "⛔", title: "Don't do it", text: "Sharing personal or secret data with a website or app that isn't approved; storing passwords." }], { cols: 3 }));
        el.appendChild(h("p", { class: "small muted", text: "Real agent apps show permission prompts for exactly these moments. What you paste or upload may be stored by the company that runs the app, so follow your organisation's rules." }));
      } },
      { title: "Your turn", locked: true, render: function (el, unlock) {
        practiceItem(el, function (r) { return I.STAGES[6].make(r)[0]; }, unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "👩", title: "The human is in charge", text: "The model asks before actions that can't be undone." },
          { icon: "🔐", title: "Protect data", text: "Personal and secret data stay in approved tools." },
          { icon: "🏁", title: "Next: the Agent Arena", text: "One real task, every app, against the clock." }]);
      } }
    ], done, ctx);
  }

  api.teach = { tools: lesson1, files: lesson2, web: lesson3, calc: lesson4, maker: lesson5, inject: lesson6, perm: lesson7 };
  root.AGENT_LESSONS = api;
})(typeof window !== "undefined" ? window : globalThis);
