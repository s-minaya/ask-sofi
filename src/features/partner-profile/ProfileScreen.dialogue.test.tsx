import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MotionPreferenceProvider } from '../../app/providers/MotionPreference'
import { SoundProvider } from '../../app/providers/SoundProvider'
import { useSound } from '../../hooks/useSound'
import { fakeAudio } from '../../test/fakeAudio'
import { setMediaQuery } from '../../test/matchMedia'
import { REACTION_COMMENTS } from './profileCopy'
import { ProfileScreen } from './ProfileScreen'
import { REACTION_MS } from './sofiGuide'

// T018–T022: preguntas habladas frente a reacciones breves, con el audio, el
// typewriter y los anuncios de la aplicación real. El tiempo se controla a mano.
const NARROW = 'not all and (min-width: 60em)'
const Q1 = 'Cuando algo le molesta, ¿cómo suele expresarlo?'
const Q2 = '¿Utiliza la ironía o el sarcasmo al escribir?'
// Retardo inicial del typewriter (speechTimeline): la primera letra sale a los 700 ms.
const FIRST_LETTER_MS = 700
const WHOLE_QUESTION_MS = 6000

function EnableSound() {
  const sound = useSound()
  return (
    <button type="button" onClick={sound.enable}>
      Con sonido
    </button>
  )
}

// Registra el orden de las llamadas de voz: nunca debe haber dos «start» seguidos.
function recordedAudio() {
  const audio = fakeAudio()
  const voice: string[] = []
  audio.startVoice = vi.fn(() => void voice.push('start'))
  audio.stopVoice = vi.fn(() => void voice.push('stop'))
  return { audio, voice }
}

function Harness({
  audio,
  reduce,
  show,
}: {
  audio: ReturnType<typeof fakeAudio>
  reduce: boolean
  show: boolean
}) {
  return (
    <MotionPreferenceProvider value={reduce ? 'reduce' : 'system'}>
      <SoundProvider createAudio={() => audio}>
        <EnableSound />
        {show && <ProfileScreen onBack={() => {}} />}
      </SoundProvider>
    </MotionPreferenceProvider>
  )
}

// El sonido se activa antes de abrir la ficha, como en la aplicación: se prepara
// en el gesto que abre el expediente.
function renderScreen({
  audio = fakeAudio(),
  sound = false,
  reduce = false,
}: {
  audio?: ReturnType<typeof fakeAudio>
  sound?: boolean
  reduce?: boolean
} = {}) {
  const view = render(<Harness audio={audio} reduce={reduce} show={false} />)
  if (sound)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Con sonido' }))
    })
  view.rerender(<Harness audio={audio} reduce={reduce} show />)
  return { ...view, audio }
}

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
// Avanza hasta que la voz esté sonando (en las pausas de la puntuación calla).
function advanceUntilSpeaking(voice: string[]) {
  for (let step = 0; step < 200 && voice.at(-1) !== 'start'; step++) advance(28)
  expect(voice.at(-1)).toBe('start')
}
const answer = (name: string) =>
  act(() => void fireEvent.click(screen.getByRole('radio', { name })))
const goTo = (name: RegExp) =>
  act(() => {
    fireEvent.click(
      within(
        screen.getByRole('navigation', { name: 'Las seis áreas' }),
      ).getByRole('button', { name }),
    )
  })
// La capa que se anuncia: una sola región por pregunta, con el texto entero.
const spokenRegion = () =>
  document.querySelector<HTMLElement>('figure [aria-live="polite"]')
// El texto que se ve escrito hasta ahora (copia animada, oculta a lectores).
const typed = () =>
  document.querySelectorAll('figure [aria-hidden="true"]')[1]?.textContent ?? ''
const statusRegion = () => screen.getByRole('status')
const visibleComment = () =>
  [...document.querySelectorAll<HTMLElement>('[class*="comment"] > span')].find(
    (element) => element.style.visibility !== 'hidden',
  )?.textContent ?? ''
