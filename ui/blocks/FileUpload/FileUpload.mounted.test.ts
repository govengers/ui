// FileUpload mounted (D69): the file's row, pushed before the upload's answer, never shows twice.
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

test('an upload shows once: its own row, then the live row of its answer', async () => {
  let exposed: { add(files: Iterable<File>): void } | undefined
  view = mount(FileUpload as Component, () => ({ upload: uploads.uploadFile, files: live.files, name: 'files', ref: (value: unknown) => { exposed = value as typeof exposed } }))
  // The answer reaches the client a few turns after the row's push, as over a network.
  const engine = view.engine
  view.pair.value = createLivePair({
    identity: () => 'test:ada',
    client: { baseURL: '/api/v1', fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await engine.fetch(input, init)
      await settle(3)
      return response
    }) as typeof fetch },
    connection: { url: 'ws://fake/api/v1/socket', WebSocket: engine.WebSocket },
  })
  await settle()
  const named = () => [...view!.root.querySelectorAll('.ui-file-upload__name')].filter((name) => name.textContent === 'report.pdf').length
  exposed?.add([new File(['%PDF-1.4 report'], 'report.pdf', { type: 'application/pdf' })])
  const counts: number[] = []
  for (let round = 0; round < 12; round++) {
    await settle(1)
    counts.push(named())
  }
  expect(Math.max(...counts)).toBe(1)
  expect(counts.at(-1)).toBe(1)
  expect(view.root.querySelector('.ui-file-upload__progress')).toBeNull()
})
