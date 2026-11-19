---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 70 min
groomed: no
---

## Task
UX hardening pass, work package WP07 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): the
not-allowed cursor on a disabled Input, an icon before the Field error, `:user-invalid` beside
the invalid rules of Input, Select, Textarea and Checkbox, the native attributes on the Input
card, the target wording on the Checkbox and Switch cards, the new `RadioGroup`, the theme as a
RadioGroup and a Delete that refuses a wrong name in `SettingsPage`, the pattern lines (D95).

## Place (stage 01)
```
kind: piece   target: ui/RadioGroup/   extends: none (Field group, Checkbox's drawing)
decisions: D9, D41, D42, D44, D49, D69   new decision needed: yes: D95, handed over
```

## Measurements
- Mounted tests: `ui/RadioGroup/RadioGroup.mounted.test.ts` 4 cases (a click emits the option's
  own value and the checked radio follows `modelValue`; one shared name, given or generated;
  disabled option and disabled group; label alone as the name, description wired, the Field
  group's error marks every radio `aria-invalid`). `pages/SettingsPage/SettingsPage.mounted.test.ts`
  3 cases (a wrong name keeps the dialog open, shows `settings.danger.mismatch`, focuses the
  name, toasts nothing, typing clears the error; closing clears refusal and name; the right name
  closes the dialog and toasts "Workspace deleted"). Removing the focus call or the clearing
  watcher from `SettingsPage.vue` fails a case each. `just ci`: 423 tests in 1.4 s.
- Keyboard, Chromium, RadioGroup demo (one-off Playwright run, not committed): focus on the
  first theme radio, ArrowDown checks the next and the readout follows (`auto`, `light`, `dark`,
  wraps to `auto`); ArrowUp, ArrowRight and ArrowLeft likewise; Tab leaves the group and lands on
  the checked radio of the next group (`delivery: 3`); ArrowDown there skips the disabled option
  and wraps to `1`, which stays a number; Shift+Tab returns to the checked theme radio. A group
  with nothing checked takes Tab on its first radio.
- SettingsPage in Chromium: the Profile tab shows three theme radios in a fieldset with the legend
  "Theme"; a click on Dark sets `data-theme="dark"`, ArrowUp moves to light, then to auto (the
  attribute goes). In the danger dialog Delete is enabled; a wrong name keeps the dialog open,
  shows the error with its icon and puts the focus in `workspaceName`; Enter on Delete does the
  same; typing removes the error; the right name closes the dialog and toasts.
- `:user-invalid`, Chromium, reduced motion: the required email of the Field demo and the
  required Textarea keep `--ui-border-strong` (138, 138, 147) on a fresh page and after a focus
  and blur without a change, and turn `--ui-danger` (220, 38, 38) after a change and blur. A
  disabled Input reports `cursor: not-allowed` on the control and on the wrapper.
- `just touch-probe --only=RadioGroup`: 0 offenders in both densities. `just touch-probe --all`:
  60 demos, 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt (as after WP02, one
  demo more).
- Screenshots, rendered here and on a copy of the base commit 7ffdd4c with the same browser:
  Input, Checkbox and SettingsPage are byte-identical to the base render, Field differs (the
  icon). Field, Select and Textarea show the error icon, RadioGroup is new; all looked at in both
  themes and left unstaged (plan 7.1). The SettingsPage demo shows General and Danger zone only,
  so the theme radios and the open dialog are in no screenshot; both were looked at in a one-off
  capture.

## What went wrong on first try
- A one-off `bun file.ts` that touched `document` -> `ReferenceError: document is not defined`
  (the jsdom preload runs for `bun test` only) -> a throwaway `*.test.ts`.
- `HTMLDialogElement.showModal` in the harness -> `TypeError: d.showModal is not a function`
  (jsdom has neither `showModal()` nor `close()`) -> shimmed in `SettingsPage.mounted.test.ts`
  for that file only and restored after it (plan 7.1).
- The first `:user-invalid` reading right after a blur showed the rest border -> Input animates
  `border-color` -> read again under emulated reduced motion.

## Instructions that were wrong or missing
- plan WP07 step 7: the German error text "Den Namen des Workspace genau eingeben" / the page says
  "Arbeitsbereich" everywhere, so `settings.danger.mismatch` is "Den Namen des Arbeitsbereichs
  genau eingeben." Both languages end with a full stop like the page's other sentences (fixed
  now: yes, in the messages; plan text unchanged, see Handover).
