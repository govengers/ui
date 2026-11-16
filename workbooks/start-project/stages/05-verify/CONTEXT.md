# Stage 05: verify

## Input
The project after `04-rules`.

## Process
1. `bunx vue-tsc --noEmit`, `just ui-lint` and `just app-map`: all clean.
2. Start the backend and the dev server (`BACKEND_URL` when the backend is not on :8080); `/`
   lands on `/login?redirect=/`; sign in (dev login or a seeded user) and land on Home.
   Screenshot the shell at 1280 px and 390 px, light and dark (Playwright or the `run` skill);
   look at the four images: chrome bar, navigation, an empty page column, no console errors.
3. Full mode: run `scripts/contrast.ts` from a temporary directory holding `ui/tokens.css` and
   `ui/presets/<name>.css` (the script reads `ui/` of its cwd); every pair passes.

## Output
```
vue-tsc: clean   ui-lint: clean   contrast: <n>/<n> (full mode)
screens: 4 looked at, <findings|none>
```

## Completion
Report to the human in one message: what was copied (count, commit), the preset, where
`DESIGN.md` and `docs/ui/` are, and the one rule to remember: a new page picks a recipe or gets
an exception in `DESIGN.md`. Then proceed to `06-learn`.
