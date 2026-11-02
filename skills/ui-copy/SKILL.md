---
name: ui-copy
description: Copy one or more govengers/ui pieces (component, block, page recipe) with their `uses` closure into this project's src/ui/ (blocks into src/ui/blocks/, pages into src/pages/), stamp the provenance header, merge new ui.* messages, update src/ui/INDEX.md. Also upgrades an existing copy by diffing against the source commit. Use on "copy the Table", "I need a file upload", "add the FacetFilter", "update our Button from govengers/ui", "ui-copy".
---

# ui-copy

Copies pieces from govengers/ui into the project (D10, D11, D39). The copy is the project's own
afterwards.

## Inputs

- Names: one or more piece names (`Table`, `FacetFilter`, `ListPage`). Find candidates in
  `<source>/INDEX.md` by intent when the user names a need instead of a piece.
- Source checkout: `$GOVENGERS_UI`, else `~/github.com/govengers/ui`, else a shallow clone.
  Commit: `git -C <source> rev-parse --short HEAD`.
- The project must have been set up by `ui-start` (has `DESIGN.md` and `src/ui/tokens.css`).

## Steps

1. **Resolve the closure.** For each name, read its card (`<source>/ui/<Name>/<Name>.md`,
   `<source>/ui/blocks/<Name>/<Name>.md` or `<source>/pages/<Name>/<Name>.md`), take `uses`, and
   repeat until closed. Order: primitives first, then layout, blocks, pages.
2. **Skip or upgrade existing copies.** For each piece already in the project, read its header
   line `govengers/ui <Name> @ <commit>`. Same commit: skip. Older: show
   `git -C <source> diff <old>..HEAD -- <dir>` to the user and apply it by hand onto the project's
   copy (the copy may carry local changes; never overwrite blindly). Record the new commit in the
   header.
3. **Copy** the directory to `src/ui/<Name>/` (blocks: `src/ui/blocks/<Name>/`, pages:
   `src/pages/<Name>/`), leaving out `*.md`, `*.demo.vue`, `*.test.ts`. Prepend the header line:
   `<!-- govengers/ui <Name> @ <commit> -->` as the first line of a `.vue` file,
   `// govengers/ui <Name> @ <commit>` in a `.ts` file.
4. **Messages.** If the card lists `ui.*` keys (section "Messages") or the component calls
   `t('ui.…')`, make sure every key exists in the project's `src/ui/messages.ts` for every locale
   the project has; add missing ones from `<source>/ui/messages.ts`.
5. **Livewire imports.** A block imports `@/api/runtime` and `@/api/vue`. Check they resolve to
   the project's generated client (livewire `generate.Write` output). If the project writes the
   client elsewhere, rewrite those two import paths in the copy and say so in the report.
6. **Index.** Add or update the piece's line in `src/ui/INDEX.md`: `| Name | tier | commit |
   intent |`. Keep the file sorted by tier then name.
7. **Verify.** `vue-tsc --noEmit` and `just ui-lint` are clean. For a block or page, open its
   first use in the browser before calling it done.
8. **Report**: pieces copied (with commit), pieces skipped (already current), pieces upgraded
   (with the hunks applied), messages added, import rewrites.

## Do not

- Do not "improve" a piece while copying. Copy, then change it in the project in a separate
  commit, so the diff against upstream stays readable.
- Do not copy a page recipe without its blocks, or a block without its primitives.
- Do not flatten the directory structure: relative imports depend on it (D39).
