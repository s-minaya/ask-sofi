import { useEffect, useState } from 'react'
import { loadSprite } from '../../components/sofi/SofiSprite/loadSprite'
import { SOFI_REGISTRY } from '../../components/sofi/visual/registry'
import type { SofiAnimationId } from '../../components/sofi/visual/types'
import { cx } from '../../utils/cx'
import { LabNote, LabReadout, LabSub } from '../parts/LabParts'
import { stripsOf } from '../spriteInspector'
import {
  browserEnvironment,
  formatBytes,
  measureStrips,
  readTiming,
  summarize,
  type StripWeight,
  type WeightEnvironment,
} from '../spriteWeight'
import styles from './InspectorSpec.module.scss'

// Peso y memoria decodificada del recurso que se mira (T061, catálogo §8). Mide lo que el
// navegador ya cargó para pintarlo, sin pedir nada: ver `spriteWeight.ts` para qué es medición
// y qué es estimación.

type ResourceWeightProps = {
  id: SofiAnimationId
  environment?: WeightEnvironment
}

const NOT_MEASURED = '— · sin medir'

export function ResourceWeight({
  id,
  environment = browserEnvironment,
}: ResourceWeightProps) {
  // El resultado lleva el recurso al que pertenece: el de otro, que llega tarde, no se pinta.
  const [result, setResult] = useState<{
    id: SofiAnimationId
    strips: StripWeight[]
  } | null>(null)

  useEffect(() => {
    let current = true
    // Primero se espera a que el recurso esté cargado, con la carga que ya existe: es lo que
    // deja las entradas en la línea de tiempo de recursos del navegador. Si falla, se mide lo
    // que haya.
    let stop: (() => void) | undefined
    // Una tira que acaba de cargar después de medir (la estática la pinta la propia pantalla)
    // vuelve a medirse; las lecturas que llegan fuera de orden no pisan a las nuevas.
    let latest = 0
    loadSprite(id)
      .catch(() => undefined)
      .then(() => stripsOf(id).catch(() => ({})))
      .then(async (strips) => {
        const measure = async () => {
          const turn = ++latest
          const measured = await measureStrips(
            strips,
            environment,
            SOFI_REGISTRY[id].maskStrips,
          )
          if (!current || turn !== latest) return measured
          setResult({ id, strips: measured })
          if (measured.every((strip) => strip.origin !== 'unknown')) {
            stop?.()
            stop = undefined
          }
          return measured
        }
        // Se vigila antes de medir, si falta alguna tira (se mira sin esperar a la decodificación):
        // una tira ya medida no cambia, y una lectura lenta no debe impedir enterarse de las demás.
        const missing = Object.values(strips).some(
          (url) => readTiming(environment.getEntries(url)).origin === 'unknown',
        )
        if (missing)
          stop = environment.watch?.(
            Object.values(strips),
            () => void measure(),
          )
        await measure()
      })
    return () => {
      current = false
      stop?.()
    }
  }, [id, environment])

  const strips = result?.id === id ? result.strips : []
  const sum = summarize(strips)
  const measured = strips.filter((strip) => strip.fileBytes !== null)

  return (
    <section
      className={cx(styles.ficha, styles.weight)}
      aria-label="Peso y memoria"
    >
      <LabSub>Peso y memoria</LabSub>
      <LabReadout
        rows={[
          ['Tiras', `${sum.count} ${sum.count === 1 ? 'tira' : 'tiras'}`],
          [
            'Bytes del archivo',
            sum.fileBytes === null
              ? NOT_MEASURED
              : `${formatBytes(sum.fileBytes)} · medido`,
          ],
          ['Transferencia de red', transfer(strips, sum.transferBytes)],
          [
            'Memoria decodificada',
            sum.memoryBytes === null
              ? NOT_MEASURED
              : `${formatBytes(sum.memoryBytes)} · estimación (ancho × alto × 4)`,
          ],
        ]}
      />
      {strips.length > 0 && (
        <LabReadout
          rows={strips.map((strip) => [strip.name, describe(strip)])}
        />
      )}
      {!sum.complete && sum.count > 0 && (
        <LabNote>
          {measured.length === 0
            ? 'El navegador no tiene datos de este recurso todavía.'
            : 'Medición parcial: las sumas solo incluyen las tiras medidas.'}
        </LabNote>
      )}
      <LabNote>
        Bytes y red los mide el navegador sobre el servidor de desarrollo del
        Lab, sin minificar ni comprimir: en producción cambian. No incluyen el
        CSS ni el JS del recurso. La memoria es una estimación: no cuenta los
        mipmaps ni la copia en la GPU.
      </LabNote>
    </section>
  )
}

function transfer(
  strips: readonly StripWeight[],
  transferBytes: number | null,
): string {
  // Con un service worker delante (MSW, en desarrollo) el navegador da 0 bytes de red también en
  // la primera carga: no es la caché ni una medición.
  if (strips.some((strip) => strip.origin === 'intercepted'))
    return '— · no medible aquí: lo atiende el service worker de MSW'
  if (transferBytes === null) return NOT_MEASURED
  const fromCache = strips.filter((strip) => strip.origin === 'cache')
  if (fromCache.length === 0) return `${formatBytes(transferBytes)} · medido`
  if (fromCache.length === strips.length)
    return `${formatBytes(transferBytes)} · medido, desde la caché`
  return `${formatBytes(transferBytes)} · medido, parte desde la caché`
}

function describe(strip: StripWeight): string {
  if (strip.origin === 'unknown') return 'sin medir'
  const size =
    strip.width !== null && strip.height !== null
      ? `${strip.width}×${strip.height} px`
      : 'tamaño desconocido'
  const cache = strip.origin === 'cache' ? ' (caché)' : ''
  return `${size} · archivo ${formatBytes(strip.fileBytes)} · red ${formatBytes(strip.transferBytes)}${cache} · memoria ${formatBytes(strip.memoryBytes)}`
}
