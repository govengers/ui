// The ResizeObserver of the mounted harness (setup.ts installs it; jsdom has none and lays nothing
// out). It never reports by itself: a test plays the browser's notice after a layout with `report()`.
export class TestResizeObserver {
  /** The observer made last, for the test that drives it. */
  static last: TestResizeObserver | undefined
  disconnected = false
  readonly #callback: () => void
  readonly #observed = new Set<Element>()
  constructor(callback: () => void) {
    this.#callback = callback
    TestResizeObserver.last = this
  }
  observe(element: Element): void {
    this.#observed.add(element)
  }
  unobserve(element: Element): void {
    this.#observed.delete(element)
  }
  disconnect(): void {
    this.disconnected = true
    this.#observed.clear()
  }
  /** The browser's notice after an observed box changed size; nothing when nothing is observed. */
  report(): void {
    if (this.#observed.size > 0) this.#callback()
  }
}
