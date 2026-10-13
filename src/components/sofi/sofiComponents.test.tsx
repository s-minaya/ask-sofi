import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ContextInput } from './ContextInput/ContextInput'
import { ErrorState } from './ErrorState/ErrorState'
import {
  InterpretationLead,
  InterpretationList,
  ReliabilityBadges,
} from './Interpretations/Interpretations'
import { MessageBubble, MessageInput } from './MessageBubble/MessageBubble'
import { PhotoBooth } from './PhotoBooth/PhotoBooth'
import {
  contextSummary,
  ProcessingState,
} from './ProcessingState/ProcessingState'
import {
  ContextQuestions,
  FinePrint,
  MissingData,
  ReadingBoxes,
  SofiAdvice,
} from './ReadingBoxes/ReadingBoxes'
import { SofiPortrait } from './SofiPortrait/SofiPortrait'

const LEAD = {
  id: 'v1',
  title: 'Le ha sentado regular',
  explanation: 'Contaba con esa comida y el cambio le ha decepcionado.',
  percentage: 52,
  clues: ['Punto final', 'Sin emojis'],
}

describe('SofiPortrait', () => {
  it('describe la expresión cuando aporta y se oculta cuando es decorativo', () => {
    render(
      <>
        <SofiPortrait
          size={192}
          expression="unconvinced"
          alt="Sofi entrecierra los ojos, poco convencida"
        />
        <SofiPortrait size={96} expression="attentive" />
      </>,
    )

    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(
      screen.getByRole('img', {
        name: 'Sofi entrecierra los ojos, poco convencida',
      }),
    ).toBeInTheDocument()
  })

  describe('con una imagen estática', () => {
    const image = '/sofi-smug.webp'
    const sprite = (container: HTMLElement) =>
      container.querySelector('[class*="sofi-blink"]')
    const picture = (container: HTMLElement) => container.querySelector('img')

    it('mientras carga se ve el parpadeo como alternativa', () => {
      const { container } = render(
        <SofiPortrait size={384} image={image} alt="Sofi, satisfecha" />,
      )

      expect(sprite(container)).toBeInTheDocument()
      expect(picture(container)).not.toBeVisible()
    })

    it('al cargar, la imagen sustituye al parpadeo', () => {
      const { container } = render(
        <SofiPortrait size={384} image={image} alt="Sofi, satisfecha" />,
      )

      fireEvent.load(picture(container) as HTMLImageElement)

      expect(sprite(container)).not.toBeInTheDocument()
      expect(picture(container)).toBeVisible()
      expect(picture(container)).toHaveAttribute('width', '384')
    })

    // Un recurso que falla nunca deja a Sofi sin representación.
    it('si falla, se queda el parpadeo', () => {
      const { container } = render(
        <SofiPortrait size={384} image={image} frame={1} />,
      )

      fireEvent.error(picture(container) as HTMLImageElement)

      expect(picture(container)).not.toBeInTheDocument()
      expect(sprite(container)).toBeInTheDocument()
    })

    it('conserva la accesibilidad del retrato', () => {
      render(
        <>
          <SofiPortrait size={384} image={image} alt="Sofi, satisfecha" />
          <SofiPortrait size={192} image={image} />
        </>,
      )

      expect(screen.getAllByRole('img')).toHaveLength(1)
      expect(
        screen.getByRole('img', { name: 'Sofi, satisfecha' }),
      ).toBeInTheDocument()
    })

    it('al cambiar de imagen vuelve a esperar a que cargue', () => {
      const { container, rerender } = render(
        <SofiPortrait size={384} image={image} />,
      )
      fireEvent.load(picture(container) as HTMLImageElement)

      rerender(<SofiPortrait size={384} image="/sofi-thinking.webp" />)

      expect(sprite(container)).toBeInTheDocument()
      expect(picture(container)).toHaveAttribute('src', '/sofi-thinking.webp')
    })
  })

  it('el fotomatón es decorativo y lo cuenta su pie', () => {
    render(<PhotoBooth orientation="vertical" />)

    expect(
      screen.getByText('Pillada leyendo tus mensajes').closest('figure'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('SofiPortrait · tamaño', () => {
  it('con imagen, la alternativa y la imagen siguen al contenedor si este cambia de tamaño', () => {
    const { container } = render(
      <SofiPortrait
        size={384}
        image="/sofi-approved.webp"
        style={{ width: '120px', height: '120px' }}
        alt="Sofi"
      />,
    )

    const wrapper = screen.getByRole('img', { name: 'Sofi' })
    expect(wrapper).toHaveStyle({ width: '120px', height: '120px' })
    const fallback = container.querySelector('[class*="sprite"]')
    expect(fallback).toHaveStyle({ width: '100%', height: '100%' })
  })
})

describe('MessageInput', () => {
  function Message() {
    const [value, setValue] = useState('')
    const [error, setError] = useState(false)
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setError(!value.trim())
        }}
      >
        <MessageInput
          label="Pégalo tal cual te llegó"
          help="Con sus puntos, sus mayúsculas y sus emojis: aquí todo es una pista."
          value={value}
          onChange={(next) => {
            setValue(next)
            if (next.trim()) setError(false)
          }}
          error={error ? 'Pega el mensaje para que pueda leerlo.' : undefined}
        />
        <button type="submit">Leer entre líneas</button>
      </form>
    )
  }

  it('el paso es un titular que contiene la etiqueta del campo', () => {
    render(<Message />)

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Pégalo tal cual te llegó',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Pégalo tal cual te llegó'),
    ).toHaveAccessibleDescription(
      'Con sus puntos, sus mayúsculas y sus emojis: aquí todo es una pista.',
    )
  })

  it('valida al enviar, anuncia el error y lo quita al escribir', async () => {
    render(<Message />)
    const field = screen.getByLabelText('Pégalo tal cual te llegó')

    await userEvent.click(
      screen.getByRole('button', { name: 'Leer entre líneas' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Pega el mensaje para que pueda leerlo.',
    )
    expect(field).toHaveAttribute('aria-invalid', 'true')

    await userEvent.type(field, 'Vale.')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('5 caracteres')).toBeInTheDocument()
  })

  it('mientras Sofi lee, el mensaje es de solo lectura', () => {
    render(
      <MessageInput
        label="Pégalo tal cual te llegó"
        value="Vale."
        onChange={() => {}}
        disabled
      />,
    )

    expect(screen.getByLabelText('Pégalo tal cual te llegó')).toBeDisabled()
  })

  it('la burbuja de solo lectura cita el mensaje tal cual', () => {
    render(<MessageBubble message="Vale. Que te lo pases bien." />)

    expect(screen.getByText('Vale. Que te lo pases bien.')).toBeInTheDocument()
  })
})

describe('ContextInput', () => {
  it('con la etiqueta como titular, pistas en lista y contador', () => {
    render(
      <ContextInput
        label="Y ahora, el salseo"
        value="Hace dos semanas"
        onChange={() => {}}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Y ahora, el salseo' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Y ahora, el salseo')).toHaveValue(
      'Hace dos semanas',
    )
    expect(
      within(
        screen.getByRole('list', { name: 'Pistas para el contexto' }),
      ).getAllByRole('listitem'),
    ).toHaveLength(3)
    expect(screen.getByText('16 caracteres')).toBeInTheDocument()
  })

  it('con la etiqueta dentro del cupón cuando Sofi pide contexto', () => {
    render(
      <ContextInput
        label="Y ahora, el salseo"
        labelPlacement="inside"
        value=""
        onChange={() => {}}
        showCount={false}
        hints={['¿Qué pasó antes?']}
        error="Cuéntame algo del contexto para poder leerlo de nuevo."
      />,
    )

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Y ahora, el salseo')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Cuéntame algo del contexto para poder leerlo de nuevo.',
    )
  })
})

