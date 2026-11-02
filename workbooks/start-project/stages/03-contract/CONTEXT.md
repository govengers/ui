# Stage 03: contract

## Input
`templates/project/DESIGN.md`; in full mode the direction block from `design-direction`.

## Process
1. Write `DESIGN.md` at the project root from the template.
   - quick: preset `neutral`, light and dark following the system, comfortable density, no
     overrides, shipped recipes listed, no exceptions, today's date in the decisions table. Ten
     lines of content, done.
   - full: the direction sentences, the preset (shipped or the custom one written under
     `src/ui/presets/<name>.css`, tokens only, D6), the font decision, the override list.
2. Rule 6 (drive-mode unattended submits) starts as `none`.
3. Name the pages the human already knows the product needs in the recipes table; unknown rows
   stay as placeholders.

## Output
```
DESIGN.md: written (<quick|full>), preset <name>, overrides <n>
```

## Completion
Proceed to `04-rules`.
