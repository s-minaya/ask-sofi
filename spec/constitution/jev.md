# Jev — Referencia técnica del proveedor de decisiones

## Estado

Borrador — pendiente de aprobación.

Fuentes verificadas entre el 2026-10-13 y el 2026-10-14. Antes de usar un dato en una feature, revisa «Mantenimiento».

Decisión aprobada por la autora (2026-10-14): Ask Sofi utiliza Jev mediante Vercel AI Gateway y asume un coste operativo pequeño, limitado y controlado (§4.3). La decisión vive en `mission.md` §12 y `tech-stack.md` §27; aquí se recogen los datos que la rodean.

## Propósito y límites

Este documento reúne lo que sabemos, y lo que no, sobre Jev. Es el proveedor de decisiones previsto en `tech-stack.md` §26, y se accede a él mediante Vercel AI Gateway (`tech-stack.md` §27). Recoge qué hace, qué devuelve, qué límites tiene, cuánto cuesta, qué riesgos supone para Ask Sofi y qué falta demostrar.

No sustituye a otras fuentes de verdad:

- los principios de producto viven en `mission.md`;
- la arquitectura y las convenciones globales, en `tech-stack.md`;
- el alcance y el orden de trabajo, en `roadmap.md`;
- los requisitos y decisiones de cada feature, en `spec/features/`.

Si una conclusión de este documento exige cambiar una de esas fuentes, el cambio se hace allí. Aquí solo se indica dónde se decide (sección 12).

### Convención de evidencia

| Marca   | Significado                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------ |
| **[E]** | Evidencia. Lo documenta una fuente oficial o un dato público verificable; se cita con su fuente. |
| **[I]** | Inferencia. Conclusión razonada a partir de evidencias citadas.                                  |
| **[H]** | Hipótesis. No verificada: requiere un experimento o una confirmación.                            |
| **[P]** | Propuesta. Decisión pendiente de aprobación.                                                     |

Una capacidad documentada no es una garantía de calidad. Que Jev devuelva probabilidades **[E]** no demuestra que estén calibradas para Ask Sofi **[H]**.

Las citas entre comillas angulares son traducciones propias de originales en inglés.

### Mantenimiento

- La API de decisiones es experimental y cambia con frecuencia (§3.5). Antes de empezar una feature que dependa de un proveedor de decisiones, se revisan las secciones afectadas y se actualizan las fechas.
- Los precios, límites y capacidades no se citan de memoria: se toman de aquí, o se verifican y se añaden con fuente y fecha.
- Un dato que deja de ser cierto se corrige donde está; el documento no acumula versiones.

---

## 1. Qué es Jev

- Es el modelo de decisión «System One» de TypeSafe AI. Recibe un estado (`state`) y preguntas tipadas, y devuelve respuestas estructuradas con probabilidades **[E]** [TS-intro].
- No genera texto, no escribe código ni conversa **[E]** [TS-agents].
- Versión vigente: `jev-1.13.0`. Los alias `jev-latest` y `jev-preview` apuntan a ella y se mueven con cada lanzamiento, así que sus respuestas pueden cambiar **[E]** [TS-models].
- En AI Gateway se llama `typesafe-ai/jev` y está publicado desde el 2026-09-15 **[E]** [GW-catalog]. Lo sirven dos endpoints, `typesafe-ai` y `digitalocean` **[E]** [GW-endpoints].
- Hay otros modelos de decisión en AI Gateway con las mismas primitivas (§9) **[E]** [GW-catalog].

## 2. Petición

### 2.1. Campos

- Una petición contiene `model`, `state` y `questions` **[E]** [TS-api] [TS-sdk-request]. AI Gateway añade `providerOptions` para enrutado, privacidad y fallbacks **[E]** [GW-decision].
- No hay una instrucción global para toda la petición: cada pregunta lleva sus propias `instructions` y, si procede, `criteria` **[E]** [TS-api] [AISDK-decisions].
- Las claves de `questions` las elige quien llama y **no se envían al modelo**; solo sirven para identificar las respuestas **[E]** [TS-api]. Los nombres y descripciones de las opciones de un `choice` sí los ve el modelo **[E]** [TS-choice].

### 2.2. `state`

- Admite texto, un objeto JSON o un array **[E]** [TS-state] [TS-sdk-request]. Los valores tienen que ser JSON válidos: el AI SDK rechaza funciones, instancias de clase, ciclos, `undefined` y números no finitos **[E]** [AISDK-decisions].
- No tiene esquema ni campos reservados: quien llama decide los nombres **[E]** [TS-state] [TS-sdk-jsonvalue].
- TypeSafe recomienda un objeto con campos con nombre «para que cada parte del estado tenga un nombre descriptivo y sus relaciones queden claras» **[E]** [TS-state]. No documenta cómo usa el modelo esos nombres **[E]**. Que le sirvan de contexto es una inferencia de esa recomendación **[I]**.
- Jev solo admite texto: no acepta imágenes, audio ni vídeo **[E]** [TS-models].
- Hay un único estado por petición y todas sus preguntas lo comparten **[E]** [TS-state]. Para dar estados distintos a distintas preguntas hay que hacer peticiones separadas **[I]**.
- Un array es un único estado, no un lote de entradas independientes. Un historial de mensajes puede pasarse tal cual **[E]** [GW-kb-guide] [GW-decision].

### 2.3. Preguntas

| Tipo                                                                           | Petición                                                      | Límites        |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------- | -------------- |
| `boolean` (`noul` en TypeSafe; `predicate` en la API compatible con OpenAI)    | `instructions`; `criteria.true` y `criteria.false` opcionales | —              |
| `choice`                                                                       | `instructions`; `criteria` con cada opción y su descripción   | 1–255 opciones |
| `score`                                                                        | `instructions`; `criteria` con los niveles, de menor a mayor  | 2–10 niveles   |

Fuentes: [GW-decision] [TS-api] [AISDK-typesafe] **[E]**.

- `instructions` y `criteria` aceptan JSON estructurado. Por ejemplo, cada opción puede llevar `what`, `not_for` y `examples` para marcar fronteras **[E]** [TS-advanced].
- Las preguntas de una petición se evalúan en paralelo y de forma aislada sobre el mismo estado **[E]** [TS-intro].
- No hay un máximo documentado de preguntas por petición; el límite es de tokens **[E]** (no figura en [TS-api] ni en [TS-fanout]).

### 2.4. Límites de tamaño

- 64.000 tokens por petición, sumando el estado y todas las preguntas.
- 32.000 tokens para el estado más la pregunta más larga **[E]** [TS-models] [GW-catalog].

## 3. Respuesta

### 3.1. Formas

| Tipo      | Respuesta                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `boolean` | `probability`: P(verdadero), entre 0 y 1. Sin `confidence`.                                            |
| `choice`  | `choice` (la opción más probable), `probabilities` de todas las opciones (suman 1) y `confidence`.     |
| `score`   | `score` fraccional ponderado por probabilidad, `probabilities` de cada nivel y `confidence`.           |

Fuentes: [GW-decision] [TS-api] [TS-choice] [TS-noul] **[E]**.

