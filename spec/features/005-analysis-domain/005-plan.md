# 005 — Analysis Domain — Plan

## Status

In Review

## Approach

Se implementa el núcleo de análisis como lógica pura bajo `src/domain/analysis/`, con pruebas primero (TDD) en cada unidad. No hay interfaz, red ni dependencias nuevas: Zod 4 ya está en el proyecto.

Orden previsto:

```text
Catálogo y vocabulario
    ↓
Entrada y expediente minimizado
    ↓
Puerto y estimaciones validadas
    ↓
Política
    ↓
Núcleo y proveedor falso
    ↓
Guardas y verificación
```

Cada unidad se prueba de forma aislada antes de componerse. El plan no repite los requisitos de `005-spec.md`: referencia sus apartados y solo fija lo que la spec delega aquí.

## 1. Auditoría de lo existente

| Necesidad | Se reutiliza | Hueco |
|---|---|---|
| Qué respuesta del expediente es concreta | `answerKind()`, `PROFILE_AREAS`, `AREA_ANSWERS`, `ProfileAnswers` y `AreaAnswer` de `src/domain/partner-profile/partnerProfile.ts` | Ninguno: no se duplica la clasificación ni los valores |
| Validación en tiempo de ejecución | `zod/mini`, como `partnerProfileSchema.ts` | — |
| Forma de los resultados | Uniones `{ ok: true … } \| { ok: false … }` de `004` (`ProfileSaveCheck`) | — |
| Ubicación | `src/domain/` (`tech-stack.md` §57) | `src/domain/analysis/` y `src/infrastructure/ai/` no existen todavía |
| Ayudantes de test | `src/test/` | `analysisFixtures.ts` (configuración de prueba) |

`evals/llm-redactor/` pertenece a `007` y `011`: no se toca.

## 2. Estructura

```text
src/domain/analysis/
├── signalCatalog.ts        catálogo v1, vocabulario auxiliar, taxonomyVersion
├── profileSelection.ts     selección del expediente autorizado y minimizado
├── analysisInput.ts        entrada, límites, validación y marcador de contenido omitido
├── decisionProvider.ts     puerto, petición, respuesta y validación de la respuesta
├── analysisPolicy.ts       PolicyConfig y política pura
├── analysisResult.ts       resultado, errores y metadatos
└── interpretMessage.ts     núcleo

src/infrastructure/ai/
└── fakeDecisionProvider.ts proveedor falso y escenarios
```

El proveedor falso vive fuera del dominio porque implementa su contrato, como Jev (`tech-stack.md` §24). Cada fichero tiene su test al lado.

## 3. Contratos

### 3.1 Catálogo (fuente de las definiciones)

Esta tabla es la fuente normativa de las definiciones neutrales. El código las copia tal cual y una prueba comprueba que coinciden (T001). Parten del registro §3. «Podría» y «Expresa/Comunica» se conservan: la estimación es el apoyo a un enunciado, no una certeza.

| ID | `kind` | Definición |
|---|---|---|
| `literal_meaning` | `reading` | Podría significar literalmente lo expresado. |
| `seeking_reassurance` | `reading` | Podría buscar tranquilidad, confirmación o afecto. |
| `inviting_initiative` | `reading` | Podría sugerir iniciativa o una propuesta del interlocutor. |
| `requesting_space` | `reading` | Expresa distancia, pausa o necesidad de tiempo. |
| `expressing_disappointment` | `reading` | Comunica decepción o expectativas frustradas. |
| `expressing_annoyance` | `reading` | Comunica irritación, fastidio o enfado. |
| `setting_boundary` | `reading` | Comunica una negativa o un límite que merece respeto. |
| `playful_teasing` | `cue` | Broma o provocación juguetona. |
| `sarcastic_tone` | `cue` | Ironía o sarcasmo como forma de decirlo. |
| `indirect_hint` | `cue` | Indirecta o comunicación insinuada. |

Versiones: `taxonomyVersion = 1` (v1 provisional) y `schemaVersion = 1`. Una señal que se añada, elimine, fusione, redefina o reclasifique incrementa `taxonomyVersion`.

Vocabulario auxiliar:

- Niveles de suficiencia: `insufficient | partial | sufficient`.
- Tipos de persona afectada (lista extensible, `spec` §3): `user_at_risk_from_other`, `other_at_risk_of_self_harm`, `user_at_risk_of_self_harm`, `undetermined`. Se explican en `007`; el dominio solo los nombra.

### 3.2 Entrada y límites

