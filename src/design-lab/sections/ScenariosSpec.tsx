import { useReducer, useState } from 'react'
import { SofiSprite } from '../../components/sofi/SofiSprite/SofiSprite'
import { STILL_HERE_IDLE_MS } from '../../components/sofi/useSofiController'
import {
  createAmbient,
  type GagId,
  type SceneCause,
} from '../../components/sofi/visual/ambient'
import { Button } from '../../components/ui/Button/Button'
import { cx } from '../../utils/cx'
import { formatDuration } from '../foundationsData'
import { observeAmbient, type AmbientEvent } from '../observeAmbient'
import {
  LabCap,
  LabCheck,
  LabCode,
  LabNote,
  LabPlaceholder,
  LabProv,
  LabReadout,
  LabRow,
  LabSpec,
  LabStage,
  LabSub,
} from '../parts/LabParts'
import {
  createScenarioState,
  intentLabel,
  intentOf,
  isCalm,
  scenarioReducer,
  type ScenarioAction,
} from '../scenarioLab'
import { GagHost } from './GagHost'
import styles from './ScenariosSpec.module.scss'

// Inactividad de la demostración: lo bastante corta para verla sin esperar. No es el valor del
// plan (150 000 ms provisionales, que aprueba AV6): solo hace visible el paso a «dormida».
export const GAG_IDLE_DEMO_MS = 5_000

type Event = { label: string; action: ScenarioAction }

const GROUPS: ReadonlyArray<{ title: string; events: ReadonlyArray<Event> }> = [
  {
    title: 'Habla (SofiSpeech)',
    events: [
      {
        label: 'Empieza a hablar',
        action: { type: 'speaking', value: true },
      },
      { label: 'Pausa', action: { type: 'speaking', value: false } },
      { label: 'Ver todo', action: { type: 'show-all' } },
    ],
  },
  {
    title: 'Petición y resultado',
    events: [
      { label: 'Petición pendiente', action: { type: 'request-pending' } },
      {
        label: 'Falta de contexto',
        action: { type: 'request-done', outcome: 'needs_context' },
      },
      {
        label: 'Error técnico',
        action: { type: 'request-done', outcome: 'error' },
      },
      {
        label: 'Interpretada sin señales',
        action: { type: 'request-done', outcome: 'interpreted-none' },
      },
      {
        label: 'Interpretada · eureka',
        action: { type: 'request-done', outcome: 'interpreted-eureka' },
      },
      {
        label: 'Interpretada · suspicious',
        action: { type: 'request-done', outcome: 'interpreted-suspicious' },
      },
    ],
  },
  {
    title: 'Acciones de la persona',
    events: [
      { label: '«No sé más»', action: { type: 'dont-know' } },
      { label: 'Favorito guardado', action: { type: 'favorite-saved' } },
    ],
  },
  {
    title: 'Seguridad y privacidad',
    events: [
      {
        label: 'Borrado efectivo',
        action: { type: 'wipe', signal: 'data-erased' },
      },
      {
        label: 'Fin de la confirmación',
        action: { type: 'wipe', signal: 'confirmation-ended' },
      },
      { label: 'Salida rápida', action: { type: 'quick-exit' } },
      {
        label: 'safety_concern',
        action: { type: 'safety', value: 'concern' },
      },
      {
        label: 'Seguridad no evaluada',
        action: { type: 'safety', value: 'evaluation_unavailable' },
      },
      {
        label: 'Seguridad resuelta',
        action: { type: 'safety', value: undefined },
      },
    ],
  },
]

const SEQUENCES = [
  ['blink → talking → blink', 'Empieza a hablar, Pausa'],
  ['processing → resultado', 'Petición pendiente, un resultado'],
  ['needs-context → uncertain', 'Petición, Falta de contexto, «No sé más»'],
  ['favoriting → blink', 'Favorito guardado'],
  ['memory-wipe → neutral', 'Borrado efectivo, Fin de la confirmación'],
] as const

