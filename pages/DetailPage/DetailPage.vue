<script setup lang="ts">
// DetailPage recipe (D33): one customer. The header with back link, status and delete; the
// record's fields as an inline edit form over useLiveForm (save sends only touched fields); the
// status lifecycle as WorkflowStatus; the customer's recent orders. One failure, one retry: a
// refused read of the customer replaces the whole body.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { ApiError } from '@/api/runtime'
import { useLiveConnection, useLiveStatus } from '@/api/vue'
// In a project: import { calls, live, type Customer, type CustomerStatus, type OrdersFilter, type OrderStatus, type UpdateCustomer } from '@/api/api'
import { calls, live, type Customer, type CustomerStatus, type OrdersFilter, type OrderStatus, type UpdateCustomer } from '@/fake/api'
import Badge from '../../ui/Badge/Badge.vue'
import Banner from '../../ui/Banner/Banner.vue'
import Button from '../../ui/Button/Button.vue'
import Card from '../../ui/Card/Card.vue'
import Dialog from '../../ui/Dialog/Dialog.vue'
import EmptyState from '../../ui/EmptyState/EmptyState.vue'
import Field from '../../ui/Field/Field.vue'
import Icon from '../../ui/Icon/Icon.vue'
import Input from '../../ui/Input/Input.vue'
import Page from '../../ui/Page/Page.vue'
import PageHeader from '../../ui/PageHeader/PageHeader.vue'
import type { TableColumn } from '../../ui/Table/Table.vue'
import { toast } from '../../ui/Toast/toast'
import { useAgentAction } from '../../ui/agent/registry'
import DetailForm from '../../ui/blocks/DetailForm/DetailForm.vue'
import { useLiveForm } from '../../ui/blocks/LiveForm/liveForm'
import SearchTable from '../../ui/blocks/SearchTable/SearchTable.vue'
import WorkflowStatus from '../../ui/blocks/WorkflowStatus/WorkflowStatus.vue'
import type { WorkflowState, WorkflowTransition } from '../../ui/blocks/WorkflowStatus/workflow'
import { formatCurrency, formatDate } from '../../ui/format'
import { deleteCustomer, updateCustomer } from './actions'
import { messages } from './messages'

/** The route passes its params as props (`props: true`). */
const props = defineProps<{ id: string }>()
// Global scope merges the folder's messages into the app's, so one t resolves page and ui.* keys.
const { t, locale } = useI18n({ useScope: 'global', messages })
const router = useRouter()
const connection = useLiveConnection()
const listRoute: RouteLocationRaw = { name: 'customers.list' }

// The record and its edit form. The status is the workflow's, not a form field: a Select would
// skip the confirm a transition asks for.
const form = useLiveForm({
  target: live['customers.item'],
  params: () => ({ id: props.id }),
  call: calls.updateCustomer,
  pick: (customer: Customer): UpdateCustomer => ({ name: customer.name, email: customer.email, country: customer.country }),
})
const { item: customer, error } = form
const notFound = computed(() => error.value instanceof ApiError && error.value.code === 'not_found')
const refusal = computed(() => (error.value instanceof ApiError && error.value.code === 'forbidden' ? t('ui.forbidden') : error.value?.message))
const status = useLiveStatus()
const stale = computed(() => status.value !== 'open' && customer.value !== undefined)

const statusKeys: Record<CustomerStatus, string> = { active: 'customers.detail.status.active', onHold: 'customers.detail.status.onHold', churned: 'customers.detail.status.churned' }
const transitionKeys: Record<CustomerStatus, string> = { active: 'customers.detail.transitions.active', onHold: 'customers.detail.transitions.onHold', churned: 'customers.detail.transitions.churned' }
const tone: Record<CustomerStatus, 'success' | 'warning' | 'neutral'> = { active: 'success', onHold: 'warning', churned: 'neutral' }
const allowed: Record<CustomerStatus, CustomerStatus[]> = { active: ['onHold', 'churned'], onHold: ['active', 'churned'], churned: ['active'] }
const states = computed((): WorkflowState[] => (['active', 'onHold', 'churned'] as const).map(key => ({ key, label: t(statusKeys[key]), tone: tone[key] })))
const transitions = computed((): WorkflowTransition[] => (customer.value ? allowed[customer.value.status] : []).map(to => ({
  to,
  label: t(transitionKeys[to]),
  call: calls.updateCustomer,
  params: { id: props.id },
  body: { status: to },
  danger: to === 'churned',
  confirm: to === 'churned' ? t('customers.detail.churnConfirm') : undefined,
})))

// The customer's recent orders: a cursor list (orders have no total), newest first.
const ordersFilter = computed((): OrdersFilter => ({ where: { field: 'customerId', op: 'eq', value: props.id } }))
const ordersRoute = computed((): RouteLocationRaw => ({ name: 'orders.list', query: { customerId: props.id } }))
const orderKeys: Record<OrderStatus, string> = {
  draft: 'customers.detail.orderStatus.draft', open: 'customers.detail.orderStatus.open', paid: 'customers.detail.orderStatus.paid',
  shipped: 'customers.detail.orderStatus.shipped', cancelled: 'customers.detail.orderStatus.cancelled',
}
const orderTone: Record<OrderStatus, 'neutral' | 'accent' | 'success' | 'danger'> = { draft: 'neutral', open: 'accent', paid: 'success', shipped: 'success', cancelled: 'danger' }
const orderColumns = computed((): TableColumn[] => [
  { key: 'number', label: t('customers.detail.fields.number') },
  { key: 'status', label: t('customers.detail.fields.status'), width: '8rem' },
  { key: 'total', label: t('customers.detail.fields.total'), align: 'end' },
  { key: 'createdAt', label: t('customers.detail.fields.createdAt'), hideOnPhone: true },
])

