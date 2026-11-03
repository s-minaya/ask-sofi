import approved from '../../../assets/sofi/sofi-approved.webp'
import neutral from '../../../assets/sofi/sofi-neutral.webp'
import peek from '../../../assets/sofi/sofi-peek.webp'
import smug from '../../../assets/sofi/sofi-smug.webp'
import surprised from '../../../assets/sofi/sofi-surprised.webp'
import thinking from '../../../assets/sofi/sofi-thinking.webp'
import type { SofiAnimationId } from './types'

// Único registro de recursos visuales de Sofi (spec 008 §2; plan §5.1; 004-plan §6).
// Dice qué recursos existen y cómo se cargan y reproducen; no tiene React, no elige
// cuál se pinta (eso es `select`) y no copia duraciones: la línea de tiempo es solo del
// parcial de cada ZIP, que sigue siendo la única fuente.

// Estáticas aprobadas (tech-stack §46.1): alternativas, no animaciones numeradas.
// Es el único sitio con sus rutas.
export const SOFI_STATICS = {
  'sofi-approved': approved,
  'sofi-neutral': neutral,
  'sofi-peek': peek,
  'sofi-smug': smug,
  'sofi-surprised': surprised,
  'sofi-thinking': thinking,
} as const
export type SofiStaticId = keyof typeof SOFI_STATICS

// Lo que exporta el módulo dueño de un recurso (`components/sofi/sprites/<id>.ts`).
export type SofiOwnerModule = {
  className: string
  strips: Readonly<Record<string, string>>
}

// Catálogo §3, «Reproducción funcional»: bucle mientras dura su estado, una pasada, o
// una máquina de estados que dirige un controlador.
export type Playback = 'loop' | 'once' | 'machine'

// Por defecto, la pose reducida es la que fija el propio parcial (D-2). Una desviación
// aprobada en el Lab (AV4) solo puede sustituirla por un fotograma existente de un recurso.
export type ReducedPose =
  'partial' | { resource: SofiAnimationId; frame: number }

export type RegistryEntry = {
  playback: Playback
  reducedPose: ReducedPose
  // Tiras que el parcial usa como máscara (`mask-image`): se precargan con
  // `crossOrigin = 'anonymous'`, o se piden dos veces (plan §7, E13).
  maskStrips: readonly string[]
  // El parcial llega exportado con `infinite` y pide `animation-iteration-count: 1` para
  // una sola pasada: quien pinta aplica una clase propia que lo fija.
  singlePassClass?: true
  // Carga diferida del módulo dueño. Ausente en `eureka` y `suspicious`: en producción no
  // se cargan y el bundler no emite sus tiras (E12). El Lab los añade desde su código.
  load?: () => Promise<SofiOwnerModule>
}

const NO_MASKS: readonly string[] = []

export const SOFI_REGISTRY: Record<SofiAnimationId, RegistryEntry> = {
  'sofi-blink': {
    playback: 'loop',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    load: () => import('../sprites/sofi-blink'),
  },
  sofing: {
    playback: 'loop',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    load: () => import('../sprites/sofing'),
  },
  rolling: {
    playback: 'loop',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    load: () => import('../sprites/rolling'),
  },
  talking: {
    playback: 'loop',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    load: () => import('../sprites/talking'),
  },
  favoriting: {
    playback: 'once',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    singlePassClass: true,
    load: () => import('../sprites/favoriting'),
  },
  poking: {
    playback: 'machine',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    load: () => import('../sprites/poking'),
  },
  'are-u-still-here': {
    playback: 'machine',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    load: () => import('../sprites/are-u-still-here'),
  },
  'i-see-you': {
    playback: 'machine',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    load: () => import('../sprites/i-see-you'),
  },
  'needs-context': {
    playback: 'once',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    singlePassClass: true,
    load: () => import('../sprites/needs-context'),
  },
  error: {
    playback: 'once',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    singlePassClass: true,
    load: () => import('../sprites/error'),
  },
  // Solo desde el Design Lab, hasta que 006 respalde sus reglas: sin cargador.
  eureka: { playback: 'once', reducedPose: 'partial', maskStrips: NO_MASKS },
  suspicious: {
    playback: 'once',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
  },
  uncertain: {
    playback: 'once',
    reducedPose: 'partial',
    maskStrips: NO_MASKS,
    load: () => import('../sprites/uncertain'),
  },
  'memory-wipe': {
    playback: 'once',
    // La que fija el catálogo (ficha 015): la pose aterrorizada con su cartel, que es la del parcial.
    reducedPose: 'partial',
    maskStrips: ['memory-wipe-dissolve.webp'],
    load: () => import('../sprites/memory-wipe'),
  },
}
