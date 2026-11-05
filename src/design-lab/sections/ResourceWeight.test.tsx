import { act, cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetSpriteLoader } from '../../components/sofi/SofiSprite/loadSprite'
import { SOFI_REGISTRY } from '../../components/sofi/visual/registry'
import { provideLabOnlyLoaders, stripsOf } from '../spriteInspector'
import {
  formatBytes,
  type TimingEntry,
  type WeightEnvironment,
} from '../spriteWeight'
import { ResourceWeight } from './ResourceWeight'

// T061: la ficha de peso y memoria de un recurso. El navegador de verdad (Resource Timing y
// decodificación) se simula; las cifras reales se miden en Chromium.

// Lo que va pasando, para comprobar el orden: la tira se decodifica y solo entonces se mide.
let log: string[] = []

class FakeImage {
  src = ''
  decode() {
    log.push('decodificada')
    return Promise.resolve()
  }
}

const flush = () =>
  act(async () => {
    await vi.dynamicImportSettled()
    for (let turn = 0; turn < 10; turn++) await Promise.resolve()
  })

const NOT_YET = '— · sin medir'
const network = (bytes: number): TimingEntry => ({
  startTime: 100,
  transferSize: bytes + 300,
  encodedBodySize: bytes,
  decodedBodySize: bytes,
})
const cached = (bytes: number): TimingEntry => ({
  startTime: 100,
  transferSize: 0,
  encodedBodySize: 0,
  decodedBodySize: bytes,
})

// Un entorno con las mismas respuestas para todas las tiras del recurso.
function environment(
  entry: TimingEntry | null,
  size: { width: number; height: number } | null = { width: 1000, height: 250 },
): WeightEnvironment {
  return {
    getEntries: vi.fn(() => (entry ? [entry] : [])),
    decodeSize: vi.fn(async () => size),
    transferVisible: () => true,
  }
}

beforeEach(() => {
  log = []
  vi.stubGlobal('Image', FakeImage)
  provideLabOnlyLoaders()
})
afterEach(() => {
  cleanup()
  resetSpriteLoader()
  vi.unstubAllGlobals()
})

const region = () =>
  within(screen.getByRole('region', { name: 'Peso y memoria' }))
const rows = () =>
  Object.fromEntries(
    [...document.querySelectorAll('dl > div')].map((row) => [
      row.querySelector('dt')!.textContent,
      row.querySelector('dd')!.textContent,
    ]),
  )

