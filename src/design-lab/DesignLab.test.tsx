import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../app/providers/ThemeProvider'
import { DesignLab } from './DesignLab'

function renderLab(search = '') {
  window.history.replaceState(null, '', `/design-lab${search}`)
  render(
    <ThemeProvider>
      <DesignLab />
    </ThemeProvider>,
  )
}

const nav = () =>
  within(screen.getByRole('navigation', { name: 'Secciones del Design Lab' }))

describe('DesignLab', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('opens on Foundations and marks it as the current section', () => {
    renderLab()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Foundations' }),
    ).toBeInTheDocument()
    expect(nav().getByRole('link', { name: /Foundations/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it.each([
    ['UI Components', '?s=ui'],
    ['Sofi Components', '?s=sofi'],
    ['Motion & Sound', '?s=motion'],
    ['Experience Preview', '?s=preview'],
    ['Expediente', '?s=profile'],
    ['Foundations', '?s=foundations'],
  ])('renders the %s section from the navigation', (name, search) => {
    renderLab()
    fireEvent.click(nav().getByRole('link', { name: new RegExp(name) }))

    expect(screen.getByRole('heading', { level: 1, name })).toBeInTheDocument()
    expect(window.location.search).toBe(search)
    expect(nav().getByRole('link', { name: new RegExp(name) })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  // Las composiciones de 004 van en marcos; aquí, el catálogo de estados de Sofi.
  it('shows every state of Sofi in the profile proposal', () => {
    renderLab('?s=profile')
    for (const name of [
      'Sofi se asoma, curiosa',
      'Sofi te pregunta',
      'Sofi espera tu respuesta',
      'Sofi sonríe, satisfecha',
      'Sofi se lo piensa',
      'Sofi, con gafas de sol, da su visto bueno',
      'Sofi, sorprendida',
      'Sofi se lo piensa antes de borrar',
      'Sofi, tranquila, con el expediente en blanco',
    ])
      expect(screen.getByRole('img', { name })).toBeInTheDocument()
    expect(screen.getAllByTitle(/^(Consulta|Expediente) ·/)).toHaveLength(4)
  })

  it('opens the section named in the address', () => {
    renderLab('?s=motion')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Motion & Sound' }),
    ).toBeInTheDocument()
  })

  it('switches the real theme preference from its header', () => {
    renderLab()
    const theme = within(screen.getByRole('group', { name: 'Tema' }))

    fireEvent.click(theme.getByRole('button', { name: 'Oscuro' }))
    expect(document.documentElement.dataset.theme).toBe('dark')

    fireEvent.click(theme.getByRole('button', { name: 'Sistema' }))
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('simulates reduced motion for everything inside the Lab', () => {
    renderLab()
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Movimiento' })).getByRole(
        'button',
        { name: 'Reducido' },
      ),
    )
    expect(document.querySelector('[data-motion="reduce"]')).not.toBeNull()
  })
})
