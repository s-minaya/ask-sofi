import type { SpeechStatus } from '../components/sofi/SofiSpeech/speechTimeline'

// T070 · alternativas de las pausas de `talking` y del paso `blink → talking` (catálogo, ficha 004;
// spec 008 §2). Prototipo del Lab: conserva las tres para comparar, con la aprobada por defecto
// (AV5, plan §11.8); producción la implementa en T083–T085. Solo decide qué recurso se ve y si se
// detiene: los fotogramas los pinta cada parcial, sin duraciones copiadas.

// Lo que se ve cuando Sofi calla a mitad de texto:
// - `blink`: vuelta a `sofi-blink` (lo que hoy hace 4.3, provisional);
// - `freeze`: la boca quieta sobre el mismo sprite, congelado donde esté;
// - `closed`: la boca quieta sobre el mismo sprite, cerrada (el inicio de su línea de tiempo,
//   ojos abiertos y boca cerrada) y, al volver a hablar, sigue donde iba.
export type PausePolicy = 'blink' | 'freeze' | 'closed'

// Al terminar la intervención: vuelta a `sofi-blink` (spec §2). `pause` solo está para comparar.
export type EndPolicy = 'pause' | 'blink'

// Al empezar a hablar desde `sofi-blink`: cambiar en el acto o esperar a que termine el parpadeo
// en curso, con los ojos abiertos (el texto no espera nunca: solo el sprite).
export type StartPolicy = 'cut' | 'eyes-open'

// La combinación aprobada por la autora el 2026-11-16 (spec §2; plan §11.8).
export const APPROVED_TALKING = {
  pause: 'freeze',
  end: 'blink',
  start: 'eyes-open',
} as const satisfies { pause: PausePolicy; end: EndPolicy; start: StartPolicy }

export const PAUSE_OPTIONS: { value: PausePolicy; label: string }[] = [
  { value: 'blink', label: 'Vuelta a blink' },
  { value: 'freeze', label: 'Boca quieta · congelada' },
  { value: 'closed', label: 'Boca quieta · cerrada' },
]

export const END_OPTIONS: { value: EndPolicy; label: string }[] = [
  { value: 'pause', label: 'Como en la pausa' },
  { value: 'blink', label: 'Vuelta a blink' },
]

export const START_OPTIONS: { value: StartPolicy; label: string }[] = [
  { value: 'cut', label: 'En el acto' },
  { value: 'eyes-open', label: 'Con los ojos abiertos' },
]

export type SpeechPhase = 'before' | 'speaking' | 'pause' | 'done'

// La fase sale de lo que ya expone `SofiSpeech`: su estado y `speaking` (D-12).
export function phaseOf(status: SpeechStatus, speaking: boolean): SpeechPhase {
  if (speaking) return 'speaking'
  if (status === 'idle') return 'before'
  if (status === 'done') return 'done'
  return 'pause'
}

// `none`: en marcha; `freeze`: detenido donde esté; `closed`: detenido con la boca cerrada.
export type Hold = 'none' | 'freeze' | 'closed'

export type TalkingView = {
  animation: 'sofi-blink' | 'talking'
  hold: Hold
}

const BLINK: TalkingView = { animation: 'sofi-blink', hold: 'none' }

export function talkingView(
  phase: SpeechPhase,
  { pause, end }: { pause: PausePolicy; end: EndPolicy },
): TalkingView {
  if (phase === 'before') return BLINK
  if (phase === 'speaking') return { animation: 'talking', hold: 'none' }
  if (phase === 'done' && end === 'blink') return BLINK
  if (pause === 'blink') return BLINK
  return { animation: 'talking', hold: pause }
}

// Lo visible en un instante: fotograma de los ojos (la tira del cuerpo, 0 abiertos · 1
// entrecerrados · 2 cerrados en los dos parciales) y de la boca (la capa de `talking`; `sofi-blink`
// la tiene cerrada). `null`: no se pudo leer.
export type Visible = { eyes: number | null; mouth: number | null }

export type Jump = { eyes: boolean | null; mouth: boolean | null }

export function jumpBetween(before: Visible, after: Visible): Jump {
  const differs = (a: number | null, b: number | null) =>
    a === null || b === null ? null : a !== b
  return {
    eyes: differs(before.eyes, after.eyes),
    mouth: differs(before.mouth, after.mouth),
  }
}
