// FileUpload mounted (D69): the file's row, pushed before the upload's answer, never shows twice;
// a failed upload offers Retry unless the server refused the file (D99).
import { afterEach, expect, test } from 'bun:test'
import type { Component } from 'vue'
import { createLivePair } from '../../../demo/src/api/runtime'
import { live, uploads } from '../../../demo/src/fake/api'
import { mount, settle, type Mounted } from '../../../scripts/test/mount'
import FileUpload from './FileUpload.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

type Uploader = { add(files: Iterable<File>): void }

/**
 * Mounts FileUpload on a pair whose network can be down: then a request gets no answer, as
 * offline. Up, the answer reaches the client a few turns after the row's push, as over a network.
 * `keys` holds the Idempotency-Key of every upload sent, down or up.
 */
async function mountUpload(props: Record<string, unknown>): Promise<{ view: Mounted; add(name: string): void; network: { down: boolean }; keys: string[] }> {
  let exposed: Uploader | undefined
  const mounted = mount(FileUpload as Component, () => ({ upload: uploads.uploadFile, name: 'files', ref: (value: unknown) => { exposed = value as Uploader }, ...props }))
  const network = { down: false }
  const keys: string[] = []
  const engine = mounted.engine
  mounted.pair.value = createLivePair({
    identity: () => 'test:ada',
    client: { baseURL: '/api/v1', fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') keys.push((init.headers as Record<string, string>)['Idempotency-Key'] ?? '')
      if (network.down) throw new TypeError('Failed to fetch')
      const response = await engine.fetch(input, init)
      await settle(3)
      return response
    }) as typeof fetch },
    connection: { url: 'ws://fake/api/v1/socket', WebSocket: engine.WebSocket },
  })
  await settle()
  const add = (name: string): void => exposed?.add([new File([`%PDF-1.4 ${name}`], name, { type: name.endsWith('.gif') ? 'image/gif' : 'application/pdf' })])
  return { view: mounted, add, network, keys }
}

const rowsNamed = (name: string): Element[] => [...view!.root.querySelectorAll('.ui-file-upload__row')].filter((row) => row.querySelector('.ui-file-upload__name')?.textContent === name)
const names = (): string[] => [...view!.root.querySelectorAll('.ui-file-upload__name')].map((name) => name.textContent ?? '')
const retryOf = (name: string): HTMLButtonElement | null => view!.root.querySelector(`button[aria-label="Retry ${name}"]`)
const removeOf = (name: string): HTMLButtonElement | null => view!.root.querySelector(`button[aria-label="Remove ${name}"]`)
const problems = (): string => view!.root.querySelector('.ui-file-upload__problems')?.textContent ?? ''
/** Waits until no upload runs (its bar shows while it does): answered over the slow network of mountUpload, or failed. */
async function answered(): Promise<void> {
  await settle(1)
  for (let round = 0; round < 30 && view!.root.querySelector('.ui-file-upload__progress') !== null; round++) await settle(1)
  // Vue drops a click stamped in the millisecond its button's listener was attached (Button's
  // capture listener stamps it first), so a button rendered just now needs the clock to move.
  await new Promise((resolve) => setTimeout(resolve, 2))
}

test('an upload shows once: its own row, then the live row of its answer', async () => {
  const mounted = await mountUpload({ files: live.files })
  view = mounted.view
  mounted.add('report.pdf')
  const counts: number[] = []
  for (let round = 0; round < 12; round++) {
    await settle(1)
    counts.push(rowsNamed('report.pdf').length)
  }
  expect(Math.max(...counts)).toBe(1)
  expect(counts.at(-1)).toBe(1)
  expect(view.root.querySelector('.ui-file-upload__progress')).toBeNull()
})

test('no answer offers Retry: it sends the same key, the row keeps its place and focus, the file shows once', async () => {
  const uploaded: unknown[] = []
  const mounted = await mountUpload({ files: live.files, onUploaded: (response: unknown) => uploaded.push(response) })
  view = mounted.view
  mounted.network.down = true
  // Three uploads fail (the network dropped); Retry on the top one, the newest pick.
  for (const name of ['older-1.pdf', 'older-2.pdf', 'report.pdf']) {
    mounted.add(name)
    await answered()
  }
  expect(rowsNamed('report.pdf')[0]?.textContent).toContain('Failed')
  const retry = retryOf('report.pdf')
  expect(retry?.dataset['action']).toBe('uploadFile')
  mounted.network.down = false
  retry?.focus()
  retry?.click()
  const row = rowsNamed('report.pdf')[0]
  expect(document.activeElement).toBe(row!)
  const counts: number[] = []
  for (let round = 0; round < 12; round++) {
    await settle(1)
    counts.push(rowsNamed('report.pdf').length)
  }
  expect(Math.max(...counts)).toBe(1)
  expect(counts.at(-1)).toBe(1)
  expect(rowsNamed('report.pdf')[0]?.textContent).not.toContain('Failed')
  expect(retryOf('report.pdf')).toBeNull()
  expect(uploaded).toHaveLength(1)
  // The server's row took the upload's place: the same element, still on top above the failed
  // ones, never moved (a moved element loses focus in a browser; jsdom keeps it, so the place is
  // what this test can see).
  expect(view.root.querySelector('.ui-file-upload__row')).toBe(row!)
  expect(names().slice(0, 3)).toEqual(['report.pdf', 'older-2.pdf', 'older-1.pdf'])
  expect(document.activeElement).toBe(row!)
  // Both tries carry one key; a new pick of the same file is another upload with its own.
  mounted.network.down = true
  mounted.add('report.pdf')
  await settle(1)
  const [, , first, again, pick] = mounted.keys
  expect(mounted.keys).toHaveLength(5)
  expect(again).toBe(first!)
  expect(pick).not.toBe(first!)
})

