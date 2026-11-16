// LoginPage mounted (D69): the change-password screen exists only with `change`.
import { afterEach, expect, test } from 'bun:test'
import type { Component } from 'vue'
import { mount, settle, type Mounted } from '../../scripts/test/mount'
import LoginPage from './LoginPage.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

const login = async () => undefined

test('without change the changePassword state shows the sign-in', async () => {
  view = mount(LoginPage as Component, () => ({ state: 'changePassword', login }))
  await settle(1)
  expect(view.root.querySelector('[data-page]')?.getAttribute('data-page')).toBe('auth.login')
  expect(view.root.querySelector('[data-action="changePassword"]')).toBeNull()
  expect(view.root.querySelector('input[name="identifier"]')).not.toBeNull()
})

test('with change it shows the three password fields', async () => {
  view = mount(LoginPage as Component, () => ({ state: 'changePassword', login, change: async () => undefined }))
  await settle(1)
  expect(view.root.querySelector('[data-page]')?.getAttribute('data-page')).toBe('auth.changePassword')
  expect(view.root.querySelectorAll('input[type="password"]').length).toBe(3)
})
