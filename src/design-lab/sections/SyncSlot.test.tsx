import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SyncSlot } from './SyncSlot'

// El sprite real necesita módulos y tiras; aquí solo importa qué recurso se le pide.
vi.mock('../../components/sofi/SofiSprite/SofiSprite', () => ({
  SofiSprite: ({ animation }: { animation: string }) => (
    <span data-sprite={animation} />
  ),
}))

const sprite = (container: HTMLElement) =>
  container.querySelector('[data-sprite]')?.getAttribute('data-sprite')

// T063: el hueco de 4.3 pinta lo que dice `selectVisual` (el contrato de plan 008 §5.1), sin
// decidir nada propio: la pose de las pausas la aprueba AV5, no esta pieza.
describe('SyncSlot', () => {
  it('mientras Sofi habla pinta talking', () => {
    const { container } = render(<SyncSlot speaking />)
    expect(sprite(container)).toBe('talking')
  })

  it('cuando calla pinta el reposo que da selectVisual, sin una pose propia', () => {
    const { container } = render(<SyncSlot speaking={false} />)
    expect(sprite(container)).toBe('sofi-blink')
  })

  it('cambia de recurso con el booleano, en los dos sentidos', () => {
    const { container, rerender } = render(<SyncSlot speaking={false} />)
    rerender(<SyncSlot speaking />)
    expect(sprite(container)).toBe('talking')
    rerender(<SyncSlot speaking={false} />)
    expect(sprite(container)).toBe('sofi-blink')
  })

  it('es decorativo: el significado lo da el texto, no el hueco', () => {
    const { container } = render(<SyncSlot speaking />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('marca si habla, para el estilo del marco', () => {
    const { container, rerender } = render(<SyncSlot speaking />)
    expect(container.firstElementChild).toHaveAttribute('data-speaking', 'true')
    rerender(<SyncSlot speaking={false} />)
    expect(container.firstElementChild).toHaveAttribute(
      'data-speaking',
      'false',
    )
  })
})
