// Every string the auth screens show (D21), mounted by LoginPage.vue under auth.
export const messages = {
  en: {
    auth: {
      app: 'Acme',
      imprint: 'Imprint',
      version: 'Version {version}',
      login: {
        heading: 'Sign in to {app}',
        sso: 'Continue with SSO',
        forgot: 'Forgot password?',
      },
      loggedOut: {
        heading: 'Signed out',
        title: 'You are signed out',
        text: 'Your session ended. Sign in again to continue where you left off.',
        again: 'Sign in again',
      },
      changePassword: {
        heading: 'Change password',
        title: 'Change your password',
        currentPassword: 'Current password',
        newPassword: 'New password',
        newPasswordHint: 'At least 12 characters.',
        confirmPassword: 'Repeat the new password',
        mismatch: 'The two new passwords differ.',
        submit: 'Change password',
        changed: 'Password changed.',
      },
    },
  },
  de: {
    auth: {
      app: 'Acme',
      imprint: 'Impressum',
      version: 'Version {version}',
      login: {
        heading: 'Bei {app} anmelden',
        sso: 'Mit SSO fortfahren',
        forgot: 'Passwort vergessen?',
      },
      loggedOut: {
        heading: 'Abgemeldet',
        title: 'Du bist abgemeldet',
        text: 'Deine Sitzung ist beendet. Melde dich erneut an, um weiterzumachen.',
        again: 'Erneut anmelden',
      },
      changePassword: {
        heading: 'Passwort ändern',
        title: 'Passwort ändern',
        currentPassword: 'Aktuelles Passwort',
        newPassword: 'Neues Passwort',
        newPasswordHint: 'Mindestens 12 Zeichen.',
        confirmPassword: 'Neues Passwort wiederholen',
        mismatch: 'Die beiden neuen Passwörter unterscheiden sich.',
        submit: 'Passwort ändern',
        changed: 'Passwort geändert.',
      },
    },
  },
}