- Las probabilidades se redondean a dos decimales y pueden no sumar exactamente 1; la guía de Vercel da el ejemplo de 0,99 y pide no renormalizar **[E]** [AISDK-typesafe] [GW-kb-guide]. El AI SDK rechaza una salida inválida en lugar de normalizarla **[E]** [AISDK-decisions].
- Tensión documental: el AI SDK valida que las distribuciones sumen 1 con una tolerancia por defecto de 0,000001 y admite que el proveedor declare su redondeo (`rounding`) **[E]** [AISDK-decisions]. No hay evidencia de cómo se aplica con el redondeo a dos decimales de Jev **[H]**. Quien consuma la respuesta debe validar con una tolerancia derivada del redondeo declarado, no con una exacta, y sin renormalizar (`tech-stack.md` §23).
- La confianza de `choice` y `score` llega aparte en los metadatos del proveedor (`providerMetadata.typesafe.confidence`, por clave de pregunta) y puede faltar; la guía de Vercel prueba explícitamente ese caso **[E]** [GW-kb-guide] [AISDK-decisions].
- En un `choice`, las probabilidades suman 1, así que alguna opción gana aunque ninguna encaje. TypeSafe lo resuelve con una pregunta de existencia aparte [TS-semantic-find] o con una opción `other` [TS-choice] **[E]**.
- jev-1.13 se inclina por la primera opción de un `choice` **[E]** [TS-jagged].
- El valor de un `score` no sirve para calcular magnitudes exactas **[E]** [TS-jagged].

### 3.2. Confianza

- `confidence` mide cuánto se concentra la distribución de `probabilities`. En un `choice` vale (p_max − 1/n)/(1 − 1/n) **[E]** [TS-confidence]. Por tanto, depende del número de opciones y no añade información que no esté ya en la distribución **[I]**.
- Los `boolean` no tienen `confidence` **[E]** [TS-noul].
- El AI SDK advierte de que la confianza de TypeSafe no es una medida portable y no garantiza calibración entre proveedores **[E]** [AISDK-decisions].

### 3.3. Calibración

- TypeSafe declara que entrena para obtener probabilidades calibradas: «las salidas con probabilidad 0,2 deberían ocurrir alrededor del 20 % de las veces», en grupos de predicciones y no en una respuesta concreta **[E]** [TS-primer].
- No publica métricas, conjuntos de datos ni pruebas de que esa calibración se mantenga fuera de sus casos **[E]** (no figuran en [TS-primer]).
- TypeSafe y Vercel piden fijar los umbrales con datos etiquetados propios **[E]** [TS-confidence] [GW-fallbacks].
- No está demostrado que Jev esté calibrado para mensajes de pareja en español **[H]**.

### 3.4. Resultados parciales, respuestas defectuosas y fallbacks

- Una pregunta puede devolver `{"type": "refusal"}` mientras las demás se responden, y la petición se factura igual **[E]**. Está documentado en `/v1/decisions` [GW-openai-decisions], y la razón `refused` aparece en [GW-fallbacks]. No está documentado que `/v1/evaluate` use el mismo formato **[H]**.
- El AI SDK convierte cualquier rechazo en `Experimental_DecisionRefusalError` para toda la llamada. No lo reintenta y no admite resultados parciales **[E]** [AISDK-decisions].
- El proveedor puede devolver respuestas defectuosas: ausentes, de tipo incorrecto o con probabilidades no finitas **[E]** [GW-fallbacks].
- Los fallbacks de decisión son opcionales. Repiten toda la petición con otro modelo y se facturan las dos llamadas. Si responde un LLM, no hay `confidence` ni distribuciones. En la API compatible con TypeSafe llegan `confidence: 0` y `probabilities: {}`, que significan «no disponible» **[E]** [GW-fallbacks].

### 3.5. Determinismo, versiones y estabilidad

- No es determinista. En un caso límite de su propio cookbook, la etiqueta principal coincidió en el 90,8 % de 15 repeticiones. La desviación típica media de las probabilidades fue 0,0098 **[E]** [TS-consistency].
- La API directa de TypeSafe informa de la versión que respondió **[E]** [TS-models].
- En AI Gateway, `/v1/evaluate` devuelve el identificador del modelo final. La API compatible con TypeSafe repite el identificador pedido **[E]** [GW-fallbacks]. No está documentado si se puede fijar o conocer `jev-1.13.0` a través de AI Gateway **[H]**.
- `experimental_decide`, del AI SDK, «puede cambiar en versiones patch» **[E]** [AISDK-decisions].

## 4. Acceso, errores y coste

### 4.1. Formas de acceso

| Superficie                                                | Notas                                                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| AI SDK `experimental_decide`                              | Requiere `ai` ≥ 7.0.128. Experimental. Un rechazo hace fallar toda la llamada. [GW-decision] [AISDK-decisions] |
| AI SDK `experimental_evaluate` (nombre anterior)          | Alias obsoleto con las mismas formas. Es el que usa la guía de Vercel, que pide `ai` ≥ 7.0.105. [GW-kb-guide] [GW-migration] |
| `POST https://ai-gateway.vercel.sh/v1/evaluate`           | HTTP sin SDK. Devuelve las respuestas, el uso y el coste. [GW-decision]                                      |
| `POST https://ai-gateway.vercel.sh/typesafe/v1/systemone` | Formato propio de TypeSafe. [GW-typesafe]                                                                    |
| `POST https://ai-gateway.vercel.sh/v1/decisions`          | Formato compatible con OpenAI; admite cualquier modelo de decisión. [GW-openai-decisions]                    |
| `POST https://api.typesafe.ai/v1/systemone`               | Acceso directo, sin AI Gateway. [TS-api]                                                                     |

Las decisiones no están disponibles a través de Chat Completions, de Responses ni de los endpoints compatibles con Anthropic o Cohere **[E]** [GW-decision].

Cambios posteriores a la guía de Vercel (publicada el 2026-09-19, actualizada el 2026-09-22) **[E]**:

| Antes (guía)                                | Ahora                                                                                          | Fuente         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------- |
| `experimental_evaluate`                     | `experimental_decide` (alias anterior vigente)                                                 | [GW-migration] |
| `gateway.evaluationModel(id)`               | `gateway.decisionModel(id)`                                                                    | [GW-migration] |
| `Experimental_EvaluationMockModelV4`        | `Experimental_DecisionMockModelV4`, en `ai/test`                                               | [GW-migration] |
| `POST /v1/evaluate`                         | Sin cambios: los clientes existentes pueden mantenerlo                                         | [GW-migration] |
| `ai` ≥ 7.0.105                              | `ai` ≥ 7.0.128 para `experimental_decide`                                                      | [GW-quickstart] |

- La guía sigue publicada con los nombres anteriores y sin aviso de cambio; la página de migración es de 2026-10-07 **[E]** [GW-kb-guide] [GW-migration].
- El nombre del mock nuevo solo aparece en la página de migración; no he encontrado su referencia en la documentación del AI SDK **[H]**. Hay que comprobarlo en los tipos del paquete instalado antes de usarlo.
- Tampoco consta cómo se llama la opción del mock: la guía usa `doEvaluate` con el nombre anterior **[H]**.

Qué aporta la guía y qué no cambia nada:

- Aporta el patrón de separar la llamada del dominio: una función que recibe el modelo como parámetro y devuelve una decisión, de modo que los tests inyectan un mock sin red **[E]** [GW-kb-guide]. Ya está previsto en `tech-stack.md` §24–25.
- Distingue probar la lógica de calibrar los umbrales: los tests con valores fijos no demuestran que los umbrales sean buenos **[E]** [GW-kb-guide].
- Sus umbrales (0,6 de confianza, 0,7 de probabilidad, 0,8 de intención) son ejemplos para enrutar tickets. No se trasladan a Ask Sofi **[I]**.
- Su flujo de autenticación con OIDC y `vercel env pull` es el de un proyecto Vercel; no aplica a pruebas locales sin credenciales **[I]**.
- Su ejemplo de privacidad usa `zeroDataRetention: true`, que la documentación limita a los planes Pro y Enterprise (§5.1). Qué ocurre con esa opción en Hobby no está documentado **[H]**; no debe copiarse sin comprobarlo.

