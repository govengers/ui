# design-direction (L1)

From a product brief to a design direction, a preset and the sentences of the contract (D1,
P3): the "design language first" step of a full `start-project`, or a later re-direction of a
project. Produces words and tokens, never pages. Uses the Laws of UX knowledge base to argue
the direction and the impeccable skill's artefacts when the human wants them, without depending
on either.

## Load

| Resource | When | Why |
|----------|------|-----|
| `stages/<current>/CONTEXT.md` | always | contract |
| `workbooks/_shared/learn/CONTEXT.md` | last stage | the run report contract |
| `MANIFESTO.md` P3, P4, P6 | stage 01 | what a direction must respect |
| `knowledge/laws-of-ux/README.md`, then the laws the brief touches | stage 02 | the arguments |
| `ui/tokens.css`, `ui/presets/*.css` | stage 03 | what a preset may change |
| `scripts/contrast.ts` | stage 03 | the measurement |
| `templates/project/DESIGN.md` | stage 04 | the contract's shape |

## Do not load

| Resource | Why |
|----------|-----|
| component cards and code | a direction is tokens and sentences, not components |
| `pages/`, `patterns/` | pages come after the contract |
| the impeccable skill's full reference | only its direction step, when the human asks for it |

## Stages

1. `01-brief`: product, audience, tone, three adjectives, what the user must never feel
2. `02-direction`: the direction in sentences, argued with the laws, two candidates at most
3. `03-preset`: a shipped preset or a copy with token overrides, measured
4. `04-contract`: the sentences and the preset into `DESIGN.md`'s Direction and Preset sections
5. `05-learn`: mandatory run report
