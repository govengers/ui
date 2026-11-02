// WhatsNew's memory: the version whose notes the user closed last, in localStorage. A storage that
// is missing or blocked counts as seen, so the notes never open on every load.

type Memory = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const defaultStorageKey = 'ui.whatsNew'

function local(): Memory | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/** Whether the notes of `version` were not closed yet. */
export function unseen(version: string, storageKey = defaultStorageKey, storage = local()): boolean {
  try {
    return storage !== undefined && storage.getItem(storageKey) !== version
  } catch {
    return false
  }
}

export function markSeen(version: string, storageKey = defaultStorageKey, storage = local()): void {
  try {
    storage?.setItem(storageKey, version)
  } catch {
    // a full or blocked storage: the notes may show once more
  }
}

/** Forgets the version, so the notes open again on the next mount. */
export function resetWhatsNew(storageKey = defaultStorageKey, storage = local()): void {
  try {
    storage?.removeItem(storageKey)
  } catch {
    // nothing stored, nothing to forget
  }
}
