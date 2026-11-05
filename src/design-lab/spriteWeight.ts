// Peso y memoria decodificada de un recurso (T061, catálogo §8, plan §7). Tres magnitudes que no
// se mezclan:
//
//  - bytes del archivo y transferencia de red: mediciones del propio navegador (Resource Timing)
//    de lo que ya cargó. No se pide nada para medirlo: pedir una tira cambiaría la estrategia de
//    carga y falsearía la medición;
//  - memoria decodificada: una estimación (ancho × alto × 4 bytes, RGBA de 8 bits) con el tamaño
//    que da la decodificación. No es lo que el navegador reserva de verdad (mipmaps, copia en la
//    GPU y formato interno quedan fuera).
//
// Lo que no se sabe es `null`, nunca un cero.

// Lo que se lee de `PerformanceResourceTiming`.
export type TimingEntry = {
  startTime: number
  // Bytes que viajaron por la red, cabeceras incluidas. 0 si vino de la caché.
  transferSize: number
  // Cuerpo tal como viajó (comprimido, si lo estaba).
  encodedBodySize: number
  // Cuerpo ya descomprimido: lo que pesa el archivo.
  decodedBodySize: number
}

// `intercepted`: un service worker atendió la petición. El navegador informa de 0 bytes de red
// aunque sea la primera carga, así que no es la caché y no es una medición (en desarrollo, MSW).
export type TimingOrigin = 'network' | 'cache' | 'intercepted' | 'unknown'

export type StripWeight = {
  name: string
  fileBytes: number | null
  transferBytes: number | null
  origin: TimingOrigin
  width: number | null
  height: number | null
  memoryBytes: number | null
}

export function readTiming(entries: readonly TimingEntry[]): {
  fileBytes: number | null
  transferBytes: number | null
  origin: TimingOrigin
} {
  const ordered = [...entries].sort((a, b) => a.startTime - b.startTime)
  // La primera petición que trajo el cuerpo es la descarga. Después pueden venir lecturas de la
  // caché o revalidaciones (solo cabeceras) que no cambian lo que pesa ni lo que costó.
  const download = ordered.find(
    (e) => e.transferSize > 0 && e.encodedBodySize > 0 && e.decodedBodySize > 0,
  )
  if (download)
    return {
      fileBytes: download.decodedBodySize,
      transferBytes: download.transferSize,
      origin: 'network',
    }
  const known = ordered.find((e) => e.decodedBodySize > 0)
  if (known)
    return {
      fileBytes: known.decodedBodySize,
      transferBytes: known.transferSize,
      origin: 'cache',
    }
  // Sin entradas, o de otro origen sin permiso para ver sus tamaños: no se sabe.
  return { fileBytes: null, transferBytes: null, origin: 'unknown' }
}

export function decodedMemory(
  width: number | null,
  height: number | null,
): number | null {
  if (!width || !height) return null
  return width * height * 4
}

