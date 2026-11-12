import { act, cleanup, fireEvent, render } from '@testing-library/react'
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
} from '../app/providers/MotionPreference'
import { resetSpriteLoader } from '../components/sofi/SofiSprite/loadSprite'
import { className as blinkClass } from '../components/sofi/sprites/sofi-blink'
import {
  createAmbient,
  type Ambient,
  type GagId,
} from '../components/sofi/visual/ambient'
import {
  SOFI_REGISTRY,
  type SofiOwnerModule,
} from '../components/sofi/visual/registry'
import { installLeakProbe, type LeakProbe } from '../test/leakProbe'
import { cx } from '../utils/cx'
import { useReducedGag } from './useReducedGag'

// Versión reducida de los gags (T066, aprobada el 2026-11-12: plan §6), con las máquinas de estados reales de los
// ZIP. Solo se simulan los módulos dueños y la decodificación de las tiras.

class FakeImage {
  src = ''
  crossOrigin: string | null = null
  decode() {
    return Promise.resolve()
  }
}

const GAGS: GagId[] = ['poking', 'i-see-you', 'are-u-still-here']
const originalLoads = new Map<GagId, unknown>()
let probe: LeakProbe

const flush = () =>
  act(async () => {
    await vi.dynamicImportSettled()
    for (let turn = 0; turn < 10; turn++) await Promise.resolve()
  })
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

beforeAll(async () => {
  await Promise.all([
    import('../styles/sprites/poking.js'),
    import('../styles/sprites/are-u-still-here.js'),
    import('../styles/sprites/i-see-you.js'),
  ])
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('Image', FakeImage)
  for (const id of GAGS) {
    originalLoads.set(id, SOFI_REGISTRY[id].load)
    SOFI_REGISTRY[id].load = () =>
      Promise.resolve<SofiOwnerModule>({
        className: `${id}-owner`,
        strips: { [`/src/styles/sprites/${id}.webp`]: `/assets/${id}.webp` },
      })
  }
  probe = installLeakProbe()
})

afterEach(() => {
  cleanup()
  probe.uninstall()
  vi.useRealTimers()
  for (const [id, load] of originalLoads)
    SOFI_REGISTRY[id].load = load as (typeof SOFI_REGISTRY)[typeof id]['load']
  originalLoads.clear()
  resetSpriteLoader()
  vi.unstubAllGlobals()
})

function Probe({
  kind,
  ambient,
  idleAfter,
}: {
  kind: GagId
  ambient: Ambient
  idleAfter?: number
}) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const className = useReducedGag(kind, host, {
    ambient,
    calm: true,
    idleAfter,
  })
  return (
    <span
      ref={setHost}
      data-testid="host"
      aria-hidden="true"
      className={cx(blinkClass, className)}
    />
  )
}

async function open(
  kind: GagId,
  {
    motion = 'reduce',
    idleAfter,
    strict = false,
  }: { motion?: MotionPreference; idleAfter?: number; strict?: boolean } = {},
) {
  const ambient = createAmbient()
  const tree = (value: MotionPreference) => (
    <MotionPreferenceProvider value={value}>
      <Probe kind={kind} ambient={ambient} idleAfter={idleAfter} />
    </MotionPreferenceProvider>
  )
  const view = render(
    strict ? <StrictMode>{tree(motion)}</StrictMode> : tree(motion),
  )
  await flush()
  const host = view.getByTestId('host')
  const switchTo = async (value: MotionPreference) => {
    view.rerender(strict ? <StrictMode>{tree(value)}</StrictMode> : tree(value))
    await flush()
  }
  return { view, host, ambient, switchTo }
}

// Lo que el anfitrión enseña en cada momento de `ms`, muestreado cada 100 ms.
async function shownDuring(host: HTMLElement, attribute: string, ms: number) {
  const seen = new Set<string | null>()
  for (let t = 0; t < ms; t += 100) {
    await advance(100)
    seen.add(host.getAttribute(attribute))
  }
  return seen
}

