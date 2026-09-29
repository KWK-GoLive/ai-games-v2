/*
 * AI games v2 · Warm-up: "What comes next?" — 8 quick questions on two tiny training texts (5 sentences each).
 * The answer is the word that most often came right after (what the toy model writes at temperature 0).
 * Answer keys come from the real toy model (shared/model.js). No DOM here, so tests can run it in Node.
 */
(function (root) {
  "use strict";
  var M = (root.BTL && root.BTL.Model) || require("../../shared/model.js");
  var END = M.END;
  var WORLDS = [
    { id: "school", name: "Going to school", text: ["we go to school by bus", "we go to the park", "i go to school by train", "they go home by bus", "the bus is late"] },
    { id: "kitchen", name: "Kitchen", text: ["mum cooks rice for dinner", "dad cooks rice for lunch", "mum cooks soup for dinner", "we eat rice for dinner", "the soup is hot"] },
    { id: "beach", name: "Beach day", text: ["we swim in the sea", "we play in the sand", "kids swim in the sea", "the sea is blue", "the sand is hot"] },
    { id: "music", name: "Music", text: ["she plays the piano every day", "he plays the guitar every night", "she sings every day", "they play the piano at school", "the piano is old"] }
  ];
  function shuffle(a, rng) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function dw(w) { return M.displayWord(w); }
  function q(w) { return "“" + dw(w) + "”"; }
  function vocabOf(world) { var v = []; world.text.forEach(function (s) { M.tokenize(s).forEach(function (w) { if (v.indexOf(w) < 0) v.push(w); }); }); return v; }
  // Contexts with one clear top word: several followers with a clear winner, or one follower seen at least twice.
  function contexts(world) {
    var m = M.Model.train(world.text, 1);
    return vocabOf(world).map(function (w) { return { w: w, dist: m.next([w], 1) }; }).filter(function (c) {
      return c.dist.length >= 2 ? c.dist[0].count > c.dist[1].count : c.dist.length === 1 && c.dist[0].count >= 2;
    }).sort(function (a, b) { return b.dist.length - a.dist.length; }); // stable: several followers first
  }
  function item(world, c, rng) {
    var key = c.dist[0].word;
    var followers = c.dist.map(function (d) { return d.word; });
    var others = shuffle(vocabOf(world).concat([END]).filter(function (w) { return followers.indexOf(w) < 0 && w !== c.w; }), rng);
    var opts = shuffle(followers.slice(0, 3).concat(others).slice(0, 4), rng);
    var counts = c.dist.map(function (d) { return dw(d.word) + " " + d.count; }).join(", ");
    return { kind: "mcq", world: world, ctx: c.w, key: key, limit: 30,
      title: "The model read only these 5 sentences. What does it write after " + q(c.w) + "?",
      options: opts.map(function (w) { return { value: w, label: dw(w) }; }),
      grade: function (a) {
        return { frac: a === key ? 1 : 0, explain: ["Right after " + q(c.w) + " the sentences have: " + counts + ". The model writes the word that came most often: " + q(key) + "." + (key === END ? " ([end] means the sentence stops there.)" : "")] };
      },
      sample: function (r) { return opts[Math.floor(r() * opts.length)]; } };
  }
  function stage(rng) {
    var worlds = shuffle(WORLDS, rng).slice(0, 2);
    var out = [];
    worlds.forEach(function (w) { out = out.concat(shuffle(contexts(w).slice(0, 6), rng).slice(0, 4).map(function (c) { return item(w, c, rng); })); });
    return out;
  }
  var api = { WORLDS: WORLDS, contexts: contexts, stage: stage, M: M };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.WARMUP = api;
})(typeof window !== "undefined" ? window : globalThis);
