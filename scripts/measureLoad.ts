// Arnés de medición de carga (008-plan §7; protocolo de E2). Solo se invoca a mano:
//   npm run measure:load -- --rounds 10 --json resultados.json
//   npm run measure:load -- --a <build A> --b <build B> --blocks 8 --json ab.json
// No cuelga de `build`, de scripts pre/post ni de CI, y no añade dependencias:
// usa el Playwright y el Vite ya instalados.
//
// Dos modos:
//  · Una versión (por defecto): compila el árbol de trabajo en una carpeta
//    temporal y mide su línea base y su dispersión (rondas de mediana de 5).
//  · Comparación A/B (--a y --b): mide dos builds ya compiladas, cada una con su
//    `vite preview`, alternando ABBA y BAAB en la misma sesión. Tras un
//    calentamiento predefinido (WARMUP_BLOCKS bloques, igual para las dos) se
//    conservan todas las muestras y se analiza la diferencia B − A de cada bloque
//    con su intervalo del 95 %. Para compilar una versión en su carpeta:
//    `npx vite build --outDir <carpeta> --emptyOutDir`. Pasar la misma carpeta
//    como A y como B es un control A/A.
//
// Opciones (todas opcionales salvo --a y --b juntas):
//   --rounds <n>        rondas de la mediana, para medir la dispersión (1)
//   --samples <n>       cargas por ronda (5)
//   --a <carpeta>       build de referencia (con --b: modo A/B)
//   --b <carpeta>       build candidata; la diferencia es B − A (positiva: B más lenta)
//   --blocks <n>        bloques medidos por perfil, un número par (8)
//   --profiles <ids>    unthrottled,fast4g,slow4g; también fast4g-devtools y
//                       slow4g-devtools, los presets de DevTools
//   --host <nombre>     host del servidor y del navegador (127.0.0.1)
//   --fresh-browser     un navegador nuevo por muestra, no uno compartido
//   --dpr <n>           factor de píxel del dispositivo (1)
//   --channel <canal>   canal de Chromium (headless shell de Playwright)
//   --no-screens        omite el recorrido por pantallas
//   --json <ruta>       guarda todas las muestras
// El puerto es LOAD_PORT (4199); en modo A/B, B usa el siguiente.
import {
  chromium,
  type Browser,
  type CDPSession,
  type Page,
} from '@playwright/test'
import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { cpus, freemem, platform, release, tmpdir, totalmem } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { parseArgs } from 'node:util'
import {
  GZIP_OPTIONS,
  WARMUP_BLOCKS,
  abbaSchedule,
  assetStem,
  checkEntryDownloads,
  cpuBusyFraction,
  dispersion,
  entryAssets,
  gzipSize,
  median,
  pairedDifferences,
  requestProblems,
  summarizeDifferences,
  type EntryAssets,
  type EntryDownload,
  type ExtraAsset,
  type Variant,
} from './loadMetrics.ts'

const ROOT = resolve(import.meta.dirname, '..')
const VITE_BIN = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
// No el 4173 de `vite preview`: suele estar ocupado por un servidor ajeno y, con
// --strictPort, preferimos fallar a medir otro proceso (tech-stack §50).
const PORT = Number(process.env.LOAD_PORT ?? 4199)
const VIEWPORT = { width: 390, height: 844 }
// Lo que el build lee: si cambia respecto a HEAD, la cifra ya no es de HEAD.
const BUILD_INPUTS = [
  'src',
  'public',
  'index.html',
  'vite.config.ts',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
]

type Profile = {
  id: string
  label: string
  // Parámetros de Network.emulateNetworkConditions; null = sin limitar.
  network: {
    latency: number
    downloadThroughput: number
    uploadThroughput: number
  } | null
  cpuRate: number
}

// Latencia en ms y caudales en bytes/s (Network.emulateNetworkConditions).
// Los tres primeros son los perfiles de E2, tal como los definió su guion del
// 2026-10-23: el plan solo los nombra y no registró los números. Al comparar
// con la línea base de E2 hay que usar estos, no los presets de DevTools.
const PROFILES: readonly Profile[] = [
  { id: 'unthrottled', label: 'Sin limitar', network: null, cpuRate: 1 },
  {
    id: 'fast4g',
    label: 'Fast 4G + CPU 4×',
    network: {
      latency: 150,
      downloadThroughput: (9 * 1024 * 1024) / 8,
      uploadThroughput: (1.5 * 1024 * 1024) / 8,
    },
    cpuRate: 4,
  },
  {
    id: 'slow4g',
    label: 'Slow 4G + CPU 4×',
    network: {
      latency: 400,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    },
    cpuRate: 4,
  },
  // Presets «Fast 4G» y «Slow 4G» de Chrome DevTools (devtools-frontend,
  // front_end/core/sdk/NetworkManager.ts, 2026-10-27): 0,9 al caudal, ×2,75 y
  // ×3,75 a la latencia objetivo. No se miden por defecto; sirven para ver cuánto
  // depende la cifra de cómo se defina el perfil.
  {
    id: 'fast4g-devtools',
    label: 'Fast 4G DevTools + CPU 4×',
    network: {
      latency: 60 * 2.75,
      downloadThroughput: (((9 * 1000 * 1000) / 8) * 9) / 10,
      uploadThroughput: (((1.5 * 1000 * 1000) / 8) * 9) / 10,
    },
    cpuRate: 4,
  },
  {
    id: 'slow4g-devtools',
    label: 'Slow 4G DevTools + CPU 4×',
    network: {
      latency: 150 * 3.75,
      downloadThroughput: (((1.6 * 1000 * 1000) / 8) * 9) / 10,
      uploadThroughput: (((750 * 1000) / 8) * 9) / 10,
    },
    cpuRate: 4,
  },
]
const DEFAULT_PROFILES = ['unthrottled', 'fast4g', 'slow4g']

