---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 80 min, plus about 70 min for review round 1, 60 min for round 2, 45 min for round 3 and 50 min after the merge
groomed: no
---

## Task
UX hardening pass, work package WP06 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): toast
durations (ruling 5) with a unit test and a mounted test, the leave fade and the slide of the
remaining toasts, the Toast card's surfaces and wording gotchas, Dialog entrance and exit
(ruling 4), Menu type-ahead with a mounted test, D93 and D94 for the handover.

## Measurements
- One-off Playwright runs against the demo (not committed), Playwright's Chromium 156.0.8078.4,
  the only engine installed locally (no Chrome, no Firefox or WebKit build).
- Dialog, 1280 by 900: opacity over the first 300 ms after the opener click rises
  0, 0.1, 0.41 ... 1 in about 200 ms. 90 ms after Escape: `open` false, `display: flex`,
  `flex-direction: column`, opacity 0.18, translate 6.5 px; header, body and actions keep the same
  left edge and stack top to bottom (331, 407, 490 open; 337, 413, 496 in the frame). After
  400 ms `display: none`, focus back on the opener, Tab from there does not enter the dialog.
  Backdrop click closes; `persistent` stays open on Escape and a backdrop click, Sign in closes.
  Inline preview: opacity 1, translate none, transition 0 s.
- Dialog under `reducedMotion: 'reduce'`: panel transition duration 1e-05 s (0.01 ms, `base.css`),
  backdrop 0 s. With the plan's selector `.ui-dialog::backdrop` for the cut the backdrop kept
  0.2 s (measured on a copy, reverted).
- Toast, tops of every toast per frame for 300 ms after a close: closing the bottom or middle one
  of three polite toasts, the one of two danger toasts, and a danger toast under a polite one, the
  toasts above slide 58 px in 8 or 9 frames (largest step 20 px); the leaving toast does not move.
  Closing the last polite toast above a danger toast moves nothing. Under reduced motion the same
  moves take one or two frames. "Four at once" shows three; closing one lets the fourth in. Empty
  regions match `:empty`.
- Menu in Chromium: from Open, `d` Duplicate, `d` Delete, `Shift+D` Duplicate, `e` Edit, `a` stays
  (Archive disabled), `o` Open; Space on Duplicate runs it.
- Screenshots of Toast, Dialog and Menu, base and branch rendered on this machine: Dialog and
  Menu byte-identical; Toast differs only in rows 95 to 106 (the new "Four at once" button), the
  preview is pixel-identical. Left modified and unstaged (plan 7.1).
- `just touch-probe --all`: 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt.

## What went wrong on first try
- `Menu.mounted.test.ts` focused a menu item -> focus stayed on the body -> jsdom hides a closed
  `[popover]` (its default stylesheet) and the harness stubs `showPopover()`, so nothing inside
  the panel is focusable -> the test shows the panel by inline style.
- Toast: the leaving item with `position: absolute` and the region as containing block, pinned to
  the region's bottom -> a danger toast leaving under polite ones let them slide 50 px and jump
  the last 8 px when it was removed (the region was not `:empty` until then) -> pinned to the
  fixed host's bottom, and the gap between regions counts staying toasts only (`:has()`).
- The probe imported `/ui/Toast/toast.ts` -> 404, the demo root is `demo/` -> `/@fs/<absolute path>`.

