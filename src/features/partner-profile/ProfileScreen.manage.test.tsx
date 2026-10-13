import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MotionPreferenceProvider } from '../../app/providers/MotionPreference'
import {
  markProfileInvitationPresented,
  isProfileInvitationPending,
} from '../../infrastructure/storage/onboardingStorage'
import {
  readPartnerProfile,
  savePartnerProfile,
} from '../../infrastructure/storage/partnerProfileStorage'
import { localArea } from '../../infrastructure/storage/storageAreas'
import { STORAGE_KEYS } from '../../infrastructure/storage/storageKeys'
import {
  AREA_ANSWERS,
  PROFILE_AREAS,
  type ProfileArea,
} from '../../domain/partner-profile/partnerProfile'
import {
  AREA_COPY,
  REACTION_COMMENTS,
  SHEET_COPY,
  answerLabel,
} from './profileCopy'
import { ProfileScreen } from './ProfileScreen'

// T023: guardar es una acción explícita, descartar vuelve a lo guardado, eliminar
// pide confirmación y afecta solo al expediente, y los fallos de almacenamiento
// no se presentan como guardados.
const SAVED = {
  answers: { directness: 'drops-hints', sarcasm: 'often' },
  notes: 'Contesta tarde.',
} as const

function renderScreen(onBack: () => void = () => {}) {
  return render(
    <MotionPreferenceProvider value="reduce">
      <ProfileScreen onBack={onBack} />
    </MotionPreferenceProvider>,
  )
}

const area = (name: string) =>
  within(screen.getByRole('navigation', { name: 'Las seis áreas' })).getByRole(
    'button',
    { name: new RegExp(name) },
  )
const option = (name: string) =>
  within(screen.getByRole('group', { name: /Pregunta \d de 6/ })).getByText(
    name,
  )
const notes = () => screen.getByRole('textbox', { name: /Notas adicionales/ })
const save = () => screen.getByRole('button', { name: SHEET_COPY.save })
const discard = () => screen.getByRole('button', { name: SHEET_COPY.discard })
const queryDiscard = () =>
  screen.queryByRole('button', { name: SHEET_COPY.discard })
const remove = () => screen.getByRole('button', { name: SHEET_COPY.delete })
const sofi = (name: string) => screen.queryByRole('img', { name })
const stored = () => {
  const outcome = readPartnerProfile()
  return outcome.status === 'ok' ? outcome.value : outcome.status
}
// Los avisos del expediente y el comentario de Sofi son regiones de estado distintas.
const statusTexts = () =>
  screen.getAllByRole('status').map((region) => region.textContent)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('guardar', () => {
  it('guarda solo al pulsar «Guardar» y lo dice', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(option('Suele dar indirectas'))
    await user.type(notes(), 'Contesta tarde.')
    expect(stored()).toBe('missing')

    await user.click(save())

    expect(stored()).toEqual({
      answers: { directness: 'drops-hints' },
      notes: 'Contesta tarde.',
    })
    expect(statusTexts()).toContain(SHEET_COPY.savedNotice)
  })

  it('Sofi lo celebra con su expresión y su comentario', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(option('Depende'))

    await user.click(save())

    expect(
      sofi('Sofi, con gafas de sol, da su visto bueno'),
    ).toBeInTheDocument()
    expect(statusTexts()).toContain(REACTION_COMMENTS.saved)
  })

  it('un expediente parcial se puede guardar, con respuestas distintas de omitidas', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(option('Depende'))
    await user.click(area('Sarcasmo'))
    await user.click(option('No lo sé'))

    await user.click(save())

    expect(stored()).toEqual({
      answers: { directness: 'depends', sarcasm: 'unknown' },
      notes: '',
    })
  })

  it('basta una nota para poder guardar', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(notes(), 'Solo una nota')

    await user.click(save())

    expect(stored()).toEqual({ answers: {}, notes: 'Solo una nota' })
  })

  it('un expediente vacío no se guarda: avisa y Sofi se sorprende', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(save())

    expect(stored()).toBe('missing')
    expect(screen.getByText(SHEET_COPY.empty)).toBeVisible()
    expect(save()).toHaveAccessibleDescription(SHEET_COPY.empty)
    expect(sofi('Sofi, sorprendida')).toBeInTheDocument()
    expect(statusTexts()).toContain(REACTION_COMMENTS.rejected)
  })

  it('unas notas en blanco cuentan como vacío', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(notes(), '   ')

    await user.click(save())

    expect(stored()).toBe('missing')
    expect(screen.getByText(SHEET_COPY.empty)).toBeVisible()
  })

  it('el aviso de vacío se retira al editar', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(save())

    await user.click(option('Depende'))

    expect(screen.queryByText(SHEET_COPY.empty)).not.toBeInTheDocument()
  })

  it('tras guardar, «Descartar cambios» desaparece y vuelve al editar', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(option('Depende'))
    expect(queryDiscard()).toBeInTheDocument()

    await user.click(save())
    expect(queryDiscard()).not.toBeInTheDocument()

    await user.click(option('No lo sé'))
    expect(queryDiscard()).toBeInTheDocument()
  })

  it('al volver a abrir la ficha, el expediente guardado se recupera', async () => {
    const user = userEvent.setup()
    const first = renderScreen()
    await user.click(option('Suele dar indirectas'))
    await user.click(save())
    first.unmount()
    localArea.resetMemory()

    renderScreen()

    expect(
      screen.getByRole('radio', { name: 'Suele dar indirectas' }),
    ).toBeChecked()
    expect(area('Comunicación directa')).toHaveTextContent(
      'Suele dar indirectas',
    )
  })
})

