import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  loadedClassOf,
  loadSprite,
} from '../../components/sofi/SofiSprite/loadSprite'
import { SofiSprite } from '../../components/sofi/SofiSprite/SofiSprite'
import { SofiSpeech } from '../../components/sofi/SofiSpeech/SofiSpeech'
import {
  DEFAULT_SPEECH_TIMING,
  type SpeechStatus,
} from '../../components/sofi/SofiSpeech/speechTimeline'
import { Button } from '../../components/ui/Button/Button'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cx } from '../../utils/cx'
import { SPEECH_TEXTS } from '../motionLab'
import {
  LabCap,
  LabChoice,
  LabCode,
  LabNote,
  LabProv,
  LabReadout,
  LabSpec,
  LabStage,
} from '../parts/LabParts'
import {
  buildTimeline,
  frameAtProgress,
  type TimelineKeyframe,
} from '../spriteTimeline'
import {
  APPROVED_TALKING,
  END_OPTIONS,
  jumpBetween,
  PAUSE_OPTIONS,
  phaseOf,
  START_OPTIONS,
  talkingView,
  type EndPolicy,
  type Hold,
  type PausePolicy,
  type SpeechPhase,
  type StartPolicy,
  type TalkingView,
  type Visible,
} from '../talkingPauses'
import styles from './TalkingPausesSpec.module.scss'

// T070 · 4.12: las alternativas de pausa de `talking` y el paso `blink → talking`, una junto a otra
// con el mismo `SofiSpeech` (catálogo, ficha 004; spec 008 §2). Prototipo: la combinación aprobada
// (AV5, plan §11.8) va por defecto y las demás se conservan para comparar; producción no cambia
// hasta T083–T085. Para medir los saltos lee los fotogramas de las animaciones reales, como la
// línea de tiempo del inspector (T060), sin duraciones propias.

// El diálogo de 4.1 con más pausas: es lo que se compara. Las pausas por defecto de `SofiSpeech`
// duran 170 y 360 ms; alargarlas solo sirve para mirarlas con calma.
type PauseScale = '1' | '4'
const SCALE_OPTIONS: { value: PauseScale; label: string }[] = [
  { value: '1', label: 'Reales' },
  { value: '4', label: 'Alargadas ×4' },
]

// --- Lectura de lo visible ---

function frameOfAnimation(animation: Animation): number | null {
  const effect = animation.effect as KeyframeEffect | null
  if (!effect?.target) return null
  const style = getComputedStyle(effect.target, effect.pseudoElement)
  const frames = parseInt(style.getPropertyValue('--sprite-frames'), 10) || 1
  const timeline = buildTimeline(
    effect.getKeyframes() as TimelineKeyframe[],
    Number(effect.getComputedTiming().duration),
    frames,
  )
  if (!timeline) return null
  return frameAtProgress(timeline, effect.getComputedTiming().progress ?? 0)
}

// La pista de una tira: la que mueve `background-position-x`, en el elemento o en `::after`.
function stripAnimation(
  scope: Element,
  pseudo: string | null,
): Animation | undefined {
  return (scope.getAnimations?.({ subtree: true }) ?? []).find((animation) => {
    const effect = animation.effect as KeyframeEffect | null
    return (
      effect !== null &&
      (effect.pseudoElement ?? null) === pseudo &&
      effect
        .getKeyframes()
        .some((keyframe) => 'backgroundPositionX' in keyframe)
    )
  })
}

// Ojos: la tira del cuerpo. Boca: la capa `::after` de `talking`; `sofi-blink` no tiene capa y su
// boca está cerrada (lo dice el parcial de `talking`: fuera de boca y ojos, la tira es la misma).
function readVisible(
  scope: Element | null,
  animation: TalkingView['animation'],
): Visible {
  if (!scope) return { eyes: null, mouth: null }
  const body = stripAnimation(scope, null)
  const mouth = stripAnimation(scope, '::after')
  return {
    eyes: body ? frameOfAnimation(body) : null,
    mouth:
      animation === 'sofi-blink' ? 0 : mouth ? frameOfAnimation(mouth) : null,
  }
}

const allAnimations = (scope: Element | null) =>
  scope?.getAnimations?.({ subtree: true }) ?? []

// --- Una alternativa ---

type Change = {
  id: number
  // La reproducción en que ocurrió: el registro solo enseña la actual.
  run: number
  from: TalkingView
  to: TalkingView
  before: Visible
  after: Visible
  // Lo que esperó el sprite a que `sofi-blink` abriera los ojos; `null` si no tenía que esperar.
  waited: number | null
}

// Cambios que se cuentan por reproducción, y los que se enseñan.
const KEPT = 200
const LISTED = 6

const VIEW_NAMES: Record<Hold, string> = {
  none: 'en marcha',
  freeze: 'congelado',
  closed: 'boca cerrada',
}

const viewName = (view: TalkingView) =>
  view.animation === 'sofi-blink'
    ? 'sofi-blink'
    : `talking ${VIEW_NAMES[view.hold]}`

