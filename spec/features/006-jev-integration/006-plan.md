# 006 — Jev Integration — Plan

## Status

Approved — decisiones §9 aprobadas (2026-10-16). V1 ejecutada (2026-10-16). Depende de que se apruebe `006-spec.md` (Draft, actualizada con la decisión 8).

## Approach

Tres bloques con dependencias distintas:

```text
A. Sin red ni gasto
   revisión documental (V1) → preparación lingüística, adaptador de Jev y servidor con MSW y fakes → guardas
B. Puerta de gasto (§4)
   cuenta (E0) → límite aprobado y aplicado → autorización de cada ejecución
C. Llamadas reales, solo con datos sintéticos (§5)
   E8 → ejecución base (E2, E3, E6) → E4, E5 → L1 → PolicyConfig provisional → prueba de humo de toda la cadena
```

El bloque A no depende de B ni de C: la forma de las respuestas sale de la documentación y la confirma E8. Ningún resultado de C cambia el contrato de `005` sin pasar antes por su spec.

El plan no repite los requisitos de `006-spec.md`: referencia sus apartados y solo fija lo que la spec delega aquí.

## 1. Auditoría de lo existente

| Necesidad | Se reutiliza | Hueco |
|---|---|---|
| Puerto, petición separada (evaluación y lecturas) y validación de la respuesta | `DecisionProvider`, `DecisionRequest`, `parseDecisionPayload` (`src/domain/analysis/decisionProvider.ts`) | El adaptador solo cambia de forma: no valida números ni decide estados |
| Rechazos y ausencias | `'rejected'` en seguridad y suficiencia; ausencia en lecturas y afectados (`005-plan` §3.4) | — |
| Minimización y `profileUsed` | `selectAuthorizedProfile`, `hasAnswers` | El servidor la reaplica; no hay lógica nueva |
| Entrada, política, errores y metadatos | `interpretMessage`, `analysisPolicy`, `AnalysisOutcome` | `PolicyConfig` provisional (§6); procedencia ampliada (decisión 5) |
| Proveedor falso | `createFakeDecisionProvider` | Las pruebas del servidor lo usan tal cual |
| Frontera HTTP en tests | MSW (`src/test/msw.ts`, `onUnhandledRequest: 'error'`) | Handlers de la pasarela, declarados en cada test |
| Casos de traducción | T01–T08 de `evals/llm-redactor/cases.ts`: sintéticos y vigentes (lo obsoleto del PoC es la parte del redactor) | Se reutilizan en L1 sin copiarlos |
| Variables de entorno | `.gitignore` ya excluye `.env.*` salvo `.env.example` | `.env.example` (`tech-stack.md` §62) |

No se añaden dependencias (decisión 2).

## 2. Estructura

```text
api/
└── interpret.ts                 entrada de la plataforma: lee el entorno y compone; sin lógica

src/server/
├── interpretHandler.ts          Request → Response con APIs web estándar; recibe sus dependencias
└── composeInterpret.ts          entorno recibido como argumento → dependencias, o nada (falla cerrado)

src/infrastructure/ai/
├── fakeDecisionProvider.ts      (005)
├── jevDecisionProvider.ts       peticiones a la pasarela; respuestas y fallos al formato de 005
├── jevQuestions.ts              preguntas, criterios, frases del expediente y instructionVersion
└── jevPolicyConfig.ts           PolicyConfig provisional, copia literal de §6; sin valores mientras §6 esté pendiente

src/infrastructure/language/
├── englishPreparation.ts        decorador del puerto, validación mecánica y procedencia
└── <proveedor aprobado>.ts      solo el que se elija tras L1

evals/jev/
├── fixtures/                    E1, inglés de referencia y subconjunto canario
├── runner/                      ejecución explícita, en seco por defecto
└── reports/                     informes con fecha
```

- Ningún código del cliente importa `src/server/` ni los adaptadores reales, y solo `api/interpret.ts` lee `process.env` (lo pasa a `composeInterpret`, que no lo lee). Una guarda lo comprueba (§7).
- La firma exacta de una función en `api/` para un proyecto Vite se verifica en V1. Si no encaja, solo cambia ese fichero.

## 3. Diseño

### 3.1 Composición

```text
POST /api/interpret
  → composeInterpret(entorno) → dependencias, o nada
  → interpretHandler
      sin dependencias → processing_unavailable (falla cerrado)
      lee el JSON → reaplica la minimización del expediente
      → interpretMessage(entrada, { provider, policy })
           provider = withEnglishPreparation(preparador, jevProvider(policy))
      → añade meta.languagePreparation → Response
```

- El núcleo valida longitudes y detecta marcadores sobre el original. El decorador recibe la `DecisionRequest` ya construida, crea otra en inglés y llama a Jev. Nada se traduce antes del puerto ni fuera de él.
- El decorador se crea en cada petición y guarda lo que hizo; el servidor lo lee al terminar para añadir la procedencia.
- **Falla cerrado.** `composeInterpret` solo devuelve dependencias si están las tres piezas: la credencial de AI Gateway, un preparador aprobado (el del proveedor que elija L1) y una `PolicyConfig` completa (§6). Si falta cualquiera, el servidor responde `processing_unavailable` con `retryable: false` sin llamar a nadie. Nunca usa el fake ni otro proveedor (decisión 8). La credencial es también la marca de autorización: no se configura en ningún entorno desplegado hasta que `013` y la autora lo permitan. Mientras L1 y §6 estén pendientes, la composición de producción no puede completarse; solo las pruebas la completan, con fakes inyectados.

### 3.2 Preparación lingüística

- Puerto propio de infraestructura, no del dominio: `prepare({ message, context? })` → `{ ok: true, message, context?, provenance }` o `{ ok: false, retryable }`.
- Solo pasan por el preparador el mensaje y el contexto. Las respuestas del expediente son valores codificados: el adaptador de Jev las convierte en frases fijas en inglés (`spec` §3). El servicio de traducción recibe así menos datos.
- Un texto sin letras (`\p{L}`), como «🙃» o «😤🤙», no se envía: no hay nada que traducir. Es una comprobación de caracteres, no de idioma.
- Un texto en inglés se envía como cualquier otro. Si el servicio informa de que el original ya estaba en inglés, la procedencia lo recoge. No se construye un detector propio (`spec` §2).
- Validación mecánica, común a cualquier proveedor: la salida no está vacía, y el multiconjunto de grafemas con emoji (`Intl.Segmenter` y `\p{Extended_Pictographic}`, con banderas y teclas) es idéntico al de la entrada. Se compara como multiconjunto porque traducir puede reordenar. Un emoji perdido, añadido o alterado (también su selector de variante) bloquea.
- Fallos: red, 429, 5xx o tiempo de espera → `retryable: true`; rechazo o bloqueo del contenido, credencial, cuota o validación mecánica → `false`. Jev no se llama y el núcleo devuelve `processing_unavailable` (`005-plan` §5, derivación 5).
- Procedencia en `meta.languagePreparation`: servicio, resultado (`translated | already_english | skipped_no_letters`) y versión de su configuración. Nunca el texto.

### 3.3 Adaptador de Jev

**Peticiones**

| `readings.profile` | Petición A, sin expediente | Petición B, con expediente |
|---|---|---|
| Ausente | Seguridad, tres tipos de persona afectada, suficiencia y las diez lecturas | No existe |
| Presente | Seguridad, tres tipos de persona afectada y suficiencia | Las diez lecturas; después de A, y solo si A no determina ya el resultado |

**Cuándo se envía B.** A determina el resultado cuando la política decide sin lecturas: seguridad con indicios (`safety_concern`), seguridad o suficiencia sin evaluar, o marcador de contenido omitido (pasos 1–4 de `005-plan` §3.6). El adaptador lo pregunta a `readingsNeeded` de `005`, con la misma `PolicyConfig` que el núcleo: no copia umbrales ni reglas. Si A no se puede leer, tampoco se envía B y el núcleo da `invalid_provider_response`. En los demás casos B es necesaria, también cuando A indica contexto insuficiente: un `needs_context` conserva los límites explícitos (`setting_boundary`, `requesting_space`) y esos salen de las lecturas. B, por tanto, nunca se pide «por si acaso». El coste es latencia: con expediente, A y B van en serie (hasta dos tiempos de espera, P3). Los experimentos miden las lecturas con expediente en todos los casos y no disponen de umbrales: el adaptador tiene un modo explícito `always`, que solo usa el runner de `evals/jev/` (`readings: { mode: 'always' }`). En producción el modo es `when-needed` con la `PolicyConfig`.