describe('descartar', () => {
  it('vuelve a la última versión guardada sin tocarla', async () => {
    const user = userEvent.setup()
    savePartnerProfile(SAVED)
    renderScreen()
    await user.click(option('Depende'))
    await user.type(notes(), ' Más cosas')

    await user.click(discard())

    expect(
      screen.getByRole('radio', { name: 'Suele dar indirectas' }),
    ).toBeChecked()
    expect(notes()).toHaveValue('Contesta tarde.')
    expect(stored()).toEqual(SAVED)
    expect(queryDiscard()).not.toBeInTheDocument()
    expect(statusTexts()).toContain(REACTION_COMMENTS.discarded)
  })

  it('sin expediente guardado, descarta hasta dejar la ficha en blanco', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(option('Depende'))
    await user.type(notes(), 'Algo')

    await user.click(discard())

    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(0)
    expect(notes()).toHaveValue('')
    expect(stored()).toBe('missing')
  })

  it('abandonar sin guardar no modifica lo guardado', async () => {
    const user = userEvent.setup()
    savePartnerProfile(SAVED)
    const first = renderScreen()
    await user.click(option('Depende'))
    first.unmount()

    renderScreen()

    expect(stored()).toEqual(SAVED)
    expect(
      screen.getByRole('radio', { name: 'Suele dar indirectas' }),
    ).toBeChecked()
  })
})

describe('eliminar', () => {
  it('solo se ofrece cuando hay un expediente guardado', () => {
    renderScreen()

    expect(
      screen.queryByRole('button', { name: SHEET_COPY.delete }),
    ).not.toBeInTheDocument()
  })

  it('pide confirmación sin borrar nada y lleva el foco a ella', async () => {
    const user = userEvent.setup()
    savePartnerProfile(SAVED)
    renderScreen()

    await user.click(remove())

    expect(
      screen.getByRole('heading', { name: SHEET_COPY.confirmTitle }),
    ).toHaveFocus()
    expect(stored()).toEqual(SAVED)
    expect(sofi('Sofi se lo piensa antes de borrar')).toBeInTheDocument()
  })

  it('cancelar conserva el expediente y devuelve el foco a «Eliminar»', async () => {
    const user = userEvent.setup()
    savePartnerProfile(SAVED)
    renderScreen()
    await user.click(remove())

    await user.click(screen.getByRole('button', { name: SHEET_COPY.cancel }))

    expect(stored()).toEqual(SAVED)
    expect(remove()).toHaveFocus()
  })

  it('confirmar elimina el expediente, vacía la ficha y lleva el foco al titular', async () => {
    const user = userEvent.setup()
    savePartnerProfile(SAVED)
    renderScreen()
    await user.click(remove())

    await user.click(screen.getByRole('button', { name: SHEET_COPY.confirm }))

    expect(stored()).toBe('missing')
    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(0)
    expect(notes()).toHaveValue('')
    expect(
      screen.getByRole('heading', { level: 1, name: SHEET_COPY.title }),
    ).toHaveFocus()
    expect(
      screen.queryByRole('button', { name: SHEET_COPY.delete }),
    ).not.toBeInTheDocument()
    expect(
      sofi('Sofi, tranquila, con el expediente en blanco'),
    ).toBeInTheDocument()
    expect(statusTexts()).toContain(REACTION_COMMENTS.deleted)
  })

  it('afecta solo al expediente: preferencias, borradores e invitación siguen', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      STORAGE_KEYS.preferences,
      JSON.stringify({ version: 1, data: { sound: 'on' } }),
    )
    window.sessionStorage.setItem(
      STORAGE_KEYS.consultationDraft,
      JSON.stringify({ version: 1, data: { message: 'Vale', context: '' } }),
    )
    markProfileInvitationPresented()
    savePartnerProfile(SAVED)
    renderScreen()

    await user.click(remove())
    await user.click(screen.getByRole('button', { name: SHEET_COPY.confirm }))

    expect(window.localStorage.getItem(STORAGE_KEYS.preferences)).not.toBeNull()
    expect(
      window.sessionStorage.getItem(STORAGE_KEYS.consultationDraft),
    ).not.toBeNull()
    expect(isProfileInvitationPending()).toBe(false)
  })

  it('tras eliminar se puede empezar de nuevo y guardar otro expediente', async () => {
    const user = userEvent.setup()
    savePartnerProfile(SAVED)
    renderScreen()
    await user.click(remove())
    await user.click(screen.getByRole('button', { name: SHEET_COPY.confirm }))

    await user.click(option('Depende'))
    await user.click(save())

    expect(stored()).toEqual({ answers: { directness: 'depends' }, notes: '' })
  })
})