- `AnalysisInput`: `message`, `context?` y `profile?`. `profile` es un `ProfileAnswers` ya minimizado (solo respuestas concretas, sin notas).
- `parseAnalysisInput(raw: unknown, limits)` valida con Zod la forma y comprueba lo demás en código. Devuelve `{ ok: true, input }` o `{ ok: false, issues }` con códigos estables: `invalid_shape`, `message_empty`, `message_too_long`, `context_too_long`, `profile_not_minimized`. La forma es estricta: una clave desconocida (por ejemplo las notas del expediente) es entrada inválida.
- `profile_not_minimized`: algún valor no es concreto según `answerKind()`. No se filtra en silencio: la minimización es de `profileSelection` y la repite el servidor (`spec` §5).
- Un contexto en blanco equivale a no tener contexto. El mensaje y el contexto no se recortan ni se transforman.
- Longitudes en `String.length`, configurables mediante `InputLimits`.

### 3.3 Selección del expediente

`selectAuthorizedProfile(profile, authorized)` devuelve un `ProfileAnswers` con las respuestas que `answerKind()` clasifica como `concrete`; vacío si no hay autorización, expediente o respuestas concretas. Nunca incluye notas. `profileUsed` es `true` si y solo si el resultado no está vacío.

### 3.4 Puerto y respuesta

Una sola operación, `evaluate`. La petición separa lo que evalúa seguridad y suficiencia de lo que obtiene las lecturas; solo las lecturas tienen campo para el expediente, así un test comprueba qué recibió cada parte (`spec` §3, última viñeta).

```ts
interface DecisionProvider {
  evaluate(request: DecisionRequest): Promise<DecisionReply>
}

type DecisionRequest = {
  assessment: { message: string; context?: string } // seguridad, afectados, suficiencia
  readings: { message: string; context?: string; profile?: ProfileAnswers }
}

type DecisionReply =
  | { ok: true; payload: unknown; provenance: ProviderProvenance }
  | { ok: false; retryable: boolean } // fallo de toda la llamada (402, 429, tiempo de espera…)

type ProviderProvenance = {
  id: string
  alias?: string
  observedVersion?: string
  respondedModel?: string
  instructionVersion?: string
}
```

`payload` es dato no confiable: el núcleo lo valida con Zod (`parseDecisionPayload`) antes de usarlo. Forma validada:

| Campo | Valor aceptado |
|---|---|
| `signals` | por cada ID del catálogo: estimación finita en `[0, 1]`, o la clave ausente. Un ID desconocido invalida la respuesta |
| `safety` | estimación en `[0, 1]`, `'rejected'` o ausente |
| `affected` | por cada tipo de persona afectada: estimación en `[0, 1]` o ausente |
| `sufficiency` | estimación en `[0, 1]`, `'rejected'` o ausente. Es el apoyo a «el mensaje y el contexto bastan para interpretarlo» |
| `missingInformation` | cadena no vacía opcional; sin taxonomía (`spec` §3) |

`'rejected'` solo existe donde importa: seguridad y suficiencia, porque cambia `retryable` (`spec` §7). En una señal, un rechazo es una ausencia: el adaptador de `006` omite la clave. Un valor no finito, fuera de rango o de tipo incorrecto invalida **toda** la respuesta; no se corrige ni se recorta.

### 3.5 PolicyConfig

```ts
type PolicyConfig = {
  policyVersion: string
  safety: { concernAt: number; affectedTypeAt: number }
  sufficiency: {
    insufficientBelow: number
    sufficientFrom: number
    requestContextWhenPartial: boolean
  }
  signals: { communicableAt: number }
}
```

- Estado de seguridad: estimación `≥ concernAt` → `concern`; menor → `no_concern_detected`; ausente o `'rejected'` → `not_evaluated`.
- Tipos afectados con `concern`: los que alcanzan `affectedTypeAt`; si ninguno, `['undetermined']`.
- Nivel de suficiencia: `< insufficientBelow` → `insufficient`; `≥ sufficientFrom` → `sufficient`; entre ambos → `partial`.
- `requestContextWhenPartial`: si `partial` también pide contexto (ver §5, derivación 1).
- Señal comunicable: estimación `≥ communicableAt`.

La feature no entrega valores productivos (`spec` §4). Los tests usan `TEST_POLICY_CONFIG` y una segunda configuración, definidos en `src/test/analysisFixtures.ts`.

### 3.6 Política: orden de evaluación

