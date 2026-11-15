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
  /**
   * Runs the check unless one is in flight (answers that one) or the last started less than `gap`
   * ms ago: then one run is scheduled for the end of the gap and answered, so a trigger is never
   * lost. Resolves to the version, undefined when the check failed.
   */
  run(): Promise<string | undefined>
  /** Drops the scheduled run (unmount). */
  stop(): void
}

/** Starts `run` after `ms`, answers its cancel. */
export type Schedule = (run: () => void, ms: number) => () => void

const timeout: Schedule = (run, ms) => {
  const id = setTimeout(run, ms)
  return () => clearTimeout(id)
}

/** A failed check answers undefined; the next trigger tries again once the gap has passed. */
export function createVersionCheck(check: () => Promise<string | null | undefined>, gap: number, now: () => number = Date.now, schedule: Schedule = timeout): VersionCheck {
  let last: number | undefined
  let inFlight: Promise<string | undefined> | undefined
  let trailing: Promise<string | undefined> | undefined
  let cancel: (() => void) | undefined
  const due = (): boolean => last === undefined || now() - last >= gap
  const start = (): Promise<string | undefined> => {
    last = now()
    inFlight = Promise.resolve()
      .then(check)
      .then((version) => version ?? undefined, () => undefined)
      .finally(() => { inFlight = undefined })
    return inFlight
  }
  return {
    run() {
      if (inFlight !== undefined) return inFlight
      if (due()) return start()
      trailing ??= new Promise((resolve) => {
        cancel = schedule(() => {
          trailing = undefined
          cancel = undefined
          resolve(inFlight ?? (due() ? start() : undefined))
        }, last! + gap - now())
      })
      return trailing
    },
    stop() {
      cancel?.()
      cancel = undefined
      trailing = undefined
    },
  }
}
