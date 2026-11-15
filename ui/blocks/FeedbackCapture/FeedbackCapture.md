---
name: FeedbackCapture
tier: block
intent: [feedback, report a bug, bug report, send feedback, feature request, support request, console log capture, screenshot report]
uses: [Dialog, Field, Select, Textarea, Checkbox, Banner, Button]
livewire: true
status: ready
laws: [postels-law, teslers-law, peak-end-rule]
---

# FeedbackCapture

The report dialog (D59): kind (bug, idea, question), text and, for bugs, severity. When it opens
it freezes the technical details: the last console errors and warnings, uncaught errors, failed
requests (from the ring buffer `installFeedbackBuffer()` keeps), the environment, and through an
optional hook a screenshot of the page taken before the dialog covers it. "Exactly what will be
sent" prints the very report the Send button sends; unticking the details or the screenshot
removes them from both. Credentials are redacted at any depth when they enter the buffer.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `FeedbackCapture.vue`, `feedback.ts`, `redact.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Dialog`, `Field`, `Select`, `Textarea`, `Checkbox`, `Banner`, `Button` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `FeedbackCapture.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `boolean` | `false` | open state, `v-model` |
| `send` | `MutationTarget<NoParameters, FeedbackReport, unknown>` | required | the create call, e.g. `calls.createFeedback`; the report is its body |
| `buffer` | `FeedbackBuffer \| undefined` | the installed one | where the entries come from; none installed means no entries |
| `screenshot` | `() => Promise<string \| null \| undefined>` | none | captures the page as a data URL; runs before the dialog shows; a failure sends without one |
| `version` | `string \| undefined` | none | the build, for the environment |

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:modelValue` | `false` | Cancel, Escape, X, or after a successful send |
| `sent` | `FeedbackReport` | the server accepted the report; show a toast |

## The modules

`feedback.ts`: `installFeedbackBuffer({ size = 50, levels = ['error', 'warn'], host?, now? })`
wraps `console`, `fetch` (records answers that are not ok, and network failures; not aborts) and
listens to `error` and `unhandledrejection`; it answers `{ entries, push, clear, uninstall }`.
Called again without a host it answers the installed buffer (hot reload). `collectEnvironment`
(URL, user agent, language, time zone, viewport, screen, pixel ratio, colour scheme, online,
version), `buildReport` (frozen), `previewText`.

`redact.ts`: `secretKey`, `redactValue` (secret keys masked with their subtree at any depth,
cycles and depth cut, errors as name, message, stack) and `redactText` (`key=value`, `"key":
"value"`, `Bearer x`, JWTs, `user:pass@` in URLs). Substring matching over-redacts on purpose.

## With livewire

```ts
// main.ts, before anything logs
installFeedbackBuffer()
```
```vue
<FeedbackCapture v-model="feedbackOpen" :send="calls.createFeedback" :version="version"
  :screenshot="captureScreenshot" @sent="toast(t('feedback.thanks'))" />
```

The report goes over REST (`pair.client.call`), not the socket: people report problems most when
the connection is the problem. The server side is a plain create mutation; it should cap the
body size (a screenshot is a data URL of some hundred KB) and stamp the actor itself.

Screenshot hook with `html2canvas-pro` (D34; the one dependency this block suggests, the project
adds it):

```ts
const captureScreenshot = async () => (await html2canvas(document.body, { scale: 0.5 })).toDataURL('image/jpeg', 0.7)
```

## Agent

A dialog named "Send feedback". Fields `type`, `severity`, `text`, `technical`, `screenshot`;
Send carries `data-action` = `send.name`. An agent may fill it; the send pauses for the user
like every mutation in drive mode (D52).

## Messages

`ui.feedback`, `ui.feedbackType`, `ui.feedbackBug`, `ui.feedbackIdea`, `ui.feedbackQuestion`,
`ui.severity`, `ui.severityLow` to `ui.severityCritical`, `ui.feedbackText`, `ui.includeTechnical`,
`ui.includeTechnicalHint`, `ui.includeScreenshot`, `ui.screenshotAlt`, `ui.whatIsSent`,
`ui.send`, `ui.sendFailed`, `ui.cancel`.

## Gotchas

- Install the buffer first in `main.ts`: lines logged before it are not recorded, and a client
  that captured `fetch` before the install (`options.fetch = fetch`) bypasses it. livewire's
  Client looks `fetch` up per request, so it is recorded.
- The user's own text is sent as typed, not redacted; the preview shows it.
- XHR and WebSocket frames are not recorded; failed livewire calls over the socket show up as the
  console errors the app logs for them.
