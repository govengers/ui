import { describe, expect, test } from 'bun:test'
import { ApiError } from '@/api/runtime'
import { entriesOf, fail, percent, replaceable, restart, room, succeed, type Upload, type UploadRow } from './fileUpload'

const upload = (patch: Partial<Upload>): Upload => ({
  key: 1, name: 'a.pdf', size: 10, state: 'uploading', progress: undefined, before: new Set(), id: undefined, error: undefined,
  file: undefined, retryable: false, replaces: undefined, idempotencyKey: 'k1', ...patch,
})
const row = (patch: Partial<UploadRow>): UploadRow => ({ id: 'f1', name: 'a.pdf', size: 10, status: 'ready', ...patch })
const shown = (uploads: Upload[], rows: UploadRow[] | undefined) => entriesOf(uploads, rows).map((entry) => [entry.key, entry.status, entry.progress])

describe('entriesOf', () => {
  test('without a live list every upload shows, with its progress while uploading', () => {
    expect(shown([upload({ progress: 40 }), upload({ key: 2, state: 'done', id: 'f2', progress: 100 })], undefined))
      .toEqual([['upload-1', 'uploading', 40], ['upload-2', 'ready', undefined]])
    expect(shown([upload({})], undefined)).toEqual([['upload-1', 'uploading', undefined]])
  })

  test('the row pushed before the answer hides behind the upload; a row there before does not', () => {
    expect(shown([upload({ progress: 100 })], [row({})])).toEqual([['upload-1', 'uploading', 100]])
    expect(shown([upload({ before: new Set(['f1']) })], [row({})])).toEqual([['upload-1', 'uploading', undefined], ['f1', 'ready', undefined]])
    expect(shown([upload({})], [row({ size: 11 })])).toEqual([['upload-1', 'uploading', undefined], ['f1', 'ready', undefined]])
  })

  test('an answered upload gives way to the row of its id only, which keeps the upload\'s key', () => {
    expect(shown([upload({ state: 'done', id: 'f1' })], [row({ status: 'scanning' })])).toEqual([['upload-1', 'scanning', undefined]])
    expect(shown([upload({ state: 'done', id: 'f9' })], [row({})])).toEqual([['upload-1', 'ready', undefined], ['f1', 'ready', undefined]])
  })

  test('two uploads of one name and size: the answered one shows its row, the other hides only new rows', () => {
    const answered = upload({ state: 'done', id: 'f1' })
    const sending = upload({ key: 2 })
    expect(shown([sending, answered], [row({ id: 'f2' }), row({})])).toEqual([['upload-2', 'uploading', undefined], ['upload-1', 'ready', undefined]])
  })

  test('the page\'s uploads keep their place, newest pick first, answered or not; other rows follow in the server\'s order', () => {
    const retried = upload({ key: 3, state: 'done', id: 'fA' })
    const failed = [upload({ key: 2, state: 'failed' }), upload({ key: 1, state: 'failed' })]
    expect(shown([retried, ...failed], [row({ id: 'fX' }), row({ id: 'fA', status: 'scanning' }), row({ id: 'fY' })]))
      .toEqual([['upload-3', 'scanning', undefined], ['upload-2', 'failed', undefined], ['upload-1', 'failed', undefined], ['fX', 'ready', undefined], ['fY', 'ready', undefined]])
  })

  test('two uploads the server answered with one id show one row, in the newer place', () => {
    expect(shown([upload({ key: 2, state: 'done', id: 'f1' }), upload({ key: 1, state: 'done', id: 'f1' })], [row({})])).toEqual([['upload-2', 'ready', undefined]])
  })

  test('a failed upload always shows and hides nothing', () => {
    expect(shown([upload({ state: 'failed', error: 'too big' })], [row({})])).toEqual([['upload-1', 'failed', undefined], ['f1', 'ready', undefined]])
  })

  test('with maxFiles 1 a new pick replaces the one finished file, never an uploading one or one of several', () => {
    const entries = (rows: UploadRow[]) => entriesOf([], rows)
    expect(replaceable(entries([row({})]), 1)?.key).toBe('f1')
    expect(replaceable(entriesOf([upload({ state: 'done', id: 'f2' })], undefined), 1)?.key).toBe('upload-1')
    expect(replaceable(entriesOf([upload({ state: 'failed' })], [row({})]), 1)?.key).toBe('f1')
    expect(replaceable(entriesOf([upload({})], undefined), 1)).toBeUndefined()
    expect(replaceable(entries([row({}), row({ id: 'f2' })]), 1)).toBeUndefined()
    expect(replaceable(entries([row({})]), 2)).toBeUndefined()
    expect(replaceable(entries([]), 1)).toBeUndefined()
  })

  test('a row without status is ready, another status shows as is', () => {
    expect(shown([], [{ id: 'f1', name: 'a', size: 1 }, row({ id: 'f2', status: 'scanning' })])).toEqual([['f1', 'ready', undefined], ['f2', 'scanning', undefined]])
  })
})

