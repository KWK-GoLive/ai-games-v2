/*
 * AI games v2.1 PREVIEW · Be the Agent — lesson/stage 4: the context window (what the model can still see).
 * Toy rule: the context window holds a fixed number of words. Counting from the NEWEST message back, a message is
 * inside only if it fits completely; older messages have slid out (the model can't see them; Ploy still can).
 * (Real chat apps count tokens, not words, and either drop the oldest part or summarise it.)
 * No DOM in the item part, so tests/check-agent21.js can run it in Node.
 */
(function (root) {
  "use strict";
  function shuffle(a, rng) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var SIZE = 60;   // the toy context window, in words
  /* a word = a run of characters between spaces that contains a letter or a digit ("—", "…" alone don't count) */
  function words(text) { return String(text || "").split(/\s+/).filter(function (w) { return /[A-Za-z0-9฀-๿]/.test(w); }).length; }
  /* the index of the oldest message still inside a window of `size` words (msgs: [{text}], oldest first) */
  function firstInside(msgs, size) {
    var used = 0, i = msgs.length;
    while (i > 0 && used + words(msgs[i - 1].text) <= size) { used += words(msgs[i - 1].text); i--; }
    return i;   // msgs[i..] are inside; msgs[0..i-1] have slid out
  }

  /* ---------- "What can the model still see?" chats (h = Ploy, m = the model) ---------- */
  function C(id, rows) { return { id: id, msgs: rows.map(function (r) { return { from: r[0] === "h" ? "human" : "model", text: r[1] }; }) }; }
  var SEE = [
    C("milk", [["h", "Hi! Our milk supplier is Green Farm. Their delivery comes every Monday and Thursday morning."],
      ["m", "Thanks, Ploy. Green Farm delivers milk on Mondays and Thursdays."],
      ["h", "Can you write a short sign saying the oat milk is sold out today?"],
      ["m", "Sorry, oat milk is sold out today. It will be back tomorrow!"],
      ["h", "Great. Also, which drinks use the most milk?"],
      ["m", "Lattes and mochas use the most milk, then the iced drinks."],
      ["h", "OK. When does Green Farm deliver again?"]]),
    C("roster", [["h", "This week Bobby works the morning shift from 7 am to 3 pm, and Fon works the evening shift from 3 pm to 11 pm, except on Sunday."],
      ["m", "Got it: Bobby mornings, Fon evenings this week."],
      ["h", "Please write a friendly reminder for the staff to wash their hands before every shift and to tie long hair back in the kitchen."],
      ["m", "Friendly reminder: please wash your hands before every shift. Thank you for keeping our café safe and clean!"],
      ["h", "Nice. Can you make it a bit shorter?"],
      ["m", "Please wash your hands before every shift. Thank you!"],
      ["h", "Thanks. Who works this evening?"]]),
    C("party", [["h", "On Saturday we host a birthday party for 12 children at 3 pm. Their parents will also come, so please plan drinks for about 20 adults too, and keep the back room free for them."],
      ["m", "Noted: a birthday party for 12 children on Saturday at 3 pm."],
      ["h", "Give me three ideas for a fun kids' drink."],
      ["m", "1. Strawberry milk with a small cookie on top. 2. A rainbow fruit soda with three colours of syrup. 3. Warm chocolate milk with tiny marshmallows and a fun paper straw."],
      ["h", "Love the rainbow soda. How do we make it?"],
      ["m", "Pour layers of red, orange and yellow fruit syrup, add ice slowly, then top it with soda water."],
      ["h", "Perfect. How many children are coming?"]]),
    C("wifi", [["h", "The café wifi password changed to MOON2026 today."],
      ["m", "Thanks. The new wifi password is MOON2026."],
      ["h", "A customer asks if we have vegan cakes. Do we?"],
      ["m", "I can't see our menu here. Shall I search the café's files?"],
      ["h", "Yes, the banana cake is vegan."],
      ["m", "Great, I'll tell her: our banana cake is vegan."],
      ["h", "And what should I tell her about the wifi?"]]),
    C("supplier", [["h", "Our bean supplier Doi Hills is closed from 20 to 25 December."],
      ["m", "Noted: Doi Hills is closed from 20 to 25 December."],
      ["h", "Write a short post about our new pumpkin latte."],
      ["m", "New: Pumpkin Latte is here, only this autumn!"],
      ["h", "Make it sound more fun."],
      ["m", "Pumpkin Latte season is HERE! Grab yours today!"],
      ["h", "Thanks. Should I order beans on 22 December?"]]),
    C("cleaning", [["h", "The coffee machine must be cleaned every night, and Fon does it on Fridays."],
      ["m", "OK: clean the coffee machine every night; Fon does it on Fridays."],
      ["h", "Write a short sign asking customers to return their trays to the counter."],
      ["m", "Please return your tray to the counter when you finish. Thank you for helping us keep Moonbean tidy!"],
      ["h", "Good. Make it friendlier, please, and add that the staff are always happy to help with anything else a customer needs today, and remind them that we are open until 8 pm."],
      ["m", "Finished? Please bring your tray back to the counter, and ask us if you need anything else at all. We're always happy to help. Thank you, friend!"],
      ["h", "Great. Who cleans the machine tonight? It's Friday."]])
  ];
  /* lesson 4 practice only */
  var PRACTICE_SEE = [
    C("p-cups", [["h", "From today we use paper cups only. No plastic cups, please."],
      ["m", "Noted: paper cups only, no plastic cups from today."],
      ["h", "Write a short thank-you to the morning team."],
      ["m", "Thank you, morning team, for a smooth and busy start today!"],
      ["h", "Can I give a customer a plastic cup?"]]),
    C("p-closing", [["h", "On Sunday we close early, at 4 pm, for staff training."],
      ["m", "OK: on Sunday the café closes at 4 pm for staff training."],
      ["h", "What is a good name for a new iced tea?"],
      ["m", "How about “Moon Breeze”? It sounds fresh and matches Moonbean."],
      ["h", "Nice. Another one?"],
      ["m", "“Sunset Peach”: it sounds sweet, cool and easy to remember."],
      ["h", "A customer asks: what time do we close on Sunday?"]]),
    C("p-allergy", [["h", "Table 4 has a nut allergy. Please remember that for their order."],
      ["m", "Noted: table 4 has a nut allergy."],
      ["h", "Table 4 wants two desserts. What do you suggest?"]])
  ];
  /* the lesson's worked example (teaching only; the no-repeat test keeps it out of stages and the Arena) */
  var EXAMPLE = C("ex-name", [["h", "Hi! I'm Ploy, the shift manager. Please call the owner Khun Somsak in all messages."],
    ["m", "Hello Ploy! I'll call the owner Khun Somsak."],
    ["h", "Please write a short note for the staff: the new mugs arrive on Friday."],
    ["m", "Hi team! Our new mugs arrive on Friday. Please make space on the shelf behind the counter."],
    ["h", "Thanks. Can you add that they are blue and white?"],
    ["m", "Hi team! Our new blue and white mugs arrive on Friday. Please make space on the shelf behind the counter."],
    ["h", "Now write a short thank-you message to the owner for the new mugs."],
    ["m", "Dear owner, thank you for the lovely new mugs!"]]);

  function seeItem(c, rng) {
    var i0 = firstInside(c.msgs, SIZE);
    var opts = c.msgs.map(function (m, i) { return { value: i, label: (m.from === "human" ? "👩 Ploy: " : "🤖 Model: ") + "“" + m.text + "” (" + words(m.text) + " words)" }; });
    var key = i0;
    return { kind: "window", id: c.id, limit: 75, size: SIZE, msgs: c.msgs, options: opts, key: key,
      title: "The context window holds " + SIZE + " words. Which is the OLDEST message the model can still see?",
      hint: "Start at the newest message and add up the words going up. Stop before the message that doesn't fit completely.",
      grade: function (a) {
        var ok = Number(a) === key, shown = 0;
        for (var j = key; j < c.msgs.length; j++) shown += words(c.msgs[j].text);
        var before = key > 0 ? words(c.msgs[key - 1].text) : 0;
        return { frac: ok ? 1 : 0, explain: (ok ? "✓ " : "✗ ") + "From the newest message up, message " + (key + 1) + " is the last that fits: " + shown + " of " + SIZE + " words" +
          (key > 0 ? ". Adding message " + key + " (" + before + " words) would make " + (shown + before) + ", more than " + SIZE + ", so message " + key + " and older have slid out. Ploy still sees them; the model doesn't." : ". The whole chat fits.") };
      },
      solve: function () { return key; },
      sample: function (r) { return Math.floor(r() * c.msgs.length); } };
  }

  /* ---------- "Why did it go wrong?" ---------- */
  var CAUSES = [
    { value: "out", label: "⬆ The fact was in an old message that slid out of the context window" },
    { value: "never", label: "🚫 Ploy never told the model that fact" },
    { value: "newchat", label: "🆕 It's a new chat: the fact was in an earlier chat, and a new chat starts empty" },
    { value: "app", label: "🧰 An app sent back the wrong information" }];
  /* msgs: the chat the model had; newChat: the chat started fresh (a "New chat" note on top); wrong: the model's wrong reply */
  function W(id, cause, newChat, rows, wrong, fact) { var c = C(id, rows); c.cause = cause; c.newChat = newChat; c.wrong = wrong; c.fact = fact; return c; }
  /* each chat ends with Ploy's request; the model's wrong reply comes after it; "fact" = what the reply should have used */
  var WHY = [
    W("why-baht", "out", false, [["h", "Please write every price in baht, never in dollars."],
      ["m", "OK, I'll always use baht."],
      ["h", "Write a short welcome message for our new menu board."],
      ["m", "Welcome to Moonbean! Fresh coffee, warm cakes and a smile, every day from 7 am."],
      ["h", "Lovely. Now add a line about our cheapest hot drink."],
      ["m", "Our cheapest hot drink: an Americano, from today's menu board."],
      ["h", "Great. And the price of a latte is sixty-five. Write that line too."]], "A latte costs $65.", "every price in baht, never in dollars"),
    W("why-name", "newchat", true, [["h", "As I said yesterday, the owner's name goes at the top. Please write the weekly memo."]], "Dear owner, here is the weekly memo.", "the owner's name itself (Ploy told it in yesterday's chat)"),
    W("why-time", "never", false, [["h", "Write a sign for the door about tomorrow's opening time."]], "We open tomorrow at our usual time, 7 am. See you soon!", "tomorrow the café opens at 10 am, because of a staff meeting"),
    W("why-table", "out", false, [["h", "Table 7 asked for no sugar in any of their drinks."],
      ["m", "Noted: no sugar for table 7."],
      ["h", "Write a short note for the kitchen: the brownies are almost gone."],
      ["m", "Kitchen: brownies are almost gone. Please bake a new tray if you can."],
      ["h", "Thanks. Also remind Bobby to restock the paper cups before lunch."],
      ["m", "Bobby, please restock the paper cups before lunch. Thank you!"],
      ["h", "Table 7 wants two iced lattes now. Any notes for the barista?"]], "Two iced lattes for table 7, regular sweetness.", "no sugar in any drink for table 7"),
    W("why-staff", "newchat", true, [["h", "Please write the shift plan for Bobby and Fon, with the hours I gave you this morning."]], "Bobby: 9 am–5 pm. Fon: 5 pm–1 am.", "the shift hours Ploy gave this morning"),
    W("why-cake", "never", false, [["h", "A customer wants a cake for her mother's birthday. What should I offer?"]], "Our chocolate cake is popular for birthdays.", "her mother can't eat chocolate"),
    W("why-delivery", "never", false, [["h", "Please write a short welcome note for our new barista, Mint."],
      ["m", "Welcome to the team, Mint! We're so happy you're joining Moonbean. Ask us anything, any time."],
      ["h", "Lovely. Now write a reminder that the staff meeting is on Monday at 9 am."],
      ["m", "Reminder: staff meeting on Monday at 9 am. Please be on time!"],
      ["h", "Thanks. A customer wants her cake delivered tomorrow. Can we deliver to Silom?"]], "Yes, we deliver to Silom every day.", "Moonbean only delivers within 2 km, and Silom is farther")
  ];
  var PRACTICE_WHY = [
    W("p-why-music", "newchat", true, [["h", "Like I told you in our last chat, play the jazz list. Which list should I put on now?"]], "How about the pop list?", "play the jazz list"),
    W("p-why-ice", "out", false, [["h", "Our ice machine is broken today, so no iced drinks."],
      ["m", "Noted: no iced drinks today."],
      ["h", "Write a short thank-you for a customer who left a kind review."],
      ["m", "Thank you so much for your kind words! We hope to see you again soon at Moonbean."],
      ["h", "Lovely. Also, write a one-line note asking staff to sweep the patio."],
      ["m", "Team: please sweep the patio before we open. Thank you!"],
      ["h", "A customer asks what cold drink we recommend today."]], "Try our iced mocha!", "no iced drinks today"),
    W("p-why-dog", "never", false, [["h", "Can a customer bring her dog inside?"]], "Yes, dogs are welcome inside!", "dogs are allowed on the patio only")
  ];
  function whyItem(c, rng) {
    var opts = shuffle(CAUSES, rng);
    var right = CAUSES.filter(function (x) { return x.value === c.cause; })[0];
    var tail = c.cause === "out" ? " The fact (“" + c.fact + "”) was in message 1, but counting up from Ploy's last message the chat is more than " + SIZE + " words, so message 1 had slid out."
      : c.cause === "newchat" ? " What Ploy said in another chat isn't in this context window (unless a memory feature or Ploy pastes it in)."
      : " Nothing in the chat says it (“" + c.fact + "”): the model can't know what it was never told. The fix is to tell it.";
    return { kind: "why", id: c.id, limit: 60, size: SIZE, msgs: c.msgs, newChat: c.newChat, wrong: c.wrong, fact: c.fact, options: opts, key: c.cause,
      title: "The model's reply was wrong. Why?",
      hint: "Is the fact anywhere in this chat? If so, does its message still fit in the " + SIZE + "-word window (count up from Ploy's last message)?",
      grade: function (a) { var ok = a === c.cause; return { frac: ok ? 1 : 0, explain: (ok ? "✓ " : "✗ ") + right.label.replace(/^\S+ /, "") + "." + tail }; },
      solve: function () { return c.cause; },
      sample: function (r) { return opts[Math.floor(r() * opts.length)].value; } };
  }

  /* ---------- "Best fix" ---------- */
  var FIXES = [
    { value: "repeat", label: "🔁 Say the fact again in the next message" },
    { value: "summary", label: "🆕 Start a new chat that begins with a short summary of the key facts" },
    { value: "notes", label: "📌 Put it in saved notes (memory / custom instructions) that are added to every new chat" },
    { value: "nothing", label: "🤷 Nothing: the model remembers everything we ever said" }];
  var FIX = [
    { id: "fix-once", key: "repeat", text: "Ploy told the model at the start of today's long chat that table 3 is vegan. It has slid out, and she needs one dessert idea for table 3 right now.", why: "One fact, needed once, right now: just say it again in the next message." },
    { id: "fix-always", key: "notes", text: "Every day, Ploy has to tell the model again that Moonbean's prices are in baht and that the owner is Khun Somsak. These facts never change.", why: "Facts that never change and are needed in every chat belong in saved notes: the app adds them to each new chat for you." },
    { id: "fix-long", key: "summary", text: "Today's chat about the new menu is very long, and the model keeps mixing up old prices with the new ones. Ploy wants to finish the menu.", why: "A long, messy chat: start fresh with a short summary of only what matters now (the new prices), so the window holds the right facts." },
    { id: "fix-signoff", key: "notes", text: "Ploy wants every email the model writes, in every chat, to end with “Moonbean Café, Bangkok”.", why: "A rule for every chat: put it in saved notes, so every new chat starts with it." },
    { id: "fix-size", key: "repeat", text: "In a long chat, Ploy said early on that the large cup is 16 oz. Now the model wrote 12 oz for the large cup in the last reply. She only needs that one line fixed.", why: "One fact slid out and one line needs fixing: repeat the fact now." },
    { id: "fix-switch", key: "summary", text: "After two hours of planning the staff party in one chat, the model is mixing up the old ideas Ploy dropped with the plan she kept. She wants a clean final plan.", why: "Start a new chat with a short summary of the plan she kept: old, dropped ideas no longer crowd the window." }
  ];
  var PRACTICE_FIX = [
    { id: "p-fix-once", key: "repeat", text: "Ploy said at the start of a long chat that today's soup is pumpkin. A customer asks now, and the model doesn't know.", why: "One fact, needed now: say it again." },
    { id: "p-fix-always", key: "notes", text: "Ploy wants the model to answer in short sentences, in every chat, every day.", why: "A rule for every chat: saved notes." },
    { id: "p-fix-long", key: "summary", text: "A chat about next month's rota has grown very long, with many changed plans. The model now mixes old and new shifts. Ploy wants the final rota.", why: "Start a new chat with a short summary of the final plan." }
  ];
  function fixItem(f, rng) {
    var opts = shuffle(FIXES, rng), right = FIXES.filter(function (x) { return x.value === f.key; })[0];
    return { kind: "fix", id: f.id, limit: 45, text: f.text, options: opts, key: f.key,
      title: "What is the best fix?",
      hint: "Is it one fact needed now, a fact needed in every chat, or a chat that has grown too long and messy?",
      grade: function (a) { var ok = a === f.key; return { frac: ok ? 1 : 0, explain: (ok ? "✓ " : "✗ ") + right.label.replace(/^\S+ /, "") + ". " + f.why }; },
      solve: function () { return f.key; },
      sample: function (r) { return opts[Math.floor(r() * opts.length)].value; } };
  }

  /* stage 4: 6 items, 2 of each kind; the two "why" items always have different causes, the two "fix" items different keys */
  function twoDifferent(pool, keyOf, rng) {
    var s = shuffle(pool, rng), a = s[0], b = s.filter(function (x) { return keyOf(x) !== keyOf(a); })[0];
    return [a, b];
  }
  function stage(rng) {
    var see = shuffle(SEE, rng).slice(0, 2).map(function (c) { return seeItem(c, rng); });
    var why = twoDifferent(WHY, function (c) { return c.cause; }, rng).map(function (c) { return whyItem(c, rng); });
    var fix = twoDifferent(FIX, function (f) { return f.key; }, rng).map(function (f) { return fixItem(f, rng); });
    return [see[0], why[0], fix[0], see[1], why[1], fix[1]];
  }
  var BAG = {}, LAST = {};
  function deal(k, pool, rng) {
    if (!BAG[k] || !BAG[k].length) { BAG[k] = shuffle(pool, rng); if (pool.length > 1 && BAG[k][BAG[k].length - 1] === LAST[k]) BAG[k].unshift(BAG[k].pop()); }
    return (LAST[k] = BAG[k].pop());
  }
  var PRACTICE = {
    see: function (rng) { return seeItem(deal("see", PRACTICE_SEE, rng), rng); },
    why: function (rng) { return whyItem(deal("why", PRACTICE_WHY, rng), rng); },
    fix: function (rng) { return fixItem(deal("fix", PRACTICE_FIX, rng), rng); }
  };

  var api = { SIZE: SIZE, words: words, firstInside: firstInside, SEE: SEE, PRACTICE_SEE: PRACTICE_SEE, EXAMPLE: EXAMPLE, WHY: WHY, PRACTICE_WHY: PRACTICE_WHY,
    FIX: FIX, PRACTICE_FIX: PRACTICE_FIX, CAUSES: CAUSES, FIXES: FIXES, seeItem: seeItem, whyItem: whyItem, fixItem: fixItem, stage: stage, PRACTICE: PRACTICE,
    resetPractice: function () { BAG = {}; LAST = {}; } };
  root.AGENT_WINDOW = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
