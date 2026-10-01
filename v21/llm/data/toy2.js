/*
 * AI games v2.1 · data for toy model v2 (lesson 8, stage 8 "Meaning brain", final questions 13-14).
 * Everything is made up (places, names, times, prices). Lesson, stage and final data never overlap
 * (tests/check-toy2.js checks this). The answer keys are computed by v21/shared/model2.js, never typed here.
 */
(function (root) {
  "use strict";
  root.LLMA_TOY2_DATA = {
    /* Lesson 8 */
    lesson: {
      chats: { id: "corner", name: "Corner Street", qa: [
        ["when does the shop open", "at nine am"],
        ["when does the cafe open", "at seven am"],
        ["when does the pool open", "at ten am"],
        ["when does the shop close", "at six pm"],
        ["what are the bank hours", "eight thirty to four"],
        ["where is the shop", "next to the bank"],
        ["who owns the cafe", "mrs kim"],
        ["is the pool open today", "yes it is"]] },
      meaning: "when does the bank open",   // the rare word "bank" decides (toy v1 copied the shop's time)
      most: "who owns the pool",            // the cafe owner's chat gets the most say: still made up
      share: "where is the bank",           // blended: no single chat gets 100%
      copy: { prompt: "the cafe special today is a mango fizz . i ordered a mango", options: ["fizz", "cake", "juice", "[end]"] },
      addon: [
        { text: "What will the weather be in your town tomorrow?", needs: true, why: "Tomorrow's weather is new information: it was never in the training text and it isn't in the prompt." },
        { text: "Turn this into a polite email: “send me the file now”.", needs: false, why: "Everything it needs is in the prompt. Rewriting text is what a plain model does." },
        { text: "What does our café's staff handbook say about breaks?", needs: true, why: "Your own file was never in its training text. It needs a tool that opens the file (File search in Part 2)." }]
    },
    /* Stage 8: one chat set is picked per run */
    sets: [
      { id: "gym", name: "Hilltop Gym", qa: [
        ["when does the gym open", "at six am"],
        ["when does the gym close", "at ten pm"],
        ["when does the yoga class start", "at five pm"],
        ["how much is the monthly pass", "nine hundred baht"],
        ["where are the showers", "behind the pool"],
        ["is the sauna free", "yes for members"],
        ["who teaches the yoga class", "coach mint"],
        ["can i bring a friend", "yes on sundays"]],
        ask: ["when does the sauna open", "who teaches the swim class", "how much is the yoga class", "where is the sauna",
          "is the yoga class free", "when does the pool close", "how much is a day pass"] },
      { id: "bus", name: "Riverside Bus Station", qa: [
        ["when does the first bus leave", "at five am"],
        ["when does the last bus leave", "at eleven pm"],
        ["where is the ticket office", "near gate two"],
        ["how much is a ticket to town", "twenty baht"],
        ["is there a bus to the airport", "yes every hour"],
        ["where can i buy water", "at the shop by gate one"],
        ["who sells the tickets", "the ticket office"],
        ["can i pay by card", "only at the ticket office"]],
        ask: ["how much is a ticket to the airport", "where can i buy a ticket", "who sells water", "is there a bus to the beach",
          "can i pay by phone", "when does the ticket office open"] },
      { id: "library", name: "Maple School Library", qa: [
        ["when does the library open", "at eight am"],
        ["when does the library close", "at five pm"],
        ["how many books can i borrow", "five books"],
        ["where are the science books", "on the second floor"],
        ["who is the librarian", "mr dan"],
        ["can i print here", "yes ten baht a page"],
        ["is there free wifi", "yes ask the librarian"],
        ["where can i study in a group", "room b"]],
        ask: ["where are the history books", "how many pages can i print", "when does the computer room open", "who is the cleaner",
          "is there free coffee", "how many books can i print"] }
    ],
    copy: [
      { prompt: "our new teacher is mr korn . today mr", options: ["korn", "dan", "lee", "kim"] },
      { prompt: "the wifi password is blue tiger . i typed blue", options: ["tiger", "sky", "password", "[end]"] },
      { prompt: "my cat is named sir fluffy . yesterday sir", options: ["fluffy", "cat", "named", "lee"] },
      { prompt: "the secret word is pineapple cloud . the secret word is pineapple", options: ["cloud", "juice", "word", "[end]"] },
      { prompt: "the band is called the paper moons . tonight the paper", options: ["moons", "cup", "band", "plane"] },
      { prompt: "our team name is red falcons . go red", options: ["falcons", "team", "car", "bus"] },
      { prompt: "my brother has a dog called captain biscuit . i walked captain", options: ["biscuit", "dog", "brother", "hook"] }
    ],
    addon: [
      { text: "What time does tonight's football match start?", needs: true, why: "Tonight's match times are new information that changes. It needs a web search." },
      { text: "How many emails are in my inbox right now?", needs: true, why: "Your inbox is private and changes all the time. A plain model can't see it." },
      { text: "What did my manager write in yesterday's report file?", needs: true, why: "A private file from yesterday: it needs a tool that opens the file." },
      { text: "Which cakes are in stock at our shop today?", needs: true, why: "Today's stock is live, private information: it needs a lookup." },
      { text: "Summarise the paragraph I pasted below.", needs: false, why: "The paragraph is in the prompt. The model can work with what's in front of it." },
      { text: "Translate “good morning” into French.", needs: false, why: "Common language patterns were in its training text: no lookup needed." },
      { text: "Write a short poem about rain.", needs: false, why: "Writing new text from learned patterns is what a plain model does." },
      { text: "Finish this sentence: “Thank you very …”", needs: false, why: "A very common phrase: next-word prediction is enough." }
    ],
    /* Final questions 13-14: their own chats, prompts and requests */
    final: {
      sets: [
        { id: "park", name: "Sunny Park", qa: [
          ["when does the park open", "at five am"],
          ["when does the park close", "at nine pm"],
          ["when does the boat ride start", "at ten am"],
          ["how much is the boat ride", "fifty baht"],
          ["where are the toilets", "near the lake"],
          ["is the zoo corner free", "yes for children"],
          ["who feeds the ducks", "uncle tam"],
          ["can i ride a bike here", "yes on the red path"]],
          ask: ["when does the zoo corner open", "who feeds the fish", "how much is the zoo corner", "where is the lake",
            "can i ride a horse here", "how much is a bike"] }
      ],
      copy: [
        { prompt: "the new robot is called zibo max . we asked zibo", options: ["max", "robot", "called", "new"] },
        { prompt: "the lab password is green kettle . i typed green", options: ["kettle", "tea", "lab", "[end]"] },
        { prompt: "our class mascot is a turtle named slow joe . go slow", options: ["joe", "turtle", "down", "class"] }
      ],
      addon: [
        { text: "What is the newest price list on our supplier's website?", needs: true, why: "A website that changes: it needs a web search." },
        { text: "Which of our customers paid late last month, from our sales file?", needs: true, why: "A private file: it needs a tool that opens it." },
        { text: "Fix the grammar in the sentence I pasted.", needs: false, why: "The sentence is in the prompt: no lookup needed." },
        { text: "Give three ideas for a birthday party theme.", needs: false, why: "New ideas from learned patterns: a plain model can do it." }
      ]
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
