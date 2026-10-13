import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useReducer, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { MotionPreferenceProvider } from '../../app/providers/MotionPreference'
import {
  EMPTY_PARTNER_PROFILE,
  setAnswer,
  type PartnerProfile,
} from '../../domain/partner-profile/partnerProfile'
import { setMediaQuery } from '../../test/matchMedia'
import { REACTION_COMMENTS } from './profileCopy'
import { ProfileSheet, type SheetManagement } from './ProfileSheet'
import {
  guideReducer,
  openGuide,
  type GuideEvent,
  type GuideState,
} from './sofiGuide'

const noop = () => {}

const management = (overrides: Partial<SheetManagement> = {}) =>
  ({
    hasSaved: false,
    dirty: false,
    notice: null,
    error: null,
    onSave: noop,
    onDiscard: noop,
    onRequestDelete: noop,
    onCancelDelete: noop,
    onConfirmDelete: noop,
    ...overrides,
  }) satisfies SheetManagement

function renderSheet(
  events: GuideEvent[],
  {
    draft = EMPTY_PARTNER_PROFILE,
    comments = REACTION_COMMENTS,
    manage = management(),
  }: {
    draft?: PartnerProfile
    // null: sin comentarios / sin gestión (undefined activaría el valor por defecto).
    comments?: typeof REACTION_COMMENTS | null
    manage?: SheetManagement | null
  } = {},
) {
  const guide = events.reduce(guideReducer, openGuide('directness'))
  return render(
    <MotionPreferenceProvider value="reduce">
      <ProfileSheet
        draft={draft}
        guide={guide}
        comments={comments ?? undefined}
        management={manage ?? undefined}
        onBack={noop}
        onSelectArea={noop}
        onAnswer={noop}
        onClearAnswer={noop}
        onSpeechEnded={noop}
        onNotesChange={noop}
      />
    </MotionPreferenceProvider>,
  )
}

