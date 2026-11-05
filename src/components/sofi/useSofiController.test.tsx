import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode, useState } from 'react'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  MotionPreferenceProvider,
  type MotionPreference,
} from '../../app/providers/MotionPreference'
import {
  installLeakProbe,
  type LeakProbe,
  type LeakSnapshot,
} from '../../test/leakProbe'
import { resetSpriteLoader } from './SofiSprite/loadSprite'
import { STILL_HERE_IDLE_MS, useSofiController } from './useSofiController'
import { createAmbient, type Ambient, type GagId } from './visual/ambient'
import { clearSessionRates, setSessionRate } from './visual/rates'
import { SOFI_REGISTRY, type SofiOwnerModule } from './visual/registry'
import source from './useSofiController.ts?raw'

// Plan 008 §6, T041 y VT3: el adaptador monta los controladores REALES de los ZIP (sin
// simular ni modificar) y los destruye sin dejar nada. Solo se simulan los módulos dueños y
// la decodificación de las tiras (como en `SofiSprite`) y los observadores que jsdom no tiene.
// No es un navegador: el comportamiento real va en VT6.

type Spec = {
  kind: GagId
  // Atributo `dataset` que el controlador pone en el anfitrión y su selector de capas.
  attribute: 'poking' | 'stillHere' | 'iSeeYou'
  layers: string
}

const SPECS: Spec[] = [
  { kind: 'poking', attribute: 'poking', layers: '[data-poking-layer]' },
  {
    kind: 'are-u-still-here',
    attribute: 'stillHere',
    layers: '[data-still-here-layer]',
  },
  { kind: 'i-see-you', attribute: 'iSeeYou', layers: '[data-i-see-you-layer]' },
]
const [POKING, STILL_HERE, I_SEE_YOU] = SPECS

// --- Tiras simuladas -------------------------------------------------------------------

type PendingStrip = { src: string; resolve: () => void; reject: () => void }
let strips: PendingStrip[]
// Con `false`, cada tira espera a que la prueba la decodifique.
let autoDecode: boolean

class FakeImage {
  src = ''
  decode() {
    return new Promise<void>((resolve, reject) => {
      const strip = {
        src: this.src,
        resolve,
        reject: () => reject(new DOMException('', 'EncodingError')),
      }
      strips.push(strip)
      if (autoDecode) resolve()
    })
  }
}

const originalLoads = new Map<GagId, unknown>()
function stubOwner(kind: GagId) {
  originalLoads.set(kind, SOFI_REGISTRY[kind].load)
  SOFI_REGISTRY[kind].load = () =>
    Promise.resolve<SofiOwnerModule>({
      className: `${kind}-owner`,
      strips: { [`/src/styles/sprites/${kind}.webp`]: `/assets/${kind}.webp` },
    })
}

// Las cadenas de promesas (módulo dueño, tiras, controlador) necesitan varios turnos.
const flush = () =>
  act(async () => {
    await vi.dynamicImportSettled()
    for (let turn = 0; turn < 10; turn++) await Promise.resolve()
  })

// --- Escena de prueba ------------------------------------------------------------------

type SceneProps = {
  spec: Spec
  ambient: Ambient
  calm?: boolean
  motion?: MotionPreference
  strict?: boolean
}

// El anfitrión es el elemento al que el consumidor aplica la clase del gag y que, como pide
// el plan, queda sin hijos de React.
function Gag({
  spec,
  ambient,
  calm,
}: Pick<SceneProps, 'spec' | 'ambient'> & { calm: boolean }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const gagClass = useSofiController(spec.kind, host, { ambient, calm })
  return <span ref={setHost} data-testid="host" className={gagClass} />
}

function Scene({
  spec,
  ambient,
  calm = true,
  motion = 'system',
  strict = false,
}: SceneProps) {
  const tree = (
    <MotionPreferenceProvider value={motion}>
      <Gag spec={spec} ambient={ambient} calm={calm} />
    </MotionPreferenceProvider>
  )
  return strict ? <StrictMode>{tree}</StrictMode> : tree
}

const hostOf = () => screen.getByTestId('host')
const isMounted = (host: HTMLElement, spec: Spec) =>
  host.dataset[spec.attribute] !== undefined
const layersOf = (host: HTMLElement, spec: Spec) =>
  host.querySelectorAll(spec.layers).length

