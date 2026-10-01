# Review log: v2.1 preview, toy model v2 (lesson 8, stage 8, final 13–14)

Plan: `plan-v21-toy-v2.md`. Review level: Standard (up to 3 fresh Opus rounds; stop at a round with no Major findings).

## Round 1 (full review)
All suites re-run by the reviewer and passing; lesson 8 numbers recomputed independently; literature quotes grepped; v2.0 files byte-identical except README, TEACHING_GUIDE, Code.gs, check-backend.js.

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | Major | Share-% options: the key was always the largest option under 100% when asking about the top answer | `shareOptions` now always gives one wrong option above the key (under 100) and one below; stage 8 asks about the top or the second answer 50/50. `check-toy2.js` checks this on every generated item. |
| 2 | Major | Stage 8 share items need arithmetic the lesson never practised (lesson showed the answer in the bar; "the" = 0 in the lesson but 1–2 in the stage) | Lesson 8 step 4: students first add the total, then work out the %, and only then see the bar. A note says common words can be worth 1–2 points in stage 8. Stage share items now show each chat's score (students add and divide) and allow 90 s. |
| 3 | Major | "Toy v1 copied one chat" contradicts lesson 7 ("the model didn't choose chat 1") | Lesson 8 step 4, the summary card and the guide now say toy v1 builds its answer word by word from the matching ending. |
| 4 | Major | "Meaning" overclaimed: toy v2 still matches exact words | Lesson 8 step 1 says toy v2 still needs the exact same words (it can't link "hours" with "open"), while a real model links similar meanings. The summary card says the same. Lesson 4 and 7 pointers now say "a toy model that weighs important words more". Stage 8 end text and step 3 feedback reworded. |
| 5 | Minor | IDF inspiration not credited; "picture of attention" a stretch | The guide and model2.js now say "in the spirit of search engines' word weighting" (no citation, stated as unverified here). Toy v2 is described as a cartoon of weighing some words more, closer to the lookup add-ons than to attention. |
| 6 | Minor | Copy feedback "even names they never saw in training" unsupported | Clause removed. |
| 7 | Minor | Source copies are excerpts | The literature report now says the cited sections were read in the full HTML version and the saved copy is an excerpt. |
| 8 | Minor | Self-check scope | Scope stated at the top of `selfcheck-v21.md`. |
| 9 | Minor | Most-say options often lacked the runner-up | The runner-up is always an option (checked). |
| 10 | Minor | Example "the is in every chat (or none)" | Now "the is in every chat = 0". |
| 11 | Minor | Add-on label "(a file or web search)" vs inbox request | Label: "a tool that looks it up: files, web, email…". |
| 12 | Minor | Copy title | "What does toy v2 write next?" |
| 13 | Minor | Final end card "All games" went to the v2.0 home | Now `../index.html` (preview home). |
| 14 | Minor | Node `require` fallback path in v21 copies | Fixed to `../../../shared/model.js`. |
| 15 | Minor | Unneeded files published | `tests/__pycache__` removed and not uploaded; plan, review log, self-check and literature report are published like earlier rounds' logs (teacher's practice). |
| 16 | Minor | README 300 vs plan 200 seeds | No change (300 ≥ 200). |

## Round 2 (delta review)
All 16 round-1 fixes verified; lesson 8 numbers recomputed (step 4 total options 24/12/32/20, % options 100/33/50/17); all suites pass.

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | Major | New give-away from round-1 fix #1: 100% was always an option and, without it, the key was always the middle option (500/500 stage, 249/249 final) | `shareOptions` now picks a random number (0–3) of wrong options above the key, and 100% only half the time. The final also asks about the top or second answer 50/50. Over 500 seeds the key's sorted position is 0: 124, 1: 124, 2: 149, 3: 103, and 100% appears in 172 items. `check-toy2.js` now checks that the key's position varies (no position over 50%, with and without 100%). |
| 2 | Minor | Stage 8 end text still said "a picture of attention" | Now "a cartoon of how a model can weigh some words more". |
| 3 | Minor | Lesson 8 step 1 "also links words with similar meanings" has no evidence row | Clause removed. |
| 4 | Minor | Guide heading "Meaning counts more than matching words" overstated toy v2 | Now "Important (rare) words count more than common ones (a real model goes further and weighs what the words mean)". |

## Round 3 (delta review, final round)
All round-2 fixes verified; 2000-seed structural check clean (4 distinct options, all in 1–100, ≥5 apart, the key once).

| # | Severity | Finding | Fix (unreviewed: round 3 was the last round) |
|---|---|---|---|
| 1 | Major | Share items: value-based guessing still beat 40% ("closest to 50%": 51% in stage 8; "smallest": 38% in the final, 54% on second-answer items with tiny %) | `shareOptions` now (a) puts a random 0–3 wrong options above the key, (b) shows 100% only 40% of the time, (c) when the key is not near 50%, always includes a wrong option closer to 50% than the key; `shareItem` never asks about an answer under 10%. `check-toy2.js` now runs 1500 seeds and checks 8 guessing rules separately for stage 8 and the final (each must be ≤ 40%). Measured over 3000 seeds: stage best rule 32%, final best rule 33%. |
| 2 | Minor | "weighs what the words mean" not backed by the saved sources; "blended" described as stored answers | Lesson 8 step 1, the summary card, stage 8 end text, final end text and the guide now say a real model "learns how much each word should count (attention weights)" and "picks the next word from a blend of chances" (supported by Vaswani §3.2: weighted sum, weights from a compatibility function). Lesson 7's "A real LLM" card keeps the teacher-approved v2.0 wording. |
| 3 | Minor | Final rule card lacked the score and % formulas | Added: chat score, answer %, copy rule. |
| 4 | Minor | Rank check too weak | Replaced by the per-part guessing-rule checks above. |

## Unreviewed fixes
All round-3 fixes above. After them: check-toy2 (all checks), check-data, check-backend, selfcheck-v21 (clean) and v21-play pass.
