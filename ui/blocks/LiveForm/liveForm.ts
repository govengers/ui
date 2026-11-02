// useLiveForm: an edit form over one live record (D33). `fields` is the editable copy; a field
// whose value differs from the server value it was last filled with is touched. A push refills
// only untouched fields, a touched field keeps the user's text and shows up in `conflicts` when
// the server changed it meanwhile (a hint, never an overwrite). save() sends only the touched
// fields; the same patch sent again (a retry after a NetworkError) keeps its Idempotency-Key.
import { computed, reactive, ref, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter, type Ref, type ShallowRef } from 'vue'
import { ApiError, prepareCall, type LiveConnection, type LiveTarget, type MutationTarget, type NetworkError, type PreparedCall } from '@/api/runtime'
import { useLive, useLiveConnection } from '@/api/vue'

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
    saveError.value = undefined
  }

  // A push refills the untouched fields; a touched one keeps the user's text unless the server
  // now agrees with it, which ends the edit.
  watch(server, (next) => {
    if (next === undefined) return
    for (const [name, value] of Object.entries(next)) {
      const mine = json(values[name])
      if (name in base && mine !== base[name] && mine !== json(value)) continue
      fill(name, value)
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
    const key = JSON.stringify([params, patch])
    prepared = prepared?.key === key ? prepared : { key, call: prepareCall(options.call, patch) }
    const { body, idempotencyKey } = prepared.call
    saving.value = true
    clearErrors()
    try {
      await connection.value.call(options.call, params, body, { idempotencyKey })
      prepared = undefined
      for (const name of names) base[name] = json((patch as Record<string, unknown>)[name])
      return true
    } catch (failure) {
      const fieldErrors = failure instanceof ApiError ? failure.fields : {}
      Object.assign(errors, fieldErrors)
      // A refusal the form's fields explain shows at those fields only: one failure per screen.
      const refused = Object.keys(fieldErrors)
      if (refused.length === 0 || refused.some((name) => !(name in base))) saveError.value = failure as ApiError | NetworkError
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

  return {
    fields, errors, saving, saveError, touched, conflicts, save, reset,
    item: live.data,
    loading: live.loading,
    error: live.error,
    dirty: computed(() => touched.value.length > 0),
    retry: live.retry,
  }
}
