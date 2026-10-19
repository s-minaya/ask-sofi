# 005 — Analysis Domain

## Status

In Review

## Objective

Definir el núcleo de análisis de Ask Sofi: contratos de entrada, señales, política, resultado y errores, y la función común `interpretMessage()`, independientes de React, del idioma y de cualquier proveedor.

Se verifica con un proveedor falso determinista. Esta feature no interpreta mensajes reales.

Fuentes que no se repiten aquí: semántica de las estimaciones en `mission.md` §4.2; catálogo v1 y estados en `roadmap.md` §8; arquitectura y dirección de dependencias en `tech-stack.md` §24, §25, §29 y §59. El razonamiento está en `spec/decisions/analysis-architecture-rationale.md` («registro»).

## Dependencies

- `004`: modelo del expediente y `answerKind()` (`src/domain/partner-profile/partnerProfile.ts`). Se reutilizan; no se duplican.
- Consumidores del contrato: `006` (proveedor real y preparación lingüística), `007` (experiencia y redactor), `011`/`012` (evaluación y política), `014` (MCP).

## Requirements

### 1. Entrada

- `AnalysisInput` contiene el mensaje objetivo, el contexto actual opcional y, opcionalmente, el expediente autorizado y ya minimizado (§5). Mensaje y contexto son campos distintos.
- La entrada se valida en tiempo de ejecución. Un mensaje vacío o solo con espacios es entrada inválida.
- Mensaje y contexto tienen una longitud máxima configurable. Superarla es entrada inválida; nunca se trunca en silencio. Los valores se fijan en el plan, coherentes con `jev.md` §2.4.
- Un mensaje objetivo que solo contiene un marcador de contenido omitido («Audio omitido», «Se eliminó este mensaje»…) no se interpreta como texto de la pareja ni produce `interpreted`. La precedencia de seguridad (§4) se mantiene; si no hay `concern`, el resultado es `needs_context`. El mecanismo se decide en el plan; no se construye un parser de conversaciones ni procesamiento multimedia.
- El dominio no depende del idioma de la entrada.

### 2. Catálogo de señales

- El catálogo es el v1 provisional de `roadmap.md` §8: diez IDs estables con `kind: reading | cue`, independientes del copy y del idioma de la interfaz.
- Cada señal tiene una definición neutral de trabajo que permite a un consumidor sin redactor (`014`) saber qué afirma. Se redactan en el plan a partir del registro §3.
- El catálogo tiene `taxonomyVersion`. Añadir, eliminar, fusionar, redefinir o reclasificar una señal cambia la versión.
- Seguridad y suficiencia de contexto son evaluaciones auxiliares, no señales del catálogo.

### 3. Estimaciones y evaluaciones auxiliares

- Cada señal tiene una estimación opcional, finita y dentro de `[0, 1]`. Un `0` explícito es un dato válido. Una señal ausente, rechazada o no evaluada queda ausente: nunca se convierte en `0`, en una media ni en otro valor.
- Las estimaciones no se normalizan, no se reparten y no se combinan en una confianza global.
- `NaN`, infinitos, negativos o valores fuera de rango invalidan la respuesta del proveedor; no se corrigen ni se recortan.
- Las evaluaciones auxiliares (seguridad, a quién afecta el riesgo y suficiencia) llegan como estimaciones opcionales con las mismas reglas.
- La política (§4) deriva de ellas:
  - el estado de seguridad: `concern | no_concern_detected | not_evaluated`. Si falta la estimación de seguridad, el estado es `not_evaluated`, nunca `no_concern_detected`;
  - con `concern`, uno o varios tipos de persona afectada, extensibles: la persona usuaria frente a su pareja u otra persona; la pareja u otra persona que amenaza con hacerse daño; la propia persona usuaria; afectado no determinado. No es una clasificación clínica ni un diagnóstico;
  - el nivel de suficiencia: `insufficient | partial | sufficient`, o no evaluada. Puede acompañarse de una indicación opcional de qué falta cuando haya base para ella; no es una clasificación de motivos de la pareja.
- Seguridad y suficiencia se evalúan siempre sin datos del expediente. El contrato del puerto debe permitir comprobarlo en tests; la firma se decide en el plan (`tech-stack.md` §25 es orientativo).

### 4. Política

