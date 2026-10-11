import { useEffect, useId, useReducer, useState, type ReactNode } from 'react'
import { SoundProvider } from '../../app/providers/SoundProvider'
import { SofiPortrait } from '../../components/sofi/SofiPortrait/SofiPortrait'
import { SofiSpeech } from '../../components/sofi/SofiSpeech/SofiSpeech'
import type { SpeechStatus } from '../../components/sofi/SofiSpeech/speechTimeline'
import { Burst } from '../../components/ui/Burst/Burst'
import { Button } from '../../components/ui/Button/Button'
import { PlayIcon } from '../../components/ui/icons/icons'
import { Kicker } from '../../components/ui/Tag/Tag'
import { TextArea } from '../../components/ui/TextField/TextField'
import { TextLink } from '../../components/ui/TextLink/TextLink'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useSound } from '../../hooks/useSound'
import type {
  SpeechAudio,
  SpeechAudioStatus,
} from '../../infrastructure/audio/speechAudio'
import { cx } from '../../utils/cx'
import { BLINK_TIMELINE, formatDuration } from '../foundationsData'
import {
  DEFAULT_VOLUME,
  createMotionLabState,
  motionLabReducer,
  speechText,
  type AudioSimulationFlags,
  type MotionLabAction,
  type MotionLabState,
  type SpeechTextKey,
} from '../motionLab'
import {
  LabCap,
  LabCheck,
  LabChoice,
  LabCode,
  LabGrid,
  LabGroupLabel,
  LabMast,
  LabNote,
  LabProv,
  LabRange,
  LabReadout,
  LabRow,
  LabSpec,
  LabStage,
} from '../parts/LabParts'
import { createSimulatedAudio } from '../simulatedAudio'
import styles from './MotionSection.module.scss'

type Dispatch = (action: MotionLabAction) => void

const TEXT_OPTIONS = [
  { value: 'answer', label: 'Respuesta' },
  { value: 'needs', label: 'Falta contexto' },
  { value: 'long', label: 'Muchas pausas' },
  { value: 'custom', label: 'Personalizado' },
] as const satisfies ReadonlyArray<{ value: SpeechTextKey; label: string }>

const SOUND_OPTIONS = [
  { value: 'off', label: 'Sin sonido' },
  { value: 'on', label: 'Con sonido' },
] as const

const STATUS_NAMES: Record<SpeechStatus, string> = {
  idle: 'en espera',
  typing: 'escribiendo',
  pause: 'pausa',
  done: 'completo',
}

const AUDIO_NAMES: Record<SpeechAudioStatus, string> = {
  off: 'silencio',
  loading: 'preparando',
  ready: 'listo',
  playing: 'sonando',
  blocked: 'bloqueado',
  unavailable: 'no disponible',
}

// Controlador real envuelto: puede «bloquearse» en el primer intento o fallar la descarga.
function createLabAudio(
  flags: AudioSimulationFlags,
  volume: number,
): SpeechAudio {
  const audio = createSimulatedAudio({ ...flags, attempts: 0 })
  audio.setVolume(volume / 100)
  return audio
}

// --- 4.1 · SofiSpeech ---

type SpeechSpecProps = {
  lab: MotionLabState
  dispatch: Dispatch
  onSimulationChange: (patch: Partial<AudioSimulationFlags>) => void
}

