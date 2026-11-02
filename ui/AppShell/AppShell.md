---
name: AppShell
tier: layout
intent: [app shell, layout, navigation, sidebar, top bar, bottom tabs, main menu, dock]
uses: [Icon]
livewire: false
status: ready
---

# AppShell

The frame of the application: top bar (chrome), navigation, banners, the page and the dock.
Sidebar on desktop, icon rail on tablets, bottom tabs on phones (the first five items). The
`AgentDock` block renders in the `dock` slot (D25).

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `title` | `string` | required | shown in the top bar unless the `brand` slot is given |
| `nav` | `NavItem[]` | required | `{ label, icon, to, count? }`; the first five show on phones |
| `bare` | `boolean` | `false` | no navigation: login, full-screen flows |

## Slots

| Slot | Content |
|------|---------|
| `brand` | logo and name |
| `actions` | top-bar right: theme toggle, user `Menu`, the agent button |
| `banners` | `Banner`s above the page (connection, maintenance, impersonation) |
| default | the router view |
| `navFooter` | bottom of the sidebar (version, settings link); hidden on phones |
| `dock` | the `AgentDock`; a right column on desktop, an overlay on tablets, full screen on phones |

## Agent

The shell's navigation links are what `navigate` resolves: the driver clicks the link whose
route matches, so `nav` must list every top-level area of `app-map.json`.

## Gotchas

- More than five nav items: the sixth onward is hidden on phones. Put secondary areas into a
  `Menu` in `actions` or into a settings page.
- The top bar is `--ui-chrome` in both themes (PDB rule: chrome is black day and night); put a
  logo with its own plate there, not an inverse variant.
