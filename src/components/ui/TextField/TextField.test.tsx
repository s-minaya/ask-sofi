import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { TextArea, TextField } from './TextField'

function Controlled({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  const [checked, setChecked] = useState(false)
  const error =
    checked && !value.trim()
      ? 'Escribe algo para que Sofi pueda leerlo.'
      : undefined
  return (
    <>
      <TextArea
        label="Texto de prueba"
        help="Motion & Sound lo usa para probar la escritura."
        value={value}
        onChange={setValue}
        error={error}
        showCount
      />
      <button type="button" onClick={() => setChecked(true)}>
        Comprobar
      </button>
    </>
  )
}

describe('TextArea', () => {
  it('une etiqueta, ayuda y control', () => {
    render(<Controlled />)

    const control = screen.getByLabelText('Texto de prueba')
    expect(control).toHaveAccessibleDescription(
      'Motion & Sound lo usa para probar la escritura.',
    )
  })

  it('muestra el error al comprobar, no mientras se escribe, y lo enlaza al control', async () => {
    render(<Controlled />)
    const control = screen.getByLabelText('Texto de prueba')

    expect(control).not.toHaveAttribute('aria-invalid')
    await userEvent.click(screen.getByRole('button', { name: 'Comprobar' }))

    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(control).toHaveAccessibleDescription(
      'Motion & Sound lo usa para probar la escritura. Escribe algo para que Sofi pueda leerlo.',
    )

    await userEvent.type(control, 'Vale.')
    expect(control).not.toHaveAttribute('aria-invalid')
  })

  it('cuenta caracteres en singular y en plural', async () => {
    render(<Controlled initial="V" />)

    expect(screen.getByText('1 carácter')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Texto de prueba'), 'ale.')
    expect(screen.getByText('5 caracteres')).toBeInTheDocument()
  })

  it('con máximo, muestra «x / máximo» y lo dice entero a quien no lo ve', () => {
    const { container } = render(
      <TextArea
        label="Notas"
        value="Hola"
        onChange={() => {}}
        showCount
        maxCount={500}
      />,
    )

    expect(screen.getByText('4 / 500')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('4 de 500 caracteres')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('4 caracteres')
  })
})

describe('TextField', () => {
  it('se puede desactivar', () => {
    render(
      <TextField
        label="Nombre del escenario"
        value="Carga lenta"
        onChange={() => {}}
        disabled
      />,
    )

    expect(screen.getByLabelText('Nombre del escenario')).toBeDisabled()
  })
})