describe('ProcessingState', () => {
  it('anuncia un único estado, enseña qué se lee y permite cancelar', async () => {
    const onCancel = vi.fn()
    const { rerender } = render(
      <ProcessingState
        message="Vale."
        context="Hace dos semanas"
        onCancel={onCancel}
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Leyendo entre líneas…' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Sofi está leyendo tu mensaje.',
    )
    expect(screen.getByText('Vale.')).toBeInTheDocument()
    expect(screen.getByText('Con contexto · 16 caracteres')).toBeInTheDocument()

    rerender(
      <ProcessingState message="Vale." context="" slow onCancel={onCancel} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Está tardando más de lo normal. Tu mensaje no se pierde.',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('resume el contexto sin repetirlo', () => {
    expect(contextSummary('   ')).toBe('Sin contexto')
    expect(contextSummary('a')).toBe('Con contexto · 1 carácter')
  })
})

describe('Interpretaciones', () => {
  it('la versión destacada dice que es la más probable, no la única', () => {
    render(<InterpretationLead interpretation={LEAD} />)

    const article = screen.getByRole('article', {
      name: 'Le ha sentado regular',
    })
    expect(within(article).getByText('La más probable')).toBeInTheDocument()
    expect(within(article).getByText('(no la única)')).toBeInTheDocument()
    expect(article).toHaveTextContent('52%')
    expect(within(article).getByText('Punto final')).toBeInTheDocument()
  })

  it('«Reñido» lo dice con las dos cifras cuando la segunda está cerca', () => {
    render(
      <InterpretationLead
        interpretation={{ ...LEAD, percentage: 34 }}
        tone="close"
        runnerUp={31}
      />,
    )

    expect(screen.getByText('Reñido')).toBeInTheDocument()
    expect(screen.getByText('(34 contra 31)')).toBeInTheDocument()
    expect(screen.getByText(/empate técnico/)).toBeInTheDocument()
  })

  it('el resto de versiones se numera y cada medidor es decorativo', () => {
    const { container } = render(
      <InterpretationList
        interpretations={[
          {
            id: 'v2',
            title: 'Espera que lo arregles tú',
            explanation: 'No te lo va a pedir.',
            percentage: 24,
          },
          {
            id: 'v3',
            title: 'Le parece bien, sin más',
            explanation: 'Puede que lo diga literalmente.',
            percentage: 15,
          },
        ]}
      />,
    )

    const versions = screen.getAllByRole('article')
    expect(versions).toHaveLength(2)
    expect(versions[0]).toHaveTextContent('Versión 2')
    expect(versions[1]).toHaveTextContent('Versión 3')
    expect(
      container.querySelectorAll('[aria-hidden="true"]').length,
    ).toBeGreaterThanOrEqual(2)
  })

  it('las insignias leen el nivel en texto', () => {
    render(<ReliabilityBadges confidence="medium" context="partial" />)

    const list = screen.getByRole('list', { name: 'Fiabilidad de la lectura' })
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent?.replace(/\s+/g, ' ')),
    ).toEqual(['Confianza: media', 'Contexto: parcial'])
  })
})

