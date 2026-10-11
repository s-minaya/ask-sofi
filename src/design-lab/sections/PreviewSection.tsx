import { useEffect, useId, useRef, useState } from 'react'
import type { MotionPreference } from '../../app/providers/MotionPreference'
import { OptionPill } from '../../components/ui/OptionGroup/OptionGroup'
import { SegmentedControl } from '../../components/ui/SegmentedControl/SegmentedControl'
import { KickerRow, Tag } from '../../components/ui/Tag/Tag'
import { cx } from '../../utils/cx'
import { LabCheck, LabCode, LabProv } from '../parts/LabParts'
import {
  readPreviewMessage,
  sendPreviewMessage,
  type PreviewCommand,
  type PreviewState,
} from '../preview/previewProtocol'
import {
  RESULT_LABELS,
  SCENARIO_LABELS,
  SCENARIOS,
  SCREEN_COMPONENTS,
  SCREEN_PROVISIONAL,
  screenFor,
  STATE_NOTES,
  UI_STATES,
  type Step,
} from '../preview/scenarios'
import styles from './PreviewSection.module.scss'

// Vistas de QA responsive: categorías de tech-stack.md, con tamaños representativos.
const SIZES = [
  { key: 'narrow', label: 'Móvil estrecho', width: 320, height: 640 },
  { key: 'mobile', label: 'Móvil', width: 390, height: 844 },
  { key: 'landscape', label: 'Móvil horizontal', width: 844, height: 390 },
  { key: 'tablet', label: 'Tablet', width: 820, height: 1180 },
  { key: 'laptop', label: 'Portátil', width: 1280, height: 800 },
  { key: 'desktop', label: 'Escritorio', width: 1440, height: 900 },
  { key: 'large', label: 'Grande', width: 1920, height: 1080 },
] as const

type SizeKey = (typeof SIZES)[number]['key']

const STEP_LABELS: Record<Step, [string, string]> = {
  landing: ['01', 'Portada'],
  consultation: ['02', 'Consulta'],
  processing: ['03', 'Procesando'],
  result: ['04', 'Resultado'],
}

const FALLBACK_STAGE_WIDTH = 1240
const MAX_FRAME_HEIGHT = 920

