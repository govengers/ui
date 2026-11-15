---
date: 16.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 3 h
groomed: no
---

## Task
Add the product pieces: the `changelog` module, a changelog-driven `WhatsNew`, the `Changelog`
recipe, and the blocks `UpdateHint`, `NotificationInbox` and `FeedbackCapture` (D56 to D59).

## What went wrong on first try
- `redactText` replaced `Bearer x` before the `key=value` rule, so `Authorization: Bearer x`
  came out as `Authorization: [redacted] [redacted]`; the pair rule now takes the scheme word
  with the value and the scheme rule runs last.
- `InstanceType<typeof NotificationInbox>` fails for a generic component (`vue-tsc` TS2344); the
  demo types the ref as `{ open(): void }`.
- An opened modal in a demo is clipped by the screenshot crop; FeedbackCapture got an `inline`
  prop like Dialog and WhatsNew, and the demo shows the inline preview.
- `font-family: var(--ui-font-mono)` trips UL-003 even with the token; `base.css` already sets
  `pre` to mono.

## Instructions that were wrong or missing
- stage 01-place: a module may live in `ui/<name>.ts` with `ui/<name>.md`, but every `.md` under
  `ui/` and `pages/` is read as a card, so sample data files (changelog markdown) cannot sit next
  to a recipe; they went to `demo/src/fake/changelog.ts` (fixed now: no, see suggestions).
- stage 03-card-demo says overlays "also render a static open example"; it does not say how for
  a block wrapping a Dialog (an `inline` prop) or a Popover (expose `open()` and call it after
  mount, as ColumnsPicker does) (fixed now: no).

## Questions I had to ask the human
- none

## Pieces that did not fit
- WhatsNew: its old contract (slotted notes, stored full version) could not express "new minor
  line with features, once per user, silent on first visit"; replaced (D56), Dashboard no longer
  mounts it.
- Popover: no static open mode; NotificationInbox exposes `open()` for its demo.

## Gate friction
- UL-003 on a token font-family (above).
- `vue-tsc` with generic components and `InstanceType` (above).

## Time sinks
- The redaction regex: quotes, escaped quotes, schemes, idempotency over already masked JSON.

## Suggested improvements (for grooming)
- workbook maintain-collection 03-card-demo: one sentence per overlay kind (Dialog-based:
  `inline` prop; Popover-based: expose `open()`, open after mount).
- script ui-lint: let `font-family: var(--ui-font-*)` pass UL-003.
- fake engine: the demo's identity has notifications but no way to trigger them from a mutation
  of another resource; a project would create them in the mutation's transaction.
