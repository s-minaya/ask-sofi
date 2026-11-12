import type { Ambient, GagId } from '../components/sofi/visual/ambient'

export type AmbientEvent =
  | { kind: 'activate'; gag: GagId; accepted: boolean }
  | { kind: 'deactivate'; gag: GagId }
  | { kind: 'pause'; gag: GagId }
  | { kind: 'resume'; gag: GagId }
  | { kind: 'unregister'; gag: GagId }

// Envuelve un `ambient` real para que el Lab vea qué ocurre: quién se activa, a quién rechaza y
// qué pausas y reanudaciones llegan a cada controlador. Solo reenvía: las reglas (un solo gag
// activo, agregación de causas) siguen siendo las de `ambient`.
export function observeAmbient(
  ambient: Ambient,
  onEvent: (event: AmbientEvent) => void,
): Ambient {
  return {
    setCause: (cause, active) => ambient.setCause(cause, active),
    register: (gag, target) => {
      const unregister = ambient.register(gag, {
        pause: () => {
          onEvent({ kind: 'pause', gag })
          target.pause()
        },
        resume: () => {
          onEvent({ kind: 'resume', gag })
          target.resume()
        },
        // Solo reenvía: sin él, `ambient` no podría devolver a su reposo a este gag.
        ...(target.reset && { reset: () => target.reset?.() }),
      })
      // Al darlo de baja (movimiento reducido, gag desmarcado, desmontaje), `ambient` libera al
      // gag activo sin pasar por `deactivate`: se avisa para que el Lab no siga mostrándolo.
      return () => {
        unregister()
        onEvent({ kind: 'unregister', gag })
      }
    },
    activate: (gag) => {
      const accepted = ambient.activate(gag)
      onEvent({ kind: 'activate', gag, accepted })
      return accepted
    },
    deactivate: (gag) => {
      ambient.deactivate(gag)
      onEvent({ kind: 'deactivate', gag })
    },
  }
}
