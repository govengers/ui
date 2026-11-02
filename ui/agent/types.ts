// The agent surface of an application (D23, D24): what a page is for, what it can do, and the
// steps the visual driver executes. Declared statically next to the pages, bound at runtime.

/** One thing a page can do; `name` equals the livewire call name so chat, driver and server share it. */
export interface AgentAction {
  name: string
  /** One sentence for the model: what happens and when to use it. */
  description: string
  /** Parameter names to a one-line description; the form fields carry the same `name`s. */
  params?: Record<string, string>
  /** The page that offers it, `<area>.<page>`. */
  page: string
  /** True when it changes data: drive mode pauses on its submit (D27). */
  mutating?: boolean
}

/** What a page is for, from the route's meta. */
export interface AgentPage {
  page: string
  title: string
  intent: string
  /** Route path with params, for `navigate`. */
  path: string
  params?: Record<string, string>
}

export interface AppMap {
  generatedAt: string
  pages: AgentPage[]
  actions: AgentAction[]
}

/** A target on screen: by action name, by field name, or by page. */
export type DriveTarget =
  | { action: string }
  | { field: string }
  | { page: string }
  | { selector: string }

/** One step of a guide or drive plan (D25, D28). */
export type DriveStep =
  | { kind: 'navigate'; path: string; say?: string }
  | { kind: 'spotlight'; target: DriveTarget; say: string }
  | { kind: 'click'; target: DriveTarget; say?: string }
  | { kind: 'fill'; target: DriveTarget; value: string; say?: string }
  | { kind: 'pause'; target: DriveTarget; say: string }

export interface DrivePlan {
  goal: string
  steps: DriveStep[]
}

export function selectorOf(target: DriveTarget): string {
  if ('action' in target) return `[data-action="${target.action}"]`
  if ('field' in target) return `[name="${target.field}"]`
  if ('page' in target) return `[data-page="${target.page}"]`
  return target.selector
}