describe('poking reducido', () => {
  it('cada toque sube un escalón de pie, con su pose fija, y se queda en «ofendida»', async () => {
    const { host } = await open('poking')
    expect(host).toHaveClass('poking-owner')
    expect(host).toHaveAttribute('data-poking', 'idle')
    expect(host.querySelectorAll('[data-poking-layer]')).toHaveLength(8)

    const states = []
    for (let tap = 0; tap < 8; tap++) {
      fireEvent.click(host)
      states.push(host.getAttribute('data-poking'))
      await advance(400)
    }
    expect(states).toEqual([
      'curious',
      'skeptical',
      'stop',
      'offended',
      'offended',
      'offended',
      'offended',
      'offended',
    ])
  })

  // Prueba de la autora (2026-11-12): 5 s sin toques hasta el reposo, frente a los 10 s del
  // controlador (los de movimiento completo).
  it('sin más toques vuelve al reposo a los 5 s, no a los 10 del modo completo', async () => {
    const { host } = await open('poking')
    fireEvent.click(host)
    expect(host).toHaveAttribute('data-poking', 'curious')
    await advance(4999)
    expect(host).toHaveAttribute('data-poking', 'curious')
    await advance(1)
    expect(host).toHaveAttribute('data-poking', 'idle')
  })

  it('cada una de las cuatro reacciones vuelve al reposo a los 5 s', async () => {
    for (const [taps, state] of [
      [1, 'curious'],
      [2, 'skeptical'],
      [3, 'stop'],
      [4, 'offended'],
    ] as const) {
      const { host, view } = await open('poking')
      for (let tap = 0; tap < taps; tap++) {
        fireEvent.click(host)
        if (tap < taps - 1) await advance(400)
      }
      expect(host).toHaveAttribute('data-poking', state)
      await advance(4999)
      expect(host).toHaveAttribute('data-poking', state)
      await advance(1)
      expect(host).toHaveAttribute('data-poking', 'idle')
      view.unmount()
    }
  })

  it('un toque que cuenta vuelve a empezar los 5 s', async () => {
    const { host } = await open('poking')
    fireEvent.click(host)
    await advance(4000)
    fireEvent.click(host)
    expect(host).toHaveAttribute('data-poking', 'skeptical')
    await advance(4999)
    expect(host).toHaveAttribute('data-poking', 'skeptical')
    await advance(1)
    expect(host).toHaveAttribute('data-poking', 'idle')
  })

  it('en «ofendida» los toques no cuentan ni alargan la espera', async () => {
    const { host } = await open('poking')
    for (let tap = 0; tap < 4; tap++) {
      fireEvent.click(host)
      await advance(400)
    }
    // «ofendida» empezó hace 400 ms.
    await advance(3000)
    fireEvent.click(host)
    fireEvent.click(host)
    expect(host).toHaveAttribute('data-poking', 'offended')
    await advance(1599)
    expect(host).toHaveAttribute('data-poking', 'offended')
    await advance(1)
    expect(host).toHaveAttribute('data-poking', 'idle')
  })

  it('tras el reposo, otro toque empieza otra serie', async () => {
    const { host } = await open('poking')
    fireEvent.click(host)
    await advance(5000)
    fireEvent.click(host)
    expect(host).toHaveAttribute('data-poking', 'curious')
  })

  it('una causa de pausa congela la espera y, al quitarla, sigue lo que faltaba', async () => {
    const { host, ambient } = await open('poking')
    fireEvent.click(host)
    await advance(2000)
    act(() => ambient.setCause('busy', true))
    await advance(20_000)
    expect(host).toHaveAttribute('data-poking', 'curious')
    // Y no cuenta toques mientras dura.
    fireEvent.click(host)
    expect(host).toHaveAttribute('data-poking', 'curious')
    act(() => ambient.setCause('busy', false))
    await advance(2999)
    expect(host).toHaveAttribute('data-poking', 'curious')
    await advance(1)
    expect(host).toHaveAttribute('data-poking', 'idle')
  })

  it('no responde al teclado', async () => {
    const { host } = await open('poking')
    fireEvent.keyDown(host, { key: 'Enter' })
    fireEvent.keyDown(host, { key: ' ' })
    expect(host).toHaveAttribute('data-poking', 'idle')
  })

  it('mientras reacciona es el gag activo de la escena', async () => {
    const { host, ambient } = await open('poking')
    const activate = vi.spyOn(ambient, 'activate')
    const deactivate = vi.spyOn(ambient, 'deactivate')
    fireEvent.click(host)
    expect(activate).toHaveBeenCalledWith('poking')
    await advance(10_000)
    expect(deactivate).toHaveBeenCalledWith('poking')
  })
})

