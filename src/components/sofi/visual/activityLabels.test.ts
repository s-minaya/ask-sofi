import { describe, expect, it } from 'vitest'
import {
  PROVISIONAL_ACTIVITY_LABELS,
  activityLabel,
  type LabelCalendar,
} from './activityLabels'

// Spec 008 §4: la etiqueta acompaña una actividad real y deja de indicarla al terminar.
const calendar: LabelCalendar = [
  { fromMs: 0, label: 'uno…' },
  { fromMs: 1000, label: 'dos…' },
  { fromMs: 5000, label: 'tres…' },
]

const running = (elapsedMs: number, reducedMotion = false) =>
  activityLabel(
    { kind: 'analysis', pending: true, elapsedMs, reducedMotion },
    { analysis: calendar, loading: calendar },
  )

describe('activityLabel', () => {
  it('sigue el calendario desde el inicio de la operación real', () => {
    expect(running(0)).toBe('uno…')
    expect(running(999)).toBe('uno…')
    expect(running(1000)).toBe('dos…')
    expect(running(4999)).toBe('dos…')
    expect(running(60_000)).toBe('tres…')
  })

  it('al terminar la operación deja de indicar actividad, aunque la animación siga en su primer ciclo', () => {
    for (const elapsedMs of [0, 800, 2000, 6000]) {
      expect(
        activityLabel(
          { kind: 'analysis', pending: false, elapsedMs, reducedMotion: false },
          { analysis: calendar, loading: calendar },
        ),
      ).toBeNull()
    }
  })

  it('con movimiento reducido la etiqueta no va cambiando', () => {
    expect(running(0, true)).toBe('uno…')
    expect(running(60_000, true)).toBe('uno…')
  })

  it('un tiempo negativo o no válido usa la primera etiqueta', () => {
    expect(running(-5)).toBe('uno…')
    expect(running(Number.NaN)).toBe('uno…')
  })

  it('cada actividad tiene su propio calendario', () => {
    const calendars = {
      analysis: calendar,
      loading: [{ fromMs: 0, label: 'carga…' }],
    }
    expect(
      activityLabel(
        {
          kind: 'loading',
          pending: true,
          elapsedMs: 9000,
          reducedMotion: false,
        },
        calendars,
      ),
    ).toBe('carga…')
  })
})

describe('copy provisional (AV1)', () => {
  it.each(Object.entries(PROVISIONAL_ACTIVITY_LABELS))(
    '«%s» empieza en 0, avanza y no tiene etiquetas vacías',
    (_kind, entries) => {
      expect(entries[0].fromMs).toBe(0)
      entries.forEach((entry, index) => {
        expect(entry.label.trim()).not.toBe('')
        if (index > 0)
          expect(entry.fromMs).toBeGreaterThan(entries[index - 1].fromMs)
      })
    },
  )

  it('se usa por defecto: «sofing…», «cooking…» a los 4000 ms y «rolling…» para la carga', () => {
    const label = (
      kind: 'analysis' | 'loading',
      elapsedMs: number,
      reducedMotion = false,
    ) => activityLabel({ kind, pending: true, elapsedMs, reducedMotion })

    expect(label('analysis', 0)).toBe('sofing…')
    expect(label('analysis', 3999)).toBe('sofing…')
    expect(label('analysis', 4000)).toBe('cooking…')
    expect(label('loading', 10_000)).toBe('rolling…')
    // Con movimiento reducido la etiqueta decorativa se queda fija.
    expect(label('analysis', 10_000, true)).toBe('sofing…')
  })
})