### 4.2. Errores

| Origen     | Código                              | Significado                                                                     |
| ---------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| TypeSafe   | 401 / 422 / 429 / 529               | Credencial, validación, límite de ritmo, sobrecarga. [TS-api]                   |
| AI Gateway | 400                                 | Validación, también de las condiciones de fallback. [GW-fallbacks]              |
| AI Gateway | 401                                 | Clave u OIDC ausente o inválido. [GW-faq]                                        |
| AI Gateway | 402                                 | Sin saldo. Con `quota_for_entity_exceeded`, presupuesto agotado. [GW-faq]       |
| AI Gateway | 403 `customer_verification_required` | Hay que añadir un método de pago para usar los créditos gratuitos. [GW-faq]    |
| AI Gateway | 403 (free tier)                     | El modelo no está en el subconjunto gratuito. [GW-faq]                          |
| AI Gateway | 429                                 | Límite de ritmo de AI Gateway o del proveedor. [GW-rate]                        |
| AI Gateway | 500                                 | Respuesta defectuosa del proveedor al evaluar un fallback. [GW-fallbacks]       |

- El SDK de TypeSafe aplica por defecto un timeout de 10 s por intento. El AI SDK reintenta dos veces los fallos transitorios **[E]** [TS-sdk-config] [AISDK-decisions].
- Con el AI SDK, un rechazo por presupuesto puede llegar como `GatewayInternalServerError`, aunque el estado HTTP sea 402. La clase de la excepción no basta para decidir qué ha pasado: hay que mirar el tipo `quota_for_entity_exceeded` **[E]** [GW-budgets]. Con HTTP directo, el 402 y su `type` se leen sin ambigüedad **[I]**.
- Errores propios de la plataforma, como `no_providers_available` (400), llegan con el formato de AI Gateway **[E]** [GW-zdr].

### 4.3. Coste y free tier

- Jev cuesta 0,042 $ por millón de tokens de entrada; la salida no se cobra **[E]** [TS-models] [GW-catalog].
- El free tier de AI Gateway es un crédito mensual que solo sirve para **un subconjunto de modelos** y tiene límites de ritmo más bajos **[E]** [GW-pricing] [GW-faq].
- Al comprar créditos, la cuenta pasa al paid tier y pierde el crédito mensual. Los créditos comprados caducan al año **[E]** [GW-pricing] [GW-faq].
- `typesafe-ai/jev` **no** tiene la etiqueta `free` en el catálogo público consultado el 2026-10-14. Solo la tenían `convaiinnovations/laya`, `convaiinnovations/laya-free` y `poolside/laguna-s-2.1-free` **[E]** [GW-catalog].
- Por tanto, usar Jev a través de AI Gateway exige comprar créditos **[I]**. Es la conclusión de la documentación pública; la autora lo ha confirmado con Vercel (2026-10-14).
- TypeSafe puede emitir créditos promocionales, pero no está obligado; no hay un free tier documentado **[E]** [TS-mca] [TS-quickstart].
- La recarga automática viene desactivada **[E]** [GW-pricing].
- Estimación orientativa: un análisis con dos peticiones de unos 1.500 tokens costaría unos 0,00013 $ **[I]**. El número real de tokens está por medir **[H]**.

**Decisión aprobada (2026-10-14)**

- Ask Sofi usa Jev mediante Vercel AI Gateway y la aplicación sigue siendo gratuita para quienes la usan. El coste es un gasto operativo pequeño, limitado y controlado de la autora (`mission.md` §12, `tech-stack.md` §27).
- No se fija aquí ninguna cifra: el límite lo aprueba la autora en la feature que integre el proveedor (`mission.md` §12).

**Controles de gasto documentados** **[E]** [GW-budgets] [GW-pricing]

- Un presupuesto limita el gasto por equipo, proyecto, clave o miembro, con periodos diario, semanal, mensual o sin reinicio. Su mínimo es 1 $.
- Al agotarse, las peticiones posteriores devuelven 402 `quota_for_entity_exceeded`. Un presupuesto sin configurar no limita nada.
- Es un tope blando: la petición que lo cruza se completa y el gasto puede pasarse ligeramente. El efecto de un cambio tarda decenas de segundos y hasta unos 5 minutos.
- Las claves de API cuentan en el presupuesto del equipo y en el del miembro al que se atribuyan; los tokens OIDC cuentan en el del equipo y en el del proyecto. BYOK no cuenta.
- Hay alertas por correo al 50, 75 y 100 % del límite. Son informativas y no bloquean.
- Las claves pueden tener su propio presupuesto y una caducidad.
- Un presupuesto no reserva ni compra capacidad: hacen falta créditos o un método de pago.

**Qué no está verificado de nuestra cuenta** **[H]**

- Que el equipo actual (plan Hobby) pueda comprar créditos y fijar presupuestos con los permisos necesarios.
- El importe mínimo de compra y el saldo disponible.
- Qué hace `zeroDataRetention` en Hobby (§5.1).

Hay que comprobarlo en el dashboard de la cuenta antes de la feature de integración y de cualquier llamada real (E0).

## 5. Privacidad y cumplimiento

### 5.1. AI Gateway

- Vercel no entrena con los prompts, y AI Gateway no conserva el contenido de las peticiones ni de las respuestas **[E]** [GW-faq].
- Sí registra metadatos: estado, modelo, proveedor, tokens, coste, duración, método de autenticación e intentos de enrutado. Los intentos de enrutado se conservan 30 días **[E]** [GW-faq].
- La retención cero de datos (ZDR) por petición solo existe en los planes Pro y Enterprise **[E]** [GW-zdr].
- `disallowPromptTraining` está disponible en todos los planes, sin coste **[E]** [GW-no-training].
- Restringir proveedores con `only` en cada petición no tiene coste en ningún plan **[E]** [GW-pricing].
- En Vercel, las funciones pueden autenticarse con tokens OIDC en lugar de una clave fija **[E]** [GW-faq].

### 5.2. Endpoints de Jev

| Endpoint       | ZDR | Sin entrenamiento |
| -------------- | --- | ----------------- |
| `typesafe-ai`  | Sí  | Sí                |
| `digitalocean` | No  | Sí                |

Fuente: [GW-endpoints], consultado el 2026-10-14 **[E]**.

- Con `only: ["typesafe-ai"]` se evita el endpoint sin ZDR, también en Hobby **[I]**. No está documentado si el acuerdo de ZDR se aplica a peticiones que no lo exigen **[H]**.
- Con un único proveedor permitido, AI Gateway ya no puede reintentar en otro proveedor **[I]**. Esos reintentos entre proveedores están documentados en [GW-faq].

### 5.3. TypeSafe directo

- TypeSafe se compromete a no entrenar con datos de usuario. Solo ofrece ZDR a clientes enterprise **[E]** [TS-legal].
- Su contrato de encargo de tratamiento (DPA) conserva los datos «el tiempo necesario», sin plazos ni regiones. Permite transferencias internacionales bajo las cláusulas contractuales tipo de la UE **[E]** [TS-dpa].
- El contrato hace responsable al cliente de los datos que envía y de tener los consentimientos necesarios **[E]** [TS-mca].

### 5.4. RGPD

