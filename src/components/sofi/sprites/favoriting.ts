import styles from './favoriting.module.scss'

// Glob ansioso limitado al prefijo del recurso: uno central referenciaría desde la entrada las tiras de todos.
export const strips = import.meta.glob<string>(
  [
    '/src/styles/sprites/favoriting.webp',
    '/src/styles/sprites/favoriting-*.webp',
  ],
  { query: '?url', import: 'default', eager: true },
)

export const className = styles['favoriting']
