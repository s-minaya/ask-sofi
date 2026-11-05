import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  decodedMemory,
  formatBytes,
  measureStrips,
  readTiming,
  stripName,
  summarize,
  type StripWeight,
  type TimingEntry,
} from './spriteWeight'

// Peso y memoria de un recurso (T061). Los bytes y la transferencia son mediciones del propio
// navegador (Resource Timing); la memoria es una estimación (ancho × alto × 4). Aquí se prueba
// que no se mezclan y que no se presenta una estimación como medición.

const entry = (patch: Partial<TimingEntry> = {}): TimingEntry => ({
  startTime: 100,
  transferSize: 183_900,
  encodedBodySize: 183_600,
  decodedBodySize: 183_600,
  ...patch,
})

describe('readTiming', () => {
  it('distingue los bytes del archivo de lo que viajó por la red', () => {
    // La transferencia incluye las cabeceras: es mayor que el cuerpo.
    expect(readTiming([entry()])).toEqual({
      fileBytes: 183_600,
      transferBytes: 183_900,
      origin: 'network',
    })
  })

  it('los bytes del archivo son los del cuerpo decodificado, no los comprimidos', () => {
    const timing = readTiming([
      entry({ encodedBodySize: 60_000, decodedBodySize: 183_600 }),
    ])
    expect(timing.fileBytes).toBe(183_600)
  })

  it('una respuesta de la caché no transfiere nada, pero el archivo pesa lo que pesa', () => {
    expect(
      readTiming([
        entry({
          transferSize: 0,
          encodedBodySize: 0,
          decodedBodySize: 183_600,
        }),
      ]),
    ).toEqual({ fileBytes: 183_600, transferBytes: 0, origin: 'cache' })
  })

  it('una revalidación (solo cabeceras) tampoco es una descarga', () => {
    expect(
      readTiming([entry({ transferSize: 300, encodedBodySize: 0 })]),
    ).toMatchObject({ transferBytes: 300, origin: 'cache' })
  })

  it('con varias peticiones de la misma tira, cuenta la primera que trajo el cuerpo', () => {
    // La primera carga, y después una lectura de la caché o una revalidación.
    const timing = readTiming([
      entry({ startTime: 900, transferSize: 0, encodedBodySize: 0 }),
      entry({ startTime: 100 }),
      entry({ startTime: 500, transferSize: 300, encodedBodySize: 0 }),
    ])
    expect(timing).toEqual({
      fileBytes: 183_600,
      transferBytes: 183_900,
      origin: 'network',
    })
  })

  it('si hay dos descargas completas, cuenta la más antigua aunque llegue la última en la lista', () => {
    // Una recarga con la caché vaciada no cambia lo que costó la primera carga.
    const timing = readTiming([
      entry({
        startTime: 900,
        transferSize: 2300,
        encodedBodySize: 2000,
        decodedBodySize: 2000,
      }),
      entry({
        startTime: 100,
        transferSize: 1300,
        encodedBodySize: 1000,
        decodedBodySize: 1000,
      }),
    ])
    expect(timing).toMatchObject({ fileBytes: 1000, transferBytes: 1300 })
  })

  it('sin entradas no hay medición: no se inventa un cero', () => {
    expect(readTiming([])).toEqual({
      fileBytes: null,
      transferBytes: null,
      origin: 'unknown',
    })
  })

  it('si el navegador no da los tamaños (otro origen sin permiso), no los da por cero', () => {
    expect(
      readTiming([
        entry({ transferSize: 0, encodedBodySize: 0, decodedBodySize: 0 }),
      ]),
    ).toEqual({ fileBytes: null, transferBytes: null, origin: 'unknown' })
  })
})

describe('decodedMemory', () => {
  it('es ancho × alto × 4 bytes (RGBA de 8 bits)', () => {
    expect(decodedMemory(1920, 360)).toBe(1920 * 360 * 4)
  })

  it('sin dimensiones no hay estimación', () => {
    expect(decodedMemory(null, 360)).toBeNull()
    expect(decodedMemory(1920, null)).toBeNull()
    expect(decodedMemory(0, 360)).toBeNull()
  })
})

describe('formatBytes', () => {
  it('usa 1 024 por escalón y coma decimal, como el playground', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1,0 KB')
    expect(formatBytes(188_006)).toBe('183,6 KB')
    expect(formatBytes(4 * 1024 ** 2)).toBe('4,0 MB')
    expect(formatBytes(1_536 * 1024)).toBe('1,5 MB')
  })

  it('el cero es un cero, y lo que no se sabe es un guion', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(null)).toBe('—')
  })
})

