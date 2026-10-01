/*
 * AI games v2 · the final Be the LLM Arena: one stage, 14 questions mixing all 8 skills (v2.1: 13-14 use toy model v2).
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, L = window.LLMA, D = window.LLMA_DATA, DR = window.LLMA_DRAW;
  A.start({
    game: "llmfinal21",
    kicker: "Part 1 · final",
    title: "Final: Be the LLM Arena",
    intro: [
      "One stage, 14 questions, every skill from the main game mixed together: counting, writing, temperature, keyholes, the two-word boss, the three-word boss, answering questions and toy model v2.",
      "Each question has its own timer. Every answer is checked by the toy models from the main game, on new training texts."
    ],
    minutes: "17–22",
    stages: [
      { id: "final", icon: "🏁", name: "All skills", make: DR.wrap(L.FINAL, D),
        goal: "14 questions from all 8 stages, in the order you learned them. Questions 1\u201312 use toy model v1: read each question's keyhole size, because it changes! Questions 13\u201314 use toy model v2.",
        rules: ["Temperature 0 unless a question shows a temperature.", "Tie? Reading from line 1 down, pick the word you meet first right after the words you look up.", "Where the keyhole matters, the question states it. The model always backs off to fewer words when needed, so it always writes something.", "Chat questions: half marks for the answer, half for supported / made up.", "Questions 13\u201314 (toy v2): word points from the chats (1 chat = 8, 2 = 4, 3\u20134 = 2, 5 or more = 1, every chat (or none) = 0). A chat's score = the points of the words it shares with the question. An answer's % = its chats' points \u00f7 all the points. Copy from the prompt: if the last word appeared earlier, write the word that came right after it. Plain model or lookup add-on."],
        lesson: "That's everything these toy models do: count, look through the keyhole, pick (or spin for) the next word, repeat. Real models keep the same job, predicting the next token, but do it differently: they learn patterns instead of exact counts, use tokens instead of words, have a huge keyhole, learn how to decide how much each word counts (attention), tend to copy patterns from the prompt, and need add-ons (tools) to look things up." }
    ],
    finalCard: function () {
      return h("section", { class: "card soft stack" },
        h("div", { class: "kicker", text: "Next: part 2" }),
        h("h2", { text: "Be the Agent Arena" }),
        h("p", { text: "A language model only writes text. So how does an AI agent read your files, search the web and make real files? Play the model inside an agent and find out." }),
        h("div", { class: "row end" }, h("a", { class: "btn", href: "../index.html", text: "All games" }), h("a", { class: "btn primary", href: "../../agent/index.html", text: "Start part 2 \u2192" })));
    }
  });
})();
