import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { STACKED_LAYOUT_QUERY } from '../../../hooks/useStackedLayout'
import { setMediaQuery } from '../../../test/matchMedia'
import { ConsultationScreen } from './ConsultationScreen'

function renderScreen() {
  render(
    <ConsultationScreen
      message=""
      context=""
      onMessageChange={() => {}}
      onContextChange={() => {}}
      onSubmit={() => {}}
      onClear={() => {}}
    />,
  )
}

describe('ConsultationScreen · diálogo de Sofi', () => {
  it('a dos columnas muestra el texto completo', () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, false)
    renderScreen()

    expect(
      screen.getByText(/Pégalo tal cual, que aquí cada punto cuenta/),
    ).toBeInTheDocument()
  })

  it('en una columna muestra la variante corta del Design Lab', () => {
    setMediaQuery(STACKED_LAYOUT_QUERY, true)
    renderScreen()

    expect(
      screen.getByText(
        'A ver, cuéntamelo todo. ¿Qué te ha escrito exactamente?',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/que aquí cada punto cuenta/)).toBeNull()
  })
})
