# Plan: Be the Agent v2.1: 4 lessons (Which app, Hidden orders, Permissions, Context window) + a rebuilt Agent Arena

## Goal
A preview at `/v21/agent/` and `/v21/agent-final/` where students learn in 4 lessons, each followed by a timed stage:
1. which app an agent needs;
2. that text in data is not orders;
3. who decides about risky actions;
4. that a model forgets what has left its context window.

The final Agent Arena tests the same 4 skills. The live 7-lesson game stays unchanged until you approve a switch.

## Inputs
- Live v2.0 Be the Agent: `agent/` (7 lessons + 7 stages, game `agent2`) and `agent-final/` (12-step memo task, `agentfinal`).
- Engine: `shared/arena.js` (works without parts), the apps in `agent/js/tools.js`, the phones in `phones.js`, the items in `items.js`.
- v1 "The desk" level (Game 2): a 200-token desk; the name message falls off; a new chat is empty; "memory" is saved notes pasted in.
- Backend `apps-script/Code.gs` (web app version 8).

## Decisions (from your answers)
- **Where:** v2.1 preview only. New copies in `v21/agent/` and `v21/agent-final/`. New game IDs `agent21` (4 stages) and `agentfinal21`. v2.0 files are SHA-checked as unchanged.
- **The 4 lessons and stages, in order, with no Part A/B split:**
  1. **Which app?**
     - Lesson 1 is kept: the 4 real cases plus the "pick the app" practice.
     - Its "That's lesson 2/3" pointers are rewritten, because lessons 2–5 (File search, Web search, Calculator, File maker) are removed together with their stages.
     - Stage 1 becomes **pick the app only** (one tap). The feedback shows what the right app sends back and a good reply.
  2. **Hidden orders:** the current lesson 6 and stage 6, unchanged except the wording that points to other lessons. The key message stays: text that apps bring back is data, never orders; ignore it, finish the task and warn the human; there is no complete fix yet.
  3. **Permissions:** the current lesson 7 and stage 7. Its "Next" card is changed to point to the context window lesson.
  4. **Context window (new):**
     - **Toy:** the model's chat holds a fixed number of words. When a long chat with Ploy goes past it, the oldest messages slide out and the model can no longer see them, for example Ploy's early "always write prices in baht" or her name for the memo. It then answers wrongly.
     - **Fixes taught:** repeat the key fact; start a new chat with a short summary; saved notes ("memory") are pasted back into the chat (a new chat starts empty).
     - **A "Real models" card:** real windows are far bigger, but long chats and big files still fill them, and models can miss things in the middle of a long text. Cited in the guide.
     - **Stage 4 (timed, scored), 3 item kinds:**
       - **What can the model still see?** Tap the messages still in the window.
       - **Why did it go wrong?** The fact slid out of the window / was never given / it was a new chat.
       - **Best fix:** repeat it / a new chat with a summary / saved notes.
- **Name:** "keyhole (context window)" on first use, with a pointer to Be the LLM lesson 4; then "context window" everywhere, including the figures, because that is the real term. The window is sized in words. The exact size is set in the lesson, about 60 words, and checked so the examples work.
- **Real case 3 (VAT):** the chat stays in the recorded order up to the reply. The dashed "safer agent" Calculator step (8580 * 1.07 = 9,180.6) moves **before** the reply, where it should happen. A note says the real agent skipped it and worked the sum out itself. The reply stays the real one.
- **Extra messages for users** go into the lesson cards and the Arena, not new lessons:
  - **check what the agent really did** (tool log, open the file before trusting "done");
  - **check sources** (who wrote the page, and when).
- **Agent Arena:** rebuilt for the 4 lessons. One café task for Ploy in about 8–10 timed steps:
  - choose the app for each sub-task;
  - spot the hidden order in the supplier letter;
  - decide whether to send the memo or ask first;
  - one context-window moment (an early instruction has slid out of the window);
  - one "check what it really did" step and one "check the source" step.
