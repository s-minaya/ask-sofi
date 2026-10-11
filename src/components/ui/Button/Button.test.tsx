import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('ejecuta su acción y deja la flecha fuera del nombre accesible', async () => {
    const onClick = vi.fn()
    render(
      <Button arrow onClick={onClick}>
        Empezar
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('mientras carga se anuncia ocupado, cambia el texto y no repite la acción', async () => {
    const onClick = vi.fn()
    render(
      <Button loading loadingLabel="Leyendo…" onClick={onClick}>
        Leer entre líneas
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Leyendo…' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('desactivado sigue siendo enfocable pero no actúa', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Empezar
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Empezar' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await userEvent.tab()
    expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).not.toHaveBeenCalled()
  })
})
