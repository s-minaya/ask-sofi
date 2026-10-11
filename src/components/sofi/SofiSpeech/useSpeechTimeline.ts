import { useEffect, useRef, useState } from 'react'
import {
  charKind,
  completeStep,
  delayAfter,
  INITIAL_STEP,
  nextStep,
  type SpeechStep,
  type SpeechTiming,
} from './speechTimeline'

type SpeechTimelineOptions = {
  text: string
  timing: SpeechTiming
  // Movimiento reducido o «Ver todo»: el texto se muestra completo.
  skip: boolean
  onStep?: (step: SpeechStep) => void
  onVoice?: (speaking: boolean) => void
}

// Programa la escritura con temporizadores y la cancela al desmontar o al cambiar de texto.
// Solo este componente se vuelve a pintar con cada letra.
export function useSpeechTimeline({
  text,
  timing,
  skip,
  onStep,
  onVoice,
}: SpeechTimelineOptions): SpeechStep {
  const [step, setStep] = useState<SpeechStep>(INITIAL_STEP)
  // Los ajustes de Motion & Sound se leen en cada paso sin reiniciar la escritura.
  const latest = useRef({ timing, onStep, onVoice })

  useEffect(() => {
    latest.current = { timing, onStep, onVoice }
  })

  useEffect(() => {
    if (skip) {
      latest.current.onStep?.(completeStep(text))
      return
    }
    let current = INITIAL_STEP
    let timer = window.setTimeout(tick, latest.current.timing.startDelay)

    function tick() {
      const next = nextStep(text, current)
      if (next.speaking !== current.speaking)
        latest.current.onVoice?.(next.speaking)
      current = next
      setStep(next)
      latest.current.onStep?.(next)
      if (next.status !== 'done') {
        const kind = charKind(text.charAt(next.index - 1))
        timer = window.setTimeout(tick, delayAfter(kind, latest.current.timing))
      }
    }

    return () => {
      window.clearTimeout(timer)
      if (current.speaking) latest.current.onVoice?.(false)
    }
  }, [text, skip])

  return skip ? completeStep(text) : step
}