// Monta y desmonta el gag una vez: deja sus tiras en la caché de `loadSprite`.
async function warm(spec: Spec) {
  const view = render(<Scene spec={spec} ambient={createAmbient()} />)
  await flush()
  view.unmount()
}
const globalListeners = (snapshot: LeakSnapshot) =>
  snapshot.listeners.filter((listener) => /^(window|document):/.test(listener))

// --- Entorno ---------------------------------------------------------------------------

let probe: LeakProbe
let ambient: Ambient

beforeAll(async () => {
  // El adaptador los importa con `import()`; cargados antes, solo falta que se resuelvan.
  await Promise.all([
    import('../../styles/sprites/poking.js'),
    import('../../styles/sprites/are-u-still-here.js'),
    import('../../styles/sprites/i-see-you.js'),
  ])
})

beforeEach(() => {
  strips = []
  autoDecode = true
  vi.useFakeTimers()
  vi.stubGlobal('Image', FakeImage)
  for (const { kind } of SPECS) stubOwner(kind)
  probe = installLeakProbe()
  ambient = createAmbient()
})

afterEach(() => {
  cleanup()
  probe.uninstall()
  vi.useRealTimers()
  for (const [kind, load] of originalLoads)
    SOFI_REGISTRY[kind].load = load as (typeof SOFI_REGISTRY)[GagId]['load']
  originalLoads.clear()
  resetSpriteLoader()
  clearSessionRates()
  vi.unstubAllGlobals()
})