const sofi = (name: string) => screen.queryByRole('img', { name })

function expectNoOverlap(voice: string[]) {
  for (let index = 1; index < voice.length; index++)
    expect(voice[index - 1] === 'start' && voice[index] === 'start').toBe(false)
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('preguntas habladas', () => {
  it('Sofi escribe la pregunta letra a letra y la voz suena con ella', () => {
    const { audio } = renderScreen({ sound: true })
    expect(typed()).toBe('')

    advance(FIRST_LETTER_MS)
    expect(typed()).toBe('C')
    expect(audio.startVoice).toHaveBeenCalledTimes(1)

    advance(WHOLE_QUESTION_MS)
    expect(typed()).toBe(Q1)
    expect(audio.stopVoice).toHaveBeenCalled()
  })

  it('cada pregunta nueva vuelve a escribirse y a sonar', () => {
    const { audio } = renderScreen({ sound: true })
    advance(WHOLE_QUESTION_MS)
    const before = vi.mocked(audio.startVoice).mock.calls.length

    goTo(/Sarcasmo/)
    expect(typed()).toBe('')
    advance(WHOLE_QUESTION_MS)

    expect(typed()).toBe(Q2)
    expect(vi.mocked(audio.startVoice).mock.calls.length).toBeGreaterThan(
      before,
    )
  })

  it('sin sonido, la pregunta se escribe y nada suena', () => {
    const { audio } = renderScreen()

    advance(WHOLE_QUESTION_MS)

    expect(typed()).toBe(Q1)
    expect(audio.prepare).not.toHaveBeenCalled()
    expect(audio.startVoice).not.toHaveBeenCalled()
    expect(audio.playFragment).not.toHaveBeenCalled()
  })

  it('con movimiento reducido aparece entera, sin temporizadores y con un único fragmento de voz', () => {
    const { audio } = renderScreen({ sound: true, reduce: true })

    expect(typed()).toBe(Q1)
    expect(vi.getTimerCount()).toBe(0)
    expect(audio.startVoice).not.toHaveBeenCalled()
    expect(audio.playFragment).toHaveBeenCalledTimes(1)

    goTo(/Sarcasmo/)
    expect(typed()).toBe(Q2)
    expect(audio.playFragment).toHaveBeenCalledTimes(2)
  })

  it('«Ver todo» completa la pregunta y corta la voz', () => {
    const { audio } = renderScreen({ sound: true })
    advance(1000)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Ver todo' }))
    })

    expect(typed()).toBe(Q1)
    expect(audio.stopVoice).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('en estrecho, «Ver todo» y las respuestas se pueden usar mientras escribe', () => {
    setMediaQuery(NARROW, true)
    renderScreen({ sound: true })
    advance(1000)

    expect(screen.getByRole('button', { name: 'Ver todo' })).toBeVisible()
    answer('Depende')
    expect(screen.getByRole('radio', { name: 'Depende' })).toBeChecked()
  })
})

describe('interrupciones', () => {
  it('cambiar de pregunta corta la voz y el texto de la anterior sin solaparse', () => {
    const { audio, voice } = recordedAudio()
    renderScreen({ audio, sound: true })
    advanceUntilSpeaking(voice)

    goTo(/Conflictos/)

    expect(voice.at(-1)).toBe('stop')
    expect(typed()).toBe('')
    advance(WHOLE_QUESTION_MS)
    expect(typed()).toBe('Cuando discutís, ¿qué suele preferir?')
    expectNoOverlap(voice)
  })

  it('cambios rápidos de pregunta no dejan voz ni temporizadores de las anteriores', () => {
    const { audio, voice } = recordedAudio()
    renderScreen({ audio, sound: true })

    for (const name of [/Sarcasmo/, /Conflictos/, /Iniciativa/, /Espacio/]) {
      advance(900)
      goTo(name)
    }
    advance(WHOLE_QUESTION_MS)

    expect(typed()).toBe(
      'Cuando está pasando por algo difícil, ¿suele necesitar espacio?',
    )
    expectNoOverlap(voice)
    expect(voice.at(-1)).toBe('stop')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('salir de la ficha mientras Sofi habla corta la voz y no deja temporizadores', () => {
    const { audio, voice } = recordedAudio()
    const { unmount } = renderScreen({ audio, sound: true })
    advanceUntilSpeaking(voice)

    unmount()

    expect(voice.at(-1)).toBe('stop')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ocultar la página detiene la voz y deja la pregunta entera', () => {
    const { audio, voice } = recordedAudio()
    renderScreen({ audio, sound: true })
    advanceUntilSpeaking(voice)

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(typed()).toBe(Q1)
    expect(voice.at(-1)).toBe('stop')
    expect(vi.getTimerCount()).toBe(0)
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })
  })
})

describe('reacciones breves', () => {
  it('responder muestra el comentario al instante, sin escribirlo ni darle voz', () => {
    const { audio } = renderScreen({ sound: true })
    advance(WHOLE_QUESTION_MS)
    const starts = vi.mocked(audio.startVoice).mock.calls.length

    answer('Lo dice claramente')

    expect(visibleComment()).toBe(REACTION_COMMENTS.answered)
    expect(vi.mocked(audio.startVoice).mock.calls.length).toBe(starts)
    expect(audio.playFragment).not.toHaveBeenCalled()
  })

  it('la pregunta sigue entera y legible durante la reacción, sin reescribirse', () => {
    renderScreen({ sound: true })
    advance(WHOLE_QUESTION_MS)

    answer('Suele dar indirectas')

    expect(typed()).toBe(Q1)
    expect(spokenRegion()).toHaveTextContent(Q1)
    advance(100)
    expect(typed()).toBe(Q1)
  })

  it('responder mientras Sofi habla completa la pregunta al instante y corta la voz', () => {
    const { audio, voice } = recordedAudio()
    renderScreen({ audio, sound: true })
    advanceUntilSpeaking(voice)

    answer('Depende')

    expect(typed()).toBe(Q1)
    expect(voice.at(-1)).toBe('stop')
    expect(audio.playFragment).not.toHaveBeenCalled()
  })

  it('la expresión de Sofi acompaña a la reacción y vuelve a la espera', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)
    expect(sofi('Sofi espera tu respuesta')).toBeInTheDocument()

    answer('Lo dice claramente')
    expect(sofi('Sofi sonríe, satisfecha')).toBeInTheDocument()

    advance(REACTION_MS)
    expect(sofi('Sofi espera tu respuesta')).toBeInTheDocument()
    expect(visibleComment()).toBe('')
  })

  it('«Depende» y «No lo sé» reciben la reacción de incertidumbre', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)

    answer('No lo sé')

    expect(sofi('Sofi se lo piensa')).toBeInTheDocument()
    expect(visibleComment()).toBe(REACTION_COMMENTS.uncertain)
  })

  it('quitar la respuesta también reacciona, sin cambiar de pregunta', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)
    answer('Depende')
    advance(REACTION_MS)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Quitar respuesta' }))
    })

    expect(visibleComment()).toBe(REACTION_COMMENTS.cleared)
    expect(typed()).toBe(Q1)
  })

  it('interacciones rápidas: solo cuenta la última reacción y un temporizador viejo no la corta', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)

    answer('Lo dice claramente')
    advance(1000)
    answer('Depende')
    advance(1000)
    // La primera habría terminado a los 1,8 s: la segunda sigue viva.
    expect(visibleComment()).toBe(REACTION_COMMENTS.uncertain)

    advance(REACTION_MS - 1000)
    expect(visibleComment()).toBe('')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cambiar de pregunta durante una reacción la descarta', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)
    answer('Lo dice claramente')

    goTo(/Sarcasmo/)

    expect(visibleComment()).toBe('')
    expect(sofi('Sofi te pregunta')).toBeInTheDocument()
  })

  it('con movimiento reducido las reacciones también aparecen, sin animación de escritura', () => {
    const { audio } = renderScreen({ sound: true, reduce: true })
    const fragments = vi.mocked(audio.playFragment).mock.calls.length

    answer('Depende')

    expect(visibleComment()).toBe(REACTION_COMMENTS.uncertain)
    expect(vi.mocked(audio.playFragment).mock.calls.length).toBe(fragments)
    expect(audio.startVoice).not.toHaveBeenCalled()
  })
})

