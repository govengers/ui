---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 3 h, review round 1 about 2 h, review round 2 about 1 h
groomed: no
---

## Task
UX hardening pass, work package WP04 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): Button
(`01-A`, `01-C`, `01-G`, `06-B`, `11-E` with `01-H`, `01-I`). A loading Button keeps its focus and
its width and swallows every click; the spinner shows after `--ui-loading-delay`; an icon-only
Button shows its `label` through Tooltip. Decision D91 travels in the handover.

## As built, where it differs from the plan
- Step 1: native `disabled` comes from `disabled` only, and not while `loading` is set: with both
  set (WorkflowStatus's running transition, AgentDock's Send with an empty draft, NotificationInbox's
  Mark all read) the plan's rule would still drop the focus the package exists to keep. Loading
  wins: focusable, `aria-disabled`, busy, every click swallowed. Review round 1: when `loading`
  ends with `disabled` still set, or `disabled` turns on, while the Button has the focus, it is
  held (focusable, `aria-disabled`, guarded) until the focus leaves, then natively disabled. D91
  in the handover says so.
- Step 2: `position: relative` sits on the loading state only, not on the root at rest, so a resting
  Button paints exactly as before (a positioned element changes paint order against later
  siblings, for example under a sticky table header).
- Step 2: the content is hidden through one rule on the root's direct children except
  the spinner and the Tooltip (`:deep()`, because the icon slot's element carries the caller's scope).
  The spinner comes after the label in the DOM, so a Button that is not loading renders the same
  elements as before plus two empty comment anchors.
- Step 4: the card also says that the Button stops clicks only (`requestSubmit()` from script goes
  around any button, as it went around native `disabled`), that `label` on a text Button names it
  and shows no tooltip, and (review round 1) what script can still do and that a loading link
  keeps its `href` for the context menu.
  `01-I`: the line "after a refused save the form moves the focus to the first refused field
  (`DetailForm` does)".
- Step 5: a scripted `click()`, a disabled router link (the route stays), a loading anchor, a
  double click and a held key, and the release after loading ends are pinned too.
- Step 6: the demo has a static Loading row (text, icon and text, icon only), so the screenshots
  show the spinner, and the form section counts its submits.

## Measurements
- `bun test ui/Button`: 8 mounted cases. 14 single reverts of `Button.vue` on the worktree (the
  whole file back to the base, loading sets native disabled, loading does not win over disabled,
  the guard for links only, the guard without `preventDefault`, without
  `stopImmediatePropagation`, `aria-disabled` for links only, no `data-state`, no `aria-busy`, the
  spinner replacing the icon, no Tooltip, a Tooltip on text Buttons, the Tooltip as description, a
  disabled link not inert): each fails at least one case. jsdom keeps the focus on a button that
  turns disabled, so the case pins `disabled === false` while loading; the focus itself is the
  browser check.
- Screenshots: every demo (122 files) rendered on the base 9a5e3c0 twice, once more for the
  pieces that differed, and twice after the change, on the same machine. Every file but Button and
  FeedbackCapture has a byte-identical base and after render; FeedbackCapture differs between two
  base renders too, in the captured page URL, which holds the dev server's random port. The other
  differences (Dashboard, StatusTile, NotificationInbox, WorkflowStatus, AgentCursor, Stepper,
  Menu, Markdown, AgentDock) appear in the same places between two renders of the same code. Button: rows 0 to 422 byte-identical in both
  themes; the new Loading section; As link moves down 184.5 px, a half-pixel phase, so its
  antialiasing differs (836 and 828 channel values) while its boxes and styles are identical.
- Every `.ui-button` on every demo, base against after, reduced motion: 386 Buttons on 60 demos
  other than Button's have identical box, colour, background, opacity, cursor, `disabled`,
  `aria-busy`, `aria-disabled` and `position`; on Button's demo the 12 Buttons above the new
  section are identical and the two links only moved down 184.5 px.
