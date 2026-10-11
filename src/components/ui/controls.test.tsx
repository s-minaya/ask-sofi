import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../app/providers/ThemeProvider'
import { IconButton } from './IconButton/IconButton'
import { SoundOnIcon } from './icons/icons'
import { SegmentedControl } from './SegmentedControl/SegmentedControl'
import { SoundChoice, type SoundChoiceValue } from './SoundChoice/SoundChoice'
import { TextLink } from './TextLink/TextLink'
import { ThemeSwitch } from './ThemeSwitch/ThemeSwitch'

describe('IconButton', () => {
  it('siempre tiene nombre y anuncia su estado si es un interruptor', async () => {
    function Toggle() {
      const [on, setOn] = useState(false)
      return (
        <IconButton
          label="Sonido de Sofi"
          pressed={on}
          onClick={() => setOn(!on)}
        >
          <SoundOnIcon />
        </IconButton>
      )
    }
    render(<Toggle />)

    const button = screen.getByRole('button', { name: 'Sonido de Sofi' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('TextLink', () => {
  it('es un enlace si navega y un botón si actúa', () => {
    render(
      <>
        <TextLink href="#versiones">Ver las versiones</TextLink>
        <TextLink onClick={() => {}}>Nueva consulta</TextLink>
      </>,
    )

    expect(
      screen.getByRole('link', { name: 'Ver las versiones' }),
    ).toHaveAttribute('href', '#versiones')
    expect(
      screen.getByRole('button', { name: 'Nueva consulta' }),
    ).toHaveAttribute('type', 'button')
  })
})

describe('SegmentedControl', () => {
  it('agrupa las opciones con nombre y marca la elegida con aria-pressed', async () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl
        label="Movimiento"
        value="system"
        onChange={onChange}
        options={[
          { value: 'system', label: 'Sistema' },
          { value: 'reduce', label: 'Reducido' },
        ]}
      />,
    )

    const group = screen.getByRole('group', { name: 'Movimiento' })
    expect(
      within(group).getByRole('button', { name: 'Sistema' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(
      within(group).getByRole('button', { name: 'Reducido' }),
    )
    expect(onChange).toHaveBeenCalledWith('reduce')
  })
})

describe('ThemeSwitch', () => {
  it.each(['text', 'icon', 'responsive'] as const)(
    'mantiene los nombres Claro, Oscuro y Sistema en su versión %s',
    async (display) => {
      render(
        <ThemeProvider>
          <ThemeSwitch display={display} />
        </ThemeProvider>,
      )

      const group = screen.getByRole('group', { name: 'Tema' })
      expect(
        within(group).getByRole('button', { name: 'Sistema' }),
      ).toHaveAttribute('aria-pressed', 'true')
      await userEvent.click(
        within(group).getByRole('button', { name: 'Oscuro' }),
      )
      expect(
        within(group).getByRole('button', { name: 'Oscuro' }),
      ).toHaveAttribute('aria-pressed', 'true')
      expect(document.documentElement.dataset.theme).toBe('dark')
    },
  )
})

describe('SoundChoice', () => {
  it('ofrece la elección con radios nativos y empieza donde se le indique', async () => {
    function Choice() {
      const [value, setValue] = useState<SoundChoiceValue>('off')
      return <SoundChoice value={value} onChange={setValue} />
    }
    render(<Choice />)

    const group = screen.getByRole('group', {
      name: 'Antes de entrar: ¿con sonido?',
    })
    const off = within(group).getByRole('radio', { name: 'Sin sonido' })
    const on = within(group).getByRole('radio', { name: 'Con sonido' })
    expect(off).toBeChecked()

    await userEvent.click(on)
    expect(on).toBeChecked()

    // Con teclado, como cualquier grupo de radios.
    await userEvent.keyboard('{ArrowLeft}')
    expect(off).toBeChecked()
  })
})
