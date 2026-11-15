<script setup lang="ts">
// Dashboard recipe (D8, showing-live-data): a greeting, four live tiles, the newest orders, the
// running jobs and a billing card that shows the forbidden state. The page reads, the blocks
// show. One failure and one Retry for every subscription; forbidden is a state, not a failure.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError, type NetworkError } from '@/api/runtime'
import { useLive, useLiveList } from '@/api/vue'
// In a project: import { live, type OrderStatus } from '@/api/api'
import { live, type OrderStatus } from '@/fake/api'
import Badge from '../../ui/Badge/Badge.vue'
import Banner from '../../ui/Banner/Banner.vue'
import Button from '../../ui/Button/Button.vue'
import Card from '../../ui/Card/Card.vue'
import EmptyState from '../../ui/EmptyState/EmptyState.vue'
import Page from '../../ui/Page/Page.vue'
import PageHeader from '../../ui/PageHeader/PageHeader.vue'
import Skeleton from '../../ui/Skeleton/Skeleton.vue'
import Table, { type TableColumn } from '../../ui/Table/Table.vue'
import JobProgress from '../../ui/blocks/JobProgress/JobProgress.vue'
import StatusTile from '../../ui/blocks/StatusTile/StatusTile.vue'
import { formatAge, formatCurrency, formatDateTime } from '../../ui/format'
import { messages } from './messages'

const { t, locale } = useI18n({ useScope: 'global', messages })

const firstName = 'Ada' // REPLACE: the signed-in user's first name, from the session (/auth/me)
const hour = new Date().getHours()
const greeting = hour < 12 ? t('home.dashboard.morning', { name: firstName })
  : hour < 18 ? t('home.dashboard.afternoon', { name: firstName })
    : t('home.dashboard.evening', { name: firstName })
const today = computed(() => formatDateTime(new Date(), locale.value, { dateStyle: 'full' }))

// A count is the total of a one-row page (StatusTile card). Orders page by cursor (D38).
const customers = useLiveList(live.customers, { filter: { where: { field: 'status', op: 'eq', value: 'active' } }, limit: 1 })
const openOrders = useLiveList(live.orders, { filter: { where: { field: 'status', op: 'eq', value: 'open' } }, limit: 1, mode: 'cursor' })
const jobs = useLiveList(live.jobs, { filter: { where: { field: 'status', op: 'in', value: ['queued', 'running'] } }, limit: 10 })
// ponytail: sums one page (at most 100 orders) in the browser; a project serves the sum as its own read.
const paid = useLiveList(live.orders, {
  filter: { where: { and: [
    { field: 'status', op: 'in', value: ['paid', 'shipped'] },
    { field: 'currency', op: 'eq', value: 'EUR' },
    { field: 'createdAt', op: 'gte', value: { relative: '-30d' } },
  ] } },
  limit: 100,
  mode: 'cursor',
})
const revenue = computed(() => formatCurrency(paid.items.value.reduce((sum, order) => sum + order.total, 0), locale.value, 'EUR'))
const recent = useLiveList(live.orders, { limit: 5, mode: 'cursor' })
const billing = useLive(live.billing)

// One failure and one Retry for the whole screen; billing's forbidden is its card's state.
const forbidden = (error: ApiError | NetworkError | undefined) => error instanceof ApiError && error.code === 'forbidden'
const reads = [customers, openOrders, jobs, paid, recent, billing]
const failed = computed(() => reads.some(read => read.error.value !== undefined && !forbidden(read.error.value)))
const stale = computed(() => reads.some(read => read.stale.value && !read.loading.value && read.error.value === undefined))
function retry(): void {
  for (const read of reads) if (read.error.value !== undefined && !forbidden(read.error.value)) read.retry()
}

