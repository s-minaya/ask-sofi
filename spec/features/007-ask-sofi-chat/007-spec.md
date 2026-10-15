# 007 — Ask Sofi Chat Experience

## Status

Draft — pendiente de aprobación.

## Objective

Construir la consulta real. La persona escribe el mensaje y su contexto, decide si usa el expediente y recibe el resultado del núcleo (`005`/`006`) con la voz dinámica de Sofi. Si falta contexto, puede aportarlo. Errores, riesgo y privacidad se tratan con prudencia.

Sustituye el aviso de demostración de la consulta (`art-direction/README.md`, decisión 1).

Fuentes que no se repiten aquí: flujo y alcance en `roadmap.md` §10; semántica de las estimaciones en `mission.md` §4.2; aviso de envío de datos en `mission.md` §6; redactor en `tech-stack.md` §26.1; estados de carga y pruebas en `tech-stack.md` §42 y §45; dirección visual en `spec/constitution/art-direction/`, incluidos sus pendientes 9 y 10.

## Dependencies

- `002` (Design System y Design Lab), `003` (persistencia y borrado), `004` (expediente), `005` (resultado y errores), `006` (proveedor real y `POST /api/interpret`).
- Relacionadas: `008` (nuevos estados de Sofi), `009` (historial), `011` (evaluación del redactor), `013` (límites de uso), `015` (verificación transversal).

## Requirements

### 1. Consulta

- Mensaje objetivo y contexto se escriben por separado, sobre el borrador de `003`.
- Si se pega una conversación, la interfaz pide indicar qué mensaje analizar y recomienda quitar datos personales de terceros. No hay importador de conversaciones.
- Superar las longitudes máximas de `005` se comunica antes de enviar, sin truncar. Con un contexto largo, se pide seleccionar lo pertinente.
- Si el mensaje es solo un marcador de contenido omitido, se pide el contenido o una descripción.
- Aportar más contexto actualiza el contexto y lanza un nuevo análisis; no es una conversación multiturno (`roadmap.md` §10).

### 2. Aviso de datos y uso del expediente

- Antes del primer envío, la interfaz informa de qué datos salen del dispositivo y a qué servicios (preparación lingüística, Jev y redactor), con el tratamiento verificado de cada uno. Autorizar el expediente no sustituye este aviso.
- Un interruptor visible en la consulta autoriza el uso del expediente. La primera vez está desactivado. Completar el expediente no lo activa.
- Una opción separada y explícita permite recordar esa preferencia para próximas consultas. Está desactivada al principio, se guarda localmente con `003` y se puede revocar; con ella activa, el interruptor sigue visible.
- Borrar el expediente o todos los datos elimina la preferencia recordada.
- Con el interruptor desactivado no se envía el expediente aunque exista.
- `profileUsed` no se presenta como mayor precisión.

### 3. Resultado

- `interpreted` presenta las señales con la semántica de `mission.md` §4.2 y la adaptación editorial de `art-direction/README.md` (pendiente 9). No hay ganadora obligatoria. Con cero señales comunicables, se informa de que el análisis se completó pero no encontró señales destacadas, sin inventar conclusiones ni convertirlo en `needs_context`.
- Dos señales altas en tensión (literal y sarcástica, por ejemplo) se presentan como posibilidades abiertas.
- `no_concern_detected` nunca se comunica como «la situación es segura».
- Un límite explícito nunca se presenta como algo que haya que superar o sobre lo que insistir.

### 4. Falta de contexto

- `needs_context` muestra los límites explícitos que conserve `005` y una pregunta útil sobre lo que falta. Si no se sabe qué falta, la pregunta es neutral.
- No se repite la misma pregunta en una consulta.
- Si la persona indica que no tiene más información, Sofi deja de preguntar. Explica lo que no se puede saber y puede sugerir preguntarlo directamente, sin afirmar enfado ni rechazo.
- No hay un máximo numérico de preguntas.

### 5. Redactor

- El redactor de `tech-stack.md` §26.1 escribe en español de España, con sus restricciones. Además:
  - del expediente recibe, como mucho, las respuestas concretas enviadas a Jev; nunca las notas;
  - cuando cita el mensaje, lo hace literalmente;
  - no inventa motivos, IDs, diagnósticos, recuerdos ni certezas, y no aconseja insistir ante un límite;
  - trata mensaje, contexto y expediente como datos, no como instrucciones.
