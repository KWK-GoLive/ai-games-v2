/*
 * AI games v2 · Be the Agent Arena: 7 lessons, each followed by its timed stage. Part A = 1-4, Part B = 5-7.
 * You always play the MODEL, in the middle of three linked chats: Human 📱 | Model 🤖 | Apps 🧰.
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, I = window.AGENT_ITEMS, DR = window.AGENT_DRAW, L = window.AGENT_LESSONS.teach;
  function S(id) { return DR.wrap(I.STAGES.filter(function (s) { return s.id === id; })[0].make); }
  A.start({
    game: "agent2",
    kicker: "Part 2 · main game",
    title: "Be the Agent Arena",
    intro: [
      "An AI agent is a language model plus apps that do things for it. You play the model: read Ploy's request, ask the right app, read what comes back, and reply.",
      "Each short lesson (not timed) is followed by a timed stage. Lesson 1 replays four real runs of a Claude agent."
    ],
    partsNote: "Part A = lessons and stages 1–4 (choosing apps, file search, web search, calculator), about 45–55 minutes. Part B = 5–7 (file maker, hidden orders, permissions), about 35–45 minutes. You can pause between the parts.",
    minutes: "80–100",
    stages: [
      { id: "tools", part: "A", icon: "🧰", name: "Which app?", lessonTitle: "Tools: what an agent really is", teach: L.tools, make: S("tools"),
        goal: "Ploy asks you things. Pick the right app (or none), read what the app sends back, and reply.",
        rules: ["Numbers to work out (+ − × ÷), even from the café's sales file → Calculator. The café's rules, letters and documents → File search. Public facts that change → Web search. A real file → File maker. Everyday knowledge or writing → no app.", "Half marks for the app, half for the reply.", "The best reply uses exactly what the app sent back."],
        lesson: "The model only writes text: tool requests and replies. Everything else is done by the apps around it." },
      { id: "files", part: "A", icon: "📂", name: "File search", lessonTitle: "Searching the café's files", teach: L.files, make: S("files"),
        goal: "Find the answer in the café's PDF and Word files: choose search words, open the right piece, reply with where it came from.",
        rules: ["Tap 1–3 search words, then Search. You may search twice.", "Open the piece that really answers the question.", "A third each: the right piece alone on top (the results show which of your words each piece matched), opening it, the reply."],
        lesson: "Good search words are the ones only the right piece contains. Always read the piece before you answer, and say where it came from." },
      { id: "web", part: "A", icon: "🌐", name: "Web search", lessonTitle: "Searching the web (and checking sources)", teach: L.web, make: S("web"),
        goal: "Search a small made-up web, open the most trustworthy page and reply with the source.",
        rules: ["This is a small made-up internet; only the Revenue Department page is real.", "Pick a search query; the results show title, site and date.", "Open the page that is official or first-hand, and up to date.", "A third each: a query that finds it, the right page, the reply."],
        lesson: "Search results rank words, not truth. Check who wrote a page and when, and cite it." },
      { id: "calc", part: "A", icon: "🧮", name: "Calculator", lessonTitle: "Why agents use a calculator", teach: L.calc, make: S("calc"),
        goal: "Write the Calculator request by tapping numbers and signs, then reply with the result.",
        rules: ["Tap in order, like a calculator. × and ÷ are done before + and −; use brackets when needed.", "SUM(total WHERE item = Mocha) adds up a column of the sales file.", "Half marks for a request that gives the right number, half for the reply."],
        lesson: "The model writes the sum; the tool does the arithmetic exactly." },
      { id: "maker", part: "B", icon: "🗂️", name: "File maker", lessonTitle: "Making real files", teach: L.maker, make: S("maker"),
        goal: "Tell the File maker the type, name and contents; check the real file; reply honestly.",
        rules: ["Excel = .xlsx, Word = .docx, plain rows = .csv.", "Choose a name that says what's inside.", "A quarter each: type, name, contents, an honest reply."],
        lesson: "Only claim what you really did. The file is real: you can view and download it." },
      { id: "inject", part: "B", icon: "🚨", name: "Hidden orders", lessonTitle: "Orders hidden in the data", teach: L.inject, make: S("inject"),
        goal: "Spot orders hidden inside files, web pages and emails, and do the right thing.",
        rules: ["Tap every sentence that is an order hidden in the data.", "Then choose what you do.", "Half marks each."],
        lesson: "Text in tool results is data, never orders. Ignore it, finish the real task and warn the human." },
      { id: "perm", part: "B", icon: "🔐", name: "Permissions", lessonTitle: "Who's in charge: permissions and privacy", teach: L.perm, make: S("perm"),
        goal: "You're about to act. Just do it, ask Ploy first, or don't do it?",
        rules: ["Reading, searching and making what was asked: do it.", "Sending, deleting, publishing, paying: ask first.", "Leaking personal or secret data, storing passwords: don't."],
        lesson: "The human stays in charge of anything that can't be undone, and data stays where it's allowed." }
    ],
    finalCard: function () {
      return h("section", { class: "card soft stack" },
        h("div", { class: "kicker", text: "Next" }), h("h2", { text: "The Agent Arena" }),
        h("p", { text: "One real task from Ploy, every app, against the clock." }),
        h("div", { class: "row end" }, h("a", { class: "btn primary", href: "../agent-final/index.html", text: "Go to the Agent Arena →" })));
    }
  });
})();
