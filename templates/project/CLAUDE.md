
## UI

This project's frontend is built from govengers/ui copies (no Quasar, no Tailwind, no component
library). Before any UI work:

1. Read `DESIGN.md` (the design contract) and `src/ui/INDEX.md` (what is already copied).
2. A new page: use the `ui-page` skill (recipe first, exception in `DESIGN.md` otherwise).
3. A missing component: use the `ui-copy` skill; only write one yourself if govengers/ui has
   none, then put it in `src/ui/<Name>/` in the same style and add it to `src/ui/INDEX.md`.
4. Styles: scoped CSS with `var(--ui-*)` tokens only; `just ui-lint` fails on hex colours, raw
   px, font-family, pages without `Page`/`PageHeader`/`data-page`, mutating buttons without
   `data-action`.
5. Data: livewire through the generated client in `src/api/`; blocks take descriptors as props.
   Loading is `!error && loading`; live errors branch on `error.code`.
6. Strings: `messages.ts` per page folder; component strings under `ui.*` in `src/ui/messages.ts`.
7. Review UI changes with the `ui-review` skill before a PR.
