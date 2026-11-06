import { useEffect, useEffectEvent, useReducer, useRef, useState } from 'react'
import { SiteHeader } from '../../components/layout/SiteHeader/SiteHeader'
import { PROVISIONAL_SLOW_THRESHOLD_MS } from '../../components/sofi/ProcessingState/ProcessingState'
import type { SofiVisualProps } from '../../components/sofi/types'
import type { PresentationKind } from '../../components/sofi/visual/presentationGate'
import {
  clearSessionRates,
  setSessionRate,
} from '../../components/sofi/visual/rates'
import {
  selectVisual,
  type SofiState,
} from '../../components/sofi/visual/select'
import type { SofiAnimationId } from '../../components/sofi/visual/types'
import type { SoundChoiceValue } from '../../components/ui/SoundChoice/SoundChoice'
import { SkipLink } from '../../components/ui/SkipLink/SkipLink'
import { ConsultationScreen } from '../../features/consultation/screens/ConsultationScreen'
import {
  ErrorScreen,
  NeedsContextScreen,
  ProcessingScreen,
  ReadingScreen,
} from '../../features/consultation/screens/ResultScreens'
import { Landing } from '../../features/landing/Landing'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useSound } from '../../hooks/useSound'
import { initialFlowState, previewReducer } from './previewFlowReducer'
import { readPreviewMessage, sendPreviewMessage } from './previewProtocol'
import styles from './PreviewFlow.module.scss'
import {
  DEFAULT_TUNING,
  mergeTuning,
  NEEDS,
  READING,
  SCENARIO_LABELS,
  screenFor,
  SIMULATED_SUBMIT_MS,
  uiStateFor,
  type GateStatus,
  type Scenario,
  type ScreenKey,
} from './scenarios'
import { useResultGate } from './useResultGate'

const HEADER_COPY = {
  consultation: { tag: 'En directo', kicker: 'El consultorio de Sofi' },
  processing: { tag: 'En directo', kicker: 'Sofi está leyendo' },
  result: { tag: 'Exclusiva', kicker: 'Consulta del 9 de octubre' },
} as const

const MAIN_ID = 'demo-contenido'

// Qué clase de resultado es cada escenario para `presentationGate`. «Carga» no tiene resultado
// que presentar: no termina.
const RESULT_KIND: Partial<Record<Scenario, PresentationKind>> = {
  success: 'interpreted',
  needs: 'needs_context',
  error: 'error',
}

// Las señales que cada pantalla emitiría al contrato visual. Prototipo: no fija el flujo de
// resultados de 007. Sin tono para `interpreted`: lo decide 006, así que la lectura queda en
// reposo o hablando y no se anticipa `eureka` ni `suspicious`.
function signalsFor(
  screen: ScreenKey,
  speaking: boolean,
  settled: SofiAnimationId | undefined,
): SofiState {
  switch (screen) {
    case 'processing':
      return { processing: true }
    case 'success':
      return {
        outcome: { kind: 'interpreted', signals: 1 },
        speaking,
        settled,
      }
    case 'needs':
      return { outcome: { kind: 'needs_context' }, speaking, settled }
    case 'error':
      return { outcome: { kind: 'error' }, settled }
    default:
      return {}
  }
}

