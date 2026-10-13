import type {
  AreaAnswer,
  ProfileArea,
} from '../../domain/partner-profile/partnerProfile'
import type { ReactionCause, SofiMood } from './sofiGuide'

type AreaCopy<A extends ProfileArea> = {
  label: string
  question: string
  answers: Record<AreaAnswer<A>, string>
}

const DEPENDS = 'Depende'
const UNKNOWN = 'No lo sé'

// Textos del expediente (004-spec §2). Los valores guardados no dependen de ellos.
export const AREA_COPY: { [A in ProfileArea]: AreaCopy<A> } = {
  directness: {
    label: 'Comunicación directa',
    question: 'Cuando algo le molesta, ¿cómo suele expresarlo?',
    answers: {
      'says-it-clearly': 'Lo dice claramente',
      'drops-hints': 'Suele dar indirectas',
      depends: DEPENDS,
      unknown: UNKNOWN,
    },
  },
  sarcasm: {
    label: 'Sarcasmo',
    question: '¿Utiliza la ironía o el sarcasmo al escribir?',
    answers: {
      often: 'A menudo',
      sometimes: 'A veces',
      rarely: 'Casi nunca',
      depends: DEPENDS,
      unknown: UNKNOWN,
    },
  },
  conflict: {
    label: 'Conflictos',
    question: 'Cuando discutís, ¿qué suele preferir?',
    answers: {
      'talk-now': 'Hablarlo en el momento',
      'talk-later': 'Retomarlo más tarde',
      depends: DEPENDS,
      unknown: UNKNOWN,
    },
  },
  personalSpace: {
    label: 'Espacio personal',
    question: 'Cuando está pasando por algo difícil, ¿suele necesitar espacio?',
    answers: {
      'usually-yes': 'Normalmente sí',
      'usually-no': 'Normalmente no',
      depends: DEPENDS,
      unknown: UNKNOWN,
    },
  },
  initiative: {
    label: 'Iniciativa',
    question: 'Cuando un plan cambia, ¿suele proponer alternativas?',
    answers: {
      'proposes-alternatives': 'Sí',
      'waits-for-me': 'Suele esperar a que las proponga yo',
      depends: DEPENDS,
      unknown: UNKNOWN,
    },
  },
  messageStyle: {
    label: 'Estilo habitual de mensajes',
    question: '¿Cómo suele escribirte normalmente?',
    answers: {
      'short-direct': 'Mensajes cortos y directos, incluso cuando todo va bien',
      'long-expressive': 'Mensajes largos, expresivos o con muchos detalles',
      varies: 'Cambia bastante según el momento',
      unknown: UNKNOWN,
    },
  },
}

export function answerLabel<A extends ProfileArea>(
  area: A,
  answer: AreaAnswer<A>,
): string {
  return AREA_COPY[area].answers[answer]
}

// Comentario corto de cada reacción (aprobados en T012): aparece al pie del
// bocadillo, sin typewriter ni voz.
export const REACTION_COMMENTS: Record<ReactionCause, string> = {
  answered: 'Queda fichado.',
  // Las seis áreas respondidas: lo siguiente es guardar.
  completed: 'Seis de seis. Solo falta guardarlo.',
  uncertain: 'Sin certezas. Me gusta tu prudencia.',
  cleared: 'Vale, esa pista no cuenta.',
  saved: 'Expediente a buen recaudo.',
  savedInMemory: 'Uy. Esto no se ha guardado.',
  rejected: '¿Ni una pista? Así no hay quien investigue.',
  discarded: 'Volvemos a la última versión. Aquí no ha pasado nada.',
  deleted: 'Expediente borrado. Ni rastro.',
}

// Lo que el retrato cuenta a quien no lo ve.
export const MOOD_ALT: Record<SofiMood, string> = {
  inviting: 'Sofi se asoma, curiosa',
  asking: 'Sofi te pregunta',
  waiting: 'Sofi espera tu respuesta',
  acknowledging: 'Sofi sonríe, satisfecha',
  uncertain: 'Sofi se lo piensa',
  saved: 'Sofi, con gafas de sol, da su visto bueno',
  validationError: 'Sofi, sorprendida',
  deleting: 'Sofi se lo piensa antes de borrar',
  deleted: 'Sofi, tranquila, con el expediente en blanco',
}

// Textos de la ficha y de la invitación (aprobados en T012).
export const SHEET_COPY = {
  title: 'Expediente de tu pareja',
  back: 'Volver a la consulta',
  index: 'Las seis áreas',
  unanswered: 'Sin responder',
  clear: 'Quitar respuesta',
  next: 'Siguiente pregunta',
  notesLabel: 'Notas adicionales · opcional',
  notesHelp: 'Lo que Sofi debería saber y no cabe en las preguntas.',
  notesTooLong: 'Las notas pueden tener hasta 500 caracteres.',
  privacy:
    'El expediente se guarda solo en este dispositivo; guardarlo no envía nada. Si lo usas en una lectura, la información relevante podrá enviarse de forma temporal para procesarla.',
  save: 'Guardar expediente',
  // Junto al diálogo, mientras «Guardar» queda fuera de la pantalla.
  goSave: 'Ir a guardar',
  discard: 'Descartar cambios',
  empty: 'Responde al menos una pregunta o escribe una nota para guardar.',
  savedNotice: 'Expediente guardado en este dispositivo.',
  memoryNotice:
    'No he podido guardarlo en este dispositivo. Lo conservo mientras sigas en esta página: si la recargas o la cierras, se perderá.',
  delete: 'Eliminar expediente',
  confirmTitle: '¿Eliminar el expediente?',
  confirmText:
    'Se borrarán las respuestas y las notas de este dispositivo. Tus preferencias y tu consulta no cambian.',
  confirm: 'Eliminar',
  cancel: 'Cancelar',
} as const

// La invitación es lo que Sofi dice al abrir la consulta (004-plan §4): para qué
// sirve el expediente y que es opcional. Igual en móvil y escritorio.
export const INVITATION_COPY = {
  lead: 'Espera, antes de empezar… ¿me das un poco de contexto?',
  text: 'Son seis preguntas opcionales sobre cómo se comunica tu pareja. Así tendré más pistas para interpretar sus mensajes. Puedes guardar las respuestas solo en este dispositivo.',
  // Lo que Sofi hace mientras tanto: pedir contexto. Nombra la región de la
  // invitación; mientras se redacta la consulta, Sofi «está escuchando».
  label: 'Sofi te pide contexto',
  open: 'Responder preguntas',
  dismiss: 'Ahora no',
  // Acceso permanente, en el pie del diálogo de Sofi.
  tag: 'Expediente',
  openEmpty: 'Abrir expediente',
  openSaved: 'Editar expediente',
} as const
