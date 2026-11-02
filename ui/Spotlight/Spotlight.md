---
name: Spotlight
tier: primitive
intent: [spotlight, guide mode, show me where to click, product tour, onboarding tour, coach mark, highlight element, walkthrough]
uses: [Button, Icon, agent]
livewire: false
status: ready
laws: []
---

# Spotlight

Guide mode's "click here" (D25): a scrim with a cutout and an accent ring around one element, and
a bubble beside it with the text, "Step x of n", Back, Next and a close button. The overlay lets
every click through, so the user clicks the real control; only the bubble takes input.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Spotlight.vue`, `spotlight.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Button`, `Icon`, `agent` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Spotlight.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `target` | `DriveTarget \| null` | required | `{ action }`, `{ field }`, `{ page }` or `{ selector }`, resolved with `resolveTarget`; `null` hides the spotlight |
| `text` | `string` | required | the bubble's text; empty shows only the buttons |
| `step` | `number` | none | with `total`: "Step {step} of {total}" |
| `total` | `number` | none | |
| `canBack` | `boolean` | `false` | shows Back |
| `canNext` | `boolean` | `false` | shows the primary button |
| `nextLabel` | `string` | `ui.next` | pass `ui.done` on the last step, `ui.go` on a drive pause |

## Slots

None.

## Events

| Event | Payload | When |
|-------|---------|------|
| `next` | none | the primary button |
| `back` | none | Back |
| `close` | none | the close button or Escape anywhere on the page |

## Exposed

`focus()` moves focus to the primary button (else the bubble); `AgentCursor` calls it when a
drive plan pauses, so Enter presses Go.

## Agent

The bubble carries `data-agent-ui`, so a running `AgentCursor` does not treat a press on it as the
user taking over. A guide plan's stops are the non-`navigate` steps of a `DrivePlan`; `AgentDock`
walks them with this component (D28: plans come from the agent, never hand-written tours). The
bubble is a non-modal `role="dialog"` named by its text, which is `aria-live="polite"`, so a
screen reader reads each step.

## Messages

`ui.stepOf`, `ui.back`, `ui.next`, `ui.close`.

## Gotchas

- A target that is not on the page shows the bubble centred with no cutout; the spotlight keeps
  looking every frame, so it appears once the element renders (after a navigation).
- The target resolves with `resolveTarget`: the first visible match, so a row menu's hidden
  item or a closed dialog's button is skipped. Visible is not on top: an element behind an open
  modal's backdrop still counts, and two visible matches point at the first in the DOM.
- It takes focus when it appears and gives it back when it hides, but only if focus is still in
  the bubble; a click on the target keeps focus where the user put it.
- Rendered into `<body>` through `Teleport` with `--ui-z-agent`, above dialogs and sheets.
