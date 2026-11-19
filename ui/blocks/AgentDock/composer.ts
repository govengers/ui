// The dock's composer (D98): one call at a time. With a cancel call Stop replaces Send while the
// agent answers; a press as the answer ends sends nothing, and focus does not drop to the page.
import { computed, ref, watch } from 'vue'
import type { LiveConnection, MutationTarget, NoParameters } from '@/api/runtime'
import { answering, switchGuard, type AgentMode, type ChatMessage } from './dock'

export interface ComposerOptions {
  messages: () => readonly ChatMessage[]
  connection: () => LiveConnection
  send: () => MutationTarget<NoParameters, { text: string; mode: AgentMode }, unknown>
  cancel: () => MutationTarget<NoParameters, undefined, unknown> | undefined
  mode: () => AgentMode
  /** Runs as a message goes out: the log goes to its bottom. */
  sending: () => void
}

export function useComposer(options: ComposerOptions) {
  const form = ref<HTMLFormElement | null>(null)
  const field = ref<{ focus(): void } | null>(null)
  const draft = ref('')
  const pending = ref(false)
  /** The cancel was accepted and the answer has not ended yet: Stop stays busy, a second press sends nothing. */
  const stopping = ref(false)
  const failure = ref('')
  const stoppable = computed(() => options.cancel() !== undefined && answering(options.messages()))
  let pressed = false
  let endedAt = Number.NEGATIVE_INFINITY

  // The answer ended. Runs before the DOM turns Stop into Send, which a blank draft disables: focus on
  // the button, or lost since Stop was pressed, goes to the composer instead of the page.
  watch(stoppable, answers => {
    if (answers) return
    endedAt = performance.now()
    stopping.value = false
    const active = document.activeElement
    const onButton = active instanceof HTMLButtonElement && form.value?.contains(active) === true
    if ((onButton && draft.value.trim() === '') || (pressed && (active === null || active === document.body))) field.value?.focus()
    pressed = false
  })

  /** Runs a send or a cancel; a refusal shows in the failure line, `fields.text` first. */
  async function run(call: () => Promise<unknown>): Promise<boolean> {
    pending.value = true
    failure.value = ''
    try {
      await call()
      return true
    } catch (error) {
      const fields = (error as { fields?: Record<string, string> }).fields
      failure.value = fields?.['text'] ?? (error instanceof Error ? error.message : String(error))
      return false
    } finally {
      pending.value = false
    }
  }

  async function submit() {
    const text = draft.value.trim()
    if (text === '' || pending.value || stoppable.value) return
    options.sending()
    if (await run(() => options.connection().call(options.send(), {}, { text, mode: options.mode() }))) draft.value = ''
  }

  async function cancelAnswer() {
    const cancel = options.cancel()
    if (!cancel || pending.value || stopping.value) return
    const accepted = await run(() => options.connection().call(cancel, {}, undefined))
    stopping.value = accepted && stoppable.value // the ending push may have come first
  }

  /** The button: Stop while the agent answers, else Send, which a press within switchGuard of the end does not submit. */
  function onAction(event: MouseEvent) {
    if (stoppable.value) {
      pressed = true
      void cancelAnswer()
    } else if (performance.now() - endedAt < switchGuard) event.preventDefault()
  }

  function onKey(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
    event.preventDefault()
    void submit()
  }

  return { form, field, draft, pending, stopping, failure, stoppable, submit, onAction, onKey }
}
