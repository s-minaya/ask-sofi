# 006 — Jev Integration — Tasks

## Status

In Progress — bloque A completo (T019 cerrada el 2026-10-19). Los bloques B y C siguen cerrados.

Cada bloque sigue el ciclo del plan: primero la prueba (RED), después la implementación mínima (GREEN). Una tarea de implementación no se marca hasta que pasen las pruebas de su bloque.

---

## Bloque A — Sin red ni gasto

### 1. Extensión del contrato de 005 (decisión 5)

- [x] **T001** — Escribir tests de la procedencia ampliada: `respondedModel` e `instructionVersion` opcionales fluyen desde el proveedor hasta `AnalysisMeta`; el fake no los declara y siguen como `undefined`; los tests existentes de 005 siguen pasando sin cambios.
- [x] **T002** — Implementar los cambios en `decisionProvider.ts` (`ProviderProvenance`), `analysisResult.ts` (`AnalysisMeta`) e `interpretMessage.ts`.
- [x] **T002a** — Escribir tests de `readingsNeeded` en `analysisPolicy.test.ts` (`005-plan` §3.6): `false` con indicios de seguridad, con seguridad o suficiencia sin evaluar (ausente o rechazada) y con marcador omitido; `true` con contexto insuficiente, parcial, suficiente y con cualquier otra combinación; coincide con lo que `analysisPolicy` decide sin señales; los tests existentes de la política siguen pasando.
- [x] **T002b** — Extraer de `analysisPolicy` los pasos 1–4 a una función compartida y exportar `readingsNeeded`. Sin cambio de comportamiento de la política.

### 2. Preguntas e instrucciones de Jev

- [x] **T003** — Escribir tests de `jevQuestions.ts`: cada señal del catálogo tiene pregunta `boolean` con `instructions` y `criteria`; seguridad, tres tipos de persona afectada y suficiencia tienen su pregunta; las frases del expediente cubren cada área de `PROFILE_AREAS` y cada respuesta concreta de `AREA_ANSWERS`; `INSTRUCTION_VERSION` es una cadena no vacía; las claves de preguntas no colisionan.
- [x] **T004** — Implementar `jevQuestions.ts` con las preguntas, los criterios, las frases del expediente y `INSTRUCTION_VERSION`. Las instrucciones se redactan en inglés, nombrando los campos del estado, con los riesgos del registro §3 como fronteras (`not_for`). El plan (§3.3) guía el diseño; este plan no las copia.

### 3. Adaptador de Jev

- [x] **T005** — Escribir tests de `jevDecisionProvider.ts` con MSW sobre `POST /v1/decisions`:
  - Peticiones: cuerpos de A y B correctos (`input` con el estado serializado, preguntas `predicate`, `criteria` dentro de `instructions`); expediente solo en B; opciones de enrutado (`only`, `disallowPromptTraining`); credencial en cabecera.
  - Orquestación (decisión 6): sin expediente, una sola petición. Con expediente, A primero y B después, solo si `readingsNeeded` es `true`: B no se envía con indicios de seguridad, con seguridad o suficiencia sin evaluar, con marcador omitido ni con A ilegible; sí se envía con contexto insuficiente, parcial, suficiente. Se cuentan las peticiones recibidas.
  - Respuestas: probabilidades (valor recibido sin redondear); rechazo por pregunta (`{"type": "refusal"}`) en seguridad → `'rejected'`; rechazo en lectura → clave ausente; respuesta ausente → clave ausente; centinelas de fallback (`confidence: 0`, `probabilities: {}`) → valor recibido; sobre ilegible → `null`.
  - Fallos: 400, 401, 402 `quota_for_entity_exceeded`, 403, 429, 500, 529, error de red, tiempo de espera con `AbortSignal`.
  - Fallo parcial (decisión 6): A falla → `{ ok: false }`; B falla → `{ ok: false }`, nunca el payload de A solo.
  - Procedencia: `id: 'jev'`, alias, `respondedModel` del campo `model` de la respuesta solo si A y B (cuando se envía) lo informan y coinciden (modelos coincidentes, distintos y ausentes), `instructionVersion`, sin `observedVersion` inventada, sin texto del proveedor.
- [x] **T006** — Implementar `jevDecisionProvider.ts`. Recibe la `PolicyConfig` solo para `readingsNeeded`; no define ni copia umbrales.

### 4. Configuración provisional de la política

- [x] **T007** — Escribir tests de `jevPolicyConfig.ts`: el módulo refleja `006-plan.md` §6. Con alguna fila «Pendiente» (estado actual) no exporta ninguna `PolicyConfig`; si todas tienen valor, exporta exactamente esos. El test lee la tabla del plan.
- [x] **T008** — Implementar `jevPolicyConfig.ts` sin inventar ningún valor: estado pendiente explícito (`undefined`).

