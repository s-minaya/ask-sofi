import { useEffect, useReducer, useState, type CSSProperties } from 'react'
import {
  PROVISIONAL_ACTIVITY_LABELS,
  type LabelCalendar,
} from '../../components/sofi/visual/activityLabels'
import { Button } from '../../components/ui/Button/Button'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cx } from '../../utils/cx'
import {
  ACTIVITY_VARIANTS,
  activityReducer,
  activityView,
  createActivityState,
  cycleOf,
  type ActivityAction,
  type ActivityVariant,
  type GlyphFrame,
  type IndicatorMode,
} from '../activityLab'
import { formatDuration } from '../foundationsData'
import {
  LabCap,
  LabChoice,
  LabCode,
  LabNote,
  LabProv,
  LabRange,
  LabReadout,
  LabSpec,
  LabStage,
  LabSub,
} from '../parts/LabParts'
import styles from './ActivitySpec.module.scss'

// T068 · prototipos del indicador de actividad y sus etiquetas (D-8). No es el componente
// definitivo (`ActivityIndicator`, T079–T080) ni se integra en `ProcessingState` (T081). Se
// conservan las tres variantes para comparar; la aprobada con AV1 consta en plan §11.6.

type Rhythm = 'own' | 'common'
type Tone = 'accent' | 'text'
type Size = 'small' | 'body' | 'large'

const RHYTHM_OPTIONS = [
  { value: 'own', label: 'El de cada una' },
  { value: 'common', label: 'El mismo' },
] as const

const TONE_OPTIONS = [
  { value: 'accent', label: 'Acento' },
  { value: 'text', label: 'Texto' },
] as const

const SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeño' },
  { value: 'body', label: 'Cuerpo' },
  { value: 'large', label: 'Titular' },
] as const

const MODE_LABEL: Record<IndicatorMode, string> = {
  animated: 'Se anima',
  still: 'Quieto (movimiento reducido)',
  hidden: 'Oculto: no hay actividad',
}

const PHASE_LABEL = {
  idle: 'Ninguna',
  pending: { analysis: 'Análisis en curso', loading: 'Carga en curso' },
  retained: 'Resultado recibido · retención del primer ciclo',
  done: 'Terminada',
} as const

const calendarText = (calendar: LabelCalendar) =>
  calendar
    .map(({ fromMs, label }) =>
      fromMs === 0
        ? `«${label}»`
        : `«${label}» desde ${formatDuration(fromMs)}`,
    )
    .join(' y ')

// Reloj de la demostración: solo corre mientras hay una operación en curso. Cada acción lo pone
// en hora al instante, para que la etiqueta no espere al siguiente tic.
function useNow(running: boolean): [number, () => void] {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(performance.now()), 200)
    return () => clearInterval(timer)
  }, [running])
  return [now, () => setNow(performance.now())]
}

function Frame({
  frame,
  className,
}: {
  frame: GlyphFrame
  className?: string
}) {
  const size = frame.length
  return (
    <svg
      className={cx(styles.frame, className)}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      focusable="false"
    >
      {frame.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
          ) : null,
        ),
      )}
    </svg>
  )
}

// La tira contiene el ciclo completo de ida y vuelta; el CSS la desplaza a saltos. Sin
// temporizadores. Quien detiene el glifo es solo el mixin de movimiento reducido, que conoce
// `full` (D-1): un único mecanismo para no desincronizarse. `mode` solo lo declara.
function Glyph({
  variant,
  frameMs,
  mode,
}: {
  variant: ActivityVariant
  frameMs: number
  mode: Exclude<IndicatorMode, 'hidden'>
}) {
  const { sequence, stillIndex } = cycleOf(variant, frameMs)
  const vars = {
    '--frames': sequence.length,
    '--frame-ms': `${frameMs}ms`,
    '--still': stillIndex,
  } as CSSProperties
  return (
    <span className={styles.glyph} style={vars} data-indicator={mode}>
      <span className={styles.strip}>
        {sequence.map((frame, index) => (
          <Frame key={index} frame={variant.frames[frame]} />
        ))}
      </span>
    </span>
  )
}

