---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 35 min, review round 1 about 40 min
groomed: no
---

## Task
UX hardening pass, work package WP08 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`):
`04-A` settle a refused field's error on leaving it, `04-B` Stepper's Continue never disabled and
the `blocked` event, `04-C` the leave guard registered by `useLiveForm`, `04-J` the Stepper resume
gotcha, `05-J` the demo's Switch becomes a Checkbox, `01-I` the focus test of DetailForm. D96.

## As built (where the build differs from the plan's steps)
- Step 1: a refused field the save did not send (the server refused an untouched field) records
  the value it was filled with (`base`), not `json(patch[name])`, which would be `undefined` and
  let `settle` clear the error on a blur without a change. A model test pins it, through the test
  socket that may now change a frame on its way (`liveForm.test.ts`).
- Step 1: the existing local `refused` (the refused names) in `save()` is `failed` now, so the
  new per-field record can carry the plan's name.
- Step 2: the demo's canContinue-only rule sits on the source step next to the native `required`:
  "customers" and "orders" are taken export names, a rule only the page knows. The run step's
  Done is refused by `canContinue` too (the job has not succeeded); the demo answers its `blocked`
  with a line above the job (review round 1: under it, a phone's sticky bar covered it), so no
  refused click stays silent.
- Step 3: the mounted test of the guard also runs the real `useLiveForm`: a saved form and
  `leaveGuard: false` stay silent. The DetailPage test clicks the confirm button inside the closed
  Dialog: jsdom has no `showModal()`, and the dialog's state is not under test. No harness name
  was missing; the tests stub `window.confirm` themselves (jsdom's only reports "not
  implemented").
- Step 4: `DetailForm.mounted.test.ts` renders the Fields against the order of `pick` and of the
  server's errors, so "first in DOM order" is what it checks; a second case pins `settle` on
  `focusout`.

## Review round 1 (REJECT: 2 MAJOR, 1 DESIGN, 4 MINOR), what changed
- MAJOR, a Save click after correcting a refused field was lost: `settle` removed the error line
  on `focusout`, which a press on Save fires, and Save moved up 22 px before the release. Of the
  two fixes offered (settle after the press, or keep the error line's box until the next save) the
  first: it lives in `settle` itself, in `liveForm.ts`, so DetailForm, the LiveForm demo and a
  project's own Field stack get it without copying anything; keeping the box needs Field (another
  package's file) to draw an empty line that stays under a corrected field until the next save.
  `useLiveForm` tracks the pointers that are down (`pointerdown`, `pointerup`, `pointercancel` on
  `window`, removed with the scope); `settle` runs one task after the last one is up, or one task
  after the leave when none is down. The one task also covers touch, where the focus moves after
  the finger is up but before the click in the same task. Nothing moves between press and
  release, and the line goes once, so it cannot flicker. `LiveForm.md` tells a custom stack to
  call `settle` on `focusout` and never to clear an error on blur itself; `DetailForm.md` says it.
- MAJOR, the DetailForm and LiveForm demos asked about edits their script made: `leaveGuard:
  false` in both (`DetailForm.demo.vue`, `LiveForm.demo.vue`, taken over as the review said), and
  the plain Field stack of the LiveForm demo calls `settle` on `focusout`.
- DESIGN, the run step's waiting line sat under the phone's sticky bar: it renders above the job.
- MINOR, a name of spaces was refused without a sentence: `nameError` answers "Enter a name.",
  and `canContinue` of the source step is `nameError === undefined`.
- MINOR, an untouched refused field kept its error after a push changed it. Ruled: an error is
  about the value the server refused; once the field holds another value the error no longer
  describes it and goes. The push watcher calls `settle` after it refills a field, and `save()`
  takes an untouched field's value from a snapshot made before the call (`held`), dropping the
  error at once when a push changed the field during the call. Two model tests, on `LiveForm.md`.
- MINOR, SettingsPage's auto-saving switches ask during their own save: the `leaveGuard` row on
  `LiveForm.md` names a form that saves on change; the fix of the page is a handover `todo`
  (WP07's file).
- MINOR, the starter's logout ends the session before a navigation the guard can cancel: the
  forced-leave gotcha on `LiveForm.md` covers any leave the app forces and says a KeepAlive host
  keeps the guard; the fix of `templates/project/router.ts` is a handover `todo` (WP13's file),
  read from the code, not run.

## Measurements
- Review round 1, browser probe (one-off Playwright script, not committed), DetailPage demo at
  1440 by 900: a refused name corrected, then a real press on Save at 15, 50, 70 and 90 percent of
  its height. Mouse (down, 150 ms, up): Save stays at y 687.3 during the press and every press
  saves. Touch (`hasTouch`, a tap): Save stays at y 711.3 and every tap saves. The same script on
  42bad35, the rejected head: the mouse loses the presses at 50, 70 and 90 percent (Save at
  665.3 during the press), the touch taps at 70 and 90 percent.
- Review round 1, the same probe: the DetailForm and LiveForm demos with nothing typed stay
  silent on a sidebar link, the back button and a reload (each after a click, so an unload prompt
  could show); the LiveForm demo's error goes when a corrected field is left with Tab. Stepper at
  390 by 844 with touch: three spaces show "Enter a name." and focus the field; the run step's
  waiting line is at y 742 to 763, the sticky bar at 775.
- Review round 1, mounted: a corrected field keeps its error while a pointer is down on Save and
  loses it after the release (fails when `settle` ignores the press). Model: a push that changes
  an untouched refused field clears its error; a push during the save leaves none (each fails
  without its change: `settle` in the push watcher; `held` instead of `base`; the drop in the
  catch).
- Revert checks on the working copy: each claim fails its test when its change is reverted
  (refused value from `values` instead of the sent patch; the outside-the-patch branch; the path
  check; the dispose; `immediate`; the `leaveGuard` option; `form.reset()` before the push in
  DetailPage).
- Browser probe (one-off Playwright script, not committed, Chrome, 1280 by 900, the demo):
  Stepper with the name empty: a click on Continue and Enter in the field each fire `invalid`
  and no `submit`, the field has focus and "Please fill out this field.", step 1 stays. With
  "customers" (click) and "Orders" (Enter): `submit` fires, the Field shows "An export named ...
  exists already.", the focus is in the field, step 1 stays. A free name moves on and focuses the
  panel; Continue never carries `disabled`; step 2 shows a checkbox, no switch. Done on the run
  step while the job runs shows the waiting line.
- Leave guard in the DetailPage demo: clean, a sidebar link leaves without a dialog; dirty, the
  link asks "You have unsaved changes. Leave this page?" and Cancel stays; a reload while dirty
  gets the browser's `beforeunload` prompt; after a save, link and reload stay silent; after
  leaving with OK (the page unmounted), the next link and a reload stay silent; Delete with an
  unsaved edit lands on `/customers` without a dialog.
- `just touch-probe --only=Stepper`: 0 offenders. `just touch-probe --all`: 0 offenders, 0 smaller
  than known, 0 stale, 48 known, 14 exempt (as after WP02).
- Screenshots against a render of the base commit on the same machine: Stepper moved (Continue
  enabled at rest, the source hint names the taken names); DetailForm, DetailPage and LiveForm
  light are byte-identical; LiveForm dark differs in 22 bytes at one rounded input corner, also
  between two base renders of other runs (antialiasing), not a change.
- `bun test scripts ui pages demo/src`: 432 pass after review round 1, 1.6 to 1.9 s.

## What went wrong on first try
- `bun test` on the first settle test -> a parse error: an apostrophe in the test title closed
  the string -> titles without apostrophes.
- The new record `refused` collided with the local `const refused` in `save()` (TDZ error at
  run time) -> the local became `failed`.
- `just ci` -> vue-tsc refused the test's `onUpdate:modelValue` handler typed `(value: string)`
  (Input emits `string | number | null`) -> typed as Input emits it.

## Instructions that were wrong or missing
- `pages/DetailPage/DetailPage.md` Gotchas: "`DetailForm` emits `saved` also when nothing was
  touched" / DetailForm returns before saving when nothing is touched and emits nothing since
  commit fc26b7c (fixed now: yes, the line is gone).
- `ui/blocks/LiveForm/LiveForm.md` Gotchas: "Errors stay until the next `save()` or `reset()`" /
  replaced by the `settle` rule (fixed now: yes, plan step 1).
- Plan WP08 step 3 says the demos are not affected; the DetailForm and LiveForm demos leave their
  form dirty by script, so leaving those two demos asked (fixed now: yes, review round 1).
- Plan WP08 step 3: "pages/SettingsPage needs no edit"; its switches save on change and the guard
  asks during that save (fixed now: no, WP07's file; handover `todo`).

## Questions I had to ask the human
- none

## Pieces that did not fit
- none

## Gate friction
- none; `just ci` does not run the touch probe or the screenshots, both ran by hand.

## Time sinks
- Telling a real screenshot change from render noise: a base render from `git archive` with
  `node_modules` linked, then a byte compare.
- Review round 1: a layout shift between press and release is invisible to jsdom and to a
  resting screenshot; only a real press in a browser, at several heights, shows it. The first
  build checked keyboard and click paths, not a held press.

## Suggested improvements (for grooming)
- workbook `maintain-collection` stage 04: a sentence that a screenshot differing from `HEAD`
  proves nothing while the integration branch holds unrendered token changes; compare with a
  base render instead.
- script: a committed form of the Stepper and leave-guard browser probe (a `--flows` mode next to
  the touch probe) would make the D96 checks repeatable, the press on Save at several heights
  included.
- workbook `maintain-collection` stage 04: a piece whose state change removes or adds a line
  (an error, a hint) is probed with a real held press on the control below it.

## Handover
decision: D96, changed: **A form's submit is never disabled, and edits are not lost silently.** Stepper's Continue stays enabled. A field with a native constraint is refused by the browser, which focuses it and says why; a step that only `canContinue` refuses emits `blocked`, the page shows why next to the field, and the frame focuses the first field marked invalid. `useLiveForm` registers `useLeaveGuard`, which asks before a navigation to another path or a page unload while the form is dirty; the guard lives as long as the form state, not as long as the card that shows it. `leaveGuard: false` turns it off for a form whose edits may be dropped and for a form that saves on change. A leave the app forces is never cancellable half way: a page that discarded the record (delete, archive) resets the form first, and an action that ends something and then leaves (a logout) navigates first. An error is about the value the server refused: it clears once the user leaves the field with another value (`settle`, which waits until no pointer is down, so the line going away never moves a button from under a press) and once a push changes an untouched field. Amends D33.
journal: 18.11.2026 maintain-collection ux-wp08-live-forms-and-stepper - done after review round 1: leave guard in useLiveForm, settle on focusout after any pointer press, Stepper's Continue always enabled with `blocked`, scripted demos without the guard, four mounted test files; run report journal/runs/2026-11-18-maintain-collection-ux-wp08-live-forms-and-stepper.md
readme: none
todo: `pages/SettingsPage/SettingsPage.vue` (WP07): the `notifications` form saves each switch on change, so a link clicked during that save asks about unsaved changes; add `leaveGuard: false` to its `useLiveForm({ target: live.settings, params: {}, call: calls.updateSettings, pick: ..., leaveGuard: false })` with the comment "a switch saves at once: nothing is left unsaved". The `general` form keeps the guard.
todo: `templates/project/router.ts` (WP13): `logout()` awaits `session.logout()` and then `router.replace({ name: 'auth.loggedOut' })`, so with a dirty live form the guard asks after the session ended and Cancel leaves the user on a page without a session (read from the code, not run). Navigate first, end the session only when the navigation went through: `if (await router?.replace({ name: 'auth.loggedOut' })) return` then `await session.logout()`; the comment becomes "the signed-out screen first (a leave guard may keep the user here), then the session ends".
todo: `ui/ActionBar/ActionBar.vue` (no owner in this pass): a field focused by script (DetailForm after a refused save, Stepper after `blocked`) can sit under the sticky bar. Measured at 390 by 844, Stepper, three spaces and Continue: the focused input at y 800 to 844 and its error at 849 under the bar from 775; with `html { scroll-padding-bottom: 5rem }` the focus scrolls the input to 305 to 349 and the error into view. A scroll padding of the bar's height while a sticky bar is on the page (base.css or the bar) would fix every form.
keys: none
screenshots: Stepper
probes: Stepper, real click and real Enter: an empty `required` name fires `invalid` and no `submit` (browser message, focus in the field, no `blocked`); a taken name and a name of spaces fire `submit`, `blocked`, the Field error and focus in the field; Continue never `disabled`; at 390 by 844 the run step's waiting line (742 to 763) sits above the sticky bar (775). Save after correcting a refused field, DetailPage demo at 1440: a real mouse press (held 150 ms) and a touch tap at 15, 50, 70 and 90 percent of the button's height each save, Save does not move during the press (687.3); on the rejected head 42bad35 the mouse lost 50 to 90 percent and touch 70 and 90 percent. Leave guard in the DetailPage demo: silent when clean, after a save and after the page unmounted (link and reload); dirty asks on a link (Cancel stays, OK leaves) and gets the `beforeunload` prompt on reload; Delete with an unsaved edit lands on the list without asking. The DetailForm and LiveForm demos stay silent on link, back and reload. Touch probe `--all`: 0 offenders, 48 known, 14 exempt.
