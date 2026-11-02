---
name: AgentCursor
tier: primitive
intent: [drive mode, agent cursor, visible automation, agent clicks for me, do it for me, autopilot, replay steps]
uses: [Spotlight, agent]
livewire: false
status: ready
---

# AgentCursor

Drive mode made visible (D25, D27): a pointer moves to each target of a `DrivePlan` at human
pace, the Spotlight says what it does, clicks are real `click()`s and values are typed character
by character. The submit of a mutating action pauses on its button until the user clicks it or
presses Go. Any press or key outside the agent's own UI stops the plan: the user took over.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `plan` | `DrivePlan \| null` | required | a new plan starts at step 1; `null` stops |
| `speed` | `number` | `1` | 1 is human pace: 350 ms per move, 40 ms per character, 500 ms before a click |
| `unattended` | `string[]` | none | mutating actions whose click runs without a pause, from `DESIGN.md` (D27) |

## Slots

None.

## Events

| Event | Payload | When |
|-------|---------|------|
| `step` | `index` | a step starts |
| `navigate` | `path` | a `navigate` step; push the route (`router.push`) |
| `done` | none | the last step went through |
| `stopped` | `index` | `stop()`, the close button, Escape, or user input outside `[data-agent-ui]` |
| `error` | `message` | a target was still missing after 2 s |

## Exposed

`stop()` and `resume()` (runs the plan again from the step it was stopped at).

## Steps

| Kind | What the cursor does |
|------|----------------------|
| `navigate` | emits `navigate`, waits a frame; the next target gets 2 s to render |
| `spotlight` | points and shows `say` for 1.5 s |
| `click` | points, waits, clicks; on an action, pauses first unless it is bound as not mutating or unattended (below) |
| `fill` | points, focuses, types with an `input` event per character; a `<select>` gets its whole value and `change` |
| `pause` | points and waits for the user: a click on the target, or Go |

## Agent

The step engine is `cursor.ts` (`createDriver`): plain async code with injected effects,
tested without a DOM. The pause rule (D27, D52): a `click` on `{ action }` pauses unless the
page bound the action with `useAgentAction` and declared it not mutating, or the action is in
`unattended`. An action no page bound counts as mutating. A click by the user on the paused
target counts as Go and is not repeated.
Plans come from the server-side agent on the message (D26, D28); the cursor only executes them.

## Messages

`ui.go`, `ui.stepOf`, `ui.confirmStep` (the pause text when a paused click has no `say`).

## Gotchas

- Mark everything that belongs to the agent with `data-agent-ui` (AgentDock does it for itself,
  Spotlight for its bubble); any other control the user presses stops the plan.
- An action no page bound pauses like a mutating one: bind the page's actions with
  `useAgentAction` (`mutating: false` for a filter or a sort) so drive runs them freely.
- Only `{ action }` targets follow the pause rule; a `click` on `{ selector }` or `{ field }`
  never pauses, so a plan must name a submit by its action.
- Typing sets `value` and fires `input`: Vue's `v-model` follows, a component that listens only
  to `keydown` does not.
- Under reduced motion the pointer jumps instead of gliding; the pace stays the same.
