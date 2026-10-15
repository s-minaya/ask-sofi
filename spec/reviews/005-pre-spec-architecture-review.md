# 005 — Revisión crítica de la arquitectura de análisis (previa a la spec)

> **Fecha:** 2026-10-15
> **Tipo:** revisión técnica independiente. **No es fuente de verdad**: no modifica decisiones ni documentos. Lo que se acepte se aplica en la fuente de verdad que corresponda (`AGENTS.md`, «Final rule»).
> **Objeto:** las diez decisiones aprobadas y las transversales L1–L5 de `spec/decisions/ask-sofi-registro-de-decisiones-analisis.md` (en adelante, «el registro»), contrastadas con `mission.md`, `roadmap.md`, `tech-stack.md`, `jev.md`, `AGENTS.md`, el borrador `005-spec.md`, el expediente de 004, el Design System de 002 y el PoC `evals/llm-redactor/`.
> **Nombre del registro:** el encargo cita `spec/decisions/analysis-architecture-rationale.md`, que no existe; es la ubicación *sugerida* en la cabecera del registro (l. 6). Se ha revisado el único archivo de `spec/decisions/`.
> **Sin llamadas a proveedores de IA.** Solo documentación pública y el catálogo público de AI Gateway (metadatos, sin inferencia).

## Cómo leer este informe

| Marca    | Significado                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **[E]**  | Hecho verificado en esta revisión: fuente oficial consultada el 2026-10-15 (§8.1) o código y documentos del repositorio citados con línea (§8.2). |
| **[E-h]** | Hecho heredado de `jev.md` o del registro, con fuente citada allí y **no reverificado** hoy (§8.3).                                              |
| **[I]**  | Inferencia razonada a partir de hechos citados.                                                                                                  |
| **[H]**  | Hipótesis sin evidencia suficiente; requiere prueba.                                                                                             |
| **[DP]** | Decisión de producto: la técnica no la resuelve; la toma la autora.                                                                              |

Identificadores: **B** bloqueante, **I** importante, **M** mejora opcional, **A** alternativa, **C** caso límite. «Cuándo» indica la feature en la que conviene resolver cada punto. Las decisiones pendientes de aprobación están numeradas en §7.1.

---

## 1. Veredicto general

**El núcleo es viable y coherente.** Separar estimar (Jev), decidir (política propia) y narrar (redactor); tratar las lecturas como enunciados independientes; distinguir ausencia de cero; sacar los errores de los estados; juzgar la suficiencia sin el expediente y no fabricar una confianza global encaja con lo que Jev hace y con lo que no hace [E][E-h], y aplica bien el principio «Probabilities must be earned, not assumed» (`mission.md` §4.3).

Tiene, sin embargo, tres problemas estructurales:

1. **Las decisiones solo viven en un registro no normativo y contradicen fuentes de verdad, incluida la interfaz aprobada.** El diseño de resultados de 002 asume un reparto que suma 100 % («Los porcentajes reparten el apoyo…», «Reñido», «empate técnico»), y `mission.md` §4.2, `tech-stack.md` §29, §42.4, §45 y §69 y `roadmap.md` §8, §9 y §15 describen todavía el modelo anterior (B1, B5).
2. **La política que 005 debe entregar no está definida.** No se permiten umbrales, pero ningún estado puede decidirse a partir de probabilidades continuas sin un corte; un mensaje explícito sin contexto acabaría en `needs_context`, y la seguridad falla en abierto cuando no se evalúa (B2, B3, B4).
3. **La cadena ha pasado de un servicio externo a tres en serie** (traductor → Jev → redactor). Dos son generativos y quedan fuera de las garantías del dominio: el traductor, antes de Jev, es una preinterpretación que nadie ha medido; el redactor, después, tiene una fidelidad sin mecanismo de control. El dominio controla el centro de la cadena y los riesgos se concentran en los extremos (I3, I4, I6).

Ninguno exige replantear la arquitectura: se resuelven en el texto de `005-spec.md` o se aplazan con un responsable explícito. **Recomendación: listo con ajustes** (§9).

---

## 2. Evaluación crítica de las decisiones

### 2.1. Resumen

| Nº  | Decisión                                   | Veredicto                                 | Motivo principal                                                     | Hallazgos         |
| --- | ------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------- | ----------------- |
| 1   | Estimaciones independientes                | Mantener                                  | Encaja con el `boolean` de Jev [E]; la ausencia no es cero           | B1, C8            |
| 2   | Nueve señales                              | Mantener con ajustes                      | Lectura literal demasiado estrecha; falta el enfado; mezcla dimensiones | I1             |
| 3   | Proveedor → señales → política → redactor  | Mantener                                  | Testeable y reutilizable; faltan los límites de la orquestación     | I9, A3            |
| 4   | Tres estados y errores aparte              | Mantener con ajustes                      | Faltan la precedencia y el fallo cerrado de seguridad                | B3, B4            |
| 5   | Suficiencia sin expediente                 | Mantener con ajustes                      | Tres niveles exigen cortes; los mensajes explícitos quedan mal       | B2, B3            |
| 6   | Sin confianza global                       | Mantener tal cual                         | Evidencia sólida                                                     | B5 (limpieza)     |
| 7   | Jev + LLM redactor                         | Mantener la dirección, con condiciones    | Alcance contradictorio; fidelidad sin mecanismo                      | I4, I6, A5, A6    |
| 8   | Versionado mínimo                          | Mantener                                  | Por AI Gateway solo se conoce el alias de Jev [E]                     | I7, M2            |
| 9   | Expediente opt-in por consulta             | Mantener en 005; revisar en 007           | La fricción recae en el dato menos sensible                          | I2, A7            |
| 10  | Límites y seguridad proporcional           | Mantener el principio, con ajustes        | Falla en abierto; un solo indicador no basta                         | B4, I5            |
| L1  | Inglés obligatorio hacia Jev               | Mantener provisionalmente, con prueba     | Preinterpretación no medida                                          | I3, A3            |
| L2  | Conservación de emojis                     | Mantener                                  | Verificable mecánicamente                                            | A3                |

### 2.2. Detalle por decisión

**Decisión 1 — Estimaciones independientes.**

- *Se sostiene.* Un `boolean` devuelve solo `probability`, sin `confidence` [E: Vercel Decision]. Las preguntas de una petición se evalúan de forma aislada [E-h: TS-intro]. No hay que renormalizar [E-h: AISDK-typesafe]. Es la primitiva adecuada para lecturas que pueden coexistir, y separar ausencia de cero es imprescindible cuando hay rechazos por pregunta.
- *Supuestos débiles y riesgos.*
  - Contradice la semántica aprobada de los resultados y `mission.md` §4.2 (B1).
  - Dos lecturas opuestas pueden salir altas a la vez, porque cada pregunta se evalúa aislada [E-h: `jev.md` §7.1]. Rechazar una tabla rígida de incompatibilidades es correcto, pero falta una regla de **presentación** para la tensión. Con «Haz lo que quieras 🙃», una lectura literal y otra sarcástica a 0,7 aparecerían como dos versiones compatibles (C8).
  - Ordenar «la más probable» entre preguntas distintas supone que todas están igual de calibradas [H]. Con una variación entre repeticiones del orden de 0,01 [E-h: TS-consistency], dos lecturas a 0,52 y 0,51 se intercambian entre ejecuciones; un entero exacto sugiere más precisión de la que existe [I].
  - Quien vea 81 %, 65 % y 40 % en una lista probablemente lo leerá como un reparto [H]. Se comprueba en 007 con pocas personas, como el experimento E7 de `jev.md`.
- *Dependencias ocultas.* Componentes de 002 (B1). Estadísticas de 010: «most common interpretation» (`roadmap.md` §13) necesita una definición nueva con lecturas independientes.

**Decisión 2 — Nueve señales.**

- *Se sostiene.* IDs neutros, versionados e independientes del copy. Retirar `unclear` e `insufficient_context` como categorías: abstenerse no es una lectura.
- *Supuestos débiles.* Tres huecos (I1): la lectura literal se limita al permiso; no hay enfado ni molestia; la lista plana mezcla función, afecto, tono y estilo, y la interfaz presenta cada elemento como una «versión» equivalente. Además, la cuarta versión del fixture aprobado, «Prefiere no hablarlo por aquí» (`src/design-lab/fixtures.ts` l. 60–66), no corresponde claramente a ninguna señal.
- *Cuándo.* Ahora: cambiar un ID antes de implementarlo no cuesta nada; después exige una `taxonomyVersion` nueva y migrar el historial de 009.

**Decisión 3 — Capas.**

- *Se sostiene.* Política pura y sin SDK; contratos distintos para decidir y para redactar. Además, guardar `DecisionSignals` (no texto) permite ejecutar políticas nuevas sobre señales antiguas sin repetir peticiones, algo útil para 012 [I].
- *Supuestos débiles.* El esquema no dice quién orquesta ni dónde entra la traducción («preparación lingüística… en los límites apropiados», registro §D). Si 005 define `DecisionProvider` con el texto original y 006 traduce dentro del adaptador de Jev, se incumple que la traducción sea independiente del proveedor (`roadmap.md` §9 l. 403). Si 005 exige texto en inglés, el dominio deja de ser agnóstico al idioma. La solución está en A3 (decorador). Tampoco dice que el redactor queda fuera del núcleo compartido con MCP (I9).

