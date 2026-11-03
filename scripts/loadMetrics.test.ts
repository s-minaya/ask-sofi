import { constants, gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
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
  tCritical95,
  type AbSample,
  type RequestOutcome,
  type Variant,
} from './loadMetrics.ts'

describe('median', () => {
  it('devuelve el valor central de una cantidad impar', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([540, 536, 530, 560, 538])).toBe(538)
  })

  it('promedia los dos centrales de una cantidad par', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  it('con un solo valor devuelve ese valor', () => {
    expect(median([7])).toBe(7)
  })

  it('no altera ni reordena el array recibido', () => {
    const values = Object.freeze([3, 1, 2])

    expect(median(values)).toBe(2)
    expect(values).toEqual([3, 1, 2])
  })

  it('falla con una lista vacía en lugar de inventar un valor', () => {
    expect(() => median([])).toThrow(RangeError)
  })

  it.each([NaN, Infinity, -Infinity])(
    'rechaza %s: una medición perdida no debe colarse en la mediana',
    (bad) => {
      expect(() => median([1, bad, 3])).toThrow(RangeError)
    },
  )
})

describe('dispersion', () => {
  it('calcula rango y desviación típica muestral (n − 1)', () => {
    const result = dispersion([2, 4, 4, 4, 5, 5, 7, 9])

    expect(result.count).toBe(8)
    expect(result.min).toBe(2)
    expect(result.max).toBe(9)
    expect(result.range).toBe(7)
    expect(result.mean).toBe(5)
    // Suma de cuadrados 32 entre n − 1 = 7: la poblacional daría exactamente 2.
    expect(result.stdDev).toBeCloseTo(Math.sqrt(32 / 7), 10)
  })

  it('con valores idénticos no hay dispersión', () => {
    expect(dispersion([536, 536, 536])).toMatchObject({ range: 0, stdDev: 0 })
  })

  it('exige al menos dos valores: con uno no hay dispersión que medir', () => {
    expect(() => dispersion([536])).toThrow(RangeError)
  })

  it('rechaza valores no finitos', () => {
    expect(() => dispersion([1, NaN])).toThrow(RangeError)
  })
})

describe('assetStem', () => {
  it('quita el hash de Vite y la extensión', () => {
    expect(
      assetStem('http://127.0.0.1:4199/assets/sofi-blink-B3I2mMtZ.webp'),
    ).toBe('sofi-blink')
  })

  it('el hash puede llevar guiones y guiones bajos', () => {
    expect(assetStem('http://x/assets/sofi-neutral-C4SS-EZT.webp')).toBe(
      'sofi-neutral',
    )
    expect(assetStem('http://x/assets/index-BF--mqqv.js')).toBe('index')
    expect(assetStem('http://x/assets/logo-1080-pkDoS_E6.webp')).toBe(
      'logo-1080',
    )
  })

  it('conserva los guiones y números del propio nombre', () => {
    expect(assetStem('http://x/assets/rolling-fx-AbCd1234.webp')).toBe(
      'rolling-fx',
    )
  })

  it('ignora la cadena de consulta', () => {
    expect(assetStem('http://x/assets/sofing-AbCd1234.webp?v=2')).toBe('sofing')
  })

  it('devuelve null si el fichero no lleva hash de Vite', () => {
    expect(assetStem('http://x/favicon.ico')).toBeNull()
    expect(assetStem('http://x/')).toBeNull()
  })
})

