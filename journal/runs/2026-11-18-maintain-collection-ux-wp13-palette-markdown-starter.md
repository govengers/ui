---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 80 min, review round 1 about 70 min, review round 2 about 120 min, review round 3 about 75 min, review round 4 about 50 min
groomed: no
---

## Task
UX hardening pass, work package WP13 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): the
palette's opener in the starter shell and the shortcut names on MarkdownEditor (`11-A`),
`highlight` in `palette.ts` (`11-B`), the hint under "No results" (`11-C`), the reading measure in
MarkdownView (`17-E`), scroll behaviour in the starter's router (`09-G`). Decision D100 in the
handover.

## Measurements
- Starter router, one-off Playwright run (not committed) against a scaffold of the starter (files
  copied as `scripts/template-check.ts` does, a Vite dev server with `/auth/me` stubbed, `Home.vue`
  replaced by a page whose 300 rows of 40 px arrive late), Chromium 1280 by 800:
  - back to a list left at 4000 px, rows 600 ms late: at 0 until the rows came, at 4000 from about
    620 ms on. The same with `return saved` at once (the control): 0. Rows 1500 ms late: the wait
    gives up after 1 s and the page stays at 0.
  - a query-only push at 3000 px stays at 3000; after a hash, a query push at 2500 px stays at 2500
    (the link drops the hash, the `to.hash === ''` case).
  - a same-page link to `/#row-150`: the row's top lands at 56 px, the top bar's height.
  - a hash on the first load is not reached, a static target as much as one in late rows
    (`/other#o-80` stays at 0 with the row 3216 px down): `main.ts` mounts the app after the
    first navigation, so the scroll runs before the page exists. The base behaves the same.
    `TODO.md` line in the handover (corrected in review round 1).
  - a reload lands where the history entry was when it was last left, not where the reader is:
    after Back restored 4000 px and a scroll to 1000 px, a reload lands at 4000 px on vue-router
    5.4.0 (at 1000 px on 4.5.1); an entry never left loads at the top, as the base does. `TODO.md`
    line in the handover (corrected in review round 1).
- Palette opener in the same scaffold, touch context (`hasTouch`, `isMobile`, `(pointer: coarse)`
  true): at 390 px a 44 by 44 icon button, icon centred, name "Search", `aria-keyshortcuts`
  "Control+K Meta+K", the `<kbd>` not displayed; a tap opens the palette with focus in its input;
  no horizontal overflow, 32 px between the title and the button. At 320 px no overflow, but the
  title runs under the icon. At 800 px on touch the word shows, the hint does not (97.5 by 44).
  Fine pointer: "Search ⌘ K" with a macOS user agent, "Ctrl K" with a Windows one; Ctrl+K opens.
  The button paints `rgb(63, 63, 70)` on `rgb(24, 24, 27)` (`--ui-ink-2` on `--ui-chrome`), the
  defect WP05 fixes.
- Highlight in the CommandPalette demo, light and dark: "fix" marks "Fix" in "Fix the timezone in
  reminders", background transparent, weight 600, colour equal to the option's (active option,
  `rgb(30, 58, 138)` light, `rgb(219, 234, 254)` dark); "task create" marks both words of "Create
  task"; "zzzzqq" shows "No results" and the hint, the input keeps the text.
- MarkdownEditor demo: the tools are named "Bold (Ctrl+B)" and "Italic (Ctrl+I)" with
  `aria-keyshortcuts` "Control+B Meta+B" and "Control+I Meta+I"; Control+b and Meta+i format the
  selection in the textarea, Control+Shift+b does nothing.
- MarkdownView in the demo's 704 px column: `p`, `ul` and `blockquote` stop at 655 px (65ch),
  `h2`, `pre` and `table` take 704 px.
- Screenshots of CommandPalette and Markdown: the branch render is byte-identical to a render of
  the base commit on this machine (no resting demo state shows the changes). The two dark files
  differ from the committed ones by an earlier change; all four left as rendered, unstaged.
