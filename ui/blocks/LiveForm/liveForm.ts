// useLiveForm: an edit form over one live record (D33). `fields` is the editable copy; a field
// whose value differs from the server value it was last filled with is touched. A push refills
// only untouched fields, a touched field keeps the user's text and shows up in `conflicts` when
// the server changed it meanwhile (a hint, never an overwrite). save() sends only the touched
// fields; the same patch sent again (a retry after a NetworkError) keeps its Idempotency-Key.
// While the form is dirty, leaving the page asks first (useLeaveGuard, D96).
import { computed, onScopeDispose, reactive, ref, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter, type Ref, type ShallowRef } from 'vue'
import { ApiError, prepareCall, type LiveConnection, type LiveTarget, type MutationTarget, type NetworkError, type PreparedCall } from '@/api/runtime'
import { useLive, useLiveConnection } from '@/api/vue'
import { useLeaveGuard } from './leaveGuard'

export interface UseLiveFormOptions<Params extends object, Item, Patch extends object> {
  /** The live read of the record, e.g. `live['customers.item']`. */
  target: LiveTarget<Params, Item>
  /** The parameters of the read and the call, `{ id }` for an item; a ref or getter is followed. */
  params: MaybeRefOrGetter<Params>
  /** The update mutation (a PATCH): its body is the touched fields. */
  call: MutationTarget<Params, Patch, unknown>
  /** The fields the form edits, taken from the record; default every field of it. */
  pick?: ((item: Item) => Patch) | undefined
  /** The connection; default the provided pair's (livePlugin). */
  connection?: MaybeRefOrGetter<LiveConnection> | undefined
  /**
   * Ask before a navigation or an unload drops unsaved edits (useLeaveGuard); default true. A form
   * that saves on change (a switch) passes false: a leave during that save loses nothing.
   */
  leaveGuard?: boolean | undefined
}

export interface LiveFormState<Item, Patch extends object> {
  /** The editable copy: bind the controls to it (`v-model="fields.name"`). */
  fields: Patch
  /** The record as the server has it now. */
  item: Readonly<ShallowRef<Item | undefined>>
  /** No record yet and no read error: show a skeleton. */
  loading: ComputedRef<boolean>
  /** The read's error; retry() subscribes again. */
  error: Readonly<ShallowRef<ApiError | NetworkError | undefined>>
  saving: Readonly<Ref<boolean>>
  /** The save's failure that no field explains (a network error, a refusal without fields). */
  saveError: Readonly<ShallowRef<ApiError | NetworkError | undefined>>
  /** The save's field errors, by the field name the server sent (ApiError.fields). */
  errors: Record<string, string>
  /** The fields the user changed and has not saved. */
  touched: ComputedRef<string[]>
  dirty: ComputedRef<boolean>
  /** Touched fields the server changed since the user started editing them. */
  conflicts: ComputedRef<string[]>
  /** Sends the touched fields; true when saved (or nothing to save). */
  save(): Promise<boolean>
  /** Drops every edit: the fields take the server's values again. */
  reset(): void
  /** The user left the field: its error clears when the value differs from the refused one, once no pointer is down. */
  settle(name: string): void
  retry(): void
}

const json = (value: unknown): string | undefined => JSON.stringify(value)

