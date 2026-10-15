# 011 — Evaluation System

## Status

Draft — pendiente de aprobación.

## Objective

Medir, de forma explícita y reproducible, cómo se comportan la preparación lingüística, Jev, la política, el redactor y la seguridad en el dominio de Ask Sofi. Con esa evidencia, `012` revisa la política y la taxonomía provisionales, sin inventar cifras ni atribuir certeza sobre lo que piensa otra persona.

Fuentes que no se repiten aquí: escenarios, comparaciones, métricas y finalidad en `roadmap.md` §14; estructura y ejecución de `evals/` en `tech-stack.md` §49; experimentos previos del proveedor en `jev.md` §11.

## Dependencies

- `005` (contratos y versiones), `006` (adaptadores, E1, conjunto canario y valores provisionales), `007` (redactor y presentación).
- Consumidor principal: `012`.

## Requirements

### 1. Conjunto de evaluación

- Solo mensajes ficticios o sintéticos. Nunca conversaciones privadas reales.
- Se construye a partir de E1 (`006`) y de los casos H01–H30 y C1–C20 del registro, seleccionados y con criterios escritos. Ningún caso del registro se toma como resultado ya medido.
- Cubre los escenarios y las variantes de `roadmap.md` §14, con casos positivos, negativos y ambiguos por señal. Incluye además: hipérboles frente a riesgo real, límites explícitos, contenido omitido, inyección de instrucciones, cambios de género, emojis compuestos, negaciones, inglés y las lenguas o mezclas que se quieran probar.
- Los fixtures están versionados. Cada etiqueta indica quién la puso y con qué criterio.

### 2. Etiquetado humano

- Etiquetan personas que evalúan de forma independiente. Las salidas de un modelo no cuentan como votos humanos.
- Una segunda persona evaluadora es deseable, no obligatoria. Con una sola, se declara y se moderan las conclusiones.
- El acuerdo entre personas no demuestra la intención real de quien escribió el mensaje.

### 3. Métricas y análisis

- Las métricas de `roadmap.md` §14, por señal. Incluyen el Brier score frente a la tasa base cuando proceda, tramos gruesos, falsos positivos y negativos, utilidad y solape entre señales.
- Abstención, `needs_context` e `interpreted` con cero señales comunicables; seguridad, incluidos `safety_evaluation_unavailable` y los casos en que `safety_concern` prevalece sobre suficiencia no evaluada.
- Preparación lingüística: fidelidad, emojis, negaciones y resistencia a la inyección.
- Redactor, con una rúbrica: especificidad, español natural, personalidad, variedad, fidelidad a las señales autorizadas, respeto de los límites, ausencia de hipótesis nuevas y concordancia de género.
- Variabilidad entre ejecuciones repetidas de una misma entrada.
- Influencia del expediente: con y sin él, y con expedientes engañosos.
- Solo se afirma la calibración que el tamaño y la naturaleza del conjunto permitan sostener.

### 4. Versiones y reproducibilidad

- Cada ejecución registra fecha, `schemaVersion`, `taxonomyVersion`, `policyVersion`, alias y versión observada de Jev (o `unknown`), servicio de preparación lingüística, redactor y versión de las instrucciones.
- Si el conjunto canario de `006` detecta un cambio de comportamiento, se repiten las evaluaciones afectadas antes de afirmar nada sobre la fiabilidad.
- Los resultados de versiones distintas no se combinan sin declararlo.

### 5. Ejecución

- Las ejecuciones son explícitas, con autorización de la autora y dentro de los límites de gasto aprobados.
- Los informes incluyen desacuerdos, sesgos y limitaciones. Ninguna cifra se inventa ni se redondea a favor.

### 6. Resultados para otras features

- Propuestas razonadas para `012`: valores de `PolicyConfig`, cuándo pedir contexto y cómo tratar las señales en tensión.
- Evidencia para revisar la taxonomía v1: qué señales añadir, eliminar, fusionar, redefinir o reclasificar. El cambio se aplica con una nueva `taxonomyVersion` cuando la autora lo aprueba.
- Comprensión de cifras y bandas por personas, si es viable, para `007` y `012`.

### 7. Experimentos

- **Jev como verificador del redactor.** Se compara con criterios humanos si detecta consejos de insistir ante un límite, lecturas no autorizadas o certezas. Es un experimento: no se activa en producción ni se ejecuta en cada respuesta.
- **Cuestionario voluntario, si es viable.**
  - Es anónimo, usa mensajes ficticios y no muestra las predicciones de Jev antes de responder.
  - Antes de lanzarlo se explican la participación, la privacidad, la finalidad y los datos que se recogen, que son los mínimos.
  - Una publicación en LinkedIn invita a participar y otra comparte los resultados reales, con los desacuerdos, sesgos y ajustes.
  - No se presenta como certificación científica ni como marketing de precisión.
  - No obliga a crear una web ni un backend, ni a conseguir un número de participantes.

## Acceptance Criteria

- [ ] El conjunto es ficticio, está versionado, cubre `roadmap.md` §14 y los casos añadidos del §1, y cada etiqueta documenta autor y criterio.
- [ ] El informe da métricas por señal y no presenta una confianza global ni una calibración que los datos no sostengan.
- [ ] Hay resultados documentados de abstención, seguridad, preparación lingüística, redactor, variabilidad e influencia del expediente.
- [ ] Cada ejecución registra sus versiones y su procedencia; las de versiones distintas no se mezclan sin declararlo.
- [ ] Se declara cuántas personas etiquetaron y cómo afecta eso a las conclusiones.
- [ ] Las ejecuciones no forman parte de `npm test` ni de CI y tienen autorización documentada.
- [ ] Existe una propuesta para `012` y una revisión de la taxonomía basadas en los resultados.
- [ ] El experimento del verificador está documentado como tal, sin activarse en producción.
- [ ] Si se lanza el cuestionario, su aviso de participación y privacidad precede a la recogida y sus resultados se publican sin exagerar su alcance.

## Out of Scope

- Cambiar los valores productivos de `PolicyConfig` o la taxonomía sin aprobación (`012`).
- Decidir si existe una confianza global (`012`).
- Activar un verificador automático en producción.
- Usar encuestas o etiquetas humanas como verdad sobre lo que siente otra persona.

## Provisional and pending

**Pendiente de decidir durante esta feature, con aprobación de la autora:**

1. Quién etiqueta y si hay una segunda persona disponible.
2. Tamaño del conjunto y casos elegidos del registro.
3. Si se lanza el cuestionario y, en ese caso, la herramienta, la muestra, el calendario y el texto de privacidad.

## References

- `spec/constitution/roadmap.md` §14
- `spec/constitution/tech-stack.md` §49
- `spec/constitution/jev.md` §11
- `spec/decisions/analysis-architecture-rationale.md` §3, §8.3, §14.9, §19
- `005 — Analysis Domain`, `006 — Jev Integration`, `007 — Ask Sofi Chat Experience`
- `AGENTS.md`
