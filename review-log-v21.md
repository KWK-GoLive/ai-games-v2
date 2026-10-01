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

## Unreviewed fixes (after round 3; reviewed in round 4)
All round-3 fixes above. After them: check-toy2 (all checks), check-data, check-backend, selfcheck-v21 (clean) and v21-play pass.

## Round 4 (full review, requested by the teacher: 2 more rounds)
All lesson 8 numbers recomputed and correct; v2.0 byte-identical; all suites pass. The round-3 fixes were checked and found incomplete.

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | Major | Share %: "closest to 25%" right 46% (stage); "closest to points × 3" 60%, "× 2" 47–63% | New `shareOptions`: the key's place among the sorted options is random; the "forgot to divide" mistakes (points × 2, × 3) are offered when they fit; other wrong options come from the same spread of values real keys have; a round-number guard (20/25/30/33/40/50) half the time; answers whose % happens to be within 4 of their points/×2/×3 are never asked. Over 3000 seeds every rule ≤ 39% (stage) / ≤ 34% (final); `check-toy2.js` checks 16 rules + ×2/×3 per part. |
| 2 | Major | Most-say: "the chat sharing the most words" right 94% (stage), so the lesson's point was never tested | Stage and final chat sets redesigned like the lesson's (4 "when does the … open/close" chats make those words common; topic words are rare). 9 questions where a rare word beats a chat sharing more words; ~65% of most-say items come from these. Measured: naive rule 31% (stage) / 35% (final); "same first word" 23% / 35%. Checked by test (≤ 40%, rare ≥ 55%). |
| 3 | Major | Copy items: the key was the only capitalised option (2 of 3 final prompts) or the only option from the prompt | New prompts each contain a second name/pair; wrong options are the same kind of word and two of them come from the prompt (e.g. Korn / Dao / Lee / Coach). Checked by test. |
| 4 | Major | Lesson 8 never had students count chats themselves; the stage chat box cut off chats 7–8 on phones | Lesson 8 step 2 now asks students to count ("how many chats' questions contain 'when'?", then 'bank', noting answers don't count) and says stage 8 "which chat" items show only the table. Stage chat list shown in full (no inner scroll). |
| 5 | Minor | Share maths harder in the stage | Lesson note: numbers are less round (9 ÷ 47 ≈ 19%), options ≥ 5 apart so a close estimate is enough; same in the stage hint. |
| 6 | Minor | Name capitalisation leaked into toy-v1 stages | Names are now applied only to toy-v2 text (`TOY2.dw`); toy v1 pages display as in v2.0. |
| 7 | Minor | Preview board said "All 7 stages", "Part B (5–7)", broken link | "All 8 stages", "Part B (5–8)"; link goes to the v2.0 teacher view (labelled). |
| 8 | Minor | Most-say explanation always said "rare words count more" | Now depends on whether a chat sharing more words lost. |
| 9 | Minor | 0-point rule worded differently | Lesson table now "in every chat (or none) → 0", like the other places. |
| 10 | Minor | "Attention weights are learned" unsupported | Wording "learns how to decide how much each word counts (its attention)"; new evidence rows 7–8 quote Vaswani §3.2.2 ("learned linear projections") and §3.4 ("predicted next-token probabilities"); excerpt added to `v21src/sources-text/Vaswani2017/web.txt`. |
| 11 | Minor | "Blend of chances" unsupported | Now "picks the next word from the chances (lesson 3)", supported by §3.4 row. |
| 12 | Minor | "it can tell that 'bank' matters here" overclaims | "it can learn that words like 'bank' matter here". |
| 13 | Minor | Copy feedback less hedged than the source | "Real models tend to do this too … more likely to copy". |
| 14 | Minor | Final end text "everything a language model does: count…" | "everything these toy models do". |
| 15 | Minor | Stale counts (README 300 seeds; items.js header) | Updated. |
| 16 | Minor | Stage 8 time estimate low | Guide: lesson 8 about 8–10 min, stage 8 about 6–8 min, final +3–4 min. |

## Round 5 (delta review + full read of the changed parts; the last requested round)
All round-4 fixes verified (rare-word questions checked by hand; lesson 8 numbers recomputed; v1 pages no longer capitalise "captain"/"coach"; evidence rows 7–8 quotes present). All suites pass.

| # | Severity | Finding | Fix (unreviewed: round 5 was the last round) |
|---|---|---|---|
| 1 | Major | Most-say: "highest-numbered chat" right 68%, "the option that doesn't start with when" 69% (the 4 "when" chats were always chats 1–4) | The chat order is shuffled for every question (ties are excluded, so keys don't depend on order); wrong options always include one chat whose question starts differently from the runner-up's. Test adds "highest/lowest-numbered" and "odd one out" rules (≤ 40%). Measured: naive 31%, same first word 21–22%, first option 25–26%. |
| 2 | Major | Final pools too small (3 share questions; 66% of most-say = zoo corner open/close); "only multiple of 5" ≈ 52%, "closest to 66/70/75" ≈ 50%; 95–100% options looked silly | Second final set "Night Market" added: final share pool 7 questions, most-say 15 (5 rare); 15 different final questions now appear. Options never 95–100% when 2+ answers have points. Round-number guard extended to 60/66/70/75 and raised to 90%. Test adds these rules; passes at 1500 and 4000 seeds (best rule ≤ 37%). |
| 3 | Minor | Copy: the key was the earliest option in the prompt (7 of 9) | 4 prompts now copy the second pair (e.g. "… red lion . i typed red" → lion): key earliest in 2 of 9. |
| 4 | Minor | Odd capitals/wording ("our Coach", "slow Joe", "when does the yoga class open", "science floor", "how much is the pool") | "coach" no longer capitalised; mascot prompt reworded (tiny Joe / big Sam); unnatural questions removed or replaced. |
| 5 | Minor | Lesson note said "the" is worth 1 or 2 in stage 8 | Now "for example 'the' = 1 at the bus station". |
| 6 | Minor | Overlaps with stage 7 (toy v1): "when does the library open/close", "when does the pool open" (lesson 8), "when does the park open"; set names Hilltop/Sunny | Renamed: Maple Study Centre, lesson 8 bakery, Green Garden, Uptown Gym. Test now checks no overlap with stage 7 chats/questions (lesson 8 reuses 3 lesson-7 corner-shop questions on purpose) and no echoing set names. |
| 7 | Minor | Guide source list lacked §3.2.2/§3.4 | Added. |

## Unreviewed fixes (after round 5; reviewed in round 6)
All round-5 fixes above. After them: check-toy2 (68,520 checks; also run with 4000 seeds), check-data, check-backend, selfcheck-v21 (clean), v21-play and playthrough pass.

## Round 6 (full review, requested by the teacher: 2 more rounds)
All suites pass; lesson 8 numbers recomputed; explanations match the shuffled chat numbering in 9,000 items; sources and literature rows accurate; v2.0 isolated.

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | Major | Lesson 8 step 3: the wrong option said "Chat 3 (When does the bakery open?): it's about the pool" (broken by the round-5 rename) | The option now names the chat that really is about the pool (chat 8 "Is the pool open today?"), found from the data; test checks such a chat exists. |
| 2 | Major | Add-on: "question → tool, command → plain" right 100%; my/our/today and length cues too | Requests rewritten and added (stage pool 23, final 8): questions and commands, long and short, with and without "my/our/today/now" on both sides. All sentence-form rules ≤ 57% (stage) / ≤ 52% (final) for this 2-option item; tested (≤ 60%). |
| 3 | Major | Copy: "the last option mentioned" 51–68%; final "shortest" 50% | Key position balanced (earliest/middle/latest 2-2-2 in stage and final); the word before the full stop is never the key; option lengths varied; 3 new final templates (cooking days, phone pin, cookies, boats) so the final no longer echoes the stage. All position/length rules ≤ 34%; tested. |
| 4 | Major | Share %: "points × 2.5" (total ≈ 40) 49–67%; spotting the ×2/×3 decoys then picking near 50 up to 71% | ×2/×3 decoys removed. The guard now also covers estimates (×2, ×2.5, ×3, ×4, "about 3 points per other chat") and round numbers 20–75; a "only round number" guard; answers within 3–4 of these estimates are never asked; 5 more final questions with totals 15–31; the final prefers mid-range keys. Over 5000 seeds every rule ≤ 39%; tested at 1500 and 4000 seeds. |
| 5 | Major | Most-say: "the chat sharing the topic (longest / content) word" right 65–88% | Accepted as intended: it is the lesson's point (an important rare word counts more). Documented in the teaching guide ("A design choice to know about"); position, odd-one-out and naive-count rules remain tested (≤ 40%). |
| 6 | Minor | README claimed all item kinds were checked | Now true: copy and add-on rules added to `check-toy2.js`. |
| 7 | Minor | Final copy templates echoed the stage | New final templates (see #3). |
| 8 | Minor | Lesson 8 step 1 "new example chats" (they extend lesson 7's corner shop) | "These chats extend lesson 7's corner shop to the whole street." |
| 9 | Minor | Feedback "shares the most words" when it only ties | "Other chats share as many words, but its words are worth more points." |
| 10 | Minor | "night show open", "boat ride open" | Now "start" (pools re-checked). |
| 11 | Minor | Log #9 (round 4) wording; literature row 3 positions | The lesson table shows "in every chat → 0" with "(or none)" stated in the note under it; row 3 now lists the stage 8 and final end texts. |

## Round 7 (delta review + full read of the changed parts; the last requested round)
All round-6 fixes present; lesson 8 recomputed by hand; all suites pass (also with 4000 seeds).

| # | Severity | Finding | Fix (unreviewed: round 7 was the last round) |
|---|---|---|---|
| 1 | Major | The round-6 "start" rename made "open" rarer in the Night Market set; final rare-word questions fell from 5 to 3; zoo-corner key chat 45% of final most-say | "when does the night show open" restored (5 rare final questions again); "which chat" questions are now picked by winning chat first, so no winning chat exceeds ~21%. Tests: ≥ 5 rare final questions, no winning chat > 30%. |
| 2 | Major | Final %: "nearest 45" ≈ 49% (two near-duplicate first-aid questions; small pool) | The final's question 13 is now always a *which chat* question (the final's chats give too few different % answers for a fair % question; stage 8 tests the %). Stage 8: % questions are chosen so every different right answer is equally likely, right answers kept ≥ 6 apart, every possible right answer is a guard target, and answers within 3 of points × 2.5/4/5/6 are never asked. Test: "nearest X" for every X from 5 to 95 and points × 2, 2.5, 3, 4, 5, 6 ≤ 40% (passes at 1500 and 4000 seeds). |
| 3 | Major | Copy: "the option just before 'and'" 68–84% | Prompts reworded so the copied word is never next to "and" or the full stop (e.g. "mr korn from the north and …"); position balance kept (2-2-2 stage and final). Test: before/after "and" ≤ 40% (0% now). |
| 4 | Major | Add-on: lookup verbs, writing verbs and time words gave 62–100% | 10 counterexamples added (e.g. "Write a summary of today's top news story" → lookup; "Check the paragraph below for spelling mistakes", "Tell me a bedtime story for tonight" → plain). Form rules (question/command, what-which-how, length) ≤ 62% and tested; the remaining word rules (time words ≈ 69–70%, writing verbs ≈ 68–74%) follow the concept itself and are documented as accepted in the guide ("Design choices"). |
| 5 | Major | Two add-on keys arguable ("Translate my name card", "to-do list for my day") | "Translate the name card text I pasted below into English."; "Write a to-do list for a busy school day." |
| 6 | Minor | Most-say "shortest/longest chat question" 54–65% | Longest now ≤ 18%; "shortest question" (≈ 51%, stage) follows the short topic chats and is documented with the topic-word design choice. |
| 7 | Minor | "Train times … are not in the training text" overclaims | "… change, so the training text may be out of date: it needs a lookup." |
| 8 | Minor | Lesson add-on "your town" | "my town". |
| 9 | Minor | Lesson step 3 "only 'bank' is shared" vs the score list showing "the + bank" | "only 'bank' scores ('the' is worth 0)". |
| 10 | Minor | "their team … go blue" cheering the other team; "phone pin is lucky seven" | "our team is red falcons … go red"; "phone password". |
| 11 | Minor | Guide's design note overstated | Rewritten as "Design choices to know about (shortcuts we tested)": what is blocked, what is accepted and why. |
| 12 | Minor | "who rides the red path"; 1%/3% options | Question removed; options are now at least 4%. ("how much is a duck ride" kept: it reads acceptably.) |
| 13 | Minor | Repeat players can learn the stage-8 % answers | Noted in the guide. |

## Unreviewed fixes
All round-7 fixes above. After them: check-toy2 (64,125 checks; 169,077 with SEEDS=4000), check-data, check-backend, selfcheck-v21 (clean), v21-play and playthrough pass.
