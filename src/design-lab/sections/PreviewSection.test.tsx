import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PreviewState } from '../preview/previewProtocol'
import { MotionPreferenceProvider } from '../../app/providers/MotionPreference'
import { PreviewSection } from './PreviewSection'

function renderDeck() {
  render(<PreviewSection motion="system" />)
  const iframe = screen.getByTitle(
    'Vista previa de Ask Sofi',
  ) as HTMLIFrameElement
  const frame = iframe.contentWindow as Window
  const postMessage = vi.spyOn(frame, 'postMessage')
  // El iframe informa de su estado: la mesa refleja siempre lo que se ve dentro.
  const report = (state: PreviewState, source: Window | null = frame) =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'ask-sofi:preview-state', state },
          origin: window.location.origin,
          source,
        }),
      )
    })
  return { iframe, postMessage, report }
}

describe('PreviewSection con el selector global', () => {
  it.each(['system', 'reduce', 'full'] as const)(
    'el marco arranca con «%s» y lo recibe por mensaje al cambiar',
    (motion) => {
      // Se parte de otro modo: repetir el mismo no envía nada.
      const { rerender } = render(
        <PreviewSection motion={motion === 'system' ? 'reduce' : 'system'} />,
      )
      const iframe = screen.getByTitle('Vista previa de Ask Sofi')
      const frame = (iframe as HTMLIFrameElement).contentWindow as Window
      const postMessage = vi.spyOn(frame, 'postMessage')

      rerender(<PreviewSection motion={motion} />)

      expect(postMessage).toHaveBeenCalledWith(
        {
          type: 'ask-sofi:preview-command',
          command: { kind: 'motion', value: motion },
        },
        window.location.origin,
      )
    },
  )

  it('si la mesa ya está en «full», el marco arranca con ese valor en la URL', () => {
    render(<PreviewSection motion="full" />)
    expect(screen.getByTitle('Vista previa de Ask Sofi')).toHaveAttribute(
      'src',
      expect.stringContaining('motion=full'),
    )
  })
})

describe('PreviewSection', () => {
  it('identifies the preview as a demo with simulated data', () => {
    renderDeck()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Experience Preview' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Demo · datos simulados')).toBeInTheDocument()
    expect(screen.getByText(/sin una sola petición/)).toBeInTheDocument()
  })

  it('sends the chosen scenario and step to the frame', () => {
    const { postMessage } = renderDeck()

    fireEvent.click(screen.getByRole('radio', { name: 'Error' }))
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: 'ask-sofi:preview-command',
        command: { kind: 'scenario', scenario: 'error' },
      },
      window.location.origin,
    )

    fireEvent.click(screen.getByRole('button', { name: /Consulta/ }))
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: 'ask-sofi:preview-command',
        command: { kind: 'step', step: 'consultation' },
      },
      window.location.origin,
    )
  })

  it('reflects the state reported by the frame and ignores any other window', () => {
    const { report } = renderDeck()

    report(
      { scenario: 'error', step: 'result', ui: 'error', gate: 'none' },
      window,
    )
    expect(screen.getByRole('radio', { name: 'Éxito' })).toBeChecked()

    report({ scenario: 'error', step: 'result', ui: 'error', gate: 'none' })
    expect(screen.getByRole('radio', { name: 'Error' })).toBeChecked()
    expect(screen.getByRole('button', { name: /04\s*Error/ })).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(screen.getByText('ErrorState')).toBeInTheDocument()
    expect(
      screen.getByText(/«Reintentar» vuelve a procesar/),
    ).toBeInTheDocument()
  })

  it('disables the result step while «Carga» never finishes', () => {
    const { report } = renderDeck()
    report({
      scenario: 'loading',
      step: 'processing',
      ui: 'processing',
      gate: 'none',
    })
    expect(
      screen.getByRole('button', { name: /04\s*Resultado/ }),
    ).toBeDisabled()
  })

  it('resizes the frame to the chosen QA view', () => {
    const { iframe } = renderDeck()
    fireEvent.click(screen.getByRole('button', { name: /^Móvil$/ }))
    expect(iframe).toHaveAttribute('width', '390')
    expect(iframe).toHaveAttribute('height', '844')
    expect(screen.getByText(/390 × 844 px/)).toBeInTheDocument()
  })

  it('forwards the audio block simulation to the frame', () => {
    const { postMessage } = renderDeck()
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Simular bloqueo de audio' }),
    )
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: 'ask-sofi:preview-command',
        command: { kind: 'simulate-block', value: true },
      },
      window.location.origin,
    )
  })
})

