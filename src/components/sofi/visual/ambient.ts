// Coordinación de los gags ambientales (catálogo §6.3, «Coordinación de easter eggs»;
// plan 008 §6): `poking`, `i-see-you` y `are-u-still-here` pueden tener varios motivos de
// pausa a la vez. Cada controlador solo recibe `pause()` al pasar de ningún motivo a
// alguno y `resume()` al revés, así que reanudar una causa nunca anula las demás.
// Sin React ni controladores concretos: el adaptador les pasa su `pause`/`resume`.

export type GagId = 'poking' | 'i-see-you' | 'are-u-still-here'

// Motivos de la escena que afectan a todos los gags: Sofi ocupada, escritura o
// interacción con controles, estado sensible y página no visible.
export type SceneCause = 'busy' | 'interaction' | 'sensitive' | 'hidden'

export type PauseTarget = {
  pause(): void
  resume(): void
}

export type Ambient = {
  // Activa o quita un motivo de la escena. Repetir el mismo valor no hace nada.
  setCause(cause: SceneCause, active: boolean): void
  // Conecta un controlador. Si ya hay motivos, nace pausado. Devuelve cómo darlo de baja.
  register(gag: GagId, target: PauseTarget): () => void
  // Un solo gag activo: mientras uno lo está, los demás quedan pausados. Devuelve
  // `false` (sin cambiar nada) si otro gag ya está activo.
  activate(gag: GagId): boolean
  deactivate(gag: GagId): void
}

export function createAmbient(): Ambient {
  const causes = new Set<SceneCause>()
  const entries = new Map<GagId, { target: PauseTarget; paused: boolean }>()
  let active: GagId | undefined

  // `pause()` y `resume()` van siempre sin argumentos: `attachPoking` pierde el motivo
  // al delegar, así que el adaptador no puede depender de él.
  const sync = (gag: GagId) => {
    const entry = entries.get(gag)
    if (!entry) return
    const shouldPause =
      causes.size > 0 || (active !== undefined && active !== gag)
    if (shouldPause === entry.paused) return
    entry.paused = shouldPause
    if (shouldPause) entry.target.pause()
    else entry.target.resume()
  }
  const syncAll = () => {
    for (const gag of entries.keys()) sync(gag)
  }

  return {
    setCause(cause, isActive) {
      if (causes.has(cause) === isActive) return
      if (isActive) causes.add(cause)
      else causes.delete(cause)
      syncAll()
    },
    register(gag, target) {
      const entry = { target, paused: false }
      entries.set(gag, entry)
      sync(gag)
      return () => {
        // Solo si sigue siendo este registro (StrictMode monta, desmonta y vuelve a montar).
        if (entries.get(gag) !== entry) return
        entries.delete(gag)
        if (active === gag) {
          active = undefined
          syncAll()
        }
      }
    },
    activate(gag) {
      if (active !== undefined && active !== gag) return false
      active = gag
      syncAll()
      return true
    },
    deactivate(gag) {
      if (active !== gag) return
      active = undefined
      syncAll()
    },
  }
}
