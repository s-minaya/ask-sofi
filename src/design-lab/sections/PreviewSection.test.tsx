import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PreviewState } from '../preview/previewProtocol'
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

    report({ scenario: 'error', step: 'result', ui: 'error' }, window)
    expect(screen.getByRole('radio', { name: 'Éxito' })).toBeChecked()

    report({ scenario: 'error', step: 'result', ui: 'error' })
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
    report({ scenario: 'loading', step: 'processing', ui: 'processing' })
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