- `AnalysisPolicy` es una función pura: recibe las estimaciones y un `PolicyConfig` y devuelve el resultado. No hace I/O ni conoce el proveedor.
- `PolicyConfig` nombra los parámetros que la política necesita, como cuándo una señal es comunicable o cuándo la suficiencia es insuficiente, y tiene `policyVersion`. Esta feature define su estructura mínima y **no fija valores productivos**. Los tests usan valores de prueba explícitos y comprueban comportamientos relativos a los parámetros.
- Precedencia:
  1. Seguridad `concern` → `safety_concern`, por delante de cualquier otra salida y aunque falten otras estimaciones.
  2. Seguridad `not_evaluated` → error `safety_evaluation_unavailable` (§7). Suficiencia no evaluada → error. Ninguno de los dos casos produce `interpreted`, `needs_context` ni `safety_concern`. Excepción: si ya se confirmó `safety_concern`, prevalece aunque la suficiencia no se haya evaluado.
  3. Un límite explícito o una petición de espacio comunicables (`setting_boundary`, `requesting_space`) se conservan en el resultado aunque falte contexto. Reconocerlos no exige conocer sus motivos.
  4. Si la lectura del subtexto necesita hechos ausentes → `needs_context`, que conserva las señales del punto 3.
  5. En los demás casos → `interpreted` con las señales que la política autoriza. Cero señales comunicables es un resultado válido cuando la evaluación se completa correctamente; no se convierte en `needs_context`.
- No se elige una señal ganadora. Dos señales altas, aunque parezcan en tensión (por ejemplo, `literal_meaning` y `sarcastic_tone`), se conservan ambas; no hay tabla de incompatibilidades.
- No se calcula una confianza global por media, máximo ni diferencia entre señales.
- Las bandas por señal (baja, media, alta…) son opcionales y no se implementan hasta que `007` las necesite. Si existen, salen de parámetros de `PolicyConfig`, no sustituyen la estimación original y no son confianza ni acierto.
- Ante señales ausentes, la política decide con las disponibles. No se diseña un protocolo de resultados parciales por pregunta: depende del transporte de `006`.

### 5. Expediente

- Una función pura selecciona del expediente de `004` solo las respuestas que `answerKind()` clasifica como concretas. Excluye «No lo sé», «Depende», las áreas sin responder y las notas libres.
- Solo se aplica si la persona ha autorizado el uso del expediente en ese análisis. Sin autorización no se envía nada aunque exista un expediente local. La forma de autorizar es de `007`.
- La función se comparte entre cliente y servidor; el servidor la vuelve a aplicar en su frontera (`006`).
- `profileUsed` es `true` si y solo si se envió al proveedor al menos una respuesta concreta. Autorizar un expediente sin respuestas concretas da `profileUsed: false` y no genera una evaluación con expediente.
- Las lecturas del resultado son las obtenidas con expediente cuando `profileUsed` es `true`, y sin él en otro caso. Los dos conjuntos nunca se mezclan ni se promedian.

### 6. Resultado

- Estados: `interpreted | needs_context | safety_concern`. `needs_context` es un resultado válido, no un error.
- `interpreted` contiene las señales autorizadas, con ID, `kind` y estimación original, y el estado de seguridad.
- `needs_context` contiene el nivel de suficiencia, la indicación opcional de qué falta y, si existen, las señales del §4 punto 3.
- `safety_concern` contiene los tipos de persona afectada y ninguna señal ni estimación sentimental. Los recursos de ayuda y su copy pertenecen a `007`.
- El resultado es autosuficiente: no depende del redactor y sirve a un consumidor que no lo use (`014`).
- Metadatos: `schemaVersion`, `taxonomyVersion`, `policyVersion`, `profileUsed` y procedencia del proveedor (identificador, alias pedido, versión observada o `unknown`, modelo que respondió si se observa, y versión de las instrucciones del adaptador si se aplica). Los dos últimos campos son opcionales: un proveedor genérico o el fake no los declaran. No se declara una versión que no se haya observado. `006` y `007` añaden la procedencia del traductor y del redactor en su capa.
- Los metadatos no contienen el mensaje, el contexto ni el expediente.

### 7. Errores

- Los errores son un canal separado del resultado. Nunca se presentan como `needs_context` ni `safety_concern`, y el flujo no depende del texto de una excepción.
- Categorías mínimas: entrada inválida; procesamiento no disponible; respuesta del proveedor inválida; `safety_evaluation_unavailable`. Esta última indica que la seguridad no pudo evaluarse, con `retryable` según la causa: `true` solo ante evidencia clara de fallo transitorio (por ejemplo, un fallo de red que el proveedor sabe transitorio); `false` ante rechazo explícito del proveedor y ante causa desconocida, incluida la ausencia del campo. Sin causa identificada, actuar con prudencia. Los identificadores se fijan en el plan; los adaptadores de `006` traducen a ellas los fallos concretos.
- Cada error indica `retryable`: si tiene sentido ofrecer «Reintentar». No autoriza reintentos automáticos ni gasto nuevo.

### 8. Núcleo, puerto y proveedor falso

- `interpretMessage()` valida la entrada, consulta el `DecisionProvider`, valida su respuesta como dato no confiable, aplica la política con el `PolicyConfig` recibido y devuelve un resultado o un error. Es la única implementación para la API web y el MCP, y funciona sin redactor.
- El puerto es agnóstico del proveedor y del idioma.
- `FakeDecisionProvider` devuelve escenarios predefinidos y deterministas, sin calcular nada a partir del texto. Se identifica en la procedencia como `fake` y cubre respuestas válidas, ausencias, rechazos, valores inválidos y fallos.
- Cuando el proveedor falla, el núcleo devuelve el error correspondiente. Nunca recurre al fake ni a otro proveedor.

