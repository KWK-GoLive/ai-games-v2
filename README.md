# AI games v2 (Part 1: language models · Part 2: AI agents)

Browser games for complete beginners in the course "AI for Data Work". Plain HTML, CSS and JavaScript: no build step and no libraries. Made for phones, iPads and computers: everything is tap-only, tap targets are at least 44 px on touch screens, and nothing scrolls sideways from 320 px up. While playing, the timer bar stays at the top of the screen, and each new step scrolls into view. It runs on GitHub Pages, and all the model work happens in the browser.

**Live site:** https://kwk-golive.github.io/ai-games-v2/ (the first version stays at https://kwk-golive.github.io/ai-games/).

| # | Game | Folder | Scoreboard ID | Time (estimate, not yet measured with a class) |
|---|---|---|---|---|
| 1 | Warm-up: **What comes next?** 8 questions on two 5-sentence texts | `warmup/` | `warmup` | 5–7 min |
| 2 | **Be the LLM Arena**: 7 lessons, each followed by its timed stage. Part A = 1–4, Part B = 5–7 | `llm/` | `llm2` | 80–100 min (A about 45–55, B about 35–45) |
| 3 | **Final: Be the LLM Arena**: one stage, 12 questions covering all 7 skills | `final/` | `llmfinal` | 15–20 min |
| 4 | **Be the Agent Arena**: 7 lessons, each followed by its timed stage. Part A = 1–4, Part B = 5–7 | `agent/` | `agent2` | 80–100 min (A about 45–55, B about 35–45) |
| 5 | **Agent Arena**: one task from Ploy, played in 12 timed steps | `agent-final/` | `agentfinal` | 15–20 min |

## Part 2: Be the Agent (three linked chat phones)

