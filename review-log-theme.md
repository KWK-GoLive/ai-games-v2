# Review log: Chula theme (29 Sep 2026)

Plan: plan-chula-theme.md (approved). Review level: Light (1 fresh Opus round, threshold Critical).

## Self-check before review
- All 9 test suites pass (check-data, check-agent-data, check-backend, check-contrast [new], playthrough [+ theme check on 8 pages], agent-play, touch, agent-devices, teacher), with Bai Jamjuree installed locally so widths are real (the test machine can't reach Google Fonts).
- Contrast script found one extra failure caused by the theme: sender names at 80% white on the #0070c0 bubble = 3.86:1 (was 4.52:1). Fixed with full white (in the spirit of "small fixes, same look").

## Round 1 (full review): 0 Critical, 0 Major, 7 Minor
| # | Finding | Fix |
|---|---|---|
| 1 | `.game .n` fix never applies: front-page cards are `.game.arena`, whose orange circles win | Dead selector removed; orange circles kept as in the teacher's mockup (question for the teacher) |
| 2 | Extra `.b.right .b-from` rule not in the plan | Kept; listed as the 4th contrast fix in README and here |
| 3 | Human right bubble #00739e almost same as model #0070c0 (from the teacher's file) | Not changed (plan: exactly as given); mentioned to the teacher |
| 4 | Focus ring #009fe3 2.97:1, just under 3:1 | Not changed (plan accepted; better than old 2.15:1) |
| 5 | Test didn't assert the font actually loaded | Fixed: `document.fonts.check` asserted |
| 6 | Google Fonts `<link>` is render-blocking | Noted in README |
| 7 | Teacher view at 390 px wraps board titles | Not changed (projector view; readable) |

Fixes 1 and 5 are unreviewed fixes (small, tests re-run: all pass).
