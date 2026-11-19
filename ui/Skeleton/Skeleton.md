---
name: Skeleton
tier: primitive
intent: [skeleton, loading placeholder, shimmer, loading state, placeholder text, content loader]
uses: []
livewire: false
status: ready
laws: [doherty-threshold, law-of-pragnanz]
---

# Skeleton

A shimmering placeholder in the shape of the content that is still loading: text bars, a circle
for an avatar, a rectangle for an image or a chart. It shows after `--ui-loading-delay`, with its
space held from the start. Hidden from assistive technology.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Skeleton.vue` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look or the delay | the tokens it reads, `--ui-loading-delay` among them |

Do not load:

| Skip | Why |
|------|-----|
| `Skeleton.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


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
- Shows after `--ui-loading-delay`; a faster answer shows no placeholder (NN/g, response time
  limits: under a second needs no indicator). Its box is held from the start, so nothing moves
  when it appears. A CSS animation delay, no JavaScript and no minimum display time.
- The delay runs again whenever the Skeleton's box is made anew: inserted again (moved to another
  parent), an ancestor back from `display: none` (a `v-show` panel, a closed `details`), a Table
  cell hidden on phones across the 48rem edge. That is about 400 ms of blank where a placeholder
  stood, never a placeholder that stays hidden.
- Show skeletons only for the first load (`!error && loading` without data). A refetch keeps the
  old data on screen instead of flashing placeholders.
- Reduced motion stops the shimmer through the global rule in `base.css`; the placeholder stays
  as a flat surface. The delay holds there too: `base.css` shortens durations, not delays.
