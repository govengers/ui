// ColumnsPicker's model, framework-free: the visible keys in column order with the required ones
// always in, and their copy in localStorage.

export interface ColumnOption {
  key: string
  label: string
  /** Always shown; its checkbox is ticked and disabled. */
  required?: boolean | undefined
}

/** The visible keys in column order: unknown keys dropped, required keys added. */
export function normalize(visible: readonly string[], columns: readonly ColumnOption[]): string[] {
  return columns.filter(column => column.required || visible.includes(column.key)).map(column => column.key)
}

/** The part of the Web Storage API the picker needs; localStorage in the browser. */
export interface ColumnStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** localStorage, or none where there is none or the browser blocks it (its getter throws). */
export function defaultStorage(): ColumnStorage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/** The stored choice, normalized; undefined when there is none or it is unreadable. */
export function readStored(storage: ColumnStorage | undefined, key: string, columns: readonly ColumnOption[]): string[] | undefined {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(key) ?? 'null')
    return Array.isArray(parsed) ? normalize(parsed.filter((item): item is string => typeof item === 'string'), columns) : undefined
  } catch {
    return undefined
  }
}

/** Stores the choice, or forgets it (null); a full or blocked storage keeps the choice for this page only. */
export function writeStored(storage: ColumnStorage | undefined, key: string, visible: readonly string[] | null): void {
  try {
    if (visible === null) storage?.removeItem(key)
    else storage?.setItem(key, JSON.stringify(visible))
  } catch {
    // ponytail: the choice lives until reload when storage refuses it
  }
}
