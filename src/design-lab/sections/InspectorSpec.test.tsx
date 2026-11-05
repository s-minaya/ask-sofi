import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MotionPreferenceProvider } from '../../app/providers/MotionPreference'
import { resetSpriteLoader } from '../../components/sofi/SofiSprite/loadSprite'
import sofiSpriteStyles from '../../components/sofi/SofiSprite/SofiSprite.module.scss'
import { className as blinkClass } from '../../components/sofi/sprites/sofi-blink'
import {
  PRODUCTION_RATES,
  clearSessionRates,
  rateFor,
  subscribeToRates,
} from '../../components/sofi/visual/rates'
import {
  SOFI_REGISTRY,
  type SofiOwnerModule,
} from '../../components/sofi/visual/registry'
import {
  SOFI_ANIMATION_IDS,
  type SofiAnimationId,
} from '../../components/sofi/visual/types'
import { readPreferences } from '../../infrastructure/storage/preferencesStorage'
import { RESOURCE_INFO, availability } from '../spriteInspector'
import { InspectorSpec } from './InspectorSpec'

// T058: el inspector pinta con el componente real y sus controladores. Aquí se simulan solo los
// módulos dueños y la decodificación (como en `SofiSprite`) y las Web Animations, que jsdom no
// trae. La sincronía real en un navegador va en VT6 y en la comprobación del registro.

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
function stubOwners() {
  for (const id of SOFI_ANIMATION_IDS) {
    // Los de producción se simulan; `eureka` y `suspicious` usan el cargador real del Lab.
    if (id === 'eureka' || id === 'suspicious' || !SOFI_REGISTRY[id].load)
      continue
    originalLoads.set(id, SOFI_REGISTRY[id].load)
    SOFI_REGISTRY[id].load = () =>
      Promise.resolve<SofiOwnerModule>({
        className: `${id}-owner`,
        strips: { [`/src/styles/sprites/${id}.webp`]: `/assets/${id}.webp` },
      })
  }
}

beforeEach(() => {
  vi.stubGlobal('Image', FakeImage)
  stubOwners()
})

afterEach(() => {
  cleanup()
  for (const [id, load] of originalLoads)
    SOFI_REGISTRY[id].load = load as (typeof SOFI_REGISTRY)[typeof id]['load']
  originalLoads.clear()
  resetSpriteLoader()
  clearSessionRates()
  vi.unstubAllGlobals()
})

async function open(id?: SofiAnimationId) {
  const view = render(
    <MotionPreferenceProvider value="full">
      <InspectorSpec />
    </MotionPreferenceProvider>,
  )
  await flush()
  if (id) await choose(id)
  return view
}

async function choose(id: SofiAnimationId) {
  fireEvent.click(
    within(screen.getByRole('group', { name: 'Recurso' })).getByRole('button', {
      name: id,
    }),
  )
  await flush()
}

// El escenario lleva el estado de congelación: es lo que ven y mide el resto de pruebas.
const stage = () => document.querySelector('[data-frozen]') as HTMLElement
// El elemento que pinta `SofiSprite` (o el anfitrión de un gag).
const painted = () => stage().firstElementChild as HTMLElement
const speed = () => screen.getByLabelText('Velocidad') as HTMLInputElement
const compare = () => screen.getByLabelText('Comparar con 1×')
const press = async (name: string) => {
  fireEvent.click(screen.getByRole('button', { name }))
  await flush()
}
const ficha = () => within(screen.getByRole('region', { name: /Ficha/ }))