describe('errores de persistencia', () => {
  it('con el almacenamiento bloqueado no se presenta como guardado', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError')
    })
    renderScreen()
    await user.click(option('Depende'))

    await user.click(save())

    expect(statusTexts()).toContain(SHEET_COPY.memoryNotice)
    expect(statusTexts()).not.toContain(SHEET_COPY.savedNotice)
    expect(sofi('Sofi, sorprendida')).toBeInTheDocument()
    expect(statusTexts()).toContain(REACTION_COMMENTS.savedInMemory)
    // Sigue en pantalla y en memoria durante la sesión.
    expect(screen.getByRole('radio', { name: 'Depende' })).toBeChecked()
    expect(window.localStorage.getItem(STORAGE_KEYS.partnerProfile)).toBeNull()
  })

  it('con la cuota agotada ocurre lo mismo', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('lleno', 'QuotaExceededError')
    })
    renderScreen()
    await user.click(option('Depende'))

    await user.click(save())

    expect(statusTexts()).toContain(SHEET_COPY.memoryNotice)
  })

  it('lo conservado solo en memoria se pierde al recargar', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError')
    })
    const first = renderScreen()
    await user.click(option('Depende'))
    await user.click(save())
    first.unmount()
    localArea.resetMemory()

    renderScreen()

    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(0)
  })

  it('un expediente de una versión posterior no se usa ni se pisa', async () => {
    const user = userEvent.setup()
    const future = JSON.stringify({ version: 2, data: { respuestas: 'otras' } })
    window.localStorage.setItem(STORAGE_KEYS.partnerProfile, future)
    renderScreen()
    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(0)

    await user.click(option('Depende'))
    await user.click(save())

    expect(window.localStorage.getItem(STORAGE_KEYS.partnerProfile)).toBe(
      future,
    )
    expect(statusTexts()).toContain(SHEET_COPY.memoryNotice)
  })

  it('unos datos corruptos no se usan y se sustituyen al guardar', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(STORAGE_KEYS.partnerProfile, '{no es json')
    renderScreen()
    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(0)

    await user.click(option('Depende'))
    await user.click(save())

    expect(stored()).toEqual({ answers: { directness: 'depends' }, notes: '' })
    expect(statusTexts()).toContain(SHEET_COPY.savedNotice)
  })

  it('un campo desconocido deja su área sin responder y conserva el resto', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.partnerProfile,
      JSON.stringify({
        version: 1,
        data: {
          answers: { directness: 'ya-no-existe', sarcasm: 'often' },
          notes: 'Hola',
        },
      }),
    )

    renderScreen()

    expect(area('Comunicación directa')).toHaveTextContent('Sin responder')
    expect(area('Sarcasmo')).toHaveTextContent('A menudo')
    expect(notes()).toHaveValue('Hola')
  })
})

// Completar las seis áreas guía a «Guardar»; guardar (aunque sea una ficha parcial)
// deja como siguiente paso «Volver a la consulta». Nada se fuerza ni se guarda solo.
const FIRST_ANSWER = (item: ProfileArea) =>
  answerLabel(item, AREA_ANSWERS[item][0] as never)
