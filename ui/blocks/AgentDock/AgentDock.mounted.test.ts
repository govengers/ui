// AgentDock mounted (D69, D98): with a cancel call Stop stands in for Send while the agent
// answers, Enter sends nothing until the answer ended, and the log follows new text only from its
// bottom. jsdom does not scroll and has no ResizeObserver: the scroll tests give the log its
// metrics by hand and report size changes through the harness's stand-in.
import { afterEach, expect, spyOn, test } from 'bun:test'
import type { Component } from 'vue'
import { ApiError, mutation, type LiveConnection, type NoParameters } from '../../../demo/src/api/runtime'
import { calls, live, type Message } from '../../../demo/src/fake/api'
import { key, mount, settle, type Mounted } from '../../../scripts/test/mount'
import { TestResizeObserver } from '../../../scripts/test/resize'
import AgentDock from './AgentDock.vue'

// The fake engine has no call that stops an answer; answerCancel answers it in the test.
const cancelAnswer = mutation<NoParameters, undefined, unknown>({ name: 'cancelAnswer', method: 'POST', path: '/conversation/cancel', pathParameters: [], body: false, content: false })

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

async function mountDock(withCancel: boolean): Promise<Mounted> {
  const mounted = mount(AgentDock as Component, () => ({ conversation: live.conversation, send: calls.sendMessage, ...(withCancel ? { cancel: cancelAnswer } : {}) }))
  view = mounted
  await settle()
  return mounted
}

/** The composer's one button: Send, or Stop while the agent answers. */
const action = (mounted: Mounted) => mounted.root.querySelector<HTMLButtonElement>('.ui-agent-dock__composer button')
const composer = (mounted: Mounted) => mounted.root.querySelector('textarea') as HTMLTextAreaElement
const sent = (mounted: Mounted, text: string) => mounted.engine.store.tables.conversation.some(message => message.role === 'user' && message.text === text)

function write(mounted: Mounted, text: string): void {
  composer(mounted).value = text
  composer(mounted).dispatchEvent(new Event('input', { bubbles: true }))
}

/** An agent message, newest of the thread; `streaming` while it is still being written. */
function reply(mounted: Mounted, id: string, streaming: boolean): void {
  const row: Message & { streaming: boolean } = { id, role: 'agent', text: 'Half an answer', createdAt: new Date().toISOString(), streaming }
  mounted.engine.store.insert('conversation', row)
}

function finish(mounted: Mounted, id: string): void {
  const end = { text: 'The whole answer', streaming: false }
  mounted.engine.store.update('conversation', id, end)
}

/** A click as a pointer makes it (`detail` 1) or as the keyboard does (0). */
function press(button: HTMLButtonElement | null, detail = 1): void {
  button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }))
}

/** The cancel call answers with `answer` instead of reaching the engine; returns the names dispatched. */
function answerCancel(mounted: Mounted, answer: () => Promise<unknown>): string[] {
  const dispatched: string[] = []
  const connection = mounted.pair.value.connection
  const call = connection.call.bind(connection)
  connection.call = (async (target, parameters, body, options) => {
    if (target.name !== cancelAnswer.name) return call(target, parameters, body, options)
    dispatched.push(target.name)
    return answer()
  }) as LiveConnection['call']
  return dispatched
}

test('Stop stands in for Send while an answer streams, and only with a cancel call', async () => {
  const dock = await mountDock(true)
  expect(action(dock)?.dataset['action']).toBe('sendMessage')
  reply(dock, 'msg-3', true)
  await settle()
  expect(action(dock)?.dataset['action']).toBe('cancelAnswer')
  expect(action(dock)?.getAttribute('aria-label')).toBe('Stop')
  expect(action(dock)?.type).toBe('button')
  finish(dock, 'msg-3')
  await settle()
  expect(action(dock)?.dataset['action']).toBe('sendMessage')
  expect(action(dock)?.type).toBe('submit')
  dock.unmount()

  const plain = await mountDock(false)
  reply(plain, 'msg-3', true)
  await settle()
  expect(action(plain)?.dataset['action']).toBe('sendMessage')
})

