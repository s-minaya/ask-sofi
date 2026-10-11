import { useEffect, useReducer, useRef } from 'react'
import { SiteHeader } from '../../components/layout/SiteHeader/SiteHeader'
import { PROVISIONAL_SLOW_THRESHOLD_MS } from '../../components/sofi/ProcessingState/ProcessingState'
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
import { useSound } from '../../hooks/useSound'
import { initialFlowState, previewReducer } from './previewFlowReducer'
import { readPreviewMessage, sendPreviewMessage } from './previewProtocol'
import styles from './PreviewFlow.module.scss'
import {
  NEEDS,
  READING,
  SCENARIO_LABELS,
  screenFor,
  SIMULATED_LATENCY_MS,
  SIMULATED_SUBMIT_MS,
  uiStateFor,
  type Scenario,
} from './scenarios'

const HEADER_COPY = {
  consultation: { tag: 'En directo', kicker: 'El consultorio de Sofi' },
  processing: { tag: 'En directo', kicker: 'Sofi está leyendo' },
  result: { tag: 'Exclusiva', kicker: 'Consulta del 9 de octubre' },
} as const

const MAIN_ID = 'demo-contenido'

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
  const { scenario, step, message, context, submitting, slow, run, focus } =
    state

  const screen = screenFor(step, scenario)
  const ui = uiStateFor(step, scenario, submitting)

  // Al cambiar de pantalla, el foco va a su titular (o a «Leer entre líneas» al cancelar).
  useEffect(() => {
    if (focus.request === 0) return
    window.scrollTo(0, 0)
    const element =
      focus.target === 'submit' ? submitRef.current : headingRef.current
    element?.focus({ preventScroll: true })
  }, [focus])

  // Latencia simulada: «Carga» no termina y avisa de la espera larga.
  useEffect(() => {
    if (screen !== 'processing') return
    const timer =
      scenario === 'loading'
        ? window.setTimeout(
            () => dispatch({ type: 'slow' }),
            PROVISIONAL_SLOW_THRESHOLD_MS,
          )
        : window.setTimeout(
            () => dispatch({ type: 'go', step: 'result' }),
            SIMULATED_LATENCY_MS,
          )
    return () => window.clearTimeout(timer)
  }, [screen, scenario, run])

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
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    sendPreviewMessage(window.parent, {
      type: 'ask-sofi:preview-state',
      state: { scenario, step, ui },
    })
  }, [scenario, step, ui])

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
              />
            )}
            {screen === 'error' && (
              <ErrorScreen
                message={message}
                context={context}
                onRetry={() => dispatch({ type: 'go', step: 'processing' })}
                onEdit={() => dispatch({ type: 'go', step: 'consultation' })}
                headingRef={headingRef}
              />
            )}
          </main>
        </>
      )}
    </div>
  )
}
