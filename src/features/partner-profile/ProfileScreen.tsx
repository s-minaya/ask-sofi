import { useRef, useState, type RefObject } from 'react'
import {
  EMPTY_PARTNER_PROFILE,
  PROFILE_AREAS,
  clearAnswer,
  isProfileComplete,
  setAnswer,
  setNotes,
  type PartnerProfile,
} from '../../domain/partner-profile/partnerProfile'
import {
  deletePartnerProfile,
  savePartnerProfile,
} from '../../infrastructure/storage/partnerProfileStorage'
import { REACTION_COMMENTS } from './profileCopy'
import { ProfileSheet, type SheetError, type SheetNotice } from './ProfileSheet'
import { openGuide } from './sofiGuide'
import { useDeleteConfirmationFocus } from './useDeleteConfirmationFocus'
import { useSavedPartnerProfile } from './useSavedPartnerProfile'
import { useSofiGuide } from './useSofiGuide'

type ProfileScreenProps = {
  onBack: () => void
  headingRef?: RefObject<HTMLHeadingElement | null>
}

// Cambios sin guardar respecto a lo que hay en el dispositivo.
const sameProfile = (a: PartnerProfile, b: PartnerProfile) =>
  JSON.stringify(a) === JSON.stringify(b)

// El expediente: una única vista editable (004-spec §3). El borrador vive aquí,
// separado de lo guardado: editar no modifica el expediente hasta guardar, y
// descartar o abandonar la ficha deja intacta la última versión. Nada avanza
// solo: la pregunta activa solo cambia a petición. Sofi pregunta con voz y
// typewriter; responder, guardar o eliminar solo provoca una reacción breve.
export function ProfileScreen({ onBack, headingRef }: ProfileScreenProps) {
  const ownHeading = useRef<HTMLHeadingElement>(null)
  const heading = headingRef ?? ownHeading
  const saved = useSavedPartnerProfile()
  const [draft, setDraft] = useState(() => saved ?? EMPTY_PARTNER_PROFILE)
  const [notice, setNotice] = useState<SheetNotice>(null)
  const [error, setError] = useState<SheetError>(null)
  const [guide, dispatch] = useSofiGuide(() => openGuide(PROFILE_AREAS[0]))
  const confirmRef = useDeleteConfirmationFocus(guide, heading)
  const area = guide.area
  const baseline = saved ?? EMPTY_PARTNER_PROFILE

  // Editar retira los avisos del guardado anterior: ya no describen la ficha.
  const edit = (next: PartnerProfile) => {
    setDraft(next)
    setNotice(null)
    setError(null)
  }

  const save = () => {
    const result = savePartnerProfile(draft)
    if (result.status === 'rejected') {
      setNotice(null)
      setError(result.error)
      // Notas demasiado largas se corrigen en su campo: no es un expediente vacío.
      if (result.error === 'empty') dispatch({ type: 'saveRejected' })
      return
    }
    setError(null)
    setDraft(result.profile)
    // Solo «saved» es un guardado persistente; en memoria se perderá al recargar.
    const persisted = result.status === 'saved'
    setNotice(persisted ? 'saved' : 'memory')
    dispatch({ type: 'saved', persisted })
  }

  return (
    <ProfileSheet
      draft={draft}
      guide={guide}
      headingRef={heading}
      onBack={onBack}
      onSelectArea={(next) => dispatch({ type: 'selectArea', area: next })}
      onAnswer={(answer) => {
        const next = setAnswer(draft, area, answer)
        // Completar las seis áreas se celebra en el momento en que ocurre, y solo
        // si queda algo por guardar: la celebración guía a «Guardar». Cambiar
        // una respuesta de una ficha ya completa no vuelve a celebrarla.
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
        onSave: save,
        onDiscard: () => {
          edit(baseline)
          dispatch({ type: 'discarded' })
        },
        onRequestDelete: () => dispatch({ type: 'requestDelete' }),
        onCancelDelete: () => dispatch({ type: 'cancelDelete' }),
        onConfirmDelete: () => {
          deletePartnerProfile()
          edit(EMPTY_PARTNER_PROFILE)
          dispatch({ type: 'deleted' })
        },
      }}
    />
  )
}
