import { useEffect, useState } from 'react'
import { SofiSprite } from '../../components/sofi/SofiSprite/SofiSprite'
import * as blink from '../../components/sofi/sprites/sofi-blink'
import { createAmbient, type GagId } from '../../components/sofi/visual/ambient'
import {
  SOFI_REGISTRY,
  type SofiOwnerModule,
} from '../../components/sofi/visual/registry'
import {
  SOFI_ANIMATION_IDS,
  type SofiAnimationId,
} from '../../components/sofi/visual/types'
import { Button } from '../../components/ui/Button/Button'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cx } from '../../utils/cx'
import {
  LabCap,
  LabCode,
  LabNote,
  LabProv,
  LabReadout,
  LabSpec,
  LabStage,
} from '../parts/LabParts'
import {
  framesOfStrip,
  mainStripOf,
  REDUCED_POSES,
  STATUS_LABEL,
} from '../reducedPoses'
import { isGag, provideLabOnlyLoaders, RESOURCE_INFO } from '../spriteInspector'
import { GagHost } from './GagHost'
import styles from './ReducedPosesSpec.module.scss'

// T069 · las 14 poses con movimiento reducido, una junto a otra (catálogo §7.2; plan §4.4). Las
// pinta cada parcial (D-2): la ficha no fuerza ningún modo, manda el selector global del Lab
// (como en el inspector, T062). Debajo, los fotogramas de la tira principal: lo único a lo que se
// podría haber cambiado una pose (plan §4.4). Aprobadas con AV4 el 2026-11-16, sin desviaciones
// (plan §11.7).

// Como en el inspector: antes de que ningún `SofiSprite` de la ficha pida `eureka` o `suspicious`.
provideLabOnlyLoaders()

type Strip = { url: string; frames: number }

function ownerOf(id: SofiAnimationId): Promise<SofiOwnerModule> {
  if (id === 'sofi-blink') return Promise.resolve(blink)
  const load = SOFI_REGISTRY[id].load
  return load ? load() : Promise.reject(new Error(`${id} sin cargador`))
}

// La tira principal y su número de fotogramas, leídos de la imagen.
function useMainStrip(id: SofiAnimationId): Strip | 'missing' | null {
  const [strip, setStrip] = useState<Strip | 'missing' | null>(null)
  useEffect(() => {
    let current = true
    ownerOf(id)
      .then(async (owner) => {
        const url = mainStripOf(id, owner.strips)
        if (!url) throw new Error(`${id} sin tira principal`)
        const image = new Image()
        image.src = url
        await image.decode()
        const frames = framesOfStrip(image.naturalWidth, image.naturalHeight)
        if (!frames) throw new Error(`${id}: la tira no es de cuadrados`)
        return { url, frames }
      })
      .then(
        (found) => current && setStrip(found),
        () => current && setStrip('missing'),
      )
    return () => {
      current = false
    }
  }, [id])
  return strip
}

function StripFrames({ id }: { id: SofiAnimationId }) {
  const strip = useMainStrip(id)
  if (strip === null) return <p className={styles.hint}>Cargando fotogramas…</p>
  if (strip === 'missing')
    return <p className={styles.hint}>Fotogramas no disponibles</p>
  return (
    <ol className={styles.frames} aria-label={`Fotogramas de ${id}.webp`}>
      {Array.from({ length: strip.frames }, (_, frame) => (
        <li key={frame} className={styles.frame}>
          <span
            aria-hidden="true"
            className={styles.thumb}
            style={{
              backgroundImage: `url("${strip.url}")`,
              backgroundSize: `${strip.frames * 100}% 100%`,
              backgroundPositionX:
                strip.frames > 1
                  ? `${(frame / (strip.frames - 1)) * 100}%`
                  : '0%',
            }}
          />
          <span className={styles.frameName}>F{frame}</span>
        </li>
      ))}
    </ol>
  )
}

function PoseCard({
  id,
  ambient,
}: {
  id: SofiAnimationId
  ambient: ReturnType<typeof createAmbient>
}) {
  const pose = REDUCED_POSES[id]
  return (
    <li className={styles.card} data-pose={id}>
      <LabCap as="h3">
        {RESOURCE_INFO[id].number} · {id}
      </LabCap>
      <LabStage dots className={styles.stage} innerClassName={styles.inner}>
        <div className={styles.sprite}>
          {isGag(id) ? (
            <GagHost kind={id as GagId} ambient={ambient} />
          ) : (
            <SofiSprite animation={id} style={{ width: '100%' }} />
          )}
        </div>
      </LabStage>
      <p className={cx(styles.status, styles[pose.status])}>
        {STATUS_LABEL[pose.status]}
      </p>
      <LabReadout
        rows={[
          ['Catálogo', pose.catalog],
          ['Parcial', pose.partial],
        ]}
      />
      {pose.status === 'partial' && <StripFrames id={id} />}
    </li>
  )
}

export function ReducedPosesSpec() {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(false)
  // Un solo ambiente para los tres gags: como en producción, no hay dos activos a la vez.
  const [ambient] = useState(createAmbient)

  return (
    <LabSpec
      id="m-reduced"
      kicker="4.11 · Movimiento reducido"
      title="Poses reducidas"
      desc="Las 14 poses fijas, una junto a otra, para compararlas. Cada una la pinta su propio parcial (D-2): las 10 de los parciales están aprobadas (AV4), memory-wipe la fija el catálogo y los tres gags tienen su versión reducida aprobada. Bajo cada pose del parcial, los fotogramas existentes de su tira, que eran las únicas alternativas posibles."
      codes={
        <>
          <LabCode>{'<SofiSprite animation>'}</LabCode>
          <LabCode>reducedPose: partial</LabCode>
          <LabProv>Poses aprobadas (AV4) · producción en T083</LabProv>
        </>
      }
    >
      <div className={styles.bar}>
        <p className={cx(styles.mode, reduced && styles.modeOn)}>
          {reduced
            ? 'Movimiento reducido: se ven las poses fijas.'
            : 'Movimiento completo: se ven las animaciones. Elige «Movimiento: Reducido» en la cabecera para ver las poses fijas.'}
        </p>
        <Button
          variant="secondary"
          size="sm"
          aria-expanded={shown}
          aria-controls="m-reduced-grid"
          onClick={() => setShown((value) => !value)}
        >
          {shown ? 'Ocultar las 14 poses' : 'Mostrar las 14 poses'}
        </Button>
      </div>
      {shown ? (
        <ul id="m-reduced-grid" className={styles.grid}>
          {SOFI_ANIMATION_IDS.map((id) => (
            <PoseCard key={id} id={id} ambient={ambient} />
          ))}
        </ul>
      ) : (
        <LabNote style={{ marginTop: '1.25rem' }}>
          Las poses se cargan al mostrarlas: son 14 recursos y Motion & Sound ya
          pinta muchos.
        </LabNote>
      )}
    </LabSpec>
  )
}
