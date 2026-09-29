# Review log: one realistic model in the finals (29 Sep 2026)

Plan: plan-final-one-model.md (approved). Review level: Light (1 fresh Opus round).

## Self-check
check-data (52,732 checks, incl. new final checks over 150 seeds: keys = independent back-off model, "none" never the key, "No data" always a wrong option, two different keyhole sizes), check-agent-data, check-backend, check-contrast, playthrough (+ final keyhole text check), touch, agent-play, teacher, agent-devices: all pass.

## Round 1 (full): 0 Critical, 0 Major, 5 Minor
| # | Finding | Fix |
|---|---|---|
| 1 | Rule card "Every question states its keyhole", but temperature and chat questions don't | Card now: "Where the keyhole matters, the question states it…" |
| 2 | Back-off almost never happened in the keyhole questions (2.4%): sentences where the size changes the answer rarely need back-off | Asked the teacher: now one of each. Question 6: a 3-word keyhole whose words are NOT in the text (must back off; "No data" is the trap; 65 different sentences, incl. "the monkey eats meat"). Question 7: 1- or 2-word keyhole where the size changes the answer (18 variants). Sentence starts with a repeated noun or a dangling last word ("…bread is") are left out. |
| 3 | Possible crash if a text had only one suitable sentence | Generator rewritten: tries every text, then relaxes the wish; never picks from an empty pool |
| 4 | Two wordings for the same model (items 6–7 vs 9–10) | Title now "Up to a k-word keyhole (backing off if needed): …" (k = 1: "With a 1-word keyhole") |
| 5 | Comma splice in the final's goal; Agent Arena half-marks wording | Fixed ("…keyhole size, because it changes!"; "your words also fit other pieces") |

Fixes 2–5 are unreviewed fixes (all tests re-run and pass; check-data now also checks that question 6's 3 words are absent from the text and that question 7's answer changes with the keyhole size).
