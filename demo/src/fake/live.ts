// The demo's livewire pair (D14), built like a project's live.ts but on the fake engine: one
// Client and LiveConnection for the identity demo:ada, provided to Vue through livePlugin.
// main.ts installs `plugin`; a demo reaches the tables through `engine.store` (tick, update).

import { shallowRef } from 'vue'
import { createLivePair } from '../api/runtime'
import { livePlugin } from '../api/vue'
import { createFakeEngine } from './engine'

export const engine = createFakeEngine()

export const pair = shallowRef(createLivePair({
  identity: () => 'demo:ada',
  client: { baseURL: '/api/v1', fetch: engine.fetch },
  connection: { url: 'ws://fake/api/v1/socket', WebSocket: engine.WebSocket },
}))

export const plugin = livePlugin(pair)
