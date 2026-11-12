import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { StrictMode } from 'react'
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
import { resetSpriteLoader } from '../../components/sofi/SofiSprite/loadSprite'
import { clearSessionRates } from '../../components/sofi/visual/rates'
import {
  SOFI_REGISTRY,
  type SofiOwnerModule,
} from '../../components/sofi/visual/registry'
import {
  SOFI_ANIMATION_IDS,
  type SofiAnimationId,
} from '../../components/sofi/visual/types'
import { installLeakProbe, type LeakProbe } from '../../test/leakProbe'
import { BADGE_CROP, IDLE_DEFAULT_MS } from '../gagBadge'
import { GagsSpec } from './GagsSpec'

// T066, prototipo de la consulta móvil: la insignia actual (A1) con los tres gags reales sobre un
// único anfitrión. Solo se simulan los módulos dueños y la decodificación; los controladores son
// los del ZIP, a través del adaptador de producción.

class FakeImage {
  src = ''
  crossOrigin: string | null = null
  decode() {
    return Promise.resolve()
  }
}

const flush = () =>
  act(async () => {
    await vi.dynamicImportSettled()
    for (let turn = 0; turn < 10; turn++) await Promise.resolve()
  })

const originalLoads = new Map<SofiAnimationId, unknown>()
let probe: LeakProbe

beforeAll(async () => {
  await Promise.all([
    import('../../styles/sprites/poking.js'),
    import('../../styles/sprites/are-u-still-here.js'),
    import('../../styles/sprites/i-see-you.js'),
  ])
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('Image', FakeImage)
  for (const id of SOFI_ANIMATION_IDS) {
    if (id === 'eureka' || id === 'suspicious' || !SOFI_REGISTRY[id].load)
      continue
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
  clearSessionRates()
  vi.unstubAllGlobals()
})

async function open(motion: MotionPreference = 'full', strict = false) {
  const tree = (
    <MotionPreferenceProvider value={motion}>
      <GagsSpec />
    </MotionPreferenceProvider>
  )
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree)
  await flush()
  return view
}

const section = () => document.getElementById('m-gags') as HTMLElement
const ui = () => within(section())
const live = () => section().querySelector('[data-strip="live"]') as HTMLElement
const host = () => live().querySelector('[data-poking]') as HTMLElement
const readout = (term: string) =>
  ui().getByText(term, { exact: true }).nextElementSibling?.textContent
const gagLog = () =>
  within(ui().getByRole('list', { name: 'Registro de los gags' }))
    .queryAllByRole('listitem')
    // Cada línea lleva su número delante, en otro elemento.
    .map((item) => (item.textContent ?? '').replace(/^\d+/, ''))
const toggle = async (label: string) => {
  fireEvent.click(ui().getByLabelText(label))
  await flush()
}
const idleRange = () =>
  ui().getByLabelText('Inactividad de are-u-still-here') as HTMLInputElement

