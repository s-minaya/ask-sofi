import type { Ref } from 'react'
import { ContextInput } from '../../../components/sofi/ContextInput/ContextInput'
import {
  ErrorState,
  type ErrorKind,
} from '../../../components/sofi/ErrorState/ErrorState'
import {
  InterpretationLead,
  InterpretationList,
  ReliabilityBadges,
} from '../../../components/sofi/Interpretations/Interpretations'
import { MessageBubble } from '../../../components/sofi/MessageBubble/MessageBubble'
import {
  contextSummary,
  PROCESSING_LINES,
  ProcessingState,
} from '../../../components/sofi/ProcessingState/ProcessingState'
import {
  ContextQuestions,
  FinePrint,
  MissingData,
  ReadingBoxes,
  SofiAdvice,
} from '../../../components/sofi/ReadingBoxes/ReadingBoxes'
import {
  SofiDialog,
  SofiDialogText,
} from '../../../components/sofi/SofiDialog/SofiDialog'
import { SofiPortrait } from '../../../components/sofi/SofiPortrait/SofiPortrait'
import { SofiSpeech } from '../../../components/sofi/SofiSpeech/SofiSpeech'
import { SofiStage } from '../../../components/sofi/SofiStage/SofiStage'
import type {
  ConfidenceLevel,
  ContextLevel,
  InterpretationView,
  LeadTone,
} from '../../../components/sofi/types'
import { Button } from '../../../components/ui/Button/Button'
import { KickerRow } from '../../../components/ui/Tag/Tag'
import { TextLink } from '../../../components/ui/TextLink/TextLink'
import styles from './ResultScreens.module.scss'

type ProcessingScreenProps = {
  message: string
  context: string
  slow: boolean
  onCancel: () => void
  headingRef?: Ref<HTMLHeadingElement>
}

export function ProcessingScreen({
  message,
  context,
  slow,
  onCancel,
  headingRef,
}: ProcessingScreenProps) {
  return (
    <>
      <SofiStage
        expression="thinking"
        alt="Sofi entrecierra los ojos, concentrada"
        label="Sofi está leyendo"
      >
        <SofiDialog>
          <SofiDialogText>
            {slow ? PROCESSING_LINES.slow : PROCESSING_LINES.normal}
          </SofiDialogText>
        </SofiDialog>
      </SofiStage>
      <ProcessingState
        message={message}
        context={context}
        slow={slow}
        onCancel={onCancel}
        titleRef={headingRef}
      />
    </>
  )
}

export type ReadingView = {
  speech: string
  lead: InterpretationView
  leadTone: LeadTone
  others: ReadonlyArray<InterpretationView>
  confidence: ConfidenceLevel
  context: ContextLevel
  missing: ReadonlyArray<string>
  advice: { title: string; text: string }
}

type ReadingScreenProps = {
  message: string
  reading: ReadingView
  onAddContext: () => void
  onNewQuery: () => void
  onEdit: () => void
  headingRef?: Ref<HTMLHeadingElement>
}

const VERSIONS_ID = 'versiones'
const COUNT_WORDS: Record<number, string> = {
  2: 'Dos',
  3: 'Tres',
  4: 'Cuatro',
  5: 'Cinco',
  6: 'Seis',
}

export function ReadingScreen({
  message,
  reading,
  onAddContext,
  onNewQuery,
  onEdit,
  headingRef,
}: ReadingScreenProps) {
  const total = 1 + reading.others.length
  return (
    <>
      <SofiStage
        expression="talking"
        alt="Sofi, con el veredicto preparado"
        label="Lo que dice Sofi"
      >
        <SofiSpeech
          text={reading.speech}
          doneAction={
            <TextLink href={`#${VERSIONS_ID}`} continues>
              Ver las versiones
            </TextLink>
          }
        />
      </SofiStage>
      <div className={styles.read}>
        <div id={VERSIONS_ID} className={styles.readTop}>
          <div>
            <KickerRow tag="Exclusiva" kicker={`Sobre «${message}»`} />
            <h1 ref={headingRef} tabIndex={-1} className={styles.readTitle}>
              {COUNT_WORDS[total] ?? total} versiones de la historia
            </h1>
          </div>
          <ReliabilityBadges
            confidence={reading.confidence}
            context={reading.context}
          />
        </div>
        <div className={styles.results}>
          <div className={styles.leadWrap}>
            <InterpretationLead
              interpretation={reading.lead}
              tone={reading.leadTone}
              runnerUp={reading.others[0]?.percentage}
            />
          </div>
          <InterpretationList interpretations={reading.others} />
        </div>
        <ReadingBoxes className={styles.boxesWrap}>
          <FinePrint versions={total} />
          {reading.context !== 'sufficient' && reading.missing.length > 0 && (
            <MissingData
              questions={reading.missing}
              onAddContext={onAddContext}
            />
          )}
          <SofiAdvice title={reading.advice.title} text={reading.advice.text} />
        </ReadingBoxes>
        <div className={styles.links}>
          <TextLink onClick={onNewQuery}>Nueva consulta</TextLink>
          <TextLink onClick={onEdit}>Editar mensaje y contexto</TextLink>
        </div>
      </div>
    </>
  )
}

