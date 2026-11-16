# TODO

Defects and ideas seen on the way, one line each with a date. Fixed items are removed.

- 02.11.2026 demo: the demo app does not dogfood AppShell and AgentDock for its own chrome (D14 does not require it); switch when the dock is stable.
- 02.11.2026 fake engine: no `updateOrder`, no `deleteFile`; the WorkflowStatus and FileUpload demos work around it.
- 02.11.2026 messages: `ui.step` and `ui.stepOf` carry the same text; keep one.
- 16.11.2026 ui-lint: UL-003 flags `font-family: var(--ui-font-mono)`; the rule should accept the font tokens.
- 16.11.2026 Textarea: exposes only focus(); MarkdownEditor reaches the element through `$el`. Expose the element.
- 16.11.2026 Board: auto-scroll only while the pointer moves near an edge; columns taller than the screen do not scroll during a drag.
- 16.11.2026 demo runtime: vendored from livewire main 95e50bc (D73); re-copy from the next livewire tag.
