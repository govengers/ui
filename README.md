# govengers/ui

Browsable, copy-paste Vue 3 components, blocks and page recipes for govengers applications, with
the skills and templates that keep a project's pages looking like one product. Not a package:
you copy the directory you need.

- [INDEX.md](INDEX.md) - the finder: every piece by intent, generated from the cards
- [CLAUDE.md](CLAUDE.md) - the routing table (ICM L0): task shape to workbook, and the rules
- [workbooks/](workbooks/) - staged instructions per task (ICM L1 and L2), with a mandatory learn stage
- [knowledge/laws-of-ux/](knowledge/laws-of-ux/) - the design knowledge base, one note per law, mapped to our pieces
- [MANIFESTO.md](MANIFESTO.md) - what we believe (P1-P9)
- [docs/design.md](docs/design.md) - every decision, numbered
- [patterns/](patterns/) - intent guides: building a list page, a form, a settings page, live data, login, uploads and jobs, the in-app agent
- [demo](https://govengers.github.io/ui/) - every piece under switchable presets, themes and density

## Why copy instead of import

A library version is a contract with every project at once: a breaking change hits all of them, a
local fix has to travel upstream first. A copy is the project's own. Improvements travel by
copying again; the header line in each copied file says where it came from.

## What is in the box

| Tier | What | Livewire |
|------|------|----------|
| primitive | Icon, Button, Field, Input, Textarea, Select, Checkbox, Switch, Badge, Card, Skeleton, EmptyState, Avatar, Tabs, Dialog, Sheet, Toast, Menu, Popover, Table, Pagination, Spotlight, AgentCursor; modules `format`, `theme`, `agent` | no |
| layout | AppShell, Page, PageHeader, ActionBar, Banner | no |
| block | SearchTable, FacetFilter, RangePicker, ColumnsPicker, DetailDrawer, ConnectionBanner, LiveForm (`useLiveForm`), DetailForm, LoginForm, FileUpload, Stepper, WorkflowStatus, JobProgress, StatusTile, WhatsNew, AgentDock, Board, Markdown, CommandPalette | yes |
| page | ListPage, DetailPage, SettingsPage, LoginPage, Dashboard | yes |
| pattern | building a list page, a form, a settings page, live data, login and session, uploads and jobs, the in-app agent | |

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
