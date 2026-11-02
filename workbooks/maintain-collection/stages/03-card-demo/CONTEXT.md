# Stage 03: card and demo

## Input
The built files; `knowledge/laws-of-ux/README.md`.

## Process
1. `<Name>.md` front matter: `name`, `tier`, `intent` (words a user would say), `uses` (every
   piece and module the code imports), `livewire`, `status`, `laws` (the law slugs the piece
   embodies, 0-4). Body in this order: one-paragraph summary; `## Load` (what to read to use or
   change it: this card, the code file(s), the cards of `uses`, the tokens it reads; and what
   not to load: the demo, the tests, other pieces); Props; Slots; Events; "With livewire" for a
   block; Agent (the attributes and names the driver uses); Gotchas (what bit a builder).
2. `<Name>.demo.vue`: a `<section>` with an `<h2>` per state (default, variants, sizes, loading,
   error, empty, disabled); overlays also render a static open example; a block runs against
   `demo/src/fake/api.ts` and shows real pushes (`engine.store.tick()`); keep it under 900 px
   tall or split sections across the page.
3. A pattern or knowledge note: front matter as its directory's README says; under 80 lines.

## Output
```
card: <path> (laws: <slugs>)   demo: <path> (<n> sections)
```

## Completion
Proceed to `04-gates`.
