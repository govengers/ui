---
date: 16.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 3 h
groomed: no
---

## Task
Add the blocks Board (kanban over one live list), Markdown (MarkdownView, MarkdownEditor) and
CommandPalette (Cmd/Ctrl+K), with the fake engine calls their demos need.

## What went wrong on first try
- `bun test` of the sanitiser on happy-dom -> DOMPurify kept `javascript:` hrefs and dropped
  headings -> switched the test DOM to jsdom, which DOMPurify supports (D56).
- `<script>` inside a template literal in a `.demo.vue` `<script setup>` ends the SFC script block
  -> escaped as `<\/script>`.
- Board at 390 px widened the whole page to 1022 px (the column scroller's min-content leaked into
  the layout) -> `contain: inline-size` on the scroller.
- DOMPurify drops `blob:` image sources, so a freshly pasted image did not preview -> an
  `uponSanitizeAttribute` hook keeps `blob:http(s)` on `img` only.

## Instructions that were wrong or missing
- none in the workbook; stage 02 does not say how a block that is two components (MarkdownView,
  MarkdownEditor) is named and carded. Followed FacetFilter: one directory, one card named after
  the directory. (fixed now: no, a grooming question)

## Questions I had to ask the human
- none

## Pieces that did not fit
- Textarea exposes only `focus()`; the editor needs selection and `setRangeText`, so it reads the
  component's `$el` (Textarea's root is the textarea). A `textarea` exposure would be cleaner.
- Dialog requires a visible title; the palette has its own `<dialog>` with an aria-label.

## Gate friction
- Screenshots during a running dev server on another port work fine (random port).

## Time sinks
- Verifying pointer drag, touch drag and keyboard moves needed Playwright probes; there is no
  interaction test harness in the repository (D16 keeps it out of CI by design).

## Suggested improvements (for grooming)
- workbook maintain-collection 02-build: say how a multi-component block is named and carded.
- card Textarea: expose the element (`el`) for blocks that edit selections.
- fake engine: search is substring per field; note in D50 which fields are searchable per table.