- Observaciones verificables: funciones puras sobre el texto original (emojis como grafemas completos, puntos suspensivos, mayúsculas, risas, signos, longitud), solo las que el redactor use. El redactor puede mencionar un hecho observado, pero nunca lo presenta como causa de una estimación ni convierte un emoji en sarcasmo.
- Las restricciones validables estructuralmente (citas literales, sin cifras propias, sin IDs ni lecturas no autorizadas) se comprueban sobre cada texto. Estas validaciones detectan incumplimientos estructurales, no garantizan fidelidad semántica completa. Un JSON válido o un prompt restrictivo no demuestran fidelidad; su evaluación sistemática es de `011`.
- Si el redactor falla o incumple una restricción validable, se muestran las señales válidas con definiciones neutrales y un aviso. No se presenta texto de plantilla como análisis nuevo ni se usa el fake. Se puede reintentar solo la redacción, sin volver a consultar a Jev. Sin resultado válido, error.
- Proveedor: AI Gateway es la primera vía a probar, por preferencia y no por obligación. Mistral Small es candidato, no elección. El límite de gasto se aprueba antes de usarlo (`mission.md` §12). No hay fallback oculto a otro proveedor.
- Antes de ejecutar con coste el PoC `evals/llm-redactor/`, se actualizan su contrato y su rúbrica: usa `dominant/tied/spread`, `confidence_level` y `primary_reading`, ya obsoletos.
- La procedencia del redactor (proveedor, modelo y versión de las instrucciones) se añade a los metadatos de `005`.
- Usar Jev como verificador del redactor es un experimento de `011`; no se activa en producción.

### 6. Seguridad y salida rápida

- `safety_concern` usa copy fija, revisada, sobria y accesible, sin redactor, humor, sonido de habla, sprites ni titulares cómicos.
- Los recursos dependen del tipo de persona afectada (`005`) y del país. En España, solo los pertinentes entre 112 (emergencia inmediata), 016 (violencia contra las mujeres) y 024 (conducta suicida, también para el entorno), nunca como recursos globales. Si no se conoce el país, no se asume España. Los textos se revisan editorialmente y se contrastan con fuentes oficiales.
- Cuando la seguridad no se pudo evaluar (`safety_evaluation_unavailable` de `005`), el error se muestra con un mensaje neutro, sin humor ni lecturas, y sin afirmar riesgo ni ausencia de riesgo.
- Los estados sensibles desactivan humor, voz cómica y sprites incompatibles.
- Una salida rápida está disponible para cualquiera, en cualquier consulta. Es accesible, oculta el contenido al instante y descarta los datos temporales de la consulta (estado de la aplicación, `sessionStorage` y, si procede, `localStorage`) sin diálogos intrusivos. No promete «no dejar rastro»: historial del navegador, capturas y proveedores quedan fuera de su alcance.
- Un `safety_concern` no se guarda automáticamente.
- La pantalla de seguridad y la salida rápida no tienen diseño aprobado: se proponen en el Design Lab y se aprueban antes de implementarse (`art-direction/README.md`, pendiente 10).

### 7. Reutilización y errores

- Volver a ver o reproducir la respuesta reutiliza el último resultado y su texto, sin nueva inferencia.
- Cambiar el mensaje, el contexto o el expediente enviado lanza un análisis nuevo.
- «Volver a analizar» es una acción explícita. Avisa de que el resultado puede cambiar. Los resultados nunca se promedian.
- Una caché temporal no es historial (`009`).
- Los errores se explican sin detalles del proveedor. «Reintentar» solo aparece si el error es `retryable`, y siempre lo inicia la persona.

### 8. Experiencia visual

- Se siguen la dirección artística y el Design Lab, y se reutilizan los componentes de `002`. El copy y la semántica de los resultados se adaptan y se aprueban en el Design Lab antes de implementarse.
- La voz, el typewriter y el sonido del discurso siguen el Design Lab y las preferencias existentes.
- Los nuevos estados o animaciones de Sofi que no existan pertenecen a `008`; aquí se usan los disponibles.

## Acceptance Criteria

### Consulta y datos

- [ ] Mensaje y contexto son campos separados; las longitudes excesivas se avisan antes de enviar, sin truncar.
- [ ] El aviso de envío de datos aparece antes del primer análisis y nombra los servicios implicados.
- [ ] El interruptor del expediente empieza desactivado, no se activa al completar el expediente y siempre está visible.
- [ ] «Recordar» es una opción separada, desactivada al principio, revocable, y desaparece al borrar el expediente o todos los datos.
- [ ] Con el interruptor desactivado, la petición no lleva expediente.