- Every form whose submit Button loads, in its demo (LoginForm, LoginPage change password,
  DetailForm, LiveForm, ApiKeyCreate and ListPage create with the `form=` attribute): Enter in a
  field, then three more Enter, a double click and Space on the busy Button: one submit event
  each, none while busy. Stepper's demo sets `busy` only while leaving its review step starts
  the job; this probe drove its first step, where nothing loads (corrected in review round 1).
- `just touch-probe --only=Button`: 0 offenders. `--all`: 0 offenders, 0 smaller than known,
  0 stale, 48 known, 14 exempt (as before).
- `just index` (left unstaged), `just ci`: green, 192/192 contrast pairs, 0 undeclared pairs in
  66 style sources, lint clean, template check clean, 545 tests, build.
- `bun test --randomize scripts ui pages demo/src`, five runs: four green (545), one failed in
  `CommandPalette.mounted.test.ts` ("a pair without an identity keeps no recent picks", seed
  3646878977). The seed fails it on the base too, with `Button.vue` and its demo back at 9a5e3c0
  and without `Button.mounted.test.ts` (536 pass, 1 fail): a leftover `localStorage` entry of
  another file. On the merged state of review round 1 the seed passes (611 of 611): the
  integration branch's harness clears storage after every test, so the todo is withdrawn.

## What went wrong on first try
- `bun test ui/Button` -> the "afterwards a press goes through" case failed one run in four (the
  form saw the submit, the parent and the caller saw no click) -> Vue drops an event stamped in
  the millisecond its listener was attached; every click in the file now waits 2 ms first, which
  also keeps the "reached nobody" cases from passing by accident.
- The revert harness -> one mutation reported "passes" and one hung -> a failing `toBe` on a DOM
  node prints the whole node, the output overran `spawnSync`'s buffer and one print stalled ->
  the cases compare tag names and booleans, the harness has a large buffer and a timeout.
- Browser probe, double click on the busy Button -> Playwright waited 1.4 s, until the load
  ended, because it treats `aria-disabled` as not actionable -> `force: true`.
- Browser probe, Dialog -> `dialog[open]` also matched the demo's inline dialogs -> `:modal`.
- Browser probe, widths in compact -> the first box was read before the density's styles settled
  -> a 200 ms wait after switching density.

## Instructions that were wrong or missing
- plan WP04 step 1: "native `disabled` only from `props.disabled`" / with `disabled` and `loading`
  both set the focus still drops; loading wins (fixed now: no, the plan is not this package's
  file; this report and D91 in the handover).
- plan WP04 step 2: "root `position: relative`" / on the loading state only, so nothing at rest
  moves (fixed now: no, same reason).
- plan section 11: "a loading Button loses focus | mounted test (CI)" / jsdom keeps the focus on a
  disabled button, so the mounted test pins the attribute and the focus is a browser check
  (fixed now: no, same reason).
- brief: "a programmatic `submit` cannot fire the action twice" / a scripted `click()` on the
  Button is swallowed (tested); `form.requestSubmit()` and a dispatched `submit` event never pass
  through a button, and native `disabled` never stopped them either. Button does not listen on
  its form; the card says so and the handlers without an in-flight check are a todo (fixed now:
  yes, card gotcha).

## Questions I had to ask the human
- none

## Pieces that did not fit
- Tooltip: fit as built. Its guards held for Button without a change: the modal Dialog's and
  Sheet's opening focus, the Menu kebab's open menu, a press on the panel, touch.
- FileUpload: keeping Retry mounted and loading is not the better form (handover).

## Gate friction
- `bun test --randomize` failed once of five runs in a suite this package does not touch (above).

## Time sinks
- Telling run-to-run noise from a change across 122 screenshots: three base and two after renders
  and a byte and pixel comparison, then a style comparison of every Button.

