import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FrameTimeline } from './FrameTimeline'

// Web Animations no existe en jsdom: se simula con lo mínimo que lee la línea de tiempo (los
// fotogramas clave y el tiempo de la animación de la tira). La sincronía real con el navegador
// se comprueba en Chromium.

type FakeKeyframe = {
  computedOffset: number
  backgroundPositionX?: string
  easing: string
}

const BLINK: FakeKeyframe[] = [
  { computedOffset: 0, backgroundPositionX: '0%', easing: 'steps(1)' },
  { computedOffset: 0.5, backgroundPositionX: '50%', easing: 'steps(1)' },
  { computedOffset: 0.75, backgroundPositionX: '100%', easing: 'steps(1)' },
  { computedOffset: 1, backgroundPositionX: '0%', easing: 'steps(1)' },
]

class FakeAnimation {
  playState = 'running'
  // Lo que escribe quien se desplaza; `advance` mueve el tiempo como lo haría el navegador.
  writes: number[] = []
  private time: number | null = 0
  readonly effect: {
    target: Element
    pseudoElement: string | null
    getKeyframes: () => unknown[]
    getComputedTiming: () => { duration: number; progress: number | null }
  }
  constructor(
    target: Element,
    keyframes: unknown[],
    duration: number,
    pseudoElement: string | null = null,
  ) {
    this.effect = {
      target,
      pseudoElement,
      getKeyframes: () => keyframes,
      getComputedTiming: () => ({
        duration,
        progress: this.time === null ? null : (this.time % duration) / duration,
      }),
    }
  }
  get currentTime() {
    return this.time
  }
  set currentTime(value: number | null) {
    this.time = value
    if (value !== null) this.writes.push(value)
  }
  advance(value: number) {
    this.time = value
  }
}

let animations: FakeAnimation[]
let scope: HTMLElement
const onPause = vi.fn()
const onRestart = vi.fn()

// El escenario con su sprite: lo que `ResourceInspector` le pasa a la línea de tiempo.
function addSprite(duration = 4200, keyframes: unknown[] = BLINK) {
  const sprite = document.createElement('span')
  sprite.style.setProperty('--sprite-frames', '3')
  sprite.style.backgroundImage = 'url(/strip.webp)'
  scope.append(sprite)
  const main = new FakeAnimation(sprite, keyframes, duration)
  // Capas de otro tipo en el mismo recurso: se mueven con el cabezal, no dibujan tramos.
  const effects = new FakeAnimation(
    sprite,
    [{ computedOffset: 0 }],
    duration,
    '::before',
  )
  animations.push(main, effects)
  return { sprite, main, effects }
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
const tick = () => act(async () => void (await frame()))

function mount(
  props: Partial<React.ComponentProps<typeof FrameTimeline>> = {},
) {
  return render(
    <FrameTimeline
      scope={scope}
      paused={false}
      onPause={onPause}
      onRestart={onRestart}
      {...props}
    />,
  )
}
const bar = () =>
  screen.getByRole('slider', { name: 'Posición en la animación' })

beforeEach(() => {
  animations = []
  scope = document.createElement('div')
  document.body.append(scope)
  onPause.mockClear()
  onRestart.mockClear()
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: () => animations,
  })
})

afterEach(() => {
  cleanup()
  scope.remove()
  delete (Element.prototype as { getAnimations?: unknown }).getAnimations
})