function SpeechSpec({ lab, dispatch, onSimulationChange }: SpeechSpecProps) {
  const sound = useSound()
  const reducedMotion = useReducedMotion()
  const simulateId = useId()
  const text = speechText(lab)
  const { index, length, status, speaking } = lab.speech
  const percent = length ? Math.round((index / length) * 100) : 0

  const play = () => {
    // «Reproducir» también es un gesto: si el sonido está activado pero no suena, se prepara aquí.
    if (
      sound.enabled &&
      (sound.status === 'blocked' || sound.status === 'unavailable')
    )
      sound.unlock()
    dispatch({ type: 'play', at: performance.now(), reducedMotion })
  }

  const chooseSound = (value: 'on' | 'off') => {
    if (value === 'on') {
      sound.enable()
      return
    }
    sound.disable()
    dispatch({ type: 'sound-off', at: performance.now() })
  }

  const changeVolume = (value: number) => {
    sound.setVolume(value / 100)
    dispatch({ type: 'volume', value })
  }

  const resetConfig = () => {
    sound.setVolume(DEFAULT_VOLUME / 100)
    dispatch({ type: 'reset-config' })
  }

  return (
    <LabSpec
      id="m-speech"
      kicker="4.1 · Escritura"
      title="SofiSpeech"
      desc="Pulsa «Reproducir». Cambia el texto a mitad para comprobar que la animación se cancela limpia, simula un bloqueo del navegador o activa el movimiento reducido arriba."
      codes={
        <>
          <LabCode>{'<SofiSpeech text timing onStateChange>'}</LabCode>
          <LabCode>useSpeechTimeline</LabCode>
          <LabCode>createSpeechAudio</LabCode>
        </>
      }
    >
      <div className={styles.play}>
        <LabStage
          dots
          className={styles.stage}
          innerClassName={styles.stageInner}
        >
          <SofiPortrait size={288} expression="talking" outline />
          <SofiSpeech
            className={styles.speech}
            text={text}
            timing={lab.timing}
            playToken={lab.playToken}
            autoplay={false}
            revealed={lab.revealed}
            announce={lab.announce}
            onStateChange={(state) =>
              dispatch({ type: 'speech', state, at: performance.now() })
            }
            doneAction={
              <TextLink href="#m-sync" continues>
                Ver las versiones
              </TextLink>
            }
          />
        </LabStage>

        <div className={styles.panel}>
          <LabRow style={{ gap: '0.875rem 1.375rem' }}>
            <Button
              icon={<PlayIcon size={18} strokeWidth={2.4} />}
              onClick={play}
            >
              Reproducir
            </Button>
            <TextLink
              onClick={() =>
                dispatch({ type: 'reveal', at: performance.now() })
              }
            >
              Ver todo
            </TextLink>
            <TextLink onClick={resetConfig}>Valores por defecto</TextLink>
          </LabRow>
          <hr className={styles.sep} />
          <LabChoice
            stacked
            label="Texto"
            options={TEXT_OPTIONS}
            value={lab.textKey}
            onChange={(key) =>
              dispatch({
                type: 'text',
                key,
                at: performance.now(),
                reducedMotion,
              })
            }
          />
          {lab.textKey === 'custom' && (
            <TextArea
              label="Tu texto"
              value={lab.custom}
              onChange={(value) => dispatch({ type: 'custom', value })}
            />
          )}
          <LabRange
            label="Velocidad"
            value={lab.timing.charDelay}
            min={10}
            max={80}
            step={1}
            display={`${lab.timing.charDelay} ms por letra`}
            onChange={(charDelay) =>
              dispatch({ type: 'timing', patch: { charDelay } })
            }
          />
          <LabRange
            label="Pausa tras . … : ? !"
            value={lab.timing.longPause}
            min={0}
            max={800}
            step={10}
            display={`${lab.timing.longPause} ms`}
            onChange={(longPause) =>
              dispatch({ type: 'timing', patch: { longPause } })
            }
          />
          <LabRange
            label="Pausa tras , ;"
            value={lab.timing.shortPause}
            min={0}
            max={400}
            step={10}
            display={`${lab.timing.shortPause} ms`}
            onChange={(shortPause) =>
              dispatch({ type: 'timing', patch: { shortPause } })
            }
          />
          <LabRange
            label="Retardo inicial"
            value={lab.timing.startDelay}
            min={0}
            max={1500}
            step={50}
            display={`${lab.timing.startDelay} ms`}
            onChange={(startDelay) =>
              dispatch({ type: 'timing', patch: { startDelay } })
            }
          />
          <hr className={styles.sep} />
          <LabChoice
            stacked
            label="Sonido"
            options={SOUND_OPTIONS}
            value={sound.enabled ? 'on' : 'off'}
            onChange={chooseSound}
          />
          <LabRange
            label="Volumen"
            value={lab.volume}
            min={0}
            max={100}
            step={5}
            display={`${lab.volume} %`}
            onChange={changeVolume}
          />
          <div
            className={styles.simulate}
            role="group"
            aria-labelledby={simulateId}
          >
            <LabGroupLabel id={simulateId}>Simular</LabGroupLabel>
            <LabCheck
              label="Bloqueo del navegador en el primer intento"
              checked={lab.simulation.block}
              onChange={(block) => onSimulationChange({ block })}
            />
            <LabCheck
              label="Archivo de audio no disponible"
              checked={lab.simulation.unavailable}
              onChange={(unavailable) => onSimulationChange({ unavailable })}
            />
            <LabNote>
              Cada cambio estrena controlador de audio, en silencio.
            </LabNote>
          </div>
        </div>
      </div>

      <div className={styles.row3}>
        <div>
          <LabCap as="h3">Estado expuesto</LabCap>
          <LabReadout
            rows={[
              ['Estado', STATUS_NAMES[status]],
              ['Progreso', `${index} / ${length} · ${percent} %`],
              ['Hablando', speaking ? 'sí' : 'no'],
              ['Audio', AUDIO_NAMES[lab.audio]],
            ]}
          />
          <div className={styles.bar} aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div>
          <LabCap as="h3">Registro de eventos</LabCap>
          {lab.log.length > 0 ? (
            <ol className={styles.log}>
              {lab.log.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.time}</span>
                  <span>{entry.message}</span>
                </li>
              ))}
            </ol>
          ) : (
            <LabNote>Pulsa «Reproducir» para empezar.</LabNote>
          )}
        </div>
        <div>
          <LabCap as="h3">Lo que oye un lector de pantalla</LabCap>
          <LabNote>
            Una sola vez, completo, en cuanto aparece el cuadro. Ni letra a
            letra ni repetido al terminar.
          </LabNote>
          <p className={styles.reader}>«{text}»</p>
        </div>
      </div>
    </LabSpec>
  )
}