describe('la insignia de la consulta móvil con los tres gags', () => {
  it('un único anfitrión lleva los tres controladores, cada uno con sus capas', async () => {
    await open()
    expect(section().querySelectorAll('[data-poking]')).toHaveLength(1)
    const element = host()
    expect(element).toHaveAttribute('data-still-here', 'idle')
    expect(element).toHaveAttribute('data-i-see-you', 'idle')
    for (const gag of ['poking', 'are-u-still-here', 'i-see-you'])
      expect(element).toHaveClass(`${gag}-owner`)
    expect(element.querySelectorAll('[data-poking-layer]').length).toBe(8)
    expect(element.querySelectorAll('[data-still-here-layer]').length).toBe(8)
    expect(element.querySelectorAll('[data-i-see-you-layer]').length).toBe(3)
  })

  it('es la insignia actual: mismo recuadro y mismo sprite que en producción', async () => {
    await open()
    const crop = host().parentElement as HTMLElement
    expect(crop.style.width).toBe(`${BADGE_CROP.width}px`)
    expect(crop.style.height).toBe(`${BADGE_CROP.height}px`)
    expect(host().style.marginTop).toBe(`${-BADGE_CROP.offsetY}px`)
    expect(host().style.marginLeft).toBe(`${-BADGE_CROP.offsetX}px`)
  })

  it('es decorativa: oculta a los lectores de pantalla, sin foco y sin teclado', async () => {
    await open()
    expect(host()).toHaveAttribute('aria-hidden', 'true')
    expect(host()).not.toHaveAttribute('tabindex')
    expect(host()).not.toHaveAttribute('role')
    expect(
      live().querySelectorAll('button, a, input, [tabindex]'),
    ).toHaveLength(0)
    // «poking» no se activa con el teclado (spec §5): solo escucha el clic.
    fireEvent.keyDown(host(), { key: 'Enter' })
    fireEvent.keyDown(host(), { key: ' ' })
    expect(host()).toHaveAttribute('data-poking', 'idle')
  })

  it('un toque con el dedo sobre Sofi activa poking y deja a los otros dos en pausa', async () => {
    await open()
    fireEvent.pointerEnter(host(), { pointerType: 'touch' })
    fireEvent.pointerDown(host(), { pointerType: 'touch' })
    fireEvent.pointerUp(host(), { pointerType: 'touch' })
    fireEvent.pointerLeave(host(), { pointerType: 'touch' })
    fireEvent.click(host())
    await flush()
    expect(host()).toHaveAttribute('data-poking', 'curious')
    expect(readout('Gag activo')).toBe('poking')
    const log = gagLog().join(' | ')
    expect(log).toMatch(/are-u-still-here en pausa/)
    expect(log).toMatch(/i-see-you en pausa/)
  })

  // Versión reducida (aprobada, plan §6; `useReducedGag`): los tres gags siguen, en su versión
  // reducida, sobre la misma insignia.
  it('con movimiento reducido, los tres gags en su versión reducida sobre la misma insignia', async () => {
    await open('reduce')
    expect(section().querySelectorAll('[data-poking]')).toHaveLength(1)
    expect(host()).toHaveAttribute('data-still-here', 'idle')
    expect(host()).toHaveAttribute('data-i-see-you', 'idle')
    for (const gag of ['poking', 'are-u-still-here', 'i-see-you'])
      expect(host()).toHaveClass(`${gag}-owner`)
    expect(readout('Movimiento')).toMatch(/reducido/i)
    // El rótulo de la tira dice lo que se ve, no «gags vivos».
    expect(
      ui().getByText('Movimiento reducido · gags reducidos'),
    ).toBeInTheDocument()
    expect(ui().queryByText('Completo · gags vivos')).toBeNull()
    // Pistas de la versión reducida.
    expect(
      ui().getByText(/Deja el puntero quieto sobre Sofi/),
    ).toBeInTheDocument()
  })

  it('con movimiento reducido, poking cambia de pose con cada toque y se queda en ofendida', async () => {
    await open('reduce')
    const states = []
    for (let tap = 0; tap < 6; tap++) {
      fireEvent.click(host())
      await flush()
      states.push(host().getAttribute('data-poking'))
      act(() => void vi.advanceTimersByTime(400))
    }
    expect(states).toEqual([
      'curious',
      'skeptical',
      'stop',
      'offended',
      'offended',
      'offended',
    ])
    expect(readout('Gag activo')).toBe('poking')
  })

  it('con movimiento completo avisa de que los gags están activos', async () => {
    await open('full')
    expect(readout('Movimiento')).toMatch(/completo/i)
    expect(ui().getByText('Completo · gags vivos')).toBeInTheDocument()
  })
})

