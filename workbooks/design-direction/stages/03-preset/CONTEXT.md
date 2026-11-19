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
   A self-hosted font gets an `@font-face` rule with `font-display: swap`: text shows in the
   fallback at once instead of staying invisible for a block period (MDN, `font-display`).
   Check it in a browser profile without the font installed, because an installed copy hides a
   missing or misnamed rule (MDN, `font-family`). Check its digits for tabular figures: `base.css`
   sets `font-variant-numeric: tabular-nums`, which works only when the font has them, else
   columns of numbers do not line up (MDN, `font-variant-numeric`).
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
