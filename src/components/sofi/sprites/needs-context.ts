import styles from './needs-context.module.scss'

// Glob ansioso limitado al prefijo del recurso: uno central referenciaría desde la entrada las tiras de todos.
export const strips = import.meta.glob<string>(
  [
    '/src/styles/sprites/needs-context.webp',
    '/src/styles/sprites/needs-context-*.webp',
  ],
  { query: '?url', import: 'default', eager: true },
)

export const className = styles['needs-context']
