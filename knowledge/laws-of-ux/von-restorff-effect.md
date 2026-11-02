---
name: Von Restorff Effect
category: cognitive-bias
summary: The one item that differs from its neighbours is the one people notice and remember
applies: [Button, Badge, PageHeader, SettingsPage, theme]
---

# Von Restorff Effect

> [...] when multiple similar objects are present, the one that differs from the rest is most
> likely to be remembered. (Jon Yablonski, Laws of UX)

Distinction works only while it is rare: a business page with five highlighted things has no
highlight at all. Keep emphasis for the one thing that matters, and never let colour or motion
be the only signal.

## In this collection

- One accent (D36): `--ui-accent` for buttons, links, state and focus, `--ui-accent-soft` for
  chips and selected rows, no accent region fills.
- One primary action per page, in the PageHeader; `danger` only for destructive actions
  (`templates/project/DESIGN.md` rule 4).
- The SettingsPage puts the dangerous card last and makes it red only on its button.
- A Badge always has a text label and its dot is decorative, so no state depends on colour
  alone; text contrast is measured in every preset and theme (D9).
- Motion respects `prefers-reduced-motion` (`ui/base.css`, D9).

## Review questions

- What is the one thing on this page meant to stand out, and does anything compete with it?
- Would the page still work in greyscale and without animation?

## Source

https://lawsofux.com/von-restorff-effect/
