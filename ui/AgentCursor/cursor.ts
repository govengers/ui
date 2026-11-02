// The drive engine (D25, D27): runs a DrivePlan step by step through injected effects, so the
// step logic is testable without a DOM. AgentCursor.vue supplies the effects (pointer, real
// clicks, typed input) and renders what the engine points at.
import { selectorOf, type DrivePlan, type DriveStep, type DriveTarget } from '../agent/types'

/** What the engine does to the screen; `Element` is a DOM element in the app, anything in a test. */
export interface DriveEffects<Element> {
  query(selector: string): Element | null
  sleep(ms: number): Promise<void>
  /** Scrolls the element into view, moves the pointer to it and highlights it with the step's text. */
  point(element: Element, step: DriveStep): void
  click(element: Element): void
  /** Sets the control's value and fires its event; `whole` is false for the prefixes while typing. */
  type(element: Element, value: string, whole: boolean): void
  /** Pushes the route; resolves once the new page had a frame to render. */
  navigate(path: string): Promise<void>
  /** Waits for the user: 'go' from the Go button, 'target' when they clicked the element themselves. */
  pause(element: Element, say: string): Promise<'go' | 'target'>
  /** The action as the page bound it (findAction in the app); undefined when no page bound it. */
  bound(action: string): { mutating?: boolean | undefined } | undefined
}

export interface DriveOptions {
  /** 1 is human pace; 2 twice as fast. */
  speed?: number | undefined
  /** Mutating actions whose click may run without a pause (DESIGN.md, D27). */
  unattended?: readonly string[] | undefined
  /** How long a missing target is looked for before the plan fails, in ms. */
  retry?: number | undefined
  onStep?: ((index: number) => void) | undefined
}

export type DriveOutcome =
  | { kind: 'done' }
  | { kind: 'stopped'; step: number }
  | { kind: 'error'; step: number; message: string }

export interface Driver {
  /** Runs the plan from step `from`; a run in progress is stopped first. */
  run(plan: DrivePlan, from?: number): Promise<DriveOutcome>
  /** Stops at once, also inside a move, a typed word or a pause. */
  stop(): void
}

/** Human pace at speed 1, in ms (D25). */
export const pace = { move: 350, char: 40, click: 500, read: 1500, poll: 100 }

const halted = Symbol('halted')
type Halted = typeof halted

/**
 * D27, D52: a click on an action pauses on its button unless the page bound the action and
 * declared it not mutating, or DESIGN.md lets it run unattended. An unbound action counts as
 * mutating: what the cursor cannot know about, it does not submit.
 */
export function needsPause(target: DriveTarget, bound: DriveEffects<unknown>['bound'], unattended: readonly string[] = []): boolean {
  if (!('action' in target) || unattended.includes(target.action)) return false
  const action = bound(target.action)
  return action === undefined || action.mutating === true
}

export function createDriver<Element>(effects: DriveEffects<Element>, options: DriveOptions = {}): Driver {
  const speed = options.speed ?? 1
  const retry = options.retry ?? 2000
  let halt = (): void => {}
  let halting = new Promise<Halted>(() => {})
  let run = 0

  /** The promise's value, or `halted` as soon as stop() is called. */
  const guard = <T>(promise: Promise<T>): Promise<T | Halted> => Promise.race([promise, halting])
  const wait = (ms: number) => guard(effects.sleep(ms / speed))

  async function find(target: DriveTarget): Promise<Element | null | Halted> {
    const selector = selectorOf(target)
    for (let waited = 0; ; waited += pace.poll) {
      const element = effects.query(selector)
      if (element !== null || waited >= retry) return element
      if ((await guard(effects.sleep(pace.poll))) === halted) return halted
    }
  }

  /** One step: undefined when it went through, `halted`, or the error message. */
  async function perform(step: DriveStep): Promise<undefined | Halted | string> {
    if (step.kind === 'navigate') return (await guard(effects.navigate(step.path))) === halted ? halted : undefined
    const element = await find(step.target)
    if (element === halted) return halted
    if (element === null) return `target not found: ${selectorOf(step.target)}`
    effects.point(element, step)
    if ((await wait(pace.move)) === halted) return halted
    switch (step.kind) {
      case 'spotlight':
        return (await wait(pace.read)) === halted ? halted : undefined
      case 'fill': {
        const chars = [...step.value]
        if (chars.length === 0) effects.type(element, '', true)
        for (let typed = 1; typed <= chars.length; typed += 1) {
          effects.type(element, chars.slice(0, typed).join(''), typed === chars.length)
          if ((await wait(pace.char)) === halted) return halted
        }
        return undefined
      }
      case 'pause':
        return (await guard(effects.pause(element, step.say))) === halted ? halted : undefined
      case 'click': {
        if (needsPause(step.target, effects.bound, options.unattended)) {
          const answer = await guard(effects.pause(element, step.say ?? ''))
          if (answer === halted) return halted
          if (answer === 'target') return undefined // the user clicked it themselves
        } else if ((await wait(pace.click)) === halted) {
          return halted
        }
        effects.click(element)
        return undefined
      }
    }
  }

  return {
    async run(plan, from = 0) {
      halt()
      const current = ++run
      halting = new Promise<Halted>(resolve => { halt = () => resolve(halted) })
      for (let index = from; index < plan.steps.length; index += 1) {
        if (current !== run) return { kind: 'stopped', step: index }
        options.onStep?.(index)
        const result = await perform(plan.steps[index]!)
        if (result === halted || current !== run) return { kind: 'stopped', step: index }
        if (result !== undefined) return { kind: 'error', step: index, message: result }
      }
      return { kind: 'done' }
    },
    stop() {
      run += 1
      halt()
    },
  }
}
