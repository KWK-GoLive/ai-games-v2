# Review log: Be the Agent v2 (Standard review)

Threshold: Major. Each round is a fresh Opus reviewer.

## Round 1 (full review): 0 Critical, 6 Major, 10 Minor

| # | Sev. | Finding | Fix |
|---|---|---|---|
| 1 | Major | Right answer guessable: usually the longest option (stages 1–3, 5, 6, arena memo/reply) | All distractors rewritten to similar length and specificity (wrong page, wrong number, wrong source); arena options rebalanced |
| 2 | Major | Stage 3 query step gave free points (all 3 queries found the key page) | New distractor queries: exactly one query finds the key page, none returns nothing; test added; UI no longer dead-ends on "No results" |
| 3 | Major | Agent Arena showed a File search result the real tool doesn't produce | The step now shows the real search hits, then an "open the whole letter" request/result; test checks every arena app result = real tool output |
| 4 | Major | Stage 5 honest reply described the key file, not the file made | Reply texts are built from the student's real type/name/contents; test added |
| 5 | Major | Stage 3 picked query always marked red | Reveal marks the right query (key.query) |
| 6 | Major | Stage 1 "beans" had two defensible apps | Reworded: "What does the letter we got from our bean supplier say…" |
| 7 | Minor | w1 had a made-up title | Real title "Value Added Tax (VAT)"; search index now includes who wrote the page |
| 8 | Minor | Stage 7 two defensible answers; "ask" was the safe guess | Delete/post items reworded; new "do" item; each run is 2 do / 2 ask / 2 don't (tested) |
| 9 | Minor | Stage 2 credit decided by tie order | Full search credit only when the right piece is alone at the top (`topIs`); tested |
| 10 | Minor | Stage 1 wrong app: harness "ran the right app for you" | Now a labelled teacher's replay note in the Model phone |
| 11 | Minor | Case 3 note said the harness loaded ToolSearch | Now: the model asked for the tool's instructions (ToolSearch tool call) |
| 12 | Minor | Case 1 cross-check wording overstated; quote not exact | Exact quote "Cross-checked via qty×price too"; "no tool step in the log did that check" (lesson, README, guide) |
| 13 | Minor | 3-phone test weak; phones.js could drop/misfile messages | phones.js throws on unknown routes and adds unlisted apps' threads; test checks sides and senders |
| 14 | Minor | Arena "sum" step had the answer 21445 as a chip | Removed; test that no number chip is the answer. This also exposed "480" = answer in the bean steps, so the bean quantity is now 15 kg (extra 600 baht) everywhere |
| 15 | Minor | Test hook worked on the live site | Limited to localhost, like arena.js |
| 16 | Minor | Time estimates differed | README/guide now match the game: 80–100 (A 45–55, B 35–45), Agent Arena 15–20 min, all unmeasured estimates |

All six test suites pass after the fixes.

## Round 2 (delta review): 0 Critical, 0 Major, 5 Minor → clean round, review stops

| # | Sev. | Finding | Fix |
|---|---|---|---|
| 1 | Minor | Stage 5 honest reply always longest | "claim" and "vague" replies now also name the contents (the honest one is now the shortest or middle) |
| 2 | Minor | Arena right option slightly longest in 3 steps; stage 6 "warn" always shortest | memo/reply/"warn" texts rebalanced; the "open" label is still ~10 characters longer (the official page's source line) |
| 3 | Minor | Stage 7 rules and lesson card didn't mention "searching" as a do | Added to stages.js rules and the lesson 7 card |
| 4 | Minor | phones.js mutated the shared apps list | Copies the list |
| 5 | Minor | Stage 2 rule said "on top", grading needs "alone on top" | Rule text updated |

The round-2 fixes are **unreviewed fixes** (Minor, text/length only). All six test suites pass after them.
