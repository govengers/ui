---
name: Adding the in-app agent
tier: pattern
intent: [assistant, chatbot, in-app agent, guide mode, show me how, drive mode, automation, app map]
uses: [AgentDock, Spotlight, AgentCursor, AppShell]
livewire: true
status: ready
---

# Adding the in-app agent

Every application ships the agent from the start (P9): chat that knows the app, guide that shows
where to click, drive that clicks on the user's behalf, background that runs server side.

## In the project

1. Every page root has `data-page`, every mutating control `data-action` equal to the livewire
   call, every field `name` (D23). `ui-lint` enforces it; this is the whole DOM contract.
2. Each page folder exports `actions.ts` (`AgentAction[]`, D48) and the page binds them with
   `useAgentAction(action, run)` while mounted.
3. `scripts/app-map.ts` writes `src/app-map.json` from the route meta and the `actions.ts`
   files; the server embeds it and hands it to the agent as its tool vocabulary.
4. The shell renders `AgentDock` in the `dock` slot with `conversation = live.conversation` and
   `send = calls.sendMessage`; the dock executes `navigate`, runs guide plans with `Spotlight`
   and drive plans with `AgentCursor`.
5. `DESIGN.md` lists the actions whose submit may run unattended in drive mode (D27); every
   other mutating step pauses on its button.

## On the server

The agent runs in the app's Go server on `govengers/aikido`; its tools are the livewire calls
(background mode) plus the client-side `navigate`, `spotlight` and `drive` events it attaches to
its messages as a `DrivePlan`. Streamed tokens are pushes on the conversation resource (D26).
No tour is hand-written: the plan is derived from `app-map.json` and the page intents (D28).
