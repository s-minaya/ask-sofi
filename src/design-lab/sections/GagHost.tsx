import { useEffect, useState } from 'react'
import { className as blinkClass } from '../../components/sofi/sprites/sofi-blink'
import { useSofiController } from '../../components/sofi/useSofiController'
import {
  createAmbient,
  type Ambient,
  type GagId,
} from '../../components/sofi/visual/ambient'
import { cx } from '../../utils/cx'

type GagHostProps = {
  kind: GagId
  // Congelar detiene los tiempos del controlador como lo haría una consulta en marcha.
  frozen?: boolean
  // Un `ambient` compartido con otros gags (escenarios de T064). Sin él, el gag tiene el suyo.
  ambient?: Ambient
  // Escena tranquila: sin ella no se carga ni se monta nada (plan 008 §6).
  calm?: boolean
  // Solo para demostrar la inactividad sin esperar (`useSofiController`).
  idleAfter?: number
}

// El anfitrión de un gag es el elemento de `sofi-blink`, sin hijos de React: el controlador le
// añade las capas (plan 008 §6). Aquí ocupa el lugar que tendrá en la pantalla que lo use.
export function GagHost({
  kind,
  frozen,
  ambient: shared,
  calm = true,
  idleAfter,
}: GagHostProps) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [own] = useState(createAmbient)
  const ambient = shared ?? own
  const gagClass = useSofiController(kind, host, { ambient, calm, idleAfter })

  // El Lab no tiene causa de pausa propia: «ocupada» detiene los tiempos del controlador igual
  // que lo haría una consulta en marcha.
  useEffect(() => {
    if (frozen !== undefined) ambient.setCause('busy', frozen)
  }, [ambient, frozen])

  return (
    <span
      ref={setHost}
      aria-hidden="true"
      className={cx(blinkClass, gagClass)}
      style={{ display: 'block', width: '100%' }}
    />
  )
}