describe('ResourceWeight', () => {
  it('distingue los bytes del archivo, la transferencia y la memoria estimada', async () => {
    const count = Object.keys(await stripsOf('sofing')).length
    render(
      <ResourceWeight id="sofing" environment={environment(network(10_240))} />,
    )
    await flush()

    const summary = rows()
    expect(summary['Tiras']).toBe(`${count} ${count === 1 ? 'tira' : 'tiras'}`)
    expect(summary['Bytes del archivo']).toContain(
      `${(count * 10).toFixed(1).replace('.', ',')} KB`,
    )
    // La transferencia es mayor que el archivo: incluye las cabeceras.
    expect(summary['Transferencia de red']).toContain(
      `${((count * 10_540) / 1024).toFixed(1).replace('.', ',')} KB`,
    )
    expect(summary['Memoria decodificada']).toContain(
      formatBytes(count * 1000 * 250 * 4),
    )
  })

  it('la memoria se presenta como estimación, y los bytes como medición', async () => {
    render(
      <ResourceWeight id="sofing" environment={environment(network(10_240))} />,
    )
    await flush()

    expect(rows()['Memoria decodificada']).toMatch(/estimaci[oó]n/i)
    expect(rows()['Memoria decodificada']).toContain('ancho × alto × 4')
    expect(rows()['Bytes del archivo']).toMatch(/medido/i)
    expect(rows()['Bytes del archivo']).not.toMatch(/estimaci[oó]n/i)
    expect(rows()['Transferencia de red']).not.toMatch(/estimaci[oó]n/i)
  })

  it('una respuesta de la caché no se presenta como una descarga', async () => {
    render(
      <ResourceWeight id="sofing" environment={environment(cached(10_240))} />,
    )
    await flush()

    expect(rows()['Transferencia de red']).toMatch(/0 B/)
    expect(rows()['Transferencia de red']).toMatch(/cach[eé]/i)
    // El archivo pesa lo mismo venga de donde venga.
    expect(rows()['Bytes del archivo']).toContain('KB')
  })

  it('con un service worker delante dice que la transferencia no se puede medir aquí, y por qué', async () => {
    const env = {
      ...environment(network(10_240)),
      transferVisible: () => false,
    }
    render(<ResourceWeight id="sofing" environment={env} />)
    await flush()

    expect(screen.queryByText(/parcial/i)).toBeNull()
    expect(rows()['Transferencia de red']).toMatch(/no medible/i)
    expect(rows()['Transferencia de red']).toMatch(/service worker/i)
    // No se confunde con una respuesta de la caché ni con un cero.
    expect(rows()['Transferencia de red']).not.toMatch(/cach[eé]|0 B/i)
    // Lo demás se mide igual.
    expect(rows()['Bytes del archivo']).toContain('KB')
    expect(rows()['Memoria decodificada']).toMatch(/estimaci[oó]n/i)
  })

  it('lista cada tira con su tamaño y sus tres cifras', async () => {
    render(
      <ResourceWeight
        id="rolling"
        environment={environment(network(10_240))}
      />,
    )
    await flush()

    const names = Object.keys(await stripsOf('rolling')).map((path) =>
      path.slice(path.lastIndexOf('/') + 1),
    )
    for (const name of names) {
      expect(rows()[name]).toContain('1000×250 px')
      expect(rows()[name]).toMatch(/archivo 10,0 KB/)
      // 1000 × 250 × 4 = 976,6 KB.
      expect(rows()[name]).toMatch(/memoria 976,6 KB/)
    }
  })

  it('sin datos del navegador no inventa ceros: dice que no están medidos', async () => {
    render(<ResourceWeight id="sofing" environment={environment(null)} />)
    await flush()

    expect(rows()['Bytes del archivo']).toBe('— · sin medir')
    expect(rows()['Transferencia de red']).toBe('— · sin medir')
    expect(rows()['Memoria decodificada']).toBe('— · sin medir')
    expect(region().getByText(/no tiene datos/i)).toBeInTheDocument()
  })

  it('una medición parcial lo avisa', async () => {
    const strips = Object.values(await stripsOf('rolling'))
    const [first] = strips
    const partial: WeightEnvironment = {
      getEntries: vi.fn((url) => (url === first ? [network(10_240)] : [])),
      decodeSize: vi.fn(async () => ({ width: 10, height: 10 })),
      transferVisible: () => true,
    }
    render(<ResourceWeight id="rolling" environment={partial} />)
    await flush()

    expect(region().getByText(/parcial/i)).toBeInTheDocument()
  })

  it('decodifica con CORS solo las tiras que el registro declara como máscara', async () => {
    const env = environment(network(10_240))
    render(<ResourceWeight id="memory-wipe" environment={env} />)
    await flush()

    const calls = vi.mocked(env.decodeSize).mock.calls
    const masks = calls.filter(([, options]) => options?.crossOrigin)
    expect(masks).toHaveLength(1)
    expect(masks[0][0]).toContain('memory-wipe-dissolve')
    expect(calls.length).toBeGreaterThan(1)
  })

  it('mide lo ya cargado y no pide nada: no decodifica lo que el navegador no tiene', async () => {
    const env = environment(null)
    render(<ResourceWeight id="sofing" environment={env} />)
    await flush()

    expect(env.decodeSize).not.toHaveBeenCalled()
  })

  it('mide después de cargarlo, con la carga que ya existe, y no antes', async () => {
    const events: string[] = []
    const original = SOFI_REGISTRY.sofing.load!
    SOFI_REGISTRY.sofing.load = () => {
      events.push('carga')
      return original()
    }
    const env = environment(network(10_240))
    vi.mocked(env.getEntries).mockImplementation(() => {
      events.push('medida')
      return [network(10_240)]
    })
    render(<ResourceWeight id="sofing" environment={env} />)
    await flush()
    SOFI_REGISTRY.sofing.load = original

    expect(events[0]).toBe('carga')
    expect(events).toContain('medida')
    expect(events.indexOf('medida')).toBeGreaterThan(events.indexOf('carga'))
  })

  it('no mide hasta que las tiras del recurso están decodificadas', async () => {
    const env = environment(network(10_240))
    vi.mocked(env.getEntries).mockImplementation(() => {
      log.push('medida')
      return [network(10_240)]
    })
    render(<ResourceWeight id="sofing" environment={env} />)
    await flush()

    expect(log.indexOf('decodificada')).toBeGreaterThanOrEqual(0)
    expect(log.indexOf('medida')).toBeGreaterThan(log.indexOf('decodificada'))
  })

  it('el resultado de un recurso que llega tarde no se pinta sobre el nuevo', async () => {
    let release: (() => void) | undefined
    const slow: WeightEnvironment = {
      getEntries: vi.fn(() => [network(10_240)]),
      transferVisible: () => true,
      decodeSize: vi.fn(
        () =>
          new Promise<{ width: number; height: number } | null>((resolve) => {
            release = () => resolve({ width: 10, height: 10 })
          }),
      ),
    }
    const fast = environment(network(10_240))
    const { rerender } = render(
      <ResourceWeight id="sofing" environment={slow} />,
    )
    await flush()
    rerender(<ResourceWeight id="talking" environment={fast} />)
    await flush()

    // La medición lenta de «sofing» termina ahora.
    release?.()
    await flush()

    const talking = Object.keys(await stripsOf('talking')).length
    expect(rows()['Tiras']).toBe(
      `${talking} ${talking === 1 ? 'tira' : 'tiras'}`,
    )
  })

  describe('una tira que termina de cargar después de la primera medición', () => {
    // El estático lo pinta la propia pantalla y puede llegar más tarde que la ficha.
    function late() {
      let entries: TimingEntry[] = []
      let notify: (() => void) | undefined
      const unwatch = vi.fn()
      const env: WeightEnvironment = {
        getEntries: vi.fn(() => entries),
        decodeSize: vi.fn(async () => ({ width: 1000, height: 250 })),
        transferVisible: () => true,
        watch: vi.fn((_urls, onChange) => {
          notify = onChange
          return unwatch
        }),
      }
      return {
        env,
        unwatch,
        arrive: async (entry: TimingEntry) => {
          entries = [entry]
          notify?.()
          await flush()
        },
      }
    }

    it('se vuelve a medir cuando llega, sin que nadie lo pida', async () => {
      const { env, arrive } = late()
      render(<ResourceWeight id="sofing" environment={env} />)
      await flush()
      expect(rows()['Bytes del archivo']).toBe('— · sin medir')

      await arrive(network(10_240))
      expect(rows()['Bytes del archivo']).toContain('10,0 KB')
    })

    it('deja de vigilar cuando ya está todo medido', async () => {
      const { env, arrive, unwatch } = late()
      render(<ResourceWeight id="sofing" environment={env} />)
      await flush()
      expect(unwatch).not.toHaveBeenCalled()

      await arrive(network(10_240))
      expect(unwatch).toHaveBeenCalledTimes(1)
    })

    it('deja de vigilar al cambiar de recurso y al salir', async () => {
      const { env, unwatch } = late()
      const { rerender, unmount } = render(
        <ResourceWeight id="sofing" environment={env} />,
      )
      await flush()
      rerender(<ResourceWeight id="talking" environment={env} />)
      await flush()
      expect(unwatch).toHaveBeenCalledTimes(1)

      unmount()
      expect(unwatch).toHaveBeenCalledTimes(2)
    })

    it('una lectura lenta que termina después de otra más nueva no la pisa', async () => {
      const urls = Object.values(await stripsOf('rolling'))
      let known = new Set([urls[0]])
      const releases: Array<() => void> = []
      let notify: (() => void) | undefined
      let calls = 0
      const env: WeightEnvironment = {
        getEntries: vi.fn((url) => (known.has(url) ? [network(10_240)] : [])),
        // La primera lectura espera; las siguientes no.
        decodeSize: vi.fn(
          () =>
            new Promise<{ width: number; height: number }>((resolve) => {
              const done = () => resolve({ width: 1000, height: 250 })
              if (calls++ === 0) releases.push(done)
              else done()
            }),
        ),
        transferVisible: () => true,
        watch: vi.fn((_urls, onChange) => {
          notify = onChange
          return () => {}
        }),
      }
      render(<ResourceWeight id="rolling" environment={env} />)
      await flush()

      known = new Set(urls)
      notify?.()
      await flush()
      const complete = rows()['Bytes del archivo']
      expect(complete).toContain('20,0 KB')

      // Ahora termina la lectura vieja, que solo conocía una tira.
      releases[0]()
      await flush()
      expect(rows()['Bytes del archivo']).toBe(complete)
    })

    it('si ya estaba todo medido, no vigila nada', async () => {
      const env = {
        ...environment(network(10_240)),
        watch: vi.fn(() => vi.fn()),
      }
      render(<ResourceWeight id="sofing" environment={env} />)
      await flush()

      expect(env.watch).not.toHaveBeenCalled()
    })
  })

  it('mientras mide el recurso nuevo no enseña las cifras del anterior', async () => {
    const pending: WeightEnvironment = {
      getEntries: vi.fn(() => [network(10_240)]),
      decodeSize: vi.fn(() => new Promise<null>(() => {})),
      transferVisible: () => true,
    }
    const { rerender } = render(
      <ResourceWeight id="sofing" environment={environment(network(10_240))} />,
    )
    await flush()
    expect(rows()['Bytes del archivo']).toContain('KB')

    rerender(<ResourceWeight id="talking" environment={pending} />)
    await flush()

    expect(rows()['Bytes del archivo']).toBe(NOT_YET)
  })

  it('al cambiar de recurso mide el nuevo y descarta el resultado del anterior', async () => {
    const env = environment(network(10_240))
    const { rerender } = render(
      <ResourceWeight id="sofing" environment={env} />,
    )
    rerender(<ResourceWeight id="talking" environment={env} />)
    await flush()

    const talking = Object.keys(await stripsOf('talking')).length
    expect(rows()['Tiras']).toBe(
      `${talking} ${talking === 1 ? 'tira' : 'tiras'}`,
    )
  })

  it('un recurso que no carga no rompe la ficha: mide lo que haya', async () => {
    const original = SOFI_REGISTRY.sofing.load!
    SOFI_REGISTRY.sofing.load = () => Promise.reject(new Error('sin red'))
    render(<ResourceWeight id="sofing" environment={environment(null)} />)
    await flush()
    SOFI_REGISTRY.sofing.load = original

    expect(
      screen.getByRole('region', { name: 'Peso y memoria' }),
    ).toBeInTheDocument()
  })

  it('avisa de lo que no es: ni el JS ni el CSS del recurso, y que en producción cambia', async () => {
    render(
      <ResourceWeight id="sofing" environment={environment(network(10_240))} />,
    )
    await flush()

    expect(region().getByText(/servidor de desarrollo/i)).toBeInTheDocument()
  })
})
