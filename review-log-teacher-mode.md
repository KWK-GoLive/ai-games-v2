# Review log: teacher mode (1 Oct 2026)

Plan: plan-teacher-mode.md (approved). Review level: Light (1 fresh Opus round; Major findings asked to the teacher).

## Self-check
New tests/teacher-mode.py on all 5 pages (wrong code refused, KWK-TEACH unlocks in any case, stays on after reload, lesson/stage opens directly, timer paused and never runs out, Show answer = full marks, an answer can still be submitted, zero scoreboard requests, the student's saved run untouched, no "done" tick, Leave works, 360 px phone). check-agent-data: solve() scores full marks for every stage item. All suites pass.

## Round 1 (full): 0 Critical, 1 Major, 6 Minor
| # | Sev | Finding | Fix |
|---|---|---|---|
| M1 | Major | A finished teacher run offered "Practice run": on a student's computer that started a nameless practice run and hid the sign-in form | Asked the teacher → fixed: a teacher run ends with "🎓 Back to teacher menu"; test plays a teacher stage to the end and checks nothing is saved or ticked and the sign-in form stays |
| 1 | Minor | Show answer didn't print the search words / query / calculation | The card now lists the right moves ("Search words: …", "Search: …", "Calculator: …", "Hidden order: sentence …") |
| 2 | Minor | "Your points so far are already on the scoreboard" shown in teacher (and practice) runs | Only when the run really sends to the scoreboard |
| 3 | Minor | No focus trap in the code dialog | Not changed (Escape, Cancel, overlay click and focus return work) |
| 4 | Minor | Using teacher mode on a student's computer mid-item uses up their item time | Noted in the teaching guide |
| 5 | Minor | Tests didn't prove "nothing sent" against a control, nor play a teacher stage to the end | Control added (an official run in the same set-up does send); full teacher stage added |
| 6 | Minor | The hash isn't a real gate (localStorage can switch it on) | Stated plainly in the guide and README |

Also (teacher's request during this work): lesson 3's spin now glides once, slowly, when the computer has "reduce motion" on (it used to jump straight to the result). Unreviewed fixes: M1, 1, 2, 5 and the spin change (all suites re-run and pass).
