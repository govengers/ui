---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 90 min, review round 1 about 75 min, round 2 about 40 min
groomed: no
---

## Task
UX hardening pass, work package WP12 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`):
FileUpload Retry (`22-A`), the percent sent (`22-B`) and `ui.removeFailed` (`13-D`); ApiKeyCreate
copy feedback (`01-D`); StatusTile `period` (`20-B`); `formatCurrency` options (`20-D`); swim lanes
off the Board card (`22-K`). Decision D99 travels in the handover.

## Measurements
- `just ci` green: contrast 192/192 pairs, `ui-lint` clean, template-check clean. First pass 433
  tests in 1.80 to 1.95 s; after review round 1, 436 tests in 1.68 to 1.96 s (1.96 s inside the final `just ci`), and 1.46 to 1.84 s
  without WP12's three mounted files on the same machine (load average about 8): inside the noise.
- Mutation check of the new tests (each change reverted on the working copy, then restored):
  Retry offered on a refusal, no room check, the row restarted before the room check, the
  replaced row not removed, the percent span dropped, no restart on retry: each fails at least one
  FileUpload mounted test; the File kept after success fails `fileUpload.test.ts`. In ApiKeyCreate:
  no stale check on success or on failure, no forget on dispose, `closed()` not forgetting copies,
  a copy not clearing the old timer, `closed()` keeping Copied: each fails at least one test.
- Screenshots: `StatusTile` light and dark show the period after the pill, the other tiles as
  before. `FileUpload` light byte-identical, dark re-rendered with no visible change (live timing).
  `ApiKeyManager` byte-identical (no copy state in its demo). Left unstaged (plan 7.1).
- One-off browser probe (Chrome, the demo server of `scripts/screenshots.ts`, script not
  committed): see the handover's `probes`.
- `just touch-probe --all`: 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt.

## As built (deviations from plan WP12, for the plan's "As built" note)
- Step 1: the steps of one upload are functions in `fileUpload.ts` (`restart`, `succeed`, `fail`,
  plus `room`), each with a unit test; `FileUpload.vue` creates the entry in `add` and runs a try
  in `send`. "After done the upload holds no File" is pinned in
  `fileUpload.test.ts`: the harness compiles templates inline, so a mounted test sees no setup
  state of the piece.
- Step 1: a refusal with field errors lets the bytes go too, not only a success (the plan's own
  reason: the bytes are held only while a retry is possible). The card's gotcha says so.
- Step 1: `succeed` also drops `replaces`; otherwise each replacement would hold the row before
  it and its upload, a chain that grows with every pick.
- Step 1: a retry always reads the file it replaces with `replaceable()`, like a new pick, while
  its row still counts as failed. The plan's "recompute when the stored row is gone" holds; a
  stored row that is still listed is what `replaceable()` answers anyway (review round 1).
- Step 1: every `Upload` carries an `idempotencyKey`, made in `add` and sent with every try, so a
  retry after a lost answer is not stored twice (review round 1).
- Step 1: Retry goes while its file uploads, so `retry` moves focus to the file's row
  (`tabindex="-1"`). Not a loading Retry: Button's `loading` still sets native `disabled` on this
  branch (WP04 not merged), which drops focus (review round 1).
- Step 1: `entriesOf` keeps this page's uploads on top, newest pick first, each in its place for
  the life of the piece: an answered one shows the server's row of its id there, under the
  upload's key, so its element never moves (a moved element loses focus) and no push shifts it.
  The other rows follow in the server's order; a reload applies it to all. Two uploads the server
  answered with one id show one row, in the newer place (review rounds 1 and 2).
- Step 1: `retry` and `removeEntry` read the upload's state, not the rendered entry: a second
  Retry in the same task, or Remove right after Retry, does nothing (review round 1).
- Step 1: Retry carries `data-action` = the upload descriptor's name (`uploadFile`), as a mutating
  control (D23). A retry clears the inline problems, as a new pick replaces them.
- Step 1, found on the way: `removeEntry` spliced at `indexOf(...) = -1` when one upload was
  removed twice (a second click, a replacement racing a click), dropping the last upload of the
  list. It splices only a found index now.
- Step 4: the copy-failed line is a `<p role="alert">` in the Field's slot, right under the
  input; Field's `error` would mark the read-only secret invalid.
- Step 4: `ApiKeyCreate.mounted.test.ts` shims `HTMLDialogElement.showModal` and `close` (jsdom
  has neither; plan 7.1: shim in the test file, report it).
- Card: `FileUpload.md` gains a `## Messages` section with every key the piece reads.
- Step 5, review round 1: `StatusTile.mounted.test.ts` is new, outside WP12's file list (no other
  package touches StatusTile): the round asked to pin the period, and only a mounted test sees it.