describe('FrameTimeline · datos', () => {
  it('dibuja los tramos y los fotogramas de la animación real', async () => {
    addSprite()
    mount()
    await tick()

    expect(screen.getByText(/3 fotogramas/)).toBeInTheDocument()
    // Una miniatura por fotograma, con lo que dura cada uno en el ciclo.
    const thumbs = screen.getAllByRole('button', { name: /Ir al fotograma/ })
    expect(thumbs.map((thumb) => thumb.textContent)).toEqual([
      '02100 ms',
      '11050 ms',
      '21050 ms',
    ])
  })

  it('las duraciones de los fotogramas suman la del ciclo', async () => {
    addSprite()
    mount()
    await tick()

    const total = screen
      .getAllByRole('button', { name: /Ir al fotograma/ })
      .map((thumb) =>
        Number(/, (\d+) ms$/.exec(thumb.getAttribute('aria-label') ?? '')![1]),
      )
      .reduce((sum, ms) => sum + ms, 0)
    expect(total).toBe(4200)
  })

  it('sigue la animación: marca el fotograma que se ve y mueve el cabezal', async () => {
    const { main } = addSprite()
    mount()
    main.advance(2625)
    await tick()

    expect(bar()).toHaveAttribute('aria-valuenow', '63')
    expect(bar()).toHaveAttribute(
      'aria-valuetext',
      expect.stringContaining('fotograma 1'),
    )
    const current = screen
      .getAllByRole('button', { name: /Ir al fotograma/ })
      .map((thumb) => thumb.getAttribute('aria-current'))
    expect(current).toEqual([null, 'true', null])

    main.advance(3900)
    await tick()
    expect(bar()).toHaveAttribute(
      'aria-valuetext',
      expect.stringContaining('fotograma 2'),
    )
  })

  it('con una duración distinta, los tramos escalan: no hay milisegundos copiados', async () => {
    addSprite(8400)
    mount()
    await tick()

    const thumbs = screen.getAllByRole('button', { name: /Ir al fotograma/ })
    expect(thumbs.map((thumb) => thumb.textContent)).toEqual([
      '04200 ms',
      '12100 ms',
      '22100 ms',
    ])
  })
})

