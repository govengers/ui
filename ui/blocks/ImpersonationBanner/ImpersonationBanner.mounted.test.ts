// ImpersonationBanner mounted (D69): the countdown runs from /auth/me's impersonationEndsAt.
import { afterEach, expect, test } from 'bun:test'
import type { Component } from 'vue'
import { mount, settle, type Mounted } from '../../../scripts/test/mount'
import type { SessionIdentity } from '../../session'
import ImpersonationBanner from './ImpersonationBanner.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

const ada: SessionIdentity = { provider: 'password', subject: 'ada', name: 'Ada', active: true, roles: ['admin'] }
const bob = (impersonationEndsAt?: string): SessionIdentity => ({ provider: 'password', subject: 'bob', name: 'Bob', active: true, roles: [], impersonator: ada, ...(impersonationEndsAt === undefined ? {} : { impersonationEndsAt }) })
const stop = async () => undefined
const left = () => view?.root.querySelector('.ui-impersonation-banner__left')?.textContent?.trim()

test('an end in the future counts down', async () => {
  view = mount(ImpersonationBanner as Component, () => ({ identity: bob(new Date(Date.now() + 30 * 60_000).toISOString()), stop }))
  await settle(1)
  expect(left()).toEndWith('left')
})

test('an end that passed says so and emits expired once', async () => {
  let expired = 0
  view = mount(ImpersonationBanner as Component, () => ({ identity: bob(new Date(Date.now() - 1000).toISOString()), stop, onExpired: () => expired++ }))
  await settle(1)
  expect(left()).toBe('The impersonation has ended.')
  expect(expired).toBe(1)
})

test('no end, or an unreadable one, shows no countdown', async () => {
  view = mount(ImpersonationBanner as Component, () => ({ identity: bob('not a time'), stop }))
  await settle(1)
  expect(left()).toBeUndefined()
  expect(view.root.textContent).toContain('Ada')
})