- **Backend:** I add `agent21: 4, agentfinal21: 1` to Code.gs and deploy it in your Chrome as a new version. You approve any Google prompt yourself.
- **Also:** the 4 Minor round-8 fixes for the LLM v2.1 preview, still unpublished, are published together with this.

## Steps
1. Copy `agent/` and `agent-final/` into `v21/`; set the new game IDs; write the 4-stage `stages.js` without parts; rewrite the cross-lesson pointers. → verify: grep finds no "lesson 2/3/4/5", "7 lessons" or "Part B" in `v21/agent*`; the v2.0 SHAs are unchanged.
2. Stage 1 as pick-the-app only, with the right app's result and a good reply in the feedback. → verify: `solve()` gives full marks; each item has exactly one right app (the check-agent-data rules re-used).
3. Case 3: move the safer step before the reply and add the note. → verify: a playthrough screenshot shows the order search → peek file → results → (safer) Calculator → reply.
4. Context window engine and data: word counting, the window slide, lesson 4 (about 6 steps with practice), stage 4 (3 item kinds, a pool with no repeats from the lesson). → verify: a new `tests/check-agent21.js` recomputes, independently, which messages are inside the window for every item; each key is unique; guessing rules ("the newest N", "the longest message", the first option) are ≤ 40% on 3–4-option items.
5. Rebuilt Agent Arena (8–10 steps). → verify: `solve()` gives full marks; the sales/VAT numbers match the answer key (7%, Latte 8,580).
6. Text: README, TEACHING_GUIDE (v2.1 Be the Agent section, time estimates, sources), the v21 landing page and board labels for `agent21`. → verify: the landing page links work; the board shows 4 columns for `agent21`.
7. Literature: the real-model claims in the context lesson (window sizes, "lost in the middle", memory features), read in full text (peer-reviewed first; vendor documentation labelled as such) → `literature-report-agent21.xlsx` + selfcheck. → verify: the selfcheck finds every quote exactly.
8. Tests at 1100 px and 360 px (no sideways scroll), teacher mode on the new pages, check-backend cases for `agent21`. → verify: all suites pass.
9. Standard review (up to 3 fresh Opus rounds) → `review-log-agent21.md`.
10. Publish `/v21/agent*` and the round-8 LLM fixes (SHA check and live check); deploy Code.gs in your Chrome; one test run reaches the `agent21` board; zip and project notes.

## Deliverable
Preview pages:
- https://kwk-golive.github.io/ai-games-v2/v21/agent/
- https://kwk-golive.github.io/ai-games-v2/v21/agent-final/

Also: the tests, the guide/README sections, `literature-report-agent21.xlsx`, `review-log-agent21.md` and the Code.gs change.

## Literature report
Yes: `literature-report-agent21.xlsx`. Peer-reviewed papers are preferred (e.g. Liu et al., 2024, TACL, "Lost in the Middle", if confirmed in full text); vendor documentation only for product facts (window sizes, memory features), labelled with its access date. The game cards carry no citations; the guide does.

## Calculation workbook
No. The only numbers are word counts and the existing answer-key values, recomputed by the test scripts.

## Review level
Standard → `review-log-agent21.md`.

## Success criteria
- 4 lessons + 4 stages + the Arena play through on computer and phone; teacher mode works.
- Every context-window key matches the independent test; no guessing rule > 40% (3–4 options).
- Case 3 shows the safer step before the reply, clearly labelled as not recorded.
- No text in `v21/agent*` points to a removed lesson.
- v2.0 untouched (SHA check); all suites pass; the final review round has no Major findings.

## Open risks
- Removing lessons 2–5 also removes the hands-on File search, Web search, Calculator and File maker practice; the only things kept are the app choice plus the "check sources" and "check what it really did" cards.
- Time (estimates, not measured): about 40–55 min for the main game and 10–15 min for the Arena.
- A word-counted window is a simplification (real models count tokens); the lesson says so.
