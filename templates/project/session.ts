// The app's one session (govengers/ui `session`, D56): login, logout, the identity and the
// livewire pair. Goes to src/session.ts (ui-start step 4). The pair is built here, nowhere else.
import { createLivePair } from './api/runtime'
import { createSession, type RedirectProvider } from './ui/session'

/** The redirect logins the server mounts (govengers/auth oidc, github); keep only those. `name` is the provider's
 *  identity name: the OIDC provider's `Name` (its default PathPrefix is /auth/oidc/<Name>), "github" for GitHub. */
export const providers: RedirectProvider[] = [
  // { name: 'company', label: 'Company SSO', prefix: '/auth/oidc/company' },
  // { name: 'github', label: 'GitHub', prefix: '/auth/github' },
]

export const session = createSession({
  providers,
  createPair: (identity, onUnauthorized) => createLivePair({
    identity: () => identity,
    client: { baseURL: '/api/v1', onUnauthorized },
    connection: { url: () => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/v1/socket`, onUnauthorized },
  }),
  // A 401 or 4401 left nobody: a full load of the login page drops every state of the old identity.
  onSignedOut: () => window.location.assign(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`),
})