// Las pantallas de la aplicación son estados de AppShell, sin router: se llega a
// cada una como lo hace una persona (las mismas etiquetas que usan los e2e).
const SCREENS: readonly {
  id: string
  enter: (page: Page, origin: string) => Promise<void>
}[] = [
  {
    id: 'landing',
    enter: async (page, origin) => {
      await page.goto(origin, { waitUntil: 'load' })
    },
  },
  {
    id: 'consultation',
    enter: async (page) => {
      await page.getByRole('button', { name: /Empezar/ }).click()
      await page
        .getByRole('textbox', { name: 'Pégalo tal cual te llegó' })
        .waitFor()
    },
  },
  {
    id: 'profile',
    enter: async (page) => {
      await page
        .getByRole('button', {
          name: /^(Responder preguntas|Abrir expediente|Editar expediente)$/,
        })
        .click()
      await page
        .getByRole('heading', { level: 1, name: 'Expediente de tu pareja' })
        .waitFor()
    },
  },
]

// Los candidatos de LCP se recogen desde el inicio del documento: un observador
// creado tras la carga dependería de que el navegador reencole los anteriores.
const OBSERVE_LCP = `
  window.__lcp = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__lcp.push({
        time: entry.startTime,
        size: entry.size,
        tag: entry.element ? entry.element.tagName : null,
        url: entry.url || null,
      });
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
`
// FCP y LCP se publican cuando el navegador presenta el primer fotograma, y en
// una carga fría eso ocurre a veces DESPUÉS de que la red quede en reposo
// (medido: FCP 520–980 ms en la primera carga de un navegador recién lanzado,
// con `networkidle` ya resuelto). Se espera a la señal, no a un tiempo fijo.
const PAINTED = `performance.getEntriesByName('first-contentful-paint').length > 0
  && window.__lcp.length > 0`
const PAINT_TIMEOUT_MS = 15_000
// Dos fotogramas: el primero confirma lo último pintado, el segundo garantiza
// que el navegador ha tenido ocasión de emitir el candidato de LCP resultante.
const NEXT_FRAMES = `new Promise((resolve) =>
  requestAnimationFrame(() => requestAnimationFrame(() => resolve())))`
const READ_METRICS = `(() => {
  const navigation = performance.getEntriesByType('navigation')[0];
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  return {
    fcp: fcp ? fcp.startTime : null,
    lcp: window.__lcp.length ? window.__lcp[window.__lcp.length - 1] : null,
    ttfb: navigation.responseStart,
    documentEnd: navigation.responseEnd,
    domContentLoaded: navigation.domContentLoadedEventEnd,
    load: navigation.loadEventEnd,
    // Cascada: explica qué petición marca el camino crítico en cada perfil.
    waterfall: performance.getEntriesByType('resource').map((entry) => [
      entry.name.split('/').pop(),
      Math.round(entry.startTime),
      Math.round(entry.responseEnd),
    ]),
  };
})()`
// Trabajo fijo de CPU: su duración crece con la limitación y comprueba que
// `Emulation.setCPUThrottlingRate` se aplica de verdad.
const CPU_PROBE = `(() => {
  const start = performance.now();
  let x = 0;
  for (let i = 0; i < 3e7; i++) x = (x + i * 7) % 1000003;
  return { ms: performance.now() - start, x };
})()`

type PageMetrics = {
  fcp: number | null
  lcp: {
    time: number
    size: number
    tag: string | null
    url: string | null
  } | null
  ttfb: number
  documentEnd: number
  domContentLoaded: number
  load: number
  waterfall: [file: string, start: number, end: number][]
}

type RequestRecord = {
  url: string
  type: string
  status: number | null
  mimeType: string | null
  encodedBytes: number
  contentEncoding: string | null
  fromCache: boolean
  failed: string | null
  screen: string
}

type Sample = {
  fcp: number
  lcp: number
  lcpElement: string
  ttfb: number
  documentEnd: number
  domContentLoaded: number
  load: number
  waterfall: [file: string, start: number, end: number][]
  requests: number
  transferredBytes: number
  byType: Record<string, { requests: number; bytes: number }>
  // Lo que index.html referencia y el navegador descargó de verdad, y lo que
  // descargó sin que index.html lo referencie (§ checkEntryDownloads).
  entryDownloads: EntryDownload[]
  extraAssets: ExtraAsset[]
}

// Una build servida: la de la versión única, o una de las dos de A/B.
type Target = {
  label: string
  origin: string
  entry: ReturnType<typeof describeEntry>
  refs: EntryAssets
}

type ComparedSample = Sample & {
  variant: Variant
  profile: string
  block: number
  position: number
  warmup: boolean
  // Milisegundos desde el inicio de las mediciones: sirve para ver la deriva.
  at: number
}

