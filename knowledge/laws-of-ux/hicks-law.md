---
name: Hick's Law
category: heuristic
summary: Decision time grows with the number and complexity of choices, so cut and order them
applies: [PageHeader, Button, Menu, FacetFilter, WorkflowStatus, RangePicker]
---

# Hick's Law

> The time it takes to make a decision increases with the number and complexity of choices.
> (Jon Yablonski, Laws of UX)

Each screen of a business application is a decision point repeated many times a day. Fewer,
ordered choices make the frequent path fast while the rare options stay reachable. The limit is
clarity: simplify until the choice is obvious, not until it is vague.

## In this collection

- One primary action per page, in the PageHeader (`templates/project/DESIGN.md` rule 4); Button
  allows one `primary` per view.
- Menu groups items with separators (an item with `label: '-'`); the ListPage row menu is Open
  and Edit, a separator, then Delete.
- FacetFilter's cascade asks for the field first and shows only that field's values next (D31).
- WorkflowStatus offers only the transitions allowed now, never the whole lifecycle as buttons.
- RangePicker leads with quick ranges; the absolute form is the second step.

## Review questions

- How many choices of equal weight does the page show at first sight?
- Is the most frequent action the most visible one?

## Source

https://lawsofux.com/hicks-law/
