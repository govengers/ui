---
date: 19.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 4 h
groomed: no
---

## Task
UX hardening pass, work package WP16 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): the two
owner rulings as droppable commit groups, `01-E` (a pressed state for Button, a colour step only,
D104) and `15-D` (`--ui-surface-raised` for overlays in dark themes, D105), the weighing of an
inverted Tooltip, the open question whether the raised step shows. Branch `task/ux-wp16` from the
integration branch at 1f39a9d; it ran alone.

## Commits and what reverts what
- `c4aec4b` (before both groups): two empty lines after D103 in `docs/design.md`. Git reads changes
  on touching lines as a conflict, so an empty line written by a group itself would not keep D104
  and D105 apart (tried: `git revert` of the first of two decisions appended at the end conflicts).
- `01-E`, `c4aec4b..b8f22a3`: `c68a8d0` the `color-mix()` resolver, `c9e1ee4` the three pressed
  tokens and pairs, `4fe1914` Button and its card, `b8f22a3` D104.
- `15-D`, `b8f22a3..0fac6a6`, in two parts that each revert alone:
  - the raised ground, `b8f22a3..cee50d2`: `7dfc6f0` the token, the preset values and the pairs,
    `9ec8032` the five pieces and their cards, `467c49a` thirteen dark screenshots, `cee50d2` D105;
  - the Tooltip, `cee50d2..0fac6a6`: `0fac6a6` the inverted panel, its pair, card, screenshots and
    D106.
- The journal commit after them (this report, `TODO.md`, the plan's as-built note) is in no group.

Revert proof, on a copy outside the repository (`git clone` of the branch, `bun install
--frozen-lockfile`), each case from the branch head with `git revert --no-edit <range>`, then
`just ci` and `bun scripts/screenshots.ts --check`: results under "Gates".

## Contrast, measured by `just contrast` (token pairs)
Pressed (`01-E`), text on its ground:

| preset, theme | on-accent on accent-active | on-danger on danger-active | ink on surface-3 |
|---|---|---|---|
| neutral light | 7.93 | 7.81 | 13.74 |
| neutral dark | 12.02 | 8.27 | 11.22 |
| paper light | 11.30 | 7.24 | 10.83 |
| paper dark | 10.16 | 5.94 | 8.49 |
| slate light | 9.39 | 7.85 | 13.28 |
| slate dark | 10.03 | 7.94 | 11.29 |

The step past hover (ground on ground): accent 1.04 (paper light) to 1.18, danger 1.11 to 1.21,
surface-3 on surface-2 1.16 to 1.27. Paper light's primary hover is near its ink already, so on a
mouse its press is a small step (`#033f50` to `#073c4b`); on touch, without hover, the step is from
rest (`#04556a`).

Raised ground (`15-D`; in light themes it is `--ui-surface`, the numbers equal the surface pairs):

| preset, theme | ink | ink-2 | muted | placeholder | accent | danger | border-strong | focus | success | warning |
|---|---|---|---|---|---|---|---|---|---|---|
| neutral light | 17.72 | 10.44 | 7.73 | 4.83 | 5.17 | 4.83 | 3.42 | 5.17 | 3.30 | 3.19 |
| neutral dark | 16.27 | 11.49 | 6.63 | 5.30 | 4.62 | 4.51 | 3.57 | 4.62 | 7.45 | 7.91 |
| paper light | 13.89 | 9.06 | 5.30 | 4.66 | 7.88 | 5.55 | 3.53 | 7.88 | 3.11 | 3.01 |
| paper dark | 11.14 | 7.83 | 5.65 | 4.79 | 5.99 | 5.75 | 3.39 | 5.99 | 6.07 | 6.44 |
| slate light | 18.08 | 11.19 | 6.10 | 4.87 | 6.14 | 5.70 | 3.60 | 6.14 | 3.30 | 3.19 |
| slate dark | 14.78 | 10.17 | 5.76 | 4.86 | 6.09 | 7.00 | 3.25 | 6.09 | 7.39 | 7.84 |

Neutral's `#1c1c20` is the lightest grey of its hue that keeps danger text at 4.5 (`#1d1d21`:
4.47). The Tooltip pair, `--ui-surface` on `--ui-ink`: 17.72, 16.97, 13.89, 11.89, 18.08, 15.59 in
the order of the table. 276 of 276 pairs pass.