describe.each(SPECS)('useSofiController · $kind', (spec) => {
  it('monta solo con escena tranquila, anfitrión y tiras decodificadas, y se desmonta al dejar de estarlo', async () => {
    autoDecode = false
    const { rerender } = render(
      <Scene spec={spec} ambient={ambient} calm={false} />,
    )
    await flush()
    const baseline = probe.snapshot()
    const host = hostOf()

    // Sin escena tranquila no se pide ni una tira ni se escucha nada.
    expect(strips).toEqual([])
    expect(isMounted(host, spec)).toBe(false)

    rerender(<Scene spec={spec} ambient={ambient} />)
    await flush()
    // Las tiras se piden, pero hasta decodificarlas no hay clase ni controlador.
    expect(strips.map((strip) => strip.src)).toEqual([
      `/assets/${spec.kind}.webp`,
    ])
    expect(host).not.toHaveClass(`${spec.kind}-owner`)
    expect(isMounted(host, spec)).toBe(false)
    expect(probe.snapshot()).toEqual(baseline)

    strips[0].resolve()
    await flush()
    expect(host).toHaveClass(`${spec.kind}-owner`)
    expect(isMounted(host, spec)).toBe(true)
    expect(layersOf(host, spec)).toBeGreaterThan(0)
    expect(probe.snapshot().listeners.length).toBeGreaterThan(
      baseline.listeners.length,
    )

    rerender(<Scene spec={spec} ambient={ambient} calm={false} />)
    await flush()
    expect(host).not.toHaveClass(`${spec.kind}-owner`)
    expect(isMounted(host, spec)).toBe(false)
    expect(layersOf(host, spec)).toBe(0)
    expect(probe.snapshot()).toEqual(baseline)
  })

  it('con movimiento reducido no monta ni pide tiras, y pasar a reducido lo destruye', async () => {
    const { rerender } = render(
      <Scene spec={spec} ambient={ambient} motion="reduce" />,
    )
    await flush()
    const baseline = probe.snapshot()
    const host = hostOf()
    expect(strips).toEqual([])
    expect(isMounted(host, spec)).toBe(false)

    rerender(<Scene spec={spec} ambient={ambient} motion="full" />)
    await flush()
    expect(isMounted(host, spec)).toBe(true)

    rerender(<Scene spec={spec} ambient={ambient} motion="reduce" />)
    await flush()
    expect(isMounted(host, spec)).toBe(false)
    expect(layersOf(host, spec)).toBe(0)
    expect(probe.snapshot()).toEqual(baseline)
  })

  describe.each([false, true])('al desmontar (StrictMode: %s)', (strict) => {
    it('no quedan escuchas, observadores, temporizadores, fotogramas, capas ni atributos', async () => {
      // La línea base incluye lo que React deja en su contenedor.
      const { rerender, unmount } = render(
        <Scene spec={spec} ambient={ambient} calm={false} strict={strict} />,
      )
      await flush()
      const baseline = probe.snapshot()
      const host = hostOf()

      rerender(<Scene spec={spec} ambient={ambient} strict={strict} />)
      await flush()
      expect(isMounted(host, spec)).toBe(true)
      const mounted = probe.snapshot()
      // La sonda ve algo que limpiar.
      expect(mounted).not.toEqual(baseline)

      unmount()

      expect(probe.snapshot()).toEqual(baseline)
      expect(isMounted(host, spec)).toBe(false)
      expect(layersOf(host, spec)).toBe(0)
      expect(host.getAttributeNames()).not.toContainEqual(
        expect.stringMatching(/^data-(poking|still-here|i-see-you)/),
      )
    })
  })

  // Con las tiras ya cargadas el efecto llega a pedir el controlador en su primera pasada, y
  // la limpieza de StrictMode lo cancela antes de que cargue: ese es el caso que importa.
  it.each([false, true])(
    'StrictMode monta una sola vez el mismo conjunto que sin él (tiras en caché: %s)',
    async (cached) => {
      if (cached) await warm(spec)
      // Lo que añade el controlador sobre una línea base sin él (React deja sus propias
      // escuchas en el contenedor, y una sola vez por documento).
      const addedWith = async (strict: boolean) => {
        const view = render(
          <Scene spec={spec} ambient={ambient} calm={false} strict={strict} />,
        )
        await flush()
        const before = probe.snapshot()
        view.rerender(<Scene spec={spec} ambient={ambient} strict={strict} />)
        await flush()
        const after = probe.snapshot()
        const added = {
          listeners: [...after.listeners],
          timers: after.timers - before.timers,
          observers: after.observers.length - before.observers.length,
          layers: layersOf(hostOf(), spec),
        }
        for (const listener of before.listeners)
          added.listeners.splice(added.listeners.indexOf(listener), 1)
        view.unmount()
        return added
      }

      const plain = await addedWith(false)
      const strict = await addedWith(true)

      expect(plain.layers).toBeGreaterThan(0)
      expect(plain.listeners.length).toBeGreaterThan(0)
      expect(strict).toEqual(plain)
    },
  )

  it('si se desmonta antes de que cargue el controlador, no se monta nada', async () => {
    // Con las tiras en caché el efecto pide el controlador nada más montar.
    await warm(spec)
    const baseline = globalListeners(probe.snapshot())
    const { unmount } = render(<Scene spec={spec} ambient={ambient} />)
    const host = hostOf()

    unmount()
    await flush()

    expect(isMounted(host, spec)).toBe(false)
    expect(layersOf(host, spec)).toBe(0)
    expect(globalListeners(probe.snapshot())).toEqual(baseline)
  })

  it('se da de baja de ambient al desmontar, y no vuelve a recibir causas', async () => {
    const register = ambient.register.bind(ambient)
    const registered: GagId[] = []
    const unregistered: GagId[] = []
    vi.spyOn(ambient, 'register').mockImplementation((gag, target) => {
      registered.push(gag)
      const unregister = register(gag, target)
      return () => {
        unregistered.push(gag)
        unregister()
      }
    })
    const { unmount } = render(<Scene spec={spec} ambient={ambient} />)
    await flush()
    expect(registered).toEqual([spec.kind])

    unmount()

    expect(unregistered).toEqual([spec.kind])
  })
})

