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
        { text: "What will the weather be in my town tomorrow?", needs: true, why: "Tomorrow's weather is new information: it was never in the training text and it isn't in the prompt." },
        { text: "Turn this into a polite email: “send me the file now”.", needs: false, why: "Everything it needs is in the prompt. Rewriting text is what a plain model does." },
        { text: "Tell me what our caf\u00e9's staff handbook says about breaks.", needs: true, why: "Your own file was never in its training text. It needs a tool that opens the file (File search in Part 2)." }]
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
          "where is the airport bus", "who sells the tickets", "when do the toilets close", "is the airport bus free"] },
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
          "can i borrow a computer", "when is the librarian here", "when can i borrow books", "is the wifi free"] }
    ],
    // copy prompts: the last word appears exactly once earlier; every option is the same kind of word (names with
    // names), and two wrong options are other words from the prompt, so neither "the capitalised one" nor
    // "the one that is in the prompt" gives the answer away (checked by tests/check-toy2.js)
    copy: [
      { prompt: "our new teacher is mr korn from the north and our coach is miss dao . today mr", options: ["korn", "miss", "dao", "lucas"] },
      { prompt: "the wifi password is blue tiger and the door code is red lion for the back gate . i typed red", options: ["lion", "tiger", "red", "sky"] },
      { prompt: "my cat is named sir fluffy because she is soft and my dog is named lady rose . yesterday sir", options: ["fluffy", "lady", "rose", "buttercup"] },
      { prompt: "the band is called the paper moons and the singer is called big sun from korea . tonight big", options: ["sun", "moons", "band", "rockets"] },
      { prompt: "our team is red falcons from room five and their team is blue sharks . go red", options: ["falcons", "sharks", "team", "car"] },
      { prompt: "my brother has a dog called captain biscuit who loves the beach and a parrot called pepper . i walked captain", options: ["biscuit", "brother", "pepper", "rex"] }
    ],
    // add-on requests: questions and commands on both sides, and "my/our/today" on both sides, so the form of the
    // sentence is no shortcut (tests/check-toy2.js checks such rules)
    addon: [
      { text: "What time does tonight's football match start?", needs: true, why: "Tonight's match times are new information that changes. It needs a web search." },
      { text: "Check how many emails are in my inbox right now.", needs: true, why: "Your inbox is private and changes all the time. A plain model can't see it." },
      { text: "Tell me what my manager wrote in yesterday's report file.", needs: true, why: "A private file from yesterday: it needs a tool that opens the file." },
      { text: "Which cakes are in stock at our shop today?", needs: true, why: "Today's stock is live, private information: it needs a lookup." },
      { text: "Find today's top news story.", needs: true, why: "Today's news is new information: it needs a web search." },
      { text: "Summarise the paragraph I pasted below.", needs: false, why: "The paragraph is in the prompt. The model can work with what's in front of it." },
      { text: "What is the French word for \u201cgood morning\u201d?", needs: false, why: "Common language patterns were in its training text: no lookup needed." },
      { text: "Can you write a short poem about rain?", needs: false, why: "Writing new text from learned patterns is what a plain model does." },
      { text: "Fix the grammar in my sentence below.", needs: false, why: "Your sentence is in the prompt: no lookup needed, even though it is yours." },
      { text: "Write a short message to my boss saying I'm sick today.", needs: false, why: "Everything it needs is in the request. Writing a message is what a plain model does." },
      { text: "What rhymes with \u201crain\u201d?", needs: false, why: "Common word patterns were in its training text: no lookup needed." },
      { text: "When does the next train to the airport leave?", needs: true, why: "Train times change, so the training text may be out of date: it needs a lookup." },
      { text: "Is it raining at the beach right now?", needs: true, why: "Live weather is new information: it needs a web search." },
      { text: "Plan three games for our class party this afternoon.", needs: false, why: "Ideas from learned patterns: no lookup needed, even though it's about your class today." },
      { text: "Explain to a ten-year-old what a spreadsheet is and why people use one.", needs: false, why: "Common knowledge from its training text: no lookup needed." },
      { text: "How do you say \u201cthank you\u201d in Japanese?", needs: false, why: "Common language patterns were in its training text: no lookup needed." },
      { text: "Show me the bus timetable for tomorrow.", needs: true, why: "Timetables change, so the training text may be out of date: it needs a lookup." },
      { text: "What is the score of the football match?", needs: true, why: "A live score is new information: it needs a web search." },
      { text: "Look up the price of a flight to Tokyo.", needs: true, why: "Prices change: it needs a web search." },
      { text: "Tell me a joke for my sister's birthday today.", needs: false, why: "Making up a joke uses learned patterns: no lookup needed." },
      { text: "Write a to-do list for a busy school day.", needs: false, why: "Writing from learned patterns: no lookup needed." },
      { text: "Translate the name card text I pasted below into English.", needs: false, why: "The name card text is in the prompt: translating it needs no lookup." },
      { text: "What is a good name for my new puppy?", needs: false, why: "Ideas from learned patterns: no lookup needed." },
      { text: "Check the news.", needs: true, why: "The news is new information: it needs a web search." },
      { text: "Write a summary of today's top news story.", needs: true, why: "Today's news is new information: it needs a web search before it can write anything." },
      { text: "Make a list of my meetings tomorrow from my calendar.", needs: true, why: "Your calendar is private: it needs a tool that opens it." },
      { text: "Check the paragraph below for spelling mistakes.", needs: false, why: "The paragraph is in the prompt: no lookup needed, even though the request says \u201ccheck\u201d." },
      { text: "Find three words that rhyme with \u201ccat\u201d.", needs: false, why: "Common word patterns were in its training text: no lookup needed, even though the request says \u201cfind\u201d." },
      { text: "Give me the latest exchange rate for US dollars.", needs: true, why: "Exchange rates change every day: it needs a web search." },
      { text: "Explain what happened in the news this morning.", needs: true, why: "This morning's news is new information: it needs a web search first." },
      { text: "Show me how to write a polite apology.", needs: false, why: "Writing advice from learned patterns: no lookup needed, even though the request says \u201cshow\u201d." },
      { text: "Tell me a bedtime story for tonight.", needs: false, why: "Making up a story uses learned patterns: no lookup needed, even though it says \u201ctonight\u201d." },
      { text: "Write a poem about tomorrow.", needs: false, why: "Writing a poem uses learned patterns: no lookup needed, even though it says \u201ctomorrow\u201d." },
      { text: "Make a shopping list for our dinner tonight.", needs: false, why: "A list from learned patterns: no lookup needed, even though it's for tonight." }
    ],
    /* Final questions 13-14: their own chats, prompts and requests */
    final: {
      sets: [
        { id: "garden", name: "Green Garden", qa: [
          ["when does the garden open", "at five am"],
          ["when does the boat ride start", "at ten am"],
          ["when does the kiosk open", "at eight am"],
          ["when does the garden close", "at nine pm"],
          ["how much is the zoo corner", "fifty baht"],
          ["where are the toilets", "near the lake"],
          ["who feeds the ducks", "uncle tam"],
          ["can i ride a bike here", "yes on the red path"]],
          ask: ["when does the zoo corner open", "when does the zoo corner close", "who feeds the fish", "how much is the boat ride",
            "can i ride a horse here", "how much is a bike", "who can ride the boat", "can i feed the ducks here", "where is the zoo corner",
            "how much is a duck ride", "can i fish in the lake", "where are the bikes"] },
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
            "who runs the night show", "what are the food court hours", "how much is grilled fish", "where is gate b", "who cooks the grilled fish"] }
      ],
      copy: [
        { prompt: "the new robot is called zibo max in our lab and the old one is called rolo . we asked zibo", options: ["max", "robot", "rolo", "tim"] },
        { prompt: "on monday we cook fried rice with egg and on friday we cook green curry . today we cook fried", options: ["rice", "friday", "curry", "pie"] },
        { prompt: "our class mascots are a turtle called tiny joe and a frog called big sam from the pond . go big", options: ["sam", "joe", "turtle", "boss"] },
        { prompt: "my phone password is lucky seven this month and my bike lock is happy nine . i entered lucky", options: ["seven", "lock", "nine", "ten"] },
        { prompt: "the shop sells moon cakes on sunday and star cookies on monday . i bought star", options: ["cookies", "cakes", "sunday", "buns"] },
        { prompt: "the river boat is called silver fish on weekdays and the sea boat is called golden crab . we sailed on the silver", options: ["fish", "river", "crab", "shark"] }
      ],
      addon: [
        { text: "What is the newest price list on our supplier's website?", needs: true, why: "A website that changes: it needs a web search." },
        { text: "Open the sales file and list who paid late.", needs: true, why: "A private file: it needs a tool that opens it." },
        { text: "Find the gold price right now.", needs: true, why: "Live prices are new information: it needs a web search." },
        { text: "Can you fix the grammar in my sentence below?", needs: false, why: "The sentence is in the prompt: no lookup needed." },
        { text: "Look up the train times to the airport.", needs: true, why: "Train times change, so the training text may be out of date: it needs a lookup." },
        { text: "What is a good name for a pet goldfish?", needs: false, why: "New ideas from learned patterns: no lookup needed." },
        { text: "Write a short report of yesterday's sales from our sales file.", needs: true, why: "A private file from yesterday: it needs a tool that opens it before it can write." },
        { text: "Give me today's top three headlines.", needs: true, why: "Today's headlines are new information: it needs a web search." },
        { text: "Show me how to fold a paper plane.", needs: false, why: "Common how-to knowledge from its training text: no lookup needed." },
        { text: "Write a short poem for tonight's class party.", needs: false, why: "Writing a poem uses learned patterns: no lookup needed, even though it says \u201ctonight\u201d." },
        { text: "Find a word that means \u201chappy\u201d.", needs: false, why: "Common word knowledge: no lookup needed, even though the request says \u201cfind\u201d." },
        { text: "Give three ideas for a birthday party theme.", needs: false, why: "New ideas from learned patterns: a plain model can do it." },
        { text: "Write a polite note to our customers saying the shop opens late today.", needs: false, why: "Everything it needs is in the request: writing a note needs no lookup." }
      ]
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