const frameName = (frame: number | null) => (frame === null ? '?' : `${frame}`)

function jumpText(change: Change): string {
  const jump = jumpBetween(change.before, change.after)
  if (jump.eyes === null || jump.mouth === null) return 'sin lectura'
  const parts = [jump.eyes && 'ojos', jump.mouth && 'boca'].filter(Boolean)
  return parts.length ? `salto de ${parts.join(' y ')}` : 'sin salto'
}

function ChangeText({ change }: { change: Change }) {
  return (
    <>
      ojos {frameName(change.before.eyes)}→{frameName(change.after.eyes)} · boca{' '}
      {frameName(change.before.mouth)}→{frameName(change.after.mouth)} ·{' '}
      <strong>{jumpText(change)}</strong>
      {change.waited !== null && ` · esperó ${change.waited} ms`}
    </>
  )
}

const sameView = (a: TalkingView, b: TalkingView) =>
  a.animation === b.animation && a.hold === b.hold

type PauseColumnProps = {
  pause: PausePolicy
  label: string
  phase: SpeechPhase
  end: EndPolicy
  start: StartPolicy
  // Cambia con cada reproducción: el registro empieza de nuevo, pero el sprite sigue montado,
  // para que `sofi-blink` no vuelva a su principio y el paso a `talking` caiga donde caiga,
  // como en una pantalla real.
  run: number
}

export function PauseColumn({
  pause,
  label,
  phase,
  end,
  start,
  run,
}: PauseColumnProps) {
  const [shown, setShown] = useState<TalkingView>(() =>
    talkingView(phase, { pause, end }),
  )
  const [log, setLog] = useState<Change[]>([])
  const scope = useRef<HTMLDivElement>(null)
  // Tiempos de las animaciones al cerrar la boca, para seguir donde iba al volver a hablar.
  const saved = useRef<Map<Animation, number>>(new Map())
  const nextId = useRef(0)

  // Pasa a lo que pide la fase en el siguiente fotograma, midiendo lo visible justo antes y justo
  // después. Solo espera el paso de `sofi-blink` a `talking` con «ojos abiertos», y como mucho lo
  // que dure el parpadeo en curso: el texto nunca espera, solo el sprite.
  useEffect(() => {
    const target = talkingView(phase, { pause, end })
    if (sameView(shown, target)) return
    const waits =
      start === 'eyes-open' &&
      shown.animation === 'sofi-blink' &&
      target.animation === 'talking'
    let frame = 0
    // Desde la primera lectura: el fotograma en que se programa el cambio no es espera.
    let firstCheck: number | null = null
    const commit = () => {
      const before = readVisible(scope.current, shown.animation)
      flushSync(() => setShown(target))
      const animations = allAnimations(scope.current)
      if (target.hold === 'closed' && shown.hold !== 'closed') {
        saved.current = new Map()
        for (const animation of animations) {
          saved.current.set(animation, Number(animation.currentTime ?? 0))
          animation.currentTime = 0
        }
      } else if (shown.hold === 'closed') {
        for (const [animation, time] of saved.current)
          if (animations.includes(animation)) animation.currentTime = time
        saved.current = new Map()
      }
      const after = readVisible(scope.current, target.animation)
      const id = nextId.current++
      const waited =
        waits && firstCheck !== null
          ? Math.round(performance.now() - firstCheck)
          : null
      setLog((list) =>
        [
          { id, run, from: shown, to: target, before, after, waited },
          ...list,
        ].slice(0, KEPT),
      )
    }
    const check = () => {
      firstCheck ??= performance.now()
      const eyes = waits ? readVisible(scope.current, 'sofi-blink').eyes : null
      // Sin lectura (sin Web Animations o con movimiento reducido) no hay nada que esperar.
      if (eyes === null || eyes === 0) commit()
      else frame = requestAnimationFrame(check)
    }
    frame = requestAnimationFrame(check)
    return () => cancelAnimationFrame(frame)
  }, [phase, pause, end, start, shown, run])

  const changes = log.filter((change) => change.run === run)
  const jumps = changes.map((change) =>
    jumpBetween(change.before, change.after),
  )
  const count = (key: 'eyes' | 'mouth') =>
    jumps.filter((jump) => jump[key] === true).length
  // El paso de `sofi-blink` a `talking` al empezar a hablar: el registro va del más reciente al
  // más antiguo.
  const opening = changes.findLast(
    (change) =>
      change.from.animation === 'sofi-blink' &&
      change.to.animation === 'talking',
  )

  return (
    <li className={styles.column} data-pause={pause}>
      <LabCap as="h3">
        {label}
        {pause === APPROVED_TALKING.pause && ' · aprobada'}
      </LabCap>
      <LabStage dots className={styles.stage} innerClassName={styles.inner}>
        <div
          ref={scope}
          className={cx(styles.sprite, shown.hold !== 'none' && styles.held)}
          data-hold={shown.hold}
          aria-hidden="true"
        >
          <SofiSprite animation={shown.animation} style={{ width: '100%' }} />
        </div>
      </LabStage>
      <LabReadout
        rows={[
          ['Ahora', viewName(shown)],
          [
            'Saltos',
            `${changes.length} cambios · ojos ${count('eyes')} · boca ${count('mouth')}`,
          ],
          ['Al empezar', opening ? <ChangeText change={opening} /> : '—'],
        ]}
      />
      {changes.length > 0 ? (
        <ol className={styles.log} aria-label={`Últimos cambios · ${label}`}>
          {changes.slice(0, LISTED).map((change) => (
            <li key={change.id}>
              {viewName(change.from)} → {viewName(change.to)} ·{' '}
              <ChangeText change={change} />
            </li>
          ))}
        </ol>
      ) : (
        <LabNote>Sin cambios todavía.</LabNote>
      )}
    </li>
  )
}