- plan WP07 step 2: `<Icon name="alert-circle" aria-hidden="true" />` / an Icon without `label`
  renders `aria-hidden="true"` already; the attribute is left out, `size="sm"` gives the 1em
  (fixed now: n/a).
- plan WP07 step 3: `.ui-checkbox__control:user-invalid` / no native constraint ever reaches the
  checkbox input (Field's `required` is skipped on purpose, attributes land on the `<label>`), so
  the rule can never match. Built as planned, removed in review round 1 (fixed now: yes; the
  wiring stays a Handover todo).
- `ui/Select/Select.md` Agent: "`data-action` and other attributes land on the wrapper" / Select
  binds them to the `<select>` (`inheritAttrs: false`), only `class` and `style` go to the wrapper
  (fixed now: no, the card is not in WP07's file list; Handover todo).
- `ui/Field/Field.md` `group` row named "radios" while no radio piece existed (fixed now: yes,
  it names RadioGroup).
- `ui/Input/Input.md` Gotchas had a blank line inside the list (fixed now: yes).

## Questions I had to ask the human
- none

## Pieces that did not fit
- RadioGroup inside a Field: the fieldset carries the Field's hint and error in
  `aria-describedby`, so the radios carry only their own description, unlike Checkbox, which
  repeats the Field's on every box.
- SettingsPage demo: no section shows the Profile tab, so the new theme radios get neither a
  screenshot nor the touch probe.

## Gate friction
- none failed. `just ci` does not run the screenshots, the touch probe or a keyboard check; all
  three ran by hand.

## Time sinks
- One change per commit where two changes share a file (Input.vue, SettingsPage.vue and its
  card): without interactive staging the intermediate file states were built by a script from
  the base and the final versions.

## Suggested improvements (for grooming)
- script: `scripts/test/setup.ts` gains `showModal()` and `close()` on `HTMLDialogElement`; every
  page test that opens a Dialog needs them.
- demo: `SettingsPage.demo.vue` gains a third section pinned to `tab="profile"`.
- workbook `maintain-collection` stage 02: a style rule on a native state (`:user-invalid`,
  `:required`) only matches when the attribute reaches the element; check `inheritAttrs` and the
  Field wiring before adding one.
- knowledge: `applies` of `hicks-law`, `fittss-law` and `jakobs-law` could name RadioGroup.

## Review round 1 (18.11.2026)
The review approved the package with one DESIGN and four MINOR findings; all five are fixed in
the run, because no other package owns these files.
- DESIGN, SettingsPage: Enter in the typed name did nothing, because the dialog holds no form; a
  keyboard user had to Tab over Cancel to Delete. The run report's "click and Enter" meant Enter
  on the focused Delete. Enter in the name now runs `requestDelete`, except while an input method
  composes (that Enter commits the text). Mounted case for a wrong and a right name and a
  composing Enter; one card line; measured in Chrome with real key presses.
- MINOR, RadioGroup: the Field's `required` never reached the radios (only the hidden asterisk).
  Every radio carries it now, and `:user-invalid` paints the circles like the other controls.
  Mounted case: required on every radio, `valueMissing` while none is chosen, gone once one is,
  attribute gone when the Field drops `required`. The card keeps "always a default selection" and
  says that a default makes a required group always valid.
- MINOR, Checkbox: the `:user-invalid` selector could never match; removed, `Checkbox.vue` is back
  at the base. D95 and the journal line in the Handover no longer name Checkbox.
- MINOR, RadioGroup: a parent that kept its value left the clicked radio checked (Vue patches
  `checked` only when `modelValue` changes). After the emit and the parent's turn, every radio is
  set from `modelValue` again. Checkbox has the same one-way binding on the base (a todo now);
  Switch has no native state, its `aria-checked` follows `modelValue`. Mounted case with a parent
  that refuses; one card line.
- MINOR, SettingsPage test: the close test never typed a name, so it passed without the reset.
  It types one now.
- Each new or changed case fails when its fix is reverted on the file (five reverts checked: the
  refused-change reset, `required`, `typed.value = ''` in `closed()`, the keydown listener and the
  composing guard).
- Gates after the round: `just index`, `just ci` (426 tests; 1.65 to 2.04 s over four runs on a
  machine with a load average of 12 from parallel runs), `just touch-probe --all` (60 demos, 0
  offenders, 48 known, 14 exempt). RadioGroup, Checkbox and SettingsPage render byte-identical to
  their renders before the round.

What went wrong on first try in the round:
- none

Instructions that were wrong or missing:
- plan WP07 step 6: "invalid state from the Field injection as Checkbox does" left the Field's
  `required` out; Field's card promises `required` on the control (fixed now: yes).

## Handover
decision: D95, changed: **Native validity shows once the user has changed a field; radios are RadioGroup.** Input, Select, Textarea and RadioGroup paint the invalid border on `:user-invalid` beside the `error` from the server: after the user changed a field and left it, or tried to submit, never on a fresh form or after a bare focus and blur (measured in Chromium). The Field's error starts with an alert icon, so it is not told by colour alone (WCAG 2.2 SC 1.4.1). `ui/RadioGroup` is the one radio piece: native inputs under one name inside `Field group`, which passes its `required` to every radio, a default selection always; the arrow keys and Tab are the browser's (APG, Radio Group pattern). A typed-name confirm keeps its Delete enabled, takes Enter in the name as the click, and refuses with a field error and the focus back in the field.
journal: 18.11.2026 maintain-collection ux-wp07-controls-radiogroup-settingspage - done after one review round: RadioGroup with the Field's required and a DOM that follows modelValue (6 mounted tests, arrow keys and Tab checked in Chromium, touch probe clean in both densities), Field error icon, :user-invalid on Input, Select, Textarea and RadioGroup, not-allowed cursor on a disabled Input, SettingsPage theme as RadioGroup and a Delete that refuses a wrong name by click and by Enter in the name (4 mounted tests), Input, Checkbox and Switch cards, two patterns (D95); run report journal/runs/2026-11-18-maintain-collection-ux-wp07-controls-radiogroup-settingspage.md
readme: RadioGroup (primitive)
todo:
- `ui/Select/Select.md` Agent says attributes land on the wrapper; they land on the `<select>`, only `class` and `style` on the wrapper.
- Checkbox: a single box cannot be natively required (attributes land on the `<label>`, the Field's `required` is skipped); the `:user-invalid` rule comes back with that wiring.
- Checkbox: a parent that refuses the update leaves the box toggled, because `:checked` is bound one way (RadioGroup's `choose` puts the DOM back after the parent's turn); Switch has no native state and follows `modelValue`.
- `scripts/test/setup.ts`: jsdom has no `HTMLDialogElement` `showModal()` or `close()`; `SettingsPage.mounted.test.ts` shims both for its own run.
- `SettingsPage.demo.vue` shows no Profile tab: the theme radios are in no screenshot and outside the touch probe.
- `SettingsPage.demo.vue` lays out 468 px wide in a 390 px touch viewport, on the base commit too (wider in German, where the fourth tab is cut).
- `knowledge/laws-of-ux`: `applies` of `hicks-law`, `fittss-law`, `jakobs-law` does not name RadioGroup.
keys: none
screenshots: Field, Select, Textarea (error icon), RadioGroup (new); Input, Checkbox, SettingsPage rendered and byte-identical to a render of 7ffdd4c on the same machine; after review round 1 RadioGroup, Checkbox and SettingsPage rendered again, byte-identical to their renders before the round
probes: RadioGroup keyboard in Chromium: ArrowDown, ArrowUp, ArrowRight, ArrowLeft check and emit with wrap, a disabled option is skipped, Tab leaves the group onto the next group's checked radio, Shift+Tab returns, nothing checked takes Tab on the first radio; SettingsPage theme radios set data-theme by click and arrows; danger dialog Delete enabled, a wrong name keeps it open with the error and the focus in the name, by a click on Delete, by Enter on the focused Delete and by Enter in the name field, typing clears, the right name closes and toasts by click and by Enter in the field; :user-invalid paints --ui-danger after a change and blur only (Input, Textarea); required radios: valueMissing while none is chosen, :user-invalid after a submit attempt, not after a bare focus and blur, cleared by a choice (native, raw page); disabled Input cursor not-allowed; touch probe --only=RadioGroup 0 offenders both densities, --all 60 demos 0 offenders 48 known 14 exempt
