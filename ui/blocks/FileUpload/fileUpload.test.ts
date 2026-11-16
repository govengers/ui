import { describe, expect, test } from 'bun:test'
import { entriesOf, percent, replaceable, type Upload, type UploadRow } from './fileUpload'

const upload = (patch: Partial<Upload>): Upload => ({ key: 1, name: 'a.pdf', size: 10, state: 'uploading', progress: undefined, before: new Set(), id: undefined, error: undefined, ...patch })
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

  test('an answered upload gives way to the row of its id only', () => {
    expect(shown([upload({ state: 'done', id: 'f1' })], [row({ status: 'scanning' })])).toEqual([['f1', 'scanning', undefined]])
    expect(shown([upload({ state: 'done', id: 'f9' })], [row({})])).toEqual([['upload-1', 'ready', undefined], ['f1', 'ready', undefined]])
  })

  test('two uploads of one name and size: the answered one shows its row, the other hides only new rows', () => {
    const answered = upload({ state: 'done', id: 'f1' })
    const sending = upload({ key: 2 })
    expect(shown([sending, answered], [row({ id: 'f2' }), row({})])).toEqual([['upload-2', 'uploading', undefined], ['f1', 'ready', undefined]])
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