// El servidor de preview es un hijo con sus tuberías abiertas: mientras viva, el
// proceso no termina solo, y el evento `exit` (que lo mataría) no llega. Por eso
// `main` sale con `process.exit` y la limpieza va en orden inverso: primero el
// servidor, después la carpeta que sirve.
const cleanups: (() => void)[] = []
function cleanUp() {
  while (cleanups.length > 0) {
    try {
      cleanups.pop()?.()
    } catch {
      // Es lo último que se hace antes de salir: no hay nada mejor que intentar.
    }
  }
}
process.on('exit', cleanUp)
process.on('SIGINT', () => process.exit(130))

const kB = (bytes: number) => `${(bytes / 1000).toFixed(2)} kB`
const ms = (value: number) => `${Math.round(value)} ms`
const roundTo = (value: number, digits: number) => Number(value.toFixed(digits))

function readOptions() {
  // Sin valores por defecto en las opciones propias de un modo: así se sabe si
  // se pasaron y se rechaza mezclarlas con el otro modo en lugar de ignorarlas.
  const { values } = parseArgs({
    options: {
      rounds: { type: 'string' },
      samples: { type: 'string' },
      blocks: { type: 'string' },
      a: { type: 'string' },
      b: { type: 'string' },
      profiles: { type: 'string', default: DEFAULT_PROFILES.join(',') },
      json: { type: 'string' },
      channel: { type: 'string' },
      dpr: { type: 'string', default: '1' },
      host: { type: 'string', default: '127.0.0.1' },
      'fresh-browser': { type: 'boolean', default: false },
      'no-screens': { type: 'boolean', default: false },
    },
  })
  const positive = (name: string, text: string) => {
    const value = Number(text)
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`--${name} debe ser un entero positivo y es «${text}»`)
    }
    return value
  }
  const dpr = Number(values.dpr)
  if (!(dpr > 0))
    throw new Error(`--dpr debe ser positivo y es «${values.dpr}»`)
  const ids = values.profiles.split(',').map((id) => id.trim())
  const profiles = ids.map((id) => {
    const profile = PROFILES.find((candidate) => candidate.id === id)
    if (!profile) throw new Error(`Perfil desconocido «${id}»`)
    return profile
  })

  const compare = values.a !== undefined || values.b !== undefined
  if (compare) {
    if (values.a === undefined || values.b === undefined) {
      throw new Error(
        '--a y --b van juntas: son las dos builds que se comparan',
      )
    }
    const incompatible = [
      values.rounds !== undefined && '--rounds',
      values.samples !== undefined && '--samples',
      values['fresh-browser'] && '--fresh-browser',
    ].filter(Boolean)
    if (incompatible.length > 0) {
      throw new Error(
        `${incompatible.join(' y ')} no se combina con --a/--b: la comparación usa el protocolo ABBA/BAAB con un navegador compartido`,
      )
    }
  } else if (values.blocks !== undefined) {
    throw new Error('--blocks solo se usa con --a y --b')
  }
  const blocks = positive('blocks', values.blocks ?? '8')
  // ABBA y BAAB se alternan: con un número impar una versión abriría más bloques.
  if (blocks % 2 !== 0) {
    throw new Error(
      `--blocks debe ser par para equilibrar ABBA y BAAB y es ${blocks}`,
    )
  }

  return {
    rounds: positive('rounds', values.rounds ?? '1'),
    samples: positive('samples', values.samples ?? '5'),
    blocks,
    compare: compare
      ? { a: resolve(values.a ?? ''), b: resolve(values.b ?? '') }
      : null,
    profiles,
    json: values.json,
    channel: values.channel,
    dpr,
    host: values.host,
    freshBrowser: values['fresh-browser'],
    screens: !values['no-screens'],
  }
}

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()
}

function gitState() {
  try {
    return {
      commit: git('rev-parse', 'HEAD'),
      modifiedBuildInputs: git('status', '--porcelain', '--', ...BUILD_INPUTS)
        .split('\n')
        .filter(Boolean),
    }
  } catch {
    return null
  }
}

// Carga de fondo de la máquina: no decide nada, explica el ruido de una medición.
async function backgroundCpuLoad(): Promise<number> {
  const before = cpus()
  await sleep(2000)
  return cpuBusyFraction(before, cpus())
}

