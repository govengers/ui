---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 60 min, plus about 40 min for the review round
groomed: no
---

## Task
UX hardening pass, work package WP01 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): the
touch probe, contrast pairs and the declared-pair scan, the touch floor and field text tokens,
the new tokens and token comments, paper's shadows, balanced headings, fourteen `ui.*` keys, the
harness additions, D84 to D88.

## Measurements
- Touch probe before the token fix (390 by 844, coarse pointer, 59 demos, both densities): 691
  offenders, 150 comfortable and 541 compact. `size="sm"` controls 36 px tall (52 icon-only
  Buttons 36 x 36), compact controls 32 px, compact `sm` 28 px, as the plan expected.
- After the fix: 60 offenders before classification, none of them sized by `--ui-control-h*`.
  With the visibility rule (off the page, cut off by hidden overflow, visually hidden), 0
  offenders, 48 `known`, 12 `exempt`; after the review round's label rule 14 `exempt` (the link
  in Checkbox's label sentence, both densities). FacetFilter's remove button measures 30 x 44
  (the plan expected about 30 px wide).
- `just contrast` with the four new pairs, before the fix: exactly the six failures of plan
  section 4, same ratios (neutral dark on surface-2 2.87; paper light on bg 2.86 and on
  surface-2 2.94; slate light on bg 2.98 and on surface-2 2.83; slate dark on surface-2 2.83).
  `--ui-ink-2` on `--ui-surface-2` 7.41 to 10.08, `--ui-focus` on `--ui-surface-2` 4.05 to 7.11.
- `--ui-border-strong` with the plan's values: the least ratio per changed value is neutral dark
  `#72727b` 3.13, paper light `#87847b` 3.10, slate light `#808798` 3.10, slate dark `#646d82`
  3.09; all 192 pairs pass. The least move that reaches 3.05 would be one step per channel
  smaller (`#71717a` 3.08, `#88857c` 3.06, `#81889a` 3.06, `#636c82` 3.05); the plan's values were
  kept, the difference is not visible.
- Declared-pair scan with neither the new pair nor the exemptions: exactly the four kinds of plan
  section 4 (ink-2 on surface-2 in Badge and StatusTile, disabled-ink on sunk in Input, Select and
  Textarea, accent on border in JobProgress, muted on sunk in `Card.demo.vue`). With them: 0 in
  64 style sources.
- Screenshots, rendered from the base commit and from this branch with the same browser: 61 of
  118 files identical; the others are the dark renders of every piece with a `--ui-border-strong`
  line (neutral dark moved), plus four light renders that differ between two runs of the same tree
  (Dashboard, JobProgress, FeedbackCapture, WorkflowStatus: live data). Input, Select, Textarea and
  Button looked at in both themes and left unstaged.

## What went wrong on first try
- `bun scripts/touch-probe.ts` -> no system Chrome and Playwright 1.64.1 wants Chromium build
  1248, which was not installed -> `bunx playwright install chromium` (as plan section 10 says).
