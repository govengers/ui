---
name: Aesthetic-Usability Effect
category: heuristic
summary: People rate a tidy, attractive interface as easier to use and forgive its small flaws
applies: [Card, Button, Badge, Page, theme]
---

# Aesthetic-Usability Effect

> Users often perceive aesthetically pleasing design as design that's more usable.
> (Jon Yablonski, Laws of UX)

A business application is used for hours a day by people who did not choose it. A calm,
consistent surface earns trust and patience for the rough edges every internal tool has. The
other side matters as much: polish hides real problems from the people testing a screen, so looks
never replace a check with a real task.

## In this collection

- Every look comes from `ui/tokens.css` (D6, P4): one spacing scale and the radius tokens
  `--ui-radius-control` and `--ui-radius-card`, so rhythm and corners match on every page.
- A preset changes tokens and nothing else (D7); `scripts/ui-lint.ts` fails CI on hex colours,
  raw px and fonts outside `src/ui/` (D12).
- Text contrast is measured, not eyeballed: `scripts/contrast.ts` checks every text and surface
  pair in every preset and both themes (D9, D16, P7).
- No accent region fills, no gradient tokens (D36): restraint reads as quality in a dense tool.
- A pretty screen can still lack names and roles: the Playwright axe pass (D16) checks them.

## Review questions

- Does this page use only tokens, and does it look like the page before it (P3)?
- Was it judged by doing a real task on it, or by how the screenshot looks?

## Source

https://lawsofux.com/aesthetic-usability-effect/
