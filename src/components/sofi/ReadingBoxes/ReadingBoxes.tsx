import { useId, type ReactNode } from 'react'
import { Button } from '../../ui/Button/Button'
import { Notice } from '../../ui/Notice/Notice'
import { cx } from '../../../utils/cx'
import styles from './ReadingBoxes.module.scss'

type HeadingLevel = 2 | 3 | 4

function Title({
  level,
  id,
  children,
}: {
  level: HeadingLevel
  id: string
  children: ReactNode
}) {
  const Element = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4'
  return (
    <Element id={id} className={styles.title}>
      {children}
    </Element>
  )
}

// Las tres cajas que cierran cada lectura, de color fijo en cualquier tema.
export function ReadingBoxes({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cx(styles.boxes, className)}>{children}</div>
}

const NUMBER_WORDS = [
  '',
  'una',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
]

type FinePrintProps = { versions: number; headingLevel?: HeadingLevel }

export function FinePrint({ versions, headingLevel = 2 }: FinePrintProps) {
  const titleId = useId()
  const count = NUMBER_WORDS[versions] ?? String(versions)
  return (
    <section className={styles.finePrint} aria-labelledby={titleId}>
      <p className={styles.kicker}>Atención</p>
      <Title level={headingLevel} id={titleId}>
        La letra pequeña{' '}
        <span className={styles.aside}>(que aquí no es pequeña)</span>
      </Title>
      <p className={styles.text}>
        Los porcentajes reparten el apoyo entre estas {count} versiones según lo
        que me has contado. No miden lo que siente tu pareja y no son una
        certeza.
      </p>
    </section>
  )
}

type MissingDataProps = {
  questions: ReadonlyArray<string>
  onAddContext: () => void
  kicker?: string
  title?: string
  headingLevel?: HeadingLevel
}

export function MissingData({
  questions,
  onAddContext,
  kicker = 'Contexto parcial',
  title = 'Me falta un dato (o dos)',
  headingLevel = 2,
}: MissingDataProps) {
  const titleId = useId()
  return (
    <section className={styles.missing} aria-labelledby={titleId}>
      <p className={styles.kicker}>{kicker}</p>
      <Title level={headingLevel} id={titleId}>
        {title}
      </Title>
      <ul className={styles.rows}>
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
      <Button size="sm" arrow className={styles.action} onClick={onAddContext}>
        Añadir contexto
      </Button>
    </section>
  )
}

type SofiAdviceProps = {
  title: string
  text: string
  headingLevel?: HeadingLevel
}

export function SofiAdvice({ title, text, headingLevel = 2 }: SofiAdviceProps) {
  const titleId = useId()
  return (
    <section className={styles.advice} aria-labelledby={titleId}>
      <p className={styles.kicker}>El consejo de Sofi</p>
      <Title level={headingLevel} id={titleId}>
        {title}
      </Title>
      <p className={styles.text}>{text}</p>
    </section>
  )
}

type ContextQuestionsProps = {
  questions: ReadonlyArray<string>
  title?: string
  headingLevel?: 2 | 3 | 4
  className?: string
}

// Lo que Sofi necesita saber cuando el contexto no basta.
export function ContextQuestions({
  questions,
  title = 'Cuéntame esto',
  headingLevel = 2,
  className,
}: ContextQuestionsProps) {
  const Level = headingLevel === 2 ? 'h2' : headingLevel === 3 ? 'h3' : 'h4'
  return (
    <Notice
      tone="attention"
      title={title}
      titleAs={Level}
      titleClassName={styles.questionsTitle}
      className={cx(styles.questions, className)}
    >
      <ol className={styles.questionList}>
        {questions.map((question, index) => (
          <li key={question}>
            <span className={styles.questionNum}>
              {String(index + 1).padStart(2, '0')}
            </span>
            {question}
          </li>
        ))}
      </ol>
    </Notice>
  )
}
