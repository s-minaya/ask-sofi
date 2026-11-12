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
import { SoundProvider } from '../../app/providers/SoundProvider'
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
import {
  DEFAULT_FRAME_CONFIG,
  type GagsFrameConfig,
  type GagsFrameStatus,
} from '../gagProfile'
import { createAudioSimulation, createSimulatedAudio } from '../simulatedAudio'
import { ProfilePrototype } from './ProfilePrototype'
import { PROFILE_PRESETS } from './profilePresets'

// T066, ubicación A del expediente (aprobada, spec §5): los tres gags reales sobre el retrato que
// ya tiene el cuestionario (el `ProfileSheet` real, sin modificar). Solo se simulan los módulos dueños y la
// decodificación; los controladores son los del ZIP, a través del adaptador de producción.

const simulation = createAudioSimulation()
const createAudio = () => createSimulatedAudio(simulation)

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

const OWNERS = ['poking', 'are-u-still-here', 'i-see-you'] as const

type Status = Omit<GagsFrameStatus, 'frame'>

async function open({
  motion = 'full',
  preset = 'waiting',
  config = DEFAULT_FRAME_CONFIG,
  strict = false,
}: {
  motion?: MotionPreference
  preset?: keyof typeof PROFILE_PRESETS
  config?: GagsFrameConfig
  strict?: boolean
} = {}) {
  const statuses: Status[] = []
  const onStatus = (status: Status) => {
    statuses.push(status)
  }
  const tree = (
    <ThemeProvider>
      <SoundProvider createAudio={createAudio}>
        <MotionPreferenceProvider value={motion}>
          <ProfilePrototype
            preset={PROFILE_PRESETS[preset]}
            gags={{ config, onStatus }}
          />
        </MotionPreferenceProvider>
      </SoundProvider>
    </ThemeProvider>
  )
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree)
  await flush()
  return { view, statuses }
}

const stage = () =>
  document.querySelector(
    'section[aria-label="La pregunta de Sofi"]',
  ) as HTMLElement
// El retrato cuando es el sprite de Sofi: `SofiPortrait` sin imagen es el propio elemento de
// `sofi-blink` con la descripción.
const portrait = () => stage().querySelector('[role="img"]') as HTMLElement
const layers = (element: Element) =>
  element.querySelectorAll(
    '[data-poking-layer],[data-still-here-layer],[data-i-see-you-layer]',
  )
const gagAttributes = ['data-poking', 'data-still-here', 'data-i-see-you']
const alive = (element: Element) =>
  gagAttributes.every((attribute) => element.hasAttribute(attribute))
const none = (element: Element) =>
  gagAttributes.every((attribute) => !element.hasAttribute(attribute))
const last = (statuses: Status[]) => statuses[statuses.length - 1]