- El `state` sigue `jev.md` §8.2: `partnerMessage`, `currentSituation` si hay contexto y, solo en B, `reportedTendencies` con `about`. E4 puede cambiarlo. En `POST /v1/decisions` el estado viaja serializado en `input`, las preguntas son `predicate` y los `criteria` de `jevQuestions.ts` se incorporan al texto de `instructions`, porque el endpoint solo documenta `instructions` (§8.1; E8 comprueba si admite `criteria`).
- `undetermined` no se pregunta: es el valor por defecto de la política (`005-plan` §5, derivación 7).
- Las lecturas de B declaran en sus instrucciones que prevalece la evidencia actual (`jev.md` §8.7 B); las de A no mencionan un campo que no existe.
- Instrucciones, `criteria` y frases del expediente viven solo en `jevQuestions.ts`. Cualquier cambio de texto sube `instructionVersion`. Se redactan con las reglas de `jev.md` §6.2 y §10 punto 8, y con los riesgos de cada señal del registro §3 como fronteras (`not_for`). Este plan no las copia.
- El adaptador nunca produce `missingInformation`: Jev no genera texto (`005-plan` §5, derivación 8).

**De respuesta a `payload`.** El adaptador cambia la forma; no valida ni corrige. La única validación es `parseDecisionPayload`.

| Respuesta de una pregunta | En el `payload` |
|---|---|
| Probabilidad | El valor recibido, sin redondear ni recortar |
| Rechazo en seguridad o suficiencia | `'rejected'` |
| Rechazo en una lectura o un tipo de persona afectada | Clave ausente |
| Pregunta sin respuesta | Clave ausente |
| Cualquier otra forma, incluidos los centinelas de fallback (`confidence: 0`, `probabilities: {}`) | El valor recibido, para que el núcleo invalide toda la respuesta |
| Sobre de la respuesta ilegible | `payload` nulo: el núcleo da `invalid_provider_response` |

**Fallos**

| Situación | `DecisionReply` |
|---|---|
| A falla | `{ ok: false, retryable }` según la tabla siguiente |
| A determina el resultado (B no se envía) | El payload de A sin lecturas: la seguridad confirmada prevalece sobre cualquier otra salida (decisión 6) |
| B falla | `{ ok: false, retryable }`: error técnico, sin fallback silencioso (decisión 6). B solo se envía cuando el resultado depende de las lecturas, así que no hay seguridad confirmada que preservar; y devolver solo A perdería, en un `needs_context`, los límites explícitos |

| Origen | `retryable` |
|---|---|
| 429, cualquier 5xx (500, 502, 503, 529…), error de red, tiempo de espera | `true` |
| 400, 401, 402 (también `quota_for_entity_exceeded`), 403, 422 y cualquier otro 4xx | `false` |

- Ningún mensaje del proveedor sale del adaptador (`tech-stack.md` §60).
- Reintentos automáticos: ninguno (P1). Tiempo de espera: P3.
- Procedencia: `id: 'jev'`, alias pedido, modelo que respondió, versión observada o nada, y `instructionVersion` (decisión 5). `respondedModel` es un solo valor y solo se declara si todas las respuestas que contribuyen al análisis (A y, si se envía, B) lo informan y coinciden: si difieren o alguna no lo informa, no se atribuye el análisis entero a ninguno. Si el modelo que respondió no coincide con el pedido, se registra; E8 decide si invalida la respuesta.
- Opciones de cada petición: decisión 3.

### 3.4 Servidor

- Cuerpo: JSON `{ message, context?, profile? }`. Que llegue `profile` significa que la persona lo autorizó; la UX es de `007`.
- Una clave de `profile` fuera de `PROFILE_AREAS`, o cualquier otra clave desconocida, como `notes`, es `invalid_input`; también un valor que no figure en `AREA_ANSWERS` de su área (`answerKind()` solo clasifica valores válidos: un «depends» en `messageStyle`, que no lo admite, no es un «Depende» filtrable). Con el expediente válido se aplica `selectAuthorizedProfile`, que descarta «Depende» y «No lo sé», y `parseAnalysisInput` valida los valores. No se duplica ningún esquema.
- Respuesta: `{ ok: true, result }` o `{ ok: false, error: { code, retryable } }`. El cliente decide por el cuerpo; el estado HTTP es orientativo (`tech-stack.md` §29).

| Salida | HTTP |
|---|---|
| `interpreted`, `needs_context`, `safety_concern` | 200 |
| `invalid_input`, también con JSON ilegible | 400 |
| Método distinto de `POST` | 405 |
| `processing_unavailable` | 503 |
| `invalid_provider_response`, `safety_evaluation_unavailable` | 502 |

- El manejador no escribe en consola. La observabilidad operativa (estado, tipo de error, duración) es de `013` y `017`.
- Límite de tamaño del cuerpo, Turnstile y límites de ritmo: `013`.

### 3.5 Versiones

Cada resultado lleva las versiones de `005`, la procedencia ampliada del proveedor (decisión 5) y `languagePreparation`. Cambiar `jevQuestions.ts` sube `instructionVersion`; cambiar el preparador, su versión; cambiar §6, `policyVersion`. Los informes de §5 citan las tres.

## 4. Puerta antes de cualquier llamada real

Ningún paso de §5 con llamadas empieza hasta que todo esto esté anotado en §8 con fecha:

| # | Comprobación | Quién | Coste |
|---|---|---|---|
| V1 | **Completada (2026-10-16).** Hallazgos en §8.1. Resumen: Jev 1.14.0 disponible; `jev-latest` → 1.13.0; IDs versionados dan 404 (bug abierto); `/v1/decisions` documenta rechazos por pregunta, `/v1/evaluate` no; ZDR no disponible en Hobby (usar `only`); funciones Hobby 300 s máx., firma Web Standard; Azure F0 2M chars/hora, texto no almacenado. `jev.md` actualizado. | Agente | 0 |
| E0 | Cuenta de AI Gateway (`jev.md` §11): plan, compra mínima de créditos, recarga desactivada, efecto de `zeroDataRetention` en Hobby y, sobre todo, **si un método de pago registrado puede cobrar por encima del saldo**. | Autora | 0 |
| E0-V | ¿Está el repositorio conectado a Vercel con despliegue automático? ¿Tiene ese proyecto acceso a AI Gateway por OIDC? | Autora | 0 |
| E0-T | Cuenta y recurso de cada candidato de traducción aprobado (decisión 1): nivel, región y claves. | Autora | 0 |
| G1 | Límite aprobado (decisión 4) y aplicado: presupuestos de equipo y de clave, clave dedicada con caducidad, recarga desactivada. | Autora | 0 |
| G2 | Autorización expresa de cada ejecución, con su tope (§5.2). | Autora | — |

Solo se envían datos sintéticos de `evals/jev/fixtures/`. La revisión jurídica (RGPD art. 9, edad mínima, contratos) no bloquea esta feature porque no hay datos reales, pero sí cualquier envío de datos reales: queda en `013` y `017` (registro §14.8, `jev.md` §5.4).

## 5. Experimentos

### 5.1 Protocolo común