const CAUSES: ReadonlyArray<{ cause: SceneCause; label: string }> = [
  { cause: 'busy', label: 'Sofi ocupada' },
  { cause: 'interaction', label: 'Escritura o controles' },
  { cause: 'sensitive', label: 'Estado sensible' },
  { cause: 'hidden', label: 'Pestaña oculta' },
]

const GAGS: ReadonlyArray<{ kind: GagId; hint: string }> = [
  { kind: 'poking', hint: 'Pincha varias veces seguidas.' },
  { kind: 'i-see-you', hint: 'Pasa el puntero por encima y reacciona.' },
  {
    kind: 'are-u-still-here',
    hint: `Quieta ${formatDuration(GAG_IDLE_DEMO_MS)}: se duerme. Con actividad, despierta.`,
  },
]

const intentText = (label: string) =>
  label === 'sobria'
    ? 'Representación sobria y estática (seguridad no evaluada). Sin diseño todavía.'
    : 'Sin sprite ni animación (seguridad o salida rápida).'

export function ScenariosSpec() {
  const [state, dispatch] = useReducer(
    scenarioReducer,
    undefined,
    createScenarioState,
  )
  const intent = intentOf(state)
  const label = intentLabel(intent)
  const calm = isCalm(intent)

  return (
    <LabSpec
      id="m-scenarios"
      kicker="4.6 · Escenarios"
      title="Escenarios y secuencias"
      desc="Cada botón emite una señal del contrato, como lo harán 007 y 009, y lo que se ve lo decide selectVisual. Prueba las secuencias entre recursos, las prioridades de seguridad y cómo los gags se cancelan, se pausan y se turnan."
      codes={
        <>
          <LabCode>selectVisual</LabCode>
          <LabCode>wipeAfter</LabCode>
          <LabCode>visual/ambient</LabCode>
          <LabProv>Simulación local</LabProv>
        </>
      }
    >
      <div className={styles.layout}>
        <div className={styles.visual}>
          <LabStage dots className={styles.stage} innerClassName={styles.inner}>
            <div className={styles.box} data-stage data-intent={label}>
              {intent.kind === 'animation' ? (
                <SofiSprite
                  animation={intent.id}
                  style={{ width: '100%' }}
                  onEnd={() =>
                    dispatch({ type: 'one-pass-ended', id: intent.id })
                  }
                />
              ) : (
                <LabPlaceholder>{intentText(label)}</LabPlaceholder>
              )}
            </div>
          </LabStage>
          <LabReadout
            rows={[
              ['Representación', label],
              ['Secuencia', state.history.join(' › ')],
              ['Escena tranquila', calm ? 'sí' : 'no'],
            ]}
          />
          <LabNote>
            Simulación local del contrato: el Lab no guarda ni borra nada, no
            envía ninguna petición y no infiere ningún resultado. El tono de
            eureka y suspicious lo eliges tú: la regla que lo decide es de 006.
          </LabNote>
        </div>

        <div className={styles.panel}>
          {GROUPS.map((group) => (
            <div key={group.title} className={styles.group}>
              <LabSub>{group.title}</LabSub>
              <LabRow>
                {group.events.map((event) => (
                  <Button
                    key={event.label}
                    variant="secondary"
                    size="sm"
                    onClick={() => dispatch(event.action)}
                  >
                    {event.label}
                  </Button>
                ))}
              </LabRow>
            </div>
          ))}
          <LabRow>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch({ type: 'reset' })}
            >
              Reiniciar escena
            </Button>
          </LabRow>
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <LabCap as="h3">Secuencias</LabCap>
          <ul className={styles.sequences}>
            {SEQUENCES.map(([name, how]) => (
              <li key={name}>
                <LabCode>{name}</LabCode>
                <span>{how}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <LabCap as="h3">Registro de la escena</LabCap>
          <ol aria-label="Registro de la escena" className={styles.log}>
            {state.log.map((entry) => (
              <li key={entry.id}>
                <span>{entry.id}</span>
                <span>{entry.text}</span>
              </li>
            ))}
          </ol>
          {state.log.length === 0 && (
            <LabNote>Pulsa un evento para empezar.</LabNote>
          )}
        </div>
      </div>

      <GagBoard calm={calm} />
    </LabSpec>
  )
}

type GagLog = {
  active: GagId | null
  entries: Array<{ id: number; text: string }>
  nextId: number
}

const GAG_LOG_LIMIT = 30

function gagReducer(state: GagLog, event: AmbientEvent): GagLog {
  const text = (() => {
    switch (event.kind) {
      case 'activate':
        return event.accepted
          ? `${event.gag} se activa`
          : `${event.gag} no puede activarse: ya hay otro gag activo`
      case 'deactivate':
        return state.active === event.gag
          ? `${event.gag} vuelve al reposo`
          : undefined
      case 'pause':
        return `${event.gag} en pausa`
      case 'resume':
        return `${event.gag} reanuda`
    }
  })()
  const active =
    event.kind === 'activate' && event.accepted
      ? event.gag
      : event.kind === 'deactivate' && state.active === event.gag
        ? null
        : state.active
  if (text === undefined) return { ...state, active }
  return {
    active,
    nextId: state.nextId + 1,
    entries: [...state.entries, { id: state.nextId, text }].slice(
      -GAG_LOG_LIMIT,
    ),
  }
}

// Los tres controladores reales comparten un `ambient`: un solo gag activo y las causas de pausa
// agregadas son las de producción. Solo hay gags en una escena tranquila (catálogo §6.1).
function GagBoard({ calm }: { calm: boolean }) {
  const [gags, report] = useReducer(gagReducer, {
    active: null,
    entries: [],
    nextId: 1,
  })
  const [ambient] = useState(() => observeAmbient(createAmbient(), report))
  const [causes, setCauses] = useState<ReadonlySet<SceneCause>>(new Set())

  const toggle = (cause: SceneCause, active: boolean) => {
    ambient.setCause(cause, active)
    setCauses((current) => {
      const next = new Set(current)
      if (active) next.add(cause)
      else next.delete(cause)
      return next
    })
  }

  return (
    <div className={styles.gagBoard}>
      <LabSub>Gags y prioridades</LabSub>
      <LabNote>
        Solo en una escena tranquila: cualquier otra representación o prioridad
        los cancela. Con movimiento reducido no hay controladores. La
        inactividad de la demostración es de {formatDuration(GAG_IDLE_DEMO_MS)};
        la provisional del plan es de {formatDuration(STILL_HERE_IDLE_MS)}{' '}
        (AV6).
      </LabNote>
      <ul className={styles.gags}>
        {GAGS.map(({ kind, hint }) => (
          <li key={kind} className={cx(styles.gag, !calm && styles.gagOff)}>
            <div className={styles.gagHost}>
              <GagHost
                kind={kind}
                ambient={ambient}
                calm={calm}
                idleAfter={GAG_IDLE_DEMO_MS}
              />
            </div>
            <LabCap>{kind}</LabCap>
            <p className={styles.hint}>{hint}</p>
          </li>
        ))}
      </ul>
      <div className={styles.row}>
        <div
          role="group"
          aria-label="Causas de pausa"
          className={styles.causes}
        >
          {CAUSES.map(({ cause, label }) => (
            <LabCheck
              key={cause}
              label={label}
              checked={causes.has(cause)}
              onChange={(active) => toggle(cause, active)}
            />
          ))}
        </div>
        <div>
          <LabReadout rows={[['Gag activo', gags.active ?? 'ninguno']]} />
          <ol aria-label="Registro de los gags" className={styles.log}>
            {gags.entries.map((entry) => (
              <li key={entry.id}>
                <span>{entry.id}</span>
                <span>{entry.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
