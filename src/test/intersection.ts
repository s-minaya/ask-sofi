// jsdom no implementa IntersectionObserver. Este doble deja decidir desde el test
// qué elementos están en pantalla y avisa a quien los observa, como el navegador.
type Callback = (entries: IntersectionObserverEntry[]) => void

type Observation = { callback: Callback; options?: IntersectionObserverInit }

const observed = new Map<Element, Set<Observation>>()
const ratios = new WeakMap<Element, number>()

class FakeIntersectionObserver {
  private readonly observation: Observation
  private readonly targets = new Set<Element>()
  constructor(callback: Callback, options?: IntersectionObserverInit) {
    this.observation = { callback, options }
  }
  observe(target: Element) {
    this.targets.add(target)
    if (!observed.has(target)) observed.set(target, new Set())
    observed.get(target)?.add(this.observation)
    // Como el navegador: la primera notificación llega al empezar a observar.
    this.observation.callback([entry(target, ratios.get(target) ?? 0)])
  }
  unobserve(target: Element) {
    this.targets.delete(target)
    observed.get(target)?.delete(this.observation)
  }
  disconnect() {
    for (const target of this.targets)
      observed.get(target)?.delete(this.observation)
    this.targets.clear()
  }
  takeRecords() {
    return []
  }
}

const entry = (target: Element, ratio: number) =>
  ({
    target,
    intersectionRatio: ratio,
    isIntersecting: ratio > 0,
  }) as IntersectionObserverEntry

// Opciones con las que se observa un elemento (el test comprueba su margen).
export function observerOptions(target: Element): IntersectionObserverInit[] {
  return [...(observed.get(target) ?? [])].flatMap((item) =>
    item.options ? [item.options] : [],
  )
}

// Fija qué parte del elemento está en pantalla (0 a 1) y avisa a sus observadores.
export function setIntersection(target: Element, ratio: number): void {
  ratios.set(target, ratio)
  for (const item of observed.get(target) ?? [])
    item.callback([entry(target, ratio)])
}

// Varias notificaciones en una sola entrega, como hace el navegador si la página
// se mueve entre dos fotogramas: la última es la vigente, las anteriores, viejas.
export function setIntersections(target: Element, batch: number[]): void {
  ratios.set(target, batch[batch.length - 1])
  for (const item of observed.get(target) ?? [])
    item.callback(batch.map((ratio) => entry(target, ratio)))
}

export function installIntersectionObserver(): void {
  window.IntersectionObserver =
    FakeIntersectionObserver as unknown as typeof IntersectionObserver
}

export function uninstallIntersectionObserver(): void {
  delete (window as { IntersectionObserver?: unknown }).IntersectionObserver
}
