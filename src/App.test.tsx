import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('muestra el encabezado principal del producto', () => {
    render(<App />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ask Sofi' }),
    ).toBeInTheDocument()
  })
})
