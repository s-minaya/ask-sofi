# 005 — Analysis Domain — Tasks

## Status

In Review

Cada bloque sigue el ciclo del plan: primero la prueba (RED), después la implementación mínima (GREEN). Una tarea de implementación no se marca hasta que pasen las pruebas de su bloque.

## 1. Catálogo y vocabulario

- [x] **T001** — Escribir tests del catálogo: los diez IDs en orden, `kind` de cada uno, definición no vacía, `taxonomyVersion`, niveles de suficiencia, tipos de persona afectada, y que cada definición aparece literal en `005-plan.md` §3.1.
- [x] **T002** — Implementar `signalCatalog.ts`.

## 2. Entrada y expediente

- [x] **T003** — Escribir tests de `selectAuthorizedProfile`: solo «No lo sé», «Depende», áreas vacías o notas; una concreta y una desconocida; `varies` como concreta; sin autorización aunque exista expediente.
- [x] **T004** — Implementar `profileSelection.ts`, reutilizando `answerKind()`.
- [x] **T005** — Escribir tests de `parseAnalysisInput` e `isOmittedContentMarker`: mensaje vacío y en blanco, longitudes sin truncar, contexto en blanco, expediente no minimizado, claves desconocidas, marcadores y falsos positivos por subcadena.
- [x] **T006** — Implementar `analysisInput.ts`.

## 3. Puerto y estimaciones

- [x] **T007** — Escribir tests de `parseDecisionPayload`: `0` explícito conservado, ausencia, `'rejected'` en seguridad y suficiencia, `NaN`, `Infinity`, `-0.1`, `1.1`, tipo incorrecto, ID desconocido.
- [x] **T008** — Implementar `decisionProvider.ts` (puerto, petición, respuesta y validación).

## 4. Política

- [x] **T009** — Escribir tests de `analysisPolicy` con dos `PolicyConfig` de prueba: cada paso de `005-plan.md` §3.6, las dos señales altas sin ganadora, el cero comunicable, el límite conservado con contexto insuficiente y la prevalencia de `safety_concern`.
- [x] **T010** — Implementar `analysisResult.ts` (los tipos de resultado y de error que la política devuelve), `analysisPolicy.ts` y la configuración de prueba en `src/test/analysisFixtures.ts`.

## 5. Núcleo y proveedor falso

- [x] **T011** — Escribir tests de `createFakeDecisionProvider`: determinista, no lee el texto, procedencia `fake`, y escenarios de respuestas válidas, ausencias, rechazos, valores inválidos y fallos.
- [x] **T012** — Implementar `fakeDecisionProvider.ts`.
- [x] **T013** — Escribir tests de `interpretMessage`: flujo completo con el fake, `profileUsed`, seguridad y suficiencia sin expediente, errores con `retryable`, excepción del proveedor, metadatos sin texto de la consulta, `policyVersion` reflejado, sin confianza global y sin recurrir a otro proveedor.
- [x] **T014** — Implementar `interpretMessage.ts`.

## 6. Guardas y cierre

- [x] **T015** — Escribir el test de pureza del dominio (importaciones, red, consola y almacenamiento).
- [x] **T016** — Ejecutar formato, lint, typecheck, tests y build; revisar uno a uno los criterios de `005-spec.md` y registrar los resultados en el plan. No marcar la feature como completa hasta que todos los criterios estén demostrados.

## References

- `005-spec.md`
- `005-plan.md`
- `spec/constitution/tech-stack.md`
- `AGENTS.md`
