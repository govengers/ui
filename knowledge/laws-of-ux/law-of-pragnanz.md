---
name: Law of Prägnanz
category: gestalt
summary: People read complex shapes in the simplest way they can, so keep shapes simple
applies: [Card, Icon, Skeleton, Avatar, Badge]
---

# Law of Prägnanz

> People will perceive and interpret ambiguous or complex images as the simplest form possible,
> because it is the interpretation that requires the least cognitive effort of us.
> (Jon Yablonski, Laws of UX)

A business screen is mostly rectangles, text and a few icons. Simple, regular shapes let people
see its structure at a glance; ornament and irregular outlines make them work for it.

## In this collection

- Few shapes: rectangles with the radius tokens `--ui-radius-sm`, `--ui-radius-control`,
  `--ui-radius-card` and a pill, `--ui-radius-pill` (`ui/tokens.css`).
- Icons come from one curated Lucide subset, one family with one drawing style (D43).
- Skeleton draws placeholders in the shape of the content to come: text bars, a circle, a
  rectangle.
- No gradient tokens, no accent region fills (D36): flat surfaces read as one shape each.
- Avatar falls back to initials in the same circle when a picture is missing.

## Review questions

- Can the layout of this page be described as a few simple blocks?
- Does any element have a shape that exists only on this page?

## Source

https://lawsofux.com/law-of-pr%C3%A4gnanz/
