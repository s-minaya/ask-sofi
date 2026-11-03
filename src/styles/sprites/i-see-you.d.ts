// Tipos de i-see-you.js («Te veo», 009-i-see-you).

export type ISeeYouState = 'idle' | 'watching' | 'caught' | 'smirk' | 'tease' | 'giggle'

export type ISeeYouGaze = 'center' | 'left' | 'right' | 'up' | 'down'

export type ISeeYouTiming = {
  react: number
  rest: number
  dwell: number
  play: number
  plays: number
  caught: number
  smirk: number
  tease: number
  giggle: number
  after: number
  cooldown: number
}

/** Punto entre los ojos (fracción del sprite) y radio, en anchos de sprite, dentro del cual mira al frente. */
export type ISeeYouFace = {
  x: number
  y: number
  radius: number
}

export type ISeeYouRect = {
  left: number
  top: number
  width: number
  height: number
}

export type ISeeYouController = {
  readonly state: ISeeYouState
  /** La mirada que va a tener: la que espera su retraso o la actual. */
  readonly gaze: ISeeYouGaze
  /** Que la pillen ya, aunque acabe de reaccionar. */
  notice(): void
  /** Cancela: reposo al instante. Si estaba reaccionando, cuenta como reacción acabada. */
  reset(): void
  /** Congela los tiempos (no las animaciones CSS) y deja de mirar; cada motivo se reanuda por separado. */
  pause(reason?: string): void
  resume(reason?: string): void
  /** Velocidad de los tiempos: 1 normal, 0.25 cuatro veces más lento. */
  setRate(rate: number): void
  destroy(): void
}

export type ISeeYouMachine = ISeeYouController & {
  /** El cursor se ha movido y la mirada que le toca es `gaze` (attachISeeYou la calcula con gazeAt). */
  look(gaze: ISeeYouGaze): void
  /** El cursor ha salido de la ventana: reposo enseguida. */
  rest(): void
  /** El cursor entra en Sofi (true) o sale (false). Si se queda encima, la pillan. */
  hover(on: boolean): void
}

export type ISeeYouOptions = {
  timing?: Partial<ISeeYouTiming>
  onChange?: (state: ISeeYouState, gaze: ISeeYouGaze) => void
}

export declare const STATES: readonly ISeeYouState[]
export declare const GAZES: readonly ISeeYouGaze[]
export declare const TIMING: Readonly<ISeeYouTiming>
export declare const FACE: Readonly<ISeeYouFace>

/** Mirada hacia el punto (x, y) de la ventana para un sprite con la caja rect; conserva `current` cerca de los bordes. */
export declare function gazeAt(
  x: number,
  y: number,
  rect: ISeeYouRect,
  current?: ISeeYouGaze | null,
  face?: ISeeYouFace,
): ISeeYouGaze

export declare function createISeeYouMachine(options?: ISeeYouOptions): ISeeYouMachine

export declare function attachISeeYou(
  host: HTMLElement,
  options?: ISeeYouOptions & {
    face?: ISeeYouFace
    /** Dónde se sigue el puntero (toda la página por defecto). */
    target?: EventTarget
  },
): ISeeYouController
