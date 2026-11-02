---
name: Skeleton
tier: primitive
intent: [skeleton, loading placeholder, shimmer, loading state, placeholder text, content loader]
uses: []
livewire: false
status: ready
---

# Skeleton

A shimmering placeholder in the shape of the content that is still loading: text bars, a circle
for an avatar, a rectangle for an image or a chart. Hidden from assistive technology.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `shape` | `text \| circle \| rect` | `text` | |
| `lines` | `number` | `1` | `text` only: that many bars, the last of several 60% wide |
| `width` | `string` | none | a CSS length, applied as inline style; text and rect default to the full width, a circle to `--ui-control-h` |
| `height` | `string` | none | a CSS length, applied as inline style; rect defaults to `--ui-space-16`, a circle follows its width |

## Agent

Skeletons carry `aria-hidden="true"`; the agent and a screen reader see the loading state through
`aria-busy="true"` on the container that is loading, which the block or page sets.

## Gotchas

- Text bars are sized in `em`, so a Skeleton inside a heading is as tall as the heading's lines.
- `width` and `height` are the only inline styles in the collection; they take lengths, never
  colours.
- Show skeletons only for the first load (`!error && loading` without data). A refetch keeps the
  old data on screen instead of flashing placeholders.
- Reduced motion stops the shimmer through the global rule in `base.css`; the placeholder stays
  as a flat surface.
