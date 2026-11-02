// What the settings page can do, for the agent (D24, D48): names equal the livewire call names.
// SettingsPage.vue binds a handler to each with useAgentAction while it is mounted.
import type { AgentAction } from '../../ui/agent/types'

export const updateSettings: AgentAction = {
  name: 'updateSettings',
  description: 'Changes workspace settings: company name, support email, timezone, default language, notification switches. Send only the fields to change.',
  params: {
    companyName: 'The company name shown in the app and in mails',
    supportEmail: 'Where customers write to',
    timezone: 'IANA time zone, e.g. Europe/Berlin',
    language: 'Default language: en or de',
    notifyByEmail: 'true or false: mail on new orders',
    weeklyDigest: 'true or false: a summary every Monday',
  },
  page: 'settings.general',
  mutating: true,
}

export const deleteWorkspace: AgentAction = {
  name: 'deleteWorkspace',
  description: 'Deletes the whole workspace for good. Only opens the confirmation; the user types the workspace name and confirms.',
  page: 'settings.general',
  mutating: true,
}

export const actions: AgentAction[] = [updateSettings, deleteWorkspace]
