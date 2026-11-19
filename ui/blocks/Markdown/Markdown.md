---
name: Markdown
tier: block
intent: [markdown, render markdown, markdown editor, rich text, comment box, description editor, task list, paste image, drop image, mention, at mention, preview]
uses: [Button, Icon, Tabs, Textarea, format]
livewire: true
status: ready
laws: [jakobs-law, postels-law, aesthetic-usability-effect]
---

# Markdown

`MarkdownView` renders GitHub-flavoured markdown (task lists, tables, code, links, images) as
sanitised HTML; `MarkdownEditor` is a Textarea with a format toolbar, a Write and Preview
switch, images pasted, dropped or picked uploaded through an upload descriptor, and an `@`
mention list the page feeds. The block brings two dependencies (D3, D66): `marked` (the
renderer) and `dompurify` (the sanitiser).

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `MarkdownView.vue`, `markdown.ts` | to render markdown | the renderer and its safety rules |
| `MarkdownEditor.vue`, `editing.ts` | to edit markdown | the editor and its text logic |
| the cards of `Button`, `Icon`, `Tabs`, `Textarea` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Markdown.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

Copy: `MarkdownView` alone needs `MarkdownView.vue` and `markdown.ts`; `bun add marked dompurify`.

## MarkdownView

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `source` | `string` | required | the markdown; a prop, never a slot |

Safety: raw HTML in the source is shown as text, never parsed; DOMPurify drops script URLs and
event handlers; images load only from the page's own origin (relative or absolute, judged by the
URL the browser resolves, so `\`, tabs, control characters or character references hide no host), `blob:` and
raster `data:image/` URLs (no SVG): markdown someone else wrote (a user, an agent that read a
hostile page) cannot make the reader's browser call a foreign host. A storage or CDN host is
named in `MarkdownView.vue`: `createMarkdownRenderer(window, { imageHosts: ['https://files.example'] })`;
other images keep their alt text, without a source. A link to another origin gets
`target="_blank" rel="noopener noreferrer nofollow"`.

## MarkdownEditor

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `v-model` | `string` | `''` | the markdown |
| `name` | `string` | required | the textarea's name (D23) |
| `rows` | `number` | `6` | starting height; it grows like `Textarea` |
| `placeholder` | `string \| undefined` | none | |
| `disabled` | `boolean` | `false` | |
| `upload` | `UploadTarget<Params, Response, string> \| undefined` | none | e.g. `uploads.uploadFile`; its `image/*` content types switch images on |
| `uploadParams` | `Params \| undefined` | `{}` | the upload's parameters |
| `imageUrl` | `(response) => string` | none | the URL an uploaded image is shown from; required with `upload` |
| `maxSize` | `number \| undefined` | none | bytes per image; larger ones are said inline |
| `mentions` | `(query) => MentionOption[] \| Promise<MentionOption[]>` | none | suggestions for the text after `@`: `{ value, label, hint? }`; `value` is inserted; a rejection shows none |

| Event | Payload | When |
|-------|---------|------|
| `uploading` | `pending: number` | an image upload starts or ends; while `pending > 0` the model holds placeholders, so disable the page's Save |

Attributes (`aria-label`, `data-*`) land on the textarea, `class` and `style` on the wrapper;
inside a `Field` the label and hint reach the textarea.

Keys: Ctrl or Cmd+B and +I format; the two tools name their key in the label ("Bold (Ctrl+B)",
`ui.keyCtrl` in the locale's word, "Bold (⌘B)" on Apple platforms)
and in `aria-keyshortcuts` (`Control+B Meta+B`). With suggestions open, arrows move, Enter or Tab
inserts, Escape closes. Ctrl or Cmd+K is left to the command palette.

## With livewire

`MarkdownEditor` uploads through the provided pair's `Client.upload` (multipart with the file
name), like `FileUpload`. A pasted or dropped image puts `![Uploading name...](uploading:n)` at
the caret at once and swaps it for `![name](url)` when the answer comes; a failed upload
removes the placeholder and says so under the editor. A placeholder the user deleted stays
deleted. Once `upload` is set every file drop is the editor's: files of another type are named
under the editor, never opened by the browser in the tab (which would lose the text). Mentions are the page's: a `connection.query` on its users read, a filter of a cached
list.

## Agent

The textarea is the field named by `name`; toolbar buttons are named ("Bold (Ctrl+B)", "Insert image");
the Write and Preview switch is a tab list named "Editor mode".

## Gotchas

- Toolbar edits go through `document.execCommand('insertText')` so Ctrl+Z undoes them; where the
  browser refuses, the edit is applied without undo history.
- The renderer is bound to `window` once per app; under SSR (no `window`) or a window without a
  working DOM it shows the escaped text, never unsanitised HTML (`createMarkdownRenderer` in
  `markdown.ts` takes any window, or none).
- A page that saves while an upload is in flight saves the placeholder and the image is lost:
  follow the `uploading` event.
- Paragraphs, lists and quotes stop at `--ui-measure` (65ch, about 70 characters), so a view as
  wide as the page keeps lines readable; headings, code and tables take the full width. Markdown
  puts an image inside a paragraph, so a paragraph that holds an image takes the full width too
  (a screenshot or a diagram is not squeezed to the measure; text beside the image runs as wide).
  A narrower container wins as before.
- Test sanitising under jsdom, not happy-dom: happy-dom let `javascript:` links through
  DOMPurify in this repository's first test run.
