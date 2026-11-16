---
date: 16.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 3 h
groomed: no
---

## Task
Sync the collection with the libraries: re-vendor the livewire runtime and drop the SearchTable,
Board and FileUpload workarounds, JobProgress on govengers/jobs' view, LoginPage `change`
optional, the starter shell with the product pieces, the impersonation end from govengers/auth.

## What went wrong on first try
- `bun test pages/...` mounting a piece with a `Button :to` -> vue-router threw `history is not
  defined` during its first navigation, and the error cascaded into every later test of the file
  as a vue-i18n compile error -> `setup.ts` exposes jsdom's `history`, `mount.ts` installs a
  memory router (D79).
- `scripts/template-check.ts` copied `templates/project/changelog/*.md` through the copy filter
  that skips every `.md` -> the starter changelog was silently absent and its parse check passed
  on nothing -> the copy takes a filter argument and the check also fails on zero lines.
- The FileUpload mounted test passed with the duplicate-hiding switched off: under the fake's
  latency 0 the row's push and the upload's answer render in one tick -> the test delays the
  answer three turns behind the push, as a network does.

## Instructions that were wrong or missing
- workbooks/maintain-collection/stages/04-gates: `bun test scripts ui demo/src` left `pages`
  out, so recipe tests would never run (fixed now: yes, also justfile, package.json, CI).
- ui/session.md and ImpersonationBanner.md said govengers/auth does not answer the end (fixed
  now: yes, auth D70).

## Questions I had to ask the human
- none

## Pieces that did not fit
- JobProgress: govengers/jobs' view has no `resultRoute`; the result is the handler's JSON and
  only on the item read. Replaced by a `resultRoute(result, job)` prop and a `result` slot (D75).

## Gate friction
- vue-tsc type-checks `scripts/**`, so a fixture meant for the scaffolded target fails here;
  excluded `scripts/fixtures` in tsconfig.

## Time sinks
- Making the FileUpload race reproducible in a mounted test.

## Suggested improvements (for grooming)
- script: template-check could run the starter's App.vue in jsdom with the fake engine to prove
  the shell mounts, not only type-checks.
- workbook start-project 05-verify: name the product pieces' server routes in the browser check.
