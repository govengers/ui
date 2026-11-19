// Avatar mounted (D69): without a name it shows a person icon and is named "Unknown person";
// the status word joins the name. The status shapes are CSS: the browser check of WP11 covers them.
import { afterEach, expect, test } from 'bun:test'
import type { Component } from 'vue'
import { mount, settle, type Mounted } from '../../scripts/test/mount'
import Avatar from './Avatar.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

test.each([
  ['a name', { name: 'Ada Lovelace', status: 'online' }, 'Ada Lovelace, Online', 'AL'],
  ['alt over the name', { name: 'Ada Lovelace', alt: 'Ada' }, 'Ada', 'AL'],
  ['a blank alt falls back to the name', { name: 'Ada Lovelace', alt: ' ' }, 'Ada Lovelace', 'AL'],
  ['no name', { name: '', status: 'busy' }, 'Unknown person, Busy', ''],
  ['a blank name and alt', { name: '  ', alt: '' }, 'Unknown person', ''],
])('%s', async (_, props, label, initials) => {
  view = mount(Avatar as Component, () => props)
  await settle(1)
  const root = view.root.querySelector('.ui-avatar')
  expect(root?.getAttribute('aria-label')).toBe(label)
  expect(root?.querySelector('.ui-avatar__initials')?.textContent).toBe(initials)
  expect(root?.querySelector('.ui-avatar__initials svg') !== null).toBe(initials === '')
})
