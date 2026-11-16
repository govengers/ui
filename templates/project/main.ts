// How a target project mounts govengers/ui (ui-start step 4). Merge into src/main.ts.
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import './ui/tokens.css'
import './ui/base.css'
import './ui/presets/neutral.css'
import { messages as uiMessages } from './ui/messages'
import { installFeedbackBuffer } from './ui/blocks/FeedbackCapture/feedback'
import { livePlugin } from './api/vue'
import App from './App.vue'
import { createAppRouter } from './router'
import { session } from './session'

// FeedbackCapture's ring buffer: before anything logs or fetches. Drop it with FeedbackCapture.
installFeedbackBuffer()

const i18n = createI18n({
  legacy: false,
  locale: navigator.language.startsWith('de') ? 'de' : 'en',
  fallbackLocale: 'en',
  // Page messages are mounted by each page folder's messages.ts; only the ui.* keys live here.
  messages: uiMessages,
})

// Who the cookie names decides the first route: resume before the router is installed, since
// installing it runs the first navigation and its guard. Mount once that navigation resolved:
// before it the route has no meta, and App.vue would render the product shell on /login once.
session.resume()
  .catch((error: unknown) => console.error('session: GET /auth/me failed', error))
  .then(async () => {
    const router = createAppRouter()
    const app = createApp(App)
      .use(router)
      .use(i18n)
      // One pair per signed-in identity, replaced by the session on every change (livewire D66).
      .use(livePlugin(session.pair))
    await router.isReady()
    app.mount('#app')
  })
