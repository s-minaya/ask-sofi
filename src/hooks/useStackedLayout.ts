import { useMediaQuery } from './useMediaQuery'

// La interfaz pasa a dos columnas en el umbral `$columns` de
// styles/utilities/_breakpoints.scss (1080 px = 67,5 em). «Una columna» es el
// complemento exacto, y se emite en em para seguir al tamaño de texto igual que el CSS.
export const STACKED_LAYOUT_QUERY = 'not all and (min-width: 67.5em)'

// Verdadero cuando la consulta se muestra en una sola columna: contenido
// fuera de la vista que quien usa un móvil no ve sin desplazarse.
export function useStackedLayout(): boolean {
  return useMediaQuery(STACKED_LAYOUT_QUERY)
}
