// Tipos de poking.js («¡Deja de pincharme!», 006-poking).

export type PokingState =
  | 'idle'
  | 'curious'
  | 'skeptical'
  | 'stop'
  | 'offended'
  | 'hide'
  | 'peek'
  | 'nope'
  | 'return'

export type PokingTiming = {
  cooldown: number
  reset: number
  peekAfter: number
  peekFor: number
  nopeFor: number
  returnFor: number
}

export type PokingMachine = {
  readonly state: PokingState
  /** Un pinchazo; devuelve si ha contado. */
  poke(): boolean
  /** Vuelve al reposo y cancela lo pendiente. */
  reset(): void
  /** Congela los tiempos (no las animaciones CSS); cada motivo se reanuda por separado. */
  pause(reason?: string): void
  resume(reason?: string): void
  /** Velocidad de los tiempos: 1 normal, 0.25 cuatro veces más lento. */
  setRate(rate: number): void
  destroy(): void
}

export type PokingOptions = {
  timing?: Partial<PokingTiming>
  onChange?: (state: PokingState) => void
}

export declare const STATES: readonly PokingState[]
export declare const TIMING: Readonly<PokingTiming>

export declare function createPokingMachine(options?: PokingOptions): PokingMachine

export declare function attachPoking(
  host: HTMLElement,
  options?: PokingOptions,
): PokingMachine
