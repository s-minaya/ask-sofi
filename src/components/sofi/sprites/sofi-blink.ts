import styles from './sofi-blink.module.scss'

// Glob ansioso limitado al prefijo del recurso: uno central referenciaría desde la entrada las tiras de todos.
export const strips = import.meta.glob<string>(
  [
    '/src/styles/sprites/sofi-blink.webp',
    '/src/styles/sprites/sofi-blink-*.webp',
  ],
  { query: '?url', import: 'default', eager: true },
)

export const className = styles['sofi-blink']
