---
name: Building a settings page
tier: pattern
intent: [settings, preferences, configuration page, profile page, account page]
uses: [SettingsPage, Card, DetailForm, LiveForm, Tabs, Switch, Select]
livewire: true
status: ready
---

# Building a settings page

Settings are one `Card` per concern, each its own small form with its own Save, on a `Page` of
width `content`. Many sections: a `SettingsPage` index of link cards, one page per section
(PDB's shape), or `Tabs` with `?tab=` when the sections are few and short.

## Per section

`useLiveForm({ target: live.settings, call: calls.updateSettings, pick: item => ({ locale: item.locale, theme: item.theme }) })`
so each card saves only its own fields. Immediate settings (a `Switch` for notifications) may
save on change without a Save button; say so with a short "Saved" toast.

## Profile

The user's own record: avatar (`Avatar` + `FileUpload`), name and email (a `DetailForm`),
password change (its own card, three password fields, never prefilled), two-factor setup in a
`Dialog`, theme and language (`useTheme`, the locale select).

## Rules

- Width `content`, cards in reading order, the dangerous card (delete account) last and red only
  on its button.
- Every card is its own form; a page-wide Save that saves everything is the thing to avoid.
