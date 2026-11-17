import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { MotionPreference } from '../../app/providers/MotionPreference'
import * as preferences from '../../infrastructure/storage/preferencesStorage'
import { setMediaQuery } from '../../test/matchMedia'
import { LabMotionContext } from '../labMotion'
import { WHY_FULL_TEXT } from '../motionControl'
import { MotionControlSpec } from './MotionControlSpec'

// El sprite real necesita módulos y tiras; aquí solo importa el control.
vi.mock('../../components/sofi/SofiSprite/SofiSprite', () => ({
  SofiSprite: ({ animation }: { animation: string }) => (
    <span data-sprite={animation} />
  ),
}))

// Las preferencias públicas: el prototipo no debe tocarlas nunca.
vi.mock('../../infrastructure/storage/preferencesStorage', async (original) => {
  const module =
    await original<
      typeof import('../../infrastructure/storage/preferencesStorage')
    >()
  return { ...module, updatePreferences: vi.fn(module.updatePreferences) }
})

function LabWithMotion({
  children,
  onChange,
}: {
  children: React.ReactNode
  onChange?: (value: MotionPreference) => void
}) {
  const [motion, setMotion] = useState<MotionPreference>('system')
  return (
    <LabMotionContext
      value={{
        motion,
        setMotion: (value) => {
          onChange?.(value)
          setMotion(value)
        },
      }}
    >
      {children}
    </LabMotionContext>
  )
}

const groups = () => screen.getAllByRole('group', { name: 'Movimiento' })
// El control vivo es el primer grupo «Movimiento» de la ficha; el otro, la maqueta de cabecera.
const live = () => within(groups()[0])
const header = () => document.querySelector('header') as HTMLElement

// T071: la ficha 4.13 con el control aprobado (AV7, plan 008 §11.9).
describe('MotionControlSpec (4.13)', () => {
  it('el control vivo y la maqueta de cabecera llevan las tres opciones en el orden aprobado', () => {
    render(<MotionControlSpec />)
    expect(groups()).toHaveLength(2)
    for (const group of groups())
      expect(
        within(group)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['Reducido', 'Completo', 'Sistema'])
    expect(screen.getByText(/Aprobado \(AV7\)/)).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/pendiente de AV7/)
  })

  it('empieza en «Sistema»', () => {
    render(<MotionControlSpec />)
    for (const group of groups())
      expect(
        within(group).getByRole('button', { name: 'Sistema' }),
      ).toHaveAttribute('aria-pressed', 'true')
  })

  it('sin iconos en ningún tamaño: solo las tres etiquetas, también en la cabecera estrecha', () => {
    // La cabecera estrecha de la app (menos de 760 px): el tema pasa a iconos, el movimiento no.
    setMediaQuery('(max-width: 759.98px)', true)
    render(<MotionControlSpec />)
    for (const group of groups()) {
      expect(group.querySelectorAll('svg')).toHaveLength(0)
      expect(
        within(group)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['Reducido', 'Completo', 'Sistema'])
    }
  })

  it('«¿Por qué Completo?» despliega la explicación aprobada, palabra por palabra', () => {
    render(<MotionControlSpec />)
    const [why] = screen.getAllByRole('button', { name: '¿Por qué Completo?' })
    expect(why).toHaveAttribute('aria-expanded', 'false')
    const panel = document.getElementById(why.getAttribute('aria-controls')!)!
    expect(panel).not.toBeVisible()
    fireEvent.click(why)
    expect(why).toHaveAttribute('aria-expanded', 'true')
    expect(panel).toBeVisible()
    expect([...panel.querySelectorAll('p')].map((p) => p.textContent)).toEqual([
      ...WHY_FULL_TEXT,
    ])
    fireEvent.click(why)
    expect(panel).not.toBeVisible()
  })

  it('la maqueta estrecha va en iframes con sus media queries reales, con y sin el control', () => {
    render(<MotionControlSpec />)
    const frames = screen.getAllByTitle(/Cabecera/)
    expect(frames).toHaveLength(3)
    const srcs = frames.map((f) => f.getAttribute('src'))
    expect(srcs.filter((s) => s?.endsWith('control=0'))).toHaveLength(1)
    expect(
      srcs.every((s) => s?.startsWith('/design-lab?frame=motion-header')),
    ).toBe(true)
  })

  it('el control vivo mueve el selector global del Lab y la maqueta lo sigue', () => {
    const onChange = vi.fn()
    render(
      <LabWithMotion onChange={onChange}>
        <MotionControlSpec />
      </LabWithMotion>,
    )
    fireEvent.click(live().getByRole('button', { name: 'Reducido' }))
    expect(onChange).toHaveBeenCalledWith('reduce')
    expect(screen.getByText('Reducido, por elección')).toBeInTheDocument()
    for (const group of groups())
      expect(
        within(group).getByRole('button', { name: 'Reducido' }),
      ).toHaveAttribute('aria-pressed', 'true')
  })

  it('sin el Lab entero, el control vive con un estado propio', () => {
    render(<MotionControlSpec />)
    fireEvent.click(live().getByRole('button', { name: 'Completo' }))
    expect(screen.getByText('Completo, por elección')).toBeInTheDocument()
  })

  it('nunca escribe una preferencia pública', () => {
    render(
      <LabWithMotion>
        <MotionControlSpec />
      </LabWithMotion>,
    )
    fireEvent.click(live().getByRole('button', { name: 'Reducido' }))
    fireEvent.click(within(header()).getByRole('button', { name: 'Completo' }))
    expect(preferences.updatePreferences).not.toHaveBeenCalled()
  })
})
