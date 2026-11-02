// The list FileUpload shows: the uploads of this page the server's live list does not show yet,
// then the server's rows. Pure, so the matching is tested without a browser.

/** A row of the live list of files: what the list needs of it. */
export interface UploadRow {
  id: string
  name: string
  size: number
  /** 'uploading' shows a progress bar, 'ready' a success badge, another word shows as is. */
  status?: string
  /** 0..100 while uploading. */
  progress?: number
}

/** One file this page sends. */
export interface Upload {
  key: number
  name: string
  size: number
  state: 'uploading' | 'done' | 'failed'
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
 * Merges the page's uploads with the live rows (none without a live list). An upload shows until
 * the list has its row: by id once answered, before that the uploading row of its name and size.
 * A failed upload has no row and always shows.
 */
export function entriesOf(uploads: readonly Upload[], rows: readonly UploadRow[] | undefined): Entry[] {
  const listed = (upload: Upload): boolean => rows !== undefined && upload.state !== 'failed' && rows.some((row) => (upload.id !== undefined
    ? row.id === upload.id
    : row.status === 'uploading' && row.name === upload.name && row.size === upload.size))
  const local = uploads.filter((upload) => !listed(upload)).map((upload): Entry => ({
    key: `upload-${upload.key}`, name: upload.name, size: upload.size, status: upload.state === 'done' ? 'ready' : upload.state,
    progress: undefined, error: upload.error, id: upload.id, upload,
  }))
  return [...local, ...(rows ?? []).map((row): Entry => ({
    key: row.id, name: row.name, size: row.size, status: row.status ?? 'ready',
    progress: row.status === 'uploading' ? row.progress : undefined, error: undefined, id: row.id, upload: undefined,
  }))]
}
