# Stage: learn (shared, mandatory last stage of every workbook)

The run is not finished until this stage has written its report. It captures the friction of
every run in one place so `groom` can turn it into better workbooks, cards and skills instead of
the same guess being made again next time.

## Input
Everything that happened in this run: wrong or missing instructions, a card that did not say what
the code does, a gate that failed for an unclear reason, questions you had to ask, detours, the
things that finally worked.

## Process
1. Write `journal/runs/<yyyy-mm-dd>-<workbook>-<slug>.md` from the template in
   `journal/runs/README.md` (in a target project: `docs/ui/journal/runs/`). Every section, even
   when the answer is "none". Name the file and section that was wrong and the exact command
   that failed and the one that worked.
2. Fix what is safe to fix now, in the same run: a wrong sentence on a card, a missing gotcha, a
   missing `ui.*` key. Reference each fix from the report (`fixed now: ...`). Do not restructure
   workbooks or skills in a run; that is grooming.
3. Unrelated defects seen on the way go to `TODO.md` (one line each), nothing else goes there.
4. One line in `journal/<yyyy-mm>.md`: `dd.MM.yyyy <workbook> <slug> - <outcome>; run report <file>`.
5. Commit this repository's changes (never `git add -A`; name the paths). In a target project
   the commit follows the project's own rules; never push without a yes.

## Output
The run report file, the journal line, any in-run fixes, the commit.

## Completion
Name the run report path and the commit in the final answer. If the human aborts early, write the
report anyway with `outcome: aborted`.
