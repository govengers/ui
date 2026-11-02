<script setup lang="ts">
// SettingsPage recipe (D8, building-a-settings-page): four tabs on ?tab=, each a stack of Cards
// that are their own forms. General is a DetailForm over useLiveForm, Profile reads the user,
// Notifications save on change, Danger zone confirms by typing the workspace name.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useLive, useLiveConnection } from '@/api/vue'
// In a project: import { calls, live, uploads, type Settings, type UpdateSettings } from '@/api/api'
import { calls, live, uploads, type Settings, type UpdateSettings } from '@/fake/api'
import Avatar from '../../ui/Avatar/Avatar.vue'
import Banner from '../../ui/Banner/Banner.vue'
import Button from '../../ui/Button/Button.vue'
import Card from '../../ui/Card/Card.vue'
import Dialog from '../../ui/Dialog/Dialog.vue'
import Field from '../../ui/Field/Field.vue'
import Input from '../../ui/Input/Input.vue'
import Page from '../../ui/Page/Page.vue'
import PageHeader from '../../ui/PageHeader/PageHeader.vue'
import Select from '../../ui/Select/Select.vue'
import Skeleton from '../../ui/Skeleton/Skeleton.vue'
import Switch from '../../ui/Switch/Switch.vue'
import Tabs, { type TabItem } from '../../ui/Tabs/Tabs.vue'
import { toast } from '../../ui/Toast/toast'
import { useAgentAction } from '../../ui/agent/registry'
import DetailForm from '../../ui/blocks/DetailForm/DetailForm.vue'
import FileUpload from '../../ui/blocks/FileUpload/FileUpload.vue'
import { useLiveForm } from '../../ui/blocks/LiveForm/liveForm'
import { useTheme, type Theme } from '../../ui/theme'
import { deleteWorkspace, updateSettings } from './actions'
import { messages } from './messages'

const props = defineProps<{
  /** Pins the tab instead of reading ?tab= (demo, tests). */
  tab?: 'general' | 'profile' | 'notifications' | 'danger' | undefined
}>()

const { t, locale } = useI18n({ useScope: 'global', messages })
const route = useRoute()
const connection = useLiveConnection()

const tabs = ['general', 'profile', 'notifications', 'danger'] as const
const active = computed(() => props.tab ?? tabs.find(tab => tab === route.query['tab']) ?? 'general')
const items = computed<TabItem[]>(() => [
  { value: 'general', label: t('settings.tabs.general'), to: { query: { tab: 'general' } } },
  { value: 'profile', label: t('settings.tabs.profile'), to: { query: { tab: 'profile' } } },
  { value: 'notifications', label: t('settings.tabs.notifications'), to: { query: { tab: 'notifications' } } },
  { value: 'danger', label: t('settings.tabs.danger'), to: { query: { tab: 'danger' } } },
])

// General: one form, Save sends only the touched fields.
const general = useLiveForm({
  target: live.settings,
  params: {},
  call: calls.updateSettings,
  pick: (settings: Settings): UpdateSettings => ({
    companyName: settings.companyName, supportEmail: settings.supportEmail, timezone: settings.timezone, language: settings.language,
  }),
})
const timezones = [...new Set(['UTC', ...Intl.supportedValuesOf('timeZone')])].map(zone => ({ value: zone, label: zone }))
// Each language named in itself, so a user finds theirs whatever the current language is.
const languages = ['en', 'de'].map(code => ({ value: code, label: new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code }))

// Profile: the signed-in user, read only (the demo API has no updateUser call; see the card).
const userId = 'usr-1' // REPLACE: the signed-in user's id, from the session (/auth/me)
const user = useLive(live['users.item'], { id: userId })
const { theme } = useTheme()
const themes = computed(() => [
  { value: 'auto', label: t('settings.profile.themeAuto') },
  { value: 'light', label: t('settings.profile.themeLight') },
  { value: 'dark', label: t('settings.profile.themeDark') },
])
function pictureUploaded(): void {
  // REPLACE: set the picture on the user, e.g. calls.updateUser({ id }, { avatar: file.id }).
  toast({ message: t('settings.profile.pictureUploaded'), variant: 'success' })
}

// Notifications: a switch saves on change; a refusal puts the server's value back.
const notifications = useLiveForm({
  target: live.settings,
  params: {},
  call: calls.updateSettings,
  pick: (settings: Settings): UpdateSettings => ({ notifyByEmail: settings.notifyByEmail, weeklyDigest: settings.weeklyDigest }),
})
async function toggle(name: 'notifyByEmail' | 'weeklyDigest', value: boolean): Promise<void> {
  notifications.fields[name] = value
  if (await notifications.save()) {
    toast({ message: t('settings.notifications.saved'), variant: 'success' })
    return
  }
  notifications.reset()
  toast({ message: t('settings.notifications.failed'), variant: 'danger' })
}

// Danger zone: the delete button stays disabled until the workspace name is typed.
const confirming = ref(false)
const typed = ref('')
const workspace = computed(() => general.item.value?.companyName ?? '')
const matches = computed(() => workspace.value !== '' && typed.value.trim() === workspace.value)
function confirmDelete(): void {
  // REPLACE: the demo API has no deleteWorkspace call. A project calls it, then signs out:
  // await connection.value.call(calls.deleteWorkspace, {}, undefined)
  confirming.value = false
  toast({ message: t('settings.danger.deleted') })
}

