# build-page (L1)

One new page from a recipe, against the project's design contract (D12, D23, D32, D48): pick the
recipe or write the exception, copy what is missing, compose blocks with the entity's config,
wire livewire through props, the four states, the agent surface, then look at it light, dark and
on a phone width. Every page of the product goes through this; a page that looks different from
the one before it is a defect (P3).

## Load

| Resource | When | Why |
|----------|------|-----|
| `stages/<current>/CONTEXT.md` | always | contract |
| `workbooks/_shared/learn/CONTEXT.md` | last stage | the run report contract |
| the project's `DESIGN.md`, `src/ui/INDEX.md` | stage 01 | the contract, what exists |
| the recipe's card (`pages/<Recipe>/<Recipe>.md`) and the matching `patterns/` guide | stage 01 | shape and reasons |
| `knowledge/laws-of-ux/README.md`, the laws the recipe's card names | stage 03 | the design floor |
| the cards of the blocks the recipe composes | stage 03 | props, slots, livewire props, gotchas |
| the project's generated client (`src/api/api.ts`) | stage 03 | the descriptors |
| `patterns/showing-live-data.md` | stage 04 | the four states, the gotchas |
| `ui/agent/agent.md` | stage 04 | actions and binding |
| `workbooks/copy-piece/` | stage 02 | copying what is missing |

## Do not load

| Resource | Why |
|----------|-----|
| other recipes and their blocks | one recipe per page; mixing recipes is the creep this prevents |
| `ui/tokens.css`, presets | a page changes no token; a look that needs one is a `DESIGN.md` decision |
| `demo/` | the fake engine is not the project's data |

## Stages

1. `01-recipe`: `<area>.<page>`, the recipe or the written exception
2. `02-pieces`: the recipe and its closure present in the project (`copy-piece`)
3. `03-compose`: files from the recipe, the entity config, the messages, the route
4. `04-states-agent`: loading, error, empty, stale; `data-page`, `data-action`, `name`; `actions.ts`
5. `05-verify`: lint, type-check, four screenshots, one keyboard pass, the sibling comparison
6. `06-learn`: mandatory run report
