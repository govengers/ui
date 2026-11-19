// The phone bar's More tab (D92), AppShell's behaviour beside its template: the open state, the
// mark when the current page sits behind More, the guards that make a double tap or a held Enter on
// More act once, and where focus goes when crossing 48rem hides the element that held it.
import { nextTick, onBeforeUnmount, onUpdated, ref, watch, watchPostEffect, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** `nav` is the shell's nav element (the sheet renders inside it), `phone` follows the 48rem query. */
export function useMore(nav: Ref<HTMLElement | null>, phone: Ref<boolean>) {
  const route = useRoute()
  const more = ref(false)
  // Any navigation closes More; a tap on the page it is on too, which the router reports as a duplicate.
  onBeforeUnmount(useRouter().afterEach(() => { more.value = false }))

  // RouterLink decides which item is current; when that item sits behind More, More is marked. A
  // footer that appears or an item added in place changes that without a navigation.
  const moreCurrent = ref(false)
  function markMore() {
    moreCurrent.value = !!nav.value?.querySelector(':scope > [data-overflow].router-link-active')
  }
  watchPostEffect(() => {
    void route.fullPath
    markMore()
  })
  onUpdated(markMore)

  // The second click of a double tap lands in the sheet that rose under the finger, the repeats of
  // a held Enter on the sheet's first control: both are dropped while they belong to the press that
  // opened it. The first event that does not (a fresh click or key, Enter coming up) ends that; a
  // closed sheet receives nothing, and More arms it again on every open. A second tap counts as part
  // of the press where the browser counts taps in `detail`.
  let opening = false
  function open() {
    opening = true
    more.value = true
  }
  function swallowRepeat(event: MouseEvent | KeyboardEvent) {
    const repeat = event instanceof KeyboardEvent ? event.repeat : event.detail > 1
    if (repeat && opening) {
      event.preventDefault()
      event.stopPropagation()
    }
    // Only Enter coming up ends the press: Shift let go while Enter is still held does not.
    else if (!repeat && (event.type !== 'keyup' || (event as KeyboardEvent).key === 'Enter')) opening = false
  }
  // A held Enter that closed the sheet (its X, a link) lands on More: its repeats do not reopen it.
  function holdMore(event: KeyboardEvent) {
    if (event.repeat && event.key === 'Enter') event.preventDefault()
  }

  // Focus whose element is no longer shown goes to the door to it: More where it shows (phones),
  // else the current link, else the first. Decided by what is shown, so it also holds when the
  // browser drops the focus before the media query reports the change. A closing sheet keeps its
  // box while it slides out, so what is in a closed dialog counts as gone.
  const shown = (element: Element | null | undefined) => !!element && element.getClientRects().length > 0 && !element.closest('dialog:not([open])')
  function rehome(from: Element) {
    if (shown(from)) return (from as HTMLElement).focus()
    const doors = [':scope > .ui-app-shell__more', ':scope > .router-link-active', ':scope > a'].map(door => nav.value?.querySelector<HTMLElement>(door))
    doors.find(shown)?.focus()
  }
  // Crossing 48rem closes More and moves the footer node (the sheet's or the nav's): focus that was
  // in the nav follows its element, else the door.
  const sheetFooter = ref<HTMLElement | null>(null)
  watch(phone, async () => {
    const from = document.activeElement
    more.value = false
    // The platform hides a popover that moves without telling it, and a modal dialog that moves
    // leaves the top layer but stays open: close the footer's first, so triggers and models agree.
    for (const panel of nav.value?.querySelectorAll<HTMLElement>('.ui-app-shell__nav-footer :is(:popover-open, dialog[open])') ?? []) {
      if (panel.matches(':popover-open')) panel.hidePopover()
      else (panel as HTMLDialogElement).close()
    }
    if (!from || !nav.value?.contains(from)) return
    await nextTick()
    rehome(from)
  })
  // A resize that hides the focused tab (More, an item past the fourth) blurs it before the media
  // query reports the change.
  function onFocusOut(event: FocusEvent) {
    if (!event.relatedTarget && !shown(event.target as Element)) rehome(event.target as Element)
  }

  return { more, moreCurrent, sheetFooter, open, swallowRepeat, holdMore, onFocusOut }
}
