/*
 * AI games v2 · LLM Arena: 7 lessons, each followed by its timed stage. Part A = 1–4, Part B = 5–7.
 */
(function () {
  "use strict";
  var A = window.ARENA, h = A.h, L = window.LLMA, D = window.LLMA_DATA, DR = window.LLMA_DRAW, T = window.LLM_LESSONS.teach;
  function S(id) { return DR.wrap(L.STAGES.filter(function (s) { return s.id === id; })[0].make, D); }

  A.start({
    game: "llm2",
    kicker: "Part 1 \u00b7 main game",
    title: "Be the LLM Arena",
    intro: [
      "Learn how a language model picks its words, one idea at a time. Each short lesson (not timed) is followed by a timed stage that tests it.",
      "Every answer is checked by a real toy model running in your browser. The stages use NEW training texts, so you have to think like the model, not remember."
    ],
    partsNote: "Part A = lessons and stages 1\u20134 (counting, writing, temperature, keyhole). Part B = 5\u20137 (two-word boss, answering questions, three-word boss). Part A takes about 45\u201355 minutes, Part B about 35\u201345. You can pause between the parts.",
    minutes: "80\u2013100",
    stages: [
      { id: "count", part: "A", icon: "\ud83d\udd22", name: "Count it", lessonTitle: "How a model learns: counting", teach: T.count, make: S("count"),
        goal: "Training is counting. Read a tiny training text and answer what the model learned from it.",
        rules: ["The model counts which word comes right after each word.", "Percentage = that count \u00f7 all the counts after that word.", "The end of each line counts as a next piece called [end].", "Temperature 0 = always the top count. Ties: reading the text from the top, the word that comes right after it first wins."],
        example: "the robot fixed the door\nthe robot opened the box\n\nAfter \u201crobot\u201d: fixed 1, opened 1  \u2192  fixed 50%",
        lesson: "Everything this model \u201cknows\u201d is a table of counts from its training text. Real models learn far richer patterns, but they too are trained on one task: predict the next piece of text." },
      { id: "greedy", part: "A", icon: "\u270d\ufe0f", name: "Greedy writer", lessonTitle: "Writing a sentence with a 1-word window", teach: T.greedy, make: S("greedy"),
        goal: "Write the whole continuation the model produces at temperature 0, one word at a time.",
        rules: ["The model only sees the LAST word (a 1-word window).", "At each step it writes the word that most often follows it. Ties: reading from the top, the one that comes right after it first wins.", "It stops when it writes [end], or after 8 pieces.", "Part marks: you score the share of pieces you got right before your first slip."],
        example: "Seed: \u201cthe\u201d\nthe \u2192 robot \u2192 fixed \u2192 the \u2192 robot \u2192 \u2026 (a loop!)",
        lesson: "With a tiny window and no spin, the model can go round in circles. Temperature 0 always gives the same text; real chatbots add some randomness and use a far bigger window, which is why they rarely loop like this." },
      { id: "temp", part: "A", icon: "\ud83c\udf21\ufe0f", name: "Temperature", lessonTitle: "Temperature: spinning for the next word", teach: T.temp, make: S("temp"),
        goal: "Temperature decides how the chances are shared out on the bar. Predict what the dial does, and read where the pointer stopped.",
        rules: ["Temperature 1: the plain counts. % = count \u00f7 total.", "Higher temperature (like 2) flattens the bar: the parts even out.", "Lower temperature (like 0.5) sharpens it: the top word's part grows.", "Temperature 0: no spin, the top word gets 100%.", "Spin: the part the pointer stops in is the word the model writes."],
        example: "Counts: cat 9, dog 4, fish 1\nTemperature 0.5: cat 83% \u00b7 dog 16% \u00b7 fish 1% (sharper)\nTemperature 1: cat 64% \u00b7 dog 29% \u00b7 fish 7% (the plain counts)\nTemperature 2: cat 50% \u00b7 dog 33% \u00b7 fish 17% (flatter)",
        lesson: "Low temperature makes the model predictable; high temperature makes it more varied (and more likely to pick odd words). The counts never change, only how the bar is shared out." },
      { id: "keyhole", part: "A", icon: "\ud83d\udd11", name: "Keyhole", lessonTitle: "The keyhole: how many words the model sees", teach: T.keyhole, make: S("keyhole"),
        goal: "The context window: how many of the last words the model can see. Change the window, change the answer.",
        rules: ["The model sees ONLY the highlighted last words. The crossed-out words don't exist for it.", "Find those exact words, in order, in the training text, and see what follows them.", "If they never appear together, this model has no data.", "Ties: reading the text from the top, the word that comes right after them first wins."],
        lesson: "A wider window gives the model more to go on, but also more chances that it has never seen that exact wording. Real models learn patterns, so they can still guess well there; they also see a huge number of tokens at once." },
      { id: "boss2", part: "B", icon: "\ud83d\udc51", name: "Two-word boss", lessonTitle: "Two words at a time (and backing off)", teach: T.boss2, make: S("boss2"),
        badge: DR.windowBadge(2, "back off to 1 if the pair is new"),
        goal: "Write whole continuations with a TWO-word window, backing off to one word when needed.",
        rules: ["Look up the last TWO words together and write the word that most often follows.", "If that pair never appears in the text, back off: use only the last word.", "Ties: reading the text from the top, the word that comes right after them first wins. Stop at [end], or after 8 pieces.", "Part marks for the right pieces before your first slip."],
        example: "\u201cthe boat\u201d never appears \u2192 use \u201cboat\u201d \u2192 is\nthen \u201cboat is\u201d \u2192 on \u2026",
        lesson: "Two words of context already give much better sentences than one. Real models use thousands of tokens of context." },
      { id: "chat", part: "B", icon: "\ud83d\udcac", name: "Chat brain", lessonTitle: "Answering questions (and making things up)", teach: T.chat, make: S("chat"),
        goal: "A chatbot answers by continuing \u201cQ: \u2026 A:\u201d. Predict its answer, then judge whether the answer is backed by what it was taught.",
        rules: ["The model was trained on the example chats shown. It sees up to 8 words back (an 8-word window).", "For a question it has seen, it copies the answer. For a new one, it finds the longest ending it recognises (like \u201cthe pool open A:\u201d) and continues from there; at worst only \u201cA:\u201d.", "Ties: if two answers could follow, the one higher up in the list of chats wins.", "Supported = the chats contain the same question (maybe worded differently, same question word) with that answer.", "Made up = it borrowed an answer from a different question.", "Half marks for each part."],
        lesson: "This is where made-up answers (hallucinations) come from: the model always continues the text with something that looks like an answer, and it sounds just as sure either way." },
      { id: "boss3", part: "B", icon: "\ud83c\udfc6", name: "Three-word boss", lessonTitle: "Up to three words: the longest keyhole wins", teach: T.boss3, make: S("boss3"),
        badge: DR.windowBadge("UP TO 3-WORD WINDOW", "longest keyhole with data: 3, then 2, then 1"),
        goal: "Single \u201cwhat comes next?\u201d questions. The model sees up to the last 3 words and uses the longest keyhole that appears in the text.",
        rules: ["Look for the last 3 words together in the text. Found? Take the word that most often follows them.", "Not found? Back off to the last 2 words. Still not found? Use only the last word.", "Temperature 0. Ties: reading the text from the top, the word that comes right after them first wins."],
        example: "\u201cwe saw a red\u201d: \u201csaw a red\u201d is in the text \u2192 use 3 words\n\u201ca big red\u201d: \u201ca big red\u201d and \u201cbig red\u201d are not \u2192 use \u201cred\u201d",
        lesson: "You just did by hand what a language model does billions of times: look at the context, pick the next piece, add it, repeat. A real LLM always uses its whole (huge) window." }
    ],
    finalCard: function () {
      return h("section", { class: "card soft stack" },
        h("div", { class: "kicker", text: "Next" }),
        h("h2", { text: "The final Be the LLM Arena" }),
        h("p", { text: "One stage, 12 questions, every skill mixed together. Ready to show what you learned?" }),
        h("div", { class: "row end" }, h("a", { class: "btn primary", href: "../final/index.html", text: "Go to the final arena \u2192" })));
    }
  });
})();
