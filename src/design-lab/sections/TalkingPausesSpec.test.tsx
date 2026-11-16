import { act, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { setMediaQuery } from '../../test/matchMedia'
import type { PausePolicy, SpeechPhase } from '../talkingPauses'
import { PauseColumn, TalkingPausesSpec } from './TalkingPausesSpec'

// El sprite real necesita módulos y tiras; aquí solo importa qué recurso se le pide. jsdom no
// tiene Web Animations: los saltos de verdad se miden en el navegador (008-verification.md).
vi.mock('../../components/sofi/SofiSprite/SofiSprite', () => ({
  SofiSprite: ({ animation }: { animation: string }) => (
    <span data-sprite={animation} />
  ),
}))

// La carga de `talking` que hace la ficha: cada prueba decide si ya está cargado.
const loader = vi.hoisted(() => ({
  loaded: true,
  resolve: () => {},
}))
vi.mock('../../components/sofi/SofiSprite/loadSprite', () => ({
  loadedClassOf: () => (loader.loaded ? 'talking' : undefined),
  loadSprite: () =>
    new Promise<string>((resolve) => {
      loader.resolve = () => resolve('talking')
    }),
}))

const frame = () =>
  act(() => new Promise((resolve) => requestAnimationFrame(resolve)))

const column = (container: HTMLElement) =>
  container.querySelector('[data-hold]') as HTMLElement
const sprite = (container: HTMLElement) =>
  container.querySelector('[data-sprite]')?.getAttribute('data-sprite')

function renderColumn(
  pause: PausePolicy,
  options: { end?: 'pause' | 'blink'; start?: 'cut' | 'eyes-open' } = {},
) {
  const props = {
    pause,
    label: pause,
    end: options.end ?? 'pause',
    start: options.start ?? 'cut',
  } as const
  let run = 1
  let phase: SpeechPhase = 'before'
  const view = render(<PauseColumn {...props} phase={phase} run={run} />)
  const update = async () => {
    view.rerender(<PauseColumn {...props} phase={phase} run={run} />)
    await frame()
  }
  const to = (next: SpeechPhase) => {
    phase = next
    return update()
  }
  const replay = () => {
    run += 1
    return update()
  }
  return { ...view, to, replay }
}

// T070: tres alternativas de pausa con el mismo diálogo; la aprobada (AV5) va por defecto.
describe('PauseColumn', () => {
  it('antes de hablar pinta sofi-blink y, al hablar, talking en marcha', async () => {
    const { container, to } = renderColumn('blink')
    expect(sprite(container)).toBe('sofi-blink')
    await to('speaking')
    expect(sprite(container)).toBe('talking')
    expect(column(container)).toHaveAttribute('data-hold', 'none')
  })

  it.each([
    ['blink', 'sofi-blink', 'none'],
    ['freeze', 'talking', 'freeze'],
    ['closed', 'talking', 'closed'],
  ] as const)(
    'en una pausa, «%s» pinta %s (%s)',
    async (pause, animation, hold) => {
      const { container, to } = renderColumn(pause)
      await to('speaking')
      await to('pause')
      expect(sprite(container)).toBe(animation)
      expect(column(container)).toHaveAttribute('data-hold', hold)
      await to('speaking')
      expect(sprite(container)).toBe('talking')
      expect(column(container)).toHaveAttribute('data-hold', 'none')
    },
  )

  it('al terminar hace lo mismo que en la pausa, salvo que se compare con «vuelta a blink»', async () => {
    const same = renderColumn('closed')
    await same.to('speaking')
    await same.to('done')
    expect(column(same.container)).toHaveAttribute('data-hold', 'closed')
    same.unmount()

    const blink = renderColumn('closed', { end: 'blink' })
    await blink.to('speaking')
    await blink.to('done')
    expect(sprite(blink.container)).toBe('sofi-blink')
  })

  it('con «ojos abiertos» y sin nada que leer no espera', async () => {
    const { container, to } = renderColumn('blink', { start: 'eyes-open' })
    await to('speaking')
    expect(sprite(container)).toBe('talking')
  })

  it('registra cada cambio y, sin lectura de fotogramas, no afirma que haya o no salto', async () => {
    const { container, to } = renderColumn('freeze')
    expect(screen.getByText('Sin cambios todavía.')).toBeInTheDocument()
    await to('speaking')
    await to('pause')
    const log = within(container).getByRole('list', {
      name: 'Últimos cambios · freeze',
    })
    const entries = within(log).getAllByRole('listitem')
    expect(entries).toHaveLength(2)
    expect(entries[0]).toHaveTextContent(
      'talking en marcha → talking congelado',
    )
    expect(entries[1]).toHaveTextContent('sofi-blink → talking en marcha')
    expect(entries[0]).toHaveTextContent('sin lectura')
    expect(container).toHaveTextContent('2 cambios · ojos 0 · boca 0')
  })

  it('«Al empezar» es el paso de sofi-blink a talking de esta reproducción, aunque ya no esté entre los últimos', async () => {
    const { container, to } = renderColumn('blink')
    expect(container).toHaveTextContent('Al empezar—')
    await to('speaking')
    for (let i = 0; i < 4; i++) {
      await to('pause')
      await to('speaking')
    }
    const log = within(container).getByRole('list', {
      name: 'Últimos cambios · blink',
    })
    expect(within(log).getAllByRole('listitem')).toHaveLength(6)
    // El primer paso y cuatro pausas con su vuelta a hablar.
    expect(container).toHaveTextContent('9 cambios')
    expect(container).toHaveTextContent(/Al empezarojos \? ?→/)
  })

  it('una reproducción nueva vacía el registro sin remontar el sprite, que sigue donde iba', async () => {
    const { container, to, replay } = renderColumn('blink')
    await to('speaking')
    await to('pause')
    const painted = container.querySelector('[data-sprite]')
    expect(container).toHaveTextContent('2 cambios')
    await replay()
    expect(container).toHaveTextContent('0 cambios')
    expect(screen.getByText('Sin cambios todavía.')).toBeInTheDocument()
    expect(container.querySelector('[data-sprite]')).toBe(painted)
  })

  it('el sprite es decorativo', () => {
    const { container } = renderColumn('blink')
    expect(column(container)).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('TalkingPausesSpec (4.12)', () => {
  it('muestra las tres alternativas con el mismo diálogo y sin elegir ninguna', () => {
    const { container } = render(<TalkingPausesSpec />)
    const columns = [...container.querySelectorAll<HTMLElement>('[data-pause]')]
    expect(columns.map((each) => each.dataset.pause)).toEqual([
      'blink',
      'freeze',
      'closed',
    ])
    expect(container).toHaveTextContent('Aprobado (AV5)')
    expect(container).not.toHaveTextContent(/pendiente de AV5/)
    expect(container).toHaveTextContent('Boca quieta · congelada · aprobada')
    // Por defecto, la combinación aprobada: blink al terminar y espera al parpadeo.
    const pressed = (group: string) =>
      within(screen.getByRole('group', { name: group }))
        .getAllByRole('button', { pressed: true })
        .map((button) => button.textContent)
    expect(pressed('Al terminar')).toEqual(['Vuelta a blink'])
    expect(pressed('Al empezar a hablar')).toEqual(['Con los ojos abiertos'])
    expect(
      screen.getByRole('button', { name: 'Reproducir las tres' }),
    ).toBeVisible()
    for (const group of ['Al empezar a hablar', 'Al terminar', 'Pausas'])
      expect(screen.getByText(group)).toBeInTheDocument()
  })

  it('antes de reproducir, las tres en el reposo', () => {
    const { container } = render(<TalkingPausesSpec />)
    const sprites = [...container.querySelectorAll('[data-sprite]')]
    expect(sprites.map((each) => each.getAttribute('data-sprite'))).toEqual([
      'sofi-blink',
      'sofi-blink',
      'sofi-blink',
    ])
  })

  it('no deja reproducir hasta que talking está cargado, para no comparar la reserva estática', async () => {
    loader.loaded = false
    try {
      render(<TalkingPausesSpec />)
      const button = screen.getByRole('button', {
        name: 'Reproducir las tres',
      })
      // `Button` usa aria-disabled: sigue siendo descubrible con teclado.
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByText('Cargando talking…')).toBeInTheDocument()
      await act(async () => loader.resolve())
      expect(button).not.toHaveAttribute('aria-disabled')
      expect(screen.queryByText('Cargando talking…')).toBeNull()
    } finally {
      loader.loaded = true
    }
  })

  it('con movimiento reducido avisa de que las tres muestran la misma pose fija', () => {
    setMediaQuery('(prefers-reduced-motion: reduce)', true)
    render(<TalkingPausesSpec />)
    expect(screen.getByText(/Movimiento reducido/)).toBeInTheDocument()
  })
})
