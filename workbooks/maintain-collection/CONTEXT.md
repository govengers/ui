# maintain-collection (L1)

Add or change a piece, token, preset, message, pattern or knowledge note in THIS repository
without drifting (D10, D41 to D46, D49). Every piece has a card, a demo and screenshots; the
index is generated; contrast is measured. Runs inside the govengers/ui checkout only.

## Load

| Resource | When | Why |
|----------|------|-----|
| `stages/<current>/CONTEXT.md` | always | contract |
| `workbooks/_shared/learn/CONTEXT.md` | last stage | the run report contract |
| `INDEX.md` | stage 01 | does a piece answer the intent already |
| `docs/design.md` D37 to D52 | stage 01 | the conventions |
| the closest existing piece (card, code, demo) | stage 02 | the pattern to copy |
| `ui/tokens.css`, `ui/messages.ts`, `ui/Icon/icons.ts` | stage 02 | the only tokens, keys and icons |
| `demo/src/fake/api.ts` | stage 02, blocks only | the demo's descriptors |
| `scripts/*.ts` | stage 04 | the gates |
| `knowledge/laws-of-ux/README.md` | stage 03 | which laws the card should name |

## Do not load

| Resource | Why |
|----------|-----|
| `pages/` when building a primitive or block | a piece does not know its pages |
| `templates/`, `skills/` | project-side files; a convention change there is its own task |
| `screenshots/*.png` of other pieces | re-rendered only for what changed |

## Stages

1. `01-place`: tier, name, directory, what it replaces or extends, which decisions apply
2. `02-build`: the `.vue` and `.ts` files in the conventions, with a test for logic with branches
3. `03-card-demo`: the card with Load table and laws, the demo with a section per state
4. `04-gates`: check, lint, contrast, index, screenshots, tests, README table, a decision when a convention changed
5. `05-learn`: mandatory run report