## Instructions that were wrong or missing
- plan WP06 step 5: `@media (prefers-reduced-motion: reduce) { .ui-dialog::backdrop { transition: none; } }`
  / it loses on specificity to `.ui-dialog:not([data-inline])::backdrop`; the cut uses that
  selector (fixed now: yes, the plan's "As built" note records it; D94 changed in the handover).
- plan WP06 step 2: "(so `:empty` keeps working)" / the gap rule needs to ignore a leaving toast,
  so it reads `:has(> :not(.ui-toast-leave-active))` now (fixed now: yes, "As built").
- `ui/Toast/Toast.md` `ToastOptions`: "default 5000, danger 8000" / the D93 rule (fixed now: yes).
- `ui/Dialog/Dialog.md` Gotchas: a delete the user can undo points at
  `patterns/building-a-list-page.md`, whose section "Deleting" comes with WP10 (fixed now: no,
  not this package's file).

## Questions I had to ask the human
- none

## Pieces that did not fit
- none

## Gate friction
- `just ci` runs no browser: the slide, the exit frame and the reduced-motion durations were
  one-off Playwright runs.
- The screenshots of the Dialog and Toast demos show no open modal or queued toast, so they
  cannot show a motion change; the byte compare only proves the static look did not move.

## Time sinks
- Finding where the 8 px jump at the end of a cross-region slide came from: it took a per-frame
  track of each toast's top, not a screenshot.

## Suggested improvements (for grooming)
- script: `scripts/test/setup.ts` could open a popover in `showPopover()` (set an open flag the
  default stylesheet sees) so mounted tests of Popover, Menu and the pickers can focus inside.
- workbook `maintain-collection` stage 04: a motion change gets a per-frame position track in the
  probe (a frame-by-frame list of tops), not only a mid-way screenshot; a jump hides between two
  screenshots.

## Review round 1 (18.11.2026)
The review rejected the package with one MAJOR, three DESIGN and three MINOR findings; one DESIGN
was a question the owner ruled on (cap per region). All fixed in the run.
- MAJOR: a leaving toast stayed in the DOM for its 120 ms fade and still took presses, so a
  second press on Undo ran it again (the base removed the node at once). `pin()` sets `inert` on
  the leaving toast and `run()` returns for a toast no longer queued. Measured in Chromium, Undo
  pressed twice 0, 60 and 100 ms apart: two clicks at 1440 px, two taps at 390 px touch and two
  clicks under reduced motion each leave `archived: 0`; two Enters run Undo once and the second
  Enter lands on the opener, where focus went back (the counter ends one up per round: archive,
  Undo, archive again).
- DESIGN, Dialog callers: measured 60 ms into the exit, ListPage's confirm reads "Delete 0
  customers?" (open: "Delete one customer?", 182 px); WorkflowStatus loses its title, turns from
  danger to default and shrinks from 198 to 142 px; ApiKeyCreate shows "New API key" and the form
  instead of the secret and grows from 237 to 476 px. Chosen: the card Gotcha "reset after the
  exit, not at close" and three `todo:` lines, not a late `close` event. ListPage and
  WorkflowStatus close by clearing the state the title reads (`:model-value="doomed !== null"`,
  `flow.asking`), so no event timing reaches them, and a `close` 200 ms later would change what
  every caller observes.
- DESIGN, no `overlay`: the `display` and `overlay` transitions sit inside
  `@supports (overlay: auto)`. Simulated in Chromium by making the condition false: 60 ms after
  Escape no dialog is shown (closed at once), the document stays 900 px. The same simulation
  without the guard (overlay taken out of the list) puts the fading panel at `position: absolute`,
  top 207 px instead of 330 px.
- DESIGN, ruled: each live region shows its first three on its own. Queue Undo, danger, Undo,
  Undo, danger, Undo: after 500 ms the polite region shows Undo 1 to 3 and the assertive region
  both danger toasts.
- MINOR, rule order: `.ui-toast-leave-active.ui-toast-move` keeps the fade for a toast closed
  while it slides. Closing C, then B 60 ms later while B carries `ui-toast-move`: B's opacity runs
  1, 1, 0.69, 0.34, 0.18, 0.09, 0.04, 0.01, 0 (was 1, 0).
- MINOR, focus: closing the toast that holds focus by keyboard moves focus to the next toast's
  close button (`:focus-visible`), the last one back to the element focus came from; a pointer
  close gives focus back (not `:focus-visible`), and the paused countdown runs again (both timed
  toasts gone after 5.2 s).
- MINOR, handover: the three `todo:` lines are added below.
- Test gap: replacing TransitionGroup by a plain `div` failed no test. The new mounted test of the
  exit (inert, still connected after the press, gone after the timers, action once) fails then.
  Mutations on a copy: no guard, no `inert`, a plain `div`, one cap over both regions, no focus
  move and no pointer distinction each fail at least one test.

What went wrong on first try in the round:
- none

Instructions that were wrong or missing:
- `ui/Toast/Toast.md`: "running it closes the toast" held only for the first press (fixed now: yes).
- `ui/Dialog/Dialog.md`: "the exit needs the `overlay` transition ... there it disappears at once"
  was not what the code did in an engine without `overlay` (fixed now: yes, the guard).

Suggested improvements (for grooming):
- workbook `maintain-collection` stage 02: an exit animation keeps a removed element in the DOM;
  make it inert and check every handler on it for a second run, with a mounted test.
- workbook `maintain-collection` stage 03: a piece that starts to animate its exit names, on its
  card, what its callers must not change at close, and the run lists the callers that do.

## Review round 2 (18.11.2026)
The re-review closed six of the seven round-1 findings and rejected the new focus code with two
MAJOR and four MINOR findings, all fixed in the run.
- MAJOR, a pointer close scrolled the page: `returnTo.focus()` scrolled the element focus came
  from into view. Focus now goes back with `focus({ preventScroll: true })` after a pointer close;
  a keyboard close still scrolls to its target, because the keyboard user has to see where focus
  went. Measured at 390 px touch, "card" link at the top focused, page scrolled to the bottom, a
  danger toast closed: `scrollY` 1752 before and after, by mouse click and by tap; focus back on
  the link, no ring.
- MAJOR, a held key pressed what focus moved to: a keyboard close now hands focus to the next
  toast itself (`role="group"`, named by its message through `aria-labelledby`, `tabindex="-1"`
  set for the handoff and removed on blur) and drops the closing key's repeats on `document`
  (capture) until its `keyup`. Measured, focus brought from Archive: Enter held on the first of
  three close buttons (13 keydowns 33 ms apart, an error among the toasts) closes one toast,
  `archived: 0`, the action never runs, focus on the next toast with a 2 px ring; a separate Enter
  there closes nothing. Enter twice on Undo with an error below: Undo runs once (`archived: 0`),
  the error stays, focus on it after both presses.
- Found on the way: with `tabindex="-1"` in the template a click on a toast's text focused it and
  held every timer (a neutral toast still there after 5.6 s); the attribute is set only for the
  handoff now, and the same click leaves the toast to go after 5 s.
- MINOR, preview: no cap and no focus move for preview items. Measured with a temporary fourth
  preview toast in the demo (reverted): five preview toasts render, Enter on Close and on Undo
  keeps focus on that button, nothing closes.
- MINOR, test gap: a timed toast beside three errors leaves after 5 s (fails with the old loop).
- MINOR, wording: "behind follow-ups" in `Toast.md`, `toast.ts` and `Toast.vue`.
- MINOR, Dialog: the Gotcha leads "Keep what it shows until the next open, do not reset at close"
  and says a secret is still cleared at close; the `todo:` for `ApiKeyCreate.vue` says the same.
- Mutations on a copy, each restored: a bare `focus()`, no repeat guard, the close button as the
  target, a static `tabindex`, no blur cleanup, a capped preview, a preview moving focus and the
  old countdown loop each fail at least one test.

What went wrong on first try in the round:
- The new countdown test passed alone and failed after any focus test -> jsdom starts its frame
  loop with `setInterval` on the fake clock when a focused node is removed (focus fixup), and
  `useRealTimers()` left that dead loop in place, so no later animation frame ran and no leave
  ended -> `afterEach` advances the fake clock 100 ms before `useRealTimers()`; five runs with
  `bun test --randomize` pass.

Instructions that were wrong or missing:
- `scripts/test/setup.ts` and `scripts/test/mount.ts` say nothing about jsdom's frame loop under
  fake timers (fixed now: no, not this package's files; the shim is in `Toast.mounted.test.ts`).

Suggested improvements (for grooming):
- script: `scripts/test/mount.ts` could drain jsdom's frame loop in `unmount()` (or the harness in
  a shared `afterEach`), so no suite inherits a loop started on another suite's fake clock.
- workbook `maintain-collection` stage 04: focus moved by code gets three checks, scroll position
  after a pointer action, a held key, and a second press.

## Review round 3 (18.11.2026)
The third review closed the six round-2 findings and rejected the repeat guard with one MAJOR and
two MINOR findings, all fixed in the run with the fixes the reviewer tried on a copy.
- MAJOR, the guard outlived its key press: it waited for a `keyup`, which a Space close (Space
  presses on `keyup`) or a click without a key never sends, and was not released on unmount. It
  now ends at the first key event that is not a repeat (a `keyup` or a fresh `keydown`) and on
  unmount. It stays armed by every keyboard close (click `detail` 0) and drops the repeats of any
  key: with the new release it can only drop repeats of a key held through the close, so tracking
  the closing key, or arming only after a seen `keydown`, would add state for no case left (the
  coordinator asked for the fewest states). Measured in Chromium, text field of 16 letters as the
  origin: Space closes the only toast, Backspace held for 1 + 8 keydowns deletes 9 of 9 (the
  previous head: 1 of 9). Enter held (1 + 12) on the first of three close buttons: one toast
  closes, `archived: 0`, focus on the next toast with a ring. Enter held (1 + 12) on the last
  toast's close: focus back on Archive, `archived` stays 1, a fresh Enter afterwards makes it 2.
- MINOR, order-dependent suite: the reviewer's seeds 3157866845, 2162631176 and 4157751806 fail
  1, 7 and 1 tests on the previous head on this machine too, and 2 of 10 fresh random runs of the
  whole suite failed there. My round-2 claim of five passing randomized runs was for
  `bun test --randomize ui/Toast` only, the file alone, not the whole suite. The suite now replaces
  `requestAnimationFrame` per test with a 16 ms `setTimeout` on the test's clock and the host
  releases the guard on unmount. Whole suite, `bun test --randomize scripts ui pages demo/src`:
  0 failures in 20 runs, the three seeds above pass; the Toast file with `MarkdownEditor` and
  `Board` in random order: 0 failures in 20 runs.
- MINOR, `tabindex` on a window switch: the attribute goes on `blur` only once the toast is no
  longer the active element.
- Tests, each failing when its fix is reverted (checked on a copy): a Space close and a click
  without a key followed by a held key in a field; unmount with the guard armed; a `blur` that
  leaves the toast active keeps its `tabindex`.

What went wrong on first try in the round:
- none in the round. Earlier: the round-2 randomized check ran one file, not the suite, and so
  missed the order dependency (above).

Instructions that were wrong or missing:
- `ui/Toast/Toast.md` and D93: "the closing key's repeats" / the guard drops the repeats of any key
  held through the close, until the next key event (fixed now: yes, card and D93 reworded).

Suggested improvements (for grooming):
- workbook `maintain-collection` stage 04: an order claim is checked with
  `bun test --randomize` on the whole suite, several runs, never on the one file.
- workbook `maintain-collection` stage 02: a document-level listener a piece adds has three exits
  written down next to it (the event that ends it, the case where that event never comes, and
  unmount), each with a test.

## After the merge into the integration branch (18.11.2026)
With eleven packages and 59 test files on the integration branch, the Toast suite failed:
`a neutral toast is gone after five seconds` every time in the fixed order of `just ci` (560 of
561), and four of ten random orders, each time the first Toast test that ran (seeds 26926672,
614289989, 699823255, 2409549398). On the branch alone all of it had passed. Cleared for this
round to edit `scripts/test/setup.ts` and `scripts/test/mount.ts`.

Causes, found by logging the state after every test and where each toast came from:
- The toast queue is module-wide and nothing emptied it between files: the SettingsPage tests
  left two toasts ("Workspace deleted", from `confirmDelete`), the DetailPage tests one
  ("Stonegate Systems deleted", from `remove`). With three per live region the first Toast test
  found its slots taken; its own `afterEach` cleaned up for the rest of the file, so only the
  first test of the file failed.
- jsdom's frame loop was dead from `ui/Tooltip/Tooltip.mounted.test.ts` on, for the rest of the
  run: jsdom runs animation frames and its focus fixup (requested on every DOM change while
  something has focus) on one Node interval, started on demand; started under a test's fake
  timers it dies with them and is never started again. The Toast suite had its own frames since
  review round 3, so this was not what failed it, but every later suite that waits for a jsdom
  frame was exposed.
- Storage: SettingsPage left `ui.theme` in `localStorage`, so the CommandPalette test "an ended
  connection shows no recent pick ..." fails whenever it is the first of its file (seed
  4282032422, also on the integration head without this round's change).
- Not causes: no test left fake timers on, no focused node, and no armed repeat guard (no other
  suite mounts the Toast host). `ui/Popover/place.test.ts` leaves its fixture nodes in the body.

Fix:
- `scripts/test/setup.ts`: animation frames are one `setTimeout` each on whatever clock the test
  runs, so jsdom's loop never runs frames. A global `afterEach` (it runs after the file's own)
  switches to real timers, blurs what holds focus (both first, so a removal never starts jsdom's
  focus fixup on a fake clock), unmounts every view still mounted, empties the body, both
  storages and the toast queue. The queue is emptied with `toasts.splice(0)` on the exported
  array: no test-only export was added to `toast.ts`, which projects copy.
- `scripts/test/mount.ts`: keeps the unmount of every live view (`unmountAll()`); `unmount()` runs
  once, whoever asks first.
- `scripts/test/setup.test.ts` (new): one test leaves a mounted, focused view, a toast, storage, a
  node and fake timers; the next finds none of it and a frame runs on its clock. It fails with the
  reset removed.
- `ui/Toast/Toast.mounted.test.ts` empties the queue before each test as well, so the file holds
  without the harness: with the harness change reverted it passes in fixed order and with the
  four seeds.
- No other test file needed a change; the harness cleans what SettingsPage, DetailPage and
  `place.test.ts` leave.

Proof (563 tests in 60 files): `bun test scripts ui pages demo/src` five times in fixed order,
0 failures, 2.51 to 2.59 s. `bun test --randomize` on the same paths thirty times, 0 failures, 2.48
to 3.27 s. The five seeds above: 0 failures (before the new harness test was added, at 561 tests,
and again at 563, where a seed no longer gives the same order).

What went wrong on first try:
- A debug hook in `setup.ts` imported the toast module statically -> the import was hoisted above
  the jsdom globals, Vue loaded without a `document` and the SettingsPage tests broke -> imported
  lazily inside the hook (the harness does the same).

Instructions that were wrong or missing:
- plan 7.1: `scripts/test/setup.ts` belongs to WP01 only / changed in WP06 after the merge, with
  the coordinator's clearance (fixed now: yes, the plan's "As built" note records it).