## Pressed states, by pixels and frames
Playwright's cached Chromium 156.0.8078.4, deviceScaleFactor 2, one-off scripts outside the
repository; fine pointer 1440 by 900, touch 390 by 844 (`isMobile`, `hasTouch`); every preset and
theme. Ground: a pixel in the Button's padding; ink: the pixel of the label that differs most from
it.
- Button demo, mouse pressed (before: the hover look): neutral light primary `#ffffff` on `#1c46bc`
  7.92, secondary and ghost `#18181b` on `#e2e2e4` 13.69, danger on `#a11b1c` 7.81; neutral dark
  12.02, 11.20, 11.20, 8.29; paper light 11.28, 10.79, 10.79, 7.23; paper dark 10.18, 8.52, 8.52,
  5.95; slate light 9.42, 13.32, 13.32, 7.87; slate dark 10.03, 11.23, 11.23, 7.95. The grounds
  equal the token values.
- First frame: the pressed colour is final 8 to 14 ms after the press (one frame); release eases
  back over 120 ms to hover. The first build kept the fade: the top bar's ghost showed `--ui-ink` on
  a ground still transparent over the chrome for a frame (1.00:1 neutral light), so the press drops
  its transition.
- Nothing moves: the Button's and the label's boxes were identical in every frame of press and
  release, all 24 cases.
- Top bar ghost "Search" (AppShell demo), touch, a finger held still (a synthesized 480 ms tap; the
  browser shows the press after about 165 to 180 ms): ink on `--ui-surface-3` neutral light 13.69,
  dark 11.20, paper light 10.79, dark 8.52, slate light 13.32, dark 11.23 (before: no change at
  all, `--ui-on-chrome` on the chrome). The pressed rule's `color` beats the ghost's
  `var(--ui-button-ghost-ink, ...)` by specificity (0,5,0 over 0,3,0), and the shell sets only the
  property, so no hover rule is needed before it. Mouse, hover then press: the same numbers.
- Touch release: back to rest in all six (after 1 s, pixels equal to rest). The ground fades out
  while the ink returns at once: in light themes two frames read 1.19 to 1.29 and 2.10 to 2.40:1
  (computed from the frames, the chrome under the fading ground); dark themes stay above 7.9. The
  same crossing exists on a mouse hover since D102 (first frame 1.00 to 1.76): a `TODO.md` line for
  AppShell, outside this package's files.
- A quick tap: pressed from 30 to 163 ms (Chromium keeps `:active` about 150 ms), then rest. A drag
  of 100 px from the Button (dispatched touch events): never `:active`, the page scrolls, rest after
  the lift. Chromium's touch emulation shows no press for dispatched touch events held still, only
  for a synthesized tap, so a press shown and then slid off was not produced.
- Chromium's own tap highlight (Android) paints over the press: top bar pressed 3.42 to 4.80:1 with
  it (before WP16 3.29 to 5.71:1, the highlight over the chrome); the measurements above disable it
  with `-webkit-tap-highlight-color: transparent` in the probe. A `TODO.md` line (owner).
- Keyboard: Space held on a focused secondary Button shows the press (13.69), its release the rest;
  Enter held shows nothing (Chromium clicks on its key down and sets no `:active`).
- Loading primary, loading secondary, loading ghost icon-only, disabled: a press changes no pixel
  (equal to the base). A link Button with `aria-disabled` (the attribute a held Button and a
  disabled link carry): no press. Router link and anchor ghost: pressed 13.69 (released off the
  link, no navigation).
- Icon-only "Settings" with its tooltip shown: a press hides the tooltip and shows the press
  (13.69). A press on the tooltip panel removes the panel and leaves the Button at rest.
- Forced colours (emulated, neutral light): a press shows no colour change, the label stays
  system-coloured (21:1).

## The raised ground, by pixels
A scratch fixture outside the repository: a Card with a Popover open over it (title, muted text, a
link, an Input, Cancel, a ghost "Copy link", Invite), a Menu with its second item hovered, and a
hovered Tooltip; base 1f39a9d and the branch, 1000 by 800, deviceScaleFactor 2.
- Panel on card, dark: neutral 1.043:1 (`#18181b` to `#1c1c20`, 4, 4 and 5 of 255), paper 1.068,
  slate 1.054; CIEDE2000 1.44, 1.57, 2.24. Light themes: equal (1.00), as designed.
- A secondary Button in a dark overlay sits darker than its panel: at rest 1.043, 1.068, 1.054
  below it; hovered 1.14, 1.056, 1.051 above; pressed 1.453, 1.307, 1.317 above. An Input the same
  as the Button at rest; a ghost Button is the panel. Its `--ui-border-strong` edge marks it (3.25
  to 3.57 on the panel).
