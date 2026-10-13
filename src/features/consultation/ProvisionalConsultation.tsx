import { useRef, useState, type Ref } from 'react'
import { Notice, NoticeText } from '../../components/ui/Notice/Notice'
import { useScrollIntoViewOnRequest } from '../../hooks/useScrollIntoViewOnRequest'
import { useProfileInvitation } from '../partner-profile/useProfileInvitation'
import { useSavedPartnerProfile } from '../partner-profile/useSavedPartnerProfile'
import styles from './ProvisionalConsultation.module.scss'
import { ConsultationScreen } from './screens/ConsultationScreen'
import { useConsultationDraft } from './useConsultationDraft'

type ProvisionalConsultationProps = {
  headingRef?: Ref<HTMLHeadingElement>
  // Abre el expediente: desde la invitación o desde el acceso permanente.
  onOpenProfile: () => void
}

// Experiencia principal provisional: el análisis real llega en próximas features,
// así que aquí no se envía nada ni se simula ninguna lectura.
export function ProvisionalConsultation({
  headingRef,
  onOpenProfile,
}: ProvisionalConsultationProps) {
  const { message, context, setMessage, setContext, clear } =
    useConsultationDraft()
  const [messageError, setMessageError] = useState(false)
  const [notice, setNotice] = useState(false)
  // Cada pulsación válida de «Leer entre líneas» es una petición de lectura.
  const [readRequest, setReadRequest] = useState(0)
  const noticeRef = useRef<HTMLDivElement>(null)
  const invitation = useProfileInvitation()
  const saved = useSavedPartnerProfile()

  useScrollIntoViewOnRequest(noticeRef, {
    request: readRequest,
    available: notice,
  })

  const submit = () => {
    if (!message.trim()) {
      setMessageError(true)
      setNotice(false)
      return
    }
    setNotice(true)
    setReadRequest((request) => request + 1)
  }

  return (
    <ConsultationScreen
      message={message}
      context={context}
      onMessageChange={(value) => {
        setMessage(value)
        if (value.trim()) setMessageError(false)
      }}
      onContextChange={setContext}
      onSubmit={submit}
      onClear={() => {
        clear()
        setMessageError(false)
        setNotice(false)
      }}
      messageError={messageError}
      headingRef={headingRef}
      // Primera visita: la invitación es el primer diálogo de Sofi, arriba, y no
      // bloquea la consulta. Después, el acceso queda en el pie de su diálogo.
      invitation={
        invitation.visible
          ? { onOpen: onOpenProfile, onDismiss: invitation.dismiss }
          : undefined
      }
      profileAccess={{ saved: saved !== null, onOpen: onOpenProfile }}
      after={
        notice && (
          <div ref={noticeRef} className={styles.notice}>
            <Notice
              tone="info"
              kicker="Vista previa"
              title="Sofi todavía está calentando motores"
              role="status"
            >
              <NoticeText>
                Esta es una demostración. Tu mensaje no se ha enviado ni
                analizado.
              </NoticeText>
            </Notice>
          </div>
        )
      }
    />
  )
}
