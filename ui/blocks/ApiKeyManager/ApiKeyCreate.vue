<script setup lang="ts">
// ApiKeyCreate: the ApiKeyManager's create dialog. Name, scopes and expiry, then the secret the
// create call answered, shown once with a copy button; closing, another identity or the end of
// the connection forgets it, also when the create answers later (D60).
import { onScopeDispose, reactive, ref, useId, watch } from 'vue'
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
import { toast } from '../../Toast/toast'
import { attempts, expiresAtFor, forgetWhenGone, type ApiKeyScope } from './apiKeys'

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
/**
 * The secret's layout, apart from the secret: closing forgets the secret at once, while the dialog
 * keeps this layout (title, emptied field) until the next open, so it does not turn into the create
 * form while it fades out (D94).
 */
const showsSecret = ref(false)
watch(open, (now) => {
  if (now) showsSecret.value = false
})
const copied = ref(false)
const copyFailed = ref(false)
const tries = attempts()
/** Copies in flight: a write that settles after a newer copy, a close or the unmount does nothing. */
const copies = attempts()
let copiedTimer: ReturnType<typeof setTimeout> | undefined
const expiryOptions = props.expiryDays.map((days) => ({ value: days, label: days === 0 ? t('ui.never') : t('ui.inDays', { n: days }) }))

async function submit(): Promise<void> {
  errors.value = {}
  failure.value = undefined
  saving.value = true
  const current = tries.begin()
  try {
    const created = await connection.value.call(props.create, {}, { name: form.name.trim(), scopes: [...form.scopes], expiresAt: expiresAtFor(form.days, Date.now()) })
    if (current()) {
      secret.value = created.secret
      showsSecret.value = true
    }
  } catch (error) {
    if (!current()) return
    if (error instanceof ApiError && Object.keys(error.fields).length > 0) errors.value = { ...error.fields }
    else failure.value = error instanceof Error ? error.message : String(error)
  } finally {
    if (current()) saving.value = false
  }
}

/** Makes every copy in flight stale and stops the timer that turns "Copied" back. */
function forgetCopies(): void {
  copies.forget()
  clearTimeout(copiedTimer)
}

async function copy(): Promise<void> {
  if (secret.value === undefined) return
  forgetCopies()
  const current = copies.begin()
  copyFailed.value = false
  try {
    await navigator.clipboard.writeText(secret.value)
    if (!current()) return
    copied.value = true
    toast({ message: t('ui.copied') })
    copiedTimer = setTimeout(() => (copied.value = false), 2000)
  } catch {
    // No clipboard (insecure context, denied): the line under the field says to copy by hand.
    if (!current()) return
    copied.value = false
    copyFailed.value = true
  }
}

/** Closing forgets the secret, the form and a create or copy still running, so reopening starts clean (the layout stays until then). */
function closed(): void {
  tries.forget()
  forgetCopies()
  saving.value = false
  secret.value = undefined
  copied.value = false
  copyFailed.value = false
  Object.assign(form, { name: '', scopes: [], days: props.expiryDays[0] ?? 0 })
  errors.value = {}
  failure.value = undefined
}

// The secret belongs to the session that created it: another pair or an ended one forgets it.
forgetWhenGone(connection, () => {
  closed()
  open.value = false
})
onScopeDispose(forgetCopies)
</script>

<template>
  <Dialog v-model="open" :title="showsSecret ? t('ui.newKeySecret') : t('ui.newApiKey')" :persistent="showsSecret" @close="closed">
    <div v-if="showsSecret" class="ui-api-key-create__secret">
      <Banner variant="warning">{{ t('ui.secretOnce') }}</Banner>
      <Field :label="t('ui.newKeySecret')" hide-label>
        <Input :model-value="secret ?? ''" name="secret" readonly autocomplete="off" spellcheck="false" />
        <p v-if="copyFailed" class="ui-api-key-create__copy-failed" role="alert">{{ t('ui.copyFailed') }}</p>
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
      <template v-if="showsSecret">
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
.ui-api-key-create__copy-failed { margin: 0; font-size: var(--ui-text-xs); color: var(--ui-danger); }
</style>
