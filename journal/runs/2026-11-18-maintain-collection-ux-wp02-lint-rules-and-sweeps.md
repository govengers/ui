---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 70 min
groomed: no
---

## Task
UX hardening pass, work package WP02 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): the
five lint rules `UL-004`, `UL-005`, `UL-006`, `UL-007`, `UL-013` with their tests, the hover
sweep, viewport units in the shell and the inbox, the Tabs coarse override, the starter's
`DESIGN.md` rule 3, D89.

## Measurements
- The five rules on the unchanged tree: 29 findings, 25 `UL-007` in 19 files (as plan section 4
  counted) and 4 `UL-006` (AppShell three, NotificationInbox one); `UL-004`, `UL-005` and
  `UL-013` found nothing. After the sweep: `bun scripts/ui-lint.ts ui pages` clean,
  `just template-check` clean.
- Screenshots of the 17 pieces touched (Button, Card, Input, Menu, Table, Popover, Board,
  ColumnsPicker, DevLogin, FacetFilter, FileUpload, RangePicker, Stepper, Changelog, AppShell,
  Tabs, NotificationInbox): rendered twice on the base and once on the branch, same machine and
  browser. Two base renders differ only in `NotificationInbox.dark.png` (live data); all 34
  branch files are byte-identical to the first base render. Left modified and unstaged
  (section 7.1).
- One-off Playwright run (not committed), base tree and branch, 1280 by 900: computed background,
  colour, border, shadow, text decoration, transform and outline offset of 27 targets (every
  swept selector, the Popover demo's listbox opened) at rest, on hover and on `:focus-visible`.
  Identical on both trees.
- Touch, 390 by 844 with `hasTouch` and `isMobile`: `(hover: hover)` false, `(pointer: coarse)`
  true. A tap on a secondary and a ghost Button leaves `:hover` matching in both trees; the base
  paints the hover background (`rgb(244, 244, 245)`) after the tap, the branch keeps the rest
  background.
- `just touch-probe --only=Tabs` without the coarse override: 0 offenders. `just touch-probe
  --all`: 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt (as after WP01).

## What went wrong on first try
- The first probe run read computed styles right after `hover()` and `focus()` -> the readings
  lagged one state behind (Button and Card transitions run even under emulated reduced motion)
  -> a 400 ms wait after each state change.
- `pgrep -fl vite` to check for a left-over demo server -> matched unrelated processes whose
  environment names a `vite-plus` path -> `pgrep -fl 'demo/vite.config'` and a listen-port check.

## Instructions that were wrong or missing
- `scripts/ui-lint.ts` header: "templates/project/ui-lint.ts is a copy of this file" / there is no
  such file, `scripts/template-check.ts` copies `scripts/ui-lint.ts` (fixed now: yes, as plan 6.2
  asked).
- `scripts/ui-lint.ts`: a finding in a component `.css` file named the line after the real one,
  and UL-012 counted its line from the template's first line / both name the file's line now
  (fixed now: yes; the plan's "As built" note records it).
- `ui/Button/Button.md` Gotchas: "`ui-lint` does not catch this yet" about an icon-only Button
  without `label` / UL-013 catches it now (fixed now: no; plan 7.1 gives Button.md to WP04, whose
  step names this line).
- `pages/LoginPage/LoginPage.vue:130`: "ui-lint reads the template up to the first nested
  </template>" / it reads the root template to its last closing tag at column 0 (fixed now: no,
  the file is not in WP02's list; `TODO.md`).

## Questions I had to ask the human
- none

## Pieces that did not fit
- none

## Gate friction
- Carried over from WP01: UL-002 failed on "16px" in a CSS comment without saying so. The style
  rules read no comments now (D89); a test pins it.
- `just ci` does not run the screenshots or the touch probe; both ran by hand.

## Time sinks
- The browser proof that a split selector kept its focus and selected states: a pixel compare of
  resting screenshots cannot see hover or focus, so it took a second, computed-style probe on a
  copy of the base tree (`git archive`, `node_modules` linked).

## Suggested improvements (for grooming)
- `CLAUDE.md` rule 3 and `templates/project/CLAUDE.md` rule 3 list what `ui-lint` fails; neither
  names the rules of D89. Both files are outside WP02's list.
- script: a `--states` mode for `screenshots.ts` or a small committed probe that records hover and
  focus-visible styles per demo, so a style refactor proves "nothing moved" without a one-off
  script.
- workbook `maintain-collection` stage 04: when a change moves CSS rules without meaning to change
  the look, compare against a base render on the same machine (byte compare first) before looking
  at the pictures.

## Review round 1 (18.11.2026)
The review approved the package with five MINOR findings, all in `scripts/ui-lint.ts`; all fixed
in the run, because no later package may touch the file (plan 7.1).
- UL-005 read one line at a time and only `font-size`: a value on the next line, a `clamp()` over
  several lines and `font: 600 1rem/1.2 ...` passed. It reads per declaration over the whole
  block now and covers the `font` shorthand; `font: inherit` stays clean.
- UL-007 took any `@media` holding `hover: hover` as the guard, so `not (hover: hover)` and
  `(hover: hover), (pointer: coarse)` passed. Every comma or `or` branch must hold the feature
  now, and none may be negated.
- UL-013 knew only `<template #icon>` closed by the first `</template>`: a nested
  `<template v-if>` in the slot or `v-slot:icon` passed, `label=` was found inside another
  attribute's value and a commented-out Button was reported. The slot is read to its balanced
  closing tag in both forms, `label` is looked for outside quoted values, HTML comments are
  blanked before the template rules run.
- The brace reader did not know strings: `content: "{"` inside the guard let a later bare
  `:hover` pass. Comments and quoted strings are blanked in one left-to-right pass now, which also
  stops a `"/*"` in a string from hiding the code after it.
- Four claims of the plan's "As built" note had no test (the `.css` line, the UL-012 line, the
  comment beside an icon, the self-closing skip). Each has one now, the `.css` line through
  `lintDirectories` on a temporary directory; the self-closing skip was dead code and is gone.
  Proof: each of ten fixes reverted on a copy of the script fails at least one test.
- D89 says "no comments and no quoted strings" instead of "no CSS comments"; the plan's 6.5 row
  and "As built" note say the same.

What went wrong on first try in the round:
- none

Instructions that were wrong or missing:
- plan 6.2: UL-005 named only `font-size`, UL-007 any query holding `hover: hover` / the
  shorthand carries a size too, and a negated or comma query matches a touch screen (fixed now:
  yes, the plan's "As built" note records it).

Suggested improvements (for grooming):
- workbook `maintain-collection` stage 02: a parser written with regular expressions gets a test
  for every form the language allows around the matched token (a line break inside a value, a
  string holding the delimiter, the other spelling of the same thing), not only the forms the
  tree holds today.