type NeedsContextScreenProps = {
  speech: string
  message: string
  questions: ReadonlyArray<string>
  context: string
  onContextChange: (value: string) => void
  onReread: () => void
  contextError: boolean
  headingRef?: Ref<HTMLHeadingElement>
}

const NEEDS_ID = 'que-falta'

// Pedir contexto no es un error: Sofi lo dice, enseña lo único que tiene y no inventa porcentajes.
export function NeedsContextScreen({
  speech,
  message,
  questions,
  context,
  onContextChange,
  onReread,
  contextError,
  headingRef,
}: NeedsContextScreenProps) {
  return (
    <>
      <SofiStage
        expression="unconvinced"
        alt="Sofi entrecierra los ojos, poco convencida"
        label="Lo que dice Sofi"
      >
        <SofiSpeech
          text={speech}
          doneAction={
            <TextLink href={`#${NEEDS_ID}`} continues>
              Qué me falta
            </TextLink>
          }
        />
      </SofiStage>
      <div id={NEEDS_ID} className={styles.needs}>
        <div>
          <KickerRow
            tag="Última hora"
            tagTone="pink"
            kicker="Lectura en pausa"
          />
          <h1 ref={headingRef} tabIndex={-1} className={styles.needsTitle}>
            ¡Falta el salseo!
          </h1>
          <p className={styles.needsText}>
            Sin contexto, cualquier porcentaje sería inventado. Y aquí no
            inventamos.
          </p>
          <ReliabilityBadges
            context="insufficient"
            note="Sin porcentajes"
            className={styles.needsBadges}
          />
          <p className={`${styles.kickerMuted} ${styles.only}`}>
            Lo único que tengo
          </p>
          <MessageBubble message={message} size="lg" />
        </div>
        <div>
          <ContextQuestions
            questions={questions}
            className={styles.questions}
          />
          <ContextInput
            id="contexto-pedido"
            label="Y ahora, el salseo"
            labelPlacement="inside"
            value={context}
            onChange={onContextChange}
            hints={['¿Qué pasó antes?', '¿Cómo suele escribirte?']}
            showCount={false}
            error={
              contextError
                ? 'Cuéntame algo del contexto para poder leerlo de nuevo.'
                : undefined
            }
            className={styles.coupon}
          />
          <div className={styles.reread}>
            <Button fluid arrow onClick={onReread}>
              Volver a leer
            </Button>
          </div>
          <p className={styles.rereadNote}>
            Pedir contexto también es una respuesta. Y a veces, la mejor.
          </p>
        </div>
      </div>
    </>
  )
}

type ErrorScreenProps = {
  kind?: ErrorKind
  message: string
  context: string
  onRetry: () => void
  onEdit: () => void
  headingRef?: Ref<HTMLHeadingElement>
}

export function ErrorScreen({
  kind,
  message,
  context,
  onRetry,
  onEdit,
  headingRef,
}: ErrorScreenProps) {
  return (
    <div className={styles.err}>
      <SofiPortrait
        size={192}
        expression="oops"
        alt="Sofi cierra los ojos: algo ha fallado"
        className={styles.errPortrait}
        // Sofi entera, con el busto apoyado en el borde (decisión 6 de la
        // dirección artística): a la mitad del sprite, su silueta cabe sin recortes.
        crop={{
          width: 155,
          height: 190,
          offsetX: 20,
          offsetY: 7,
          background: 'var(--tone-white)',
          frame: 'sticker',
        }}
      />
      <div className={styles.errMain}>
        <ErrorState
          kind={kind}
          titleAs="h1"
          titleRef={headingRef}
          announce
          onRetry={onRetry}
          onEdit={onEdit}
        />
        <div className={styles.errSummary}>
          <p className={styles.kickerMuted}>Tu consulta sigue aquí</p>
          <MessageBubble message={message} />
          <p className={styles.count}>{contextSummary(context)}</p>
        </div>
      </div>
    </div>
  )
}