describe('los tres gags sobre el retrato del cuestionario', () => {
  it('con Sofi esperando, el retrato existente lleva los tres controladores, cada uno con sus capas', async () => {
    await open()
    const element = portrait()
    expect(alive(element)).toBe(true)
    for (const gag of OWNERS) expect(element).toHaveClass(`${gag}-owner`)
    expect(element.querySelectorAll('[data-poking-layer]')).toHaveLength(8)
    expect(element.querySelectorAll('[data-still-here-layer]')).toHaveLength(8)
    expect(element.querySelectorAll('[data-i-see-you-layer]')).toHaveLength(3)
    // Es el retrato de siempre: 384 px de sprite con su descripción, sin otra Sofi.
    expect(stage().querySelectorAll('[role="img"]')).toHaveLength(1)
    expect(element).toHaveAttribute('aria-label', 'Sofi espera tu respuesta')
  })

  it('el Lab le añade sus clases (zona sensible, etiqueta por encima) y no toca el formulario', async () => {
    await open()
    expect(portrait().className).toMatch(/host/)
    expect(stage().className).toMatch(/stage/)
    // Los controles de la ficha siguen siendo los suyos.
    expect(
      within(stage()).getByRole('radio', { name: 'Lo dice claramente' }),
    ).toBeInTheDocument()
    expect(portrait()).not.toHaveAttribute('tabindex')
  })

  it('mientras Sofi pregunta (habla) no hay controladores ni capas, y al terminar sí', async () => {
    const { statuses } = await open({ preset: 'empty' })
    // Preguntando: el retrato ya es el sprite, pero los gags no pueden vivir (spec §5).
    expect(portrait()).toHaveAttribute('aria-label', 'Sofi te pregunta')
    expect(none(portrait())).toBe(true)
    expect(layers(portrait())).toHaveLength(0)
    expect(last(statuses).calm).toBe(false)
    act(() => vi.advanceTimersByTime(60_000))
    await flush()
    expect(alive(portrait())).toBe(true)
  })

  it('con una reacción, el retrato es una imagen estática: sin anfitrión, sin controladores, y vuelven con Sofi esperando', async () => {
    await open()
    const before = portrait()
    fireEvent.click(
      within(stage()).getByRole('radio', { name: 'Lo dice claramente' }),
    )
    await flush()
    // El sprite deja de ser el anfitrión: el retrato es la imagen de la reacción.
    expect(portrait().className).not.toMatch(/sofi-blink/)
    expect(none(before)).toBe(true)
    expect(layers(before)).toHaveLength(0)
    expect(before.className).not.toMatch(/owner/)
    act(() => vi.advanceTimersByTime(2_000))
    await flush()
    expect(alive(portrait())).toBe(true)
    expect(portrait()).toHaveAttribute('aria-label', 'Sofi espera tu respuesta')
  })

  // Versión reducida (aprobada, plan §6; `useReducedGag`): los tres gags siguen, en su versión
  // reducida, sobre el mismo retrato y con la misma zona sensible.
  it('con movimiento reducido, los tres gags en su versión reducida sobre el mismo retrato', async () => {
    await open({ motion: 'reduce' })
    expect(alive(portrait())).toBe(true)
    expect(portrait()).toHaveAttribute('data-i-see-you-gaze', 'center')
    expect(layers(portrait()).length).toBeGreaterThan(0)
    for (const gag of ['poking', 'are-u-still-here', 'i-see-you'])
      expect(portrait()).toHaveClass(`${gag}-owner`)
    expect(portrait().className).toMatch(/host/)
  })

  it('sin ningún gag marcado, el retrato no lleva la zona sensible del Lab', async () => {
    await open({
      config: {
        ...DEFAULT_FRAME_CONFIG,
        gags: { poking: false, 'i-see-you': false, 'are-u-still-here': false },
      },
    })
    expect(none(portrait())).toBe(true)
    expect(portrait().className).not.toMatch(/host/)
  })

  it('con un solo gag, sí la lleva (su parcial posiciona el anfitrión)', async () => {
    await open({
      config: {
        ...DEFAULT_FRAME_CONFIG,
        gags: { poking: false, 'i-see-you': true, 'are-u-still-here': false },
      },
    })
    expect(portrait().className).toMatch(/host/)
  })

  it('cada gag solo existe si está marcado', async () => {
    await open({
      config: {
        ...DEFAULT_FRAME_CONFIG,
        gags: { poking: false, 'i-see-you': true, 'are-u-still-here': true },
      },
    })
    expect(portrait()).not.toHaveAttribute('data-poking')
    expect(portrait()).toHaveAttribute('data-i-see-you')
    expect(portrait()).toHaveAttribute('data-still-here')
  })

  it('un toque sobre Sofi activa poking y deja a los otros dos en pausa', async () => {
    const { statuses } = await open()
    fireEvent.click(portrait())
    await flush()
    expect(portrait()).toHaveAttribute('data-poking', 'curious')
    expect(last(statuses).active).toBe('poking')
  })
})