Aplica la precedencia de `005-spec.md` §4. Solo se fija aquí dónde encajan el marcador omitido y las lecturas ausentes:

| Paso | Condición | Salida |
|---|---|---|
| 1 | Seguridad `concern` | `safety_concern` con los tipos afectados |
| 2 | Seguridad `not_evaluated` | error `safety_evaluation_unavailable` (`retryable: false` en ambos casos: ausencia y rechazo) |
| 3 | Suficiencia no evaluada | error `processing_unavailable` (`retryable: false` en ambos casos: ausencia y rechazo) |
| 4 | El mensaje es solo un marcador de contenido omitido | `needs_context`, `sufficiency: insufficient`, sin señales conservadas |
| 5 | Nivel `insufficient`, o `partial` con `requestContextWhenPartial` | `needs_context` con el nivel, `missingInformation` si hay y las señales de `setting_boundary` y `requesting_space` comunicables |
| 6 | Ninguna señal evaluada | error `processing_unavailable`, `retryable: false` |
| 7 | En los demás casos | `interpreted` con las señales comunicables, en el orden del catálogo, y `safety: no_concern_detected` |

Los pasos 1–4 no dependen de las lecturas. `readingsNeeded(estimates, facts, config)`, exportada junto a `analysisPolicy`, dice si hacen falta: es `false` cuando alguno de esos pasos ya decide. Un adaptador que obtiene las lecturas en una petición aparte la usa para no pedirlas cuando no cambiarían la salida (`006-plan` §3.3). Comparte código con la política; no copia sus reglas.

El paso 3 va antes del 4 para respetar `005-spec.md` §4: «Suficiencia no evaluada → error». Un fallo técnico de suficiencia no queda enmascarado por la detección del marcador. Solo llega al paso 4 si la suficiencia se evaluó correctamente; de lo contrario, un marcador en un mensaje con suficiencia fallida daría `needs_context` silenciosamente en lugar del error que corresponde.

### 3.7 Resultado, errores y metadatos

Tipos según `005-spec.md` §6 y §7. `interpreted.safety` es siempre `no_concern_detected`: cualquier otro estado no llega a `interpreted`.

| Código de error | Cuándo | `retryable` |
|---|---|---|
| `invalid_input` | La entrada no cumple §3.2 | `false` |
| `processing_unavailable` | Falla toda la llamada `ok: false` | `reply.retryable` (el proveedor lo sabe) |
| `processing_unavailable` | Excepción del proveedor | `false` (causa desconocida → prudente) |
| `processing_unavailable` | Suficiencia rechazada | `false` (rechazo explícito) |
| `processing_unavailable` | Suficiencia ausente | `false` (causa desconocida → prudente) |
| `processing_unavailable` | Ninguna lectura evaluada | `false` (causa desconocida → prudente) |
| `invalid_provider_response` | El payload no cumple §3.4 | `false` (puede ser un problema persistente del proveedor) |
| `safety_evaluation_unavailable` | Seguridad rechazada | `false` (rechazo explícito) |
| `safety_evaluation_unavailable` | Seguridad ausente | `false` (causa desconocida → prudente) |

Los errores solo llevan `code` y `retryable`: nunca texto de una excepción ni del proveedor.

Metadatos: `schemaVersion`, `taxonomyVersion`, `policyVersion`, `profileUsed` y `provider` (`id`, `alias?`, `observedVersion` con `'unknown'` si el proveedor no la declaró, `respondedModel?` y `instructionVersion?`). Los dos nuevos campos son opcionales: el fake no los declara. El mensaje, el contexto y el expediente nunca están en ellos.

### 3.8 Núcleo y proveedor falso

`interpretMessage(raw: unknown, deps)`, con `deps = { provider, policy, limits? }`:

1. `parseAnalysisInput`; si falla, `invalid_input`.
2. Construye la `DecisionRequest`; el expediente solo viaja en `readings` y solo si `profileUsed`.
3. `provider.evaluate`; una excepción da `processing_unavailable` con `retryable: false` (causa desconocida).
4. `parseDecisionPayload`; si falla, `invalid_provider_response`.
5. `analysisPolicy`; añade los metadatos al resultado.

Nunca recurre al fake ni a otro proveedor (`spec` §8).

`createFakeDecisionProvider(scenario)` devuelve siempre la respuesta predefinida del escenario, sin leer el texto; registra las peticiones para poder comprobar qué recibió cada parte. Su procedencia es `{ id: 'fake' }`. Los escenarios cubren lo que pide `spec` §8: respuestas válidas, ausencias, rechazos, valores inválidos y fallos.

