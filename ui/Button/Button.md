---
name: Button
tier: primitive
intent: [button, action, submit, primary action, icon button, link button, loading button]
uses: [Icon]
livewire: false
status: ready
laws: [aesthetic-usability-effect, cognitive-load, doherty-threshold, fittss-law, hicks-law, law-of-similarity, occams-razor, von-restorff-effect]
---

# Button

The one button. Four variants, three sizes, a loading state, and it becomes a router link or an
anchor when given `to` or `href`.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Button.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Icon` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Button.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `primary \| secondary \| ghost \| danger` | `secondary` | one `primary` per view, `danger` only for destructive actions |
| `size` | `sm \| md \| lg` | `md` | |
| `type` | `button \| submit \| reset` | `button` | only on the `<button>` form |
| `disabled` | `boolean` | `false` | |
| `loading` | `boolean` | `false` | shows a spinner instead of the icon, sets `aria-busy`, blocks clicks |
| `block` | `boolean` | `false` | full width |
| `label` | `string` | none | required for an icon-only button (accessible name) |
| `to` | `RouteLocationRaw` | none | renders a `RouterLink` |
| `href` | `string` | none | renders an `<a>` |

## Slots

| Slot | Content |
|------|---------|
| default | the label |
| `icon` | a leading `Icon` |

## Agent

Every button that mutates data carries `data-action="<livewire call name>"` (D23); the attribute
falls through to the root element. Navigation buttons use `to`, which the driver follows by href.

## Gotchas

- An icon-only button without `label` has no accessible name; `ui-lint` does not catch this yet,
  the axe pass does.
- `disabled` on a link is `aria-disabled`, not the attribute: links cannot be disabled natively.