test('a click on Stop dispatches the cancel call once, however often Stop is pressed before the answer ends', async () => {
  const dock = await mountDock(true)
  reply(dock, 'msg-3', true)
  await settle()
  const dispatched = answerCancel(dock, async () => undefined) // accepted; the ending push comes later
  press(action(dock))
  await settle()
  expect(dispatched).toEqual(['cancelAnswer'])
  expect(action(dock)?.dataset['action']).toBe('cancelAnswer')
  expect(action(dock)?.getAttribute('aria-busy')).toBe('true')
  press(action(dock))
  await settle()
  expect(dispatched).toEqual(['cancelAnswer'])
  finish(dock, 'msg-3')
  await settle()
  expect(action(dock)?.dataset['action']).toBe('sendMessage')
  expect(dock.root.querySelector('[role="alert"]')).toBeNull()

  reply(dock, 'msg-4', true) // the latch ends with the answer: the next one can be stopped
  await settle()
  press(action(dock))
  await settle()
  expect(dispatched).toEqual(['cancelAnswer', 'cancelAnswer'])
})

test('an answer that ended before the cancel call answered leaves Stop usable for the next one', async () => {
  const dock = await mountDock(true)
  reply(dock, 'msg-3', true)
  await settle()
  const dispatched = answerCancel(dock, async () => {
    finish(dock, 'msg-3')
    await settle() // the ending push arrives first
  })
  press(action(dock))
  await settle()
  expect(action(dock)?.dataset['action']).toBe('sendMessage')
  expect(action(dock)?.getAttribute('aria-busy')).toBeNull()
  reply(dock, 'msg-4', true)
  await settle()
  press(action(dock))
  await settle()
  expect(dispatched).toEqual(['cancelAnswer', 'cancelAnswer'])
})

test('when the answer ends, focus on the button or lost since Stop was pressed goes to the composer', async () => {
  const dock = await mountDock(true)
  reply(dock, 'msg-3', true)
  await settle()
  answerCancel(dock, async () => finish(dock, 'msg-3'))
  action(dock)?.focus()
  press(action(dock), 0)
  await settle()
  expect(action(dock)?.dataset['action']).toBe('sendMessage')
  expect(document.activeElement).toBe(composer(dock))

  reply(dock, 'msg-4', true) // the answer ends by itself while the reader sits on Stop
  await settle()
  action(dock)?.focus()
  finish(dock, 'msg-4')
  await settle()
  expect(document.activeElement).toBe(composer(dock))

  reply(dock, 'msg-5', true) // Stop pressed, then the reader moved on: focus stays where they went
  await settle()
  answerCancel(dock, async () => undefined)
  press(action(dock))
  await settle()
  const chat = dock.root.querySelector<HTMLButtonElement>('.ui-agent-dock__mode')
  chat?.focus()
  finish(dock, 'msg-5')
  await settle()
  expect(document.activeElement).toBe(chat)
})

test('a press on the button just after the answer ended sends nothing: a double click on Stop keeps the draft', async () => {
  const dock = await mountDock(true)
  let now = 1000
  const clock = spyOn(performance, 'now').mockImplementation(() => now)
  try {
    reply(dock, 'msg-3', true)
    await settle()
    answerCancel(dock, async () => finish(dock, 'msg-3'))
    write(dock, 'dark mode')
    press(action(dock))
    await settle()
    expect(action(dock)?.dataset['action']).toBe('sendMessage')
    now += 250 // the second click of the double click lands on Send
    press(action(dock), 2)
    await settle()
    expect(sent(dock, 'dark mode')).toBe(false)
    expect(composer(dock).value).toBe('dark mode')
    now += 400 // past the guard: a press sends
    press(action(dock))
    await settle()
    expect(sent(dock, 'dark mode')).toBe(true)
  } finally {
    clock.mockRestore()
  }
})

