# Stage 01: preflight

## Input
The human's request (project path, `--quick` or `--full`; quick when unspecified and the human
wants to get going).

## Process
1. Source: `$GOVENGERS_UI`, else `~/github.com/govengers/ui`, else
   `git clone --depth 1 https://github.com/govengers/ui` into a temporary directory. Record
   `git -C <source> rev-parse --short HEAD`.
2. Target: the project root with `package.json`, `src/`, Vite with `@` resolving to `src`. No
   frontend yet: `bun create vite ui --template vue-ts`, then that directory is the target.
3. Already set up (a `DESIGN.md` or `src/ui/tokens.css` exists): stop, tell the human, point at
   `copy-piece` and `build-page`.
4. Note the project's generated livewire client path (`src/api/` from `generate.Write`) or its
   absence; blocks need it, the shell does not.

## Output
```
source: <path> @ <commit>
target: <path>, vite: <yes|no>, @ -> src: <yes|no>, livewire client: <path|none>
mode: quick | full
```

## Completion
Proceed to `02-foundation`.
