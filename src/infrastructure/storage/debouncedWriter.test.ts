import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedWriter } from './debouncedWriter'

describe('createDebouncedWriter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('agrupa las escrituras seguidas y guarda solo la última', () => {
    const save = vi.fn()
    const writer = createDebouncedWriter(save, 300)

    writer.schedule('h')
    vi.advanceTimersByTime(200)
    writer.schedule('ho')
    vi.advanceTimersByTime(200)
    writer.schedule('hol')
    expect(save).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)

    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('hol')
  })

  it('flush guarda lo pendiente de inmediato y solo una vez', () => {
    const save = vi.fn()
    const writer = createDebouncedWriter(save, 300)

    writer.schedule('hola')
    writer.flush()
    vi.advanceTimersByTime(1000)

    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('hola')
  })

  it('flush sin nada pendiente no guarda', () => {
    const save = vi.fn()
    const writer = createDebouncedWriter(save, 300)

    writer.flush()

    expect(save).not.toHaveBeenCalled()
  })

  it('cancel descarta lo pendiente', () => {
    const save = vi.fn()
    const writer = createDebouncedWriter(save, 300)

    writer.schedule('hola')
    writer.cancel()
    writer.flush()
    vi.advanceTimersByTime(1000)

    expect(save).not.toHaveBeenCalled()
  })
})
