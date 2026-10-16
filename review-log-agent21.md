# Review log: Be the Agent v2.1 preview (4 lessons + Agent Arena)

Plan: `plan-agent21-four-lessons.md`. Review level: Standard (up to 3 fresh Opus rounds; stop at a round with no Major findings).

## Round 1 (full review)
All suites passed. The reviewer recomputed every context-window key with its own script, the Arena numbers and window, the v2.0 isolation, and the self-check (exact matching on 8 of 8 rows).

| # | Severity | Finding | Fix |
|---|---|---|---|
| M1 | Major | The "never told" chats ended with Ploy giving the fact ("tomorrow we open at 10 am"), followed by an "unsent" wrong reply that repeated message 2, so "never told" was false as shown | Every "why" chat now ends with Ploy's request; the model's wrong reply comes next as a ❌ message (not counted), and a note says which fact the reply needed. The "never" chats no longer contain the fact anywhere. The hint now says to count up from Ploy's last message. |
| M2 | Major | Arena: the window was sized at step 8, but the "Dear owner" memo was written at step 6, when Ploy's first message still fitted | The window size is now taken from the chat at the moment the memo is written (210 words; the chat then had 257), and step 8 shows the window as it was then: only Ploy's first message is greyed. The note and feedback say so. Tests check that nothing inside the window at memo time names Khun Somsak. |
| m1 | Minor | "keyhole" still used in lesson 4 after "from now on … context window" | "In Be the LLM (lesson 4) the model only saw the last few words. A chat model's context window works the same way, but holds much more." |
| m2 | Minor | Repeated sentence in the case 2 note | Merged. |
| m3 | Minor | "the message just after the longest" was right 3 of 6 for the stage chats | Two chats made a non-blocking early message the longest; rule now about 18%, and tested (≤ 40%). |
| m4 | Minor | Real-model cards slightly stronger than the sources | "do worse at using facts in the middle"; "When an app has a 'memory' feature … (Claude's memory, for example, summarises your chats)"; "some chat apps drop the oldest part, and some apps and APIs summarise it". Literature rows updated. |
| m5 | Minor | Self-check didn't check "step '…'" positions | It now checks steps and cards (8 of 8). |
| m6 | Minor | "an earlier chat, which starts empty here" unclear | "the fact was in an earlier chat, and a new chat starts empty". |
| m7 | Minor | "Watch it happen" ended scrolled to the cut line; greyed model bubbles looked highlighted | The phone scrolls to the newest message at the end; slid-out bubbles are light grey with grey text and a dashed outline. |

After the fixes: check-agent21 (60,747 checks), check-backend, agent21-play (1100 and 390 px), teacher-mode, selfcheck-agent21 (clean) pass.

## Round 2 (delta review)
No Critical or Major findings (clean round at the Standard threshold). All round-1 fixes verified; the reviewer recomputed every chat's window, the Arena's memo-time window (210 words; the chat then 257) and the guide's figures; all suites pass.

| # | Severity | Finding | Fix (unreviewed: round 2 was clean, so the review stops here) |
|---|---|---|---|
| m1 | Minor | The roster chat's new hours (7–3, 3–11) were the same as the why-staff "wrong" reply | The wrong reply is now "Bobby: 9 am–5 pm. Fon: 5 pm–1 am." |
| m2 | Minor | New-chat feedback said "a new chat starts empty" twice | The tail now starts "What Ploy said in another chat isn't in this context window…". |
| m3 | Minor | why-name's needed fact ("the owner's name at the top") was already in the chat | "the owner's name itself (Ploy told it in yesterday's chat)". |
| m4 | Minor | Arena rule card still said "the greyed messages … have slid out" | "the greyed message … had slid out of your context window when you wrote the memo." |

## Unreviewed fixes
The 4 round-2 Minor fixes above. After them: check-agent21, agent21-play, selfcheck-agent21 pass.
