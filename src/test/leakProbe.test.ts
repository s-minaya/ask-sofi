import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installLeakProbe, type LeakProbe } from './leakProbe'

// La sonda es el instrumento de VT3: si no viera una fuga, "sin residuos" no probaría nada.
// Cada tipo se deja escapar a propósito y se comprueba que se ve y que se limpia.
let probe: LeakProbe

beforeEach(() => {
  vi.useFakeTimers()
  probe = installLeakProbe()
})

afterEach(() => {
  probe.uninstall()
  vi.useRealTimers()
})

describe('sonda de fugas', () => {
  it('ve las escuchas de window, document y elementos, con su captura, y las da de baja', () => {
    const element = document.createElement('div')
    const listener = () => {}

    window.addEventListener('scroll', listener, { capture: true })
    document.addEventListener('visibilitychange', listener)
    element.addEventListener('click', listener)
    expect(probe.snapshot().listeners).toEqual([
      'div:click',
      'document:visibilitychange',
      'window:scroll(captura)',
    ])

    // Quitar sin captura no quita la de captura: el DOM tampoco lo haría.
    window.removeEventListener('scroll', listener)
    expect(probe.snapshot().listeners).toContain('window:scroll(captura)')

    window.removeEventListener('scroll', listener, true)
    document.removeEventListener('visibilitychange', listener)
    element.removeEventListener('click', listener)
    expect(probe.snapshot().listeners).toEqual([])
  })

  it('no cuenta dos veces la misma escucha, como el DOM', () => {
    const listener = () => {}
    document.addEventListener('keydown', listener)
    document.addEventListener('keydown', listener)

    expect(probe.snapshot().listeners).toEqual(['document:keydown'])
    document.removeEventListener('keydown', listener)
    expect(probe.snapshot().listeners).toEqual([])
  })

  it('ve los temporizadores pendientes y deja de verlos al vencer o al limpiarlos', () => {
    const timeout = setTimeout(() => {}, 1000)
    const interval = setInterval(() => {}, 1000)
    const expired = setTimeout(() => {}, 10)
    expect(probe.snapshot().timers).toBe(3)

    vi.advanceTimersByTime(10)
    expect(probe.snapshot().timers).toBe(2)
    // Un intervalo sigue vivo aunque dispare.
    vi.advanceTimersByTime(2000)
    expect(probe.snapshot().timers).toBe(1)

    clearInterval(interval)
    expect(probe.snapshot().timers).toBe(0)
    clearTimeout(timeout)
    clearTimeout(expired)
    expect(probe.snapshot().timers).toBe(0)
  })

  it('ve los fotogramas pedidos y no ejecutados', () => {
    const cancelled = requestAnimationFrame(() => {})
    requestAnimationFrame(() => {})
    expect(probe.snapshot().frames).toBe(2)

    cancelAnimationFrame(cancelled)
    expect(probe.snapshot().frames).toBe(1)
    vi.advanceTimersByTime(100)
    expect(probe.snapshot().frames).toBe(0)
  })

  it('ve los elementos observados hasta que se desconecta el observador', () => {
    const element = document.createElement('span')
    const visible = new IntersectionObserver(() => {})
    const resize = new ResizeObserver(() => {})

    visible.observe(element)
    resize.observe(element)
    expect(probe.snapshot().observers).toEqual([
      'IntersectionObserver:span',
      'ResizeObserver:span',
    ])

    visible.disconnect()
    expect(probe.snapshot().observers).toEqual(['ResizeObserver:span'])
    resize.unobserve(element)
    expect(probe.snapshot().observers).toEqual([])
  })

  it('al desinstalarse, devuelve el entorno como estaba', () => {
    const before = window.addEventListener
    probe.uninstall()

    expect(window.addEventListener).not.toBe(before)
    expect(typeof IntersectionObserver).toBe('undefined')
    // Evita desinstalar dos veces en afterEach.
    probe = installLeakProbe()
  })
})
