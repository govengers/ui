---
name: Postel's Law
category: principle
summary: Accept what users give in any reasonable form, and send only clean, exact data
applies: [Input, Select, format, SearchTable, LiveForm, Field]
---

# Postel's Law

> Be liberal in what you accept, and conservative in what you send.
> (Jon Yablonski, Laws of UX)

Business data is typed fast, pasted from mails and spreadsheets, and entered on phones. Rejecting
a reasonable entry wastes the user's time; passing a sloppy one on corrupts records. The
interface translates between the two and says clearly where the boundaries are.

## In this collection

- Input with `type="number"` emits a number, or `null` for an empty field, never `NaN`
  (`ui/Input/Input.md`).
- Select hands back the option's own value type: a number option emits a number.
- Components take dates as ISO strings or `Date` (D20); `ui/format.ts` handles the display.
- SearchTable trims the search before it goes into the filter.
- LiveForm sends only the touched fields; the server validates and the error lands on the Field
  that failed (`patterns/building-a-form.md`).
- Gap: no piece parses free-form pasted values (amounts with thousands separators, dates in
  local notation) yet; the native inputs accept what the browser accepts.

## Review questions

- What does each field on this page do with a value pasted from a spreadsheet or a mail?
- Does the page send the server exactly the changed values, in the API's types?

## Source

https://lawsofux.com/postels-law/
