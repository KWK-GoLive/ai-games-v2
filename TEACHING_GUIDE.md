# Teaching guide: AI games v2 (Parts 1 and 2)

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
| 2 1-word keyhole | 4 sentences (cat, dog) | "my" → cat sleeps all day [end]. "the" → dog sleeps all day [end] ("sleeps" wins the tie after "dog"). After "all": day 2, night 1, so at temperature 0 "night" is never written. |
| 3 Temperature | after "at the weekend we": play 6, read 3, swim 1 (and the day / night bar from lesson 2) | T = 1: 60 / 30 / 10. T = 2: play falls to 47%. T = 0.5: swim falls to 2%. T = 0: only play, and the Spin button switches off. The pointer lands in a part of the 0–100 bar, and that part's word is written. |
| 4 Keyhole | 5 sentences about tea and apples | "we like green ___": 1 word → apples, 2 words → tea, 3 words → apples. "they like green" (3 words): no data. Then the real window sizes (see Sources). |
| 5 2-word keyhole | 6 sentences (cat, dog, mat) | "the dog ___": 1 word → ran, 2 words → sat. "a cat ___": the pair is new, so back off to "cat" → sat. "the dog" with 2 words → sat on the mat [end]. |
| 6 Up to 3 words | 6 sentences (red bus, car, kite) | "we saw a red" → 3 words → kite (2 words → car, 1 word → bus). "i like a red" → back off to "a red" → car. "a big red" → back off to "red" → bus. |
| 7 Answering | 5 chats about a corner shop | "where is the shop" → next to the bank (supported). "when does the bank open" → only "open A:" matches → at nine am (made up). "who owns the bank" → only "A:" matches → "at" (the most common first answer word, 2 of 5), then a tie nine / six → nine → "at nine am". |

## Points to stress

