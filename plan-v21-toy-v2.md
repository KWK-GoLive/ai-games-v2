# Plan: v2.1 — Toy v2 ("closer to a real LLM"): lesson 8, stage 8, final questions 13–14

## Goal
Students learn, with a second toy model they can work out by hand, four ways a real LLM differs from toy v1:
1. meaning counts more than matching words;
2. answers are blended, not copied;
3. models copy from the prompt;
4. looking things up is an add-on.
It is taught in lesson 8, tested in a scored stage 8 and in 2 new final questions. v2.1 runs at a preview address first and v2.0 stays live.

## Inputs
- v2.0 (live, saved as `ai-games-v2.0.zip`, GitHub commit 34725ff): Be the LLM Arena `llm/` (7 lessons + 7 stages, game ID `llm2`) and LLM final `final/` (12 questions, `llmfinal`).
- Shared engine `shared/arena.js` (supports any number of stages and parts), toy v1 `shared/model.js`.
- Backend `apps-script/Code.gs`: `STAGES_BY_GAME` (llm2: 7, llmfinal: 1) rejects unknown games/stages.
- Feasibility check (made-up 8-chat sample, question "when does the bank open"):
  - with the doubling table, bank chat 8 vs shop chat 6, so the bank chat wins;
  - blended shares: bank answer ≈ 25%, each other time ≈ 19%;
  - linear "chats without the word" fails (shop 12 vs bank 7).

## Decisions (from your answers)
- **Toy v2 rules** (all computed by code, all whole numbers):
  1. *Word points:* rarer words count more, counted from the chats with a doubling table: a word in 1 chat = 8 points, 2 chats = 4, 3–4 chats = 2, 5 or more = 1, every chat = 0.
  2. *Chat score:* add the points of the words the chat's question shares with the new question (each word once).
  3. *Blended answer:* each chat's share = its score ÷ all scores. An answer's % = the shares of the chats that give it. Temperature 0 → the top answer; a spin can give another (link to lesson 3).
  4. *Copy from the prompt:* if the prompt already has "X Y … X", the model writes Y next (the toy rule for induction heads).
  5. *Add-on:* a plain model knows only its training text and the prompt. Today's prices, your own files or anything newer need a lookup tool (File search / Web search, as in Part 2).
  - Every screen says plainly: "Toy v2 is a picture of what attention does. A real model doesn't keep the chats or use this table."
- **Lesson 8 "Closer to a real LLM"** (after stage 7, untimed, unscored), about 7 steps with practice:
  1. Why: toy v1 copied the shop's time for the bank.
  2. Word points.
  3. Chat scores (which chat gets the most say).
  4. Blended shares (% bar + spinner).
  5. Copying from the prompt.
  6. Lookup is an add-on.
  7. Toy v1 vs toy v2 vs real (cards) + the stage 8 preview.
  - New made-up chats only; no real facts.
- **Stage 8 "Meaning brain"** (timed, scored, 4 items, one of each):
  - which chat gets the most say;
  - share of an answer (%);
  - copy from the prompt;
  - needs an add-on?
  - Several made-up chat sets and prompts, so runs differ; nothing from lesson 8 reused. Part B = stages 5–8.
- **LLM final:** 12 → 14 questions. 13 = a toy-v2 *which chat gets the most say* question (changed in review round 7: the final has no % question, see the review log); 14 = copy from the prompt or needs an add-on. The rule card says questions 13–14 use toy v2 word points. The end text is reworded: "do the same" becomes what real models keep (next-word prediction) and what differs (meaning, blending, prompt copying, tools).
- **Other main-game text:**
  - Lesson 7's toy-vs-real card and lesson 4's "No exact matching" card point to lesson 8 ("lesson 8 shows a model closer to this").
  - Stage 7 and lesson 7 rules are unchanged (they stay toy v1).
  - Front-page time estimates updated.
