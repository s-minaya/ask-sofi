import type { ReactNode } from 'react'
import {
  SofiDialog,
  SofiDialogText,
} from '../../components/sofi/SofiDialog/SofiDialog'
import { StepTag } from '../../components/ui/Tag/Tag'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cx } from '../../utils/cx'
import {
  SPEC_IDLE_MAX_MS,
  SPEC_IDLE_MIN_MS,
  formatIdle,
  idleVerdict,
} from '../gagBadge'
import {
  LabCap,
  LabCode,
  LabNote,
  LabProv,
  LabReadout,
  LabSpec,
  LabStage,
} from '../parts/LabParts'
import { GagBadge } from './GagBadge'
import { GagPanel } from './GagPanel'
import styles from './GagsSpec.module.scss'
import { ReducedGagsNote } from './ReducedGagsNote'
import { useGagScene } from './useGagScene'

// T066 · prototipo de la consulta móvil. El texto del diálogo es el de una columna de
// `ConsultationScreen` (variante corta): contenido de relleno, no un requisito.
const LISTEN_TEXT = 'A ver, cuéntamelo todo. ¿Qué te ha escrito exactamente?'

// La cabecera de «Sofi escucha» de la consulta en una columna, a 320 px: insignia y diálogo en
// fila, con la insignia apoyada en el borde inferior de la franja. Copia las medidas de
// `ConsultationScreen.module.scss` (`.listen` y `.listenDialog`) para esa anchura.
function Strip({
  badge,
  showHit,
}: {
  badge: ReactNode
  // Tiñe la zona sensible (solo para revisarla).
  showHit?: boolean
}) {
  return (
    <div
      className={cx(styles.phone, showHit && styles.showHit)}
      data-strip="live"
    >
      <div className={styles.listen}>
        {badge}
        <SofiDialog more className={styles.dialog}>
          <SofiDialogText as="blockquote">{LISTEN_TEXT}</SofiDialogText>
        </SofiDialog>
      </div>
      <div className={styles.rest}>
        <StepTag step={1} label="El mensaje" />
      </div>
    </div>
  )
}

export function GagsSpec() {
  const reducedMotion = useReducedMotion()
  const scene = useGagScene()
  const { log, idle, gags, ambient, showHit } = scene
  const verdict = idleVerdict(idle)

  return (
    <LabSpec
      id="m-gags"
      kicker="4.7 · Gags"
      title="Gags en la insignia"
      desc="La insignia de la consulta en una columna, sin cambios, con los tres gags reales sobre el mismo anfitrión. Sus efectos pueden sobresalir del recuadro, y poking se esconde tras el borde inferior de la propia insignia. Pruébalo con el dedo o con el ratón: toca a Sofi varias veces, déjala quieta o pasa el puntero por encima."
      codes={
        <>
          <LabCode>useSofiController ×3</LabCode>
          <LabCode>visual/ambient</LabCode>
          <LabProv>Prototipo T066 · aprobado, producción en T088</LabProv>
        </>
      }
    >
      <div className={styles.layout}>
        <div className={styles.visual}>
          <LabStage dots className={styles.stage}>
            {/* Desplazable en horizontal si la ventana es más estrecha que la «pantalla» de 320 px.
                El foco de teclado en una región desplazable lo exige axe (`scrollable-region-focusable`,
                WCAG 2.1.1) y la regla de ESLint no distingue ese caso. */}
            <div
              className={styles.scroller}
              role="region"
              aria-label="Pantallas de 320 px"
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
            >
              <div className={styles.variant}>
                <LabCap>
                  {reducedMotion
                    ? 'Movimiento reducido · gags reducidos'
                    : 'Completo · gags vivos'}
                </LabCap>
                <Strip
                  showHit={showHit}
                  badge={
                    <GagBadge ambient={ambient} gags={gags} idleAfter={idle} />
                  }
                />
              </div>
            </div>
          </LabStage>
          <LabReadout
            rows={[
              [
                'Movimiento',
                reducedMotion
                  ? 'Reducido: gags en versión reducida'
                  : 'Completo: gags activos',
              ],
              ['Gag activo', log.active ?? 'ninguno'],
              [
                'Inactividad',
                `${formatIdle(idle)} · ${
                  verdict === 'spec'
                    ? `dentro de la horquilla de la spec (${formatIdle(SPEC_IDLE_MIN_MS)}–${formatIdle(SPEC_IDLE_MAX_MS)})`
                    : 'solo demostración'
                }`,
              ],
            ]}
          />
          <ReducedGagsNote />
          <LabNote>
            La ubicación y la inactividad están aprobadas (AV6: spec §5, plan
            §6).
          </LabNote>
        </div>

        <GagPanel scene={scene} empty="Toca a Sofi para empezar." />
      </div>
    </LabSpec>
  )
}