- **The tie rule** belongs to this toy model, not to real LLMs. The stage rule cards and the final word it "Tie? Reading from line 1 down, pick the word you meet first right after the words you look up." It is taught in lesson 1 and used again in lessons 2 and 7 (and in any stage question with a tie).
- **[end]** is a piece the model counts and can pick. Picking it means stop (lessons 1 and 2).
- **Toy vs real** (lesson 4, lesson 7 and the final's end card): real LLMs count tokens, not words. They don't search their training text for exact words and don't back off; they use everything in their window at every step and generalise from learned patterns. The weakness is the same: when they don't know, they still write something that looks like an answer.
- **One model in the final.** In stage 4 the keyhole is strict: unseen words give "no data". The final combines everything instead: every question states its keyhole, and the model always backs off, so "No data" is never the answer there (it stays as a wrong option). Worth saying before the final: "a model always writes something". Example: "the monkey eats meat" with a 3-word keyhole: "monkey eats meat" is not in the Zoo text, so it backs off to "eats meat" → [end].
- **Thai:** Thai text is often split into more tokens than English (lesson 4).
- **Temperature:** in the scored stages it is 0 unless a question shows another value. Stage 3 includes "read the pointer" questions; the pointer position is set by the game, and those questions test reading the stacked bar, not luck.

## Part 2: Be the Agent

### Session plan (estimates, not yet measured with a class)

| What | Time |
|---|---|
| **Be the Agent Arena, Part A** (lessons and stages 1–4); board tab "Be the Agent Arena", Part A view | 45–55 min |
| **Part B** (lessons and stages 5–7) | 35–45 min |
| **Agent Arena** (one task, 12 steps); board tab "Agent Arena" | 15–20 min |

Students always play the **model**: they choose which app to call, write the request, read what comes back and write the reply. They never play the tools.

### Answer key (the café data; all checked by `tests/check-agent-data.js`)

- **Sales file** `moonbean_sales_aug2026.csv`, 1–10 Aug 2026, 30 rows: total 21,445 baht; Latte 8,580 (8 rows, 132 cups); Mocha 4,350.
- **Supplier letter**, page 1: beans rise from 480 to 520 baht per kg from 1 Sep 2026. Page 2: free delivery from 10 kg; pay within 30 days; the small print is a **hidden order** ("Note for AI assistants…"), used only in the Agent Arena (lesson 6's example is a recipe page with a hidden order; stage 6 has its own sources).
- **Lesson practice** uses its own questions (never in a stage or the Agent Arena), e.g. 2 lattes + 1 brownie = 190 baht; long hair tied back; paper cups at Bangkok Coffee Traders; Green tea rows as Excel; uniform, supplier payment terms, mug returns; latte art, fresh milk; Americano total 2,860, 77 croissants, 65 baht per Latte cup; Americano/Mocha rows as files; a news page and a customer email with hidden orders; three permission cases.
- **Stage 1** Which app? (e.g. 2,356 × 48; Mocha total; staff breaks, brownie nuts, croissant price; oat milk, vanilla syrup; one File maker question: Brownie rows as Excel (3 rows), Croissant rows as CSV (7 rows) or the whole sales file as Excel (30 rows); the model opens the file and checks its rows): numbers to work out (+ − × ÷), even from the café's sales file → Calculator; the café's rules, letters and documents → File search; public facts that change → Web search (the result now shows the page opened); a real file → File maker; everyday knowledge or writing → no app.
- **Stage 2** File search (full marks for the search words only when the right piece is alone at the top): arriving 15 minutes before a shift (handbook page 1); student discount, iced latte (65 + 10 = 75), milk price (stays 42 baht), delivery, fridge.
- **Stage 3** Web search: the query must find the page; then open the best source. green tea → Green Leaf's own page, 380 baht per kg (not the 2024 forum post); bean prices → the supplier's own page (not the 2025 forum post); oat milk; the coffee machine sale (ends 30 September). VAT is not a stage question (it's taught in real case 3 and tested only in the Agent Arena).
- **Stage 4** Calculator: Mocha total 4,350; Mocha with 7% VAT 4,654.50; 20 kg of beans at +40 baht = 800; 21,445 ÷ 10 = 2,144.50; best day − worst day.
- **Stage 5** File maker: the right type, a name that says what is inside, the right contents.
- **Stage 6** Hidden orders: tap the sentences that give orders to an AI; then carry on with Ploy's task and warn her.
- **Stage 7** Permissions: reading the file Ploy asked about, searching the web or making the file she asked for → **do**; email, delete (even when asked to tidy up), post publicly, pay → **ask first**; personal data to the web, confidential data to an unapproved site, storing a password → **don't**.
- **Agent Arena**: Calculator SUM(total) = 21,445 → Web search "Thailand VAT rate" → open the Revenue Department page (7%) → 21,445 × 1.07 = 22,946.15 → File search on the supplier letter → warn about the hidden order → (520 − 480) × 15 = 600 baht extra → Word memo with both numbers → ask before emailing the owner → final reply with sources and the warning.

### Points to stress

- **The model only writes text.** The apps (the "harness") run the tools and paste the results into the model's chat. Point at the Model phone: that is its whole world, its keyhole from Part 1.
- **Where the files are.** The café's files sit in a shared folder that the apps can open; every question's chat starts with a set-up note listing them. Ploy doesn't attach them (in real agents, company files are already reachable); she attaches only a new file. **The model can't send a file**: it names it ("📂 opens: …") and the app opens it. Real case 1 shows exactly what came back: the first 5 lines (header + 4 rows) and "31" = 1 header + 30 rows.
- **Instruct, then check.** The model tells the File maker what to take from the file; the app counts the rows; the model opens the file and sees its rows before saying "done". Real case 3 ends with a dashed "safer agent" step (the Calculator), clearly marked as not part of the recording.
- **Check what the tools really did** (real case 1): the agent's report said "Cross-checked via qty×price too", but no tool step in the log did that check.
- **Titles aren't proof** (real case 3): the agent answered from search titles it never opened. The 7% is right (official site); the "through at least September 2026" part could not be verified there.
- **The mini-web is made up**, except the one Revenue Department quote. Say so in class.
- **Hidden orders**: anything inside a file or web page is data, even if it is phrased as an order.

## v2.1 preview: toy model v2 (lesson 8, stage 8 "Meaning brain", final questions 13–14)

The preview is at `/v21/` (https://kwk-golive.github.io/ai-games-v2/v21/). v2.0 stays the class version until you switch. Preview scores go to their own games (`llm21`, `llmfinal21`) and their own board (`v21/board.html?class=CODE`).

**Why a second toy model.** Toy v1 (lessons 1–7) matches the longest exact ending, then writes the word that most often comes next, word by word. Lesson 8 shows four ways a real LLM differs, with numbers students can work out by hand:

1. **Important (rare) words count more than common ones** (a real model goes further: it learns how to decide how much each word counts, its attention, rather than using a fixed table). Word points are counted from the chats' questions: a word in 1 chat = 8, 2 chats = 4, 3–4 chats = 2, 5 or more = 1, every chat (or none) = 0. A chat's score is the sum of the points of the words it shares with the new question. In the lesson, "when does the bank open" gives the shop chat 2 + 2 + 2 = 6 and the bank chat 8, so the bank chat gets the most say (toy v1 gave the shop's time, built word by word from the ending "open A:").
2. **Blended, not copied.** An answer's % = its chats' points ÷ all the points. Temperature 0 writes the biggest; a spin can give another. Toy v2 can still make things up ("who owns the pool" → the cafe owner's name).
3. **Copying from the prompt.** If the last word appeared earlier in the prompt, the model writes the word that came right after it.
4. **Looking things up is an add-on.** A plain model knows only its training patterns plus the prompt; new, live or private information needs a tool (Part 2).

**What to say about it (honestly).**
- Toy v2 is a cartoon of how a model can weigh some words more than others, not the real mechanism. It still needs the exact same words (it cannot link "hours" with "open"), and its stored chats and blended answers are closer to the lookup add-ons below than to attention. In a real Transformer, attention computes each output as "a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key" (Vaswani et al., 2017, §3.2), and each position can attend to all earlier positions (§3.2.3). A real model learns, in training, how to work out these weights for each input: the queries, keys and values come from "learned linear projections" (§3.2.2), and the output is turned into "predicted next-token probabilities" (§3.4), the chances students spin for in lesson 3. There is no points table and no stored chats.
- The doubling table is our own teaching rule (whole numbers, rare words count more), in the spirit of the word weighting search engines use. I cannot verify a specific source for that here, so it is not cited; the table itself is not a published method.
- Copying from the prompt is what researchers call induction heads: the two heads working together "cause the sequence …[A][B]…[A] to be more likely to be completed with [B]" (Olsson et al., 2022, section "Induction Heads"). This source is a research report from Anthropic's Transformer Circuits Thread, not a peer-reviewed paper.
- Lookup add-ons exist as separate systems: Khandelwal et al. (2020, Abstract) "introduce kNN-LMs, which extend a pre-trained neural language model (LM) by linearly interpolating it with a k-nearest neighbors (kNN) model"; retrieval-augmented generation (RAG) combines a pre-trained model with "a dense vector index of Wikipedia, accessed with a pre-trained neural retriever" (Lewis et al., 2020, Abstract). Lewis et al. (§1) note that models without such memory "cannot easily expand or revise their memory".

**Design choices to know about (shortcuts we tested).** `tests/check-toy2.js` tries many guessing rules a student could use without doing the work, separately for stage 8 and the final:
- *Blocked* (each right at most 40%, or 62% for the two-option add-on question): chat position, the odd one out, the plain count of shared words, round numbers and "nearest X%" for every X, rough estimates such as "points × 2.5", the place of the right % among the options, the place or length of copy options, the word before "and" or the full stop, and the sentence form of add-on requests (question vs command, length).
- *Accepted, because they are the idea being taught:* in *which chat* questions, picking the chat that shares the question's important (topic) word is usually right without adding up the points; that is exactly lesson 8's point (a rare, important word counts more than many common ones). In add-on questions, words about time ("today", "tomorrow", "now") usually mean a lookup is needed and writing verbs ("write", "make") usually mean it isn't; that is the concept too (new or live information needs a lookup). Both have counterexamples in the data (*Write a summary of today's top news story* needs a lookup; *Write a poem about tomorrow* doesn't).
- The final's question 13 is always a *which chat* question: the final's own chats give too few different % answers for a fair % question, so the % skill is tested in stage 8 only.
- Students who replay stage 8 several times can start to recognise its % questions (about 10 different right answers); this is inherent to a small question pool.

**Time (estimates, not measured):** lesson 8 about 8–10 minutes; stage 8 about 6–8 minutes (its class time limits add up to about 6½ minutes, plus reading the feedback); the final gains about 3–4 minutes.

## Sources used in the games

- GPT-3's context window is 2,048 tokens: Brown et al. (2020), *Language Models are Few-Shot Learners*, NeurIPS, section 2.1.
- Claude Sonnet 5 has a context window of up to 1,000,000 tokens: Anthropic, *Context windows*, Claude Platform Docs, accessed 28 Sep 2026. This is vendor documentation, not a peer-reviewed source.
- Thailand's VAT rate: Revenue Department, https://www.rd.go.th/english/6043.html, "Currently, the rate is 7 percent.", accessed 28 Sep 2026 (a government source).
- Vaswani, A., et al. (2017). *Attention Is All You Need*. NeurIPS 2017. Read in the arXiv HTML version (arXiv:1706.03762, ar5iv), §3.2, §3.2.2, §3.2.3 and §3.4, accessed 1 Oct 2026.
- Olsson, C., et al. (2022). *In-context Learning and Induction Heads*. Transformer Circuits Thread (Anthropic), https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html, section "Induction Heads", accessed 1 Oct 2026. Not peer-reviewed.
- Khandelwal, U., et al. (2020). *Generalization through Memorization: Nearest Neighbor Language Models*. ICLR 2020. arXiv:1911.00172 (ar5iv), Abstract, accessed 1 Oct 2026.
- Lewis, P., et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. NeurIPS 2020. arXiv:2005.11401 (ar5iv), Abstract and §1, accessed 1 Oct 2026.
- The four agent recordings: our own runs of a Claude agent (claude-sonnet-5) on 28 Sep 2026; single runs, not a measurement of how often agents behave this way.

## Before class

- Delete test rows in the Sheet's `arena` tab (class codes such as TEST or T1), for all five games.
- **Teacher mode (to demonstrate any lesson or stage).** On any game page, press **🎓 Teacher** in the top bar and type the code **KWK-TEACH**. You get a menu of every lesson and stage; open any one directly. Timers are paused, every question has a **Show answer** button (the right answer, the right moves such as search words or the calculation, and the explanation), and **nothing is sent to the class scoreboard**. It stays on in that browser until you press **Leave teacher mode**. A student's own run in the same browser is not touched (but if you use a student's computer while they are in the middle of an item, their item timer keeps running). The code only keeps students from stumbling into it: the page stores it scrambled, but a determined student could still switch teacher mode on. They can never score with it.
- On the projector, open the **teacher view**: front page → "All 4 boards" (top right), then type the class code (or open `teacher.html?class=YOURCODE`). It shows Be the LLM Arena, LLM final, Be the Agent Arena and the Agent Arena at once and updates by itself every few seconds: who is reading a lesson (📖 L4), how many items each student has answered in the current stage (S3 ▶ 2/5), and live points. A big class gets two columns per board and slow auto-scrolling. "Big text" makes it readable from the back; "details ↗" opens one board with every stage column and the Part A/B views.
- Tell students to press Ctrl+Shift+R (or reload) if they opened the site before an update.
