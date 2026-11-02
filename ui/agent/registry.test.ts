import { describe, expect, test } from 'bun:test'
import { effectScope } from 'vue'
import { boundActions, findAction, resetActions, useAgentAction } from './registry'
import { selectorOf } from './types'

describe('agent registry', () => {
  test('binds while the scope lives and unbinds on dispose', async () => {
    resetActions()
    const scope = effectScope()
    scope.run(() => useAgentAction({ name: 'createCustomer', description: 'Creates a customer', page: 'customers.list', mutating: true }, params => params['name']))
    expect(boundActions().map(action => action.name)).toEqual(['createCustomer'])
    expect(await findAction('createCustomer')!.run({ name: 'Ada' })).toBe('Ada')
    scope.stop()
    expect(findAction('createCustomer')).toBeUndefined()
  })

  test('selectors follow the data attributes', () => {
    expect(selectorOf({ action: 'createCustomer' })).toBe('[data-action="createCustomer"]')
    expect(selectorOf({ field: 'email' })).toBe('[name="email"], [data-field="email"]')
    expect(selectorOf({ page: 'customers.list' })).toBe('[data-page="customers.list"]')
    expect(selectorOf({ selector: '.x' })).toBe('.x')
  })
})