// La composición no debe moverse al reaccionar: el bocadillo reserva siempre el
// hueco del comentario más largo (la medida real se comprueba en el navegador).
describe('ProfileSheet · composición estable', () => {
  it('reserva el hueco de todos los comentarios aunque Sofi no reaccione', () => {
    renderSheet([{ type: 'speechEnded' }])

    for (const comment of Object.values(REACTION_COMMENTS))
      expect(screen.getByText(comment)).not.toBeVisible()
  })

  it('con una reacción, solo se ve su comentario, y se anuncia una vez', () => {
    renderSheet([
      { type: 'speechEnded' },
      { type: 'answer', answer: 'says-it-clearly' },
    ])

    const shown = screen
      .getAllByText(REACTION_COMMENTS.answered)
      .filter((element) => element.getAttribute('role') !== 'status')
    expect(shown).toHaveLength(1)
    expect(shown[0]).toBeVisible()
    expect(screen.getByText(REACTION_COMMENTS.saved)).not.toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(
      REACTION_COMMENTS.answered,
    )
  })

  it('«Descartar cambios» queda fuera de la barra fija de guardar', () => {
    renderSheet([{ type: 'speechEnded' }], {
      manage: management({ dirty: true }),
    })

    const save = screen.getByRole('button', { name: 'Guardar expediente' })
    const discard = screen.getByRole('button', { name: 'Descartar cambios' })
    expect(save.parentElement).not.toContainElement(discard)
  })

  it('al quitar la respuesta, el foco vuelve a las opciones', () => {
    renderSheet(
      [{ type: 'speechEnded' }, { type: 'answer', answer: 'says-it-clearly' }],
      {
        draft: setAnswer(
          EMPTY_PARTNER_PROFILE,
          'directness',
          'says-it-clearly',
        ),
      },
    )

    screen.getByRole('button', { name: 'Quitar respuesta' }).click()

    expect(screen.getAllByRole('radio')[0]).toHaveFocus()
  })

  it('sin respuesta, «Quitar respuesta» guarda su sitio pero no se puede usar', () => {
    renderSheet([{ type: 'speechEnded' }])

    expect(
      screen.queryByRole('button', { name: 'Quitar respuesta' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Quitar respuesta')).not.toBeVisible()
  })
})

// Composición móvil aprobada en T012: las respuestas dentro del bocadillo, solo en estrecho.
// T016: sin guardar ni reaccionar (T020, T023–T024) la ficha solo se edita.
describe('ProfileSheet · edición', () => {
  it('sin gestión no hay guardar, descartar ni eliminar', () => {
    renderSheet([{ type: 'speechEnded' }], { manage: null })

    expect(
      screen.queryByRole('button', { name: 'Guardar expediente' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Descartar cambios' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Eliminar expediente')).not.toBeInTheDocument()
  })

  it('sin comentarios no hay región de estado ni hueco reservado', () => {
    renderSheet([{ type: 'speechEnded' }], {
      comments: null,
      manage: null,
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    for (const comment of Object.values(REACTION_COMMENTS))
      expect(screen.queryByText(comment)).not.toBeInTheDocument()
  })
})

describe('ProfileSheet · respuestas en el bocadillo', () => {
  const NARROW = 'not all and (min-width: 60em)'
  const insideBubble = () =>
    screen.getByRole('group', { name: /Pregunta 1 de 6/ }).closest('figure') !==
    null

  // Revisión visual de 004: pregunta y respuestas comparten bocadillo a
  // cualquier ancho, sin nada fijo.
  it.each([
    ['estrecho', true],
    ['escritorio', false],
  ])('en %s, la pregunta y sus respuestas comparten bocadillo', (_, narrow) => {
    setMediaQuery(NARROW, narrow)
    renderSheet([{ type: 'speechEnded' }])

    expect(insideBubble()).toBe(true)
    expect(
      screen
        .getByRole('button', { name: 'Siguiente pregunta' })
        .closest('figure'),
    ).not.toBeNull()
  })

  it('no hay cabeza fijada ni nada que se quede pegado al desplazarse', () => {
    const { container } = renderSheet([{ type: 'speechEnded' }])

    expect(container.querySelector('[class*="pinned"]')).toBeNull()
    expect(
      document.documentElement.style.getPropertyValue('--stage-head-h'),
    ).toBe('')
    expect(document.documentElement.dataset.stageStack).toBeUndefined()
  })

  it('una sola Sofi, y la pregunta y el índice en su sitio', () => {
    renderSheet([{ type: 'speechEnded' }])

    const stage = screen.getByRole('region', { name: 'La pregunta de Sofi' })
    expect(within(stage).getAllByRole('img')).toHaveLength(1)
    expect(
      screen.getByRole('navigation', { name: 'Las seis áreas' }),
    ).toBeInTheDocument()
  })
})

// Estado real de la ficha: el reductor de Sofi y el borrador, como la pantalla.
function StatefulSheet({
  draft = EMPTY_PARTNER_PROFILE,
}: {
  draft?: PartnerProfile
}) {
  const [guide, dispatch] = useReducer(
    (state: GuideState, event: GuideEvent) => guideReducer(state, event),
    undefined,
    () => guideReducer(openGuide('directness'), { type: 'speechEnded' }),
  )
  const [value, setValue] = useState(draft)
  return (
    <MotionPreferenceProvider value="reduce">
      <ProfileSheet
        draft={value}
        guide={guide}
        comments={REACTION_COMMENTS}
        onBack={noop}
        onSelectArea={(area) => dispatch({ type: 'selectArea', area })}
        onAnswer={(answer) => {
          setValue(setAnswer(value, guide.area, answer))
          dispatch({ type: 'answer', answer })
        }}
        onClearAnswer={() => dispatch({ type: 'clearAnswer' })}
        onSpeechEnded={() => dispatch({ type: 'speechEnded' })}
        onNotesChange={noop}
      />
    </MotionPreferenceProvider>
  )
}

const indexButton = (name: string) =>
  within(screen.getByRole('navigation', { name: 'Las seis áreas' })).getByRole(
    'button',
    { name: new RegExp(name) },
  )
const liveRegion = () =>
  document.querySelector<HTMLElement>('figure p[aria-live]')

// Regresión de 004: el bocadillo se rehace al cambiar de pregunta y con él sus
// controles. Antes, «Siguiente pregunta» perdía el foco (quedaba en <body>) y
// elegir una pregunta desde el índice dejaba el foco en el índice, con las
// respuestas atrás.
describe('ProfileSheet · foco al cambiar de pregunta', () => {
  it('desde el índice, el foco pasa a las respuestas de la pregunta elegida', async () => {
    render(<StatefulSheet />)

    await userEvent.click(indexButton('Conflictos'))

    const group = screen.getByRole('group', { name: /Pregunta 3 de 6/ })
    expect(document.activeElement).toBe(within(group).getAllByRole('radio')[0])
  })

  it('con una respuesta ya marcada, el foco va a la marcada', async () => {
    render(
      <StatefulSheet
        draft={setAnswer(EMPTY_PARTNER_PROFILE, 'conflict', 'depends')}
      />,
    )

    await userEvent.click(indexButton('Conflictos'))

    expect(screen.getByRole('radio', { name: 'Depende' })).toHaveFocus()
  })

  it('el grupo dice área y pregunta, y la región de anuncios no la repite', async () => {
    render(<StatefulSheet />)
    expect(liveRegion()?.textContent).toContain('¿cómo suele expresarlo?')

    await userEvent.click(indexButton('Conflictos'))

    expect(
      screen.getByRole('group', {
        name: /Pregunta 3 de 6:\s*Conflictos\s*\.\s*Cuando discutís, ¿qué suele preferir\?/,
      }),
    ).toBeInTheDocument()
    expect(liveRegion()).toBeNull()
  })

  it('«Siguiente pregunta» deja el foco en el mismo enlace de la pregunta nueva', async () => {
    render(<StatefulSheet />)

    await userEvent.click(
      screen.getByRole('button', { name: 'Siguiente pregunta' }),
    )

    // El enlace es otro nodo (el bocadillo se rehace) y el foco sigue en él.
    expect(
      screen.getByRole('button', { name: 'Siguiente pregunta' }),
    ).toHaveFocus()
    expect(liveRegion()?.textContent).toContain('ironía')
  })

  it('en la última pregunta, sin «Siguiente», el foco va a sus respuestas', async () => {
    render(<StatefulSheet />)

    await userEvent.click(indexButton('Estilo habitual'))

    const group = screen.getByRole('group', { name: /Pregunta 6 de 6/ })
    expect(group.contains(document.activeElement)).toBe(true)
    expect(
      screen.queryByRole('button', { name: 'Siguiente pregunta' }),
    ).not.toBeInTheDocument()
  })

  it('«Quitar respuesta» devuelve el foco a las opciones', async () => {
    render(
      <StatefulSheet
        draft={setAnswer(EMPTY_PARTNER_PROFILE, 'directness', 'depends')}
      />,
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Quitar respuesta' }),
    )

    expect(document.activeElement?.closest('fieldset')).not.toBeNull()
  })
})

// 004-spec §6: el almacenamiento local y el procesamiento externo no son lo mismo.
// Guardar no envía nada; solo un análisis futuro podrá enviar lo relevante, y de
// forma temporal. El texto no debe afirmar un envío que hoy no existe.
describe('ProfileSheet · privacidad', () => {
  it('distingue guardar en el dispositivo de enviar para un análisis', () => {
    renderSheet([{ type: 'speechEnded' }])

    const text = screen.getByText(/se guarda solo en este dispositivo/i)
    expect(text).toHaveTextContent('guardarlo no envía nada')
    expect(text).toHaveTextContent(/si lo usas en una lectura/i)
    expect(text).toHaveTextContent(/podrá enviarse de forma temporal/i)
    expect(text).not.toHaveTextContent(/se enviará/i)
  })
})
