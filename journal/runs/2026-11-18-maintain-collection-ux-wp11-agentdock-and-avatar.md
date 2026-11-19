---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 60 min, review round 1 about 50 min, re-review fix about 20 min
groomed: no
---

## Task
UX hardening pass, work package WP11 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`):
AgentDock follows a streamed answer only from the bottom and offers "Jump to latest" (`21-A`),
Stop with a `cancel` call (`21-B`), a demo fixture that streams a long answer; Avatar without a
name (`21-D`) and status by shape (`21-I`). D98.

## Measurements
- One-off Playwright run against the AgentDock demo (not committed), 1280 by 900, a long answer
  streamed by the demo's new fixture (3 words every 120 ms):
  - a reader at the bottom follows: over 3 s the log grew past its box (747 against 417 px) and
    the distance to the bottom was 0 at every one of 20 samples (one line is 24 px);
  - a reader who scrolled up with the wheel (120 px) stays: scrollTop 231 before and after 1.2 s
    of further streaming (the text grew from 531 to 708 characters); "Jump to latest" shows; a
    click brings the log to its bottom (distance 0), hides the control and leaves focus on the
    log;
  - a single wheel step of 3 px up, less than a line, escapes at once and the view stays;
    scrolling back down to the bottom resumes the following and hides the control;
  - Stop shows while the answer streams; a click ends it, Send returns, the text stops growing;
  - while the scripted agent thinks, Enter sends nothing and keeps the draft; Stop drops the
    pending reply and the thread ends with "Stopped.", Send returns.
- The same check with the slack in both directions (the plan's first form): 30 wheel steps of
  3 px each during the stream left the reader at distance 0, every push pulled them back. That
  is why the slack counts only on the way down (plan, WP11 "As built").
- Touch, 390 by 844, coarse pointer, mid-stream: "Jump to latest" 123.7 by 44 px and Stop 44 by
  44 px in both densities. `just touch-probe --all`: 0 offenders, 0 smaller than known, 0 stale,
  48 known, 14 exempt (unchanged).
- Avatar demo rendered with `filter: grayscale(1)` at 3x: online a filled dot, busy a dot with a
  bar, offline a hollow ring, told apart in all three sizes (the smallest mark is 7.8 px).
- Tests: `dock.test.ts` 4 to 15 cases (`answering`, `nearBottom` five rows, `following` five
  rows); `AgentDock.mounted.test.ts` 5 tests; `Avatar.mounted.test.ts` 5 rows. Each claim was
  checked by reverting it on the working tree: no guard in `submit`, no upward rule, always
  following, no scroll on send, no focus after the jump, `answering` without `streaming`, Stop
  without its `data-action`, no "Unknown person", no person icon; every revert failed a test.
  `just ci`: 437 tests in 1.75 s.

## Review round 1
The review of `7ffdd4c..b834179` found 3 MAJOR, 2 DESIGN and 4 MINOR, all in the dock. Fixed:
- Stop lost keyboard focus: from Stop back to a Send that a blank draft disables, focus dropped to
  the body. `composer.ts` watches the end of the answer (before the DOM update) and moves focus
  on the button, or lost after Stop was pressed, to the composer's field. Browser: Enter on a
  focused Stop, answer ended: Send disabled, focus on the textarea; an answer ending by itself with
  focus on Stop: the same.
- A double click on Stop sent the draft. Chosen: a guard window, `switchGuard` = 500 ms after the
  answer ended, in which a press on the button sends nothing, over `event.detail > 1`: it also
  covers a single press meant for Stop as the answer ends by itself and a key press (both `detail`
  0 or 1), and the second click of a double click lands within it whenever the system's
  double-click time is 500 ms or less, since the end follows the first click. Browser, demo, draft
  kept, two clicks 80, 250 and 400 ms apart: nothing sent; 700 ms apart (about 540 ms after the
  end): sent, as intended.
- The log, a tab stop and focus target, had no name and a clipped focus ring: `aria-label` from
  the dock's heading and `outline-offset: calc(var(--ui-border-width) * -2)`. Browser: one `log`
  named "Assistant"; Tab after the modes lands on it, offset -2px, the ring closes inside the box.
- Jump to latest sat in the flow: it floats over the log's bottom edge now (a `position:
  relative` thread box). Browser: the log keeps 417 px when it appears (337 px at 390 px touch,
  where it is 44 px tall); scrolling down to 10 px above the bottom moves the text by the scroll
  alone (224 px, 224 px).
- The demo's stream row overflowed at 390 px: it wraps; the button is 168 px for its 142 px label.
- A second Stop click between the cancel's answer and the ending push called `cancel` twice:
  `stopping` holds an accepted cancel until the answer ends (Stop stays busy); it is set only while
  the answer still runs, so an ending push that came first does not leave it stuck.
- Ten 1 px wheel steps up, 200 ms apart, never escaped: on the way up the log follows only when
  the browser clamped it (the old position lies more than 1 above the new maximum). Browser: the
  distance grew after every step (22 to 241 px), the view stayed through 0.8 s more streaming.
- Found while re-running the first round's probe (the review's note on a stale last position):
  once, a 3 px step up was pulled back, because the dock's own scroll to a grown bottom and the
  step shared one frame, which fires one scroll event, so the step compared with the position
  before the dock's scroll and looked like a step down. `toBottom` now records the position it
  scrolled to (with `behavior: 'instant'`, so a project's smooth scrolling cannot defer it). A
  mounted test pins it; in the browser 30 random-moment 3 px steps were pulled back 0 times with
  and without the fix, so the race is rare there.
- No test grew the newest message's text: the scroll test now grows it at the bottom (one more
  scroll) and below a reader who stepped up 1 px (no scroll, Jump shows).
- `AgentDock.vue` at 272 lines: the follow wiring is `follow.ts`, the composer `composer.ts`;
  the component is 219 lines (222 before WP11).
- Tests after the round: `dock.test.ts` 17, `AgentDock.mounted.test.ts` 9, `Avatar` 5 rows. Each
  fix was reverted on the working tree and failed a test (focus hand-off, its blank-draft branch,
  the guard, the latch, the latch's ending-push check, the 1 px rule, the text source, the log's
  name, the recorded position); the first round's reverts fail too. `just ci`: 444 tests, 1.73 to
  1.94 s over several runs, close to the 2 s budget.

## Re-review
Approved with one MINOR, fixed before the merge: round 1's clamp exception (on the way up the log
kept following only when the old position lay more than 1 above the new maximum) took a box
growing by 1 px or 0.5 px, as a window dragged taller slowly does, for a reader's step up; the
reviewer measured the reader 84 px from the bottom with "Jump to latest". `following` has no
upward exception now, and a `ResizeObserver` in `follow.ts` keeps a reader who was following at the
bottom when the log's box changes size, and leaves a reader who scrolled up where they are; it is
disconnected with the dock. Chrome reports the new size in the frame of the layout and sends the
clamp's scroll event after it (traced: resize at 2321 ms, scroll at 2322 ms), so `pinned` is still
true when the observer runs.
- Browser, 1440 by 900, while the demo's answer streams, the box grown through the demo frame's
  height, distance to the bottom after 0.9 s more streaming: 0.5 px, 1 px, 12 steps of 1 px, 2 px,
  3 px and a 60 px shrink all 0, no "Jump to latest"; the window 1440 to 1200 px wide: 0; a draft
  of four lines (the log 417 to 345 px) for a following reader: 0; for a reader who scrolled up:
  scrollTop 138 before, after and 0.8 s later, Jump shows; ten 1 px wheel steps up, 200 ms apart:
  distance 22 to 199 px, scrollTop held over 0.8 s more streaming.
- The same probe on round 1's code did not reproduce the reviewer's case: there the next push
  added less than a line, so the slack on the way down re-pinned the reader by chance. The mounted
  test is deterministic: it fails on round 1's rule without the observer.
- Tests: `dock.test.ts` 17 (the `following` table without the exception, two clamp rows that no
  longer follow), `AgentDock.mounted.test.ts` 10 (a box growing by 1 px with the clamp's scroll
  event after the observer's report, a shrinking box, a reader who scrolled up, the disconnect).
  Reverted on the working tree, each fails a test: no re-pin, a re-pin of a reader who scrolled
  up, no disconnect, round 1's exception, no upward rule, no recorded position. jsdom has no
  `ResizeObserver`; the test file brings a stand-in whose `report()` is the browser's notice.

## What went wrong on first try
- The first mounted scroll test stubbed `scrollTo` without firing a scroll event -> the dock's
  own scroll never updated the last known position, so a step up looked like a step down -> the
  stub fires `scroll` like a browser does.
- The watch on `[length, thinking, text]` as one array getter -> fired on every push of the list,
  since a new array never equals the old one, and would raise "Jump to latest" for a push that
  changed nothing at the bottom -> three separate sources.
- The browser check's wheel went to the "Jump to latest" button after it had been clicked (the
  pointer stayed there) -> the pointer moves back over the log before each wheel.

## Instructions that were wrong or missing
- Plan 6.4: `cancel?: MutationTarget<NoParameters, NoParameters, unknown>` / a call without a body
  is typed `MutationTarget<NoParameters, undefined, ...>` (NotificationInbox `markAllRead`), so
  the prop is that (fixed now: yes, in the plan's WP11 "As built" note; the 6.4 row is left as it
  is to keep the merge of the parallel packages free of conflicts).
- Plan WP11 step 1: "slack about one line" in both directions / a scroll up within a line never
  escapes a fast stream; the slack counts on the way down only (fixed now: yes, "As built").
- `AgentDock.md` Agent: "The send button is `data-action="sendMessage"`" / it is the send call's
  name now, the cancel call's while Stop shows (fixed now: yes).
- `AgentDock.md` said nothing about what the server owes after a cancel / without an agent
  message or a cleared `streaming` the dock keeps showing Stop (fixed now: yes, a gotcha).

## Questions I had to ask the human
- none

## Pieces that did not fit
- AgentDock: the demo needed a call that stops an answer; the fake engine has none and the plan
  keeps it unchanged. Answered in the demo through a proxied connection, as the WorkflowStatus demo
  answers `updateOrder`.

## Gate friction
- none: `bun run check`, `bun scripts/ui-lint.ts ui pages`, `just contrast` (192/192, 0
  undeclared), `just index`, `just ci`, `just touch-probe --all` passed on the first run after
  the build.

## Time sinks
- The scroll rule: writing the browser check showed the slack in both directions fails on a slow
  scroll up; finding the two-direction rule and pinning it in jsdom took most of the run.

## Suggested improvements (for grooming)
- workbook `maintain-collection` stage 02: a block whose demo needs a call the fake engine lacks
  answers it through a proxied connection (WorkflowStatus, AgentDock); name the pattern.
- workbook `maintain-collection` stage 02: a control that changes what it does under the pointer
  (Send and Stop) needs a guard against the press meant for its old meaning, and a control that
  disables itself needs a focus target; name both in the stage.
- script: the test suite is at 1.73 to 1.94 s against the 2 s of the plan's section 10, with
  several packages still to add tests; the budget or the harness's engine seeding is a grooming
  question.

## Handover
decision: D98, changed: **The dock follows the stream only from the bottom, and an answer can be stopped.** AgentDock scrolls to the newest text only while the reader is within about one line of the bottom, else it offers "Jump to latest" over the log's bottom edge, which scrolls down and puts focus on the log; any scroll up by the reader stops the following at once, a change of the log's size (the dock, the window, a draft over several lines) keeps a following reader at the bottom and leaves a reader who scrolled up where they are, and a message the user sends always scrolls. With a `cancel` call the send button is Stop while the agent answers (it is thinking, or its newest message has `streaming: true`), and the form and Enter send nothing until the answer ended; the draft stays. When the answer ends, focus that would drop to the page goes to the composer, and for 500 ms a press on the button sends nothing, so a double click on Stop never sends the draft. After a cancel the server ends the answer (clears `streaming`, or adds an agent message), else Stop stays. Amends D25.
journal: 18.11.2026 maintain-collection ux-wp11-agentdock-and-avatar - done after one review round and a re-review fix: the dock follows a stream only from the bottom (any scroll up escapes, a resized box keeps a following reader at the bottom, browser-checked), Jump to latest floating over the log, Stop with a cancel call (focus kept in the dock, a double click never sends), a streaming fixture in the demo, follow and composer in sibling files; Avatar without a name shows a person icon and "Unknown person", statuses told apart by shape (D98); run report journal/runs/2026-11-18-maintain-collection-ux-wp11-agentdock-and-avatar.md
readme: none
todo: AgentDock: the `role="log"` region announces a streaming message push by push; `aria-busy` on the streaming message (`:aria-busy="message.streaming"`, not on the log, whose `aria-busy` follows the list's loading) would hold it until complete; needs a screen reader to confirm.
todo: test harness: jsdom has no `ResizeObserver`; `AgentDock.mounted.test.ts` shims it in the file (a stand-in whose `report()` plays the browser's notice). A second piece that observes sizes would want the stand-in in `scripts/test/setup.ts`.
keys: `ui.conversation` (en "Conversation", de "Unterhaltung") would name the dock's log; today it takes the dock's heading, the same name as the region around it.
manual: on a real Android phone, after a tap on Stop focus moves to the composer's textarea when the answer ends, which may open the on-screen keyboard over the answer (plan section 12).
screenshots: Avatar (status shapes, person icon without a name, status rows per size), AgentDock (the demo's stream row above the frame; the dock at rest looks as before)
probes: AgentDock demo, 1440 by 900 unless noted, a streamed long answer: a reader at the bottom follows (distance 0 at 20 samples over 3 s); a reader who scrolled up stays (scrollTop 231 before and after 1.2 s of streaming) and gets Jump to latest, which floats 8 px above the log's bottom edge, leaves the log at 417 px (337 px at 390 px touch, Jump 44 px tall there), goes to the bottom, hides and leaves focus on the log; ten 1 px wheel steps up 200 ms apart escape (distance 22 to 199 px, no pull back over 0.8 s more streaming); a 3 px step at a random moment of the stream, 30 trials: pulled back 0 times; the box grown by 0.5 px, 1 px, 12 x 1 px, 2 px, 3 px or shrunk by 60 px while streaming, and the window 1440 to 1200 px wide: distance 0 after 0.9 s, no Jump; a draft of four lines (log 417 to 345 px): a following reader stays at distance 0, a reader who scrolled up keeps scrollTop 138; scrolling down to 10 px above the bottom moves the text by the scroll alone (224 px); Enter on a focused Stop and an answer ending by itself with focus on Stop both leave focus on the composer's field; two clicks on Stop with a draft 80, 250 and 400 ms apart send nothing, 700 ms apart (about 540 ms after the end) sends; the log is one `log` named "Assistant", its focus ring at outline-offset -2px; at 390 px the stream button is 168 px wide for its 142 px label; Stop while thinking drops the reply. Touch 390 by 844, both densities: Jump 123.7 by 44, Stop 44 by 44. Avatar in a greyscale render at 3x: dot, dot with bar and ring told apart in all three sizes.