### 5. Preparación lingüística

- [x] **T009** — Escribir tests de `englishPreparation.ts` con preparador simulado:
  - Emojis compuestos (👍🏽, 🤷‍♀️, secuencia ZWJ, bandera, tecla) sobreviven.
  - Emoji perdido, añadido o alterado (incluido selector de variante) → bloqueo sin llamar a Jev.
  - Salida vacía → bloqueo.
  - Texto sin letras (`\p{L}`) → `skipped_no_letters`, no llama al preparador.
  - El expediente nunca llega al preparador: solo `message` y `context`.
  - `retryable` según el tipo de fallo (red/429/5xx → `true`; rechazo/validación → `false`).
  - Procedencia: servicio, resultado (`translated | already_english | skipped_no_letters`), versión; nunca texto.
- [x] **T010** — Implementar `englishPreparation.ts`: puerto del preparador, decorador de `DecisionProvider`, validación mecánica de emojis (`Intl.Segmenter`, `\p{Extended_Pictographic}`) y procedencia.

### 6. Servidor

- [x] **T011** — Escribir tests de `interpretHandler.ts` con fake del proveedor y preparador simulado:
  - 200 en los tres estados; cuerpo y estado HTTP de cada error (`006-plan` §3.4).
  - JSON ilegible → 400 `invalid_input`.
  - Clave desconocida, `notes`, clave de `profile` fuera de `PROFILE_AREAS` o valor fuera de `AREA_ANSWERS` de su área (también «depends» en `messageStyle`) → 400 `invalid_input`, antes de minimizar.
  - «Depende» y «No lo sé» filtrados; `profileUsed` coherente.
  - Sin dependencias (composición incompleta) → 503 `processing_unavailable` sin llamar a ningún proveedor ni al fake.
  - Método distinto de `POST` → 405.
  - `meta.languagePreparation` presente en la respuesta.
  - Nada escrito en consola.
- [x] **T012** — Implementar `interpretHandler.ts`: `Request → Response` con APIs web; recibe dependencias inyectadas; reaplica minimización; compone `interpretMessage` con el decorador y el adaptador.

### 7. Composición

- [x] **T013** — Escribir tests de composición (`interpretComposition.test.ts`) con decorador, adaptador real y MSW: un rechazo de seguridad por pregunta acaba en `safety_evaluation_unavailable`; con expediente y `concern` en A, B no se envía y el resultado es `safety_concern`; con contexto insuficiente y expediente, B se envía y `needs_context` conserva `setting_boundary`; B falla → error técnico, no `needs_context` incompleto.

### 8. Entrada de la plataforma y entorno

- [x] **T014** — Escribir tests de `composeInterpret.test.ts` (falta credencial, preparador aprobado o `PolicyConfig` → sin dependencias; las tres inyectadas → dependencias; con el estado actual del repositorio nunca se completa) e implementar `composeInterpret.ts` (recibe el entorno como argumento) y `api/interpret.ts`: firma Web Standard (`export default { fetch }`), pasa `process.env` a `composeInterpret` y entrega el resultado a `interpretHandler`; sin lógica propia.
- [x] **T015** — Crear `.env.example` con las variables necesarias (sin valores reales): clave de AI Gateway y, cuando se apruebe, configuración del traductor.

### 9. Guardas y cierre del bloque A

- [x] **T016** — Escribir test de frontera (`serverBoundary.test.ts`): ningún módulo del cliente importa `src/server/` ni los adaptadores reales; solo `api/` lee `process.env`.
- [x] **T017** — Verificación de build: el bundle del cliente no contiene la URL de la pasarela ni los nombres de las variables secretas. `npm run build && npm run verify:bundle` (`scripts/clientBundle.ts` detecta, con test; `scripts/verifyClientBundle.ts` recorre `dist/`).
- [x] **T018** — Ejecutar formato, lint, typecheck, tests y build. Comprobar que la suite no hace llamadas reales. Revisar los criterios de `006-spec.md` que se puedan verificar en este bloque y registrar los resultados en `006-plan.md` §8.

### 10. Fixtures y runner (E1)