test('percent: of a known total, rounded and capped; none without one', () => {
  expect(percent(1, 3)).toBe(33)
  expect(percent(5, 4)).toBe(100)
  expect(percent(5, null)).toBeUndefined()
  expect(percent(0, 0)).toBeUndefined()
})

describe('room', () => {
  const rows = (...ids: string[]) => entriesOf([], ids.map((id) => row({ id })))

  test('failed rows take no slot; the replaced row gives its slot back; no limit is endless', () => {
    const failed = entriesOf([upload({ state: 'failed' })], [row({})])
    expect(room(failed, 2, undefined)).toBe(1)
    expect(room(failed, 1, undefined)).toBe(0)
    expect(room(failed, 1, failed[1])).toBe(1)
    expect(room(rows('f1', 'f2'), 2, undefined)).toBe(0)
    expect(room(rows('f1', 'f2'), undefined, undefined)).toBe(Infinity)
  })
})

describe('the steps of one upload', () => {
  const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })

  test('a restart sends from byte 0 and hides only rows that arrive after it', () => {
    const again = upload({ state: 'failed', progress: 60, error: 'gone', before: new Set(['f0']), file })
    restart(again, ['f1', 'f2'])
    expect([again.state, again.progress, again.error, [...again.before], again.file]).toEqual(['uploading', undefined, undefined, ['f1', 'f2'], file])
  })

  test('a success keeps the answer\'s id and lets the bytes and the replaced row go', () => {
    const done = upload({ file, replaces: entriesOf([], [row({})])[0] })
    succeed(done, { id: 7 })
    expect([done.state, done.id, done.file, done.replaces]).toEqual(['done', '7', undefined, undefined])
    succeed(done, null)
    expect(done.id).toBeUndefined()
  })

  test('no answer or a server error can be retried and keeps the bytes; a refusal with field errors cannot', () => {
    const offline = upload({ file })
    fail(offline, new TypeError('no answer'))
    expect([offline.state, offline.error, offline.retryable, offline.file]).toEqual(['failed', undefined, true, file])
    const broken = upload({ file })
    fail(broken, new ApiError(500, { code: 'internal', message: 'internal error' }))
    expect([broken.error, broken.retryable, broken.file]).toEqual(['internal error', true, file])
    const refused = upload({ file })
    fail(refused, new ApiError(400, { code: 'invalid_request', message: 'invalid', fields: { file: 'must be one of application/pdf' } }))
    expect([refused.error, refused.retryable, refused.file]).toEqual(['must be one of application/pdf', false, undefined])
  })

  test('an upload whose bytes are gone (it was in when a later step threw) cannot be retried', () => {
    const stored = upload({ file })
    succeed(stored, { id: 'f1' })
    fail(stored, new Error('a listener threw'))
    expect([stored.state, stored.retryable]).toEqual(['failed', false])
  })
})