function build(outDir: string): string[] {
  const output = execFileSync(
    process.execPath,
    [VITE_BIN, 'build', '--outDir', outDir, '--emptyOutDir'],
    { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' },
  )
  // Vite imprime las rutas relativas a la raíz; la carpeta temporal solo estorba.
  const prefix = `${relative(ROOT, outDir).replaceAll('\\', '/')}/`
  // Las líneas con tamaños son las que E1 registró (JS y CSS, en kB).
  return output
    .split('\n')
    .filter((line) => /\bkB\b/.test(line))
    .map((line) => line.replace(prefix, '').trim())
}

// Lo que la build dice que carga la entrada: se lee de `index.html` y de los
// ficheros, no de la red. Que el navegador lo descargue de verdad es otra
// comprobación, la de cada muestra (checkEntryDownloads).
function describeEntry(outDir: string) {
  if (!existsSync(join(outDir, 'index.html'))) {
    throw new Error(
      `La carpeta ${outDir} no tiene index.html: ¿está compilada?`,
    )
  }
  const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  const refs = entryAssets(html)
  const size = (path: string) => {
    const content = readFileSync(join(outDir, path.replace(/^\//, '')))
    return {
      path,
      bytes: content.length,
      // gzipSync de Node con opciones fijas (plan §7). El «gzip» del informe de
      // Vite 8 lo calcula su reporter nativo y sale algo mayor (CSS 9,82 frente
      // a 9,78 kB), así que no son comparables.
      gzipBytes: gzipSize(content),
    }
  }
  return {
    html,
    stylesheets: refs.stylesheets.map(size),
    scripts: refs.scripts.map(size),
    preloads: refs.preloads.map(size),
  }
}

function portIsFree(port: number, host: string): Promise<boolean> {
  return new Promise((done) => {
    const probe = createServer()
    probe.once('error', () => done(false))
    probe.listen(port, host, () => probe.close(() => done(true)))
  })
}

async function startPreview(
  outDir: string,
  expectedHtml: string,
  host: string,
  port: number,
): Promise<ChildProcess> {
  if (!(await portIsFree(port, host))) {
    throw new Error(
      `El puerto ${port} está ocupado por otro proceso; indica otro con LOAD_PORT`,
    )
  }
  const child = spawn(
    process.execPath,
    [
      VITE_BIN,
      'preview',
      '--outDir',
      outDir,
      '--host',
      host,
      '--port',
      String(port),
      '--strictPort',
    ],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  cleanups.push(() => child.kill())
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))
  let exited = false
  child.once('exit', () => (exited = true))

  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    if (exited)
      throw new Error(`vite preview terminó antes de responder:\n${output}`)
    try {
      const response = await fetch(`http://${host}:${port}/`)
      // Que responda no basta: tiene que ser el servidor de esta build.
      if ((await response.text()).trim() === expectedHtml.trim()) return child
      throw new Error(`El puerto ${port} sirve algo que no es esta build`)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('no es esta build')
      ) {
        throw error
      }
      await sleep(150)
    }
  }
  throw new Error(`vite preview no respondió en 15 s:\n${output}`)
}

function headerValue(headers: Record<string, string>, name: string) {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name)
  return key ? headers[key] : null
}

function recordNetwork(cdp: CDPSession) {
  const inflight = new Map<string, RequestRecord>()
  const done: RequestRecord[] = []
  const state = { screen: 'landing' }
  let lastActivity = Date.now()
  cdp.on('Network.requestWillBeSent', (event) => {
    // Los data: y blob: no son red.
    if (!event.request.url.startsWith('http')) return
    lastActivity = Date.now()
    inflight.set(event.requestId, {
      url: event.request.url,
      type: event.type ?? 'Other',
      status: null,
      mimeType: null,
      encodedBytes: 0,
      contentEncoding: null,
      fromCache: false,
      failed: null,
      screen: state.screen,
    })
  })
  cdp.on('Network.requestServedFromCache', ({ requestId }) => {
    const record = inflight.get(requestId)
    if (record) record.fromCache = true
  })
  cdp.on('Network.responseReceived', ({ requestId, response }) => {
    const record = inflight.get(requestId)
    if (!record) return
    record.status = response.status
    record.mimeType = response.mimeType
    record.contentEncoding = headerValue(response.headers, 'content-encoding')
    if (response.fromDiskCache) record.fromCache = true
  })
  cdp.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => {
    const record = inflight.get(requestId)
    if (!record) return
    lastActivity = Date.now()
    record.encodedBytes = encodedDataLength
    inflight.delete(requestId)
    done.push(record)
  })
  cdp.on('Network.loadingFailed', ({ requestId, errorText }) => {
    const record = inflight.get(requestId)
    if (!record) return
    lastActivity = Date.now()
    record.failed = errorText
    inflight.delete(requestId)
    done.push(record)
  })

  // `waitForLoadState('networkidle')` solo vale para el documento: tras la
  // primera carga resuelve al instante, y una descarga lenta iniciada por una
  // transición de la SPA se perdería (medido en Slow 4G con `sofi-peek`).
  async function idle(quietMs = 500, timeoutMs = 30_000): Promise<void> {
    // El silencio se cuenta desde la llamada como mínimo: justo tras un clic aún
    // no han empezado las peticiones que provoca (efectos, imágenes que se montan).
    const startedAt = Date.now()
    const deadline = startedAt + timeoutMs
    while (Date.now() < deadline) {
      const quietFor = Date.now() - Math.max(lastActivity, startedAt)
      if (inflight.size === 0 && quietFor >= quietMs) return
      await sleep(50)
    }
    throw new Error(
      `La red no quedó en reposo en ${timeoutMs} ms (${inflight.size} peticiones pendientes)`,
    )
  }

  return { done, state, idle }
}

// Un contexto nuevo por muestra es la «caché fría»: cada contexto tiene su
// propia caché HTTP y no comparte nada con los anteriores.
async function openPage(browser: Browser, profile: Profile, dpr: number) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: dpr,
  })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  if (profile.network) {
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      ...profile.network,
    })
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate })
  const network = recordNetwork(cdp)
  await page.addInitScript(OBSERVE_LCP)
  return { page, network, close: () => context.close() }
}

// Una carga con peticiones fallidas, o con una entrada que no se descargó, no
// mide esta build sino otra página (sin estilos, sin una imagen…) y aun así da
// FCP y LCP. Se aborta con la causa en lugar de guardar una cifra que parece
// válida; no se reintenta ni se descarta en silencio.
function assertValid(problems: string[], context: string) {
  if (problems.length > 0) {
    throw new Error(
      `Carga inválida (${context}):\n  - ${problems.join('\n  - ')}`,
    )
  }
}

