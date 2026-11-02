import { describe, expect, test } from 'bun:test'
import { selectorOf, type DrivePlan } from '../agent/types'
import { createDriver, needsPause, type DriveEffects } from './cursor'

/** What the pages bound: createCustomer mutating, filter not; anything else is unbound. */
const declared: Record<string, { mutating?: boolean } | undefined> = { createCustomer: { mutating: true }, filter: { mutating: false } }

/** Effects over a fake screen of selectors; every call is logged, sleeps resolve at once. */
function screen(present: string[], answer: 'go' | 'target' = 'go') {
  const log: string[] = []
  let release: (() => void) | undefined
  const effects: DriveEffects<string> = {
    // selectorOf may name several selectors (`[name=x], [data-field=x]`); the screen answers the first present one.
    query: target => selectorOf(target).split(', ').find(selector => present.includes(selector)) ?? null,
    sleep: () => Promise.resolve(),
    point: (element, step) => log.push(`point ${element} ${step.kind}`),
    click: element => log.push(`click ${element}`),
    type: (element, value, whole) => log.push(`type ${element} ${value}${whole ? '' : '…'}`),
    navigate: async path => { log.push(`navigate ${path}`) },
    pause: (element, say) => {
      log.push(`pause ${element} ${say}`)
      return answer === 'go' ? Promise.resolve('go') : new Promise(resolve => { release = () => resolve('target') })
    },
    bound: action => declared[action],
  }
  return { effects, log, release: () => release?.() }
}

const plan: DrivePlan = {
  goal: 'create Globex',
  steps: [
    { kind: 'navigate', path: '/customers' },
    { kind: 'fill', target: { field: 'q' }, value: 'Go' },
    { kind: 'click', target: { action: 'filter' } },
    { kind: 'click', target: { action: 'createCustomer' }, say: 'Press Go to create it' },
  ],
}

describe('drive engine', () => {
  test('runs every step and pauses on the mutating click (D27)', async () => {
    const { effects, log } = screen(['[name="q"]', '[data-action="filter"]', '[data-action="createCustomer"]'])
    const steps: number[] = []
    expect(await createDriver(effects, { onStep: index => steps.push(index) }).run(plan)).toEqual({ kind: 'done' })
    expect(steps).toEqual([0, 1, 2, 3])
    expect(log).toEqual([
      'navigate /customers',
      'point [name="q"] fill',
      'type [name="q"] G…',
      'type [name="q"] Go',
      'point [data-action="filter"] click',
      'click [data-action="filter"]',
      'point [data-action="createCustomer"] click',
      'pause [data-action="createCustomer"] Press Go to create it',
      'click [data-action="createCustomer"]',
    ])
  })

  test('an unattended action is clicked without a pause', async () => {
    const { effects, log } = screen(['[name="q"]', '[data-action="filter"]', '[data-action="createCustomer"]'])
    await createDriver(effects, { unattended: ['createCustomer'] }).run(plan)
    expect(log.some(line => line.startsWith('pause'))).toBe(false)
    expect(log.at(-1)).toBe('click [data-action="createCustomer"]')
  })

  test('a click by the user during the pause is not repeated', async () => {
    const { effects, log, release } = screen(['[data-action="createCustomer"]'], 'target')
    const running = createDriver(effects).run({ goal: 'x', steps: [plan.steps[3]!] })
    await new Promise(resolve => setTimeout(resolve, 0))
    release()
    expect(await running).toEqual({ kind: 'done' })
    expect(log.filter(line => line.startsWith('click'))).toEqual([])
  })

  test('stop ends the plan between steps and inside a pause', async () => {
    const { effects, log } = screen(['[data-action="createCustomer"]', '[data-action="filter"]'], 'target')
    const driver = createDriver(effects)
    const running = driver.run({ goal: 'x', steps: [plan.steps[3]!, plan.steps[2]!] })
    await new Promise(resolve => setTimeout(resolve, 0))
    driver.stop()
    expect(await running).toEqual({ kind: 'stopped', step: 0 })
    expect(log).toEqual(['point [data-action="createCustomer"] click', 'pause [data-action="createCustomer"] Press Go to create it'])
  })

  test('a missing target fails the plan after the retry window', async () => {
    const { effects } = screen([])
    let polls = 0
    const counting: DriveEffects<string> = { ...effects, sleep: () => { polls += 1; return Promise.resolve() } }
    expect(await createDriver(counting, { retry: 2000 }).run({ goal: 'x', steps: [plan.steps[2]!] }))
      .toEqual({ kind: 'error', step: 0, message: 'target not found: [data-action="filter"]' })
    expect(polls).toBe(20)
  })

  test('resume runs from the given step', async () => {
    const { effects, log } = screen(['[data-action="filter"]'])
    expect(await createDriver(effects).run(plan, 2)).toEqual({ kind: 'error', step: 3, message: 'target not found: [data-action="createCustomer"]' })
    expect(log).toEqual(['point [data-action="filter"] click', 'click [data-action="filter"]'])
  })

  test('D52: only a bound, non-mutating action or an unattended one runs without a pause', () => {
    const bound = (action: string) => ({ ...declared, sort: {} } as typeof declared)[action]
    expect(needsPause({ action: 'createCustomer' }, bound)).toBe(true)
    expect(needsPause({ action: 'unknownAction' }, bound)).toBe(true)
    expect(needsPause({ action: 'filter' }, bound)).toBe(false)
    expect(needsPause({ action: 'sort' }, bound)).toBe(false)
    expect(needsPause({ action: 'createCustomer' }, bound, ['createCustomer'])).toBe(false)
    expect(needsPause({ action: 'unknownAction' }, bound, ['unknownAction'])).toBe(false)
    expect(needsPause({ field: 'createCustomer' }, bound)).toBe(false)
  })
})
