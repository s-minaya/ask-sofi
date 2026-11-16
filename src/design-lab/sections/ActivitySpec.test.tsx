import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setMediaQuery } from '../../test/matchMedia'
import { ACTIVITY_VARIANTS } from '../activityLab'
import { ActivitySpec } from './ActivitySpec'

// T068: los prototipos del indicador siguen la operación simulada, son decorativos y se quedan
// quietos con movimiento reducido. jsdom no anima: el movimiento real se revisa en el navegador.

const REDUCE = '(prefers-reduced-motion: reduce)'

const press = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))

const cards = () =>
  ACTIVITY_VARIANTS.map((variant) => {
    const live = document.querySelector<HTMLElement>(
      `[data-variant="${variant.id}"]`,
    )
    if (!live) throw new Error(`Falta la variante ${variant.id}`)
    return live
  })

describe('ActivitySpec (4.10)', () => {
  it('muestra cada variante con su nombre y, sin operación, nada que indicar', () => {
    render(<ActivitySpec />)
    for (const variant of ACTIVITY_VARIANTS) {
      expect(
        screen.getByRole('heading', { name: variant.name }),
      ).toBeInTheDocument()
    }
    for (const live of cards()) {
      expect(live).toHaveTextContent('Sin actividad')
      expect(live.querySelector('[data-indicator]')).toBeNull()
    }
  })

  it('durante un análisis, glifo y etiqueta son decorativos y siguen el tiempo real', () => {
    render(<ActivitySpec />)
    press('Empieza un análisis')

    for (const live of cards()) {
      const activity = live.querySelector('[aria-hidden="true"]')
      expect(activity).toHaveTextContent('sofing…')
      expect(activity?.querySelector('[data-indicator]')).toHaveAttribute(
        'data-indicator',
        'animated',
      )
      // Sin roles ni regiones vivas en la capa decorativa (catálogo §7.1).
      expect(activity?.querySelector('[role], [aria-live]')).toBeNull()
    }

    press('Adelantar 4 s')
    for (const live of cards()) expect(live).toHaveTextContent('cooking…')
  })

  it('una carga muestra su etiqueta', () => {
    render(<ActivitySpec />)
    press('Empieza una carga')
    for (const live of cards()) expect(live).toHaveTextContent('rolling…')
  })

  it('con movimiento reducido el glifo queda quieto y la etiqueta fija', () => {
    setMediaQuery(REDUCE, true)
    render(<ActivitySpec />)
    press('Empieza un análisis')
    press('Adelantar 4 s')

    for (const live of cards()) {
      expect(live.querySelector('[data-indicator]')).toHaveAttribute(
        'data-indicator',
        'still',
      )
      expect(live).toHaveTextContent('sofing…')
    }
  })

  it('al llegar el resultado retenido o al terminar, deja de indicar actividad', () => {
    render(<ActivitySpec />)
    press('Empieza un análisis')
    press('Llega el resultado (retenido)')
    for (const live of cards()) {
      expect(live).toHaveTextContent('Sin actividad')
      expect(live.querySelector('[data-indicator]')).toBeNull()
    }

    press('Empieza una carga')
    press('Termina')
    for (const live of cards()) expect(live).toHaveTextContent('Sin actividad')
  })

  it('el ritmo común se aplica a todas las variantes a la vez', () => {
    render(<ActivitySpec />)
    fireEvent.click(screen.getByRole('button', { name: 'El mismo' }))
    fireEvent.change(screen.getByLabelText('Ritmo común'), {
      target: { value: '200' },
    })
    press('Empieza un análisis')
    for (const live of cards()) {
      expect(
        live
          .querySelector<HTMLElement>('[data-indicator]')
          ?.style.getPropertyValue('--frame-ms'),
      ).toBe('200ms')
    }
  })

  it('los glifos son dibujos de píxel, no caracteres de la referencia', () => {
    const { container } = render(<ActivitySpec />)
    press('Empieza un análisis')
    expect(container.textContent).not.toMatch(/[✢✳✶✻✽]/)
    const section = screen.getByRole('region', {
      name: 'Indicador de actividad',
    })
    expect(within(section).getAllByRole('heading', { level: 3 }).length).toBe(
      ACTIVITY_VARIANTS.length + 1,
    )
  })
})
