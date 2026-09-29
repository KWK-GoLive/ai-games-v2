/*
 * AI games v2 · Warm-up: What comes next? (one stage, 8 questions, class scoreboard game "warmup")
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, WU = window.WARMUP, DR = window.LLMA_DRAW;
  function make(rng) {
    return WU.stage(rng).map(function (it) {
      it.render = function (box, api) {
        box.appendChild(DR.worldText(it.world));
        var c = A.w.choices(it.options, function (v) { api.submit(v); });
        box.appendChild(c.el);
        return { collect: c.collect, reveal: function () { c.reveal(it.key); } };
      };
      return it;
    });
  }
  A.start({
    game: "warmup",
    liveProgress: false,   // a 5-minute warm-up: only its finished row goes to the board
    kicker: "Part 1 · warm-up",
    title: "What comes next?",
    intro: [
      "A language model learns from example sentences, then guesses the next word. Can you guess what a tiny model would write, after reading only 5 sentences?",
      "8 quick questions on 2 tiny training texts. Nothing to learn first: just use your common sense, then see how the model does it."
    ],
    minutes: "5–7",
    stages: [
      { id: "guess", icon: "🔮", name: "What comes next?", make: make,
        goal: "Read the 5 training sentences. Which word does the model write next?",
        rules: ["The model has read ONLY the 5 sentences on the screen.", "It writes the word that most often came right after the word shown.", "The end of a sentence counts like a word: [end]."],
        lesson: "The model doesn't understand buses or dinner. It only counted which word came after which, and picked the most common one. The main game shows you exactly how, step by step." }
    ],
    finalCard: function () {
      return h("section", { class: "card soft stack" },
        h("div", { class: "kicker", text: "Next" }),
        h("h2", { text: "Be the LLM Arena" }),
        h("p", { text: "Now learn how it really works: 7 short lessons, each followed by a timed stage." }),
        h("div", { class: "row end" }, h("a", { class: "btn primary", href: "../llm/index.html", text: "Start the main game →" })));
    }
  });
})();
