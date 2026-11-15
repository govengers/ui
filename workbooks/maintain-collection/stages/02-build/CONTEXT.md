# Stage 02: build

## Input
The place block; the closest existing piece as the pattern.

## Process
1. `<Name>.vue`: `<script setup lang="ts">` with a two-line comment saying what it is; typed
   props with `withDefaults`, every optional `x?: T | undefined`, booleans default false (D44,
   D49); typed emits; named slots; root class `ui-<name>`, parts `ui-<name>__part`, variants
   `data-variant`, sizes `data-size` (D41); `<style scoped>` with `var(--ui-*)` only, hairlines
   0, 1px, 2px (D42); native element first (D9); attributes land on the native control
   (`inheritAttrs: false` where there is a wrapper); under about 200 lines or split into a
   sibling file.
2. A block: imports only from `@/api/runtime` and `@/api/vue`; descriptors as props (D5);
   descriptors kept in `shallowReactive`/`shallowRef`; loading is `!error && loading`.
3. Logic with branches (a model, a parser, a step engine) in a `.ts` next to the component with
   a bun test; the component stays a view. Behaviour a user meets through events (focus after an
   action, keyboard paths, emitted events, storage, an identity switch) gets a
   `<Name>.mounted.test.ts` on `scripts/test/mount.ts` (D59); layout and scrolling stay with a
   local browser probe.
4. Strings via `ui.*` keys; icons from `icons.ts`; `data-action` passes through on mutating controls.

## Output
```
files: <paths>   lines: <per file>
tests: <file: n cases|none needed>
```

## Completion
Proceed to `03-card-demo`.
