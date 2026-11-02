---
name: Law of Similarity
category: gestalt
summary: Things that look alike are taken to belong together and to do the same
applies: [Button, Badge, Tabs, Table, Menu]
---

# Law of Similarity

> The human eye tends to perceive similar elements as a complete picture, shape, or group, even
> if those elements are separated. (Jon Yablonski, Laws of UX)

Users learn a business application by its look: accent and underlined is a link, a filled button
saves, red deletes. Two things that look alike but behave differently will be taken for each
other.

## In this collection

- Button has four variants with fixed meanings (`primary`, `secondary`, `ghost`, `danger`);
  variants are attributes (D41), so a page cannot invent a fifth.
- Links share the accent colour and an underline (`ui/base.css`); the accent is reserved for
  buttons, links, state and focus (D36), so it always means "you can act here".
- Badge has five variants; the ListPage keeps status labels and tones in `customers.list.ts`, so
  one status gets one tone wherever it shows.
- One Table, one Menu, one Field (P2): a list or a form looks the same on every page.

## Review questions

- Do two elements on this page look alike but do different things?
- Does the same status get the same Badge tone on every page?

## Source

https://lawsofux.com/law-of-similarity/