export function useLiveForm<Params extends object, Item, Patch extends object>(options: UseLiveFormOptions<Params, Item, Patch>): LiveFormState<Item, Patch> {
  const pick = options.pick ?? ((item: Item) => ({ ...item }) as unknown as Patch)
  const connection = useLiveConnection(options.connection)
  const live = useLive(options.target, options.params, { connection })

  const fields = reactive({}) as Patch
  const values = fields as Record<string, unknown>
  /** The server value (as JSON) each field was last filled with; a field that differs is touched. */
  const base = reactive<Record<string, string | undefined>>({})
  const errors = reactive<Record<string, string>>({})
  /** Per refused field the value (as JSON) it held when the refused save was sent; an error is about that value. */
  let refused: Record<string, string | undefined> = {}
  const saving = ref(false)
  const saveError = shallowRef<ApiError | NetworkError>()
  /** The patch on its way or failed, so a retry of the same patch keeps its Idempotency-Key. */
  let prepared: { key: string; call: PreparedCall<Patch> } | undefined

  const server = computed(() => (live.data.value === undefined ? undefined : (pick(live.data.value) as Record<string, unknown>)))
  const touched = computed(() => Object.keys(base).filter((name) => json(values[name]) !== base[name]))
  const conflicts = computed(() => touched.value.filter((name) => server.value !== undefined && json(server.value[name]) !== base[name]))

  function fill(name: string, value: unknown): void {
    values[name] = value === undefined ? undefined : structuredClone(value)
    base[name] = json(value)
  }

  function clearErrors(): void {
    for (const name of Object.keys(errors)) delete errors[name]
    refused = {}
    saveError.value = undefined
  }

  /** Drops the error of a field that no longer holds the value the server refused. */
  function dropStale(name: string): void {
    if (name in errors && json(values[name]) !== refused[name]) delete errors[name]
  }

  // An error line that goes away moves everything under it. A press that took the focus out of
  // the field ends in a click on what was under the pointer at the press, so settle waits until
  // no pointer is down, then one task, after that click (D96).
  const down = new Set<number>()
  const settling = new Set<string>()
  const settleWaiting = (): void => {
    for (const name of settling) dropStale(name)
    settling.clear()
  }
  const press = (event: PointerEvent): void => {
    down.add(event.pointerId)
  }
  const release = (event: PointerEvent): void => {
    down.delete(event.pointerId)
    if (down.size === 0) setTimeout(settleWaiting)
  }
  // A release that never arrives (a context menu takes it, the window loses focus mid-press) would
  // hold the error until the same pointer comes up again: neither ends in a click, so nothing waits.
  const forget = (): void => {
    down.clear()
    setTimeout(settleWaiting)
  }
  window.addEventListener('pointerdown', press, true)
  window.addEventListener('pointerup', release, true)
  window.addEventListener('pointercancel', release, true)
  window.addEventListener('contextmenu', forget, true)
  // Not capturing: the window's own blur only, not every element's.
  window.addEventListener('blur', forget)
  onScopeDispose(() => {
    window.removeEventListener('pointerdown', press, true)
    window.removeEventListener('pointerup', release, true)
    window.removeEventListener('pointercancel', release, true)
    window.removeEventListener('contextmenu', forget, true)
    window.removeEventListener('blur', forget)
  })

  function settle(name: string): void {
    if (!(name in errors)) return
    settling.add(name)
    if (down.size === 0) setTimeout(settleWaiting)
  }

  // A push refills the untouched fields; a touched one keeps the user's text unless the server
  // now agrees with it, which ends the edit. A refilled field's error goes with the refused value.
  watch(server, (next) => {
    if (next === undefined) return
    for (const [name, value] of Object.entries(next)) {
      const mine = json(values[name])
      if (name in base && mine !== base[name] && mine !== json(value)) continue
      fill(name, value)
      settle(name)
    }
  }, { immediate: true })

  // Another record: every field refills from it, nothing of the last one is kept.
  watch(() => json(toValue(options.params)), () => {
    for (const name of Object.keys(base)) delete base[name]
    clearErrors()
    prepared = undefined
  })

  async function save(): Promise<boolean> {
    const names = touched.value
    if (names.length === 0) return true
    const params = toValue(options.params)
    const patch = JSON.parse(json(Object.fromEntries(names.map((name) => [name, values[name]]))) ?? '{}') as Patch
    const sent = patch as Record<string, unknown>
    /** What every untouched field held when the patch went out; a push may change it meanwhile. */
    const held = { ...base }
    const key = JSON.stringify([params, patch])
    prepared = prepared?.key === key ? prepared : { key, call: prepareCall(options.call, patch) }
    const { body, idempotencyKey } = prepared.call
    saving.value = true
    clearErrors()
    try {
      await connection.value.call(options.call, params, body, { idempotencyKey })
      prepared = undefined
      for (const name of names) base[name] = json(sent[name])
      return true
    } catch (failure) {
      const fieldErrors = failure instanceof ApiError ? failure.fields : {}
      Object.assign(errors, fieldErrors)
      const failed = Object.keys(fieldErrors)
      // What was sent, not what the field holds now: the user may have typed on while the call ran.
      // A refused field outside the patch was untouched, so it held its server value; a push
      // that changed it during the call leaves no error about the value that is gone.
      for (const name of failed) refused[name] = name in sent ? json(sent[name]) : held[name]
      for (const name of failed) if (!(name in sent)) dropStale(name)
      // A refusal the form's fields explain shows at those fields only: one failure per screen.
      if (failed.length === 0 || failed.some((name) => !(name in base))) saveError.value = failure as ApiError | NetworkError
      return false
    } finally {
      saving.value = false
    }
  }

  function reset(): void {
    if (server.value !== undefined) for (const [name, value] of Object.entries(server.value)) fill(name, value)
    clearErrors()
    prepared = undefined
  }

  const dirty = computed(() => touched.value.length > 0)
  if (options.leaveGuard !== false) useLeaveGuard(dirty)

  return {
    fields, errors, saving, saveError, touched, dirty, conflicts, save, reset, settle,
    item: live.data,
    loading: live.loading,
    error: live.error,
    retry: live.retry,
  }
}
