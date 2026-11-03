import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { className as blinkClass } from '../sprites/sofi-blink'
import { clearSessionRates, setSessionRate } from '../visual/rates'
import { SOFI_REGISTRY, type SofiOwnerModule } from '../visual/registry'
import type { SofiAnimationId } from '../visual/types'
import { resetSpriteLoader } from './loadSprite'
import { SofiSprite } from './SofiSprite'
import styles from './SofiSprite.module.scss'

// Plan 008 §5.4: `SofiSprite` carga el módulo dueño con `import()`, mantiene el fotograma
// de `sofi-blink` hasta que sus tiras están decodificadas y solo entonces aplica la clase.
// Las tiras y los módulos se simulan: aquí se prueba el contrato, no el navegador (VT4, VT6).

// --- Módulos dueños y tiras simulados ---------------------------------------------------

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function ownerOf(className: string, files: string[]): SofiOwnerModule {
  return {
    className,
    strips: Object.fromEntries(
      files.map((file) => [`/src/styles/sprites/${file}`, `/assets/${file}`]),
    ),
  }
}

const originalLoads = new Map<SofiAnimationId, unknown>()
function stubLoad(id: SofiAnimationId, load: () => Promise<SofiOwnerModule>) {
  if (!originalLoads.has(id)) originalLoads.set(id, SOFI_REGISTRY[id].load)
  SOFI_REGISTRY[id].load = load
}

// Una tira por `new Image()`: decode() queda pendiente hasta que la prueba lo resuelva.
type PendingStrip = {
  src: string
  crossOrigin: string | null
  resolve: () => void
  reject: () => void
}
let strips: PendingStrip[]

class FakeImage {
  src = ''
  crossOrigin: string | null = null
  decode() {
    return new Promise<void>((resolve, reject) => {
      strips.push({
        src: this.src,
        crossOrigin: this.crossOrigin,
        resolve,
        reject: () => reject(new DOMException('', 'EncodingError')),
      })
    })
  }
}

// Las cadenas de promesas (módulo, tiras, estado) necesitan varios turnos de microtareas.
const flush = () =>
  act(async () => {
    for (let turn = 0; turn < 10; turn++) await Promise.resolve()
  })

async function decodeAll() {
  strips.forEach((strip) => strip.resolve())
  await flush()
}

// Lleva un recurso hasta «pintado»: módulo cargado y tiras decodificadas.
async function paint(
  ui: React.ReactElement,
  id: SofiAnimationId,
  className = `${id}-owner`,
) {
  stubLoad(id, () => Promise.resolve(ownerOf(className, [`${id}.webp`])))
  const view = render(ui)
  await flush()
  await decodeAll()
  return view
}

const rootOf = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement

beforeEach(() => {
  strips = []
  vi.stubGlobal('Image', FakeImage)
})

afterEach(() => {
  for (const [id, load] of originalLoads)
    SOFI_REGISTRY[id].load = load as (typeof SOFI_REGISTRY)[typeof id]['load']
  originalLoads.clear()
  resetSpriteLoader()
  clearSessionRates()
  vi.unstubAllGlobals()
})

