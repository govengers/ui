---
name: Cognitive Bias
category: cognitive-bias
summary: Systematic shortcuts in judgment skew what users accept and what builders believe
applies: [AgentCursor, AgentDock, ColumnsPicker, ListPage, theme]
---

# Cognitive Bias

> A systematic error of thinking or rationality in judgment that influence our perception of the
> world and our decision-making ability. (Jon Yablonski, Laws of UX)

Biases work on both sides of the screen. Users keep defaults and trust what a machine already
did; builders believe their own page is clear and look for proof that it is. In a business
application one wrong click can change real records, so neither design nor review may rest on
anyone's impression.

## In this collection

- Measured, not claimed (P7): contrast by `scripts/contrast.ts`, `INDEX.md` generated from the
  cards, a screenshot for every card (D15, D46); a check replaces an opinion wherever it can.
- Drive mode pauses on the submit of every mutating action until the user clicks or says Go
  (D27, D52): people tend to approve what an agent already did without reading it.
- Any press or key outside the agent's own UI stops AgentCursor: the user takes over, not the
  plan (D25).
- Most users keep defaults, so defaults are decisions: `defaultColumns` and `defaultSort` per
  entity in `customers.list.ts`, theme `auto` (D35).
- ListPage and FacetFilter follow a kit people already use daily (PDB, D8, D31), not a
  designer's taste.

## Review questions

- Which claim about this page rests on an opinion, and which on a measurement or a user test?
- What does the user get if they accept every default and every agent step?

## Source

https://lawsofux.com/cognitive-bias/
