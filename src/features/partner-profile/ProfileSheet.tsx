import { useEffect, useRef, useState, type Ref } from 'react'
import { SofiPortrait } from '../../components/sofi/SofiPortrait/SofiPortrait'
import { SofiSpeech } from '../../components/sofi/SofiSpeech/SofiSpeech'
import { Button } from '../../components/ui/Button/Button'
import { FieldMessage } from '../../components/ui/FieldMessage/FieldMessage'
import { LockIcon } from '../../components/ui/icons/icons'
import {
  InlineNotice,
  Notice,
  NoticeActions,
  NoticeText,
} from '../../components/ui/Notice/Notice'
import { OptionGroup } from '../../components/ui/OptionGroup/OptionGroup'
import { Tag } from '../../components/ui/Tag/Tag'
import { TextArea } from '../../components/ui/TextField/TextField'
import { TextLink } from '../../components/ui/TextLink/TextLink'
import {
  AREA_ANSWERS,
  NOTES_MAX_LENGTH,
  PROFILE_AREAS,
  isProfileComplete,
  type PartnerProfile,
  type ProfileAnswer,
  type ProfileArea,
} from '../../domain/partner-profile/partnerProfile'
import { useInViewport } from '../../hooks/useInViewport'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { AREA_COPY, MOOD_ALT, SHEET_COPY, answerLabel } from './profileCopy'
import styles from './ProfileSheet.module.scss'
import { moodOf, type GuideState, type ReactionCause } from './sofiGuide'
import { visualFor } from './sofiVisuals'

export const DELETE_ID = 'expediente-eliminar'
// El salto de «Guardar» al completar las seis áreas dura lo que
// `--duration-celebrate`.
export const CELEBRATE_MS = 600
// Sin desplazarse este tiempo, «Guardar» se da por visto: ni la indicación
// parpadea ni el salto se gasta mientras la página lo atraviesa en un
// desplazamiento suave.
export const SETTLE_MS = 150
const SAVE_ERROR_ID = 'expediente-guardar-error'
const HIDDEN = { visibility: 'hidden' } as const

export type SheetNotice = 'saved' | 'memory' | null
export type SheetError = 'empty' | 'notes-too-long' | null

