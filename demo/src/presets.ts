// Switches the style preset by enabling one <link> at a time (D45), and theme and density by
// attribute on <html> (D37, D38). Persisted in localStorage so a reload keeps the choice.
import { ref, watchEffect } from 'vue'

const presetUrls = import.meta.glob<string>('../../ui/presets/*.css', { query: '?url', import: 'default', eager: true })

export const presets = Object.keys(presetUrls)
  .map(path => /\/([^/]+)\.css$/.exec(path)![1]!)
  .sort((a, b) => (a === 'neutral' ? -1 : b === 'neutral' ? 1 : a.localeCompare(b)))

export type Theme = 'auto' | 'light' | 'dark'
export type Density = 'comfortable' | 'compact'

export const preset = ref(localStorage.getItem('demo.preset') ?? 'neutral')
export const theme = ref<Theme>((localStorage.getItem('demo.theme') as Theme | null) ?? 'auto')
export const density = ref<Density>((localStorage.getItem('demo.density') as Density | null) ?? 'comfortable')

const links = new Map<string, HTMLLinkElement>()
for (const [path, url] of Object.entries(presetUrls)) {
  const name = /\/([^/]+)\.css$/.exec(path)![1]!
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  link.disabled = true
  document.head.append(link)
  links.set(name, link)
}

watchEffect(() => {
  for (const [name, link] of links) link.disabled = name !== preset.value
  localStorage.setItem('demo.preset', preset.value)
})
watchEffect(() => {
  const root = document.documentElement
  if (theme.value === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme.value)
  localStorage.setItem('demo.theme', theme.value)
})
watchEffect(() => {
  const root = document.documentElement
  if (density.value === 'comfortable') root.removeAttribute('data-density')
  else root.setAttribute('data-density', density.value)
  localStorage.setItem('demo.density', density.value)
})
