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
import { GAG_IDLE_DEMO_MS, ScenariosSpec } from './ScenariosSpec'

// T064: escenarios y secuencias del contrato en Motion & Sound. Con los controladores REALES de
// los gags; solo se simulan los módulos dueños, la decodificación y el dibujo del sprite del
// escenario (que aquí es un botón: pulsarlo es el fin de su pasada única).

vi.mock('../../components/sofi/SofiSprite/SofiSprite', () => ({
  SofiSprite: ({
    animation,
    onEnd,
  }: {
    animation: string
    onEnd?: () => void
  }) => <button type="button" data-sprite={animation} onClick={onEnd} />,
}))

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
      <ScenariosSpec />
    </MotionPreferenceProvider>
  )
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree)
  await flush()
  return view
}

const section = () => document.getElementById('m-scenarios') as HTMLElement
const ui = () => within(section())
const press = async (name: string | RegExp) => {
  fireEvent.click(ui().getByRole('button', { name }))
  await flush()
}
const shown = () =>
  section()
    .querySelector('[data-stage] [data-sprite]')
    ?.getAttribute('data-sprite') ??
  section().querySelector('[data-stage]')?.getAttribute('data-intent')
const readout = (term: string) =>
  ui().getByText(term, { exact: true }).nextElementSibling?.textContent
const sequence = () => readout('Secuencia')
const log = () =>
  within(ui().getByRole('list', { name: 'Registro de la escena' }))
    .queryAllByRole('listitem')
    .map((item) => item.textContent ?? '')
const gagLog = () =>
  within(ui().getByRole('list', { name: 'Registro de los gags' }))
    .queryAllByRole('listitem')
    .map((item) => item.textContent ?? '')
const toggle = async (label: string) => {
  fireEvent.click(ui().getByLabelText(label))
  await flush()
}
const endPass = async () => {
  fireEvent.click(section().querySelector('[data-stage] [data-sprite]')!)
  await flush()
}

describe('escenarios de eventos', () => {
  it('empieza en reposo, sin inventar resultados ni persistencia', async () => {
    await open()
    expect(shown()).toBe('sofi-blink')
    expect(sequence()).toBe('sofi-blink')
    expect(readout('Escena tranquila')).toBe('sí')
    expect(section()).toHaveTextContent(/simulaci[oó]n local/i)
    expect(section()).toHaveTextContent(/no guarda ni borra nada/i)
  })

  it('habla, pausa y «Ver todo»: blink → talking → blink', async () => {
    await open()
    await press('Empieza a hablar')
    expect(shown()).toBe('talking')
    await press('Pausa')
    expect(shown()).toBe('sofi-blink')
    await press('Empieza a hablar')
    await press('Ver todo')
    expect(shown()).toBe('sofi-blink')
    expect(sequence()).toBe(
      'sofi-blink › talking › sofi-blink › talking › sofi-blink',
    )
  })

  it('petición pendiente → falta de contexto → «No sé más»: processing → resultado y needs-context → uncertain', async () => {
    await open()
    await press('Petición pendiente')
    expect(shown()).toBe('sofing')
    await press('Falta de contexto')
    expect(shown()).toBe('needs-context')
    await endPass()
    expect(shown()).toBe('sofi-blink')
    await press('«No sé más»')
    expect(shown()).toBe('uncertain')
    await endPass()
    expect(sequence()).toBe(
      'sofi-blink › sofing › needs-context › sofi-blink › uncertain › sofi-blink',
    )
  })

  it.each([
    ['Error técnico', 'error'],
    ['Interpretada sin señales', 'sofi-blink'],
    [/Interpretada · eureka/, 'eureka'],
    [/Interpretada · suspicious/, 'suspicious'],
  ] as const)(
    'petición completada con «%s» pinta %s',
    async (button, expected) => {
      await open()
      await press('Petición pendiente')
      await press(button)
      expect(shown()).toBe(expected)
    },
  )

  it('el tono de eureka y suspicious lo elige quien prueba, a la espera de 006', async () => {
    await open()
    expect(section()).toHaveTextContent(/lo eliges t[uú]/i)
    expect(section()).toHaveTextContent(/006/)
  })

  it('favorito guardado: favoriting → blink', async () => {
    await open()
    await press('Favorito guardado')
    expect(shown()).toBe('favoriting')
    await endPass()
    expect(shown()).toBe('sofi-blink')
  })

  it('una consulta nueva invalida la reacción anterior', async () => {
    await open()
    await press('Error técnico')
    expect(shown()).toBe('error')
    await press('Petición pendiente')
    expect(shown()).toBe('sofing')
  })

  it('«Reiniciar escena» vuelve al reposo con el registro vacío', async () => {
    await open()
    await press('Error técnico')
    await press('Reiniciar escena')
    expect(shown()).toBe('sofi-blink')
    expect(sequence()).toBe('sofi-blink')
    expect(log()).toEqual([])
  })
})