**Decisión 4 — Estados.**

- *Se sostiene.* Errores fuera de los estados; `needs_context` como resultado válido (`mission.md` §4.5); `low_confidence` no es un estado.
- *Supuestos débiles.*
  - Los «fallos seguros» quedan [PENDIENTE] (registro §E, l. 178) justo donde más importan (B4).
  - El «orden conceptual de conducta» todavía no es una regla de precedencia (B3).
  - Los resultados parciales solo existen si 006 usa HTTP: el AI SDK convierte cualquier rechazo en un error de toda la llamada, y el formato del rechazo en `/v1/evaluate` no está documentado [E-h: `jev.md` §3.4]. Conviene representar la ausencia en 005, que es barato, sin diseñar todavía políticas finas para resultados parciales.
  - La interfaz distingue solo tres errores: `offline`, `service` y `unexpected` (`src/components/sofi/ErrorState/ErrorState.tsx` l. 8) [E]. Al dominio le basta un conjunto pequeño de códigos y un indicador `retryable` para el botón «Reintentar». Encaja con «no definir hoy una jerarquía exhaustiva».

**Decisión 5 — Suficiencia sin expediente.**

- *Se sostiene.* Es una garantía estructural frente al anclaje en el perfil (`jev.md` §8.4–8.5). Descartar reglas por longitud es correcto.
- *Supuestos débiles.*
  - Tres niveles a partir de un `boolean` exigen cortes (B2). Un `score` daría niveles, pero «its score levels are weak in numerical calibration» [E: TS-jagged], y un `choice` se inclina hacia la primera opción [E: TS-jagged].
  - La pregunta de ejemplo de `jev.md` §8.7 (l. 441), «beyond the literal words», marcaría como insuficientes los mensajes explícitos (B3). Es una propuesta [P] de una revisión anterior, no una decisión aprobada.
  - `missingInformation` requiere preguntas auxiliares adicionales: conviene que sea opcional.
- Las dos peticiones tienen un coste despreciable [E-h: `jev.md` §4.3].

**Decisión 6 — Sin confianza global.**

- *Se sostiene íntegramente.* El `boolean` no tiene `confidence` [E: Vercel Decision], y la `confidence` de TypeSafe mide concentración, no fiabilidad [E-h: TS-confidence]. La interfaz ya admite una confianza opcional (`src/components/sofi/Interpretations/Interpretations.tsx` l. 171) [E].
- *Restos que limpiar.* `tech-stack.md` §29 y §42.4; `ReadingView` exige `confidence` (`src/features/consultation/screens/ResultScreens.tsx` l. 87; se rehará en 007); `roadmap.md` §13 l. 590 (B5).

**Decisión 7 — Redactor.**

- *Se sostiene.* La objeción a las plantillas es real para la propuesta de valor. El registro reconoce que el prompt no garantiza la fidelidad [E-h: LIT-turpin], y el contrato está separado del proveedor de decisiones.
- *Supuestos débiles.* Alcance contradictorio con la constitución; «controles de fidelidad» sin mecanismo; explicaciones y pistas aprobadas que atribuyen causas que Jev no da; un PoC con un contrato obsoleto (I4). Será el mayor coste variable [I] y su ruta de acceso no está decidida (I6). En seguridad, introduce texto generativo justo donde un error es más grave (A5).
- *Riesgo de experiencia.* La cadena traductor → Jev → redactor acumula latencias que nadie ha medido [H], y validar antes de mostrar impide el streaming (A6).

**Decisión 8 — Versiones.**

- *Se sostiene.* Es barato y necesario para 010–012.
- *Matices.* Por AI Gateway solo se conoce el alias de Jev: la respuesta de ejemplo devuelve `"model": "typesafe-ai/jev"` y el catálogo no muestra versiones [E]. TypeSafe directo sí informa de la versión exacta [E]. Desde el 2026-10-14 existe `jev-1.14.0` (I7). La procedencia debe distinguir también al proveedor `fake` (M2).

**Decisión 9 — Expediente.**

- *Se sostiene la minimización.* Enviar solo respuestas concretas reduce el contenido ajeno a la decisión, que degrada a Jev: «Accuracy falls as the state grows with content unrelated to the decision» [E: TS-jagged].
- *Supuestos débiles.*
  - La fricción recae sobre el dato menos sensible (seis respuestas categóricas), mientras el más sensible —texto libre sobre una tercera persona, con posibles datos del artículo 9 del RGPD [E-h: `jev.md` §5.4]— sale siempre hacia dos o tres encargados de tratamiento con un simple aviso (A7).
  - `profileUsed` necesita una semántica precisa (I2).
  - Seleccionar las respuestas concretas es lógica pura que cliente y servidor deben compartir; su sitio es el dominio (005).

**Decisión 10 — Seguridad.**

- *Se sostiene.* Separar el respeto de los límites de `safety_concern`; no usar una lista ingenua de palabras como único detector; no prometer infalibilidad.
- *Supuestos débiles.* Falla en abierto (B4). Un único indicador no permite responder bien según quién esté en riesgo; no contempla el riesgo de la propia persona usuaria ni el peligro de la persistencia local en un caso de control coercitivo, y no hay una pantalla aprobada (I5).

**L1 y L2 — Traducción y emojis.**

- *L1.* El motivo es real: «English is the primary training language and where accuracy is currently best» [E: TS-models]. Pero nadie ha medido que traducir mejore más de lo que distorsiona, y un traductor LLM es una preinterpretación invisible (I3). Se mantiene como opción por defecto, condicionada a una prueba (A3).
- *L2.* Es correcto y comprobable: el multiconjunto de grafemas emoji debe ser idéntico antes y después, comprobable con `Intl.Segmenter` [I]. Con Azure, `class="notranslate"` protege segmentos [E].

---

## 3. Hallazgos priorizados

### 3.1. Bloqueantes (resolver antes de redactar `005-spec.md` o en su redacción)

#### B1 — La semántica de los números contradice la interfaz aprobada y `mission.md` §4.2

- **Problema.** La decisión 1 define estimaciones independientes que no suman 100 %. El Design System de 002 y la misión describen un reparto entre versiones que compiten.
- **Evidencia [E].**
  - `src/components/sofi/types.ts` l. 10–11: «Apoyo relativo entre las versiones consideradas, de 0 a 100».
  - `src/components/sofi/ReadingBoxes/ReadingBoxes.tsx` l. 62–63: «Los porcentajes reparten el apoyo entre estas {count} versiones…».
  - `src/components/sofi/Interpretations/Interpretations.tsx` l. 69–80: «Reñido (34 contra 33)», «empate técnico», «La más probable (no la única)».
  - `src/design-lab/fixtures.ts` l. 28–66: 52 + 24 + 15 + 9 = 100.
  - `mission.md` §4.2 l. 94: «entre las interpretaciones consideradas […] esa opción recibe mayor apoyo».
  - `jev.md` §7.1 ya lo anticipaba («cambia el significado que `mission.md` §4.2 da al porcentaje»), y §12 sitúa ese significado en `005-spec.md`.
- **Por qué bloquea.** `AGENTS.md` («Visual and layout decisions») obliga a parar y preguntar cuando las decisiones se contradicen, y establece que el Design Lab nunca prevalece sobre los requisitos funcionales. Además, la regla de reutilización de componentes empujaría a 007 a reutilizar `FinePrint` e `InterpretationLead` tal cual: con un texto que diría «reparten el apoyo» junto a cifras que suman 186 %.
- **Recomendación.**
  1. Confirmar de forma explícita que la decisión 1 prevalece [DP].
  2. Reescribir `mission.md` §4.2 con el significado nuevo: el apoyo del modelo a un enunciado concreto, no un reparto.
  3. Registrar en `spec/constitution/art-direction/README.md` un rediseño pendiente para 007 de la letra pequeña, «Reñido»/«empate técnico» y el orden por «Versión N».
  4. En 005, definir el número como apoyo en [0, 1] a un enunciado y excluir del dominio el concepto de empate. Si 012 lo justifica, podrá sustituirse por «tensión entre lecturas opuestas».
- **Cuándo.** Antes de redactar la spec (1 y 2); en 005 (4); en 007 (3).

#### B2 — Una política sin umbrales, tal como está, no puede decidir

- **Problema.** El registro pide a 005 una «política inicial mínima sin umbrales arbitrarios» y reserva los umbrales para 012 (registro §D l. 150; §N l. 464 y 468; `roadmap.md` §15 l. 700). Pero `interpreted`, `needs_context`, `safety_concern` y la decisión de qué lecturas se comunican exigen comparar probabilidades continuas con un corte, o usar un argmax, que es un corte implícito [I]. Y como 007 llega antes que 011 y 012 en el roadmap, la experiencia pública funcionará con cortes no evaluados de todos modos; ahora mismo nadie es responsable de fijarlos. El propio Design Lab lo deja abierto: «El umbral de “reñido” sigue abierto» (`src/design-lab/sections/PropPlaygrounds.tsx` l. 629) [E].
- **Por qué bloquea.** Sin resolverlo, los criterios de aceptación de los estados no son verificables, o la spec acabará incluyendo números mágicos sin decirlo.
- **Recomendación (A2).** Definir la política como una función pura parametrizada por un `PolicyConfig` versionado, con cortes con nombre propio (apoyo mínimo para comunicar una lectura, corte de suficiencia y corte de seguridad deliberadamente bajo).
  - En 005: la estructura y tests relativos a los parámetros, sin fijar valores reales.
  - En 006: valores provisionales a partir de los experimentos E2 y E3 ya previstos en `jev.md` §11, marcados como provisionales en `policyVersion`.
  - En 012: sustituirlos por valores basados en 011.
  - La asimetría de costes en seguridad es una [DP].
  - Efecto secundario útil: la misma configuración da bandas de apoyo por lectura para la interfaz y el redactor (M5).
