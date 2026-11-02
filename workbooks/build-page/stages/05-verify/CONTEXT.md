# Stage 05: verify

## Input
The page in the project.

## Process
1. `just ui-lint` (page rules UL-010 to UL-012 included) and `bunx vue-tsc --noEmit`: clean.
2. Dev server; four screenshots: 1280 px light, 1280 px dark, 390 px light, 390 px dark. Look
   at each: header, states, no overflow, the bottom tabs on the phone width.
3. One keyboard pass: Tab reaches every control in reading order, focus visible, Escape closes
   every overlay, Enter submits the form from a field.
4. Sibling comparison: open the previous page of the product next to this one; same header
   height, card radius, button sizes, table density, spacing rhythm. Any difference not explained
   by tokens is a defect in this page.
5. Run the page's main flow once (create, save, transition) and watch the push render it.

## Output
```
ui-lint: clean   vue-tsc: clean
screens: 4 looked at: <findings|none>   keyboard: <ok|gaps>   sibling: <same|differences>
flow: <what ran, what the push showed>
```

## Completion
Report the route, the recipe (or exception), the descriptors, the actions registered and what
was looked at. Then proceed to `06-learn`.
