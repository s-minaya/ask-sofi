import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STACKED_LAYOUT_QUERY } from '../../hooks/useStackedLayout'
import { setMediaQuery } from '../../test/matchMedia'
import { ProvisionalConsultation } from './ProvisionalConsultation'

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

// jsdom no implementa scrollIntoView: se sustituye para observar cuándo y cómo se pide.
const scrollIntoView = vi.fn()

beforeEach(() => {
  scrollIntoView.mockReset()
  Element.prototype.scrollIntoView = scrollIntoView
})

afterEach(() => {
  vi.useRealTimers()
})

const message = () =>
  screen.getByRole('textbox', { name: 'Pégalo tal cual te llegó' })
const context = () =>
  screen.getByRole('textbox', { name: 'Y ahora, el salseo' })
const read = () => screen.getByRole('button', { name: /Leer entre líneas/ })

describe('ProvisionalConsultation · aviso de demostración', () => {
  it('muestra el aviso aprobado de demostración, sin analizar nada', async () => {
    const user = userEvent.setup()
    render(<ProvisionalConsultation />)

    await user.type(message(), 'Vale.')
    await user.click(read())

    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent('Sofi todavía está calentando motores')
    expect(notice).toHaveTextContent(
      'Esta es una demostración. Tu mensaje no se ha enviado ni analizado.',
    )
  })

  it('no hay intervención ni desplazamiento si falta el mensaje', async () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    const user = userEvent.setup()
    render(<ProvisionalConsultation />)

    await user.click(read())

    expect(screen.getByText(/Pega el mensaje/)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})

describe('ProvisionalConsultation · desplazamiento', () => {
  it('en una columna lleva al aviso una sola vez, con animación', async () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    const user = userEvent.setup()
    render(<ProvisionalConsultation />)

    await user.type(message(), 'Vale.')
    await user.click(read())

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'start',
      behavior: 'smooth',
    })
    // El destino es el contenedor de la intervención, no otro punto de la página.
    const target = scrollIntoView.mock.contexts[0] as HTMLElement
    expect(target).toContainElement(screen.getByRole('status'))
  })

  it('con movimiento reducido el desplazamiento es inmediato', async () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    setMediaQuery(REDUCED_QUERY, true)
    const user = userEvent.setup()
    render(<ProvisionalConsultation />)

    await user.type(message(), 'Vale.')
    await user.click(read())

    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'start',
      behavior: 'auto',
    })
  })

  it('a varias columnas no fuerza el desplazamiento', async () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, false)
    const user = userEvent.setup()
    render(<ProvisionalConsultation />)

    await user.type(message(), 'Vale.')
    await user.click(read())

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('no repite el salto al seguir editando, al redimensionar ni al cambiar de preferencia', async () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    const user = userEvent.setup()
    render(<ProvisionalConsultation />)
    await user.type(message(), 'Vale.')
    await user.click(read())
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    await user.type(context(), 'Ayer discutimos')
    act(() => setMediaQuery(STACKED_LAYOUT_QUERY, false))
    act(() => setMediaQuery(STACKED_LAYOUT_QUERY, true))
    act(() => setMediaQuery(REDUCED_QUERY, true))

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('cada nueva petición de lectura vuelve a llevar a la intervención', async () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    const user = userEvent.setup()
    render(<ProvisionalConsultation />)
    await user.type(message(), 'Vale.')

    await user.click(read())
    await user.click(read())

    expect(scrollIntoView).toHaveBeenCalledTimes(2)
  })

  it('no mueve el foco: el botón sigue activo y el aviso se anuncia como estado', async () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    const user = userEvent.setup()
    render(<ProvisionalConsultation />)
    await user.type(message(), 'Vale.')

    await user.click(read())

    expect(read()).toHaveFocus()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('con el almacenamiento y el audio sin efecto sigue desplazando', () => {
    vi.useFakeTimers()
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    render(<ProvisionalConsultation />)

    fireEvent.change(message(), { target: { value: 'Vale.' } })
    fireEvent.click(read())

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })
})