async function takeSample(
  browser: Browser,
  target: Target,
  profile: Profile,
  dpr: number,
): Promise<Sample> {
  const { page, network, close } = await openPage(browser, profile, dpr)
  const context = `${target.label}, ${profile.id}`
  try {
    await page.goto(target.origin, { waitUntil: 'load' })
    try {
      await page.waitForFunction(PAINTED, undefined, {
        timeout: PAINT_TIMEOUT_MS,
      })
    } catch (error) {
      // Sin primer fotograma lo habitual es que una petición haya fallado.
      assertValid(
        requestProblems(network.done),
        `${context}, sin primer fotograma`,
      )
      throw error
    }
    // Sin peticiones durante 500 ms: lo que se pide tras `load` (fuentes,
    // imágenes) también cuenta como carga de la pantalla.
    await network.idle()
    const check = checkEntryDownloads(network.done, target.refs, target.origin)
    assertValid(check.problems, context)
    await page.evaluate(NEXT_FRAMES)
    const metrics = (await page.evaluate(READ_METRICS)) as PageMetrics
    if (metrics.fcp === null || metrics.lcp === null) {
      throw new Error(`Faltan FCP o LCP: ${JSON.stringify(metrics)}`)
    }
    const byType: Sample['byType'] = {}
    let transferredBytes = 0
    for (const request of network.done) {
      const entry = (byType[request.type] ??= { requests: 0, bytes: 0 })
      entry.requests++
      entry.bytes += request.encodedBytes
      transferredBytes += request.encodedBytes
    }
    return {
      fcp: metrics.fcp,
      lcp: metrics.lcp.time,
      lcpElement: metrics.lcp.tag ?? 'desconocido',
      ttfb: metrics.ttfb,
      documentEnd: metrics.documentEnd,
      domContentLoaded: metrics.domContentLoaded,
      load: metrics.load,
      waterfall: metrics.waterfall,
      requests: network.done.length,
      transferredBytes,
      byType,
      entryDownloads: check.downloaded,
      extraAssets: check.extra,
    }
  } finally {
    await close()
  }
}

// Régimen de arranque de cada muestra. Por defecto, un único navegador para toda
// la sesión y un contexto nuevo por muestra, como el guion de E2; su primera
// carga, que paga el arranque del propio navegador, se descarta. Con
// `--fresh-browser` cada muestra lanza un navegador nuevo y paga ese arranque
// (FCP ≈ 3× mayor sin limitar y con mucha más varianza): otra cifra, no un
// error. Se anota con cada resultado.
async function withBrowser<T>(
  channel: string | undefined,
  shared: Browser | null,
  run: (browser: Browser) => Promise<T>,
): Promise<T> {
  if (shared) return run(shared)
  const browser = await chromium.launch({ channel })
  try {
    return await run(browser)
  } finally {
    await browser.close()
  }
}

// Si la limitación de red se perdiera, las cifras «limitadas» serían falsas sin
// que nada lo delatara. Chromium aplica la latencia emulada antes del cuerpo y
// no a las cabeceras (medido: `responseStart` sigue en ~10 ms), así que lo que
// la refleja es cuándo termina de llegar el documento.
function assertThrottled(profile: Profile, sample: Sample) {
  if (profile.network && sample.documentEnd < profile.network.latency * 0.8) {
    throw new Error(
      `El perfil ${profile.id} no se está aplicando: el documento terminó de llegar en ${ms(sample.documentEnd)} frente a una latencia de ${ms(profile.network.latency)}`,
    )
  }
}

async function cpuProbe(browser: Browser, profile: Profile, dpr: number) {
  const { page, close } = await openPage(browser, profile, dpr)
  try {
    const durations: number[] = []
    for (let i = 0; i < 3; i++) {
      const result = (await page.evaluate(CPU_PROBE)) as { ms: number }
      durations.push(result.ms)
    }
    return median(durations)
  } finally {
    await close()
  }
}

function stripStems(): Set<string> {
  return new Set(
    readdirSync(join(ROOT, 'src', 'styles', 'sprites'))
      .filter((file) => file.endsWith('.webp'))
      .map((file) => file.replace(/\.webp$/, '')),
  )
}

async function walkScreens(
  browser: Browser,
  target: Target,
  profile: Profile,
  dpr: number,
) {
  const strips = stripStems()
  const { page, network, close } = await openPage(browser, profile, dpr)
  try {
    for (const screen of SCREENS) {
      network.state.screen = screen.id
      await screen.enter(page, target.origin)
      await network.idle()
    }
  } finally {
    await close()
  }
  // Una tira que falla no es «una descarga menos» de esa pantalla: el recorrido
  // no es válido y el recuento por pantalla sería falso.
  assertValid(
    requestProblems(network.done),
    `recorrido de pantallas, ${target.label}, ${profile.id}`,
  )
  return SCREENS.map((screen) => {
    const webp = network.done.filter(
      (request) =>
        request.screen === screen.id &&
        new URL(request.url).pathname.endsWith('.webp'),
    )
    const byUrl = new Map<string, RequestRecord[]>()
    for (const request of webp) {
      byUrl.set(request.url, [...(byUrl.get(request.url) ?? []), request])
    }
    return {
      screen: screen.id,
      webp: [...byUrl.entries()].map(([url, requests]) => {
        const stem = assetStem(url)
        return {
          file: new URL(url).pathname.split('/').pop() ?? url,
          kind: stem !== null && strips.has(stem) ? 'strip' : 'other',
          requests: requests.length,
          // Más de una petición de red a la misma URL es una descarga doble.
          networkRequests: requests.filter((request) => !request.fromCache)
            .length,
          bytes: requests.reduce(
            (sum, request) => sum + request.encodedBytes,
            0,
          ),
        }
      }),
    }
  })
}

