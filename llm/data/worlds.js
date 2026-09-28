/*
 * AI games v2 · LLM Arena — the small training texts for the arena stages. All made up for this game.
 * (The lessons use their own, smaller texts: see llm/js/lessons.js.)
 * Plain sentences: lower case, no punctuation. Each stage picks one world at random.
 */
window.LLMA_DATA = {
  worlds: [
    { id: "station", name: "Space station", text: [
      "the robot fixed the door",
      "the robot fixed the light",
      "the captain fixed the robot",
      "the robot opened the door",
      "a cat opened the box",
      "the captain opened the door",
      "the door was open",
      "the light was green"
    ] },
    { id: "pirates", name: "Pirate ship", text: [
      "the pirate found a map",
      "the pirate found a coin",
      "the parrot found a coin",
      "a map shows the island",
      "a coin shows the king",
      "the pirate lost the map",
      "the parrot lost a feather",
      "the king lost the island"
    ] },
    { id: "bakery", name: "Bakery", text: [
      "we bake bread every morning",
      "we bake cakes every friday",
      "we sell bread every morning",
      "they sell cakes every day",
      "the bread is warm",
      "the cake is sweet",
      "the bread is fresh",
      "we eat bread at night"
    ] },
    { id: "town", name: "Rainy town", text: [
      "it rains in the town",
      "it rains every day",
      "the town has a river",
      "the river is cold",
      "the river is wide",
      "the town is quiet",
      "a boat is on the river",
      "it snows in the hills"
    ] },
    { id: "zoo", name: "Zoo", text: [
      "the lion eats meat",
      "the panda eats bamboo",
      "the monkey eats fruit",
      "the monkey eats bananas",
      "the lion sleeps all day",
      "the panda sleeps in a tree",
      "the monkey climbs a tree",
      "the lion likes the sun"
    ] },
    { id: "football", name: "Football club", text: [
      "our team won the game",
      "our team lost the game",
      "their team won the cup",
      "our coach likes the game",
      "the game was long",
      "the cup was gold",
      "the fans love our team",
      "the fans sang a song"
    ] }
  ],

  /* Stage 7 (three-word boss): worlds whose wording makes the 3-, 2- and 1-word keyholes disagree.
   * "ask" = sentence starts the model must continue. tests/check-data.js checks each world has at least
   * 2 starts where the model uses 3 words, 2 where it backs off to 2, and 2 where it backs off to 1. */
  boss3: [
    { id: "colours", name: "Boats and bikes", text: [
      "the blue boat is slow",
      "the blue boat is old",
      "my blue boat is fast",
      "a blue bike is fast",
      "a blue bike is new",
      "we saw a blue kite",
      "we saw a big ship",
      "the big ship is old"
    ], ask: ["we saw a blue", "they like a blue", "my old blue", "a blue bike is", "your new bike is", "the blue boat is",
      "a fast red boat is", "my new blue", "they saw a blue", "a red bike is", "an old big"] },
    { id: "garden", name: "Garden", text: [
      "the tall tree has green leaves",
      "the tall tree has red fruit",
      "our old tree has green leaves",
      "the small tree has no leaves",
      "a small bird has red wings",
      "the small bird sings",
      "my green bird sings every day",
      "a tall man has a hat"
    ], ask: ["the tall tree has", "a small bird has", "the small tree has", "a big tree has", "her small bird", "my old bird",
      "the tall man has", "one small bird has", "his tall tree", "your pretty bird", "our big tree"] },
    { id: "week", name: "School week", text: [
      "on monday we play football",
      "on monday we eat rice",
      "on friday we eat noodles",
      "on friday they play games",
      "we eat noodles every day",
      "they eat rice at home",
      "we play games at school",
      "they play football at school"
    ], ask: ["on monday we", "on friday we", "on sunday we", "on friday they", "at home we", "every day they",
      "on monday they", "then we play", "at school they play", "so they eat"] }
  ],

  /* Stage 6: example chats. The model learns them as  Q: question A: answer  and answers new questions by continuing after "A:". */
  chats: [
    { id: "library", name: "Sunny Library", qa: [
      ["when does the library open", "at nine am"],
      ["when does the library close", "at six pm"],
      ["when does the pool open", "at seven am"],
      ["where is the library", "next to the park"],
      ["where is the pool", "behind the school"],
      ["who runs the library", "miss lee"],
      ["who runs the pool", "mr tan"],
      ["is the library free", "yes it is free"],
      ["is the pool free", "no it costs two dollars"]
    ], ask: ["where is the pool", "when is the library open", "when is the pool open", "who runs the library",
      "when does the park open", "who runs the park", "is the park free", "when does the pool close",
      "who is at the library", "where is the park", "is the school free"] },
    { id: "clinic", name: "Hilltop Clinic", qa: [
      ["when does the clinic open", "at eight am"],
      ["when does the pharmacy open", "at ten am"],
      ["when does the pharmacy close", "at five pm"],
      ["where is the clinic", "on hill road"],
      ["where is the pharmacy", "inside the mall"],
      ["who is the doctor", "doctor ana"],
      ["who is the nurse", "nurse ben"],
      ["is the clinic open on sunday", "no it is closed"],
      ["is the pharmacy open on sunday", "yes until noon"]
    ], ask: ["where is the pharmacy", "when is the pharmacy open", "when is the clinic open", "who is the nurse",
      "when does the clinic close", "who is the dentist", "where is the mall", "when does the mall open",
      "is the mall open on sunday", "where is the doctor", "is the clinic open on monday", "where is the hospital"] }
  ],

  /* Stage 3: count tables for the temperature questions (chosen so the % come out cleanly). */
  diceCounts: [[9, 4, 1], [16, 4], [9, 1], [4, 1, 1], [36, 9, 4]],
  diceContexts: [
    { ctx: "my favourite pet is a", words: ["cat", "dog", "fish"] },
    { ctx: "for lunch we had", words: ["rice", "soup", "pizza"] },
    { ctx: "the weather today is", words: ["sunny", "rainy", "windy"] },
    { ctx: "on friday we will", words: ["rest", "study", "dance"] }
  ]
};