describe('entryAssets', () => {
  const VITE_OUTPUT = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Ask Sofi</title>
    <script type="module" crossorigin src="/assets/index-BF--mqqv.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-D8OyO5bk.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`

  it('lee el script y la hoja de estilos de una build real de Vite', () => {
    expect(entryAssets(VITE_OUTPUT)).toEqual({
      scripts: ['/assets/index-BF--mqqv.js'],
      stylesheets: ['/assets/index-D8OyO5bk.css'],
      preloads: [],
    })
  })

  it('distingue los modulepreload de la entrada', () => {
    const html = `<head>
      <script type="module" crossorigin src="/assets/index-AAAAAAAA.js"></script>
      <link rel="modulepreload" crossorigin href="/assets/vendor-BBBBBBBB.js">
      <link rel="stylesheet" crossorigin href="/assets/index-CCCCCCCC.css">
    </head>`

    expect(entryAssets(html)).toEqual({
      scripts: ['/assets/index-AAAAAAAA.js'],
      stylesheets: ['/assets/index-CCCCCCCC.css'],
      preloads: ['/assets/vendor-BBBBBBBB.js'],
    })
  })

  it('no depende del orden de los atributos ni del tipo de comillas', () => {
    const html = `<link href='/assets/a-AAAAAAAA.css' rel='stylesheet'>
      <script src="/assets/a-BBBBBBBB.js" type="module"></script>`

    expect(entryAssets(html)).toEqual({
      scripts: ['/assets/a-BBBBBBBB.js'],
      stylesheets: ['/assets/a-AAAAAAAA.css'],
      preloads: [],
    })
  })

  it('ignora iconos, precargas de otros tipos y scripts en línea', () => {
    const html = `<link rel="icon" href="/favicon.svg">
      <link rel="preload" as="font" href="/assets/f-AAAAAAAA.woff2">
      <script>window.x = 1</script>`

    expect(entryAssets(html)).toEqual({
      scripts: [],
      stylesheets: [],
      preloads: [],
    })
  })
})

describe('cpuBusyFraction', () => {
  const core = (idle: number, busy: number) => ({
    times: { user: busy, nice: 0, sys: 0, idle, irq: 0 },
  })

  it('mide la fracción ocupada entre dos muestras de os.cpus()', () => {
    const before = [core(100, 100), core(100, 100)]
    // Cada núcleo: +75 en reposo y +25 ocupado.
    const after = [core(175, 125), core(175, 125)]

    expect(cpuBusyFraction(before, after)).toBeCloseTo(0.25, 10)
  })

  it('una máquina en reposo total da 0', () => {
    expect(cpuBusyFraction([core(0, 0)], [core(50, 0)])).toBe(0)
  })

  it('falla si entre las muestras no ha pasado tiempo', () => {
    const same = [core(10, 10)]

    expect(() => cpuBusyFraction(same, same)).toThrow(RangeError)
  })
})

describe('gzipSize', () => {
  const css = Buffer.from('.sofi{color:#123456;margin:0}\n'.repeat(400))

  it('mide el contenido comprimido con las opciones fijas', () => {
    expect(gzipSize(css)).toBe(gzipSync(css, GZIP_OPTIONS).length)
    expect(gzipSize(css)).toBeLessThan(css.length / 10)
  })

  it('es determinista: el mismo contenido da siempre el mismo tamaño', () => {
    const sizes = new Set(Array.from({ length: 10 }, () => gzipSize(css)))

    expect(sizes.size).toBe(1)
  })

  it('cuenta el formato gzip completo, cabecera y pie incluidos', () => {
    // 10 B de cabecera + 2 B de bloque final vacío + 8 B de CRC32 y tamaño.
    expect(gzipSize(Buffer.alloc(0))).toBe(20)
  })

  it('acepta Buffer y Uint8Array', () => {
    expect(gzipSize(new Uint8Array(css))).toBe(gzipSize(css))
  })

  // Cambiar una opción cambia la cifra de referencia del CSS de entrada (plan §7):
  // si esta prueba falla, hay que volver a medir la referencia, no tocar la prueba.
  it('las opciones son las del zlib por defecto, escritas a la vista', () => {
    expect(GZIP_OPTIONS).toEqual({
      level: 6,
      memLevel: 8,
      windowBits: 15,
      strategy: constants.Z_DEFAULT_STRATEGY,
    })
    expect(gzipSize(css)).toBe(gzipSync(css).length)
  })
})

