import type {
  Ambient,
  GagId,
  PauseTarget,
} from '../components/sofi/visual/ambient'
import type { SofiMood } from '../features/partner-profile/sofiGuide'
import { STILL_HERE_IDLE_MS } from '../components/sofi/useSofiController'

// Prototipo de T066 (ubicación A del expediente, aprobada en spec §5: los tres gags sobre el
// retrato del cuestionario). El mecanismo de producción es de T088; la versión reducida, aprobada, en plan §6.

export const GAG_IDS: ReadonlyArray<GagId> = [
  'poking',
  'i-see-you',
  'are-u-still-here',
]

export type GagsFrameConfig = {
  gags: Readonly<Record<GagId, boolean>>
  idle: number
  showHit: boolean
}

export const DEFAULT_FRAME_CONFIG: GagsFrameConfig = {
  gags: { poking: true, 'i-see-you': true, 'are-u-still-here': true },
  idle: STILL_HERE_IDLE_MS,
  showHit: false,
}

// Lo que el marco cuenta a la página del Lab, para que se vea por qué los gags viven o no.
export type GagsFrameStatus = {
  frame: string
  mood: SofiMood
  // El retrato es el sprite de `sofi-blink` (y no una imagen estática): único caso en que puede
  // llevar gags.
  sprite: boolean
  // Escena tranquila: Sofi espera la respuesta (`waiting`) y no hay nada más que lo impida.
  calm: boolean
  interaction: boolean
  // Movimiento reducido: los gags no existen (D-1).
  reduced: boolean
  active: GagId | null
}

export type GagsChannelMessage =
  | { type: 'hello' }
  | { type: 'config'; config: GagsFrameConfig }
  | { type: 'status'; status: GagsFrameStatus }

// Composiciones del expediente con las que se prueban los gags: la que empieza con Sofi esperando,
// la que empieza con Sofi hablando (los gags aún no pueden vivir), una reacción y el expediente
// guardado.
export const GAG_SHEET_PRESETS = [
  'waiting',
  'empty',
  'answered',
  'saved',
] as const

export const GAGS_CHANNEL = 'ask-sofi-lab-gags-profile'

// Los gags solo pueden vivir con Sofi esperando la respuesta: formulando la pregunta habla (spec
// §5: no mientras Sofi habla), en una reacción se ve una imagen estática (no hay anfitrión) y al
// confirmar un borrado es un estado sensible.
export function isCalmMood(mood: SofiMood): boolean {
  return mood === 'waiting'
}

// ---- Parámetros de la URL del marco ---------------------------------------------------------

export function configFromParams(params: URLSearchParams): GagsFrameConfig {
  const list = params.get('gags')
  const gags = list
    ? Object.fromEntries(
        GAG_IDS.map((id) => [id, list.split(',').includes(id)]),
      )
    : DEFAULT_FRAME_CONFIG.gags
  const idle = Number(params.get('idle'))
  return {
    gags: gags as GagsFrameConfig['gags'],
    idle:
      Number.isFinite(idle) && idle >= 1000 ? idle : DEFAULT_FRAME_CONFIG.idle,
    showHit: params.get('hit') === '1',
  }
}

export function paramsFromConfig(config: GagsFrameConfig): URLSearchParams {
  const params = new URLSearchParams()
  params.set('gags', GAG_IDS.filter((id) => config.gags[id]).join(',') || '-')
  params.set('idle', String(config.idle))
  if (config.showHit) params.set('hit', '1')
  return params
}

// Los controles de la ficha: lo que puede llevar el foco del teclado o de un toque.
export const CONTROL_SELECTOR =
  'input, textarea, select, button, a[href], [role="radio"], [role="button"]'

// Decisión aprobada (2026-11-09, `008-spec.md` §5): en el expediente los gags quedan suspendidos
// mientras cualquier control tenga el foco. `focused` es el elemento con foco y `within` dice si
// un elemento es de la ficha. Pura: las escuchas viven en `SheetGags`.
export function holdsControlFocus(
  focused: Element | null,
  within: (element: Element) => boolean,
): boolean {
  return (
    focused !== null && within(focused) && focused.matches(CONTROL_SELECTOR)
  )
}

// Avisa de cuándo un control de la ficha gana o pierde el foco (solo ante cambios).
//
// Al pasar el foco de un control a otro (Tab, flechas de un grupo de opciones), el navegador
// reparte `focusout` y `focusin` en la misma tarea, pero con un punto de control de microtareas
// en medio: en ese hueco `activeElement` es el documento, y leerlo ahí reanudaría los gags un
// instante para volver a pausarlos. Por eso, al perder el foco se mira adónde va
// (`relatedTarget`), y solo si no va a ningún sitio (un toque fuera de los controles, el
// tabulador al salir del formulario) se lee el elemento activo, que ya es el documento. Si la
// ventana pierde el foco, el control sigue siendo el elemento activo y los gags siguen
// suspendidos: el navegador lo devuelve al control al volver. Una lectura en la tarea siguiente
// confirma el resultado por si algún motor reparte el foco de otro modo.
export function watchControlFocus(
  doc: Document,
  within: (element: Element) => boolean,
  onChange: (holds: boolean) => void,
): () => void {
  let last: boolean | undefined
  let confirm: ReturnType<typeof setTimeout> | undefined
  const settle = (focused: Element | null) => {
    const next = holdsControlFocus(focused, within)
    if (next === last) return
    last = next
    onChange(next)
  }
  const gained = () => {
    clearTimeout(confirm)
    settle(doc.activeElement)
  }
  const lost = (event: FocusEvent) => {
    clearTimeout(confirm)
    settle(
      event.relatedTarget instanceof Element
        ? event.relatedTarget
        : doc.activeElement,
    )
    confirm = setTimeout(() => settle(doc.activeElement), 0)
  }
  const capture = { capture: true } as const
  doc.addEventListener('focusin', gained, capture)
  doc.addEventListener('focusout', lost, capture)
  settle(doc.activeElement)
  return () => {
    clearTimeout(confirm)
    doc.removeEventListener('focusin', gained, capture)
    doc.removeEventListener('focusout', lost, capture)
  }
}

// Decisión aprobada (2026-11-10, `008-spec.md` §5): al entrar el foco en un control, los gags del
// expediente se cancelan y Sofi vuelve al reposo. Es solo de esta causa: `ambient` sigue sin
// hacer `reset()` por las causas de la escena (las demás, como la página oculta, solo pausan).
// Este envoltorio del Lab recuerda a quién ha registrado el adaptador para poder pedirles su
// `reset()` (el mismo que `ambient` pide al activarse otro gag); no cambia ninguna regla de
// `ambient` y todo lo demás lo reenvía tal cual.
export function trackGagTargets(ambient: Ambient): {
  ambient: Ambient
  resetAll(): void
} {
  const targets = new Map<GagId, PauseTarget>()
  return {
    ambient: {
      setCause: (cause, active) => ambient.setCause(cause, active),
      register: (gag, target) => {
        targets.set(gag, target)
        const unregister = ambient.register(gag, target)
        return () => {
          // Solo si sigue siendo este registro (StrictMode monta, desmonta y vuelve a montar).
          if (targets.get(gag) === target) targets.delete(gag)
          unregister()
        }
      },
      activate: (gag) => ambient.activate(gag),
      deactivate: (gag) => ambient.deactivate(gag),
    },
    resetAll() {
      for (const target of [...targets.values()]) target.reset?.()
    },
  }
}