// Umbral aprobado de are-u-still-here (plan §6): 150 000 ms de inactividad real, con los tres
// gags montados como en 4.9 por defecto.
describe('inactividad de are-u-still-here con el umbral aprobado', () => {
  const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

  it('el marco parte de 150 000 ms: no se adormece antes y sí al cumplirlos', async () => {
    expect(DEFAULT_FRAME_CONFIG.idle).toBe(150_000)
    await open()
    advance(149_999)
    expect(portrait()).toHaveAttribute('data-still-here', 'idle')
    advance(1)
    expect(portrait()).toHaveAttribute('data-still-here', 'drowsy')
  })

  it('la actividad reinicia la cuenta: 150 000 ms desde la última', async () => {
    await open()
    advance(100_000)
    act(() => {
      document.dispatchEvent(new Event('keydown'))
    })
    advance(149_999)
    expect(portrait()).toHaveAttribute('data-still-here', 'idle')
    advance(1)
    expect(portrait()).toHaveAttribute('data-still-here', 'drowsy')
  })
})

// Decisión aprobada (2026-11-09, spec §5): en el expediente los gags quedan suspendidos mientras
// cualquier control del formulario tenga el foco.
describe('foco en los controles del formulario', () => {
  const radio = (name: string) => within(stage()).getByRole('radio', { name })
  const focusOn = async (element: HTMLElement) => {
    act(() => element.focus())
    await flush()
  }
  // Perder el foco se lee en la tarea siguiente (ver `watchControlFocus`).
  const blurFrom = async (element: HTMLElement) => {
    act(() => element.blur())
    act(() => vi.advanceTimersByTime(0))
    await flush()
  }

  it('cualquier control de la ficha con foco suspende los gags, y perderlo los reanuda', async () => {
    const { statuses } = await open()
    const option = radio('Suele dar indirectas')
    await focusOn(option)
    expect(last(statuses).interaction).toBe(true)
    await blurFrom(option)
    expect(last(statuses).interaction).toBe(false)
  })

  it.each([
    ['una opción', () => radio('Suele dar indirectas')],
    ['las notas', () => document.querySelector('textarea') as HTMLElement],
    [
      'un botón',
      () =>
        document.querySelector('main button:not([disabled])') as HTMLElement,
    ],
  ])('el foco en %s suspende los gags', async (_name, find) => {
    const { statuses } = await open()
    await focusOn(find())
    expect(last(statuses).interaction).toBe(true)
  })

  it('un toque a Sofi no activa poking mientras hay foco en un control', async () => {
    await open()
    await focusOn(radio('Suele dar indirectas'))
    fireEvent.click(portrait())
    await flush()
    expect(portrait()).toHaveAttribute('data-poking', 'idle')
  })

  it('al pasar el foco de un control a otro (Tab) los gags siguen suspendidos', async () => {
    const { statuses } = await open()
    const first = radio('Suele dar indirectas')
    await focusOn(first)
    await focusOn(document.querySelector('textarea') as HTMLElement)
    act(() => vi.advanceTimersByTime(10))
    expect(last(statuses).interaction).toBe(true)
  })

  it('al perder el foco no reaparece nada de lo ocurrido durante la suspensión', async () => {
    await open()
    const option = radio('Suele dar indirectas')
    await focusOn(option)
    // Durante la suspensión: toques sobre Sofi que no cuentan.
    fireEvent.click(portrait())
    fireEvent.click(portrait())
    await flush()
    await blurFrom(option)
    expect(portrait()).toHaveAttribute('data-poking', 'idle')
    expect(portrait()).toHaveAttribute('data-i-see-you', 'idle')
    expect(portrait()).toHaveAttribute('data-still-here', 'idle')
  })

  it('la página oculta pausa los gags, y visible los reanuda', async () => {
    await open()
    const hide = (hidden: boolean) => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => hidden,
      })
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
      })
    }
    hide(true)
    fireEvent.click(portrait())
    await flush()
    expect(portrait()).toHaveAttribute('data-poking', 'idle')
    hide(false)
    fireEvent.click(portrait())
    await flush()
    expect(portrait()).toHaveAttribute('data-poking', 'curious')
  })
})

