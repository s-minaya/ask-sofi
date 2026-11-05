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

// Tamaño del sprite en el escenario (decisión aprobada): el valor de partida es una marca del
// control y un tamaño de las pantallas de producción (README de dirección artística, §8).
export const SIZE_DEFAULT = 192
export const SIZE_MIN = 64
export const SIZE_MAX = 512
export const SIZE_STEP = 8

export function formatSize(size: number): string {
  return `${size} px`
}

// Fondos del escenario: los tres que ya tiene `LabStage` (el suyo, liso y de puntos). No se
// crean fondos nuevos.
export type StageBackground = 'base' | 'plain' | 'dots'

export const BACKGROUND_DEFAULT: StageBackground = 'dots'

export const BACKGROUND_OPTIONS = [
  { value: 'base', label: 'Base' },
  { value: 'plain', label: 'Liso' },
  { value: 'dots', label: 'Puntos' },
] as const satisfies ReadonlyArray<{ value: StageBackground; label: string }>

export function stageBackground(background: StageBackground): {
  plain: boolean
  dots: boolean
} {
  return { plain: background === 'plain', dots: background === 'dots' }
}

// Contenedores representativos (catálogo §8): el escenario entero y los dos recortes ya
// aprobados con el busto apoyado en el borde. Las medidas son las de producción a 192 px.
export type Container = 'stage' | 'box' | 'badge'

export const CONTAINER_OPTIONS = [
  { value: 'stage', label: 'Escenario entero' },
  { value: 'box', label: 'Busto apoyado' },
  { value: 'badge', label: 'Insignia' },
] as const satisfies ReadonlyArray<{ value: Container; label: string }>

export type ContainerBox = {
  width: number
  height: number
  offsetX: number
  offsetY: number
  background: string
}

// Recuadro de la pantalla de error (decisión 6) e insignia de la consulta (ficha 3.1).
const CROPS_AT_192: Record<Exclude<Container, 'stage'>, ContainerBox> = {
  box: {
    width: 155,
    height: 190,
    offsetX: 20,
    offsetY: 7,
    background: 'var(--tone-white)',
  },
  badge: {
    width: 96,
    height: 96,
    offsetX: 50,
    offsetY: 36,
    background: 'var(--tone-pink-soft)',
  },
}

// Con otro tamaño el recorte escala con el sprite: así se ve la misma composición y se comprueba
// que nada se corta al ampliarla o reducirla.
export function containerBox(
  container: Container,
  size: number,
): ContainerBox | null {
  if (container === 'stage') return null
  const crop = CROPS_AT_192[container]
  const scale = size / SIZE_DEFAULT
  return {
    width: Math.round(crop.width * scale),
    height: Math.round(crop.height * scale),
    offsetX: Math.round(crop.offsetX * scale),
    offsetY: Math.round(crop.offsetY * scale),
    background: crop.background,
  }
}

// Layouts ancho y estrecho: el escenario completo o el ancho del móvil estrecho del Lab.
export type StageWidth = 'full' | 'narrow'

export const WIDTH_OPTIONS = [
  { value: 'full', label: 'Completo' },
  { value: 'narrow', label: 'Estrecho · 320' },
] as const satisfies ReadonlyArray<{ value: StageWidth; label: string }>

export function stageMaxWidth(width: StageWidth): string | undefined {
  return width === 'narrow' ? '320px' : undefined
}
