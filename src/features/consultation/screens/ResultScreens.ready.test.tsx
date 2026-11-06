import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PROCESSING_LINES,
  ProcessingState,
  READY_COPY,
} from '../../../components/sofi/ProcessingState/ProcessingState'
import { ProcessingScreen } from './ResultScreens'

// Corrección de T065: un resultado ya recibido que aún no se presenta no es «Sofi sigue leyendo».
// La operación terminó; lo pendiente es solo su presentación. Con `resultReady`, ninguna parte de
// la pantalla afirma que se está procesando. El copy es provisional: la etiqueta de actividad y su
// texto definitivos son de T068/AV1.

afterEach(cleanup)
const noop = () => {}
const claimsProcessing = /leyendo|procesando|tardando/i
const loader = (container: HTMLElement) =>
  container.querySelector('[class*="loader"]')

describe('ProcessingState · operación pendiente', () => {
  it('sin `resultReady` es el de siempre', () => {
    const { container } = render(
      <ProcessingState message="Vale." context="" onCancel={noop} />,
    )
    expect(
      screen.getByRole('heading', { name: 'Leyendo entre líneas…' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Sofi está leyendo tu mensaje.',
    )
    expect(screen.getByText('Sofi está leyendo')).toBeInTheDocument()
    expect(loader(container)).not.toBeNull()
  })
})

describe('ProcessingState · presentación pendiente', () => {
  const ready = () =>
    render(
      <ProcessingState
        message="Vale."
        context="Con contexto"
        resultReady
        onCancel={noop}
      />,
    )

  it('no afirma que Sofi sigue leyendo: ni el titular, ni el estado, ni el rótulo', () => {
    ready()
    expect(screen.getByRole('heading', { level: 1 }).textContent).not.toMatch(
      claimsProcessing,
    )
    expect(screen.getByRole('status').textContent).not.toMatch(claimsProcessing)
    expect(screen.queryByText('Sofi está leyendo')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      READY_COPY.title,
    )
    expect(screen.getByRole('status')).toHaveTextContent(READY_COPY.status)
    expect(screen.getByText(READY_COPY.kicker)).toBeInTheDocument()
  })

  it('anuncia un único estado y deja de enseñar la barra de actividad', () => {
    const { container } = ready()
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(loader(container)).toBeNull()
  })

  it('conserva el mensaje, el contexto y «Cancelar»', () => {
    const onCancel = vi.fn()
    render(
      <ProcessingState
        message="Vale."
        context="Con contexto"
        resultReady
        onCancel={onCancel}
      />,
    )
    expect(screen.getByText('Vale.')).toBeInTheDocument()
    expect(screen.getByText(/Con contexto/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('manda sobre el aviso de espera larga: lo recibido no tarda', () => {
    render(
      <ProcessingState
        message="Vale."
        context=""
        slow
        resultReady
        onCancel={noop}
      />,
    )
    expect(screen.getByRole('status').textContent).not.toMatch(claimsProcessing)
    expect(screen.getByRole('status')).toHaveTextContent(READY_COPY.status)
  })
})

describe('ProcessingScreen · presentación pendiente', () => {
  it('el escenario de Sofi tampoco dice que lee: ni su rótulo ni su diálogo', () => {
    render(
      <ProcessingScreen
        message="Vale."
        context=""
        slow={false}
        resultReady
        onCancel={noop}
      />,
    )
    const stage = screen.getByRole('region', { name: READY_COPY.stageLabel })
    expect(within(stage).getByText(READY_COPY.line)).toBeInTheDocument()
    expect(within(stage).queryByText(PROCESSING_LINES.normal)).toBeNull()
    expect(
      screen.queryByRole('region', { name: 'Sofi está leyendo' }),
    ).toBeNull()
    expect(stage.textContent).not.toMatch(claimsProcessing)
  })

  it('sin `resultReady` conserva su diálogo y su rótulo', () => {
    render(
      <ProcessingScreen
        message="Vale."
        context=""
        slow={false}
        onCancel={noop}
      />,
    )
    expect(
      screen.getByRole('region', { name: 'Sofi está leyendo' }),
    ).toHaveTextContent(PROCESSING_LINES.normal)
  })

  it('el copy provisional es breve, en el tono de Sofi y distinto del de la lectura', () => {
    for (const text of Object.values(READY_COPY)) {
      expect(text.length).toBeGreaterThan(3)
      expect(text).not.toMatch(claimsProcessing)
    }
  })
})
