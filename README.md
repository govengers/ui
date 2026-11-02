# govengers/ui

Browsable, copy-paste Vue 3 components, blocks and page recipes for govengers applications, with
the skills and templates that keep a project's pages looking like one product. Not a package:
you copy the directory you need.

- [INDEX.md](INDEX.md) - the finder: every piece by intent, generated from the cards
- [AGENTS.md](AGENTS.md) - what a coding agent reads, by task
- [MANIFESTO.md](MANIFESTO.md) - what we believe (P1-P9)
- [docs/design.md](docs/design.md) - every decision, numbered
- [demo](https://govengers.github.io/ui/) - every piece under switchable presets, themes and density

## Why copy instead of import

A library version is a contract with every project at once: a breaking change hits all of them, a
local fix has to travel upstream first. A copy is the project's own. Improvements travel by
copying again; the header line in each copied file says where it came from.

## What is in the box

| Tier | What | Livewire |
|------|------|----------|
| primitive | Button, Input, Field, Select, Checkbox, Switch, Textarea, Badge, Card, Dialog, Sheet, Toast, Tabs, Table, Pagination, Skeleton, EmptyState, Avatar, Menu, Icon | no |
| layout | AppShell, Sidebar, Page, PageHeader, ActionBar, banners | no |
| block | FacetFilter, SearchTable, LoginForm, DetailForm, FileUpload, Stepper, WorkflowStatus, JobProgress, AgentDock, Spotlight, AgentCursor, ... | yes |
| page | ListPage, DetailPage, SettingsPage, LoginPage, Dashboard | yes |

Dependencies a copy may need: `vue`, `vue-router`, `vue-i18n`, `date-fns` and the project's
generated [livewire](https://github.com/govengers/livewire) client.

## Working on the collection

```sh
bun install
just demo          # the demonstrator on http://localhost:5173
just ci            # type-check, index drift, contrast, lint, tests, build
just screenshots   # re-render screenshots/ (local, uses Chrome)
```

Licence: Apache 2.0. Icons: a subset of [Lucide](https://lucide.dev), ISC.
