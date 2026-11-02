---
name: File uploads and background jobs
tier: pattern
intent: [upload a file, attachments, import, export, background job, long-running task, progress]
uses: [FileUpload, JobProgress, Stepper, Toast, Banner]
livewire: true
status: ready
---

# File uploads and background jobs

Anything that takes longer than a request is a job (`govengers/jobs`, D29); anything that is a
file goes through a livewire upload target.

## Uploads

`FileUpload` with `upload = uploads.uploadFile` and `files = live.files`: the server's rows
carry status and progress, so the list is live by construction. Validate size and type client
side (the sentences are built in), the server validates again.

## Jobs

Start with a call (`calls.startJob`), get the job id back, render `JobProgress` with
`target = live['jobs.item']`. When the job carries a `resultRoute`, the block offers "Open
result"; the agent's background mode redirects there (D29). Imports and exports are jobs:
"save then watch" in a `Stepper`'s last step.

## Feedback

A `Toast` on success for things the user is not looking at (an export that finished while
they browsed elsewhere), with an action to open the result; a `Banner` on the page when the
page itself is the result.