// Decisión aprobada (2026-11-10, spec §5): al entrar el foco en un control se cancelan los gags y
// Sofi vuelve al reposo; al perderlo no continúa ninguna reacción ni mirada pendiente. Con los
// controladores reales del ZIP.
describe('al entrar el foco, Sofi vuelve al reposo', () => {
  const option = () =>
    within(stage()).getByRole('radio', { name: 'Suele dar indirectas' })
  const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))
  const focusOn = async (element: HTMLElement) => {
    act(() => element.focus())
    await flush()
  }
  const blurFrom = async (element: HTMLElement) => {
    act(() => element.blur())
    advance(0)
    await flush()
  }
  // Pinchazos que cuentan: entre dos, más que la espera mínima del controlador.
  const poke = (times: number) => {
    for (let i = 0; i < times; i++) {
      fireEvent.click(portrait())
      advance(400)
    }
  }
  const only = (gag: 'poking' | 'i-see-you' | 'are-u-still-here') => ({
    ...DEFAULT_FRAME_CONFIG,
    idle: 5000,
    gags: {
      poking: gag === 'poking',
      'i-see-you': gag === 'i-see-you',
      'are-u-still-here': gag === 'are-u-still-here',
    },
  })

  it('poking en marcha (curious) vuelve al reposo al instante y, al perder el foco, no sigue', async () => {
    const { statuses } = await open({ config: only('poking') })
    poke(1)
    expect(portrait()).toHaveAttribute('data-poking', 'curious')
    expect(last(statuses).active).toBe('poking')
    const control = option()
    await focusOn(control)
    expect(portrait()).toHaveAttribute('data-poking', 'idle')
    expect(last(statuses).active).toBeNull()
    await blurFrom(control)
    advance(20_000)
    expect(portrait()).toHaveAttribute('data-poking', 'idle')
    // Empieza de nuevo desde el principio, no desde donde se quedó.
    fireEvent.click(portrait())
    expect(portrait()).toHaveAttribute('data-poking', 'curious')
  })

  it('Sofi escondida (hide) sale del escondite al entrar el foco y no se asoma al perderlo', async () => {
    await open({ config: only('poking') })
    poke(5)
    expect(portrait()).toHaveAttribute('data-poking', 'hide')
    const control = option()
    await focusOn(control)
    expect(portrait()).toHaveAttribute('data-poking', 'idle')
    advance(10_000)
    await blurFrom(control)
    const seen = new Set<string | null>()
    for (let t = 0; t < 20_000; t += 250) {
      advance(250)
      seen.add(portrait().getAttribute('data-poking'))
    }
    expect([...seen]).toEqual(['idle'])
  })

  it('i-see-you pillada (caught) vuelve al reposo y, al perder el foco, no sigue con la sonrisa', async () => {
    await open({ config: only('i-see-you') })
    // El cursor se queda encima de Sofi: la pillan.
    fireEvent.pointerEnter(portrait())
    advance(1300)
    expect(portrait()).toHaveAttribute('data-i-see-you', 'caught')
    const control = option()
    await focusOn(control)
    expect(portrait()).toHaveAttribute('data-i-see-you', 'idle')
    await blurFrom(control)
    const seen = new Set<string | null>()
    for (let t = 0; t < 8000; t += 200) {
      advance(200)
      seen.add(portrait().getAttribute('data-i-see-you'))
    }
    expect([...seen]).toEqual(['idle'])
  })

  it('i-see-you con una reacción pendiente (cursor encima, aún sin pillarla) no la retoma al perder el foco', async () => {
    await open({ config: only('i-see-you') })
    fireEvent.pointerEnter(portrait())
    advance(600)
    expect(portrait()).toHaveAttribute('data-i-see-you', 'idle')
    const control = option()
    await focusOn(control)
    await blurFrom(control)
    advance(3000)
    expect(portrait()).toHaveAttribute('data-i-see-you', 'idle')
  })

  it('are-u-still-here dormida vuelve al reposo sin susto, y al perder el foco la cuenta empieza de cero', async () => {
    await open({ config: only('are-u-still-here') })
    advance(60_000)
    expect(portrait()).toHaveAttribute('data-still-here', 'asleep')
    const control = option()
    await focusOn(control)
    expect(portrait()).toHaveAttribute('data-still-here', 'idle')
    advance(60_000)
    expect(portrait()).toHaveAttribute('data-still-here', 'idle')
    await blurFrom(control)
    advance(4900)
    expect(portrait()).toHaveAttribute('data-still-here', 'idle')
    advance(200)
    expect(portrait()).toHaveAttribute('data-still-here', 'drowsy')
  })

  it('pasar el foco de un control a otro no vuelve a cancelar nada ni reanuda', async () => {
    const { statuses } = await open({ config: only('poking') })
    await focusOn(option())
    const before = statuses.length
    await focusOn(document.querySelector('textarea') as HTMLElement)
    advance(10)
    expect(statuses.slice(before).every((status) => status.interaction)).toBe(
      true,
    )
  })

  it('la página oculta solo pausa: no devuelve a Sofi al reposo (las demás causas no cambian)', async () => {
    await open({ config: only('poking') })
    poke(1)
    expect(portrait()).toHaveAttribute('data-poking', 'curious')
    const hide = (hidden: boolean) => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => hidden,
      })
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
      })
    }
    hide(true)
    expect(portrait()).toHaveAttribute('data-poking', 'curious')
    hide(false)
    expect(portrait()).toHaveAttribute('data-poking', 'curious')
  })
})

