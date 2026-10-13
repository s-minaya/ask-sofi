import { describe, expect, it } from 'vitest'
import {
  guideReducer,
  isSpeaking,
  moodOf,
  openGuide,
  REACTION_MS,
  type GuideEvent,
  type GuideState,
} from './sofiGuide'

const run = (state: GuideState, ...events: GuideEvent[]) =>
  events.reduce(guideReducer, state)

const opened = () => openGuide('directness')

describe('sofiGuide', () => {
  describe('preguntas habladas', () => {
    it('al abrir, Sofi formula la pregunta del área activa', () => {
      const state = opened()

      expect(state.area).toBe('directness')
      expect(moodOf(state)).toBe('asking')
      expect(isSpeaking(state)).toBe(true)
    })

    it('al terminar de escribir, espera la respuesta', () => {
      const state = run(opened(), { type: 'speechEnded' })

      expect(moodOf(state)).toBe('waiting')
      expect(isSpeaking(state)).toBe(false)
    })

    it('cambiar de área formula una pregunta nueva, aunque la anterior siguiera hablando', () => {
      const before = opened()
      const after = run(before, { type: 'selectArea', area: 'sarcasm' })

      expect(after.area).toBe('sarcasm')
      expect(moodOf(after)).toBe('asking')
      // Una intervención nueva: el typewriter y la voz anteriores se cancelan.
      expect(after.speech.id).not.toBe(before.speech.id)
    })

    it('volver a pulsar el área activa no repite la pregunta', () => {
      const state = run(opened(), { type: 'speechEnded' })

      expect(run(state, { type: 'selectArea', area: 'directness' })).toBe(state)
    })

    it('ocultar la página detiene la intervención hablada', () => {
      const state = run(opened(), { type: 'pageHidden' })

      expect(isSpeaking(state)).toBe(false)
      expect(moodOf(state)).toBe('waiting')
    })

    it('un aviso de fin de escritura tardío no cambia nada', () => {
      const state = run(opened(), { type: 'speechEnded' })

      expect(run(state, { type: 'speechEnded' })).toBe(state)
    })
  })

  describe('reacciones breves', () => {
    it('una respuesta concreta se reconoce sin hablar', () => {
      const state = run(opened(), { type: 'answer', answer: 'drops-hints' })

      expect(moodOf(state)).toBe('acknowledging')
      expect(isSpeaking(state)).toBe(false)
      expect(state.reaction?.cause).toBe('answered')
    })

    it.each(['depends', 'unknown'] as const)(
      '«%s» provoca la reacción de incertidumbre',
      (answer) => {
        const state = run(opened(), { type: 'answer', answer })

        expect(moodOf(state)).toBe('uncertain')
      },
    )

    it('«Cambia bastante según el momento» es una respuesta concreta', () => {
      const state = run(openGuide('messageStyle'), {
        type: 'answer',
        answer: 'varies',
      })

      expect(moodOf(state)).toBe('acknowledging')
    })

    // Completar la ficha es una reacción propia: manda sobre la incertidumbre
    // (la sexta respuesta puede ser «No lo sé») y no se confunde con guardar.
    it.each(['drops-hints', 'unknown'] as const)(
      'la respuesta que completa las seis áreas («%s») lo celebra',
      (answer) => {
        const state = run(opened(), { type: 'answer', answer, completes: true })

        expect(state.reaction?.cause).toBe('completed')
        expect(moodOf(state)).toBe('acknowledging')
        expect(isSpeaking(state)).toBe(false)
      },
    )

    // La celebración se debe hasta que se vea: no depende de lo que dura la
    // reacción, porque «Guardar» puede estar fuera de la pantalla.
    it('completar deja la celebración pendiente más allá de la reacción', () => {
      const completed = run(opened(), {
        type: 'answer',
        answer: 'drops-hints',
        completes: true,
      })
      const ended = run(completed, {
        type: 'reactionEnded',
        id: completed.reaction?.id ?? -1,
      })

      expect(completed.celebration).toBe(true)
      expect(ended.reaction).toBeNull()
      expect(ended.celebration).toBe(true)
    })

    it('se da por hecha al celebrarse y no vuelve sola', () => {
      const state = run(
        opened(),
        { type: 'answer', answer: 'drops-hints', completes: true },
        { type: 'celebrated' },
        { type: 'selectArea', area: 'sarcasm' },
        { type: 'answer', answer: 'often' },
      )

      expect(state.celebration).toBe(false)
    })

    it.each([
      ['guardar', { type: 'saved', persisted: true }],
      ['guardar solo en memoria', { type: 'saved', persisted: false }],
      ['descartar', { type: 'discarded' }],
      ['quitar la respuesta', { type: 'clearAnswer' }],
      ['eliminar', { type: 'deleted' }],
    ] as const)('deja de deberse al %s', (_, event) => {
      const state = run(
        opened(),
        { type: 'answer', answer: 'drops-hints', completes: true },
        event,
      )

      expect(state.celebration).toBe(false)
    })

    it('cambiar de pregunta no la pierde', () => {
      const state = run(
        opened(),
        { type: 'answer', answer: 'drops-hints', completes: true },
        { type: 'selectArea', area: 'conflict' },
      )

      expect(state.celebration).toBe(true)
    })

    it('sin «completes», una respuesta no celebra', () => {
      const state = run(opened(), { type: 'answer', answer: 'drops-hints' })

      expect(state.reaction?.cause).toBe('answered')
    })

    it('responder nunca avanza a otra pregunta', () => {
      const state = run(
        opened(),
        { type: 'answer', answer: 'says-it-clearly' },
        { type: 'answer', answer: 'unknown' },
        { type: 'clearAnswer' },
      )

      expect(state.area).toBe('directness')
    })

    // La pregunta sigue visible y entera; la reacción no reinicia su escritura.
    it('responder mientras habla completa la pregunta sin volver a formularla', () => {
      const before = opened()
      const after = run(before, { type: 'answer', answer: 'drops-hints' })

      expect(after.speech.id).toBe(before.speech.id)
      expect(isSpeaking(after)).toBe(false)
    })

    it('quitar una respuesta también es una reacción breve', () => {
      const state = run(opened(), { type: 'clearAnswer' })

      expect(state.reaction?.cause).toBe('cleared')
      expect(moodOf(state)).toBe('acknowledging')
    })

    it('la reacción termina y Sofi vuelve a esperar', () => {
      const reacting = run(opened(), { type: 'answer', answer: 'drops-hints' })
      const id = reacting.reaction?.id ?? -1

      expect(moodOf(run(reacting, { type: 'reactionEnded', id }))).toBe(
        'waiting',
      )
    })

    it('el fin de una reacción ya sustituida no corta la nueva', () => {
      const first = run(opened(), { type: 'answer', answer: 'drops-hints' })
      const second = run(first, { type: 'answer', answer: 'unknown' })

      const state = run(second, {
        type: 'reactionEnded',
        id: first.reaction?.id ?? -1,
      })

      expect(moodOf(state)).toBe('uncertain')
    })

    it('cambiar de área interrumpe la reacción', () => {
      const state = run(
        opened(),
        { type: 'answer', answer: 'drops-hints' },
        { type: 'selectArea', area: 'conflict' },
      )

      expect(state.reaction).toBeNull()
      expect(moodOf(state)).toBe('asking')
    })

    it('dura lo suficiente para verse sin retrasar nada', () => {
      expect(REACTION_MS).toBeGreaterThanOrEqual(1000)
      expect(REACTION_MS).toBeLessThanOrEqual(2500)
    })
  })

  describe('guardar y descartar', () => {
    it('guardar de verdad muestra satisfacción', () => {
      expect(moodOf(run(opened(), { type: 'saved', persisted: true }))).toBe(
        'saved',
      )
    })

    // No se presenta como guardado lo que solo vive en memoria.
    it('guardar solo en memoria es un aviso, no una celebración', () => {
      const state = run(opened(), { type: 'saved', persisted: false })

      expect(state.reaction?.cause).toBe('savedInMemory')
      expect(moodOf(state)).toBe('validationError')
    })

    it('intentar guardar vacío es un aviso', () => {
      expect(moodOf(run(opened(), { type: 'saveRejected' }))).toBe(
        'validationError',
      )
    })

    it('descartar tiene su propia reacción contextual', () => {
      expect(run(opened(), { type: 'discarded' }).reaction?.cause).toBe(
        'discarded',
      )
    })
  })

  describe('eliminar', () => {
    it('la confirmación acompaña a Sofi hasta que se responde', () => {
      const state = run(
        opened(),
        { type: 'requestDelete' },
        { type: 'reactionEnded', id: 999 },
      )

      expect(moodOf(state)).toBe('deleting')
      expect(isSpeaking(state)).toBe(false)
    })

    it('cancelar vuelve a la espera', () => {
      const state = run(
        opened(),
        { type: 'requestDelete' },
        { type: 'cancelDelete' },
      )

      expect(state.confirmingDelete).toBe(false)
      expect(moodOf(state)).toBe('waiting')
    })

    it('confirmar cierra la confirmación con una reacción contextual', () => {
      const state = run(
        opened(),
        { type: 'requestDelete' },
        { type: 'deleted' },
      )

      expect(state.confirmingDelete).toBe(false)
      expect(state.reaction?.cause).toBe('deleted')
      // Pensativa mientras confirma; neutra al terminar, sin celebrarlo.
      expect(moodOf(state)).toBe('deleted')
    })

    it('cambiar de área cierra la confirmación', () => {
      const state = run(
        opened(),
        { type: 'requestDelete' },
        { type: 'selectArea', area: 'initiative' },
      )

      expect(state.confirmingDelete).toBe(false)
      expect(moodOf(state)).toBe('asking')
    })
  })

  it('cada estado de Sofi corresponde a un estado de la interacción', () => {
    const moods = new Set(
      [
        opened(),
        run(opened(), { type: 'speechEnded' }),
        run(opened(), { type: 'answer', answer: 'often' }),
        run(opened(), { type: 'answer', answer: 'depends' }),
        run(opened(), { type: 'saved', persisted: true }),
        run(opened(), { type: 'saveRejected' }),
        run(opened(), { type: 'requestDelete' }),
        run(opened(), { type: 'requestDelete' }, { type: 'deleted' }),
      ].map(moodOf),
    )

    expect([...moods].sort()).toEqual(
      [
        'acknowledging',
        'asking',
        'deleted',
        'deleting',
        'saved',
        'uncertain',
        'validationError',
        'waiting',
      ].sort(),
    )
  })
})