- [x] **T019** — Crear los casos sintéticos de E1 en `evals/jev/fixtures/`: 40–65 casos (el máximo sube de 60 a 65 por decisión de la autora, 2026-10-19, para cubrir los mínimos de `alta` de `seeking_reassurance`, `inviting_initiative` y `playful_teasing` sin modificar los 57 casos aprobados) a partir de H01–H30, C1–C20 y T01–T08, con mensaje, contexto opcional e inglés de referencia, y las etiquetas aprobadas por la autora (`alta`/`baja`/`indiferente` por señal, estado esperado, clase de seguridad y persona afectada). _Completa (2026-10-19): 65 casos; texto, inglés y etiquetas se importan de `evals/jev/review/` con mapeo estricto y tests (`approved.ts`, `approvedData.ts`); los expedientes de E4 quedan en su fichero aparte; procedencia por caso (51 etiquetas son propuestas asistidas por IA aprobadas por la autora, no independientes; ver `006-plan` §5.2) y ajustes de e1-06 y e1-31 conservados; cobertura de etiquetas cumplida; leyenda de las hojas alineada con el criterio de la autora. Resultados en `006-plan` §8.3._ Incluye el subconjunto canario marcado (~12) y el verificador de cobertura de etiquetas.
- [x] **T020** — Crear el runner en seco (`evals/jev/runner/`): cuenta peticiones, estima tokens y coste. El modo `--live` está preparado pero no se ejecuta sin G2. `npm run eval:jev` es en seco; `--live` exige `AI_GATEWAY_API_KEY`, `--max-requests` y `--max-cost-usd`, pide siempre las lecturas con expediente (`readings: { mode: 'always' }`, sin umbrales), no reintenta y se detiene ante el primer 401, 402 o 403. Probado solo con la pasarela simulada.

---

## Bloque B — Puerta de gasto (acciones de la autora)

No son tareas del agente. El bloque C no puede empezar hasta que estén completadas.

- [ ] **E0** — Verificar cuenta de AI Gateway: plan, compra mínima, recarga desactivada, si un método de pago puede cobrar por encima del saldo.
- [ ] **E0-V** — ¿Está el repositorio conectado a Vercel con despliegue automático? ¿Tiene ese proyecto acceso a AI Gateway por OIDC?
- [ ] **E0-T** — Cuentas de los candidatos de traducción aprobados. Cuota real del F0 (§8.1: discrepancia hora/mes).
- [ ] **G1** — Límite de gasto aprobado y aplicado: presupuesto de equipo, clave dedicada con caducidad, recarga desactivada.
- [ ] **G2** — Autorización expresa de cada ejecución, con su tope.

---

## Bloque C — Llamadas reales (requieren autorización)

Cada tarea necesita G2. Solo datos sintéticos.

- [ ] **T021** — E8: primera llamada real. 1–3 casos canarios, repetir otro día. Registrar: alias pedido, modelo respondido, `observedVersion` o su ausencia, comportamiento del ID versionado. Actualizar `jev.md` §1/§3.5. Tope: 0,05 $.
- [ ] **T022** — Ejecución base (E2, E3, E6): E1 sin expediente, tres repeticiones, brazos inglés de referencia y español original.
  - E2: bien formado ≥ 99 %, 0 rechazos en no violentos, mediana SD ≤ 0,05, `communicableAt` separa ≥ 80 %/≥ 80 % en ≥ 8/10 señales. Una reescritura permitida. Tope: 0,25 $.
  - E3: ≥ 80 % de pares mejoran con contexto; mensajes explícitos no caen bajo `insufficientBelow`. Tope: 0,05 $ (variante).
  - E6: 0 falsos negativos en riesgos claros × 3 repeticiones; tipo afectado ≥ 80 %. Incluido en E2.
- [ ] **T023** — E4: subconjunto con expediente (ninguno, coherente, engañoso, orden alterado). Expediente engañoso no cruza `communicableAt` en `sarcastic_tone`/`indirect_hint`; orden < umbral de deriva. Tope: 0,10 $.
- [ ] **T024** — E5: inyección y pares de género. |Δ| ≤ deriva en ≥ 90 % de pares; ningún cambio de estado por inyección. Tope: 0,05 $.
- [ ] **T025** — L1: comparación de traducción. Valoración ciega de la autora, efecto en Jev, criterios eliminatorios y de orden (§5.3). Tope: 0 € (F0) + 0,10 $ (LLM+Jev).
- [ ] **T026** — Implementar el adaptador del proveedor de traducción elegido en L1 (`<proveedor aprobado>.ts`).
- [ ] **T027** — Valores provisionales de `PolicyConfig` (§6): rellenar la tabla con procedencia. `policyVersion` → `"1"`.
- [ ] **T028** — Canario (~12 casos) con línea base de la ejecución base y la cadena completa. Tope: incluido.
- [ ] **T029** — Prueba de humo de toda la cadena: `interpretHandler` local, preparador elegido y Jev, ~10 casos en español. Estado coherente con etiquetas, procedencia completa. Tope: 0,05 $.
- [ ] **T030** — Verificación final: todos los criterios de `006-spec.md`, suite sin llamadas reales, `jev.md` actualizado, informes en `evals/jev/reports/`, cierre de `006-plan.md` §8.

## References

- `006-spec.md`
- `006-plan.md`
- `spec/constitution/tech-stack.md`
- `spec/constitution/jev.md`
- `AGENTS.md`
