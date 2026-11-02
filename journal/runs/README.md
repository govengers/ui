# Run reports

One file per workbook run, written by the mandatory `learn` stage (`workbooks/_shared/learn/CONTEXT.md`).
Consumed by the `groom` workbook, which compiles them into workbook, card, knowledge and skill
changes and then sets `groomed: <date>` in the header. Never delete reports.

File name: `<yyyy-mm-dd>-<workbook>-<slug>.md`. Template:

```markdown
---
date: dd.MM.yyyy
workbook: start-project | design-direction | copy-piece | build-page | review-ui | maintain-collection | none
project: <repo or "govengers/ui">
outcome: done | partial | aborted | handed-over
duration: <approx, e.g. 25 min>
groomed: no
---

## Task
<one line>

## What went wrong on first try
- <exact step or command> -> <what happened> -> <what worked instead>

## Instructions that were wrong or missing
- <file>#<section>: <what it said> / <what is true>   (fixed now: yes|no)

## Questions I had to ask the human
- <question> -> <answer; if it belongs in the repo, where it went>

## Pieces that did not fit
- <piece>: <what the page needed that the card or code did not give>

## Gate friction
- <ui-lint, vue-tsc, contrast, screenshots: what failed and why>

## Time sinks
- <what cost the most time and why>

## Suggested improvements (for grooming)
- <workbook|card|knowledge|skill|script>: <concrete change>
```