test('a refused cancel shows in the alert and Stop stays', async () => {
  const dock = await mountDock(true)
  reply(dock, 'msg-3', true)
  await settle()
  answerCancel(dock, async () => {
    throw new ApiError(409, { code: 'conflict', message: 'The answer cannot be stopped now.' })
  })
  action(dock)?.click()
  await settle()
  expect(dock.root.querySelector('[role="alert"]')?.textContent).toBe('The answer cannot be stopped now.')
  expect(action(dock)?.dataset['action']).toBe('cancelAnswer')
})

test('Enter and the form send nothing while the agent answers and keep the draft; after the answer Enter sends', async () => {
  const dock = await mountDock(true)
  write(dock, 'Is it done?')
  key(composer(dock), 'Enter')
  await settle()
  expect(sent(dock, 'Is it done?')).toBe(true)
  expect(action(dock)?.dataset['action']).toBe('cancelAnswer') // the agent owes an answer
  write(dock, 'And the export?')
  const enter = key(composer(dock), 'Enter')
  dock.root.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await settle()
  expect(enter.defaultPrevented).toBe(true)
  expect(sent(dock, 'And the export?')).toBe(false)
  expect(composer(dock).value).toBe('And the export?')
  reply(dock, 'msg-4', false)
  await settle()
  key(composer(dock), 'Enter')
  await settle()
  expect(sent(dock, 'And the export?')).toBe(true)
  expect(composer(dock).value).toBe('')
})

test('a reader scrolled up stays put and gets Jump to latest; a reader at the bottom and a sent message follow', async () => {
  const dock = await mountDock(false)
  const log = dock.root.querySelector<HTMLElement>('[role="log"]') as HTMLElement
  expect(log.getAttribute('aria-label')).toBe('Conversation') // a tab stop and a focus target has a name, not the dock's
  let top = 0
  const scrolls: number[] = []
  Object.defineProperties(log, {
    scrollHeight: { get: () => 1000 },
    clientHeight: { get: () => 400 },
    scrollTop: { get: () => top },
  })
  const scrollTo = (to: number) => {
    top = to
    log.dispatchEvent(new Event('scroll'))
  }
  // The dock's own scroll lands at the bottom and fires a scroll event, as in a browser.
  log.scrollTo = ((options: ScrollToOptions) => {
    scrolls.push(options.top ?? 0)
    scrollTo(600)
  }) as typeof log.scrollTo
  log.style.lineHeight = '24px' // the slack: one line
  const jump = () => dock.root.querySelector<HTMLButtonElement>('.ui-agent-dock__jump')

  scrollTo(0) // the reader is at the top
  reply(dock, 'msg-3', false)
  await settle()
  expect(scrolls).toEqual([])
  expect(jump()?.textContent).toContain('Jump to latest')

  jump()?.click()
  await settle()
  expect(scrolls).toEqual([1000])
  expect(jump()).toBeNull()
  expect(document.activeElement).toBe(log)

  reply(dock, 'msg-4', false) // at the bottom now: the log follows
  await settle()
  expect(scrolls).toEqual([1000, 1000])
  expect(jump()).toBeNull()

  dock.engine.store.update('conversation', 'msg-4', { text: 'msg-4 grows' }) // the newest text grows at the bottom
  await settle()
  expect(scrolls).toEqual([1000, 1000, 1000])

  scrollTo(599) // a step up of one pixel escapes at once
  dock.engine.store.update('conversation', 'msg-4', { text: 'msg-4 grows further' }) // and grows below the reader
  await settle()
  expect(scrolls).toEqual([1000, 1000, 1000])
  expect(jump()).not.toBeNull()
  jump()?.click()
  await settle()
  expect(scrolls).toEqual([1000, 1000, 1000, 1000])

  scrollTo(590) // a step up smaller than a line escapes at once
  reply(dock, 'msg-5', false)
  await settle()
  expect(scrolls).toEqual([1000, 1000, 1000, 1000])
  expect(jump()).not.toBeNull()
  scrollTo(0)
  scrollTo(590) // on the way down a line from the bottom counts
  expect(jump()?.isConnected ?? false).toBe(true)
  await settle()
  expect(jump()).toBeNull()
  reply(dock, 'msg-6', false)
  await settle()
  expect(scrolls).toEqual([1000, 1000, 1000, 1000, 1000])

  scrollTo(0)
  write(dock, 'Thanks')
  key(composer(dock), 'Enter')
  await settle()
  expect(scrolls).toEqual([1000, 1000, 1000, 1000, 1000, 1000, 1000]) // on send, then on the sent message
  expect(jump()).toBeNull()
})

