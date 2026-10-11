import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../app/providers/ThemeProvider'
import { SiteHeader } from '../layout/SiteHeader/SiteHeader'
import { EmptyState } from './EmptyState/EmptyState'
import { Badge, ClueList, HintList } from './Indicators/Indicators'
import { Loader } from './Loader/Loader'
import { InlineNotice, Notice, NoticeText } from './Notice/Notice'
import { SkipLink } from './SkipLink/SkipLink'
import { Ticker } from './Ticker/Ticker'

describe('Notice', () => {
  it('es una sección con el nombre de su titular', () => {
    render(
      <Notice tone="attention" kicker="Atención" title="La letra pequeña">
        <NoticeText>
          Los porcentajes no miden lo que siente tu pareja.
        </NoticeText>
      </Notice>,
    )

    expect(
      screen.getByRole('region', { name: 'La letra pequeña' }),
    ).toBeInTheDocument()
  })

  it('solo interrumpe cuando se le pide (role alert)', () => {
    render(<Notice tone="danger" title="Se ha cortado la línea" role="alert" />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Se ha cortado la línea',
    )
  })

  it('el aviso de una línea puede anunciarse como estado', () => {
    render(
      <InlineNotice role="status">
        <span>Tu navegador ha bloqueado el sonido.</span>
      </InlineNotice>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Tu navegador ha bloqueado el sonido.',
    )
  })
})

describe('Ticker', () => {
  it('se puede pausar y cada titular se lee una sola vez', async () => {
    render(
      <Ticker
        label="Última hora"
        headlines={['Ninguna lectura es una sentencia']}
      />,
    )

    const copies = screen.getAllByText('Ninguna lectura es una sentencia')
    expect(copies).toHaveLength(2)
    expect(
      copies.filter((copy) => copy.getAttribute('aria-hidden') === 'true'),
    ).toHaveLength(1)

    const pause = screen.getByRole('button', { name: 'Pausar titulares' })
    await userEvent.click(pause)
    expect(pause).toHaveAttribute('aria-pressed', 'true')
    expect(pause.closest('[data-paused]')).toHaveAttribute(
      'data-paused',
      'true',
    )
  })
})

describe('SiteHeader', () => {
  it('vuelve a la portada y ofrece tema y sonido', async () => {
    const onHome = vi.fn()
    const onToggleSound = vi.fn()
    render(
      <ThemeProvider>
        <SiteHeader
          onHome={onHome}
          tag="En directo"
          kicker="El consultorio de Sofi"
          soundEnabled={false}
          onToggleSound={onToggleSound}
        />
      </ThemeProvider>,
    )

    const header = screen.getByRole('banner')
    await userEvent.click(
      within(header).getByRole('button', {
        name: 'Ask Sofi, volver a portada',
      }),
    )
    await userEvent.click(
      within(header).getByRole('button', { name: 'Sonido de Sofi' }),
    )

    expect(onHome).toHaveBeenCalledTimes(1)
    expect(onToggleSound).toHaveBeenCalledTimes(1)
    expect(
      within(header).getByRole('group', { name: 'Tema' }),
    ).toBeInTheDocument()
  })
})

describe('Indicadores y estados vacíos', () => {
  it('etiquetan sin ser controles', () => {
    render(
      <>
        <HintList
          label="Pistas para el contexto"
          hints={['¿Qué pasó antes?']}
        />
        <ClueList clues={['Punto final']} />
        <Badge tone="fill" pips={{ filled: 2 }}>
          Confianza: <strong>media</strong>
        </Badge>
      </>,
    )

    expect(
      screen.getByRole('list', { name: 'Pistas para el contexto' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Punto final')).toBeInTheDocument()
    expect(screen.getByText(/Confianza/)).toHaveTextContent('Confianza: media')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('el cargador es decorativo y el salto de contenido lleva al principal', () => {
    const { container } = render(
      <>
        <SkipLink href="#main" />
        <Loader />
      </>,
    )

    expect(
      screen.getByRole('link', { name: 'Saltar al contenido' }),
    ).toHaveAttribute('href', '#main')
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('el estado vacío propone una acción', () => {
    render(
      <EmptyState
        title="Aquí aún no hay salseo"
        action={<button type="button">Empezar una consulta</button>}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Aquí aún no hay salseo' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Empezar una consulta' }),
    ).toBeInTheDocument()
  })
})