export function ActivitySpec() {
  const reducedMotion = useReducedMotion()
  const [state, dispatchAction] = useReducer(
    activityReducer,
    undefined,
    createActivityState,
  )
  const [now, syncNow] = useNow(state.phase === 'pending')
  const dispatch = (action: ActivityAction) => {
    dispatchAction(action)
    syncNow()
  }
  const [rhythm, setRhythm] = useState<Rhythm>('own')
  const [commonMs, setCommonMs] = useState(120)
  const [tone, setTone] = useState<Tone>('accent')
  const [size, setSize] = useState<Size>('body')
  const view = activityView(state, now, reducedMotion)
  const phase =
    state.phase === 'pending'
      ? PHASE_LABEL.pending[state.kind]
      : PHASE_LABEL[state.phase]

  return (
    <LabSpec
      id="m-activity"
      kicker="4.10 · Actividad"
      title="Indicador de actividad"
      desc="Tres propuestas del indicador que acompaña la etiqueta mientras hay una operación real: un glifo de píxel que florece y se recoge, de ida y vuelta, como guiño al indicador de trabajo de Claude Code. Los glifos son dibujos propios, sin caracteres, logotipos ni código de Claude. Las tres siguen la misma operación simulada, para compararlas a la vez."
      codes={
        <>
          <LabCode>visual/activityLabels</LabCode>
          <LabProv>
            Prototipo T068 · Destello aprobado, producción en T080
          </LabProv>
        </>
      }
    >
      <div className={styles.layout}>
        <div className={styles.panel}>
          <LabSub>Operación simulada</LabSub>
          <div className={styles.buttons}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                dispatch({
                  type: 'start',
                  kind: 'analysis',
                  at: performance.now(),
                })
              }
            >
              Empieza un análisis
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                dispatch({
                  type: 'start',
                  kind: 'loading',
                  at: performance.now(),
                })
              }
            >
              Empieza una carga
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={state.phase !== 'pending'}
              onClick={() => dispatch({ type: 'skip', ms: 4000 })}
            >
              Adelantar 4 s
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={state.phase !== 'pending' || state.kind !== 'analysis'}
              onClick={() => dispatch({ type: 'retain' })}
            >
              Llega el resultado (retenido)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={state.phase !== 'pending' && state.phase !== 'retained'}
              onClick={() => dispatch({ type: 'finish' })}
            >
              Termina
            </Button>
          </div>
          <LabReadout
            rows={[
              ['Operación', phase],
              [
                'Transcurrido',
                view.pending
                  ? formatDuration(Math.floor(view.elapsedMs / 100) * 100)
                  : '—',
              ],
              ['Etiqueta', view.label ?? 'Ninguna'],
              ['Indicador', MODE_LABEL[view.indicator]],
              [
                'Se anuncia',
                'Solo el texto de estado del componente funcional, una vez. Ni el glifo ni la etiqueta',
              ],
            ]}
          />
          <LabChoice
            label="Ritmo"
            options={RHYTHM_OPTIONS}
            value={rhythm}
            onChange={setRhythm}
            stacked
          />
          {rhythm === 'common' && (
            <LabRange
              label="Ritmo común"
              value={commonMs}
              min={60}
              max={300}
              step={10}
              display={`${commonMs} ms por paso`}
              onChange={setCommonMs}
            />
          )}
          <LabChoice
            label="Color del glifo"
            options={TONE_OPTIONS}
            value={tone}
            onChange={setTone}
            stacked
          />
          <LabChoice
            label="Tamaño del texto"
            options={SIZE_OPTIONS}
            value={size}
            onChange={setSize}
            stacked
          />
        </div>
        <ul className={styles.variants}>
          {ACTIVITY_VARIANTS.map((variant) => {
            const frameMs = rhythm === 'common' ? commonMs : variant.frameMs
            const { sequence, cycleMs } = cycleOf(variant, frameMs)
            const grid = variant.frames[0].length
            return (
              <li key={variant.id} className={styles.variant}>
                <LabCap as="h3">{variant.name}</LabCap>
                <LabStage plain className={styles.stage}>
                  <div
                    className={cx(
                      styles.live,
                      styles[size],
                      tone === 'accent' && styles.accent,
                    )}
                    data-variant={variant.id}
                  >
                    {view.indicator !== 'hidden' && view.label ? (
                      // Decorativo (spec §4; catálogo §7.1): fuera del árbol de accesibilidad.
                      <span className={styles.activity} aria-hidden="true">
                        <Glyph
                          variant={variant}
                          frameMs={frameMs}
                          mode={view.indicator}
                        />
                        <span className={styles.label}>{view.label}</span>
                      </span>
                    ) : (
                      <span className={styles.empty}>Sin actividad</span>
                    )}
                  </div>
                </LabStage>
                <div className={styles.frames} aria-hidden="true">
                  {variant.frames.map((frame, index) => (
                    <Frame
                      key={index}
                      frame={frame}
                      className={cx(
                        styles.sample,
                        tone === 'accent' && styles.accent,
                        index === variant.stillFrame && styles.still,
                      )}
                    />
                  ))}
                </div>
                <LabReadout
                  rows={[
                    ['Rejilla', `${grid} × ${grid} píxeles`],
                    [
                      'Ciclo',
                      `${variant.frames.length} fotogramas · ${sequence.length} pasos`,
                    ],
                    ['Ritmo', `${frameMs} ms por paso`],
                    ['Vuelta completa', formatDuration(cycleMs)],
                    [
                      'Quieto',
                      `fotograma ${variant.stillFrame + 1} (recuadrado)`,
                    ],
                  ]}
                />
              </li>
            )
          })}
        </ul>
      </div>
      <LabNote style={{ marginTop: '1.75rem' }}>
        Etiquetas provisionales (D-21), ligadas al estado real con{' '}
        <code>activityLabel</code>: análisis,{' '}
        {calendarText(PROVISIONAL_ACTIVITY_LABELS.analysis)}; carga,{' '}
        {calendarText(PROVISIONAL_ACTIVITY_LABELS.loading)}. Con movimiento
        reducido, el glifo se queda en su fotograma recuadrado y la etiqueta no
        cambia salvo que cambie la operación (D-20). Al llegar el resultado,
        aunque se retenga para terminar el primer ciclo, etiqueta y glifo
        desaparecen: la operación ya terminó (catálogo §6.4). Prueba el
        movimiento con el selector global del Lab.
      </LabNote>
    </LabSpec>
  )
}