describe('abbaSchedule', () => {
  it('alterna ABBA y BAAB empezando por ABBA', () => {
    expect(abbaSchedule(4)).toEqual([
      ['A', 'B', 'B', 'A'],
      ['B', 'A', 'A', 'B'],
      ['A', 'B', 'B', 'A'],
      ['B', 'A', 'A', 'B'],
    ])
  })

  it('cada bloque lleva dos cargas de cada versión', () => {
    for (const block of abbaSchedule(6)) {
      expect(block.filter((variant) => variant === 'A')).toHaveLength(2)
      expect(block.filter((variant) => variant === 'B')).toHaveLength(2)
    }
  })

  it('con una cantidad par de bloques ninguna versión ocupa más veces una misma posición', () => {
    const schedule = abbaSchedule(8)

    for (let position = 0; position < 4; position++) {
      const inA = schedule.filter((block) => block[position] === 'A').length

      expect(inA).toBe(4)
    }
  })

  it('cada versión tiene la misma posición media dentro del bloque', () => {
    // Es lo que cancela una deriva lineal: A ocupa 0 y 3, B ocupa 1 y 2.
    const positions = (variant: Variant) =>
      abbaSchedule(2)
        .flatMap((block) =>
          block.flatMap((v, position) => (v === variant ? [position] : [])),
        )
        .reduce((sum, position) => sum + position, 0)

    expect(positions('A')).toBe(positions('B'))
  })

  it.each([0, -2, 1.5, NaN])('rechaza %s bloques', (count) => {
    expect(() => abbaSchedule(count)).toThrow(RangeError)
  })

  it('el calentamiento tiene un número par de bloques, para que ABBA y BAAB sigan equilibrados', () => {
    expect(WARMUP_BLOCKS).toBeGreaterThanOrEqual(1)
    expect(WARMUP_BLOCKS % 2).toBe(0)
  })
})

describe('pairedDifferences', () => {
  const sample = (
    variant: Variant,
    block: number,
    value: number,
    warmup = false,
  ): AbSample => ({ variant, block, warmup, value })

  it('resta, en cada bloque, la media de A a la media de B', () => {
    const samples = [
      sample('A', 2, 100),
      sample('B', 2, 120),
      sample('B', 2, 130),
      sample('A', 2, 110),
      sample('B', 3, 200),
      sample('A', 3, 200),
      sample('A', 3, 200),
      sample('B', 3, 210),
    ]

    // Bloque 2: 125 − 105 = 20. Bloque 3: 205 − 200 = 5.
    expect(pairedDifferences(samples)).toEqual([20, 5])
  })

  it('un valor positivo significa que B es más lento', () => {
    const samples = [
      sample('A', 1, 100),
      sample('B', 1, 90),
      sample('B', 1, 90),
      sample('A', 1, 100),
    ]

    expect(pairedDifferences(samples)).toEqual([-10])
  })

  it('ordena por bloque y no por orden de llegada', () => {
    const samples = [
      sample('A', 3, 0),
      sample('B', 3, 5),
      sample('A', 2, 0),
      sample('B', 2, 20),
    ]

    expect(pairedDifferences(samples)).toEqual([20, 5])
  })

  it('las muestras de calentamiento no entran', () => {
    const samples = [
      sample('A', 0, 9999, true),
      sample('B', 0, 1, true),
      sample('A', 1, 100),
      sample('B', 1, 110),
    ]

    expect(pairedDifferences(samples)).toEqual([10])
  })

  it('no recorta nada: un valor extremo sigue contando', () => {
    const samples = [
      sample('A', 1, 100),
      sample('A', 1, 100),
      sample('B', 1, 100),
      sample('B', 1, 400),
    ]

    // Media de B = 250; media de A = 100.
    expect(pairedDifferences(samples)).toEqual([150])
  })

  it('falla si a un bloque le falta una de las versiones', () => {
    const samples = [sample('A', 1, 100), sample('A', 1, 100)]

    expect(() => pairedDifferences(samples)).toThrow(RangeError)
  })

  it('falla si solo hay calentamiento: no hay nada medido', () => {
    const samples = [sample('A', 0, 1, true), sample('B', 0, 1, true)]

    expect(() => pairedDifferences(samples)).toThrow(RangeError)
  })

  it('rechaza valores no finitos', () => {
    const samples = [sample('A', 1, NaN), sample('B', 1, 1)]

    expect(() => pairedDifferences(samples)).toThrow(RangeError)
  })
})