## What went wrong on first try
- A mutation run started from inside `ui/blocks/FileUpload` -> every test failed, also unchanged
  ones -> `bunfig.toml` (the jsdom preload) is read from the working directory; run `bun test`
  from the repository root with a path filter.
- A mutation that removed the first `if (!current()) return` hit `submit()`, not `copy()`, and
  survived -> anchor the replaced text on its neighbouring line.
- The mounted tests waited `settle()` after an add -> the first upload was still running on the
  slow network fetch, so a second pick was refused as too many -> `settle(12)` (`answered()`).
- The probe counted rows named `offline.pdf` over the page -> 2: the demo's first uploader shows
  the server's `live.files`, which holds the second uploader's file too -> count inside one list.
- Upload progress through `page.route` -> no progress events -> a slow CORS server on another port
  (`Bun.serve`, reads 40 ms per chunk) shows 38%, 63%, 85%, 100%.

## Instructions that were wrong or missing
- plan WP12 step 1: "Mounted tests: ... after done the upload holds no `File`" / a mounted test
  cannot see a piece's state (inline templates, D69); pinned in the unit test instead (fixed now:
  no, the plan is not in WP12's list; As built above).
- plan 6.4 `Upload.file`: "released once the upload succeeded" / also released on a refusal with
  field errors (fixed now: no, As built above).
- `ui/blocks/FileUpload/FileUpload.md` had no list of its keys although `13-D` asks the card to
  list `ui.removeFailed` (fixed now: yes, `## Messages`).

## Questions I had to ask the human
- none

## Pieces that did not fit
- FileUpload demo: no section shows a failed upload that offers Retry, and the fake engine's fetch
  reports no progress, so neither change is in a screenshot. `FileUpload.demo.vue` is not in
  WP12's list (handover `todo`).
- ApiKeyManager demo: mounts no Toast host, so the Copied toast does not show there (handover
  `todo`).

## Gate friction
- `just ci` does not run the screenshots or the touch probe; both ran by hand.
- The suite budget of 2 s (plan section 10) is close: 1.80 to 1.95 s after WP12 alone.

## Time sinks
- The browser proof of Retry and the percent: the demo has neither state, so the probe swaps the
  demo's pair (`import('/src/fake/live.ts')` in the page) for one with a failing fetch, and for
  the percent one without `fetch` against a slow server.

## Suggested improvements (for grooming)
- script `scripts/test/setup.ts`: shim `HTMLDialogElement.showModal` and `close` once (attribute
  plus the native `close` event), so a mounted test of any piece with a Dialog needs no shim.
- workbook `maintain-collection` stage 04: say that `bun test` runs from the repository root
  (`bunfig.toml` preloads the harness), also for a single file.
- demo: a way to make the fake engine refuse or drop the next request (`engine.failNext()`), so a
  demo can show a failed state without swapping the pair.

## Review round 1 (18.11.2026)
The review rejected the package with 1 MAJOR, 1 DESIGN and 6 MINOR findings; all fixed in the
round.
- MAJOR, every try sent a fresh Idempotency-Key, so a retry after a lost answer could store the
  file twice: one key per `Upload`, made in `add`, passed to every try. Pinned in the mounted
  retry test (both POSTs carry one key, a new pick of the same file another); card and D99 say so.
