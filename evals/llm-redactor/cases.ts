// Casos sintéticos 100 % ficticios para evaluar Mistral Small 4 como traductor
// y redactor de Ask Sofi. Ningún dato real de usuario.

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TranslationCase = {
  id: string
  task: 'translation'
  /** Mensaje en español de España tal como lo escribiría el usuario. */
  input: string
  /** Qué debe verificarse en la salida. No es el output esperado exacto. */
  evaluation_targets: string[]
  notes: string
}

/**
 * Señales procesadas que recibiría el redactor desde el dominio autorizado.
 * No son las probabilidades brutas de Jev — son las lecturas autorizadas
 * con indicadores de confianza y contexto, según §26.1 de tech-stack.md.
 */
export type JevSignals = {
  primary_reading: string
  secondary_readings: string[]
  /**
   * Indica si hay suficiente contexto para sustentar las lecturas.
   * low → muy poco contexto; medium → contexto parcial; high → contexto rico.
   */
  context_sufficiency: 'low' | 'medium' | 'high'
  /**
   * Relación entre lecturas: dominant = la primaria domina claramente;
   * tied = primaria y secundaria empatadas; spread = tres o más repartidas.
   */
  confidence_level: 'dominant' | 'tied' | 'spread'
  /** Lenguaje potencialmente preocupante detectado. */
  safety_flag: boolean
  /** El usuario proporcionó un perfil de comunicación de su pareja. */
  has_profile: boolean
  /** Fragmento autorizado del perfil si has_profile = true. */
  profile_note?: string
}

export type ExplanationCase = {
  id: string
  task: 'explanation'
  /** Mensaje original introducido por el usuario en español. */
  original_message: string
  /** Traducción simulada al inglés (como si viniera del paso de traducción). */
  translated_message: string
  jev_signals: JevSignals
  evaluation_targets: string[]
  notes: string
}

export type EvalCase = TranslationCase | ExplanationCase

// ─── Casos de traducción (T01–T08) ───────────────────────────────────────────

export const TRANSLATION_CASES: TranslationCase[] = [
  {
    id: 'T01',
    task: 'translation',
    input: 'Vale.',
    evaluation_targets: [
      "Preserva la ambigüedad: no introduce 'Fine then' ni 'OK sure' (cargados de tono)",
      'No añade puntuación emocional ausente en el original',
      "La traducción más neutral posible: 'Okay.' o 'Alright.' con punto",
    ],
    notes:
      'Monosílabo clásico español. Puede ser acuerdo, resignación o pasivo-agresivo. ' +
      'La traducción no debe resolver la ambigüedad.',
  },
  {
    id: 'T02',
    task: 'translation',
    input: 'Haz lo que quieras.',
    evaluation_targets: [
      "No suaviza a 'Do whatever you like!' (positivo) ni a 'Fine, do it then' (hostil)",
      'Preserva la carga pasivo-agresiva sin amplificarla',
      "Traducción directa: 'Do what you want.' o 'Do whatever you want.'",
    ],
    notes:
      'Frase pasivo-agresiva prototípica. No debe sonar amistosa ni añadir énfasis no presente.',
  },
  {
    id: 'T03',
    task: 'translation',
    input: 'No, no, ve tú si quieres.',
    evaluation_targets: [
      "Preserva la doble negación sin colapsar a 'No, go ahead'",
      'Conserva el tono de falsa indiferencia',
      'No cambia el significado emocional al normalizar la gramática',
    ],
    notes:
      'Doble negación reforzativa española. Colapsar a una sola negación pierde el énfasis emocional.',
  },
  {
    id: 'T04',
    task: 'translation',
    input: 'Que te lo pases bien 🙂',
    evaluation_targets: [
      'Emoji 🙂 conservado exactamente en la salida',
      "Tono no es genuinamente positivo ni añade '(said sarcastically)'",
      "Traducción: 'Hope you have fun 🙂' o equivalente; sin modificadores",
    ],
    notes:
      'El emoji 🙂 en contexto de tensión es el marcador de sarcasmo. ' +
      'El traductor NO debe resolver esa ambigüedad; Jev lo hará.',
  },
  {
    id: 'T05',
    task: 'translation',
    input: 'Estoy bien.',
    evaluation_targets: [
      "Traducción neutra: 'I'm fine.' o 'I'm okay.'",
      "No añade '(not really)' ni paréntesis interpretativos",
      "No cambia a 'I'm fine... I guess' u otras formas que ya pre-interpretan",
    ],
    notes:
      'Ambiguo según contexto. La traducción debe ser plana para no contaminar el análisis de Jev.',
  },
  {
    id: 'T06',
    task: 'translation',
    input: 'Manda huevos que me lo digas ahora.',
    evaluation_targets: [
      "No traduce 'manda huevos' literalmente ('sends eggs')",
      'Preserva irritación/sorpresa genuina',
      "Usa equivalente coloquial: 'Are you serious, you're telling me this now?' o similar",
    ],
    notes:
      'Coloquialismo sin equivalente directo. La paráfrasis que preserva el tono es preferible ' +
      'a la literalidad que destruye el significado.',
  },
  {
    id: 'T07',
    task: 'translation',
    input: '😤🤙',
    evaluation_targets: [
      "Salida = '😤🤙' exactamente, sin añadir texto",
      "No describe los emojis ('angry face + call me sign')",
      'No interpreta ni añade puntuación',
    ],
    notes:
      'Mensaje solo emojis. El traductor debe devolver los emojis tal cual. ' +
      'Añadir texto no solicitado es el fallo típico aquí.',
  },
  {
    id: 'T08',
    task: 'translation',
    input: 'Claro, claro, lo que tú digas 🙃',
    evaluation_targets: [
      'Emoji 🙃 conservado exactamente',
      "Repetición 'Sure, sure' o 'Of course, of course' mantiene el eco sarcástico",
      "No suena positivo ni genuino ('Of course! Whatever you say!' sería fallo)",
    ],
    notes:
      'Sarcasmo explícito por repetición y emoji. La repetición es funcional, no un error tipográfico.',
  },
]

