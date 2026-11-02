---
name: ColumnsPicker
tier: block
intent: [columns, column picker, show columns, hide columns, visible columns, table columns, column chooser, customize table]
uses: [Popover, Button, Icon, Checkbox]
livewire: false
status: ready
---

# ColumnsPicker

Which columns a table shows: a ghost icon button opens a list of checkboxes, one per column, and a
Reset item. Required columns stay ticked and disabled. With `storageKey` the choice survives a
reload in localStorage.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `columns` | `ColumnOption[]` | required | `{ key, label, required? }`; a `TableColumn` with `required` fits |
| `modelValue` | `string[]` | required | v-model: the visible keys, always in column order with the required ones |
| `storageKey` | `string` | none | remembers the choice under this localStorage key; Reset forgets it |

## Slots

None.

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:modelValue` | `string[]` | a box ticked, Reset, or a stored choice restored on mount |

## Exposes

`open()`: opens the list (a demo, a keyboard shortcut).

## Usage

```ts
const visible = ref(['name', 'status', 'revenue'])
const shown = computed(() => columns.filter(column => visible.value.includes(column.key)))
```

```vue
<ColumnsPicker v-model="visible" :columns="columns" storage-key="customers.columns" />
<Table :columns="shown" :rows="items" row-key="id" />
```

## Agent

The trigger's name is "Columns"; every checkbox row carries `data-column="<key>"` and the
column's label as its name. The choice is plain data: an agent sets the v-model.

## Gotchas

- Reset returns to the v-model the page started with, not to the stored choice.
- A stored choice is normalized on read: columns that no longer exist drop out, required ones
  come back, so renaming a column never breaks a saved layout.
- Keyboard: arrows, Home and End move, Space ticks, Escape closes, Tab closes and moves on.
- A full or blocked localStorage keeps the choice until reload, silently.
