// What the auth screens can do, for the agent (D24, D48). Declared for app-map.json, never bound:
// the agent cannot sign in for the user, and an unbound action pauses drive mode on its button
// (D52), so the user always clicks these themselves.
import type { AgentAction } from '../../ui/agent/types'

export const login: AgentAction = {
  name: 'login',
  description: 'Signs in with user name or email and password, then a 6-digit code when two-factor is on.',
  params: { identifier: 'The user name or email', password: 'The password', code: 'The one-time code or backup code, second step only' },
  page: 'auth.login',
  mutating: true,
}

export const loginSso: AgentAction = {
  name: 'loginSso',
  description: 'Signs in through an identity provider (OIDC single sign-on or GitHub); data-provider names which.',
  page: 'auth.login',
  mutating: true,
}

export const changePassword: AgentAction = {
  name: 'changePassword',
  description: 'Changes the signed-in user\'s password; needs the current one.',
  params: { currentPassword: 'The current password', newPassword: 'The new password', confirmPassword: 'The new password again' },
  page: 'auth.changePassword',
  mutating: true,
}

export const actions: AgentAction[] = [login, loginSso, changePassword]