- El RGPD no se aplica a una persona que trata datos en una actividad exclusivamente personal o doméstica. Sí se aplica a quien proporciona los medios para ese tratamiento (considerando 18) **[E]** [GDPR-r18].
- El artículo 9.1 prohíbe, salvo excepciones, tratar datos sobre la vida sexual o la orientación sexual. La primera excepción es el consentimiento explícito **del interesado** **[E]** [GDPR-a9].
- El mensaje y el contexto pueden revelar ese tipo de datos sobre la pareja, que no usa Ask Sofi y no ha consentido **[I]**.
- Está por resolver si eso exige algo más que avisar y minimizar **[H]**. Es una cuestión jurídica que necesita asesoramiento; este documento no lo sustituye.

## 6. Calidad y limitaciones conocidas

### 6.1. Idioma

- El idioma principal de entrenamiento es el inglés. Otros idiomas se aceptan con menos precisión, sin cifras publicadas **[E]** [TS-models] [TS-state].
- No se conoce la calidad en español coloquial de España **[H]**.

### 6.2. Defectos documentados de jev-1.13

Fuente: [TS-jagged] **[E]**.

- «Responde a la pregunta que escribiste, no a la que querías hacer»: interpreta las instrucciones al pie de la letra.
- Las indirecciones, las dobles negaciones y el razonamiento en varios pasos reducen la precisión. Se recomiendan instrucciones directas que «identifiquen por su nombre las partes relevantes del estado».
- «La precisión cae a medida que el estado crece con contenido ajeno a la decisión». Se recomienda filtrar en código «y enviar solo los campos que la pregunta necesita», o filtrar por relevancia con un `boolean`.
- «El estado son datos, y jev-1.13 no lo trata como hostil por defecto»: un contenido malicioso puede cambiar la respuesta.
- Si `instructions` y `criteria` piden cosas distintas, el modelo puede confundirse.
- Se inclina por la primera opción de un `choice`.
- No es fiable con números, fechas ni recuentos, y no genera texto.

### 6.3. Lo que la documentación no cubre

- Ninguna página oficial consultada, entre ellas [TS-agents] y [TS-jagged], da métricas sobre indirectas, sarcasmo, emociones o ambigüedad en conversaciones. Los casos de uso documentados son enrutado, rúbricas, verificación y moderación **[E]**.
- Hay un ejemplo de detección de autolesión en inglés, con jev-1.12 y 15 mensajes, sin tasas de falsos positivos ni de falsos negativos **[E]** [TS-guardrails].
- Hay un ejemplo que selecciona líneas de un documento con un `choice` y una pregunta de existencia, sin métricas de precisión **[E]** [TS-semantic-find].

## 7. Implicaciones para Ask Sofi

### 7.1. Lecturas compatibles y distribuciones

- Varias lecturas de un mensaje pueden ser ciertas a la vez: por ejemplo, la decepción y el deseo de que se proponga otro plan. Un `choice` las obliga a repartirse una probabilidad que suma 1, y alguna gana aunque ninguna encaje (§3.1) **[I]**.
- Un `boolean` por lectura da una estimación independiente para cada una **[I]**. Encaja con la guía de TypeSafe de hacer preguntas «explícitas, estrechas, específicas y atómicas» [TS-build]. Además, es la única primitiva numérica que devuelven todos los proveedores de decisión (§7.7) **[I]**.
- Esta opción tiene dos costes. Las estimaciones de lecturas incompatibles entre sí pueden ser incoherentes, porque cada pregunta se evalúa aislada. Y cambia el significado que `mission.md` §4.2 da al porcentaje **[I]**.
- Propuesta: tratar las lecturas como enunciados compatibles, cada uno con su estimación independiente **[P]**. Es una decisión de producto que corresponde a la feature 005.

### 7.2. Confianza

- Jev no ofrece una «confianza global». La `confidence` de `choice` y `score` mide concentración, no fiabilidad, y los `boolean` no la tienen (§3.2) **[I]**.
- Una confianza global de Ask Sofi solo puede salir de una regla propia y evaluada (012), no de un campo del proveedor **[P]**.

### 7.3. Contexto insuficiente

- Se puede preguntar con un `boolean` propio. A partir de qué valor se pide contexto es un umbral que corresponde a 011/012 **[I]**.
- No debe deducirse de una confianza baja: un mensaje puede ser ambiguo aunque el contexto sea suficiente **[I]**.

### 7.4. Explicaciones sin generar texto

Jev no genera texto (§1). Estas son las formas de dar explicaciones específicas sin inventar:

| Vía                                                                                 | Qué aporta                                                     | Estado                                     |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| Copy propio por lectura (`tech-stack.md` §26)                                       | La voz de Sofi, en condicional («esta lectura gana peso si…»)   | Viable **[I]**                             |
| Observaciones del mensaje calculadas en código (punto final, emojis, longitud)      | Hechos comprobables, no interpretaciones                       | Viable **[I]**                             |
| Citas literales del contexto seleccionadas con Jev (patrón de [TS-semantic-find])  | Evidencias en las palabras de la propia persona usuaria        | **[H]**, experimento E7                    |
| Texto generado por un LLM redactor                                                  | Especificidad, naturalidad y personalidad de Sofi en español   | **Aprobado provisionalmente** **[P]**. Proveedor, coste, privacidad y validación de fidelidad pendientes (Feature 007). |

Las explicaciones de los fixtures aprobados («Contaba con esa comida…») necesitan generar texto: Jev solo no puede producirlas **[I]**.

El LLM redactor es complementario a Jev: recibe los resultados autorizados por la política del dominio y el contexto estrictamente necesario. No recalcula probabilidades, no añade interpretaciones propias ni presenta como hechos conclusiones que los resultados del dominio no sustentan **[P]**.

### 7.5. Seguridad de las personas

- Jev puede estimar señales de riesgo, como amenazas, coacción o autolesión, con preguntas `boolean` **[I]**, siguiendo el patrón de [TS-guardrails]. No está medida su precisión en español **[H]**.
- Un estado malicioso puede rebajar esa señal (§6.2) **[I]**.

### 7.6. Resultados parciales y errores

- La API HTTP admite resultados parciales, con rechazos por pregunta; el AI SDK no (§3.4) **[E]**. El dominio necesita representar señales ausentes y su motivo **[I]**.

### 7.7. Sustitución del proveedor

- Los endpoints de decisiones de AI Gateway aceptan cualquier modelo de decisión. Cambiar de proveedor de decisión puede limitarse a cambiar `model` **[E]** [GW-openai-decisions].
- En el AI SDK, todos los modelos deben devolver la probabilidad de un `boolean`. Las distribuciones de `choice` y `score` son opcionales, y los adaptadores de Anthropic y Google no las devuelven **[E]** [AISDK-decisions].
- Un LLM no es un sustituto equivalente: no devuelve distribuciones y la confianza que expresa tiende a ser excesiva (§9) **[I]**.

### 7.8. API web y MCP

- El navegador nunca llama a Jev (`tech-stack.md` §28). El SDK de TypeSafe también lo impide por defecto (`dangerouslyAllowBrowser: false`) **[E]** [TS-sdk-config].
- Un MCP local tendría que usar las credenciales de quien lo ejecuta (`tech-stack.md` §41) **[I]**. Como Jev no entra en el free tier (§4.3), esa persona necesitaría sus propios créditos **[I]**.

### 7.9. Coste

- El coste de Jev es asumido y está aprobado (§4.3). Lo que queda por diseñar es cómo se limita y se degrada, no si se acepta.
- Un tope blando y con retardo (§4.3) significa que el límite efectivo puede superarse ligeramente; el diseño debe tolerar un pequeño exceso y no depender de que el corte sea exacto **[I]**.
- El gasto por análisis es muy bajo (§4.3). El riesgo económico real es el abuso automatizado, que se controla con los límites de 013 y con un presupuesto, no con el precio por petición **[I]**.
- El coste sigue contando al comparar con otros modelos de decisión (§9), aunque la diferencia de precio entre ellos es pequeña **[I]**.
- Hoy ningún modelo de decisión gratuito del catálogo ofrece ZDR ni garantiza que no entrena con los datos **[E]** [GW-catalog]; por eso no son una vía para datos reales.

