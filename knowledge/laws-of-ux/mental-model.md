---
name: Mental Model
category: heuristic
summary: Users act on their own picture of how the system works; build to that picture
applies: [agent, Switch, Checkbox, WorkflowStatus, ListPage]
---

# Mental Model

> A compressed model based on what we think we know about a system and how it works.
> (Jon Yablonski, Laws of UX)

In a business application the user's model is the business itself: customers, orders, statuses,
approvals. When screens, URLs and action names speak that vocabulary, users and the in-app agent
can predict what each control does before they press it.

## In this collection

- One vocabulary everywhere: `data-page` names the page, `data-action` names the livewire call it
  runs, form fields are named after the API fields (D23, D24, D48).
- The URL holds the whole list state (tab, search, sort, facets, open item), so a link shows
  exactly what the sender saw (ListPage).
- A Switch applies at once, a Checkbox is saved with its form later (`ui/Switch/Switch.md`).
- WorkflowStatus shows the lifecycle as the business defines it and only the moves allowed now.
- A page never inserts its own writes; the push renders them, so the screen shows what the server
  holds (`patterns/showing-live-data.md`).

## Review questions

- Would a user name this page and its actions the way the code and the API do?
- Does any control change something other than what its label says?

## Source

https://lawsofux.com/mental-model/