function describeMachine() {
  const cpu = cpus()
  return {
    os: `${platform()} ${release()}`,
    cpu: cpu[0]?.model.trim() ?? 'desconocida',
    logicalCpus: cpu.length,
    totalMemoryGB: roundTo(totalmem() / 2 ** 30, 1),
    freeMemoryGB: roundTo(freemem() / 2 ** 30, 1),
    node: process.version,
    // El gzip del CSS de entrada depende del zlib de Node: se anota con la cifra.
    zlib: process.versions.zlib,
  }
}

type ScreenWalk = Awaited<ReturnType<typeof walkScreens>>[number]

type Options = ReturnType<typeof readOptions>
type Round = { samples: Sample[]; medians: Record<string, number> }
type ProfileResult = { profile: Profile; cpuProbeMs: number; rounds: Round[] }

// Métricas sobre las que se analizan las diferencias A/B. Los bytes y las
// peticiones no entran: son deterministas y se comparan tal cual.
const COMPARED_METRICS = ['fcp', 'lcp'] as const

const signed = (value: number) =>
  `${value < 0 ? '−' : '+'}${Math.round(Math.abs(value))}`

// Una build servida con su `vite preview`, que es hijo del arnés y mata la
// limpieza. Las dos builds de A/B se sirven igual: mismo servidor, mismo host.
async function serve(
  label: string,
  dir: string,
  host: string,
  port: number,
): Promise<Target> {
  const entry = describeEntry(dir)
  for (const file of [
    ...entry.stylesheets,
    ...entry.scripts,
    ...entry.preloads,
  ]) {
    console.log(
      `  ${label} · entrada ${file.path}: ${file.bytes} B · gzipSync ${file.gzipBytes} B`,
    )
  }
  await startPreview(dir, entry.html, host, port)
  return {
    label,
    origin: `http://${host}:${port}`,
    entry,
    refs: entryAssets(entry.html),
  }
}

// Rondas en el bucle exterior: así cada perfil reparte sus rondas por toda la
// sesión y la deriva de la máquina entra en su dispersión.
async function runRounds(
  options: Options,
  target: Target,
  shared: Browser | null,
  results: ProfileResult[],
) {
  for (let round = 1; round <= options.rounds; round++) {
    for (const result of results) {
      const samples: Sample[] = []
      for (let i = 0; i < options.samples; i++) {
        const sample = await withBrowser(options.channel, shared, (browser) =>
          takeSample(browser, target, result.profile, options.dpr),
        )
        assertThrottled(result.profile, sample)
        samples.push(sample)
      }
      const medians = {
        fcp: median(samples.map((s) => s.fcp)),
        lcp: median(samples.map((s) => s.lcp)),
        ttfb: median(samples.map((s) => s.ttfb)),
        load: median(samples.map((s) => s.load)),
        transferredBytes: median(samples.map((s) => s.transferredBytes)),
        requests: median(samples.map((s) => s.requests)),
      }
      result.rounds.push({ samples, medians })
      console.log(
        `  ronda ${round}/${options.rounds} · ${result.profile.label.padEnd(18)} FCP ${ms(medians.fcp).padStart(8)} (${samples.map((s) => Math.round(s.fcp)).join(', ')}) · LCP ${ms(medians.lcp)}`,
      )
    }
  }
}

// Calendario ABBA/BAAB: bloque a bloque y, dentro de cada uno, perfil a perfil.
// Las dos versiones comparten navegador, perfiles y servidor; solo cambia el
// origen. Los bloques de calentamiento se miden y se conservan como los demás.
async function runComparison(
  options: Options,
  targets: Record<Variant, Target>,
  browser: Browser,
): Promise<ComparedSample[]> {
  const schedule = abbaSchedule(WARMUP_BLOCKS + options.blocks)
  const samples: ComparedSample[] = []
  const startedAt = Date.now()
  for (const [block, order] of schedule.entries()) {
    const warmup = block < WARMUP_BLOCKS
    const title = warmup
      ? `calentamiento ${block + 1}/${WARMUP_BLOCKS}`
      : `bloque ${block - WARMUP_BLOCKS + 1}/${options.blocks}`
    for (const profile of options.profiles) {
      const taken: ComparedSample[] = []
      for (const [position, variant] of order.entries()) {
        try {
          const sample = await takeSample(
            browser,
            targets[variant],
            profile,
            options.dpr,
          )
          assertThrottled(profile, sample)
          taken.push({
            ...sample,
            variant,
            profile: profile.id,
            block,
            position,
            warmup,
            at: Date.now() - startedAt,
          })
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error)
          throw new Error(
            `${title}, posición ${position + 1} (${variant}): ${reason}`,
          )
        }
      }
      samples.push(...taken)
      const fcp = (variant: Variant) =>
        taken
          .filter((sample) => sample.variant === variant)
          .map((sample) => Math.round(sample.fcp))
          .join(' · ')
      console.log(
        `  ${title} · ${profile.label.padEnd(18)} ${order.join('')} · FCP A ${fcp('A')} · B ${fcp('B')}`,
      )
    }
  }
  return samples
}