## 4. Decisiones que la spec delega en el plan

| Decisión | Valor |
|---|---|
| Longitud máxima del mensaje | 2 000 caracteres (provisional, configurable) |
| Longitud máxima del contexto | 4 000 caracteres (provisional, configurable) |
| Identificadores de error | Tabla de §3.7 |
| Firma del puerto | §3.4 |
| Estructura de `PolicyConfig` | §3.5, sin valores productivos |
| Definiciones de señales y versiones | §3.1 |
| Mecanismo del marcador omitido | Ver más abajo |

**Límites.** `jev.md` §2.4 admite 32 000 tokens para el estado más la pregunta más larga. Con la cota conservadora de un token por carácter, 6 000 caracteres ocupan el 19 % de ese presupuesto; el resto cubre el expediente (seis respuestas como mucho), las instrucciones de `006` y la expansión de la preparación al inglés. Son valores provisionales: `006` (E1) puede ajustarlos con datos, sin cambiar el contrato.

**Marcador omitido.** `isOmittedContentMarker(message)` es una función pura que compara el mensaje **entero** con una lista cerrada de marcadores de exportación en español e inglés («Audio omitido», «Se eliminó este mensaje», «image omitted»…), tras normalizar: quita marcas de dirección Unicode, recorta, quita un par de `<>` o `[]` que lo envuelva y un punto final, pasa a minúsculas y elimina diacríticos. No busca subcadenas: «Te mando el audio omitido» no es un marcador. La lista vive en el código, es provisional y no pretende ser exhaustiva; un marcador no listado sigue el flujo normal y lo trata la pregunta de suficiencia de `006`. Es una lista de literales de aplicaciones, no un detector de idioma, y no construye un parser de conversaciones.

## 5. Derivaciones a confirmar en la revisión

La spec no las fija; son consecuencias mínimas de lo aprobado. Cada una está aislada en un único punto del código y tiene su test.

1. **`partial` pide contexto según la configuración.** La spec define tres niveles y que `needs_context` lleve el nivel, pero no qué hace `partial`. Se parametriza en `PolicyConfig` en lugar de decidirlo; su valor provisional sale de `006` (E3).
2. **Ninguna lectura evaluada no es `interpreted` con cero señales.** El cero comunicable es válido «cuando la evaluación se completa correctamente» (`spec` §4); si todas las lecturas faltan, no se completó. Es `processing_unavailable`.
3. **`retryable` según la causa real.** `true` solo cuando hay evidencia de fallo transitorio: fallo delegado al proveedor (`ok: false`) con `reply.retryable: true`. En todos los demás casos, `false`: rechazo explícito, ausencia de seguridad o suficiencia (causa desconocida), excepción, respuesta inválida, ninguna lectura. `invalid_input` siempre `false`. Sin causa identificada, actuar con prudencia.
4. **Marcador omitido: solo si la suficiencia se evaluó.** El paso de suficiencia no evaluada (nuevo paso 3) precede al marcador (paso 4). Un fallo técnico de suficiencia es un error aunque el mensaje sea un marcador; de lo contrario quedaría enmascarado. Si la suficiencia se evaluó correctamente, el marcador sí da `needs_context`.
5. **Un fallo de toda la llamada** es `processing_unavailable`, no `safety_evaluation_unavailable`, que queda para cuando el proveedor respondió sin la seguridad (registro §5, «un timeout … es error de procesamiento»).
6. **Suficiencia no evaluada** es `processing_unavailable` (la spec dice «error técnico» sin elegir categoría).
7. **Tipos afectados.** Con `concern` y ningún tipo por encima de su umbral, `['undetermined']`.
8. **`missingInformation`** es una cadena opcional que el proveedor puede aportar y el núcleo pasa tal cual. Jev solo decide y no genera texto, así que hoy ningún adaptador la produce.

## 6. Estrategia de pruebas

Vitest sobre el fake, sin red (`AGENTS.md`). Cada unidad pura se prueba primero.