const columns = computed<TableColumn[]>(() => [
  { key: 'number', label: t('home.dashboard.recent.number') },
  { key: 'status', label: t('home.dashboard.recent.status') },
  { key: 'total', label: t('home.dashboard.recent.total'), align: 'end' },
  { key: 'createdAt', label: t('home.dashboard.recent.createdAt'), hideOnPhone: true },
])
const statusLabel = computed<Record<OrderStatus, string>>(() => ({
  draft: t('home.dashboard.status.draft'), open: t('home.dashboard.status.open'), paid: t('home.dashboard.status.paid'),
  shipped: t('home.dashboard.status.shipped'), cancelled: t('home.dashboard.status.cancelled'),
}))
const statusVariant: Record<OrderStatus, 'neutral' | 'accent' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral', open: 'accent', paid: 'success', shipped: 'success', cancelled: 'danger',
}
</script>

<template>
  <Page data-page="home.dashboard">
    <PageHeader :title="greeting" :subtitle="today">
      <template v-if="stale" #actions><Badge variant="warning" dot>{{ t('ui.stale') }}</Badge></template>
    </PageHeader>

    <Banner v-if="failed" variant="danger">
      {{ t('home.dashboard.failed') }}
      <template #action><Button size="sm" @click="retry">{{ t('ui.retry') }}</Button></template>
    </Banner>

    <div class="dashboard__tiles">
      <StatusTile :label="t('home.dashboard.tiles.customers')" :value="customers.total.value ?? '-'" :loading="customers.loading.value" to="/customers" />
      <StatusTile :label="t('home.dashboard.tiles.openOrders')" :value="openOrders.total.value ?? '-'" :loading="openOrders.loading.value" to="/orders" />
      <StatusTile :label="t('home.dashboard.tiles.jobs')" :value="jobs.total.value ?? '-'" :loading="jobs.loading.value" />
      <StatusTile :label="t('home.dashboard.tiles.revenue')" :value="paid.error.value ? '-' : revenue" :loading="paid.loading.value">
        {{ t('home.dashboard.tiles.revenueNote') }}
      </StatusTile>
    </div>

    <Card :title="t('home.dashboard.recent.title')" as="section">
      <template #actions><Button variant="ghost" size="sm" to="/orders">{{ t('home.dashboard.recent.all') }}</Button></template>
      <Table :columns="columns" :rows="recent.items.value" row-key="id" :loading="recent.loading.value" :caption="t('home.dashboard.recent.caption')">
        <template #cell-status="{ row }">
          <Badge :variant="statusVariant[row.status]" dot>{{ statusLabel[row.status] }}</Badge>
        </template>
        <template #cell-total="{ row }">{{ formatCurrency(row.total, locale, row.currency) }}</template>
        <template #cell-createdAt="{ row }">{{ formatAge(row.createdAt, locale) }}</template>
        <template #empty><EmptyState :title="t('home.dashboard.recent.empty')" icon="list" /></template>
      </Table>
    </Card>

    <div class="dashboard__cards">
      <Card :title="t('home.dashboard.jobs.title')" as="section">
        <Skeleton v-if="jobs.loading.value" :lines="2" />
        <div v-else-if="jobs.items.value.length > 0" class="dashboard__stack">
          <JobProgress v-for="job in jobs.items.value" :key="job.id" :job="job" variant="inline" />
        </div>
        <EmptyState v-else :title="t('home.dashboard.jobs.empty')" icon="check-circle" />
      </Card>
      <Card :title="t('home.dashboard.billing.title')" as="section">
        <Banner v-if="forbidden(billing.error.value)" variant="info">{{ t('home.dashboard.billing.forbidden') }}</Banner>
        <Skeleton v-else-if="billing.loading.value" :lines="2" />
        <p v-else-if="billing.data.value">{{ t('home.dashboard.billing.plan', { plan: billing.data.value.plan, seats: billing.data.value.seats }) }}</p>
      </Card>
    </div>

  </Page>
</template>

<style scoped>
.dashboard__tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: var(--ui-space-4); }
.dashboard__cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: var(--ui-space-4); align-items: start; }
.dashboard__stack { display: grid; gap: var(--ui-space-3); }
</style>
