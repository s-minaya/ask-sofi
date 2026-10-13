import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../../infrastructure/storage/storageKeys'
import { clearUserData } from '../../infrastructure/storage/userData'
import { ProvisionalConsultation } from './ProvisionalConsultation'

const message = () =>
  screen.getByRole('textbox', { name: 'Pégalo tal cual te llegó' })
const context = () =>
  screen.getByRole('textbox', { name: 'Y ahora, el salseo' })
const storedDraft = () =>
  window.sessionStorage.getItem(STORAGE_KEYS.consultationDraft)

// El almacenamiento escribe de forma diferida; el tiempo se controla a mano.
function typeText(field: HTMLElement, value: string) {
  fireEvent.change(field, { target: { value } })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ProvisionalConsultation · persistencia de la consulta', () => {
  it('arranca vacía cuando no hay nada guardado', () => {
    render(<ProvisionalConsultation onOpenProfile={() => {}} />)

    expect(message()).toHaveValue('')
    expect(context()).toHaveValue('')
  })

  it('recupera mensaje y contexto tras recargar durante la sesión', () => {
    vi.useFakeTimers()
    const first = render(<ProvisionalConsultation onOpenProfile={() => {}} />)
    typeText(message(), 'Vale.')
    typeText(context(), 'Veníamos de discutir')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    first.unmount()

    render(<ProvisionalConsultation onOpenProfile={() => {}} />)

    expect(message()).toHaveValue('Vale.')
    expect(context()).toHaveValue('Veníamos de discutir')
  })

  it('guarda con retardo, no en cada pulsación', async () => {
    vi.useFakeTimers()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    render(<ProvisionalConsultation onOpenProfile={() => {}} />)

    // Presentar la invitación al expediente también escribe: aquí, solo el borrador.
    const draftWrites = () =>
      setItem.mock.calls.filter(
        ([key]) => key === STORAGE_KEYS.consultationDraft,
      )

    for (const text of ['V', 'Va', 'Val', 'Vale']) typeText(message(), text)
    expect(draftWrites()).toHaveLength(0)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(draftWrites()).toHaveLength(1)
    expect(JSON.parse(storedDraft() ?? '').data).toEqual({
      message: 'Vale',
      context: '',
    })
    setItem.mockRestore()
  })

  it('guarda lo pendiente al salir de la pantalla', () => {
    vi.useFakeTimers()
    const view = render(<ProvisionalConsultation onOpenProfile={() => {}} />)
    typeText(message(), 'Vale')
    expect(storedDraft()).toBeNull()

    view.unmount()

    expect(JSON.parse(storedDraft() ?? '').data.message).toBe('Vale')
  })

  it('guarda lo pendiente cuando la página se oculta', () => {
    vi.useFakeTimers()
    render(<ProvisionalConsultation onOpenProfile={() => {}} />)
    typeText(message(), 'Vale')

    window.dispatchEvent(new Event('pagehide'))

    expect(JSON.parse(storedDraft() ?? '').data.message).toBe('Vale')
  })

  it('no deja rastro de la consulta en localStorage', () => {
    vi.useFakeTimers()
    const view = render(<ProvisionalConsultation onOpenProfile={() => {}} />)
    typeText(message(), 'Vale')
    typeText(context(), 'Ayer')
    view.unmount()

    // Solo el registro de la invitación al expediente, nunca el texto de la consulta.
    expect(Object.keys(window.localStorage)).toEqual([STORAGE_KEYS.onboarding])
  })

  it('«Borrar todo» vacía el formulario y el borrador guardado', async () => {
    const user = userEvent.setup()
    window.sessionStorage.setItem(
      STORAGE_KEYS.consultationDraft,
      JSON.stringify({
        version: 1,
        data: { message: 'Vale', context: 'Ayer' },
      }),
    )
    const view = render(<ProvisionalConsultation onOpenProfile={() => {}} />)
    expect(message()).toHaveValue('Vale')

    await user.click(screen.getByRole('button', { name: 'Borrar todo' }))

    expect(message()).toHaveValue('')
    expect(context()).toHaveValue('')
    expect(storedDraft()).toBeNull()
    view.unmount()
    render(<ProvisionalConsultation onOpenProfile={() => {}} />)
    expect(message()).toHaveValue('')
  })

  it('no recupera un borrador que se había pedido borrar mientras escribía', async () => {
    vi.useFakeTimers()
    const view = render(<ProvisionalConsultation onOpenProfile={() => {}} />)
    typeText(message(), 'Vale')

    fireEvent.click(screen.getByRole('button', { name: 'Borrar todo' }))
    view.unmount()

    expect(storedDraft()).toBeNull()
  })

  it('el borrado completo de datos vacía también lo que hay en pantalla', () => {
    vi.useFakeTimers()
    render(<ProvisionalConsultation onOpenProfile={() => {}} />)
    typeText(message(), 'Vale')
    typeText(context(), 'Ayer')
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    act(() => clearUserData())

    expect(message()).toHaveValue('')
    expect(context()).toHaveValue('')
    expect(storedDraft()).toBeNull()
  })

  it('ignora un borrador corrupto o de otra versión', () => {
    window.sessionStorage.setItem(STORAGE_KEYS.consultationDraft, '{roto')
    const first = render(<ProvisionalConsultation onOpenProfile={() => {}} />)
    expect(message()).toHaveValue('')
    first.unmount()

    window.sessionStorage.setItem(
      STORAGE_KEYS.consultationDraft,
      JSON.stringify({ version: 7, data: { message: 'futuro' } }),
    )
    render(<ProvisionalConsultation onOpenProfile={() => {}} />)
    expect(message()).toHaveValue('')
  })

  it('sigue permitiendo escribir y enviar con el almacenamiento bloqueado', async () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('lleno', 'QuotaExceededError')
      })
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('bloqueado')
      })
    const user = userEvent.setup()
    const view = render(<ProvisionalConsultation onOpenProfile={() => {}} />)

    await user.type(message(), 'Vale')
    expect(message()).toHaveValue('Vale')
    await user.click(screen.getByRole('button', { name: /Leer entre líneas/ }))

    expect(screen.getByText(/todavía está calentando motores/)).toBeVisible()
    expect(() => view.unmount()).not.toThrow()
    setItem.mockRestore()
    getItem.mockRestore()
  })
})