- A menu item's hover on the panel: neutral 1.14 (was 1.19), paper 1.056 (was 1.127), slate 1.051
  (was 1.108); CIEDE2000 3.53 (was 4.72), 1.28 (was 2.85), 2.10 (was 4.30). In paper the hover is
  near the threshold of seeing.
- Judgement, looking at the pictures side by side and alone: neutral, the step does not show; I see
  it only side by side when I know where to look, and the border carries the panel's edge as
  before. Paper, the same: faint side by side, nothing at a glance; it costs half the menu hover.
  Slate, a faint blue lift side by side, still nothing at a glance; it halves the menu hover too.
  Recommendation: drop the raised ground (`git revert --no-edit b8f22a3..cee50d2`), keep `01-E`
  and the Tooltip. Pictures: `15-D-PopoverOverCard-<preset>-dark-{before,after,compare}.png` and
  `15-D-MenuOverCard-...` in the owner folder the dispatcher named.

## Tooltip: inverted, not raised (D106)
Weighed as the review asked. The raised ground equals `--ui-surface` in light themes and is 1.04 to
1.07:1 off it in dark ones, so on the Card, Dialog or Table a tooltip mostly sits on it would still
read as part of what it covers: measured before, panel on card 1.00:1 in all six, its edge against
its surroundings 1.05 (slate light) to 1.71:1. Inverted (`--ui-ink` ground, `--ui-surface` text) it
stands 11.89 to 18.08:1 off the card, its edge 11.9 to 17.1:1; a tooltip holds one plain sentence
(D90), no accent, danger or field, so one declared pair covers it. The border is transparent, so
forced colours still draw it: edge 21:1 under emulated forced colours before and after. Cost: a
look change in light themes too, and a bright panel in dark ones. Built in its own commit with its
own decision, so the owner can keep it while dropping the raised ground. Not built: the raised
Tooltip.

## Pieces whose screenshots moved
Both groups were rendered against a fresh render of the base on the same machine and browser, and
the base twice to tell noise from change.
- `01-E`: none. 114 pictures equal; the rest differ only in live text (FeedbackCapture,
  WorkflowStatus, JobProgress, Dashboard) or by 1 to 2 of 255 at a few pixels (Card, Markdown,
  Pagination, AgentCursor), which also differ between two renders of the base.
- Raised ground: the dark pictures of ColumnsPicker, CommandPalette, DetailDrawer, Dialog,
  FacetFilter, FeedbackCapture, Menu, NotificationInbox, Popover, RangePicker, Sheet, Toast,
  WhatsNew, by at most 5 of 255 per channel.
- Tooltip: `Tooltip.light.png`, `Tooltip.dark.png`.

## Deviations from the plan (each in the plan with the commit that made it)
- Two empty lines after D103, written before the groups (the plan said each decision after a blank
  line, which conflicts on revert).
- The press shows in its first frame (`transition: none` while pressed).
- One more pair on the raised ground, `--ui-placeholder`: the palette's search field has no ground
  of its own.
- The Tooltip inverts instead of taking the raised ground, as decision D106 in its own commit.
- Tests read the pieces' style text (Button's pressed rules, the five panels' ground, the Tooltip's
  pair) besides the resolver's known mixes; each fails when its change is reverted.

## What went wrong on first try
- Pressing on touch with dispatched touch events held still -> `:active` never showed -> a
  synthesized tap (`Input.synthesizeTapGesture` with a duration) runs the browser's show-press.
- A 700 ms synthesized tap -> the long press selected the label and the selection's colour was read
  as the press -> 480 ms.
- The first touch numbers carried Chromium's tap highlight -> measured with and without it.
- Comparing the renders with the committed screenshots -> 50 reported as moved -> 51 committed
  pictures are older than a render of the base (a `TODO.md` line); compared two fresh renders.
- A color-mix test expecting 51 from 80 percent -> 50.999... in floating point -> 75 and 25 percent.

## Instructions that were wrong or missing
- plan WP16: "decisions separated by a blank line" / a blank line written by either group conflicts
  on revert; two empty lines before both groups (fixed now: yes, plan and `c4aec4b`).
- plan 6.1 and WP16 item 2: the Tooltip among the raised pieces / decided otherwise (fixed now: yes,
  D106).

## Questions I had to ask the human
- none

