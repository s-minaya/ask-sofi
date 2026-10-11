import { describe, expect, it } from 'vitest'
import { meterCells } from './meterCells'

describe('meterCells', () => {
  it.each([
    [0, 0],
    [9, 2],
    [15, 3],
    [24, 5],
    [34, 7],
    [52, 10],
    [100, 20],
  ])('%i %% ocupa %i celdas', (percentage, cells) => {
    expect(meterCells(percentage)).toBe(cells)
  })

  it('no sale de la escala aunque reciba valores imposibles', () => {
    expect(meterCells(-10)).toBe(0)
    expect(meterCells(140)).toBe(20)
  })
})
