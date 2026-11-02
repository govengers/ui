---
name: AgentDock
tier: block
intent: [agent dock, assistant, chat panel, chatbot, in-app agent, ask the assistant, guide mode, drive mode, take over]
uses: [AgentCursor, Spotlight, Avatar, Banner, Button, Icon, Skeleton, Textarea, agent, format]
livewire: true
status: ready
---

# AgentDock

The in-app agent's panel for the AppShell's `dock` slot (D25, D26): the conversation, a composer,
and a mode switch (Chat, Guide, Drive). An agent message with a plan gets "Show me", which walks
it with the Spotlight while the user clicks, and "Do it", which runs it with the AgentCursor while
the user watches. A Take over button stops a running plan.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `conversation` | `LiveTarget<never, ListResponse<ChatMessage>>` | required | the thread, e.g. `live.conversation`; read without parameters, shown oldest first |
| `send` | `MutationTarget<NoParameters, { text, mode }, unknown>` | required | e.g. `calls.sendMessage` |
| `planOf` | `(message) => DrivePlan \| undefined` | none | the plan attached to an agent message |
| `mode` | `chat \| guide \| drive` | `chat` | `v-model:mode`; sent with every message; Guide shows only "Show me", Drive only "Do it" |
| `unattended` | `string[]` | none | passed to `AgentCursor` (D27, D52) |
| `title` | `string` | `ui.agent` | header and accessible name |
| `avatar` | `string` | none | the agent's picture; a bot icon without one |

`ChatMessage` (`dock.ts`): `{ id, role: 'user' | 'agent', text, createdAt }`.

## Slots

None.

## Events

| Event | Payload | When |
|-------|---------|------|
| `navigate` | `path` | a plan moves to another page: call `router.push(path)` |
| `close` | none | the close button |
| `running` | `boolean` | `true` when a guide or drive plan starts, `false` when it ends, stops or fails: bind it to AppShell's `dockCollapsed` |

## With livewire

```vue
<AppShell title="Acme" :nav="nav" :dock-collapsed="running">
  <RouterView />
  <template v-if="dockOpen" #dock>
    <AgentDock v-model:mode="mode" :conversation="live.conversation" :send="calls.sendMessage"
      :plan-of="message => message.plan" :unattended="design.unattended"
      @navigate="router.push($event)" @running="running = $event" @close="dockOpen = false" />
  </template>
</AppShell>
```

The thread is one `useLiveList`; the agent's reply arrives as a push (streamed tokens as further
pushes, D26), so the dock never inserts its own messages. "Thinking" shows while the newest
message is the user's. A failed read shows one danger Banner with Retry; a failed send keeps the
draft and shows the field error (`fields.text`) or the message.

## Agent

The dock is the client side of the agent: the server runs aikido inside the app's Go server
(D26) and answers on the conversation resource. Its client-side tools are `navigate` (the dock
emits it), `spotlight` (guide plans, `Spotlight`) and `drive` (drive plans, `AgentCursor`), all
in the `DrivePlan` format of `ui/agent/types.ts` targeting `data-action`, `name` and `data-page`
(D23, D48). The send button is `data-action="sendMessage"`; the dock's root is
`data-agent-ui`, so pressing its controls never counts as the user taking over.

## Messages

`ui.agent`, `ui.chat`, `ui.guide`, `ui.drive`, `ui.showMe`, `ui.doIt`, `ui.stop`, `ui.takeOver`,
`ui.askAgent`, `ui.send`, `ui.thinking`, `ui.next`, `ui.done`, `ui.close`, `ui.retry`,
`ui.planFailed` (a drive plan hit a missing target).

## Gotchas

- `AppShell` shows the dock column whenever the `dock` slot exists: put the `v-if` on the
  `<template #dock>`, not on the dock. Closing the dock unmounts it and stops a running plan.
- The dock must live in the shell, outside the `RouterView`: a plan that navigates unmounts
  whatever the route renders.
- Enter sends, Shift+Enter is a new line, Enter while an IME composes does nothing.
- The whole thread is one list read without a limit: fine for an assistant thread, not for a
  chat history of thousands (that wants cursor pages, see `patterns/showing-live-data.md`).
- On tablets and phones the shell's dock covers the page. Bind `running` to AppShell's
  `dockCollapsed`: while a plan runs the dock shrinks to a bottom strip with its header (title,
  Take over), and the plan reaches the page. Without the binding the dock hides the targets.
