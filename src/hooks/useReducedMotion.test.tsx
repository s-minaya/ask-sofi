import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  MotionPreferenceProvider,
  type MotionPreference,
} from '../app/providers/MotionPreference'
import { setMediaQuery } from '../test/matchMedia'
import { useReducedMotion } from './useReducedMotion'

// Los seis modos de plan 008 §4.1: preferencia × sistema.
const MODES: Array<[MotionPreference, boolean, boolean]> = [
  ['system', false, false],
  ['system', true, true],
  ['reduce', false, true],
  ['reduce', true, true],
  ['full', false, false],
  ['full', true, false],
]

describe('useReducedMotion', () => {
  it.each(MODES)(
    'con la preferencia «%s» y reduce del sistema = %s, el estado efectivo reducido es %s',
    (preference, system, expected) => {
      setMediaQuery('(prefers-reduced-motion: reduce)', system)
      const wrapper = ({ children }: { children: ReactNode }) => (
        <MotionPreferenceProvider value={preference}>
          {children}
        </MotionPreferenceProvider>
      )

      const { result } = renderHook(() => useReducedMotion(), { wrapper })

      expect(result.current).toBe(expected)
    },
  )

  it('sin proveedor manda el sistema', () => {
    setMediaQuery('(prefers-reduced-motion: reduce)', true)

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(true)
  })

  it('sigue los cambios del sistema en vivo', () => {
    setMediaQuery('(prefers-reduced-motion: reduce)', false)
    const { result, rerender } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    setMediaQuery('(prefers-reduced-motion: reduce)', true)
    rerender()

    expect(result.current).toBe(true)
  })
})
