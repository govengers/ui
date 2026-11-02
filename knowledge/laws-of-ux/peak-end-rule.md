---
name: Peak-End Rule
category: cognitive-bias
summary: People remember an experience by its most intense moment and by how it ended
applies: [Toast, DetailForm, LiveForm, JobProgress, Banner]
---

# Peak-End Rule

> People judge an experience largely based on how they felt at its peak and at its end, rather
> than the total sum or average of every moment of the experience. (Jon Yablonski, Laws of UX)

In a business application the peaks are errors and lost input, and the end is the question "did
it save?". Users forgive a long form that ends in a clear success and remember the one that
failed silently; bad moments stick harder than good ones.

## In this collection

- A save ends in a Toast ("Saved") with an optional follow-up such as Undo (`ui/Toast/Toast.md`);
  a danger toast stays 8 s instead of 5 s.
- DetailForm gives focus back after the save or moves it to the first refused field; a failure
  no field explains shows under the fields.
- LiveForm keeps the user's text when a push arrives and retries a save with the same
  Idempotency-Key: lost input and double writes, the worst peaks, are designed out.
- JobProgress ends with "Open result" once the job succeeded and says why when it failed (D29).
- A refused read is a Banner with Retry, never an endless skeleton (SearchTable gotchas).

## Review questions

- What does the user see at the end of each task on this page?
- What is the worst moment this page can produce, and what does the user get there?

## Source

https://lawsofux.com/peak-end-rule/