// 1 024 por escalón y coma decimal, como el playground original.
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} B`
  const decimal = (value: number) => value.toFixed(1).replace('.', ',')
  if (bytes < 1024 ** 2) return `${decimal(bytes / 1024)} KB`
  return `${decimal(bytes / 1024 ** 2)} MB`
}

export function stripName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

export type WeightSummary = {
  count: number
  fileBytes: number | null
  transferBytes: number | null
  memoryBytes: number | null
  // Todas las tiras tienen las tres magnitudes (la red, salvo que no se pueda ver). Si no, las
  // sumas son parciales.
  complete: boolean
}

function total(values: ReadonlyArray<number | null>): number | null {
  const known = values.filter((value): value is number => value !== null)
  return known.length ? known.reduce((sum, value) => sum + value, 0) : null
}

export function summarize(strips: readonly StripWeight[]): WeightSummary {
  return {
    count: strips.length,
    fileBytes: total(strips.map((s) => s.fileBytes)),
    transferBytes: total(strips.map((s) => s.transferBytes)),
    memoryBytes: total(strips.map((s) => s.memoryBytes)),
    complete:
      strips.length > 0 &&
      strips.every(
        (s) =>
          s.fileBytes !== null &&
          // Una red que no se puede ver (service worker) es una limitación, no una laguna.
          (s.transferBytes !== null || s.origin === 'intercepted') &&
          s.memoryBytes !== null,
      ),
  }
}

export type WeightEnvironment = {
  getEntries: (url: string) => readonly TimingEntry[]
  // Avisa cuando el navegador registra una carga de alguna de estas tiras. Devuelve cómo dejar
  // de vigilar. Sin ella, la medición es la de un instante.
  watch?: (urls: readonly string[], onChange: () => void) => () => void
  // Si lo que informa el navegador de la red es real: con un service worker delante, no lo es.
  transferVisible: () => boolean
  // `crossOrigin`: la tira es una máscara y se pide con CORS, como hace la carga. Sin él sería otra
  // petición de la misma imagen (E13).
  decodeSize: (
    url: string,
    options?: { crossOrigin?: boolean },
  ) => Promise<{ width: number; height: number } | null>
}

export async function measureStrips(
  strips: Readonly<Record<string, string>>,
  environment: WeightEnvironment,
  maskStrips: readonly string[] = [],
): Promise<StripWeight[]> {
  return Promise.all(
    Object.entries(strips).map(async ([path, url]) => {
      const read = readTiming(environment.getEntries(url))
      const timing =
        !environment.transferVisible() && read.origin !== 'unknown'
          ? { ...read, transferBytes: null, origin: 'intercepted' as const }
          : read
      // Solo se decodifica lo que el navegador ya tiene: lo contrario sería pedir la tira.
      const size =
        timing.origin === 'unknown'
          ? null
          : await environment.decodeSize(url, {
              crossOrigin: maskStrips.some((mask) => path.endsWith(`/${mask}`)),
            })
      return {
        name: stripName(path),
        ...timing,
        width: size?.width ?? null,
        height: size?.height ?? null,
        memoryBytes: decodedMemory(size?.width ?? null, size?.height ?? null),
      }
    }),
  )
}

// El entorno real: la línea de tiempo de recursos del navegador y la decodificación de la imagen.
export const browserEnvironment: WeightEnvironment = {
  watch: (urls, onChange) => {
    if (typeof PerformanceObserver === 'undefined') return () => {}
    const watched = new Set(
      urls.map((url) => new URL(url, document.baseURI).href),
    )
    const observer = new PerformanceObserver((list) => {
      if (list.getEntries().some((entry) => watched.has(entry.name))) onChange()
    })
    observer.observe({ type: 'resource' })
    return () => observer.disconnect()
  },
  transferVisible: () => !navigator.serviceWorker?.controller,
  getEntries: (url) =>
    performance
      .getEntriesByName(new URL(url, document.baseURI).href, 'resource')
      .map((e) => e as PerformanceResourceTiming),
  decodeSize: async (url, options) => {
    const image = new Image()
    // Antes de `src`, o la tira se pide dos veces.
    if (options?.crossOrigin) image.crossOrigin = 'anonymous'
    image.src = url
    try {
      await image.decode()
    } catch {
      return null
    }
    return { width: image.naturalWidth, height: image.naturalHeight }
  },
}

// El búfer de recursos del navegador guarda 250 entradas y el servidor de desarrollo del Lab las
// llena con los módulos: las tiras que se miran después se perderían. Se amplía una vez, y de
// nuevo cada vez que se llena. Solo se llama desde el Lab.
const BUFFER_SIZE = 2000
let watching = false

export function keepResourceTimings(): void {
  if (typeof performance.setResourceTimingBufferSize !== 'function') return
  performance.setResourceTimingBufferSize(BUFFER_SIZE)
  if (watching) return
  watching = true
  performance.addEventListener('resourcetimingbufferfull', () =>
    performance.setResourceTimingBufferSize(
      performance.getEntriesByType('resource').length + BUFFER_SIZE,
    ),
  )
}