- El runner de `evals/jev/runner/` funciona en seco por defecto: cuenta peticiones y estima tokens y coste. Para llamar exige `--live`, la clave dedicada y un tope de peticiones y de coste acumulado (el que devuelva la respuesta o, si no lo da, el estimado). Se detiene ante el primer 401, 402 o 403 y no reintenta.
- Cada informe registra fecha, alias pedido, modelo que respondió, versión observada o `unknown`, `instructionVersion`, versión del preparador si interviene, opciones de enrutado, peticiones, coste, latencias y la respuesta bruta de cada pregunta. Los informes se guardan en Git: solo contienen datos sintéticos.
- E2–E6 usan el **inglés de referencia** de E1 (decisión 7). Así miden Jev sin el ruido del traductor y pueden ejecutarse antes de elegirlo. La cadena completa se mide al final (§5.4).
- Seguridad, suficiencia y lecturas viajan en la misma petición A, así que una **ejecución base** sobre E1 alimenta E2, E3 y E6: son tres análisis de los mismos datos.
- Las cifras de los criterios son reglas de decisión provisionales sobre un conjunto pequeño, no pruebas de fiabilidad (`011`).

### 5.2 Experimentos de Jev

| ID | Diseño | Criterio de éxito o regla de decisión | Decide | Tope |
|---|---|---|---|---|
| E1 | 40–65 casos sintéticos en español a partir de H01–H30, C1–C20 y T01–T08: mensaje, contexto opcional, inglés de referencia y etiquetas (por señal: `alta`, `baja` o `indiferente`; estado esperado; clase de seguridad y persona afectada). Variantes: pares mínimos sin y con contexto, expediente coherente y engañoso, inyección y cambio de género. Subconjunto canario marcado (unos 12). | Cobertura: cada señal con ≥ 4 casos claros `alta` y ≥ 4 `baja`; ≥ 6 pares mínimos; ≥ 8 casos de seguridad, ≥ 4 de ellos hipérboles; ≥ 4 pares de género; ≥ 3 inyecciones. Etiquetado según la decisión 7, con el procedimiento declarado: las etiquetas las aprueba la autora, sin ver respuestas de Jev, y cada caso conserva su procedencia. Procedencia declarada (2026-10-19): e1-01–e1-06 y e1-58–e1-65 las etiquetó la autora por sí misma (e1-06 con una exposición incidental a un borrador de inglés, documentada); e1-07–e1-57 son propuestas asistidas por IA que la autora revisó y aprobó, **no** etiquetas humanas independientes; e1-31 es `interpreted` + `hipérbole` por decisión expresa de la autora. Los informes de E2/E3/E6 deben citarlo. Con alguna etiqueta sin aprobar, la cobertura de etiquetas no se da por cumplida. | Base de E2–E6, L1 y `011` | 0 |
| E8 | Primera ejecución real: catálogo público (sin coste) y 1–3 peticiones con un caso canario; se repite otro día. | Informativo: ¿se puede fijar la versión? ¿Se observa en la respuesta? ¿Qué devuelve como modelo que respondió? Confirma además que la petición, la autenticación y las opciones de enrutado funcionan. | Alias pedido, origen de `observedVersion`, discrepancia de modelo; `jev.md` §3.5 | 0,05 $ |
| E2 | Ejecución base: E1 sin expediente, tres repeticiones, en dos brazos: inglés de referencia y español original. | En el brazo inglés: ≥ 99 % de respuestas bien formadas; ningún rechazo en casos no violentos; mediana de la desviación típica entre repeticiones ≤ 0,05; y un `communicableAt` común deja ≥ 80 % de casos `alta` por encima y ≥ 80 % de `baja` por debajo en al menos 8 de las 10 señales. Si no se cumple, se permite una nueva redacción de las preguntas (`instructionVersion` nueva); si sigue sin cumplirse, se para y decide la autora. El brazo español solo informa (`spec` §5). | `signals.communicableAt`; umbral de deriva, máx(0,10; 3 × desviación típica); tiempos de espera; coste por análisis; señales a revisar en `011` | 0,25 $ |
| E3 | Análisis de la ejecución base: pares mínimos y mensajes explícitos sin contexto. Si la pregunta falla, una variante de redacción. | En ≥ 80 % de los pares, la suficiencia con contexto supera a la de sin contexto en más que el umbral de deriva; ningún mensaje explícito («No quiero que vengas hoy») queda por debajo del `insufficientBelow` propuesto; los límites sin contexto conservan `setting_boundary` comunicable. | `insufficientBelow`, `sufficientFrom`, `requestContextWhenPartial` | 0,05 $ (variante) |
| E6 | Análisis de la ejecución base: riesgos claros por tipo de persona afectada, hipérboles y casos neutros. | Con el `concernAt` propuesto, ningún falso negativo en riesgos claros en las tres repeticiones; después, el menor número de falsos positivos en hipérboles (el error asimétrico favorece la alarma). Si evitar todos los falsos negativos obliga a alarmar en la mayoría de los casos neutros, decide la autora. Tipo afectado correcto en ≥ 80 % de los riesgos claros; si no, se apoya en `undetermined`. Un rechazo de la pregunta de seguridad en un riesgo claro es un hallazgo crítico y se informa antes de seguir. | `safety.concernAt`, `safety.affectedTypeAt` | Incluido en E2 |
| E4 | Subconjunto con expediente: ninguno, coherente y engañoso (por ejemplo, `sarcasm: often` con mensajes literales); orden de campos alterado. Solo si hay anclaje: todas las áreas frente a solo las pertinentes. | Con expediente engañoso, ningún caso literal claro cruza `communicableAt` en `sarcastic_tone` ni en `indirect_hint`; el orden de los campos mueve las estimaciones menos que el umbral de deriva. | Estructura del `state`; si se filtran áreas por pregunta; notas para `007` y `011` | 0,10 $ |
| E5 | Inyección en mensaje y contexto; pares en los que solo cambia el género. | Género: \|Δ\| ≤ umbral de deriva en ≥ 90 % de los pares señal × caso y ningún cambio de estado. Inyección: ningún cambio de estado ni de seguridad. Un fallo no bloquea: se documenta como vulnerabilidad con una mitigación propuesta, sin prometer robustez. | Nueva versión de las instrucciones si procede; notas para `013` y `014` | 0,05 $ |

### 5.3 L1 — Preparación lingüística

- **Diseño.** Casos de E1, T01–T08 y casos dirigidos: modismos («Tú sabrás», «Manda huevos»), doble negación, emojis compuestos y mensajes solo de emojis, «ok», spanglish, una muestra en catalán, gallego y euskera (solo informativa), inyección dirigida al traductor y violencia (H24–H26). Se prueba cada candidato aprobado (decisión 1). La autora valora a ciegas cada salida frente al inglés de referencia: fiel, pérdida menor o cambia el sentido. Además, efecto en Jev: la petición A sobre la salida de cada candidato, en los casos etiquetados, comparada con la ejecución base.
- **Eliminatorio.** Ningún «cambia el sentido» en negaciones, límites ni seguridad; ningún rechazo ni bloqueo en casos de seguridad; ninguna inyección obedecida; los fallos de la validación mecánica bloquean, nunca corrompen en silencio, y afectan a ≤ 2 % de los textos.
- **Orden entre los que pasan.** Menos «cambia el sentido» en total → más coincidencia de estado con la ejecución base → condiciones de privacidad verificadas → coste. En empate, Azure: no tiene superficie generativa.
- **Decide** el proveedor de traducción y su configuración. La autora lo confirma con el informe delante.
- **Tope.** 0 € en un nivel gratuito; 0,10 $ para el LLM y las peticiones a Jev.

### 5.4 Cierre experimental

- **Canario.** Unos 12 casos de E1 que cubren los tres estados, un límite, un riesgo y una hipérbole. Línea base: ejecución base y cadena completa. Hay deriva si cambia un estado o una señal se mueve más que el umbral de deriva; entonces se revisa antes de afirmar nada. Se ejecuta de forma explícita al cambiar el alias, la versión observada, `instructionVersion`, el preparador o `policyVersion`.
- **Prueba de humo de toda la cadena.** `interpretHandler` en Node local, con el preparador elegido y Jev, sobre unos 10 casos de E1 en español original: estado coherente con las etiquetas y procedencia completa. Tope: 0,05 $.
- Los hallazgos sobre la taxonomía (señales confusas, redundantes o ausentes) van a un informe para `011`. Esta feature no la cambia (`spec` §5).

