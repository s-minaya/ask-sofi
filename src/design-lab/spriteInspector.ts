import * as eureka from '../components/sofi/sprites/eureka'
import * as suspicious from '../components/sofi/sprites/suspicious'
import { STILL_HERE_IDLE_MS } from '../components/sofi/useSofiController'
import type { GagId } from '../components/sofi/visual/ambient'
import {
  SOFI_REGISTRY,
  type Playback,
} from '../components/sofi/visual/registry'
import type { SofiAnimationId } from '../components/sofi/visual/types'

// Datos del inspector de recursos (catálogo §8). Las fichas resumen el catálogo §3 («Función»
// y «Se activa»), que sigue siendo la fuente; lo que el registro ya sabe (reproducción y
// disponibilidad) no se copia aquí, se lee de él.

export type ResourceInfo = {
  // Número del catálogo §3. El 007 sigue reservado y no se reasigna.
  number: string
  intent: string
  activation: string
}

const SOLO_LAB = 'Solo en el Lab, hasta que 006 respalde sus reglas'

export const RESOURCE_INFO: Record<SofiAnimationId, ResourceInfo> = {
  'sofi-blink': {
    number: '001',
    intent: 'Atención, reposo y espera pasiva',
    activation: 'En reposo, sin otra intención principal',
  },
  sofing: {
    number: '002',
    intent: 'Investigar y teclear frenéticamente',
    activation: 'Solo durante un análisis real en curso',
  },
  rolling: {
    number: '003',
    intent: 'Giro, mareo y recuperación cómicos',
    activation: 'Solo durante una carga real perceptible',
  },
  talking: {
    number: '004',
    intent: 'Hablar mientras se escribe el diálogo',
    activation: 'Mientras SofiSpeech habla (speaking)',
  },
  favoriting: {
    number: '005',
    intent: 'Celebración con gafas y sello «SOFI APPROVED»',
    activation: 'Una vez por cada favorito guardado',
  },
  poking: {
    number: '006',
    intent: 'Responder a pinchazos de ratón o de toque',
    activation: 'En escena tranquila; cada pinchazo la enfada más',
  },
  'are-u-still-here': {
    number: '008',
    intent: 'Somnolencia, sueño y despertar por inactividad',
    // El umbral es el del adaptador (provisional hasta AV6), no un valor copiado.
    activation: `Tras ${STILL_HERE_IDLE_MS / 1000} s de inactividad real (provisional)`,
  },
  'i-see-you': {
    number: '009',
    intent: 'Seguir la mirada o el cursor y «pillar» a la persona',
    activation: 'De forma ocasional, en escena tranquila',
  },
  'needs-context': {
    number: '010',
    intent: 'Pedir una pista más',
    activation: 'Cuando falta contexto (needs_context)',
  },
  error: {
    number: '011',
    intent: 'Glitch o KO cómico ante un fallo ordinario',
    activation: 'Ante un error no sensible',
  },
  eureka: {
    number: '012',
    intent: 'Descubrimiento y apertura de explicación',
    activation: SOLO_LAB,
  },
  suspicious: {
    number: '013',
    intent: 'Curiosidad pícara ante un matiz respaldado',
    activation: SOLO_LAB,
  },
  uncertain: {
    number: '014',
    intent: 'Comprensión e incertidumbre aceptada',
    activation: 'Sin más contexto y en el expediente',
  },
  'memory-wipe': {
    number: '015',
    intent: 'Pánico, desaparición en píxeles y reaparición',
    activation: 'Solo tras el borrado completo efectivo',
  },
}

export const PLAYBACK_NAMES: Record<Playback, string> = {
  loop: 'Bucle',
  once: 'Una pasada',
  machine: 'Máquina de estados',
}

// Velocidad individual (decisión aprobada): factor sobre la línea de tiempo del parcial.
export const RATE_MIN = 0.25
export const RATE_MAX = 4
export const RATE_STEP = 0.25

// `poking` conserva su velocidad original (1×): no se experimenta con ella (spec 008 §8).
const FIXED_RATE: ReadonlySet<SofiAnimationId> = new Set(['poking'])

export function hasSpeedControl(id: SofiAnimationId): boolean {
  return !FIXED_RATE.has(id)
}

export function formatRate(rate: number): string {
  return `${String(rate).replace('.', ',')}×`
}

// Lo que dice el registro de producción, sin duplicarlo.
export function availability(id: SofiAnimationId): string {
  if (id === 'sofi-blink')
    return 'Estática: su módulo viaja siempre en la entrada'
  return SOFI_REGISTRY[id].load
    ? 'Con cargador de producción'
    : 'Solo en el Lab: sin cargador de producción'
}

export function isGag(id: SofiAnimationId): id is GagId {
  return SOFI_REGISTRY[id].playback === 'machine'
}

// `eureka` y `suspicious` no tienen cargador de producción: el bundler emitiría sus tiras (E12).
// Solo el Lab, que no existe en la build pública, se los añade (plan §5.2).
export function provideLabOnlyLoaders(): void {
  SOFI_REGISTRY.eureka.load ??= () => Promise.resolve(eureka)
  SOFI_REGISTRY.suspicious.load ??= () => Promise.resolve(suspicious)
}