| Fichero de test | Cubre (criterios de `005-spec.md`) |
|---|---|
| `signalCatalog.test.ts` | Diez IDs, `kind`, definición neutral, `taxonomyVersion`; las definiciones coinciden con §3.1 de este plan |
| `profileSelection.test.ts` | Sección «Expediente»: solo «No lo sé»/«Depende»/vacías/notas; una concreta y una desconocida; sin autorización |
| `analysisInput.test.ts` | Mensaje vacío o en blanco; longitudes sin truncar; contexto en blanco; expediente no minimizado; claves desconocidas; marcador omitido |
| `decisionProvider.test.ts` | `0` explícito frente a ausencia; `'rejected'`; `NaN`, `Infinity`, `-0.1`, `1.1`; ID desconocido; tipo incorrecto |
| `analysisPolicy.test.ts` | Toda la sección «Política»; dos configuraciones distintas; cada paso de §3.6 |
| `fakeDecisionProvider.test.ts` | Determinista, no lee el texto, procedencia `fake`, cubre los casos de `spec` §8 |
| `interpretMessage.test.ts` | Sección «Núcleo y errores»; `profileUsed`; seguridad y suficiencia sin expediente; metadatos; sin confianza global; sin recurrir a otro proveedor |
| `analysisPurity.test.ts` | El dominio no importa React, SDKs de proveedores, almacenamiento, Design Lab ni redactor, y no usa red ni consola |

## 7. Verificación

Además de las comprobaciones habituales del proyecto (`AGENTS.md`):

- Revisar uno a uno los criterios de `005-spec.md` y marcar solo los demostrados por un test.
- Comprobar que ningún test depende de red ni de un proveedor real.
- Confirmar que `004`, `003` y `002` no presentan regresiones.
- Comprobar que el bundle no incluye el dominio nuevo: ningún consumidor lo importa todavía.

## 8. Resultados de la verificación

**Comprobaciones del proyecto.** Tipos y lint limpios; build correcto; Vitest 65 ficheros y 794 pruebas en verde (la línea base era de 57 y 602: 8 ficheros y 192 pruebas nuevas). El formato falla solo en los siete ficheros previos de `evals/llm-redactor/`, que esta feature no toca. Playwright no se ha ejecutado: la feature no cambia la interfaz ni el bundle.

**Criterios de `005-spec.md`.** Los 24 están demostrados por pruebas automáticas y marcados:

| Grupo | Pruebas |
|---|---|
| Contratos | `analysisInput`, `decisionProvider`, `signalCatalog`, `interpretMessage` |
| Política | `analysisPolicy` y `interpretMessage` (`policyVersion`) |
| Expediente | `profileSelection` e `interpretMessage` (de la selección al proveedor) |
| Núcleo y errores | `fakeDecisionProvider`, `interpretMessage`, `analysisPurity` |

**Las pruebas fallan sin la lógica.** Se comprobó rompiendo a propósito, y restaurando después, cuatro reglas: el rechazo de seguridad como reintentable, el expediente viajando a seguridad y suficiencia, el marcador omitido ignorado y `answerKind()` sustituido por una comparación propia. Cada rotura hizo fallar al menos una prueba. La guarda de pureza también detecta una importación de React, una de la capa de almacenamiento y un `console.log`.

**Hallazgos de la ejecución.**

- Una primera pasada de la suite dio 12 fallos, todos en un fichero. Se ejecutó a la vez que la comprobación de formato de todo el repositorio y no se repitieron al ejecutarla sola: era contención de CPU, no una regresión.
- Al formatear, los escapes Unicode invisibles (`‎`…) de `analysisInput.ts` y su test se habían convertido en caracteres literales. Se restauraron como escapes y una prueba comprueba que una marca de dirección delante del marcador se ignora.
- `import.meta.glob` sobre `*.ts` también recoge los tests: la guarda de pureza los excluye por nombre.

**Ajustes del cierre (revisión).**

Las derivaciones 3 y 4 de §5 fueron revisadas y corregidas:
- `retryable` depende de la causa real; `true` solo con evidencia de fallo transitorio (`reply.retryable`). Ausencia de seguridad o suficiencia, excepción, respuesta inválida y ninguna lectura dan `false` (causa desconocida → prudente).
- El marcador omitido solo acorta el camino a `needs_context` si la suficiencia se evaluó; un fallo técnico previo da error.

Las otras derivaciones (1, 2, 5, 6, 7, 8) se mantienen sin cambios: son consecuencias directas de decisiones ya aprobadas.

Ningún consumidor importa todavía el dominio: `006` lo integra con el proveedor real y `007` con la interfaz.

## References

- `005-spec.md`
- `spec/constitution/tech-stack.md` §23, §24, §25, §29, §42, §53–§55, §57, §59, §60
- `spec/constitution/jev.md` §2.4
- `spec/decisions/analysis-architecture-rationale.md` §3, §5, §6, §10, §17
- `src/domain/partner-profile/partnerProfile.ts`
- `AGENTS.md`
