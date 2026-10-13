import { act, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  installIntersectionObserver,
  observerOptions,
  setIntersection,
  setIntersections,
  uninstallIntersectionObserver,
} from '../test/intersection'
import { useInViewport } from './useInViewport'

function Probe({ settle }: { settle?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInViewport(ref, { settleMs: settle })
  return (
    <div ref={ref} data-testid="box">
      {visible ? 'en pantalla' : 'fuera'}
    </div>
  )
}

describe('useInViewport', () => {
  afterEach(() => uninstallIntersectionObserver())

  describe('con IntersectionObserver', () => {
    beforeEach(() => installIntersectionObserver())

    it('sigue al elemento: entero en pantalla o no', () => {
      render(<Probe />)
      const box = screen.getByTestId('box')
      expect(box).toHaveTextContent('fuera')

      act(() => setIntersection(box, 1))
      expect(box).toHaveTextContent('en pantalla')

      // Asomando no cuenta: la guía y el salto piden el botón entero.
      act(() => setIntersection(box, 0.4))
      expect(box).toHaveTextContent('fuera')
    })

    // Regresión: con la página moviéndose, el navegador entrega varias
    // notificaciones juntas (p. ej. entró y salió). Vale la última; la primera
    // dejaba el botón «visible» para siempre estando fuera de la pantalla.
    it('con varias notificaciones en una entrega, cuenta la última', () => {
      render(<Probe />)
      const box = screen.getByTestId('box')

      act(() => setIntersections(box, [1, 0]))
      expect(box).toHaveTextContent('fuera')

      act(() => setIntersections(box, [0, 1]))
      expect(box).toHaveTextContent('en pantalla')
    })

    it('pide el elemento entero, no asomando', () => {
      render(<Probe />)

      expect(observerOptions(screen.getByTestId('box'))).toEqual([
        { threshold: 1 },
      ])
    })
  })

  // Un desplazamiento suave entra y sale del encuadre: lo que depende de verse
  // espera a que la página deje de moverse, para no activarse por el camino.
  describe('esperando a que la página se asiente', () => {
    beforeEach(() => {
      installIntersectionObserver()
      vi.useFakeTimers()
    })
    afterEach(() => vi.useRealTimers())

    it('no cuenta como visible hasta que pasa el tiempo sin desplazarse', () => {
      render(<Probe settle={150} />)
      const box = screen.getByTestId('box')

      act(() => setIntersection(box, 1))
      expect(box).toHaveTextContent('fuera')

      act(() => vi.advanceTimersByTime(150))
      expect(box).toHaveTextContent('en pantalla')
    })

    it('cada desplazamiento reinicia la espera', () => {
      render(<Probe settle={150} />)
      const box = screen.getByTestId('box')
      act(() => setIntersection(box, 1))

      act(() => vi.advanceTimersByTime(100))
      act(() => void window.dispatchEvent(new Event('scroll')))
      act(() => vi.advanceTimersByTime(100))
      expect(box).toHaveTextContent('fuera')

      act(() => vi.advanceTimersByTime(50))
      expect(box).toHaveTextContent('en pantalla')
    })

    it('al salir de la pantalla deja de serlo al instante', () => {
      render(<Probe settle={150} />)
      const box = screen.getByTestId('box')
      act(() => setIntersection(box, 1))
      act(() => vi.advanceTimersByTime(150))

      act(() => setIntersection(box, 0))

      expect(box).toHaveTextContent('fuera')
    })

    it('si sale antes de asentarse, no llega a contar', () => {
      render(<Probe settle={150} />)
      const box = screen.getByTestId('box')
      act(() => setIntersection(box, 1))
      act(() => vi.advanceTimersByTime(100))
      act(() => setIntersection(box, 0))

      act(() => vi.advanceTimersByTime(500))

      expect(box).toHaveTextContent('fuera')
    })
  })

  // Sin soporte, no se oculta nada: la guía no aparece y el salto se da ya.
  it('sin IntersectionObserver da el elemento por visible', () => {
    render(<Probe />)

    expect(screen.getByTestId('box')).toHaveTextContent('en pantalla')
  })
})
