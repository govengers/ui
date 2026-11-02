---
name: ui-review
description: Review UI work in a project set up with govengers/ui - the design contract (DESIGN.md), the mechanical rules (ui-lint), the accessibility floor, measured contrast, the livewire screen gotchas and the agent attributes. Produces findings with severity and a verdict. Use on "review the UI", "review these pages", "ui review", "ui-review", or as the UI leg of a dual review.
---

# ui-review

Reads the changed `.vue` and `messages.ts` files (a PR, a branch, or `git diff <ref>`), checks
them against the contract, reports findings an agent can fix without asking.

## Steps

1. **Scope.** List changed files under `src/pages/`, `src/ui/`, `src/App.vue`, `src/main.ts`.
   Read `DESIGN.md`, `src/ui/INDEX.md`.
2. **Mechanical.** Run `just ui-lint` (or `bun scripts/ui-lint.ts src/ui src/pages`). Every
   finding is at least MAJOR. If the project changed tokens or presets, run the contrast script
   on them (see `ui-start` step 5) and report every failing pair as MAJOR.
3. **Contract.** For every page: the recipe it follows, or its exception in `DESIGN.md`. A page
   without either is a BLOCKER. Compare against a sibling page: header, spacing, card radius,
   button sizes, table density. Any deviation not explained by tokens is MAJOR.
4. **Components.** A component written in the project (not copied): does it follow D41 to D44
   (attributes for variants, scoped CSS with tokens, typed props, named slots, strings via
   props or `ui.*`)? Is there a govengers/ui piece it duplicates (check `<source>/INDEX.md`)?
   Duplicate: MAJOR with the piece named.
5. **Accessibility floor.** Every control has a name (label, `aria-label`, or visible text);
   focus visible; 44 px targets on phones; dialogs native or with focus trap and Escape; tables
   have a caption or labelled region; colour never the only signal (an edge or chip has text);
   `prefers-reduced-motion` respected. Missing: MAJOR.
6. **Livewire gotchas** (every `useLive`/`useLiveList` call site):
   - loading computed as `!error && loading` (a bare `stale && data === undefined` hides errors)
   - live errors branch on `error.code`, never on `status === 404`
   - a screen with several subscriptions exposes one failure and one retry
   - no local upsert after an own write; scroll-to-own-row by id when a push contains it
   - cursor-paged history tiled with live pages, not REST pages
   - identity change ends the pair before the session request
   Each miss is MAJOR.
7. **Agent surface.** Page root has `data-page`; mutating buttons have `data-action` equal to the
   call name; fields have `name`; actions registered with `useAgentAction` where the page
   mutates. Missing: MINOR in a page without agent features enabled, MAJOR otherwise.
8. **i18n.** User-facing strings only in `messages.ts` or `ui.*`; both locales present when the
   project has two. Missing: MINOR.

## Report

Findings first, most severe first, each as `path:line SEVERITY (rule or decision) sentence; fix:
sentence`. Then the verdict: APPROVE (no BLOCKER, no MAJOR) or REJECT with the count. Then at
most three lines of praise-free summary. Severity: BLOCKER breaks the contract or a user flow,
MAJOR must be fixed before merge, MINOR can follow.
