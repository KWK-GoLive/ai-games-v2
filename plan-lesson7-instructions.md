# Plan: Lesson 7 (Answering questions): instructions, other-words step, real-LLM line

## Goal
Lesson 7 teaches the exact method stage 7 tests, step by step. This includes the "quick way" (grow from "A:") and the "same question, other words = Supported" rule. The toy-vs-real card says a real LLM weighs meaning, not matching words.

## Inputs
- llm/js/lessons.js: lesson 7 (function `lesson6`, Corner Shop chats, CASES.L6). It has 5 steps today.
- Stage 7 rules and hint (llm/js/stages.js, llm/js/items.js `stage5`). Supported = same question (same meaning, even in other words) + that answer.
- Checked with the toy model (`LLMA.chatAnswer`): "when is the shop open" → ending "the shop open A:" → "at nine am" → Supported.

## Decisions (from your answers)
1. **New step 2, "How to work it out"** (after "A chatbot continues after 'A:'"), with 4 numbered moves:
   1. Write the question as "Q: … A:".
   2. Seen this exact question? Copy its answer.
   3. If not, use the quick way: start from "A:" and add words to the left one by one. Stop when the ending no longer appears in the chats. The last ending that appeared is the one to use.
   4. Continue word by word: take the word that most often comes next after that ending (tie: the chat higher up wins).
   Then judge it:
   - **Supported** if a chat asks the same question (even in other words) and gives that answer;
   - **Made up** if the answer was borrowed from another question.
   Later steps refer back to "move 3".
2. **The list of endings grows from "A:"** in the "new question" and "only A:" steps, e.g. ✅ "A:" → ✅ "open A:" → ❌ "bank open A:" → stop.
3. **New practice step, "Same question, other words"**, placed after the bank step:
   - "when is the shop open" → ✅ "A:", "open A:", "shop open A:", "the shop open A:" → ❌ "is the shop open A:" → stop;
   - answer "at nine am" → Supported (chat 1 asks the same thing in other words).
   - Two questions: the answer, then Supported/Made up.
4. **Toy vs real card** gains: "A real LLM doesn't pick the example with the most matching words; it weighs what the words mean."
5. The lesson goes from 5 to 7 steps. Nothing else in the game changes.

## Steps
1. lessons.js: the new instruction step; grow-from-A: endings; the new paraphrase step (CASES.L6.other = "when is the shop open"); the card line. → verify: the lesson text uses the toy model's own results (no hand-typed answers).
2. Tests: check-data.js checks that the new case's longest ending is "the shop open A:", the answer is "at nine am" and it is Supported. A browser check walks lesson 7 to the end (teacher mode) with no page errors, plus phone 360 px with no sideways scroll. All existing suites pass.
3. Light review (1 fresh Opus) → `review-log-lesson7.md`.
4. Publish: device folder → GitHub (SHA check) → live check; zip; project note.

## Deliverable
The updated live lesson 7, tests and review log.

## Literature report
No. The new line is a plain-language claim already explained in chat; no citation on the card.

## Calculation workbook
No.

## Review level
Light.

## Success criteria
- Every answer and ending in lesson 7 matches the toy model.
- The instructions match the stage 7 rules and hint word for word in substance.
- Lesson 7 plays to the end on computer and phone.
- All suites pass.

## Open risks
- 2 more steps make the lesson about 1–2 minutes longer.
