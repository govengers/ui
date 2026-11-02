---
name: agent
tier: primitive
intent: [agent actions, action registry, app map, drive plan, drive step, agent surface]
uses: []
livewire: false
status: ready
laws: [mental-model]
---

# agent

The agent surface of an application (D23, D24, D48): `types.ts` (AgentAction, AgentPage,
AppMap, DriveTarget, DriveStep, DrivePlan, `selectorOf`) and `registry.ts` (`useAgentAction`,
`boundActions`, `findAction`). A module, not a component: `ui-copy` copies the directory as is.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `registry.ts`, `types.ts` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `agent.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Use

- A page folder exports `actions.ts` with its `AgentAction[]`; the page binds handlers with
  `useAgentAction(action, run)` while mounted.
- `Spotlight`, `AgentCursor` and `AgentDock` resolve targets with `selectorOf`.
- The project's `scripts/app-map.ts` (from `templates/project/`) imports every `actions.ts`.

## Gotchas

- Names equal livewire call names. A page that invents another name breaks the shared
  vocabulary of chat, driver and server tools.