describe('privacidad: el orden, sin persistencia simulada', () => {
  it('borrado efectivo → memory-wipe, y solo el fin de la confirmación vuelve a neutral', async () => {
    await open()
    await press('Borrado efectivo')
    expect(shown()).toBe('memory-wipe')
    await endPass()
    // Terminar la animación no devuelve a neutral: lo hace la señal funcional.
    expect(shown()).toBe('memory-wipe')
    await press('Fin de la confirmación')
    expect(shown()).toBe('sofi-blink')
    expect(sequence()).toBe('sofi-blink › memory-wipe › sofi-blink')
  })

  it('el registro cuenta primero el borrado real y luego la señal, sin simular almacenamiento', async () => {
    await open()
    await press('Borrado efectivo')
    const lines = log()
    expect(lines[0]).toMatch(/1.*Borrado real.*no se borra nada/i)
    expect(lines[1]).toMatch(/2.*data-erased/)
    expect(lines.join(' ')).not.toMatch(/localStorage|guardado en/i)
  })

  it('salida rápida: nada animado, sin memory-wipe, y los gags cancelados', async () => {
    await open()
    await flush()
    expect(section().querySelectorAll('[data-poking]')).toHaveLength(1)

    await press('Salida rápida')
    expect(shown()).toBe('sin sprite')
    expect(readout('Escena tranquila')).toBe('no')
    for (const attribute of [
      'data-poking',
      'data-still-here',
      'data-i-see-you',
    ])
      expect(section().querySelectorAll(`[${attribute}]`)).toHaveLength(0)
    expect(
      section().querySelectorAll(
        '[data-poking-layer],[data-still-here-layer],[data-i-see-you-layer]',
      ),
    ).toHaveLength(0)

    await press('Borrado efectivo')
    expect(shown()).toBe('sin sprite')
  })

  it('el registro de la salida rápida: oculta y cancela antes de cualquier efecto', async () => {
    await open()
    await press('Salida rápida')
    const lines = log()
    expect(lines[0]).toMatch(/1.*oculto.*simulado/i)
    expect(lines[1]).toMatch(/2.*controladores cancelados/i)
    expect(lines[2]).toMatch(/3.*sin sprite ni animaci[oó]n/i)
  })
})

describe('prioridades de seguridad', () => {
  it.each([
    ['safety_concern', 'sin sprite'],
    ['Seguridad no evaluada', 'sobria'],
  ] as const)(
    '«%s» prevalece sobre cualquier otra señal',
    async (button, expected) => {
      await open()
      await press(button)
      await press('Empieza a hablar')
      await press('Petición pendiente')
      await press('Favorito guardado')
      await press('Borrado efectivo')
      expect(readout('Representación')).toBe(expected)
      await press('Seguridad resuelta')
      expect(readout('Representación')).not.toBe(expected)
    },
  )
})

