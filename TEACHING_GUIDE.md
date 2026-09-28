# Teaching guide: AI games v2 (Part 1)

Audience: students with no background in LLMs or coding. Everything is tap-only and works on phones and iPads.

## Suggested session plan (estimates, not yet measured with a class)

| When | What | Time |
|---|---|---|
| Start | Class code on the board; students sign in on the front page (nickname, team, class code) | 3 min |
| 1 | Warm-up **What comes next?**; show the board tab "Warm-up" | 5–7 min |
| 2 | **Be the LLM Arena, Part A** (lessons and stages 1–4) | 45–55 min |
| Break | The board, Part A view: discuss stage 3 (temperature) and stage 4 (keyhole) | 5–10 min |
| 3 | **Part B** (lessons and stages 5–7). A student on another device continues with the resume code shown after each stage | 35–45 min |
| 4 | **Final: Be the LLM Arena**, one stage, 12 questions | 15–20 min |

Timers are 1.5× the base times (`TIME_FACTOR` in `config.js`). Only each nickname's **first** run counts on the board. After that, students can practise; lessons they have already done on that device can be skipped.

## What each lesson teaches (answer key)

| Lesson | Text | Key facts the lesson shows (checked by `tests/check-data.js`) |
|---|---|---|
| 1 Counting | 5 sentences about drinks | After "drink": tea 2, coffee 1, water 1, so coffee = 25%. After "I": drink 3 of 4 = 75%. After "night": [end] (3 of 3). After "tea": in 1, at 1, a tie, and "in" wins because it comes first (sentence 1). |
| 2 1-word window | 4 sentences (cat, dog) | "my" → cat sleeps all day [end]. "the" → dog sleeps all day [end] ("sleeps" wins the tie after "dog"). After "all": day 2, night 1, so at temperature 0 "night" is never written. |
| 3 Temperature | after "at the weekend we": play 6, read 3, swim 1 (and the day / night bar from lesson 2) | T = 1: 60 / 30 / 10. T = 2: play falls to 47%. T = 0.5: swim falls to 2%. T = 0: only play, and the Spin button switches off. The pointer lands in a part of the 0–100 bar, and that part's word is written. |
| 4 Keyhole | 5 sentences about tea and apples | "we like green ___": 1 word → apples, 2 words → tea, 3 words → apples. "they like green" (3 words): no data. Then the real window sizes (see Sources). |
| 5 2-word window | 6 sentences (cat, dog, mat) | "the dog ___": 1 word → ran, 2 words → sat. "a cat ___": the pair is new, so back off to "cat" → sat. "the dog" with 2 words → sat on the mat [end]. |
| 6 Answering | 5 chats about a corner shop | "where is the shop" → next to the bank (supported). "when does the bank open" → only "open A:" matches → at nine am (made up). "who owns the bank" → only "A:" matches → "at" (the most common first answer word, 2 of 5), then a tie nine / six → nine → "at nine am". |
| 7 Up to 3 words | 6 sentences (red bus, car, kite) | "we saw a red" → 3 words → kite (2 words → car, 1 word → bus). "i like a red" → back off to "a red" → car. "a big red" → back off to "red" → bus. An unscored temperature slider follows. |

## Points to stress

- **The tie rule** belongs to this toy model, not to real LLMs: on a tie, it takes the word it saw first right after the context. It is taught in lesson 1 and used again in lessons 2 and 6 (and in any stage question with a tie).
- **[end]** is a piece the model counts and can pick. Picking it means stop (lessons 1 and 2).
- **Toy vs real** (lessons 4, 6 and 7): real LLMs count tokens, not words. They don't search their training text for exact words and don't back off; they use everything in their window at every step and generalise from learned patterns. The weakness is the same: when they don't know, they still write something that looks like an answer.
- **Thai:** Thai text is often split into more tokens than English (lesson 4).
- **Temperature:** in the scored stages it is 0 unless a question shows another value. Stage 3 includes "read the pointer" questions; the pointer position is set by the game, and those questions test reading the stacked bar, not luck.

## Sources used in the games

- GPT-3's context window is 2,048 tokens: Brown et al. (2020), *Language Models are Few-Shot Learners*, NeurIPS, section 2.1.
- Claude Sonnet 5 has a context window of up to 1,000,000 tokens: Anthropic, *Context windows*, Claude Platform Docs, accessed 28 Sep 2026. This is vendor documentation, not a peer-reviewed source. It is labelled as such in the game.

## Before class

- Delete test rows in the Sheet's `arena` tab (class codes such as TEST or T1).
- Tell students to press Ctrl+Shift+R (or reload) if they opened the site before an update.
