// WhatsNew's default memory: the minor line the user saw last, in localStorage (once per browser).
// A project that wants once per user passes readSeen and writeSeen backed by a user setting. A
// storage that is missing or blocked reads as nothing stored: decideWhatsNew treats that as a
// first visit, so the notes never open on every load.

type Memory = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const defaultStorageKey = 'ui.whatsNew'

function local(): Memory | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/** The stored line (or a full version stored by an older copy), or undefined. */
export function readSeen(storageKey = defaultStorageKey, storage = local()): string | undefined {
  try {
    return storage?.getItem(storageKey) ?? undefined
  } catch {
    return undefined
  }
}

export function writeSeen(line: string, storageKey = defaultStorageKey, storage = local()): void {
  try {
    storage?.setItem(storageKey, line)
  } catch {
    // a full or blocked storage: the next load counts as a first visit and stays silent
  }
}

/** Forgets the stored line: the next mount is a first visit again (silent). */
export function resetWhatsNew(storageKey = defaultStorageKey, storage = local()): void {
  try {
    storage?.removeItem(storageKey)
  } catch {
    // nothing stored, nothing to forget
  }
}
