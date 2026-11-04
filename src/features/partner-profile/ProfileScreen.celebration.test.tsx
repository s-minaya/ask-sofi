import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MotionPreferenceProvider } from '../../app/providers/MotionPreference'
import {
  AREA_ANSWERS,
  PROFILE_AREAS,
  type ProfileArea,
} from '../../domain/partner-profile/partnerProfile'
import { readPartnerProfile } from '../../infrastructure/storage/partnerProfileStorage'
import motionTokens from '../../styles/tokens/_motion.scss?raw'
import {
  installIntersectionObserver,
  setIntersection,
  uninstallIntersectionObserver,
} from '../../test/intersection'
import { AREA_COPY, SHEET_COPY, answerLabel } from './profileCopy'
import { CELEBRATE_MS, SETTLE_MS } from './ProfileSheet'
import { ProfileScreen } from './ProfileScreen'
import { REACTION_MS } from './sofiGuide'

// «Guardar» queda fuera de la pantalla en portátiles bajos y en móvil (la barra
// fija solo se fija al llegar a las notas): completar las seis áreas guía a él con
// una indicación junto al diálogo, y su salto se da cuando «Guardar» está en
// pantalla, no antes. Nada se desplaza ni se guarda solo.
function renderScreen(onBack: () => void = () => {}) {
  return render(
    <MotionPreferenceProvider value="reduce">
      <ProfileScreen onBack={onBack} />
    </MotionPreferenceProvider>,
  )
}

const area = (name: string) =>
  within(screen.getByRole('navigation', { name: 'Las seis áreas' })).getByRole(
    'button',
    { name: new RegExp(name) },
  )
const option = (name: string) =>
  within(screen.getByRole('group', { name: /Pregunta \d de 6/ })).getByText(
    name,
  )
const save = () => screen.getByRole('button', { name: SHEET_COPY.save })
// El envoltorio de «Guardar»: lo que se observa para saber si está en pantalla.
const saveBox = () => save().parentElement as HTMLElement
const hint = () => screen.queryByRole('button', { name: SHEET_COPY.goSave })
const celebrating = () => document.querySelector('[data-celebrating]')
const stored = () => readPartnerProfile().status

async function answer(
  user: ReturnType<typeof userEvent.setup>,
  areas: readonly ProfileArea[],
) {
  for (const item of areas) {
    await user.click(area(AREA_COPY[item].label))
    await user.click(option(answerLabel(item, AREA_ANSWERS[item][0] as never)))
  }
}

// Todo el fichero corre con tiempo simulado: las esperas de la pantalla (la reacción
// de Sofi, el asentamiento de «Guardar» y el salto) se avanzan a mano, no se duermen.
// Testing Library drena cada acción de userEvent con un `setTimeout(0)` y solo avanza
// el reloj simulado si ve un `jest` global; Vitest no lo define y todo se quedaría
// esperando. Se expone ese único método solo durante cada test.
function simulateTime() {
  vi.useFakeTimers()
  vi.stubGlobal('jest', {
    advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
  })
}
function restoreTime() {
  vi.unstubAllGlobals()
  vi.useRealTimers()
}
// `advanceTimers` hace que la espera interna de userEvent corra con el reloj simulado,
// y `advance` lo mueve dentro de `act` para que React pinte lo que cambia.
const setupUser = () =>
  userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) })
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

// La reacción de Sofi («Seis de seis…») ocupa el pie del bocadillo 1,8 s; la
// indicación toma su sitio cuando acaba.
const afterReaction = () => advance(REACTION_MS + 100)
// «Guardar» entra en pantalla y la página se asienta.
const enter = async () => {
  act(() => setIntersection(saveBox(), 1))
  await advance(SETTLE_MS)
}
// Lo que hacía `findByRole` con 3 s de margen, avanzando el reloj simulado en lugar de
// esperar: `findBy*` no avanza los temporizadores simulados de Vitest.
const GO_SAVE_WAIT_MS = 3000
const GO_SAVE_STEP_MS = 100
async function goSave() {
  for (let waited = 0; waited < GO_SAVE_WAIT_MS; waited += GO_SAVE_STEP_MS) {
    const link = hint()
    if (link) return link
    await advance(GO_SAVE_STEP_MS)
  }
  return screen.getByRole('button', { name: SHEET_COPY.goSave })
}

