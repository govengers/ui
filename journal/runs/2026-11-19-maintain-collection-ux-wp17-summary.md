---
date: 19.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 3 h
groomed: no
---

## Task
UX hardening pass, work package WP17 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): one page
for the owner, outside the repository in the folder the dispatcher named, saying what changed per
theme with the numbers, the before and after pictures of every piece whose look moved, the
removable parts with their revert commands, the decisions waiting for the owner, what nobody
verified with the manual check list of plan section 12, the probe results and the "seen, not
planned" list. Branch `task/ux-wp17` from the integration branch at d9a9549; it ran alone and
writes only this report and the journal line into the repository.

## What was delivered
- One self-contained local page (plain HTML and CSS, light and dark by `prefers-color-scheme`, no
  script, relative pictures), outside the repository. Contents: verdict, changes by theme,
  pictures in seven groups, sixteen decisions, the unverified list and the manual checks, probe
  results with the `known` list and its reasons, the 61 `TODO.md` lines of the pass, the commands
  to look at it. Every number is tagged as measured on 19.11.2026 or as reported by a named run
  report or review.
- The render and compare scripts and the scratch phone fixture sit beside the page, not here.

## Measurements (19.11.2026, this machine, cached Chromium 156.0.8078.4, Bun 1.4.4)
- Pictures: `main` (d353ef1) and the integration head (d9a9549) exported with `git archive` (no
  worktree), each with `bun install --frozen-lockfile`, rendered with the logic and injected style of
  the head's `scripts/screenshots.ts` (1280 by 900, device scale 1, reduced motion), twice per side.
  A pixel counts as changed above 2 of 255 on a channel, unless it also differs by more than 2
  between the two renders of one side (live content: a time, a random count, the demo server's
  random port in FeedbackCapture's captured URL). Of 122 pictures: 4 new (RadioGroup, Tooltip),
  12 with another size (AgentDock, AppShell, Avatar, Button, SearchTable, Table), 16 visibly changed
  at the same size (DetailForm, Field, ListPage, Select, StatusTile, Stepper, Textarea, Toast), 34
  dark pictures by the border shade of D85 only (at most 6 of 255; Markdown 8 at one textarea
  edge), 4 live text only, 52 equal (AgentCursor and Spotlight dark by 2 of 255).
- Committed screenshots against a render made today of the same tree: 52 of the 122 files in
  `screenshots/` differ (7 another height, 9 by at most 2 of 255, 36 by more); 30 date from
  02.11.2026. The pass's committed pictures were not used as a before.
- Paper and slate presets (Input, Card, Popover, Dialog, both themes): the border shade in paper
  light, slate light and slate dark (at most 6 to 8 of 255), paper's straight-down overlay shadow;
  paper dark unchanged (at most 2 of 255).
- Phone, 390 by 844 touch, a full-screen scratch fixture outside the repository (a shell with
  seven items and a nav footer, a form of sixteen fields with a sticky ActionBar): on `main` five
  tabs and no way to the other two items or the footer, the ActionBar 775..844 over the whole tab
  bar 790..844, a field focused by script in the strip under the bars stays at 770..814; on the head
  four tabs and More, the ActionBar 721..790 on the bar, the field scrolled clear to 333..377. The
  list recipe on a 390 px phone: 514 px wide on `main`, 390 on the head.
- Demo widths on touch, every demo page in the demonstrator: wider than the screen on `main` 11 of
  59 at 390 px, 13 at 360, 20 at 320; on the head 0 of 61 at all three.
- The head's touch probe run against `main`'s tree (its script copied into the export): 596
  offenders outside its lists, 29 known targets smaller than recorded, 23 known at their size: 648
  targets under 44 px on touch; on the head 0 offenders, 46 known, 14 exempt.
- Counts on `main`: 335 tests in 42 files (8 mounted test files), 168/168 contrast pairs, 7 lint
  rules. On the head: 671 tests in 67 files (27 mounted), 216/216 pairs, 12 rules, 20 new `ui.*`
  keys in both locales, decisions D84 to D106 (D105 unused). `just test` 1.36 to 1.53 s, `just
  test-ci` 3.67 to 3.91 s, three runs each, load average about 2 to 3.
- Revert commands, each on a scratch clone at d9a9549, then `just ci` and `screenshots.ts --check`:
  drop the pressed state (`git revert --no-edit 030a137..7b63e1a && git revert --no-edit
  c4aec4b..b8f22a3`): clean, 198/198 pairs, 667 tests; drop the Tooltip inversion (`git revert
  --no-edit 7b63e1a..54ab6fd && git revert --no-edit cee50d2..0fac6a6`): clean, 210/210, 670 tests;
  bring the raised ground back (`git revert --no-edit a38b703..a29a203`): clean, 276/276, 672 tests;
  all exit 0. The same three commands also apply cleanly on a squash of the branch onto `main`
  while the branch's objects exist.
- Starter sign-out: `git revert --no-edit b84e2c8 b325300 c062cf8 33d0042 a7fcd1c 77c8daa` applies
  cleanly at d9a9549 (template check green, 651 tests pass) and leaves the first review round's
  12-line `logout()`, which the second round measured with two major defects; back to `main`'s
  order needs a hand edit besides (the page says which).
- History: 270 commits (22 merges), 269 files, +15,405 -708 over `main`. One line naming a review
  tool sits in the content of one run report between two local commits; no commit message of the
  pass names one. 38 commit ids of the pass are cited in the plan and the run reports.

## Not verified
- Firefox, Safari, a real phone, a screen reader, a real window switch: nobody, as before. The page
  carries the plan's section 12 as a check list.
- The pictures of the removable parts are the owner rulings package's renders (device scale 2),
  not repeated today; the Tooltip demo pair after the inversion is today's.

## What went wrong on first try
- A zsh loop that split a job string with `set -- $job` -> zsh does not split an unquoted
  parameter, so four render jobs ran with one argument and wrote nothing -> explicit commands.
- Focusing the first field below the fold to show the scroll padding -> Chromium centres a field
  that lies below the viewport on both sides, so the two pictures matched -> scroll the field into
  the strip the bars cover first, then focus it: the case the padding exists for.
- A full-page phone render of the list recipe on `main` -> the mobile layout viewport widens to the
  content (514 px), so the picture looked like a fit -> clip to the demo and mark the screen's edge.
- FeedbackCapture's live content -> the demo server's random port, which two renders a minute apart
  happened to share in part, so one box escaped the noise mask -> checked by hand: the only
  larger difference is that port number.

## Instructions that were wrong or missing
- dispatcher brief: "53 of 124 committed files" / `screenshots/` holds 122 files (61 demos); 52
  differ from today's render (fixed now: no, the page states both).
- dispatcher brief: the two commits' "messages name a review tool" / the messages do not; the
  content of a run report between them does (fixed now: no, the page says so).
- dispatcher brief and handoff: `ListPage.vue` 329 lines, sign-out "4 to about 35 lines" / 332
  lines (as `TODO.md` says), 4 to 39 lines in three functions (fixed now: no, the page uses the
  measured numbers).

## Questions I had to ask the human
- none

## Pieces that did not fit
- `scripts/screenshots.ts`: it writes into `screenshots/` only, so a before and after outside the
  repository repeats its logic in a driver of its own (second time after the owner rulings package).

## Gate friction
- `just ci` stays without `screenshots.ts --check`; it was run by hand.

## Time sinks
- Four full renders, the presets, the phone fixture and the demo widths (about four minutes per
  side for 61 demos at three widths).

## Suggested improvements (for grooming)
- script: `scripts/screenshots.ts --out=<dir> --twice`, writing a noise mask from two renders, so a
  fair before and after needs no driver of its own (asked twice now).
- script: `scripts/touch-probe.ts` could print the total of targets under 44 px, known included,
  so a before and after reads one number.

## Gates
On the branch with only this report and the journal line changed:
- `bun install --frozen-lockfile`: no changes.
- `just ci`: exit 0 (INDEX.md is current, 216/216 pairs pass, 0 undeclared pairs in 66 style
  sources, ui-lint clean twice, template-check, 671 pass 0 fail in 3.73 s, build).
- `bun scripts/screenshots.ts --check`: exit 0.
- `bun test --randomize scripts ui pages demo/src`, ten runs: 671 pass, 0 fail each, 3.65 to 3.82 s.
- `just touch-probe --all`: exit 0, 61 demos, 0 offenders, 0 smaller than known, 0 stale, 46 known,
  14 exempt.