Coste estimado de §5: ≤ 0,70 $ **[I]**, con un margen de ×2–3 sobre las estimaciones de `jev.md` §11.

## 6. Valores provisionales de `PolicyConfig`

Fuente normativa de los valores (`jev.md` §12). `jevPolicyConfig.ts` los copia y una prueba comprueba que coinciden con esta tabla. No se inventan valores para rellenar huecos: mientras cualquier fila diga «Pendiente», el módulo no exporta una `PolicyConfig` y la composición falla cerrado (§3.1).

| Parámetro | Fuente | Regla | Valor | Procedencia |
|---|---|---|---|---|
| `policyVersion` | — | `"1"` cuando la tabla esté completa; sube con cualquier cambio | Pendiente | — |
| `safety.concernAt` | E6 | §5.2 | Pendiente | — |
| `safety.affectedTypeAt` | E6 | §5.2 | Pendiente | — |
| `sufficiency.insufficientBelow` | E3 | §5.2 | Pendiente | — |
| `sufficiency.sufficientFrom` | E3 | §5.2 | Pendiente | — |
| `sufficiency.requestContextWhenPartial` | E3 | `true` si la mayoría de los casos `partial` están etiquetados como «necesita contexto» | Pendiente | — |
| `signals.communicableAt` | E2 | §5.2 | Pendiente | — |

Procedencia: experimento, fecha, modelo que respondió, versión observada y `instructionVersion`.

Si E2 muestra que las señales necesitan umbrales distintos, la estructura de `PolicyConfig` tiene que crecer (`005-spec`, «Provisional»). Se propondrá como cambio de `005` con su evidencia; no se resuelve en este plan.

## 7. Estrategia de pruebas

Sin red real. Primero la prueba de cada unidad (`tech-stack.md` §42.1).

| Fichero de test | Cubre |
|---|---|
| `englishPreparation.test.ts` | Preparador simulado: 👍🏽, 🤷‍♀️, una secuencia ZWJ, una bandera y una tecla sobreviven; emoji perdido, añadido o alterado y salida vacía bloquean sin llamar a Jev; texto sin letras omitido; el expediente nunca llega al preparador; `retryable` según el fallo; procedencia sin texto |
| `jevDecisionProvider.test.ts` | MSW sobre la pasarela con las respuestas de `jev.md` §10.1. Petición: cuerpos de A y B, expediente solo en B, opciones de enrutado, sin fallbacks, credencial en cabecera. Respuesta: probabilidades con dos decimales transmitidas sin redondear, respuesta ausente, tipo incorrecto, centinelas, rechazo por pregunta (seguridad → `'rejected'`, lectura → ausente), sobre ilegible. B: no se envía cuando A determina el resultado (con indicios de seguridad, seguridad o suficiencia sin evaluar, marcador omitido, A ilegible); sí se envía con contexto insuficiente. Fallos: 400, 401, 402 `quota_for_entity_exceeded`, 403, 429, 500, 529, red, tiempo de espera, B falla. Ningún texto del proveedor sale del adaptador |
| `interpretHandler.test.ts` | Fake del proveedor y preparador simulado: 200 en los tres estados; errores con código, `retryable` y estado HTTP; JSON ilegible; clave desconocida o `notes` → `invalid_input`; «Depende» y «No lo sé» filtrados y `profileUsed` coherente; sin credenciales, `processing_unavailable` sin fake; `languagePreparation` en los metadatos; nada en consola |
| `interpretComposition.test.ts` | Decorador, adaptador real y MSW: un rechazo de seguridad acaba en `safety_evaluation_unavailable`; con expediente y `concern` en A, B no se envía y el resultado es `safety_concern`; con contexto insuficiente B se envía y `needs_context` conserva los límites explícitos; si B falla, error técnico |
| `composeInterpret.test.ts` | Falta la credencial, el preparador aprobado o la `PolicyConfig` → sin dependencias (falla cerrado); con las tres, inyectadas, → dependencias. Con el estado actual del repositorio nunca se completa |
| `jevPolicyConfig.test.ts` | Los valores coinciden con §6; con alguna fila «Pendiente» no se exporta ninguna configuración |
| `fixtures.test.ts` | Estructura de los casos de E1 (`evals/jev/fixtures/`), cobertura estructural (pares, inyecciones, género, canario), cobertura de etiquetas sobre los 65 casos aprobados y el verificador de cobertura con datos sintéticos |
| `approved.test.ts` | Importador de E1: mapeo explícito del vocabulario aprobado (`evals/jev/review/*.json`) a los fixtures, rechazo de cualquier valor desconocido, procedencia por tramos y excepciones (e1-06, e1-31), recuentos de cobertura de la autora y aislamiento de los expedientes de E4 |
| `serverBoundary.test.ts` | Ningún módulo del cliente importa `src/server/` ni los adaptadores reales; solo `api/` lee `process.env` |
| Build | El bundle del cliente no contiene la URL de la pasarela ni los nombres de las variables secretas |

## 8. Verificación y registro

Además de las comprobaciones habituales (`AGENTS.md`):

- Revisar uno a uno los criterios de `006-spec.md` y marcar solo los demostrados.
- Comprobar que la suite normal y la CI no hacen llamadas reales ni tienen claves.
- `jev.md` actualizado con las fechas de V1 y lo observado en E8.
- Informes de §5 en `evals/jev/reports/`.

Aquí se irán añadiendo, con fecha: el registro de la puerta (§4), las condiciones verificadas del traductor y los resultados.

### 8.1 V1 — Revisión documental (2026-10-16)

Sin llamadas reales. Fuentes verificadas con búsquedas web.

**Jev y AI Gateway**

| Dato | Hallazgo | Fuente |
|---|---|---|
| Versión | `jev-1.14.0` disponible desde 2026-10-15. `jev-latest` → 1.13.0, `jev-preview` → 1.14.0 | [GW-jev-1.14], [GW-jev] |
| IDs versionados | `typesafe-ai/jev-1.14.0` devuelve 404. `modelId` es el alias. Bug abierto `vercel/ai#21213`, sin resolver | [GW-community-version] |
| Rechazos por pregunta | `/v1/decisions` los documenta: `{"type": "refusal"}`. `/v1/evaluate` no los documenta; solo describe 500 ante respuesta malformada | [GW-openai-decisions], [GW-evaluation-fallbacks] |
| Novedades 1.14 | Imágenes en el estado (experimental), contexto largo. TypeSafe sigue diciendo «solo texto». Ask Sofi solo envía texto | [GW-jev-1.14], [TS-system-one] |
| ZDR en Hobby | No disponible. Requiere Pro/Enterprise. `only: ["typesafe-ai"]` enruta al endpoint con ZDR del proveedor | [GW-control-data], [GW-zdr] |

**Transporte (decisión confirmada por V1):** usar `POST /v1/decisions` con `fetch`. Es el endpoint que documenta rechazos por pregunta. `/v1/evaluate` no los documenta, así que un rechazo de seguridad podría devolver 500 en lugar de un rechazo legible. Se elimina la condición del plan original.

**Forma de `POST /v1/decisions`** (página con fecha 2026-10-08, consultada el 2026-10-16; [GW-openai-decisions], `jev.md` §3.1)

| Dato | Hallazgo |
|---|---|
| Petición | `model`, `input` (cadena o array de mensajes), `questions` y `providerOptions.gateway` (`only`, `disallowPromptTraining`…). Cada pregunta `predicate`: `type`, `name` opcional, `instructions`. No se documenta `criteria` para `predicate` |
| Respuesta | `model`, `answers` en el orden de las preguntas, con `name`; `predicate` → `probability`; rechazo → `{ "type": "refusal", "name": … }`; `usage`; `provider_metadata.gateway` con enrutado y `cost` |
| Autenticación | `Authorization: Bearer <clave>`; la clave de API prevalece sobre OIDC |
| Errores | Validación en formato OpenAI (`error.message/type/param/code`); enrutado, facturación y proveedor en el formato de AI Gateway |

