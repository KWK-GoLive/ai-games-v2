# Review log: lesson 7 instructions (v2.0, 1 Oct 2026)

Plan: `plan-lesson7-instructions.md`. Review level: Light (1 fresh Opus round, full review).

## Round 1 (full)
No Critical or Major findings. The reviewer recomputed all 4 lesson cases with the toy model (all match) and explained why growing from "A:" finds the same ending as back-off. All 7 steps had no sideways scroll at 360 px and no page errors. check-data and playthrough pass.

| # | Severity | Location | Finding | Action |
|---|---|---|---|---|
| 1 | Minor | Step 1 note, step 4 title | Mixed directions: "shrink the keyhole" / "back off to a shorter ending" vs the new grow-from-"A:" move | Fixed: step 4 is now "A new question: grow from 'A:'". The step 1 note says "the longest ending … it can find (the next step shows a quick way)". |
| 2 | Minor | "A real LLM" card | "doesn't pick the example with the most matching words" also describes the toy model (which uses the longest ending, not the most matching words) | Fixed: "It doesn't look for the longest matching ending; it weighs what all the words mean together." |
| 3 | Minor | "Same question, other words" | ❌ "is the shop open A:" could puzzle students because chat 5 has "is the shop open today" | Fixed: added a note that chat 5 has "is the shop open" followed by "today", not "A:", and an ending only counts if it ends with "A:". |
| 4 | Minor | Steps 4–6 | Doubled punctuation (`"…?".`) | Fixed. |
| 5 | Minor | tests | No automated 360 px pass over lesson 7 | Not added to the suites. The reviewer's 360 px walk was re-run after the fixes: all 7 steps at 360 px, no errors. |

## Unreviewed fixes
Fixes 1–4 above (text only). check-data (52,739 checks), playthrough and the 360 px walk pass after them.
