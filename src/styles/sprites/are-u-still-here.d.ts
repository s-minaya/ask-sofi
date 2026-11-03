// Tipos de are-u-still-here.js («¿Sigues ahí?», 008-are-u-still-here).

export type StillHereState = 'idle' | 'drowsy' | 'nodding' | 'asleep' | 'startled' | 'guilty'

export type StillHereTiming = {
  idleAfter: number
  drowsy: number
  nod: number
  drowsyAgain: number
  nodAgain: number
  startled: number
  guilty: number
}

export type StillHereController = {
  readonly state: StillHereState
  /** Actividad de la usuaria: reinicia la cuenta y, si se estaba durmiendo o dormía, la despierta. */
  wake(): void
  /** Empieza ya a dormirse (solo desde el reposo). */
  sleep(): void
  /** Cancela: reposo al instante, sin susto, y la cuenta vuelve a empezar. */
  reset(): void
  /** Congela los tiempos (no las animaciones CSS); cada motivo se reanuda por separado. */
  pause(reason?: string): void
  resume(reason?: string): void
  /** Velocidad de los tiempos: 1 normal, 0.25 cuatro veces más lento. */
  setRate(rate: number): void
  destroy(): void
}

export type StillHereMachine = StillHereController & {
  /** Tiempo (ms) que la pestaña ha estado oculta: cuenta como inactividad (attachStillHere lo llama solo). */
  away(ms: number): void
}

export type StillHereOptions = {
  timing?: Partial<StillHereTiming>
  onChange?: (state: StillHereState) => void
}

export declare const STATES: readonly StillHereState[]
export declare const TIMING: Readonly<StillHereTiming>
export declare const ACTIVITY: readonly string[]

export declare function createStillHereMachine(options?: StillHereOptions): StillHereMachine

export declare function attachStillHere(
  host: HTMLElement,
  options?: StillHereOptions & {
    /** Dónde se escucha la actividad (toda la página por defecto). */
    target?: EventTarget
  },
): StillHereController
