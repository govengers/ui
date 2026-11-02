---
name: Flow
category: heuristic
summary: Deep focus lasts while the tool answers fast, keeps out of the way and leaves the user in charge
applies: [Dialog, Menu, DetailDrawer, DetailForm, SearchTable, AgentCursor]
---

# Flow

> The mental state in which a person performing some activity is fully immersed in a feeling of
> energized focus, full involvement, and enjoyment in the process of the activity.
> (Jon Yablonski, Laws of UX)

Power users of business applications work through queues: review, edit, next. Every forced trip
to the mouse, every lost focus and every surprise breaks the rhythm. Keyboard paths, predictable
focus and fast feedback keep them going; a task that is too fiddly or too opaque throws them out.

## In this collection

- Escape closes Dialog, Sheet, Popover and Menu, and focus returns to the opener; the platform
  does it (P5, D9).
- DetailDrawer steps through the rows on screen with ArrowLeft and ArrowRight; Enter on a
  SearchTable row opens it.
- DetailForm submits with Enter through a real `<form>`, then gives focus back or moves it to the
  first refused field.
- Menu moves with the arrow keys; FacetFilter's cascade moves with the arrows inside and between
  its columns.
- AgentCursor stops at any press or key outside the agent's UI: the user never fights the tool
  for control (D25).

## Review questions

- Can the main task of this page be done without the mouse?
- Where does focus land after each dialog, save and error?

## Source

https://lawsofux.com/flow/
