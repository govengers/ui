<script setup lang="ts">
// Changelog recipe (D62): every minor line of the parsed changelog, newest first, one Card per
// line with its releases, their dates and groups. The running release carries a "Current" badge;
// every release has an anchor (#v2-4-1) a WhatsNew link or a support answer can point at.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Badge from '../../ui/Badge/Badge.vue'
import Card from '../../ui/Card/Card.vue'
import EmptyState from '../../ui/EmptyState/EmptyState.vue'
import Page from '../../ui/Page/Page.vue'
import PageHeader from '../../ui/PageHeader/PageHeader.vue'
import { plainVersion, type ChangeGroup, type ReleaseLine } from '../../ui/changelog'
import { formatDate } from '../../ui/format'
import { messages } from './messages'

const props = defineProps<{
  /** parseChangelogs(files).lines, in a project from src/changelog.ts. */
  releases: readonly ReleaseLine[]
  /** The running build, import.meta.env.VITE_APP_VERSION: its release gets the "Current" badge. */
  version?: string | undefined
}>()

const { t, locale } = useI18n({ useScope: 'global', messages })
const groupLabels: Record<ChangeGroup, string> = { Features: 'ui.groupFeatures', Fixes: 'ui.groupFixes', Changes: 'ui.groupChanges', Security: 'ui.groupSecurity' }
// `v2.4.1` (git describe) and `2.4.1-rc.1` badge the 2.4.1 release, as WhatsNew and UpdateHint read them.
const current = computed(() => plainVersion(props.version))
const anchor = (version: string): string => `v${version.replaceAll('.', '-')}`
// Noon local time, so a date-only value never shows as the day before west of UTC.
const day = (date: string): string => formatDate(`${date}T12:00:00`, locale.value)
</script>

<template>
  <Page data-page="help.changelog" width="content">
    <PageHeader :title="t('help.changelog.title')" :subtitle="t('help.changelog.subtitle')" />
    <EmptyState v-if="releases.length === 0" icon="file" :title="t('help.changelog.empty')" />
    <div v-else class="changelog">
      <Card v-for="line in releases" :key="line.line" as="section" :title="`${line.line} - ${line.title}`">
        <p v-if="line.intro" class="changelog__intro">{{ line.intro }}</p>
        <article v-for="release in line.releases" :id="anchor(release.version)" :key="release.version" class="changelog__release">
          <h3 class="changelog__version">
            <a :href="`#${anchor(release.version)}`">{{ release.version }}</a>
            <time :datetime="release.date" class="changelog__date">{{ day(release.date) }}</time>
            <Badge v-if="release.version === current" variant="accent" size="sm">{{ t('help.changelog.current') }}</Badge>
          </h3>
          <template v-for="list in release.groups" :key="list.group">
            <h4 class="changelog__group">{{ t(groupLabels[list.group]) }}</h4>
            <ul class="changelog__items">
              <li v-for="(item, index) in list.items" :key="index">{{ item }}</li>
            </ul>
          </template>
        </article>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.changelog { display: flex; flex-direction: column; gap: var(--ui-space-5); }
.changelog__intro { color: var(--ui-ink-2); margin-bottom: var(--ui-space-3); }
.changelog__release { scroll-margin-top: var(--ui-space-8); }
.changelog__release + .changelog__release { margin-top: var(--ui-space-5); padding-top: var(--ui-space-5); border-top: var(--ui-border-width) solid var(--ui-border); }
.changelog__version { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--ui-space-3); font-size: var(--ui-text-md); }
.changelog__version a { color: inherit; text-decoration: none; }
.changelog__version a:hover { text-decoration: underline; }
.changelog__date { font-size: var(--ui-text-sm); font-weight: var(--ui-weight-normal); color: var(--ui-muted); }
.changelog__group { margin-top: var(--ui-space-3); font-size: var(--ui-text-sm); font-weight: var(--ui-weight-medium); color: var(--ui-muted); }
.changelog__items { display: flex; flex-direction: column; gap: var(--ui-space-1); margin: var(--ui-space-1) 0 0; padding-inline-start: var(--ui-space-5); }
</style>