describe('tCritical95', () => {
  // Valores de la tabla de la t de Student, dos colas al 95 %.
  it.each([
    [1, 12.706],
    [2, 4.303],
    [3, 3.182],
    [5, 2.571],
    [7, 2.365],
    [10, 2.228],
    [20, 2.086],
    [30, 2.042],
    [60, 2.0],
    [120, 1.98],
  ])('con %i grados de libertad vale %f', (degrees, expected) => {
    expect(tCritical95(degrees)).toBe(expected)
  })

  it('baja al aumentar los grados de libertad y no queda por debajo de 1,96', () => {
    let previous = Infinity

    for (let degrees = 1; degrees <= 200; degrees++) {
      const value = tCritical95(degrees)

      expect(value).toBeLessThanOrEqual(previous)
      expect(value).toBeGreaterThanOrEqual(1.96)
      previous = value
    }
  })

  it('entre dos entradas de la tabla usa la de menos grados: el intervalo nunca sale más estrecho', () => {
    expect(tCritical95(35)).toBe(tCritical95(30))
    expect(tCritical95(500)).toBe(tCritical95(120))
  })

  it.each([0, -1, 2.5, NaN])('rechaza %s grados de libertad', (degrees) => {
    expect(() => tCritical95(degrees)).toThrow(RangeError)
  })
})

describe('summarizeDifferences', () => {
  it('calcula media, desviación, error típico e intervalo del 95 %', () => {
    const summary = summarizeDifferences([10, 20, 30, 40])
    // Suma de cuadrados 500 entre n − 1 = 3.
    const stdDev = Math.sqrt(500 / 3)

    expect(summary.blocks).toBe(4)
    expect(summary.mean).toBe(25)
    expect(summary.median).toBe(25)
    expect(summary.stdDev).toBeCloseTo(stdDev, 10)
    expect(summary.standardError).toBeCloseTo(stdDev / 2, 10)
    // t de Student con 3 grados de libertad: 3,182.
    expect(summary.halfWidth).toBeCloseTo((3.182 * stdDev) / 2, 10)
    expect(summary.ciLow).toBeCloseTo(25 - summary.halfWidth, 10)
    expect(summary.ciHigh).toBeCloseTo(25 + summary.halfWidth, 10)
  })

  it('cuenta los bloques en que B es más lento, sin contar los empates', () => {
    expect(summarizeDifferences([-5, 3, 0, 7]).slower).toBe(2)
  })

  it('un intervalo que contiene el 0 no distingue B de A', () => {
    const { ciLow, ciHigh } = summarizeDifferences([-30, 25, -10, 20, 5, -15])

    expect(ciLow).toBeLessThan(0)
    expect(ciHigh).toBeGreaterThan(0)
  })

  it('un efecto grande frente al ruido deja el 0 fuera del intervalo', () => {
    const { ciLow } = summarizeDifferences([98, 102, 100, 101, 99, 100])

    expect(ciLow).toBeGreaterThan(0)
  })

  it('si todas las diferencias son iguales, el intervalo es un punto', () => {
    const summary = summarizeDifferences([7, 7, 7])

    expect(summary.halfWidth).toBe(0)
    expect(summary.ciLow).toBe(7)
    expect(summary.ciHigh).toBe(7)
  })

  it('exige al menos dos bloques: con uno no hay incertidumbre que estimar', () => {
    expect(() => summarizeDifferences([12])).toThrow(RangeError)
  })

  it('rechaza valores no finitos', () => {
    expect(() => summarizeDifferences([1, NaN, 3])).toThrow(RangeError)
  })

  it('con más bloques el intervalo se estrecha (mismo ruido)', () => {
    const noise = [-20, 20, -10, 10, -20, 20, -10, 10]
    const few = summarizeDifferences(noise.slice(0, 4))
    const many = summarizeDifferences(noise)

    expect(many.halfWidth).toBeLessThan(few.halfWidth)
  })
})

