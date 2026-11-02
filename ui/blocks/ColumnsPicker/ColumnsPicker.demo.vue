<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useLiveList } from '@/api/vue'
import { live } from '@/fake/api'
import Table, { type TableColumn } from '../../Table/Table.vue'
import ColumnsPicker from './ColumnsPicker.vue'

const columns: (TableColumn & { required?: boolean })[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'country', label: 'Country' },
  { key: 'revenue', label: 'Revenue', align: 'end' },
  { key: 'createdAt', label: 'Created' },
]
const visible = ref(['name', 'status', 'country', 'revenue'])
const shown = computed(() => columns.filter(column => visible.value.includes(column.key)))
const customers = useLiveList(live.customers, { limit: 5 })

// Opened on load so the screenshot shows the checkboxes.
const preview = ref<InstanceType<typeof ColumnsPicker> | null>(null)
onMounted(() => setTimeout(() => preview.value?.open(), 300))
</script>

<template>
  <section>
    <h2>Beside a table, remembered in localStorage</h2>
    <div class="toolbar">
      <span class="muted">visible: {{ visible.join(', ') }}</span>
      <ColumnsPicker ref="preview" v-model="visible" :columns="columns" storage-key="demo.customers.columns" />
    </div>
    <Table :columns="shown" :rows="customers.items.value" row-key="id" :loading="customers.loading.value" />
  </section>
</template>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--ui-space-2); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
section { max-width: 60rem; min-height: 26rem; }
</style>
