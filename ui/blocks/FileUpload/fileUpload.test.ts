import { describe, expect, test } from 'bun:test'
import { entriesOf, replaceable, type Upload, type UploadRow } from './fileUpload'

const upload = (patch: Partial<Upload>): Upload => ({ key: 1, name: 'a.pdf', size: 10, state: 'uploading', id: undefined, error: undefined, ...patch })
const row = (patch: Partial<UploadRow>): UploadRow => ({ id: 'f1', name: 'a.pdf', size: 10, status: 'uploading', progress: 25, ...patch })
const shown = (uploads: Upload[], rows: UploadRow[] | undefined) => entriesOf(uploads, rows).map((entry) => [entry.key, entry.status, entry.progress])

describe('entriesOf', () => {
  test('without a live list every upload shows, indeterminate while uploading', () => {
    expect(shown([upload({}), upload({ key: 2, state: 'done', id: 'f2' })], undefined)).toEqual([['upload-1', 'uploading', undefined], ['upload-2', 'ready', undefined]])
  })

  test('the live row of the same name and size replaces an unanswered upload and brings its progress', () => {
    expect(shown([upload({})], [row({})])).toEqual([['f1', 'uploading', 25]])
    expect(shown([upload({})], [row({ size: 11 })])).toEqual([['upload-1', 'uploading', undefined], ['f1', 'uploading', 25]])
  })

  test('an answered upload matches by id only', () => {
    expect(shown([upload({ state: 'done', id: 'f1' })], [row({ status: 'ready', progress: 100 })])).toEqual([['f1', 'ready', undefined]])
    expect(shown([upload({ state: 'done', id: 'f9' })], [row({ status: 'ready' })])).toEqual([['upload-1', 'ready', undefined], ['f1', 'ready', undefined]])
  })

  test('a failed upload always shows, even beside an uploading row of its name and size', () => {
    expect(shown([upload({ state: 'failed', error: 'too big' })], [row({})])).toEqual([['upload-1', 'failed', undefined], ['f1', 'uploading', 25]])
  })

  test('with maxFiles 1 a new pick replaces the one finished file, never an uploading one or one of several', () => {
    const entries = (rows: UploadRow[]) => entriesOf([], rows)
    expect(replaceable(entries([row({ status: 'ready' })]), 1)?.key).toBe('f1')
    expect(replaceable(entriesOf([upload({ state: 'done', id: 'f2' })], undefined), 1)?.key).toBe('upload-1')
    expect(replaceable(entriesOf([upload({ state: 'failed' })], [row({ status: 'ready' })]), 1)?.key).toBe('f1')
    expect(replaceable(entries([row({})]), 1)).toBeUndefined()
    expect(replaceable(entries([row({ status: 'ready' }), row({ id: 'f2', status: 'ready' })]), 1)).toBeUndefined()
    expect(replaceable(entries([row({ status: 'ready' })]), 2)).toBeUndefined()
    expect(replaceable(entries([]), 1)).toBeUndefined()
  })

  test('a row without status is ready, another status shows as is', () => {
    expect(shown([], [{ id: 'f1', name: 'a', size: 1 }, row({ id: 'f2', status: 'scanning' })])).toEqual([['f1', 'ready', undefined], ['f2', 'scanning', undefined]])
  })
})