describe('FrameTimeline · sin línea de tiempo', () => {
  it('sin animación (movimiento reducido, o jsdom) lo dice y no dibuja nada', async () => {
    mount()
    await tick()

    expect(screen.getByText(/Sin animación/)).toBeInTheDocument()
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('una máquina no tiene una línea de tiempo única y no se inventa una', async () => {
    addSprite()
    mount({ machine: true })
    await tick()

    expect(screen.getByText(/máquina de estados/i)).toBeInTheDocument()
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('si los fotogramas clave no permiten dibujarla sin inventar, lo dice', async () => {
    addSprite(4200, [
      { computedOffset: 0, backgroundPositionX: '0%', easing: 'linear' },
      { computedOffset: 1, backgroundPositionX: '100%', easing: 'linear' },
    ])
    mount()
    await tick()

    expect(screen.getByText(/no se puede dibujar/i)).toBeInTheDocument()
    expect(screen.queryByRole('slider')).toBeNull()
  })
})

describe('FrameTimeline · desplazamiento manual', () => {
  function seekedTimes() {
    return animations.map((animation) => animation.writes)
  }

  it('una miniatura pausa y lleva todas las capas al centro de su tramo', async () => {
    addSprite()
    mount()
    await tick()
    animations.forEach((animation) => animation.writes.splice(0))

    fireEvent.click(screen.getByRole('button', { name: /Ir al fotograma 2/ }))

    expect(onPause).toHaveBeenCalledTimes(1)
    expect(seekedTimes()).toEqual([[3675], [3675]])
  })

  it('arrastrar por la barra lleva todas las capas a ese punto del ciclo', async () => {
    addSprite()
    mount()
    await tick()
    animations.forEach((animation) => animation.writes.splice(0))
    vi.spyOn(bar(), 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 200,
    } as DOMRect)
    ;(bar() as HTMLElement).setPointerCapture = vi.fn()
    ;(bar() as HTMLElement).hasPointerCapture = () => true

    fireEvent.pointerDown(bar(), { clientX: 200, pointerId: 1 })
    expect(onPause).toHaveBeenCalled()
    expect(seekedTimes()).toEqual([[2100], [2100]])

    fireEvent.pointerMove(bar(), { clientX: 250, pointerId: 1 })
    expect(seekedTimes()[0].at(-1)).toBe(3150)
  })

  it('las flechas mueven 100 ms, Inicio vuelve al principio y Fin va al último instante', async () => {
    const { main } = addSprite()
    mount()
    main.advance(1000)
    await tick()
    animations.forEach((animation) => animation.writes.splice(0))

    fireEvent.keyDown(bar(), { key: 'ArrowRight' })
    expect(seekedTimes()[0]).toEqual([1100])
    fireEvent.keyDown(bar(), { key: 'ArrowLeft' })
    // 1000 + 100 − 100: la flecha izquierda parte de donde dejó la derecha.
    expect(seekedTimes()[0].at(-1)).toBeCloseTo(1000, 3)
    fireEvent.keyDown(bar(), { key: 'Home' })
    expect(seekedTimes()[0].at(-1)).toBe(0)
    fireEvent.keyDown(bar(), { key: 'End' })
    expect(seekedTimes()[0].at(-1)).toBeCloseTo(4199.58, 1)
    expect(onPause).toHaveBeenCalled()
  })

  it('otras teclas no hacen nada', async () => {
    addSprite()
    mount()
    await tick()
    fireEvent.keyDown(bar(), { key: 'a' })
    expect(onPause).not.toHaveBeenCalled()
  })

  it('con la animación ya terminada, desplazarse la reinicia y salta cuando nace la nueva', async () => {
    const first = addSprite()
    mount()
    await tick()

    // La pasada única termina: el navegador deja de exponer su animación.
    first.main.playState = 'idle'
    animations.splice(0)
    first.sprite.remove()
    await tick()
    // Los datos de la línea de tiempo siguen a la vista.
    expect(bar()).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Ir al fotograma 1/ }))
    expect(onPause).toHaveBeenCalled()
    expect(onRestart).toHaveBeenCalledTimes(1)

    // El reinicio monta un sprite nuevo: al nacer su animación, se coloca en lo pedido.
    const next = addSprite()
    await tick()
    expect(next.main.writes).toEqual([2625])
    expect(next.effects.writes).toEqual([2625])

    // Y no vuelve a saltar en cada fotograma.
    await tick()
    expect(next.main.writes).toEqual([2625])
  })

  it('arrastrar sobre una animación terminada la reinicia una sola vez y se queda en el último punto', async () => {
    const first = addSprite()
    mount()
    await tick()
    first.main.playState = 'idle'
    animations.splice(0)
    first.sprite.remove()
    await tick()

    fireEvent.click(screen.getByRole('button', { name: /Ir al fotograma 1/ }))
    fireEvent.click(screen.getByRole('button', { name: /Ir al fotograma 2/ }))
    expect(onRestart).toHaveBeenCalledTimes(1)

    const next = addSprite()
    await tick()
    expect(next.main.writes).toEqual([3675])
  })

  it('lo pedido se usa una sola vez: la animación que nazca después no salta', async () => {
    const first = addSprite()
    mount()
    await tick()
    first.main.playState = 'idle'
    animations.splice(0)
    first.sprite.remove()
    await tick()
    fireEvent.click(screen.getByRole('button', { name: /Ir al fotograma 1/ }))
    const second = addSprite()
    await tick()
    expect(second.main.writes).toEqual([2625])

    // Otro reinicio cualquiera (un evento nuevo, otro contenedor): nadie pidió desplazarse.
    second.main.playState = 'idle'
    animations.splice(0)
    second.sprite.remove()
    await tick()
    const third = addSprite()
    await tick()
    expect(third.main.writes).toEqual([])
  })

  it('una pasada terminada deja de ser la animación del recurso aunque el navegador la siga nombrando', async () => {
    // En Chromium la animación terminada sigue conectada y con estado «finished», pero ya no
    // está entre las del elemento: moverla no mueve nada.
    const first = addSprite()
    mount()
    await tick()
    first.main.playState = 'finished'
    animations.splice(0)
    await tick()

    fireEvent.click(screen.getByRole('button', { name: /Ir al fotograma 1/ }))

    expect(onRestart).toHaveBeenCalledTimes(1)
    const next = addSprite()
    await tick()
    expect(next.main.writes).toEqual([2625])
  })
})
