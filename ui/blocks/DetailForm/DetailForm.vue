<script setup lang="ts" generic="Item, Patch extends object">
// DetailForm: the card of an edit form over a useLiveForm result (D33). A skeleton while the
// record loads, a Banner with Retry when the read fails, the page's Fields in the default slot,
// the save failure no field explains, and the ActionBar after the fields (D27: drive mode pauses
// on the Save button, found by its data-action). Enter submits through the native <form>.
// The leave guard is useLiveForm's, not this card's: the form state may outlive the card (D96).
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ActionBar from '../../ActionBar/ActionBar.vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Card from '../../Card/Card.vue'
import Icon from '../../Icon/Icon.vue'
import Skeleton from '../../Skeleton/Skeleton.vue'
import type { LiveFormState } from '../LiveForm/liveForm'

const props = defineProps<{
  form: LiveFormState<Item, Patch>
  title: string
  /** The update call's name, the Save button's data-action (D23). */
  action: string
  cancelLabel?: string | undefined
  saveLabel?: string | undefined
}>()

const emit = defineEmits<{ saved: []; cancelled: [] }>()

defineSlots<{
  default(scope: { fields: Patch; errors: Record<string, string>; conflicts: string[]; disabled: boolean }): unknown
}>()

const { t } = useI18n()
const element = ref<HTMLFormElement>()

// Nothing touched: no call and no `saved`. Controls disabled while saving lose the focus: give it
// back, or to the first refused field.
async function submit(): Promise<void> {
  if (!props.form.dirty.value) return
  const focused = document.activeElement
  const saved = await props.form.save()
  await nextTick()
  const invalid = saved ? null : element.value?.querySelector<HTMLElement>('[aria-invalid="true"]')
  if (invalid) invalid.focus()
  else if (document.activeElement === document.body && focused instanceof HTMLElement) focused.focus()
  if (saved) emit('saved')
}

// A refused field's error clears once the user leaves it with another value than the refused one.
function leave(event: FocusEvent): void {
  const { name } = event.target as Partial<HTMLInputElement>
  if (name) props.form.settle(name)
}

function cancel(): void {
  props.form.reset()
  emit('cancelled')
}
</script>

<template>
  <form ref="element" class="ui-detail-form" @submit.prevent="submit" @focusout="leave">
    <Card :title="title" as="section">
      <div class="ui-detail-form__body" :aria-busy="form.loading.value || undefined">
        <Banner v-if="form.error.value" variant="danger">
          {{ t('ui.loadFailed') }}
          <template #action><Button size="sm" @click="form.retry()">{{ t('ui.retry') }}</Button></template>
        </Banner>
        <template v-if="form.loading.value">
          <div v-for="line in 3" :key="line" class="ui-detail-form__placeholder">
            <Skeleton width="8rem" />
            <Skeleton shape="rect" height="var(--ui-control-h)" />
          </div>
        </template>
        <template v-else-if="form.item.value !== undefined">
          <slot :fields="form.fields" :errors="form.errors" :conflicts="form.conflicts.value" :disabled="form.saving.value" />
          <Banner v-if="form.saveError.value" variant="danger">
            {{ form.saveError.value.name === 'ApiError' ? form.saveError.value.message : t('ui.saveFailed') }}
          </Banner>
        </template>
      </div>
    </Card>
    <ActionBar v-if="form.item.value !== undefined">
      <template #lead>
        <span v-if="form.conflicts.value.length > 0" class="ui-detail-form__hint">
          <Icon name="alert-triangle" /> {{ t('ui.changedElsewhere') }}
        </span>
        <span v-else-if="form.dirty.value" class="ui-detail-form__hint">{{ t('ui.unsavedChanges') }}</span>
      </template>
      <Button @click="cancel">{{ cancelLabel ?? t('ui.cancel') }}</Button>
      <Button type="submit" variant="primary" :data-action="action" :loading="form.saving.value">{{ saveLabel ?? t('ui.save') }}</Button>
    </ActionBar>
  </form>
</template>

<style scoped>
.ui-detail-form { display: flex; flex-direction: column; gap: var(--ui-space-4); }
.ui-detail-form__body { display: flex; flex-direction: column; gap: var(--ui-space-4); }
.ui-detail-form__placeholder { display: flex; flex-direction: column; gap: var(--ui-space-2); }
.ui-detail-form__hint { display: inline-flex; align-items: center; gap: var(--ui-space-2); }
</style>
