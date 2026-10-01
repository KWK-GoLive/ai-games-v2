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
        ["when does the bakery open", "at ten am"],
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
      { id: "gym", name: "Uptown Gym", qa: [
        ["when does the gym open", "at six am"],
        ["when does the spa open", "at seven am"],
        ["when does the juice bar open", "at nine am"],
        ["when does the gym close", "at ten pm"],
        ["what are the sauna hours", "two to eight pm"],
        ["how much is the monthly pass", "nine hundred baht"],
        ["who teaches the yoga class", "coach mint"],
        ["where are the showers", "behind the pool"]],
        ask: ["when does the sauna open", "when do the showers open", "when does the yoga class start", "when do the yoga classes start",
          "how much is the yoga class", "how much is a day pass", "how much is a sauna pass", "who teaches the swim class",
          "where are the lockers", "what are the pool hours", "when does the monthly pass start", "who teaches at the pool"] },
      { id: "bus", name: "Riverside Bus Station", qa: [
        ["when does the first bus leave", "at five am"],
        ["when does the last bus leave", "at eleven pm"],
        ["when does the ticket office open", "at six am"],
        ["when does the snack bar open", "at seven am"],
        ["how often is the airport bus", "every hour"],
        ["where can i buy water", "at the shop by gate one"],
        ["how much is a ticket to town", "twenty baht"],
        ["who cleans the toilets", "mr pong"]],
        ask: ["when does the airport bus come", "when do the toilets open", "how often is the town bus", "when does the water shop open",
          "where can i buy a ticket", "how much is a ticket to the airport", "who cleans the buses", "how much is the water",
          "where is the airport bus", "who sells the tickets", "when do the toilets close"] },
      { id: "library", name: "Maple Study Centre", qa: [
        ["when does the study centre open", "at eight am"],
        ["when does the study centre close", "at five pm"],
        ["when does the computer room open", "at nine am"],
        ["when does the reading room open", "at ten am"],
        ["how many books can i borrow", "five books"],
        ["where are the science books", "on the second floor"],
        ["who is the librarian", "mr dan"],
        ["can i print here", "yes ten baht a page"]],
        ask: ["when does the librarian start", "when is the printer free", "how many pages can i print", "where are the history books",
          "who is the cleaner", "can i print a book", "who is the computer room librarian", "where can i borrow books",
          "can i borrow a computer", "when is the librarian here", "when can i borrow books"] }
    ],
    // copy prompts: the last word appears exactly once earlier; every option is the same kind of word (names with
    // names), and two wrong options are other words from the prompt, so neither "the capitalised one" nor
    // "the one that is in the prompt" gives the answer away (checked by tests/check-toy2.js)
    copy: [
      { prompt: "our new teacher is mr korn and our coach is miss dao . today mr", options: ["korn", "dao", "lee", "coach"] },
      { prompt: "the wifi password is blue tiger and the door code is red lion . i typed red", options: ["lion", "tiger", "blue", "sky"] },
      { prompt: "my cat is named sir fluffy and my dog is named lady rose . yesterday lady", options: ["rose", "fluffy", "sir", "tom"] },
      { prompt: "the band is called the paper moons and the singer is called big sun . tonight the paper", options: ["moons", "sun", "big", "plane"] },
      { prompt: "our team name is red falcons and their team is blue sharks . go blue", options: ["sharks", "falcons", "red", "car"] },
      { prompt: "my brother has a dog called captain biscuit and a parrot called pepper . i walked captain", options: ["biscuit", "pepper", "brother", "rex"] }
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
        { id: "garden", name: "Green Garden", qa: [
          ["when does the garden open", "at five am"],
          ["when does the boat ride open", "at ten am"],
          ["when does the kiosk open", "at eight am"],
          ["when does the garden close", "at nine pm"],
          ["how much is the zoo corner", "fifty baht"],
          ["where are the toilets", "near the lake"],
          ["who feeds the ducks", "uncle tam"],
          ["can i ride a bike here", "yes on the red path"]],
          ask: ["when does the zoo corner open", "when does the zoo corner close", "who feeds the fish", "how much is the boat ride",
            "can i ride a horse here", "how much is a bike"] },
        { id: "market", name: "Night Market", qa: [
          ["when does the market open", "at five pm"],
          ["when does the food court open", "at six pm"],
          ["when does the night show open", "at eight pm"],
          ["when does the market close", "at midnight"],
          ["what are the parking hours", "four pm to one am"],
          ["how much is a mango shake", "forty baht"],
          ["who sells the grilled fish", "aunt noi"],
          ["where is the first aid tent", "next to gate b"]],
          ask: ["when does the parking open", "when does the fish stall open", "when does the mango shake stall close",
            "when does the first aid tent close", "how much is the parking", "where can i buy grilled fish", "where is the food court",
            "who runs the night show", "what are the food court hours"] }
      ],
      copy: [
        { prompt: "the new robot is called zibo max and the old one is called rolo . we asked zibo", options: ["max", "rolo", "robot", "bobo"] },
        { prompt: "the lab password is green kettle and the office password is gold spoon . i typed gold", options: ["spoon", "kettle", "green", "tea"] },
        { prompt: "our class mascots are a turtle called tiny joe and a frog called big sam . go big", options: ["sam", "joe", "tiny", "boss"] }
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