## Pieces that did not fit
- AppShell: its top-bar ghost Buttons fade their ground under ink that flips at once (TODO line).
- Spotlight: an overlay outside D105's list (TODO line).

## Gate friction
- `just ci` stays without `screenshots.ts --check`; it was run by hand.

## Time sinks
- Getting Chromium to show a touch press, and the screenshot baseline (see above).

## Suggested improvements (for grooming)
- script: a `--out=<dir>` for `scripts/screenshots.ts`, so a before and after renders outside
  `screenshots/` without restoring the tracked files.
- workbook `maintain-collection` stage 04: a change meant to be droppable keeps its edits off
  touching lines of shared files, and its proof is `git revert` on a copy.

## Gates
On the branch at 864c3ef (the journal commit; this section follows it):
- `bun install --frozen-lockfile`: no changes. `just index`: INDEX.md unchanged (no front matter
  changed), nothing to commit.
- `just ci`: exit 0 (INDEX.md is current, 276/276 pairs pass, 0 undeclared pairs in 66 style
  sources, ui-lint clean twice, template-check, 669 pass 0 fail in 3.77 s, build).
- `bun scripts/screenshots.ts --check`: "every demo has its light and dark screenshot", exit 0.
- `bun test --randomize scripts ui pages demo/src`, ten runs: 669 pass, 0 fail each, 3.68 to
  4.09 s (seeds 171841046, 1471350856, 496301063, 2798839175, 2620968906, 3550337692, 3431823104,
  2692829902, 974500751, 3331686607).
- `just touch-probe --all`: exit 0, 61 demos, 2 densities: 0 offenders, 0 smaller than known, 0
  stale entries, 46 known, 14 exempt.

Revert proof, each case from 864c3ef on a copy, then `just index`, `just ci` and
`bun scripts/screenshots.ts --check`:

| reverted | range | revert | INDEX | `just ci` | pairs | tests | `--check` |
|---|---|---|---|---|---|---|---|
| `15-D` | `b8f22a3..0fac6a6` | clean, 5 commits | unchanged | exit 0 | 210/210 | 667 pass | exit 0 |
| `01-E` | `c4aec4b..b8f22a3` | clean, 4 commits | unchanged | exit 0 | 258/258 | 667 pass | exit 0 |
| both | `c4aec4b..0fac6a6` | clean, 9 commits | unchanged | exit 0 | 192/192 | 665 pass | exit 0 |
| the raised ground only | `b8f22a3..cee50d2` | clean, 4 commits | unchanged | exit 0 | 216/216 | 668 pass | exit 0 |
| the Tooltip only | `cee50d2..0fac6a6` | clean, 1 commit | unchanged | exit 0 | 270/270 | 668 pass | exit 0 |

With both reverted the tree equals `c4aec4b`: the base and the two empty lines after D103.

## Closing round (19.11.2026)
The review approved with 2 DESIGN and 9 MINOR findings. Ruled by the dispatcher: the raised overlay
ground is dropped (both the review and this report judged the step invisible, and it cost the menu
hover), the inverted Tooltip stays as its own droppable commit. No review follows; the measurements
below are the proof. Browser runs as above, cached Chromium 156.0.8078.4, deviceScaleFactor 2.

Commits of the round, by part:
- Raised ground dropped by revert commits, not a rewrite: `8804461` (D105), `43784c0` (the thirteen
  dark screenshots), `e14794b` (the five pieces and cards), `a29a203` (token, preset values, pairs).
  D105 stays unused, D106 keeps its number. To bring the raised ground back:
  `git revert --no-edit a38b703..a29a203` (it reverts the four reverts, newest first; proved below).
- No part: `030a137` AppShell's top-bar ghost Buttons change their ground without a fade, and
  `5ea3d8d`, which moves its test away from the Tooltip's (the first proof run found that dropping
  the Tooltip conflicted on the touching test lines). They stay whatever is dropped: the rule also
  ends the mouse hover crossing that exists since D102.
- Pressed state (`01-E`): `6e26e9e` a `color-mix()` percentage over 100 refused, `c686df6` tests for
  the pressed rules' order, media placement and step, `7b63e1a` D104's wording, the pressed border's
  exemption, the press on AppShell's card.
- Tooltip (D106): `54ab6fd` the border in the page's surface colour, D106 and the card without the
  dropped ground, the two Tooltip screenshots.

Revert commands for the owner, from the branch head:
- drop the pressed state: `git revert --no-edit 030a137..7b63e1a && git revert --no-edit c4aec4b..b8f22a3`
- drop the Tooltip inversion: `git revert --no-edit 7b63e1a..54ab6fd && git revert --no-edit cee50d2..0fac6a6`
- bring the raised ground back: `git revert --no-edit a38b703..a29a203`