// --- 4.2 · Controlador de sonido ---

function FlowNode({
  on,
  warn,
  children,
}: {
  on?: boolean
  warn?: boolean
  children: ReactNode
}) {
  return (
    <span
      className={cx(styles.node, on && styles.nodeOn, warn && styles.nodeWarn)}
      aria-current={on || warn ? 'true' : undefined}
    >
      {children}
    </span>
  )
}

function Arrow({ symbol = '→' }: { symbol?: string }) {
  return (
    <span className={styles.arrow} aria-hidden="true">
      {symbol}
    </span>
  )
}

function SoundSpec({ status }: { status: SpeechAudioStatus }) {
  return (
    <LabSpec
      id="m-sound"
      kicker="4.2 · Sonido"
      title="Controlador de sonido"
      desc="Un controlador pequeño, aparte del typewriter. Suena mientras aparecen letras, calla en cada pausa y retoma el audio donde lo dejó, así la voz no se repite. El estado activo se resalta en tinta."
      codes={
        <>
          <LabCode>talking-sound.mp3 · 21 s</LabCode>
          <LabCode>1 AudioContext · 1 canal</LabCode>
        </>
      }
    >
      <div className={styles.flow} role="group" aria-label="Estados del sonido">
        <FlowNode on={status === 'off'}>Silencio</FlowNode>
        <Arrow />
        <span className={styles.gesture}>Gesto</span>
        <Arrow />
        <FlowNode on={status === 'loading'}>Preparando</FlowNode>
        <Arrow />
        <FlowNode on={status === 'ready'}>Listo</FlowNode>
        <Arrow symbol="⇄" />
        <FlowNode on={status === 'playing'}>Sonando</FlowNode>
      </div>
      <div
        className={cx(styles.flow, styles.flowFailures)}
        role="group"
        aria-label="Estados de fallo"
      >
        <FlowNode warn={status === 'blocked'}>Bloqueado</FlowNode>
        <Arrow />
        <span className={styles.gesture}>Activar sonido</span>
        <Arrow />
        <FlowNode>Listo</FlowNode>
        <span className={styles.flowGap} />
        <FlowNode warn={status === 'unavailable'}>No disponible</FlowNode>
        <Arrow />
        <FlowNode>Silencio · el texto sigue</FlowNode>
      </div>
      <LabGrid as="ul" style={{ marginTop: '1.75rem' }}>
        <li>
          <Kicker as="p">Por defecto</Kicker>
          <p className={styles.cardText}>
            Silencio. El audio solo se prepara dentro del gesto de «Empezar» o
            al activar el sonido.
          </p>
        </li>
        <li>
          <Kicker as="p">Sin solapes</Kicker>
          <p className={styles.cardText}>
            Un único canal: si ya suena un fragmento, no empieza otro. Silenciar
            o «Ver todo» lo corta al instante.
          </p>
        </li>
        <li>
          <Kicker as="p">Movimiento reducido</Kicker>
          <p className={styles.cardText}>
            El texto aparece entero y, con sonido, suena un único fragmento
            breve: sin escritura no hay nada que sincronizar.
          </p>
        </li>
      </LabGrid>
    </LabSpec>
  )
}

