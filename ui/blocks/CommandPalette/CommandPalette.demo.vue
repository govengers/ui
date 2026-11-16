<script setup lang="ts">
import { ref } from 'vue'
import { useLiveConnection } from '@/api/vue'
import { calls, live } from '@/fake/api'
import CommandPalette from './CommandPalette.vue'
import { searchGroup, type RecentPick } from './palette'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'
import { useAgentAction } from '../../agent/registry'

const groups = [
  searchGroup({ key: 'tasks', label: 'Tasks', target: live.tasks, result: (task) => ({ id: task.id, label: task.title, hint: task.status }) }),
  searchGroup({ key: 'customers', label: 'Customers', target: live.customers, result: (customer) => ({ id: customer.id, label: customer.name, hint: customer.country }) }),
]

const connection = useLiveConnection()
const said = ref('')
// The page binds its actions (D48); the palette offers the ones without params.
useAgentAction({ name: 'createTask', description: 'Adds a card to the backlog.', page: 'demo.palette', mutating: true }, () => {
  void connection.value.call(calls.createTask, {}, { title: 'Card from the palette' })
  said.value = 'Ran createTask'
})
useAgentAction({ name: 'startExport', description: 'Exports the customer list as CSV in the background.', page: 'demo.palette', mutating: true }, () => {
  said.value = 'Ran startExport'
})
useAgentAction({ name: 'deleteCustomer', description: 'Deletes one customer.', params: { id: 'the customer' }, page: 'demo.palette', mutating: true }, () => undefined)

const open = ref(false)
function onSelect(pick: RecentPick) {
  said.value = `Open ${pick.group} ${pick.id}: ${pick.label}`
}
</script>

<template>
  <section>
    <h2>Press Cmd+K or Ctrl+K, or the button; type "fix" or "blue"</h2>
    <p class="row">
      <Button @click="open = true"><template #icon><Icon name="command" /></template>Open the palette</Button>
      <span role="status" class="muted">{{ said }}</span>
    </p>
    <CommandPalette v-model:open="open" :groups="groups" storage-key="demo.palette.recent" @select="onSelect" />
  </section>
  <section>
    <h2>Open, in the page flow: quick actions (deleteCustomer needs an id, so it is not offered)</h2>
    <CommandPalette :groups="groups" inline hotkey="" storage-key="" />
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-3); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
