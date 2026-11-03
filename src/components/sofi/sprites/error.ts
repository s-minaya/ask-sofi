import styles from './error.module.scss'

// Glob ansioso limitado al prefijo del recurso: uno central referenciaría desde la entrada las tiras de todos.
export const strips = import.meta.glob<string>(
  ['/src/styles/sprites/error.webp', '/src/styles/sprites/error-*.webp'],
  { query: '?url', import: 'default', eager: true },
)

export const className = styles['error']
