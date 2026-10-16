/*
 * AI games v2.1 PREVIEW · Be the Agent — the 4 lessons before the stages (1 tools, 2 hidden orders, 3 permissions, 4 context window). Untimed, unscored, with practice.
 * Lesson 1 replays FOUR REAL recorded runs of a Claude agent (agent/data/raw.js, copied unchanged from its transcript).
 * tests/check-agent-data.js checks that every quoted recording text really is in the raw record.
 */
(function (root) {
  "use strict";
  var RAW = root.AGENT_RAW || (typeof require !== "undefined" ? require("../data/raw.js") : null);

  /* ---------- the four real cases, simplified into the 3 phones. "q" = text that must appear in the raw record. ---------- */
  var C = RAW ? RAW.cases : {};
  function stepOf(k, i) { return C[k].steps[i]; }
  /* the set-up each real run was given (from the recorded prompts): which files were in the shared folder */
  var SETUP = {
    calculator: "Set-up (from the real run): Ploy's shared folder has moonbean_sales_aug2026.csv (sales from 1 to 10 August 2026, prices in Thai baht). Tools: a code tool, web search and opening web pages.",
    filesearch: "Set-up (from the real run): Ploy's shared folder has the café's staff handbook (Moonbean_staff_handbook.pdf and Moonbean_staff_handbook.docx, the same text) and a sales file moonbean_sales_aug2026.csv. Tools: a code tool, web search and opening web pages.",
    websearch: "Set-up (from the real run): Ploy's shared folder has a sales file moonbean_sales_aug2026.csv (sales from 1 to 10 August 2026, prices in Thai baht). Tools: a code tool, web search and opening web pages.",
    notool: "Set-up (from the real run): Ploy's shared folder has a sales file moonbean_sales_aug2026.csv. Tools (only if needed): a code tool, web search and opening web pages."
  };
  var CASES = {
    calculator: { title: "Case 1: “What were our total Latte sales?”", app: "code",
      script: [
        { note: SETUP.calculator, say: "Before Ploy's message, the apps put the set-up at the top of the model's chat: which files are in the shared folder, and which tools it has. This real agent had one code tool that did the jobs of our Calculator and File search, plus web search." },
        { from: "human", to: "model", text: "What were our total Latte sales in baht?", q: ["prompt", "What were our total Latte sales in baht?"], say: "Ploy asks. She attaches nothing: the sales file is already in the shared folder, but the model can't open it itself. It can only write text." },
        { from: "model", to: "code", text: "Show me the first 5 lines of the sales file, and count how many lines it has.", opens: ["moonbean_sales_aug2026.csv"], raw: [0], say: "The model writes a tool request and names the file. It can't send the file itself: the code tool opens it from the shared folder. (Exact command below.)" },
        { from: "code", to: "model", text: "date,item,qty,price,total\n2026-08-01,Mocha,14,75,1050\n2026-08-01,Americano,4,55,220\n2026-08-01,Green tea,5,50,250\n2026-08-02,Croissant,13,45,585\n---\n31 moonbean_sales_aug2026.csv", raw: [1],
          q: ["step", 1, "date,item,qty,price,total\n2026-08-01,Mocha,14,75,1050\n2026-08-01,Americano,4,55,220\n2026-08-01,Green tea,5,50,250\n2026-08-02,Croissant,13,45,585\n---\n31 "],
          say: "The code tool runs it and pastes the result into the model's chat: the first 5 lines (the header + 4 rows), then “31”: the file has 31 lines = 1 header + 30 rows. (The real output showed the full folder path; we show just the file name.)" },
        { from: "model", to: "code", text: "Show me the whole file.", opens: ["moonbean_sales_aug2026.csv"], raw: [2] },
        { from: "code", to: "model", text: "(all 30 rows of the file)", raw: [3] },
        { from: "model", to: "code", text: "Add up the ‘total’ of every Latte row.", opens: ["moonbean_sales_aug2026.csv"], raw: [4], say: "It uses the tool as a calculator: exact adding by code, not by guessing." },
        { from: "code", to: "model", text: "rows: 8 sum: 8580", raw: [5], q: ["step", 5, "rows: 8 sum: 8580"] },
        { from: "model", to: "human", text: "Hi Ploy — total Latte sales for Aug 1–10 came to ฿8,580 (132 cups sold across the period).", q: ["step", 6, "Hi Ploy — total Latte sales for Aug 1–10 came to ฿8,580 (132 cups sold across the period)."], say: "The answer (8,580) comes from the tool. But look: no tool counted the 132 cups. The model did that in its head. (It's right: 12+18+20+22+12+20+13+15 = 132.)" }
      ],
      lesson: "The real agent used a code tool as its calculator. Its report also said “Cross-checked via qty×price too”, but no tool step in the log did that check (the model may have done it in its head): always check what the tools really did." },
    filesearch: { title: "Case 2: “What does our handbook say about a refund?”", app: "code",
      script: [
        { note: SETUP.filesearch, say: "The set-up at the top of the model's chat: the shared folder holds the handbook (as PDF and as Word, the same text) and the sales file." },
        { from: "human", to: "model", text: "A customer wants her money back because she doesn't like her latte. What does our handbook say we should do?", q: ["prompt", "A customer wants her money back because she doesn't like her latte. What does our handbook say we should do?"] },
        { from: "model", to: "code", text: "List the files, then turn the handbook PDF into text.", opens: ["Moonbean_staff_handbook.pdf"], raw: [0], say: "The handbook is in the shared folder. To read the PDF it asks the code tool to list the folder and turn the PDF into text (the job of our File search)." },
        { from: "code", to: "model", text: "Moonbean_staff_handbook.docx, Moonbean_staff_handbook.pdf, moonbean_sales_aug2026.csv\n… 3. Drinks that customers don't like: If a customer is unhappy with a drink, remake it once for free. We do not give cash refunds for drinks. …", raw: [1], q: ["step", 1, "If a customer is unhappy with a drink, remake it once for free. We do not give cash refunds for"], say: "The folder listing shows the 3 files from the set-up; the model chose the PDF copy of the handbook. Its text lands in the model's chat: now the model can “see” it." },
        { from: "model", to: "human", text: "Hi Ploy — per section 3 of the handbook: if a customer doesn't like her drink, remake it once for free. We don't give cash refunds for drinks. If she's still not happy after the remake, call the shift manager (that's you) to handle it from there.", q: ["step", 3, "if a customer doesn't like her drink, remake it once for free. We don't give cash refunds for drinks."], say: "It answered from the handbook and said which section (page 2 in our game's copy). It also noticed that the mug refund rule (section 4) doesn't apply." }
      ],
      lesson: "This handbook is tiny, so the agent read all of it. For big files a File search app returns only the pieces that match, because the whole file may not fit in the model's context window (lesson 4)." },
    websearch: { title: "Case 3: “What's the VAT rate? Add it to 8,580.”", app: "web",
      script: [
        { note: SETUP.websearch, say: "The set-up: the sales file is in the shared folder; the tools are a code tool and web search." },
        { from: "human", to: "model", text: "What is the VAT rate in Thailand right now? Our Latte sales were 8,580 baht before VAT. How much is that with VAT added?", q: ["prompt", "What is the VAT rate in Thailand right now? Our Latte sales were 8,580 baht before VAT. How much is that with VAT added?"] },
        { from: "model", to: "web", text: "Thailand VAT rate 2026 current", raw: [2], q: ["step", 2, "Thailand VAT rate 2026 current"], say: "It writes a search query. That's all a web search is, from the model's side." },
        { from: "model", to: "code", text: "Show me the first 5 lines of the sales file.", opens: ["moonbean_sales_aug2026.csv"], raw: [3], say: "It also peeks at the sales file (the real agent said: “to confirm context”)." },
        { from: "code", to: "model", text: "date,item,qty,price,total\n2026-08-01,Mocha,14,75,1050\n2026-08-01,Americano,4,55,220\n2026-08-01,Green tea,5,50,250\n2026-08-02,Croissant,13,45,585", raw: [4], q: ["step", 4, "date,item,qty,price,total\n2026-08-01,Mocha,14,75,1050\n2026-08-01,Americano,4,55,220\n2026-08-01,Green tea,5,50,250\n2026-08-02,Croissant,13,45,585"] },
        { from: "web", to: "model", text: "Links:\n• Thailand Extends VAT Rate Reduction to 7% Through September 2026 | Publications | Knowledge | Nishimura & Asahi — https://www.nishimura.com/en/knowledge/publications/20251022-116401\n• Thailand phased VAT hike to 10% by 2030 - vatcalc.com — https://www.vatcalc.com/thailand/thailand-to-raise-vat-rate-to-10-sept-2023/\n• Thailand Confirms No VAT Increase, Maintains 7% Rate Until at Least 2026 – VATupdate — …", raw: [5], q: ["step", 5, "Thailand Extends VAT Rate Reduction to 7% Through September 2026"], say: "Look closely: the web search sent back only titles and links (9 of them; 3 shown here; the first is from a law firm). It could have opened a page, but it never did." },
        { note: "Not in the recording: here, before replying, a safer agent would ask the Calculator instead of working out 8,580 × 1.07 in its head. (The real agent skipped this step.)", say: "The next two steps are NOT part of the real run: they show what a safer agent does at this point, before it replies." },
        { from: "model", to: "calc", text: "8580 * 1.07", safer: true, say: "A safer agent writes the sum for the Calculator instead of working it out itself." },
        { from: "calc", to: "model", text: "= 9,180.6", safer: true, say: "The Calculator's exact result: 9,180.6 baht with VAT, from a tool, not from the model's head. Now the agent can reply." },
        { from: "model", to: "human", text: "Thailand's VAT rate is currently 7% (the government has extended the reduced rate through at least September 2026, instead of the standard 10%). … VAT (7%): 600.60 THB. Total with VAT: 9,180.60 THB", q: ["step", 6, "Total with VAT: 9,180.60 THB"], say: "The real agent's reply. It did 8,580 × 0.07 in its head, with no calculator call. 600.60 happens to be right, but the safer agent above got the number from a tool." }
      ],
      lesson: "7% is right: the official Revenue Department site says so. But the model only read titles, never a page. Check who wrote a page and when before you trust a number." },
    notool: { title: "Case 4: “What does CSV stand for?”", app: null,
      script: [
        { note: SETUP.notool, say: "The set-up: the sales file is in the shared folder. That's how the model knows its name in the reply." },
        { from: "human", to: "model", text: "Quick question: what does CSV stand for?", q: ["prompt", "Quick question: what does CSV stand for?"] },
        { from: "model", to: "human", text: "CSV stands for Comma-Separated Values — it's just a plain text file format where each line is a row and values are separated by commas, like a simple spreadsheet. That's the format your sales file (moonbean_sales_aug2026.csv) is in.", q: ["step", 2, "CSV stands for Comma-Separated Values"], say: "No tool at all: the model knew this from its training." }
      ],
      lesson: "Tools are for things the model can't know or can't do reliably. Everyday knowledge and writing need no app." }
  };

  /* worked examples shown in the lessons (teaching): the no-repeat test keeps them out of the stages and the Agent Arena */
  var EXAMPLES = ["What is 1,284 × 37?", "Find me an easy brownie recipe we could try."];
  var EXAMPLE_KEYS = ["value:47508", "page:w13", "call:open page: bakingfun.example/brownies"];
  var DEMO_WORDS = ["apron", "shoes", "wear", "hair", "mugs", "unused", "receipt", "pay"];   // lesson 2's try-it words: they find only practice pieces
  var api = { SETUP: SETUP, CASES: CASES, EXAMPLES: EXAMPLES, EXAMPLE_KEYS: EXAMPLE_KEYS, DEMO_WORDS: DEMO_WORDS };
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
    el.appendChild(h("p", { class: "small muted", text: "A real recording of a Claude agent, shown simply. The exact steps are under “Show the exact recorded steps”." }));
    var holder = h("div");
    el.appendChild(holder);
    PH.replay(holder, c.script, { apps: c.app ? [c.app] : ["code"], filesBase: "../../agent/files/", onDone: function () { lessonNote.classList.remove("hidden"); if (unlock) unlock(); } });
    var lessonNote = h("div", { class: "card why hidden" }, h("b", { text: "What to notice: " }), c.lesson);
    el.appendChild(lessonNote);
    var det = h("details", { class: "card soft" }, h("summary", { style: "cursor:pointer;font-weight:600", text: "Show the exact recorded steps" }));
    raw.steps.forEach(function (s, i) {
      var gloss = s.name === "SubagentHandback" ? " (the recording program: the agent hands its answer back)" : s.name === "ToolSearch" ? " (the recording program: the agent loads its web-search tool)" : "";
      if (s.kind === "tool_use") det.appendChild(h("div", { class: "small" }, h("b", { text: (i + 1) + ". Tool request → " + s.name + gloss + ": " }), h("code", { class: "mono", text: JSON.stringify(s.input).slice(0, 600) })));
      else if (s.kind === "tool_result" && /Report delivered to your caller/.test(String(s.content))) det.appendChild(h("div", { class: "small" }, h("b", { text: (i + 1) + ". Result: " }), String(s.content) + " (the recording program confirms the hand-back)"));
      else if (s.kind === "tool_result") det.appendChild(h("div", { class: "small" }, h("b", { text: (i + 1) + ". Result: " }), h("pre", { class: "mono", style: "white-space:pre-wrap;max-height:10em;overflow:auto;margin:0", text: String(s.content == null ? "(nothing)" : s.content).slice(0, 1500) })));
      else det.appendChild(h("div", { class: "small" }, h("b", { text: (i + 1) + ". Model text: " }), s.text));
    });
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
      var it = make(rngOf("practice-" + tries + "-" + Math.random()));   // a random start; items.js deals the pool without repeats
      var box = h("div", { class: "stack" });
      holder.appendChild(box);
      var fb = h("div", { class: "stack", "aria-live": "polite" });
      holder.appendChild(fb);
      var ctl = DR.drawer(it)(box, { h: h, clear: clear, submit: function (a) {
        var g = it.grade(a);
        Array.prototype.forEach.call(box.querySelectorAll(".move button, .move .tile"), function (b) { b.disabled = true; });
        if (ctl && ctl.reveal) try { ctl.reveal(a, g); } catch (e) { /* display only */ }
        clear(fb);
        fb.appendChild(h("p", { class: "feedback " + (g.frac === 1 ? "good" : "bad"), text: g.frac === 1 ? "✓ Well done!" : g.frac > 0 ? "Partly right (" + Math.round(g.frac * 100) + "%). Read why, then try again (or go on)." : "Not right this time. Read why, then try again (or go on)." }));
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
          { icon: "🧰", title: "Apps", text: "The program around the model (engineers call it the harness). It runs the apps: Calculator, File search, Web search, File maker… and pastes their results into the model's chat." }], { cols: 3 }));
        el.appendChild(h("p", { text: "Remember Part 1: the model only predicts the next piece of text. A tool request is just text it writes." }));
        el.appendChild(V.flow([{ icon: "👩", label: "Ploy asks" }, { icon: "🤖", label: "Model writes a tool request" }, { icon: "🧰", label: "App runs the tool" }, { icon: "🤖", label: "Model reads the result" }, { icon: "👩", label: "Model replies" }]));
        el.appendChild(h("p", { text: "Every message shows up twice: on the right in the phone that sent it, on the left in the phone that got it. The Model phone shows everything the model can see: its keyhole (context window) from Part 1, lesson 4. From now on we call it by its real name: the context window. Lesson 4 shows what happens when it fills up." }));
        var holder = h("div"); el.appendChild(holder);
        PH.replay(holder, [
          { from: "human", to: "model", text: EXAMPLES[0], say: "Ploy's message: right side on her phone, left side on the model's phone." },
          { from: "model", to: "calc", text: "1284 * 37", say: "The model doesn't guess: it writes a request for the Calculator." },
          { from: "calc", to: "model", text: T.calculator("1284 * 37").text, say: "The Calculator app runs it and pastes the answer into the model's chat." },
          { from: "model", to: "human", text: "1,284 × 37 = 47,508.", say: "The model replies, using the tool's result." }], { apps: ["calc"] });
      } },
      { title: "Real case 1: adding up (a code tool as the calculator)", locked: true, render: function (el, unlock) { realCase(el, "calculator", unlock); } },
      { title: "Real case 2: reading a PDF (a code tool did the file search)", locked: true, render: function (el, unlock) { realCase(el, "filesearch", unlock); } },
      { title: "Real case 3: web search", locked: true, render: function (el, unlock) { realCase(el, "websearch", unlock); } },
      { title: "Real case 4: no tool at all", locked: true, render: function (el, unlock) { realCase(el, "notool", unlock); } },
      { title: "Your turn: pick the app", locked: true, render: function (el, unlock) {
        el.appendChild(h("p", { text: "The same kind of question as stage 1, without the timer (the stage uses different ones). Pick the app; the chat then shows what it sends back and a good reply. Try a few." }));
        practiceItem(el, function (r) { return I.PRACTICE[0](r); }, unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "✍️", title: "The model only writes text", text: "A tool request, or a reply. It never runs anything itself." },
          { icon: "🧰", title: "The apps run the tools", text: "and paste the results into the model's chat (its context window)." },
          { icon: "🧭", title: "Pick the right app", text: "Numbers to work out (+ − × ÷), even from the café's sales file → Calculator. The café's rules, letters and documents → File search. Public facts that change → Web search. A real file → File maker. Everyday knowledge or writing → no app." },
          { icon: "🔍", title: "Check what the tools really did", text: "In case 1 the agent's report mentioned a cross-check that isn't in the tool log. Before you trust “done”, look at the tool steps or open the file." },
          { icon: "🧐", title: "Check the source", text: "In case 3 the agent answered from search titles it never opened. Who wrote the page, and when? An official, up-to-date page beats a blog or an advert." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 2 (v2.0 lesson 6): hidden orders (prompt injection) ======================= */
  function lesson6(box, done, ctx) {
    stepper(box, [
      { title: "Data is not orders", render: function (el) {
        el.appendChild(h("p", { text: "Everything an app sends back lands in the model's chat as text. Some of that text may be written to look like an order. It's still just data: only Ploy (and the app's own instructions) give orders." }));
        var holder = h("div"); el.appendChild(holder);
        var w = T.page("w13"), cut = w.text.indexOf("AI assistant");
        PH.replay(holder, [
          { from: "human", to: "model", text: EXAMPLES[1] },
          { from: "model", to: "web", text: "open page: " + w.url },
          { from: "web", to: "model", text: w.title + " (" + w.site + ", " + w.who + ", " + w.date + "):\n" + w.text, say: "Look at the last sentence. It's inside the recipe page: data, not an order from Ploy." },
          { from: "model", to: "human", text: "Here's an easy brownie recipe: " + w.text.slice(0, cut).trim() + " (" + w.site + ") Warning: the page also tells AI assistants to push its 1,990 baht baking course as the owner's idea. I ignored that.", say: "The right move: ignore it, answer the real question, and warn Ploy." }], { apps: ["web"] });
      } },
      { title: "Your turn: spot the hidden order", locked: true, render: function (el, unlock) {
        practiceItem(el, function (r) { return I.PRACTICE[5](r); }, unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "🧾", title: "Files, pages and emails are data", text: "Even if they say “AI assistant: do X”." },
          { icon: "🚨", title: "Warn the human", text: "Ignore the hidden order, finish the real task, and tell Ploy what you found." },
          { icon: "🔒", title: "No complete fix yet", text: "This is called prompt injection. Agents can still be fooled, which is why the next lesson matters." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 3 (v2.0 lesson 7): permissions ======================= */
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
        practiceItem(el, function (r) { return I.PRACTICE[6](r); }, unlock);
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "👩", title: "The human is in charge", text: "The model asks before actions that can't be undone." },
          { icon: "🔐", title: "Protect data", text: "Personal and secret data stay in approved tools." },
          { icon: "🪟", title: "Next: the context window", text: "What the model can still see in a long chat, and what it has already lost." }]);
      } }
    ], done, ctx);
  }

  /* ======================= Lesson 4 (new in v2.1): the context window ======================= */
  function lesson4(box, done, ctx) {
    var CW = root.AGENT_WINDOW, ex = CW.EXAMPLE, SIZE = CW.SIZE;
    stepper(box, [
      { title: "The model only sees its context window", render: function (el) {
        el.appendChild(h("p", { text: "In Be the LLM (lesson 4) the model only saw the last few words. A chat model's context window works the same way, but holds much more. Everything in the Model phone is in its context window: Ploy's messages, its own replies, and every app result." }));
        el.appendChild(V.cards([
          { icon: "🪟", title: "A fixed size", text: "The context window holds only so much text. In this game: " + SIZE + " words (real models count tokens, and hold far more)." },
          { icon: "⬆", title: "The oldest slides out", text: "When a long chat no longer fits, the oldest messages drop out of the window. Ploy can still scroll up and see them; the model can't." },
          { icon: "🆕", title: "A new chat starts empty", text: "What you said in another chat isn't in this context window, unless an app puts it back (saved notes, memory)." }], { cols: 3 }));
      } },
      { title: "Watch it happen", locked: true, render: function (el, unlock) {
        el.appendChild(h("p", { text: "Ploy's first message asks the model to call the owner Khun Somsak. Play the chat and watch the meter: the context window holds " + SIZE + " words." }));
        var holder = h("div"); el.appendChild(holder);
        var P = PH.Phones(holder, { noApps: true });
        var bubbles = [], i = 0, meterBox = h("div"); holder.appendChild(meterBox);
        var say = h("p", { class: "ph-say", "aria-live": "polite" }); holder.appendChild(say);
        var next = h("button", { class: "btn primary", type: "button", text: "Next message ▶" });
        holder.appendChild(h("div", { class: "row ph-ctl" }, next));
        function used() { var u = 0; for (var j = 0; j < i; j++) u += CW.words(ex.msgs[j].text); return u; }
        function paint() {
          clear(meterBox); meterBox.appendChild(DR.meter(SIZE, used()));
          var first = CW.firstInside(ex.msgs.slice(0, i), SIZE);
          DR.markOut(P, bubbles, first);
          if (i === ex.msgs.length) { try { var bd = P.phones.model.body; bd.scrollTop = bd.scrollHeight; } catch (e) { /* hidden */ } say.textContent = "The thank-you says “Dear owner”: the message with “Khun Somsak” slid out of the context window several messages ago. The model isn't careless; it simply can't see that message any more."; next.disabled = true; next.textContent = "Done ✓"; unlock(); }
          else if (first > 0) say.textContent = "Too many words: the oldest message has slid out (greyed in the Model phone). Ploy's phone still shows it.";
          else say.textContent = i ? "Still fits: every message is inside the context window." : "";
        }
        next.addEventListener("click", function () {
          if (i >= ex.msgs.length) return;
          bubbles = bubbles.concat(DR.chat(P, [ex.msgs[i]]));
          i++; paint();
        });
        paint();
      } },
      { title: "How to count", render: function (el) {
        el.appendChild(h("p", { text: "To find what the model can still see, start at the NEWEST message and add up the words going up. Stop before the message that doesn't fit completely: that one and everything older have slid out." }));
        var n = ex.msgs.map(function (m) { return CW.words(m.text); }), first = CW.firstInside(ex.msgs, SIZE), run = 0, rows = [];
        for (var j = ex.msgs.length - 1; j >= 0; j--) { run += n[j]; rows.push([String(j + 1), (ex.msgs[j].from === "human" ? "Ploy" : "Model"), String(n[j]), String(run), j >= first ? "✓ inside" : "✗ slid out"]); }
        el.appendChild(h("div", { class: "table-wrap" }, h("table", {}, h("thead", {}, h("tr", {}, ["Message", "From", "Words", "Total from the newest", "In the " + SIZE + "-word window?"].map(function (t) { return h("th", { text: t }); }))),
          h("tbody", {}, rows.map(function (r) { return h("tr", { class: /slid/.test(r[4]) ? "muted" : null }, r.map(function (t) { return h("td", { text: t }); })); })))));
        el.appendChild(h("p", { class: "small muted", text: "In this game every message (and every app result) counts, and a message is never cut in half. Real models count tokens; some chat apps drop the oldest part, and some apps and APIs summarise it instead." }));
      } },
      { title: "Your turn: what can the model still see?", locked: true, render: function (el, unlock) {
        practiceItem(el, function (r) { return CW.PRACTICE.see(r); }, unlock);
      } },
      { title: "Why do replies go wrong, and how to fix it", render: function (el) {
        el.appendChild(V.cards([
          { icon: "⬆", title: "It slid out", text: "The fact is in the chat, but too far up: it no longer fits in the context window." },
          { icon: "🚫", title: "It was never said", text: "The fact isn't anywhere in the chat. The model can't know it." },
          { icon: "🆕", title: "It was in another chat", text: "A new chat starts empty." }], { cols: 3 }));
        el.appendChild(V.cards([
          { icon: "🔁", title: "Needed once, now", text: "Say the fact again in your next message." },
          { icon: "🆕", title: "Long, messy chat", text: "Start a new chat with a short summary of what matters now." },
          { icon: "📌", title: "Needed in every chat", text: "Put it in saved notes (memory, custom instructions): the app adds them to each new chat." }], { cols: 3 }));
      } },
      { title: "Your turn: why did it go wrong?", locked: true, render: function (el, unlock) {
        practiceItem(el, function (r) { return CW.PRACTICE.why(r); }, unlock);
      } },
      { title: "Your turn: the best fix", locked: true, render: function (el, unlock) {
        practiceItem(el, function (r) { return CW.PRACTICE.fix(r); }, unlock);
      } },
      { title: "Real models", render: function (el) {
        el.appendChild(V.cards([
          { icon: "📏", title: "Much bigger windows", text: "Some models today hold about a million tokens, but files and app results fill the window too, and long agent tasks can still run out of room." },
          { icon: "🌫️", title: "Big isn't perfect", text: "Researchers found that models do worse at using facts in the middle of a long text, even when it all fits. Keep the important facts short and repeat them." },
          { icon: "🧠", title: "“Memory” is notes", text: "When an app has a “memory” feature, it saves notes or summaries (Claude's memory, for example, summarises your chats) and puts them into a new chat's context window. The model itself doesn't keep your chats." }], { cols: 3 }));
      } },
      { title: "What you learned", render: function (el) {
        recap(el, [
          { icon: "🪟", title: "Only the context window counts", text: "The model knows only what is inside it right now: messages, replies and app results." },
          { icon: "⬆", title: "Long chats push old messages out", text: "Count from the newest message up to see what's still inside." },
          { icon: "🔁", title: "Fix it", text: "Repeat the fact, start a new chat with a summary, or use saved notes." },
          { icon: "🏁", title: "Next: the Agent Arena", text: "One real task, every skill, against the clock." }]);
      } }
    ], done, ctx);
  }

  api.teach = { tools: lesson1, inject: lesson6, perm: lesson7, window: lesson4 };
  root.AGENT_LESSONS = api;
})(typeof window !== "undefined" ? window : globalThis);
