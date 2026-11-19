<script setup lang="ts">
// StatusTile: one number on a dashboard (D34): a label, the value with its unit, the change
// against the period before, a lamp for its state. Dumb on purpose: the page
// reads livewire and passes values, so one tile serves live and static numbers alike.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import Card from '../../Card/Card.vue'
import Icon from '../../Icon/Icon.vue'
import Skeleton from '../../Skeleton/Skeleton.vue'
import { formatNumber } from '../../format'
import { deltaTone } from './tile'

const props = defineProps<{
  label: string
  value: string | number
  unit?: string | undefined
  /** The change in percent: 12.5 shows +12.5 %; 0 is neutral. */
  delta?: number | undefined
  /** What the delta compares against, "vs last month": muted text after it. */
  period?: string | undefined
  /** A rise is bad (errors, churn): up turns danger, down success. */
  invert?: boolean | undefined
  state?: 'ok' | 'warning' | 'danger' | 'neutral' | undefined
  /** Names the lamp for assistive technology; its colour alone tells it nothing. */
  stateLabel?: string | undefined
  /** The tile becomes a link card. */
  to?: RouteLocationRaw | undefined
  loading?: boolean | undefined
}>()

const { locale } = useI18n()
const shown = computed(() => (typeof props.value === 'number' ? formatNumber(props.value, locale.value) : props.value))
const tone = computed(() => deltaTone(props.delta ?? 0, props.invert))
const arrow = computed(() => (tone.value === 'neutral' ? 'minus' : (props.delta ?? 0) > 0 ? 'arrow-up' : 'arrow-down'))
const change = computed(() =>
  formatNumber((props.delta ?? 0) / 100, locale.value, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }))
</script>

<template>
  <Card class="ui-status-tile" :to="to" :aria-busy="loading || undefined">
    <div class="ui-status-tile__label">
      <span
        v-if="state"
        class="ui-status-tile__lamp"
        :data-state="state"
        :role="stateLabel ? 'img' : undefined"
        :aria-label="stateLabel"
        :aria-hidden="stateLabel ? undefined : 'true'"
      />
      {{ label }}
    </div>
    <Skeleton v-if="loading" shape="rect" width="8rem" height="2.25rem" />
    <div v-else class="ui-status-tile__value">
      {{ shown }}<span v-if="unit" class="ui-status-tile__unit">{{ unit }}</span>
    </div>
    <div v-if="delta !== undefined && !loading" class="ui-status-tile__change">
      <span class="ui-status-tile__delta" :data-tone="tone"><Icon :name="arrow" size="sm" />{{ change }}</span>
      <span v-if="period" class="ui-status-tile__period">{{ period }}</span>
    </div>
    <div v-if="$slots.default" class="ui-status-tile__extra"><slot /></div>
  </Card>
</template>

<style scoped>
.ui-status-tile :deep(.ui-card__body) { display: flex; flex-direction: column; gap: var(--ui-space-2); }
.ui-status-tile__label { display: flex; align-items: center; gap: var(--ui-space-2); font-size: var(--ui-text-sm); color: var(--ui-muted); }
.ui-status-tile__lamp { flex: none; width: var(--ui-space-2); height: var(--ui-space-2); border-radius: var(--ui-radius-pill); background: var(--ui-muted); }
.ui-status-tile__lamp[data-state="ok"] { background: var(--ui-success); }
.ui-status-tile__lamp[data-state="warning"] { background: var(--ui-warning); }
.ui-status-tile__lamp[data-state="danger"] { background: var(--ui-danger); }

.ui-status-tile__value { font-size: var(--ui-text-2xl); font-weight: var(--ui-weight-semibold); line-height: var(--ui-leading-tight); color: var(--ui-ink); }
.ui-status-tile__unit { margin-inline-start: var(--ui-space-1); font-size: var(--ui-text-md); font-weight: var(--ui-weight-medium); color: var(--ui-muted); }

.ui-status-tile__change { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-2); }
.ui-status-tile__delta {
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-1);
  padding: 0 var(--ui-space-2);
  border-radius: var(--ui-radius-sm);
  font-size: var(--ui-text-xs);
  font-weight: var(--ui-weight-medium);
  line-height: var(--ui-leading);
}
.ui-status-tile__delta[data-tone="success"] { background: var(--ui-success-soft); color: var(--ui-on-success-soft); }
.ui-status-tile__delta[data-tone="danger"] { background: var(--ui-danger-soft); color: var(--ui-on-danger-soft); }
.ui-status-tile__delta[data-tone="neutral"] { background: var(--ui-surface-2); color: var(--ui-ink-2); }

.ui-status-tile__period { font-size: var(--ui-text-xs); color: var(--ui-muted); }

.ui-status-tile__extra { font-size: var(--ui-text-sm); color: var(--ui-muted); }
</style>