describe('stripName', () => {
  it('es el nombre del archivo, sin carpetas', () => {
    expect(stripName('/src/styles/sprites/rolling-fx.webp')).toBe(
      'rolling-fx.webp',
    )
    expect(stripName('rolling.webp')).toBe('rolling.webp')
  })
})

const strip = (patch: Partial<StripWeight> = {}): StripWeight => ({
  name: 'a.webp',
  fileBytes: 1000,
  transferBytes: 1100,
  origin: 'network',
  width: 10,
  height: 10,
  memoryBytes: 400,
  ...patch,
})

describe('summarize', () => {
  it('suma cada magnitud por separado', () => {
    expect(
      summarize([
        strip(),
        strip({
          name: 'b.webp',
          fileBytes: 2000,
          transferBytes: 0,
          origin: 'cache',
          memoryBytes: 800,
        }),
      ]),
    ).toEqual({
      count: 2,
      fileBytes: 3000,
      transferBytes: 1100,
      memoryBytes: 1200,
      complete: true,
    })
  })

  it('una tira sin dato hace incompleta la suma y no cuenta como cero', () => {
    const sum = summarize([
      strip(),
      strip({
        name: 'b.webp',
        fileBytes: null,
        transferBytes: null,
        origin: 'unknown',
        memoryBytes: null,
      }),
    ])
    expect(sum).toMatchObject({
      count: 2,
      fileBytes: 1000,
      transferBytes: 1100,
      memoryBytes: 400,
      complete: false,
    })
  })

  it('una transferencia que no se puede medir no vuelve parcial lo demás', () => {
    // Con un service worker delante la red nunca se ve: es una limitación conocida, no una laguna.
    const sum = summarize([
      strip({ transferBytes: null, origin: 'intercepted' }),
      strip({ name: 'b.webp', transferBytes: null, origin: 'intercepted' }),
    ])
    expect(sum).toMatchObject({ transferBytes: null, complete: true })
  })

  it('sin ninguna medición, las sumas son desconocidas, no cero', () => {
    const sum = summarize([
      strip({
        fileBytes: null,
        transferBytes: null,
        origin: 'unknown',
        memoryBytes: null,
      }),
    ])
    expect(sum).toMatchObject({
      fileBytes: null,
      transferBytes: null,
      memoryBytes: null,
      complete: false,
    })
  })

  it('sin tiras, nada que sumar', () => {
    expect(summarize([])).toEqual({
      count: 0,
      fileBytes: null,
      transferBytes: null,
      memoryBytes: null,
      complete: false,
    })
  })
})

describe('measureStrips', () => {
  const env = (
    timing: Record<string, TimingEntry[]>,
    sizes: Record<string, { width: number; height: number } | null>,
    transferVisible = true,
  ) => ({
    getEntries: vi.fn((url: string) => timing[url] ?? []),
    decodeSize: vi.fn(async (url: string) => sizes[url] ?? null),
    transferVisible: () => transferVisible,
  })

  it('combina la medición del navegador con la estimación de cada tira', async () => {
    const strips = { '/s/a.webp': '/assets/a.webp' }
    const result = await measureStrips(
      strips,
      env(
        { '/assets/a.webp': [entry()] },
        { '/assets/a.webp': { width: 1920, height: 360 } },
      ),
    )
    expect(result).toEqual([
      {
        name: 'a.webp',
        fileBytes: 183_600,
        transferBytes: 183_900,
        origin: 'network',
        width: 1920,
        height: 360,
        memoryBytes: 1920 * 360 * 4,
      },
    ])
  })

  it('no decodifica ni pide una tira que el navegador no ha cargado', async () => {
    // Pedirla para medirla cambiaría la estrategia de carga y falsearía la medición.
    const e = env({}, { '/assets/a.webp': { width: 10, height: 10 } })
    const result = await measureStrips({ '/s/a.webp': '/assets/a.webp' }, e)

    expect(e.decodeSize).not.toHaveBeenCalled()
    expect(result[0]).toMatchObject({
      origin: 'unknown',
      width: null,
      memoryBytes: null,
    })
  })

  it('una tira que no se puede decodificar queda sin estimación, pero con sus bytes', async () => {
    const result = await measureStrips(
      { '/s/a.webp': '/assets/a.webp' },
      env({ '/assets/a.webp': [entry()] }, {}),
    )
    expect(result[0]).toMatchObject({
      fileBytes: 183_600,
      width: null,
      memoryBytes: null,
    })
  })

  it('decodifica con CORS la tira que el parcial usa como máscara, igual que la carga', async () => {
    // Una tira pedida sin CORS y otra con él son dos descargas (E13): medirla no puede duplicarla.
    const e = env(
      { '/assets/m.webp': [entry()], '/assets/a.webp': [entry()] },
      {},
    )
    await measureStrips(
      {
        '/s/memory-wipe-dissolve.webp': '/assets/m.webp',
        '/s/a.webp': '/assets/a.webp',
      },
      e,
      ['memory-wipe-dissolve.webp'],
    )

    expect(e.decodeSize).toHaveBeenCalledWith('/assets/m.webp', {
      crossOrigin: true,
    })
    expect(e.decodeSize).toHaveBeenCalledWith('/assets/a.webp', {
      crossOrigin: false,
    })
  })

  it('conserva el orden de las tiras del módulo', async () => {
    const result = await measureStrips(
      { '/s/b.webp': '/assets/b.webp', '/s/a.webp': '/assets/a.webp' },
      env({}, {}),
    )
    expect(result.map((r) => r.name)).toEqual(['b.webp', 'a.webp'])
  })
})