describe('i-see-you reducido', () => {
  it('no sigue al puntero: moverlo por la página no cambia nada', async () => {
    const { host } = await open('i-see-you')
    for (const [x, y] of [
      [0, 0],
      [800, 10],
      [10, 600],
      [400, 300],
    ]) {
      fireEvent.pointerMove(document, { clientX: x, clientY: y })
      await advance(200)
    }
    expect(host).toHaveAttribute('data-i-see-you', 'idle')
    expect(host).toHaveAttribute('data-i-see-you-gaze', 'center')
  })

  it('no escucha en la página: solo en su anfitrión', async () => {
    // Referencia: ya renderizado, con movimiento completo (aquí no monta nada).
    const { switchTo } = await open('i-see-you', { motion: 'full' })
    const before = probe.snapshot().listeners
    await switchTo('reduce')
    const added = probe
      .snapshot()
      .listeners.filter((listener) => !before.includes(listener))
    expect(added.filter((listener) => !listener.startsWith('span:'))).toEqual(
      // La visibilidad de la pestaña, como cualquier controlador.
      ['document:visibilitychange'],
    )
    expect(added).toEqual(
      expect.arrayContaining(['span:pointerenter', 'span:pointerleave']),
    )
  })

  it('con el puntero (o el dedo) quieto encima, la pillan y sonríe; luego, reposo', async () => {
    const { host } = await open('i-see-you')
    fireEvent.pointerEnter(host)
    await advance(1200)
    expect(host).toHaveAttribute('data-i-see-you', 'caught')
    const seen = await shownDuring(host, 'data-i-see-you', 5400)
    expect([...seen].sort()).toEqual(['caught', 'idle', 'smirk'])
    expect(host).toHaveAttribute('data-i-see-you', 'idle')
  })

  it('la secuencia dura 5,3 s: pillada 1,1 s y sonrisa 4,2 s', async () => {
    const { host } = await open('i-see-you')
    fireEvent.pointerEnter(host)
    await advance(1200)
    expect(host).toHaveAttribute('data-i-see-you', 'caught')
    await advance(1099)
    expect(host).toHaveAttribute('data-i-see-you', 'caught')
    await advance(1)
    expect(host).toHaveAttribute('data-i-see-you', 'smirk')
    await advance(4199)
    expect(host).toHaveAttribute('data-i-see-you', 'smirk')
    await advance(1)
    expect(host).toHaveAttribute('data-i-see-you', 'idle')
  })

  it('irse durante la reacción no la corta, y luego hay 15 s sin dejarse pillar', async () => {
    const { host } = await open('i-see-you')
    fireEvent.pointerEnter(host)
    await advance(1200)
    fireEvent.pointerLeave(host)
    await advance(5300)
    expect(host).toHaveAttribute('data-i-see-you', 'idle')
    // A los 5 s del final, otra vez encima: nada (el reposo del controlador, 15 s).
    await advance(5000)
    fireEvent.pointerEnter(host)
    await advance(1200)
    expect(host).toHaveAttribute('data-i-see-you', 'idle')
    fireEvent.pointerLeave(host)
    // Pasados los 15 s, sí.
    await advance(10_000)
    fireEvent.pointerEnter(host)
    await advance(1200)
    expect(host).toHaveAttribute('data-i-see-you', 'caught')
  })

  it('si el puntero se va antes, no pasa nada', async () => {
    const { host } = await open('i-see-you')
    fireEvent.pointerEnter(host)
    await advance(600)
    fireEvent.pointerLeave(host)
    await advance(2000)
    expect(host).toHaveAttribute('data-i-see-you', 'idle')
  })
})