- `just touch-probe --all`: 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt.
- `just ci`: check 0, index current, contrast 192/192 and 0 undeclared, lint clean,
  template-check clean, 429 tests (416 before), build green.

## What went wrong on first try
- The opener with its word in the default slot, as the plan says -> at 390 px the actions pushed
  the title "Acme" under the Search button -> under 48rem the word and the hint are hidden, the
  button keeps `label` (the same word) as its name and its gap is 0 so the icon stays centred
  (replaced in review round 1: the word leaves the slot, and the other buttons go icon-only too).
- The probe scrolled to 3000 px right after a reload -> vue-router's restore of the saved position
  (first navigation) landed after it, at 4000 -> wait for the restore before scrolling.
- The two-word highlight probe typed "log fix" -> the fake engine found nothing -> "task create"
  on the quick actions.

## Instructions that were wrong or missing
- plan WP13 step 1: "a ghost Button with the search icon and the text" / on a phone the text does
  not fit beside the starter's other actions; icon alone under 48rem (fixed now: yes, the
  deviation is in the handover's D100 and on the CommandPalette card).
- plan WP13 step 5: "top: <the value of --ui-topbar-h in px>" / the token is `3.5rem`, and
  `getPropertyValue` returns the token's text, not px; `topbarHeight()` resolves it through a probe
  element, so a preset may give it any length (fixed now: yes).
- `workbooks/maintain-collection/CONTEXT.md` "Do not load: `templates/`" / a package whose change
  reaches the starter has to load `templates/project` (fixed now: no, grooming).
- plan WP13 file list: `MarkdownEditor.mounted.test.ts` is not in it / the shortcut handler now
  reads its letters from the tools list (one source for label, `aria-keyshortcuts` and key), and
  that has no mounted test; checked in the browser instead (fixed now: no; done in review round 1).

## Questions I had to ask the human
- none

## Pieces that did not fit
- AppShell: the title does not truncate, so a crowded `actions` slot overlaps it instead of
  shortening it (seen at 320 px; AppShell belongs to WP05).

## Gate friction
- `just ci` cannot see the starter's behaviour: `template-check` type-checks and lints it but runs
  nothing. The router and the opener were measured in a one-off scaffold.

## Time sinks
- Building the starter scaffold for the browser probe (copy as `template-check` does, a stubbed
  `/auth/me`, a page with late rows): the starter has no demo route.

## Suggested improvements (for grooming)
- script: a `scripts/starter-probe.ts` that scaffolds the starter like `template-check`, serves it
  with `/auth/me` stubbed and a probe page, so a change to `templates/project` can be looked at
  and measured like a demo.
- workbook `maintain-collection` `CONTEXT.md`: name `templates/project` as loadable when the change
  reaches the starter, with `template-check` as its gate.