// --- La ficha ---

export function TalkingPausesSpec() {
  const reduced = useReducedMotion()
  const [scale, setScale] = useState<PauseScale>('1')
  const [end, setEnd] = useState<EndPolicy>(APPROVED_TALKING.end)
  const [start, setStart] = useState<StartPolicy>(APPROVED_TALKING.start)
  const [run, setRun] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  // Solo cambia con el estado del texto, no con cada letra: React descarta el mismo valor.
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const phase = run === 0 ? 'before' : phaseOf(status, speaking)
  const factor = Number(scale)
  // Solo en el Lab: `talking` se carga al montar la ficha, para que la primera vez no se compare
  // la reserva estática mientras carga. Cómo se carga en producción lo decide EX3.
  const [talking, setTalking] = useState<'loading' | 'ready' | 'failed'>(() =>
    loadedClassOf('talking') ? 'ready' : 'loading',
  )
  useEffect(() => {
    if (talking !== 'loading') return
    let current = true
    loadSprite('talking').then(
      () => current && setTalking('ready'),
      () => current && setTalking('failed'),
    )
    return () => {
      current = false
    }
  }, [talking])

  const play = () => {
    setStatus('idle')
    setRun((value) => value + 1)
  }

  return (
    <LabSpec
      id="m-pauses"
      kicker="4.12 · Habla"
      title="Pausas de talking"
      desc="Tres versiones de Sofi con el mismo diálogo. Cuando calla en una pausa, una vuelve a sofi-blink y dos se quedan en talking con la boca quieta: congelada donde esté o cerrada. Al empezar a hablar, sofi-blink puede ceder en el acto o esperar a tener los ojos abiertos. Debajo de cada una, los fotogramas de ojos y boca antes y después de cada cambio: un salto es un cambio de fotograma en ese instante."
      codes={
        <>
          <LabCode>onSpeakingChange</LabCode>
          <LabCode>talking · sofi-blink</LabCode>
          <LabProv>
            Aprobado (AV5): boca quieta congelada, blink al terminar, espera al
            parpadeo · producción en T083–T085
          </LabProv>
        </>
      }
    >
      <div className={styles.controls}>
        <SofiSpeech
          className={styles.speech}
          size="md"
          text={SPEECH_TEXTS.long}
          timing={{
            shortPause: DEFAULT_SPEECH_TIMING.shortPause * factor,
            longPause: DEFAULT_SPEECH_TIMING.longPause * factor,
          }}
          playToken={run}
          autoplay={false}
          announce={false}
          onStateChange={(state) => setStatus(state.status)}
          onSpeakingChange={setSpeaking}
        />
        <div className={styles.panel}>
          <Button onClick={play} disabled={talking === 'loading'}>
            Reproducir las tres
          </Button>
          {talking !== 'ready' && (
            <LabNote>
              {talking === 'loading'
                ? 'Cargando talking…'
                : 'talking no se ha cargado: se verá la reserva estática.'}
            </LabNote>
          )}
          <LabChoice
            stacked
            label="Pausas"
            options={SCALE_OPTIONS}
            value={scale}
            onChange={setScale}
          />
          <LabChoice
            stacked
            label="Al empezar a hablar"
            options={START_OPTIONS}
            value={start}
            onChange={setStart}
          />
          <LabChoice
            stacked
            label="Al terminar"
            options={END_OPTIONS}
            value={end}
            onChange={setEnd}
            hint="Aprobado: vuelta a blink (spec §2). «Como en la pausa» solo compara."
          />
        </div>
      </div>
      {reduced && (
        <LabNote className={styles.reduced}>
          Movimiento reducido: el texto aparece entero, Sofi no habla y las tres
          muestran la misma pose fija (AV4).
        </LabNote>
      )}
      <ul className={styles.columns}>
        {PAUSE_OPTIONS.map((option) => (
          <PauseColumn
            key={option.value}
            pause={option.value}
            label={option.label}
            phase={phase}
            end={end}
            start={start}
            run={run}
          />
        ))}
      </ul>
    </LabSpec>
  )
}
