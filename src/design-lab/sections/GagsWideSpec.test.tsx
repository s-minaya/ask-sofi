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
import { IDLE_DEFAULT_MS } from '../gagBadge'
import { WIDE_SPRITE } from '../gagWide'
import { GagsWideSpec } from './GagsWideSpec'

// T066, prototipo de la consulta a dos columnas: los tres gags reales sobre el retrato grande que ya
// existe (el `SofiPortrait` de 384 px de `ConsultationScreen`). Solo se simulan los módulos dueños y
// la decodificación; los controladores son los del ZIP, a través del adaptador de producción.

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
      <GagsWideSpec />
    </MotionPreferenceProvider>
  )
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree)
  await flush()
  return view
}

const section = () => document.getElementById('m-gags-wide') as HTMLElement
const ui = () => within(section())
const column = () =>
  section().querySelector('[data-strip="wide"]') as HTMLElement
const host = () => column().querySelector('[data-poking]') as HTMLElement
const readout = (term: string) =>
  ui().getByText(term, { exact: true }).nextElementSibling?.textContent
const gagLog = () =>
  within(ui().getByRole('list', { name: 'Registro de los gags' }))
    .queryAllByRole('listitem')
    .map((item) => (item.textContent ?? '').replace(/^\d+/, ''))
const toggle = async (label: string) => {
  fireEvent.click(ui().getByLabelText(label))
  await flush()
}