describe('SofiSprite · carga', () => {
  it('mantiene el fotograma de sofi-blink hasta que carga el módulo y se decodifican las tiras', async () => {
    const owner = deferred<SofiOwnerModule>()
    stubLoad('sofing', () => owner.promise)
    const { container } = render(<SofiSprite animation="sofing" />)
    const root = rootOf(container)

    expect(root).toHaveClass(blinkClass, styles.fallback)

    owner.resolve(ownerOf('sofing-owner', ['sofing.webp', 'sofing-fx.webp']))
    await flush()
    // El módulo ya está, pero las tiras no: se sigue viendo la estática.
    expect(strips.map((strip) => strip.src)).toEqual([
      '/assets/sofing.webp',
      '/assets/sofing-fx.webp',
    ])
    expect(root).toHaveClass(blinkClass, styles.fallback)
    expect(root).not.toHaveClass('sofing-owner')

    // Con una de dos decodificada, la clase del recurso sigue sin aplicarse.
    strips[0].resolve()
    await flush()
    expect(root).not.toHaveClass('sofing-owner')

    strips[1].resolve()
    await flush()
    expect(root).toHaveClass('sofing-owner')
    expect(root).not.toHaveClass(blinkClass)
    expect(root).not.toHaveClass(styles.fallback)
  })

  describe.each([
    [
      'el módulo no carga',
      () => stubLoad('rolling', () => Promise.reject(new Error('red caída'))),
    ],
    [
      'una tira no se decodifica',
      () =>
        stubLoad('rolling', () =>
          Promise.resolve(ownerOf('rolling-owner', ['rolling.webp'])),
        ),
    ],
  ])('si %s', (_case, arrange) => {
    it('conserva la estática', async () => {
      arrange()
      const { container } = render(<SofiSprite animation="rolling" />)
      await flush()
      strips.forEach((strip) => strip.reject())
      await flush()

      const root = rootOf(container)
      expect(root).toHaveClass(blinkClass, styles.fallback)
      expect(root).not.toHaveClass('rolling-owner')
    })
  })

  it('un fallo no se recuerda: el siguiente montaje lo reintenta', async () => {
    const load = vi
      .fn<() => Promise<SofiOwnerModule>>()
      .mockRejectedValueOnce(new Error('red caída'))
      .mockResolvedValue(ownerOf('talking-owner', ['talking.webp']))
    stubLoad('talking', load)

    const first = render(<SofiSprite animation="talking" />)
    await flush()
    expect(rootOf(first.container)).toHaveClass(styles.fallback)
    first.unmount()

    const second = render(<SofiSprite animation="talking" />)
    await flush()
    await decodeAll()
    expect(load).toHaveBeenCalledTimes(2)
    expect(rootOf(second.container)).toHaveClass('talking-owner')
  })

  it('precarga con crossOrigin anónimo solo las tiras de máscara que declara el registro', async () => {
    expect(SOFI_REGISTRY['memory-wipe'].maskStrips).toEqual([
      'memory-wipe-dissolve.webp',
    ])
    stubLoad('memory-wipe', () =>
      Promise.resolve(
        ownerOf('memory-wipe-owner', [
          'memory-wipe.webp',
          'memory-wipe-dissolve.webp',
          'memory-wipe-fx.webp',
        ]),
      ),
    )
    render(<SofiSprite animation="memory-wipe" />)
    await flush()

    const crossOriginOf = (name: string) =>
      strips.find((strip) => strip.src.endsWith(`/${name}`))?.crossOrigin
    expect(crossOriginOf('memory-wipe-dissolve.webp')).toBe('anonymous')
    expect(crossOriginOf('memory-wipe.webp')).toBeNull()
    expect(crossOriginOf('memory-wipe-fx.webp')).toBeNull()
  })

  it('es decorativo antes y después de cargar', async () => {
    stubLoad('talking', () =>
      Promise.resolve(ownerOf('talking-owner', ['talking.webp'])),
    )
    const { container } = render(<SofiSprite animation="talking" />)
    const root = rootOf(container)
    const expectDecorative = () => {
      expect(root).toHaveAttribute('aria-hidden', 'true')
      expect(root).not.toHaveAttribute('role')
      expect(root).not.toHaveAttribute('aria-label')
    }

    expectDecorative()
    await flush()
    await decodeAll()
    expect(root).toHaveClass('talking-owner')
    expectDecorative()
  })

  it('carga cada recurso una sola vez y lo reutiliza sin pasar por la estática', async () => {
    const load = vi.fn(() =>
      Promise.resolve(ownerOf('uncertain-owner', ['uncertain.webp'])),
    )
    stubLoad('uncertain', load)

    const first = render(<SofiSprite animation="uncertain" />)
    const second = render(<SofiSprite animation="uncertain" />)
    await flush()
    await decodeAll()
    expect(load).toHaveBeenCalledTimes(1)
    expect(strips).toHaveLength(1)

    first.unmount()
    second.unmount()
    const later = render(<SofiSprite animation="uncertain" />)
    // Ya cargado y decodificado: se pinta de entrada, sin volver a pedir nada.
    expect(rootOf(later.container)).toHaveClass('uncertain-owner')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('sofi-blink es estática: se pinta sin cargador ni decodificación', () => {
    const { container } = render(<SofiSprite animation="sofi-blink" />)

    expect(rootOf(container)).toHaveClass(blinkClass)
    expect(rootOf(container)).not.toHaveClass(styles.fallback)
    expect(strips).toHaveLength(0)
  })

  it('un recurso sin cargador de producción se queda en la estática', async () => {
    expect(SOFI_REGISTRY.eureka.load).toBeUndefined()
    const { container } = render(<SofiSprite animation="eureka" />)
    await flush()

    expect(rootOf(container)).toHaveClass(blinkClass, styles.fallback)
    expect(strips).toHaveLength(0)
  })

  it('al cambiar de animación vuelve a esperar a que cargue la nueva', async () => {
    stubLoad('sofing', () =>
      Promise.resolve(ownerOf('sofing-owner', ['sofing.webp'])),
    )
    const rolling = deferred<SofiOwnerModule>()
    stubLoad('rolling', () => rolling.promise)

    const { container, rerender } = render(<SofiSprite animation="sofing" />)
    await flush()
    await decodeAll()
    expect(rootOf(container)).toHaveClass('sofing-owner')

    rerender(<SofiSprite animation="rolling" />)
    await flush()
    expect(rootOf(container)).toHaveClass(blinkClass, styles.fallback)
    expect(rootOf(container)).not.toHaveClass('sofing-owner')

    rolling.resolve(ownerOf('rolling-owner', ['rolling.webp']))
    await flush()
    await decodeAll()
    expect(rootOf(container)).toHaveClass('rolling-owner')
  })
})

// --- Ciclo, velocidad y movimiento --------------------------------------------------------

// jsdom no implementa Web Animations: se simulan solo `getAnimations` y `playbackRate`.
type FakeAnimation = { playbackRate: number }
let animations: FakeAnimation[]
let animationQueries: unknown[]

function installWebAnimations() {
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value(options: unknown) {
      animationQueries.push(options)
      return animations
    },
  })
}

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'getAnimations')
})