- The first probe run after the fix listed 90 offenders, 30 of them invisible: the skip link
  before focus (outside the demo frame's hidden overflow) and Table's sort buttons in card mode
  (inside the `clip: rect(0 0 0 0)` header). The probe now counts those as not visible.
- `just ci` -> `ui-lint` UL-002 on a comment "16px on touch screens" in Input, Select and
  Textarea: the rule reads comments too -> the comment says 1rem.

## Instructions that were wrong or missing
- plan WP01 step 6: "No piece uses another value." above the elevation block / Spotlight, Avatar,
  Tabs and Table draw rings and hairlines with `box-shadow` (fixed now: yes, the comment says no
  piece casts another shadow; the plan records it).
- plan 6.5 D87: `exempt` names "a native box whose label is the target" / no such entry was
  needed, the pass condition already takes the label's box; the only box was a disabled task box
  of rendered markdown (fixed now: yes, D87 and the plan say so).
- plan risk line of WP01: "D84 says so" about presets setting the control heights / the D84 text
  of 6.5 did not (fixed now: yes, D84 has the sentence).

## Questions I had to ask the human
- none

## Pieces that did not fit
- none

## Gate friction
- ui-lint UL-002 matches `16px` inside a CSS comment; the message does not say it was a comment.
- Rendering screenshots on a machine whose browser differs from the committed ones changes the
  size of several pictures (Icon 184 px taller, Stepper 64 px shorter); only a render of the base
  commit with the same browser shows what the change moved.
- `screenshots.ts` stops the demo server by killing `bunx`; Vite exits on its own a moment later,
  so a check right after the run can still see it.

## Time sinks
- Separating the real screenshot changes from browser and live-data noise (two full renders and
  a pixel comparison).

## Suggested improvements (for grooming)
- README: the `just` list could name `just touch-probe` beside `just screenshots`; CLAUDE.md's
  `scripts/` row could name `touch-probe` and `tokens.test.ts` (both files are outside WP01's list).
- script: `screenshots.ts --check` could compare against a render of the base commit instead of
  only checking presence, so a reviewer sees what moved.
- ui-lint: UL-002 could skip comments, or say "in a comment" in its message.
- workbook `maintain-collection` stage 04: say that the screenshots differ by machine and browser,
  so a package compares against a base render before it calls a picture changed.

## Review round 1 (18.11.2026)
The review rejected the package for one MAJOR and seven MINOR findings; all fixed in the run.
- MAJOR: a `known` entry waived its target whatever its size and survived the fix of its
  target. Each entry records a numeric width and height now (`compact` where that density
  differs); a target more than 0.5 px under its record on a side under 44 px fails, and a run
  over every demo fails on a `known` or `exempt` entry that matched nothing. The verdict is the
  pure `judge()` with a table-driven test (`scripts/touch-probe.test.ts`, 12 cases). Proven in the
  browser too, with the edits reverted: FacetFilter's remove button without its padding gives
  `smaller than known ... 14 x 44 (recorded 30 x 44)`, exit 1; a stale entry for AppShell gives
  `stale known /ui/AppShell .ui-app-shell__link: matched nothing`, exit 1.
- The label rule passed a link inside a 44 px label; it holds for an input that is its label's
  control only, and the link in Checkbox's label sentence is `exempt` (inline).
- `--only=<unknown>` ran zero demos and passed; `demoCards` throws `no demo named "<Name>"` now,
  for the screenshots too. `--all` lists the exempt hits with their reason.
- The scan missed `var( --ui-x )`, a `var()` fallback, a background shorthand with more values and
  the own declarations of a rule that nests; it parses rules by brace depth now, the last
  declaration of a property wins, and eight fixture forms cover it (seven of them fail on the
  old scan). Today's result is unchanged: 0 undeclared pairs, and without the new pair and the
  exemptions the same seven findings as before.
- `TODO.md` gets the JobProgress line `exemptPairs` cites (2.84:1 in neutral dark) and the two
  observations of the review, measured again: Pagination's own select keeps 14 px text on touch in
  both densities, the Input demo is 696 px wide at a 390 px viewport.
- `ui.removeFailed` in German loses its lone "Bitte"; plan 6.3 says the same.

What went wrong on first try in the round:
- `Array.prototype.findLast` in `scripts/contrast.ts` -> vue-tsc TS2550, the tsconfig lib is
  ES2022 -> a reversed copy and `find`.

Instructions that were wrong or missing:
- plan WP01 step 1: the `known` list was specified as `{ route, selector, size, why }` with `size`
  as a record only / a waiver needs a size the probe compares and a rule that drops it once
  its target is fixed (fixed now: yes, D87 and the plan's "As built" note say so).
- plan WP01 step 1: "an element passes when its box, or the box of its closest `label`, is at
  least 44 by 44" / only an input that is the label's control is reached through the label (fixed
  now: yes).

Suggested improvements (for grooming):
- workbook `maintain-collection` stage 02: a script that waives findings (`known`, `exempt`,
  `exemptPairs`) records what it waives in a form the script checks, and fails on a waiver that
  no longer matches.