describe('los gags y sus prioridades (controladores reales)', () => {
  const hosts = () => ({
    poking: section().querySelector('[data-poking]') as HTMLElement | null,
    seeYou: section().querySelector('[data-i-see-you]') as HTMLElement | null,
    stillHere: section().querySelector(
      '[data-still-here]',
    ) as HTMLElement | null,
  })

  it('en una escena tranquila los tres gags están montados y comparten un ambient', async () => {
    await open()
    const { poking, seeYou, stillHere } = hosts()
    expect(poking).not.toBeNull()
    expect(seeYou).not.toBeNull()
    expect(stillHere).not.toBeNull()
    expect(readout('Gag activo')).toBe('ninguno')
  })

  it('toque secuencial: pinchar a poking lo activa, y los demás quedan pausados por ambient', async () => {
    await open()
    fireEvent.click(hosts().poking!)
    await flush()
    expect(hosts().poking!.dataset.poking).not.toBe('idle')
    expect(readout('Gag activo')).toBe('poking')
    expect(gagLog().join(' ')).toMatch(/i-see-you.*pausa|pausa.*i-see-you/i)
  })

  it('un gag no puede activarse mientras hay otro: se rechaza y se anota', async () => {
    await open()
    fireEvent.click(hosts().poking!)
    await flush()
    fireEvent.pointerEnter(hosts().seeYou!)
    fireEvent.pointerMove(hosts().seeYou!)
    await flush()
    expect(readout('Gag activo')).toBe('poking')
  })

  it('inactividad y despertar: are-u-still-here se duerme (demostración corta) y despierta con actividad', async () => {
    await open()
    const host = hosts().stillHere!
    expect(host.dataset.stillHere).toBe('idle')
    act(() => vi.advanceTimersByTime(GAG_IDLE_DEMO_MS + 500))
    expect(host.dataset.stillHere).toBe('drowsy')
    // Con actividad antes de dormirse, vuelve al reposo.
    act(() => {
      document.dispatchEvent(new Event('keydown'))
    })
    expect(host.dataset.stillHere).toBe('idle')
    // La demostración no sustituye al valor provisional del plan: consta a la vista.
    expect(section()).toHaveTextContent(/150 s/)
  })

  it('las causas de pausa se agregan: dos causas, una sola pausa y una sola reanudación', async () => {
    await open()
    await toggle('Pestaña oculta')
    await toggle('Escritura o controles')
    expect(gagLog().filter((line) => /poking.*pausa/i.test(line))).toHaveLength(
      1,
    )

    await toggle('Pestaña oculta')
    expect(
      gagLog().filter((line) => /poking.*reanuda/i.test(line)),
    ).toHaveLength(0)
    await toggle('Escritura o controles')
    expect(
      gagLog().filter((line) => /poking.*reanuda/i.test(line)),
    ).toHaveLength(1)
  })

  it('cualquier cosa que ocupe la escena cancela los gags, y al volver al reposo hay uno de cada', async () => {
    await open()
    await press('Empieza a hablar')
    expect(hosts().poking).toBeNull()
    expect(hosts().seeYou).toBeNull()
    expect(hosts().stillHere).toBeNull()
    expect(section().querySelectorAll('[data-poking-layer]')).toHaveLength(0)

    await press('Pausa')
    expect(section().querySelectorAll('[data-poking]')).toHaveLength(1)
    expect(section().querySelectorAll('[data-i-see-you]')).toHaveLength(1)
    expect(section().querySelectorAll('[data-still-here]')).toHaveLength(1)
    expect(section().querySelectorAll('[data-poking-layer]').length).toBe(8)
  })

  it('con movimiento reducido no hay controladores, aunque la escena esté tranquila', async () => {
    await open('reduce')
    expect(hosts().poking).toBeNull()
    expect(hosts().seeYou).toBeNull()
    expect(hosts().stillHere).toBeNull()
  })
})

describe.each([false, true])('al desmontar (StrictMode: %s)', (strict) => {
  it('con un gag en marcha y una pasada pendiente no queda nada vivo', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const before = vi.getTimerCount()
    const view = await open('full', strict)
    fireEvent.click(section().querySelector('[data-poking]')!)
    await flush()
    expect(
      section().querySelectorAll('[data-poking-layer]').length,
    ).toBeGreaterThan(0)

    view.unmount()
    act(() => vi.runOnlyPendingTimers())

    expect(vi.getTimerCount()).toBe(before)
    expect(errors).not.toHaveBeenCalled()
  })
})