describe('anuncios accesibles', () => {
  it('la pregunta se ofrece entera, una vez, y no letra a letra', () => {
    renderScreen()
    expect(spokenRegion()).toHaveTextContent(Q1)

    advance(1000)
    expect(spokenRegion()).toHaveTextContent(Q1)
    expect(typed()).not.toBe(Q1)
    // La copia que cambia con el typewriter no se expone a lectores de pantalla.
    expect(
      document.querySelectorAll('figure [aria-live]:not([aria-hidden])'),
    ).toHaveLength(1)
  })

  it('con «Siguiente pregunta», la región anuncia la nueva entera', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)

    act(() => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Siguiente pregunta' }),
      )
    })

    expect(spokenRegion()).toHaveTextContent(Q2)
  })

  // Desde el índice el foco pasa a las respuestas y es el grupo quien dice la
  // pregunta: la región se calla para que no se oiga dos veces.
  it('desde el índice, la pregunta la dice el grupo y la región no la repite', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)

    goTo(/Sarcasmo/)

    expect(spokenRegion()).toBeNull()
    expect(
      screen.getByRole('group', { name: /Pregunta 2 de 6[\s\S]*ironía/ }),
    ).toBeInTheDocument()
    expect(document.activeElement?.closest('fieldset')).not.toBeNull()
  })

  it('el comentario se anuncia en una región de estado persistente, una sola vez', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)
    const region = statusRegion()
    expect(region).toBeEmptyDOMElement()

    answer('Lo dice claramente')

    // La misma región que ya existía: un aviso que nace con texto no siempre se anuncia.
    expect(statusRegion()).toBe(region)
    expect(region).toHaveTextContent(REACTION_COMMENTS.answered)
    expect(
      screen.getAllByText(REACTION_COMMENTS.answered, {
        ignore: '[aria-hidden="true"], [aria-hidden="true"] *',
      }),
    ).toHaveLength(1)

    advance(REACTION_MS)
    expect(region).toBeEmptyDOMElement()
  })

  it('una reacción no vuelve a anunciar la pregunta', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)
    const region = spokenRegion()
    const text = region?.textContent

    answer('Depende')
    advance(REACTION_MS)

    expect(spokenRegion()).toBe(region)
    expect(region?.textContent).toBe(text)
  })
})

describe('recursos visuales', () => {
  it('una imagen que falla no impide seguir usando la ficha', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)
    answer('Lo dice claramente')

    const picture = document
      .querySelector('figure')
      ?.closest('section')
      ?.querySelector('img')
    expect(picture).not.toBeNull()
    act(() => {
      fireEvent.error(picture as HTMLImageElement)
    })

    // Sofi conserva una representación (el parpadeo) y el formulario responde.
    expect(sofi('Sofi sonríe, satisfecha')).toBeInTheDocument()
    answer('Depende')
    expect(screen.getByRole('radio', { name: 'Depende' })).toBeChecked()
    expect(visibleComment()).toBe(REACTION_COMMENTS.uncertain)
  })

  it('mientras la imagen carga se ve el fotograma de reserva y todo responde', () => {
    renderScreen()
    advance(WHOLE_QUESTION_MS)

    answer('Depende')

    const picture = document.querySelector('section img')
    expect(picture).toHaveAttribute('hidden')
    expect(sofi('Sofi se lo piensa')).toBeInTheDocument()
    answer('No lo sé')
    expect(screen.getByRole('radio', { name: 'No lo sé' })).toBeChecked()
  })
})
