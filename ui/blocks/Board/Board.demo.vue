<script setup lang="ts">
import { computed, defineComponent, onScopeDispose, provide, ref, type PropType } from 'vue'
import { createLivePair, type LivePair, type WebSocketLike } from '@/api/runtime'
import { livePairKey, useLiveConnection } from '@/api/vue'
import { calls, live, type Task, type TasksFilter } from '@/fake/api'
import { engine } from '@/fake/live'
import Board from './Board.vue'
import type { BoardColumn, Placement } from './board'
import Avatar from '../../Avatar/Avatar.vue'
import Badge from '../../Badge/Badge.vue'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'

const columns: BoardColumn[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To do' },
  { key: 'doing', label: 'Doing', limit: 2 },
  { key: 'review', label: 'Review', limit: 3 },
  { key: 'done', label: 'Done' },
]
const moveArgs = (task: Task, placement: Placement) => ({ parameters: { id: task.id }, body: { status: placement.column as Task['status'], position: placement.rank } })
const userName = (id: string | null): string | undefined => engine.store.tables.users.find((user) => user.id === id)?.name

const connection = useLiveConnection()
const last = ref('')
function create(column: BoardColumn) {
  void connection.value.call(calls.createTask, {}, { title: `New card in ${column.label}`, status: column.key as Task['status'] })
}
// Someone else moves the first backlog card to the top of Doing: the push moves it here too.
function elsewhere() {
  const tasks = engine.store.tables.tasks
  const card = tasks.filter((task) => task.status === 'backlog').sort((left, right) => left.position - right.position)[0]
  const top = Math.min(...tasks.filter((task) => task.status === 'doing').map((task) => task.position))
  if (card) engine.store.update('tasks', card.id, { status: 'doing', position: (Number.isFinite(top) ? top : 1024) - 1024 })
}

// The states: a socket that never answers (loading), and a filter no card matches (empty columns).
class Silent implements WebSocketLike {
  readyState = 0
  onopen: WebSocketLike['onopen'] = null
  onmessage: WebSocketLike['onmessage'] = null
  onclose: WebSocketLike['onclose'] = null
  onerror: WebSocketLike['onerror'] = null
  send(_data: string) {}
  close(_code?: number, _reason?: string) {}
}
const loadingPair = createLivePair({ identity: () => 'demo:ada', client: { baseURL: '/api/v1', fetch: engine.fetch }, connection: { url: 'ws://fake/api/v1/socket', WebSocket: Silent } })
// The filtered board gets a pair of its own: on the page's pair the first board's optimistic card
// would show in it until the push (the runtime upserts into every live list of the resource).
const emptyPair = createLivePair({ identity: () => 'demo:ada', client: { baseURL: '/api/v1', fetch: engine.fetch }, connection: { url: 'ws://fake/api/v1/socket', WebSocket: engine.WebSocket } })
onScopeDispose(() => {
  loadingPair.end()
  emptyPair.end()
})
const WithPair = defineComponent({
  props: { pair: { type: Object as PropType<LivePair>, required: true } },
  setup(props, { slots }) {
    provide(livePairKey, computed(() => props.pair))
    return () => slots.default?.()
  },
})
const nobody: TasksFilter = { where: { field: 'labels', op: 'has', value: 'nothing-has-this' } }
const few = columns.slice(0, 3)
</script>

<template>
  <section>
    <h2>Live board: drag a card (mouse anywhere on it, touch on the grip), or use the grip keys or the card menu</h2>
    <p class="row">
      <Button variant="ghost" data-action="elsewhere" @click="elsewhere"><template #icon><Icon name="users" /></template>Someone else moves a card</Button>
      <span role="status" class="muted">{{ last }}</span>
    </p>
    <Board
      :target="live.tasks"
      :sort="['position']"
      :columns="columns"
      column-field="status"
      rank-field="position"
      :item-label="(task) => task.title"
      :move="calls.moveTask"
      :move-args="moveArgs"
      label="Demo board"
      @moved="(task, placement) => (last = `Moved ${task.title} to ${placement.column} at rank ${placement.rank}`)"
    >
      <template #card="{ item }">
        <p class="title">{{ item.title }}</p>
        <p class="meta">
          <Badge v-for="name in item.labels" :key="name" size="sm">{{ name }}</Badge>
          <Avatar v-if="userName(item.assignee)" :name="userName(item.assignee)!" size="sm" class="assignee" />
        </p>
      </template>
      <template #column-actions="{ column }">
        <Button variant="ghost" size="sm" :label="`Add a card to ${column.label}`" data-action="createTask" @click="create(column)">
          <template #icon><Icon name="plus" /></template>
        </Button>
      </template>
    </Board>
  </section>
  <section>
    <h2>Loading: the socket never answers</h2>
    <WithPair :pair="loadingPair">
      <Board :target="live.tasks" :columns="few" column-field="status" rank-field="position" :item-label="(task) => task.title" :move="calls.moveTask" :move-args="moveArgs" />
    </WithPair>
  </section>
  <section>
    <h2>Empty columns: no card matches the filter</h2>
    <WithPair :pair="emptyPair">
      <Board :target="live.tasks" :filter="nobody" :columns="few" column-field="status" rank-field="position" :item-label="(task) => task.title" :move="calls.moveTask" :move-args="moveArgs" />
    </WithPair>
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-3); margin-block-end: var(--ui-space-3); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.title { font-size: var(--ui-text-sm); font-weight: var(--ui-weight-medium); }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-1); margin-block-start: var(--ui-space-2); }
.assignee { margin-inline-start: auto; }
</style>
