# Stage 02: copy

## Input
The closure from `01-resolve`.

## Process
1. For each `copy`: copy the directory to `src/ui/<Name>/` (block: `src/ui/blocks/<Name>/`,
   page: `src/pages/<Name>/`), leaving out `*.md`, `*.demo.vue`, `*.test.ts`. A card without a
   directory (`format`, `theme`, `agent`) names a single file or module directory under `ui/`:
   copy that file or directory.
2. Prepend the header line: `<!-- govengers/ui <Name> @ <commit> -->` as the first line of a
   `.vue` file, `// govengers/ui <Name> @ <commit>` in a `.ts` or `.css` file.
3. Keep the directory structure: relative imports between pieces depend on it (D39). Never
   flatten.
4. For each `upgrade`: `git -C <source> diff <old>..HEAD -- <dir>`; apply the hunks by hand onto
   the project's copy (it may carry local changes); update the header to the new commit. Never
   overwrite a copy blindly.

## Output
```
copied: <Name...>   upgraded: <Name (old -> new, hunks applied)...>
```

## Completion
Proceed to `03-wire`.
