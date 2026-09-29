# Review log: content fixes (29 Sep 2026)

Plan: plan-content-fixes.md (apply content-review findings #1–#23, #25; #24 not applied by the teacher's choice; swap LLM stages 6 and 7; files in the chat). Review level: Standard.

## Round 1 (full review): 0 Critical, 1 Major, 10 Minor

| # | Sev. | Finding | Fix |
|---|---|---|---|
| M1 | Major | New tie wording "comes first in the text" contradicted the model (it picks the word met first *right after* the looked-up words); 8 of 108 ties in the stage texts differ, some asked in stages 5 and 6 | New wording everywhere: "Tie? Reading from line 1 down, pick the word you meet first right after the words you look up."; lesson 1 tie step and recap, README, guide |
| 1 | Minor | Chat rule lost "reworded question" case | "(same meaning, even in other words)" added |
| 2 | Minor | App rule "numbers to add up" missed × ÷ | "Numbers to work out (+ − × ÷), even from the café's sales file → Calculator" |
| 3 | Minor | 📎 chips cued File search in stage 1 | Chips removed from break/nuts/beans; harmless CSV chip on the "what does CSV stand for" item; CSV chip kept on Mocha/Excel |
| 4 | Minor | Web hint named the page | Hint now asks for the official/first-hand, up-to-date page (stage 2 title hint and stage 5 hints kept: hints halve the points) |
| 5 | Minor | Case 2 chip vs "in the shared folder" | Case 2 say-line explains the shared folder |
| 6 | Minor | Front page listed the old stage order | Fixed |
| 7 | Minor | Stale comments/test message after the swap | Fixed |
| 8 | Minor | Guide said the vendor source is labelled in the game | Sentence removed |
| 9 | Minor | Toy-vs-real still in stage 1 end text; "piece" in the final | Stage 1 sentence cut; "next word". The temperature calculator's optional "how it's worked out" note (tempviz.js) still mentions real models' scores; kept (it explains the maths, not a caveat) |
| 10 | Minor | "Whole trick" removed rather than moved | The warm-up end text already says it; no change |

Note: the round-1 table says the README tie wording was fixed; it was only fixed in round 2 (m1 below).

## Round 2 (delta review): 0 Critical, 0 Major, 5 Minor → clean round, review stops

The reviewer checked the new tie wording against the model on every tie in all texts: 198 ties, 0 mismatches.

| # | Sev. | Finding | Fix |
|---|---|---|---|
| m1 | Minor | README still had the old tie wording | Fixed |
| m2 | Minor | Lesson 2 feedback "(tie: it comes first)" was vague | "(a tie: reading from line 1 down, it is the first one right after …)" |
| m3 | Minor | Stage 4 feedback said "window" | "keyhole" |
| m4 | Minor | Guide said the tie rule is "always" worded one way; guide lesson names said "window" | Guide wording corrected; "keyhole" |
| m5 | Minor | Web hint "official or first-hand" didn't fit the CSV and beans items | "open the page from the source the question names (or the official one), and check the date" |

The round-2 fixes are **unreviewed fixes** (text only). All test suites pass after them.

Test note: tests/teacher.py failed intermittently twice (1 check, not captured); the most likely cause, the mid-game "refreshed by itself" check comparing a row that may already be up to date, now checks the refresh time stamp instead; 3 runs in a row passed after that.
