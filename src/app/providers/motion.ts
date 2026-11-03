import type { MotionPreference } from '../../infrastructure/storage/preferencesStorage'

export type { MotionPreference }

const SYSTEM_QUERY = '(prefers-reduced-motion: reduce)'

// Reacción en curso que conserva el modo con el que empezó (`holdMotion`).
type Hold = {
  root: HTMLElement
  reduced: boolean
  // Última preferencia que alguien intentó aplicar mientras duraba: es la vigente al terminar.
  pending?: { attribute: string | undefined }
  release: (current: MotionPreference) => void
}
let hold: Hold | undefined
const holdListeners = new Set<() => void>()
const notifyHold = () => holdListeners.forEach((listener) => listener())

function writeAttribute(root: HTMLElement, attribute: string | undefined) {
  if (attribute === undefined) delete root.dataset.motion
  else root.dataset.motion = attribute
}

// Una elección explícita se escribe en <html>; «Sistema» la quita y deja que
// prefers-reduced-motion decida desde CSS, también en vivo. Un único ámbito por documento.
// Mientras dura una reacción retenida no escribe: la recuerda para aplicarla al terminar.
export function applyMotionPreference(
  preference: MotionPreference,
  root = document.documentElement,
) {
  const attribute = preference === 'system' ? undefined : preference
  if (hold?.root === root) hold.pending = { attribute }
  else writeAttribute(root, attribute)
}

// Devuelve a <html> lo que tenía antes de que un proveedor lo escribiera. No es una
// preferencia: durante una reacción retenida se descarta, porque lo que había puede
// ser justo lo que el borrado acaba de eliminar.
export function restoreMotionAttribute(
  previous: string | undefined,
  root = document.documentElement,
) {
  if (hold?.root !== root) writeAttribute(root, previous)
}

// Estado efectivo (plan 008 §4.1): «full» anima aunque el sistema pida reducir y
// «reduce» reduce aunque no lo pida; «system» sigue al sistema.
export function isReducedMotion(
  preference: MotionPreference,
  systemReduces: boolean,
): boolean {
  if (preference === 'system') return systemReduces
  return preference === 'reduce'
}

// Modo efectivo durante `memory-wipe` (plan 008 §5.2, D-16). El borrado restablece la
// preferencia a `system`, pero la reacción sigue en el modo con el que empezó: se fija
// con el único `data-motion` de <html> (`reduce` o `full`), y `useReducedMotion` lo
// respeta. Quien orquesta el borrado (009) lo llama ANTES de borrar y llama a la función
// devuelta al terminar la confirmación funcional o al interrumpirse la reacción, con la
// preferencia vigente (`readPreferences().motion`). Si mientras tanto alguien aplicó otra
// (`applyMotionPreference`), manda la última. No guarda ni restaura datos.
// Una segunda llamada mientras dura la primera devuelve la misma función.
export function holdMotion(
  root = document.documentElement,
): (current: MotionPreference) => void {
  if (hold) return hold.release
  const attribute = root.dataset.motion
  const systemReduces =
    typeof window.matchMedia === 'function' &&
    window.matchMedia(SYSTEM_QUERY).matches
  const reduced =
    attribute === 'reduce' || (attribute !== 'full' && systemReduces)

  const current: Hold = {
    root,
    reduced,
    release: (preference) => {
      // Repetir el fin no vuelve a escribir.
      if (hold !== current) return
      hold = undefined
      writeAttribute(
        root,
        current.pending
          ? current.pending.attribute
          : preference === 'system'
            ? undefined
            : preference,
      )
      notifyHold()
    },
  }
  hold = current
  writeAttribute(root, reduced ? 'reduce' : 'full')
  notifyHold()
  return current.release
}

// Lo que sigue `useReducedMotion` mientras hay una reacción retenida.
export const heldReducedMotion = (): boolean | undefined => hold?.reduced

export function subscribeToMotionHold(listener: () => void): () => void {
  holdListeners.add(listener)
  return () => holdListeners.delete(listener)
}

// Solo para las pruebas: la reacción retenida es estado del módulo.
export function resetMotionHold() {
  hold = undefined
  notifyHold()
}
