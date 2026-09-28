# AI games v2 (Part 1: language models)

Browser games for complete beginners in the course "AI for Data Work". Plain HTML, CSS and JavaScript: no build step and no libraries. Made for phones, iPads and computers: everything is tap-only, tap targets are at least 40–44 px, and nothing scrolls sideways from 360 px up. It runs on GitHub Pages, and all the model work happens in the browser.

**Live site:** https://kwk-golive.github.io/ai-games-v2/ (the first version stays at https://kwk-golive.github.io/ai-games/).

| # | Game | Folder | Scoreboard ID | Time (estimate, not yet measured with a class) |
|---|---|---|---|---|
| 1 | Warm-up: **What comes next?** 8 questions on two 5-sentence texts | `warmup/` | `warmup` | 5–7 min |
| 2 | **Be the LLM Arena**: 7 lessons, each followed by its timed stage. Part A = 1–4, Part B = 5–7 | `llm/` | `llm2` | 80–100 min (A about 45–55, B about 35–45) |
| 3 | **Final: Be the LLM Arena**: one stage, 12 questions covering all 7 skills | `final/` | `llmfinal` | 15–20 min |

Part 2 (AI agents) is frozen. The front page shows it as "Coming soon".

## The main game: lesson → stage

| # | Lesson (untimed, unscored practice with instant feedback) | Stage (timed, scored) |
|---|---|---|
| 1 | Counting: count → %, [end] is counted too, temperature 0 = top count, tie = first seen right after the word | Count it (5 items) |
| 2 | Writing with a 1-word window; [end] stops the sentence | Greedy writer (3) |
| 3 | Temperature: the stacked bar, the spinning pointer, and a **temperature calculator** (slider 0 / 0.5 / 1 / 2 / 5, counts you can change) | Temperature (5): "predict" questions and "read the pointer" questions |
| 4 | The keyhole (context window): 1, 2 and 3 words, "no data", and **real window sizes** (see Sources) | Keyhole (6) |
| 5 | Two-word window plus back-off to 1 word | **Two-word boss** (3 whole continuations; large "2-WORD WINDOW" badge) |
| 6 | Answering questions: continue after "A:", shrink the keyhole, only "A:" left, supported vs made up, **toy vs real** | Chat brain (4) |
| 7 | Up to 3 words: the longest keyhole with data wins (3 → 2 → 1), plus an unscored temperature slider | **Three-word boss** (6 single next-word questions) |

Each lesson uses its own 4–6-sentence text, which is different from the stage texts. `tests/check-data.js` checks that every lesson text still shows what the lesson says about it.

## Files

- `shared/model.js`: the toy n-gram model with back-off. Temperature: p ∝ count^(1/T).
- `shared/arena.js`: the arena shell (sign-in, timer, scoring, resume codes, scoreboard queue). Added in v2: lessons (`stage.teach`), parts (`stage.part`) and badges (`stage.badge`).
- `shared/tempviz.js`: the stacked bar, the pointer and the temperature calculator.
- `shared/board.js`, `board.html`: the class scoreboard (Warm-up / Be the LLM Arena with All / Part A / Part B views / Final).
- `llm/js/items.js`: all stage items and the final's 12 items. Keys come from the model.
- `llm/js/lessons.js`: the 7 lessons.
- `llm/js/draw.js`: how the items are drawn.
- `apps-script/Code.gs`: the scoreboard web app. **One sheet serves both sites.** v2 added the game IDs `warmup`, `llm2` and `llmfinal`, and a stage count per game.
- `config.js`: `SCOREBOARD_URL`, `BOARD_REFRESH_SECONDS`, `TIME_FACTOR` (1.5 = 50% more time).

## Tests

```
node tests/check-data.js        # every answer key recomputed by a separate counting model (150 seeds), lesson facts, sources
node tests/check-backend.js     # scoreboard logic, including the v2 game IDs
python3 tests/playthrough.py    # the whole site in Chromium: every lesson and stage, resume on a 2nd device, board, widths 360-1366 px
python3 tests/touch.py          # emulated iPhone 13 and iPad: tapping through a lesson, 40 px+ tap targets, the calculator by touch
```

## Scoreboard

These steps are the same as in v1. Paste `apps-script/Code.gs` into the Apps Script of the Google Sheet, then choose **Deploy → Manage deployments → Edit → New version**. The web-app URL stays the same, so `config.js` doesn't change. Before class, delete any test rows from the `arena` tab.

## Sources

- Brown, T. B., et al. (2020). *Language Models are Few-Shot Learners*. NeurIPS 2020, section 2.1: "All models use a context window of n_ctx = 2048 tokens."
- Anthropic, *Context windows* (Claude Platform Docs), https://platform.claude.com/docs/en/build-with-claude/context-windows, accessed 28 Sep 2026. It lists Claude Sonnet 5 among the models with a 1M-token context window.
