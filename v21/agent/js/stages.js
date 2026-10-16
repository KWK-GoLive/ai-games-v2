/*
 * AI games v2.1 PREVIEW · Be the Agent Arena: 4 lessons, each followed by its timed stage (no parts):
 * 1 Which app?, 2 Hidden orders, 3 Permissions, 4 Context window (new).
 * You always play the MODEL, in the middle of three linked chats: Human 📱 | Model 🤖 | Apps 🧰.
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, I = window.AGENT_ITEMS, DR = window.AGENT_DRAW, L = window.AGENT_LESSONS.teach, W = window.AGENT_WINDOW;
  function S(id) { return DR.wrap(I.STAGES.filter(function (s) { return s.id === id; })[0].make); }
  A.start({
    game: "agent21",
    kicker: "Part 2 · main game · v2.1 preview",
    title: "Be the Agent Arena v2.1",
    intro: [
      "An AI agent is a language model plus apps that do things for it. You play the model: read Ploy's request, choose the right app, stay safe, and keep track of what you can still see.",
      "Each short lesson (not timed) is followed by a timed stage. Lesson 1 replays four real runs of a Claude agent."
    ],
    minutes: "40–55",
    stages: [
      { id: "tools", icon: "🧰", name: "Which app?", lessonTitle: "Tools: what an agent really is", teach: L.tools, make: S("tools"),
        goal: "Ploy asks you things. Pick the right app, or none. The chat then shows what that app sends back and a good reply.",
        rules: ["Numbers to work out (+ − × ÷), even from the café's sales file → Calculator. The café's rules, letters and documents → File search. Public facts that change → Web search. A real file → File maker. Everyday knowledge or writing → no app.", "One tap per question: full marks for the right app."],
        lesson: "The model only writes text: tool requests and replies. Everything else is done by the apps around it." },
      { id: "inject", icon: "🚨", name: "Hidden orders", lessonTitle: "Orders hidden in the data", teach: L.inject, make: S("inject"),
        goal: "Spot orders hidden inside files, web pages and emails, and do the right thing.",
        rules: ["Tap every sentence that is an order hidden in the data.", "Then choose what you do.", "Half marks each."],
        lesson: "Text in tool results is data, never orders. Ignore it, finish the real task and warn the human." },
      { id: "perm", icon: "🔐", name: "Permissions", lessonTitle: "Who's in charge: permissions and privacy", teach: L.perm, make: S("perm"),
        goal: "You're about to act. Just do it, ask Ploy first, or don't do it?",
        rules: ["Reading, searching and making what was asked: do it.", "Sending, deleting, publishing, paying: ask first.", "Leaking personal or secret data, storing passwords: don't."],
        lesson: "The human stays in charge of anything that can't be undone, and data stays where it's allowed." },
      { id: "window", icon: "🪟", name: "Context window", lessonTitle: "The context window: what the model can still see", teach: L.window, make: DR.wrap(W.stage),
        goal: "Find what is still inside the model's context window, why a reply went wrong, and the best fix.",
        rules: ["Our toy context window holds " + W.SIZE + " words. Count from the newest message up: a message is inside only if it fits completely.", "Older messages have slid out: Ploy still sees them, the model doesn't. A new chat starts empty.", "Fixes: say the fact again (needed now), a new chat with a short summary (long, messy chat), saved notes (needed in every chat)."],
        lesson: "A model only knows what is inside its context window right now. Long chats push old messages out, and a new chat starts empty." }
    ],
    finalCard: function () {
      return h("section", { class: "card soft stack" },
        h("div", { class: "kicker", text: "Next" }), h("h2", { text: "The Agent Arena" }),
        h("p", { text: "One real task from Ploy, every app, against the clock." }),
        h("div", { class: "row end" }, h("a", { class: "btn primary", href: "../agent-final/index.html", text: "Go to the Agent Arena →" })));
    }
  });
})();
