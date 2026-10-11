// Todo lo que Ask Sofi guarda lleva este prefijo. Es lo único que las
// operaciones de borrado pueden tocar: el origen puede compartirse con otras
// aplicaciones (p. ej. otro proyecto en localhost).
export const STORAGE_NAMESPACE = 'ask-sofi:'

// Claves declaradas en un único lugar y el almacenamiento al que pertenecen:
//
//   localStorage   → lo que la persona decide conservar (preferencias, y más
//                    adelante historial, favoritos y perfil).
//   sessionStorage → estado temporal de la consulta en curso.
export const STORAGE_KEYS = {
  // localStorage
  preferences: 'ask-sofi:preferences',
  // sessionStorage
  consultationDraft: 'ask-sofi:session:consultation',
  sessionScreen: 'ask-sofi:session:screen',
} as const

// Contrato reservado para el historial opcional: cualquier clave de historial
// vivirá bajo este prefijo en localStorage, y `clearHistory` borra solo ese
// espacio. El modelo de datos llegará con su feature.
export const HISTORY_KEY_PREFIX = 'ask-sofi:history'

// Clave de la feature 002, anterior a la capa general. Solo se lee para
// recuperar la preferencia de tema ya guardada.
export const LEGACY_THEME_KEY = 'ask-sofi:theme'