export function PreviewSection({ motion }: { motion: MotionPreference }) {
  const [frameState, setFrameState] = useState<PreviewState>({
    scenario: 'success',
    step: 'landing',
    ui: 'idle',
  })
  const [simulateBlock, setSimulateBlock] = useState(false)
  const [sizeKey, setSizeKey] = useState<SizeKey>('laptop')
  const [stageWidth, setStageWidth] = useState(FALLBACK_STAGE_WIDTH)
  // La URL inicial lleva los ajustes del primer arranque; después, todo va por mensajes.
  const [frameSrc] = useState(
    () => `/design-lab?frame=preview&scenario=success&motion=${motion}`,
  )
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const scenarioLabelId = useId()
  const stepsLabelId = useId()
  const sizeLabelId = useId()
  const radioName = useId()

  const send = (command: PreviewCommand) =>
    sendPreviewMessage(iframeRef.current?.contentWindow, {
      type: 'ask-sofi:preview-command',
      command,
    })

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      const data = readPreviewMessage(event)
      if (data?.type === 'ask-sofi:preview-state') setFrameState(data.state)
      if (data?.type === 'ask-sofi:preview-ready') {
        // Si el iframe se recarga, recupera los ajustes actuales de la mesa.
        sendPreviewMessage(event.source as Window, {
          type: 'ask-sofi:preview-command',
          command: { kind: 'motion', value: motion },
        })
        sendPreviewMessage(event.source as Window, {
          type: 'ask-sofi:preview-command',
          command: { kind: 'simulate-block', value: simulateBlock },
        })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [motion, simulateBlock])

  useEffect(() => {
    sendPreviewMessage(iframeRef.current?.contentWindow, {
      type: 'ask-sofi:preview-command',
      command: { kind: 'motion', value: motion },
    })
  }, [motion])

  useEffect(() => {
    const element = stageRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) =>
      setStageWidth(Math.round(entry.contentRect.width)),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const size = SIZES.find((item) => item.key === sizeKey) ?? SIZES[4]
  const scale = Math.min(
    1,
    Math.max(240, stageWidth - 36) / size.width,
    MAX_FRAME_HEIGHT / size.height,
  )
  const { scenario, step, ui } = frameState
  const screen = screenFor(step, scenario)

  return (
    <>
      <section className={cx(styles.mast, styles.wrap)} aria-labelledby="pv-h1">
        <div>
          <KickerRow tag="Sección 05">
            <Tag tone="lilac">Demo · datos simulados</Tag>
          </KickerRow>
          <h1 id="pv-h1" className={styles.h1}>
            Experience Preview
          </h1>
        </div>
        <p className={styles.deck}>
          El recorrido entero con los componentes de las secciones anteriores.
          Cuatro escenarios deterministas, sin una sola petición: todo sale de
          fixtures locales.
        </p>
      </section>

      <section
        className={cx(styles.controls, styles.wrap)}
        aria-label="Controles de la vista previa"
      >
        <div className={styles.row}>
          <div
            className={styles.group}
            role="radiogroup"
            aria-labelledby={scenarioLabelId}
          >
            <span id={scenarioLabelId} className={styles.groupLabel}>
              Escenario
            </span>
            <div className={styles.options}>
              {SCENARIOS.map((item) => (
                <OptionPill
                  key={item}
                  name={radioName}
                  value={item}
                  label={SCENARIO_LABELS[item]}
                  checked={item === scenario}
                  onChange={() => send({ kind: 'scenario', scenario: item })}
                />
              ))}
            </div>
          </div>
          <LabCheck
            label="Simular bloqueo de audio"
            checked={simulateBlock}
            onChange={(value) => {
              setSimulateBlock(value)
              send({ kind: 'simulate-block', value })
            }}
          />
        </div>
        <div className={styles.row}>
          <div
            className={styles.group}
            role="group"
            aria-labelledby={stepsLabelId}
          >
            <span id={stepsLabelId} className={styles.groupLabel}>
              Recorrido
            </span>
            <div className={styles.steps}>
              {(Object.keys(STEP_LABELS) as Step[]).map((item) => {
                const [num, label] = STEP_LABELS[item]
                return (
                  <button
                    key={item}
                    type="button"
                    className={styles.step}
                    aria-current={item === step ? 'step' : undefined}
                    disabled={item === 'result' && scenario === 'loading'}
                    onClick={() => send({ kind: 'step', step: item })}
                  >
                    <b>{num}</b>
                    {item === 'result' ? RESULT_LABELS[scenario] : label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.group}>
            <span id={sizeLabelId} className={styles.groupLabel}>
              Tamaño
            </span>
            <SegmentedControl
              labelledBy={sizeLabelId}
              options={SIZES.map((item) => ({
                value: item.key,
                label: item.label,
              }))}
              value={sizeKey}
              onChange={setSizeKey}
            />
          </div>
          <p className={styles.readout} aria-live="polite">
            {size.width} × {size.height} px · escala {Math.round(scale * 100)} %
          </p>
        </div>
      </section>

      <div ref={stageRef} className={styles.stage}>
        <div
          className={styles.holder}
          style={{
            width: Math.round(size.width * scale),
            height: Math.round(size.height * scale),
          }}
        >
          {/* Un iframe del tamaño elegido: la app responde a sus media queries reales. */}
          <iframe
            ref={iframeRef}
            className={styles.device}
            src={frameSrc}
            title="Vista previa de Ask Sofi"
            width={size.width}
            height={size.height}
            style={{ transform: `scale(${scale.toFixed(4)})` }}
          />
        </div>
      </div>

      <section className={styles.info} aria-label="Qué hay en esta pantalla">
        <div>
          <h2 className={styles.infoTitle}>Estado de la interfaz</h2>
          <div className={styles.chips}>
            {UI_STATES.map((item) => (
              <span
                key={item}
                className={cx(styles.state, item === ui && styles.stateOn)}
              >
                {item}
              </span>
            ))}
          </div>
          <p className={styles.note}>{STATE_NOTES[ui](scenario)}</p>
        </div>
        <div>
          <h2 className={styles.infoTitle}>Componentes en pantalla</h2>
          <div className={styles.chips}>
            {SCREEN_COMPONENTS[screen].map((name) => (
              <LabCode key={name}>{name}</LabCode>
            ))}
          </div>
        </div>
        <div>
          <h2 className={styles.infoTitle}>Provisional en esta pantalla</h2>
          <div className={styles.chips}>
            {SCREEN_PROVISIONAL[screen].map((name) => (
              <LabProv key={name}>{name}</LabProv>
            ))}
          </div>
          <p className={styles.note}>
            Latencia simulada: 1,6 s · «Carga» no termina nunca · aviso de carga
            lenta a los 6 s (provisional).
          </p>
        </div>
      </section>
    </>
  )
}
