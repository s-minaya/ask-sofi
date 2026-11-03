import styles from './are-u-still-here.module.scss'

// Glob ansioso limitado al prefijo del recurso: uno central referenciaría desde la entrada las tiras de todos.
export const strips = import.meta.glob<string>(
  [
    '/src/styles/sprites/are-u-still-here.webp',
    '/src/styles/sprites/are-u-still-here-*.webp',
  ],
  { query: '?url', import: 'default', eager: true },
)

export const className = styles['are-u-still-here']