describe('useSofiController · condiciones de montaje', () => {
  it('sin anfitrión no pide tiras ni monta nada', async () => {
    function NoHost() {
      useSofiController('poking', null, { ambient, calm: true })
      return null
    }
    render(<NoHost />)
    await flush()

    expect(strips).toEqual([])
    expect(probe.snapshot().timers).toBe(0)
    expect(probe.snapshot().observers).toEqual([])
  })

  it('si las tiras no se decodifican, el gag no se monta y no falla', async () => {
    autoDecode = false
    render(<Scene spec={POKING} ambient={ambient} />)
    await flush()

    await act(async () => {
      strips[0].reject()
      await Promise.resolve()
    })
    await flush()

    expect(isMounted(hostOf(), POKING)).toBe(false)
    expect(hostOf()).not.toHaveClass('poking-owner')
  })

  // Un import estático metería los tres controladores en el chunk de entrada (plan §7).
  it('los controladores se importan solo de forma diferida', () => {
    expect(source).not.toMatch(/^import[^;]*styles\/sprites\//m)
    for (const file of ['poking', 'are-u-still-here', 'i-see-you'])
      expect(source).toContain(`import('../../styles/sprites/${file}.js')`)
  })
})

describe('useSofiController · inactividad y velocidad', () => {
  const stillHere = () => hostOf().dataset.stillHere

  it('are-u-still-here usa el umbral del plan (150 000 ms), no el de 90 000 ms del controlador', async () => {
    render(<Scene spec={STILL_HERE} ambient={ambient} />)
    await flush()
    expect(STILL_HERE_IDLE_MS).toBe(150_000)

    act(() => vi.advanceTimersByTime(149_000))
    expect(stillHere()).toBe('idle')
    act(() => vi.advanceTimersByTime(1_500))
    expect(stillHere()).toBe('drowsy')
  })

  it('la velocidad de sesión llega al controlador con setRate: al montar y en vivo', async () => {
    setSessionRate('are-u-still-here', 10)
    render(<Scene spec={STILL_HERE} ambient={ambient} />)
    await flush()

    act(() => vi.advanceTimersByTime(14_000))
    expect(stillHere()).toBe('idle')
    act(() => vi.advanceTimersByTime(1_200))
    expect(stillHere()).toBe('drowsy')

    // En vivo: a 0,5× lo que falta se alarga al doble.
    act(() => {
      fireEvent.pointerDown(document)
    })
    expect(stillHere()).toBe('idle')
    act(() => setSessionRate('are-u-still-here', 0.5))
    act(() => vi.advanceTimersByTime(150_000 * 2 - 1_000))
    expect(stillHere()).toBe('idle')
    act(() => vi.advanceTimersByTime(2_000))
    expect(stillHere()).toBe('drowsy')
  })
})

describe('useSofiController · causas de pausa (visual/ambient)', () => {
  // `attachPoking` pierde el motivo al delegar: sin agregar causas, reanudar una anularía
  // la otra (E6). Se ve con el temporizador real de cada controlador.
  it('poking: con dos causas, reanudar una no anula la otra', async () => {
    render(<Scene spec={POKING} ambient={ambient} />)
    await flush()
    const host = hostOf()
    fireEvent.click(host)
    expect(host.dataset.poking).toBe('curious')

    act(() => {
      ambient.setCause('busy', true)
      ambient.setCause('sensitive', true)
    })
    act(() => vi.advanceTimersByTime(60_000))
    expect(host.dataset.poking).toBe('curious')

    act(() => ambient.setCause('busy', false))
    act(() => vi.advanceTimersByTime(60_000))
    expect(host.dataset.poking).toBe('curious')

    // Con la última causa fuera vuelve a correr su reposo de 10 s.
    act(() => ambient.setCause('sensitive', false))
    act(() => vi.advanceTimersByTime(9_000))
    expect(host.dataset.poking).toBe('curious')
    act(() => vi.advanceTimersByTime(2_000))
    expect(host.dataset.poking).toBe('idle')
  })

  it('are-u-still-here: con dos causas, la cuenta atrás espera a la última', async () => {
    render(<Scene spec={STILL_HERE} ambient={ambient} />)
    await flush()
    const host = hostOf()

    act(() => {
      ambient.setCause('busy', true)
      ambient.setCause('interaction', true)
    })
    act(() => vi.advanceTimersByTime(STILL_HERE_IDLE_MS * 2))
    expect(host.dataset.stillHere).toBe('idle')

    act(() => ambient.setCause('busy', false))
    act(() => vi.advanceTimersByTime(STILL_HERE_IDLE_MS * 2))
    expect(host.dataset.stillHere).toBe('idle')

    act(() => ambient.setCause('interaction', false))
    act(() => vi.advanceTimersByTime(STILL_HERE_IDLE_MS - 1_000))
    expect(host.dataset.stillHere).toBe('idle')
    act(() => vi.advanceTimersByTime(2_000))
    expect(host.dataset.stillHere).toBe('drowsy')
  })

  it('un controlador que nace con causas activas nace pausado', async () => {
    ambient.setCause('sensitive', true)
    render(<Scene spec={STILL_HERE} ambient={ambient} />)
    await flush()

    act(() => vi.advanceTimersByTime(STILL_HERE_IDLE_MS * 2))
    expect(hostOf().dataset.stillHere).toBe('idle')

    act(() => ambient.setCause('sensitive', false))
    act(() => vi.advanceTimersByTime(STILL_HERE_IDLE_MS + 1_000))
    expect(hostOf().dataset.stillHere).toBe('drowsy')
  })
})

describe('useSofiController · un solo gag activo', () => {
  it('poking sale del reposo: se declara activo, y al volver a él, inactivo', async () => {
    const activate = vi.spyOn(ambient, 'activate')
    const deactivate = vi.spyOn(ambient, 'deactivate')
    render(<Scene spec={POKING} ambient={ambient} />)
    await flush()
    expect(activate).not.toHaveBeenCalled()

    fireEvent.click(hostOf())
    expect(activate).toHaveBeenCalledWith('poking')
    // Los pasos siguientes de la escalera no vuelven a declararlo.
    act(() => vi.advanceTimersByTime(500))
    fireEvent.click(hostOf())
    expect(activate).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(11_000))
    expect(hostOf().dataset.poking).toBe('idle')
    expect(deactivate).toHaveBeenCalledWith('poking')
  })

  it('i-see-you: mirar no cuenta como salir del reposo, ser pillada sí', async () => {
    const activate = vi.spyOn(ambient, 'activate')
    render(<Scene spec={I_SEE_YOU} ambient={ambient} />)
    await flush()
    const host = hostOf()
    // jsdom no tiene geometría: el controlador solo mira si el sprite tiene caja.
    host.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect

    fireEvent.pointerMove(document, { clientX: 400, clientY: 50 })
    act(() => vi.advanceTimersByTime(200))
    expect(host.dataset.iSeeYou).toBe('watching')
    expect(activate).not.toHaveBeenCalled()

    // Con el cursor encima se la pilla pasado `dwell`.
    fireEvent.pointerEnter(host)
    act(() => vi.advanceTimersByTime(1_300))
    expect(host.dataset.iSeeYou).toBe('caught')
    expect(activate).toHaveBeenCalledWith('i-see-you')
  })

  it('i-see-you: si se desmonta con un fotograma de mirada pendiente, no queda ninguno', async () => {
    const view = render(<Scene spec={I_SEE_YOU} ambient={ambient} />)
    await flush()
    hostOf().getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
    const baseline = probe.snapshot()

    fireEvent.pointerMove(document, { clientX: 400, clientY: 50 })
    expect(probe.snapshot().frames).toBe(baseline.frames + 1)

    view.unmount()
    expect(probe.snapshot().frames).toBe(0)
  })
})

