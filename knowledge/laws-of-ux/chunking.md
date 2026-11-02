---
name: Chunking
category: heuristic
summary: Group single items into meaningful units so people scan, understand and remember faster
applies: [Field, Card, SettingsPage, DetailPage, Stepper, format]
---

# Chunking

> A process by which individual pieces of an information set are broken down and then grouped
> together in a meaningful whole. (Jon Yablonski, Laws of UX)

A business record easily has twenty fields; as one flat column it is a wall. Grouped by meaning
(contact, billing, status), the user finds the part they came for and sees how the parts relate.
Chunking is a matter of structure and hierarchy, not of hiding things.

## In this collection

- A form is a stack of Fields (`ui/Field/Field.md`); `group` turns a Field into a fieldset with
  a legend for related checkboxes or radios.
- The SettingsPage recipe puts one Card per concern, each its own form with its own Save, in
  tabs (`patterns/building-a-settings-page.md`).
- The DetailPage recipe splits a record into the edit form, the status lifecycle and the related
  list: form and status side by side, the list below.
- Stepper breaks a long creation flow into named steps; the page decides when a step may be left.
- `ui/format.ts` shows sizes, durations and relative times as one readable unit ("3 minutes ago",
  `formatBytes`, `formatSpan`) through `Intl` with the app locale (D20).

## Review questions

- Can a user name the groups on this page, and does each have a heading or a boundary?
- Is any group longer than a screen without a break?

## Source

https://lawsofux.com/chunking/