// T065: la mesa de la Preview ajusta y explica la retención del primer ciclo. Sigue siendo un
// prototipo: el límite de 3 s es el provisional de producción y aquí solo se prueba otro.
describe('PreviewSection · retención del primer ciclo', () => {
  const sent = (postMessage: { mock: { calls: unknown[][] } }) =>
    postMessage.mock.calls
      .map(
        ([message]) =>
          message as { command?: { kind: string; tuning?: object } },
      )
      .filter((message) => message.command?.kind === 'tuning')
      .map((message) => message.command?.tuning)

  it('ofrece el límite, la velocidad de sofing y la latencia, con los valores de partida', () => {
    renderDeck()
    expect(screen.getByLabelText('Límite de retención')).toHaveValue('3000')
    expect(screen.getByLabelText('Velocidad de sofing')).toHaveValue('1')
    expect(screen.getByLabelText('Latencia simulada')).toHaveValue('1600')
    const gate = screen.getByRole('region', {
      name: 'Retención del primer ciclo',
    })
    expect(gate).toHaveTextContent(/provisional/i)
    expect(gate).toHaveTextContent(/AV2/)
  })

  it.each([
    ['Límite de retención', '1500', { limitMs: 1500 }],
    ['Velocidad de sofing', '4', { rate: 4 }],
    ['Latencia simulada', '800', { latencyMs: 800 }],
  ] as const)('«%s» llega al marco como un ajuste', (label, value, patch) => {
    const { postMessage } = renderDeck()
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
    expect(sent(postMessage)).toContainEqual(patch)
  })

  it('«Valores por defecto» los devuelve al marco y a los controles', () => {
    const { postMessage } = renderDeck()
    fireEvent.change(screen.getByLabelText('Límite de retención'), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Valores por defecto' }))
    expect(screen.getByLabelText('Límite de retención')).toHaveValue('3000')
    expect(sent(postMessage).at(-1)).toEqual({
      limitMs: 3000,
      latencyMs: 1600,
      rate: 1,
    })
  })

  it('si el marco se recarga, recupera los ajustes actuales de la mesa', () => {
    const { postMessage } = renderDeck()
    fireEvent.change(screen.getByLabelText('Límite de retención'), {
      target: { value: '1000' },
    })
    postMessage.mockClear()
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'ask-sofi:preview-ready' },
          origin: window.location.origin,
          source: (
            screen.getByTitle('Vista previa de Ask Sofi') as HTMLIFrameElement
          ).contentWindow,
        }),
      )
    })
    expect(sent(postMessage).at(-1)).toMatchObject({ limitMs: 1000 })
  })

  it.each([
    ['none', /Sin resultado todavía/],
    ['held', /Retenido/],
    ['ciclo', /fin del primer ciclo/],
    ['límite', /límite/],
    ['inmediato', /en el acto/],
    ['reducido', /movimiento reducido/],
  ] as const)('dice qué pasó con el resultado: %s', (gate, text) => {
    const { report } = renderDeck()
    report({ scenario: 'success', step: 'processing', ui: 'processing', gate })
    expect(
      screen.getByRole('status', { name: 'Presentación del resultado' }),
    ).toHaveTextContent(text)
  })

  describe('qué retiene y qué no (la propia presentationGate, en vivo)', () => {
    const row = (name: string) =>
      screen.getByRole('row', { name: new RegExp(name) })

    it('solo un resultado no crítico espera; todo lo demás se presenta en el acto', () => {
      renderDeck()
      for (const name of ['Lectura interpretada', 'Falta de contexto'])
        expect(row(name)).toHaveTextContent(/espera hasta 3 s/i)
      for (const name of [
        'Error',
        'safety_concern',
        'Seguridad no evaluada',
        'Privacidad',
        'Borrado',
        'Cancelación',
        'Salida rápida',
      ])
        expect(row(name)).toHaveTextContent(/en el acto/i)
    })

    it('sigue al límite de la mesa', () => {
      renderDeck()
      fireEvent.change(screen.getByLabelText('Límite de retención'), {
        target: { value: '1500' },
      })
      expect(row('Lectura interpretada')).toHaveTextContent(
        /espera hasta 1,5 s/i,
      )
      fireEvent.change(screen.getByLabelText('Límite de retención'), {
        target: { value: '0' },
      })
      expect(row('Lectura interpretada')).toHaveTextContent(/en el acto/i)
    })

    it('con movimiento reducido nada espera', () => {
      render(
        <MotionPreferenceProvider value="reduce">
          <PreviewSection motion="reduce" />
        </MotionPreferenceProvider>,
      )
      expect(row('Lectura interpretada')).toHaveTextContent(/en el acto/i)
    })

    it('avisa de que la seguridad y el borrado no tienen pantalla en la Preview', () => {
      renderDeck()
      expect(screen.getByText(/sin pantalla/i)).toBeInTheDocument()
    })
  })
})
