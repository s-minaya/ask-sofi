export type DebouncedWriter<T> = {
  schedule(value: T): void
  // Guarda ya lo pendiente (p. ej. al cerrar la pestaña o salir de la pantalla).
  flush(): void
  cancel(): void
}

// Evita escribir en el almacenamiento en cada pulsación: el almacenamiento es
// síncrono y bloquea el hilo principal mientras se escribe.
export function createDebouncedWriter<T>(
  save: (value: T) => void,
  delayMs: number,
): DebouncedWriter<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: { value: T } | null = null

  const cancel = () => {
    clearTimeout(timer)
    timer = undefined
    pending = null
  }

  const flush = () => {
    clearTimeout(timer)
    timer = undefined
    if (!pending) return
    const { value } = pending
    pending = null
    save(value)
  }

  return {
    schedule(value) {
      pending = { value }
      clearTimeout(timer)
      timer = setTimeout(flush, delayMs)
    },
    flush,
    cancel,
  }
}
