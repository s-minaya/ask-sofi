import { useRef, useState, type Ref } from 'react'
import { Notice, NoticeText } from '../../components/ui/Notice/Notice'
import { useScrollIntoViewOnRequest } from '../../hooks/useScrollIntoViewOnRequest'
import styles from './ProvisionalConsultation.module.scss'
import { ConsultationScreen } from './screens/ConsultationScreen'
import { useConsultationDraft } from './useConsultationDraft'

type ProvisionalConsultationProps = {
  headingRef?: Ref<HTMLHeadingElement>
}

// Experiencia principal provisional: el análisis real llega en próximas features,
// así que aquí no se envía nada ni se simula ninguna lectura.
export function ProvisionalConsultation({
  headingRef,
}: ProvisionalConsultationProps) {
  const { message, context, setMessage, setContext, clear } =
    useConsultationDraft()
  const [messageError, setMessageError] = useState(false)
  const [notice, setNotice] = useState(false)
  // Cada pulsación válida de «Leer entre líneas» es una petición de lectura.
  const [readRequest, setReadRequest] = useState(0)
  const noticeRef = useRef<HTMLDivElement>(null)

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
