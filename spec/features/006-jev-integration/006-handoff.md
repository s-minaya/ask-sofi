# 006 — Jev Integration — Relevo entre agentes

Estado a **2026-10-19**. Nota de trabajo, no una fuente normativa: lo que manda está en `006-spec.md`, `006-plan.md`, `006-tasks.md`, `spec/constitution/jev.md` y `AGENTS.md`. Aquí solo hay el contexto que esos documentos no cuentan: dónde se quedó el trabajo, qué es delicado y cómo no perder tiempo. Bórralo o archívalo cuando la feature cierre.

## 1. Dónde estamos

- **Bloque A (sin red ni gasto): completo y verificado.** Tareas marcadas en `006-tasks.md`; resultados en `006-plan.md` §8.2 y §8.3.
- **T019 cerrada (2026-10-19)**: 65 casos de E1 con etiquetas e inglés de referencia aprobados por la autora, importados de `evals/jev/review/`. Ver §5.
- **Bloques B y C cerrados.** No hay cuenta de AI Gateway verificada, presupuesto aprobado ni autorización de ejecución (E0, E0-V, E0-T, G1, G2). Hay **0 € autorizados**.
- **Nada está commiteado ni subido.** La autora decide cuándo hacer commit (conviene separar los cambios de `evals/llm-redactor/`, `eslint.config.js` y `tsconfig.json` de los de 005/006).
- `006-spec.md` sigue en «Draft»: solo la autora puede marcarla aprobada.

## 2. Reglas que no se pueden saltar

- **Cero llamadas reales** a modelos, cero credenciales, cero contratar servicios, hasta que la autora lo autorice de forma expresa (decisión 8: ninguna credencial de inferencia en producción, previews ni CI antes de las protecciones de `013`).
- No reabrir las 8 decisiones aprobadas (`006-plan.md` §9). Si algo no se puede resolver con ellas, **preguntar antes de decidir**.
- No inventar umbrales de `PolicyConfig`: dependen de E2, E3 y E6, que no se han ejecutado (`006-plan.md` §6).
- No marcar como verificado lo que no lo está. Lo que está simulado con MSW según la documentación **no está confirmado contra el servicio real** hasta E8.
- La autora escribe en español (España); responde en español. Cuando haya decisiones pendientes, enuméralas para que pueda aprobar por número.

## 3. Diseño: lo que no se deduce leyendo el código sin más

- **Orquestación A/B** (`src/infrastructure/ai/jevDecisionProvider.ts`, `006-plan.md` §3.3). Sin expediente, una sola petición con las 15 preguntas. Con expediente, A (seguridad, tres tipos de persona afectada, suficiencia) va primero y B (diez lecturas, con expediente) **solo si A no determina ya el resultado**, vía `readingsNeeded` de 005. Si B falla: error técnico, **nunca** A solo. Con contexto insuficiente B sí se envía, porque los límites explícitos de un `needs_context` salen de las lecturas.
- **`readingsNeeded`** (`src/domain/analysis/analysisPolicy.ts`): comparte código con la política (pasos 1–4). Es el único cambio real en código de 005 además de la procedencia ampliada.
- **Modos de lecturas** del adaptador: `when-needed` (producción, con `PolicyConfig`) y `always` (solo el runner de experimentos, sin umbrales).
- **Transporte**: `POST https://ai-gateway.vercel.sh/v1/decisions`, preguntas `predicate`, estado serializado en `input`. **Los `criteria` van dentro de `instructions`**, porque la documentación solo recoge `instructions` para `predicate`. Si el endpoint admite `criteria` lo dirá E8 (`jev.md` §3.1).
- **Procedencia**: `respondedModel` solo se declara si A y B (si se envía) lo informan y coinciden. `observedVersion` no se observa a través de la pasarela: no se declara.
- **Expediente en el servidor** (`src/server/interpretHandler.ts`): primero se valida cada valor contra `AREA_ANSWERS` (004); solo con el expediente válido se filtran «Depende» y «No lo sé». Motivo: `answerKind()` clasifica `messageStyle: 'depends'` como condicional aunque ese área no lo admita.
- **Falla cerrado** (`src/server/composeInterpret.ts`): sin credencial, sin traductor aprobado o sin `PolicyConfig`, `processing_unavailable`. Hoy no se completa nunca, a propósito. La credencial es también la marca de autorización.
- **`jevPolicyConfig.ts` exporta `undefined`** mientras la tabla de `006-plan.md` §6 diga «Pendiente»; un test lee esa tabla.
- **Sin reintentos automáticos** ni fallback; las instrucciones y frases del expediente viven solo en `jevQuestions.ts`, y cualquier cambio de texto debe subir `INSTRUCTION_VERSION`.

## 4. Mapa de ficheros