- **Preview first:**
  - v2.1 is published under `/v21/` (its own copies of `llm/`, `final/` and the shared files it changes), so v2.0 stays live and unchanged.
  - Preview game IDs: `llm21` (8 stages) and `llmfinal21`.
  - The switch to the live pages is a separate step you approve later.
- **Apps Script:** I give you the changed Code.gs lines (add `llm21: 8, llmfinal21: 1`) and step-by-step clicks; you paste and deploy a new version. Until then the preview still plays, but scores won't save.

## Steps
1. Toy v2 engine (`shared/model2.js`, in the /v21/ copy): word points, chat scores, shares, prompt copy, add-on classifier data. → verify: a new test file `tests/check-toy2.js` recomputes every key independently (a separate implementation) over all data and 200 seeds. Checks: whole-number points; the top chat is unique (no ties) where an item asks "which chat"; % options are distinct after rounding.
2. Data: made-up chat sets (8 chats each) for lesson 8, stage 8 and the final; prompts for copying; add-on question list (needs a tool vs answerable from training text). → verify: no overlap between lesson, stage and final data (automated); no real-world facts.
3. Lesson 8 (7 steps with practice) and stage 8 (4 item kinds, rules, hint, explain). → verify: check-toy2 keys; playthrough walks 8 lessons/stages at 1100 px and 390 px; 360 px with no sideways scroll; teacher mode opens lesson/stage 8 and Show answer scores full marks.
4. Final: questions 13–14, rule card, end text. → verify: check-data/check-toy2 over 150 seeds; the final plays through.
5. Text updates (lesson 4 and lesson 7 cards, front page, README, TEACHING_GUIDE with a "Toy v2" section and the Code.gs steps). → verify: grep shows no stale "7 stages" in /v21/.
6. Backend: Code.gs change + `tests/check-backend.js` cases for llm21 (stage 8 accepted, stage 9 rejected); board/teacher view show 8 columns for llm21. → verify: backend tests pass.
7. Standard review (up to 3 fresh Opus rounds) → `review-log-v21.md`.
8. Publish /v21/ (SHA + live check); you paste and deploy Code.gs; I test one preview run reaching the board under llm21. Zip + project notes.

## Deliverable
A preview site at https://kwk-golive.github.io/ai-games-v2/v21/ (Be the LLM Arena v2.1 + LLM final v2.1), tests, docs, review log, the Code.gs change with instructions. v2.0 stays live until you approve the switch.

## Literature report
Yes: `literature-report-v21.xlsx`. Game cards carry no citations (plain language, labelled as a toy); the TEACHING_GUIDE "v2.1 preview" section cites Vaswani et al. 2017, Olsson et al. 2022 (not peer-reviewed, labelled), Khandelwal et al. 2020 and Lewis et al. 2020, read in full (arXiv HTML / transformer-circuits.pub), cited by section.

## Calculation workbook
No. All numbers are computed by the game and recomputed by an independent test implementation.

## Review level
Standard → `review-log-v21.md`.

## Success criteria
- Every key matches the independent implementation.
- In lesson 8, the meaning example works (the rare-word chat wins), and the blended shares and copy/add-on items are unambiguous.
- No lesson, stage or final data overlap.
- 8 lessons/stages and 14 final questions play on computer and phone.
- v2.0 is untouched (SHA check of the live v2.0 files before and after).
- All suites pass; the final review round has no Major findings.

## Open risks
- Time: lesson 8 ≈ 7–9 min, stage 8 ≈ 4 min, final +2 min (estimates, not measured).
- The doubling table is a teaching cartoon (inspired by search-engine word weighting), not how attention works; the lesson says so.
- "Needs an add-on?" overlaps a little with Be the Agent lesson 1 (which app). I'll keep it to "plain model vs needs a tool", not which tool.
- The preview and the live site share one repository; a mistake in a shared file could affect v2.0, so /v21/ gets its own copies and v2.0 SHAs are checked.
