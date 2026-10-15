import type { DecisionEstimates } from '../domain/analysis/decisionProvider'
import type { PolicyConfig } from '../domain/analysis/analysisPolicy'

// Valores de prueba explícitos: ninguna feature entrega todavía valores productivos
// (005-spec §4). Los tests comprueban comportamientos relativos a estos parámetros.
export const TEST_POLICY_CONFIG: PolicyConfig = {
  policyVersion: 'test-a',
  safety: { concernAt: 0.5, affectedTypeAt: 0.5 },
  sufficiency: {
    insufficientBelow: 0.3,
    sufficientFrom: 0.6,
    requestContextWhenPartial: false,
  },
  signals: { communicableAt: 0.5 },
}

// Otra configuración, deliberadamente más exigente, para comprobar que la salida
// depende de los parámetros y no de números fijos en la política.
export const STRICT_TEST_POLICY_CONFIG: PolicyConfig = {
  policyVersion: 'test-b',
  safety: { concernAt: 0.2, affectedTypeAt: 0.8 },
  sufficiency: {
    insufficientBelow: 0.5,
    sufficientFrom: 0.9,
    requestContextWhenPartial: true,
  },
  signals: { communicableAt: 0.9 },
}

// Estimaciones de un análisis que se completó sin nada destacable: seguridad
// baja, contexto suficiente y una lectura evaluada por debajo del umbral.
export function estimates(
  overrides: Partial<DecisionEstimates> = {},
): DecisionEstimates {
  return {
    signals: { literal_meaning: 0.1 },
    safety: 0.02,
    affected: {},
    sufficiency: 0.9,
    ...overrides,
  }
}
