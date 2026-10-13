import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MotionPreferenceProvider } from '../../app/providers/MotionPreference'
import {
  readPartnerProfile,
  savePartnerProfile,
} from '../../infrastructure/storage/partnerProfileStorage'
import { setMediaQuery } from '../../test/matchMedia'
import { ProfileScreen } from './ProfileScreen'

// Ficha única del expediente (004-spec §2–3). Aquí solo se edita: guardar,
// descartar y eliminar llegan en T023–T024, y las reacciones de Sofi en T020.
const NARROW = 'not all and (min-width: 60em)'
const QUESTIONS = {
  directness: 'Cuando algo le molesta, ¿cómo suele expresarlo?',
  sarcasm: '¿Utiliza la ironía o el sarcasmo al escribir?',
  conflict: 'Cuando discutís, ¿qué suele preferir?',
  messageStyle: '¿Cómo suele escribirte normalmente?',
}

function renderScreen(onBack = vi.fn()) {
  // Movimiento reducido: las preguntas se muestran enteras, sin temporizadores.
  const view = render(
    <MotionPreferenceProvider value="reduce">
      <ProfileScreen onBack={onBack} />
    </MotionPreferenceProvider>,
  )
  return { ...view, onBack }
}

const area = (name: string) => {
  const nav = screen.getByRole('navigation', { name: 'Las seis áreas' })
  return within(nav).getByRole('button', { name: new RegExp(name) })
}
// El texto entero de la pregunta, esté o no en una región de anuncios.
const activeQuestion = () =>
  document.querySelector('figure p[class*="srOnly"]')?.textContent
// El texto visible de una opción: el índice repite las respuestas, así que se
// busca dentro del grupo de opciones.
const option = (name: string) =>
  within(screen.getByRole('group', { name: /Pregunta \d de 6/ })).getByText(
    name,
  )
const radio = (name: string) => screen.getByRole('radio', { name })
const checked = () => screen.queryAllByRole('radio', { checked: true })

describe('ficha del expediente · pregunta activa', () => {
  it('abre en la primera área, con su pregunta y sus opciones', () => {
    renderScreen()

    expect(activeQuestion()).toBe(QUESTIONS.directness)
    expect(
      screen
        .getAllByRole('radio')
        .map((option) => option.getAttribute('value')),
    ).toEqual(['says-it-clearly', 'drops-hints', 'depends', 'unknown'])
    expect(checked()).toHaveLength(0)
  })

  it('la pregunta y las opciones comparten el bocadillo en estrecho', () => {
    setMediaQuery(NARROW, true)
    renderScreen()

    const bubble = screen.getByRole('group', { name: /Pregunta 1 de 6/ })
    expect(bubble.closest('figure')).not.toBeNull()
    expect(bubble.closest('figure')).toHaveTextContent(QUESTIONS.directness)
  })

  // Revisión visual de 004: las respuestas van siempre dentro del bocadillo.
  it('a cualquier ancho las opciones van dentro del bocadillo', () => {
    setMediaQuery(NARROW, false)
    renderScreen()

    const options = screen.getByRole('group', { name: /Pregunta 1 de 6/ })
    expect(options.closest('figure')).not.toBeNull()
  })

  it('ofrece las seis áreas y marca la activa', () => {
    renderScreen()

    const nav = screen.getByRole('navigation', { name: 'Las seis áreas' })
    expect(within(nav).getAllByRole('button')).toHaveLength(6)
    expect(area('Comunicación directa')).toHaveAttribute('aria-current', 'true')
    expect(area('Sarcasmo')).not.toHaveAttribute('aria-current')
  })

  it('«Volver a la consulta» vuelve sin tocar nada', async () => {
    const user = userEvent.setup()
    const { onBack } = renderScreen()

    await user.click(
      screen.getByRole('button', { name: /Volver a la consulta/ }),
    )

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})

describe('ficha del expediente · respuestas', () => {
  it('se selecciona una respuesta y el índice la refleja', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(option('Suele dar indirectas'))

    expect(radio('Suele dar indirectas')).toBeChecked()
    expect(area('Comunicación directa')).toHaveTextContent(
      'Suele dar indirectas',
    )
  })

  it('se puede modificar: la nueva sustituye a la anterior', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(option('Lo dice claramente'))
    await user.click(option('Depende'))

    expect(checked()).toHaveLength(1)
    expect(radio('Depende')).toBeChecked()
  })

  it('se puede quitar: la pregunta vuelve a quedar sin responder', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(option('Depende'))

    await user.click(screen.getByRole('button', { name: 'Quitar respuesta' }))

    expect(checked()).toHaveLength(0)
    expect(
      screen.queryByRole('button', { name: 'Quitar respuesta' }),
    ).not.toBeInTheDocument()
    expect(area('Comunicación directa')).toHaveTextContent('Sin responder')
  })

  it('«Depende» y «No lo sé» son respuestas distintas de no responder', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(option('Depende'))
    await user.click(area('Sarcasmo'))
    await user.click(option('No lo sé'))

    expect(area('Comunicación directa')).toHaveTextContent('Depende')
    expect(area('Sarcasmo')).toHaveTextContent('No lo sé')
    expect(area('Conflictos')).toHaveTextContent('Sin responder')
  })

  it('omitir una pregunta no impide responder las demás', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(area('Conflictos'))
    await user.click(option('Retomarlo más tarde'))

    expect(area('Comunicación directa')).toHaveTextContent('Sin responder')
    expect(area('Conflictos')).toHaveTextContent('Retomarlo más tarde')
  })
})