Per finding:
1. Raised ground (DESIGN): dropped, as above. The owner's pictures stay in the summary folder.
2. Tooltip decided in the run (DESIGN): kept as ruled; it goes to the owner's list.
3. Tooltip on the top bar in light themes: the border is `--ui-surface`, as tried. Measured on the
   panel's top side, by pixels, over the bar (4 of the panel's 28 px lie on it), over a card (scratch
   fixture) and on the page (Tooltip demo):

   | preset, theme | bar: edge before | bar: edge after | card: edge, panel | page: edge, panel |
   |---|---|---|---|---|
   | neutral light | 1.00 | 17.72 | 1.03, 17.12 | 1.08, 16.39 |
   | neutral dark | 16.97 (panel) | 1.00, panel 16.97 | 1.00, 16.97 | 1.12, 19.06 |
   | paper light | 1.74 | 8.00 | 1.03, 13.53 | 1.17, 11.87 |
   | paper dark | 6.82 (panel) | 1.74, panel 6.82 | 1.00, 11.90 | 1.13, 13.43 |
   | slate light | 1.08 | 19.56 | 1.13, 16.01 | 1.24, 14.62 |
   | slate dark | 17.17 (panel) | 1.10, panel 17.17 | 1.01, 15.75 | 1.10, 17.17 |

   In dark themes the panel itself carries the edge (6.82 to 19.06); in light ones the border does on
   the bar and disappears on a card or the page. Forced colours (neutral, both themes): the border
   21:1 on the bar, a card and the page, as before. The two Tooltip screenshots moved (a 1 px ring,
   620 and 641 px) and are in the commit. Test: the Tooltip test pins the border; with `transparent`
   back it fails.
4. Touch release on a top-bar ghost Button: one AppShell rule, `transition: none` on ghost Buttons in
   `.ui-app-shell__actions`, as tried, but not for one inside a popover or dialog placed in the slot
   (`:where(:not([popover] *, dialog *))`): that one sits on a surface, its ink does not cross, and
   it keeps its 120 ms fade (measured: "Sign out" 0.12 s, Search 0 s). Frames per preset and theme,
   "Search", before (a38b703) and after, counting frames under 3:1 and the lowest ratio:

   | preset, theme | mouse hover in | mouse hover out | touch hold and release | quick tap |
   |---|---|---|---|---|
   | neutral light | 2 at 1.00 -> 0 (16.12) | 3 at 1.05 -> 0 (16.97) | 2 at 1.24 -> 0 (13.74) | 2 at 1.24 -> 0 (13.74) |
   | paper light | 1 at 1.76 -> 0 (7.88) | 3 at 1.11 -> 0 (7.88) | 2 at 1.28 -> 0 (7.88) | 2 at 1.28 -> 0 (7.88) |
   | slate light | 2 at 1.07 -> 0 (15.59) | 3 at 1.02 -> 0 (17.06) | 2 at 1.20 -> 0 (13.28) | 2 at 1.20 -> 0 (13.28) |
   | dark themes | 0 before and after (lowest 6.72 before, 7.88 after) | 0 | 0 | 0 |

   Press and release on a mouse: 0 frames under 3:1 before and after. The AppShell card says it, the
   card's top-bar line names the press (in the pressed state's commit, so it leaves with it), the
   `TODO.md` line is removed. Test: pins the rule; without it the test fails.
5. Pieces painting the overlay's ground themselves (FacetCascade's search band): moot after the drop,
   not applied. If the raised ground comes back, `FacetCascade.vue`'s sticky search band needs
   `--ui-surface-raised` too (the review measured 1.043 to 1.068:1 otherwise).
