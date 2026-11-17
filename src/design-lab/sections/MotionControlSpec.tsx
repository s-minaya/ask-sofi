import { useState } from 'react'
import type { MotionPreference } from '../../app/providers/MotionPreference'
import { SofiSprite } from '../../components/sofi/SofiSprite/SofiSprite'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useLabMotion } from '../labMotion'
import { effectiveMotionLabel, MOTION_CONTROL_DEFAULT } from '../motionControl'
import {
  LabCap,
  LabCode,
  LabNote,
  LabProv,
  LabReadout,
  LabSpec,
  LabStage,
  LabSub,
  LabUses,
} from '../parts/LabParts'
import {
  HeaderMock,
  MotionSwitchProto,
  WhyFullDisclosure,
} from './MotionControlMocks'
import styles from './MotionControlSpec.module.scss'

// T071 · 4.13: el control de la preferencia de movimiento `system | reduce | full` (spec 008 §7),
// aprobado con AV7 el 2026-11-17 (plan 008 §11.9): cabecera global; Reducido → Completo →
// Sistema, solo con etiquetas y sin iconos en ningún tamaño; `system` por defecto; «Completo» con
// el acento; explicación desplegable. El responsive se resolvió midiendo (§43 de la
// verificación). El control definitivo es de T089–T090. El ejemplar vivo mueve el selector
// global del Lab, nunca una preferencia pública.

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

// El control vivo: con el Lab entero, el selector global; solo, un estado local.
function useProtoMotion(): [
  MotionPreference,
  (value: MotionPreference) => void,
] {
  const lab = useLabMotion()
  const [local, setLocal] = useState<MotionPreference>(MOTION_CONTROL_DEFAULT)
  return lab ? [lab.motion, lab.setMotion] : [local, setLocal]
}

function frameSrc(control: boolean) {
  return `/design-lab?frame=motion-header&control=${control ? '1' : '0'}`
}

export function MotionControlSpec() {
  const [motion, setMotion] = useProtoMotion()
  const systemReduced = useMediaQuery(REDUCE_QUERY)
  const control = { value: motion, onChange: setMotion }

  return (
    <LabSpec
      id="m-motion-control"
      kicker="4.13 · Preferencia"
      title="Control de movimiento"
      desc="Cómo elige la persona entre seguir al sistema, reducir el movimiento o tener las animaciones completas: en la cabecera global, junto al tema, con el mismo selector. «Completo» lleva el acento y una explicación desplegable. El ejemplar vivo mueve el selector global del Lab; nada se guarda."
      codes={
        <>
          <LabCode>system · reduce · full</LabCode>
          <LabCode>{'<SegmentedControl>'}</LabCode>
          <LabCode>{'<TextLink aria-expanded>'}</LabCode>
          <LabProv>Aprobado (AV7) · producción en T089–T090</LabProv>
        </>
      }
    >
      <div className={styles.live}>
        <div className={styles.livePanel}>
          <LabSub>El control, en vivo</LabSub>
          <MotionSwitchProto {...control} />
          <WhyFullDisclosure />
          <LabReadout
            rows={[
              ['Preferencia', motion],
              ['Sistema', systemReduced ? 'pide reducir' : 'no pide reducir'],
              ['Se ve', effectiveMotionLabel(motion, systemReduced)],
            ]}
          />
          <LabNote>
            Es el mismo estado que «Movimiento» en la cabecera del Lab: cambia
            el atributo del documento y nada más. La preferencia pública,
            persistida y reversible, es de T089–T090.
          </LabNote>
        </div>
        <LabStage dots className={styles.liveStage}>
          <div className={styles.sprite} aria-hidden="true">
            <SofiSprite animation="sofi-blink" style={{ width: '100%' }} />
          </div>
        </LabStage>
      </div>

      <LabSub style={{ marginTop: '2.25rem' }}>Decisiones aprobadas</LabSub>
      <LabUses
        items={[
          'Ubicación: la cabecera global, disponible en toda la experiencia.',
          'Orden y etiquetas: Reducido → Completo → Sistema, siempre visibles y sin abreviar.',
          'Sin iconos en ningún tamaño de pantalla.',
          'Valor predeterminado: Sistema.',
          'Protagonismo de «Completo»: fondo rosa con texto tinta cuando no está seleccionado (el uso del botón principal); seleccionado, el estilo habitual. El rosa como color de texto no cumpliría contraste: 2,7:1 en claro y 2,4:1 en oscuro.',
          '«¿Por qué Completo?»: un botón de texto con aria-expanded que muestra la explicación aprobada, palabra por palabra.',
          'Responsive, resuelto midiendo: si los controles no caben junto al logo, bajan a otra fila alineados a la derecha; el tema conserva su regla (iconos por debajo de 760 px). La explicación abierta ocupa su propia fila y no mueve los controles.',
        ]}
      />

      <LabSub style={{ marginTop: '2.25rem' }}>
        La cabecera, con el control
      </LabSub>
      <LabCap>Ancha · el ancho del Lab</LabCap>
      <div className={styles.frame}>
        <HeaderMock motion={control} />
      </div>
      <div className={styles.frames}>
        <div>
          <LabCap>Hoy, a 390 px (referencia)</LabCap>
          <iframe
            className={styles.narrow}
            src={frameSrc(false)}
            title="Cabecera de hoy a 390 px"
          />
        </div>
        <div>
          <LabCap>Con el control, a 390 px</LabCap>
          <iframe
            className={styles.narrow}
            src={frameSrc(true)}
            title="Cabecera con el control de movimiento a 390 px"
          />
        </div>
        <div>
          <LabCap>Con el control, a 320 px</LabCap>
          <iframe
            className={`${styles.narrow} ${styles.tiny}`}
            src={frameSrc(true)}
            title="Cabecera con el control de movimiento a 320 px"
          />
        </div>
      </div>
      <LabNote>
        Cada marco es la cabecera real con sus media queries; pulsar dentro
        cambia el movimiento de ese marco. Las medidas a 320, 360, 390, 760,
        930, 960 y 1280 px, con el texto al 200 %, están en la verificación.
      </LabNote>

      <LabSub style={{ marginTop: '2.25rem' }}>Descartadas (AV7)</LabSub>
      <LabUses
        items={[
          'B · En la portada, junto al sonido: no se cambia desde la consulta ni el expediente sin volver a la portada.',
          'C · Portada y cabecera a la vez: dos controles sincronizados para una preferencia.',
          'Un botón de icono que alterne, como el del sonido: tres estados no caben en aria-pressed.',
        ]}
      />
    </LabSpec>
  )
}
