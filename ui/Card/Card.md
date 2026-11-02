---
name: Card
tier: primitive
intent: [card, panel, surface, box, section container, link card, tile]
uses: []
livewire: false
status: ready
---

# Card

One surface: an optional header with a title and actions, a body, an optional footer. `flush`
lets a Table fill the body edge to edge; `to` turns the whole card into a router link.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `title` | `string` | none | rendered as an `h2` in `--ui-text-lg`; ignored when the `header` slot is given |
| `as` | `div \| article \| section` | `div` | the root element; `article` for a self-contained item, `section` for a titled part of a page |
| `flush` | `boolean` | `false` | no body padding; header and footer keep theirs |
| `interactive` | `boolean` | `false` | hover lift and pointer; implied by `to` |
| `to` | `RouteLocationRaw` | none | renders a `RouterLink` root instead of `as` |

## Slots

| Slot | Content |
|------|---------|
| default | the body |
| `header` | replaces the title (another heading level, a title with a Badge) |
| `actions` | Buttons right of the title |
| `footer` | below a divider, right-aligned: usually Buttons |

## Agent

A card is a region, not a control. Its actions are Buttons in the `actions` or `footer` slot and
carry `data-action` like everywhere else (D23). A link card is followed by its href.

## Gotchas

- The title is always an `h2`. Under a card that is itself inside an `h2` section, pass the
  heading through the `header` slot at the right level.
- `interactive` without `to` only styles. A click handler on a `div` is not reachable by
  keyboard, so the same action must also be a real control inside the card (a Button or a link in
  the title); the card click is a convenience on top.
- With `to`, the whole card is one link: no Buttons or links inside it (nested interactive
  content is invalid and unreachable). Put them on a non-link card instead.
- `overflow: hidden` clips the body to the radius; a popover or menu opened from inside escapes
  only through the top layer (`popover`, `<dialog>`), which is the native way anyway.