const confirming = ref(false)
const deleting = ref(false)
async function remove(): Promise<void> {
  const name = customer.value?.name ?? ''
  deleting.value = true
  try {
    await connection.value.call(calls.deleteCustomer, { id: props.id }, undefined)
    toast({ message: t('customers.detail.deleted', { name }), variant: 'success' })
    confirming.value = false
    // The record is gone with its edits: the leave guard must not ask about them (D96).
    form.reset()
    await router.push(listRoute)
  } catch (failure) {
    toast({ message: (failure as Error).message, variant: 'danger' })
  } finally {
    deleting.value = false
  }
}

useAgentAction(updateCustomer, params => connection.value.call(calls.updateCustomer, { id: props.id }, params as UpdateCustomer))
useAgentAction(deleteCustomer, () => remove())
</script>

<template>
  <Page data-page="customers.detail">
    <PageHeader :title="customer?.name ?? t('customers.detail.title')" :back="listRoute" :back-label="t('customers.detail.back')">
      <template v-if="customer" #subtitle>
        <Badge :variant="tone[customer.status]" dot>{{ t(statusKeys[customer.status]) }}</Badge>
        {{ t('customers.detail.since', { date: formatDate(customer.createdAt, locale) }) }}
      </template>
      <template v-if="customer" #actions>
        <Button variant="danger" data-action="deleteCustomer" @click="confirming = true">
          <template #icon><Icon name="trash" /></template>{{ t('customers.detail.delete') }}
        </Button>
      </template>
    </PageHeader>

    <EmptyState v-if="notFound" :title="t('customers.detail.notFound')" :description="t('customers.detail.notFoundHint')">
      <template #action><Button :to="listRoute">{{ t('customers.detail.back') }}</Button></template>
    </EmptyState>
    <Banner v-else-if="error" variant="danger">
      {{ refusal }}
      <template #action><Button size="sm" @click="form.retry()">{{ t('ui.retry') }}</Button></template>
    </Banner>
    <template v-else>
      <Banner v-if="stale" icon="clock">{{ t('ui.stale') }}</Banner>
      <div class="columns">
        <DetailForm :form="form" :title="t('customers.detail.details')" action="updateCustomer" @saved="toast({ message: t('customers.detail.saved'), variant: 'success' })">
          <template #default="{ fields, errors, disabled }">
            <Field :label="t('customers.detail.fields.name')" :error="errors['name']" required>
              <Input v-model="fields.name" name="name" autocomplete="organization" :disabled="disabled" />
            </Field>
            <Field :label="t('customers.detail.fields.email')" :error="errors['email']" required>
              <Input v-model="fields.email" type="email" name="email" autocomplete="email" :disabled="disabled" />
            </Field>
            <Field :label="t('customers.detail.fields.country')" :error="errors['country']" required>
              <Input v-model="fields.country" name="country" autocomplete="country" :disabled="disabled" />
            </Field>
          </template>
        </DetailForm>
        <Card v-if="customer" :title="t('customers.detail.lifecycle')" as="section">
          <!-- No status history read: an empty history marks nothing done instead of guessing a path. -->
          <WorkflowStatus :states="states" :current="customer.status" :transitions="transitions" :history="[]" />
        </Card>
      </div>
      <Card v-if="customer" :title="t('customers.detail.orders')" as="section">
        <template #actions>
          <Button variant="ghost" size="sm" :to="ordersRoute">{{ t('customers.detail.allOrders') }}<Icon name="arrow-right" size="sm" /></Button>
        </template>
        <SearchTable :target="live.orders" :filter="ordersFilter" :columns="orderColumns" row-key="id" mode="cursor" :page-size="5"
          :default-sort="{ key: 'createdAt', direction: 'desc' }" :caption="t('customers.detail.orders')">
          <template #cell-status="{ row }"><Badge :variant="orderTone[row.status]">{{ t(orderKeys[row.status]) }}</Badge></template>
          <template #cell-total="{ row }">{{ formatCurrency(row.total, locale, row.currency) }}</template>
          <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt, locale) }}</template>
        </SearchTable>
      </Card>
    </template>

    <Dialog v-model="confirming" variant="danger" size="sm" :title="t('customers.detail.deleteTitle', { name: customer?.name ?? '' })"
      :description="t('customers.detail.deleteDescription')" :persistent="deleting">
      <template #actions>
        <Button :disabled="deleting" @click="confirming = false">{{ t('ui.cancel') }}</Button>
        <Button variant="danger" data-action="deleteCustomer" :loading="deleting" @click="remove">{{ t('customers.detail.delete') }}</Button>
      </template>
    </Dialog>
  </Page>
</template>

<style scoped>
/* Form and status side by side, the related list below at full width: a Table under 48rem of its own width turns into cards. */
.columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr)); gap: var(--ui-space-6); align-items: start; }
</style>
