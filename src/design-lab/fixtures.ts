import type { InterpretationView } from '../components/sofi/types'

// Fixtures deterministas del Design Lab y de la Experience Preview. Son datos de
// demostración: no salen de ningún análisis ni de ningún servicio.

export const FIXTURE_MESSAGE = 'Vale. Que te lo pases bien.'

export const FIXTURE_CONTEXT =
  'Hace dos semanas le dije que este sábado iría a comer con su familia. Hoy le he escrito que al final no puedo, porque es el cumple de Marta. Ha tardado 25 minutos en contestar y no ha puesto ni un emoji, cuando normalmente pone mil.'

export const SPEECH = {
  answer:
    'Un «vale» con punto y sin emoji, de alguien que normalmente te manda medio teclado… Esto tiene bastante pinta de que le ha sentado regular. Pero ojo: con lo que me cuentas no puedo jurarlo. Antes de dar nada por hecho, pregúntale cómo lo lleva.',
  needs:
    'Con un «vale» a secas no hago milagros. Dame contexto y te lo leo como se merece.',
  needsLong:
    'Con un «vale» a secas no hago milagros. Podría significar cuatro cosas distintas y ninguna tendría un porcentaje honesto. Dame un poco de contexto y te lo leo como se merece.',
  manyPauses:
    'Vale, a ver: punto final, sin emojis y veinticinco minutos de espera; y encima, un «que te lo pases bien». ¿Le ha molestado? Puede. ¿Lo sé seguro? No.',
  short:
    'Un «vale» con punto y sin emoji, de alguien que normalmente te manda medio teclado… Esto tiene bastante pinta de que le ha sentado regular. Pero ojo: con lo que me cuentas no puedo jurarlo.',
  listening:
    'A ver, cuéntamelo todo. ¿Qué te ha escrito exactamente? Pégalo tal cual, que aquí cada punto cuenta.',
  landingQuote: 'Con un «vale» no hago milagros. Dame contexto.',
} as const

export const LEAD: InterpretationView = {
  id: 'v1',
  title: 'Le ha sentado regular',
  explanation:
    'Contaba con esa comida y el cambio le ha decepcionado. El punto final y la falta de emojis encajan con esta lectura.',
  percentage: 52,
  clues: ['Punto final', 'Sin emojis', 'Plan cancelado'],
}

export const LEAD_CLOSE: InterpretationView = {
  id: 'v1-close',
  title: 'Le ha sentado regular',
  explanation:
    'Por muy poco. Con tan poco margen, la segunda versión podría ser igual de buena: mejor pregúntale.',
  percentage: 34,
  clues: ['Punto final', 'Respuesta corta'],
}

export const OTHER_VERSIONS: ReadonlyArray<InterpretationView> = [
  {
    id: 'v2',
    title: 'Espera que lo arregles tú',
    explanation:
      'No te lo va a pedir, pero agradecería que propusieras otro día para ir a esa comida.',
    percentage: 24,
  },
  {
    id: 'v3',
    title: 'Le parece bien, sin más',
    explanation:
      'Puede que lo diga literalmente y que la respuesta corta sea porque estaba con otra cosa.',
    percentage: 15,
  },
  {
    id: 'v4',
    title: 'Prefiere no hablarlo por aquí',
    explanation:
      'Quizá no quiere discutirlo por mensaje y prefiere dejarlo para cuando os veáis.',
    percentage: 9,
  },
]

export const MISSING_QUESTIONS = [
  '¿Ya sabía que ese día era el cumple de Marta?',
  '¿Cómo suele reaccionar cuando cambian los planes?',
]

export const ADVICE = {
  title: 'Pregúntale. En serio.',
  text: 'Pregúntale cómo le ha sentado y propón otro día para esa comida. Dos minutos de conversación valen más que cualquier porcentaje.',
}

export const NEEDS_QUESTIONS = [
  '¿Qué estaba pasando antes de ese «vale»?',
  '¿Respondía a algo que le preguntaste o propusiste?',
  '¿Suele escribir así de corto?',
]

export const TICKER_HEADLINES = [
  'Un «no pasa nada» no siempre significa que no pase nada',
  'Sofi confirma: el contexto lo cambia todo',
  'Ninguna lectura es una sentencia',
]