describe('requestProblems', () => {
  const origin = 'http://127.0.0.1:4199'
  const ok = (
    path: string,
    type: string,
    mimeType: string,
    extra: Partial<RequestOutcome> = {},
  ): RequestOutcome => ({
    url: `${origin}${path}`,
    type,
    status: 200,
    mimeType,
    encodedBytes: 1000,
    fromCache: false,
    failed: null,
    ...extra,
  })
  const page = [
    ok('/', 'Document', 'text/html'),
    ok('/assets/index-AAAAAAAA.css', 'Stylesheet', 'text/css'),
    ok('/assets/index-BBBBBBBB.js', 'Script', 'text/javascript'),
    ok('/assets/logo-CCCCCCCC.webp', 'Image', 'image/webp'),
    ok('/assets/font-DDDDDDDD.woff2', 'Font', 'font/woff2'),
  ]

  it('una carga sin incidencias no tiene problemas', () => {
    expect(requestProblems(page)).toEqual([])
  })

  it('una petición fallida invalida la carga y dice cuál y por qué', () => {
    const failed = ok('/assets/logo-CCCCCCCC.webp', 'Image', '', {
      status: null,
      failed: 'net::ERR_CONNECTION_REFUSED',
    })

    const problems = requestProblems([page[0], failed])

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('/assets/logo-CCCCCCCC.webp')
    expect(problems[0]).toContain('net::ERR_CONNECTION_REFUSED')
  })

  it.each([404, 500, 304])('una respuesta %i invalida la carga', (status) => {
    const problems = requestProblems([
      ok('/assets/logo-CCCCCCCC.webp', 'Image', 'image/webp', { status }),
    ])

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain(String(status))
  })

  it('una petición terminada sin respuesta tampoco vale', () => {
    const problems = requestProblems([
      ok('/assets/x-AAAAAAAA.js', 'Script', '', { status: null }),
    ])

    expect(problems).toHaveLength(1)
  })

  it('una hoja de estilos que llega como HTML (el fallback de la SPA) invalida la carga', () => {
    // El servidor responde 200 con index.html a una ruta inexistente: la red
    // «funciona» y el navegador ignora la hoja, así que el FCP sería el de una
    // página sin estilos.
    const problems = requestProblems([
      page[0],
      ok('/assets/index-AAAAAAAA.css', 'Stylesheet', 'text/html'),
    ])

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('text/css')
    expect(problems[0]).toContain('text/html')
  })

  it('un script que no llega como JavaScript invalida la carga', () => {
    const problems = requestProblems([
      ok('/assets/index-BBBBBBBB.js', 'Script', 'text/html'),
    ])

    expect(problems).toHaveLength(1)
  })

  it.each(['text/javascript', 'application/javascript'])(
    'acepta %s para un script',
    (mime) => {
      expect(
        requestProblems([ok('/assets/a-AAAAAAAA.js', 'Script', mime)]),
      ).toEqual([])
    },
  )

  it('una imagen o una fuente que llegan como HTML también son el fallback', () => {
    const problems = requestProblems([
      ok('/assets/logo-CCCCCCCC.webp', 'Image', 'text/html'),
      ok('/assets/font-DDDDDDDD.woff2', 'Font', 'text/html'),
    ])

    expect(problems).toHaveLength(2)
  })

  it('el documento tiene que llegar como HTML', () => {
    const problems = requestProblems([ok('/', 'Document', 'text/plain')])

    expect(problems).toHaveLength(1)
  })

  it('informa de todos los problemas, no solo del primero', () => {
    const problems = requestProblems([
      ok('/assets/a-AAAAAAAA.css', 'Stylesheet', 'text/css', { status: 404 }),
      ok('/assets/b-BBBBBBBB.js', 'Script', '', {
        status: null,
        failed: 'net::ERR_ABORTED',
      }),
    ])

    expect(problems).toHaveLength(2)
  })
})