describe('el retrato grande de la consulta ancha con los tres gags', () => {
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

  it('no hay otra Sofi: el anfitrión es el sprite del propio SofiPortrait de 384 px', async () => {
    await open()
    // Una sola imagen de Sofi en la columna, con la descripción que le da `ConsultationScreen`.
    const images = column().querySelectorAll('[role="img"]')
    expect(images).toHaveLength(1)
    expect(images[0]).toBe(host())
    expect(host()).toHaveAttribute(
      'aria-label',
      'Sofi, atenta a lo que le cuentas',
    )
    expect(host().style.width).toBe(`${WIDE_SPRITE}px`)
    expect(host().style.height).toBe(`${WIDE_SPRITE}px`)
  })

  it('sin foco ni teclado: solo es interactivo el enlace del pie del diálogo, que sigue ahí', async () => {
    await open()
    expect(host()).not.toHaveAttribute('tabindex')
    expect(
      column().querySelectorAll('button, a, input, [tabindex]'),
    ).toHaveLength(1)
    expect(
      within(column()).getByRole('button', { name: /expediente/i }),
    ).toBeInTheDocument()
    // «poking» no se activa con el teclado (spec §5): solo escucha el clic.
    fireEvent.keyDown(host(), { key: 'Enter' })
    fireEvent.keyDown(host(), { key: ' ' })
    expect(host()).toHaveAttribute('data-poking', 'idle')
  })

  it('un toque sobre Sofi activa poking y deja a los otros dos en pausa', async () => {
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

  // Pasar a reducido en mitad de un gag lo quita en el acto (catálogo §6.3), y el Lab no
  // puede seguir diciendo que hay uno activo.
  it('pasar a reducido con poking en marcha lo cambia por su versión reducida, en reposo, y «Gag activo» vuelve a ninguno', async () => {
    const view = await open()
    fireEvent.click(host())
    await flush()
    expect(readout('Gag activo')).toBe('poking')
    view.rerender(
      <MotionPreferenceProvider value="reduce">
        <GagsWideSpec />
      </MotionPreferenceProvider>,
    )
    await flush()
    expect(host()).toHaveAttribute('data-poking', 'idle')
    expect(readout('Gag activo')).toBe('ninguno')
    expect(gagLog().at(-1)).toBe('poking se desmonta')
  })

  // Versión reducida (aprobada, plan §6; `useReducedGag`): los tres gags siguen, en su versión
  // reducida, sobre el mismo retrato.
  it('con movimiento reducido, los tres gags en su versión reducida sobre el mismo retrato', async () => {
    await open('reduce')
    expect(section().querySelectorAll('[data-poking]')).toHaveLength(1)
    expect(host()).toHaveAttribute('data-still-here', 'idle')
    expect(host()).toHaveAttribute('data-i-see-you', 'idle')
    for (const gag of ['poking', 'are-u-still-here', 'i-see-you'])
      expect(host()).toHaveClass(`${gag}-owner`)
    const images = column().querySelectorAll('[role="img"]')
    expect(images).toHaveLength(1)
    expect((images[0] as HTMLElement).style.width).toBe(`${WIDE_SPRITE}px`)
    expect(readout('Movimiento')).toMatch(/reducido/i)
    // El rótulo de la columna dice lo que se ve, no «gags vivos».
    expect(
      ui().getByText('Movimiento reducido · gags reducidos'),
    ).toBeInTheDocument()
    expect(ui().queryByText('Completo · gags vivos')).toBeNull()
  })

  it('con movimiento completo avisa de que los gags están activos', async () => {
    await open('full')
    expect(readout('Movimiento')).toMatch(/completo/i)
    expect(ui().getByText('Completo · gags vivos')).toBeInTheDocument()
  })

  it('dice que la versión reducida y la ubicación están aprobadas, sin nada pendiente de AV4', async () => {
    await open()
    expect(section()).toHaveTextContent(
      'Movimiento reducido (aprobado el 2026-11-12)',
    )
    expect(section()).not.toHaveTextContent(/en prueba/)
    expect(section()).not.toHaveTextContent(/AV4/)
    expect(section()).toHaveTextContent(/producción en T088/)
    expect(section()).toHaveTextContent(/están aprobadas \(AV6\)/)
    expect(section()).toHaveTextContent(/«Reducido» en Movimiento/)
  })
})

describe('la anchura de la columna', () => {
  const choose = async (name: RegExp) => {
    fireEvent.click(within(section()).getByRole('button', { name }))
    await flush()
  }

  it('parte de 460 px y la cambia sin tocar el retrato', async () => {
    await open()
    expect(column().style.getPropertyValue('--column')).toBe('460px')
    await choose(/^384/)
    expect(column().style.getPropertyValue('--column')).toBe('384px')
    await choose(/^720/)
    expect(column().style.getPropertyValue('--column')).toBe('720px')
    // El retrato mide lo mismo: solo cambia el aire y el diálogo.
    expect(host().style.width).toBe(`${WIDE_SPRITE}px`)
  })

  it('cambiarla no desmonta los gags', async () => {
    await open()
    const element = host()
    await choose(/^520/)
    expect(host()).toBe(element)
    expect(host()).toHaveAttribute('data-poking', 'idle')
  })
})

describe('zona sensible', () => {
  it('«Mostrar la zona sensible» tiñe solo la columna, y no cambia el DOM', async () => {
    await open()
    const before = column().innerHTML
    expect(column().className).not.toMatch(/showHit/)
    await toggle('Mostrar la zona sensible')
    expect(column().className).toMatch(/showHit/)
    expect(column().innerHTML).toBe(before)
    await toggle('Mostrar la zona sensible')
    expect(column().className).not.toMatch(/showHit/)
  })
})

describe('gags activos e inactividad', () => {
  it('desmarcar uno lo desmonta del todo y deja los otros dos', async () => {
    await open()
    await toggle('poking')
    expect(host()).toBeNull()
    expect(column().querySelectorAll('[data-poking-layer]')).toHaveLength(0)
    expect(column().querySelectorAll('[data-still-here]')).toHaveLength(1)
    expect(column().querySelectorAll('[data-i-see-you]')).toHaveLength(1)
    await toggle('poking')
    expect(host()).not.toBeNull()
  })

  it('are-u-still-here parte del valor aprobado del plan y no se duerme antes', async () => {
    await open()
    expect(readout('Inactividad')).toBe(`${IDLE_DEFAULT_MS / 1000} s`)
    const element = host()
    act(() => vi.advanceTimersByTime(IDLE_DEFAULT_MS - 1_000))
    expect(element).toHaveAttribute('data-still-here', 'idle')
    act(() => vi.advanceTimersByTime(2_000))
    expect(element).toHaveAttribute('data-still-here', 'drowsy')
  })

  it('las causas de pausa se agregan: una sola pausa por gag', async () => {
    await open()
    await toggle('Pestaña oculta')
    await toggle('Escritura o controles')
    for (const gag of ['poking', 'i-see-you', 'are-u-still-here'])
      expect(
        gagLog().filter((line) => line === `${gag} en pausa`),
      ).toHaveLength(1)
  })
})

describe.each([false, true])('al desmontar (StrictMode: %s)', (strict) => {
  it('no quedan escuchas, observadores, temporizadores, fotogramas, capas ni atributos', async () => {
    const view = await open('full', strict)
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
