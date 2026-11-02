---
name: Zeigarnik Effect
category: heuristic
summary: Unfinished tasks stay on people's minds, so show what is open and how to finish it
applies: [DetailForm, LiveForm, Stepper, JobProgress, FacetFilter]
---

# Zeigarnik Effect

> People remember uncompleted or interrupted tasks better than completed tasks.
> (Jon Yablonski, Laws of UX)

Business users are interrupted mid-task all the time. Clear signs of what is still open (an
unsaved edit, a half-done flow, a running job) bring them back to finish it instead of losing
the work, and visible progress pulls them to the end.

## In this collection

- DetailForm shows "Unsaved changes" in its ActionBar while LiveForm has touched fields
  (`dirty`).
- Stepper checks the done steps, so an interrupted flow shows where to pick up.
- JobProgress follows a job live by id and offers "Open result" when it is done; a job's result
  names a route the dock can open (D29).
- The Filters button counts the active facets: a reminder that the list is narrowed.
- Gap: no piece guards leaving a page with unsaved changes yet; the hint is the only signal.

## Review questions

- If the user is interrupted halfway, what on screen tells them what is unfinished?
- Is any open work lost silently when they navigate away?

## Source

https://lawsofux.com/zeigarnik-effect/
