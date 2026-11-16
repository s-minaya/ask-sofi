import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { resetSpriteLoader } from '../../components/sofi/SofiSprite/loadSprite'
import { SOFI_ANIMATION_IDS } from '../../components/sofi/visual/types'
import { setMediaQuery } from '../../test/matchMedia'
import { REDUCED_POSES, STATUS_LABEL } from '../reducedPoses'
import { ReducedPosesSpec } from './ReducedPosesSpec'

// T069: la ficha 4.11 compara las 14 poses reducidas. jsdom no pinta ni decodifica tiras: las
// poses reales se revisan en el navegador (008-verification.md).

const REDUCE = '(prefers-reduced-motion: reduce)'

afterEach(() => resetSpriteLoader())

const show = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar las 14 poses' }))

describe('ReducedPosesSpec (4.11)', () => {
  it('no carga los recursos hasta que se piden', () => {
    const { container } = render(<ReducedPosesSpec />)
    expect(container.querySelector('[data-pose]')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Mostrar las 14 poses' }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('muestra los 14 recursos, cada uno con su estado', () => {
    const { container } = render(<ReducedPosesSpec />)
    show()
    const cards = [...container.querySelectorAll<HTMLElement>('[data-pose]')]
    expect(cards.map((card) => card.dataset.pose)).toEqual([
      ...SOFI_ANIMATION_IDS,
    ])
    for (const card of cards) {
      const pose =
        REDUCED_POSES[card.dataset.pose as keyof typeof REDUCED_POSES]
      expect(card).toHaveTextContent(STATUS_LABEL[pose.status])
      expect(card).toHaveTextContent(pose.partial)
    }
    expect(
      screen.getByRole('button', { name: 'Ocultar las 14 poses' }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it('solo las propuestas enseñan fotogramas alternativos; memory-wipe y los gags no', () => {
    const { container } = render(<ReducedPosesSpec />)
    show()
    for (const id of SOFI_ANIMATION_IDS) {
      const card = container.querySelector(`[data-pose="${id}"]`)
      const hasFrames = /Cargando fotogramas|Fotogramas no disponibles/.test(
        card?.textContent ?? '',
      )
      expect(hasFrames, id).toBe(REDUCED_POSES[id].status === 'partial')
    }
  })

  it('los sprites son decorativos', () => {
    const { container } = render(<ReducedPosesSpec />)
    show()
    for (const card of container.querySelectorAll('[data-pose]')) {
      const stage = card.querySelector('[aria-hidden="true"]')
      expect(stage).not.toBeNull()
      expect(card.querySelector('[role="img"]')).toBeNull()
    }
  })

  it('dice que las 10 poses del parcial están aprobadas, sin nada pendiente de AV4', () => {
    const { container } = render(<ReducedPosesSpec />)
    show()
    const section = container.querySelector('#m-reduced')
    expect(section).toHaveTextContent(/Poses aprobadas \(AV4\)/)
    expect(section).toHaveTextContent(/producción en T083/)
    expect(section).not.toHaveTextContent(/pendiente de AV4/)
    const approved = [...container.querySelectorAll('[data-pose]')].filter(
      (card) => card.textContent?.includes(STATUS_LABEL.partial),
    )
    expect(approved).toHaveLength(10)
    expect(STATUS_LABEL.partial).toMatch(/Aprobada.*AV4.*2026-11-16/)
  })

  it('dice qué modo manda, según el selector global', () => {
    const { unmount } = render(<ReducedPosesSpec />)
    expect(screen.getByText(/Movimiento completo/)).toBeInTheDocument()
    unmount()
    setMediaQuery(REDUCE, true)
    render(<ReducedPosesSpec />)
    expect(
      screen.getByText('Movimiento reducido: se ven las poses fijas.'),
    ).toBeInTheDocument()
  })
})
