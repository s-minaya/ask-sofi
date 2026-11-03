// Sonda de fugas para pruebas (008, T041 y VT3): cuenta lo que un controlador deja vivo.
// Envuelve `addEventListener`, `setTimeout`, `setInterval` y `requestAnimationFrame` del
// entorno de prueba y sustituye los observadores que jsdom no implementa. No toca producción.
//
// Límites declarados (plan 008 §2): no ve las propiedades `onX` ni las escuchas `once`, y las
// escuchas de React en su contenedor también figuran en la cuenta, por eso se compara siempre
// con una instantánea previa y no con cero.

type Fn = (...args: unknown[]) => unknown

type ListenerRecord = {
  target: EventTarget
  type: string
  listener: unknown
  capture: boolean
}

export type LeakSnapshot = {
  // Una entrada por escucha viva: «destino:tipo», con `(captura)` si procede.
  listeners: string[]
  // Temporizadores (`setTimeout` sin vencer y `setInterval` sin limpiar).
  timers: number
  // Fotogramas pedidos y no ejecutados ni cancelados.
  frames: number
  // Elementos observados, con su tipo de observador.
  observers: string[]
}

export type LeakProbe = {
  snapshot(): LeakSnapshot
  uninstall(): void
}

const describe = (target: EventTarget): string => {
  if (target === window) return 'window'
  if (target === document) return 'document'
  return target instanceof Element ? target.tagName.toLowerCase() : 'otro'
}

// Solo cuentan los destinos del código bajo prueba. El motor de selectores de jsdom registra
// sus propias escuchas en un objeto `Window` interno la primera vez que se llama a
// `querySelector`, y no son de nadie que se pueda limpiar.
const isTracked = (target: EventTarget): boolean => describe(target) !== 'otro'

const captureOf = (options: unknown): boolean =>
  typeof options === 'boolean'
    ? options
    : Boolean((options as AddEventListenerOptions | undefined)?.capture)

// Debe instalarse después de `vi.useFakeTimers()` si la prueba los usa, y desinstalarse antes
// de `vi.useRealTimers()`: envuelve lo que haya en ese momento.
export function installLeakProbe(): LeakProbe {
  const restores: Array<() => void> = []
  const override = <T extends object, K extends keyof T>(
    owner: T,
    key: K,
    replacement: T[K],
  ) => {
    const had = Object.prototype.hasOwnProperty.call(owner, key)
    const original = owner[key]
    owner[key] = replacement
    restores.push(() => {
      if (had) owner[key] = original
      else delete owner[key]
    })
    return original
  }

  // --- Escuchas ---
  const listeners: ListenerRecord[] = []
  const find = (target: EventTarget, type: string, l: unknown, c: boolean) =>
    listeners.findIndex(
      (r) =>
        r.target === target &&
        r.type === type &&
        r.listener === l &&
        r.capture === c,
    )
  // `window` es el global del entorno y sus métodos no heredan los de `EventTarget`.
  for (const owner of [EventTarget.prototype, window] as EventTarget[]) {
    const add = owner.addEventListener
    const remove = owner.removeEventListener
    override(
      owner,
      'addEventListener',
      function (
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
      ) {
        const capture = captureOf(options)
        // El DOM ignora el duplicado exacto: la sonda también.
        if (
          listener &&
          isTracked(this) &&
          find(this, type, listener, capture) < 0
        )
          listeners.push({ target: this, type, listener, capture })
        return add.call(this, type, listener, options)
      },
    )
    override(
      owner,
      'removeEventListener',
      function (
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions,
      ) {
        const index = find(this, type, listener, captureOf(options))
        if (index >= 0) listeners.splice(index, 1)
        return remove.call(this, type, listener, options)
      },
    )
  }

  // --- Temporizadores y fotogramas ---
  const timers = new Set<unknown>()
  const frames = new Set<unknown>()
  const g = globalThis as unknown as Record<string, Fn>
  const wrapScheduler = (
    set: Set<unknown>,
    schedule: string,
    cancel: string,
    repeats: boolean,
  ) => {
    const originalSchedule = g[schedule]
    const originalCancel = g[cancel]
    override(g, schedule, ((callback: Fn, ...rest: unknown[]) => {
      const handle: unknown = originalSchedule(
        ((...args: unknown[]) => {
          if (!repeats) set.delete(handle)
          return callback(...args)
        }) as Fn,
        ...rest,
      )
      set.add(handle)
      return handle
    }) as Fn)
    override(g, cancel, ((handle: unknown) => {
      set.delete(handle)
      return originalCancel(handle)
    }) as Fn)
  }
  wrapScheduler(timers, 'setTimeout', 'clearTimeout', false)
  wrapScheduler(timers, 'setInterval', 'clearInterval', true)
  if (typeof g.requestAnimationFrame === 'function')
    wrapScheduler(
      frames,
      'requestAnimationFrame',
      'cancelAnimationFrame',
      false,
    )

  // --- Observadores ---
  // El elemento nace visible: es lo que el navegador acaba notificando y no pausa al gag por
  // estar «fuera de pantalla».
  const observed: Array<{ kind: string; target: Element }> = []
  const observer = (kind: string, notify: boolean) =>
    class {
      private readonly targets = new Set<Element>()
      private readonly callback: Fn
      constructor(callback: Fn) {
        this.callback = callback
      }
      observe(target: Element) {
        this.targets.add(target)
        observed.push({ kind: `${kind}:${describe(target)}`, target })
        if (notify)
          this.callback([
            { target, isIntersecting: true, intersectionRatio: 1 },
          ] as never)
      }
      unobserve(target: Element) {
        this.targets.delete(target)
        this.drop(target)
      }
      disconnect() {
        for (const target of this.targets) this.drop(target)
        this.targets.clear()
      }
      takeRecords() {
        return []
      }
      private drop(target: Element) {
        const index = observed.findIndex(
          (item) => item.target === target && item.kind.startsWith(kind),
        )
        if (index >= 0) observed.splice(index, 1)
      }
    }
  const w = window as unknown as Record<string, unknown>
  override(w, 'IntersectionObserver', observer('IntersectionObserver', true))
  override(w, 'ResizeObserver', observer('ResizeObserver', false))

  return {
    snapshot: () => ({
      listeners: listeners
        .map(
          (r) =>
            `${describe(r.target)}:${r.type}${r.capture ? '(captura)' : ''}`,
        )
        .sort(),
      timers: timers.size,
      frames: frames.size,
      observers: observed.map((item) => item.kind).sort(),
    }),
    uninstall: () => {
      while (restores.length) restores.pop()?.()
    },
  }
}
