# 006 — Jev Integration

## Status

Approved — 2026-10-20

## Objective

Conectar el núcleo de `005` con Jev, a través de Vercel AI Gateway, y con un servicio que prepara la entrada en inglés, ambos detrás de adaptadores sustituibles. Obtener, con experimentos autorizados, los primeros valores provisionales de la política.

Fuentes que no se repiten aquí: alcance y flujo conceptual en `roadmap.md` §9; capacidades, límites, costes, privacidad y experimentos de Jev en `jev.md`; política de coste en `mission.md` §12 y `tech-stack.md` §27 y §69; secretos y registros en `tech-stack.md` §61 y §62.

## Dependencies

- `005`: contratos, política, minimización del expediente, errores y fake.
- `jev.md`: revisar fechas y alias antes de empezar («Mantenimiento», §1).
- Consumidores: `007`, `011`, `014`.

## Requirements

### 1. Antes de cualquier llamada real

- E0 resuelto (`jev.md` §11) y límite de gasto aprobado por la autora y aplicado en la plataforma (`tech-stack.md` §27).
- Condiciones de cada proveedor y ruta comprobadas en fuentes oficiales para la cuenta real: entrenamiento, ZDR, retención y región se verifican por separado. Un metadato de catálogo no lo demuestra.
- Cada ejecución real (experimento, verificación manual o smoke test) tiene autorización expresa de la autora. Las pruebas automáticas normales nunca llaman a servicios reales.
- Los datos del proveedor que use la feature (alias y versión, precios, límites y formato de rechazos) se verifican y se actualizan en `jev.md` con fecha.
- Los experimentos usan solo mensajes ficticios o sintéticos.
- Ningún entorno desplegado (producción, previews ni CI) tendrá credenciales de inferencia de AI Gateway ni del servicio de traducción hasta que estén activas las protecciones de `013` y haya autorización posterior explícita de la autora. Sin credenciales configuradas, el endpoint falla cerrado y no realiza llamadas a proveedores.

### 2. Preparación lingüística

- Un adaptador sustituible prepara en inglés el mensaje, el contexto y las respuestas del expediente antes de llamar a Jev. El dominio no depende del idioma ni del servicio.
- El original se conserva intacto para la interfaz y el redactor; nada se traduce sobre el almacenamiento local.
- Un texto identificable como inglés puede enviarse sin traducir. El idioma de textos muy cortos («ok») se trata como incierto. No se construye un detector de idioma propio.
- Se conservan los emojis como grafemas completos (modificadores de tono y secuencias ZWJ incluidos), las negaciones y dobles negaciones, la puntuación y la ironía abierta, sin añadir emociones.
- Se validan mecánicamente, como mínimo, que la salida no esté vacía y que los emojis sigan presentes e idénticos. Superar esta validación no demuestra fidelidad semántica.
- Mensaje, contexto y expediente son datos, no instrucciones: un texto que intente cambiar la tarea de traducir se traduce como contenido.
- Si la preparación falla, se bloquea o no supera la validación, no se llama a Jev y se devuelve el error correspondiente de `005`.
- Soporte inicial: español e inglés. Otras lenguas y mezclas se prueban antes de prometer compatibilidad.

### 3. Adaptador de Jev