// --- 4.3 · Sincronía con sprites ---

function SyncSpec({ speech }: { speech: MotionLabState['speech'] }) {
  const { status, index, speaking } = speech
  return (
    <LabSpec
      id="m-sync"
      kicker="4.3 · Para 008"
      title="Sincronía con sprites"
      desc="SofiSpeech expone su estado sin conocer los sprites. Cuando exista el spritesheet de hablar, solo tendrá que escuchar «hablando»; el hueco provisional se enciende ahora con la escritura de 4.1."
      codes={
        <>
          <LabCode>{'{ status, index, length, speaking }'}</LabCode>
          <LabProv>Sprite «hablando» · pendiente 008</LabProv>
        </>
      }
    >
      <div className={styles.sync}>
        <div className={styles.slotCell}>
          <div
            className={cx(styles.slot, speaking && styles.slotOn)}
            aria-hidden="true"
          >
            {speaking
              ? 'hablando'
              : status === 'pause'
                ? 'pausa'
                : 'sprite «hablando» · 008'}
          </div>
          <div className={styles.slotCopy}>
            <p className={styles.slotTitle}>Hueco del sprite</p>
            <LabNote style={{ maxWidth: '30ch' }}>
              Rosa mientras hay letras; discontinuo en las pausas y al terminar.
            </LabNote>
          </div>
        </div>
        <div>
          <ul className={styles.contract}>
            <li>
              <LabCode>status</LabCode>
              <span>idle · typing · pause · done → {STATUS_NAMES[status]}</span>
            </li>
            <li>
              <LabCode>index</LabCode>
              <span>carácter actual → {index}</span>
            </li>
            <li>
              <LabCode>speaking</LabCode>
              <span>true solo entre pausas → {speaking ? 'sí' : 'no'}</span>
            </li>
            <li>
              <LabCode>expression</LabCode>
              <span>
                lo decide la pantalla, no SofiSpeech: atenta, pensando, poco
                convencida, ups
              </span>
            </li>
          </ul>
        </div>
      </div>
    </LabSpec>
  )
}

// --- 4.4 · Parpadeo ---

type BlinkMode = 'normal' | 'slow' | 'paused'

const BLINK_MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'slow', label: 'Lento ×4' },
  { value: 'paused', label: 'Pausa' },
] as const satisfies ReadonlyArray<{ value: BlinkMode; label: string }>

// Los tramos largos llevan rótulo y marcan las referencias de la regla.
const LONG_STEP_MS = 1000
const FRAME_CLASS = { 0: styles.frame0, 1: styles.frame1, 2: styles.frame2 }

const BLINK_SEGMENTS = BLINK_TIMELINE.reduce<
  Array<{ frame: 0 | 1 | 2; ms: number; start: number }>
>((segments, [frame, ms]) => {
  const previous = segments.at(-1)
  return [
    ...segments,
    { frame, ms, start: previous ? previous.start + previous.ms : 0 },
  ]
}, [])

const BLINK_TOTAL_MS = BLINK_TIMELINE.reduce((total, [, ms]) => total + ms, 0)

const BLINK_TICKS = [
  ...new Set([
    0,
    ...BLINK_SEGMENTS.filter((segment) => segment.ms >= LONG_STEP_MS).flatMap(
      (segment) => [segment.start, segment.start + segment.ms],
    ),
    BLINK_TOTAL_MS,
  ]),
].sort((a, b) => a - b)

function timelinePercent(ms: number): string {
  return `${(ms / BLINK_TOTAL_MS) * 100}%`
}