describe('checkEntryDownloads', () => {
  const origin = 'http://127.0.0.1:4199'
  const entry = {
    scripts: ['/assets/index-BBBBBBBB.js'],
    stylesheets: ['/assets/index-AAAAAAAA.css'],
    preloads: [],
  }
  const ok = (
    path: string,
    type: string,
    mimeType: string,
    extra: Partial<RequestOutcome> = {},
  ): RequestOutcome => ({
    url: `${origin}${path}`,
    type,
    status: 200,
    mimeType,
    encodedBytes: 1000,
    fromCache: false,
    failed: null,
    ...extra,
  })
  const document = ok('/', 'Document', 'text/html')
  const css = ok('/assets/index-AAAAAAAA.css', 'Stylesheet', 'text/css', {
    encodedBytes: 9900,
  })
  const js = ok('/assets/index-BBBBBBBB.js', 'Script', 'text/javascript', {
    encodedBytes: 108000,
  })

  it('empareja lo que referencia index.html con lo que se descargó', () => {
    const result = checkEntryDownloads([document, css, js], entry, origin)

    expect(result.problems).toEqual([])
    expect(result.extra).toEqual([])
    expect(result.downloaded).toEqual([
      {
        kind: 'stylesheet',
        url: `${origin}/assets/index-AAAAAAAA.css`,
        encodedBytes: 9900,
      },
      {
        kind: 'script',
        url: `${origin}/assets/index-BBBBBBBB.js`,
        encodedBytes: 108000,
      },
    ])
  })

  it('un recurso referenciado y nunca pedido invalida la carga', () => {
    // La build dice que hay CSS de entrada; el navegador no lo pidió.
    const result = checkEntryDownloads([document, js], entry, origin)

    expect(result.problems).toHaveLength(1)
    expect(result.problems[0]).toContain('/assets/index-AAAAAAAA.css')
    expect(result.problems[0]).toContain('index.html')
    expect(result.downloaded).toHaveLength(1)
  })

  it('uno pedido que falló no cuenta como descargado', () => {
    const failed = ok('/assets/index-AAAAAAAA.css', 'Stylesheet', '', {
      status: null,
      failed: 'net::ERR_CONNECTION_RESET',
    })

    const result = checkEntryDownloads([document, failed, js], entry, origin)

    // Falla la petición y, además, no hay descarga de lo que index.html referencia.
    expect(result.problems).toHaveLength(2)
    expect(result.downloaded.map((d) => d.kind)).toEqual(['script'])
  })

  it('uno servido solo desde caché tampoco cuenta: la caché debe estar fría', () => {
    const cached = { ...css, fromCache: true }

    const result = checkEntryDownloads([document, cached, js], entry, origin)

    expect(result.problems).toHaveLength(1)
    expect(result.downloaded.map((d) => d.kind)).toEqual(['script'])
  })

  it('sin petición del documento no hay carga que medir', () => {
    const result = checkEntryDownloads([css, js], entry, origin)

    expect(result.problems).toHaveLength(1)
    expect(result.problems[0]).toContain('documento')
  })

  it('las hojas y scripts descargados que index.html no referencia constan aparte', () => {
    const lazy = ok('/assets/Lab-CCCCCCCC.css', 'Stylesheet', 'text/css', {
      encodedBytes: 700,
    })
    const chunk = ok('/assets/Lab-DDDDDDDD.js', 'Script', 'text/javascript', {
      encodedBytes: 4000,
    })

    const result = checkEntryDownloads(
      [document, css, js, lazy, chunk],
      entry,
      origin,
    )

    // No es un problema: es justo lo que distingue «CSS de entrada» de «CSS descargado».
    expect(result.problems).toEqual([])
    expect(result.extra).toEqual([
      {
        type: 'Stylesheet',
        url: `${origin}/assets/Lab-CCCCCCCC.css`,
        encodedBytes: 700,
      },
      {
        type: 'Script',
        url: `${origin}/assets/Lab-DDDDDDDD.js`,
        encodedBytes: 4000,
      },
    ])
  })

  it('las imágenes y las fuentes no son hojas ni scripts', () => {
    const image = ok('/assets/logo-EEEEEEEE.webp', 'Image', 'image/webp')
    const font = ok('/assets/font-FFFFFFFF.woff2', 'Font', 'font/woff2')

    const result = checkEntryDownloads(
      [document, css, js, image, font],
      entry,
      origin,
    )

    expect(result.extra).toEqual([])
  })

  it('resuelve rutas relativas y los modulepreload respecto al origen', () => {
    const relative = {
      scripts: ['./assets/index-BBBBBBBB.js'],
      stylesheets: [],
      preloads: ['/assets/vendor-GGGGGGGG.js'],
    }
    const vendor = ok('/assets/vendor-GGGGGGGG.js', 'Script', 'text/javascript')

    const result = checkEntryDownloads([document, js, vendor], relative, origin)

    expect(result.problems).toEqual([])
    expect(result.downloaded.map((d) => d.kind)).toEqual(['script', 'preload'])
  })

  it('suma los bytes si el mismo recurso se descarga dos veces', () => {
    const twice = checkEntryDownloads([document, css, css, js], entry, origin)

    expect(twice.downloaded[0].encodedBytes).toBe(19800)
  })
})
