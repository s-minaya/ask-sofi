import styles from './i-see-you.module.scss'

// Glob ansioso limitado al prefijo del recurso: uno central referenciaría desde la entrada las tiras de todos.
export const strips = import.meta.glob<string>(
  [
    '/src/styles/sprites/i-see-you.webp',
    '/src/styles/sprites/i-see-you-*.webp',
  ],
  { query: '?url', import: 'default', eager: true },
)

export const className = styles['i-see-you']
