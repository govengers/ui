<script setup lang="ts">
// ApiKeyCreate: the ApiKeyManager's create dialog. Name, scopes and expiry, then the secret the
// create call answered, shown once with a copy button; closing forgets it (D60).
import { reactive, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError, type MutationTarget, type NoParameters } from '@/api/runtime'
import { useLiveConnection } from '@/api/vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Checkbox from '../../Checkbox/Checkbox.vue'
import Dialog from '../../Dialog/Dialog.vue'
import Field from '../../Field/Field.vue'
import Icon from '../../Icon/Icon.vue'
import Input from '../../Input/Input.vue'
import Select from '../../Select/Select.vue'
import { expiresAtFor, type ApiKeyScope } from './apiKeys'

const props = defineProps<{
  create: MutationTarget<NoParameters, { name: string; scopes: string[]; expiresAt: string | null }, { secret: string }>
  scopes: readonly ApiKeyScope[]
  /** Days a key may live; 0 means never expires. */
  expiryDays: readonly number[]
}>()

const open = defineModel<boolean>({ default: false })
const { t } = useI18n()
const connection = useLiveConnection()
const formId = useId()

const form = reactive({ name: '', scopes: [] as string[], days: props.expiryDays[0] ?? 0 })
const errors = ref<Record<string, string>>({})
const failure = ref<string>()
const saving = ref(false)
const secret = ref<string>()
const copied = ref(false)
const expiryOptions = props.expiryDays.map((days) => ({ value: days, label: days === 0 ? t('ui.never') : t('ui.inDays', { n: days }) }))

async function submit(): Promise<void> {
  errors.value = {}
  failure.value = undefined
  saving.value = true
  try {
    const created = await connection.value.call(props.create, {}, { name: form.name.trim(), scopes: [...form.scopes], expiresAt: expiresAtFor(form.days, Date.now()) })
    secret.value = created.secret
  } catch (error) {
    if (error instanceof ApiError && Object.keys(error.fields).length > 0) errors.value = { ...error.fields }
    else failure.value = error instanceof Error ? error.message : String(error)
  } finally {
    saving.value = false
  }
}

async function copy(): Promise<void> {
  if (secret.value === undefined) return
  try {
    await navigator.clipboard.writeText(secret.value)
    copied.value = true
  } catch {
    // No clipboard (insecure context, denied): the field stays selectable by hand.
  }
}

/** Closing forgets the secret and the form, so reopening starts clean. */
function closed(): void {
  secret.value = undefined
  copied.value = false
  Object.assign(form, { name: '', scopes: [], days: props.expiryDays[0] ?? 0 })
  errors.value = {}
  failure.value = undefined
}
</script>

<template>
  <Dialog v-model="open" :title="secret ? t('ui.newKeySecret') : t('ui.newApiKey')" :persistent="secret !== undefined" @close="closed">
    <div v-if="secret" class="ui-api-key-create__secret">
      <Banner variant="warning">{{ t('ui.secretOnce') }}</Banner>
      <Field :label="t('ui.newKeySecret')" hide-label>
        <Input :model-value="secret" name="secret" readonly autocomplete="off" spellcheck="false" />
      </Field>
    </div>
    <form v-else :id="formId" class="ui-api-key-create__form" @submit.prevent="submit">
      <Banner v-if="failure" variant="danger">{{ failure }}</Banner>
      <Field :label="t('ui.keyName')" :error="errors['name']" required>
        <Input v-model="form.name" name="name" autocomplete="off" maxlength="100" />
      </Field>
      <Field :label="t('ui.scopes')" :error="errors['scopes']" group>
        <Checkbox
          v-for="scope in scopes"
          :key="scope.value"
          v-model="form.scopes"
          name="scopes"
          :value="scope.value"
          :label="scope.label"
          :description="scope.description"
        />
      </Field>
      <Field :label="t('ui.expires')" :error="errors['expiresAt']">
        <Select v-model="form.days" name="expiresAt" :options="expiryOptions" />
      </Field>
    </form>
    <template #actions>
      <template v-if="secret">
        <Button @click="copy"><template #icon><Icon :name="copied ? 'check' : 'copy'" /></template>{{ copied ? t('ui.copied') : t('ui.copy') }}</Button>
        <Button variant="primary" @click="open = false">{{ t('ui.done') }}</Button>
      </template>
      <template v-else>
        <Button @click="open = false">{{ t('ui.cancel') }}</Button>
        <Button type="submit" :form="formId" variant="primary" :data-action="create.name" :loading="saving">{{ t('ui.create') }}</Button>
      </template>
    </template>
  </Dialog>
</template>

<style scoped>
.ui-api-key-create__form, .ui-api-key-create__secret { display: grid; gap: var(--ui-space-4); }
</style>
