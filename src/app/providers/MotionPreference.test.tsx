import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { applyMotionPreference } from './motion'
import { MotionPreferenceProvider } from './MotionPreference'

const html = () => document.documentElement

describe('applyMotionPreference', () => {
  it('«system» quita el atributo y las elecciones explícitas lo escriben', () => {
    applyMotionPreference('reduce')
    expect(html().dataset.motion).toBe('reduce')
    applyMotionPreference('full')
    expect(html().dataset.motion).toBe('full')
    applyMotionPreference('system')
    expect(html().dataset.motion).toBeUndefined()
  })
})

describe('MotionPreferenceProvider', () => {
  it.each([
    ['reduce', 'reduce'],
    ['full', 'full'],
  ] as const)('«%s» se escribe en <html>', (value, attribute) => {
    render(<MotionPreferenceProvider value={value}>x</MotionPreferenceProvider>)

    expect(html().dataset.motion).toBe(attribute)
  })

  it('«system» no escribe nada', () => {
    render(
      <MotionPreferenceProvider value="system">x</MotionPreferenceProvider>,
    )

    expect(html().dataset.motion).toBeUndefined()
  })

  it('hay un único ámbito por documento: ningún contenedor propio lleva data-motion', () => {
    const { container } = render(
      <MotionPreferenceProvider value="reduce">
        <p>contenido</p>
      </MotionPreferenceProvider>,
    )

    expect(container.querySelector('[data-motion]')).toBeNull()
    expect(document.querySelectorAll('[data-motion]')).toHaveLength(1)
    expect(document.querySelector('[data-motion]')).toBe(html())
  })

  it('cambia el valor en vivo y lo deja como estaba al desmontarse', () => {
    const { rerender, unmount } = render(
      <MotionPreferenceProvider value="reduce">x</MotionPreferenceProvider>,
    )
    rerender(
      <MotionPreferenceProvider value="full">x</MotionPreferenceProvider>,
    )
    expect(html().dataset.motion).toBe('full')

    unmount()

    expect(html().dataset.motion).toBeUndefined()
  })

  it('al desmontarse restablece lo que había en <html> (p. ej. lo aplicado al arrancar)', () => {
    html().dataset.motion = 'reduce'
    const { unmount } = render(
      <MotionPreferenceProvider value="full">x</MotionPreferenceProvider>,
    )
    expect(html().dataset.motion).toBe('full')

    unmount()

    expect(html().dataset.motion).toBe('reduce')
  })
})

// Las dos pruebas siguientes van en orden: la segunda comprueba que el entorno
// de pruebas (src/test/setup.ts) limpia `dataset.motion` entre pruebas.
describe('limpieza entre pruebas', () => {
  it('deja data-motion puesto', () => {
    html().dataset.motion = 'reduce'
    expect(html().dataset.motion).toBe('reduce')
  })

  it('la prueba siguiente lo encuentra limpio', () => {
    expect(html().dataset.motion).toBeUndefined()
  })
})