// El recorrido completo con los componentes reales, gobernado por estado local y
// fixtures deterministas. Nunca hace peticiones.
export function PreviewFlow({
  initialScenario,
}: {
  initialScenario: Scenario
}) {
  const sound = useSound()
  const [state, dispatch] = useReducer(
    previewReducer,
    initialScenario,
    initialFlowState,
  )
  const headingRef = useRef<HTMLHeadingElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const reducedMotion = useReducedMotion()
  const [tuning, setTuning] = useState(DEFAULT_TUNING)
  // En qué lectura terminó el primer ciclo, qué pasada única terminó y si Sofi habla: lo único que
  // la capa visual necesita, sin repintar por letra (D-12).
  const [cycleRun, setCycleRun] = useState<number | null>(null)
  const [settledAt, setSettledAt] = useState<{
    run: number
    id: SofiAnimationId
  } | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const { scenario, step, message, context, submitting, slow, run, focus } =
    state

  const screen = screenFor(step, scenario)
  const ui = uiStateFor(step, scenario, submitting)
  const gate: GateStatus =
    state.arrivedAt !== null && screen === 'processing'
      ? 'held'
      : (state.gate ?? 'none')

  // Lo que se pinta lo decide `selectVisual`; las pantallas solo reciben el recurso.
  const intent = selectVisual(
    signalsFor(
      screen,
      speaking,
      settledAt?.run === run ? settledAt.id : undefined,
    ),
    { lab: true },
  )
  const visual: SofiVisualProps | undefined =
    intent.kind === 'animation'
      ? {
          animation: intent.id,
          onFirstCycle: () => setCycleRun(run),
          onEnd: () => setSettledAt({ run, id: intent.id }),
        }
      : undefined

  // Al cambiar de pantalla, el foco va a su titular (o a «Leer entre líneas» al cancelar).
  useEffect(() => {
    if (focus.request === 0) return
    window.scrollTo(0, 0)
    const element =
      focus.target === 'submit' ? submitRef.current : headingRef.current
    element?.focus({ preventScroll: true })
  }, [focus])

  // La latencia de la mesa solo cuenta al empezar la espera: cambiarla a mitad no la reinicia.
  const startLatency = useEffectEvent(() => tuning.latencyMs)

  // Latencia simulada: «Carga» no termina y avisa de la espera larga. Al terminar, el resultado
  // *llega*: lo presenta `presentationGate`, que solo decide cuándo se enseña y nunca retrasa la
  // operación.
  useEffect(() => {
    if (screen !== 'processing') return
    const timer =
      scenario === 'loading'
        ? window.setTimeout(
            () => dispatch({ type: 'slow' }),
            PROVISIONAL_SLOW_THRESHOLD_MS,
          )
        : window.setTimeout(
            () => dispatch({ type: 'arrived', at: Date.now() }),
            startLatency(),
          )
    return () => window.clearTimeout(timer)
  }, [screen, scenario, run])

  useResultGate({
    kind: screen === 'processing' ? (RESULT_KIND[scenario] ?? null) : null,
    arrivedAt: state.arrivedAt,
    firstCycleEnded: cycleRun === run,
    limitMs: tuning.limitMs,
    reducedMotion,
    onPresent: (reason) => dispatch({ type: 'present', reason }),
  })

  // La velocidad de `sofing` va por la vía de producción (`visual/rates`) y se limpia al salir.
  useEffect(() => {
    setSessionRate('sofing', tuning.rate)
    return clearSessionRates
  }, [tuning.rate])

  useEffect(() => {
    if (!submitting) return
    const timer = window.setTimeout(
      () => dispatch({ type: 'submitted' }),
      SIMULATED_SUBMIT_MS,
    )
    return () => window.clearTimeout(timer)
  }, [submitting])

  // Órdenes de la mesa de control y estado de vuelta.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = readPreviewMessage(event)
      if (data?.type !== 'ask-sofi:preview-command') return
      if (data.command.kind === 'scenario')
        dispatch({ type: 'scenario', scenario: data.command.scenario })
      if (data.command.kind === 'step')
        dispatch({ type: 'go', step: data.command.step })
      if (data.command.kind === 'tuning') {
        const patch = data.command.tuning
        setTuning((current) => mergeTuning(current, patch))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    sendPreviewMessage(window.parent, {
      type: 'ask-sofi:preview-state',
      state: { scenario, step, ui, gate },
    })
  }, [scenario, step, ui, gate])

  const start = (choice: SoundChoiceValue) => {
    // «Empezar» es el gesto que prepara el audio si se ha elegido sonido; «Sin sonido» lo apaga.
    if (choice === 'on') sound.enable()
    else sound.disable()
    dispatch({ type: 'go', step: 'consultation' })
  }

  const header = step === 'landing' ? null : HEADER_COPY[step]

  return (
    <div className={styles.app}>
      <p className={styles.demo}>
        <span>Demo · datos simulados</span>
        <span>Escenario: {SCENARIO_LABELS[scenario].toLowerCase()}</span>
      </p>
      <SkipLink href={`#${MAIN_ID}`} />
      {screen === 'landing' && (
        <Landing onStart={start} headingRef={headingRef} mainId={MAIN_ID} />
      )}
      {header && (
        <>
          <SiteHeader
            onHome={() => dispatch({ type: 'go', step: 'landing' })}
            tag={header.tag}
            kicker={header.kicker}
            soundEnabled={sound.enabled}
            onToggleSound={sound.toggle}
          />
          <main id={MAIN_ID} tabIndex={-1} className={styles.main}>
            {screen === 'consultation' && (
              <>
                <h1 className={styles.srOnly}>Tu consulta</h1>
                <ConsultationScreen
                  message={message}
                  context={context}
                  onMessageChange={(value) =>
                    dispatch({ type: 'message', value })
                  }
                  onContextChange={(value) =>
                    dispatch({ type: 'context', value })
                  }
                  onSubmit={() => dispatch({ type: 'submit' })}
                  onClear={() => dispatch({ type: 'clear' })}
                  messageError={state.messageError}
                  submitting={submitting}
                  headingRef={headingRef}
                  submitRef={submitRef}
                />
              </>
            )}
            {screen === 'processing' && (
              <ProcessingScreen
                message={message}
                context={context}
                slow={slow}
                onCancel={() =>
                  dispatch({
                    type: 'go',
                    step: 'consultation',
                    focus: 'submit',
                  })
                }
                headingRef={headingRef}
                visual={visual}
              />
            )}
            {screen === 'success' && (
              <ReadingScreen
                message={message}
                reading={READING}
                onAddContext={() =>
                  dispatch({ type: 'go', step: 'consultation' })
                }
                onNewQuery={() => dispatch({ type: 'new-query' })}
                onEdit={() => dispatch({ type: 'go', step: 'consultation' })}
                headingRef={headingRef}
                visual={visual}
                onSpeakingChange={setSpeaking}
              />
            )}
            {screen === 'needs' && (
              <NeedsContextScreen
                speech={NEEDS.speech}
                message={message}
                questions={NEEDS.questions}
                context={context}
                onContextChange={(value) =>
                  dispatch({ type: 'context', value })
                }
                onReread={() => dispatch({ type: 'reread' })}
                contextError={state.contextError}
                headingRef={headingRef}
                visual={visual}
                onSpeakingChange={setSpeaking}
              />
            )}
            {screen === 'error' && (
              <ErrorScreen
                message={message}
                context={context}
                onRetry={() => dispatch({ type: 'go', step: 'processing' })}
                onEdit={() => dispatch({ type: 'go', step: 'consultation' })}
                headingRef={headingRef}
                visual={visual}
              />
            )}
          </main>
        </>
      )}
    </div>
  )
}