## Acceptance Criteria

### Contratos

- [x] La entrada separa mensaje, contexto y expediente minimizado; rechaza mensaje vacío y longitudes excesivas sin truncar.
- [x] Un mensaje que solo es un marcador de contenido omitido nunca da `interpreted`; sin `concern`, da `needs_context`.
- [x] El catálogo expone los diez IDs, su `kind`, una definición neutral y `taxonomyVersion`.
- [x] Un `0` explícito se conserva; una señal ausente o rechazada sigue ausente.
- [x] `NaN`, `Infinity`, `-0.1` y `1.1` producen el error de respuesta inválida.
- [x] El resultado no contiene confianza global ni estimaciones normalizadas.

### Política

- [x] Dos `PolicyConfig` de prueba distintos cambian la salida según sus parámetros, y `policyVersion` lo refleja.
- [x] Dos señales altas («Me hacía ilusión verte, pero bueno…») se conservan sin reparto ni ganadora.
- [x] Si ninguna señal es comunicable pero la evaluación se completa correctamente, el resultado es `interpreted` con cero señales, no `needs_context`.
- [x] Seguridad `concern` da `safety_concern` sin señales, aunque falten otras estimaciones.
- [x] Seguridad `not_evaluated` da `safety_evaluation_unavailable`, nunca `interpreted`, `needs_context` ni `safety_concern`.
- [x] Suficiencia no evaluada da error. Si ya se confirmó `safety_concern`, prevalece.
- [x] Seguridad `no_concern_detected` sigue la precedencia normal.
- [x] Un límite explícito con suficiencia insuficiente da `needs_context` que conserva `setting_boundary`.
- [x] «Vale.» sin contexto puede dar `needs_context` sin error técnico.

### Expediente

- [x] Con el expediente autorizado y solo «No lo sé», «Depende», áreas vacías o notas: no se envía nada y `profileUsed` es `false`.
- [x] Con una respuesta concreta y otra desconocida: solo se envía la concreta; las lecturas son las del expediente y la seguridad y la suficiencia se evalúan sin él.
- [x] Sin autorización, aunque exista un expediente local, no se envía nada y `profileUsed` es `false`.

### Núcleo y errores

- [x] El fake es determinista, no lee el texto y su procedencia es `fake`.
- [x] Un fallo del proveedor da un error con `retryable`, sin recurrir al fake ni a otro proveedor.
- [x] Ningún error se presenta como `needs_context` o `safety_concern`.
- [x] Los metadatos incluyen las versiones, `profileUsed` y la procedencia, con `unknown` cuando no se observó la versión, y no contienen texto de la consulta.
- [x] El dominio no importa React, SDKs de proveedores, almacenamiento del navegador, Design Lab ni redactor.
- [x] Las pruebas usan Vitest y el fake, sin red.

## Out of Scope

- Jev, preparación lingüística, AI Gateway, API HTTP, MCP y persistencia.
- Redactor, observaciones textuales, interfaz y Design Lab (`007`).
- Valores productivos de `PolicyConfig`, calibración y confianza global (`006`, `011`, `012`).
- Clave de caché o reutilización de resultados (`007`/`009`).
- Motor genérico de reglas o de observaciones.

## Provisional and pending

**Provisional (revisable con evaluación):** el catálogo v1 de diez señales y sus definiciones (`006`, `011`); la estructura de `PolicyConfig` puede crecer cuando `006` y `012` aporten parámetros con evidencia.

**Pendiente de evaluar en otras features:** valores de `PolicyConfig` (`006` E2/E3, `011`, `012`); si la selección del expediente debe filtrar también por relevancia para cada pregunta (`006` E4); tensiones entre señales (`012`).

**Decisiones aprobadas en esta spec:**

1. **Seguridad no evaluada** → error `safety_evaluation_unavailable`, con `retryable: false` en todos los casos definidos en esta feature: ausencia y rechazo dan ambos `false` (§7).
2. **Ninguna señal comunicable con contexto suficiente** → `interpreted` con cero señales (§4 punto 5). No se convierte artificialmente en `needs_context`.
3. **Suficiencia no evaluada** → error técnico. Si se confirmó `safety_concern`, prevalece (§4 punto 2).

## References

- `spec/constitution/mission.md` §4.2
- `spec/constitution/roadmap.md` §8
- `spec/constitution/tech-stack.md` §23, §24, §25, §29, §59, §60
- `spec/constitution/jev.md` §2.4
- `spec/decisions/analysis-architecture-rationale.md` §§2–7, §10, §11, §17
- `004 — Partner Profile & Onboarding`
- `AGENTS.md`