## 8. El expediente de 004 en el `state`

### 8.1. Lo que garantiza la API

- Hay un único `state` por petición: texto, objeto JSON o array, sin esquema. El expediente puede ir como un subobjeto con los nombres que elijamos **[E]** [TS-state] [TS-sdk-request].
- No hay campos reservados para contexto, metadatos ni instrucciones de sistema. Todo lo que deba saber el modelo va en `state` o en las `instructions` de cada pregunta **[E]** [TS-api] [AISDK-decisions].
- Las claves de las preguntas no llegan al modelo, así que los identificadores estables de Ask Sofi pueden usarse como claves sin influir en la respuesta **[E]** [TS-api].
- La API no permite asignar pesos ni prioridades a los campos del estado **[E]** (no figuran en [TS-api]).
- Límite: 32.000 tokens para el estado más la pregunta más larga **[E]** [TS-models].

### 8.2. Estructura propuesta del `state` **[P]**

- Un objeto con tres campos de nombre descriptivo, en este orden:
  - `partnerMessage`: el mensaje recibido, tal cual.
  - `currentSituation`: el contexto actual que escribe la persona usuaria. Si está vacío, el campo no se envía (ni `null` ni cadena vacía).
  - `reportedTendencies`: solo si hay expediente y la persona ha aceptado usarlo en ese análisis.
- `reportedTendencies` lleva un campo `about` que declara qué es: impresiones generales de la persona usuaria, no hechos, que pueden no aplicarse a este mensaje (`mission.md` §7).
- Las respuestas del expediente se envían como frases breves en inglés. Las mantiene el adaptador, tienen versión y no son el copy de la interfaz **[I]**. Ese copy puede cambiar sin invalidar expedientes (`004`), mientras que la descripción que recibe el proveedor tiene que ser estable para poder comparar evaluaciones.
- El efecto de los nombres y del orden de los campos no está documentado **[H]** (E4).

### 8.3. Áreas, respuestas inciertas y campos sin responder **[P]**

| Respuesta en 004                    | ¿Se envía?     | Motivo                                                                                                                  |
| ----------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Concreta (p. ej. `drops-hints`)     | Sí             | Es la única que describe una tendencia.                                                                                 |
| «Depende» (`depends`, `varies`)     | No, por defecto | Dice que no hay una tendencia estable; aporta poco y añade contenido **[I]**. Se revisa con E4.                         |
| «No lo sé» (`unknown`)              | No             | No aporta información y añade contenido ajeno a la decisión (§6.2) **[I]**.                                             |
| Sin responder (área ausente)        | No             | Enviarla invitaría a inferir lo que el expediente no dice (`005-spec.md` §1).                                           |
| Notas libres (`notes`)              | No, en v1      | Es texto libre sobre una tercera persona, puede contener inyecciones (§6.2), no se puede evaluar y contradice la minimización **[I]**. |

- Las seis áreas comparten estado (§2.2). Para que cada pregunta reciba solo sus áreas habría que hacer una petición por grupo de preguntas. Se compara con enviar todas las respuestas concretas en E4 **[H]**.
- Posible relación entre áreas y lecturas, que habrá que comprobar **[H]**:

| Área (004)      | Lecturas que podría informar                    |
| --------------- | ----------------------------------------------- |
| `directness`    | Si hay indirectas en general                    |
| `sarcasm`       | Broma o ironía                                  |
| `conflict`      | Si quiere hablarlo ahora o más tarde            |
| `personalSpace` | Necesidad de espacio                            |
| `initiative`    | Si propone alternativas o espera que se las propongan |
| `messageStyle`  | Si un mensaje corto es inusual                  |

### 8.4. Prioridad del mensaje actual

`mission.md` §4.1 exige que el contexto actual pese más que el expediente. La API no lo garantiza (§8.1).

| Mecanismo                                                                        | Qué garantiza                                                                                                                                 |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluar la suficiencia de contexto en una petición sin expediente **[P]**        | Garantía estructural: el expediente no puede convertir un «Vale.» suelto en una lectura segura. Se comprueba con tests sin llamadas reales **[I]**. |
| Instrucciones que nombran los campos y declaran qué prevalece **[P]**            | Depende de que el modelo las siga **[H]** (E4).                                                                                               |
| El campo `about` de `reportedTendencies` **[P]**                                 | Depende del modelo **[H]**.                                                                                                                   |
| Calcular las mismas lecturas con y sin expediente **[P]**                        | Mide la influencia del expediente. La regla sobre qué mostrar corresponde a 012 **[I]**.                                                      |

Las dos peticiones pueden ir en paralelo. El coste se duplica, pero sigue siendo despreciable (§4.3) **[I]**.

### 8.5. Sesgos y contradicciones

- **Anclaje.** Una tendencia como `sarcasm: often` puede teñir todas las lecturas, justo lo que prohíbe `mission.md` §4.1. Se mide con mensajes literales y un expediente sarcástico (E4) **[H]**.
- **Contradicción entre expediente y mensaje.** La documentación habla de instrucciones contradictorias, no de un estado contradictorio (§6.2). Se mide con expedientes engañosos (E4; ya previsto en 011) **[H]**.
- **Género.** 004 no lo recoge, pero en español aparece en el texto («mi novia», «está cansada»). Hacen falta pruebas en las que solo cambie el género (E5; `mission.md` §3) **[H]**.
- **Inyección.** El contexto y las notas los escribe la persona usuaria, y el estado no se trata como hostil (§6.2). En la web, el efecto se limita a su propio análisis. En MCP es mayor, porque el texto puede venir de terceros **[I]**.
- **Orden.** El sesgo documentado afecta al orden de las opciones de un `choice`. No se sabe si importa el orden de los campos del estado **[H]**.

### 8.6. Datos personales **[P]**

| Dato                                                      | ¿Se envía?                       | Motivo                                                                                                                 |
| --------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Mensaje de la pareja                                      | Sí                               | Es lo que se analiza. Contiene datos de una tercera persona.                                                           |
| Contexto actual                                           | Sí, si se escribe                | Es la evidencia que más pesa (`mission.md` §4.1). Puede incluir datos de terceros.                                     |
| Nombres, teléfonos o lugares identificables en el texto   | Si la persona los escribe        | No hay una forma fiable de eliminarlos automáticamente **[I]**. La interfaz debería pedir que no se incluyan (007).    |
| Respuestas concretas del expediente                       | Sí, si se acepta usar el expediente | Son tendencias secundarias.                                                                                         |
| «Depende», «No lo sé» y áreas sin responder               | No                               | Ver §8.3.                                                                                                              |
| Notas libres del expediente                               | No (v1)                          | Ver §8.3.                                                                                                              |
| Identificadores de sesión, IP o dispositivo; idioma; fecha | No                              | No hacen falta. AI Gateway ya registra metadatos técnicos, no contenido (§5.1).                                        |
| Historial, favoritos y estadísticas                       | No                               | No intervienen en el análisis.                                                                                         |
| `safetyIdentifier` u otros identificadores de usuario     | No                               | No hay cuentas (`tech-stack.md` §68).                                                                                  |

La minimización puede hacerse en el navegador antes de enviar la petición, y repetirse en el servidor al validarla. Así, lo que no se necesita nunca sale del dispositivo **[P]**.