describe('SofiSprite · pasada única', () => {
  it('aplica la clase de pasada única solo donde el registro la pide', async () => {
    expect(SOFI_REGISTRY.favoriting.singlePassClass).toBe(true)
    expect(SOFI_REGISTRY.sofing.singlePassClass).toBeUndefined()

    const once = await paint(
      <SofiSprite animation="favoriting" />,
      'favoriting',
    )
    expect(rootOf(once.container)).toHaveClass(styles.singlePass)

    const loop = await paint(<SofiSprite animation="sofing" />, 'sofing')
    expect(rootOf(loop.container)).not.toHaveClass(styles.singlePass)
  })

  it('no aplica la clase de pasada única a la estática mientras carga', () => {
    stubLoad('favoriting', () => new Promise(() => {}))
    const { container } = render(<SofiSprite animation="favoriting" />)

    expect(rootOf(container)).not.toHaveClass(styles.singlePass)
  })
})

describe('SofiSprite · velocidad', () => {
  beforeEach(() => {
    animations = [{ playbackRate: 1 }, { playbackRate: 1 }, { playbackRate: 1 }]
    animationQueries = []
    installWebAnimations()
  })

  it('aplica la velocidad del recurso a todo el subárbol, pseudoelementos incluidos', async () => {
    setSessionRate('rolling', 4)
    await paint(<SofiSprite animation="rolling" />, 'rolling')

    expect(animations.map((animation) => animation.playbackRate)).toEqual([
      4, 4, 4,
    ])
    expect(animationQueries).toContainEqual({ subtree: true })
  })

  it('reaplica la velocidad en animationstart a las animaciones que empiezan después', async () => {
    setSessionRate('poking', 2)
    const { container } = await paint(
      <SofiSprite animation="poking" />,
      'poking',
    )

    // Una animación nueva (otra capa, otra iteración) nace a 1×.
    animations.push({ playbackRate: 1 })
    fireEvent.animationStart(rootOf(container))

    expect(animations.at(-1)?.playbackRate).toBe(2)
  })

  it('una velocidad nueva del Lab se aplica sin que nadie vuelva a pintar', async () => {
    await paint(<SofiSprite animation="talking" />, 'talking')
    expect(animations.every((animation) => animation.playbackRate === 1)).toBe(
      true,
    )

    act(() => setSessionRate('talking', 0.5))
    expect(animations.map((animation) => animation.playbackRate)).toEqual([
      0.5, 0.5, 0.5,
    ])

    // Deshacerla devuelve el factor del parcial; la de otro recurso no la mueve.
    act(() => setSessionRate('rolling', 4))
    act(() => clearSessionRates())
    expect(animations.every((animation) => animation.playbackRate === 1)).toBe(
      true,
    )
  })

  it('no toca las animaciones mientras se ve la estática', async () => {
    setSessionRate('sofing', 4)
    stubLoad('sofing', () => new Promise(() => {}))
    render(<SofiSprite animation="sofing" />)
    await flush()

    expect(animations.map((animation) => animation.playbackRate)).toEqual([
      1, 1, 1,
    ])
  })
})

