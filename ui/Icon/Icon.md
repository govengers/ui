---
name: Icon
tier: primitive
intent: [icon, symbol, glyph, pictogram]
uses: []
livewire: false
status: ready
laws: [law-of-pragnanz]
---

# Icon

One inline SVG from the curated Lucide subset in `icons.ts`. Decorative unless it gets a `label`,
then it is announced as an image.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Icon.vue`, `icons.ts` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Icon.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `name` | `IconName` | required | a key of `icons` in `icons.ts` |
| `size` | `sm \| md \| lg` | `md` | 1em, 1.25em, 1.75em of the current font size |
| `label` | `string` | none | accessible name; omit for decorative icons next to text |

## Adding an icon

Open the icon on lucide.dev, copy the inner markup of its `<svg>`, paste it under a kebab-case key
in `icons.ts`. The set is typed, so a wrong name fails `vue-tsc`.

## Agent

Never the target of `data-action`; the control around it is.
