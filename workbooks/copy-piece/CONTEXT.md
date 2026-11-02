# copy-piece (L1)

Bring one or more pieces (component, block, page recipe, module) with their `uses` closure into
a project (D10, D11, D39), stamp the provenance, merge messages, wire the livewire imports,
update the project's index. Also upgrades an existing copy against the source commit. The copy
is the project's own afterwards (P1).

## Load

| Resource | When | Why |
|----------|------|-----|
| `stages/<current>/CONTEXT.md` | always | contract |
| `workbooks/_shared/learn/CONTEXT.md` | last stage | the run report contract |
| `<source>/INDEX.md` | stage 01 | find pieces by intent, read `uses` |
| the card of every piece in the closure | stage 01 | `uses`, messages, livewire props, gotchas |
| the project's `DESIGN.md`, `src/ui/INDEX.md` | stage 01 | what is already there, which preset |
| `<source>/ui/messages.ts` and the project's `src/ui/messages.ts` | stage 03 | key merge |
| the project's generated client path (`src/api/`) | stage 03 | blocks import `@/api/runtime` and `@/api/vue` |

## Do not load

| Resource | Why |
|----------|-----|
| `.demo.vue`, `*.test.ts` of the pieces | not copied, not needed to copy |
| pieces outside the closure | one copy per need; browsing invites unrequested pieces |
| `demo/src/fake/*` | the fake engine never leaves this repository |

## Stages

1. `01-resolve`: names to pieces, the closure, what exists already and at which commit
2. `02-copy`: directories minus cards, demos and tests; header line; single-file modules
3. `03-wire`: messages, livewire import paths, the project's index line
4. `04-verify`: type-check, lint, first use in the browser for a block or page
5. `05-learn`: mandatory run report