6. Leftovers: D106 and the Tooltip card measure without D105 (panel 1.00:1 against a card before);
   `TODO.md` loses the Spotlight line (D105's list is gone) and the AppShell line (fixed); the plan
   says D105 is unused (6.5, the as-built note, ruling 8, section 12, open question 1); the journal
   line says what was dropped. `grep surface-raised` finds nothing under `ui/`, `scripts/`,
   `docs/design.md` or `TODO.md`; the plan and this report keep it as history.
7. Resolver: a percentage over 100 on either colour throws ("a percentage over 100% is invalid");
   two test lines (101 % on the first colour, 130 % on the second); with the check removed the test
   fails.
8. Tests: three behaviours pinned in two tests, written without the tried patch's `measure()` loop:
   the pressed rules come after the `(hover: hover)` block, no `:active` rule sits under any `@media`
   (blocks found by counting braces), and each pressed ground is more than 1.03:1 past its hover
   ground in every preset (globbed) and theme. Single reverts on a copy: pressed rules moved before
   hover, wrapped in `(hover: hover)`, `--ui-accent-active` equal to hover, `--ui-danger-active` at 99
   %, `--ui-surface-3` equal to `--ui-surface-2`: each fails exactly its test.
9. Pressed border under 3:1: an `exemptPairs` entry, `--ui-border-strong` on `--ui-surface-3`, with
   the reason (2.65, 2.46, 2.75, 2.59, 2.64, 2.48:1 on the pressed ground; 3.09 to 3.21 on the hover
   ground; 3:1 kept against the page outside; a press lasts as long as the finger), and the sentence
   in D104.
10. D104 says 15 and 8 percent of the ink, and that the smallest step past hover is paper light's
    primary (1.04:1, its hover colour near the ink already; from rest it is clear).
11. Stale screenshots: the `TODO.md` line now carries the review's numbers (53 of 124, 7 with another
    height, `Icon.light.png` from 02.11.2026 with 57 of 71 icons), marked for the owner; no re-render.

Deviations from the tried patch: the AppShell rule leaves ghost Buttons in a popover or dialog of the
slot alone (above); the FacetCascade line is not applied (the ground it moved to is dropped); the tests
are written differently (above); the resolver message and test lines differ in wording only.

Screenshots after the round: a full render of the tree against the fresh render of the base differs
only in `Tooltip.light.png` and `Tooltip.dark.png` (committed with `54ab6fd`), live text
(FeedbackCapture, WorkflowStatus, NotificationInbox) and 1 to 2 of 255 at a few pixels (AgentCursor,
AgentDock, Button, Card, Markdown, Pagination); the thirteen dark pictures are back to their committed
state with the revert. The committed files WP16 touched equal the fresh render.

Revert proof of the round, on a copy of the branch at `5ea3d8d` (the same tree as the head without
this report and `TODO.md`), each case with the owner's command, then `just index`, `just ci` and
`bun scripts/screenshots.ts --check`:

| case | revert | INDEX | `just ci` | pairs | tests | `--check` |
|---|---|---|---|---|---|---|
| drop the Tooltip inversion | clean, 2 commits | unchanged | exit 0 | 210/210 | 670 pass | exit 0 |
| drop the pressed state | clean, 7 commits | unchanged | exit 0 | 198/198 | 667 pass | exit 0 |
| drop both | clean, 9 commits | unchanged | exit 0 | 192/192 | 666 pass | exit 0 |
| bring the raised ground back | clean, 4 commits | unchanged | exit 0 | 276/276 | 672 pass | exit 0 |

After dropping the pressed state no file under `ui/`, `scripts/` or `docs/design.md` names
`--ui-surface-3`, `--ui-accent-active` or D104; after dropping the Tooltip none names D106. The first
run of this proof conflicted when dropping the Tooltip: AppShell's test touched the Tooltip's test
lines; `5ea3d8d` moved it. The `TODO.md` line on the tap highlight now states both cases, so it holds
whichever part is dropped.

Gates of the round (on the head, with this report's commit):
- `bun install --frozen-lockfile`: no changes. `just index`: INDEX.md unchanged.
- `just ci`: exit 0 (INDEX.md is current, 216/216 pairs pass, 0 undeclared pairs in 66 style
  sources, ui-lint clean twice, template-check, 671 pass 0 fail in 3.71 s, build).
- `bun scripts/screenshots.ts --check`: "every demo has its light and dark screenshot", exit 0.
- `bun test --randomize scripts ui pages demo/src`, ten runs: 671 pass, 0 fail each, 3.67 to
  3.83 s (seeds 4260371147, 985395876, 2418197284, 2843401152, 1197043236, 1160174288, 3224146515,
  3518355972, 1490231738, 559385387).
- `just touch-probe --all`: exit 0, 61 demos, 2 densities: 0 offenders, 0 smaller than known, 0
  stale entries, 46 known, 14 exempt.

Not verified in the round: Safari, Firefox, a real phone (the Tooltip's edge and the top bar without a
fade were measured in Chromium only); a show-press followed by a slide off the Button; the Tooltip
over every Button colour (the review measured a primary: 1.69 to 3.63 before, not repeated).