test('a script that clicks Retry twice and Remove in one task sends once and keeps the row', async () => {
  const uploaded: unknown[] = []
  const mounted = await mountUpload({ onUploaded: (response: unknown) => uploaded.push(response) })
  view = mounted.view
  mounted.network.down = true
  mounted.add('a.pdf')
  await answered()
  mounted.network.down = false
  retryOf('a.pdf')?.click()
  retryOf('a.pdf')?.click()
  removeOf('a.pdf')?.click()
  await answered()
  expect(mounted.keys).toHaveLength(2)
  expect(rowsNamed('a.pdf')[0]?.textContent).toContain('Ready')
  expect(uploaded).toHaveLength(1)
})

test('a refusal with field errors shows the reason and no Retry; removing it twice keeps the others', async () => {
  const mounted = await mountUpload({})
  view = mounted.view
  mounted.add('keep.pdf')
  await answered()
  mounted.add('animation.gif')
  await answered()
  expect(rowsNamed('animation.gif')[0]?.textContent).toContain('must be one of')
  expect(retryOf('animation.gif')).toBeNull()
  const remove = removeOf('animation.gif')
  remove?.click()
  remove?.click()
  await settle()
  expect(names()).toEqual(['keep.pdf'])
})

test('with maxFiles 1 a failed replacement leaves the old file, and its retry replaces it', async () => {
  const mounted = await mountUpload({ maxFiles: 1 })
  view = mounted.view
  mounted.add('old.pdf')
  await answered()
  mounted.network.down = true
  mounted.add('new.pdf')
  await answered()
  expect(names()).toEqual(['new.pdf', 'old.pdf'])
  expect(rowsNamed('old.pdf')[0]?.textContent).toContain('Ready')
  mounted.network.down = false
  retryOf('new.pdf')?.click()
  await settle(1)
  expect(rowsNamed('new.pdf')[0]?.textContent).toContain('Uploading')
  expect(names()).toEqual(['new.pdf', 'old.pdf'])
  await answered()
  expect(names()).toEqual(['new.pdf'])
  expect(rowsNamed('new.pdf')[0]?.textContent).toContain('Ready')
})

test('maxFiles 1: the old file removed meanwhile (after a refused try) is not removed again by the retry', async () => {
  const removed: string[] = []
  const mounted = await mountUpload({ maxFiles: 1, remove: { name: 'deleteFile' } })
  view = mounted.view
  // The engine has no remove call: the first refuses without an answer, the next one works.
  mounted.view.pair.value.connection.call = (async (_target: unknown, parameters: { id: string }) => {
    removed.push(parameters.id)
    if (removed.length === 1) throw new TypeError('no answer')
  }) as typeof mounted.view.pair.value.connection.call
  mounted.add('old.pdf')
  await answered()
  mounted.network.down = true
  mounted.add('new.pdf')
  await answered()
  removeOf('old.pdf')?.click()
  await settle()
  expect(problems()).toBe('Could not remove old.pdf. Try again.')
  removeOf('old.pdf')?.click()
  await settle()
  expect(names()).toEqual(['new.pdf'])
  mounted.network.down = false
  retryOf('new.pdf')?.click()
  await answered()
  expect(names()).toEqual(['new.pdf'])
  expect(rowsNamed('new.pdf')[0]?.textContent).toContain('Ready')
  expect(removed).toHaveLength(2)
})

test('a retry without room is refused with the message; the row stays failed and keeps Retry', async () => {
  const mounted = await mountUpload({ maxFiles: 2 })
  view = mounted.view
  mounted.add('a.pdf')
  await answered()
  mounted.network.down = true
  mounted.add('b.pdf')
  await answered()
  mounted.network.down = false
  mounted.add('c.pdf')
  await answered()
  retryOf('b.pdf')?.click()
  await answered()
  expect(problems()).toBe('At most 2 files.')
  expect(rowsNamed('b.pdf')[0]?.textContent).toContain('Failed')
  expect(retryOf('b.pdf')).not.toBeNull()
})

test('the row shows the percent sent while the runtime reports it, nothing while it cannot tell', async () => {
  const mounted = await mountUpload({})
  view = mounted.view
  let report: ((loaded: number, total: number | null) => void) | undefined
  mounted.view.pair.value.client.upload = (async (_target: unknown, _parameters: unknown, _file: Blob, options: { onProgress?: typeof report }) => {
    report = options.onProgress
    return new Promise(() => undefined)
  }) as typeof mounted.view.pair.value.client.upload
  mounted.add('report.pdf')
  await settle(1)
  const meta = (): string => view!.root.querySelector('.ui-file-upload__meta')?.textContent ?? ''
  expect(meta()).not.toContain('%')
  report?.(40, 100)
  await settle(1)
  expect(meta()).toContain('40%')
  report?.(40, null)
  await settle(1)
  expect(meta()).not.toContain('%')
})
