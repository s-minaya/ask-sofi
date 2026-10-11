import { useId, type ReactNode } from 'react'
import { Burst } from '../../ui/Burst/Burst'
import { Badge, ClueList } from '../../ui/Indicators/Indicators'
import { cx } from '../../../utils/cx'
import { ConfidenceMeter } from '../ConfidenceMeter/ConfidenceMeter'
import type {
  ConfidenceLevel,
  ContextLevel,
  InterpretationView,
  LeadTone,
} from '../types'
import styles from './Interpretations.module.scss'

type HeadingLevel = 2 | 3 | 4

function Heading({
  level,
  ...props
}: {
  level: HeadingLevel
  id: string
  className: string
  children: ReactNode
}) {
  const Element = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4'
  return <Element {...props} />
}

// La cifra grande con el signo reducido; el lector la oye como «52 %».
function Figure({ value, className }: { value: number; className: string }) {
  return (
    <p className={className}>
      {Math.round(value)}
      <span className={styles.unit}>%</span>
    </p>
  )
}

type InterpretationLeadProps = {
  interpretation: InterpretationView
  position?: number
  tone?: LeadTone
  // En «Reñido», el porcentaje de la segunda versión para decirlo en el estallido.
  runnerUp?: number
  headingLevel?: HeadingLevel
  className?: string
}

export function InterpretationLead({
  interpretation,
  position = 1,
  tone = 'clear',
  runnerUp,
  headingLevel = 2,
  className,
}: InterpretationLeadProps) {
  const titleId = useId()
  const close = tone === 'close'
  return (
    <article
      className={cx(
        styles.lead,
        close ? styles.close : styles.clear,
        className,
      )}
      aria-labelledby={titleId}
    >
      {close ? (
        <Burst tone="lilac" kicker="Reñido" className={styles.leadBurst}>
          ({Math.round(interpretation.percentage)} contra{' '}
          {Math.round(runnerUp ?? 0)})
        </Burst>
      ) : (
        <Burst kicker="La más probable" className={styles.leadBurst}>
          (no la única)
        </Burst>
      )}
      <p className={styles.kicker}>
        Versión {position}
        {close && ' · empate técnico'}
      </p>
      <Figure value={interpretation.percentage} className={styles.figure} />
      <Heading level={headingLevel} id={titleId} className={styles.leadTitle}>
        {interpretation.title}
      </Heading>
      <p className={styles.leadText}>{interpretation.explanation}</p>
      <ConfidenceMeter
        percentage={interpretation.percentage}
        className={styles.leadMeter}
      />
      {interpretation.clues && interpretation.clues.length > 0 && (
        <ClueList clues={interpretation.clues} className={styles.clues} />
      )}
    </article>
  )
}

type InterpretationListProps = {
  interpretations: ReadonlyArray<InterpretationView>
  // Número de la primera versión de la lista (la 1 suele ir en portada).
  startAt?: number
  headingLevel?: HeadingLevel
  className?: string
}

function VersionItem({
  item,
  position,
  headingLevel,
}: {
  item: InterpretationView
  position: number
  headingLevel: HeadingLevel
}) {
  const titleId = useId()
  return (
    <article className={styles.version} aria-labelledby={titleId}>
      <div className={styles.versionTop}>
        <p className={styles.kicker}>Versión {position}</p>
        <Figure value={item.percentage} className={styles.versionFigure} />
      </div>
      <Heading
        level={headingLevel}
        id={titleId}
        className={styles.versionTitle}
      >
        {item.title}
      </Heading>
      <p className={styles.versionText}>{item.explanation}</p>
      <ConfidenceMeter
        percentage={item.percentage}
        className={styles.versionMeter}
      />
    </article>
  )
}

export function InterpretationList({
  interpretations,
  startAt = 2,
  headingLevel = 2,
  className,
}: InterpretationListProps) {
  return (
    <div className={className}>
      {interpretations.map((item, index) => (
        <VersionItem
          key={item.id}
          item={item}
          position={startAt + index}
          headingLevel={headingLevel}
        />
      ))}
    </div>
  )
}

const CONFIDENCE: Record<ConfidenceLevel, { label: string; pips: number }> = {
  low: { label: 'baja', pips: 1 },
  medium: { label: 'media', pips: 2 },
  high: { label: 'alta', pips: 3 },
}

const CONTEXT: Record<ContextLevel, { label: string; pips: number }> = {
  insufficient: { label: 'insuficiente', pips: 1 },
  partial: { label: 'parcial', pips: 2 },
  sufficient: { label: 'suficiente', pips: 3 },
}

type ReliabilityBadgesProps = {
  confidence?: ConfidenceLevel
  context: ContextLevel
  // Una insignia más, sin cuadritos («Sin porcentajes»).
  note?: string
  className?: string
}

// Cuánta confianza tiene Sofi y cuánto contexto le has dado. El nivel se lee en el texto.
export function ReliabilityBadges({
  confidence,
  context,
  note,
  className,
}: ReliabilityBadgesProps) {
  return (
    <ul
      className={cx(styles.badges, className)}
      aria-label="Fiabilidad de la lectura"
    >
      {confidence && (
        <Badge
          as="li"
          tone="fill"
          pips={{ filled: CONFIDENCE[confidence].pips }}
        >
          Confianza:&nbsp;<strong>{CONFIDENCE[confidence].label}</strong>
        </Badge>
      )}
      <Badge
        as="li"
        tone={context === 'insufficient' ? 'warn' : 'plain'}
        pips={{ filled: CONTEXT[context].pips }}
      >
        Contexto:&nbsp;<strong>{CONTEXT[context].label}</strong>
      </Badge>
      {note && (
        <Badge as="li" tone="plain">
          {note}
        </Badge>
      )}
    </ul>
  )
}
