---
name: Selective Attention
category: cognitive-bias
summary: People notice what serves their goal and filter out the rest, ad-like notices included
applies: [Banner, ConnectionBanner, Toast, StatusTile, SearchTable, UpdateHint, NotificationInbox]
---

# Selective Attention

> The process of focusing our attention only to a subset of the stimuli in the environment
> (Jon Yablonski, Laws of UX)

The subset is whatever serves the goal at hand. A user hunting for one order number ignores
everything else on the screen; a notice placed where banners usually sit, or a value that changes
while they look elsewhere, goes unseen. Attention is earned by rarity and placement, not by
louder styling.

## In this collection

- Banners appear only when something is wrong or special: ConnectionBanner shows nothing while
  the socket is open and speaks only while it reconnects or after it ended (D34).
- Banner has four variants (`info`, `warning`, `danger`, `success`) and they are the only notice
  styles; `danger` announces as `role="alert"`.
- No decorative accent fills (D36): colour never competes with the content.
- Live changes are marked: StatusTile shows the change against the previous period with an
  arrow and a tone; a stale list says so in a muted line (SearchTable).
- A toast reports the result of an action, not validation (`ui/Toast/Toast.md`); field errors
  appear at the field the user is looking at.

## Review questions

- Where is the thing the user came for, and does anything on the page compete with it?
- If a live value changes while the user looks elsewhere, how will they notice?

## Source

https://lawsofux.com/selective-attention/
