# review-ui (L1)

Review UI changes in a project against the design contract, the mechanical rules, the
accessibility floor, measured contrast, the livewire screen gotchas, the agent attributes and the
Laws of UX. Produces findings with severity and a verdict an agent can act on. The UI leg of a
dual review, or a review on its own.

## Load

| Resource | When | Why |
|----------|------|-----|
| `stages/<current>/CONTEXT.md` | always | contract |
| `workbooks/_shared/learn/CONTEXT.md` | last stage | the run report contract |
| the diff (PR, branch, or since a ref), limited to `src/pages/`, `src/ui/`, `src/App.vue`, `src/main.ts`, `messages.ts` | stage 01 | the scope |
| the project's `DESIGN.md`, `src/ui/INDEX.md` | stage 01 | the contract, what exists |
| `scripts/ui-lint.ts` output, `scripts/contrast.ts` when tokens changed | stage 02 | the mechanical facts |
| the recipe card of each changed page; a sibling page | stage 03 | the comparison |
| `knowledge/laws-of-ux/README.md` and the laws the recipe card names | stage 03 | the review questions |
| `patterns/showing-live-data.md` | stage 03 | the livewire gotchas |
| `<source>/INDEX.md` | stage 03 | duplicates of pieces that exist in the collection |

## Do not load

| Resource | Why |
|----------|-----|
| the whole `src/` tree | review the diff and what it touches, not the product |
| backend code | the review is UI; a missing descriptor is reported, not fixed |
| `demo/` | not the project's data |

## Stages

1. `01-scope`: the changed files, the pages and pieces they belong to
2. `02-mechanical`: `ui-lint`, type-check, contrast when tokens changed
3. `03-contract-and-laws`: recipe or exception, sibling comparison, pieces, accessibility floor, livewire gotchas, agent surface, i18n, the laws' review questions
4. `04-verdict`: findings by severity, APPROVE or REJECT
5. `05-learn`: mandatory run report