// Velocidad de las capas CSS: `setRate` del controlador solo mueve sus temporizadores. Las
// animaciones CSS que crea el controlador (otra capa, otro estado) nacen a 1× y deben seguir
// la velocidad del recurso, como pide la spec §8 («todas sus capas y los tiempos de su
// controlador»). jsdom no tiene Web Animations: se simulan con un registro de escrituras.
describe('useSofiController · velocidad de las capas CSS', () => {
  class FakeAnimation {
    rate = 1
    writes = 0
    get playbackRate() {
      return this.rate
    }
    set playbackRate(value: number) {
      this.rate = value
      this.writes++
    }
  }
  let animations: FakeAnimation[]
  const born = () => {
    const animation = new FakeAnimation()
    animations.push(animation)
    return animation
  }
  // Una animación CSS nueva en una capa: el navegador avisa con `animationstart`, que sube.
  const startAnimation = (host: HTMLElement) => {
    born()
    const layer = host.firstElementChild ?? host
    act(() => {
      layer.dispatchEvent(new Event('animationstart', { bubbles: true }))
    })
  }

  beforeEach(() => {
    animations = []
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value: () => animations,
    })
  })
  afterEach(() => {
    delete (Element.prototype as { getAnimations?: unknown }).getAnimations
  })

  describe.each([STILL_HERE, I_SEE_YOU])('$kind', (spec) => {
    it('las capas que nacen después de montar siguen la velocidad de sesión', async () => {
      setSessionRate(spec.kind, 2)
      render(<Scene spec={spec} ambient={ambient} />)
      await flush()

      startAnimation(hostOf())
      startAnimation(hostOf())

      // También las que ya existían: la velocidad es común a todas.
      expect(animations.map((animation) => animation.rate)).toEqual([2, 2])
    })

    it('un cambio de velocidad en vivo llega a las capas que ya corren, sin esperar a un evento', async () => {
      render(<Scene spec={spec} ambient={ambient} />)
      await flush()
      startAnimation(hostOf())
      expect(animations[0].rate).toBe(1)

      act(() => setSessionRate(spec.kind, 0.5))
      expect(animations[0].rate).toBe(0.5)

      // Y la capa que nace después también.
      startAnimation(hostOf())
      expect(animations.map((animation) => animation.rate)).toEqual([0.5, 0.5])
    })

    // Una capa con retardo (los Zzz de are-u-still-here) no avisa con `animationstart` hasta
    // que vence: sin esto nacería a 1× y avanzaría así todo su retardo.
    it('las capas nacen ya a la velocidad común, al cambiar de estado o de capas, sin esperar a animationstart', async () => {
      setSessionRate(spec.kind, 4)
      render(<Scene spec={spec} ambient={ambient} />)
      await flush()

      born()
      await act(async () => {
        hostOf().setAttribute('data-state-change', 'x')
        await Promise.resolve()
      })
      expect(animations[0].rate).toBe(4)

      born()
      await act(async () => {
        hostOf().append(document.createElement('span'))
        await Promise.resolve()
      })
      expect(animations.map((animation) => animation.rate)).toEqual([4, 4])
    })

    it('desmontar, o cambiar de velocidad, desconecta el observador de capas', async () => {
      const observe = vi.spyOn(MutationObserver.prototype, 'observe')
      const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
      setSessionRate(spec.kind, 2)
      const { unmount } = render(<Scene spec={spec} ambient={ambient} />)
      await flush()
      act(() => setSessionRate(spec.kind, 3))
      act(() => setSessionRate(spec.kind, 1))
      const observedByAdapter = observe.mock.calls.filter(
        ([target]) => target === hostOf(),
      ).length
      expect(observedByAdapter).toBeGreaterThan(0)
      unmount()

      expect(disconnect.mock.calls.length).toBeGreaterThanOrEqual(
        observe.mock.calls.length,
      )
      observe.mockRestore()
      disconnect.mockRestore()
    })

    it('al volver a 1× las capas vuelven a su velocidad original', async () => {
      setSessionRate(spec.kind, 3)
      render(<Scene spec={spec} ambient={ambient} />)
      await flush()
      startAnimation(hostOf())
      expect(animations[0].rate).toBe(3)

      act(() => setSessionRate(spec.kind, 1))
      expect(animations[0].rate).toBe(1)
      // Ya a 1×, lo que nace no se toca.
      startAnimation(hostOf())
      expect(animations[1].writes).toBe(0)
    })

    it('desmontar, con la velocidad cambiada, no deja ni una escucha (VT3)', async () => {
      const { rerender, unmount } = render(
        <Scene spec={spec} ambient={ambient} calm={false} />,
      )
      await flush()
      const baseline = probe.snapshot()

      setSessionRate(spec.kind, 2)
      rerender(<Scene spec={spec} ambient={ambient} />)
      await flush()
      act(() => setSessionRate(spec.kind, 4))
      act(() => setSessionRate(spec.kind, 0.5))
      expect(probe.snapshot()).not.toEqual(baseline)

      unmount()
      expect(probe.snapshot()).toEqual(baseline)
    })

    it('tras desmontar ya no toca ninguna animación', async () => {
      setSessionRate(spec.kind, 2)
      const { unmount } = render(<Scene spec={spec} ambient={ambient} />)
      await flush()
      const host = hostOf()
      unmount()

      startAnimation(host)
      act(() => setSessionRate(spec.kind, 4))
      expect(animations.every((animation) => animation.writes === 0)).toBe(true)
    })
  })

  it('poking a su velocidad original no toca ninguna animación, ni al nacer ni al cambiar de estado', async () => {
    render(<Scene spec={POKING} ambient={ambient} />)
    await flush()

    startAnimation(hostOf())
    startAnimation(hostOf())
    act(() => {
      fireEvent.pointerDown(hostOf())
    })
    startAnimation(hostOf())

    expect(animations.length).toBe(3)
    expect(animations.every((animation) => animation.writes === 0)).toBe(true)
    // Sin velocidad distinta de 1× no hay ni una escucha de más.
    expect(probe.snapshot().listeners.join()).not.toContain('animationstart')
  })
})
