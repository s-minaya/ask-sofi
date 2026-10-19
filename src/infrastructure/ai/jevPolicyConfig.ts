import type { PolicyConfig } from '../../domain/analysis/analysisPolicy'

// Copia de la tabla de 006-plan.md §6 (fuente normativa de los valores). Todas
// las filas están «Pendiente»: los umbrales salen de los experimentos E2, E3 y
// E6, que aún no se han ejecutado. Sin base experimental no se inventa ningún
// valor, así que no hay configuración y la composición del servidor falla
// cerrada (006-plan §3.1). T027 la rellena con su procedencia.
export const JEV_POLICY_CONFIG: PolicyConfig | undefined = undefined
