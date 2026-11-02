<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import Input from '../Input/Input.vue'
import type { DriveTarget } from '../agent/types'
import Spotlight from './Spotlight.vue'

const tour: { target: DriveTarget; text: string }[] = [
  { target: { action: 'createCustomer' }, text: 'New customers start here. The form asks for a name and an email.' },
  { target: { field: 'search' }, text: 'Type part of a name or an email to find a customer.' },
  { target: { action: 'exportCustomers' }, text: 'Exports the list as it is filtered right now.' },
]
const index = ref<number | null>(0)
const stop = computed(() => (index.value === null ? undefined : tour[index.value]))
const last = computed(() => index.value === tour.length - 1)
const search = ref('')

function next() {
  index.value = index.value === null || last.value ? null : index.value + 1
}
</script>

<template>
  <section class="stage">
    <h2>Guide tour, open on load (Next, Back, Escape or the close button)</h2>
    <div class="bar">
      <Button variant="primary" data-action="createCustomer"><template #icon><Icon name="plus" /></template>New customer</Button>
      <Input v-model="search" type="search" name="search" aria-label="Search customers" placeholder="Search customers" />
      <Button data-action="exportCustomers"><template #icon><Icon name="download" /></template>Export</Button>
    </div>
    <Button v-if="index === null" variant="ghost" @click="index = 0"><template #icon><Icon name="play" /></template>Start the tour again</Button>
    <Spotlight
      :target="stop?.target ?? null"
      :text="stop?.text ?? ''"
      :step="index === null ? undefined : index + 1"
      :total="tour.length"
      :can-back="(index ?? 0) > 0"
      can-next
      :next-label="last ? 'Done' : undefined"
      @next="next"
      @back="index = (index ?? 1) - 1"
      @close="index = null"
    />
  </section>
</template>

<style scoped>
.stage { padding-bottom: calc(var(--ui-space-16) * 2.5); }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-3); margin-bottom: var(--ui-space-4); }
.bar > :nth-child(2) { width: 16rem; }
</style>