function analyseComparison(samples: ComparedSample[], profiles: Profile[]) {
  return profiles.flatMap((profile) =>
    COMPARED_METRICS.map((metric) => {
      const own = samples.filter((sample) => sample.profile === profile.id)
      const measured = (variant: Variant) =>
        own
          .filter((sample) => !sample.warmup && sample.variant === variant)
          .map((sample) => sample[metric])
      const summary = summarizeDifferences(
        pairedDifferences(
          own.map((sample) => ({
            variant: sample.variant,
            block: sample.block,
            warmup: sample.warmup,
            value: sample[metric],
          })),
        ),
      )
      return {
        profile: profile.id,
        metric,
        a: median(measured('A')),
        b: median(measured('B')),
        ...summary,
      }
    }),
  )
}

function reportRounds(results: ProfileResult[]) {
  const reference = results.find((r) => r.profile.id === 'unthrottled')
  for (const { profile, cpuProbeMs, rounds } of results) {
    const fcpMedians = rounds.map((r) => r.medians.fcp)
    const ratio = reference
      ? ` · ×${roundTo(cpuProbeMs / reference.cpuProbeMs, 2)} frente a sin limitar`
      : ''
    console.log(`\n${profile.label}`)
    console.log(`  Sonda de CPU: ${ms(cpuProbeMs)}${ratio}`)
    console.log(
      `  Mediana de las rondas: FCP ${ms(median(fcpMedians))} · LCP ${ms(median(rounds.map((r) => r.medians.lcp)))} · ${kB(median(rounds.map((r) => r.medians.transferredBytes)))} en ${median(rounds.map((r) => r.medians.requests))} peticiones`,
    )
    if (rounds.length > 1) {
      const spread = dispersion(fcpMedians)
      console.log(
        `  Dispersión de la mediana de FCP: mín ${ms(spread.min)} · máx ${ms(spread.max)} · rango ${ms(spread.range)} · σ ${ms(spread.stdDev)}`,
      )
    }
  }
}

function reportComparison(
  analysis: ReturnType<typeof analyseComparison>,
  samples: ComparedSample[],
  targets: Record<Variant, Target>,
  profiles: Profile[],
) {
  const css = (target: Target) =>
    target.entry.stylesheets.reduce((sum, file) => sum + file.gzipBytes, 0)
  console.log(
    `\nCSS de entrada (gzipSync): A ${css(targets.A)} B · B ${css(targets.B)} B · B − A ${signed(css(targets.B) - css(targets.A))} B`,
  )
  for (const profile of profiles) {
    console.log(`\n${profile.label}`)
    const measured = (variant: Variant) =>
      samples.filter(
        (s) => s.profile === profile.id && !s.warmup && s.variant === variant,
      )
    const transferred = (variant: Variant) =>
      `${kB(median(measured(variant).map((s) => s.transferredBytes)))} en ${median(measured(variant).map((s) => s.requests))}`
    console.log(
      `  Transferido (mediana): A ${transferred('A')} peticiones · B ${transferred('B')} peticiones`,
    )
    for (const row of analysis.filter((r) => r.profile === profile.id)) {
      console.log(
        `  ${row.metric.toUpperCase()}: A ${ms(row.a)} · B ${ms(row.b)} · B − A ${signed(row.mean)} ms, IC 95 %: ${signed(row.ciLow)} a ${signed(row.ciHigh)} ms (±${Math.round(row.halfWidth)}) · ${row.blocks} bloques, B más lenta en ${row.slower}`,
      )
    }
  }
}

function reportScreens(
  screens: { profile: string; variant: string; screens: ScreenWalk[] }[],
) {
  for (const { profile, variant, screens: walked } of screens) {
    console.log(`\nWebP por pantalla (${variant}, ${profile})`)
    for (const screen of walked) {
      const names = screen.webp
        .map(
          (file) =>
            `${file.file} [${file.kind}${file.networkRequests > 1 ? `, ${file.networkRequests} descargas` : ''}]`,
        )
        .join(', ')
      console.log(`  ${screen.screen}: ${names || 'ninguna'}`)
    }
  }
}

