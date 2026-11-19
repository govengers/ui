# Stage 03: contract and laws

## Input
The scope block; the recipe cards; a sibling page; the laws the recipe cards name.

## Process
1. Contract: every page follows its recipe or has an exception in `DESIGN.md`; neither is a
   BLOCKER. Compare with a sibling page: header, spacing, card radius, button sizes, table
   density; a deviation not explained by tokens is MAJOR.
2. Pieces written in the project: D41 to D44 and D49 followed (attributes for variants, scoped
   CSS with tokens, typed props with `| undefined`, named slots, strings via props or `ui.*`);
   a piece that duplicates one in `<source>/INDEX.md` is MAJOR with the piece named.
3. Accessibility floor (D9): every control has a name; focus visible; 44 px targets on touch;
   dialogs native or trapped with Escape; tables captioned; colour never the only signal;
   reduced motion respected. Missing: MAJOR.
4. Livewire gotchas at every `useLive`/`useLiveList` site: `!error && loading`; branch on
   `error.code`; one failure and one retry per screen; no local upsert after own writes; cursor
   histories tiled with live pages; identity change ends the pair first. Each miss MAJOR.
5. Agent surface (D23): `data-page` on the root, `data-action` equal to the call name on
   mutating buttons, `name` on fields, `actions.ts` present and bound. MINOR without agent
   features, MAJOR with.
6. Words: a button starts with a specific verb and names the outcome ("Delete file", not "Yes"
   or "OK"; WCAG 2.2 SC 2.4.6; NN/g, "Confirmation Dialogs Can Prevent User Errors"). An error
   says what failed and gives the next step, or sits beside a Retry; "Invalid", "Failed" or
   "Error" alone is a miss (WCAG 2.2 SC 3.3.1 and 3.3.3; NN/g, "Error-Message Guidelines"). An
   empty state says which case it is (nothing yet, nothing matches the filter) and offers its
   action (NN/g, "Designing Empty States in Complex Applications: 3 Guidelines"). MINOR.
7. i18n: user strings only in `messages.ts` or `ui.*`; both locales present. MINOR.
8. Laws: for each law the recipe card names, ask its "Review questions" of the page; a clear
   miss (a 32 px primary target on a phone page, nine equal actions in a header, no feedback
   within 400 ms on a save) is MAJOR, a judgement call MINOR, citing the law file.

## Output
```
| path:line | SEVERITY | rule or decision or law | sentence | fix: sentence |
```

## Completion
Proceed to `04-verdict`.
