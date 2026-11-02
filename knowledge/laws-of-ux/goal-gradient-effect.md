---
name: Goal-Gradient Effect
category: heuristic
summary: People speed up as the finish comes into view, so show how close it is
applies: [Stepper, JobProgress, FileUpload, Spotlight, DetailDrawer]
---

# Goal-Gradient Effect

> The tendency to approach a goal increases with proximity to the goal.
> (Jon Yablonski, Laws of UX)

Onboarding a customer, importing a file, working through a review queue: multi-step work in a
business application gets abandoned in the middle. Visible progress turns an open-ended chore
into a countdown, and people push harder the closer the end looks.

## In this collection

- Stepper lists every step, checks the done ones and marks the current one
  (`aria-current="step"`).
- Spotlight's bubble says "Step x of n" while guide mode walks a plan (D25).
- JobProgress shows a progress bar while a job runs and "Open result" when it succeeded (D29);
  FileUpload shows a progress bar per file.
- DetailDrawer's header shows the position in the list ("3 of 25") while the user works through
  records one by one.

## Review questions

- Does every multi-step flow on this page say how far along the user is and what is left?
- Is progress visible for anything that takes longer than a request?

## Source

https://lawsofux.com/goal-gradient-effect/