- DESIGN, focus fell to the body when Retry went: `retry` focuses the file's row, and the server's
  row keeps the upload's key (`entriesOf`), so the element survives the answer. Pinned in the
  mounted retry test (focus on the row after the click and after the server's row took over) and
  in `fileUpload.test.ts` (the key).
- MINOR, `retry` and `removeEntry` trusted the rendered entry: both read the upload's state now.
  Pinned: two Retry clicks and a Remove in one task send one POST, emit `uploaded` once and keep
  the row.
- MINOR, a refused copy within 2 s of a good one left Copied for good: a refusal turns Copied back.
  Pinned, with the line's reset on a new copy and on close.
- MINOR, `retryable` without a `File`: `fail` requires the bytes. Pinned in `fileUpload.test.ts`.
- MINOR, the remove-twice fix had no test: pinned (a refused file removed twice in one task keeps
  the finished one).
- MINOR, the stored-row branch of `retryTarget` changed nothing for a fixed `maxFiles`: removed,
  a retry reads `replaceable()`. The recompute line is pinned: an old file removed by hand
  meanwhile is not removed a second time by the retry (`remove` called twice in all: one refused
  by "no answer", which pins `ui.removeFailed`, and the one that worked).
- MINOR, unpinned behaviours: `ui.removeFailed`, `copyFailed` reset on close and on a new copy, and
  StatusTile's period (new `StatusTile.mounted.test.ts`) are pinned now.
- Suite time: the FileUpload mounted tests wait until no bar shows instead of a fixed 12 turns.
- Proof: each of the ten FileUpload guards (key, focus, stable key, retry guard, remove guard,
  index guard, recompute line, `ui.removeFailed`, `retryable` with bytes, room) and the five
  ApiKeyCreate copy rules, reverted one at a time, fails at least one test.

What went wrong on first try in the round:
- The shorter wait made three FileUpload tests flaky (about one run in two) -> Vue drops a click
  stamped in the same millisecond as its listener was attached, and Button's capture listener
  stamps the click first, so a click right after the button rendered did nothing -> the wait ends
  with 2 ms on the clock (also after a key is created in the ApiKeyCreate test); 15 runs green.
- Two ApiKeyCreate steps in one tick (Done, then open again) -> the dialog's watcher saw no change
  and never closed -> a flush between them.

Instructions that were wrong or missing:
- plan WP12 step 1 names no Idempotency-Key for a retried upload / the runtime's contract asks for
  the same key on a retry of a sent request (fixed now: yes, the code and D99 in the handover).

Suggested improvements (for grooming):
- script `scripts/test/mount.ts`: a `click()` helper that waits for the clock to pass the
  listener's attach time, or a note on `settle()`, so a mounted test never loses a click to Vue's
  timestamp guard.

## Review round 2 (18.11.2026)
The re-review confirmed seven of the eight round 1 findings fixed and pinned and rejected on one
DESIGN finding, fixed in the round.
- DESIGN, focus still fell to the body with a live list and two or more local rows below the
  retried one: the answered upload's row left the local rows for the server section, so Vue moved
  its element. Reproduced first with the probe below (3 failed, top row; 4 failed, top and second
  row: BODY after the answer). Fixed the preferred way: `entriesOf` renders an answered upload's
  server row in the upload's place, so the row never moves. Chosen over putting focus back after
  the move because it also keeps the next Retry from sliding under the pointer and needs no
  watcher; what changes: this page's uploads stay on top in pick order while the piece is
  mounted, the server's order wins for every other row at once and for all after a reload, and a
  push (a scan, another user's upload) never moves them.
- Pinned in `fileUpload.test.ts` (the order; two uploads with one id) and in the mounted retry
  test, now with three failed uploads and Retry on the top one: the row is the same element and
  still first. jsdom keeps focus on a moved element, so the place is what the mounted test sees;
  reverting `entriesOf` fails all three.
- The card says the order and that focus stays; D99 in the handover says the same.

What went wrong on first try in the round:
- none

Instructions that were wrong or missing:
- none

Suggested improvements (for grooming):
- none

## After the merge (18.11.2026)
On the integration branch (499 tests in one process) `a copy toasts Copied and the button turns
back after 2000 ms` failed every run: the toast queue is one per module, and
`pages/SettingsPage/SettingsPage.mounted.test.ts` (two "Workspace deleted") and
`pages/DetailPage/DetailPage.mounted.test.ts` ("Stonegate Systems deleted") leave their toasts in
it; the test compared the whole queue. Printed at the test's start: exactly those three. The test
file now counts only the toasts its test made (ids above the last one before it), dismisses them
after, and installs its dialog and clipboard shims in `beforeAll` and removes them in `afterAll`,
so it neither reads nor leaves global state. Checked with two toasts queued before the file: green;
without the `toast()` call in `copy()`: three tests fail. FileUpload and StatusTile mounted tests
read no module-wide state. Whole suite five times: 499 pass, 0 fail, 2.38 to 2.46 s.

## Handover
decision: D99, changed: **A failed upload can be retried.** FileUpload keeps the `File` of an upload until it is in or refused and offers Retry on a failed row, from byte 0, unless the server refused the file with field errors (`retryable`). Every try of one upload sends the same Idempotency-Key, so a file whose answer was lost is not stored twice. A retry counts like a new pick: without room it is refused with `ui.tooManyFiles` and the row stays failed. A retried replacement still replaces: the old file goes only once the new one is in. Retry leaves focus on the file's row. This page's uploads stay on top in pick order while the piece is mounted, each in its place, also when the server's row takes the upload's place, so neither the focus nor the pointer loses its row; the other rows follow in the server's order, which a reload applies to all. The row shows the percentage while the runtime reports one. Amends D76.
journal: 18.11.2026 maintain-collection ux-wp12-upload-keys-tile-format-board - done: FileUpload Retry and percent sent, ApiKeyCreate copy feedback, StatusTile period, formatCurrency options, Board card without swim lanes; run report 2026-11-18-maintain-collection-ux-wp12-upload-keys-tile-format-board.md
readme: none
todo:
- `ui/blocks/FileUpload/FileUpload.demo.vue`: no section shows a failed upload with Retry or the percent sent (the fake engine's fetch reports no progress), so neither is in a screenshot.
- `ui/blocks/ApiKeyManager/ApiKeyManager.demo.vue`: mounts no Toast host, so the Copied toast does not show in the demo.
- `ui/blocks/FileUpload/FileUpload.vue`: 250 lines, over the about 200 of stage 02 (213 before WP12); the row could be a sibling component.
- `ui/blocks/FileUpload/FileUpload.vue`: a failed upload without an answer (offline) shows no reason, only the Failed badge and Retry; a `ui.*` key such as "No answer from the server" would say why.
- `scripts/test/setup.ts`: no `HTMLDialogElement.showModal` or `close` in jsdom; `ApiKeyCreate.mounted.test.ts` shims both in the file.
- `bun test scripts ui pages demo/src`: 1.68 to 1.96 s after WP12 alone, near the 2 s budget of plan section 10, with eight packages adding tests at the same time.
- `demo/src/fake/engine.ts`: the upload route keeps no Idempotency-Key, so the demo stores a file twice when the answer of a try was lost and the retry sends the same key (FileUpload sends one key per upload since WP12).
- `ui/Input/Input.vue:59`: Vue mirrors the value into the `value` attribute, so the secret of ApiKeyCreate sits in `input[name="secret"]`'s attribute while it is shown (on the base too).
- `ui/blocks/FileUpload/FileUpload.vue`: a replacement that finishes while the user removes the old file by hand calls `remove` twice, and the second shows the server's "not found" (on the base too).
- `scripts/test/setup.ts` or `scripts/test/mount.ts`: the toast queue (`ui/Toast/toast.ts`) is module-wide and no harness step empties it between test files; `pages/SettingsPage/SettingsPage.mounted.test.ts` and `pages/DetailPage/DetailPage.mounted.test.ts` leave their toasts behind. A reset between files (or each file dismissing the toasts it made) keeps a later test's queue clean.
- `demo/src/App.vue:91`: `.main` sizes to its content, so a long file name widens the page at 390 px (501 px with a Ready row, 588 px with a failed one).
keys: none
screenshots: StatusTile
probes: Chrome, one-off script against the demo server (not committed). FileUpload demo with the demo pair swapped for one whose fetch rejects: the failed row offers "Retry offline.pdf" with data-action="uploadFile"; the refused animation.gif offers none; Retry after the network came back: 1 row of the file in its list in each of 30 samples 100 ms apart, then Ready, and the server's live list shows 1 row of it. Touch, 390 by 844, coarse pointer: Retry and remove of a failed row measure 44 x 44. Percent over XHR against a slow CORS server: the meta reads "4.7 MB", then "4.7 MB 38%", "63%", "85%", "100%"; screenshot of the row looked at. ApiKeyManager, clipboard granted: Copy writes the secret (read back equal), the toast queue holds "Copied", the button reads Copy again after about 2.3 s (2 s timer plus polling); writeText rejected: "Copy failed. Select the key and copy it by hand." under the field with role alert, light and dark looked at. Retry row looked at in light, dark and on the phone. Review round 1, same setup: an answer lost after the engine stored the file, Retry by keyboard: both POSTs carry one Idempotency-Key (01a1f035-2600-...), a new pick of the same file another; the fake engine keeps no upload keys, so its live list holds the file twice (todo). Focus after Enter on Retry, reached by Tab: the file's row (LI, `:focus-visible`, outline 2px solid accent) 150 ms later and after the upload finished, in the list without a live list and in the live list, where the server's row took the upload's place in the same element (1 row of the file); the ring looked at in light and dark. Review round 2, same setup, 2, 3 and 4 failed uploads, Retry by Enter on every row, with `files` (first demo uploader) and without (second): before the fix focus was on the row 150 ms after Enter in all 18 cases, and after the answer BODY in 3 (with files: 3 failed top row; 4 failed top and second row); after the fix the row in all 18 cases at both readings, and the order of the page's rows unchanged by the answer. With files, 3 failed, Retry on the middle row: after the answer, the scan push and another user's upload the order stays c, b, a, report, then the server's rows with the other user's file first; focus stays on b. A reload restarts the demo's in-page engine, so no reload was measured; a new mount has no uploads and shows the server's order. `just touch-probe --all`: 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt.