The student always plays the **model**. The screen shows three chat phones: **Human 📱** (Ploy, the café's shift manager), **Model 🤖** (the student) and **Apps 🧰** (the program around the model, which engineers call the harness; one thread per app). Every message appears twice: on the right in the sender's phone and on the left in the receiver's phone, so the Model phone is exactly what the model sees (its context window). Wide screens show the three phones side by side; below 740 px (phones) one phone is shown at a time, with tabs and "new message" badges and a reminder of the newest message under the chat; iPads show all three.

The apps really run in the browser (`agent/js/tools.js`): a Calculator (arithmetic plus `SUM(col WHERE col = v)` on the sales CSV), File search (word matching over pieces of the café's PDF/Word files, labelled with page or section), Web search over a **made-up mini-web** (17 pages; only one quotes a real site, see Sources), and a File maker that builds real .xlsx, .docx and .csv files. No `eval` is used.

| # | Lesson (untimed, practice with feedback) | Stage (timed, scored) |
|---|---|---|
| 1 | Tools: the three phones, then **4 real recorded Claude cases** (calculator, file search, web search, no tool) | Which app? (5, including "no app") |
| 2 | File search: pieces, word matching, open before you answer, cite file and page | File search (4) |
| 3 | Web search: titles and snippets, open a page, judge who wrote it and when | Web search (4) |
| 4 | Calculator: write the sum, let the tool do it, check the result | Calculator (4) |
| 5 | File maker: type, name, contents, preview; honest "done" | File maker (3, real downloads) |
| 6 | Hidden orders (prompt injection): data is not orders; warn the human | Hidden orders (4) |
| 7 | Permissions: do / ask first / don't | Permissions (6) |

**Files in the chat (30 Sep 2026).** The café's files are in a **shared folder** that the apps can open: every question's chat (lessons' practice, stages, the Agent Arena) starts with a set-up note in the Model phone listing them (lesson 1's real cases show exactly what their real set-up listed). Ploy attaches only a NEW file that is not in the folder (e.g. the night-shift handover note), as a 📎 chip with its real name. A model can't send a file: when it asks an app to use one, its request shows "📂 opens: <file>" (File search: "📂 searches: the café's 3 documents"), in the Model and Apps phones. A file the model makes (File maker, the Agent Arena memo) is sent to Ploy with the reply, so it appears in her phone too.

**Instruct, then check.** The model tells the File maker what to take from which file (e.g. "make file: Brownie_sales.xlsx from moonbean_sales_aug2026.csv, only the rows where item = Brownie") and never guesses a count; the app reports how many rows it made; the model opens the file ("open file: … (check it)") and sees the file's own rows; its reply claims only what those rows show. Stage 1, stage 5 and the Agent Arena memo work this way.

**Real case 3.** The recording stays as it happened (the model worked out the VAT in its head); after it, a dashed, labelled step shows what a safer agent would do: ask the Calculator "8580 * 1.07". Recording-program steps (SubagentHandback, ToolSearch) are glossed in "Show the exact recorded steps".

**Teaching ≠ testing (29 Sep 2026).** Each lesson's practice uses its own questions (`PRACTICE` in `agent/js/items.js`), never used in a stage or the Agent Arena; lesson 1's real cases and worked examples don't reappear in the stages (one deliberate exception: the VAT lookup of real case 3 is tested again only in the Agent Arena, with other numbers), and the Agent Arena repeats no stage item word for word. `tests/check-agent-data.js` checks this (same question, same source piece/page, same answer value), and `tests/agent-play.py` checks it in the browser.

### The real recordings (lesson 1)

`agent/data/raw/agent-runs-v2.json` holds four real runs of a Claude agent (model `claude-sonnet-5`, 28 Sep 2026 UTC) on the files in `agent/files/`. The lesson shows each run simply and also "the exact recorded steps". Every quoted line is checked to be in the raw record (`tests/check-agent-data.js`). What the recordings show, and what the lesson points out:

- Case 1 (Latte total): the sum 8,580 came from a code tool. Its report also said "Cross-checked via qty×price too" (132 cups × 65 = 8,580), but no tool step in the log counted cups or did that check; the model may have done it without a tool (132 is right).
- Case 2 (refund rule): the agent turned the PDF into text and answered from section 3.
- Case 3 (VAT): the web search returned **titles and links only**; the agent never opened a page. It answered 7% and did 8,580 × 7% itself (600.60, which is right). Its claim "through at least September 2026" came from law-firm and news titles and **could not be verified** on the official Revenue Department site.
- Case 4 (what CSV means): no tool.

These are single runs; another run could behave differently.

## The main game: lesson → stage

| # | Lesson (untimed, unscored practice with instant feedback) | Stage (timed, scored) |
|---|---|---|
| 1 | Counting: count → %, [end] counts like a word, temperature 0 = top count (no randomness), tie = reading from line 1 down, the word met first right after the looked-up words | Count it (5 items) |
| 2 | Writing with a 1-word keyhole; [end] stops the sentence | Greedy writer (3) |
| 3 | Temperature: the stacked bar, the spinning pointer, and a **temperature calculator** (slider 0 / 0.5 / 1 / 2 / 5, counts you can change) | Temperature (5): "predict" questions and "read the pointer" questions |
| 4 | The keyhole (context window): 1, 2 and 3 words, "no data", and **real window sizes** (see Sources) | Keyhole (6) |
| 5 | Two-word keyhole plus back-off to 1 word | **Two-word boss** (3 whole continuations; large "2-WORD KEYHOLE" badge) |
| 6 | Up to 3 words: the longest keyhole with data wins (3 → 2 → 1) | **Three-word boss** (6 single next-word questions) |
| 7 | Answering questions: continue after "A:", how to work it out (4 moves; quick way: grow from "A:"), same question in other words, only "A:" left, supported vs made up, **toy vs real** | Chat brain (4) |

Since 29 Sep 2026 the order of the last two is three-word boss (6), then Chat brain (7): 2 words → 3 words → a long keyhole for chats, and "making things up" leads into Part 2. The final's 12 questions follow the same order.

**One model in the final (29 Sep 2026).** The final uses the complete toy model on every question: each question states its keyhole size, and the model always backs off to fewer words when needed, so it always writes something. Its two keyhole questions therefore back off ("No data" is offered but is never right); they use two different keyhole sizes, on sentences where the size still changes the answer. Stage 4 keeps the strict keyhole with "no data", which is what motivates back-off in stage 5.

Each lesson uses its own 4–6-sentence text, which is different from the stage texts. `tests/check-data.js` checks that every lesson text still shows what the lesson says about it.

## Files

- `shared/model.js`: the toy n-gram model with back-off. Temperature: p ∝ count^(1/T).
- `shared/arena.js`: the arena shell (sign-in, timer, scoring, resume codes, scoreboard queue). Added in v2: lessons (`stage.teach`), parts (`stage.part`) and badges (`stage.badge`).
- `shared/tempviz.js`: the stacked bar, the pointer and the temperature calculator.
- `shared/teacher.js`, `teacher.html`: the teacher view (the 4 main boards in one window, live).
- `shared/board.js`, `board.html`: the class scoreboard (Warm-up / Be the LLM Arena / LLM final / Be the Agent Arena / Agent Arena; the two main games have All / Part A / Part B views).
- `llm/js/items.js`: all stage items and the final's 12 items. Keys come from the model.
- `llm/js/lessons.js`: the 7 lessons.
- `llm/js/draw.js`: how the items are drawn.
- `apps-script/Code.gs`: the scoreboard web app. **One sheet serves both sites.** v2 added the game IDs `warmup`, `llm2`, `llmfinal`, `agent2` and `agentfinal`, and a stage count per game.
- `agent/`: Be the Agent Arena. `data/cafe.js` (the café's files as text, the mini-web), `data/raw.js` (the recordings), `js/tools.js` (the apps), `js/phones.js` (the 3 phones), `js/items.js` (stage items), `js/draw.js`, `js/lessons.js`, `js/stages.js`, `js/arena.js` (the Agent Arena's 12 steps). `files/`: the real files students can download.
- `agent-final/`: the Agent Arena page.
- `shared/theme-chula.css`: the Chula theme (colours and the Bai Jamjuree font from the lecture deck), loaded last in every page; layout is untouched. The font comes from Google Fonts by a `<link>` in each page; if a network blocks Google Fonts, the pages use the system font (on a network that silently drops the connection, the first paint can wait until the browser gives up). Four small contrast fixes on top of the teacher's file: unread badge #0070c0, Part A/B chip text #005a9c, amber part-marks border, sender names on coloured bubbles at full white. The front-page game numbers keep their orange circles (as in the mockup).
- `config.js`: `SCOREBOARD_URL`, `BOARD_REFRESH_SECONDS`, `TIME_FACTOR` (1.5 = 50% more time).

## v2.1 preview (`/v21/`): toy model v2

A test copy of Part 1 with **lesson and stage 8 "Meaning brain"** (toy model v2: rare words count more, blended answers, copying from the prompt, lookup is an add-on) and a **14-question final** (13–14 use toy v2). It lives in `v21/` so the live v2.0 pages are untouched:

- `v21/index.html` (preview landing page), `v21/llm/` and `v21/final/` (copies of `llm/` and `final/` with the changes; they load the unchanged shared files from `../../shared/`), `v21/shared/model2.js` (toy v2), `v21/llm/data/toy2.js` (made-up chats, prompts, requests), `v21/llm/js/toy2.js` (stage 8 and final items), `v21/board.html` + `v21/shared/board.js` (board for the preview games only).
- Game IDs `llm21` (8 stages) and `llmfinal21`; `apps-script/Code.gs` accepts them (paste it and deploy a new version, see Scoreboard).
- To go back to v2.0 at any time: `VERSION-2.0.md` (GitHub commit 34725ff and the `ai-games-v2.0.zip` snapshot).
- Tests: `node tests/check-toy2.js` (every toy-v2 key recomputed by a separate implementation over 1500 seeds (SEEDS=4000 for more); guessing rules for every item kind checked; no overlap between lesson, stage and final data) and `python3 tests/v21-play.py` (lesson 8 and stage 8 at 1100 and 360 px, an official run reaching the llm21 board, the 14-question final, v2.0 unchanged).

## Teacher mode

Every game page has a **🎓 Teacher** button in the top bar. The code (KWK-TEACH; only its SHA-256 is in `shared/arena.js`) turns on teacher mode in that browser (`localStorage` key `aig-teacher`) until "Leave teacher mode": a menu of every lesson and stage, paused timers, a "Show answer" button on every question (`item.solve()` for the agent items, `item.key` otherwise), and no traffic to the scoreboard (teacher runs are never saved as official or practice runs and never tick the front page). Not real security: it only keeps students from stumbling into it. `tests/teacher-mode.py` checks all 5 pages.

In lesson 3 the spin animation now also runs (as one short, slow glide) when the computer is set to "reduce motion".

## Tests

```
node tests/check-data.js        # every answer key recomputed by a separate counting model (150 seeds), lesson facts, sources
node tests/check-backend.js     # scoreboard logic, including the v2 game IDs
python3 tests/playthrough.py    # the whole site in Chromium: every lesson and stage, resume on a 2nd device, board, widths 360-1366 px
python3 tests/touch.py          # emulated iPhone 13 and iPad: tapping through LLM and Agent lesson 1, 40 px+ tap targets, the calculator by touch
node tests/check-agent-data.js  # agent: files = game texts, recording quotes, sales totals recomputed, every stage/arena key over 120 seeds
python3 tests/agent-play.py     # agent: all lessons, stages and the Agent Arena by clicking, 3-phone rule, downloads, at 390 and 1100 px
python3 tests/teacher.py        # live progress: a student plays all of Be the Agent + the Agent Arena; after every lesson/item the board shows the right position and points; the teacher view (4 boards, auto-refresh, fits 1280x720)
python3 tests/check-contrast.py  # theme: 22 text/background pairs >= WCAG AA 4.5:1, colours read from the CSS
python3 tests/teacher-mode.py   # teacher mode on all 5 pages: code, any stage, paused timer, Show answer, nothing sent (with a control run that does send)
python3 tests/agent-devices.py  # agent by TAPPING on iPhone SE, iPhone 13, Galaxy S9+ (320 px), iPad portrait + landscape: 44 px targets, text >= 12 px, timer in view, new moves scrolled into view
```

## Scoreboard

These steps are the same as in v1. Paste `apps-script/Code.gs` into the Apps Script of the Google Sheet, then choose **Deploy → Manage deployments → Edit → New version**. The web-app URL stays the same, so `config.js` doesn't change. Before class, delete any test rows from the `arena` tab.

**Live progress (since web-app version 7).** Besides one row per finished stage (tab `arena`, the permanent record), the two main arenas and the two finals send the player's position when a lesson opens and after every answered item. These live positions are kept in the Apps Script cache (`CacheService`, at most 6 hours), not in the sheet, so they need no sheet write and no lock; an older position never replaces a newer one, except the start of the same stage (a run resumed on another computer starts that stage again). The boards rank by **live points** = finished stages + the items already answered in the current stage, and show 📖 (reading the lesson) or ▶ answered/items for the stage in progress. Position updates are best effort: if one is lost, the next one replaces it, and the finished-stage row still goes through the reliable queue. Google's Cache reference (developers.google.com/apps-script/reference/cache/cache, checked 28 Sep 2026) says the expiration time "is only a suggestion; cached data may be removed before this time if a lot of data is cached", and caps a cache at 1,000 items (above that it keeps the 900 farthest from expiration). There is one entry per player per game, refreshed at every answer, so the players who are playing right now are the ones kept; a live position can still occasionally disappear, but the finished stages are never affected. The warm-up sends only its finished row.

**Teacher view** (`teacher.html?class=SEC1`, also linked from the front page and the scoreboard): Be the LLM Arena, LLM final, Be the Agent Arena and the Agent Arena in one window (2×2 under the top bar; one column on phones), one request per refresh (`action=boards`; one at a time, aborted after 20 s, slower after errors, paused while the tab is hidden). Each row is one line: rank, nickname (team), a progress bar (one segment per stage; the current stage fills as items are answered, striped = lesson; the finals have one segment per item), where the player is now (e.g. `S3 ▶ 2/5`, `📖 L4`, `✓ done`) and live points. A board with more players than fit gets two columns, and if it still doesn't fit it scrolls slowly by itself (it stops while the mouse is over it). Measured in the test at 1280×720 with 40 players per board: 26 players visible per board at once. Hovering a row shows the full details. A player with no new answer for 5 minutes is faded ("idle").

Load (not measured with a real class): each student sends one small request per answered item, roughly one every 1–2 seconds for a class of 40, plus one request per board refresh. I cannot verify how Apps Script copes with this; try it once with a few students first. If the board lags, raise `BOARD_REFRESH_SECONDS` in `config.js`.

## Sources

- v2.1 toy model v2 sources (Vaswani et al., 2017; Olsson et al., 2022; Khandelwal et al., 2020; Lewis et al., 2020): see TEACHING_GUIDE.md, "Sources used in the games", and `literature-report-v21.xlsx`.
- Brown, T. B., et al. (2020). *Language Models are Few-Shot Learners*. NeurIPS 2020, section 2.1: "All models use a context window of n_ctx = 2048 tokens."
- Anthropic, *Context windows* (Claude Platform Docs), https://platform.claude.com/docs/en/build-with-claude/context-windows, accessed 28 Sep 2026. It lists Claude Sonnet 5 among the models with a 1M-token context window.
- Thailand Revenue Department, *Value Added Tax (VAT)* (https://www.rd.go.th/english/6043.html), accessed 28 Sep 2026: "Currently, the rate is 7 percent." This is the only real page in the Agent game's mini-web; the other 16 pages are made up (their sites end in `.example`).
