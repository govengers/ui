// Table mounted (D69): Enter on a focused clickable row opens it once and is consumed, so the same
// key press does not go on to what the handler opens (a drawer's Close button would close it again);
// a held Enter opens it once; Enter on a control inside the row stays the control's.
import { expect, test } from 'bun:test'
import type { Component } from 'vue'
import { key, mount } from '../../scripts/test/mount'
import Table from './Table.vue'

test('Enter on a focused clickable row runs row-click once, prevents its default and ignores its repeats; Enter on its checkbox is the checkbox\'s', () => {
  const opened: unknown[] = []
  const view = mount(Table as Component, () => ({
    columns: [{ key: 'name', label: 'Name' }], rows: [{ id: 'a', name: 'Alder Media' }], rowKey: 'id', selectable: true,
    onRowClick: (row: unknown) => opened.push(row),
  }))
  const row = view.root.querySelector<HTMLElement>('.ui-table__row')!
  row.focus()
  const press = key(row, 'Enter')
  expect([opened.length, press.defaultPrevented]).toEqual([1, true])
  const held = key(row, 'Enter', { repeat: true })
  expect([opened.length, held.defaultPrevented]).toEqual([1, true])
  const box = row.querySelector<HTMLInputElement>('.ui-table__select input')!
  box.focus()
  const onBox = key(box, 'Enter')
  expect([opened.length, onBox.defaultPrevented]).toEqual([1, false])
  view.unmount()
})
