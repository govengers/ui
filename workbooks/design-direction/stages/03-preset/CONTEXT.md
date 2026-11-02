# Stage 03: preset

## Input
The chosen direction; `ui/tokens.css`; `ui/presets/*.css`.

## Process
1. Pick the closest shipped preset (`neutral`, `paper`, `slate`). If the direction fits it
   unchanged: done, name it.
2. Else copy it to `src/ui/presets/<name>.css` in the project and override tokens only (D6):
   surfaces, ink, accent and its soft pair, radius, shadows, fonts (self-hosted woff2 named in
   the contract, system stack otherwise). A look that no token can express is a request for a
   token in this repository (`maintain-collection`), not a component fork.
3. Measure: from a temporary directory holding `ui/tokens.css` and `ui/presets/<name>.css`,
   `bun <source>/scripts/contrast.ts`; fix every failing pair in both themes before going on.
4. Render the shell and one `Button`, `Input`, `Table` demo with the preset enabled (the demo
   app's preset link, or the project's shell) and look at light and dark.

## Output
```
preset: <name> (shipped | copied from <base>), file <path>
overrides: <n> tokens
contrast: <n>/<n> pairs
```

## Completion
Proceed to `04-contract`.
