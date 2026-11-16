// The list FileUpload shows: the uploads of this page the server's live list does not show yet,
// then the server's rows. Pure, so the matching is tested without a browser.

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

/**
 * Merges the page's uploads with the live rows (none without a live list). An answered upload
 * gives way to the row of its id. The server pushes that row before its answer arrives, so until
 * the answer a new row of an uploading file's name and size is hidden behind the upload. A failed
 * upload has no row and always shows.
 */
export function entriesOf(uploads: readonly Upload[], rows: readonly UploadRow[] | undefined): Entry[] {
  const listed = (upload: Upload): boolean => upload.id !== undefined && rows !== undefined && rows.some((row) => row.id === upload.id)
  const answered = new Set(uploads.map((upload) => upload.id))
  const pending = uploads.filter((upload) => upload.state === 'uploading')
  const behind = (row: UploadRow): boolean => !answered.has(row.id)
    && pending.some((upload) => !upload.before.has(row.id) && row.name === upload.name && row.size === upload.size)
  const local = uploads.filter((upload) => !listed(upload)).map((upload): Entry => ({
    key: `upload-${upload.key}`, name: upload.name, size: upload.size, status: upload.state === 'done' ? 'ready' : upload.state,
    progress: upload.state === 'uploading' ? upload.progress : undefined, error: upload.error, id: upload.id, upload,
  }))
  return [...local, ...(rows ?? []).filter((row) => !behind(row)).map((row): Entry => ({
    key: row.id, name: row.name, size: row.size, status: row.status ?? 'ready', progress: undefined, error: undefined, id: row.id, upload: undefined,
  }))]
}
