// The contract between Field and the control inside it (D44): Field provides the id and the
// describedby ids, the control injects them. One inject line per control, no prop plumbing.
import { inject, type InjectionKey, type Ref } from 'vue'

export interface FieldContext {
  id: string
  describedBy: Ref<string | undefined>
  invalid: Ref<boolean>
  required: Ref<boolean>
}

export const fieldKey: InjectionKey<FieldContext> = Symbol('ui field')

let counter = 0
export function fieldId(): string {
  counter += 1
  return `ui-field-${counter}`
}

/** The surrounding Field, or nothing when the control stands alone. */
export function useField(): FieldContext | null {
  return inject(fieldKey, null)
}