| Qué | Dónde |
|---|---|
| Adaptador de Jev + cuerpos de petición | `src/infrastructure/ai/jevDecisionProvider.ts` (`gatewayBodies` es pura y la usa el runner) |
| Preguntas, criterios, frases del expediente | `src/infrastructure/ai/jevQuestions.ts` |
| Configuración de política (pendiente) | `src/infrastructure/ai/jevPolicyConfig.ts` |
| Preparación lingüística (decorador + validación de emojis) | `src/infrastructure/language/englishPreparation.ts` |
| Manejador, composición, guardas | `src/server/` (`interpretHandler`, `composeInterpret`, `serverBoundary.test.ts`) |
| Entrada de la plataforma | `api/interpret.ts` (sin lógica; **sin desplegar**) |
| Pasarela simulada para tests | `src/test/jevGateway.ts` |
| Casos de E1, verificador, hojas | `evals/jev/fixtures/` (`cases.ts`, `coverage.ts`, `reviewSheet.ts`) |
| Runner de experimentos | `evals/jev/runner/` (en seco por defecto) |
| Detector de fugas al bundle | `scripts/clientBundle.ts`, `scripts/verifyClientBundle.ts` |
| Variables de entorno | `.env.example` (solo `AI_GATEWAY_API_KEY`, vacía) |
| Typecheck de servidor | `tsconfig.server.json` (`api`, `src/server`, `evals/jev`) |

## 5. E1: fuente de verdad y procedencia

- **Fuente de verdad:** `evals/jev/review/e1-casos-aprobados-65.json` (texto, inglés de referencia, etiquetas, procedencia) y `e1-perfiles-e4-aislados.json` (expedientes de E4). Los importa `evals/jev/fixtures/approvedData.ts` con el mapeo estricto de `approved.ts` (vocabulario en español → fixtures; lanza error ante cualquier valor desconocido). `cases.ts` solo añade origen, diseño, pares y canario, y falla al cargarse si falta o sobra un caso.
- **No se editan a mano** esos JSON ni `e1-human-labels.md` (registro de la autora; cita `evals/jev/cases.ts`, la ruta real es `evals/jev/fixtures/cases.ts`). Si la autora cambia una etiqueta, se cambia el JSON y los tests que fijan los recuentos de su tabla (`approved.test.ts`) avisan.
- **Procedencia:** e1-01–06 y e1-58–65 los etiquetó la autora (e1-06 con una exposición incidental a un borrador de inglés); e1-07–57 son propuestas asistidas por IA que revisó y aprobó, **no independientes**; e1-31 es `interpreted` + `hipérbole` por decisión expresa. Cualquier informe de E2/E3/E6 debe citarlo (`006-plan` §5.2).
- **Hojas:** `evals/jev/review/tanda-N-de-6.md` se regeneran con `npm run eval:sheets` (borra las `tanda-*.md` anteriores y no toca los ficheros aprobados). Quedan como formularios en blanco; el etiquetado ya está hecho.
- Las entregas parciales anteriores (57 casos y 8 casos) se retiraron el 2026-10-19: el consolidado contiene sus casos idénticos y sus notas.

## 6. Cómo verificar

```text
npm run lint · npm run typecheck · npm run format:check
npm run build && npm run verify:bundle
npm test                       # suite completa
npm run eval:jev               # en seco: cuenta peticiones, tokens y coste. No envía nada
npm run eval:sheets            # regenera las hojas de etiquetado
```

Último resultado conocido (2026-10-19): lint, typecheck, `format:check` (todo el repo), build y `verify:bundle` correctos; suite completa 79 ficheros y 1228 tests correctos con `--maxWorkers=1`.

## 7. Trampas del entorno

- **Memoria.** Con poca memoria libre, `ProfileScreen.celebration.test.tsx` (004, sin cambios) agota su timeout de 15 s con 3 hilos y arrastra a otros 11 tests. Aislado pasa 18/18 y con un hilo la suite entera pasa. No subas timeouts: comprueba primero la memoria libre y relanza con `npx vitest run --maxWorkers=1`.
- **No hay Python.** Para editar usa Edit o Node. Los heredocs largos en Bash fallan a veces en este entorno: usa Write.
- **Prettier.** No ejecutes `prettier --write evals` a ciegas: se llevó por delante `evals/llm-redactor/` (ya corregido, JS emitido idéntico). Formatea ficheros concretos.
- **`.env*`.** Vite prohíbe importarlos (`?raw`); el test de `.env.example` lo lee con `node:fs`.
- **Importaciones sin extensión.** `src/` importa sin extensión, así que el CLI de evals se carga con la API de Vite (`evals/jev/runner/start.ts`). `node --experimental-strip-types` directo sobre `src/` no funciona.
- **Respuestas HTTP simuladas.** Cancelar y esperar el cuerpo de una respuesta de error con datos pendientes se cuelga con MSW: el adaptador lo libera sin `await`.

## 8. Pendiente y quién lo desbloquea

| # | Pendiente | Depende de |
|---|---|---|
| 1 | Aprobar `006-spec.md` | La autora |
| 2 | E0, E0-V, E0-T, G1, G2 (cuenta, presupuesto con tope, autorización por ejecución) | La autora |
| 3 | Bloque C: E8 primero, luego E2/E3/E6, E4, E5, L1, traductor, `PolicyConfig`, canario, humo | 2 |
| 4 | Comprobar que `api/interpret.ts` resuelve sus importaciones en Vercel | Primer despliegue (con `013` y autorización) |
| 5 | Cuota real de Azure F0 (¿por hora o por mes?) | E0-T |

## 9. Lecturas recomendadas, en este orden

1. `006-tasks.md` (qué está hecho) → `006-plan.md` §3.3, §8.2 y §9 (diseño, verificación, decisiones).
2. `spec/constitution/jev.md` §1, §3.1, §3.4, §8 y §10 (qué se sabe de Jev y con qué fecha).
3. Si algo afecta a decisiones ya estudiadas: las secciones pertinentes de `spec/decisions/analysis-architecture-rationale.md` (`AGENTS.md`, *Context loading*, punto 6).