describe('la versión reducida', () => {
  it('ya no hay una tira fija aparte: la versión reducida es la insignia viva', async () => {
    await open('full')
    expect(section().querySelectorAll('[data-strip]')).toHaveLength(1)
  })

  it('dice que la versión reducida y la ubicación están aprobadas, sin nada pendiente de AV4', async () => {
    await open()
    expect(section()).toHaveTextContent(
      'Movimiento reducido (aprobado el 2026-11-12)',
    )
    expect(section()).toHaveTextContent(/no se esconde/)
    expect(section()).toHaveTextContent(/no sigue al puntero/)
    expect(section()).toHaveTextContent(/sin cabezadas/)
    expect(section()).toHaveTextContent(/a los 5 s sin toques/)
    expect(section()).not.toHaveTextContent(/en prueba/)
    expect(section()).not.toHaveTextContent(/AV4/)
    expect(section()).toHaveTextContent(/producción en T088/)
    // La mirada por toda la página es solo del modo completo.
    expect(section()).toHaveTextContent(
      /Con movimiento completo, la mirada de i-see-you sigue al puntero/,
    )
    expect(section()).toHaveTextContent(/con reducido, no hay mirada/)
    expect(section()).toHaveTextContent(
      /ubicación y la inactividad están aprobadas \(AV6/,
    )
    expect(section()).toHaveTextContent(/«Reducido» en Movimiento/)
  })
})

// Defecto del adaptador corregido (008-verification §25.5, decisión 1). Los controladores documentan
// el patrón `quiet`: cuando uno sale del reposo, los demás hacen `reset()` y `pause()`. El
// adaptador solo hacía `pause()`, y un `i-see-you` que mira se quedaba con su cara pintada mientras
// `poking` actuaba (en `hide`, dos ojos flotando en el hueco). Solo pasa con los gags sobre el mismo
// anfitrión, que es como van en producción. Aquí con la sección del Lab; la prueba de los tres
// controladores reales sin Lab está en `useSofiController.test.tsx`.
describe('convivencia de i-see-you y poking sobre el mismo anfitrión', () => {
  // jsdom no mide nada: `i-see-you` descarta el puntero si la caja del sprite no tiene ancho.
  const sizeHost = () => {
    host().getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 128,
        bottom: 128,
        width: 128,
        height: 128,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect
  }
  const lookAtSofi = () => {
    act(() => {
      document.dispatchEvent(
        new MouseEvent('pointermove', {
          clientX: 100,
          clientY: 64,
          movementX: 5,
          movementY: 0,
        }),
      )
      // El fotograma que mide la caja y los 90 ms de retraso de la mirada.
      vi.advanceTimersByTime(200)
    })
  }
  const tapSofi = async () => {
    fireEvent.click(host())
    await flush()
  }

  it('precondición: se puede llegar a «mirando» y a «poking activo» a la vez', async () => {
    await open()
    sizeHost()
    lookAtSofi()
    expect(host()).toHaveAttribute('data-i-see-you', 'watching')
    await tapSofi()
    expect(host()).toHaveAttribute('data-poking', 'curious')
    expect(readout('Gag activo')).toBe('poking')
  })

  it('cuando poking sale del reposo, i-see-you vuelve al suyo y no deja su cara pintada', async () => {
    await open()
    sizeHost()
    lookAtSofi()
    await tapSofi()
    expect(host()).toHaveAttribute('data-poking', 'curious')
    expect(host()).toHaveAttribute('data-i-see-you', 'idle')
  })
})

describe('zona sensible', () => {
  it('«Mostrar la zona sensible» tiñe solo la insignia viva, y no cambia nada más', async () => {
    await open()
    const before = live().innerHTML
    expect(live().className).not.toMatch(/showHit/)

    await toggle('Mostrar la zona sensible')
    expect(live().className).toMatch(/showHit/)
    // El DOM de la insignia es el mismo: el tinte es solo CSS.
    expect(live().innerHTML).toBe(before)

    await toggle('Mostrar la zona sensible')
    expect(live().className).not.toMatch(/showHit/)
  })

  it('dice qué responde y qué no', async () => {
    await open()
    expect(section()).toHaveTextContent(
      /solo responden al toque sobre las partes visibles/i,
    )
    expect(section()).toHaveTextContent(/lo transparente no responde/i)
  })
})

describe('gags activos', () => {
  it('desmarcar uno lo desmonta del todo y deja los otros dos', async () => {
    await open()
    await toggle('poking')
    expect(host()).toBeNull()
    expect(live().querySelectorAll('[data-poking-layer]')).toHaveLength(0)
    expect(live().querySelectorAll('[data-still-here]')).toHaveLength(1)
    expect(live().querySelectorAll('[data-i-see-you]')).toHaveLength(1)

    await toggle('poking')
    expect(host()).not.toBeNull()
  })
})

describe('inactividad ajustable de are-u-still-here', () => {
  it('parte del valor aprobado del plan y lo muestra', async () => {
    await open()
    expect(Number(idleRange().value)).toBe(IDLE_DEFAULT_MS)
    expect(readout('Inactividad')).toMatch(/2 min 30 s/)
    expect(section()).toHaveTextContent(/el aprobado \(plan §6\)/i)
    expect(section()).toHaveTextContent(/2 y 3 minutos|2[–-]3 min/)
  })

  it('con el valor de partida no se duerme antes de 150 s', async () => {
    await open()
    const element = host()
    act(() => vi.advanceTimersByTime(IDLE_DEFAULT_MS - 1_000))
    expect(element).toHaveAttribute('data-still-here', 'idle')
    act(() => vi.advanceTimersByTime(2_000))
    expect(element).toHaveAttribute('data-still-here', 'drowsy')
  })

  it('al cambiarla en vivo vuelve a contar desde cero con el valor nuevo', async () => {
    await open()
    act(() => vi.advanceTimersByTime(60_000))
    fireEvent.change(idleRange(), { target: { value: '5000' } })
    await flush()
    expect(readout('Inactividad')).toMatch(/^5 s/)
    const element = host()
    expect(element).toHaveAttribute('data-still-here', 'idle')
    act(() => vi.advanceTimersByTime(4_000))
    expect(element).toHaveAttribute('data-still-here', 'idle')
    act(() => vi.advanceTimersByTime(2_000))
    expect(element).toHaveAttribute('data-still-here', 'drowsy')
  })

  it('distingue lo que cabe en la horquilla de la spec de una simple demostración', async () => {
    await open()
    expect(readout('Inactividad')).toMatch(/horquilla de la spec/i)
    fireEvent.change(idleRange(), { target: { value: '5000' } })
    await flush()
    expect(readout('Inactividad')).toMatch(/solo demostraci[oó]n/i)
  })

  it('con actividad antes de dormirse vuelve al reposo', async () => {
    await open()
    fireEvent.change(idleRange(), { target: { value: '5000' } })
    await flush()
    act(() => vi.advanceTimersByTime(5_500))
    expect(host()).toHaveAttribute('data-still-here', 'drowsy')
    act(() => {
      document.dispatchEvent(new Event('keydown'))
    })
    expect(host()).toHaveAttribute('data-still-here', 'idle')
  })
})

describe('causas de pausa', () => {
  it('se agregan: dos causas, una sola pausa por gag y una sola reanudación', async () => {
    await open()
    await toggle('Pestaña oculta')
    await toggle('Escritura o controles')
    for (const gag of ['poking', 'i-see-you', 'are-u-still-here'])
      expect(
        gagLog().filter((line) => line === `${gag} en pausa`),
      ).toHaveLength(1)

    await toggle('Pestaña oculta')
    expect(gagLog().filter((line) => /reanuda/.test(line))).toHaveLength(0)
    await toggle('Escritura o controles')
    expect(gagLog().filter((line) => /reanuda/.test(line))).toHaveLength(3)
  })
})

describe.each([false, true])('al desmontar (StrictMode: %s)', (strict) => {
  it('no quedan escuchas, observadores, temporizadores, fotogramas, capas ni atributos', async () => {
    const view = await open('full', strict)
    // La línea base incluye lo que React deja en su contenedor.
    for (const gag of ['poking', 'i-see-you', 'are-u-still-here'])
      await toggle(gag)
    const baseline = probe.snapshot()
    expect(host()).toBeNull()

    for (const gag of ['poking', 'i-see-you', 'are-u-still-here'])
      await toggle(gag)
    const element = host()
    expect(element).not.toBeNull()
    expect(probe.snapshot()).not.toEqual(baseline)

    view.unmount()
    act(() => vi.runOnlyPendingTimers())

    expect(probe.snapshot()).toEqual(baseline)
    expect(
      element.querySelectorAll(
        '[data-poking-layer],[data-still-here-layer],[data-i-see-you-layer]',
      ),
    ).toHaveLength(0)
    for (const attribute of [
      'data-poking',
      'data-still-here',
      'data-i-see-you',
      'data-i-see-you-gaze',
    ])
      expect(element).not.toHaveAttribute(attribute)
  })
})
