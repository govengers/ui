// Every string the changelog page shows (D21), mounted by Changelog.vue under help; the group
// headings are the ui.group* keys WhatsNew uses too.
export const messages = {
  en: {
    help: {
      changelog: {
        title: 'Changelog',
        subtitle: 'What changed in every version of the app.',
        current: 'Current',
        empty: 'No release notes yet',
      },
    },
  },
  de: {
    help: {
      changelog: {
        title: 'Änderungen',
        subtitle: 'Was sich in jeder Version der App geändert hat.',
        current: 'Aktuell',
        empty: 'Noch keine Versionshinweise',
      },
    },
  },
} as const