describe('ficha del expediente · navegación entre áreas', () => {
  it('se llega directamente a cualquier área desde el índice', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(area('Estilo habitual de mensajes'))

    expect(activeQuestion()).toBe(QUESTIONS.messageStyle)
    expect(area('Estilo habitual de mensajes')).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('group', { name: /Pregunta 6 de 6/ })).toBeVisible()
  })

  it('conserva las respuestas sin guardar al ir y volver entre áreas', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(option('Suele dar indirectas'))

    await user.click(area('Sarcasmo'))
    await user.click(option('A veces'))
    await user.click(area('Comunicación directa'))

    expect(radio('Suele dar indirectas')).toBeChecked()
    await user.click(area('Sarcasmo'))
    expect(radio('A veces')).toBeChecked()
  })

  it('conserva las notas al cambiar de área', async () => {
    const user = userEvent.setup()
    renderScreen()
    const notes = screen.getByRole('textbox', { name: /Notas adicionales/ })
    await user.type(notes, 'Contesta tarde.')

    await user.click(area('Conflictos'))
    await user.click(area('Comunicación directa'))

    expect(notes).toHaveValue('Contesta tarde.')
  })

  it('«Siguiente pregunta» pasa a la siguiente área, y solo a petición', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: 'Siguiente pregunta' }))

    expect(activeQuestion()).toBe(QUESTIONS.sarcasm)
  })

  it('la última área no ofrece «Siguiente pregunta»', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(area('Estilo habitual de mensajes'))

    expect(
      screen.queryByRole('button', { name: 'Siguiente pregunta' }),
    ).not.toBeInTheDocument()
  })
})

// T017: nada avanza solo y el orden lo decide el usuario.
describe('ficha del expediente · sin avance automático', () => {
  it('responder no cambia la pregunta activa ni mueve el foco', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(option('Lo dice claramente'))

    expect(activeQuestion()).toBe(QUESTIONS.directness)
    expect(area('Comunicación directa')).toHaveAttribute('aria-current', 'true')
    expect(radio('Lo dice claramente')).toHaveFocus()
  })

  it('tampoco avanza con el teclado', async () => {
    const user = userEvent.setup()
    renderScreen()

    radio('Lo dice claramente').focus()
    await user.keyboard('{ArrowDown}')

    expect(radio('Suele dar indirectas')).toBeChecked()
    expect(activeQuestion()).toBe(QUESTIONS.directness)
  })

  it('quitar una respuesta tampoco cambia de pregunta', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(option('Depende'))

    await user.click(screen.getByRole('button', { name: 'Quitar respuesta' }))

    expect(activeQuestion()).toBe(QUESTIONS.directness)
  })

  it('las preguntas se responden en cualquier orden y todo se conserva', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(area('Estilo habitual de mensajes'))
    await user.click(option('Cambia bastante según el momento'))
    await user.click(area('Sarcasmo'))
    await user.click(option('Casi nunca'))
    await user.click(area('Comunicación directa'))
    await user.click(option('No lo sé'))
    // Modificar una ya respondida, sin pasar por las demás.
    await user.click(area('Sarcasmo'))
    await user.click(option('A menudo'))

    expect(area('Estilo habitual de mensajes')).toHaveTextContent(
      'Cambia bastante según el momento',
    )
    expect(area('Sarcasmo')).toHaveTextContent('A menudo')
    expect(area('Comunicación directa')).toHaveTextContent('No lo sé')
    expect(area('Conflictos')).toHaveTextContent('Sin responder')
  })
})

describe('ficha del expediente · lo guardado', () => {
  it('parte del expediente guardado para consultarlo y editarlo', () => {
    savePartnerProfile({
      answers: { directness: 'drops-hints', sarcasm: 'often' },
      notes: 'Contesta tarde.',
    })

    renderScreen()

    expect(radio('Suele dar indirectas')).toBeChecked()
    expect(area('Sarcasmo')).toHaveTextContent('A menudo')
    expect(
      screen.getByRole('textbox', { name: /Notas adicionales/ }),
    ).toHaveValue('Contesta tarde.')
  })

  it('editar no modifica lo guardado: guardar es una acción explícita', async () => {
    const user = userEvent.setup()
    savePartnerProfile({ answers: { sarcasm: 'often' }, notes: '' })
    renderScreen()

    await user.click(option('Depende'))
    await user.type(
      screen.getByRole('textbox', { name: /Notas adicionales/ }),
      'Algo nuevo',
    )

    const stored = readPartnerProfile()
    expect(stored.status).toBe('ok')
    expect(stored.status === 'ok' && stored.value).toEqual({
      answers: { sarcasm: 'often' },
      notes: '',
    })
  })

  it('sin expediente guardado, editar no crea ninguno', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(option('Depende'))

    expect(readPartnerProfile().status).toBe('missing')
  })
})
