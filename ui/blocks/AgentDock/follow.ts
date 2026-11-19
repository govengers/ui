// The dock's log follows new text only while the reader is at its bottom (D98): the scroll wiring
// around following() of dock.ts and a ResizeObserver. AgentDock binds `log` and `onScroll` to its log.
import { nextTick, ref, watch } from 'vue'
import { following, thinking, type ChatMessage } from './dock'

export function useFollow(messages: () => readonly ChatMessage[]) {
  const log = ref<HTMLElement | null>(null)
  /** New text arrived below a reader who scrolled up: show "Jump to latest". */
  const unseen = ref(false)
  let pinned = true
  let lastTop = 0

  function onScroll() {
    const element = log.value
    if (!element) return
    const style = getComputedStyle(element)
    pinned = following(lastTop, element.scrollTop, element.scrollHeight, element.clientHeight, Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) || 0)
    lastTop = element.scrollTop
    if (pinned) unseen.value = false
  }

  function toBottom() {
    pinned = true
    unseen.value = false
    const element = log.value
    if (!element) return
    element.scrollTo({ top: element.scrollHeight, behavior: 'instant' })
    // A frame fires one scroll event: a reader's step up in the same frame must compare with this position.
    lastTop = element.scrollTop
  }

  function jump() {
    toBottom()
    log.value?.focus({ preventScroll: true }) // the button goes away; focus stays in the dock
  }

  // Sources, not one array getter: a push that changes none of the three does not count as new text.
  watch([() => messages().length, () => thinking(messages()), () => messages().at(-1)?.text], async () => {
    await nextTick()
    if (pinned) toBottom()
    else unseen.value = true
  })

  // The box changes size (the dock, the window, a draft over several lines): a following reader
  // stays at the bottom, a reader who scrolled up stays where they are. The observer reports in the
  // frame of the layout, before the scroll event of the browser's clamp, so `pinned` is still true.
  watch(log, (element, _, onCleanup) => {
    if (!element) return
    const observer = new ResizeObserver(() => {
      if (pinned) toBottom()
    })
    observer.observe(element)
    onCleanup(() => observer.disconnect())
  }, { flush: 'post' })

  return { log, unseen, onScroll, toBottom, jump }
}
