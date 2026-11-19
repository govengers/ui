// Mounts a piece in the jsdom of setup.ts with what the demo gives it: vue-i18n with the ui.*
// messages, a memory router that renders nothing (for links) and a livewire pair on a fresh fake
// engine without latency (D69).
import { createApp, h, nextTick, shallowRef, type Component, type ShallowRef } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createLivePair, type LivePair } from '../../demo/src/api/runtime'
import { livePlugin } from '../../demo/src/api/vue'
import { createFakeEngine, type FakeEngine } from '../../demo/src/fake/engine'
import { messages } from '../../ui/messages'

export interface Mounted {
  root: HTMLElement
  engine: FakeEngine
  /** The provided pair; put a new one in to switch identity. */
  pair: ShallowRef<LivePair>
  pairFor(identity: string): LivePair
  unmount(): void
}

/** The unmount of every view still mounted; setup.ts unmounts what a test left after it. */
const live = new Set<() => void>()

export function unmountAll(): void {
  for (const unmount of [...live]) unmount()
}

/** Mounts `component` with `props` (a function re-renders with its current answer). */
export function mount(component: Component, props: () => Record<string, unknown> = () => ({}), slots: Record<string, (scope: never) => unknown> = {}): Mounted {
  const engine = createFakeEngine({ latency: 0 })
  const pairFor = (identity: string): LivePair => createLivePair({
    identity: () => identity,
    client: { baseURL: '/api/v1', fetch: engine.fetch },
    // A dropped socket (engine.store.dropSockets) reconnects at once, so tests never wait on backoff.
    connection: { url: 'ws://fake/api/v1/socket', WebSocket: engine.WebSocket, reconnectDelay: 0 },
  })
  const pair = shallowRef(pairFor('test:ada'))
  const root = document.createElement('div')
  document.body.append(root)
  const app = createApp({ render: () => h(component, props(), slots) })
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:any(.*)*', component: { render: () => null } }] })
  app.use(createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages })).use(router).use(livePlugin(pair)).mount(root)
  // Once only: the test, its file's afterEach and the harness may each ask.
  const unmount = (): void => {
    if (!live.delete(unmount)) return
    app.unmount()
    pair.value.end()
    root.remove()
  }
  live.add(unmount)
  return { root, engine, pair, pairFor, unmount }
}

/** Lets the fake engine answer (its timers run at 0 ms) and Vue render. */
export async function settle(rounds = 4): Promise<void> {
  for (let round = 0; round < rounds; round++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
  }
}

export function key(target: Element, name: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}
