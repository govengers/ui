---
name: Tooltip
tier: primitive
intent: [tooltip, hint, hover hint, help on hover, show the name of an icon button, describe a button, hover text]
uses: [Popover]
livewire: false
status: ready
laws: [paradox-of-the-active-user, law-of-proximity]
---

# Tooltip

One plain sentence next to its trigger: after a short delay when a mouse or pen hovers it, at once
on keyboard focus. Shown by focus it stays until blur or Escape; shown by hover it stays while the
pointer is on the trigger or the panel and leaves shortly after the pointer left both. Any press
on the trigger, by pointer or by key, hides it. It wraps one element, or sits inside its trigger.
Touch shows nothing, so a tooltip never carries what the user needs.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Tooltip.vue`, `tooltip.ts` | to use it: skim; to change it: read | the behaviour, the delay and grace |
| `ui/Popover/place.ts` | only when changing where the panel goes | the placement, shared with Popover |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Tooltip.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| `Popover.vue`, other pieces | Tooltip imports only `place.ts` from Popover's directory |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `text` | `string` | required | one plain sentence; no markup, no links |
| `kind` | `description \| label` | `description` | `description`: while the panel shows, its id joins the trigger's `aria-describedby`. `label`: the trigger names itself (`aria-label` or text) and the panel is `aria-hidden` |
| `placement` | `auto \| bottom \| top \| end` | `auto` | as Popover's; `end` puts it beside the trigger at the inline end, centred on it (a rail), or at the inline start where only that has room |

## Slots

| Slot | Content |
|------|---------|
| default | one element, the trigger (the wrapper form); a `display: contents` element (a `Popover`) is looked through to its first element. Optional: without it the element the Tooltip sits in is the trigger (the inside form) |

```vue
<Tooltip text="Exports the rows that match the filters as a CSV file.">
  <Button>Export</Button>
</Tooltip>

<button type="button" aria-label="Bold"><Icon name="bold" /><Tooltip text="Bold" kind="label" /></button>
```

## Timing

`tooltip.ts` exports `tooltipDelay` (500 ms before a hovered tooltip shows) and `tooltipGrace`
(100 ms a tooltip survives after the pointer left trigger and panel, for a way out on the
diagonal). The gap between trigger and panel belongs to the panel, so a pointer of any speed
reaches it. After a pointer press on the trigger, hover shows nothing until the pointer left it.
While the trigger's own menu or popover is open (`aria-haspopup` with `aria-expanded="true"`, which
Popover's `expanded` binds) nothing shows, so no tooltip lies over the open panel.
Only one tooltip shows at a time: the one that shows hides the one before.

## Agent

A tooltip is never a target. The driver finds the trigger by its own name: an icon-only `Button`
keeps its `label` (D23, UL-013). The panel exists only while it shows.

## Gotchas

- Never put what the user needs into a tooltip: touch shows nothing and the panel exists only
  while shown (NN/g, "Tooltip Guidelines"). A field's help is Field's `hint`, always visible.
- No interactive content: the panel is plain text and the pointer passes over it on the way out.
  A link or a button belongs in a `Popover`.
- An icon-only Button keeps `label`: the label names the button, the tooltip only shows it.
- Wrapper form: the slot's first element is the trigger. Around a piece whose root is a wrapper
  (`Input`), `aria-describedby` lands on the wrapper, not the field. Around a text field it shows
  on every focus, a click included, because a text field always matches `:focus-visible`: a
  field's help is Field's `hint`.
- `class`, `id` and `data-*` on `<Tooltip>` land on its root, which has no box: put them on the
  trigger.
- Inside form: the Tooltip is a direct child of the trigger element, so it is for a piece that
  renders it in its own template (an icon-only button, a rail link). Put into a piece's slot it
  sits in the piece's inner element and keyboard focus never reaches it. The panel there is hidden
  from assistive technology, so its text never joins the trigger's name; `description` still
  reaches the trigger through `aria-describedby`.
- A disabled control takes no focus: its tooltip reaches mouse users only. Say why an action is
  unavailable next to it, not in a tooltip.
- It is `popover="manual"`: showing it closes no open Menu or Popover. Escape hides it and cancels
  the key's default, so a modal dialog or a popover under it stays for the next Escape; a piece
  that handles Escape in script still gets the key and can read `defaultPrevented`.
- A modal `Dialog` or `Sheet` focuses its first control while it opens; that focus shows no
  tooltip, so one Escape closes the dialog. Tab or Shift+Tab onto the control shows it.
- Inside a modal `Dialog` or `Sheet`, keep the Tooltip in the dialog's content, as with Popover:
  anything outside the open dialog is inert.
- The panel inverts the page: `--ui-ink` ground, `--ui-surface` text, in both themes (D106). It
  mostly sits on a Card, a Dialog or a Table, and on their surface ground it read as part of what
  it covers (1.00:1 against a card); the inverted pair sets it apart from any surface (11.89 to
  18.08:1) with one measured pair, enough for one plain sentence. Its border is the page's surface
  colour, an edge where it meets the top bar's chrome (which equals the ink in light themes), and
  forced colours draw it as a line.