## Review round 1 (18.11.2026)
The review rejected the package with one DESIGN and six MINOR findings; a seventh change for the
starter came from the review of the forms package. All are fixed in the run.
- DESIGN, the starter's top bar on a phone: the Search button left the title 32 px at 390 px and
  overlapped it below about 358 px. "Feedback" and "Sign out" have the icons `message-square` and
  `log-out` and a `label` now, and all three buttons drop their word under 48rem through one
  `matchMedia('(max-width: 48rem)')` ref and `<template v-if="!phone" #default>`; the CSS that hid
  the word is gone. Clearance between the title and the first action, base against now: 84 / 115
  px at 390, 54 / 85 at 360, 38 / 69 at 344, 14 / 45 at 320; no overflow; on touch every button is
  44 by 44. On a 720 px fine-pointer window the three are icon-only without a default slot (so
  WP04's Tooltip fires on `label && !$slots.default`); resized to 1280 px the words return.
- The scroll wait always ended in a scroll. It ends without one now when a newer navigation
  happened or the reader scrolled (`router?.currentRoute.value !== to`, `window.scrollY !==
  startY`). Measured on vue-router 5.4.0 and 4.5.1 (the scaffold aliased to it): late rows still
  restore 4000 px at about 610 to 810 ms; a page that comes back shorter than its position, left
  alone, shows its top for 1 s and then its end (5256 px), and a wheel to 1000 px at 0.4 s stays
  at 1000; Back and within 100 ms a link to `/other` leaves `/other` at 0 on both versions;
  query-only pushes and the hash below the top bar unchanged; `app-map.ts` imports the module.
- The format keys of MarkdownEditor had no test: `MarkdownEditor.mounted.test.ts` joins the
  package with three cases (names and `aria-keyshortcuts`; Ctrl+B, Cmd+I and Ctrl with Caps Lock
  wrap the selection; Shift, Alt or no modifier leave it). Six mutations of the handler and the
  template on a copy (no `key: 'B'`, a dead handler, no `aria-keyshortcuts`, Shift not excluded,
  case-sensitive keys, Meta ignored) each fail at least one case.
- "Ctrl" is hard-coded for German and Apple keyboards: moved from `todo:` to `keys:` below.
- `Markdown.md` said images take the full width, but an image sits in a `<p>` that stopped at the
  measure. A paragraph that holds an image takes the full width now (`p:has(img)`), so a
  screenshot or a diagram is not squeezed; text beside an inline image runs as wide, which the
  card says. Measured at 1600 by 900: prose, list and quote 655 px, a 1600 px image in a 1312 px
  view 1312 px.
- Two sentences of this report were wrong (the reload and the hash on the first load); corrected
  under "Measurements" and in the `todo:` lines.
- `highlight` keeps its regular expression without the `u` flag: with it `highlight('😀😀 a',
  '😀')` never returns (checked: killed after 5 s). That input is a test case now and a comment
  beside the pattern says why.
- From the forms package's review, Sign out: `logout()` in `templates/project/router.ts` ended the
  session first and then navigated, so a leave guard asking after the end left a Cancel on a page
  without a session. It navigates to the signed-out screen first and ends the session only when
  the navigation went through. `router.replace` resolves (it does not reject) with a
  NavigationFailure of type 4 (aborted) when a guard cancels, on 5.4.0 and on 4.5.1. Probed with a
  stand-in leave guard: cancel keeps the path `/` and sends no logout; let through, the logout POST
  comes from `/logged-out` and `/auth/me` answers 401 afterwards. A refused logout (500) would have
  left a signed-in user on "Signed out": it goes back to the page it came from and rethrows.
  (Replaced in review round 2: this order showed "signed out" before the session ended and sent
  no logout when the navigation rejected.)
- Gates after the round: `just index` (unstaged), `just ci` green with 433 tests (429 before),
  `just touch-probe --all` 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt;
  screenshots of CommandPalette and Markdown rendered again, left unstaged.

What went wrong on first try in the round:
- The probe's "shorter page, then a wheel" case first used `page.goto` and `goBack`, a document
  navigation the router's wait never saw -> the same in-app navigation as the other cases.

Instructions that were wrong or missing:
- plan WP13 file list: `MarkdownEditor.mounted.test.ts` was not in it / it belongs to no other
  package (plan section 15) and the handler needs it (fixed now: yes, added to the package).
- plan WP13 step 1: a starter button with a word on a phone / the starter's actions need their
  icons alone under 48rem, through the slot (fixed now: yes, D100 below).

## Review round 2 (18.11.2026)
The re-review found every round-1 fix in place and rejected the package for the new sign-out
order (two MAJOR), plus two MINOR. All four are fixed.

- Sign-out, `templates/project/router.ts` and `App.vue`, rebuilt so that every path is at least as
  safe as at `7ffdd4c` and the screen never says "signed out" while somebody is signed in:
  - The signed-out route still comes first, so the leave guards decide; only a guard's refusal
    (`NavigationFailureType.aborted`) keeps the session. Any other end of that navigation (it
    rejects: a lost chunk, a throwing guard; it is cancelled: a link, Back) ends the session too.
  - The logout request starts in the route's `beforeEnter`: after every global guard, before the
    screen's chunk loads, so a closed tab or a slow chunk does not hold it back.
  - `App.vue` renders "Signing out" (role status, after `--ui-loading-delay`, a spinner only
    without reduced motion) on the signed-out route while an identity is set, and the signed-out
    card only once nobody is. The guard sends a signed-in visitor of `/logged-out` home unless a
    sign-out is under way, so that screen cannot lie either.
  - A refusal that leaves somebody signed in goes back to the page and says "Could not sign out.
    You are still signed in." with Retry; a refusal after which `/auth/me` answers 401 counts as
    signed out.
  - Bound: after 10 s without an answer a toast says "Signing out takes longer than usual. You may
    still be signed in." with Reload; a reload drops the request and asks the server who is signed
    in. The toast goes once the logout settles.
  - Once nobody is signed in, a page reached meanwhile is replaced by a full load of
    `/logged-out`, except for a redirect provider's logout, which leaves the page itself.
  - Two clicks join one sign-out: one request.
  - `scripts/starter-signout.test.ts` (new, 12 cases) loads `router.ts` with the real vue-router
    on jsdom and stands in for the starter's session, toast and route components: the order of
    guard, request and chunk; refusal, lost chunk, throwing guard, a link while a guard decides, a
    link while the chunk loads, refused and 401 logouts, two clicks, the 10 s notice, a redirect
    provider, a signed-in visit. Twelve mutations of the flow on a copy (no early start, any
    failure keeping the session, a rejected navigation stopping it, no join, the redirect check,
    the visit rule, the way back, either toast, the dismiss, a refusal counted as success, no full
    load) each fail at least one case.
- `ui.signOut` and the other new strings go under `keys:` below.
- `highlight` searches from every position with an index that only grows, so it ends whatever
  the engine answers; the emoji row is an ordinary test, and with the `u` flag on a copy the whole
  table passes and ends (checked).

Sign-out, every path: a scaffold of the starter with a stateful stand-in for govengers/auth (one
session, the logout behaving as the row says), Chromium 1280 by 800, the user signed in on
`/other` after a link from `/`. Head on vue-router 5.4.0 and 4.5.1 gave the same outcome in every
row, as did `7ffdd4c` on both. Times are milliseconds after the click.

| Path | Requests | User ends on | What the screen says | Server session after | Against `7ffdd4c` |
|---|---|---|---|---|---|
| a guard cancels | 0 | the page, signed in | the page throughout | open: the user chose to stay | base sent 1 and ended the session under a page that still showed; the one path that keeps the session, by design |
| a guard allows | 1 | signed-out card | page, card at 90 | ended | same |
| logout answers 401 | 1 | signed-out card | page, card at 90 | ended | base stayed on the page without an identity; safer |
| logout answers 500 | 1 | the page, signed in | page; at 90 toast "Could not sign out. You are still signed in." (Retry) | open | base the same without a word; told now |
| the connection drops | 1 click (Chrome resent the POST six times on the reset connection) | the page, signed in | page; the same toast at 90 | open | base the same without a word |
| logout answers after 2 s | 1 | signed-out card | page; blank 90 to 500 (loading delay); "Signing out" 500 to 2050; card | ended | base: page until 2047, then the card; same end, no early claim |
| logout refused after 2 s | 1 | the page, signed in | "Signing out" 500 to 2045, then the page and the failure toast | open | base: the page throughout, no word |
| logout never answers | 1 | "Signing out" until the user acts | "Signing out" from 510; at 10 090 the toast "Signing out takes longer than usual. You may still be signed in." with Reload; Reload drops the request, `/auth/me` says signed in, the user lands on `/` | open | base: the page for good, no word; same session state, told now |
| lost chunk of the signed-out route | 1, at 34, before the chunk failed | signed-out card, after a full load | page, card at 90 | ended | base ended the session and left the page showing without an identity; safer |
| a guard throws (once) | 1 | signed-out card, after a full load | page, card at 90 | ended | as the lost chunk; safer. A guard that throws on every load also throws after the full load: blank screen, session ended |
| a link clicked during the navigation (chunk 800 ms) | 1, at 35 | signed-out card, after a full load | the link's guard, finding nobody signed in, shows the login form at 847; full load; card at 1676 | ended | base ended on the login form; same |
| Back during a slow logout (2 s) | 1 | signed-out card, after a full load | the page `/` from 442, card at 2086 | ended | same |
| two quick clicks | 1 | signed-out card | "Signing out" 423 to 2018, card | ended | base sent 2 |
| Sign out on the signed-out screen | no Sign out button there (0 found); a call from code sends 1 more, harmless | signed-out card | card | ended | same |
| tab closed 100 ms after the click (chunk 800 ms cold) | 1, at 34, before the chunk | tab closed | - | ended | same |

Known and equal to the base: a chunk of the signed-out route that never arrives keeps the flow
waiting on the navigation; the request has gone out and the page shows without an identity until
the next navigation sends the user to the login form.

What went wrong on first try in the round:
- The first test run hung for 5 s per case after one failure: a sign-out that never finished stayed
  joined in the module, so every later `logout()` joined it -> the failing assertion fixed (the
  chunk loader runs a turn later than the request); the cascade is the cost of module state.
- `mock.module` with absolute paths did not reach the imports of `router.ts` that exist only in a
  target (`./ui/session`) -> paths relative to the test file.
- The "throwing guard" row first left a blank screen: the probe's guard threw on every load,
  also after the full load -> a guard that throws once, and the persistent case named in the
  table.

Instructions that were wrong or missing:
- plan WP13 step 5: "No automated test can reach it: `router.ts` imports the target's layout" /
  bun's `mock.module` stands in for modules that exist only in a target, so `router.ts` loads in
  `scripts/` (fixed now: yes, `scripts/starter-signout.test.ts`; the scroll behaviour could be
  tested the same way).

## Review round 3 (18.11.2026)
Every row of the round-2 table reproduced; the review rejected the package for one seam: the
state of the sign-out was worked out in three places (`router.ts`, the guard, `App.vue`), and
`App.vue` inferred "Signing out" from "signed-out route plus an identity", which is also true when
another tab signs in. All four findings are fixed.

- One state: `router.ts` exports `signOutState` (`idle`, `asking` while the guards decide,
  `ending` while the request is out, `slow` after 10 s without an answer). `beforeEnter` starts the
  request only while it is `asking`, the guard sends a signed-in visitor of the signed-out screen
  home only while it is `idle`, and `App.vue` shows "Signing out" only while it is `ending` or
  `slow`, in place of any page, so nothing protected can be used while the session ends. A watch
  on the identity and the state sends the signed-out screen home when somebody is signed in and no
  sign-out runs (another tab signed in, a page restored from the back/forward cache, or a way back
  after a refused logout that was refused too).
- The slow notice is on that screen, not in a toast: "Signing out takes longer than usual. You may
  still be signed in." with Reload. It cannot be closed, and while it shows there is no Sign out
  to click into nothing (finding 4).
- The comment on `beforeEnter` and D100 say what holds: the leave guards and every `beforeEach`
  decide; a `beforeResolve` refusal comes after the request; while a sign-out asks, any navigation
  to the route that gets through starts it.
- `scripts/starter-signout.test.ts`: one router for the file (the watch lives as long as the app),
  guards and deferred work undone after each case, 15 cases. New: a visit sends no request; sign
  out, sign in, sign out again sends two; somebody signing in elsewhere moves the screen home; the
  way back refused too ends at home; the states `asking`, `ending`, `slow`, `idle` in order; a click
  while slow sends nothing; a quick sign-out does not turn slow 10 s later; Retry sends again.
  Sixteen mutations of the flow on a copy each fail at least one case, the `beforeEnter`
  condition (finding 2) and a slow timer left running among them.
- Size: the two sign-out functions are 35 lines (`logout` 23, `endSession` 12), down from 45 at
  `fd3ee46` (4 at `7ffdd4c`), plus the state (7 lines with its comment), the `beforeEnter` (6), one
  guard line and the watch (5). `git diff 7ffdd4c -- templates/project/router.ts
  templates/project/App.vue | wc -l` gives 277; that diff holds all of WP13 in the two files (the
  Search button, the phone top bar, the scroll behaviour and the sign-out).

Measured on the scaffold (stateful stand-in for govengers/auth with a login, Chromium 1280 by 800,
the user signed in on `/other` after a link from `/`), head on vue-router 5.4.0 and 4.5.1 alike,
`7ffdd4c` on 5.4.0; milliseconds after the action.

| Path | Logout requests | User ends on | What the screen says | Server session after | `7ffdd4c` |
|---|---|---|---|---|---|
| two tabs: A signed out, sign-in in B, A gets focus | 1 (A's sign-out) | A on `/`, signed in | A: "You are signed out"; on focus the home page at 52 | open (signed in in B) | A kept "You are signed out" while signed in |
| a guard cancels | 0 | the page | the page throughout | open | 1 request, session ended under the page |
| a guard allows | 1 | signed-out card | blank (loading delay) from 38, card at 89 | ended | the page until the card at 88 |
| logout 500 | 1 | the page, signed in | blank from 37; the page and the toast "Could not sign out. You are still signed in." (Retry) at 88 | open | the page, no word |
| slow (2 s), then success | 1 | signed-out card | "Signing out" 453 to 2066, then the card | ended | the page until the card at 2074 |
| never answers | 1 | the "Signing out" screen until Reload | "Signing out" from 508; at 10 064 "Signing out takes longer than usual. You may still be signed in." with Reload, no toast; no Sign out on screen (0); Back keeps that screen on `/`; Reload: the page `/`, signed in | open | the page for good, Sign out still there, no word |
| deep link to `/logged-out` while signed in | 0 | `/` | the home page | open | "You are signed out" while signed in |
| reload on `/logged-out` while signed in (signed in again in another tab) | 0 more | `/` | the home page | open | "You are signed out" while signed in |
| two quick clicks | 1 | signed-out card | "Signing out" 479 to 2037, then the card | ended | 2 requests |

What went wrong on first try in the round:
- The first probe run served a scaffold built before the slow notice moved onto the screen; it
  showed the old toast -> scaffold rebuilt from the current files, all rows run again.
- A slow timer left running survived every case until a case checked a quick sign-out 10 s on ->
  that case added; it would have shown "takes longer than usual" after every quick sign-out.

Instructions that were wrong or missing:
- none beyond the findings

## Review round 4 (18.11.2026)
Approved, with two MINOR findings and one sentence to go in before the merge; the integration
branch was merged into the package branch first (`551f59b`, no conflict).

- The 10 s patience belonged to the request, so a screen whose chunk never arrives left
  "Signing out" for good after the request had answered, without Reload; and a `session.logout()`
  that throws at once left the timer running, turning an idle state `slow` 10 s later. The
  patience now covers the whole sign-out: started with the request, cleared in the `finally` of
  `logout()`; the request runs in an async function, so a throw counts as a refusal (toast, Retry,
  nothing left running). Read once more for other exits: every path after `asking` runs through
  that `finally`, the reads of `from` and `leaves` now inside the `try`; a navigation that never
  settles is the one exit that waits, and the patience turns it `slow` with Reload. Three cases:
  the chunk that never comes, the throw, a second sign-out within 10 s of the first (pins the
  clear: without it the old timer turns the second `slow` early).
- `scripts/starter-signout.test.ts` gives the shared test process back what it changed: the
  console spies are restored, the history listeners removed and the URL reset in an `afterAll`;
  the `location` stub reads the real location for everything but `assign` and `reload`; the
  resolvers of waiting guards are released after each case. Measured with a probe file run after
  it in one process: before, `console.error` and `console.warn` were mocks and the path had 652
  characters; now the real console and `/`. The five `mock.module` registrations stay (bun has no
  undo); they name paths under `templates/project/` that no other test imports.
- Known limit, named in the comment on `beforeEnter` and in D100: a guard must answer every
  question it asks; one left open keeps the sign-out `asking` (Sign out does nothing) until a
  reload, and a later in-app navigation to the signed-out route that gets through sends the
  logout.
- After a refused logout the page the user left is mounted afresh, so its local state (unsaved
  edits the leave guard let go, scroll, open panels) is gone; D100 in the handover says so.
- Browser, a screen whose chunk never arrives (the first request for it held, the logout
  answering at once), vue-router 5.4.0 and 4.5.1: the request at 36 ms, "Signing out" from 448 to
  499 ms, at 10 069 to 10 079 ms "Signing out takes longer than usual. You may still be signed in."
  with Reload, the only focusable element; Tab focuses it, Enter reloads; the user lands on the
  login form at `/login?redirect=/other`, session ended.

## Handover
decision: D100, changed: **The starter restores scroll and shows the palette.** `router.ts` returns to the saved position once the page is tall enough to hold it (live rows arrive after the navigation; it waits at most 1 s, and a newer navigation or a reader who scrolled meanwhile ends the wait without a scroll), to a hash below the top bar, stays where it is when only the query changed (filters, tabs, a page number), else goes to the top. The shell has a visible Search button for the palette with its shortcut (`aria-keyshortcuts`, a `<kbd>` hint where a keyboard is likely); on a phone it and the other top-bar buttons show their icon alone, the word dropped from the slot and `label` naming the icon, so the top bar keeps room for its title. Sign out has one state in `router.ts` (`signOutState`: idle, asking, ending, slow) that the guard and the shell read. It goes to the signed-out route first, so the leave guards and every `beforeEach` decide: only their refusal keeps the session and the user's edits. Once they let the user go, the route's `beforeEnter` sends the logout request before that screen has loaded, so a `beforeResolve` refusal comes too late (a guard that asks the user belongs in `beforeEach` or a component's leave guard), and while a sign-out asks, any navigation to that route that gets through starts it; a guard must answer every question it asks, since one left open keeps the sign-out asking (Sign out does nothing) until a reload. Any other end of that navigation (a lost chunk, a throwing guard, a link or Back) still ends the session. While the request is out the shell shows "Signing out" in place of any page; when the sign-out has not ended after 10 s, whatever it waits on (the request, the screen's chunk), with the sentence that the user may still be signed in and a Reload; "signed out" shows only once nobody is signed in and no sign-out runs. A refusal (a logout that throws counts as one) takes the user back to the page, signed in, with a toast and Retry; the page is mounted afresh, so its local state is gone. Once nobody is signed in, a page reached meanwhile gives way to a full load of the signed-out screen (a redirect provider's logout leaves the page itself). The signed-out screen with somebody signed in and no sign-out running (a deep link, another tab signed in) goes home. Two clicks send one request. Amends D61, D74.
journal: 18.11.2026 maintain-collection ux-wp13-palette-markdown-starter - typed words marked in the palette, a hint under No results, bold and italic name their keys, markdown prose at --ui-measure, the starter's router restores scroll after late rows, its shell has a Search button and icon-only top-bar buttons on phones, Sign out lets a leave guard keep the session and never says signed out before it is; run report 2026-11-18-maintain-collection-ux-wp13-palette-markdown-starter.md
readme: none
todo: ui/AppShell/AppShell.vue: the title does not truncate, so a crowded `actions` slot runs over it (the starter leaves it 45 px at 320 px; a title wider than about 88 px would still run under the first action there).
todo: templates/project/main.ts: a hash on the first load is never reached, a static target too (`/other#o-80` stays at 0): the app mounts after the first navigation, so `scrollBehavior` runs before the page exists (the base the same); a hash target in rows that arrive after an in-app navigation is not reached either.
todo: templates/project/router.ts: a reload lands where the history entry was when it was last left (vue-router 5.4.0: 4000 px after a restore to 4000 and a scroll to 1000), not where the reader is (4.5.1: 1000 px); an entry never left loads at the top, as on the base.
keys: ui.signOut (en "Sign out", de "Abmelden"): the label of the starter's Sign out button in `templates/project/App.vue` (with the word gone on a phone it is the button's only name); its Feedback button reads the existing `ui.feedback`. ui.signingOut (en "Signing out", de "Wird abgemeldet") and ui.signOutSlow (en "Signing out takes longer than usual. You may still be signed in.", de "Das Abmelden dauert länger als üblich. Du bist vielleicht noch angemeldet."): the status in `templates/project/App.vue` while `signOutState` is `ending` or `slow`, its button reads the existing `ui.reload`. ui.signOutFailed (en "Could not sign out. You are still signed in.", de "Abmelden fehlgeschlagen. Du bist weiterhin angemeldet."): the toast in `templates/project/router.ts` `logout`, its action reads the existing `ui.retry`; router.ts has no `t`, so WP15 passes one in or moves the toast into App.vue. ui.keyCtrl (en "Ctrl", de "Strg"), the name of the Control key in a shortcut hint. Readers: `templates/project/App.vue` `paletteKey` (`'Ctrl K'` becomes `${t('ui.keyCtrl')} K`) and `ui/blocks/Markdown/MarkdownEditor.vue` the tool label (`(Ctrl+${tool.key})` becomes `(${t('ui.keyCtrl')}+${tool.key})`). Apple platforms show the command sign "⌘" instead in both locales (a symbol, no key): `paletteKey` does already ("⌘ K"); the editor needs the same platform test for "Bold (⌘B)". `aria-keyshortcuts` keeps "Control" and "Meta".
screenshots: CommandPalette, Markdown (no resting demo state shows the changes: the first render was byte-identical to a base render on this machine; the demos hold no image, so the image rule was rendered in the probe at 1600 px)
probes: sign-out, every path of the tables under "Review round 2" and "Review round 3" (head and 7ffdd4c, vue-router 5.4.0 and 4.5.1, a stateful auth stand-in with a login): no path leaves the session open while the screen says signed out, none shows "Signing out" when nothing signs out, none is less safe than 7ffdd4c; a guard's refusal is the one path that keeps the session; two tabs: the signed-out tab goes home once the other signs in; a deep link or a reload of the signed-out screen while signed in sends 0 requests and goes home; a screen whose chunk never arrives shows Reload at 10 069 to 10 079 ms as the only focusable element, Tab and Enter reload to the login form, session ended. Starter router in a scaffold, vue-router 5.4.0 and 4.5.1: Back with rows 600 ms late restores 4000 px at about 610 to 810 ms (control without the wait: 0); rows 1500 ms late: stays at 0 after 1 s; a page that comes back shorter shows its top for 1 s, then its end (5256 px); a wheel to 1000 px during the wait stays at 1000; Back and a link within 100 ms leaves the new page at 0; query-only push stays (3000, and 2500 after a hash); a same-page hash lands at 56 px (the top bar); a hash on the first load is not reached, static target too. Top bar on touch, title to first action, base / now: 84 / 115 px at 390, 54 / 85 at 360, 38 / 69 at 344, 14 / 45 at 320, no overflow, Search, Notifications, Feedback, Sign out each 44 x 44; fine pointer at 720 px icon-only without a default slot, words back at 1280 px; Search has "⌘ K" (macOS) or "Ctrl K" (Windows), a click or a tap opens the palette with focus in its input; ghost colour `rgb(63, 63, 70)` on `rgb(24, 24, 27)` until WP05. Highlight, both themes: weight 600, background transparent, the option's colour; two words both marked; no results shows the hint and keeps the text. MarkdownEditor: "Bold (Ctrl+B)", Control+b and Meta+i format. MarkdownView: prose 655 px (65ch) in a 704 px column, code and tables full width.
