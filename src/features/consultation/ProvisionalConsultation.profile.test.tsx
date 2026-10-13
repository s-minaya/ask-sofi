import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isProfileInvitationPending,
  markProfileInvitationPresented,
} from '../../infrastructure/storage/onboardingStorage'
import {
  deletePartnerProfile,
  savePartnerProfile,
} from '../../infrastructure/storage/partnerProfileStorage'
import { localArea } from '../../infrastructure/storage/storageAreas'
import { STORAGE_KEYS } from '../../infrastructure/storage/storageKeys'
import { clearUserData } from '../../infrastructure/storage/userData'
import { ProvisionalConsultation } from './ProvisionalConsultation'

// 004-spec §1 y plan §4: invitación única y no bloqueante, y acceso permanente
// al expediente con independencia de que haya perfil guardado.
const INVITATION = 'Espera, antes de empezar… ¿me das un poco de contexto?'
const SAVED = { answers: { sarcasm: 'often' as const }, notes: '' }

const renderConsultation = (onOpenProfile = vi.fn()) => {
  const view = render(<ProvisionalConsultation onOpenProfile={onOpenProfile} />)
  return { ...view, onOpenProfile }
}
// Recargar la página: la copia en memoria del almacenamiento se pierde.
const reload = () => localArea.resetMemory()

afterEach(() => {
  vi.restoreAllMocks()
})

describe('invitación al expediente', () => {
  it('en la primera visita se ofrece sin bloquear la consulta', async () => {
    const user = userEvent.setup()
    renderConsultation()

    expect(screen.getByText(INVITATION)).toBeInTheDocument()
    const message = screen.getByRole('textbox', {
      name: 'Pégalo tal cual te llegó',
    })
    await user.type(message, 'Vale.')
    expect(message).toHaveValue('Vale.')
    expect(
      screen.getByRole('button', { name: 'Leer entre líneas' }),
    ).toBeEnabled()
  })

  it('es el primer diálogo de Sofi, antes del formulario, y es una sola Sofi', () => {
    renderConsultation()

    // Mientras pide contexto, la región lo dice: no «está escuchando».
    const dialog = screen.getByRole('complementary', {
      name: 'Sofi te pide contexto',
    })
    const invitation = within(dialog).getByText(INVITATION)
    const message = screen.getByRole('textbox', {
      name: 'Pégalo tal cual te llegó',
    })
    expect(
      invitation.compareDocumentPosition(message) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    // La que se asoma sustituye al retrato: no hay otra Sofi en la página.
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(within(dialog).getAllByRole('img')).toHaveLength(1)
    expect(
      within(dialog).getByText(/Son seis preguntas opcionales/),
    ).toBeInTheDocument()
  })

  it('queda registrada al presentarse, no al responderla', () => {
    expect(isProfileInvitationPending()).toBe(true)

    renderConsultation()

    expect(isProfileInvitationPending()).toBe(false)
    expect(window.localStorage.getItem(STORAGE_KEYS.onboarding)).not.toBeNull()
  })

  it('no reaparece al recargar la página', () => {
    const first = renderConsultation()
    first.unmount()
    reload()

    renderConsultation()

    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument()
  })

  it('«Ahora no» la retira y no vuelve', async () => {
    const user = userEvent.setup()
    const first = renderConsultation()

    await user.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument()
    // El foco no se pierde: pasa a lo que Sofi dice a continuación.
    expect(screen.getByText(/A ver, cuéntamelo todo/)).toHaveFocus()

    first.unmount()
    reload()
    renderConsultation()
    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument()
  })

  it('no vuelve al volver a la consulta en la misma sesión', () => {
    const first = renderConsultation()
    first.unmount()

    renderConsultation()

    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument()
  })

  it('eliminar el expediente no la devuelve', () => {
    renderConsultation().unmount()
    savePartnerProfile(SAVED)
    deletePartnerProfile()
    reload()

    renderConsultation()

    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument()
  })

  it('el borrado global la devuelve a su estado inicial', () => {
    renderConsultation().unmount()
    clearUserData()

    renderConsultation()

    expect(screen.getByText(INVITATION)).toBeInTheDocument()
  })

  it('con el almacenamiento bloqueado no se repite durante la sesión', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError')
    })
    renderConsultation().unmount()

    renderConsultation()

    expect(screen.queryByText(INVITATION)).not.toBeInTheDocument()
  })

  it('«Responder preguntas» abre la ficha', async () => {
    const user = userEvent.setup()
    const { onOpenProfile } = renderConsultation()

    await user.click(
      screen.getByRole('button', { name: 'Responder preguntas' }),
    )

    expect(onOpenProfile).toHaveBeenCalledTimes(1)
  })
})

describe('acceso permanente al expediente', () => {
  it('existe sin perfil guardado, también tras rechazar la invitación', async () => {
    const user = userEvent.setup()
    renderConsultation()
    await user.click(screen.getByRole('button', { name: 'Ahora no' }))

    // En el pie del diálogo de Sofi, que ahora sí está escuchando.
    const dialog = screen.getByRole('complementary', {
      name: 'Sofi está escuchando',
    })
    const access = within(dialog).getByRole('button', {
      name: 'Abrir expediente',
    })
    expect(access).toBeVisible()
    await user.click(access)
  })

  it('con un expediente guardado ofrece editarlo', async () => {
    const user = userEvent.setup()
    savePartnerProfile(SAVED)
    renderConsultation().unmount()
    const { onOpenProfile } = renderConsultation()

    expect(
      screen.queryByRole('button', { name: 'Abrir expediente' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Editar expediente' }))
    expect(onOpenProfile).toHaveBeenCalledTimes(1)
  })

  it('refleja los cambios del expediente sin recargar', () => {
    renderConsultation().unmount()
    renderConsultation()
    expect(
      screen.getByRole('button', { name: 'Abrir expediente' }),
    ).toBeVisible()

    act(() => {
      savePartnerProfile(SAVED)
    })
    expect(
      screen.getByRole('button', { name: 'Editar expediente' }),
    ).toBeVisible()

    act(() => {
      deletePartnerProfile()
    })
    expect(
      screen.getByRole('button', { name: 'Abrir expediente' }),
    ).toBeVisible()
  })

  it('con datos del expediente ilegibles no lo da por guardado', () => {
    markProfileInvitationPresented()
    window.localStorage.setItem(STORAGE_KEYS.partnerProfile, '{no es json')

    renderConsultation()

    expect(
      screen.getByRole('button', { name: 'Abrir expediente' }),
    ).toBeVisible()
  })

  it('la consulta no pierde su flujo: tras «Leer entre líneas» el acceso sigue ahí', async () => {
    const user = userEvent.setup()
    renderConsultation()
    await user.click(screen.getByRole('button', { name: 'Ahora no' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Pégalo tal cual te llegó' }),
      'Vale.',
    )

    await user.click(screen.getByRole('button', { name: 'Leer entre líneas' }))

    expect(
      screen.getByText('Sofi todavía está calentando motores'),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Abrir expediente' }),
    ).toBeVisible()
  })
})
