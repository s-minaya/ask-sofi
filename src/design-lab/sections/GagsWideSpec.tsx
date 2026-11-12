import { useState, type CSSProperties } from 'react'
import {
  SofiDialog,
  SofiDialogText,
} from '../../components/sofi/SofiDialog/SofiDialog'
import { LiveIndicator } from '../../components/ui/Indicators/Indicators'
import { Tag } from '../../components/ui/Tag/Tag'
import { TextLink } from '../../components/ui/TextLink/TextLink'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cx } from '../../utils/cx'
import { INVITATION_COPY } from '../../features/partner-profile/profileCopy'
import { IDLE_DEFAULT_MS } from '../gagBadge'
import { WIDE_COLUMNS, WIDE_TEXT, type WideColumn } from '../gagWide'
import {
  LabCap,
  LabChoice,
  LabCode,
  LabNote,
  LabProv,
  LabReadout,
  LabSpec,
  LabStage,
} from '../parts/LabParts'
import { GagPanel } from './GagPanel'
import { GagPortrait } from './GagPortrait'
import { ReducedGagsNote } from './ReducedGagsNote'
import layout from './GagsSpec.module.scss'
import styles from './GagsWideSpec.module.scss'
import { useGagScene } from './useGagScene'

// T066 · prototipo de la consulta a dos columnas: los tres gags sobre el retrato grande que ya
// existe. La columna «Sofi escucha» es una copia de la de `ConsultationScreen` desde 1080 px, con
// sus componentes reales (`LiveIndicator`, `SofiPortrait`, `SofiDialog`); no se añade otra Sofi.
// Solo cambia el solape del diálogo sobre el retrato, que la composición aprobada quita (`gagWide.ts`).
export function GagsWideSpec() {
  const reducedMotion = useReducedMotion()
  const scene = useGagScene()
  const { log, ambient, gags, idle, showHit } = scene
  const [column, setColumn] = useState<WideColumn>('460')
  const width = WIDE_COLUMNS.find((c) => c.value === column)!.width

  return (
    <LabSpec
      id="m-gags-wide"
      kicker="4.8 · Gags"
      title="Gags en el retrato grande"
      desc="La columna «Sofi escucha» de la consulta a dos columnas, con los tres gags reales sobre su retrato de 384 px. El retrato apoya el pie en el borde superior del diálogo, sin solaparse, como en el expediente (4.9), así que Sofi se ve entera y no tapa el texto. Sus efectos pueden sobresalir, y poking se esconde tras ese borde. Pruébalo con el puntero o con el dedo: toca a Sofi varias veces seguidas, déjala quieta o pasa el puntero por encima."
      codes={
        <>
          <LabCode>useSofiController ×3</LabCode>
          <LabCode>visual/ambient</LabCode>
          <LabProv>Prototipo T066 · aprobado, producción en T088</LabProv>
        </>
      }
    >
      <div className={layout.layout}>
        <div className={layout.visual}>
          <LabChoice
            label="Anchura de la columna (px)"
            options={WIDE_COLUMNS.map(({ value, label }) => ({
              value,
              label,
            }))}
            value={column}
            onChange={setColumn}
          />
          <LabStage dots className={layout.stage}>
            <div
              className={styles.scroller}
              role="region"
              aria-label="Pantalla de dos columnas"
              // El foco de teclado en una región desplazable lo exige axe (`scrollable-region-focusable`,
              // WCAG 2.1.1) y la regla de ESLint no distingue ese caso.
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
            >
              <div
                className={cx(styles.column, showHit && styles.showHit)}
                style={{ '--column': `${width}px` } as CSSProperties}
                data-strip="wide"
              >
                <LabCap>
                  {reducedMotion
                    ? 'Movimiento reducido · gags reducidos'
                    : 'Completo · gags vivos'}
                </LabCap>
                <aside
                  className={styles.listen}
                  aria-label="Sofi está escuchando"
                >
                  <div className={styles.dots} aria-hidden="true" />
                  <LiveIndicator className={styles.tag}>
                    Sofi está escuchando
                  </LiveIndicator>
                  <GagPortrait ambient={ambient} gags={gags} idleAfter={idle} />
                  <SofiDialog
                    className={styles.dialog}
                    footer={
                      <span className={styles.access}>
                        <Tag tone="lilac">{INVITATION_COPY.tag}</Tag>
                        <TextLink size="sm" continues onClick={() => undefined}>
                          {INVITATION_COPY.openEmpty}
                        </TextLink>
                      </span>
                    }
                  >
                    <SofiDialogText as="blockquote">{WIDE_TEXT}</SofiDialogText>
                  </SofiDialog>
                </aside>
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
              ['Inactividad', `${idle / 1000} s`],
            ]}
          />
          <ReducedGagsNote />
          <LabNote>
            Cambiar la anchura es probar el mismo retrato con la columna de 1080
            a 1920 px de ventana; por debajo de 1080 px la consulta pasa a una
            columna y la insignia de 4.7. La ubicación, esta composición
            (decisión 11 de la dirección artística) y la inactividad (
            {IDLE_DEFAULT_MS / 1000} s, plan §6) están aprobadas (AV6).
          </LabNote>
        </div>

        <GagPanel scene={scene} empty="Toca a Sofi para empezar." />
      </div>
    </LabSpec>
  )
}
