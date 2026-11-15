---
name: Paradox of the Active User
category: heuristic
summary: Users skip manuals and start working, so put help where they already are
applies: [AgentDock, Spotlight, Field, EmptyState, FileUpload, WhatsNew, changelog]
---

# Paradox of the Active User

> Users never read manuals but start using the software immediately.
> (Jon Yablonski, Laws of UX)

Nobody in a business application reads the handbook before the first task, even when it would
save them time later. Help that waits in context, on the path the user already took, gets used;
a tour in front of the work gets skipped.

## In this collection

- No hand-written tours (D28). Guide mode is on demand: the user asks in the AgentDock, and
  "Show me" walks the plan with the Spotlight while they click the real controls (D25).
- Field hints sit right under the control; FileUpload states its size and count limits inline,
  before anything fails.
- EmptyState says why a list is empty and offers the next action.
- WhatsNew shows the release notes once per minor line with features, never for a patch and
  never on a first visit, and remembers however it was closed (D56).

## Review questions

- Can a first-time user finish this page's main task without reading anything outside it?
- Where does the page explain a rule only after the user broke it?

## Source

https://lawsofux.com/paradox-of-the-active-user/