- `JevDecisionProvider` implementa el puerto de `005` en el servidor. Las credenciales solo existen en variables de servidor.
- Cada señal del catálogo se pregunta como `boolean` independiente. Seguridad, persona afectada y suficiencia se preguntan como evaluaciones auxiliares propias. No se usa `choice` para lecturas compatibles.
- Las instrucciones van en inglés, tienen en cuenta los riesgos de interpretación de cada señal (registro §3) y se versionan como parte de la procedencia.
- La pregunta de suficiencia no marca insuficiente un mensaje explícito solo porque no revele sus motivos («No quiero que vengas hoy»).
- La pregunta de seguridad no depende solo de palabras sueltas: una hipérbole coloquial no basta para `concern`.
- Seguridad y suficiencia se evalúan sin expediente. Si `profileUsed` es `true`, las lecturas se obtienen con él.
- Las respuestas del expediente llegan a Jev como frases estables en inglés, versionadas y distintas del copy de `004` (`jev.md` §8.2).
- Un rechazo, una ausencia, un tipo incorrecto o un valor no finito en una pregunta se traducen a ausencia o a respuesta inválida según `005`; nunca a `0` ni a `false`. El rechazo de la pregunta de seguridad deja la seguridad sin evaluar.
- No hay fallback a otro modelo, a un LLM ni al fake.
- Los fallos de la pasarela (402, 403, 429), los tiempos de espera y los errores de red se traducen a errores de `005`, sin mostrar mensajes del proveedor. No hay reintentos automáticos: el error indica `retryable` y reintentar es una acción de la persona (`005` §7, `007`).
- Se registran el alias pedido y el modelo que respondió. La versión de Jev se registra solo si se observa realmente en la respuesta; si no, se guarda el valor literal `unknown`, nunca una versión inferida.

### 4. Servidor

- Esta feature entrega `POST /api/interpret` (`tech-stack.md` §28). Es la frontera de servidor donde se componen los adaptadores y se repite la minimización; `007` lo consume y usa MSW en desarrollo. La protección contra abuso sigue en `013`.
- El servidor compone `interpretMessage()` con la preparación lingüística y el adaptador de Jev.
- Vuelve a validar la entrada y a minimizar el expediente con la función de `005`; no confía en la minimización del cliente.
- Falla cerrado: sin credencial, sin traductor aprobado o sin `PolicyConfig` respaldada por experimentos, responde `processing_unavailable` y no llama a ningún proveedor, ni al fake.
- Añade a los metadatos la procedencia de la preparación lingüística (servicio usado u omitido).
- No registra mensaje, contexto ni expediente.

### 5. Experimentos y valores provisionales

- Se aplican los experimentos de `jev.md` §11 que corresponden a esta feature: E1 (escenarios, sin llamadas), E2, E3, E4, E5, E6 y E8.
- Las etiquetas de E1 las aprueba la autora antes de ejecutar nada y sin ver respuestas de Jev. Pueden proponerse con asistencia, pero cada caso conserva su procedencia y los informes la citan (`006-plan.md` §5.2).
- Cada experimento deja un informe reproducible con fecha, versión observada del modelo, versión de las instrucciones y configuración.
- Comparar entradas en español, en inglés o en ambos informa a la autora, pero no cambia por sí solo el envío en inglés.
- A partir de E2, E3 y E6 se proponen valores provisionales de `PolicyConfig` con su procedencia (experimento, fecha y modelo observado) y un nuevo `policyVersion`. Se registran en el plan (`jev.md` §12). No se fija ningún valor sin base experimental.
- Un conjunto canario de entradas sintéticas permite detectar cambios de comportamiento cuando cambian el alias o las instrucciones. Se ejecuta de forma explícita.
- Los hallazgos sobre señales mal definidas, redundantes o ausentes se documentan para `011`; esta feature no cambia la taxonomía.

### 6. Pruebas

- Adaptador de Jev: MSW sobre el endpoint del proveedor con las respuestas de `jev.md` §10.1, incluidas las anómalas.
- Preparación lingüística: adaptador simulado; se prueban las validaciones mecánicas (emojis compuestos, salida vacía) y el bloqueo ante fallo.
- Composición del servidor: fake del proveedor y del traductor, sin red.

## Acceptance Criteria

### Preparación

- [ ] E0 está resuelto, y el límite de gasto, aprobado y aplicado antes de la primera llamada real.
- [ ] `jev.md` recoge, con fecha, el alias y la versión observados, los precios, los límites y el formato de rechazos usados.
- [ ] Las condiciones de privacidad de cada ruta están verificadas y documentadas antes de enviar datos.

