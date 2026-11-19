---
name: AppShell
tier: layout
intent: [app shell, layout, navigation, sidebar, top bar, bottom tabs, main menu, dock, more tab, navigation rail]
uses: [Icon, Sheet, Tooltip]
livewire: false
status: ready
laws: [millers-law, serial-position-effect]
---

# AppShell

The frame of the application: top bar (chrome), navigation, banners, the page and the dock.
Sidebar on desktop, icon rail on tablets (each name in a `Tooltip`), bottom tabs on phones: up
to five items as tabs; with more, or with a `navFooter`, the first four and a More tab that opens
a `Sheet` with the rest and the footer, so nothing of the sidebar is out of reach (D92). The
`AgentDock` block renders in the `dock` slot (D25).

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `AppShell.vue`, `more.ts` | to use it: skim; to change it: read | the behaviour; `more.ts` holds the More tab's state, guards and focus hand-over |
| the cards of `Icon`, `Sheet`, `Tooltip` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `AppShell.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `title` | `string` | required | shown in the top bar unless the `brand` slot is given; a crowded `actions` slot cuts it with an ellipsis |
| `nav` | `NavItem[]` | `[]` | `{ label, icon, to, count? }`; on phones up to five are tabs, past five (or with `navFooter`) the first four and More; omit with `bare` |
| `bare` | `boolean` | `false` | no navigation: login, full-screen flows |
| `dockCollapsed` | `boolean` | `false` | tablets and phones: the dock becomes a strip at the bottom so a guide or drive plan can reach the page; bind it to `AgentDock`'s `running` event |

## Slots

| Slot | Content |
|------|---------|
| `brand` | logo and name |
| `actions` | top-bar right: theme toggle, user `Menu`, the agent button; a ghost `Button` here paints `--ui-on-chrome` |
| `banners` | `Banner`s above the page (connection, maintenance, impersonation) |
| default | the router view |
| `navFooter` | bottom of the sidebar (version, settings link); on phones the same node moves into the More sheet |
| `dock` | the `AgentDock`; a right column on desktop, an overlay on tablets, full screen on phones |

## Agent

The shell's navigation links are what `navigate` resolves: the driver clicks the link whose
route matches, so `nav` must list every top-level area of `app-map.json`. On phones an item past
the fourth (with more than five, or with a `navFooter`) is not in the bar: the driver clicks the
button "More" (`ui.more`, `.ui-app-shell__more`), then the link in the dialog "More". Those items
carry `data-overflow` in the nav. The nav is named `ui.mainNav`, the skip link `ui.skipToContent`.

## Gotchas

- Phones show up to five tabs. Past five items, or with a `navFooter`, the bar shows the first
  four and More; the sheet lists the rest, the current one marked, then the footer. When the
  current page sits behind More, More is marked too (`aria-current="true"`). Any navigation
  closes the sheet, a tap on the page it is on included, and focus returns to More. The order of
  `nav` decides what is one tap away.
- A double tap or a held Enter on More acts once: the rest of that press (the second click, the
  key's repeats) does nothing inside the sheet that just opened, and a repeated Enter never opens
  it from More. The first click or key that is not part of it ends that, so what the footer brings
  takes double clicks and held keys as anywhere else; of the keys coming up only Enter ends it. A
  second tap counts as part of the press where the browser counts taps in the click's `detail`
  (Chrome does, within its double-tap time and distance; a phone's Safari is not verified). A
  second press within about 40 ms, before the sheet is painted, lands on the backdrop and closes
  it where the browser light-dismisses dialogs itself (`closedby`).
- Crossing 48rem (a phone turned, a browser zoomed) closes the sheet. The footer is one node that
  moves between the nav and the sheet: what is typed in it stays, and focus on it stays where it
  is still shown. Focus on something the crossing hides goes to the way back to it: More on
  phones, else the current link, else the first link. A Popover or a Dialog open in the footer
  closes first: the platform hides a popover that moves, and a dialog that moves stays open but
  is no longer modal.
- The rail hides each label and count from the screen only: the link keeps its name and a
  `Tooltip` shows the label on hover and keyboard focus (nothing on touch). The phone bar hides
  the count the same way. No native `title`. Rail links are 47 px wide, 44 high on touch.
- Phone tabs share the bar equally; a label longer than its tab, or enlarged text, ends in an
  ellipsis (the name stays whole), so More never leaves the screen.
- The top bar is `--ui-chrome` in both themes (chrome is black day and night); put a
  logo with its own plate there, not an inverse variant. A ghost `Button` in `actions` reads
  `--ui-on-chrome` at rest through `--ui-button-ghost-ink`, the property Button offers for it
  (D102); hover keeps `--ui-ink` on `--ui-surface-2` and a press on `--ui-surface-3` (D104); one
  inside a popover or dialog placed in
  the slot keeps its colours. Other variants bring their own ground. A focus ring on the top bar
  is `--ui-on-chrome` (`--ui-focus` can be the chrome's own colour, as in paper light).
  Ghost Buttons there change their ground without a fade, since their ink turns from light to dark
  with it: a ground fading under ink that flips at once hid the label for a frame or two.
- The shell sets `--ui-sticky-top` to the top bar's height, so a sticky `Table` header stops
  below the bar. A scroll box that is not the page sets it again on itself: `0px` (the nav and
  the dock do), or minus its top padding to keep the header flush with its edge; without that a
  sticky header in it stops a top bar's height too low.
- On phones the bar is `--ui-tabbar-h` high (rem, so it grows with the text) plus the bottom
  safe-area inset, which it pads below its tabs, and the shell sets `--ui-sticky-bottom` to that on
  the root: a sticky `ActionBar` and the collapsed dock strip stand on the bar instead of covering
  it. Without a bar there is no inset: `bare`, or a `nav` without items (no tab, no More), shows no
  bar at all. A scroll box that is not the page sets the token again, as for `--ui-sticky-top`.
- The token sits on the root while any shell that is not `bare` and has tabs is in the document,
  also one shown in a frame (a demo, a preview): the page's own sticky `ActionBar` then stands a
  bar's height above the bottom. One shell per page, as an application has, never meets this.
- Heights use `dvh` (D89): `100vh` is taller than the visible area while a phone's browser bar
  shows. The inset is 0 unless the page's viewport meta tag sets `viewport-fit=cover` (CSS
  Environment Variables, `safe-area-inset-*`); a project that sets it pads the rest itself with
  `env(safe-area-inset-bottom)`: a sticky `ActionBar` outside a shell or in a `bare` one, and the
  bottom edge of `Sheet` and `Dialog` on phones (the More sheet is a `Sheet`).