Consecuencias para el diseño (sin decisiones nuevas): el estado va serializado en `input`; los `criteria` se incorporan a `instructions`; `respondedModel` sale de `model`; `observedVersion` no se observa (la respuesta no trae versión). Si el endpoint admite `criteria` o devuelve más datos de versión, lo dirá E8.

**Funciones de Vercel en Hobby**

| Dato | Hallazgo | Fuente |
|---|---|---|
| Duración máxima | 300 s (5 min). Sin modo extendido en Hobby | [Vercel — Limits](https://vercel.com/docs/limits) |
| Firma recomendada | `export default { fetch(request: Request) { ... return new Response(...) } }` (Web Standard) | [Vercel — Node.js Runtime](https://vercel.com/docs/functions/runtimes/node-js) |
| 504 al agotar | `FUNCTION_INVOCATION_TIMEOUT` | [Vercel — Limits](https://vercel.com/docs/limits) |

300 s es muy holgado para 10 s (Jev) + 5 s (traducción) + procesamiento. La firma Web Standard coincide con `Request → Response` del plan.

**Azure AI Translator**

| Dato | Hallazgo | Fuente |
|---|---|---|
| Cuota F0 | 2M caracteres/hora (página oficial de límites). Páginas de precios y foros dicen «por mes»: discrepancia sin resolver. Comprobar en E0-T | [Azure — Service limits](https://learn.microsoft.com/en-us/azure/ai-services/translator/service-limits), [Azure — Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/translator/) |
| Al agotar F0 | La petición falla (429). No se cobra | [Azure — Service limits](https://learn.microsoft.com/en-us/azure/ai-services/translator/service-limits) |
| Retención | La traducción de texto se procesa en memoria y no se almacena de forma permanente | [Azure — Data privacy](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/translator/data-privacy-security) |
| Región | Se elige al crear el recurso. Endpoints regionales disponibles | [Azure — Secure deployment](https://learn.microsoft.com/en-us/azure/ai-services/translator/secure-deployment) |
| GDPR | ISO/IEC 27018, Microsoft DPA. Modelo controlador/encargado. DPIA responsabilidad del cliente | [Azure — Data privacy](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/translator/data-privacy-security) |
| Tamaño por petición | 50 000 caracteres máx. | [Azure — Service limits](https://learn.microsoft.com/en-us/azure/ai-services/translator/service-limits) |

**Bloqueos identificados:** ninguno para el bloque A (sin red). Para el bloque C, E0 (cuenta de la autora) y su autorización de gasto siguen siendo requisitos previos. No se identifican incompatibilidades técnicas nuevas.

### 8.2 Bloque A — verificación (2026-10-16)

Sin red real, sin credenciales y sin gasto. Tareas T001–T018 y T020; T019 se cerró después (§8.3).

| Comprobación | Resultado |
|---|---|
| Tests (`npm test`) | 78 ficheros, 1197 tests, todos correctos con `--maxWorkers=1`. Con 3 hilos y poca memoria libre en el equipo, 12 tests de `ProfileScreen.celebration.test.tsx` (004, sin cambios) agotaron su timeout de 15 s; aislado, ese fichero pasa 18/18. MSW con `onUnhandledRequest: 'error'`: cualquier llamada no simulada falla |
| Typecheck (`tsc -b`) | Sin errores. Nuevo `tsconfig.server.json` cubre `api/`, `src/server/` y `evals/jev/` |
| Lint (`eslint .`) | Sin errores |
| Build y bundle | `npm run build` correcto; `npm run verify:bundle` no encuentra la pasarela, `AI_GATEWAY`, `typesafe-ai` ni texto de las preguntas en `dist/` |
| Formato (`prettier --check`) | Correcto en todo lo de esta feature. Fallan 4 ficheros del PoC anterior (`evals/llm-redactor/`), que ya incumplían Prettier antes y no se han tocado |
| Procedencia con A y B | `respondedModel` solo si A y B coinciden; con modelos distintos o ausentes no se declara (corrección tras comprobar que antes se atribuía el análisis entero al modelo de A) |
| Valores del expediente | Todos los valores de `AREA_ANSWERS` aceptados y filtrados según `answerKind()`; cualquier valor inválido, 400 antes de minimizar (corrección: `messageStyle: 'depends'` se descartaba en silencio) |
| Mutaciones | Pedir B siempre rompe 8 tests; devolver A solo si B falla rompe 4: las pruebas detectan la lógica de la decisión 6 |
| Runner en seco | 342 análisis (E2 base: 57 casos × 2 brazos × 3 repeticiones), ~673 000 tokens de entrada, ~0,03 $ estimados **[I]**, frente al tope de 0,25 $ |

**Criterios de `006-spec.md` demostrados** (con respuestas simuladas según la documentación; E8 confirma el formato real): preparación bloqueante, preguntas `boolean` independientes, rechazos y ausencias según `005`, seguridad y suficiencia sin expediente, expediente sin respuestas concretas, errores sin texto del proveedor y sin reintentos, procedencia, minimización en el servidor, fallo cerrado y suite sin llamadas reales.

**No demostrados:** E0 y privacidad por ruta; supervivencia de emojis y obediencia ante inyecciones con un traductor real (L1); `POST /api/interpret` en la plataforma (`api/interpret.ts` no se ha desplegado: la resolución de sus importaciones en Vercel se comprueba con el primer despliegue); informes de E1–E8; valores de `PolicyConfig`; ejecución del canario.

**Cambio en una guarda de `005`:** `analysisPurity.test.ts` recogía toda la carpeta `infrastructure/ai/` como «el fake»; ahora solo `fakeDecisionProvider.ts`. Las reglas no cambian: los adaptadores reales de `006` llaman a la red por diseño.

### 8.3 T019 — fixtures y etiquetas de E1 (2026-10-19)

Sin red real, sin credenciales y sin gasto. El máximo de E1 pasó de 60 a 65 casos por decisión de la autora, para cubrir los mínimos de `alta` de `seeking_reassurance`, `inviting_initiative` y `playful_teasing` sin tocar los 57 casos ya aprobados (e1-58–e1-65, redactados y etiquetados por ella).

| Comprobación | Resultado |
|---|---|
| Fuente de verdad | `evals/jev/review/e1-casos-aprobados-65.json` (texto, inglés de referencia, etiquetas, procedencia) y `e1-perfiles-e4-aislados.json` (expedientes de E4). `cases.ts` solo añade origen, intención de diseño, pares y canario; falla al cargarse si falta o sobra un caso |
| Cobertura de etiquetas | `checkLabelCoverage` sobre los 65: completa. `alta`/`baja` por señal: literal_meaning 48/12, seeking_reassurance 4/14, inviting_initiative 4/12, requesting_space 7/19, expressing_disappointment 13/8, expressing_annoyance 12/14, setting_boundary 8/15, playful_teasing 4/44, sarcastic_tone 7/23, indirect_hint 13/26. Seguridad: 4 riesgos y 4 hipérboles |
| Estructura | 6 pares mínimos, 4 pares de género, 3 inyecciones, 12 casos canario |
| Tests | 79 ficheros, 1228 tests, todos correctos con `--maxWorkers=1` |
| Typecheck, lint, formato | `tsc -b`, `eslint .` y `prettier --check .` sin errores (el formato ya incluye `evals/llm-redactor/`) |
| Build y bundle | `npm run build` y `npm run verify:bundle` correctos |
| Runner en seco | 390 análisis (E2 base: 65 casos × 2 brazos × 3 repeticiones), ~768 000 tokens de entrada, ~0,03 $ estimados **[I]**, frente al tope de 0,25 $. No envía nada |
| Hojas | `npm run eval:sheets` regenera 6 tandas (8–12 casos) con la leyenda alineada al criterio de la autora; ya no toca los ficheros aprobados |

**Limitaciones declaradas:** 51 de las 65 etiquetas son propuestas asistidas por IA aprobadas por la autora, no un etiquetado humano independiente; el inglés de referencia es el aprobado por la autora, no una salida de modelo; nada de esto se ha contrastado con Jev (E2, E3, E6 no se han ejecutado).
### 8.4 E0–G1 — Investigación de cuentas, facturación y alternativas (2026-10-20)

**Estado: parcialmente completado. Feature 006 en pausa; Bloque C no autorizado.**

Este registro documenta las verificaciones realizadas por la autora en los paneles de Vercel y Azure, la investigación pública complementaria y las decisiones adoptadas antes de continuar con 007.

La revisión documental V1, la implementación sin red y el conjunto E1 de 65 casos aprobados ya están documentados en §8.1–8.3. No se repiten aquí.

#### 8.4.1 Estado de las puertas de ejecución

| Puerta | Estado al 2026-10-20 | Pendiente |
|---|---|---|
| V1 | Completada (§8.1) | Actualizar datos variables antes de llamadas reales |
| E0 | Parcial | Respuesta humana de Vercel sobre responsabilidad de facturación |
| E0-V | Comprobada en el equipo actual | No existe despliegue de Ask Sofi ni proyecto con OIDC configurado |
| E0-T | Parcial | Traductor no elegido; verificar ruta regional, condiciones y comportamiento real |
| G1 | Configuración parcialmente aprobada | Aplicar presupuesto, aprobar configuración restante y crear clave dedicada |
| G2 | No autorizado | Autorización independiente para cada experimento |

**Gasto en inferencia realizado durante esta investigación: 0 USD.**

No se han comprado créditos de AI Gateway, generado claves de Vercel, enviado solicitudes de inferencia ni ejecutado traducciones reales.

Ningún presupuesto aprobado equivale a autorización para consumirlo.

#### 8.4.2 Vercel AI Gateway — Cuenta real

Comprobado por la autora mediante su dashboard y capturas del 2026-10-20:

- Plan: **Hobby / Free**.
- Saldo de AI Gateway: **0 USD**.
- Los créditos promocionales de v0 son independientes del saldo de AI Gateway.
- El formulario de compra de AI Gateway muestra un mínimo de **10 USD**.
- **Auto-reload: Disabled**.
- Los créditos prepagados indican caducidad al año.
- El repositorio Ask Sofi no aparece conectado a un proyecto desplegado en el equipo de Vercel consultado.
- No existe configuración OIDC comprobada para Ask Sofi.
- No se ha realizado ninguna compra ni conexión de despliegue.

**Nota:** no confundir el mínimo de compra de 10 USD con un presupuesto o una autorización de gasto de 10 USD.

**Privacidad:** la comprobación V1 ya determinó que la opción ZDR de AI Gateway no está disponible en Hobby. El enrutado exclusivo a TypeSafe mediante `only: ["typesafe-ai"]` es una medida distinta y no equivale a una garantía ZDR del conjunto de la cadena.

Además, las condiciones generales de los productos de IA de Vercel contienen restricciones relativas al envío de datos personales sensibles (§3.4). Antes de cualquier uso con personas reales deben resolverse las condiciones aplicables, además de los requisitos de 013 y 017. Los experimentos de 006 utilizan exclusivamente casos sintéticos.

#### 8.4.3 E0 — Incertidumbre sobre facturación

**Pregunta pendiente:** ¿puede Vercel cobrar en una tarjeta registrada por consumo de AI Gateway que exceda los créditos prepagados cuando Auto-reload está desactivada?

Investigación:

1. **Vercel Academy** indica que AI Gateway utiliza créditos prepagados y que las peticiones se detienen cuando el saldo llega a cero.
2. Los presupuestos de API key son **soft caps**: una petición que cruza el límite puede terminar y las posteriores se bloquean. Un presupuesto no es una garantía estricta de gasto máximo.
3. La incidencia pública `vercel/ai#11280` documenta el bloqueo de solicitudes al agotar créditos, incluso con BYOK. Es evidencia sobre comportamiento técnico, no garantía contractual sobre cargos.
4. Las condiciones legales de Vercel, §10.2, contemplan la posibilidad de pagar uso adicional tras consumir créditos prepagados.
5. El §10.3 describe la autorización específica para cobros de recarga automática cuando esa opción se elige.
6. No se encontró un caso público verificable de facturación adicional bajo las condiciones exactas de esta cuenta: Hobby, créditos prepagados agotados y Auto-reload desactivada.

La autora preguntó al asistente de soporte de Vercel. Este indicó que, con Auto-reload desactivada, las solicitudes deberían bloquearse al agotarse el saldo y no producir una recarga automática, pero reconoció que no podía ofrecer una interpretación contractual definitiva.

**Acción realizada:** apertura de una consulta de facturación dirigida a soporte humano de Vercel.

**Estado:** respuesta pendiente.

**Criterio de desbloqueo:** revisar la respuesta escrita de soporte y confirmar si existe alguna ruta de cobro adicional, incluida una solicitud que cruce el saldo o un presupuesto blando. Si no queda suficientemente claro, no comprar créditos ni iniciar el Bloque C.

Las afirmaciones del asistente de soporte se conservan como información orientativa, no como garantía contractual.

#### 8.4.4 G1 — Presupuestos y clave dedicada

**Presupuesto de equipo aprobado por la autora:**

| Configuración | Valor aprobado |
|---|---|
| Team Budget | 1 USD |
| Refresh Period | `No refresh` |
| Alertas | 50 %, 75 % y 100 % |
| Auto-reload | Disabled |

El panel permite crear ese presupuesto, pero **no se ha pulsado `Set Budget`**.

Por tanto, el importe está aprobado, pero **el presupuesto todavía no está aplicado**.

**Clave dedicada:**

El formulario de creación de API key permite definir nombre, caducidad, atribución de gasto y presupuesto.

Se propuso:

| Configuración | Estado |
|---|---|
| Nombre `ask-sofi-006-evals` | Propuesto |
| Spend Attribution `User` | **Aprobado** |
| Spend Budget 1 USD | Propuesto; pendiente de aprobación específica |
| Budget Refresh `Never` | Propuesto |
| Expiration 30 days | Propuesto |

Atención: el formulario mostraba **1.000 USD de presupuesto por defecto**, valor que no debe aceptarse accidentalmente.

No se ha pulsado `Create API Key`, por lo que **no se ha creado la clave**.

El presupuesto de equipo y el de la clave son restricciones superpuestas, no importes que deban sumarse. Ambos pueden comportarse como límites blandos.

**G1 sigue abierto.** Se completará únicamente después de resolver E0 y aprobar los parámetros restantes, aplicando los controles y comprobando sus valores guardados.

Ninguna credencial de inferencia se incorporará a producción, previews ni CI antes de las protecciones de 013 y la autorización posterior exigida en `006-spec.md`.

#### 8.4.5 Azure AI Translator — Cuenta y recurso de evaluación

La autora creó una cuenta Azure Free Trial y un recurso Translator para investigar el candidato F0, sin seleccionar todavía al proveedor definitivo.

**Cuenta y suscripción:**

- Suscripción: `Azure subscription 1`.
- Estado observado: activa.
- Oferta inicial: cuenta gratuita de Azure con crédito promocional de **200 USD durante 30 días**.
- El portal mostraba la opción `Upgrade to pay-as-you-go`.
- No se ha realizado esa actualización.
- El límite de gasto de la cuenta gratuita es distinto de la cuota gratuita del recurso Translator.

**Recurso creado:**

| Campo | Valor observado |
|---|---|
| Resource group | `rg-ask-sofi-evals` |
| Región del resource group | West Europe |
| Recurso | `ask-sofi-translator-evals` |
| Servicio | Azure AI Translator |
| Región del recurso | **North Europe (Ireland)** |
| Pricing tier | **Free F0** |
| Network access | All networks |
| Managed identity | Desactivada |
| Estado | Activo |

Primero se intentó crear el recurso en West Europe, pero Azure rechazó el despliegue con `RequestDisallowedByAzure`. Se utilizó North Europe y el recurso quedó creado correctamente.

La región del grupo de recursos **no determina** la región de procesamiento del servicio.

**Endpoints observados/investigados:**

- Traducción de texto global: `https://api.cognitive.microsofttranslator.com/`
- Endpoint europeo para traducción de texto: `https://api-eur.cognitive.microsofttranslator.com/`
- Endpoint específico mostrado para el recurso: `https://ask-sofi-translator-evals.cognitiveservices.azure.com/`
- Región de la suscripción para cabeceras de autenticación: `northeurope`

La ruta europea es candidata a verificación; no se ha probado todavía con este recurso ni se ha validado de extremo a extremo el tratamiento regional de datos.

**Cuotas F0 verificadas:**

- **2 millones de caracteres gratuitos al mes**, según la página oficial de precios de Translator.
- **2 millones de caracteres por hora**, según la documentación de límites del servicio.

Estas cifras **no son contradictorias**: la primera es una franquicia de facturación mensual; la segunda es un límite de velocidad o capacidad de procesamiento.

Se debe verificar el comportamiento de la cuota en la cuenta real antes de depender de él. No confundir una respuesta de agotamiento de cuota con una garantía contractual extensible a otros servicios de Azure.

**Privacidad:** Microsoft documenta que la traducción de texto no conserva los datos enviados después del procesamiento. La región utilizada, la configuración real y el marco contractual aplicable deberán comprobarse antes de utilizar datos personales.

**Estado de uso:**

- Recurso Free F0 creado y activo.
- Claves existentes en el panel, enmascaradas; no copiadas, compartidas ni utilizadas.
- Ninguna llamada de traducción.
- Ninguna prueba de fidelidad lingüística.
- Ningún cambio a Pay-as-you-go.
- Proveedor de traducción **todavía no elegido**.

**Continuidad:** la cuenta Free Trial es temporal. Cuando se acerque su vencimiento, habrá que decidir si mantener Azure y bajo qué modalidad. Una eventual conversión a Pay-as-you-go requiere aprobación separada, porque elimina la protección general del límite de gasto de prueba y podría permitir cargos por otros recursos.

#### 8.4.6 Investigación de alternativas a Jev

Se investigaron proveedores alternativos y proyectos publicados en la comunidad, incluyendo recursos difundidos por midudev tras su charla con Capgemini e InfoJobs.

**Hallazgos:**

| Alternativa | Resultado de la investigación | Decisión |
|---|---|---|
| TypeSafe AI directo | Evita AI Gateway, pero implica otra cuenta, credenciales, facturación y condiciones de privacidad | No sustituye la ruta aprobada |
| OpenRouter | Posible intermediario; no se ha acreditado una mejora concluyente para Jev | No seleccionado |
| Laya | Modelo de decisiones abierto; tiene implementación local y variante multilingüe | Candidato a exploración, no adoptado |
| Kev | Familia abierta de modelos de decisiones basada en Qwen; requiere evaluar hardware y calidad | No adoptado |
| jevos / Von | Alternativas comunitarias con limitaciones propias de calidad o mantenimiento | No adoptadas |

**Laya en AI Gateway:**

Vercel anunció el acceso gratuito a Laya mediante Boundless hasta el **31 de octubre de 2026**.

- `convaiinnovations/laya-free`: identificador promocional que deja de servir después de la promoción.
- `convaiinnovations/laya`: identificador estándar que empieza a facturar al terminar la promoción.

Esta promoción es temporal; no constituye una solución gratuita permanente ni elimina la necesidad de verificar privacidad y límites de acceso.

**Laya local:**

- Código y pesos disponibles públicamente.
- Licencia Apache 2.0.
- Puede evitar el coste por petición de API cuando se ejecuta en hardware propio.
- No evita los costes ni requisitos de hardware, memoria, descargas o alojamiento.
- Su fidelidad con mensajes españoles y las señales específicas de Ask Sofi no está evaluada.

**Kev local:**

- Modelos abiertos de varios tamaños.
- Ejecución local posible con requisitos variables de hardware.
- Las comparaciones publicadas por sus autores no sustituyen pruebas sobre E1.
- No se justifica incorporarlo a esta feature sin un objetivo experimental concreto.

También se localizaron repositorios comunitarios de Super Mario controlado por Jev y materiales relacionados con la divulgación de midudev. No quedó demostrada una vinculación directa entre esos repositorios y el código de la charla mencionada por la autora.

No se confirmó una oferta vigente y permanente de Jev gratuito para producción. La información sobre antiguos créditos promocionales de TypeSafe no fue corroborada en una fuente oficial actual.

**Decisión conservada:** Jev a través de Vercel AI Gateway permanece como proveedor previsto. Azure Translator sigue siendo candidato de traducción pendiente de L1. No se modifica la arquitectura, la taxonomía ni el alcance experimental de 006.

#### 8.4.7 Fuentes nuevas de esta investigación

Consultadas o revisadas el **2026-10-20**. Las fuentes históricas de V1 ya constan en `jev.md` §13; aquí se registran las incorporaciones y las consultas específicas de esta sesión.

**Vercel — Presupuestos, facturación y condiciones**

- [Budgets and Spend Limits](https://vercel.com/docs/ai-gateway/observability-and-spend/budgets) — Presupuestos de equipo y clave.
- [Vercel Academy — Set a Budget](https://vercel.com/academy/ai-gateway/set-a-budget) — Créditos prepagados, bloqueo por saldo y soft caps.
- [Vercel AI Product Terms](https://vercel.com/legal/ai-product-terms) — §§3, 8 y 10; especialmente facturación y tratamiento de información sensible.
- [GitHub — vercel/ai#11280](https://github.com/vercel/ai/issues/11280) — Comportamiento observado cuando se agotan los créditos, incluso con BYOK.
- [AI Gateway Pricing](https://vercel.com/docs/ai-gateway/pricing) — Modelo de precios y créditos.
- [AI Gateway — ZDR](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr) — Condiciones y disponibilidad de Zero Data Retention.

**Azure — Cuota, cuenta y tratamiento de datos**

- [Azure Translator Pricing](https://azure.microsoft.com/en-us/pricing/details/translator/) — Franquicia gratuita mensual de F0.
- [Translator Service Limits](https://learn.microsoft.com/en-us/azure/ai-services/translator/service-limits) — Cuota de velocidad F0 y límites por solicitud.
- [Azure Spending Limit](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/spending-limit) — Protección y limitaciones del límite de gasto de la cuenta gratuita.
- [Avoid charges with Azure free account](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/avoid-charges-free-account) — Funcionamiento de la cuenta gratuita y posibles cargos.
- [Translator — Data privacy and security](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/translator/data-privacy-security) — Tratamiento y conservación de contenido.
- [Translator — Region support](https://learn.microsoft.com/en-us/azure/ai-services/translator/region-support) — Regiones y endpoints.
- [Translator — Secure deployment](https://learn.microsoft.com/en-us/azure/ai-services/translator/secure-deployment) — Configuración y acceso.

**Alternativas, repositorios y recursos comunitarios**

- [Laya — GitHub](https://github.com/NandhaKishorM/laya) — Implementación abierta.
- [Laya — Hugging Face](https://huggingface.co/convaiinnovations/laya) — Modelos y pesos.
- [Laya — Demo](https://huggingface.co/spaces/convaiinnovations/laya-demo) — Playground público.
- [Vercel — Laya Free hasta 31/10/2026](https://vercel.com/changelog/laya-decision-model-now-available-on-ai-gateway-free-through-october-31) — Promoción y comportamiento posterior de identificadores.
- [Kev — GitHub](https://github.com/jaredpalmer/kev) — Modelos abiertos de decisión.
- [Kev — Playground](https://huggingface.co/spaces/jaredpalmer/kev) — Demo pública.
- [jevos — GitHub](https://github.com/feder-cr/jev) — Implementación local alternativa.
- [Von — GitHub](https://github.com/wfzyx/von) — Alternativa comunitaria.
- [Super Mario — typesafe-mario](https://github.com/fhshaik/typesafe-mario) — Ejemplo comunitario.
- [Super Mario — mario-jev](https://github.com/shantanugoel/mario-jev) — Segundo ejemplo comunitario.
- [awesome-jev](https://github.com/heyjunpenn/awesome-jev) — Recopilación comunitaria.
- [Midudev — Vídeo sobre Jev](https://youtu.be/KvpQ16XlUv0) — Material divulgativo.
- [Midudev — Publicación sobre Laya](https://es.linkedin.com/posts/midudev_buscas-una-alternativa-de-c%C3%B3digo-abierto-activity-7510694203740385281-Gt_Q) — Referencia social.

**Jerarquía de evidencia:** condiciones legales y documentación oficial por encima de anuncios promocionales, incidencias comunitarias, publicaciones sociales y respuestas de asistentes de soporte. Ninguna fuente comunitaria sustituye las condiciones específicas de la cuenta.

Las verificaciones particulares del dashboard proceden de capturas y comprobaciones de la autora durante esta sesión, no de páginas públicas. No se incluyen capturas de cuentas ni credenciales en Git.

#### 8.4.8 Punto exacto para retomar 006

**Se puede avanzar en 007 con fakes y contratos existentes. Eso no desbloquea las llamadas reales de 006.**

Al retomar:

1. **E0:** recuperar la respuesta escrita del soporte de facturación de Vercel. Revisar especialmente cobros por encima del saldo, Auto-reload desactivada y presupuestos blandos. Registrar el resultado con fecha.
2. **E0 / privacidad:** volver a comprobar precios, modelo, versión, condiciones de retención, entrenamiento, regiones y configuración de enrutado aplicables en la fecha de la prueba.
3. **E0-T:** comprobar el estado del recurso Azure Free F0 y de la prueba gratuita, aclarar continuidad y validar la ruta regional antes de cualquier llamada autorizada. No asumir que Azure ya está seleccionado.
4. **G1:** completar la aprobación de los parámetros pendientes, aplicar el Team Budget y comprobarlo. Crear la clave dedicada solo después de resolver E0 y verificar su presupuesto, caducidad y atribución. Auto-reload debe continuar desactivada.
5. **G2:** pedir autorización expresa antes de cada ejecución real, con su tope de coste y volumen. Ninguna aprobación anterior constituye autorización general.
6. **Bloque C:** comenzar por T021/E8, después T022–T030 en el orden del plan. Utilizar exclusivamente datos sintéticos y registrar informes y procedencia.
7. **Cierre:** completar E2/E3/E6 y L1; elegir traductor según sus resultados; derivar `PolicyConfig` con evidencia; ejecutar el canario y la prueba de humo; verificar criterios de aceptación antes de cerrar 006.

**No hacer al retomar automáticamente:** comprar créditos, convertir Azure a Pay-as-you-go, generar credenciales, configurar claves en despliegues, ejecutar modelos reales, cambiar de proveedor, alterar `PolicyConfig` sin experimentos ni marcar completados E0/G1/G2 sin pruebas.

**Último estado conocido:** la autora ha aprobado el Team Budget de 1 USD sin renovación y la atribución `User` de la futura clave; ninguno se ha aplicado mediante la creación de una clave. Azure F0 está creado y sin uso. Se espera respuesta humana de facturación de Vercel.

**Próxima acción concreta:** revisar esa respuesta cuando llegue. Hasta entonces, Bloque B sigue abierto y Bloque C bloqueado.

## 9. Decisiones aprobadas (2026-10-16)

1. **Traducción:** L1 aprobado. La comparación entre candidatos es independiente de Jev. No se elige proveedor ni se abre cuenta de Azure todavía.
2. **Transporte:** `fetch` nativo con `POST /v1/decisions`. V1 confirma que `/v1/decisions` documenta rechazos por pregunta y `/v1/evaluate` no (§8.1). Sin reintentos automáticos. Sin dependencia `ai`.
3. **Privacidad:** `only: ["typesafe-ai"]`, `disallowPromptTraining: true`, ningún fallback. No se pasa `zeroDataRetention` (V1: no disponible en Hobby; `only` ya enruta al endpoint con ZDR del proveedor). API key dedicada en variable de servidor; OIDC queda para `017`.
4. **Presupuesto:** 0 € recurrentes obligatorios y 0 € autorizados actualmente. Ningún gasto ni cuenta de pago sin aprobación expresa de la autora. El bloque C no puede empezar hasta que se apruebe un límite concreto.
5. **Procedencia:** `ProviderProvenance` de `005` ampliada con `respondedModel?: string` e `instructionVersion?: string` opcionales. No se inventan versiones no verificables. `005-spec` §6 y `005-plan` §3.4/§3.7 actualizados.
6. **Fallo parcial con expediente:** A falla → error. Con `concern` en A la seguridad confirmada prevalece y B no se envía (§3.3). B falla → error técnico, sin fallback silencioso. `needs_context` completo se conserva: con contexto insuficiente B se envía para traer los límites explícitos y, si falla, no se devuelve un `needs_context` sin ellos.
7. **Experimentos:** casos sintéticos, etiquetas aprobadas por la autora antes de ejecutar nada (precisado el 2026-10-19: una parte son propuestas asistidas que ella revisó; la procedencia por caso está en §5.2), Jev separado de la traducción, criterios de éxito y parada definidos. Brazos supersedidos eliminados de `jev.md` §11.
8. **Despliegue:** ninguna credencial de inferencia en producción, previews ni CI antes de las protecciones de `013` y autorización posterior explícita. Añadido a `006-spec` §1.

## 10. Decisiones del plan, adoptadas

- **P1. Reintentos automáticos: ninguno.** Un fallo transitorio sale con `retryable: true` y la persona decide si reintenta (`007-spec`). Decisión 2 aprobada, recogida en `spec` §3: evita pagar dos veces un tiempo de espera que sí se procesó y las tormentas de reintentos antes de `013`. Si E2 muestra fallos transitorios frecuentes, se propondrá un único reintento para errores de red anteriores a la respuesta.
- **P2. Peticiones A y B** como en §3.3: en serie, y B solo si A no determina ya el resultado. Los tipos de persona afectada se preguntan siempre en A: una segunda ronda solo con `concern` añadiría latencia y otro camino de fallo, para ahorrar una cantidad despreciable.
- **P3. Tiempos de espera provisionales:** 10 s por petición a Jev (hasta 20 s con expediente, por el envío en serie de §3.3) (el valor por defecto del SDK de TypeSafe, `jev.md` §4.2) y 5 s para la traducción. Se ajustan con las latencias de E2 y la duración máxima que verifique V1.
- **P4.** Un texto sin letras no pasa por el preparador (§3.2).
- **P5.** Las instrucciones y las frases viven en el código, con `instructionVersion`; este plan no las copia.
- **P6.** Estados HTTP de §3.4.
- **P7.** Las condiciones verificadas del traductor se registran en §8, no en un documento nuevo; las de Jev y la pasarela, en `jev.md`.
- **P8.** Los informes de los experimentos se guardan en Git.

## 11. Documentación cambiada

| Decisión | Documento | Estado |
|---|---|---|
| 5 | `005-spec.md` §6; `005-plan.md` §3.4 y §3.7 | Hecho (2026-10-16) |
| 7 | `jev.md` §11 | Hecho (2026-10-16) |
| 8 | `006-spec.md` §1 | Hecho (2026-10-16) |
| V1 | `jev.md` §1, §3.4, §3.5, §5.1 y §13, con fecha | Hecho (2026-10-16) |
| Sincronización previa al bloque A | `jev.md` §3.1, §8.4, §8.7, §10 (puntos 4, 6, 10), §10.1, §11 (E8) y §13; `006-spec.md` §3, §4, criterios y «Provisional y pendiente»; `005-plan.md` §3.6 (`readingsNeeded`) | Hecho (2026-10-16) |
| E8 | `jev.md` §1, §3.5, §4 | Pendiente de ejecución |

## References

- `006-spec.md`
- `spec/constitution/mission.md` §12
- `spec/constitution/roadmap.md` §9
- `spec/constitution/tech-stack.md` §27, §28, §29, §42, §49, §57, §59–§63, §69
- `spec/constitution/jev.md` §2–§5, §8, §10, §11, §12
- `spec/decisions/analysis-architecture-rationale.md` §3, §5, §9, §12, §14.9, §19
- `005-spec.md`, `005-plan.md` y `src/domain/analysis/`
- `AGENTS.md`