describe('measureStrips con un service worker delante', () => {
  // MSW atiende en desarrollo todas las peticiones: el navegador informa de 0 bytes de red
  // para cada una, también en la primera carga. No es la caché y no es una medición.
  const env = {
    getEntries: vi.fn(() => [
      {
        startTime: 1,
        transferSize: 0,
        encodedBodySize: 119_278,
        decodedBodySize: 119_278,
      },
    ]),
    decodeSize: vi.fn(async () => ({ width: 1920, height: 384 })),
    transferVisible: () => false,
  }

  it('conserva los bytes del archivo y la memoria, pero no inventa una transferencia', async () => {
    const [strip] = await measureStrips({ '/s/a.webp': '/assets/a.webp' }, env)
    expect(strip).toMatchObject({
      fileBytes: 119_278,
      transferBytes: null,
      origin: 'intercepted',
      memoryBytes: 1920 * 384 * 4,
    })
  })

  it('no la cuenta como una respuesta de la caché', async () => {
    const [strip] = await measureStrips({ '/s/a.webp': '/assets/a.webp' }, env)
    expect(strip.origin).not.toBe('cache')
  })
})

describe('keepResourceTimings', () => {
  const original = performance.setResourceTimingBufferSize

  afterEach(() => {
    performance.setResourceTimingBufferSize = original
    vi.restoreAllMocks()
  })

  // El módulo recuerda si ya escucha: cada prueba parte de uno nuevo.
  async function fresh() {
    vi.resetModules()
    const set = vi.fn()
    performance.setResourceTimingBufferSize = set
    const add = vi.spyOn(performance, 'addEventListener')
    const { keepResourceTimings: keep } = await import('./spriteWeight')
    return { keep, set, add }
  }

  it('amplía el búfer de recursos del navegador: el de 250 se llena en el Lab y se pierden las tiras', async () => {
    const { keep, set } = await fresh()
    keep()
    expect(set).toHaveBeenCalledTimes(1)
    expect(set.mock.calls[0][0]).toBeGreaterThan(250)
  })

  it('si aun así se llena, lo amplía de nuevo en lugar de perder entradas', async () => {
    const { keep, set, add } = await fresh()
    keep()
    set.mockClear()
    const [type, listener] = add.mock.calls[0]
    expect(type).toBe('resourcetimingbufferfull')
    ;(listener as () => void)()
    expect(set).toHaveBeenCalledTimes(1)
    expect(set.mock.calls[0][0]).toBeGreaterThan(250)
  })

  it('llamarlo dos veces no suma escuchas', async () => {
    const { keep, add } = await fresh()
    keep()
    keep()
    expect(add).toHaveBeenCalledTimes(1)
  })

  it('sin la API no falla ni escucha', async () => {
    const { keep, add } = await fresh()
    ;(
      performance as { setResourceTimingBufferSize?: unknown }
    ).setResourceTimingBufferSize = undefined
    expect(() => keep()).not.toThrow()
    expect(add).not.toHaveBeenCalled()
  })
})