// Guardar, descartar y eliminar (T023–T024): sin ellas, la ficha solo se edita.
export type SheetManagement = {
  hasSaved: boolean
  dirty: boolean
  notice: SheetNotice
  error: SheetError
  confirmRef?: Ref<HTMLHeadingElement>
  onSave: () => void
  onDiscard: () => void
  onRequestDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

type ProfileSheetProps = {
  draft: PartnerProfile
  guide: GuideState
  headingRef?: Ref<HTMLHeadingElement>
  onBack: () => void
  onSelectArea: (area: ProfileArea) => void
  onAnswer: (answer: ProfileAnswer) => void
  onClearAnswer: () => void
  onSpeechEnded: () => void
  onNotesChange: (notes: string) => void
  // El salto de «Guardar» al completar las seis áreas ya se ha dado.
  onCelebrationEnd?: () => void
  // Comentarios de las reacciones breves (T020). Sin ellos, Sofi no comenta
  // y el bocadillo no reserva su hueco.
  comments?: Record<ReactionCause, string>
  management?: SheetManagement
}

// Ficha única: la pregunta activa y sus respuestas en el bocadillo de Sofi, y el
// acceso directo a las seis áreas. Nada avanza solo y nada va fijo:
// - Una columna: Sofi compacta (192 px, la mitad exacta del sprite) sobre su
//   bocadillo; todo se desplaza junto y el bocadillo no se corta.
// - Desde 1080 px, como la consulta: Sofi a 384 px con su bocadillo debajo, a la
//   izquierda; las seis áreas y las notas, a la derecha.
export function ProfileSheet({
  draft,
  guide,
  headingRef,
  onBack,
  onSelectArea,
  onAnswer,
  onClearAnswer,
  onSpeechEnded,
  onNotesChange,
  onCelebrationEnd,
  comments,
  management,
}: ProfileSheetProps) {
  const reducedMotion = useReducedMotion()
  const area = guide.area
  const copy = AREA_COPY[area]
  const index = PROFILE_AREAS.indexOf(area)
  const next = PROFILE_AREAS[index + 1]
  const answer = draft.answers[area]
  const mood = moodOf(guide)
  const visual = visualFor(mood, { reducedMotion })
  const comment =
    comments && guide.reaction ? comments[guide.reaction.cause] : ''
  const answersRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLElement>(null)
  const commentTexts = comments ? [...new Set(Object.values(comments))] : []

  // «Guardar» queda fuera de la pantalla en portátiles bajos y en móvil (la barra
  // fija solo se fija al llegar a las notas). Con las seis áreas y algo sin
  // guardar, el diálogo ofrece ir a él; el salto de «Guardar» espera a que se vea.
  // Nada se desplaza ni se guarda solo: ir a «Guardar» es una acción explícita.
  const saveBoxRef = useRef<HTMLDivElement>(null)
  const saveRef = useRef<HTMLButtonElement>(null)
  const saveVisible = useInViewport(saveBoxRef, { settleMs: SETTLE_MS })
  const pending = management !== undefined && management.dirty
  const showGoSave = pending && isProfileComplete(draft) && !saveVisible
  const celebrating = pending && guide.celebration && saveVisible
  const celebrationEnd = useRef(onCelebrationEnd)
  useEffect(() => {
    celebrationEnd.current = onCelebrationEnd
  })

  // Dura una vez, lo que `--duration-celebrate`. Si «Guardar» sale de la pantalla
  // antes, se cancela y queda debido: no se da por visto.
  useEffect(() => {
    if (!celebrating) return
    const timer = window.setTimeout(
      () => celebrationEnd.current?.(),
      CELEBRATE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [celebrating])

  const goToSave = () => {
    const button = saveRef.current
    if (!button) return
    button.scrollIntoView({
      block: 'center',
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
    button.focus({ preventScroll: true })
  }
  const goSaveShown = showGoSave && !comment
  // El bocadillo se rehace al cambiar de pregunta y con él sus controles: el
  // foco, si estaba dentro, se pierde. Cada cambio de pregunta lo recoloca.
  // - Desde el índice: a las respuestas (a la marcada, si la hay). La pregunta
  //   entonces la dice el grupo, cuya leyenda la incluye, y la región de
  //   anuncios se calla en ese cambio para que no se oiga dos veces.
  // - Con «Siguiente pregunta»: al mismo enlace de la pregunta nueva, para poder
  //   seguir pasando; ahí la región sí anuncia la pregunta.
  const [focusRequest, setFocusRequest] = useState({
    id: 0,
    to: 'answers' as 'answers' | 'next',
  })
  const [byIndex, setByIndex] = useState(false)

  useEffect(() => {
    if (focusRequest.id === 0) return
    const stage = stageRef.current
    const root = answersRef.current
    if (!stage || !root) return
    const first =
      root.querySelector<HTMLElement>('input:checked') ??
      root.querySelector<HTMLElement>('input')
    const nextLink = [...root.querySelectorAll<HTMLElement>('button')].find(
      (button) => button.textContent?.includes(SHEET_COPY.next),
    )
    const target = focusRequest.to === 'next' ? (nextLink ?? first) : first
    if (!target) return
    // El radio nativo mide 1 px: lo que se ve y debe caber en la pantalla es su
    // etiqueta.
    const visible = target.closest('label') ?? target
    const outside = () => {
      const { top, bottom } = visible.getBoundingClientRect()
      return top < 0 || bottom > window.innerHeight
    }
    // Desde el índice, si la pregunta ha quedado por encima de la pantalla o sus
    // respuestas por debajo, el escenario entero se trae a la vista. Salto
    // instantáneo: es lo esperado al pulsar un enlace de navegación y una
    // animación competiría con el desplazamiento del propio foco.
    if (
      focusRequest.to === 'answers' &&
      (stage.getBoundingClientRect().top < 0 || outside())
    )
      stage.scrollIntoView({ block: 'start', behavior: 'auto' })
    // Sin el desplazamiento por defecto del foco, que centra el destino: solo el
    // mínimo para que se vea.
    target.focus({ preventScroll: true })
    if (outside())
      visible.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }, [focusRequest])

  const changeArea = (target: ProfileArea, to: 'answers' | 'next') => {
    setByIndex(to === 'answers')
    onSelectArea(target)
    setFocusRequest((request) => ({ id: request.id + 1, to }))
  }

  const clearAnswer = () => {
    onClearAnswer()
    answersRef.current?.querySelector<HTMLInputElement>('input')?.focus()
  }

  const answers = (
    <div ref={answersRef} className={styles.answers}>
      <OptionGroup
        grid
        legend={
          <span className={styles.legend}>
            <span aria-hidden="true">
              <Tag>
                {index + 1} / {PROFILE_AREAS.length}
              </Tag>
            </span>
            <span className={styles.srOnly}>
              Pregunta {index + 1} de {PROFILE_AREAS.length}:{' '}
            </span>
            {copy.label}
            {/* El grupo se explica solo: área, pregunta y opciones, estén donde estén. */}
            <span className={styles.srOnly}>. {copy.question}</span>
          </span>
        }
        options={AREA_ANSWERS[area].map((value) => ({
          value,
          label: answerLabel(area, value),
        }))}
        value={answer}
        onChange={onAnswer}
      />
      <div className={styles.answerTools}>
        <span
          style={answer === undefined ? HIDDEN : undefined}
          inert={answer === undefined}
        >
          <TextLink size="sm" onClick={clearAnswer}>
            {SHEET_COPY.clear}
          </TextLink>
        </span>
        {next && (
          <TextLink
            size="sm"
            continues
            onClick={() => changeArea(next, 'next')}
          >
            {SHEET_COPY.next}
          </TextLink>
        )}
      </div>
    </div>
  )

  return (
    <div className={styles.sheet}>
      <h1 ref={headingRef} tabIndex={-1} className={styles.srOnly}>
        {SHEET_COPY.title}
      </h1>
      <div className={styles.back}>
        <Button
          variant="secondary"
          size="sm"
          icon={<span aria-hidden="true">←</span>}
          onClick={onBack}
        >
          {SHEET_COPY.back}
        </Button>
      </div>
      <div className={styles.layout}>
        <section
          ref={stageRef}
          className={styles.stage}
          aria-label="La pregunta de Sofi"
        >
          <div className={styles.sofi}>
            <SofiPortrait
              size={384}
              frame={visual.kind === 'image' ? visual.fallback : visual.frame}
              image={visual.kind === 'image' ? visual.src : undefined}
              alt={MOOD_ALT[mood]}
              outline
              style={{ width: 'var(--sofi-size)', height: 'var(--sofi-size)' }}
            />
          </div>
          <SofiSpeech
            size="md"
            text={copy.question}
            playToken={guide.speech.id}
            revealed={!guide.speech.speaking}
            announce={!byIndex}
            onStateChange={(state) => {
              if (state.status === 'done') onSpeechEnded()
            }}
            body={answers}
            className={styles.speech}
            doneAction={
              (comments || management) && (
                // Misma celda: el comentario de la reacción y, cuando acaba, la
                // indicación que lo sustituye. El pie no cambia de alto.
                <span className={styles.footStack}>
                  <span className={styles.comment} aria-hidden="true">
                    {commentTexts.map((text) => (
                      <span
                        key={text}
                        style={text === comment ? undefined : HIDDEN}
                      >
                        {text}
                      </span>
                    ))}
                  </span>
                  <span
                    style={goSaveShown ? undefined : HIDDEN}
                    inert={!goSaveShown}
                  >
                    <TextLink size="sm" continues onClick={goToSave}>
                      {SHEET_COPY.goSave}
                    </TextLink>
                  </span>
                </span>
              )
            }
          />
          {comments && (
            <p className={styles.srOnly} role="status">
              {comment}
            </p>
          )}
        </section>

        <div className={styles.work}>
          <nav aria-labelledby="expediente-areas">
            <h2 id="expediente-areas" className={styles.blockTitle}>
              {SHEET_COPY.index}
            </h2>
            <ol className={styles.areas}>
              {PROFILE_AREAS.map((item, position) => {
                const value = draft.answers[item]
                return (
                  <li key={item}>
                    <button
                      type="button"
                      className={styles.area}
                      aria-current={item === area ? 'true' : undefined}
                      onClick={() => changeArea(item, 'answers')}
                    >
                      <span className={styles.areaNum} aria-hidden="true">
                        {String(position + 1).padStart(2, '0')}
                      </span>
                      <span className={styles.areaLabel}>
                        {AREA_COPY[item].label}
                      </span>
                      <span className={styles.areaAnswer}>
                        {[undefined, ...AREA_ANSWERS[item]].map((option) => (
                          <span
                            key={option ?? 'unanswered'}
                            className={
                              option === undefined
                                ? styles.unanswered
                                : undefined
                            }
                            style={option === value ? undefined : HIDDEN}
                          >
                            {option === undefined
                              ? SHEET_COPY.unanswered
                              : answerLabel(item, option)}
                          </span>
                        ))}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>

          <section
            className={styles.notes}
            aria-label={management ? 'Notas y guardado' : 'Notas adicionales'}
          >
            <TextArea
              label={SHEET_COPY.notesLabel}
              help={SHEET_COPY.notesHelp}
              value={draft.notes}
              onChange={onNotesChange}
              showCount
              maxCount={NOTES_MAX_LENGTH}
              rows={4}
              error={
                management?.error === 'notes-too-long'
                  ? SHEET_COPY.notesTooLong
                  : undefined
              }
            />
            <p className={styles.privacy}>
              <LockIcon size={16} />
              <span>{SHEET_COPY.privacy}</span>
            </p>
            {management && (
              <Management
                management={management}
                guide={guide}
                onBack={onBack}
                saveRef={saveRef}
                saveBoxRef={saveBoxRef}
                celebrating={celebrating}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

// La gestión de ProfileSheet, igual: guardar, descartar, avisos y eliminación.
function Management({
  management,
  guide,
  onBack,
  saveRef,
  saveBoxRef,
  celebrating,
}: {
  management: SheetManagement
  guide: GuideState
  onBack: () => void
  saveRef: Ref<HTMLButtonElement>
  saveBoxRef: Ref<HTMLDivElement>
  celebrating: boolean
}) {
  const { notice, error, dirty, hasSaved } = management
  // Qué toca hacer ahora, sin forzar nada: completar las seis áreas no guarda,
  // y guardar (también una ficha parcial o solo en memoria) deja como siguiente
  // paso volver. El rosa de la pegatina acompaña a ese paso: pasa de «Guardar» a
  // «Volver a la consulta» cuando ya no hay nada pendiente.
  const done = notice !== null && !dirty
  return (
    <>
      <div className={styles.actionRow}>
        <div
          className={styles.actions}
          data-celebrating={celebrating || undefined}
        >
          <div
            ref={saveBoxRef}
            className={styles.save}
            data-done={done || undefined}
          >
            <Button
              ref={saveRef}
              size={done ? 'sm' : 'lg'}
              variant={done ? 'secondary' : 'primary'}
              onClick={management.onSave}
              aria-describedby={error === 'empty' ? SAVE_ERROR_ID : undefined}
            >
              {SHEET_COPY.save}
            </Button>
          </div>
          {done && (
            <div className={styles.next}>
              <Button
                size="lg"
                icon={<span aria-hidden="true">←</span>}
                onClick={onBack}
              >
                {SHEET_COPY.back}
              </Button>
            </div>
          )}
        </div>
        {dirty && (
          <p className={styles.discard}>
            <TextLink onClick={management.onDiscard}>
              {SHEET_COPY.discard}
            </TextLink>
          </p>
        )}
      </div>
      {notice && (
        <InlineNotice
          role="status"
          tone={notice === 'saved' ? 'plain' : 'attention'}
          icon={notice === 'saved' ? <LockIcon size={18} /> : undefined}
          className={styles.status}
        >
          <span>
            {notice === 'saved'
              ? SHEET_COPY.savedNotice
              : SHEET_COPY.memoryNotice}
          </span>
        </InlineNotice>
      )}
      {error === 'empty' && (
        <FieldMessage id={SAVE_ERROR_ID} announce className={styles.status}>
          {SHEET_COPY.empty}
        </FieldMessage>
      )}
      {hasSaved && (
        <div className={styles.deleteZone}>
          {guide.confirmingDelete ? (
            <Notice
              tone="danger"
              title={SHEET_COPY.confirmTitle}
              titleRef={management.confirmRef}
            >
              <NoticeText>{SHEET_COPY.confirmText}</NoticeText>
              <NoticeActions>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={management.onConfirmDelete}
                >
                  {SHEET_COPY.confirm}
                </Button>
                <TextLink size="sm" onClick={management.onCancelDelete}>
                  {SHEET_COPY.cancel}
                </TextLink>
              </NoticeActions>
            </Notice>
          ) : (
            <TextLink
              id={DELETE_ID}
              size="sm"
              onClick={management.onRequestDelete}
            >
              {SHEET_COPY.delete}
            </TextLink>
          )}
        </div>
      )}
    </>
  )
}