## Suggested improvements (for grooming)
- script: `screenshots.ts --out=<dir>` so a render of the base does not overwrite
  `screenshots/`, and a `--compare=<dir>` that prints the pixels that differ per file; "explain
  every differing pixel" is a common gate of this pass.
- demo: FeedbackCapture's captured URL holds the dev server's random port, so its screenshot
  never repeats; the demo could show a fixed origin.
- script: `scripts/test/mount.ts` could export the 2 ms clock wait for Vue's same-millisecond
  rule; FileUpload, ApiKeyCreate and Button carry their own.
- workbook `maintain-collection` stage 02: a mounted test compares tag names or booleans, never a
  DOM node, in `toBe` and `toEqual`; a failure prints the whole node and can stall the run.
- Workbook prompts: no convention was unclear; no gate failed without a reason; the demo needed
  nothing from `demo/src/fake/`.

## Review round 1 (18.11.2026)
The review rejected the package with 2 MAJOR, 1 DESIGN and 3 MINOR findings; the claims of the
first round held when measured again. First the integration branch (b0fe1b1, twelve packages
and a harness that resets state after every test) was merged into this branch, without conflicts.
- MAJOR forced colours: `color: transparent` is overridden in Windows contrast themes, so the
  label stayed painted under the spinner ("Save" and "Export" crossed by the ring, measured on
  the round 1 code with `forcedColors: 'active'`). The content now turns invisible by
  `opacity: 0` in the same zero-length keyframe. Measured in forced colours light and dark and
  without them, for text, icon and text, and icon only: the content's opacity is 0 after the
  delay, the spinner alone is painted, Chrome's tree still says "Save", "Export", "Refresh",
  busy. A Badge inside the label is covered too, so that gotcha is gone.
- MAJOR focus when `loading` ends with `disabled`: a Button that turns disabled while it has the
  focus is held: `held` is set by a sync watch on `disabled && !loading` when the root is the
  document's focus, `native` waits for it, `inert` covers it (`aria-disabled`, the guard, the
  disabled look), and `@blur` ends it unless the Button is still the document's focus (a window
  switch). Measured per frame, by key and by mouse: NotificationInbox's Mark all as read keeps the
  focus (busy, then held, AX disabled, focusable, focused), the next Tab goes to the first
  notification; AgentDock without `cancel` keeps it on Send, the next Tab goes to the link after
  the dock, Shift+Tab back to the field (Send then natively disabled). Exits, each ending natively
  disabled: Tab, Shift+Tab, a click on the page, `v-show` hiding it (Chrome fires blur); an
  unmounted Button takes the state with it.
  `disabled` turning false while focused ends the hold, turning true again starts it. A blur with
  the Button still the document's focus keeps it (headless Chrome never loses window focus, so the
  window switch is that dispatched event, in Chromium and in jsdom). While held: Enter, Space and a
  click do nothing, no submit, the look (opacity 0.55, `not-allowed`, colours, box) is identical to
  the same Button natively disabled. A Button disabled without the focus is natively disabled at
  once. The AgentDock and NotificationInbox todo lines are withdrawn.
- MINOR middle click: `@auxclick.capture="guard"`. Measured on anchors and router links, loading
  and disabled: middle, Meta, Control and Shift click, Enter and a plain click open no tab and
  navigate nowhere; an idle anchor opens a tab on middle, Meta and Shift click and navigates on
  Enter and a click.
- MINOR card: the Loading section names what script can still do (two `click()` calls in one
  task, a click that is not cancelable, an earlier enabled submit button, `requestSubmit()`) and
  that a loading link keeps its `href` for the context menu; the demo's `save()` returns while
  `saving`.
- MINOR run report: the D91 citation and the Stepper sentence are corrected.
- DESIGN, ruled by the coordinator: under reduced motion the spinner stays still; the reviewer's
  slow fade is a todo line for the owner.