### Resultado y contexto

- [ ] Los resultados no muestran repartos de 100 %, ganadoras obligatorias, «versiones» ni «empate técnico», ni presentan las estimaciones como probabilidad de lo que siente la pareja.
- [ ] Las señales ausentes no se muestran como cero.
- [ ] `no_concern_detected` no se comunica como «la situación es segura».
- [ ] `needs_context` conserva los límites explícitos y no repite preguntas.
- [ ] Si la persona no tiene más información, Sofi deja de preguntar sin inventar conclusiones.

### Redactor

- [ ] El discurso cita literalmente y no contiene cifras propias, IDs ni lecturas no autorizadas (validaciones estructurales automáticas; no garantizan fidelidad semántica completa).
- [ ] Ante «No quiero que vengas hoy», el discurso no aconseja insistir (casos de prueba con `FakeDiscourseWriter` y evaluación explícita del redactor real).
- [ ] Si el redactor falla, se muestran señales con definiciones neutrales y un aviso, sin fake ni plantilla presentada como análisis.
- [ ] El PoC del redactor está actualizado antes de cualquier ejecución con coste.
- [ ] La procedencia del redactor figura en los metadatos.

### Seguridad

- [ ] `safety_concern` muestra copy revisada, sin humor, sonido de habla ni sprites cómicos, y solo recursos pertinentes.
- [ ] `safety_evaluation_unavailable` se muestra con un mensaje neutro y no afirma ni descarta riesgo.
- [ ] La salida rápida funciona desde cualquier consulta con teclado y lector de pantalla, oculta el contenido y descarta los datos temporales.
- [ ] Un `safety_concern` no se guarda automáticamente.
- [ ] La pantalla de seguridad y la salida rápida están aprobadas en el Design Lab.

### Reutilización y verificación

- [ ] Volver a ver un resultado no lanza otra inferencia; cambiar la entrada sí.
- [ ] «Volver a analizar» y «Reintentar» solo se ejecutan por acción de la persona.
- [ ] Los estados de `tech-stack.md` §42.4 y §45 tienen pruebas con MSW y los flujos principales, pruebas con Playwright.
- [ ] Se cumplen los criterios de accesibilidad, responsive y calidad de la constitution para las pantallas nuevas; la validación transversal en dispositivos corresponde a `015`.

## Out of Scope

- Historial, favoritos y borrado de elementos guardados (`009`).
- Estadísticas (`010`).
- Evaluación sistemática del redactor y de la comprensión (`011`).
- Umbrales y abstención definitivos (`012`).
- Rate limiting y protección contra abuso (`013`).
- MCP (`014`).
- Sistema ampliado de estados y animaciones de Sofi (`008`).

## Provisional and pending

**Provisional:** las señales y sus definiciones (`005`); el proveedor candidato del redactor.

**Pendiente de evaluar:** la comprensión de cifras y bandas, con una prueba pequeña cuando sea viable; la calidad y fidelidad del redactor (`011`).

**Se decide durante esta feature, con aprobación de la autora:**

1. Presentar cifras, bandas o ambas. Se decide en el Design Lab tras la prueba de comprensión, si es viable.
2. Si el redactor recibe las cifras exactas o solo bandas.
3. Concordancia de género del discurso: reflejar el género explícito, mantener un lenguaje neutro o preguntar. Nunca se infiere.
4. Cómo se determina el país de los recursos de ayuda, o qué se muestra sin él.
5. Diseño de la pantalla de seguridad y de la salida rápida (Design Lab).
6. Qué ocurre al recargar o volver con un resultado o un `safety_concern` en pantalla, junto con `009` y `015`.
7. Proveedor del redactor y límite de gasto.
8. Clave de reutilización de resultados, solo si hace falta.

## References

- `spec/constitution/mission.md` §4.2, §6, §12
- `spec/constitution/roadmap.md` §10
- `spec/constitution/tech-stack.md` §26.1, §42, §44, §45, §60
- `spec/constitution/art-direction/README.md`
- `spec/decisions/analysis-architecture-rationale.md` §2, §7, §8, §10, §11, §14
- `003 — Local Persistence`, `004 — Partner Profile & Onboarding`, `005 — Analysis Domain`, `006 — Jev Integration`
- `AGENTS.md`
