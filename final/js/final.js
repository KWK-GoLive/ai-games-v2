/*
 * AI games v2 · the final Be the LLM Arena: one stage, 12 questions mixing all 7 skills.
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, L = window.LLMA, D = window.LLMA_DATA, DR = window.LLMA_DRAW;
  A.start({
    game: "llmfinal",
    kicker: "Part 1 · final",
    title: "Final: Be the LLM Arena",
    intro: [
      "One stage, 12 questions, every skill from the main game mixed together: counting, writing, temperature, keyholes, the two-word boss, answering questions and the three-word boss.",
      "Each question has its own timer. Every answer is checked by the same toy model, on new training texts."
    ],
    minutes: "15–20",
    stages: [
      { id: "final", icon: "🏁", name: "All skills", make: DR.wrap(L.FINAL, D),
        goal: "12 questions from all 7 stages, in the order you learned them. Read each question's rules carefully: the window size changes!",
        rules: ["Temperature 0 unless a question shows a temperature.", "Ties: reading the text from the top, the word that comes right after first wins.", "Keyhole questions: only the highlighted words count. The bosses back off to fewer words when needed.", "Chat questions: half marks for the answer, half for supported / made up."],
        lesson: "That's everything a language model does: count, look through its window, pick (or spin for) the next piece, repeat. Real models do it with a neural network, tokens and a huge window (1,000,000 tokens for Claude Sonnet 5, according to Anthropic\u2019s documentation)." }
    ],
    finalCard: function () {
      return h("section", { class: "card soft stack" },
        h("div", { class: "kicker", text: "Next: part 2" }),
        h("h2", { text: "Be the Agent Arena" }),
        h("p", { text: "A language model only writes text. So how does an AI agent read your files, search the web and make real files? Play the model inside an agent and find out." }),
        h("div", { class: "row end" }, h("a", { class: "btn", href: "../index.html", text: "All games" }), h("a", { class: "btn primary", href: "../agent/index.html", text: "Start part 2 \u2192" })));
    }
  });
})();