- Tests: 14 mounted cases (6 new or changed: the hold, its exits and the window switch, a
  Button disabled without the focus, the middle click in both link forms, the cover keyframe read
  as text because the harness compiles no styles, the demo's in-flight check through
  `requestSubmit()`). 23 single mutations of `Button.vue` and its demo (round 1's, plus no hold,
  hold never set, hold without the focus, release on every blur, no blur listener, no auxclick
  guard, cover by colour, `inert` as in round 1, the demo without its check): each fails at least
  one case.
- Not a Button that is loading or held, against the base `Button.vue` on the merged tree: 387
  Buttons on 60 demos identical in box, colours, opacity, cursor, `disabled`, `aria-busy`,
  `aria-disabled` and `position`, both with and without forced colours; the Button demo's 12
  Buttons above the new section identical. Screenshots, 122 files, base and fixed Button rendered
  on the merged tree: Button's rows above the new section byte-identical; every other difference
  (Dashboard, StatusTile, WorkflowStatus, FeedbackCapture, Pagination, Spotlight) also appears
  between two renders of the same code, in the same places.
- Gates on the merged state: `just index` (left unstaged), `just ci` green (192/192 pairs, 0
  undeclared pairs in 66 sources, lint and template check clean, 611 tests, build); `just
  touch-probe --all` 61 demos, 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt;
  `bun test scripts ui pages demo/src` three times in fixed order: 611 pass each; `bun test
  --randomize` fifteen times: 611 pass each, 0 fail.

What went wrong on first try in the round:
- The NotificationInbox probe clicked the first Button of the demo to open the inbox -> the demo
  opens it on load and that click closed it -> the probe uses the open popover.
- The AgentDock scratch page had nothing after the dock -> the next Tab went to `body`, the end of
  the document -> a link after the dock.
- The held look against native disabled first differed in the background -> the pointer was still
  on the Button and the background transition ran -> pointer away, 400 ms wait: identical.
- A window switch in headless Chrome (another page brought to front) never blurred the page ->
  the blur it sends is dispatched instead.

Instructions that were wrong or missing:
- this report, Measurements: "Stepper's demo never sets `busy`" / it does, while leaving the
  review step (fixed now: yes).
- plan WP04 step 2: "the content turns `color: transparent`" / forced colours override it;
  opacity (fixed now: no, the plan is not this package's file; D91 in the handover).

Suggested improvements (for grooming):
- workbook `maintain-collection` stage 04: a piece that hides or shows content by colour gets a
  forced-colours render (`forcedColors: 'active'`), light and dark.

## Review round 2 (18.11.2026)
The re-review approved the package with 2 MINOR findings and 1 DESIGN finding, taken in one round
before the merge. First the integration branch (54312bf, with the ListPage package) was merged
into this branch, without conflicts.
- MINOR guard: it read `inert`, which a blur turns false one render before `disabled` reaches the
  DOM, so `button.blur(); button.click()` in one task submitted through a held submit (script
  only). The guard reads the props now (`loading` or `disabled`). A mounted case blurs, or focuses
  the field, and clicks in the same task: no handler, no submit; it fails with the old line.
- MINOR card: the Agent section says a held Button is `aria-disabled` without `disabled`, so a
  driver or test reads `aria-disabled` or the accessibility tree; the hold paragraph says the hold
  ends with a blur event, and where the browser sends none (a KeepAlive) the Button stays a
  dimmed, guarded tab stop until it is visited and left once. Firefox and Safari are on the owner's
  manual list (handover).
- DESIGN, ruled: the focus ring of a held Button and of a focused disabled link stays at full
  strength. The element's opacity dimmed the ring with it (2.31 to 3.14:1 against the page,
  measured again before the change). The reviewer's two rules (the element at full opacity, its
  content dimmed) give the full ring but leave the fill of primary and danger Buttons at full
  strength: 75 to 107 of 255 off the native look. Built instead, still in `Button.vue` with tokens
  only: the element at full opacity; fill and border at the disabled opacity by colour
  (`color-mix(... var(--ui-disabled-opacity) ..., transparent)`, which over the page is what the
  element's opacity gives); the content of secondary, ghost and link dimmed by opacity; the
  content of primary and danger kept, because their text is the page's colour (on-accent,
  on-danger) and over the dimmed fill already reads as the native look. Dimming that content too
  left it at 1.66 to 2.06:1 against its fill where the native look has 2.27 to 3.28:1.
