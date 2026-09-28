/*
 * AI games v2 · Be the Agent — the apps (tools) the harness runs for the model. All real code, no eval:
 *   Calculator : arithmetic (+ - × ÷, brackets) and SUM over the sales file, e.g.  SUM(total WHERE item = Latte)
 *   File search: keyword search over the café's documents; returns pieces with file + page/section
 *   Web search : keyword search over the made-up mini-web; returns title, site, date, snippet
 *   Open page  : the full text of one mini-web page
 *   File maker : a real .xlsx, .docx or .csv file from what the model asks for
 * Works in the browser (window.AGENT_TOOLS) and in Node (module.exports) for the tests.
 */
(function (root) {
  "use strict";
  var E = (root.BTA && root.BTA.Engine) || require("./engine.js");
  var F = (root.BTA && root.BTA.Files) || require("./files.js");
  var D = root.AGENT_DATA || require("../data/cafe.js");

  function fmt(n) {
    var neg = n < 0; n = Math.abs(n);
    var s = (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    var parts = s.split("."); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-" : "") + parts.join(".");
  }
  function table() { return E.parseCsv(D.salesCsv); }

  /* ---------- Calculator ---------- */
  // SUM(<column>) or SUM(<column> WHERE <column> = <value>), over the sales file.
  var SUM_RE = /^\s*SUM\s*\(\s*([a-z]+)\s*(?:WHERE\s+([a-z]+)\s*=\s*([^)]+?)\s*)?\)\s*$/i;
  function calculator(input) {
    var s = String(input).trim();
    var m = SUM_RE.exec(s);
    try {
      if (m) {
        var t = table();
        var col = t.cols.filter(function (c) { return c.toLowerCase() === m[1].toLowerCase(); })[0];
        if (!col) throw new Error("the sales file has no column called “" + m[1] + "”");
        var rows = t.rows;
        if (m[2]) {
          var wc = t.cols.filter(function (c) { return c.toLowerCase() === m[2].toLowerCase(); })[0];
          if (!wc) throw new Error("the sales file has no column called “" + m[2] + "”");
          rows = rows.filter(function (r) { return String(r[wc]).toLowerCase() === m[3].toLowerCase(); });
        }
        var v = rows.reduce(function (a, r) { return a + Number(r[col]); }, 0);
        return { ok: true, value: v, rows: rows.length, text: "= " + fmt(v) + "  (added up " + rows.length + " row" + (rows.length === 1 ? "" : "s") + ")" };
      }
      var v2 = E.calc(s);
      return { ok: true, value: v2, text: "= " + fmt(v2) };
    } catch (e) {
      return { ok: false, error: e.message, text: "Error: " + e.message };
    }
  }

  /* ---------- File search ---------- */
  function allPieces() {
    var out = [];
    D.docs.forEach(function (d) { d.pieces.forEach(function (p) { out.push({ id: p.id, title: p.title, text: p.text, file: d.file, kind: d.kind, page: p.page, section: p.section, injected: !!p.injected }); }); });
    return out;
  }
  function where(p) { return p.file + (p.page ? ", page " + p.page : ", section " + p.section); }
  function fileSearch(query, n) {
    var res = E.search(query, allPieces()).filter(function (r) { return r.score > 0; }).slice(0, n || 3);
    return res.map(function (r) { return { piece: r.chunk, score: r.score, matched: r.matched, where: where(r.chunk) }; });
  }
  /* the search put the wanted piece/page first, and alone at the top (no tie decided by the files' order) */
  function topIs(hits, id) { return !!(hits.length && hits[0][hits[0].piece ? "piece" : "page"].id === id && (hits.length < 2 || hits[1].score < hits[0].score)); }
  function piece(id) { return allPieces().filter(function (p) { return p.id === id; })[0]; }

  /* ---------- Web search + open page ---------- */
  function webSearch(query, n) {
    // the search index holds each page's title, who wrote it and its text (like a real search engine's index)
    var pages = D.web.map(function (w) { return { id: w.id, title: w.title, text: w.who + " " + w.text }; });
    var res = E.search(query, pages).filter(function (r) { return r.score > 0; }).slice(0, n || 4);
    return res.map(function (r) { var w = page(r.chunk.id); return { page: w, score: r.score, matched: r.matched, snippet: w.text.length > 90 ? w.text.slice(0, 88).replace(/\s+\S*$/, "") + " …" : w.text }; });
  }
  function page(id) { return D.web.filter(function (w) { return w.id === id; })[0]; }

  /* ---------- File maker ---------- */
  // spec: { type: "xlsx"|"docx"|"csv", name, title, rows: [[...]] (xlsx/csv), paragraphs: [..] (docx) }
  function makeFile(spec) {
    var name = spec.name + "." + spec.type;
    if (spec.type === "csv") {
      var txt = spec.rows.map(function (r) { return r.map(function (c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\n") + "\n";
      return { name: name, mime: "text/csv", bytes: (typeof TextEncoder !== "undefined" ? new TextEncoder().encode(txt) : new Uint8Array(Buffer.from(txt))), preview: { kind: "sheet", rows: spec.rows } };
    }
    if (spec.type === "xlsx") {
      return { name: name, mime: F.XLSX_MIME, bytes: F.xlsx([{ name: spec.sheet || "Summary", rows: spec.rows }]), preview: { kind: "sheet", rows: spec.rows } };
    }
    var blocks = [{ h1: spec.title }].concat(spec.paragraphs.map(function (p) { return { p: p }; }));
    return { name: name, mime: F.DOCX_MIME, bytes: F.docx(blocks), preview: { kind: "doc", title: spec.title, paragraphs: spec.paragraphs } };
  }

  // Handy numbers from the sales file (used by items and tests)
  function totals() {
    var t = table(), by = {}, day = {}, qty = {};
    t.rows.forEach(function (r) { by[r.item] = (by[r.item] || 0) + r.total; day[r.date] = (day[r.date] || 0) + r.total; qty[r.item] = (qty[r.item] || 0) + r.qty; });
    return { all: t.rows.reduce(function (a, r) { return a + r.total; }, 0), byItem: by, byDay: day, qtyByItem: qty, rows: t.rows, cols: t.cols };
  }

  var api = { calculator: calculator, fileSearch: fileSearch, piece: piece, allPieces: allPieces, where: where,
    webSearch: webSearch, topIs: topIs, page: page, makeFile: makeFile, totals: totals, fmt: fmt, E: E, F: F, D: D };
  root.AGENT_TOOLS = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