### 8.7. Ejemplos de petición **[P]**

Son ejemplos ilustrativos: no se han probado y no fijan el contrato ni el copy. Las instrucciones van en inglés porque es el idioma principal de Jev (§6.1). Si eso mejora el resultado es una hipótesis **[H]** (E2).

**A. Sin expediente.** Si hay expediente, es también la petición que decide si el contexto basta.

```json
{
  "model": "typesafe-ai/jev",
  "state": {
    "partnerMessage": "Vale.",
    "currentSituation": "Le he dicho que este sábado no puedo ir a comer con su familia."
  },
  "questions": {
    "contextSufficiency": {
      "type": "boolean",
      "instructions": "Using `partnerMessage` and `currentSituation`, is there enough information to judge what the partner most likely meant beyond the literal words?",
      "criteria": {
        "true": "The input shows what the message responds to and gives cues about how it was meant.",
        "false": "The message is short or ambiguous and the input does not show how it was meant."
      }
    },
    "safetyConcern": {
      "type": "boolean",
      "instructions": "Do `partnerMessage` or `currentSituation` mention threats, violence, coercion or a risk of self-harm?"
    },
    "readingDisappointed": {
      "type": "boolean",
      "instructions": "Does `partnerMessage`, read in light of `currentSituation`, express disappointment or hurt?"
    },
    "readingLiteral": {
      "type": "boolean",
      "instructions": "Does the partner most likely mean exactly what `partnerMessage` says, with nothing left unsaid?"
    }
  },
  "providerOptions": {
    "gateway": { "only": ["typesafe-ai"], "disallowPromptTraining": true }
  }
}
```

**B. Con expediente.** Solo pide lecturas. Va en paralelo con la petición A, que decide la suficiencia y la seguridad sin el expediente.

```json
{
  "model": "typesafe-ai/jev",
  "state": {
    "partnerMessage": "Vale. Que te lo pases bien.",
    "currentSituation": "Hace dos semanas quedamos en comer con su familia este sábado. Hoy le he escrito que no puedo porque es el cumpleaños de una amiga. Ha tardado 25 minutos en contestar y no ha puesto ningún emoji.",
    "reportedTendencies": {
      "about": "General habits of the partner as reported by the user. They are impressions, not facts, and may not apply to this message.",
      "directness": "Tends to drop hints rather than say things directly.",
      "messageStyle": "Usually writes long, expressive messages."
    }
  },
  "questions": {
    "readingDisappointed": {
      "type": "boolean",
      "instructions": "Judge mainly from `partnerMessage` and `currentSituation`. Use `reportedTendencies` only as background; if they point elsewhere than the current evidence, follow the current evidence. Does `partnerMessage` express disappointment or hurt?"
    },
    "readingWantsProposal": {
      "type": "boolean",
      "instructions": "Judge mainly from `partnerMessage` and `currentSituation`. Use `reportedTendencies` only as background; if they point elsewhere than the current evidence, follow the current evidence. Would the partner welcome the user proposing another plan?"
    }
  },
  "providerOptions": {
    "gateway": { "only": ["typesafe-ai"], "disallowPromptTraining": true }
  }
}
```

En el ejemplo B, frente al fixture del Design Lab:

- se omiten las áreas con «No lo sé», «Depende» o sin responder, y también las notas libres;
- el nombre propio del fixture se sustituye por «una amiga»;
- no se envía ningún identificador de la persona usuaria.

### 8.8. Qué garantiza la API y qué hay que probar

| Garantizado por la API **[E]**                                   | Requiere experimento **[H]**                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `state` acepta objetos anidados con nombres libres               | Que el modelo entienda el papel de cada campo por su nombre                    |
| Todas las preguntas de una petición ven el mismo estado          | Que respete la precedencia declarada en las instrucciones                      |
| Las claves de las preguntas no llegan al modelo                  | Que omitir «No lo sé» y «Depende» mejore o empeore los resultados              |
| Límites de tamaño y errores de validación (400 / 422)            | Que importe el orden de los campos                                             |
| Formas y rangos de las respuestas                                | Robustez ante expedientes engañosos, inyecciones y cambios de género           |
| Rechazos por pregunta (en `/v1/decisions`)                       | Calidad con texto en español e instrucciones en inglés                         |
| No hay pesos ni prioridades entre los campos                     | Magnitud real de la influencia del expediente                                  |

## 9. Alternativas

| Alternativa                                         | Coste                                                       | Privacidad                                                                  | Probabilidades                                                       | Texto | Situación                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------- |
| Jev a través de AI Gateway                          | Créditos comprados, con gasto controlado **[E]** (§4.3)     | Sin entrenamiento **[E]**; ZDR solo con `only: ["typesafe-ai"]` **[I]**     | Sí **[E]**; calibración no demostrada **[H]**                        | No    | **Aprobada** (2026-10-14)                                                 |
| Jev directo (TypeSafe)                              | Solo con créditos promocionales **[E]**                     | ZDR solo para enterprise **[E]**                                            | Sí                                                                   | No    | Fuera de `tech-stack.md` §27                                              |
| Microsoft Decision-1 (`microsoft/microsoft-decision-1`) | No: 0,042 $/M **[E]**                                   | ZDR y sin entrenamiento **[E]**                                             | Sí; «calibradas» según el fabricante **[E]**                         | No    | Se puede cambiar con `model` (§7.7)                                       |
| OpenAI GPT-6 Luna Decisions                         | No: 0,10 $/M **[E]**                                        | Sin entrenamiento; sin ZDR **[E]**                                          | Sí **[E]**                                                           | No    | Igual; acepta imágenes                                                    |
| Liquid d1                                           | No: 0,04 $/M **[E]**                                        | Sin garantías **[E]**                                                       | Sí **[E]**                                                           | No    | API compatible con TypeSafe                                               |
| Laya (`convaiinnovations/laya`)                     | Sí, hasta el 2026-10-31 **[E]** [GW-laya]                   | Sin garantías **[E]**                                                       | Sí **[E]**                                                           | No    | Solo para pruebas con datos sintéticos **[I]**                            |
| LLM gratuito de AI Gateway (`poolside/laguna-s-2.1-free`) | Sí **[E]**                                            | Sin garantías **[E]**                                                       | Solo las que expresa el modelo, que tienden a ser excesivas [LIT-xiong] | Sí | No apto para datos reales **[I]**                                         |
| Gemini API, nivel gratuito                          | Sí                                                          | Usa el contenido para mejorar productos y puede haber revisión humana; prohibido en clientes para usuarios del EEE **[E]** [GG-terms] | Solo las expresadas | Sí | Descartada **[I]** |
| Cloudflare Workers AI                               | Sí: 10.000 neuronas al día; falla al agotarse **[E]** [CF-workers-ai] | Política de datos no verificada **[H]**                           | Solo las expresadas por un LLM                                       | Sí    | No está en el catálogo de AI Gateway **[E]** [GW-catalog]; habría que llamarlo directamente, algo que `tech-stack.md` §27 no prevé |
| Prompt API de Chrome (modelo en el dispositivo)     | Sí **[I]**                                                  | Los datos no salen del dispositivo **[E]** [CH-prompt-api]                  | No                                                                   | Sí    | Solo escritorio, con mucho hardware **[E]**; admite `es`; mejora progresiva |
| Reglas deterministas                                | Sí                                                          | Locales                                                                     | No                                                                   | Plantillas | Sirven para observaciones, no para interpretar **[I]**               |