- **Cuándo.** 005 (estructura), 006 (valores provisionales), 012 (valores evaluados).

#### B3 — `needs_context` taparía los mensajes explícitos

- **Problema.** La regla natural «suficiencia insuficiente ⇒ `needs_context`» pediría contexto ante un «no» explícito. La pregunta de ejemplo de `jev.md` §8.7 (l. 441) pregunta si hay información para juzgar lo que quiso decir «beyond the literal words»; para «No quiero que vengas hoy» sin contexto, la respuesta sería «no». Jev «answers the question you wrote, not the one you meant» [E: TS-jagged]. Sin embargo, la propia tabla de la decisión 5 dice «límite explícito reconocible» para ese caso y «reconocer lo explícitamente dicho» para «Estoy triste porque te echo de menos» (registro §F, l. 197–204), y la decisión 10 obliga a respetar los límites explícitos.
- **Impacto.** Sofi respondería «Dame contexto» ante un «no» claro: contradice las decisiones 5 y 10 y suena absurdo.
- **Recomendación.**
  - En 005:
    - (a) Una regla de precedencia: `safety_concern` > límite o petición de espacio comunicable > `needs_context` > `interpreted`. Un límite comunicable nunca queda oculto tras «necesito contexto»: respetar un «no» no requiere más contexto, y si la lectura fuera errónea el coste es bajo.
    - (b) Generalizar la lectura literal (I1a) para que lo explícito tenga una lectura comunicable.
  - En 006: (c) formular la pregunta de suficiencia de modo que un mensaje explícito cuente como suficiente.
  - Alternativa descartada: añadir una décima señal auxiliar `explicit_statement`; supone más preguntas y no hace falta con (a) y (b).
- **Cuándo.** 005 (a, b); 006 (c).

#### B4 — La seguridad falla en abierto

- **Problema.** Si el contrato modela la seguridad como `safety?: boolean`, «no evaluado» equivale a «sin riesgo».
  - El AI SDK convierte cualquier rechazo en un error de toda la llamada, y en `/v1/decisions` puede haber rechazos por pregunta [E-h: `jev.md` §3.4].
  - Un traductor LLM podría negarse a traducir o filtrar contenido violento o sexual [H]; Azure, por defecto, no filtra (`profanityAction=NoAction`) [E].
  - La interfaz solo distingue tres tipos de error, sin ninguno para seguridad [E].
- **Impacto.** Los mensajes con más probabilidad de provocar rechazos (amenazas, autolesión) son precisamente los casos de `safety_concern`. Si fallan, la persona ve «Se ha cortado la línea» en lugar de una respuesta de seguridad [I].
- **Recomendación.**
  - Un tri-estado en el contrato: `concern`, `no_concern_detected` y `not_evaluated`.
  - `not_evaluated` nunca habilita una presentación humorística ni un `interpreted` normal.
  - Un rechazo del proveedor en la pregunta de seguridad cuenta como `not_evaluated`, nunca como una ausencia que se puede ignorar.
  - Qué hace la política en ese caso es una [DP]. Recomendación: un resultado prudente, o un fallo con copy neutra que incluya una línea discreta de recursos.
  - Tests con el fake en 005.
- **Cuándo.** Tipos y reglas en 005; copy en 007; detección en 006 y 011.

#### B5 — Las fuentes de verdad describen todavía el modelo anterior

El registro se declara no normativo (l. 5) y `AGENTS.md` no lo menciona: hasta que se propague, ningún agente está obligado por las decisiones 1–10. Su lista §N (l. 474–483) cubre parte de la reconciliación. Faltan estos puntos [E]:

