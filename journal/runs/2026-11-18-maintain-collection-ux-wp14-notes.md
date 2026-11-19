---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 40 min, review round about 20 min
groomed: no
---

## Task
UX hardening pass, work package WP14 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): the
"Which loader" section of `patterns/showing-live-data.md` linked from the Doherty Threshold note
(`06-D`, `06-E`), the spacing ladder in the Law of Proximity note (`14-E`), the Words item of the
review stage (`13-C`), the font checks of the preset stage (`17-F`), the touch heights in the
Fitts's Law note (the knowledge lines of `02-A` and `05-A`), the nested-corner gotcha on `Card.md`
(`15-F`). No decision.

## Sources
Every rule written in the run names its source by publisher and title, as `docs/design.md` does.
Each page was opened in the run (HTTP 200) and the sentence the rule rests on was read there:
- NN/g, "Response Times: The 3 Important Limits": past 1 second show that the computer is
  working; past 10 seconds a percent-done indicator and a way to interrupt.
- NN/g, "Progress Indicators Make a Slow System Less Insufferable" and "Skeleton Screens 101":
  read to check the table of "Which loader"; not cited, the response-time article carries both
  limits.
- NN/g, "Confirmation Dialogs Can Prevent User Errors": buttons that summarise what happens
  ("Delete file", "Keep file") instead of Yes and No.
- NN/g, "Error-Message Guidelines": describe the exact problem, offer a remedy, no generic
  "An error occurred", no "invalid".
- NN/g, "Designing Empty States in Complex Applications: 3 Guidelines": system status and a
  direct pathway to the key task.
- W3C, Understanding WCAG 2.2 SC 2.4.6 Headings and Labels, SC 3.3.1 Error Identification,
  SC 3.3.3 Error Suggestion, SC 2.5.5 Target Size (Enhanced) (44 by 44 CSS pixels).
- MDN, `font-display` (swap: an extremely small block period), `font-family` ("The browser will
  select the first font in the list that is installed or that can be downloaded using a
  @font-face at-rule."), `font-variant-numeric` (`tabular-nums` turns on the font's figures of
  equal width, OpenType `tnum`). MDN `@font-face` was opened too and first cited for the
  installed copy; it speaks of one only through `local()` inside a rule (review round 1).

No link was added: the files the run touched cite by publisher and title; the pages above
resolved on 18.11.2026 if a later run wants links.

## As built
Where the build differs from plan section 8, WP14 (for the plan's "As built" note at the merge;
the plan file is not in WP14's list):
- Step 1: a four-row table and one paragraph, 14 lines. The plan's "deletions wait for the
  answer" holds for the confirming Button and the success message, not for the row: a mutation
  with a Removes effect hides the row at once while the call runs and returns it on an error
  (`demo/src/api/runtime.ts`, `call` and `rollBack`). The section says a change shows before the
  answer only if a refusal reverts it, and that the runtime hides a removed row at once and
  returns it on an error, while success is reported only after the answer.
  "The block shows the failure" became "the user is told (Board announces it, pages show
  `move-error`)", because Board says it in a visually hidden live region only (todo below). The
  Skeleton row keeps the plan's "after `--ui-loading-delay`", which WP09 builds; on this branch
  Skeleton has no delay yet (handover todo for WP15). The
  pattern's front matter gains the intents "which loader" and "optimistic update" and the uses
  `Button`, `FileUpload` (the pieces the section names), so `INDEX.md` changes.
- Step 2: the ladder replaces the Field and DetailForm bullet and takes in "Page owns the
  vertical rhythm between its children", which was its own bullet.
- Step 3: Words is item 6; i18n and Laws move to 7 and 8. No file refers to the numbers (grep
  over `workbooks/` and `skills/`). Stage length 39 lines.
- Step 4: the tabular-figure check is tied to the `font-variant-numeric: tabular-nums` that
  `ui/base.css` sets on `html`, which a font without the figures cannot honour.
- Step 5: the 44 px names WCAG 2.2 SC 2.5.5 as its source beside D9, D49, D84.
- Step 6: the plan's sentence taken literally ("takes `--ui-radius-card` minus the inset") gives
  0 px for everything in the card body: the body padding `--ui-card-p` (16 or 20 px) is wider
  than the card radius of every shipped preset (3, 10, 14 px). The gotcha holds for corners
  closer than `--ui-radius-card` to both edges of a card corner (an image or panel with a thin
  inset), says that pieces in the padded header, body and footer keep their own radius (their
  inline inset is `--ui-card-p`), and puts `flush` first (the clip rounds it).
- Step 4: the installed-copy check cites MDN `font-family`, the page that says the browser takes
  the first installed or downloadable font of the list.

## What went wrong on first try
- The first "Which loader" draft was 15 lines -> the plan asks for under 15 -> the paragraph was
  tightened to five lines.