function BlinkSpec() {
  const [mode, setMode] = useState<BlinkMode>('normal')
  return (
    <LabSpec
      id="m-blink"
      kicker="4.4 · Sprite"
      title="Parpadeo"
      desc="La línea de tiempo de _sofi-blink.scss dibujada a escala: 4,2 segundos con un parpadeo y, tras una pausa, otro doble. Ralentízala para verla fotograma a fotograma."
      codes={
        <>
          <LabCode>{`$timeline · ${BLINK_TIMELINE.length} pasos`}</LabCode>
          <LabCode>step-end</LabCode>
        </>
      }
    >
      <div
        className={cx(
          mode === 'slow' && styles.blinkSlow,
          mode === 'paused' && styles.blinkPaused,
        )}
      >
        {/* Dibujo de la línea de tiempo: la leyenda de debajo la cuenta en texto. */}
        <div className={styles.timelineWrap} aria-hidden="true">
          <div className={styles.timeline}>
            {BLINK_SEGMENTS.map((segment) => (
              <span
                key={segment.start}
                className={FRAME_CLASS[segment.frame]}
                style={{ width: timelinePercent(segment.ms) }}
              >
                {segment.ms >= LONG_STEP_MS
                  ? `F${segment.frame} · ${formatDuration(segment.ms)}`
                  : null}
              </span>
            ))}
          </div>
          <span className={styles.playhead} />
          <div className={styles.ticks}>
            {BLINK_TICKS.map((ms, index) => (
              <span
                key={ms}
                className={cx(
                  ms === 0 && styles.tickStart,
                  ms === BLINK_TOTAL_MS && styles.tickEnd,
                  // En estrecho, una de cada dos marcas interiores baja de fila para no pisarse.
                  index % 2 === 0 &&
                    index > 0 &&
                    ms !== BLINK_TOTAL_MS &&
                    styles.tickLow,
                )}
                style={
                  ms === 0 || ms === BLINK_TOTAL_MS
                    ? undefined
                    : { left: timelinePercent(ms) }
                }
              >
                {ms === 0 ? '0' : formatDuration(ms)}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.blinkRow}>
          <SofiPortrait
            size={300}
            expression="attentive"
            className={styles.blinkSprite}
            crop={{
              width: 150,
              height: 150,
              offsetX: 75,
              offsetY: 66,
              background: 'var(--tone-pink-soft)',
              frame: 'sticker',
            }}
          />
          <div className={styles.blinkControls}>
            <LabChoice
              stacked
              label="Reproducción"
              options={BLINK_MODES}
              value={mode}
              onChange={setMode}
            />
            <LabNote style={{ maxWidth: '54ch' }}>
              Leyenda: crema F0 (abiertos) · mantequilla F1 (entrecerrados) ·
              rosa F2 (cerrados). Con movimiento reducido, F0 fijo y la línea de
              tiempo quieta.
            </LabNote>
          </div>
        </div>
      </div>
    </LabSpec>
  )
}

export function MotionSection() {
  const [lab, dispatch] = useReducer(
    motionLabReducer,
    undefined,
    createMotionLabState,
  )
  const [audio, setAudio] = useState(() =>
    createLabAudio(lab.simulation, lab.volume),
  )

  // El registro escucha al controlador de audio, que vive fuera de React.
  useEffect(
    () =>
      audio.subscribe(() =>
        dispatch({
          type: 'audio',
          status: audio.getStatus(),
          at: performance.now(),
        }),
      ),
    [audio],
  )

  const changeSimulation = (patch: Partial<AudioSimulationFlags>) => {
    setAudio(createLabAudio({ ...lab.simulation, ...patch }, lab.volume))
    dispatch({ type: 'simulation', patch })
  }

  return (
    <>
      <LabMast
        titleId="m-h1"
        tag="Sección 04"
        kicker="Cómo se mueve y cómo suena Sofi"
        title="Motion & Sound"
        deck="Velocidad, pausas y sonido de SofiSpeech, con el audio real de Sofi. Todo se ajusta aquí durante el desarrollo; nada de esto es una preferencia pública."
        jumps={[
          { href: '#m-speech', num: '4.1', label: 'SofiSpeech' },
          { href: '#m-sound', num: '4.2', label: 'Controlador de sonido' },
          { href: '#m-sync', num: '4.3', label: 'Sincronía con sprites' },
          { href: '#m-blink', num: '4.4', label: 'Parpadeo' },
        ]}
        aside={
          <Burst
            kicker="Sube el"
            size={150}
            rotate={10}
            kickerSize={11}
            mainSize={24}
            mainGap={4}
          >
            volumen
          </Burst>
        }
      />
      {/* Un controlador por simulación: al cambiarla, el proveedor se monta de nuevo con él. */}
      <SoundProvider key={lab.audioGeneration} createAudio={() => audio}>
        <SpeechSpec
          lab={lab}
          dispatch={dispatch}
          onSimulationChange={changeSimulation}
        />
        <SoundSpec status={lab.audio} />
        <SyncSpec speech={lab.speech} />
      </SoundProvider>
      <BlinkSpec />
    </>
  )
}
