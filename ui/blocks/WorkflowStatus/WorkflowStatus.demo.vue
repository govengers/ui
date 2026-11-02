<script setup lang="ts">
import { computed, provide, ref, shallowRef } from 'vue'
import { ApiError, mutation, type LiveConnection, type LivePair, type MutationTarget } from '@/api/runtime'
import { livePairKey, useLive } from '@/api/vue'
import { calls, live, type ItemParameters, type Order, type OrderStatus } from '@/fake/api'
import { engine, pair } from '@/fake/live'
import WorkflowStatus from './WorkflowStatus.vue'
import type { WorkflowEntry, WorkflowState, WorkflowTransition } from './workflow'
import Button from '../../Button/Button.vue'

// Demo only: the fake api has no updateOrder (D50), so the connection handed to the blocks below
// answers it from the store after a latency, refusing a move the lifecycle does not allow; every
// other call goes to the fake engine. The store update pushes to live['orders.item'] as a real
// mutation would.
const updateOrder = mutation<ItemParameters, { status: OrderStatus }, Order>({
  name: 'updateOrder', method: 'PATCH', path: '/orders/{id}', pathParameters: ['id'], body: true, content: true,
})
const allowed: Record<OrderStatus, OrderStatus[]> = { draft: ['open', 'cancelled'], open: ['paid', 'cancelled'], paid: ['shipped'], shipped: [], cancelled: [] }
const real = pair.value.connection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function answer(target: MutationTarget<any, any, unknown>, parameters: any, body: any): Promise<unknown> {
  if (target.name !== updateOrder.name) return real.call(target, parameters, body)
  const { id: orderId } = parameters as ItemParameters
  const { status } = body as { status: OrderStatus }
  await new Promise((resolve) => setTimeout(resolve, 400))
  const row = engine.store.tables.orders.find((candidate) => candidate.id === orderId)
  if (row === undefined) throw new ApiError(404, { code: 'not_found', message: 'The order does not exist.' })
  if (!allowed[row.status].includes(status)) throw new ApiError(409, { code: 'conflict', message: `A ${row.status} order cannot become ${status}.` })
  return engine.store.update('orders', orderId, { status })
}
const connection = new Proxy(real, { get: (target, key) => (key === 'call' ? answer : Reflect.get(target, key)) }) as LiveConnection
provide(livePairKey, shallowRef<LivePair>({ ...pair.value, connection }))

// The order: the first draft of the seeded data, put back to draft on every visit.
const id = engine.store.tables.orders.find((row) => row.status === 'draft')?.id ?? 'ord-0001'
const history = ref<WorkflowEntry[]>([])
function reset() {
  engine.store.update('orders', id, { status: 'draft' })
  history.value = [{ state: 'draft', at: new Date().toISOString(), by: 'Ada Lovelace' }]
}
reset()
const order = useLive(live['orders.item'], { id })

const states: WorkflowState[] = [
  { key: 'draft', label: 'Draft', tone: 'neutral' },
  { key: 'open', label: 'Open' },
  { key: 'paid', label: 'Paid', tone: 'success' },
  { key: 'shipped', label: 'Shipped', tone: 'success' },
  { key: 'cancelled', label: 'Cancelled', tone: 'danger' },
]
const move = (to: OrderStatus, label: string, extra: Partial<WorkflowTransition> = {}): WorkflowTransition =>
  ({ to, label, call: updateOrder, params: { id }, body: { status: to }, ...extra })
const cancel = move('cancelled', 'Cancel order', { danger: true, confirm: 'The customer gets a cancellation mail. This cannot be undone.' })
// The page computes the transitions allowed now from the record (and in a real app its permissions).
const transitions = computed((): WorkflowTransition[] => {
  switch (order.data.value?.status) {
    case 'draft': return [move('open', 'Submit'), cancel]
    case 'open': return [move('paid', 'Mark as paid'), cancel]
    case 'paid': return [move('shipped', 'Ship', { confirm: 'The customer gets the shipping mail now.' })]
    default: return []
  }
})
const record = (state: string) => history.value.push({ state, at: new Date().toISOString(), by: 'Ada Lovelace' })

const customerStates: WorkflowState[] = [
  { key: 'active', label: 'Active', tone: 'success' },
  { key: 'onHold', label: 'On hold', tone: 'warning' },
  { key: 'churned', label: 'Churned', tone: 'danger' },
]
const refused: WorkflowTransition[] = [
  { to: 'onHold', label: 'Put on hold', call: calls.updateCustomer, params: { id: 'cus-404' }, body: { status: 'onHold' } },
]
</script>

<template>
  <section>
    <h2>Order {{ order.data.value?.number }}: draft, open, paid, shipped (cancel from draft or open)</h2>
    <WorkflowStatus
      v-if="order.data.value"
      :states="states"
      :current="order.data.value.status"
      :transitions="transitions"
      :history="history"
      @transitioned="record"
    />
    <div class="row">
      <Button size="sm" variant="ghost" @click="reset">Reset to draft</Button>
    </div>
  </section>

  <section>
    <h2>Refused transition: the fake engine answers 404 for an unknown customer</h2>
    <WorkflowStatus :states="customerStates" current="active" :transitions="refused" />
  </section>

  <section>
    <h2>No transitions allowed, without history</h2>
    <WorkflowStatus :states="states.slice(0, 4)" current="paid" :transitions="[]" />
  </section>
</template>

<style scoped>
.row { margin-top: var(--ui-space-4); }
</style>
