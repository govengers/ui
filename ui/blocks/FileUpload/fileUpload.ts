// The list FileUpload shows: the uploads of this page the server's live list does not show yet,
// then the server's rows; and the steps of one upload. Free of the view, so both are tested
// without a browser.
import { ApiError } from '@/api/runtime'

/** A row of the live list of files: what the list needs of it. */
export interface UploadRow {
  id: string
  name: string
  size: number
  /** 'ready' (or none) shows a success badge, another word (`scanning`) shows as is. */
  status?: string
}

/** One file this page sends. */
export interface Upload {
  key: number
  name: string
  size: number
  state: 'uploading' | 'done' | 'failed'
  /** 0..100 of the body sent (Client.upload's onProgress); undefined while the platform cannot tell. */
  progress: number | undefined
  /** The ids the live list held when the upload started: a row not among them may be this upload's. */
  before: ReadonlySet<string>
  /** The id of the answer, once there is one. */
  id: string | undefined
  error: string | undefined
  /** The picked file, held only while a retry is possible: let go once it is in or refused. */
  file: File | undefined
  /** False when the server refused the file with field errors: sending it again cannot succeed. */
  retryable: boolean
  /** The row a single-file upload replaces once it succeeds. */
  replaces: Entry | undefined
  /** Sent with every try, so a file whose answer was lost is not stored twice. */
  idempotencyKey: string
}

export interface Entry {
  key: string
  name: string
  size: number
  status: string
  /** 0..100; undefined while uploading is an indeterminate bar. */
  progress: number | undefined
  error: string | undefined
  id: string | undefined
  /** The page's own upload behind the entry, which remove() drops. */
  upload: Upload | undefined
}

/** The percent of an upload's body sent, undefined when its total is unknown. */
export function percent(loaded: number, total: number | null): number | undefined {
  return total === null || total <= 0 ? undefined : Math.min(100, Math.round((loaded / total) * 100))
}

/**
 * The entry a new pick replaces: with `maxFiles` 1, the one finished file in the list. None while
 * it still uploads (an upload cannot be cancelled), and none when the list holds more than one
 * file, so a list that is not this field's alone is never emptied.
 */
export function replaceable(entries: readonly Entry[], maxFiles: number | undefined): Entry | undefined {
  const kept = entries.filter((entry) => entry.status !== 'failed')
  return maxFiles === 1 && kept.length === 1 && kept[0]?.status !== 'uploading' ? kept[0] : undefined
}

/** How many more files fit: failed rows take no slot, the row a pick replaces gives its slot back. */
export function room(entries: readonly Entry[], maxFiles: number | undefined, replacing: Entry | undefined): number {
  if (maxFiles === undefined) return Infinity
  return maxFiles - entries.filter((entry) => entry.status !== 'failed').length + (replacing === undefined ? 0 : 1)
}

/** Sends an upload (again) from byte 0; `listed` are the live rows already there, which never hide behind it. */
export function restart(upload: Upload, listed: Iterable<string>): void {
  upload.state = 'uploading'
  upload.progress = undefined
  upload.error = undefined
  upload.before = new Set(listed)
}

/**
 * The server took the file: done under the answer's id. The bytes and the replaced row are let
 * go; the caller removes the row it read before.
 */
export function succeed(upload: Upload, response: unknown): void {
  const id = (response as { id?: unknown } | null)?.id
  upload.state = 'done'
  upload.id = typeof id === 'string' || typeof id === 'number' ? String(id) : undefined
  upload.file = undefined
  upload.replaces = undefined
}

/**
 * The upload failed. A refusal with field errors shows its first and cannot be retried into
 * acceptance, so its bytes go; anything else (no answer, a server error) keeps them for Retry.
 */
export function fail(upload: Upload, failure: unknown): void {
  const refused = failure instanceof ApiError && Object.keys(failure.fields).length > 0
  upload.state = 'failed'
  upload.error = failure instanceof ApiError ? (Object.values(failure.fields)[0] ?? failure.message) : undefined
  upload.retryable = !refused && upload.file !== undefined
  if (refused) upload.file = undefined
}

/**
 * Merges the page's uploads with the live rows (none without a live list). The page's uploads
 * come first, newest pick on top, each in its place for the life of the piece: an answered one
 * shows the server's row of its id there, under the upload's key, so its element never moves (a
 * moved element loses focus) and no push shifts it under the pointer. The other rows follow in the
 * server's order, which a reload applies to all. The server pushes an upload's row before its
 * answer arrives, so until the answer a new row of an uploading file's name and size is hidden
 * behind the upload. A failed upload has no row and always shows.
 */
export function entriesOf(uploads: readonly Upload[], rows: readonly UploadRow[] | undefined): Entry[] {
  const byId = new Map((rows ?? []).map((row) => [row.id, row] as const))
  const answered = new Set(uploads.map((upload) => upload.id))
  const pending = uploads.filter((upload) => upload.state === 'uploading')
  const behind = (row: UploadRow): boolean => pending.some((upload) => !upload.before.has(row.id) && row.name === upload.name && row.size === upload.size)
  const shown = (row: UploadRow, key: string): Entry => ({
    key, name: row.name, size: row.size, status: row.status ?? 'ready', progress: undefined, error: undefined, id: row.id, upload: undefined,
  })
  const placed = new Set<string>()
  const own = uploads.flatMap((upload): Entry[] => {
    const row = upload.id === undefined ? undefined : byId.get(upload.id)
    if (row === undefined) {
      return [{
        key: `upload-${upload.key}`, name: upload.name, size: upload.size, status: upload.state === 'done' ? 'ready' : upload.state,
        progress: upload.state === 'uploading' ? upload.progress : undefined, error: upload.error, id: upload.id, upload,
      }]
    }
    // Two uploads the server answered with one id (it deduplicated the file): one row, the newer place.
    if (placed.has(row.id)) return []
    placed.add(row.id)
    return [shown(row, `upload-${upload.key}`)]
  })
  return [...own, ...(rows ?? []).filter((row) => !answered.has(row.id) && !behind(row)).map((row) => shown(row, row.id))]
}