Suggested improvements (for grooming):
- workbook `maintain-collection` stage 04: before a package merges, run its mounted suite inside
  the whole suite in random order, not alone; module-wide state of a piece (a queue, a registry)
  only shows up between files.
- `ui/Toast/Toast.mounted.test.ts`: its frame shim and frame-loop drain are now covered by the
  harness; they stay so the file holds alone, and can go once the harness is trusted.

## Handover
decision: D93, changed: **How long a toast stays.** `duration ?? (action || variant === 'danger' ? Infinity : 5000)`: an error or a toast with a follow-up stays until closed (WCAG 2.2 SC 2.2.1), anything else five seconds, any number overrides. Each live region shows its first three: three toasts that stay hold the queue of their region, which is intended, and an error never waits behind follow-ups, because errors have their own region. A toast fades out in `--ui-duration-fast` and is inert while it fades; it leaves the flow at once, held where it stood, and the others slide into its place. Closing the toast that holds focus by keyboard moves focus to the next toast itself, else back to where it came from; an Enter held through the close repeats nothing, because repeats are dropped until the key comes up or another key is pressed. A pointer close only gives focus back, without scrolling the page.
decision: D94, changed: **Dialog enters and leaves like Sheet.** Opacity and a small translate on the panel, a fading backdrop, `@starting-style` and `allow-discrete` for `display` and `overlay`; not for `inline`. The exit runs only where `@supports (overlay: auto)` holds; elsewhere the dialog closes at once, because without `overlay` it would leave the top layer and fade at its place in the page. Under reduced motion `base.css` cuts the panel's transition and a rule in `Dialog.vue` the backdrop's, which `base.css` does not reach. Where `@starting-style` is missing the dialog appears as before. The panel shows for `--ui-duration` after it closed, so a caller keeps what it shows until the next open and does not reset it at close; a value that must not outlive the dialog, such as a secret, is still cleared at close, only the view around it is kept.
journal: 18.11.2026 maintain-collection ux-wp06-toast-dialog-menu - done after three review rounds: danger toasts and toasts with an action stay until closed, three per live region, a leaving toast fades inert while the rest slide, a keyboard close hands focus to the next toast and a held Enter repeats nothing, a pointer close gives it back without scrolling, Dialog fades in and out like Sheet where overlay exists and not inline, the backdrop cut under reduced motion, Menu type-ahead, 24 new tests (D93, D94); after the merge the test harness resets every test (real timers, no focus, no mounted view, empty body, storage and toast queue, frames on the test's clock); run report journal/runs/2026-11-18-maintain-collection-ux-wp06-toast-dialog-menu.md
readme: none
todo: Dialog: an inline preview carries `closedby="any"`, so Escape pressed in a persistent modal on the same page closes an open inline preview (Chromium 156, Dialog demo; the base does the same).
todo: scripts/test/setup.ts: the popover stubs never open a panel and jsdom hides a closed `[popover]`, so nothing inside a Popover or Menu takes focus in a mounted test; `Menu.mounted.test.ts` shows the panel by inline style.
todo: pages/ListPage/ListPage.vue: the delete confirm closes by clearing `doomed`, so 60 ms into the Dialog's exit it reads "Delete 0 customers?"; keep the last title until the next open (Dialog card: keep what it shows until the next open).
todo: ui/blocks/WorkflowStatus/WorkflowStatus.vue: the confirm closes by clearing `flow.asking`, so during the Dialog's exit it loses title and description, turns from danger to default and shrinks from 198 to 142 px; keep the last transition for the text until the next open.
todo: ui/blocks/ApiKeyManager/ApiKeyCreate.vue: `closed()` resets on `close`, so during the Dialog's exit the secret view turns into the create form and the panel grows from 237 to 476 px; keep clearing the secret at close (it must not outlive the dialog) and keep only the view, the secret layout and its title with the field emptied, until the next open, through a flag of its own.
todo: knowledge/laws-of-ux/peak-end-rule.md:20 says "a danger toast stays 8 s instead of 5 s"; since D93 a danger toast or one with an action stays until closed.
todo: ui/Dialog/Dialog.md points to `patterns/building-a-list-page.md` for a delete with Undo; its "Deleting" section comes with WP10: check the pointer once WP10 is merged.
todo: ui/Toast/Toast.vue: on a touch screen a tap on a toast's text holds its countdown, because `:hover` stays on the last element tapped and the host pauses while it matches `:hover` (the hover pause predates WP06; at 390 px touch a tapped toast was still there after 5.5 s).
todo: ui/Toast/Toast.demo.vue: at 390 px the demo is 406 px wide (the static preview is wider than the page; the base does the same), so on a phone the live toasts touch the screen edge and the lowest one is cut.
todo: ui/Popover/place.test.ts leaves its anchor and panel nodes in the body and pages/SettingsPage/SettingsPage.mounted.test.ts leaves `ui.theme` in localStorage; the harness clears both after every test now, the files could clean up after themselves.
todo: ui/blocks/ApiKeyManager/ApiKeyCreate.mounted.test.ts counts only the toasts it made (an id mark) because other files left toasts in the queue; with the harness reset the mark is no longer needed.
keys: none
screenshots: Toast (the demo row gains "Four at once"; the preview is pixel-identical). Dialog and Menu unchanged (byte-identical to a base render).
probes: Chromium 156 only (no other engine installed). Dialog: entrance fades 0 to 1 in about 200 ms; 90 ms into the exit header, body and actions are stacked (flex-direction column, same left edge), opacity 0.27; closed after 400 ms with display none, focus on the opener, Tab does not enter it; Escape, backdrop click and persistent as specified; inline preview opacity 1, translate none, transition 0 s. Reduced motion: panel transition 0.01 ms, backdrop 0 s (the plan's `.ui-dialog::backdrop` selector left it at 0.2 s). Without `overlay` (simulated, guard false): closed at once 60 ms after Escape, document unchanged; unguarded it fell to position absolute, top 330 to 207 px. Callers 60 ms into the exit: ListPage "Delete 0 customers?", WorkflowStatus empty title and 198 to 142 px, ApiKeyCreate form instead of secret and 237 to 476 px (todo lines). Toast: remaining toasts slide 58 px in 8 frames in the polite region, the assertive region and across them; the leaving toast stays put; under reduced motion one or two frames. Undo pressed twice during the fade (0, 60, 100 ms; click, touch tap, reduced motion) runs once; Enter twice with no other toast open runs it once and the second Enter lands on the opener. Queue Undo, danger, Undo, Undo, danger, Undo: three Undo and both errors on screen at once. A toast closed while it slides fades over 8 frames. Keyboard close moves focus to the next toast (role group, named by its message, 2 px ring), the last back to where it came from; Enter held (1 + 12 keydowns) on the first of three close buttons closes one toast and runs nothing else; Enter held on the last toast's close does not press the origin, a fresh Enter afterwards presses it once; Space closes the only toast and a Backspace held afterwards in the text field focus returned to deletes 9 of 9 (the previous head: 1 of 9); Enter twice on Undo with an error below runs Undo once and leaves the error. A pointer close or tap at 390 px gives focus back without scrolling (scrollY 1752 before and after); a click on a toast's text focuses nothing and the toast leaves after 5 s. A preview with five toasts renders all five, Enter on its Close or Undo moves no focus. Menu type-ahead and Space in Chromium as in the mounted test. `bun test --randomize` over the whole suite: 0 failures in 20 runs on the branch (the previous head: 2 of 10); after the merge into the integration branch and the harness reset, 0 failures in 30 runs and 5 fixed-order runs (563 tests, 2.5 to 3.3 s). Touch probe --all: 0 offenders, 48 known, 14 exempt.