describe('guiar a «Guardar»', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    simulateTime()
    installIntersectionObserver()
    Element.prototype.scrollIntoView = scrollIntoView
  })
  afterEach(() => {
    uninstallIntersectionObserver()
    scrollIntoView.mockReset()
    restoreTime()
  })

  it('con «Guardar» fuera de la pantalla, completar ofrece «Ir a guardar» en el diálogo', async () => {
    const user = setupUser()
    renderScreen()
    await answer(user, PROFILE_AREAS.slice(0, 5))
    await afterReaction()
    expect(hint()).not.toBeInTheDocument()

    await answer(user, PROFILE_AREAS.slice(5))

    // Primero lo dice Sofi; después, la indicación ocupa su lugar.
    const link = await goSave()
    // Junto al diálogo de Sofi: dentro de su bocadillo.
    expect(link.closest('figure')).not.toBeNull()
  })

  it('no se ofrece si «Guardar» ya está entero en la pantalla', async () => {
    const user = setupUser()
    renderScreen()
    await enter()

    await answer(user, PROFILE_AREAS)
    await afterReaction()

    expect(hint()).not.toBeInTheDocument()
  })

  it('aparece cuando «Guardar» sale de la pantalla y se retira cuando entra', async () => {
    const user = setupUser()
    renderScreen()
    await enter()
    await answer(user, PROFILE_AREAS)
    await afterReaction()
    expect(hint()).not.toBeInTheDocument()

    act(() => setIntersection(saveBox(), 0))
    expect(hint()).toBeInTheDocument()

    await enter()
    expect(hint()).not.toBeInTheDocument()
  })

  it('sigue ahí al cambiar de pregunta mientras quede algo por guardar', async () => {
    const user = setupUser()
    renderScreen()
    await answer(user, PROFILE_AREAS)
    await afterReaction()

    await user.click(area('Sarcasmo'))

    expect(await goSave()).toBeInTheDocument()
  })

  it('no se ofrece con cinco áreas aunque haya cambios', async () => {
    const user = setupUser()
    renderScreen()

    await answer(user, PROFILE_AREAS.slice(0, 5))
    await afterReaction()

    expect(hint()).not.toBeInTheDocument()
  })

  it('se retira al quitar una respuesta, al descartar y al guardar', async () => {
    const user = setupUser()
    renderScreen()
    await answer(user, PROFILE_AREAS)
    await afterReaction()
    expect(hint()).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Quitar respuesta' }))
    await afterReaction()
    expect(hint()).not.toBeInTheDocument()

    await answer(user, PROFILE_AREAS.slice(5))
    await afterReaction()
    expect(hint()).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: SHEET_COPY.discard }))
    await afterReaction()
    expect(hint()).not.toBeInTheDocument()

    await answer(user, PROFILE_AREAS)
    await afterReaction()
    expect(hint()).toBeInTheDocument()
    await user.click(save())
    await afterReaction()
    expect(hint()).not.toBeInTheDocument()
  })

  it('«Ir a guardar» lleva «Guardar» a la vista y le da el foco, sin guardar', async () => {
    const user = setupUser()
    renderScreen()
    await answer(user, PROFILE_AREAS)

    await user.click(await goSave())

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0]).toBe(save())
    expect(save()).toHaveFocus()
    // Alcanzar el botón no es pulsarlo: no hay guardado ni aviso.
    expect(stored()).toBe('missing')
    expect(screen.queryByText(SHEET_COPY.savedNotice)).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: SHEET_COPY.save }),
    ).toHaveLength(1)
  })

  it('con movimiento reducido el desplazamiento es inmediato', async () => {
    const user = setupUser()
    renderScreen()
    await answer(user, PROFILE_AREAS)

    await user.click(await goSave())

    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'center', behavior: 'auto' }),
    )
  })

  it('se puede alcanzar y activar con el teclado', async () => {
    const user = setupUser()
    renderScreen()
    await answer(user, PROFILE_AREAS)

    ;(await goSave()).focus()
    await user.keyboard('{Enter}')

    expect(save()).toHaveFocus()
  })

  it('no mueve la página al responder: solo ofrece', async () => {
    const user = setupUser()
    renderScreen()

    await answer(user, PROFILE_AREAS)
    await afterReaction()

    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})

describe('el salto de «Guardar», cuando está en pantalla', () => {
  beforeEach(() => {
    simulateTime()
    installIntersectionObserver()
  })
  afterEach(() => {
    uninstallIntersectionObserver()
    restoreTime()
  })

  it('espera: con «Guardar» fuera de pantalla no se activa', async () => {
    const user = setupUser()
    renderScreen()

    await answer(user, PROFILE_AREAS)

    expect(celebrating()).toBeNull()
  })

  it('se activa al entrar «Guardar» en pantalla, aunque la reacción ya acabara', async () => {
    const user = setupUser()
    renderScreen()
    await answer(user, PROFILE_AREAS)
    // La reacción de Sofi dura 1,8 s: se deja correr entera.
    await advance(2000)
    expect(celebrating()).toBeNull()

    await enter()

    expect(celebrating()).not.toBeNull()
  })

  it('si «Guardar» ya está en pantalla al completar, se activa en el momento', async () => {
    const user = setupUser()
    renderScreen()
    await enter()

    await answer(user, PROFILE_AREAS)

    expect(celebrating()).not.toBeNull()
  })

  it('es breve y no se repite al salir y volver a entrar', async () => {
    const user = setupUser()
    renderScreen()
    await answer(user, PROFILE_AREAS)
    await enter()
    expect(celebrating()).not.toBeNull()

    await advance(CELEBRATE_MS)
    expect(celebrating()).toBeNull()

    act(() => setIntersection(saveBox(), 0))
    await enter()
    await advance(CELEBRATE_MS)
    expect(celebrating()).toBeNull()
  })

  it('si «Guardar» sale de la pantalla a mitad, no se da por visto', async () => {
    const user = setupUser()
    renderScreen()
    await answer(user, PROFILE_AREAS)
    await enter()
    await advance(CELEBRATE_MS / 2)
    act(() => setIntersection(saveBox(), 0))
    expect(celebrating()).toBeNull()

    await enter()

    expect(celebrating()).not.toBeNull()
  })

  it('al guardar sin haberse visto, ya no se debe', async () => {
    const user = setupUser()
    renderScreen()
    await answer(user, PROFILE_AREAS)
    await user.click(save())

    await enter()

    expect(celebrating()).toBeNull()
  })

  it('una nueva finalización lo vuelve a activar', async () => {
    const user = setupUser()
    renderScreen()
    await enter()
    await answer(user, PROFILE_AREAS)
    await advance(CELEBRATE_MS + 100)
    expect(celebrating()).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Quitar respuesta' }))
    await answer(user, PROFILE_AREAS.slice(5))

    expect(celebrating()).not.toBeNull()
  })
})

describe('duración', () => {
  // El CSS y quien lo apaga tienen que hablar de lo mismo.
  it('coincide con la del token de movimiento', () => {
    const token = /--duration-celebrate:\s*([\d.]+)s/.exec(motionTokens)

    expect(Number(token?.[1]) * 1000).toBe(CELEBRATE_MS)
  })
})
