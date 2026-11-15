<script setup lang="ts">
// ApiKeyManager: the user's API keys over livewire (D60). A live list (name, prefix, scopes,
// created, last used, expiry), "New API key" (ApiKeyCreate: the secret shown once) and revoke
// behind a danger confirmation. The block holds no rows of its own: pushes re-render it.
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ListResponse, LiveTarget, MutationTarget, NoParameters } from '@/api/runtime'
import { useLiveConnection, useLiveList } from '@/api/vue'
import Badge from '../../Badge/Badge.vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Dialog from '../../Dialog/Dialog.vue'
import EmptyState from '../../EmptyState/EmptyState.vue'
import Icon from '../../Icon/Icon.vue'
import Table, { type TableColumn } from '../../Table/Table.vue'
import { formatAge, formatDate } from '../../format'
import ApiKeyCreate from './ApiKeyCreate.vue'
import { keyState, newestFirst, type ApiKeyRow, type ApiKeyScope } from './apiKeys'

const props = withDefaults(defineProps<{
  /** The caller's keys, read whole, e.g. live.apiKeys. */
  target: LiveTarget<never, ListResponse<ApiKeyRow>>
  /** Answers the row plus `secret`; declared without an upserts effect (the card says why). */
  create: MutationTarget<NoParameters, { name: string; scopes: string[]; expiresAt: string | null }, { secret: string }>
  revoke: MutationTarget<{ id: string }, undefined, unknown>
  /** The scopes a key may carry; at least one. */
  scopes: readonly ApiKeyScope[]
  /** The expiry choices in days, the first preselected; 0 is never. */
  expiryDays?: readonly number[] | undefined
}>(), { expiryDays: () => [90, 30, 365, 0] })

const { t, locale } = useI18n()
const connection = useLiveConnection()
const list = useLiveList(props.target)
const rows = computed(() => newestFirst(list.items.value))
const labelOf = (scope: string): string => props.scopes.find((known) => known.value === scope)?.label ?? scope

const columns = computed<TableColumn[]>(() => [
  { key: 'name', label: t('ui.keyName') },
  { key: 'scopes', label: t('ui.scopes') },
  { key: 'createdAt', label: t('ui.created'), hideOnPhone: true },
  { key: 'lastUsedAt', label: t('ui.lastUsed') },
  { key: 'expiresAt', label: t('ui.expires') },
])

const creating = ref(false)
const revoking = shallowRef<ApiKeyRow>()
const revokeOpen = ref(false)
const revokeBusy = ref(false)
const revokeError = ref<string>()

function askRevoke(row: ApiKeyRow): void {
  revoking.value = row
  revokeError.value = undefined
  revokeOpen.value = true
}

async function confirmRevoke(): Promise<void> {
  if (revoking.value === undefined) return
  revokeBusy.value = true
  try {
    await connection.value.call(props.revoke, { id: revoking.value.id }, undefined)
    revokeOpen.value = false
  } catch (error) {
    revokeError.value = error instanceof Error ? error.message : String(error)
  } finally {
    revokeBusy.value = false
  }
}
</script>

<template>
  <section class="ui-api-key-manager">
    <header class="ui-api-key-manager__head">
      <h2 class="ui-api-key-manager__title">{{ t('ui.apiKeys') }}</h2>
      <Button variant="primary" @click="creating = true">
        <template #icon><Icon name="plus" /></template>{{ t('ui.newApiKey') }}
      </Button>
    </header>
    <Banner v-if="list.error.value" variant="danger">
      {{ list.error.value.message }}
      <template #action><Button size="sm" @click="list.retry()">{{ t('ui.retry') }}</Button></template>
    </Banner>
    <Table v-else :columns="columns" :rows="rows" row-key="id" :loading="list.loading.value && rows.length === 0" :caption="t('ui.apiKeys')">
      <template #cell-name="{ row }">
        <span class="ui-api-key-manager__name">{{ row.name }}</span>
        <code class="ui-api-key-manager__prefix">{{ row.prefix }}</code>
      </template>
      <template #cell-scopes="{ row }">
        <span class="ui-api-key-manager__scopes">
          <Badge v-for="scope in row.scopes" :key="scope" size="sm">{{ labelOf(scope) }}</Badge>
        </span>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt, locale) }}</template>
      <template #cell-lastUsedAt="{ row }">{{ row.lastUsedAt ? formatAge(row.lastUsedAt, locale) : t('ui.neverUsed') }}</template>
      <template #cell-expiresAt="{ row }">
        <Badge v-if="keyState(row, Date.now()) === 'expired'" variant="danger" size="sm">{{ t('ui.expired') }}</Badge>
        <Badge v-else-if="keyState(row, Date.now()) === 'expiring'" variant="warning" size="sm">{{ formatAge(row.expiresAt!, locale) }}</Badge>
        <template v-else>{{ row.expiresAt ? formatDate(row.expiresAt, locale) : t('ui.never') }}</template>
      </template>
      <template #actions="{ row }">
        <Button variant="ghost" size="sm" :data-action="revoke.name" :data-key="row.id" @click="askRevoke(row)">{{ t('ui.revoke') }}</Button>
      </template>
      <template #empty>
        <EmptyState icon="key" :title="t('ui.noApiKeys')" :description="t('ui.noApiKeysHint')" />
      </template>
    </Table>

    <ApiKeyCreate v-model="creating" :create="create" :scopes="scopes" :expiry-days="expiryDays" />

    <Dialog v-model="revokeOpen" variant="danger" size="sm" :title="t('ui.revokeKey', { name: revoking?.name ?? '' })" :description="t('ui.revokeHint')">
      <Banner v-if="revokeError" variant="danger">{{ revokeError }}</Banner>
      <template #actions>
        <Button @click="revokeOpen = false">{{ t('ui.cancel') }}</Button>
        <Button variant="danger" :data-action="revoke.name" :loading="revokeBusy" @click="confirmRevoke">{{ t('ui.revoke') }}</Button>
      </template>
    </Dialog>
  </section>
</template>

<style scoped>
.ui-api-key-manager { display: grid; gap: var(--ui-space-4); }
.ui-api-key-manager__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ui-space-3); }
.ui-api-key-manager__title { font-size: var(--ui-text-lg); }
.ui-api-key-manager__name { display: block; font-weight: var(--ui-weight-medium); }
.ui-api-key-manager__prefix { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.ui-api-key-manager__scopes { display: flex; flex-wrap: wrap; gap: var(--ui-space-1); }
</style>
