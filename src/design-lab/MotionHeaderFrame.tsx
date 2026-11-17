import { useState } from 'react'
import {
  MotionPreferenceProvider,
  type MotionPreference,
} from '../app/providers/MotionPreference'
import { MOTION_CONTROL_DEFAULT } from './motionControl'
import { HeaderMock } from './sections/MotionControlMocks'

// Cabecera con (o sin) el control de movimiento aprobado (T071, AV7), sola, para verla en un iframe
// estrecho con sus media queries reales. El control cambia el movimiento de este documento y
// nada más: ninguna preferencia pública.
export default function MotionHeaderFrame() {
  const control =
    new URLSearchParams(window.location.search).get('control') !== '0'
  const [motion, setMotion] = useState<MotionPreference>(MOTION_CONTROL_DEFAULT)
  return (
    <MotionPreferenceProvider value={motion}>
      <HeaderMock
        motion={control ? { value: motion, onChange: setMotion } : undefined}
      />
    </MotionPreferenceProvider>
  )
}