### Preparación lingüística

- [ ] El original se conserva y los emojis compuestos (👍🏽, 🤷‍♀️, secuencias ZWJ) sobreviven a la preparación.
- [x] Si la preparación falla o no supera la validación, no se llama a Jev y se devuelve un error.
- [ ] Un texto con instrucciones incrustadas se trata como contenido (ejecución explícita con casos sintéticos; resultado documentado).

### Jev

- [x] Cada señal es una pregunta `boolean` independiente.
- [x] Rechazos, ausencias y valores inválidos se traducen según `005`; un rechazo de seguridad nunca equivale a «sin riesgo».
- [x] Las preguntas de seguridad y suficiencia nunca reciben datos del expediente.
- [x] Con el expediente autorizado pero sin respuestas concretas no se pide evaluación con expediente y `profileUsed` es `false`.
- [x] 402, 403, 429, tiempos de espera y errores de red producen errores de `005` sin texto del proveedor, sin fallback y sin reintentos automáticos.
- [x] La procedencia registra alias, modelo que respondió, versión observada o `unknown`, versión de las instrucciones y preparación lingüística usada.

### Servidor y experimentos

- [ ] `POST /api/interpret` está implementado en esta feature.
- [x] El servidor vuelve a minimizar el expediente y no registra contenido de la consulta.
- [x] Mientras falte la credencial, el traductor aprobado o la `PolicyConfig` con valores experimentales, el servidor falla cerrado sin llamar a proveedores.
- [x] El conjunto E1 existe con las etiquetas aprobadas y su cobertura documentada (`006-plan.md` §8.3).
- [ ] Los informes de E2–E6 y E8 existen, con fecha, configuración y versión observada.
- [ ] Los valores provisionales de `PolicyConfig` están en el plan con su procedencia y `policyVersion`.
- [ ] El conjunto canario existe y su ejecución explícita está documentada.
- [x] La suite normal de tests no hace llamadas reales.

## Out of Scope

- Redactor, presentación e interfaz (`007`).
- Umbrales definitivos, calibración y cambios de taxonomía (`011`, `012`).
- Rate limiting, protección contra abuso y edad mínima (`013`).
- MCP (`014`).

## Provisional and pending

**Provisional:** los valores de `PolicyConfig` que proponga esta feature; las instrucciones de cada pregunta.

**Pendiente de evaluar (en esta feature, con autorización):** proveedor de traducción y su fidelidad; estructura del estado y selección de áreas del expediente (E4); comportamiento de la suficiencia (E3) y de la seguridad ante hipérboles (E6); robustez ante inyección y cambios de género (E5); posibilidad de fijar o ver la versión de Jev (E8).

**Decididos en el plan (aprobados el 2026-10-16, `006-plan.md` §9):** transporte (`POST /v1/decisions` con `fetch`, sin reintentos automáticos); opciones de enrutado y privacidad de cada petición; presupuesto (0 € autorizados hasta que la autora apruebe una cifra).

**Pendiente de decisión de la autora:**

- proveedor de traducción. Azure AI Translator (NMT) es el candidato preferente a investigar; la alternativa es un LLM, incluido el redactor de `007` (`roadmap.md` §9). Ninguno está elegido;
- cifra del límite de gasto de Jev y, si la traducción tiene coste, también la suya.

**Decisiones aprobadas en esta spec:**

1. **`POST /api/interpret` pertenece a esta feature** (`tech-stack.md` §28). `007` lo consume. La protección contra abuso sigue en `013`.

## References

- `spec/constitution/mission.md` §12
- `spec/constitution/roadmap.md` §9
- `spec/constitution/tech-stack.md` §27, §28, §42.4, §60, §61, §62, §69
- `spec/constitution/jev.md` §1, §3.4, §8, §10, §11, §12
- `spec/decisions/analysis-architecture-rationale.md` §5, §6, §9, §12
- `005 — Analysis Domain`
- `AGENTS.md`