async function main() {
  const options = readOptions()
  const require = createRequire(import.meta.url)
  const playwrightVersion = (
    require('@playwright/test/package.json') as { version: string }
  ).version

  console.log('Ask Sofi · medición de carga (008-plan §7)')
  const state = options.compare ? null : gitState()
  if (!options.compare) {
    console.log(
      `Commit ${state?.commit.slice(0, 7) ?? '?'} · entradas de build modificadas: ${
        state ? state.modifiedBuildInputs.length || 'ninguna' : 'sin git'
      }`,
    )
    for (const line of state?.modifiedBuildInputs ?? [])
      console.log(`  ${line}`)
  }

  const cpuLoadBefore = await backgroundCpuLoad()
  console.log(
    `Carga de CPU de fondo antes de empezar: ${roundTo(cpuLoadBefore * 100, 1)} %`,
  )

  let buildLines: string[] = []
  let targets: Target[]
  if (options.compare) {
    targets = [
      await serve('A', options.compare.a, options.host, PORT),
      await serve('B', options.compare.b, options.host, PORT + 1),
    ]
  } else {
    const outDir = mkdtempSync(join(tmpdir(), 'ask-sofi-load-'))
    // Reintentos: en Windows el servidor puede tardar un instante en soltar los ficheros.
    cleanups.push(() =>
      rmSync(outDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      }),
    )
    console.log('Compilando…')
    buildLines = build(outDir)
    for (const line of buildLines) console.log(`  ${line.trim()}`)
    targets = [await serve('build', outDir, options.host, PORT)]
  }

  // Un navegador para leer la versión y sondear la CPU de cada perfil. En el
  // régimen por defecto, y siempre en A/B, es también el que mide el resto de
  // la sesión.
  const probe = await chromium.launch({ channel: options.channel })
  try {
    const results: ProfileResult[] = []
    for (const profile of options.profiles) {
      results.push({
        profile,
        cpuProbeMs: await cpuProbe(probe, profile, options.dpr),
        rounds: [],
      })
    }
    const regime = options.compare
      ? `navegador compartido; ${WARMUP_BLOCKS} bloques de calentamiento ABBA/BAAB, iguales para A y B`
      : options.freshBrowser
        ? 'navegador nuevo por muestra'
        : 'navegador compartido, calentado'
    const machine = {
      ...describeMachine(),
      playwright: playwrightVersion,
      chromium: probe.version(),
      channel: options.channel ?? 'chromium-headless-shell (por defecto)',
      host: options.host,
      regime,
    }
    console.log(
      `${machine.cpu} · ${machine.logicalCpus} CPU lógicas · ${machine.freeMemoryGB}/${machine.totalMemoryGB} GB libres · Chromium ${machine.chromium} · Playwright ${machine.playwright} · zlib ${machine.zlib}`,
    )
    console.log(
      `Viewport ${VIEWPORT.width}×${VIEWPORT.height} · DPR ${options.dpr} · host ${options.host} · ${machine.regime} · ` +
        (options.compare
          ? `${options.blocks} bloque(s) medidos por perfil`
          : `${options.rounds} ronda(s) de ${options.samples} muestra(s)`),
    )

    let shared: Browser | null = null
    let comparedSamples: ComparedSample[] = []
    let analysis: ReturnType<typeof analyseComparison> = []
    if (options.compare) {
      const byVariant = { A: targets[0], B: targets[1] }
      shared = probe
      comparedSamples = await runComparison(options, byVariant, probe)
      analysis = analyseComparison(comparedSamples, options.profiles)
    } else {
      if (options.freshBrowser) {
        await probe.close()
      } else {
        shared = probe
        // Una carga de calentamiento descartada: la primera de un navegador
        // recién lanzado paga arranques que no son de la aplicación.
        await takeSample(shared, targets[0], PROFILES[0], options.dpr)
      }
      await runRounds(options, targets[0], shared, results)
    }

    const screens: {
      profile: string
      variant: string
      screens: ScreenWalk[]
    }[] = []
    if (options.screens) {
      for (const profile of options.profiles) {
        for (const target of targets) {
          screens.push({
            profile: profile.id,
            variant: target.label,
            screens: await withBrowser(options.channel, shared, (browser) =>
              walkScreens(browser, target, profile, options.dpr),
            ),
          })
        }
      }
    }

    const cpuLoadAfter = await backgroundCpuLoad()
    console.log(
      `Carga de CPU de fondo al terminar: ${roundTo(cpuLoadAfter * 100, 1)} %`,
    )

    if (options.compare) {
      reportComparison(
        analysis,
        comparedSamples,
        { A: targets[0], B: targets[1] },
        options.profiles,
      )
    } else {
      reportRounds(results)
    }
    reportScreens(screens)

    if (options.json) {
      const common = {
        generatedAt: new Date().toISOString(),
        mode: options.compare ? 'compare' : 'single',
        options: {
          ...options,
          profiles: options.profiles.map((p) => p.id),
        },
        viewport: VIEWPORT,
        machine,
        gzip: { options: GZIP_OPTIONS, zlib: process.versions.zlib },
        cpuLoad: { before: cpuLoadBefore, after: cpuLoadAfter },
        screens,
      }
      const body = options.compare
        ? {
            ...common,
            protocol: {
              pattern:
                'ABBA/BAAB alternados, bloque a bloque y perfil a perfil',
              warmupBlocks: WARMUP_BLOCKS,
              blocks: options.blocks,
              schedule: abbaSchedule(WARMUP_BLOCKS + options.blocks),
            },
            variants: {
              A: { dir: options.compare.a, entry: targets[0].entry },
              B: { dir: options.compare.b, entry: targets[1].entry },
            },
            results: results.map(({ profile, cpuProbeMs }) => ({
              profile,
              cpuProbeMs,
            })),
            samples: comparedSamples,
            analysis,
          }
        : {
            ...common,
            git: state,
            build: { lines: buildLines, entry: targets[0].entry },
            results,
          }
      writeFileSync(options.json, JSON.stringify(body, null, 2))
      console.log(`\nResultados completos en ${options.json}`)
    }
  } finally {
    if (probe.isConnected()) await probe.close()
  }
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  },
)