describe('InspectorSpec · selector y ficha', () => {
  it('ofrece los 14 recursos y empieza en sofi-blink', async () => {
    await open()
    const group = within(screen.getByRole('group', { name: 'Recurso' }))
    const buttons = group.getAllByRole('button')

    expect(buttons.map((button) => button.textContent)).toEqual([
      ...SOFI_ANIMATION_IDS,
    ])
    expect(group.getByRole('button', { name: 'sofi-blink' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      buttons.filter((b) => b.getAttribute('aria-pressed') === 'true'),
    ).toHaveLength(1)
  })

  it.each(SOFI_ANIMATION_IDS)(
    'la ficha de %s dice nombre, intención, tipo de reproducción, activación y disponibilidad',
    async (id) => {
      await open(id)
      const info = RESOURCE_INFO[id]

      expect(
        screen.getByRole('heading', { level: 3, name: new RegExp(id) }),
      ).toHaveTextContent(info.number)
      expect(ficha().getByText(info.intent)).toBeInTheDocument()
      expect(ficha().getByText(info.activation)).toBeInTheDocument()
      const types = { loop: 'Bucle', once: 'Una pasada', machine: 'Máquina' }
      expect(
        ficha().getByText(new RegExp(`^${types[SOFI_REGISTRY[id].playback]}`)),
      ).toBeVisible()
      expect(ficha().getByText(availability(id))).toBeVisible()
    },
  )

  it('pinta eureka y suspicious con el cargador del Lab, no con la estática', async () => {
    for (const id of ['eureka', 'suspicious'] as const) {
      await open(id)
      expect(painted()).not.toHaveClass(sofiSpriteStyles.fallback)
      cleanup()
      resetSpriteLoader()
    }
  })

  it('pinta un recurso de producción con su clase una vez cargado', async () => {
    await open('sofing')
    expect(painted()).toHaveClass('sofing-owner')
  })
})

describe('InspectorSpec · velocidad', () => {
  it('es un control de 0,25× a 4× en pasos de 0,25× que parte de 1×', async () => {
    await open()
    expect(speed()).toHaveAttribute('min', '0.25')
    expect(speed()).toHaveAttribute('max', '4')
    expect(speed()).toHaveAttribute('step', '0.25')
    expect(speed().value).toBe('1')
    expect(screen.getByText('1×', { selector: 'output' })).toBeInTheDocument()
    expect(rateFor('sofi-blink')).toBe(1)
  })

  it('aplica la velocidad al recurso que se ve y la escribe con coma', async () => {
    await open('sofing')
    fireEvent.change(speed(), { target: { value: '0.5' } })

    expect(rateFor('sofing')).toBe(0.5)
    expect(screen.getByText('0,5×', { selector: 'output' })).toBeInTheDocument()
  })

  it('conserva la velocidad de cada recurso al cambiar de uno a otro', async () => {
    await open('sofing')
    fireEvent.change(speed(), { target: { value: '2' } })
    await choose('rolling')
    expect(speed().value).toBe('1')
    fireEvent.change(speed(), { target: { value: '0.25' } })

    await choose('sofing')
    expect(speed().value).toBe('2')
    expect(rateFor('sofing')).toBe(2)
    await choose('rolling')
    expect(speed().value).toBe('0.25')
    expect(rateFor('rolling')).toBe(0.25)
  })

  it('solo sobrescribe la velocidad del recurso que se mira', async () => {
    await open('sofing')
    fireEvent.change(speed(), { target: { value: '2' } })
    await choose('rolling')

    expect(rateFor('sofing')).toBe(1)
  })

  it('al salir del inspector no deja ninguna velocidad de sesión', async () => {
    const view = await open('sofing')
    fireEvent.change(speed(), { target: { value: '3' } })
    expect(rateFor('sofing')).toBe(3)

    view.unmount()
    expect(rateFor('sofing')).toBe(1)
  })

  it('no toca las preferencias públicas, el almacenamiento ni las velocidades de producción', async () => {
    const preferences = readPreferences()
    const production = JSON.stringify(PRODUCTION_RATES)
    await open('sofing')

    fireEvent.change(speed(), { target: { value: '4' } })
    fireEvent.click(compare())
    await press('Pausar')
    await press('Nuevo evento')

    expect(readPreferences()).toEqual(preferences)
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
    expect(JSON.stringify(PRODUCTION_RATES)).toBe(production)
  })
})

describe('InspectorSpec · poking conserva su velocidad original', () => {
  it('no ofrece ni velocidad ni comparar con 1×, y avisa de por qué', async () => {
    await open('poking')

    expect(screen.queryByLabelText('Velocidad')).toBeNull()
    expect(screen.queryByLabelText('Comparar con 1×')).toBeNull()
    expect(screen.getByText(/velocidad original/i)).toBeInTheDocument()
    // El resto de controles siguen ahí.
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Nuevo evento' }),
    ).toBeInTheDocument()
  })

  it('no escribe ninguna velocidad de sesión mientras se mira ni al operar', async () => {
    await open()
    const changed = vi.fn()
    const unsubscribe = subscribeToRates(changed)

    // Salir de sofi-blink limpia sus velocidades: un aviso. Poking no añade ninguno.
    await choose('poking')
    expect(changed).toHaveBeenCalledTimes(1)
    await press('Pausar')
    await press('Reproducir')
    await press('Reiniciar')
    await press('Nuevo evento')

    expect(changed).toHaveBeenCalledTimes(1)
    expect(rateFor('poking')).toBe(1)
    unsubscribe()
  })

  it.each(SOFI_ANIMATION_IDS.filter((id) => id !== 'poking'))(
    'los otros 13 conservan sus controles: %s',
    async (id) => {
      await open(id)
      expect(speed()).toBeInTheDocument()
      expect(compare()).toBeInTheDocument()
    },
  )
})

describe('InspectorSpec · comparar con 1×', () => {
  it('pasa a 1× sin perder la velocidad elegida y la recupera al dejar de comparar', async () => {
    await open('sofing')
    fireEvent.change(speed(), { target: { value: '0.5' } })

    fireEvent.click(compare())
    expect(rateFor('sofing')).toBe(1)
    expect(speed().value).toBe('0.5')
    expect(compare()).toBeChecked()

    fireEvent.click(compare())
    expect(rateFor('sofing')).toBe(0.5)
    expect(speed().value).toBe('0.5')
  })

  it('es temporal: se pierde al cambiar de recurso y la velocidad sigue guardada', async () => {
    await open('sofing')
    fireEvent.change(speed(), { target: { value: '0.5' } })
    fireEvent.click(compare())

    await choose('rolling')
    await choose('sofing')

    expect(compare()).not.toBeChecked()
    expect(rateFor('sofing')).toBe(0.5)
  })

  it('elegir otra velocidad mientras se compara no cambia lo que se ve hasta dejar de comparar', async () => {
    await open('sofing')
    fireEvent.click(compare())
    fireEvent.change(speed(), { target: { value: '2' } })

    expect(rateFor('sofing')).toBe(1)
    fireEvent.click(compare())
    expect(rateFor('sofing')).toBe(2)
  })
})

describe('InspectorSpec · reproducción', () => {
  it('pausa y reanuda todo lo que se pinta, y lo recuerda por recurso', async () => {
    await open('sofing')
    expect(stage()).toHaveAttribute('data-frozen', 'false')

    await press('Pausar')
    expect(stage()).toHaveAttribute('data-frozen', 'true')
    expect(screen.queryByRole('button', { name: 'Pausar' })).toBeNull()

    await choose('rolling')
    expect(stage()).toHaveAttribute('data-frozen', 'false')
    await choose('sofing')
    expect(stage()).toHaveAttribute('data-frozen', 'true')

    await press('Reproducir')
    expect(stage()).toHaveAttribute('data-frozen', 'false')
  })

  it('reiniciar vuelve a empezar lo que se ve, también una pasada ya terminada, y conserva pausa y velocidad', async () => {
    await open('favoriting')
    fireEvent.change(speed(), { target: { value: '0.5' } })
    await press('Pausar')
    const first = painted()
    fireEvent(first, new Event('animationend'))
    await flush()

    await press('Reiniciar')

    expect(painted()).not.toBe(first)
    expect(painted()).toHaveClass('favoriting-owner')
    expect(stage()).toHaveAttribute('data-frozen', 'true')
    expect(rateFor('favoriting')).toBe(0.5)
  })

  it('reiniciar no saca a Sofi de una cancelación: eso lo hace un evento nuevo', async () => {
    await open('sofing')
    await press('Cancelar a mitad')
    const blink = painted()

    await press('Reiniciar')

    expect(painted()).not.toBe(blink)
    expect(painted()).toHaveClass(blinkClass)
    expect(painted()).not.toHaveClass('sofing-owner')
  })

  it('un evento nuevo rehace la instancia desde el principio, también en marcha', async () => {
    await open('sofing')
    const first = painted()

    await press('Nuevo evento')
    const second = painted()
    expect(second).not.toBe(first)
    expect(second).toHaveClass('sofing-owner')

    await press('Nuevo evento')
    expect(painted()).not.toBe(second)
  })

  it('cancela a mitad: cede a sofi-blink hasta el siguiente evento', async () => {
    await open('sofing')
    expect(painted()).toHaveClass('sofing-owner')

    await press('Cancelar a mitad')
    expect(painted()).toHaveClass(blinkClass)
    expect(painted()).not.toHaveClass('sofing-owner')
    expect(ficha().getByText(/Cancelado/)).toBeVisible()

    await press('Nuevo evento')
    expect(painted()).toHaveClass('sofing-owner')
    expect(ficha().queryByText(/Cancelado/)).toBeNull()
  })

  it('no ofrece cancelar sofi-blink, que ya es el reposo', async () => {
    await open()
    expect(
      screen.getByRole('button', { name: 'Cancelar a mitad' }),
    ).toHaveAttribute('aria-disabled', 'true')
  })
})

describe('InspectorSpec · bucle frente a pasada única', () => {
  const view = () => within(screen.getByRole('group', { name: 'Ver como' }))

  it('cada recurso parte de su reproducción funcional', async () => {
    await open('sofing')
    expect(view().getByRole('button', { name: 'Bucle' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await choose('favoriting')
    expect(view().getByRole('button', { name: 'Una pasada' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('un bucle visto como pasada única se queda quieto tras su primera vuelta', async () => {
    await open('sofing')
    fireEvent.click(view().getByRole('button', { name: 'Una pasada' }))
    await flush()
    expect(stage()).toHaveAttribute('data-frozen', 'false')

    fireEvent(painted(), new Event('animationiteration'))
    await flush()
    expect(stage()).toHaveAttribute('data-frozen', 'true')
    expect(ficha().getByText(/Primera pasada completada/)).toBeVisible()

    await press('Nuevo evento')
    expect(stage()).toHaveAttribute('data-frozen', 'false')
  })

  it('una pasada vista como bucle vuelve a empezar al terminar', async () => {
    await open('favoriting')
    fireEvent.click(view().getByRole('button', { name: 'Bucle' }))
    await flush()
    const first = painted()

    fireEvent(first, new Event('animationend'))
    await flush()
    expect(painted()).not.toBe(first)
  })

  it('una pasada vista como pasada se queda en su último fotograma', async () => {
    await open('favoriting')
    const first = painted()

    fireEvent(first, new Event('animationend'))
    await flush()
    expect(painted()).toBe(first)
  })

  it('una máquina no ofrece la elección: la dirige su controlador', async () => {
    await open('poking')
    expect(screen.queryByRole('group', { name: 'Ver como' })).toBeNull()
    expect(ficha().getByText(/controlador/i)).toBeVisible()
  })
})

describe('InspectorSpec · máquinas de estados', () => {
  it.each([
    ['poking', 'poking'],
    ['are-u-still-here', 'stillHere'],
    ['i-see-you', 'iSeeYou'],
  ] as const)(
    'monta el controlador real de %s sobre el anfitrión de sofi-blink y lo destruye al irse',
    async (id, attribute) => {
      await open(id)
      expect(painted()).toHaveClass(blinkClass, `${id}-owner`)
      expect(painted().dataset[attribute]).toBeDefined()

      const host = painted()
      await choose('sofi-blink')
      expect(host.dataset[attribute]).toBeUndefined()
      expect(host.isConnected).toBe(false)
    },
  )

  it('un evento nuevo rehace la máquina: otro anfitrión y un controlador nuevo en reposo', async () => {
    await open('poking')
    const host = painted()
    fireEvent.click(host)
    expect(host.dataset.poking).toBe('curious')

    await press('Nuevo evento')

    expect(painted()).not.toBe(host)
    expect(host.dataset.poking).toBeUndefined()
    expect(painted().dataset.poking).toBe('idle')
  })

  it('cancelar una máquina destruye su controlador y deja a sofi-blink', async () => {
    await open('poking')
    const host = painted()

    await press('Cancelar a mitad')
    expect(host.dataset.poking).toBeUndefined()
    expect(painted()).toHaveClass(blinkClass)
    expect(painted().dataset.poking).toBeUndefined()
  })

  it('pausa el controlador junto con las animaciones: en pausa, pinchar no cambia su estado', async () => {
    await open('poking')
    const host = painted()
    await press('Pausar')

    expect(stage()).toHaveAttribute('data-frozen', 'true')
    fireEvent.click(host)
    expect(host.dataset.poking).toBe('idle')

    await press('Reproducir')
    fireEvent.click(host)
    expect(host.dataset.poking).toBe('curious')
  })
})
