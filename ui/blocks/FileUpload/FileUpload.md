---
name: FileUpload
tier: block
intent: [file upload, upload files, dropzone, drag and drop upload, attachments, upload progress, document upload, image upload]
uses: [Badge, Button, Icon, format]
livewire: true
status: ready
laws: [doherty-threshold, goal-gradient-effect, paradox-of-the-active-user]
---

# FileUpload

A dropzone and the list of files being uploaded and uploaded. The dropzone is a `<label>` around
the native file input, so a click, Enter and a drop all work. Each file shows its name, size,
a progress bar with the percent sent, a status Badge and a remove button; a failed upload offers
Retry. Size and count limits are said inline. Uploads go through the pair's `Client.upload`.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `FileDropzone.vue`, `FileUpload.vue`, `fileUpload.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Badge`, `Button`, `Icon`, `format` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `FileUpload.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `upload` | `UploadTarget<Params, Response, string>` | required | `uploads.uploadFile`; its `contentTypes` are the input's `accept` |
| `params` | `Params \| undefined` | `{}` | the upload's parameters, `{ customerId }` |
| `files` | `LiveTarget<Query, ListResponse<Row>> \| undefined` | none | the live list of files; read once |
| `filter` | `unknown` | none | the filter document of the `files` read, e.g. one customer's files; read once |
| `maxSize` | `number \| undefined` | none | bytes per file; shown under the dropzone |
| `maxFiles` | `number \| undefined` | none | files in the list, failed ones excluded; `1` makes the picker single and a new pick replaces the file |
| `remove` | `MutationTarget<{ id }, undefined, unknown> \| undefined` | none | deletes an uploaded file; without it only failed uploads can be removed |
| `name` | `string` | required | the file input's `name` |

`Row` is any `UploadRow` (`fileUpload.ts`): `id`, `name` and `size`, with an optional `status`
(`'ready'`, or another word shown as is, such as `scanning`).

The directory holds three parts: `FileUpload.vue` (limits, uploads, the list),
`FileDropzone.vue` (the label around the file input, drag and drop) and `fileUpload.ts` (how
local uploads and live rows merge, the room left and the steps of one upload, tested in
`fileUpload.test.ts`).

A row: the file icon, the name, the size with the percent sent while the runtime reports it
(nothing while the bar is indeterminate) and the server's reason of a refusal, the bar while it
uploads, the status Badge, then Retry (a failed upload the server did not refuse) and remove.

## Slots

None.

## Events

| Event | Payload | When |
|-------|---------|------|
| `uploaded` | `Response` | one file finished; the upload's JSON answer |

The component exposes `add(files: Iterable<File>)`: it checks the limits and uploads, as a drop
does. Use it for a paste handler or an agent tool.

## With livewire

- Every file goes up as `client.upload(upload, params, file, { multipart: true, filename })`. A
  multipart body carries the file name to the handler (`livewire.File.Filename`); a raw body
  would lose it.
- The bar shows the bytes sent, from `onProgress` (livewire D79): the runtime sends through
  XMLHttpRequest in a browser. It stays indeterminate where the runtime cannot tell: under bun or
  Node, with `ClientOptions.credentials: 'omit'`, and with an application `ClientOptions.fetch`
  (the demo's fake engine is one, so the demo shows the indeterminate bar).
- A file being uploaded shows as a local row until the answer is in, then as the list's row of
  the answer's `id`, in the same place. The server pushes that row before its answer arrives;
  until then a row that joined the list after the upload started, with the file's name and size,
  stays hidden behind the local row, so the file never shows twice.
- This page's uploads stay on top, newest pick first, done or failed, for as long as the piece is
  mounted: a row never moves under the pointer or away from focus when an answer or a push comes.
  The other rows follow in the server's order (`files` and its sort); a reload shows every file
  in that order.
- `remove` runs over the socket (`connection.call(remove, { id })`), so a `Removes` effect hides
  the row at once. A refused remove says the server's message, or `ui.removeFailed` without one.
- Retry (D99) sends the kept file again through `Client.upload`, on the row it failed in. A
  refusal with field errors (`ApiError.fields`, "must be one of ...") offers no Retry: the same
  bytes would be refused again. No answer, or a refusal without field errors (a server error),
  offers it.
- Every try of one upload sends the same Idempotency-Key, so a file whose answer was lost is not
  stored twice, on a server that keeps the keys of uploads (the demo's fake engine keeps none). A
  new pick of the same file is a new upload with a new key.

## Agent

The file input carries `name`; the visual driver sets files on it (Playwright `setInputFiles`).
A remove button of an uploaded file carries `data-action` = the remove call's name and the
accessible name "Remove {file}". Retry carries `data-action` = the upload's name (`uploadFile`)
and the accessible name "Retry {file}". Retry goes while its file uploads, so a pressed Retry
moves focus to the file's row (`tabindex="-1"`), where the Badge says how it went. The row keeps
its element and its place when the answer comes, also when the server's row takes the upload's
place, so focus stays on it.

## Messages

`ui.dropFiles`, `ui.browse`, `ui.maxFileSize`, `ui.fileTooLarge`, `ui.tooManyFiles`,
`ui.uploading`, `ui.ready`, `ui.failed`, `ui.removeFile`, `ui.removeFailed`, `ui.retryFile`.

## Gotchas

- The content type is not checked here: the picker's `accept` filters, but a drop bypasses it,
  and the server's refusal shows on the file's row ("must be one of ...").
- With `maxFiles` 1 a new pick replaces the finished file: the new one goes up first, and only
  once it is in, the old one goes, through `remove` when given, else only from the list (the
  server keeps it; an endpoint that replaces by itself needs no `remove`). A failed upload keeps
  the old file, and its retry still replaces it: the old file goes only once the new one is in.
  No replacement while the file still uploads, or when the list (an unfiltered `files`) holds
  more than one file: then the pick is refused as too many.
- Retry counts like a new pick: a failed row takes no slot, so when the list filled up since, the
  retry is refused with `ui.tooManyFiles` and the row stays failed, with Retry.
- A retry starts from byte 0: there is no resumable upload.
- A failed upload keeps its bytes in memory until it is retried or removed; a refused one and a
  finished one let them go.
- An upload cannot be cancelled once started; its row has no remove button until it finished
  or failed.
- A multipart part is read into memory on the server up to the upload's `MaximumBytes`; fine for
  documents and images, not for video.
- While a file uploads, another new row of its name and size (a colleague uploading the same
  file) stays hidden until the answer arrives.