- Measured per preset and theme, four variants, text, icon and text, icon only, and a link, each
  held beside the same Button natively disabled (contact sheets looked at): the ring is 4.95:1
  (neutral light), 5.41 (neutral dark), 6.92 (paper light), 7.23 (paper dark), 5.58 (slate light),
  7.02 (slate dark), the full ring in every pair. Held against native inside the border box: the
  fill within 1 of 255; the content within 9 of 255 (computed text against fill within 0.17:1 of
  native, both ways), except four inner corner pixels of the secondary and link border in slate,
  up to 31 of 255. Both read as unavailable.
- A Button that is neither loading nor held, against the base `Button.vue` on the merged tree:
  109 Buttons on twelve demos, at rest and with keyboard focus (97 focused with the ring, 12
  natively disabled): identical box, colours, border, opacity, cursor, outline, `disabled`,
  `aria-disabled` and `aria-busy`. The Button pictures differ from review round 1 in 24 pixels by
  at most 2 of 255 (light), 0 (dark).
- Tests: 16 mounted cases (two new: the press in the task that ends the hold, the ring rules read
  as text). 27 single mutations, four of them new (the guard on `inert`, the focused disabled
  Button dimmed as a whole, no fill rule for primary, the whole file at review round 1): each fails
  at least one case.
- Gates on the merged state: `just index` (left unstaged), `just ci` green (192/192 pairs, 0
  undeclared pairs in 66 sources, lint and template check clean, 623 tests, build); `just
  touch-probe --all` 61 demos, 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt;
  `bun test scripts ui pages demo/src` twice in fixed order: 623 pass each; `bun test
  --randomize` ten times: 623 pass each, 0 fail.

What went wrong on first try in the round:
- The mutation run piped into `head` -> the pipe closed early and could have stopped the run with
  a mutated file in place -> checked the files were intact, then logged to a file.
- The scratch demo's default slot was a `v-if` template, which leaves `$slots.default` set, so
  the icon-only Buttons had no tooltip -> `#default` on the conditional template.

Instructions that were wrong or missing:
- coordinator ruling on the ring: start from the two rules / they leave the fill of primary and
  danger undimmed; the fill by colour and the content split by variant hold both conditions
  (fixed now: yes, built and measured).

Suggested improvements (for grooming):
- `Button.vue`: the held look relies on on-accent and on-danger being the page's colour, true in
  the three presets; a preset that breaks that would show a held primary Button's text brighter
  than the native look. `scripts/contrast.ts` could pin it.

