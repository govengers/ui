// UpdateHint's logic: whether the server runs another build than the bundle, and a version check
// that runs at most once per gap however often it is triggered (interval, tab shown, reconnect).

/** Values a build carries when it has no real version: such a side never asks for a reload. */
const unversioned = /^(|dev|development|local|unknown)$/i

function normal(version: string | null | undefined): string {
  return (version ?? '').trim().replace(/^v(?=\d)/, '')
}

/** Whether `server` is a known version other than the bundle's (a rollback counts too). */
export function outdated(bundle: string, server: string | null | undefined): boolean {
  const mine = normal(bundle)
  const theirs = normal(server)
  return !unversioned.test(mine) && !unversioned.test(theirs) && mine !== theirs
}

export interface VersionCheck {
  /** Runs the check unless one is in flight or the last started less than `gap` ms ago; resolves to the version, undefined when skipped or failed. */
  run(): Promise<string | undefined>
}

/** A failed check answers undefined; the next trigger tries again once the gap has passed. */
export function createVersionCheck(check: () => Promise<string | null | undefined>, gap: number, now: () => number = Date.now): VersionCheck {
  let last: number | undefined
  let inFlight: Promise<string | undefined> | undefined
  return {
    run() {
      if (inFlight !== undefined) return inFlight
      if (last !== undefined && now() - last < gap) return Promise.resolve(undefined)
      last = now()
      inFlight = Promise.resolve()
        .then(check)
        .then((version) => version ?? undefined, () => undefined)
        .finally(() => { inFlight = undefined })
      return inFlight
    },
  }
}
