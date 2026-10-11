// jsdom no implementa matchMedia. Este doble permite fijar cada media query
// desde los tests y notifica a quien escuche, como haría el navegador.
type Listener = (event: MediaQueryListEvent) => void

const matches = new Map<string, boolean>()
const listeners = new Map<string, Set<Listener>>()

export function setMediaQuery(query: string, value: boolean): void {
  matches.set(query, value)
  for (const listener of listeners.get(query) ?? []) {
    listener({ matches: value, media: query } as MediaQueryListEvent)
  }
}

export function resetMediaQueries(): void {
  matches.clear()
  listeners.clear()
}

export function installMatchMedia(): void {
  window.matchMedia = (query: string) =>
    ({
      get matches() {
        return matches.get(query) ?? false
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: Listener) => {
        if (!listeners.has(query)) listeners.set(query, new Set())
        listeners.get(query)?.add(listener)
      },
      removeEventListener: (_type: string, listener: Listener) => {
        listeners.get(query)?.delete(listener)
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
