---
name: Tesler's Law
category: principle
summary: Some complexity cannot be removed; the system should carry it, not the user
applies: [LiveForm, WorkflowStatus, FacetFilter, JobProgress, AgentCursor]
---

# Tesler's Law

> [...] for any system there is a certain amount of complexity which cannot be reduced.
> (Jon Yablonski, Laws of UX)

Business rules, concurrent edits and long-running work are real complexity, and somebody pays
for it: the builders once, or every user every day. We pay it in the pieces and on the server.
Users are not the idealised rational actors a simple design assumes.

## In this collection

- LiveForm handles concurrent edits: a push refills only untouched fields, a touched field keeps
  the user's text, a conflict says "Changed elsewhere" (D33).
- WorkflowStatus gets the transitions allowed now from the page, which computes them from the
  record and its permissions; the user never keeps the state machine in their head.
- FacetFilter's live counts ignore the facet's own selection (D31), so the user sees what each
  choice returns before choosing it.
- Long work is a server job followed by JobProgress (D29); the user may leave and come back to
  the result.
- Drive mode treats an action that is not bound and declared safe as mutating and pauses on it
  (D52): the system, not the user, carries the doubt.
- The demo's fake engine (`demo/src/fake/`, D50) plays the server's hard cases (field errors,
  refusals, jobs, uploads), so the pieces handle them instead of handing them to the user.

## Review questions

- Which rule or edge case does this page leave the user to remember or work around?
- Could the server or a piece answer it instead?

## Source

https://lawsofux.com/teslers-law/