describe('SofiSprite · eventos de ciclo', () => {
  it('un bucle emite onFirstCycle una sola vez, al acabar su primera vuelta', async () => {
    const onFirstCycle = vi.fn()
    const onEnd = vi.fn()
    const { container } = await paint(
      <SofiSprite
        animation="sofing"
        onFirstCycle={onFirstCycle}
        onEnd={onEnd}
      />,
      'sofing',
    )

    expect(onFirstCycle).not.toHaveBeenCalled()
    fireEvent.animationIteration(rootOf(container))
    fireEvent.animationIteration(rootOf(container))

    expect(onFirstCycle).toHaveBeenCalledTimes(1)
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('una pasada única emite onFirstCycle y onEnd una sola vez, aunque acaben varias capas', async () => {
    const onFirstCycle = vi.fn()
    const onEnd = vi.fn()
    const { container } = await paint(
      <SofiSprite
        animation="favoriting"
        onFirstCycle={onFirstCycle}
        onEnd={onEnd}
      />,
      'favoriting',
    )

    expect(onEnd).not.toHaveBeenCalled()
    fireEvent.animationEnd(rootOf(container))
    fireEvent.animationEnd(rootOf(container))
    fireEvent.animationEnd(rootOf(container))

    expect(onFirstCycle).toHaveBeenCalledTimes(1)
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('cuenta el primer ciclo de cada animación por separado', async () => {
    const onFirstCycle = vi.fn()
    stubLoad('sofing', () =>
      Promise.resolve(ownerOf('sofing-owner', ['sofing.webp'])),
    )
    stubLoad('rolling', () =>
      Promise.resolve(ownerOf('rolling-owner', ['rolling.webp'])),
    )
    const { container, rerender } = render(
      <SofiSprite animation="sofing" onFirstCycle={onFirstCycle} />,
    )
    await flush()
    await decodeAll()
    fireEvent.animationIteration(rootOf(container))
    expect(onFirstCycle).toHaveBeenCalledTimes(1)

    rerender(<SofiSprite animation="rolling" onFirstCycle={onFirstCycle} />)
    await flush()
    await decodeAll()
    fireEvent.animationIteration(rootOf(container))

    expect(onFirstCycle).toHaveBeenCalledTimes(2)
  })

  it('ignora los eventos de ciclo mientras se ve la estática', () => {
    const onFirstCycle = vi.fn()
    const onEnd = vi.fn()
    stubLoad('error', () => new Promise(() => {}))
    const { container } = render(
      <SofiSprite
        animation="error"
        onFirstCycle={onFirstCycle}
        onEnd={onEnd}
      />,
    )

    fireEvent.animationIteration(rootOf(container))
    fireEvent.animationEnd(rootOf(container))

    expect(onFirstCycle).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
  })
})

describe('SofiSprite · sin Web Animations (jsdom)', () => {
  it('pinta el recurso sin velocidad ni eventos de ciclo y sin fallar', async () => {
    const onFirstCycle = vi.fn()
    const onEnd = vi.fn()
    setSessionRate('needs-context', 3)
    expect(Element.prototype.getAnimations).toBeUndefined()

    const { container } = await paint(
      <SofiSprite
        animation="needs-context"
        onFirstCycle={onFirstCycle}
        onEnd={onEnd}
      />,
      'needs-context',
    )

    expect(rootOf(container)).toHaveClass('needs-context-owner')
    expect(onFirstCycle).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
  })
})
