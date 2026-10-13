import { useEffect, useRef, useState, type RefObject } from 'react'
import { SiteHeader } from '../../components/layout/SiteHeader/SiteHeader'
import {
  clearAnswer,
  EMPTY_PARTNER_PROFILE,
  isProfileComplete,
  prepareProfileForSave,
  setAnswer,
  setNotes,
  type PartnerProfile,
  type ProfileAnswer,
} from '../../domain/partner-profile/partnerProfile'
import { ConsultationScreen } from '../../features/consultation/screens/ConsultationScreen'
import { REACTION_COMMENTS } from '../../features/partner-profile/profileCopy'
import {
  ProfileSheet,
  type SheetError,
  type SheetNotice,
} from '../../features/partner-profile/ProfileSheet'
import {
  guideReducer,
  openGuide,
  type GuideState,
} from '../../features/partner-profile/sofiGuide'
import { useDeleteConfirmationFocus } from '../../features/partner-profile/useDeleteConfirmationFocus'
import { useSofiGuide } from '../../features/partner-profile/useSofiGuide'
import { useSound } from '../../hooks/useSound'
import type { ProfilePreset } from './profilePresets'
import styles from './ProfileDrafts.module.scss'

const sameProfile = (a: PartnerProfile, b: PartnerProfile) =>
  JSON.stringify(a) === JSON.stringify(b)

// Mini consultorio del Design Lab: consulta e expediente con estado local.
// Nunca toca el almacenamiento real.
export function ProfilePrototype({ preset }: { preset: ProfilePreset }) {
  const sound = useSound()
  const [view, setView] = useState(preset.view)
  const [invitation, setInvitation] = useState(preset.invitation)
  const [saved, setSaved] = useState<PartnerProfile | null>(preset.saved)
  const [message, setMessage] = useState('')
  const [context, setContext] = useState('')
  // El foco solo se mueve tras un gesto: al cargar una composición no se roba.
  const [focusRequest, setFocusRequest] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusRequest > 0) headingRef.current?.focus({ preventScroll: true })
  }, [focusRequest, view])

  // La invitación se registra al presentarse, no al responderla (004-plan §4): sigue
  // en pantalla mientras dura la visita a la consulta y, al salir, ya no vuelve.
  const go = (next: typeof view) => {
    if (view === 'consultation') setInvitation('presented')
    setView(next)
    setFocusRequest((request) => request + 1)
  }

  const openSheet = () => {
    // Abrir el expediente prepara el audio: es un gesto del usuario.
    if (sound.enabled) sound.unlock()
    go('sheet')
  }

  const header =
    view === 'sheet'
      ? { tag: 'Expediente', kicker: 'El consultorio de Sofi' }
      : { tag: 'En directo', kicker: 'El consultorio de Sofi' }

  return (
    <div className={styles.frameApp}>
      <SiteHeader
        onHome={() => go('consultation')}
        tag={header.tag}
        kicker={header.kicker}
        soundEnabled={sound.enabled}
        onToggleSound={sound.toggle}
      />
      <main className={styles.frameMain}>
        {view === 'consultation' ? (
          <>
            <h1 ref={headingRef} tabIndex={-1} className={styles.srOnly}>
              Tu consulta
            </h1>
            <ConsultationScreen
              message={message}
              context={context}
              onMessageChange={setMessage}
              onContextChange={setContext}
              onSubmit={() => {}}
              onClear={() => {
                setMessage('')
                setContext('')
              }}
              // Primera visita: la invitación es el primer diálogo de Sofi.
              invitation={
                invitation === 'pending'
                  ? {
                      onOpen: openSheet,
                      onDismiss: () => setInvitation('presented'),
                    }
                  : undefined
              }
              profileAccess={{ saved: saved !== null, onOpen: openSheet }}
            />
          </>
        ) : (
          <SheetController
            preset={preset}
            saved={saved}
            onSavedChange={setSaved}
            headingRef={headingRef}
            onBack={() => go('consultation')}
          />
        )}
      </main>
    </div>
  )
}

type SheetControllerProps = {
  preset: ProfilePreset
  saved: PartnerProfile | null
  onSavedChange: (profile: PartnerProfile | null) => void
  headingRef: RefObject<HTMLHeadingElement | null>
  onBack: () => void
}

function initialGuide(preset: ProfilePreset): GuideState {
  return preset.events.reduce(guideReducer, openGuide(preset.area))
}

function SheetController({
  preset,
  saved,
  onSavedChange,
  headingRef,
  onBack,
}: SheetControllerProps) {
  const [draft, setDraft] = useState(
    () =>
      (preset.view === 'sheet' ? preset.draft : saved) ?? EMPTY_PARTNER_PROFILE,
  )
  // La reacción con la que arranca la composición se queda visible para revisarla.
  const [heldReaction] = useState(() => initialGuide(preset).reaction?.id)
  const [guide, dispatch] = useSofiGuide(
    () => initialGuide(preset),
    heldReaction,
  )
  const [notice, setNotice] = useState<SheetNotice>(preset.notice ?? null)
  const [error, setError] = useState<SheetError>(preset.error ?? null)
  const confirmRef = useDeleteConfirmationFocus(guide, headingRef)

  const area = guide.area
  const baseline = saved ?? EMPTY_PARTNER_PROFILE

  const edit = (next: PartnerProfile) => {
    setDraft(next)
    setNotice(null)
    setError(null)
  }

  return (
    <ProfileSheet
      draft={draft}
      guide={guide}
      headingRef={headingRef}
      onBack={onBack}
      onSelectArea={(next) => dispatch({ type: 'selectArea', area: next })}
      onAnswer={(answer: ProfileAnswer) => {
        const next = setAnswer(draft, area, answer)
        // Igual que el expediente real: completar las seis áreas con cambios
        // pendientes se celebra y guía a «Guardar».
        const completes =
          !isProfileComplete(draft) &&
          isProfileComplete(next) &&
          !sameProfile(next, baseline)
        edit(next)
        dispatch({ type: 'answer', answer, completes })
      }}
      onClearAnswer={() => {
        edit(clearAnswer(draft, area))
        dispatch({ type: 'clearAnswer' })
      }}
      onSpeechEnded={() => dispatch({ type: 'speechEnded' })}
      onCelebrationEnd={() => dispatch({ type: 'celebrated' })}
      onNotesChange={(notes) => edit(setNotes(draft, notes))}
      comments={REACTION_COMMENTS}
      management={{
        hasSaved: saved !== null,
        dirty: !sameProfile(draft, baseline),
        notice,
        error,
        confirmRef,
        onSave: () => {
          const check = prepareProfileForSave(draft)
          if (!check.ok) {
            setError(check.error)
            dispatch({ type: 'saveRejected' })
            return
          }
          setDraft(check.profile)
          onSavedChange(check.profile)
          setError(null)
          setNotice('saved')
          dispatch({ type: 'saved', persisted: true })
        },
        onDiscard: () => {
          edit(baseline)
          dispatch({ type: 'discarded' })
        },
        onRequestDelete: () => dispatch({ type: 'requestDelete' }),
        onCancelDelete: () => dispatch({ type: 'cancelDelete' }),
        onConfirmDelete: () => {
          onSavedChange(null)
          edit(EMPTY_PARTNER_PROFILE)
          dispatch({ type: 'deleted' })
        },
      }}
    />
  )
}