describe('are-u-still-here reducido', () => {
  it('se adormece quieta y se duerme, sin cabezadas', async () => {
    const { host } = await open('are-u-still-here', { idleAfter: 5000 })
    await advance(5000)
    expect(host).toHaveAttribute('data-still-here', 'drowsy')
    const seen = await shownDuring(host, 'data-still-here', 9500)
    expect([...seen].sort()).toEqual(['asleep', 'drowsy'])
    expect(host).toHaveAttribute('data-still-here', 'asleep')
  })

  it('al volver, cara de pillada sin susto, y reposo', async () => {
    const { host } = await open('are-u-still-here', { idleAfter: 5000 })
    await advance(15_000)
    expect(host).toHaveAttribute('data-still-here', 'asleep')
    fireEvent.keyDown(document, { key: 'a' })
    expect(host).toHaveAttribute('data-still-here', 'guilty')
    const seen = await shownDuring(host, 'data-still-here', 3200)
    expect([...seen].sort()).toEqual(['guilty', 'idle'])
    expect(host).toHaveAttribute('data-still-here', 'idle')
  })

  it('la reacción al despertar dura 3,1 s, más actividad no la alarga, y la cuenta vuelve a empezar', async () => {
    const { host } = await open('are-u-still-here', { idleAfter: 5000 })
    await advance(15_000)
    fireEvent.keyDown(document, { key: 'a' })
    expect(host).toHaveAttribute('data-still-here', 'guilty')
    await advance(2000)
    fireEvent.keyDown(document, { key: 'b' })
    await advance(1099)
    expect(host).toHaveAttribute('data-still-here', 'guilty')
    await advance(1)
    expect(host).toHaveAttribute('data-still-here', 'idle')
    // Desde el reposo, otra vez el umbral entero.
    await advance(4999)
    expect(host).toHaveAttribute('data-still-here', 'idle')
    await advance(1)
    expect(host).toHaveAttribute('data-still-here', 'drowsy')
  })

  it('con actividad antes de dormirse, vuelve al reposo sin cara de pillada', async () => {
    const { host } = await open('are-u-still-here', { idleAfter: 5000 })
    await advance(6000)
    expect(host).toHaveAttribute('data-still-here', 'drowsy')
    fireEvent.keyDown(document, { key: 'a' })
    expect(host).toHaveAttribute('data-still-here', 'idle')
  })

  it('sin el valor del Lab usa el umbral aprobado (150 000 ms)', async () => {
    const { host } = await open('are-u-still-here')
    await advance(149_999)
    expect(host).toHaveAttribute('data-still-here', 'idle')
    await advance(1)
    expect(host).toHaveAttribute('data-still-here', 'drowsy')
  })
})

describe('solo con movimiento reducido, y limpio al irse', () => {
  it.each(GAGS)(
    '%s: con movimiento completo no hace nada (manda el adaptador de producción)',
    async (kind) => {
      const { host } = await open(kind, { motion: 'full' })
      expect(host.className).not.toMatch(/owner/)
      expect(host.children).toHaveLength(0)
      expect(
        [...host.attributes].filter(
          (a) => a.name.startsWith('data-') && a.name !== 'data-testid',
        ),
      ).toHaveLength(0)
    },
  )

  it.each(GAGS)(
    '%s: al pasar a completo en mitad de la reacción, se va del todo',
    async (kind) => {
      const { host, switchTo } = await open(kind, { idleAfter: 5000 })
      if (kind === 'poking') fireEvent.click(host)
      if (kind === 'i-see-you') {
        fireEvent.pointerEnter(host)
        await advance(1200)
      }
      if (kind === 'are-u-still-here') await advance(15_000)
      await switchTo('full')
      expect(host.className).not.toMatch(/owner/)
      expect(host.children).toHaveLength(0)
      expect(host).not.toHaveAttribute('data-poking')
      expect(host).not.toHaveAttribute('data-i-see-you')
      expect(host).not.toHaveAttribute('data-still-here')
    },
  )

  it.each(GAGS)(
    '%s: al irse, también con StrictMode, no quedan escuchas, temporizadores ni observadores',
    async (kind) => {
      // Referencia: ya renderizado, con movimiento completo (aquí no monta nada).
      const { host, switchTo } = await open(kind, {
        motion: 'full',
        strict: true,
        idleAfter: 5000,
      })
      const baseline = probe.snapshot()
      await switchTo('reduce')
      expect(probe.snapshot().listeners.length).toBeGreaterThan(
        baseline.listeners.length,
      )
      fireEvent.click(host)
      fireEvent.pointerEnter(host)
      await advance(1200)
      await switchTo('full')
      expect(probe.snapshot()).toEqual(baseline)
    },
  )
})