describe('Cierre de la lectura', () => {
  it('la letra pequeña cuenta las versiones y lo que falta se puede añadir', async () => {
    const onAddContext = vi.fn()
    render(
      <ReadingBoxes>
        <FinePrint versions={4} />
        <MissingData
          questions={['¿Ya sabía que era el cumple de Marta?']}
          onAddContext={onAddContext}
        />
        <SofiAdvice
          title="Pregúntale. En serio."
          text="Dos minutos de conversación valen más que cualquier porcentaje."
        />
      </ReadingBoxes>,
    )

    expect(screen.getByText(/entre estas cuatro versiones/)).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Añadir contexto' }),
    )
    expect(onAddContext).toHaveBeenCalled()
    expect(
      screen.getByRole('region', { name: 'Pregúntale. En serio.' }),
    ).toBeInTheDocument()
  })

  it('las preguntas de contexto van en orden', () => {
    render(
      <ContextQuestions
        questions={[
          '¿Qué estaba pasando antes?',
          '¿Suele escribir así de corto?',
        ]}
      />,
    )

    expect(
      within(screen.getByRole('list')).getAllByRole('listitem'),
    ).toHaveLength(2)
  })
})

describe('ErrorState', () => {
  it('dice qué ha pasado, garantiza que no se ha perdido nada y ofrece reintentar', async () => {
    const onRetry = vi.fn()
    const onEdit = vi.fn()
    render(<ErrorState onRetry={onRetry} onEdit={onEdit} announce />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Se ha cortado la línea')
    expect(alert).toHaveTextContent('no se ha perdido nada')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar mensaje' }),
    )
    expect(onRetry).toHaveBeenCalled()
    expect(onEdit).toHaveBeenCalled()
  })

  it('tiene textos para cada tipo de fallo', () => {
    render(<ErrorState kind="offline" onRetry={() => {}} onEdit={() => {}} />)

    expect(
      screen.getByRole('heading', { name: 'Parece que no hay conexión' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
