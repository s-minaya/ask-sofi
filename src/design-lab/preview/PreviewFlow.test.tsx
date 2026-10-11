import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SoundProvider } from '../../app/providers/SoundProvider'
import { ThemeProvider } from '../../app/providers/ThemeProvider'
import { PROVISIONAL_SLOW_THRESHOLD_MS } from '../../components/sofi/ProcessingState/ProcessingState'
import { fakeAudio } from '../../test/fakeAudio'
import { FIXTURE_MESSAGE, LEAD } from '../fixtures'
import { PreviewFlow } from './PreviewFlow'
import type { PreviewCommand } from './previewProtocol'
import {
  SIMULATED_LATENCY_MS,
  SIMULATED_SUBMIT_MS,
  type Scenario,
} from './scenarios'

function renderFlow(scenario: Scenario = 'success', audio = fakeAudio()) {
  render(
    <ThemeProvider>
      <SoundProvider createAudio={() => audio}>
        <PreviewFlow initialScenario={scenario} />
      </SoundProvider>
    </ThemeProvider>,
  )
  return audio
}

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

const command = (value: PreviewCommand, origin = window.location.origin) =>
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'ask-sofi:preview-command', command: value },
        origin,
      }),
    )
  })

function enterAndSubmit() {
  fireEvent.click(screen.getByRole('button', { name: /Empezar/ }))
  fireEvent.click(screen.getByRole('button', { name: /Leer entre líneas/ }))
}

// Cada espera la programa un efecto de la pantalla anterior: se avanzan por separado.
function waitForResult() {
  advance(SIMULATED_SUBMIT_MS)
  advance(SIMULATED_LATENCY_MS)
}

describe('PreviewFlow', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    // Ningún escenario puede depender de una petición real.
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
    vi.useRealTimers()
  })

  it('labels everything as simulated data', () => {
    renderFlow('needs')
    expect(screen.getByText('Demo · datos simulados')).toBeInTheDocument()
    expect(
      screen.getByText('Escenario: contexto insuficiente'),
    ).toBeInTheDocument()
  })

  it('walks from the landing to the reading in the success scenario', () => {
    const audio = renderFlow('success')

    fireEvent.click(screen.getByRole('button', { name: /Empezar/ }))
    expect(
      screen.getByRole('textbox', { name: 'Pégalo tal cual te llegó' }),
    ).toHaveValue(FIXTURE_MESSAGE)
    expect(
      screen.getByRole('heading', { name: 'Pégalo tal cual te llegó' }),
    ).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: /Leer entre líneas/ }))
    expect(screen.getByRole('button', { name: /Enviando/ })).toHaveAttribute(
      'aria-busy',
      'true',
    )

    advance(SIMULATED_SUBMIT_MS)
    expect(
      screen.getByText('Sofi está leyendo tu mensaje.'),
    ).toBeInTheDocument()

    advance(SIMULATED_LATENCY_MS)
    expect(
      screen.getByRole('heading', { name: LEAD.title }),
    ).toBeInTheDocument()
    expect(audio.prepare).not.toHaveBeenCalled()
  })

  it('keeps «Carga» waiting, warns about the long wait and cancels back to the main action', () => {
    renderFlow('loading')
    enterAndSubmit()
    waitForResult()
    expect(
      screen.getByText('Sofi está leyendo tu mensaje.'),
    ).toBeInTheDocument()

    advance(PROVISIONAL_SLOW_THRESHOLD_MS)
    expect(
      screen.getByText(
        'Está tardando más de lo normal. Tu mensaje no se pierde.',
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(
      screen.getByRole('button', { name: /Leer entre líneas/ }),
    ).toHaveFocus()
    expect(
      screen.getByRole('textbox', { name: 'Pégalo tal cual te llegó' }),
    ).toHaveValue(FIXTURE_MESSAGE)
  })

  it('shows the error, keeps the query and fails again on retry', () => {
    renderFlow('error')
    enterAndSubmit()
    waitForResult()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Se ha cortado la línea',
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Se ha cortado la línea' }),
    ).toHaveFocus()
    expect(screen.getByText(FIXTURE_MESSAGE)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(
      screen.getByText('Sofi está leyendo tu mensaje.'),
    ).toBeInTheDocument()
    advance(SIMULATED_LATENCY_MS)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Se ha cortado la línea',
    )
  })

  it('asks for context and reads again once it is given', () => {
    renderFlow('needs')
    enterAndSubmit()
    waitForResult()

    fireEvent.click(screen.getByRole('button', { name: /Volver a leer/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Cuéntame algo del contexto para poder leerlo de nuevo.',
    )

    fireEvent.change(
      screen.getByRole('textbox', { name: 'Y ahora, el salseo' }),
      {
        target: { value: 'Le cancelé la comida con su familia.' },
      },
    )
    fireEvent.click(screen.getByRole('button', { name: /Volver a leer/ }))
    advance(SIMULATED_LATENCY_MS)

    expect(screen.getByText('Escenario: éxito')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: LEAD.title }),
    ).toBeInTheDocument()
  })

  it('follows the commands of the control deck and ignores other origins', () => {
    renderFlow('success')

    command(
      { kind: 'scenario', scenario: 'error' },
      'https://otro-sitio.example',
    )
    expect(screen.getByText('Escenario: éxito')).toBeInTheDocument()

    command({ kind: 'scenario', scenario: 'error' })
    command({ kind: 'step', step: 'result' })
    expect(screen.getByText('Escenario: error')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Se ha cortado la línea',
    )
  })

  it('reports its state to the deck', () => {
    const postMessage = vi.spyOn(window, 'postMessage')
    renderFlow('success')
    fireEvent.click(screen.getByRole('button', { name: /Empezar/ }))

    expect(postMessage).toHaveBeenLastCalledWith(
      {
        type: 'ask-sofi:preview-state',
        state: { scenario: 'success', step: 'consultation', ui: 'idle' },
      },
      window.location.origin,
    )
    postMessage.mockRestore()
  })

  it('prepares the audio only inside «Empezar» when sound was chosen', () => {
    const audio = renderFlow('success')
    fireEvent.click(screen.getByRole('radio', { name: 'Con sonido' }))
    expect(audio.prepare).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Empezar/ }))
    expect(audio.prepare).toHaveBeenCalledTimes(1)
  })
})
