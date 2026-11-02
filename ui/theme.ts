// useTheme (D35): light, dark or auto, applied as data-theme on <html> (D37), kept in
// localStorage, optionally mirrored to a user setting through a call the app passes in.
import { effectScope, ref, watch, type Ref } from 'vue'

export type Theme = 'auto' | 'light' | 'dark'

const key = 'ui.theme'
const theme: Ref<Theme> = ref(read())
let applied = false

function read(): Theme {
  try {
    const stored = localStorage.getItem(key)
    return stored === 'light' || stored === 'dark' ? stored : 'auto'
  } catch {
    return 'auto'
  }
}

function apply(value: Theme): void {
  const root = document.documentElement
  if (value === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', value)
  try { localStorage.setItem(key, value) } catch { /* private mode: the attribute still applies */ }
}

export interface UseThemeOptions {
  /** Called with the new theme so the app can persist it on the user (a livewire call). */
  persist?: (theme: Theme) => Promise<void> | void
}

export function useTheme(options: UseThemeOptions = {}): { theme: Ref<Theme>; set: (value: Theme) => void; cycle: () => void } {
  if (!applied) {
    applied = true
    apply(theme.value)
    // A detached scope: the watcher must outlive the component that called useTheme first.
    effectScope(true).run(() => {
      watch(theme, value => {
        apply(value)
        void options.persist?.(value)
      })
    })
  }
  return {
    theme,
    set: value => { theme.value = value },
    cycle: () => { theme.value = theme.value === 'auto' ? 'light' : theme.value === 'light' ? 'dark' : 'auto' },
  }
}