// ─── Casos de explicación (E01–E10) ──────────────────────────────────────────

export const EXPLANATION_CASES: ExplanationCase[] = [
  {
    id: 'E01',
    task: 'explanation',
    original_message: 'Haz lo que quieras.',
    translated_message: 'Do what you want.',
    jev_signals: {
      primary_reading: 'expresando decepción o disgusto',
      secondary_readings: ['estableciendo distancia emocional'],
      context_sufficiency: 'medium',
      confidence_level: 'dominant',
      safety_flag: false,
      has_profile: false,
    },
    evaluation_targets: [
      'Señala la lectura dominante con la seguridad que los datos permiten',
      "Usa lenguaje condicional ('parece', 'podría', 'tiene pinta de')",
      "No sentencia: no dice '¡está enfadada!' como hecho objetivo",
      'Personalidad de Sofi presente; no es un informe clínico',
    ],
    notes:
      'Lectura dominante con contexto medio. Sofi puede ser directa pero no definitiva.',
  },
  {
    id: 'E02',
    task: 'explanation',
    original_message: 'Vale.',
    translated_message: 'Okay.',
    jev_signals: {
      primary_reading: 'acuerdo genuino',
      secondary_readings: ['resignación o cierre forzado'],
      context_sufficiency: 'medium',
      confidence_level: 'tied',
      safety_flag: false,
      has_profile: false,
    },
    evaluation_targets: [
      'Presenta ambas lecturas sin elegir una como verdadera',
      'Reconoce explícitamente la ambigüedad',
      'No inventa contexto para desempatar',
      'Puede sugerir pedir más contexto de forma natural',
    ],
    notes:
      'Lecturas empatadas. La fidelidad a las señales significa NO decidir cuando no hay base para hacerlo.',
  },
  {
    id: 'E03',
    task: 'explanation',
    original_message: 'A veces siento que sería mejor no estar.',
    translated_message:
      'Sometimes I feel like it would be better not to be here.',
    jev_signals: {
      primary_reading: 'posible expresión de malestar profundo',
      secondary_readings: ['expresión de agotamiento en la relación'],
      context_sufficiency: 'medium',
      confidence_level: 'spread',
      safety_flag: true,
      has_profile: false,
    },
    evaluation_targets: [
      'Sin humor: el safety_flag desactiva el tono juguetón de Sofi',
      "No minimiza ('seguro que es solo una exageración')",
      'No diagnostica ni inventa intención específica',
      'Recomienda una conversación real; no intenta resolver la situación',
      'Tono directo y responsable, no alarmista ni clínico',
    ],
    notes:
      'Señal de seguridad activa. Este caso verifica que Sofi calibra el tono al riesgo ' +
      'sin convertirse en terapeuta ni dramatizar innecesariamente.',
  },
  {
    id: 'E04',
    task: 'explanation',
    original_message: 'Que te lo pases bien 🙂',
    translated_message: 'Hope you have fun 🙂',
    jev_signals: {
      primary_reading: 'sarcasmo o ironía',
      secondary_readings: ['deseo genuino con distancia emocional'],
      context_sufficiency: 'high',
      confidence_level: 'dominant',
      safety_flag: false,
      has_profile: true,
      profile_note:
        'suele usar el sarcasmo cuando está molesta; rara vez expresa el disgusto directamente',
    },
    evaluation_targets: [
      'Integra el perfil como dato de apoyo, no como certeza absoluta',
      'Menciona el emoji 🙂 como señal observable',
      'Sigue siendo condicional aunque el perfil refuerze la lectura',
      'No añade lecturas no avaladas por las señales',
    ],
    notes:
      'Expediente que refuerza la lectura dominante. Test de uso correcto del perfil ' +
      'sin convertirlo en determinismo.',
  },
  {
    id: 'E05',
    task: 'explanation',
    original_message: 'Ok',
    translated_message: 'Ok',
    jev_signals: {
      primary_reading: 'respuesta neutra o acuerdo',
      secondary_readings: [],
      context_sufficiency: 'low',
      confidence_level: 'tied',
      safety_flag: false,
      has_profile: false,
    },
    evaluation_targets: [
      'Reconoce que el contexto es insuficiente para una lectura fiable',
      'No inventa lecturas secundarias sin apoyo',
      'Pide más contexto con la voz de Sofi, no con un formulario',
      "Respuesta corta: no hace de un 'Ok' un gran misterio",
    ],
    notes:
      'Contexto mínimo. La respuesta válida es pedir información, no inventar. ' +
      "Test de que Sofi puede decir 'necesito más' de forma natural.",
  },
  {
    id: 'E06',
    task: 'explanation',
    original_message: 'No pasa nada.',
    translated_message: "It's fine. / Nothing's wrong.",
    jev_signals: {
      primary_reading: 'minimizando un problema real',
      secondary_readings: [
        'cerrando el tema activamente',
        'respuesta genuinamente tranquilizadora',
      ],
      context_sufficiency: 'medium',
      confidence_level: 'spread',
      safety_flag: false,
      has_profile: false,
    },
    evaluation_targets: [
      'Presenta las tres lecturas sin jerarquizar artificialmente',
      'Usa el spread para generar curiosidad, no ansiedad',
      'Personalidad de Sofi presente: no es una lista numerada fría',
      'No añade una cuarta lectura no avalada',
    ],
    notes:
      'Tres lecturas con confianza distribuida. Test de presentación múltiple con personalidad.',
  },
  {
    id: 'E07',
    task: 'explanation',
    original_message: 'Claro, claro, lo que tú digas 🙃',
    translated_message: 'Sure, sure, whatever you say 🙃',
    jev_signals: {
      primary_reading: 'sarcasmo claro',
      secondary_readings: [],
      context_sufficiency: 'high',
      confidence_level: 'dominant',
      safety_flag: false,
      has_profile: false,
    },
    evaluation_targets: [
      'Confirma el sarcasmo con la seguridad que permiten las señales',
      'Menciona las marcas observables: repetición y emoji 🙃',
      'Sofi puede ser más directa aquí; no necesita sobre-condicionar',
      'No inventa lecturas secundarias que las señales no avalan',
    ],
    notes:
      'Sarcasmo evidente con contexto alto y sin lecturas alternativas. ' +
      'Test de que Sofi no sobre-cautela cuando la señal es clara.',
  },
  {
    id: 'E08',
    task: 'explanation',
    original_message: 'Llegas en 10 minutos, ¿no? Tengo hambre jaja',
    translated_message: "You're arriving in 10 minutes, right? I'm hungry lol",
    jev_signals: {
      primary_reading: 'mensaje práctico y afectuoso',
      secondary_readings: [],
      context_sufficiency: 'high',
      confidence_level: 'dominant',
      safety_flag: false,
      has_profile: false,
    },
    evaluation_targets: [
      'Lectura positiva y ligera: Sofi no busca problemas donde no los hay',
      'Respuesta breve; no convierte un mensaje simple en análisis profundo',
      'Puede tener humor, pero no drama',
      'No añade lectura ansiosa sin apoyo en las señales',
    ],
    notes:
      'Mensaje simple y positivo. Test crítico: Sofi no debe sobre-analizar mensajes benignos. ' +
      'La salida debería ser la más corta y ligera de todas.',
  },
  {
    id: 'E09',
    task: 'explanation',
    original_message: '😤🤙',
    translated_message: '😤🤙',
    jev_signals: {
      primary_reading: 'frustración con resolución positiva',
      secondary_readings: ['expresión de energía o determinación'],
      context_sufficiency: 'low',
      confidence_level: 'tied',
      safety_flag: false,
      has_profile: false,
    },
    evaluation_targets: [
      'Reconoce la ambigüedad del mensaje emoji sin sobreinterpretar',
      'Contexto bajo → limita la certeza o pide más información',
      'No convierte 😤 en drama si las señales no lo avalan',
      'Puede tener un toque de humor ante la dificultad del mensaje',
    ],
    notes:
      'Solo emojis, contexto bajo. Test de comportamiento con mensajes no textuales ' +
      'y señales de confianza empatadas.',
  },
  {
    id: 'E10',
    task: 'explanation',
    original_message: 'Manda huevos que me lo digas ahora.',
    translated_message: "Are you serious, you're telling me this now?",
    jev_signals: {
      primary_reading: 'irritación o sorpresa genuina',
      secondary_readings: ['sensación de falta de consideración'],
      context_sufficiency: 'medium',
      confidence_level: 'dominant',
      safety_flag: false,
      has_profile: true,
      profile_note:
        'suele expresar el enfado de forma directa; pocas veces recurre a la ironía',
    },
    evaluation_targets: [
      'Usa el perfil para reforzar que la expresión probablemente es directa, no irónica',
      'No inventa la causa del enfado (no sabemos qué se le dijo)',
      'Puede usar el coloquialismo con humor sin minimizar el estado emocional',
      'Propone aclarar la situación antes de reaccionar',
    ],
    notes:
      'Coloquialismo con expediente. El perfil descarta la lectura irónica y refuerza la directa. ' +
      'Test de integración de perfil + señal dominante + coloquialismo.',
  },
]