async function answer(
  user: ReturnType<typeof userEvent.setup>,
  areas: readonly ProfileArea[],
) {
  for (const item of areas) {
    await user.click(area(AREA_COPY[item].label))
    await user.click(option(FIRST_ANSWER(item)))
  }
}
const backButtons = () =>
  screen.getAllByRole('button', { name: /Volver a la consulta/ })
const celebrating = () => document.querySelector('[data-celebrating]')

describe('completar las seis áreas', () => {
  it('la sexta respuesta lo celebra, lo dice y guía a «Guardar» sin guardar', async () => {
    const user = userEvent.setup()
    renderScreen()

    await answer(user, PROFILE_AREAS)

    expect(statusTexts()).toContain(REACTION_COMMENTS.completed)
    expect(celebrating()).not.toBeNull()
    // Celebrar no guarda ni cambia de pantalla: sigue habiendo cambios pendientes.
    expect(stored()).toBe('missing')
    expect(queryDiscard()).toBeInTheDocument()
    // Solo está «Volver» de la cabecera: el del pie aparece cuando ya se guardó.
    expect(backButtons()).toHaveLength(1)
  })

  it('con cinco áreas no celebra', async () => {
    const user = userEvent.setup()
    renderScreen()

    await answer(user, PROFILE_AREAS.slice(0, 5))

    expect(celebrating()).toBeNull()
    expect(statusTexts()).not.toContain(REACTION_COMMENTS.completed)
  })

  // «No lo sé» y «Depende» son respuestas: las seis áreas siguen siendo opcionales
  // y completar con ellas cuenta igual.
  it('cuenta también cuando la sexta es «No lo sé»', async () => {
    const user = userEvent.setup()
    renderScreen()
    await answer(user, PROFILE_AREAS.slice(0, 5))
    await user.click(area(AREA_COPY.messageStyle.label))

    await user.click(option('No lo sé'))

    expect(statusTexts()).toContain(REACTION_COMMENTS.completed)
  })

  it('cambiar una respuesta de una ficha ya completa no la vuelve a celebrar', async () => {
    const user = userEvent.setup()
    renderScreen()
    await answer(user, PROFILE_AREAS)
    await user.click(save())
    await user.click(option('Cambia bastante según el momento'))

    expect(celebrating()).toBeNull()
    expect(statusTexts()).not.toContain(REACTION_COMMENTS.completed)
  })

  it('abrir un expediente ya completo no lo celebra', () => {
    savePartnerProfile({
      answers: Object.fromEntries(
        PROFILE_AREAS.map((item) => [item, AREA_ANSWERS[item][0]]),
      ),
      notes: '',
    } as never)

    renderScreen()

    expect(celebrating()).toBeNull()
    expect(backButtons()).toHaveLength(1)
  })
})

describe('después de guardar', () => {
  it('«Volver a la consulta» aparece junto a «Guardar», que no se mueve', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    renderScreen(onBack)
    await answer(user, PROFILE_AREAS)
    expect(backButtons()).toHaveLength(1)

    await user.click(save())

    expect(statusTexts()).toContain(SHEET_COPY.savedNotice)
    const [header, next] = backButtons()
    expect(backButtons()).toHaveLength(2)
    // Guardar sigue donde estaba y con el foco; Volver va justo después en el
    // orden del documento, para que Tab lo encuentre como siguiente paso.
    expect(save()).toHaveFocus()
    expect(
      save().compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      header.compareDocumentPosition(save()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    await user.click(next)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('también tras guardar una ficha parcial: las seis áreas son opcionales', async () => {
    const user = userEvent.setup()
    renderScreen()
    await answer(user, PROFILE_AREAS.slice(0, 2))

    await user.click(save())

    expect(stored()).not.toBe('missing')
    expect(backButtons()).toHaveLength(2)
  })

  it('con el almacenamiento bloqueado se ofrece igual, sin presentarlo como guardado', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError')
    })
    renderScreen()
    await user.click(option('Depende'))

    await user.click(save())

    expect(statusTexts()).not.toContain(SHEET_COPY.savedNotice)
    expect(backButtons()).toHaveLength(2)
  })

  it('al editar de nuevo deja de destacarse: ya hay algo que guardar', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(option('Depende'))
    await user.click(save())
    expect(backButtons()).toHaveLength(2)

    await user.click(option('No lo sé'))

    expect(backButtons()).toHaveLength(1)
  })

  it('un expediente vacío no se guarda y no ofrece volver como si se hubiera guardado', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(save())

    expect(backButtons()).toHaveLength(1)
  })
})
