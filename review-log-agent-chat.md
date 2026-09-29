# Review log: Be the Agent — honest chats, no teaching/test repeats (29 Sep 2026)

Plan: plan-agent-chat-and-repeats.md (approved). Review level: Standard (up to 3 fresh Opus rounds; stop at a round with no Major findings).

## Self-check before review
All suites pass: check-agent-data (new: practice items, instruct-then-check maker picks, web-inject page texts, no-repeat checks), check-data, check-backend, check-contrast, agent-play (new: 📂 file chips in both phones; practice ≠ stage in the run), agent-devices, touch, playthrough, teacher.

## Round 1 (full): 0 Critical, 1 Major, 10 Minor
| # | Sev | Finding | Fix |
|---|---|---|---|
| M1 | Major | Latte 8,580 taught (case 1) and tested (stage 1 Excel pick, stage 5 best-seller memo); the no-repeat test couldn't see maker sums or memo numbers | Stage 1 Excel pick now Brownie (3 rows, 1,740); memo text names the best seller without 8,580; maker sums and memo numbers added to the test keys |
| m1 | Minor | VAT still taught (case 3) and tested (Agent Arena, plan's exception); stage 7 "vatweb" | README states the exception; vatweb → oat milk search; test: no stage question about VAT |
| m2 | Minor | No-repeat test blind spots | Added page w6 (case 4 topic), a VAT guard, a word-overlap (Jaccard ≥ 0.6) check teaching↔test and Arena↔stage; the browser check compares question texts, not ids |
| m3 | Minor | Near-identical templates | Practice/stage asks reworded (Americano CSV, Americano total, menu reading, Mocha total, Green tea Excel); stage 4 beans question reworded; stage 7 supplier email plan changed. The overlap check found 2 more (case 1 vs Mocha total; Green tea vs Brownie Excel) → reworded |
| m4 | Minor | Lesson 2 demo words pointed at stage/Arena answers | Demo words now point only at practice pieces (apron, shoes, wear, mugs, return, receipt, pay, days) |
| m5 | Minor | Stage 5 memos made from files the request didn't name | Every stage 5 request names its source ("from moonbean_sales_aug2026.csv" / "from Supplier_letter_Aug2026.pdf"), so the 📂 chip shows |
| m6 | Minor | Stage 5 had no "check" request | Added "open file: … (check it)" and its result before the reply; .docx no longer says "rows" |
| m7 | Minor | Case 2 said "Ploy pointed to the PDF" | Now "the model chose the PDF" |
| m8 | Minor | Case 1's screen text not tested | Test: the shown text = the first 5 raw lines + "31 lines (1 header + 30 rows)" |
| m9 | Minor | README "other nine pages" | "other 16 pages" |
| m10 | Minor | Deviations from the plan's example list | Accepted: L1 practice uses public holidays / paper cups / Green tea Excel (the machine sale became a stage 3 question); L2 has mug returns instead of opening hours; the tea-supplier pages became the stage 3 replacement; L4 has 858 per day; the chip says "the café's 3 documents"; lesson 6's example opens the recipe page directly |

Note: tests/touch.py reports iPad tap-target failures only when run with SHOTS=… (screenshots on); the same happens on the version before this change, so it is a test artefact, not new. Without SHOTS it passes.

## Round 2 (delta, fresh reviewer): 0 Critical, 0 Major, 6 Minor → review stops (clean round)
| # | Finding | Fix |
|---|---|---|
| 1 | Stage 5 check text wrong for a table made as .docx | Now "N+1 lines of text, starting “item: total (baht)”" (matches the real .docx) |
| 2 | Lesson 2 demo words "days" (finds stage pieces) and "return" (finds nothing) | Words now apron, shoes, wear, hair, mugs, unused, receipt, pay; new test: every demo word finds only pieces no test uses |
| 3 | Practice results show stage answers as extra hits | L1 file practice now "long hair" (only the Uniform piece); L3 latte-art decoy query now "brownie recipe"; fresh-milk wrong option now 50 baht (not the stage oat 95). Remaining: the paper-cups search lists other Bangkok Coffee Traders titles (oat milk, syrup) as extra results; accepted (titles in a result list, not the question) |
| 4 | Practice "Latte average per day" mirrored stage "average per day" | Now "132 Latte cups for 8,580 baht: price per cup?" (= 65) |
| 5 | README example still Latte | Now the Brownie example |
| 6 | Croissant practice had negative/fractional wrong counts; bookkeeper/accountant mismatch | Whole-number wrong options (±10, ×2, the 3,465-baht total as a trap); hint says bookkeeper |

Round-2 fixes are unreviewed fixes (all suites re-run and pass). The 13-item Arena slice in the overlap test is hard-coded (12 steps + task); a test elsewhere asserts the Arena has 12 steps.
