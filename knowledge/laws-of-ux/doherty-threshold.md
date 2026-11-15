---
name: Doherty Threshold
category: heuristic
summary: Answer within about 400 ms, or show at once that work is happening, so neither side waits
applies: [SearchTable, Skeleton, Button, JobProgress, FileUpload, ConnectionBanner, UpdateHint]
---

# Doherty Threshold

> Productivity soars when a computer and its users interact at a pace (<400ms) that ensures that
> neither has to wait on the other. (Jon Yablonski, Laws of UX)

Business users repeat the same searches and saves hundreds of times a day, and every pause adds
up. When the server cannot answer that fast, perceived speed is the next best thing: immediate
feedback, a layout that does not jump, and visible progress for long work.

## In this collection

- SearchTable sends the search 200 ms after the last key: typing feels live without a read per
  keystroke.
- A filter, search or sort change keeps the last rows on screen until the new first page
  arrives; Skeleton rows show only on the first load (`!error && loading`, SearchTable gotchas).
- Button `loading` shows a spinner, sets `aria-busy` and blocks clicks while a call runs; the
  push renders the result, the page never polls (`patterns/showing-live-data.md`).
- Anything longer than a request is a job with a JobProgress bar (D29,
  `patterns/file-uploads-and-jobs.md`); FileUpload shows progress per file.
- A dropped socket keeps the data under a muted stale line, and ConnectionBanner says what
  happens next.

## Review questions

- What does the user see within 400 ms of each click on this page?
- Does the layout jump when data arrives, or does the old content stay until the new is ready?

## Source

https://lawsofux.com/doherty-threshold/
