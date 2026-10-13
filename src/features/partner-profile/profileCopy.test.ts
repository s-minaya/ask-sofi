import { describe, expect, it } from 'vitest'
import {
  AREA_ANSWERS,
  PROFILE_AREAS,
} from '../../domain/partner-profile/partnerProfile'
import { AREA_COPY, answerLabel } from './profileCopy'

describe('profileCopy', () => {
  // Tabla de 004-spec §2: el texto se puede cambiar sin tocar los valores guardados.
  it('formula las seis preguntas de la spec', () => {
    expect(
      PROFILE_AREAS.map((area) => [
        AREA_COPY[area].label,
        AREA_COPY[area].question,
      ]),
    ).toEqual([
      [
        'Comunicación directa',
        'Cuando algo le molesta, ¿cómo suele expresarlo?',
      ],
      ['Sarcasmo', '¿Utiliza la ironía o el sarcasmo al escribir?'],
      ['Conflictos', 'Cuando discutís, ¿qué suele preferir?'],
      [
        'Espacio personal',
        'Cuando está pasando por algo difícil, ¿suele necesitar espacio?',
      ],
      ['Iniciativa', 'Cuando un plan cambia, ¿suele proponer alternativas?'],
      ['Estilo habitual de mensajes', '¿Cómo suele escribirte normalmente?'],
    ])
  })

  it('nombra cada respuesta en el orden de la ficha', () => {
    expect(
      Object.fromEntries(
        PROFILE_AREAS.map((area) => [
          area,
          AREA_ANSWERS[area].map((answer) => answerLabel(area, answer)),
        ]),
      ),
    ).toEqual({
      directness: [
        'Lo dice claramente',
        'Suele dar indirectas',
        'Depende',
        'No lo sé',
      ],
      sarcasm: ['A menudo', 'A veces', 'Casi nunca', 'Depende', 'No lo sé'],
      conflict: [
        'Hablarlo en el momento',
        'Retomarlo más tarde',
        'Depende',
        'No lo sé',
      ],
      personalSpace: [
        'Normalmente sí',
        'Normalmente no',
        'Depende',
        'No lo sé',
      ],
      initiative: [
        'Sí',
        'Suele esperar a que las proponga yo',
        'Depende',
        'No lo sé',
      ],
      messageStyle: [
        'Mensajes cortos y directos, incluso cuando todo va bien',
        'Mensajes largos, expresivos o con muchos detalles',
        'Cambia bastante según el momento',
        'No lo sé',
      ],
    })
  })
})