test('a step up in the frame of the dock\'s own scroll still escapes (one scroll event for both)', async () => {
  const dock = await mountDock(false)
  const log = dock.root.querySelector<HTMLElement>('[role="log"]') as HTMLElement
  let height = 1000
  let top = 600
  const scrolls: number[] = []
  Object.defineProperties(log, {
    scrollHeight: { get: () => height },
    clientHeight: { get: () => 400 },
    scrollTop: { get: () => top },
  })
  log.style.lineHeight = '24px'
  log.scrollTo = ((options: ScrollToOptions) => {
    scrolls.push(options.top ?? 0)
    top = height - 400 // no scroll event yet: the browser sends one per frame
  }) as typeof log.scrollTo
  log.dispatchEvent(new Event('scroll')) // at the bottom
  height = 1042
  dock.engine.store.update('conversation', 'msg-2', { text: 'grows' }) // the dock follows to 642
  await settle()
  expect(top).toBe(642)
  top = 639 // the reader's 3 px step up, in the same frame
  log.dispatchEvent(new Event('scroll'))
  height = 1084
  dock.engine.store.update('conversation', 'msg-2', { text: 'grows further' })
  await settle()
  expect(top).toBe(639)
  expect(scrolls).toEqual([1042])
  expect(dock.root.querySelector('.ui-agent-dock__jump')).not.toBeNull()
})

test('a box that changes size keeps a following reader at the bottom and a reader who scrolled up where they are', async () => {
  const dock = await mountDock(false)
  const log = dock.root.querySelector<HTMLElement>('[role="log"]') as HTMLElement
  const observer = TestResizeObserver.last
  let height = 1000
  let client = 400
  let top = 600
  const scrolls: number[] = []
  Object.defineProperties(log, {
    scrollHeight: { get: () => height },
    clientHeight: { get: () => client },
    scrollTop: { get: () => top },
  })
  log.style.lineHeight = '24px'
  log.scrollTo = ((options: ScrollToOptions) => {
    scrolls.push(options.top ?? 0)
    top = height - client
  }) as typeof log.scrollTo
  const scrolled = () => log.dispatchEvent(new Event('scroll'))
  scrolled() // at the bottom: following

  client = 401 // the box grows by 1 px; the browser clamps the position 1 px up,
  top = 599
  observer?.report() // reports the new size in the frame of the layout,
  scrolled() // and sends the clamp's scroll event in the next frame
  height = 1042
  dock.engine.store.update('conversation', 'msg-2', { text: 'grows' })
  await settle()
  expect(top).toBe(641)
  expect(dock.root.querySelector('.ui-agent-dock__jump')).toBeNull()

  client = 341 // a draft over several lines: the box shrinks, the reader stays at the bottom
  observer?.report()
  expect(top).toBe(701)

  top = 100 // a reader who scrolled up stays where they are
  scrolled()
  const before = scrolls.length
  client = 300
  observer?.report()
  client = 400
  observer?.report()
  expect(top).toBe(100)
  expect(scrolls.length).toBe(before)

  dock.unmount()
  view = undefined
  expect(observer?.disconnected).toBe(true)
})
