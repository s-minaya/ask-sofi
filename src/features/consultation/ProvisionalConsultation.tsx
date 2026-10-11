import { useState, type Ref } from 'react'
import { Notice, NoticeText } from '../../components/ui/Notice/Notice'
import { ConsultationScreen } from './screens/ConsultationScreen'

type ProvisionalConsultationProps = {
  headingRef?: Ref<HTMLHeadingElement>
}

// Experiencia principal provisional: el análisis real llega en próximas features,
// así que aquí no se envía nada ni se simula ninguna lectura.
export function ProvisionalConsultation({
  headingRef,
}: ProvisionalConsultationProps) {
  const [message, setMessage] = useState('')
  const [context, setContext] = useState('')
  const [messageError, setMessageError] = useState(false)
  const [notice, setNotice] = useState(false)

  const submit = () => {
    if (!message.trim()) {
      setMessageError(true)
      setNotice(false)
      return
    }
    setNotice(true)
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
        setMessage('')
        setContext('')
        setMessageError(false)
        setNotice(false)
      }}
      messageError={messageError}
      headingRef={headingRef}
      after={
        notice && (
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
        )
      }
    />
  )
}