- Que un LLM explique en texto una decisión tomada por otro modelo no garantiza que la explicación refleje esa decisión: las explicaciones de los LLM pueden justificar respuestas sesgadas sin mencionar el sesgo [LIT-turpin] **[E]**.
- `scaledown/scaledown-classify-1` aparece como modelo de evaluación determinista, sin garantías de privacidad. No se ha comprobado si funciona con los endpoints de decisiones **[H]** [GW-catalog].

## 10. Decisiones propuestas sobre el proveedor **[P]**

Afectan sobre todo a 006 y se aprueban allí. Se recogen aquí para que no se pierdan.

1. Tratar las probabilidades de cualquier proveedor como señales sin calibrar hasta que 011 las evalúe.
2. No usar la `confidence` del proveedor como confianza de Ask Sofi. Interpretar los centinelas como ausencia: un valor ausente nunca es 0.
3. Usar `boolean` para lecturas compatibles. Reservar `choice` para alternativas excluyentes, con opción residual y pregunta de existencia.
4. Elegir en 006 entre `/v1/evaluate` con `fetch` y `experimental_decide`. Tendencia: `fetch`, sin dependencia nueva, porque:
   - `/v1/evaluate` sigue soportado y no requiere migración (§4.1);
   - `experimental_decide` puede cambiar en versiones patch y falla entera ante un rechazo (§3.4, §3.5);
   - el error de presupuesto se lee con claridad en HTTP (§4.2);
   - los tests con MSW cubren la frontera HTTP (`tech-stack.md` §42.4).

   A favor del SDK: tipos, reintentos y el mock oficial. Lo que no está documentado sobre el formato de los rechazos en `/v1/evaluate` (§3.4) se verifica antes de decidir; ninguna de las dos vías se adopta sin ese dato.
5. En cada petición, usar `only: ["typesafe-ai"]` y `disallowPromptTraining: true`, sin fallbacks a LLM.
6. En Vercel, autenticar con OIDC; fijar un presupuesto con tope (cifra aprobada por la autora) y mantener desactivada la recarga automática. Diseñar para un tope blando (§7.9).
7. Registrar qué modelo responde y, si se puede, qué versión. Mantener un conjunto canario para detectar cambios de comportamiento.
8. Escribir instrucciones directas que nombren los campos del estado y alinear los `criteria` con ellas.
9. Enviar el estado mínimo descrito en §8.
10. Limitar los reintentos. Traducir 402, 403 y 429 a códigos de fallo propios, sin mostrar nunca los mensajes del proveedor (`tech-stack.md` §60).

### 10.1. Pruebas sin llamadas reales

Las convenciones de testing viven en `tech-stack.md` §42 y en `AGENTS.md`. Aquí solo se indica qué aporta la documentación del proveedor.

- Lógica del dominio y política: `FakeDecisionProvider` y Vitest; no necesitan red ni SDK **[E]** [GW-kb-guide] (mismo patrón: la decisión recibe el modelo como parámetro).
- Cliente HTTP del adaptador: MSW sobre `/v1/evaluate`, con las respuestas que documenta §3, incluidas las anómalas (probabilidades redondeadas, respuesta ausente, tipo incorrecto, confianza ausente, centinelas `0` y `{}`, 402, 429) **[P]**.
- Si se adopta el SDK: el mock oficial (`Experimental_DecisionMockModelV4`, §4.1) evita la red, pero solo cubre ese camino **[I]**.
- La guía de Vercel prueba la confianza justo en el umbral, la probabilidad baja y la ausencia de metadatos de confianza. Son casos útiles para la política de 005/012 **[E]** [GW-kb-guide].
- Los tests con valores fijos comprueban el código, no la calibración: eso es evaluación explícita (011) **[E]** [GW-kb-guide].

## 11. Cuestiones abiertas y experimentos

| ID | Pregunta                                                                                                                                  | ¿Llamadas reales? | Coste orientativo                     |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------- |
| E0 | Cuenta: ¿puede el equipo actual comprar créditos y fijar presupuestos? ¿Qué hace `zeroDataRetention` en Hobby? ¿Importe mínimo de compra? | No                | 0 €                                   |
| E1 | Conjunto de escenarios en español, etiquetados con todas las lecturas posibles. Variantes: sin contexto, con contexto, con expediente, con expediente engañoso, con inyección y con el género cambiado. | No | 0 €; se reutiliza en 011 |
| E2 | Validez y coherencia: lecturas como `boolean` o como `choice` (con permutaciones); tres repeticiones; instrucciones en inglés o en español. | Sí                | ≈ 0,10 $ **[I]**                      |
| E3 | ¿Separa la suficiencia de contexto los pares mínimos («Vale.» suelto o con contexto)? ¿La infla el expediente?                            | Sí                | Céntimos **[I]**                      |
| E4 | Expediente: solo respuestas concretas o también «Depende»; nombres y orden de los campos; todas las áreas o solo las relevantes; expedientes engañosos; influencia con y sin expediente. | Sí | Céntimos **[I]** |
| E5 | Robustez ante inyecciones en el contexto y ante cambios de género                                                                         | Sí                | Céntimos **[I]**                      |
| E6 | Señales de riesgo frente a hipérboles coloquiales («te mato como no traigas pan»)                                                         | Sí                | Céntimos **[I]**                      |
| E7 | Explicaciones: comprensión del copy por lectura, con y sin observaciones, con 3–5 personas; selección de citas con Jev                    | Solo la selección de citas | Céntimos **[I]**             |
| E8 | ¿Se puede fijar y ver `jev-1.13.0` a través de AI Gateway? ¿Cambian los resultados de un día a otro?                                       | Sí                | Céntimos **[I]**                      |

Las llamadas reales consumen créditos: necesitan autorización expresa de la autora y que E0 esté resuelto. Las pruebas automáticas normales nunca las hacen (`AGENTS.md`, `tech-stack.md` §42.2).

## 12. Dónde se decide cada cosa

| Asunto                                                                                      | Fuente de verdad                              |
| ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Significado de las lecturas y de sus números; estados; versiones; minimización del expediente | `005-spec.md` (y `mission.md` §4.2 si cambia) |
| Cómo se llama al proveedor; política provisional                                            | `006-plan.md`                                 |
| Copy, avisos de envío de datos; arquitectura, integración y validación de fidelidad del LLM redactor de explicaciones | Feature 007                                   |
| Umbrales y confianza                                                                        | Features 011 y 012                            |
| Política de coste y principio de gasto controlado                                           | `mission.md` §12 y `tech-stack.md` §27, §69   |
| Cifra del presupuesto y su aplicación                                                       | Feature de integración (006), aprobada por la autora |
| Principio de seguridad de las personas                                                      | `mission.md`                                  |

## 13. Fuentes

