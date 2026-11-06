import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { ThemeProvider } from '../../app/providers/ThemeProvider'
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
import { setMediaQuery } from '../../test/matchMedia'
import { DesignLab } from '../DesignLab'

// T062: el selector global de movimiento del Lab (`system | reduce | full`) gobierna el
// inspector sin un selector propio. Con los controladores REALES de los ZIP (como VT3), solo se
// simulan los módulos dueños y la decodificación. No es un navegador: las poses y las
// animaciones vivas de los 14 recursos se comprueban en Chromium (008-verification.md).

const GAGS = [
  { id: 'poking', attribute: 'poking', layers: '[data-poking-layer]' },
  {
    id: 'are-u-still-here',
    attribute: 'stillHere',
    layers: '[data-still-here-layer]',
  },
  { id: 'i-see-you', attribute: 'iSeeYou', layers: '[data-i-see-you-layer]' },
] as const

const REDUCE = '(prefers-reduced-motion: reduce)'

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
  window.history.replaceState(null, '', '/')
})

async function openInspector(id: SofiAnimationId) {
  window.history.replaceState(null, '', '/design-lab?s=motion')
  render(
    <ThemeProvider>
      <DesignLab />
    </ThemeProvider>,
  )
  await flush()
  fireEvent.click(
    within(screen.getByRole('group', { name: 'Recurso' })).getByRole('button', {
      name: id,
    }),
  )
  await flush()
}

async function setMotion(name: 'Sistema' | 'Reducido' | 'Completo') {
  fireEvent.click(
    within(screen.getByRole('group', { name: 'Movimiento' })).getByRole(
      'button',
      { name },
    ),
  )
  await flush()
}

const host = () =>
  (document.querySelector('[data-frozen]') as HTMLElement)
    .firstElementChild as HTMLElement

describe.each(GAGS)('selector global de movimiento · $id', (gag) => {
  const mounted = () => host().dataset[gag.attribute] !== undefined
  const layers = () => host().querySelectorAll(gag.layers).length

  it('con «Reducido» no monta controlador, y pasar a «Reducido» lo limpia por completo', async () => {
    await openInspector(gag.id)
    await setMotion('Reducido')
    const baseline = probe.snapshot()
    expect(mounted()).toBe(false)
    expect(layers()).toBe(0)

    await setMotion('Completo')
    expect(mounted()).toBe(true)
    expect(layers()).toBeGreaterThan(0)
    // La sonda ve algo que limpiar.
    expect(probe.snapshot()).not.toEqual(baseline)

    await setMotion('Reducido')
    expect(mounted()).toBe(false)
    expect(layers()).toBe(0)
    // Ni escuchas, ni observadores, ni temporizadores, ni fotogramas pendientes.
    expect(probe.snapshot()).toEqual(baseline)
  })

  it('«Completo» monta el controlador aunque el sistema pida reducir', async () => {
    setMediaQuery(REDUCE, true)
    await openInspector(gag.id)
    await setMotion('Sistema')
    expect(mounted()).toBe(false)

    await setMotion('Completo')
    expect(mounted()).toBe(true)
    expect(document.documentElement.dataset.motion).toBe('full')
  })

  it('«Sistema» sigue al sistema, también en vivo', async () => {
    await openInspector(gag.id)
    await setMotion('Sistema')
    expect(mounted()).toBe(true)

    act(() => setMediaQuery(REDUCE, true))
    await flush()
    expect(mounted()).toBe(false)
    expect(layers()).toBe(0)

    act(() => setMediaQuery(REDUCE, false))
    await flush()
    expect(mounted()).toBe(true)
  })

  it('alternar los modos no acumula controladores: las mismas capas, o ninguna', async () => {
    await openInspector(gag.id)
    await setMotion('Completo')
    const once = layers()
    expect(once).toBeGreaterThan(0)
    await setMotion('Reducido')
    const baseline = probe.snapshot()

    for (const name of [
      'Completo',
      'Reducido',
      'Completo',
      'Reducido',
    ] as const)
      await setMotion(name)

    expect(probe.snapshot()).toEqual(baseline)
    await setMotion('Completo')
    expect(layers()).toBe(once)
  })
})
