// useLeaveGuard: asks before unsaved edits are lost (D96). While `dirty`, a navigation to another
// path asks through window.confirm and a page unload gets the browser's own prompt; a query-only
// navigation (a tab, a filter) never asks. It lives as long as the calling component's scope.
import { getCurrentInstance, inject, onScopeDispose, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { routerKey } from 'vue-router'

export function useLeaveGuard(dirty: Ref<boolean>): void {
  // A bare effect scope (a model test) or an app without a router has nothing to guard.
  if (getCurrentInstance() === null) return
  const router = inject(routerKey, null)
  if (router === null) return
  const { t } = useI18n()

  const removeGuard = router.beforeEach((to, from) => to.path === from.path || !dirty.value || window.confirm(t('ui.leaveUnsaved')))
  // MDN, beforeunload: preventDefault asks; returnValue for the browsers that still need it.
  const onUnload = (event: BeforeUnloadEvent): void => {
    event.preventDefault()
    event.returnValue = true
  }
  watch(dirty, (now) => {
    if (now) window.addEventListener('beforeunload', onUnload)
    else window.removeEventListener('beforeunload', onUnload)
  }, { immediate: true })

  onScopeDispose(() => {
    removeGuard()
    window.removeEventListener('beforeunload', onUnload)
  })
}
