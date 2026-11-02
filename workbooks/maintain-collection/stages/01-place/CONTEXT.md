# Stage 01: place

## Input
The request: a new piece, a change to one, a token, a preset, a message, a pattern, a note.

## Process
1. `INDEX.md` "By intent": a piece that answers the intent already is extended, not duplicated
   (P2, one way per job).
2. Tier and directory: primitive or layout `ui/<Name>/`, block `ui/blocks/<Name>/`, recipe
   `pages/<Name>/`, module `ui/<name>.ts` with `ui/<name>.md`, pattern `patterns/<slug>.md`,
   knowledge `knowledge/<area>/<slug>.md`.
3. Tokens: never rename or remove (projects copied them); add, keep the old as an alias with a
   comment and a decision. Presets change tokens only (D6). Messages: a key in `en` and `de`.
   Icons: paste the Lucide path (D43). A new dependency needs a decision line (D3).
4. Name the decisions that apply (D41, D42, D44, D49 for a piece; D6, D36 for tokens; D5, D50 for
   a block's livewire wiring) and whether this change needs a new decision.

## Output
```
kind: piece | token | preset | message | pattern | knowledge
target: <path>   extends: <Name|none>
decisions: <Dnn...>   new decision needed: <yes: why|no>
```

## Completion
Proceed to `02-build`.
