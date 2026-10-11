import { render } from '@testing-library/react'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setMediaQuery } from '../test/matchMedia'
import { useScrollIntoViewOnRequest } from './useScrollIntoViewOnRequest'
import { STACKED_LAYOUT_QUERY } from './useStackedLayout'

const scrollIntoView = vi.fn()

beforeEach(() => {
  scrollIntoView.mockReset()
  Element.prototype.scrollIntoView = scrollIntoView
})

// El destino aparece cuando `available` se cumple, como un resultado asíncrono.
function Probe({
  request,
  available,
}: {
  request: number
  available: boolean
}) {
  const target = useRef<HTMLDivElement>(null)
  useScrollIntoViewOnRequest(target, { request, available })
  return available ? <div ref={target}>Intervención</div> : null
}

describe('useScrollIntoViewOnRequest', () => {
  it('no hace nada sin petición', () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, true)

    render(<Probe request={0} available />)

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('espera a que el contenido dinámico exista y entonces se desplaza una vez', () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    const view = render(<Probe request={1} available={false} />)
    expect(scrollIntoView).not.toHaveBeenCalled()

    view.rerender(<Probe request={1} available />)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    view.rerender(<Probe request={1} available />)
    view.rerender(<Probe request={1} available={false} />)
    view.rerender(<Probe request={1} available />)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('una petición nueva se atiende aunque el destino ya estuviera', () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    const view = render(<Probe request={1} available />)

    view.rerender(<Probe request={2} available />)

    expect(scrollIntoView).toHaveBeenCalledTimes(2)
  })

  it('a varias columnas atiende la petición sin desplazar, y no la aplaza', () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, false)
    const view = render(<Probe request={1} available />)

    // Pasar a una columna después no debe hacer saltar la página por una petición antigua.
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    view.rerender(<Probe request={1} available />)

    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
