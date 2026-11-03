// Estadística y lectura de resultados de la medición de carga (008-plan §7).
// Todo es puro: el arnés (measureLoad.ts) solo lo alimenta con lo que mide el
// navegador, y así lo que decide una cifra, o si una muestra es válida, se
// prueba sin navegador.
import { constants, gzipSync } from 'node:zlib'

// Una serie con un hueco o un NaN no debe llegar a una mediana: el resultado
// parecería válido y falsearía la línea base sin avisar.
function assertSeries(values: readonly number[], minimum: number): void {
  if (values.length < minimum) {
    throw new RangeError(
      `Se necesitan al menos ${minimum} valores y hay ${values.length}`,
    )
  }
  if (!values.every(Number.isFinite)) {
    throw new RangeError('La serie contiene un valor no finito')
  }
}

export function median(values: readonly number[]): number {
  assertSeries(values, 1)
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

export type Dispersion = {
  count: number
  min: number
  max: number
  range: number
  mean: number
  stdDev: number
}

// Desviación típica muestral (n − 1): las rondas son una muestra de lo que
// podría dar la medición, no toda la población.
export function dispersion(values: readonly number[]): Dispersion {
  assertSeries(values, 2)
  const count = values.length
  const mean = values.reduce((sum, value) => sum + value, 0) / count
  const squares = values.reduce((sum, value) => sum + (value - mean) ** 2, 0)
  const min = Math.min(...values)
  const max = Math.max(...values)
  return {
    count,
    min,
    max,
    range: max - min,
    mean,
    stdDev: Math.sqrt(squares / (count - 1)),
  }
}

// Opciones fijas del gzip con el que se mide el CSS de entrada (plan §7). Son
// las del zlib de Node por defecto, escritas a la vista: así un cambio de esos
// valores por defecto no mueve la referencia sin que se note. Ni así es
// idéntico en cualquier máquina, porque el zlib de Node es el de Chromium y su
// salida puede cambiar entre versiones: el arnés anota `process.versions.zlib`
// junto a cada cifra.
export const GZIP_OPTIONS = {
  level: 6,
  memLevel: 8,
  windowBits: 15,
  strategy: constants.Z_DEFAULT_STRATEGY,
} as const

export function gzipSize(content: Uint8Array): number {
  return gzipSync(content, GZIP_OPTIONS).length
}

// Vite emite `assets/<nombre>-<hash de 8 caracteres>.<ext>` y el hash puede
// llevar «-» y «_» (index-BF--mqqv.js). El hash tiene longitud fija, así que
// el nombre original es lo que queda delante de él sin ambigüedad.
const HASHED_FILE = /^(?<stem>.+)-[\w-]{8}\.[A-Za-z0-9]+$/

export function assetStem(url: string): string | null {
  const file = new URL(url).pathname.split('/').pop() ?? ''
  return HASHED_FILE.exec(file)?.groups?.stem ?? null
}

export type EntryAssets = {
  scripts: string[]
  stylesheets: string[]
  preloads: string[]
}

function attribute(tag: string, name: string): string | undefined {
  const match = new RegExp(
    `\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  ).exec(tag)
  return match?.slice(1).find((value) => value !== undefined)
}

// Qué referencia el HTML de entrada. «CSS de entrada» es lo que lleva el
// documento, no lo que se pida después: un recurso diferido que se cargue en
// reposo no debe contarse como parte de la entrada.
export function entryAssets(html: string): EntryAssets {
  const assets: EntryAssets = { scripts: [], stylesheets: [], preloads: [] }
  for (const [tag, name] of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
    if (name.toLowerCase() === 'script') {
      const src = attribute(tag, 'src')
      if (src) assets.scripts.push(src)
      continue
    }
    const href = attribute(tag, 'href')
    const rel = attribute(tag, 'rel')?.toLowerCase()
    if (!href) continue
    if (rel === 'stylesheet') assets.stylesheets.push(href)
    else if (rel === 'modulepreload') assets.preloads.push(href)
  }
  return assets
}

// Mismo contorno que `os.cpus()`, sin acoplarse a Node para poder probarlo.
export type CpuSample = {
  times: Record<'user' | 'nice' | 'sys' | 'idle' | 'irq', number>
}

const busyAndIdle = (cpus: readonly CpuSample[]) =>
  cpus.reduce(
    (sum, { times }) => ({
      total:
        sum.total +
        times.user +
        times.nice +
        times.sys +
        times.idle +
        times.irq,
      idle: sum.idle + times.idle,
    }),
    { total: 0, idle: 0 },
  )

// Carga de fondo de la máquina entre dos muestras de `os.cpus()`. No decide
// nada: explica por qué una medición es más ruidosa de lo esperado.
export function cpuBusyFraction(
  before: readonly CpuSample[],
  after: readonly CpuSample[],
): number {
  const start = busyAndIdle(before)
  const end = busyAndIdle(after)
  const elapsed = end.total - start.total
  if (!(elapsed > 0)) {
    throw new RangeError('Entre las dos muestras no ha pasado tiempo de CPU')
  }
  return 1 - (end.idle - start.idle) / elapsed
}

// --- Comparación A/B intercalada (008-plan §7) -------------------------------
//
// Dos medidas tomadas en momentos distintos no se pueden comparar: la máquina
// deriva (medido: las primeras rondas de una sesión salen 40–80 ms más lentas).
// Por eso A y B se cargan alternadas dentro de la misma sesión, y se analiza la
// diferencia dentro de cada bloque, no la de dos medianas lejanas en el tiempo.

export type Variant = 'A' | 'B'

// Calentamiento predefinido, igual para las dos versiones: bloques completos
// que se miden y se conservan, pero que el análisis no usa. Es una constante
// del protocolo y no una opción, para que no se pueda ajustar mirando los
// resultados. Son pares para que lo medido siga equilibrado entre ABBA y BAAB.
export const WARMUP_BLOCKS = 2

const ABBA: readonly Variant[] = ['A', 'B', 'B', 'A']
const BAAB: readonly Variant[] = ['B', 'A', 'A', 'B']

// ABBA y BAAB alternados: dentro de un bloque A y B tienen la misma posición
// media, así que una deriva lineal se cancela, y alternando el patrón ninguna
// versión abre más veces el bloque (el primer acceso suele ser el más lento).
export function abbaSchedule(blocks: number): Variant[][] {
  if (!Number.isInteger(blocks) || blocks < 1) {
    throw new RangeError(
      `Los bloques deben ser un entero positivo y son ${blocks}`,
    )
  }
  return Array.from({ length: blocks }, (_, index) => [
    ...(index % 2 === 0 ? ABBA : BAAB),
  ])
}

export type AbSample = {
  variant: Variant
  block: number
  warmup: boolean
  value: number
}

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

// Diferencia B − A de cada bloque medido (positiva: B es más lenta), en el
// orden de los bloques. No recorta ni descarta nada, salvo el calentamiento,
// que se excluye por regla y no por su valor.
export function pairedDifferences(samples: readonly AbSample[]): number[] {
  const blocks = new Map<number, Record<Variant, number[]>>()
  for (const sample of samples) {
    if (sample.warmup) continue
    if (!Number.isFinite(sample.value)) {
      throw new RangeError('La serie contiene un valor no finito')
    }
    const block = blocks.get(sample.block) ?? { A: [], B: [] }
    block[sample.variant].push(sample.value)
    blocks.set(sample.block, block)
  }
  if (blocks.size === 0) {
    throw new RangeError('No hay bloques medidos: solo hay calentamiento')
  }
  return [...blocks.entries()]
    .sort(([first], [second]) => first - second)
    .map(([number, values]) => {
      const missing =
        values.A.length === 0 ? 'A' : values.B.length === 0 ? 'B' : null
      if (missing) {
        throw new RangeError(
          `Al bloque ${number} le falta la versión ${missing}`,
        )
      }
      return mean(values.B) - mean(values.A)
    })
}

// t de Student, dos colas al 95 %, tabulada: evita escribir un cuantil
// numérico para un solo uso. Entre dos entradas se usa la de menos grados de
// libertad, con lo que la t es algo mayor y el intervalo nunca sale más
// estrecho de lo que es.
const T_95: readonly (readonly [degrees: number, value: number])[] = [
  [1, 12.706],
  [2, 4.303],
  [3, 3.182],
  [4, 2.776],
  [5, 2.571],
  [6, 2.447],
  [7, 2.365],
  [8, 2.306],
  [9, 2.262],
  [10, 2.228],
  [11, 2.201],
  [12, 2.179],
  [13, 2.16],
  [14, 2.145],
  [15, 2.131],
  [16, 2.12],
  [17, 2.11],
  [18, 2.101],
  [19, 2.093],
  [20, 2.086],
  [21, 2.08],
  [22, 2.074],
  [23, 2.069],
  [24, 2.064],
  [25, 2.06],
  [26, 2.056],
  [27, 2.052],
  [28, 2.048],
  [29, 2.045],
  [30, 2.042],
  [40, 2.021],
  [60, 2.0],
  [120, 1.98],
]

export function tCritical95(degreesOfFreedom: number): number {
  if (!Number.isInteger(degreesOfFreedom) || degreesOfFreedom < 1) {
    throw new RangeError(
      `Los grados de libertad deben ser un entero positivo y son ${degreesOfFreedom}`,
    )
  }
  let value = T_95[0][1]
  for (const [degrees, critical] of T_95) {
    if (degrees <= degreesOfFreedom) value = critical
  }
  return value
}

export type DifferenceSummary = {
  blocks: number
  mean: number
  median: number
  stdDev: number
  standardError: number
  // Mitad del intervalo del 95 %: lo más pequeño que esta medición distingue.
  halfWidth: number
  ciLow: number
  ciHigh: number
  // Bloques en que B salió más lenta que A (los empates no cuentan).
  slower: number
}

// Intervalo del 95 % de la diferencia media entre bloques. Supone diferencias
// aproximadamente normales e independientes entre bloques; con pocos bloques,
// o con una deriva que no cancele el ABBA, el intervalo real es algo más ancho.
export function summarizeDifferences(
  differences: readonly number[],
): DifferenceSummary {
  const spread = dispersion(differences)
  const standardError = spread.stdDev / Math.sqrt(spread.count)
  const halfWidth = tCritical95(spread.count - 1) * standardError
  return {
    blocks: spread.count,
    mean: spread.mean,
    median: median(differences),
    stdDev: spread.stdDev,
    standardError,
    halfWidth,
    ciLow: spread.mean - halfWidth,
    ciHigh: spread.mean + halfWidth,
    slower: differences.filter((difference) => difference > 0).length,
  }
}

// --- Validez de las peticiones -----------------------------------------------
//
// Una petición que falla no hace fallar la carga: la página sale sin estilos, o
// sin una imagen, y aun así hay FCP y LCP. Sin esta comprobación esa muestra
// parecería válida y se mediría otra página.

export type RequestOutcome = {
  url: string
  type: string
  status: number | null
  mimeType: string | null
  encodedBytes: number
  fromCache: boolean
  failed: string | null
}

const requestName = (url: string) => {
  const { pathname, search } = new URL(url)
  return pathname + search
}

// Tipos de contenido sin los que el navegador ignora el recurso en silencio.
const EXPECTED_MIME: Record<string, { pattern: RegExp; text: string }> = {
  Document: { pattern: /^text\/html$/, text: 'text/html' },
  Stylesheet: { pattern: /^text\/css$/, text: 'text/css' },
  Script: {
    pattern: /^(?:text|application)\/(?:x-)?(?:java|ecma)script$/,
    text: 'JavaScript',
  },
}

// Qué peticiones invalidan una carga. El caso traicionero es el servidor que
// contesta 200 con `index.html` a una ruta que no existe (el fallback de una
// SPA): la red «funciona» y el recurso no se aplica.
export function requestProblems(requests: readonly RequestOutcome[]): string[] {
  const problems: string[] = []
  for (const request of requests) {
    const name = requestName(request.url)
    if (request.failed !== null) {
      problems.push(`${name} falló: ${request.failed}`)
    } else if (request.status === null) {
      problems.push(`${name} terminó sin respuesta`)
    } else if (request.status < 200 || request.status >= 300) {
      problems.push(`${name} respondió ${request.status}`)
    } else {
      const mime = request.mimeType ?? ''
      const expected = EXPECTED_MIME[request.type]
      if (expected && !expected.pattern.test(mime)) {
        problems.push(
          `${name}: se esperaba ${expected.text} y llegó ${mime || 'nada'}`,
        )
      } else if (!expected && mime === 'text/html') {
        problems.push(
          `${name} (${request.type}) llegó como HTML: ¿ruta inexistente servida por el fallback de la SPA?`,
        )
      }
    }
  }
  return problems
}

export type EntryDownload = {
  kind: 'stylesheet' | 'script' | 'preload'
  url: string
  encodedBytes: number
}

export type ExtraAsset = { type: string; url: string; encodedBytes: number }

// «CSS de entrada» es lo que referencia `index.html`; «descargado» es lo que
// el navegador pidió de verdad. Aquí se contrastan: todo lo referenciado tiene
// que haberse descargado por la red (con la caché fría, una copia en caché no
// vale) y lo descargado que no esté referenciado consta aparte, sin ser un
// error: es lo que distingue la entrada de lo que se carga después.
export function checkEntryDownloads(
  requests: readonly RequestOutcome[],
  entry: EntryAssets,
  origin: string,
): { problems: string[]; downloaded: EntryDownload[]; extra: ExtraAsset[] } {
  const problems = requestProblems(requests)
  const delivered = requests.filter(
    (request) =>
      request.failed === null &&
      request.status !== null &&
      request.status >= 200 &&
      request.status < 300 &&
      !request.fromCache,
  )
  if (!delivered.some((request) => request.type === 'Document')) {
    problems.push('No hay petición del documento')
  }

  const base = `${origin}/`
  const referenced = [
    ...entry.stylesheets.map((ref) => ({ kind: 'stylesheet' as const, ref })),
    ...entry.scripts.map((ref) => ({ kind: 'script' as const, ref })),
    ...entry.preloads.map((ref) => ({ kind: 'preload' as const, ref })),
  ]
  const downloaded: EntryDownload[] = []
  const known = new Set<string>()
  for (const { kind, ref } of referenced) {
    const url = new URL(ref, base).href
    known.add(url)
    const hits = delivered.filter((request) => request.url === url)
    if (hits.length === 0) {
      problems.push(`${ref} está en index.html y el navegador no lo descargó`)
      continue
    }
    downloaded.push({
      kind,
      url,
      encodedBytes: hits.reduce((sum, hit) => sum + hit.encodedBytes, 0),
    })
  }

  const extra = delivered
    .filter(
      (request) =>
        (request.type === 'Stylesheet' || request.type === 'Script') &&
        !known.has(request.url),
    )
    .map(({ type, url, encodedBytes }) => ({ type, url, encodedBytes }))
  return { problems, downloaded, extra }
}