## Instructions that were wrong or missing
- plan WP14 step 1: "payments, deletions and anything irreversible wait for the answer" / the
  runtime hides a removed row before the answer; the confirming Button and the success message
  wait (fixed now: yes, in the section's wording).
- plan WP14 step 6: "something with its own corners inside the card takes `--ui-radius-card`
  minus the inset" / true only for an inset under the card's radius (fixed now: yes, the gotcha
  is scoped).
- `workbooks/review-ui/CONTEXT.md#Stages`: the line for `03-contract-and-laws` lists its items
  without Words (fixed now: no, the file is not in WP14's list; handover todo).

## Questions I had to ask the human
- none

## Pieces that did not fit
- Board: the pattern wants a refused optimistic change told to the user; Board announces a
  refused move only in its visually hidden live region (`ui.moveFailed`) and emits `move-error`,
  and neither its card nor its demo shows the event, so a sighted user sees the card jump back
  without a word (handover todo; `Board.md` is WP12's).

## Gate friction
- none. No piece's look or behaviour changed, so no screenshot was rendered and no touch probe
  run.

## Time sinks
- Reading the sources and the runtime's `call` to check each sentence the plan handed over
  before writing it down.

## Suggested improvements (for grooming)
- workbook `maintain-collection` stage 03: say that a pattern or knowledge note names an outside
  rule by publisher and title (`WCAG 2.2 SC n`, `MDN, <page>`, `NN/g, "<title>"`), as
  `docs/design.md` does; today only this pass's plan says it.
- plan section 7.3: the handover block has no field for the "As built" note that the
  plan carries per package; a parallel package cannot write the plan, so the note travels in the
  run report (`## As built` here).

## Review round 1 (18.11.2026)
The review rejected the package with one MAJOR and three MINOR findings; all fixed in the run.
- MAJOR, `workbooks/design-direction/stages/03-preset/CONTEXT.md`: the installed-copy check
  cited MDN `@font-face`, which speaks of an installed copy only through `local()` inside a rule.
  It cites MDN `font-family` now, opened in the round (HTTP 200), whose sentence carries it: "The
  browser will select the first font in the list that is installed or that can be downloaded
  using a @font-face at-rule."
- MINOR, `patterns/showing-live-data.md` table: "`Skeleton` ... after `--ui-loading-delay`" is
  not true on this branch, WP09 builds the delay. The plan's wording stays; the handover carries
  a check for WP15.
- MINOR, `ui/Card/Card.md`: "closer to the card's edge than `--ui-radius-card`" still matched a
  footer Button in slate (12 px footer padding plus the 1 px border is 13 px from the bottom edge,
  under the 14 px radius, while its inline inset is 17 or 21 px). The gotcha says "closer than
  `--ui-radius-card` to both edges of a card corner" and names header, body and footer.
  Checked in `ui/tokens.css` (`--ui-card-p` 20 px, 16 px compact, `--ui-space-3` 12 px, border
  1 px), `ui/presets/slate.css` (radius 14 px) and `ui/Card/Card.vue` (header and body inline
  padding `--ui-card-p`, footer `--ui-space-3` by `--ui-card-p`).
- MINOR, `patterns/showing-live-data.md` paragraph: "only a change that can be undone shows
  before the answer" read as contradicting a deletion whose row is already gone. The paragraph
  says why now: a change shows before the answer only if a refusal reverts it, and the runtime
  hides a removed row at once and returns it on an error; success still waits for the answer.
  Still 14 lines ("past about 10 s" became "past 10 s", as NN/g's "Anything slower than 10
  seconds").

What went wrong on first try in the round:
- none

Instructions that were wrong or missing:
- none beyond the findings above.

Suggested improvements (for grooming):
- workbook `maintain-collection` stage 03: a cited source is the page whose sentence carries the
  claim, quoted in the run report; a neighbouring page on the same topic is not enough.

## Handover
decision: none
journal: 18.11.2026 maintain-collection ux-wp14-notes - done after one review round: "Which loader" in the live-data pattern (NN/g response-time limits, a change before the answer only if a refusal reverts it, success of a deletion after the answer), spacing ladder and its review question, Words item in the review stage, font checks in the preset stage, touch heights through D84 in Fitts's Law, nested-corner gotcha on Card; run report journal/runs/2026-11-18-maintain-collection-ux-wp14-notes.md
readme: none
todo:
- 18.11.2026 showing-live-data: the "Which loader" table says Skeleton shows after `--ui-loading-delay`, which WP09 builds; WP15 confirms after the WP09 merge that Skeleton reads the token, else drops the clause.
- 18.11.2026 review-ui: the stage list in `workbooks/review-ui/CONTEXT.md` names the items of `03-contract-and-laws` without the Words item the stage has since WP14.
- 18.11.2026 Board: a refused move is said only in the visually hidden live region (`ui.moveFailed`); a sighted user sees the card jump back without a word, and neither the card nor the demo shows `move-error`.
keys: none
screenshots: none
probes: none in a browser; no piece's look or behaviour changed. The cited pages were opened in the run (HTTP 200) and the sentences above read there.
