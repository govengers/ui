# Laws of UX

The design knowledge base of govengers/ui: one note per law from Laws of UX, written in our own
words and mapped to the pieces, tokens and rules of this collection that embody it, plus the
questions a reviewer asks of a page. It is the design floor of D54: the `design-direction`,
`build-page` and `review-ui` workbooks load the laws a recipe card names in its `laws` front
matter. `start-project` copies this directory into the target project's `docs/ui/` (D55).

## Source and licence

Laws of UX, https://lawsofux.com/, created by Jon Yablonski. Its info page
(https://lawsofux.com/info/) states: "All content on this website is licensed under the Creative
Commons Attribution-NonCommercial-NoDerivatives 4.0 International License."
(https://creativecommons.org/licenses/by-nc-nd/4.0/)

The notes here are our own text about how this collection applies each law. Each note quotes
only the law's one-sentence statement from the site, attributed, and links the law's page, which
holds the takeaways, the origins and further reading. Keep it that way when editing: our words,
one quoted sentence per law, never the site's paragraphs.

## How an agent uses it

1. Take the laws from the recipe card's `laws` front matter. Without one, scan the index below
   and pick the laws whose "Maps to" column touches the task.
2. Open those notes. Build with "In this collection": each bullet names the piece, token or rule
   that already carries the law; use it instead of inventing a new one.
3. Review with "Review questions". Lead a review with what the user experiences on their task;
   the laws are the lens, not a score sheet.
4. A law a page breaks on purpose gets a written exception in the project's `DESIGN.md` (D12).
   A law no piece covers well goes into the run report (`journal/runs/`), where `groom` picks it up.

Paths such as `ui/tokens.css` are paths in govengers/ui; in a target project they are under
`src/ui/` and `src/pages/` (D39). D-numbers are decisions in govengers/ui's `docs/design.md`,
P-numbers its `MANIFESTO.md`.

## Note shape

Front matter `name`, `category`, `summary` (one line), `applies` (piece and recipe names from
`INDEX.md`). Body: the law with its quoted statement and why it matters in a business
application, `## In this collection`, `## Review questions`, `## Source`. Under 60 lines.

`category` is ours. `gestalt` and `cognitive-bias` follow the site's tags of the same name. The
site has no heuristic or principle tag, so the rest is split here: `principle` for rules about
building systems or organising work that come from outside psychology, `heuristic` for
observations about perception, memory, decisions and motivation used as rules of thumb.

## Index

| Law | Category | One line | Maps to |
|-----|----------|----------|---------|
| [Aesthetic-Usability Effect](aesthetic-usability-effect.md) | heuristic | Attractive interfaces are judged easier to use, and hide their flaws | tokens only (D6, P4), measured contrast (P7), no accent fills (D36), axe pass |
| [Choice Overload](choice-overload.md) | heuristic | Too many options at once make people decide worse | ColumnsPicker defaults, FacetFilter cascade and `short` panel, live counts, RangePicker quick ranges |
| [Chunking](chunking.md) | heuristic | Meaningful groups are scanned and remembered faster | Field stack and `group`, Card per concern (SettingsPage), DetailPage sections, Stepper |
| [Cognitive Bias](cognitive-bias.md) | cognitive-bias | Shortcuts in judgment skew what users accept and builders believe | measured not claimed (P7), drive mode pauses (D27, D52), defaults as decisions |
| [Cognitive Load](cognitive-load.md) | heuristic | Spend the user's mental effort on the task, not the interface | one way per job (P2), DetailDrawer over the list, one failure per screen, EmptyState |
| [Doherty Threshold](doherty-threshold.md) | heuristic | Answer within about 400 ms or show that work is happening | 200 ms search debounce, last rows kept, Button `loading`, JobProgress (D29) |
| [Fitts's Law](fittss-law.md) | heuristic | Bigger, closer targets are faster and safer to hit | 44 px coarse-pointer targets (D9, D49), actions right in PageHeader, row menu in the last column |
| [Flow](flow.md) | heuristic | Deep focus lasts while the tool is fast and leaves the user in charge | Escape and focus return (P5), DetailDrawer arrow keys, Enter submits DetailForm, take over from AgentCursor |
| [Goal-Gradient Effect](goal-gradient-effect.md) | heuristic | People speed up as the finish comes into view | Stepper checks, Spotlight "Step x of n", JobProgress and FileUpload bars |
| [Hick's Law](hicks-law.md) | heuristic | Decision time grows with the number of choices | one primary per page (DESIGN.md rule 4), Menu separators, FacetFilter field then values, WorkflowStatus |
| [Jakob's Law](jakobs-law.md) | heuristic | Users expect our app to work like the ones they know | native controls (P5, D9), ListPage is a known list kit (D32), Grafana-style RangePicker, WhatsNew |
| [Law of Common Region](law-of-common-region.md) | gestalt | One boundary reads as one group | Card as the save scope, Table rows, one chip per facet, Dialog and Sheet |
| [Law of Proximity](law-of-proximity.md) | gestalt | Close things read as related | Field spacing `--ui-space-1`, the `--ui-space-*` scale only (D6), Page rhythm |
| [Law of Prägnanz](law-of-pragnanz.md) | gestalt | People read shapes in the simplest way | radius tokens, one Lucide subset (D43), Skeleton shapes, no gradients (D36) |
| [Law of Similarity](law-of-similarity.md) | gestalt | Alike-looking things are taken to do the same | Button variants (D41), accent means actionable (D36), one Badge tone per status |
| [Law of Uniform Connectedness](law-of-uniform-connectedness.md) | gestalt | Connected elements read as related | WorkflowStatus track, Stepper list, Tabs underline, anchored Popover (D51) |
| [Mental Model](mental-model.md) | heuristic | Users act on their own picture of the system | `data-page` and `data-action` equal the API (D23, D24, D48), URL state, Switch against Checkbox |
| [Miller's Law](millers-law.md) | heuristic | Working memory is small; structure, do not cap | five phone nav items, five default columns, four Dashboard tiles, Card per concern |
| [Occam's Razor](occams-razor.md) | principle | Fewer parts win when both designs work | one way per job (P2), native first (P5), dependencies of D3, recipe or written exception |
| [Paradox of the Active User](paradox-of-the-active-user.md) | heuristic | Users skip manuals and start working | no tours (D28), guide mode on demand (AgentDock, Spotlight), inline hints and limits, EmptyState |
| [Pareto Principle](pareto-principle.md) | principle | A few causes produce most effects | five recipes (D8), ListPage full kit (D32), one config file per entity |
| [Parkinson's Law](parkinsons-law.md) | principle | Work fills the time it is given | LoginForm `autocomplete`, quick ranges, remembered columns and URL state, `ui-start --quick` (D19) |
| [Peak-End Rule](peak-end-rule.md) | cognitive-bias | Experiences are remembered by their peak and their end | Toast with Undo, focus after save, LiveForm keeps input, JobProgress "Open result" |
| [Postel's Law](postels-law.md) | principle | Accept loosely, send exactly | Input number to `null`, Select value types, ISO or `Date` (D20), touched-only saves |
| [Selective Attention](selective-attention.md) | cognitive-bias | People see what serves their goal and miss the rest | banners only when needed, Banner variants, no accent fills (D36), StatusTile change |
| [Serial Position Effect](serial-position-effect.md) | cognitive-bias | First and last items are remembered best | `nav` order, Cancel then Save, Delete last in the row menu, dangerous card last |
| [Tesler's Law](teslers-law.md) | principle | Irreducible complexity belongs to the system, not the user | LiveForm conflicts (D33), facet counts (D31), jobs (D29), drive mode pauses (D52), fake engine (D50) |
| [Von Restorff Effect](von-restorff-effect.md) | cognitive-bias | The odd one out is noticed and remembered | one accent (D36), one primary and `danger` only for destruction, Badge text not colour alone |
| [Working Memory](working-memory.md) | heuristic | Keep what the task needs on screen | DetailDrawer "3 of 25", visible facet chips, URL state, counted Tabs |
| [Zeigarnik Effect](zeigarnik-effect.md) | heuristic | Unfinished work stays on the mind; show what is open | "Unsaved changes" hint, Stepper checks, JobProgress "Open result", Filters count |