| ID                   | Fuente                                                                                                                     | Actualizada            | Consultada |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------- |
| [GW-decision]        | [Vercel — Decision](https://vercel.com/docs/ai-gateway/modalities/decision)                                                | 2026-10-07             | 2026-10-13 |
| [GW-typesafe]        | [Vercel — TypeSafe API](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe)                                         | 2026-10-05             | 2026-10-13 |
| [GW-fallbacks]       | [Vercel — Decision Fallbacks](https://vercel.com/docs/ai-gateway/models-and-providers/decision-fallbacks)                   | 2026-10-08             | 2026-10-13 |
| [GW-openai-decisions] | [Vercel — OpenAI-Compatible Decisions API](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-decisions)             | 2026-10-08             | 2026-10-13 |
| [GW-pricing]         | [Vercel — AI Gateway Pricing](https://vercel.com/docs/ai-gateway/pricing)                                                  | 2026-09-08             | 2026-10-13 |
| [GW-rate]            | [Vercel — AI Gateway Rate Limits](https://vercel.com/docs/ai-gateway/rate-limits)                                          | 2026-09-08             | 2026-10-13 |
| [GW-faq]             | [Vercel — AI Gateway FAQ](https://vercel.com/docs/ai-gateway/faq)                                                          | 2026-09-13             | 2026-10-14 |
| [GW-zdr]             | [Vercel — Zero Data Retention](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr)                             | 2026-09-22             | 2026-10-13 |
| [GW-no-training]     | [Vercel — Disallow Prompt Training](https://vercel.com/docs/ai-gateway/security-and-compliance/disallow-prompt-training)    | 2026-09-10             | 2026-10-13 |
| [GW-catalog]         | [AI Gateway — catálogo público de modelos](https://ai-gateway.vercel.sh/v1/models)                                         | Datos en vivo          | 2026-10-14 |
| [GW-endpoints]       | [AI Gateway — endpoints de Jev](https://ai-gateway.vercel.sh/v1/models/typesafe-ai/jev/endpoints)                          | Datos en vivo          | 2026-10-14 |
| [GW-kb-guide]        | [Vercel KB — How to classify, route, and score with Jev and AI SDK](https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk) | Publicada 2026-09-19; actualizada 2026-09-22 | 2026-10-14 |
| [GW-migration]       | [Vercel — AI SDK: de evaluación a decisiones](https://vercel.com/i/ai-sdk-evaluation-to-decisions)                          | 2026-10-12             | 2026-10-14 |
| [GW-quickstart]      | [Vercel — Decision quickstart](https://vercel.com/docs/ai-gateway/getting-started/decision)                                | 2026-10-07             | 2026-10-14 |
| [GW-budgets]         | [Vercel — Budgets and Spend Limits](https://vercel.com/docs/ai-gateway/observability-and-spend/budgets)                    | 2026-09-10             | 2026-10-14 |
| [GW-laya]            | [Vercel changelog — Laya, gratis hasta el 31 de octubre](https://vercel.com/changelog/laya-decision-model-now-available-on-ai-gateway-free-through-october-31) | 2026-10-01 | 2026-10-14 |
| [AISDK-decisions]    | [AI SDK — Decisions](https://ai-sdk.dev/docs/ai-sdk-core/decisions)                                                        | Sin fecha              | 2026-10-13 |
| [AISDK-typesafe]     | [AI SDK — proveedor TypeSafe](https://ai-sdk.dev/providers/ai-sdk-providers/typesafe-ai)                                   | Sin fecha              | 2026-10-13 |
| [TS-intro]           | [TypeSafe — Introduction](https://docs.typesafe.ai/introduction)                                                           | Sin fecha              | 2026-10-13 |
| [TS-api]             | [TypeSafe — API reference](https://docs.typesafe.ai/api)                                                                   | Sin fecha              | 2026-10-13 |
| [TS-models]          | [TypeSafe — Models](https://docs.typesafe.ai/models)                                                                       | Sin fecha              | 2026-10-13 |
| [TS-state]           | [TypeSafe — State](https://docs.typesafe.ai/concepts/state)                                                                | Sin fecha              | 2026-10-14 |
| [TS-choice]          | [TypeSafe — Choice](https://docs.typesafe.ai/primitives/choice)                                                            | Sin fecha              | 2026-10-13 |
| [TS-noul]            | [TypeSafe — Noul](https://docs.typesafe.ai/primitives/noul)                                                                | Sin fecha              | 2026-10-13 |
| [TS-advanced]        | [TypeSafe — Advanced primitives](https://docs.typesafe.ai/primitives/advanced)                                             | Sin fecha              | 2026-10-14 |
| [TS-confidence]      | [TypeSafe — Confidence](https://docs.typesafe.ai/confidence)                                                               | Sin fecha              | 2026-10-13 |
| [TS-primer]          | [TypeSafe — Machine learning primer](https://docs.typesafe.ai/introduction/machine-learning-primer)                        | Sin fecha              | 2026-10-13 |
| [TS-jagged]          | [TypeSafe — jev-1.13 model jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13)                                 | Sin fecha              | 2026-10-14 |
| [TS-build]           | [TypeSafe — How to build with System One](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)                  | Sin fecha              | 2026-10-14 |
| [TS-agents]          | [TypeSafe — Coding agents](https://docs.typesafe.ai/introduction/coding-agents)                                            | Sin fecha              | 2026-10-13 |
| [TS-fanout]          | [TypeSafe — Fan-out](https://docs.typesafe.ai/patterns/fan-out)                                                            | Sin fecha              | 2026-10-13 |
| [TS-consistency]     | [TypeSafe — Consistency (Choice)](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook)                          | Sin fecha              | 2026-10-13 |
| [TS-guardrails]      | [TypeSafe — LLM guardrails](https://docs.typesafe.ai/cookbooks/llm_guardrails)                                             | Resultados de 2026-08-15 | 2026-10-14 |
| [TS-semantic-find]   | [TypeSafe — Semantic find](https://docs.typesafe.ai/cookbooks/semantic_find)                                               | Sin fecha              | 2026-10-14 |
| [TS-sdk-config]      | [TypeSafe JS SDK — TypeSafeClientConfig](https://docs.typesafe.ai/sdk/javascript/api/interfaces/TypeSafeClientConfig)      | Sin fecha              | 2026-10-14 |
| [TS-sdk-request]     | [TypeSafe JS SDK — SystemOneRequest](https://docs.typesafe.ai/sdk/javascript/api/interfaces/SystemOneRequest)              | Sin fecha              | 2026-10-14 |
| [TS-sdk-jsonvalue]   | [TypeSafe JS SDK — JsonValue](https://docs.typesafe.ai/sdk/javascript/api/type-aliases/JsonValue)                          | Sin fecha              | 2026-10-14 |
| [TS-quickstart]      | [TypeSafe — Quickstart](https://docs.typesafe.ai/introduction/quickstart)                                                  | Sin fecha              | 2026-10-14 |
| [TS-legal]           | [TypeSafe — Legal](https://docs.typesafe.ai/legal)                                                                         | Sin fecha              | 2026-10-14 |
| [TS-dpa]             | [TypeSafe — Data Processing Agreement](https://typesafe.ai/legal/data-processing)                                          | 2026-04-24             | 2026-10-14 |
| [TS-mca]             | [TypeSafe — Master Customer Agreement](https://typesafe.ai/legal/mca)                                                      | 2026-09-23             | 2026-10-14 |
| [CH-prompt-api]      | [Chrome — Prompt API](https://developer.chrome.com/docs/ai/prompt-api)                                                     | 2026-08-26             | 2026-10-14 |
| [CF-workers-ai]      | [Cloudflare — Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)                           | 2026-10-09             | 2026-10-14 |
| [GG-terms]           | [Google — Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)                                             | 2026-04-28             | 2026-10-14 |
| [LIT-xiong]          | [Xiong et al., «Can LLMs Express Their Uncertainty?», ICLR 2024](https://arxiv.org/abs/2306.13063)                         | 2024                   | 2026-10-14 |
| [LIT-turpin]         | [Turpin et al., «Language Models Don't Always Say What They Think», NeurIPS 2023](https://arxiv.org/abs/2305.04388)        | 2023                   | 2026-10-14 |
| [GDPR-r18]           | [RGPD, considerando 18](https://gdpr-info.eu/recitals/no-18/) (texto oficial en [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)) | 2016 | 2026-10-14 |
| [GDPR-a9]            | [RGPD, artículo 9](https://www.legislation.gov.uk/eur/2016/679/article/9/adopted) (texto oficial en [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)) | 2016 | 2026-10-14 |