describe('el estado que cuenta el marco', () => {
  it('con Sofi esperando: sprite, escena tranquila y sin interacción', async () => {
    const { statuses } = await open()
    expect(last(statuses)).toMatchObject({
      mood: 'waiting',
      sprite: true,
      calm: true,
      interaction: false,
      reduced: false,
    })
  })

  it('hablando no es una escena tranquila, aunque el retrato sea el sprite', async () => {
    const { statuses } = await open({ preset: 'empty' })
    expect(last(statuses)).toMatchObject({
      mood: 'asking',
      sprite: true,
      calm: false,
    })
  })

  it('en una reacción el retrato no es el sprite', async () => {
    const { statuses } = await open({ preset: 'answered' })
    expect(last(statuses)).toMatchObject({ sprite: false, calm: false })
  })

  it('con movimiento reducido la escena sigue tranquila: los gags, en su versión reducida', async () => {
    const { statuses } = await open({ motion: 'reduce' })
    expect(last(statuses)).toMatchObject({ reduced: true, calm: true })
  })
})

const stageClasses = (element: Element) =>
  [...element.classList].filter((name) => /stage/.test(name)).length

describe.each([false, true])('al desmontar (StrictMode: %s)', (strict) => {
  it('no quedan capas, atributos ni clases del Lab en el retrato ni en su escenario', async () => {
    const { view } = await open({ strict })
    const element = portrait()
    const section = stage()
    expect(alive(element)).toBe(true)
    // La clase del escenario del Lab se suma a la suya.
    expect(stageClasses(section)).toBe(2)
    view.unmount()
    act(() => vi.runOnlyPendingTimers())
    expect(layers(element)).toHaveLength(0)
    expect(none(element)).toBe(true)
    expect(element.className).not.toMatch(/owner|host/)
    expect(stageClasses(section)).toBe(1)
    expect(section.className).not.toMatch(/showHit/)
  })
})
