import styles from './eureka.module.scss'

// Glob ansioso limitado al prefijo del recurso: uno central referenciaría desde la entrada las tiras de todos.
export const strips = import.meta.glob<string>(
  ['/src/styles/sprites/eureka.webp', '/src/styles/sprites/eureka-*.webp'],
  { query: '?url', import: 'default', eager: true },
)

export const className = styles['eureka']