useAgentAction(updateSettings, params => connection.value.call(calls.updateSettings, {}, params as UpdateSettings))
useAgentAction(deleteWorkspace, () => { confirming.value = true })
</script>

<template>
  <Page data-page="settings.general" width="content">
    <PageHeader :title="t('settings.title')">
      <template #tabs><Tabs :items="items" :model-value="active" :label="t('settings.tabsLabel')" /></template>
    </PageHeader>

    <DetailForm
      v-if="active === 'general'"
      :form="general"
      :title="t('settings.general.title')"
      action="updateSettings"
      @saved="toast({ message: t('settings.general.saved'), variant: 'success' })"
    >
      <template #default="{ fields, errors, disabled }">
        <Field :label="t('settings.general.companyName')" :error="errors.companyName" required>
          <Input v-model="fields.companyName" name="companyName" :disabled="disabled" />
        </Field>
        <Field :label="t('settings.general.supportEmail')" :hint="t('settings.general.supportEmailHint')" :error="errors.supportEmail" required>
          <Input v-model="fields.supportEmail" type="email" name="supportEmail" :disabled="disabled" />
        </Field>
        <Field :label="t('settings.general.timezone')" :error="errors.timezone">
          <Select v-model="fields.timezone" name="timezone" :options="timezones" :disabled="disabled" />
        </Field>
        <Field :label="t('settings.general.language')" :hint="t('settings.general.languageHint')" :error="errors.language">
          <Select v-model="fields.language" name="language" :options="languages" :disabled="disabled" />
        </Field>
      </template>
    </DetailForm>

    <template v-else-if="active === 'profile'">
      <Card :title="t('settings.profile.title')" as="section">
        <Banner v-if="user.error.value" variant="danger">
          {{ t('ui.loadFailed') }}
          <template #action><Button size="sm" @click="user.retry()">{{ t('ui.retry') }}</Button></template>
        </Banner>
        <Skeleton v-else-if="user.loading.value" :lines="4" />
        <div v-else-if="user.data.value" class="settings-page__stack">
          <div class="settings-page__picture">
            <Avatar :name="user.data.value.name" :src="user.data.value.avatar ?? undefined" size="lg" />
            <FileUpload :upload="uploads.uploadFile" name="avatar" :max-files="1" :max-size="2 * 1024 * 1024" @uploaded="pictureUploaded" />
          </div>
          <Field :label="t('settings.profile.name')" :hint="t('settings.profile.readOnly')">
            <Input :model-value="user.data.value.name" name="name" readonly />
          </Field>
          <Field :label="t('settings.profile.email')">
            <Input :model-value="user.data.value.email" type="email" name="email" readonly />
          </Field>
        </div>
      </Card>
      <Card :title="t('settings.profile.appearance')" as="section">
        <div class="settings-page__stack">
          <Field :label="t('settings.profile.theme')">
            <Select :model-value="theme" name="theme" :options="themes" @update:model-value="value => (theme = value as Theme)" />
          </Field>
          <Field :label="t('settings.profile.language')" :hint="t('settings.profile.languageHint')">
            <Select :model-value="locale" name="locale" :options="languages" @update:model-value="value => (locale = value as 'en' | 'de')" />
          </Field>
        </div>
      </Card>
    </template>

    <Card v-else-if="active === 'notifications'" :title="t('settings.notifications.title')" as="section">
      <Banner v-if="notifications.error.value" variant="danger">
        {{ t('ui.loadFailed') }}
        <template #action><Button size="sm" @click="notifications.retry()">{{ t('ui.retry') }}</Button></template>
      </Banner>
      <Skeleton v-else-if="notifications.loading.value" :lines="2" />
      <div v-else class="settings-page__stack">
        <Switch
          :model-value="notifications.fields.notifyByEmail"
          name="notifyByEmail"
          data-action="updateSettings"
          :label="t('settings.notifications.notifyByEmail')"
          @update:model-value="value => toggle('notifyByEmail', value)"
        />
        <Switch
          :model-value="notifications.fields.weeklyDigest"
          name="weeklyDigest"
          data-action="updateSettings"
          :label="t('settings.notifications.weeklyDigest')"
          @update:model-value="value => toggle('weeklyDigest', value)"
        />
      </div>
    </Card>

    <template v-else>
      <Card :title="t('settings.danger.title')" as="section">
        <div class="settings-page__danger">
          <p>{{ t('settings.danger.description') }}</p>
          <Button variant="danger" data-action="deleteWorkspace" @click="confirming = true">{{ t('settings.danger.delete') }}</Button>
        </div>
      </Card>
      <Dialog
        v-model="confirming"
        variant="danger"
        size="sm"
        :title="t('settings.danger.confirmTitle')"
        :description="t('settings.danger.confirmDescription', { name: workspace })"
        @close="typed = ''"
      >
        <Field :label="t('settings.danger.confirmLabel')">
          <Input v-model="typed" name="workspaceName" autocomplete="off" />
        </Field>
        <template #actions>
          <Button @click="confirming = false">{{ t('ui.cancel') }}</Button>
          <Button variant="danger" data-action="deleteWorkspace" :disabled="!matches" @click="confirmDelete">{{ t('settings.danger.delete') }}</Button>
        </template>
      </Dialog>
    </template>
  </Page>
</template>

<style scoped>
.settings-page__stack { display: grid; gap: var(--ui-space-4); }
.settings-page__picture { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--ui-space-4); align-items: start; }
.settings-page__danger { display: grid; gap: var(--ui-space-4); justify-items: start; }
</style>