| Documento                 | Lugar                     | Contradicción                                                                                                                                                     |
| ------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tech-stack.md`           | §29 l. 1008–1010          | `status: "success" \| "needs_context"` y `confidence` obligatoria (decisiones 4 y 6)                                                                                 |
| `tech-stack.md`           | §42.4 l. 1418–1429        | Escenario de MSW `low_confidence` (decisión 4); falta `safety_concern`                                                                                             |
| `tech-stack.md`           | §45 l. 1598–1607          | Estados de interfaz sin `safety_concern`                                                                                                                           |
| `tech-stack.md`           | §26 l. 880–888 y §26.1 l. 918 | Alcance del redactor más estrecho que la decisión 7 (I4)                                                                                                        |
| `tech-stack.md`           | §69 l. 2521               | «El único gasto aceptado es el consumo del proveedor de decisiones», frente a `mission.md` §12 l. 361 (el redactor es un segundo coste). La traducción no está cubierta |
| `tech-stack.md`           | §40 l. 1272               | «No existirán dos implementaciones del traductor»: aquí «traductor» designa al intérprete de mensajes; ahora existe un traductor ES→EN real                           |
| `roadmap.md`              | §8 l. 343–371             | Taxonomía antigua, `unclear`, `confidence`, `tone`, `indirectness`, `emotional needs`                                                                              |
| `roadmap.md`              | §9 l. 409–426             | Esquema antiguo de 006 (tone, literalness, likely need…)                                                                                                           |
| `roadmap.md`              | §13 l. 590                | «most frequent confidence range» (010)                                                                                                                             |
| `roadmap.md`              | §14 l. 668                | «confusion matrix» de una sola etiqueta; con lecturas independientes, métricas por señal                                                                           |
| `roadmap.md`              | §15 l. 695–697            | «confianza demasiado baja» e «interpretaciones demasiado igualadas»: con lecturas independientes, que dos estén igualadas no indica ambigüedad                      |
| `mission.md`              | §4.2 l. 92–94             | B1                                                                                                                                                                 |
| `005-spec.md` (borrador)  | Todo                      | Taxonomía antigua, `unclear`, campos de tono, indirectividad y necesidades, confianza global                                                                       |

**Recomendación.** Aplicar la reconciliación —la lista §N del registro más estos puntos— antes o a la vez que `005-spec.md`. No son decisiones nuevas: es llevar las aprobadas a su sitio.

### 3.2. Importantes (resolver en la spec o antes de 006/007)

#### I1 — Taxonomía: tres ajustes antes de congelar los IDs (A1)

- **(a) `literal_permission` es demasiado estrecho.** Los mensajes canónicos de la misión —«No pasa nada», «Estoy bien», «Da igual» (`mission.md` §2 l. 27–32)— tienen una lectura literal benigna que no es un permiso [I]. El ejemplo de `jev.md` §8.7 ya usa la literalidad general (`readingLiteral`, l. 455–457), y el fixture aprobado incluye «Le parece bien, sin más… Puede que lo diga literalmente» (`fixtures.ts` l. 53–58) [E]. Propuesta: `literal_meaning`, «el mensaje significa lo que dice, sin nada importante sin decir», conservando la precaución de no inferir permiso ante un «no». Esto resuelve además B3 (b).
- **(b) No hay enfado ni molestia** [DP]. Los propios materiales del proyecto los necesitan: «Esto tiene bastante pinta de que le ha molestado» (`mission.md` §1 l. 13), «le ha sentado regular» (`fixtures.ts` l. 13), irritación en los casos T06/E10 del PoC y frustración (😤) en E09 [E]. La decisión 2 dice que la decepción «no equivale automáticamente a enfado»: reconoce un concepto distinto que no tiene ID. Sin él, Sofi no puede ni sostener ni descartar la duda más frecuente («¿está enfadada?»), y el redactor tenderá a cubrir el hueco, que es justo lo que prohíbe la historia E [I]. Propuesta: `expressing_annoyance`. Inconveniente: solapa con la decepción en la presentación, aunque la estimación independiente lo tolera.
- **(c) La lista mezcla dimensiones** [DP]. El registro descartó los campos paralelos `tone` e `indirectness` para no duplicar evidencia, pero metió esas dimensiones en la lista plana. La interfaz presenta cada señal como «Versión N» con título y porcentaje: «Versión 2 — tono sarcástico» dice *cómo*, no *qué*, y `indirect_hint` solo deja la pregunta «¿una indirecta de qué?». Propuesta: un atributo `kind` en el catálogo, `reading` (qué quiere decir: función o afecto) o `cue` (cómo lo dice: `sarcastic_tone`, `playful_teasing`, `indirect_hint`). Las segundas se mostrarían como matices de las primeras. Coste: un campo.
- **Cuándo.** 005.

#### I2 — Dos peticiones: qué lecturas cuentan y qué significa `profileUsed`

- **Problema.** En `jev.md` §8.7, la petición A (sin expediente) incluye suficiencia, seguridad y lecturas, y la B (con expediente) solo lecturas. Con el expediente activado hay dos conjuntos de lecturas y el registro no dice cuál se muestra. Calcular ambos sin usarlos cuesta tiempo; mostrar los dos produce contradicciones.
- **Recomendación.**
  - `DecisionSignals` contiene un único conjunto autoritativo de lecturas: el de B si se usó el expediente, el de A en caso contrario.
  - Las señales auxiliares (suficiencia, seguridad e información que falta) salen siempre de la petición sin expediente.
  - La comparación con y sin expediente pertenece a 011, no a cada consulta.
  - `profileUsed` es `true` solo si se envió al menos una respuesta concreta. Si el interruptor está activado pero solo hay «No lo sé», «Depende» o áreas sin responder, es `false` (C9).
- **Cuándo.** 005.

#### I3 — La traducción obligatoria es una preinterpretación no medida

- **Problema.** Traducir pragmática coloquial obliga a elegir: «Vale.» puede ser «Okay.» o «Fine.»; «Tú sabrás», «Your call» o «Suit yourself»; marcadores como «pues», «ya», «anda» o «venga» no tienen un equivalente estable [I]. El propio PoC pide parafrasear los modismos «manteniendo el tono» (`evals/llm-redactor/prompts.ts`, regla 5 del prompt de traducción), es decir, interpretar. Y anota que «🙂 en contexto de tensión es el marcador de sarcasmo» (`cases.ts`, caso T04), justo lo contrario de la decisión 2 [E]. Un traductor LLM es exactamente el «LLM que vuelve a analizar el mensaje» que descartan las decisiones 3 y 7, colocado antes de Jev e invisible para la persona usuaria y para la política [I].
- **Evidencia del beneficio.** Jev rinde mejor en inglés [E: TS-models], pero no se publican cifras para otros idiomas [E] ni hay comparación con lo que se pierde al traducir. E2 de `jev.md` compara el idioma de las *instrucciones*, no el del *estado* [E-h].
- **Riesgos adicionales de un traductor LLM** [H]:
  - Una inyección en el mensaje o el contexto («ignore previous instructions…») puede alterar lo que recibe Jev.
  - Un rechazo o un filtrado ante contenido violento o sexual podría pasar como «traducción» (ligado a B4).
- **Recomendación (A3).** No reabrir L1 como decisión de producto, pero someterla a una prueba:
  1. En 005, un puerto de proveedor independiente del idioma.
  2. En 006, la traducción como decorador sustituible por un paso neutro.
  3. Antes de fijarla en producción, comparar el estado en español, en inglés y en ambos idiomas sobre los escenarios de E1.
  4. Validar la salida (emojis, sin texto añadido, proporción de longitud, idioma) y fallar cerrado si no pasa.
- **Cuándo.** 1 en 005; el resto en 006.

#### I4 — Redactor: alcance, fidelidad y PoC

- **Alcance contradictorio [E].** `tech-stack.md` §26 (l. 880–888) deja el «copy de presentación» y las «recomendaciones» bajo control de Ask Sofi, y §26.1 (l. 918) limita el redactor a «las explicaciones de cada interpretación»; `roadmap.md` §10 (l. 493) dice lo mismo. El registro (§H) describe en cambio una respuesta completa («mejor preguntarlo», «reparar el cambio de planes»). La pantalla aprobada tiene cinco textos variables: el discurso de Sofi (`fixtures.ts` `SPEECH.answer`), el título y la explicación de cada versión, las pistas, el consejo (`ADVICE`) y las preguntas de contexto.
  - Si el redactor solo escribe explicaciones, el discurso —lo más visible— seguirá saliendo de plantillas y persistirá la repetición que motivó la decisión 7.
  - Si escribe también el discurso y el consejo, el contenido de mayor riesgo (el consejo) pasa a ser generativo, y hay que cambiar §26 y §26.1 [I].
  - Es una [DP] para 007.
- **Racionalización a posteriori** [I, apoyada en E-h: LIT-turpin]. Las explicaciones aprobadas atribuyen la lectura a rasgos del texto («El punto final y la falta de emojis encajan con esta lectura», `fixtures.ts` l. 30–31; pistas «Punto final» y «Sin emojis»), pero Jev no devuelve motivos. Un redactor que conecte pistas con porcentajes inventará una causalidad. Recomendación: presentar las pistas como observaciones comprobables («lo que veo»), calculadas en código sobre el original (M3), y nunca como «por qué lo cree Sofi».
- **Fidelidad sin mecanismo.** La rúbrica debe distinguir tres cosas:
  - (a) repetir hechos del contexto: permitido;
  - (b) relacionar con cautela una lectura autorizada con un hecho del contexto: permitido;
  - (c) añadir causas, motivos o lecturas nuevas: prohibido.

  El fixture aprobado ya hace (b) («Contaba con esa comida») [E]; una regla demasiado estricta lo prohibiría.
- **PoC desalineado [E].** `evals/llm-redactor/cases.ts` usa `primary_reading`, `secondary_readings`, `confidence_level: dominant | tied | spread`, `context_sufficiency: low | medium | high` y `safety_flag`. La rúbrica considera fallo crítico «elegir una lectura cuando las señales marcaban tied/spread». Contradice las decisiones 1, 4, 5 y 6: aunque llegara a ejecutarse, no validaría el diseño aprobado. Hay que actualizarlo antes de gastar en llamadas.
- **Cuándo.** El alcance y la rúbrica, en 007. El contrato del PoC, antes de cualquier ejecución real.

#### I5 — Seguridad: más allá del fallo cerrado

- **Tipos según quién está en riesgo** [I]. La respuesta adecuada cambia si el riesgo es para la persona usuaria (amenaza, violencia o control), para la pareja (amenaza de autolesión, H26) o para la propia persona usuaria por ideación suicida escrita en el contexto, un caso que no figura en H01–H30. Un único booleano no permite elegir ni el copy ni el recurso. Recomendación: un tipo extensible con dos o tres categorías mínimas [DP].
- **Copy fija y revisada (A5).** Sin humor, sin porcentajes sentimentales, sin typewriter con sonido de voz y sin sprites cómicos. Recursos oficiales verificados [E]:
  - 112, emergencias.
  - 016: gratuito y confidencial, con WhatsApp en el 600 000 016; los fabricantes de móviles han incorporado funciones para que la llamada no quede en el registro de llamadas.
  - 024: gratuito, confidencial y disponible las 24 horas, también para familiares y allegados.

  Dar recursos no es «prometer asistencia profesional» (registro §K, l. 345).
- **La persistencia local en un caso de control coercitivo** [I]. «Me controla el móvil» (H25) implica que la pareja puede ver el dispositivo. El borrador y el contexto viven en `sessionStorage` (003), y el historial de 009 también quedaría a la vista. El propio servicio 016 se ocupa de no dejar rastro en el registro de llamadas [E]. Recomendación: no guardar automáticamente en el historial un resultado `safety_concern` y ofrecer una acción visible para borrar la consulta.
- **Dirección de arte.** No hay pantalla aprobada para seguridad, y el marco de revista («Exclusiva», «Última hora», «¡Falta el salseo!», `ResultScreens.tsx` l. 139 y 220–227) es incompatible con ella. `AGENTS.md` obliga a preguntar antes de decidirla.
- **Umbral asimétrico.** Un falso negativo cuesta más que un falso positivo; con un copy proporcionado («si esto va en serio…»), un umbral bajo se tolera mejor [DP]. Encaja en B2.
- **Cuándo.** Las categorías en 005, o al menos un tipo extensible; el resto en 007, 009 y 011.

#### I6 — Ruta de proveedores, coste y lo que dice el 429

- **Catálogo [E].** `mistral/mistral-small` «currently runs Mistral Small 4» y lo sirve un único proveedor, `mistral`, con `has_zdr: true` y `has_no_training: true`; cuesta 0,15 $/M tokens de entrada y 0,60 $/M de salida, y admite `response_format` y `structured_outputs`. En todo el catálogo solo tres modelos llevan la etiqueta `free` (dos de Laya y uno de poolside).
- **Incoherencia de ruta.** `tech-stack.md` §27 sitúa el acceso a modelos en AI Gateway, y `jev.md` §9 ya advertía que llamar a un proveedor directamente es «algo que `tech-stack.md` §27 no prevé». Aun así, el candidato a redactor se probó contra la API directa de Mistral (`evals/llm-redactor/runner.ts` l. 28–29) [E].
- **Consolidar el redactor, y cualquier traductor LLM, en AI Gateway (A4)** aporta:
  - una sola clave y un solo mecanismo de presupuesto, por clave o por proyecto, con tope blando [E-h: `jev.md` §4.3];
  - un solo control de no entrenamiento, `disallowPromptTraining` [E-h];
  - el mismo régimen de ZDR, que para exigirse requiere Pro o Enterprise [E];
  - una sola credencial para quien use el MCP autoalojado (`roadmap.md` §17 l. 750) [I].

  Inconvenientes: no hay nivel gratuito; solo existe el alias `mistral/mistral-small`, sin una versión fija como `mistral-small-2603` en el catálogo [I]; y aumenta la dependencia de Vercel, aunque AI Gateway es una API HTTP que se puede llamar desde cualquier alojamiento [I].
- **El 429.** `evals/llm-redactor/results/probe-2026-10-14T19-04-46.json` registró `x-ratelimit-limit-req-minute: "0"` y `x-ratelimit-remaining-req-minute: "0"` [E]. Un límite configurado a cero apunta a que la organización no tenía asignada cuota de peticiones, no a una saturación pasajera [I]. La página de límites de Mistral no documenta esa cabecera [E]. Repetir lotes no lo arreglará.
- **Coste por análisis**, con precios del catálogo [E] y tokens supuestos [H]:

  | Paso                         | Tokens supuestos [H]        | Precio [E]                       | Coste [I]    |
  | ---------------------------- | --------------------------- | -------------------------------- | ------------ |
  | Jev (dos peticiones)         | 2 × 1.500 de entrada        | 0,042 $/M de entrada; salida gratis | ≈ 0,00013 $ |
  | Traducción con LLM (si se elige) | 400 de entrada + 150 de salida | 0,15 / 0,60 $/M              | ≈ 0,00015 $  |
  | Redactor                     | 2.000 de entrada + 500 de salida | 0,15 / 0,60 $/M             | ≈ 0,0006 $   |
  | **Total**                    |                             |                                  | **≈ 0,0009 $** (≈ 0,9 $ por 1.000 análisis) |

  El redactor supone en torno a dos tercios del coste variable y Jev, alrededor de una séptima parte [I]. El presupuesto de 007 importa más que el de 006, y el riesgo económico principal sigue siendo el abuso automatizado (`jev.md` §7.9).
- **Cuándo.** La ruta y el presupuesto, en 007; en 006, si la traducción se hace con un LLM.

#### I7 — Jev ha cambiado de versión y AI Gateway no lo muestra

- **[E] TypeSafe — Models (consultado el 2026-10-15).** `jev-1.14.0` está disponible desde el 2026-10-14. `jev-preview` apunta a 1.14.0 y `jev-latest`, a 1.13.0. Se puede fijar la versión enviando su ID, y en la API de TypeSafe el campo `model` de cada respuesta indica la versión que respondió. `jev.md` §1 (l. 49) dice que ambos alias apuntan a 1.13.0: está desactualizado.
- **[E] AI Gateway.** El catálogo y los endpoints solo muestran `typesafe-ai/jev`, y la respuesta de ejemplo de `/v1/evaluate` devuelve `"model": "typesafe-ai/jev"`. Qué versión hay detrás del alias en la pasarela no se sabe [H]; el experimento E8 sigue abierto.
- **Impacto.** Un cambio silencioso del alias puede invalidar las evaluaciones de 011 (C17). Por la pasarela, la decisión 8 solo puede registrar el alias. El conjunto canario de `jev.md` §10, punto 7, pasa de opcional a necesario.
- **Recomendación.** Actualizar `jev.md` según su propia regla de mantenimiento y resolver E8 antes de 006. Comprobar si el endpoint compatible con TypeSafe de la pasarela devuelve la versión [H].
- **Cuándo.** Antes de 006.

#### I8 — Lo que «probabilidad ganada» exigirá a 011

- **Problema** [I]. Con nueve o diez señales, varias etiquetas posibles por mensaje y un conjunto en español etiquetado a mano (E1 de `jev.md`), calibrar cada señal requiere muchos ejemplos positivos por señal y por tramo de probabilidad. Unas etiquetas tan subjetivas requieren además al menos dos anotadores y una medida de acuerdo entre ellos. `roadmap.md` §21 (l. 953) exige un «calibration analysis» para la v1, mientras que la decisión 1 añade «si es viable».
- **Riesgo.** Llegar a 012 con un «no es viable» cuando las cifras llevan visibles desde 007.
- **Recomendación.** Fijar pronto un listón de evidencia alcanzable: Brier por señal frente a la tasa base, fiabilidad en tres tramos gruesos y acuerdo entre anotadores. Mientras no se alcance, mostrar bandas gruesas (B2, M5). Reformular las métricas de `roadmap.md` §14 por señal.
- **Cuándo.** En 011, pero acotando el conjunto de datos antes de los experimentos de 006.

#### I9 — Límites del núcleo compartido: orquestación y MCP

- **Problema.** `tech-stack.md` §40 y `roadmap.md` §17 hacen de `interpretMessage()` el núcleo compartido, pero `005-spec.md` debe fijar sus límites: validación de la entrada y minimización (funciones puras del dominio) → puerto del proveedor (con la traducción como decorador en 006) → validación de la salida → política → `AnalysisResult`.
- **El redactor queda fuera.** En MCP, quien verbaliza es el LLM del cliente; exigir el redactor duplicaría coste y credenciales [I].
- **Semántica autodescrita.** La salida para MCP debe explicar qué significa cada número (apoyo a un enunciado, no probabilidad de que sea verdad) y definir la taxonomía; si no, el LLM del cliente puede convertir 0,8 en «80 % de que esté decepcionada» [H].
- **Inyección.** En MCP el texto puede venir de terceros, lo que aumenta el riesgo de inyección [E-h: `jev.md` §8.5].
- **Cuándo.** Los límites, en 005; el detalle, en 014.

### 3.3. Mejoras opcionales

| ID  | Mejora                                                                                                                                                                                                                                                                                                                                         | Cuándo          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| M1  | **Jev como verificador del redactor y juez de las evaluaciones** (A6).                                                                                                                                                                                                                                                                         | 007 y 011       |
| M2  | **Salvaguardas del fake.** Que la procedencia indique `provider: 'fake'`; que el módulo no entre en el bundle de producción (la comprobación existente de MSW y Design Lab sirve de modelo, `art-direction/README.md`, «Producción»); que nunca actúe como reserva al agotarse el presupuesto (registro L5).                                     | 005             |
| M3  | **Observaciones como funciones puras.** Punto final, emojis (grafemas con `Intl.Segmenter`), longitud, mayúsculas y risas («jaja»), calculadas sobre el texto original en español: hechos, no interpretaciones. Alimentan las «pistas» y el redactor, y no dependen de la traducción.                                                              | 005 o 007 [DP]  |
| M4  | **Un identificador de configuración compuesto** (esquema, taxonomía, política y configuración del proveedor) para la clave de caché (`tech-stack.md` §39, «analysis version») y el historial.                                                                                                                                                  | 005 o 009       |
| M5  | **Bandas de apoyo para la interfaz y el redactor.** La política (B2) puede producir una banda por lectura —baja, media o alta— con los cortes de la configuración. La interfaz muestra cifras gruesas; el redactor recibe bandas y un vocabulario de cautela permitido, no números. Protege la regla «no recalcula probabilidades» y la franqueza de Sofi: el prompt del PoC pide condicionales siempre que no haya una lectura «dominante», lo que llevaría a matizar cada frase. No es la confianza global prohibida por la decisión 6: es por lectura y provisional. | 005 (estructura) y 007 |
| M6  | **Higiene documental.** El nombre del registro no coincide con el de su cabecera. Las fuentes «Markdown pegado(n).md» no están en el repositorio, lo que deja un hueco de trazabilidad en un proyecto abierto. El anexo P dice que el PoC no se inspeccionó (aquí sí se ha hecho). La copia de trabajo de `tech-stack.md` ha ganado un BOM UTF-8 (bytes `EF BB BF`, ausente en `HEAD`) [E]. | Cuando convenga |
| M7  | **Concordancia de género en el redactor.** El español obliga a concordar («decepcionada» o «decepcionado»). La rúbrica B5 del PoC prohíbe «él» y «ella», y los fixtures usan construcciones impersonales («Le ha sentado regular»). Hay que decidir si Sofi refleja el género que usa la persona usuaria o neutraliza siempre. E5 de `jev.md` prueba cambios de género en Jev, no en el redactor. | 007 [DP]        |
| M8  | **Edad mínima.** No hay control de edad; las parejas adolescentes son un público plausible, y los términos de los proveedores pueden fijar una edad mínima [H, no verificado].                                                                                                                                                                 | 013 o 017       |

### 3.4. Dependencias ocultas

| Dependencia                                 | Qué determina en realidad                                                                                 | Dónde           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------- |
| Semántica de 002 (letra pequeña, «Reñido», «Versión N») | Si las cifras pueden mostrarse sin faltar a la verdad                                          | B1              |
| Transporte de 006 (AI SDK o HTTP)           | Si existen resultados parciales                                                                           | Decisión 4      |
| Plan Hobby y experimento E0                 | Si se aplica ZDR y si se pueden fijar presupuestos: condiciones de `mission.md` §12                         | `jev.md` §4.3, §5.1 |
| Alias de Jev en AI Gateway                  | Si 011 evalúa lo mismo que se ejecuta en producción                                                       | I7              |
| Ruta del redactor                           | Mecanismo de presupuesto, credenciales del MCP y retención de datos                                       | I6              |
| Historial de 009                            | Riesgo para la persona usuaria en un caso de control coercitivo                                           | I5              |
| Versionado (decisión 8)                     | Si las estadísticas de 010 son comparables                                                                | Decisión 8      |
| Conjunto de datos de 011                    | Si los umbrales de 012 son alcanzables                                                                    | I8, B2          |
| Traductor                                   | Qué ve Jev realmente y si la seguridad depende de él                                                      | I3, B4          |

### 3.5. Complejidad: dónde sobra y dónde falta

- **Sobra, o todavía no hace falta:**
  - políticas finas para resultados parciales antes de elegir el transporte;
  - una jerarquía exhaustiva de errores (de acuerdo con el registro);
  - un `missingInformation` obligatorio;
  - la ceremonia del opt-in en cada consulta (A7);
  - un tercer proveedor si la prueba de L1 no lo justifica.
- **Falta:**
  - una precedencia entre estados;
  - el tri-estado de seguridad;
  - una configuración de política versionada;
  - una regla para presentar lecturas en tensión;
  - un mecanismo de fidelidad para el redactor.
- **Balance.** La 005 puede seguir siendo pequeña: tipos y esquemas Zod (ya en uso: `src/domain/partner-profile/partnerProfileSchema.ts` importa `zod/mini`) [E], el catálogo de la taxonomía, una política pura con configuración, la función de minimización y el fake. Sin dependencias nuevas.

---

## 4. Alternativas justificadas

Solo se incluyen las que aportan una mejora demostrable. Para cada una: problema, alternativa, inconvenientes, impacto y recomendación.

### A1 — Ajustar la taxonomía antes de congelarla (I1)

- **Problema.** La lectura literal se limita al permiso; falta el enfado; la lista mezcla dimensiones.
- **Alternativa.** `literal_meaning` en lugar de `literal_permission`; `expressing_annoyance`; atributo `kind` (`reading` o `cue`).
- **Inconvenientes.** Diez preguntas en lugar de nueve, con coste despreciable [E-h]. Posible solape entre enfado y decepción en la presentación. Un cambio sobre IDs ya aprobados.
- **Impacto.** Cubre los mensajes canónicos de la misión, resuelve parte de B3 y evita que el tono aparezca como «versión».
- **Recomendación.** Adoptar el primer y el tercer cambio. El segundo es una [DP]; se recomienda.

### A2 — Política parametrizada y versionada (B2)

- **Problema.** No se puede decidir sin cortes, y 007 llega antes que 012.
- **Alternativa.** Una función pura con un `PolicyConfig`; valores provisionales fijados en 006 con E2 y E3; valores evaluados en 012.
- **Inconvenientes.** Lo provisional tiende a quedarse para siempre. Se mitiga con la marca de provisional en `policyVersion` y con un criterio de aceptación en 012 que obligue a sustituir los valores.
- **Impacto.** Los estados se vuelven verificables y los cortes, trazables.
- **Recomendación.** Adoptar.

### A3 — Traducción como decorador, con prueba, y NMT para el paso previo a Jev (I3)

- **Problema.** Una preinterpretación no medida antes de Jev.
- **Alternativa.**
  - (a) Puerto agnóstico al idioma en 005 y decorador en 006.
  - (b) Prueba comparativa del estado en español, en inglés y en ambos.
  - (c) Para el paso previo a Jev, traducción automática neuronal (NMT, por ejemplo Azure Translator) en lugar de un LLM.
- **Hechos sobre Azure Translator [E].**
  - No guarda el texto («No-Trace» en todos los niveles de precio).
  - Nivel F0: 2 millones de caracteres al mes.
  - `profanityAction=NoAction` por defecto.
  - `class="notranslate"` con `textType=html` protege segmentos.
  - La detección automática del idioma funciona mejor con textos largos.
  - Un 403 suele indicar que se han agotado las traducciones gratuitas de una suscripción de prueba; la página de precios no dice qué ocurre al agotar F0.
- **Inferencias [I].** Un NMT no sigue instrucciones, así que no es vulnerable a la inyección de instrucciones; tampoco se «niega» a traducir; es más estable que un LLM.
- **Inconvenientes.** Puede traducir peor los modismos que un LLM [H]. Añade a Microsoft como encargado de tratamiento y requiere una suscripción de Azure. Con un LLM, en cambio, quizá mejoren los modismos [H] y, si es el mismo que redacta, habría un proveedor menos; a cambio, se asumen inyección, rechazos, variabilidad y preinterpretación.
- **Impacto.** La decisión L1 pasa a depender de evidencia, como pide `mission.md` §4.3, y si la prueba la descarta solo cambia 006.
- **Recomendación.** Adoptar (a) y (b). Para (c), preferir NMT salvo que la prueba favorezca al LLM.

### A4 — Redactor, y cualquier traductor LLM, a través de AI Gateway (I6)

- **Problema.** Hay dos cuentas, dos presupuestos y dos regímenes de datos, y la API directa de Mistral está bloqueada con un límite de cero.
- **Alternativa.** `mistral/mistral-small` por la pasarela, con `only: ["mistral"]` y `disallowPromptTraining`.
- **Inconvenientes.** Sin nivel gratuito; sin versión fija; más dependencia de Vercel.
- **Impacto.** Un único control de gasto y de privacidad; una sola credencial para el MCP; se sortea el bloqueo actual.
- **Recomendación.** Adoptar en 007, salvo que una evaluación demuestre que la versión fija importa más que la consolidación.

### A5 — Copy fija y revisada para `safety_concern` (I5)

- **Problema.** Texto generativo donde un error es más grave.
- **Alternativa.** Copy fija por categoría de riesgo, con los recursos oficiales.
- **Inconvenientes.** Menos personalización; es aceptable en una crisis.
- **Impacto.** Resultados deterministas, revisables y verificables en tests; además, un coste menor.
- **Recomendación.** Adoptar en 007.

### A6 — Jev como verificador de la fidelidad y como juez de las evaluaciones (M1)

- **Evidencia [E].** Vercel presenta los modelos de decisión para «rubric-based assessment, and automated verification». El cookbook de guardarraíles de TypeSafe revisa la salida de un LLM con cuatro preguntas `Noul` y una `Score`, con jev-1.12 y sin métricas.
- **Alternativa.** Preguntas `boolean` sobre el texto del redactor: si recomienda insistir pese a un límite, si afirma una lectura que no está autorizada o si presenta certezas.
- **Inconvenientes.** El texto del redactor está en español, lo que choca con L1: habría que traducirlo o hacer una excepción explícita. Añade latencia, impide el streaming y su calidad no está medida [H].
- **Ventaja.** Da a Jev un segundo papel decisivo y documentado, que encaja con L3, a un coste despreciable.
- **Recomendación.** Evaluarlo en 007 y 011; no adoptarlo todavía.

### A7 — Recordar la elección sobre el expediente (decisión 9)

- **Problema.** Hay que activar el expediente en cada consulta, lo que oculta la promesa de 004 («Want better reads?»), mientras el dato más sensible —el mensaje y el contexto— sale siempre.
- **Alternativa.** Recordar localmente la elección, activada una vez que la persona ha guardado su expediente y ha visto un aviso claro, y mantener un interruptor visible en cada consulta. Dedicar el esfuerzo de consentimiento al envío del mensaje y del contexto: un aviso en el primer uso que enumere a los encargados de tratamiento.
- **Inconvenientes.** Que el expediente esté activado por defecto puede sorprender; se mitiga con el aviso y el interruptor.
- **Impacto.** La fricción se alinea con el riesgo y 005 no cambia: recibe un expediente opcional.
- **Recomendación.** Revisarlo en 007 [DP]; en 005 se mantiene la decisión 9 tal cual.

---

## 5. Casos límite y riesgos no contemplados

Ninguno de estos casos figura en H01–H30 o, si figura, le falta la parte señalada.

| ID  | Caso                                                                                                    | Por qué importa                                                                                                                                                                 | Afecta a                     | Cuándo                         |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------ |
| C1  | Mensaje en inglés, catalán, gallego, euskera o mezclado («ok», spanglish)                               | L1 dice «del español al inglés»; la detección automática es peor con textos cortos [E] y «Ok» vale en ambos idiomas                                                               | L1, I3                       | 006 (en 005, código de fallo)  |
| C2  | Transcripción pegada de WhatsApp, con fechas, nombres, teléfonos y varios turnos de ambas personas      | Datos personales; no está claro qué mensaje se analiza; Jev lee las fechas como texto [E]                                                                                      | Decisión 9, minimización, límites | 005 (límites), 007 (UX)  |
| C3  | Marcadores de exportación («<Multimedia omitido>», «Se eliminó este mensaje», audios)                   | No hay contenido que interpretar: debería acabar en `needs_context`, no en lecturas                                                                                              | Decisiones 4 y 5             | 005 (fixture), 006             |
| C4  | La persona usuaria expresa un riesgo propio en el contexto                                               | Requiere otro recurso (024)                                                                                                                                                     | Decisión 10, I5              | 005 (tipo), 007                |
| C5  | Rechazo en la pregunta de seguridad o del traductor ante contenido violento                              | Falla justo en los casos graves                                                                                                                                                  | B4                           | 005                            |
| C6  | Límite explícito sin contexto                                                                           | Debe leerse, no pedir contexto                                                                                                                                                   | B3                           | 005                            |
| C7  | «Estoy bien» o «No pasa nada» sin contexto                                                              | Su lectura literal benigna no tiene ID                                                                                                                                           | I1a                          | 005                            |
| C8  | Lecturas opuestas, ambas con apoyo alto (literal y sarcástica)                                          | Sofi presentaría como compatibles dos versiones contradictorias                                                                                                                  | Decisión 1                   | 007 y 012                      |
| C9  | Expediente activado, pero solo con «No lo sé», «Depende» o vacío                                        | `profileUsed` no puede ser `true` si no se envió nada                                                                                                                            | I2                           | 005                            |
| C10 | Bucle de `needs_context`: se añade contexto y sigue siendo insuficiente, o la persona no tiene más       | Una experiencia frustrante; `mission.md` §4.5 no pide un bucle                                                                                                                   | Decisiones 4 y 5             | 007 (en 005, lecturas explícitas aun con `needs_context`) |
| C11 | La misma consulta da cifras distintas al «Volver a leer»                                                 | Jev no es determinista [E-h: TS-consistency]: genera desconfianza                                                                                                                | Decisión 1, caché (§39)      | 007                            |
| C12 | Jev responde, pero el redactor falla o agota el presupuesto                                              | Hay que aclarar que mostrar lecturas calculadas con una copy neutra declarada es válido; el registro (L5) solo prohíbe texto genérico «como si fuese interpretación calculada» | Decisión 7                   | 005 (resultado autosuficiente), 007 |
| C13 | Inyección dirigida al traductor LLM (no solo a Jev o al redactor)                                        | Altera lo que evalúa Jev                                                                                                                                                         | I3                           | 006                            |
| C14 | El redactor menciona una lectura no autorizada, recomienda insistir o contradice un límite              | Si falla la validación, se usa copy fija y no se muestra ese texto                                                                                                               | Decisión 7                   | 007                            |
| C15 | El fake se activa en producción o se usa como «modo degradado»                                          | Resultados inventados que se presentan como reales                                                                                                                              | M2                           | 005 y 017                      |
| C16 | Dispositivo compartido o controlado por la pareja                                                        | El historial y los borradores quedan a la vista                                                                                                                                  | I5                           | 007 y 009                      |
| C17 | Cambio silencioso del alias de Jev entre la evaluación y la producción                                   | Las métricas de 011 dejan de describir lo que está en producción                                                                                                                 | I7                           | 006 y 011                      |
| C18 | Contexto muy largo                                                                                       | Coste del redactor; límite de 32.000 tokens por pregunta [E]; el contenido ajeno degrada a Jev [E]                                                                               | Límites                      | 005 (plan)                     |
| C19 | Persona usuaria menor de edad                                                                            | Términos de los proveedores [H]; violencia en parejas adolescentes                                                                                                               | M8                           | 013 y 017                      |
| C20 | La salida del MCP la lee otro LLM                                                                        | Puede convertir 0,8 en «80 % de que esté decepcionada»                                                                                                                           | I9                           | 014                            |

---

## 6. Qué mantendría exactamente como está y por qué

1. **Estimaciones independientes, sin renormalizar, y la ausencia distinta de cero** (decisión 1). Es lo que devuelven las primitivas `boolean` [E] y lo que piden el AI SDK y TypeSafe [E-h]. Cualquier normalización inventaría información.
2. **Retirar `unclear` e `insufficient_context` como categorías** (decisión 2). Abstenerse no es una lectura de la pareja.
3. **Separar proveedor, política y redactor, con una política sin SDK** (decisión 3). Permite probar sin red, comparar políticas sin repetir peticiones y compartir el núcleo con MCP.
4. **Errores fuera de los estados y `needs_context` como resultado correcto** (decisión 4). Responde a `mission.md` §4.5 y evita presentar una caída como una interpretación.
5. **Suficiencia sin expediente** (decisión 5). Es la única garantía estructural, y no dependiente del modelo, contra el anclaje en el perfil (`jev.md` §8.4).
6. **Sin confianza global hasta 011 y 012, con el espacio visual ya preparado** (decisión 6). La evidencia es sólida y la interfaz ya lo admite.
7. **Tres versiones más metadatos, sin guardar texto** (decisión 8). Coste mínimo y trazabilidad suficiente para 010–012.
8. **Minimizar el expediente**: solo respuestas concretas y sin notas por defecto (decisión 9). Reduce la exposición y el contenido ajeno que degrada a Jev [E].
9. **Separar el respeto de los límites de `safety_concern`; no usar listas de palabras como único detector; no prometer infalibilidad** (decisión 10).
10. **Conservar los emojis sin asignarles un significado fijo** (L2).
11. **Las reglas de proceso**: sin llamadas reales en los tests; MSW solo en la frontera HTTP; no publicar cifras sin medir; no cambiar de proveedor en silencio (L5).

---

## 7. Qué cambiaría antes de redactar `005-spec.md`

### 7.1. Decisiones para aprobar (por número)

**Antes de redactar la spec (bloqueantes):**

1. Confirmar que la decisión 1 prevalece sobre la semántica de los resultados aprobada en 002 (reparto al 100 %, «Reñido», «empate técnico»), y registrar el rediseño pendiente para 007 en `art-direction/README.md`. (B1)
2. Reescribir `mission.md` §4.2: el número expresa el apoyo del modelo a un enunciado, no un reparto entre versiones. (B1)
3. Política parametrizada por un `PolicyConfig` versionado; valores provisionales en 006 a partir de E2 y E3, marcados como tales; valores evaluados en 012. (B2)
4. Precedencia de los estados: `safety_concern` > límite o espacio comunicable > `needs_context` > `interpreted`. (B3)
5. Seguridad en tres estados (`concern`, `no_concern_detected`, `not_evaluated`), con fallo cerrado cuando no se evalúa. (B4)
6. Reconciliar `tech-stack.md` (§29, §40, §42.4, §45 y §69; en §26 y §26.1, marcar el alcance del redactor como pendiente de 007) y `roadmap.md` (§8, §9, §13, §14, §15), y sustituir el borrador de `005-spec.md`. (B5)

**Al redactar la spec (importantes):**

7. Sustituir `literal_permission` por una lectura literal general (`literal_meaning`). (I1a)
8. Añadir `expressing_annoyance`, o descartarlo de forma explícita y razonada. (I1b)
9. Añadir el atributo `kind` (`reading` o `cue`) a la taxonomía. (I1c)
10. Un único conjunto de lecturas autoritativo; suficiencia y seguridad siempre sin expediente; `profileUsed` verdadero solo si se envió alguna respuesta concreta. (I2)
11. Un puerto de proveedor independiente del idioma, con la traducción como decorador en 006, y códigos de fallo mínimos con `retryable`. (I3, decisión 4)
12. `interpretMessage` excluye al redactor, y `AnalysisResult` se puede presentar sin él. (I9, C12)
13. La función que minimiza el expediente pertenece al dominio y se comparte entre cliente y servidor. (Decisión 9)
14. Salvaguardas del fake: procedencia `fake`, fuera de producción y nunca como reserva. (M2)
15. Categorías de seguridad según quién está en riesgo, o como mínimo un tipo extensible. (I5)

**Para 006, 007 y 011 (anotar ahora; no bloquean):**

16. Someter L1 a una prueba (estado en español, en inglés o en ambos) antes de fijarla en producción, con preferencia por NMT en el paso previo a Jev. (I3, A3)
17. Enrutar el redactor, y cualquier traductor LLM, por AI Gateway. (I6, A4)
18. Decidir el alcance del redactor (explicaciones, discurso, consejo y pistas) y sus criterios de fidelidad, y actualizar el contrato del PoC antes de ejecutarlo. (I4)
19. Copy fija y revisada para `safety_concern`, con 112, 016 y 024; sin humor ni sonido de voz, y sin guardado automático en el historial. (I5, A5)
20. Recordar la elección sobre el expediente (revisión de la decisión 9 en 007). (A7)
21. Actualizar `jev.md` con jev-1.14.0 y el estado de los alias, y resolver E8 antes de 006. (I7)
22. Definir un listón de evidencia alcanzable para «probabilidad ganada» en 011. (I8)

### 7.2. Qué puede esperar

| Asunto                                                      | Feature | Motivo                                          |
| ----------------------------------------------------------- | ------- | ----------------------------------------------- |
| Proveedor y validación de la traducción; prueba de L1       | 006     | No cambia el contrato de 005 si se usa el decorador |
| Valores provisionales de la política; redacción de las preguntas | 006 | Requieren E2 y E3 con autorización de gasto    |
| Transporte (AI SDK o HTTP) y forma de los resultados parciales | 006  | El dominio solo necesita representar la ausencia |
| Alcance, ruta, presupuesto y fidelidad del redactor          | 007     | El contrato del redactor es independiente       |
| Rediseño de los resultados (cifras, tensión, letra pequeña) y pantalla de seguridad | 007 | Requiere la dirección de arte |
| Recordar el expediente; aviso de envío de datos             | 007     | Experiencia de usuario                          |
| No guardar `safety_concern` en el historial                 | 009     | Persistencia                                    |
| Métricas por señal y conjunto de datos                      | 011     | Evaluación                                      |
| Umbrales evaluados y tratamiento de la tensión              | 012     | Necesitan datos                                 |
| Edad, abuso y límites de recursos                           | 013     | Seguridad                                       |
| Semántica autodescrita de la salida MCP                     | 014     | MCP                                             |

### 7.3. Qué no añadiría a 005

- Ninguna implementación de traducción ni del redactor; tampoco el puerto del redactor, que corresponde a 007 (`tech-stack.md` §26.1).
- Ninguna política fina para resultados parciales, más allá de representar la ausencia.
- Ninguna jerarquía exhaustiva de errores.
- Ningún campo paralelo de tono, indirectividad o necesidades.
- Ningún valor real de umbral fuera del `PolicyConfig` del fake y de los tests.

### 7.4. Comportamientos que `005-spec.md` debería exigir en sus tests

- Un valor ausente nunca se convierte en 0 ni se rellena.
- Los valores no finitos o fuera de [0, 1] se rechazan, y nunca se renormaliza.
- `safety: not_evaluated` nunca produce un resultado humorístico ni un `interpreted` normal.
- Un límite comunicable no queda oculto tras `needs_context`.
- Se cumple la precedencia: seguridad > límite > `needs_context` > `interpreted`.
- La política se comporta según su `PolicyConfig` (tests relativos a los parámetros, sin valores mágicos) y registra `policyVersion`.
- «No lo sé», «Depende», las áreas sin responder y las notas no se envían; `profileUsed` es `false` si no se envía nada.
- La suficiencia y la seguridad se calculan sin expediente; el fake permite comprobarlo por la forma de las peticiones.
- El fake es determinista, se identifica como `fake` y no se importa desde el código de producción.
- El dominio no importa React, SDKs ni almacenamiento del navegador (ya figura en el borrador).

---

## 8. Fuentes

### 8.1. Consultadas en esta revisión (2026-10-15)

| #   | Fuente                                                     | URL                                                                                                   | Qué se verificó                                                                                                                                                                                   | Evidencia                                                |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | TypeSafe — Models                                          | https://docs.typesafe.ai/models                                                                       | El inglés como idioma principal; `jev-1.14.0` disponible desde el 2026-10-14; alias; fijación de versión; `model` con la versión que responde; límites de 64.000 y 32.000 tokens; 0,042 $/M      | Oficial (proveedor); la página no muestra fecha          |
| 2   | TypeSafe — jev-1.13 model jaggedness                       | https://docs.typesafe.ai/model-jaggedness/jev-1.13                                                    | Negaciones leídas al pie de la letra; doble negación en las instrucciones; el estado como datos e inyección; sesgo hacia la primera opción; `score` poco calibrado; fechas y números; contenido ajeno | Oficial (proveedor)                                      |
| 3   | TypeSafe — LLM guardrails                                  | https://docs.typesafe.ai/cookbooks/llm_guardrails                                                     | Revisa entradas y salidas de un LLM; cuatro `Noul` y un `Score`; jev-1.12; 2026-08-15; sin métricas                                                                                                | Oficial (ejemplo sin métricas)                           |
| 4   | Vercel — Decision                                          | https://vercel.com/docs/ai-gateway/modalities/decision                                                | Formas de respuesta (`boolean` sin `confidence`); la respuesta devuelve el alias `typesafe-ai/jev`; uso para «automated verification»; `providerOptions`. Actualizada el 2026-10-07. El registro (P4) no pudo abrirla; hoy sí | Oficial                                                  |
| 5   | Vercel — Zero Data Retention                               | https://vercel.com/docs/ai-gateway/security-and-compliance/zdr                                        | ZDR solo en Pro y Enterprise; marca por petición; error 400 `no_providers_available`; Mistral, TypeSafe AI y Azure figuran como proveedores con ZDR. Actualizada el 2026-09-22                      | Oficial                                                  |
| 6   | AI Gateway — endpoints de Jev                              | https://ai-gateway.vercel.sh/v1/models/typesafe-ai/jev/endpoints                                      | `typesafe-ai` con ZDR; `digitalocean` sin él; ambos sin entrenamiento; ningún identificador de versión                                                                                           | Datos en vivo                                            |
| 7   | AI Gateway — catálogo                                      | https://ai-gateway.vercel.sh/v1/models                                                                | 465 modelos; solo tres con la etiqueta `free`; entradas de Mistral y de los modelos de decisión                                                                                                   | Datos en vivo (descargado como dato, sin inferencia)     |
| 8   | AI Gateway — endpoints de Mistral Small                    | https://ai-gateway.vercel.sh/v1/models/mistral/mistral-small/endpoints                                | «Currently runs Mistral Small 4»; proveedor `mistral` con ZDR y sin entrenamiento; precios; salidas estructuradas                                                                                 | Datos en vivo                                            |
| 9   | Microsoft Learn — Translator, método Translate (v3)        | https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/translate | `profanityAction=NoAction` por defecto; `textType=html` y `notranslate`; detección automática mejor con textos largos; el 403 de la prueba gratuita. `ms.date` 2026-06-02                          | Oficial                                                  |
| 10  | Microsoft Learn — Datos, privacidad y seguridad de Translator | https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/translator/data-privacy-security     | La traducción de texto no almacena datos del cliente. `ms.date` 2026-04-01                                                                                                                         | Oficial                                                  |
| 11  | Microsoft Learn — Migrar a V3                              | https://learn.microsoft.com/en-us/azure/ai-services/Translator/migrate-to-v3                          | «No-Trace» se aplica a todos los niveles de precio                                                                                                                                                 | Oficial                                                  |
| 12  | Azure — Precios de Translator                              | https://azure.microsoft.com/en-us/pricing/details/cognitive-services/translator/                      | F0: 2 millones de caracteres al mes; no indica qué ocurre al agotarlos; el precio de S1 no aparecía en la página                                                                                  | Oficial (parcial)                                        |
| 13  | Mistral — Usage limits                                     | https://docs.mistral.ai/admin/billing-usage/usage-limits                                              | Límites por organización; modo gratuito y pago por uso; no documenta un límite de 0 ni la cabecera                                                                                                | Oficial (no concluyente)                                 |
| 14  | Ministerio de Sanidad — Línea 024                          | https://www.sanidad.gob.es/linea024/home.htm                                                          | Gratuita, confidencial y disponible 24 horas los 365 días; también para familiares y allegados; derivación al 112                                                                                  | Oficial (Administración)                                 |
| 15  | Ministerio de Igualdad — Teléfono 016                      | https://violenciagenero.igualdad.gob.es/informacion-3/recursos/telefono016/                           | Gratuito y confidencial; WhatsApp 600 000 016; funciones de los fabricantes para que la llamada no quede en el registro; 53 idiomas                                                                                       | Oficial (Administración)                                 |

Búsquedas auxiliares (no son fuentes; sirvieron para localizar las páginas 10, 11, 14 y 15): una sobre la política «no trace» de Azure Translator y dos sobre los teléfonos 024 y 016, limitadas a dominios oficiales.

### 8.2. Evidencia del repositorio

- Registro: `spec/decisions/ask-sofi-registro-de-decisiones-analisis.md` (leído completo).
- Constitución: `mission.md`, `roadmap.md`, `tech-stack.md` y `jev.md` (leídos completos); `art-direction/README.md`; `AGENTS.md`; diff sin confirmar de esos archivos y de 004.
- Feature 005: `spec/features/005-analysis-domain/005-spec.md` (borrador).
- Feature 004: `src/domain/partner-profile/partnerProfile.ts` y `partnerProfileSchema.ts`.
- Design System de 002: `src/components/sofi/types.ts`, `Interpretations/Interpretations.tsx`, `ReadingBoxes/ReadingBoxes.tsx`, `ConfidenceMeter/*`, `ErrorState/ErrorState.tsx`, `src/design-lab/fixtures.ts` y `src/design-lab/sections/PropPlaygrounds.tsx`.
- Consulta: `src/features/consultation/screens/ResultScreens.tsx`, `ProvisionalConsultation.tsx`; `src/mocks/handlers.ts`.
- PoC: `evals/llm-redactor/` (`README.md`, `rubric.md`, `prompts.ts`, `cases.ts`, `runner.ts`, `probe.ts`, `results/*.json`; en los resultados solo se revisaron los códigos de error y las cabeceras).

### 8.3. Referencias heredadas, usadas sin reverificar

Proceden de `jev.md` §13, con su fecha de consulta (2026-10-13 o 2026-10-14): [TS-intro], [TS-state], [TS-confidence], [TS-consistency], [AISDK-decisions], [AISDK-typesafe], [GW-fallbacks], [GW-openai-decisions], [GW-budgets], [GW-faq], [GW-pricing], [GW-no-training], [LIT-turpin] y [GDPR-a9]. Del registro: los diagnósticos de la cuenta de Mistral (§L4) y la conversación de las decisiones 1–10. Las fuentes P3 del registro (agregadores y blogs) no se han usado.

### 8.4. Lo que no he podido verificar

- Qué versión de Jev hay detrás de `typesafe-ai/jev` en AI Gateway (E8).
- Qué hace ZDR en el plan Hobby sin la marca, y si el equipo puede comprar créditos y fijar presupuestos (E0).
- La causa del 429 de Mistral: solo hay una inferencia a partir de la cabecera.
- Qué ocurre al agotar F0 en Azure: la página de precios no lo dice.
- Con qué frecuencia un traductor LLM rechaza o filtra contenido violento.
- La calidad de Jev con el estado en español frente al traducido.
- Si las personas leen una lista de porcentajes como un reparto.
- La edad mínima en los términos de los proveedores.
- El precio de S1 de Azure Translator, que no aparecía en la página.

---

## 9. Recomendación final

**Listo para especificar, con ajustes.** No hace falta replantear nada: la estructura se sostiene, y los problemas son de semántica, de contrato y de propagación a las fuentes de verdad.

- **Condición para empezar `005-spec.md`:** aprobar o ajustar las decisiones 1–6 de §7.1, que son las bloqueantes.
- **Dentro de la spec:** resolver las decisiones 7–15.
- **Después:** las decisiones 16–22 se anotan ahora y se resuelven en 006, 007 y 011. Ninguna cambia el contrato de 005 si se adopta el decorador de traducción (A3).

El mayor riesgo para la experiencia de Sofi no está en Jev, sino en los dos extremos generativos de la cadena: un traductor que interpreta sin que se vea y un redactor que puede inventar causas. La 005 puede protegerse de ambos con poco: un contrato agnóstico al idioma, un resultado que se pueda presentar sin el redactor y una política cuyos cortes, precedencias y fallos estén escritos y probados.