## Handover
decision: D91, changed: **A loading Button keeps its focus.** `loading` sets `aria-busy` and `aria-disabled` and swallows every press on the Button, so a second press, a held key, a middle or modified click on a link and the form's implicit submit (a click on its first submit button) do nothing. Native `disabled` is for `disabled` only and gives way while `loading` is set; a Button that turns disabled while it has the focus (a load that ends with `disabled` set) is held: `aria-disabled`, the disabled look and the guard, until the focus leaves, then natively disabled; its focus ring stays at full strength, because the fill, border and content dim instead of the element. HTML's focus fixup moves the focus to the body when the focused control becomes disabled, and the Authoring Practices advise keeping some disabled controls focusable so users can find them (APG, "Focusability of disabled controls"). Script can still get past the guard (two `click()` calls in one task, a click that is not cancelable, `requestSubmit()`), so a handler that must not run twice checks its own busy flag. After `--ui-loading-delay` the spinner shows and the content turns invisible by opacity, which forced colours keep, so the width does not change and a fast answer shows nothing. An icon-only Button shows its `label` through Tooltip. Amends D44.
journal: 18.11.2026 maintain-collection ux-wp04-button - done after two review rounds: a loading Button keeps focus and width (aria-busy, aria-disabled, a click and auxclick guard that also stops Enter in its form, loading wins over disabled), a Button disabled under the focus is held until the focus leaves with its focus ring at full strength, spinner and invisible content (opacity, forced colours kept) after --ui-loading-delay, icon-only Buttons show their label through Tooltip, 16 mounted tests (27 single mutations each fail one), browser checks of Enter, focus per frame in NotificationInbox and AgentDock, width, timing, forced colours, links, the accessibility tree and the tooltip, every demo compared with the base Button (D91); run report journal/runs/2026-11-18-maintain-collection-ux-wp04-button.md
readme: none
todo: AgentDock (`composer.ts`) and NotificationInbox (Mark all as read): withdrawn, nothing to add. Button now holds the focus on a Button that turns disabled under it: Send without `cancel` and Mark all as read keep the focus after the load, by key and by mouse, and the next Tab goes on from there (measured in review round 1)
todo: ApiKeyCreate, medium, not caused by WP04: once a key is created the form, with the focused name field or Create button, is replaced by the secret view and the focus falls to the page inside the modal dialog (measured in the ApiKeyManager demo). Change: focus the secret's Copy button when `secret` is set
todo: WorkflowStatus, low, by reading: the transition Buttons are keyed by `transition.to`; a transition that changes the state renders another set, so the pressed Button goes and the focus falls to the page (Button cannot hold a removed element). Change: focus the state line (or the first new transition) after a successful run
todo: LoginForm `submit`, LoginPage `submitChange`, ApiKeyCreate `submit`, ListPage `create`, DetailForm `submit` (`useLiveForm().save`) and the LiveForm demo's form, low: no in-flight check, so a `form.requestSubmit()` or a dispatched `submit` event while loading runs them again (Button stops every press and Enter; native `disabled` never stopped these either; nothing in the collection submits a form by script). Change: first line `if (<busy ref>) return` (`loading`, `changing`, `saving`, `saving`, `form.saving.value`, `saving`), as Button's demo `save()` does
todo: Button, owner decision (review DESIGN, ruled for now: no change): under reduced motion `base.css` freezes the spinner, so a covered loading Button shows a still ring, on a ghost Button alone on the page; `aria-busy` carries the state and nothing animates under reduced motion. The reviewer's alternative: a slow opacity fade instead of the turn, under `prefers-reduced-motion: reduce` `.ui-button__spinner { animation-name: ui-button-wait, ui-button-pulse; animation-duration: 0s, 1.2s !important; animation-iteration-count: 1, infinite !important; animation-direction: normal, alternate }` with `@keyframes ui-button-pulse { to { opacity: 0.5; } }`
todo: owner's manual check (plan section 12), Firefox and Safari: focus a Button whose action ends with `disabled` set (Pagination's Last on the last page), then Tab away: the Button turns natively disabled (the hold ends with a blur event, which Chromium sends in every case tried); a real window switch while it is held keeps it held
todo: FileUpload, no change: keeping Retry mounted and loading is not the better form now that a loading Button keeps its focus. It would hold the focus only while the upload runs: a success removes Retry anyway (a finished file has nothing to retry), so the focus would move later, at a moment the user did not act, and the row would show a spinner beside its progress bar. Moving the focus to the row at the press, as today, is one move the user caused
keys: none
screenshots: Button (both themes looked at: a Loading section with three static loading Buttons and the form; rows above it byte-identical to a render of the base `Button.vue` on the merged tree, As link moved down 184.5 px). No other piece's look moved: with the base and the fixed `Button.vue` on the merged tree, every other difference among the 122 files (Dashboard, StatusTile, WorkflowStatus, FeedbackCapture, Pagination, Spotlight) also appears between two renders of the same code, in the same places; 387 Buttons on 60 other demos have identical box, colours, opacity, cursor, `disabled`, `aria-busy`, `aria-disabled` and `position`, with and without forced colours
probes: Chromium, one-off Playwright runs (not committed) against the Button demo, scratch demos (deleted) and the NotificationInbox, AgentDock, Dialog, Sheet, Menu and form demos, 1280 by 900, merged state of review round 1 unless named. Review round 2, merged state at 54312bf: the focus ring of a held Button and a focused disabled link against the page, from pixels, four variants, three kinds and a link: 4.95:1 neutral light, 5.41 neutral dark, 6.92 paper light, 7.23 paper dark, 5.58 slate light, 7.02 slate dark (before the change 2.31 to 3.14); held against the same Button natively disabled inside the border box: fill within 1 of 255, content within 9 of 255 (text against fill within 0.28:1 of native), four inner border corner pixels in slate up to 31; 109 Buttons on twelve demos that are neither loading nor held, at rest and with keyboard focus, identical to the base `Button.vue`; a blur or a focus elsewhere and a click in the same task on a held submit: no handler, no submit. Focus when `loading` ends with `disabled` set, sampled every frame, by key and by mouse: NotificationInbox Mark all as read: focused, busy, then held (`aria-disabled`, not natively disabled), AX disabled, focusable, focused; the next Tab goes to the first notification. AgentDock without `cancel`: Send focused, busy, then held; the next Tab goes to the link after the dock, Shift+Tab to the field, Send natively disabled by then. Held: Enter, Space and a click do nothing, no submit; look identical to native disabled (opacity 0.55, `not-allowed`, colours, 57.75 by 40); exits by Tab, Shift+Tab, a click on the page, `v-show` hiding it: natively disabled, focus where it went; `disabled` false while focused: enabled, Enter clicks; true again: held again; a blur with the Button still the document's focus (a window switch; headless Chrome cannot lose window focus, so dispatched): still held, the next Tab ends it; a Button disabled without the focus: natively disabled. Forced colours (`forcedColors: 'active'`), light and dark: Save, Export (icon and text) and Refresh (icon only) show the spinner alone, content opacity 0, AX names and busy kept; the round 1 code painted "Save" and "Export" under the ring. Links, loading and disabled, anchor and router link: middle, Meta, Control and Shift click, Enter and a click: 0 new tabs, no navigation; an idle anchor: a tab on middle, Meta and Shift click, navigation on Enter and a click. Loading, both with and without `reducedMotion: 'reduce'`: Enter in the field while the submit loads (5 presses, a held Enter with 10 repeats), a double click, Enter and Space on the busy Button: 0 more submits, Enter after the load submits; the keyboard-pressed submit is `document.activeElement` in all 91 frames of a load and after it, still `:focus-visible`; at 0 and 100 ms the spinner is hidden and the label opacity 1, at 600 ms the spinner visible and the label opacity 0; box 57.75 by 40 throughout; a 300 ms load (round 1) showed nothing in 19 frames; 17 Buttons of every size and form kept their box to 0.01 px before, during and after a load in both densities (round 1). Accessibility tree: loading `button "Save"` busy, disabled, focusable, focused, the name unchanged after the delay. Tooltip (round 1): the icon-only Settings shows "Settings" after the delay on hover and at once on Tab, `aria-hidden`, name "Settings", no description; a press on the panel presses nothing; a modal Dialog and Sheet opened by Enter show no tooltip and close with one Escape, Tab back to Close shows "Close" above the dialog; the Menu kebab shows no tooltip over its open menu; touch shows none. Forms (round 1): LoginForm, LoginPage change password, DetailForm, LiveForm, ApiKeyCreate and ListPage create: one submit each, none while busy. Touch probe: `--all` 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt
