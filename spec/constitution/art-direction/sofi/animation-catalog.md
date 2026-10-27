# Sofi — Catálogo de animaciones y comportamiento

> **Estado:** catálogo funcional acordado; integración visual y técnica pendiente de validar en el Design Lab.  
> **Actualización:** 2026-10-23.  
> **Alcance aprobado:** 14 animaciones activas en el catálogo, con la numeración 007 reservada y sin reutilizar.

## 1. Propósito y autoridad

Este documento es la **fuente de verdad del significado y comportamiento de Sofi como personaje animado**: qué expresa cada animación, qué evento la activa, cuándo termina, qué puede interrumpirla y qué alternativa ofrece con movimiento reducido. También delimita qué animaciones **no** pertenecen al producto.

El objetivo no es animar por animar. Sofi debe sentirse presente, curiosa, divertida e impredecible sin distraer de la consulta, inducir interpretaciones falsas, invadir la privacidad ni entorpecer la accesibilidad.

**No duplicar aquí:**

- Cómo se incorporan ZIP, parciales SCSS y WebP, ni cómo se optimizan estáticas: `spec/constitution/tech-stack.md` §46.1.
- Líneas de tiempo, secuencias exactas de fotogramas, dimensiones, FPS, duración de cada paso o efectos de capa: el parcial SCSS y los archivos fuente de cada ZIP. La duración **funcional** (hasta qué evento mantener una animación) se define aquí.
- Reglas generales de movimiento, accesibilidad, rendimiento o estados de carga: `tech-stack.md` §§42, 44–46.
- Composición aprobada, tamaños y límites de recorte: `spec/constitution/art-direction/README.md` y Design Lab.
- Semántica de las señales y resultados: `005`, `006`, `007`, `mission.md`. Una animación **nunca** decide el resultado del análisis.
- Cableado por pantalla y detalles de implementación: planes y tareas de `007`, `008`, `009` y las features correspondientes.

**Disponibilidad (verificada el 2026-10-23):** los 14 recursos existen. `001` ya está integrado en `src/styles/sprites/`; los otros 13 llegan como ZIP definitivos exportados de los recursos fuente del commit `17aca4f` del repositorio de spritesheets. Su procedencia está en `asset-provenance.md`. Antes de integrar, contrastar el inventario real con este catálogo y comunicar ausencias o discrepancias; no inventar recursos ni sustituirlos silenciosamente.

**Alcance previo a implementación:** tener el conjunto completo de spritesheets y sus recursos asociados localizados y verificables; registrar sus casos de uso; validarlos en el Design Lab. No integrar progresivamente un subconjunto definitivo dando por hecho que el resto ya está aprobado técnicamente.

## 2. Principios de funcionamiento

1. **El estado de la interfaz manda.** El resultado de `005`/`006`, `SofiSpeech` y las acciones explícitas de usuario determinan las señales semánticas; la capa de animación escoge su representación. Ningún sprite interpreta mensajes.
2. **Una Sofi, una intención principal.** No combinar dos animaciones de cuerpo incompatibles en el mismo elemento; las capas específicas previstas por cada spritesheet sí pueden coexistir. Una interacción ambiental no desplaza una expresión funcional.
3. **La información no espera a Sofi.** No retrasar artificialmente respuestas, anuncios accesibles, navegación, foco, borrados o acciones de seguridad para completar una secuencia. Una transición puede acompañar el contenido sin bloquearlo. Única excepción: la retención acotada de §6.4.
4. **Sin loops indiscriminados.** Los bucles solo duran mientras su estado semántico sea pertinente; las reacciones y celebraciones son de una pasada aunque el parcial recibido venga exportado con `infinite`.
5. **El usuario conserva el control.** Cambiar de vista, cancelar, iniciar otra consulta, tocar «Ver todo», ocultar la página o solicitar la salida rápida interrumpe lo incompatible sin esperas. Los estados sensibles dominan cualquier gag.
6. **Los easter eggs son secundarios.** `poking`, `are-u-still-here` e `i-see-you` no pueden interferir con escribir, leer, escuchar, procesar una consulta ni gestionar datos.
7. **Movimiento reducido con significado.** No basta con detener la animación sobre un fotograma casual. Cada recurso debe mostrar una pose estable y adecuada, también bajo la simulación `data-motion='reduce'` del Design Lab. Las reacciones ambientales pueden quedar desactivadas o simplificadas, sin pérdida de contenido.
8. **Carga y fallos invisibles para la persona.** Mantener una representación estática existente mientras llega otro WebP; si no carga, continuar con el recurso de reserva. La carga del arte no bloquea la aplicación.
9. **No presentar certezas ficticias.** Un gesto de sorpresa, sospecha o victoria no convierte una estimación en un hecho ni autoriza un consejo que contradiga el análisis.
10. **No duplicar decisiones.** Los detalles técnicos quedan en sus archivos y las decisiones de UX únicas quedan aquí o en la feature responsable. Las especificaciones de 007/008/009 deben remitir a este catálogo, no copiarlo.

## 3. Inventario cerrado

**Son 14 recursos funcionales:** 001–006 y 008–015. El número 007 sigue reservado para el descartado `listening` y **no se reasigna**. `memory-wipe` es el 015 (`015-memory-wipe`).

| ID | Identificador | Función | Reproducción funcional | Área de uso |
|---|---|---|---|---|
| 001 | `sofi-blink` | Atención, reposo y espera pasiva | Bucle discreto mientras está en reposo | Compartido |
| 002 | `sofing` | Investigar/teclear frenéticamente | Bucle **solo** durante procesamiento real | Consulta, 007/008 |
| 003 | `rolling` | Giro, mareo y recuperación cómicos | Bucle **solo** durante una carga real perceptible | Carga de la app o de una vista (candidata), 008 |
| 004 | `talking` | Hablar mientras se escribe el diálogo | Ligado a `speaking`, no a un tiempo fijo | Diálogos y expediente |
| 005 | `favoriting` | Celebración con gafas y sello «SOFI APPROVED» | Una pasada por favorito guardado | Favoritos, 009 |
| 006 | `poking` | Responder a pinchazos de ratón/toque | Máquina de reacciones escalonadas | Cuarta pared, 008 |
| 007 | — | `listening`, **descartado** | — | Su función pasa a `blink`/`talking`/`uncertain` |
| 008 | `are-u-still-here` | Somnolencia, sueño y despertar por inactividad | Máquina contextual; no loop invasivo | Cuarta pared, 008 |
| 009 | `i-see-you` | Seguir brevemente la mirada/cursor y «pillar» al usuario | Interacción ocasional | Cuarta pared, 008 |
| 010 | `needs-context` | Pedir una pista más | Reacción breve y pose estable | `needs_context`, 007/008 |
| 011 | `error` | Glitch / KO cómico ante un fallo ordinario | Una pasada y estado estable | Error no sensible, 007/008 |
| 012 | `eureka` | Descubrimiento y apertura de explicación | Una pasada; nunca bloquea resultados | Resultado, 007/008 |
| 013 | `suspicious` | Curiosidad pícara ante un matiz respaldado | Una pasada; nunca acusa | Resultado, 007/008 |
| 014 | `uncertain` | Comprensión e incertidumbre aceptada | Una pasada; recuperación tranquila | Sin más contexto y expediente |
| 015 | `memory-wipe` | Pánico, desaparición en píxeles y reaparición | Una pasada después del borrado completo | Privacidad, 009/008 |

**Arte y exportaciones:** 001–006 y 008–013 están cerrados artísticamente por la autora; 014 tiene ZIP final según la actualización del 2026-10-21. `memory-wipe` está **terminado y aprobado** (revisión artística final del 2026-10-23); antes se trataba como recurso preparado por petición de la autora. Ninguna revisión técnica autoriza a redibujar, sustituir o alterar el estilo aprobado; una incompatibilidad se informa antes.

**Estáticas:** `sofi-neutral`, `sofi-peek`, `sofi-thinking`, `sofi-smug`, `sofi-surprised`, `sofi-approved` y las poses/fotogramas estáticos necesarios son alternativas, no animaciones numeradas nuevas. Su asignación vigente al expediente parte de `004-plan.md` §6 y `src/features/partner-profile/sofiVisuals.ts`, a actualizar en 008 sin duplicar catálogos en producción.

## 4. Contratos individuales

En estas fichas, **«al terminar»** designa la transición funcional esperada. Los tiempos exactos salen del asset y se validan en navegador. La tabla de §6 determina las interrupciones globales. «Reducido» se aplica tanto al ajuste del sistema como al modo forzado del laboratorio.

### 001 — `sofi-blink` · Atenta / idle

- **Qué expresa:** Sofi está presente, escucha y espera sin reclamar atención. Rostro natural, parpadeos breves y pausas.
- **Se activa:** al entrar en una pantalla con Sofi sin otra intención principal; cuando finaliza o se cancela una reacción; al esperar una respuesta del usuario en consulta o expediente; como reserva durante la carga de otro recurso.
- **Reproducción:** bucle discreto de parpadeo (el parcial existente define la secuencia). No se interpreta como prueba de que el sistema esté calculando.
- **Termina / transición:** cede inmediatamente cuando comienza un diálogo, procesamiento, reacción contextual o acción de privacidad. Regresa cuando el estado lo permite.
- **Interrupciones:** cualquiera de los estados funcionales o especiales que lo sustituyan.
- **Reducido:** fotograma F0 estable, ojos abiertos; sin parpadeo.
- **Particularidades:** ya integrado en `SofiPortrait`. Los fotogramas F1/F2 usados como «pensando», «poco convencida» y «ups» son **placeholders**, no el destino definitivo del personaje.

### 002 — `sofing` · Sofi investiga

- **Qué expresa:** revisión frenética del mensaje, tecleo maníaco, acercamiento a la pantalla, sospecha fugaz y euforia cómica con el portátil.
- **Se activa:** únicamente mientras se ejecuta un análisis solicitado expresamente por la persona y haya espera real. No se inicia al editar campos, cambiar preferencias, restaurar sesión ni consultar un resultado ya cacheado.
- **Reproducción:** bucle durante el estado `processing`. Es la candidata para el análisis, pendiente de validación en el Design Lab.
- **Termina / transición:** ante un resultado no crítico puede completar su primer ciclo según §6.4; en cualquier otro caso (error, `safety_concern`, cancelación, salida rápida o movimiento reducido) se corta **en el acto**.
- **Interrupciones:** todos los resultados, seguridad, salida rápida, navegación, nueva intención prioritaria y ocultación de página.
- **Reducido:** pose estática apropiada del propio sprite, sin tecleo, rayos ni movimiento continuo.
- **Particularidades:** humor exagerado. Antes de usarlo en espera de resultados potencialmente sensibles, validar el tono y su interrupción inmediata al conocer un estado de seguridad. `sofing` representa el análisis y `rolling`, la carga de la app o de una vista (ficha 003); no se alternan automáticamente por tiempo.

### 003 — `rolling` · Sofi gira y se marea

- **Qué expresa:** Sofi da vueltas exageradas, se marea y vuelve a componerse; loader absurdo, separado de cualquier interpretación.
- **Se activa:** candidata **provisional** para la **carga inicial real** de la aplicación o de una vista diferida, solo si esa carga es perceptible: si la aplicación aparece al instante, no se muestra. Condicionada a medir el rendimiento y a determinar qué recursos deben cargarse al entrar.
- **Reproducción:** bucle mientras dure la carga real; nunca se alarga para mostrarla.
- **Termina / transición:** corte inmediato al terminar la carga o producirse un error. La retención de §6.4 no se aplica a la carga.
- **Interrupciones:** las mismas que `sofing`.
- **Reducido:** fotograma de reposo apropiado, sin giro ni órbitas/efectos.
- **Particularidades:** el cuerpo y efectos (`rolling-fx`) sobresalen de su caja; no debe quedar mutilado por `overflow: hidden`. Sus fotogramas de giro reutilizan poses; eso es deliberado, **no** un error que haya que «deduplicar» otra vez. La temporización exacta vive en el SCSS. Su spritesheet no entra en la ruta crítica de carga sin mediciones que lo justifiquen; mientras no esté disponible, se usa una alternativa ligera. La estrategia de precarga y las duraciones corresponden al plan de 008 y a las pruebas de rendimiento.

### 004 — `talking` · Sofi habla

- **Qué expresa:** Sofi pronuncia su texto, moviendo boca y ojos con el diálogo de novela visual.
- **Se activa:** a partir del contrato de `SofiSpeech`: `speaking === true`. Incluye preguntas habladas del expediente, diálogo de consulta y la explicación redactada, cuando se utilice reproducción progresiva.
- **Reproducción:** bucle de habla **mientras** `speaking` esté activo; no tiene vida propia ni controla la cadencia del texto.
- **Termina / transición:** en pausas `speaking === false`, al terminar el texto, con «Ver todo», al cambiar de intervención, navegar, cancelar o suspender la intervención.
- **Interrupciones:** acciones que cancelan la intervención y todos los estados superiores. En una pausa breve, el Design Lab debe comparar «boca quieta sobre el mismo sprite» frente a «vuelta a `blink`» y aprobar la opción sin saltos.
- **Reducido:** expresión estable con boca cerrada o pose de habla fija no parpadeante; `SofiSpeech` presenta texto completo y no necesita sincronía visual letra a letra.
- **Particularidades:** `SofiSpeech` expone estado, **no importa sprites**; las pantallas solo emiten una intención visual. Evitar actualizar toda la escena por cada carácter si basta una variación booleana de `speaking`. Sustituye al placeholder «Hablando · pendiente 008» del Design Lab y a las expresiones temporales de 004 cuando corresponda.

### 005 — `favoriting` · Sofi Approved

- **Qué expresa:** aprobación diva, gafas, sello «SOFI APPROVED» y satisfacción deliberadamente teatral.
- **Se activa:** **cuando se guarda correctamente un análisis como favorito** (feature 009); una vez por acto de guardado confirmado. No se activa por tocar repetidamente un control sin cambio de estado.
- **Reproducción:** **una pasada**, aunque la exportación tenga definida una línea de tiempo en bucle. El sello se integra como efecto/capa independiente si así llega en el ZIP.
- **Termina / transición:** al terminar pasa a `blink` o a la intención de pantalla vigente; no se repite hasta un nuevo guardado válido.
- **Interrupciones:** nueva acción principal, cambio de pantalla, preferencias de movimiento, seguridad y privacidad.
- **Reducido:** pose con sello o indicación estática de favorito guardado; el feedback textual de guardado siempre existe.
- **Particularidades:** puede sobresalir del contenedor. **No** sustituye los estados de `saved`/`savedInMemory`/`rejected` del expediente: guardar una ficha no equivale a favoritar. No presupone que haya historial opt-in activado.

### 006 — `poking` · Stop poking me

- **Qué expresa:** Sofi reacciona a que la persona pinche **su cuerpo** o el área del personaje; rompe la cuarta pared e interactúa con el borde **real** de la interfaz.
- **Se activa:** solamente mediante **ratón o toque** sobre el personaje en una región donde la interacción ambiental esté permitida. **No hay activación por teclado**: este gag opcional no es una acción necesaria para acceder a información ni funciones.
- **Reproducción:** máquina de estados escalonada, no un único bucle. La secuencia acordada avanza por aproximadamente cinco toques acumulados en una ventana breve: (1) curiosidad «Hm?»; (2) mirada lateral «Can I help you?»; (3) gesto de límite «PERSONAL SPACE!»; (4) enfado cómico «I'm literally pixels.»; (5) Sofi se esconde. Después puede asomarse y un toque adicional provocar «NOPE». Estas frases describen la intención original, **no son copy obligatorio que deba mostrarse**.
- **Termina / transición:** vuelve al reposo tras el descanso/reinicio previsto por su controlador; un nuevo disparador válido puede iniciar otra serie. No debe quedarse oculta de manera que desaparezca una UI importante.
- **Interrupciones:** cualquier tarea real, diálogo, procesamiento, foco funcional, navegación, seguridad, salida rápida y otros easter eggs de mayor pertinencia.
- **Reducido:** sin empujones/desplazamientos, caídas ni sacudidas; como máximo reacciones estáticas no invasivas, o desactivación completa del gag si el Design Lab demuestra que es la alternativa adecuada.
- **Particularidades:** no incluir manos/bordes ficticios dentro de los fotogramas donde la intención era interactuar con un elemento real. Revisar el controlador exportado: la auditoría detectó que `attachPoking` pierde los **motivos** de pausa al delegar `pause()` sin su causa; no permitir que el primer `resume()` reactive Sofi si sigue ocupada o suspendida por otra razón.

### 008 — `are-u-still-here` · ¿Sigues ahí?

- **Qué expresa:** de estar atenta pasa a tener sueño, se duerme y al regresar la actividad despierta sobresaltada, fingiendo que estaba trabajando («I WAS WORKING!»).
- **Se activa:** después de **inactividad real sostenida** cuando la pantalla está tranquila. El criterio acordado fue **aproximadamente 2–3 minutos**, no 90 segundos por defecto. Definir el umbral final dentro de ese rango en el plan/Design Lab sin copiar otro valor casual del ZIP.
- **Reproducción:** máquina de estados: reposo → somnolencia → sueño → despertar → reposo. Mientras duerme puede mantenerse una pose fija con `Zzz` separados; no necesita repetir la transición de quedarse dormida.
- **Termina / transición:** la actividad de regreso puede disparar el despertar; cuando concluye, vuelve a `blink` o al estado superior que proceda.
- **Interrupciones:** consulta activa, escritura, lectura de diálogo, procesamiento, otras reacciones, navegación, estados sensibles o cierre/ocultación de página según la lógica de inactividad. No interpretar «página abierta» como usuario ausente si sigue leyendo.
- **Reducido:** pose de sueño y `Zzz` fijos o supresión de la secuencia; despertar sin sobresalto animado. Nada debe depender de ver la animación.
- **Particularidades:** el origen del ZIP utiliza 90 s: **discrepancia histórica conocida**, no adoptar esa cifra como nueva regla funcional. `sleep-zzz` y líneas de despertar son efectos independientes. Mantener frecuencia baja para no molestar.

### 009 — `i-see-you` · Te he pillado

- **Qué expresa:** Sofi descubre que están mirándola; desplaza la mirada en direcciones reconocibles, establece contacto visual y puede reaccionar con un «YOU'RE BEING WEIRD» cómico.
- **Se activa:** ocasionalmente a partir de movimientos/posición del **puntero** relevantes para Sofi, en pantallas tranquilas. **No** significa seguir todos los movimientos del ratón en toda la aplicación permanentemente.
- **Reproducción:** interacción breve con estados de mirada (arriba/abajo/izquierda/derecha/contacto) y reacción, después regreso a reposo.
- **Termina / transición:** al abandonar la región relevante, superar su ventana de interacción, producirse otra intención o concluir la reacción.
- **Interrupciones:** cualquier acción principal, escritura, reproducción de diálogo, procesamiento, interacción sensible, navegación y los demás easter eggs.
- **Reducido:** ojos/caras estáticos sin seguimiento continuo, o gag desactivado; no forzar animación con `no-preference` si el modo reducido está simulado desde la aplicación.
- **Particularidades:** **descartadas** las miradas aleatorias añadidas: el movimiento debe responder a la interacción real, ser ocasional y no parecer vigilancia. Evitar listeners globales y trabajo por cada movimiento de puntero cuando el personaje no está activo.

### 010 — `needs-context` · Me falta una pista

- **Qué expresa:** Sofi ladea la cabeza, observa con curiosidad, levanta una ceja y presenta un interrogante; divertida pero comprensiva.
- **Se activa:** exclusivamente cuando el resultado válido es `needs_context`, o cuando la UI necesita solicitar la información adicional expresamente autorizada por dicho resultado.
- **Reproducción:** reacción **breve / una pasada** y después una pose estable (`blink` o fotograma de interrogación). No dejar la pregunta visual girando continuamente mientras la persona lee.
- **Termina / transición:** al completarse la reacción no desaparecen la pregunta ni las señales de límite; al introducir contexto y pulsar análisis explícitamente, cambia a `processing`. Si la persona no dispone de más información, pasar a `uncertain`, **no repetir la petición indefinidamente**.
- **Interrupciones:** nueva acción de consulta, respuesta del usuario, navegación, seguridad, salida rápida.
- **Reducido:** fotograma estable de curiosidad (la exportación auditada propone F3); interrogante sin movimiento. La pregunta debe estar en texto.
- **Particularidades:** conservar los límites explícitos que devuelve `005`; Sofi no inventa qué falta ni ignora un «no» explícito. El interrogante puede ser una capa aparte, no requiere otro sprite nuevo.

### 011 — `error` · SOFI.EXE / glitch

- **Qué expresa:** pequeño fallo cómico de Sofi, sorpresa, glitch/KO y recuperación incómoda, sin sugerir avería real del dispositivo.
- **Se activa:** solo ante **errores técnicos ordinarios no sensibles** en los que el tono cómico esté permitido; la presentación textual del error es prioritaria.
- **Reproducción:** **una pasada y reposo**; no mantener un glitch de varios segundos repitiéndose como indicador permanente de error.
- **Termina / transición:** al concluir, imagen estable/neutral mientras sigue visible el mensaje de error; al reintentar explícitamente, el estado funcional determina la transición.
- **Interrupciones:** reintento, navegación, nueva consulta, movimiento reducido, seguridad, salida rápida.
- **Reducido:** fotograma sin glitch ni destellos; aviso legible sin dependencia del efecto.
- **Particularidades:** **`SOFI.EXE` y `error` son el mismo recurso**, no dos entradas. Antes de usarlo verificar en navegador la frecuencia de destellos y el salto del busto sobre los bordes. **Prohibido** en `safety_concern` y `safety_evaluation_unavailable`: ambos requieren tratamiento sobrio.

### 012 — `eureka` · Lo he visto

- **Qué expresa:** Sofi pasa de pensar a descubrir algo relevante; brillo, pequeño salto/gesto y predisposición a explicarlo. Alegría, **no** omnisciencia.
- **Se activa:** en la presentación de un resultado `interpreted` si existe contenido comunicable que justifique una transición positiva de «ya puedo explicarlo». **No** se usa para indicar que una hipótesis es «la ganadora» ni que se conoce la intención real de la pareja.
- **Reproducción:** una pasada y transición a `talking` mientras se verbaliza la explicación, o a `blink` si el discurso ya está visible o no se reproduce.
- **Termina / transición:** no bloquea la visibilidad de las señales, el anuncio del resultado ni las acciones; si el usuario pulsa «Ver todo», navegar o reanalizar, se interrumpe de inmediato.
- **Interrupciones:** seguridad, navegación, nueva consulta, ausencia/cancelación del discurso y acciones prioritarias.
- **Reducido:** pose de descubrimiento estable, sin salto/destello animado.
- **Particularidades:** no utilizar con cero señales comunicables. El ZIP tiene continuidad artística prevista con `needs-context`/`talking`; comprobar su transición real. La elección definitiva frente a `suspicious` permanece condicionada a las reglas y estimaciones validadas tras 006.

### 013 — `suspicious` · Un momento, detective…

- **Qué expresa:** mirada lateral, ceja levantada y sonrisa pícara; Sofi advierte un matiz que merece atención, **no** acusa a nadie.
- **Se activa:** únicamente ante una **señal comunicable realmente respaldada** que admita ese tono (por ejemplo sarcasmo o una indirecta). Nunca solo por un «Vale.», una expectativa cultural o el género de la pareja.
- **Reproducción:** una pasada; luego `talking` o `blink` según el estado del diálogo.
- **Termina / transición:** sin bloquear la presentación de las señales ni su lectura accesible.
- **Interrupciones:** iguales que `eureka`.
- **Reducido:** pose fija, sin gesto de transición.
- **Particularidades:** no inferir mentiras, manipulación, engaño, ghosting ni «red flags» por el sprite. **El umbral concreto de selección entre `suspicious` y `eureka` no se decide hasta disponer de los resultados verificados de 006**; con dudas, elegir una pose neutral.

### 014 — `uncertain` · That's okay

- **Qué expresa:** Sofi reconoce la incertidumbre, deja de insistir, baja los hombros y recupera una postura cálida y tranquila. Es comprensión, no una nueva pregunta.
- **Se activa:** cuando la persona dice que no dispone de más información tras `needs_context`; cuando es correcto comunicar «esto no se puede saber con lo que tenemos»; en las respuestas inciertas del expediente (`Depende`, `No lo sé`) si esa expresión encaja con su reacción ya aprobada.
- **Reproducción:** una secuencia breve y **una sola pasada**, con recuperación a reposo. La última pose aprobada es **F4 — “That's okay”**: manos fuera del encuadre, hombros relajados, mirada cálida y pequeña sonrisa; sin colmillos negros.
- **Termina / transición:** regresa a `blink` conservando la explicación textual de incertidumbre; no inicia automáticamente otro análisis ni insiste con más preguntas.
- **Interrupciones:** nuevas acciones, navegación, seguridad, salida rápida, intervención hablada prioritaria.
- **Reducido:** la pose empática estable, sin encogimientos animados ni transformación.
- **Particularidades:** **no confundir con `needs-context`**. La primera pide una pista; `uncertain` acepta que puede no haberla. El ZIP de 014 se considera listo a efectos de este catálogo por comunicación de la autora.

### `memory-wipe` · Borrar todos mis datos

- **Qué expresa:** la reacción dramática y absurda de Sofi ante el **borrado completo**: sorpresa → pánico → intenta agarrarse a bordes reales → disolución en píxeles → regresa neutra como si no recordara nada («¿Nos conocemos?»). **Sin maleta**.
- **Se activa:** **exclusivamente** después de que la persona confirme la acción independiente «Borrar todos mis datos». **Primero se ejecuta el borrado real**, inmediatamente; la animación es una consecuencia visual opcional, nunca una fase que retrasa borrar.
- **Reproducción:** una pasada; `pixel-dissolve` es un **efecto separado** de CSS/React para la desaparición, con píxeles de la paleta de Sofi y dirección de disolución desde los bordes hacia el centro, según el concepto aprobado. No generar duplicados de fotogramas para un efecto ya separado.
- **Termina / transición:** vuelve a una Sofi neutral y a una interfaz sin datos recuperados. No rehidratar inadvertidamente estado borrado al remontar componentes ni volver a guardar datos antiguos por efectos pendientes. El borrado restablece la preferencia de movimiento a `system`: la reacción mantiene el modo efectivo con el que empezó hasta que termina la confirmación, sin restaurar preferencias ni datos.
- **Interrupciones:** navegación, cierre de vista, cambio a un estado superior o reducción de movimiento. El borrado no se revierte ni se demora por ninguna de ellas.
- **Reducido:** borrar inmediatamente, sin temblor, explosión ni disolución; mostrar la pose estática del propio recurso (Sofi aterrorizada con su cartel) hasta que termina la confirmación funcional del borrado (§7.1). Después vuelve a la neutral, sin animación ni temporizador propio. El resultado funcional debe quedar claro en texto.
- **Particularidades:** **jamás** en la salida rápida; esta oculta el contenido y elimina la consulta temporal de inmediato, sin confirmación ni espectáculo. Tampoco se usa al borrar exclusivamente el expediente, descartar una edición o quitar un favorito. Los bordes deben ser elementos reales de la composición, no una caja ilustrada dentro del asset. La animación no sustituye la confirmación previa de borrado completo.

## 5. Eventos semánticos y casos de uso por flujo

La API semántica concreta se decidirá en el plan de 008. Esta tabla es el **contrato de comportamiento**, no una propuesta de nombres obligatorios para tipos TypeScript.

| Situación de interfaz | Representación | Condición relevante |
|---|---|---|
| Landing o consulta en reposo | `sofi-blink` | Sin intervención activa |
| Carga inicial real de la app o de una vista diferida | `rolling` (candidata) | Solo si la carga es perceptible; sin esperas artificiales |
| Usuario escribe o modifica campos | `sofi-blink` | No lanzar inferencia ni loader automáticamente |
| Sofi formula una pregunta con `SofiSpeech` | `talking` ↔ reposo/pausa | Solo mientras `speaking` |
| Sofi reconoce una respuesta del expediente | Expresión existente; `uncertain` si no se sabe / depende | No añadir una animación `listening` |
| Usuario pulsa «Leer entre líneas» | `sofing` (candidata) | Solo mientras la petición está realmente pendiente; primer ciclo según §6.4 |
| Resultado `interpreted` con señales comunicables | `eureka` o `suspicious` / neutral | Elegir por hechos autorizados; regla concreta pendiente de 006 |
| `interpreted` sin señales comunicables | Neutral / `sofi-blink` | No celebrar descubrimiento inexistente |
| Resultado `needs_context` | `needs-context` y pose estable | No repetir interrogaciones; conservar límites |
| Usuario responde «No sé más» | `uncertain` | Dejar de pedir datos |
| Discurso explicativo progresivo | `talking` | `speaking`, no reconstrucción de inferencia |
| Error técnico ordinario | `error` breve y neutral posterior | Sin ocultar aviso ni bloquear reintento |
| `safety_evaluation_unavailable` | Representación sobria, estática | Sin glitch ni humor |
| `safety_concern` | **Sin sprite ni humor** | Prioridad absoluta de seguridad |
| Favorito guardado efectivamente | `favoriting` | Una vez; feature 009 |
| Borrar solo expediente | Reacción neutra existente | No `memory-wipe`; no celebrarlo |
| Confirmar «Borrar todos mis datos» | Borrado inmediato; después `memory-wipe` | No retener/reconstruir contenido borrado |
| Salida rápida | **Nada animado**; contenido oculto al instante | Sin confirmación, sin `memory-wipe` |
| Inactividad real en escena tranquila | `are-u-still-here` | No escribir, leer o procesar; ~2–3 min |
| Ratón/tacto sobre Sofi, escena tranquila | `poking` | Solo ratón/toque; opcional |
| Puntero «observa» a Sofi ocasionalmente | `i-see-you` | No seguimiento permanente |

**No usar el género para elegir expresiones ni inferir señales.** La identidad editorial puede usar humor sobre novios/novias; Sofi adapta la concordancia solo a lo explícito en el contexto, sin reglas de género que determinen análisis o animaciones (acuerdo de 007).

## 6. Transiciones, prioridades e interrupciones

### 6.1. Jerarquía de intención

La jerarquía funcional aprobada como dirección es:

1. **Seguridad y privacidad:** salida rápida, `safety_concern`, borrado efectivo, error de evaluación de seguridad. Cancelan cualquier gag o animación incompatible.
2. **Flujo funcional activo:** consulta, procesamiento real, explicación, pregunta de contexto, errores, navegación, escritura/voz del personaje.
3. **Feedback de una acción:** guardar favorito, reacción breve a respuesta, recuperación tras una acción terminada.
4. **Comportamiento ambiental:** `poking`, `i-see-you`, `are-u-still-here` y otras bromas secundarias. Solo una de estas interacciones puede estar activa a la vez.
5. **Reposo:** `sofi-blink` es la representación de reserva.

Una acción de mayor prioridad **prevalece inmediatamente**. Al cancelar una reacción no se reanuda un estado obsoleto; se consulta el **estado semántico actual** y se representa lo que corresponda ahora. No ejecutar una cola de gags vencidos tras terminar el análisis.

### 6.2. Recorrido funcional previsto

```text
                         ┌─ necesidad de más contexto ─→ needs-context ─→ reposo
                         │                                    └─ no hay más datos ─→ uncertain ─→ reposo
reposo ─ envío explícito → processing (sofing) ───────────┬─ interpreted con señales ─→ eureka / suspicious* ─→ talking** / reposo
                                                          ├─ interpreted sin señales ─→ reposo + texto honesto
                                                          ├─ error ordinario ─→ error breve ─→ pose neutra
                                                          ├─ seguridad no evaluada ─→ vista sobria estática
                                                          └─ safety_concern ─→ vista sin sprites

favorito realmente guardado ─→ favoriting una pasada ─→ reposo
borrado total confirmado ─→ borrado inmediato ─→ memory-wipe opcional ─→ neutra
salida rápida ─→ ocultar y limpiar inmediatamente (sin animación)

reposo ─ escena tranquila ─┬─ interacción puntero/tacto ─→ i-see-you / poking ─→ reposo
                          └─ inactividad sostenida ─→ are-u-still-here ─→ reposo
```

`*` La selección exacta de `eureka`/`suspicious` requiere evidencias y reglas de 006; no forzar una elección con datos simulados.  
`**` Si el discurso se reproduce progresivamente y `speaking` está activo.

### 6.3. Matriz de interrupción

| Evento | Acción requerida |
|---|---|
| `safety_concern` | Cancelar animaciones, audio cómico, efectos y gags; mostrar UI de seguridad sin sprites |
| `safety_evaluation_unavailable` | Cancelar humor/glitch y representar el error sobriamente |
| Salida rápida | Ocultar UI y borrar consulta temporal **antes** de cualquier efecto; cancelar todos los controladores |
| Borrado completo confirmado | Borrar datos inmediatamente; después, si la vista continúa, permitir `memory-wipe` sin restaurar contenido |
| Cambia de ruta / desmontaje | Cancelar animaciones, observadores, eventos, timers y tareas pendientes de esa vista |
| Nueva consulta / `reanalizar` explícito | Invalidar la reacción anterior y pasar a procesamiento real; no solapar secuencias |
| Resultado llega durante loader | Con un resultado no crítico, sustituir el loader al completar su primer ciclo o al alcanzar el límite (§6.4); en los demás casos, incluido cualquier error, de inmediato |
| «Ver todo» / detener discurso | Cortar typewriter/voz y `talking`; dejar el texto completo accesible |
| Cambia la pregunta del expediente | Cancelar intervención hablada y reacción anterior; respetar el comportamiento ya definido por 004 |
| Escribe o interactúa con controles | Evitar/abortar easter eggs; no desplazar controles ni robar foco |
| Página oculta o pierde actividad relevante | Detener o limpiar trabajo ambiental y sincronías; no disparar reacciones inesperadas al regreso |
| Se activa movimiento reducido | Salir de movimiento continuo inmediatamente y mostrar estado estático coherente |
| Animación de un único ciclo termina | Retomar la intención vigente, sin recrear análisis ni ejecutar acciones automáticas |

**Coordinación de easter eggs:** los controladores de `poking`, `i-see-you` y `are-u-still-here` pueden tener motivos simultáneos de pausa (`busy`, otro easter egg, pantalla no visible, motion reduce). **Un `resume` de una causa no debe anular las restantes**. El agente deberá resolverlo como coordinación de estados, sin duplicar máquinas en React y scripts heredados.

### 6.4. Primer ciclo narrativo del análisis

Excepción acotada al principio §2.3, solo para `sofing` durante un análisis:

- La operación empieza en el acto; su ejecución nunca se retrasa.
- Solo un **resultado no crítico** (`interpreted` o `needs_context`) que llegue antes de que termine el primer ciclo puede aplazar brevemente su presentación hasta ese final.
- La duración del ciclo y el límite máximo se aprueban visualmente en el Design Lab (§12). Si se alcanza el límite, el resultado se muestra sin esperar a la animación.
- **Nunca esperan, y se muestran en cuanto se conocen:** todos los errores, sin excepción; seguridad (`safety_concern`, `safety_evaluation_unavailable`); privacidad y borrado; cancelación; salida rápida; movimiento reducido.
- Si la operación ya terminó, la etiqueta de actividad lo refleja: no finge que Sofi sigue procesando.
- No se aplica a la carga inicial de la página ni de una vista (`rolling`).

## 7. Accesibilidad de Sofi y movimiento reducido

### 7.1. Contrato para tecnologías de asistencia

**Regla normativa:** los spritesheets, sus fotogramas y los efectos visuales de Sofi son **decorativos por defecto**. Una persona que use lector de pantalla no necesita una descripción de las poses, miradas, transiciones, destellos, bucles ni *easter eggs*. La accesibilidad se garantiza mediante **el contenido funcional que acompaña al personaje**, no narrando la animación.

**Obligatorio para los agentes:**

1. **Ocultar solo la representación visual decorativa.** Un sprite decorativo y sus capas/efectos no aparecen en el árbol de accesibilidad: `aria-hidden="true"` en su contenedor puramente visual, o `alt=""` si se representa con `<img>`. No añadir `role="img"`, etiquetas alternativas que describan gestos ni regiones vivas a los fotogramas. **Nunca** aplicar `aria-hidden` a un contenedor con texto significativo, botones, avisos o controles interactivos.
2. **Comunicar cada hecho funcional por su canal propio.** Procesamiento → estado textual; pregunta o respuesta → texto completo; error → mensaje y acción disponible; favorito guardado → confirmación; borrado completo → confirmación del borrado; seguridad → información y recursos correspondientes. Los elementos ya accesibles del flujo son la fuente del anuncio, no el spritesheet.
3. **Evitar anuncios duplicados.** No crear un `aria-live`, `role="status"` o `role="alert"` adicional en la capa de animación si el componente funcional ya anuncia el mismo hecho. No anunciar cada fotograma, cada carácter escrito, cada parpadeo ni el paso de `eureka` a `talking`. `SofiSpeech` mantiene su contrato: texto completo disponible para el lector de pantalla y anuncio coherente una sola vez, independiente del *typewriter* visual.
4. **No depender nunca de una expresión.** Si un gesto parece transmitir algo que no está en el texto (incertidumbre, necesidad de contexto, error, guardado o resultado), debe quedar expresado en el contenido funcional accesible. **No** resolver la falta de información agregando una descripción del sprite: corregir el texto o estado funcional.
5. **Los *easter eggs* no son acciones necesarias.** `poking` responde solo a ratón o toque, sin equivalente de teclado, botón artificial, `tabIndex` ni foco propios. `i-see-you` y `are-u-still-here` tampoco necesitan anuncios especiales. Esto solo es válido porque son **opcionalmente decorativos**: no deben contener información exclusiva, controlar funciones ni bloquear controles. Los botones y acciones reales de la aplicación siguen siendo operables con teclado y lector de pantalla.
6. **No asociar ceguera con movimiento reducido.** Son necesidades distintas. Un lector de pantalla no activa por sí mismo el modo reducido: se respetan las preferencias de movimiento independientemente de la tecnología de asistencia usada.

| Estado de Sofi | Información accesible necesaria | Lo que **no** se anuncia |
|---|---|---|
| `blink`, `poking`, `i-see-you`, `are-u-still-here` | Ninguna específica del sprite | Poses, miradas, sueño, pinchazos, bromas |
| `sofing`, `rolling` | El estado textual de procesamiento o de carga, mientras corresponda | Giros, tecleo, estrellas, vueltas |
| `talking` | El contenido completo de `SofiSpeech`, conforme a su contrato | Movimiento de boca, pausas y fotogramas |
| `eureka`, `suspicious` | El resultado y sus limitaciones, expresados por la UI | Sorpresa, sospecha o «descubrimiento» visual |
| `needs-context`, `uncertain` | Pregunta o explicación de incertidumbre; los límites pertinentes | Gestos de interrogación o asentimiento |
| `error` | Tipo de problema expresable y acciones disponibles, sin detalles de proveedor | Glitch, KO o reinicio visual |
| `favoriting` | Confirmación de guardado real, emitida por la acción | Gafas, sello y celebración |
| `memory-wipe` | Confirmación de borrado efectivo; el borrado no espera a la animación | Pánico, disolución y reaparición |
| `safety_concern` / `safety_evaluation_unavailable` | Texto y recursos/estado sobrios, accesibles, propios de 007 | No se muestran ni anuncian gags o sprites incompatibles |

**Límite de la regla:** «decorativo» describe **el recurso visual**, no el hecho funcional que pueda acompañarlo. No esconder mensajes de carga, resultados, preguntas, errores, confirmaciones ni recursos de ayuda bajo el pretexto de que Sofi sea decorativa.

### 7.2. Movimiento reducido y control de animaciones

**La representación funcional y textual es obligatoria aunque no haya animación.** `prefers-reduced-motion: reduce` y el modo forzado `[data-motion='reduce']` deben producir resultados funcionalmente equivalentes: detener o evitar el movimiento de CSS **y** de controladores JS, limpiar eventos/temporizadores de animación y presentar una pose estática adecuada. No limitarse a congelar el fotograma en que se encuentre. La preferencia propia `full` (`tech-stack.md` §44) es una elección expresa de la persona: con ella Sofi se comporta como sin reducción aunque el sistema la pida.

| Categoría | Con movimiento reducido |
|---|---|
| Reposo `blink` | F0 fijo |
| Procesamiento y carga `sofing`/`rolling` | Fotograma estático y estado textual de procesamiento o carga; ninguna inferencia se retrasa ni se retiene su resultado (§6.4) |
| Habla `talking` | Rostro estático; `SofiSpeech` expone el texto entero de inmediato |
| Resultado `eureka`/`suspicious`/`needs-context`/`uncertain` | Pose final o representativa fija; contenido completo disponible |
| `error` | Pose sin glitch ni destellos; explicación y acciones legibles |
| `favoriting` | Confirmación estática de favorito guardado, con feedback textual |
| `poking`/`i-see-you` | Reacción estática muy breve o desactivación del gag; no rastreo animado |
| `are-u-still-here` | Estado estático o reacción ambiental desactivada; no sobresalto |
| `memory-wipe` | Borrado inmediato y pose estática del propio recurso (Sofi aterrorizada con su cartel) hasta que termina la confirmación del borrado; después, neutral. Sin temblor, disolución, animación ni temporizador propio |
| Seguridad y salida rápida | Sin animación en cualquier modo |

**Requisitos adicionales:**

- Si una animación automática prolongada acompaña contenido no animado, verificar si necesita un mecanismo de pausa, parada u ocultación según las reglas de accesibilidad. La mera existencia de `prefers-reduced-motion` **no sustituye automáticamente** ese control. Resolverlo de forma global o contextual cuando sea suficiente, sin inventar un botón por fotograma o sprite.
- Verificar efectos luminosos, frecuencia de destellos/glitch, saltos, recortes, zoom y tamaños reales en claro y oscuro; una alternativa estática no excusa efectos inseguros en modo normal.
- No robar el foco, desplazar acciones táctiles ni ocultar controles al ejecutar una reacción. Los bordes reales pueden formar parte de un gag solo si no comprometen la interacción.
- El Design Lab debe probar **por separado**: anuncios con lector de pantalla (a nivel de la UI funcional), preferencia de movimiento del sistema, modo forzado `data-motion`, pausa de bucles cuando proceda y ausencia de movimiento residual de CSS/JS. **No** exigir auditorías de accesibilidad fotograma a fotograma.

## 8. Design Lab — catálogo visual y ajuste individual

**Ubicación:** ampliar `Motion & Sound` de 002, manteniendo `SofiSpeech`, sonido, sincronización y parpadeo ya implementados. No crear un segundo Design Lab.

**Objetivo:** comprobar el asset real y sus transiciones antes de integrarlo en pantallas. Los recursos se prueban en su composición real y los controles del laboratorio no alteran por sí solos las preferencias públicas.

El inspector de cada entrada debe permitir:

- Elegir una de las **14 animaciones**, ver el nombre, intención, si es bucle/una pasada/máquina y su estado de activación.
- **Velocidad personalizada e independiente por spritesheet**, partiendo de `1×` (timing original); controles de pausar, reproducir, reiniciar y comparar con la velocidad original. La velocidad individual elegida debe mantenerse al cambiar entre entradas durante la sesión del laboratorio.
- Acelerar/ralentizar **todas las capas y efectos sincronizados**, no solo el cuerpo principal: sombras, sellos, partículas, pseudoelementos, líneas, `Zzz` y animaciones gestionadas con JS cuando corresponda.
- Probar bucle frente a pasada única, reinicio por nuevo evento y cancelación durante una transición.
- Simular eventos reales: `speaking`/pausa/«Ver todo», petición pendiente/completada, falta de contexto, respuesta incierta, favorito guardado, toque secuencial, puntero, inactividad/despertar, confirmación de borrado y salida rápida.
- Comprobar secuencias entre assets: `blink → talking → blink`, `processing → resultado`, `needs-context → uncertain`, `favoriting → blink`, `memory-wipe → neutral`, y prioridades de easter eggs.
- Activar movimiento reducido del sistema y modo forzado; visualizar **el fotograma estático correcto**, sin controles JS supervivientes.
- Revisar escalas y contenedores representativos: escenario entero, insignia, busto apoyado en borde, layouts anchos y estrechos, ambos temas; verificar que brazos, estrellas, sellos o saltos no se corten.
- Hacer constar **aprobación visual** de la velocidad productiva y de transiciones cuando corresponda. No sustituir la línea temporal del ZIP ni crear dos constantes autoritativas de duración solo por usar un slider.

**Importante:** el inspector puede usar una abstracción de velocidad para animaciones ya existentes (p. ej. Web Animations API) si queda demostrada su sincronía real. No decidir aquí que `getAnimations().finished`, `animationend` o un temporizador único funcionen para todos los tipos; la elección queda en el plan técnico tras probar los ZIP en navegador.

**Preview / 007:** conservar el layout aprobado de los componentes actuales; reemplazar placeholders visuales sin reescribir el formulario ni el comportamiento funcional de la consulta. El Design Lab es la validación de lo no aprobado, no una autorización para rediseñar la app.

## 9. Restricciones de integración y puntos de auditoría

Esta sección enumera **problemas a resolver**, no prescribe nueva arquitectura ni copia `tech-stack.md`.

1. **ZIP terminado ≠ animación usada.** Importar solo el parcial de cada animación por su consumidor; `_index.scss` incluye todas y no debe entrar en los módulos de producción. Garantizar un único dueño efectivo del parcial para evitar CSS repetido.
2. **CSS Modules y keyframes:** nombres potencialmente hasheados; no comparar `animationName` con literales en TS ni apoyarse en el nombre del `@keyframes` para decidir un estado. No poner dos clases de cuerpo que compitan por `animation`/`background-image` sobre el mismo elemento.
3. **Una pasada vs loop de exportación:** `favoriting`, `needs-context`, `error` y otros traen en sus parciales comportamientos que no necesariamente coinciden con su duración funcional. Respetar los fotogramas aprobados y obtener una sola ejecución sin romper el asset.
4. **Timers y eventos:** el inspector y la integración deben probar la sincronización de secuencias de múltiples capas, cancelaciones, desmontajes, pausas y cambios de velocidad. Evitar copiar una duración del SCSS a JS de manera silenciosa.
5. **Controladores de cuarta pared:** auditar sus `attach*`, `destroy()`, concurrencia, listener global y compatibilidad con React StrictMode. Corregir el bug de motivos de pausa señalado en `attachPoking`.
6. **Movimiento reducido forzado:** en la auditoría, `poking`, `are-u-still-here` e `i-see-you` seguían con movimiento bajo `data-motion='reduce'`; otros parciales mostraban un fotograma diferente al fallback diseñado. Corregir ambas divergencias, no deshabilitar solo CSS y dejar JS activo.
7. **Visibilidad y carga:** `background-image` puede quedar en blanco antes de decodificar el WebP. Mantener un fotograma estático de respaldo y cargar de forma prudente; no precargar todas las tiras y controladores por si acaso.
8. **Recortes:** `rolling` y `favoriting` sobresalen; `error` y `eureka` incluyen salto del cuerpo. Inspeccionar en componentes reales del Design Lab, no asumir que una tarjeta con `overflow: hidden` sirve para todo.
9. **Renderizados de texto:** la animación de boca consume `speaking`; no disparar renderizados del escenario entero por cada carácter de `SofiSpeech`.
10. **Concurrencia y seguridad:** nada de efectos ambientales durante entrada de datos sensibles, vista de seguridad o salida rápida; cancelar también audio, `Zzz`, FX y timers, no únicamente la animación principal.
11. **Pruebas:** unitarias para selección semántica y prioridad; integración de controladores y limpieza; Playwright para reproducción real, `prefers-reduced-motion`, `data-motion`, cambios de velocidad, recortes, composición, ejecución única y cancelaciones. Comprobar CSS y recursos finales de producción.
12. **Visuales cerrados:** no retocar la ilustración de los 12 recursos confirmados, ni `uncertain` (asumido cerrado para la planificación) ni `memory-wipe` (aprobado). Si algo exige cambiar el arte, consultar antes de modificar.

La auditoría del 2026-10-21 detectó, entre otras cosas, CSS duplicado por importaciones múltiples, diferencias en reduced motion, duraciones repetidas entre CSS/JS y que solo `sofi-blink` estaba realmente **en uso** en aquel corte del repositorio. Esa auditoría es evidencia del estado revisado, no un contrato que deba imponer todas sus soluciones de implementación.

## 10. Reparto funcional entre features

| Feature | Responsabilidad |
|---|---|
| **002 — Design System** | El Design Lab existente y los contratos de `SofiSpeech`. Su sección `Motion & Sound` se amplía para inspeccionar el conjunto real. |
| **004 — Partner Profile** | Estados y textos del expediente ya funcionales. No reescribir el formulario; 008 sustituye recursos provisionales según sus estados semánticos. |
| **007 — Chat Experience** | Emitir estados semánticos, gestionar resultados, seguridad, descarte temporal de la consulta, salida rápida y privacidad; no acoplar el núcleo de análisis a archivos de sprites ni exigir funcionamiento real de 006 para desarrollar la UI con fakes. |
| **008 — Sofi Character & Motion** | Integrar los ZIP y el catálogo en la capa visual, coordinar transiciones, easter eggs, movimiento reducido, rendimiento y pruebas; respetar decisiones visuales del Design Lab. |
| **009 — Favorites/History** | Emitir evento de favorito guardado al persistirlo realmente; la capa visual puede representarlo con `favoriting`. Asume el borrado completo, con la interfaz «Borrar todos mis datos», que reutiliza el borrado de 003 y el contrato visual de 008. |
| **006 — Jev Integration** | Proveedor, calibración y contrato de inferencia; **no** determina por sí solo animaciones. Las reglas de `eureka`/`suspicious` condicionadas a señales validadas esperan su desbloqueo. |

**No iniciar implementación parcial definitiva de 008 hasta disponer del conjunto de spritesheets acordado y haber completado las verificaciones correspondientes**, siguiendo la preferencia expresada por la autora. Pueden trabajarse documentación, simulaciones y Design Lab sin llamadas a proveedores reales.

## 11. Excluidos y decisiones obsoletas

| Idea | Estado definitivo | Razón |
|---|---|---|
| **007 `listening` / acknowledging** | **Descartado** | Escucha y pequeñas reacciones cubiertas por `blink`, `talking` y `uncertain`; no crear ZIP, no reasignar el número 007 |
| **Red Flags / parade** | **Fuera del catálogo y de la integración** | Gag visual dependiente de conclusiones complejas; no autoriza etiquetar a una pareja |
| **Detective / Ghosting** | **Fuera del catálogo y de la integración** | No hay regla simple y responsable para deducir ghosting |
| **Escaping the Div** | **Descartado**, no solo pospuesto | No desarrollar ni dejar tareas pendientes en 008 |
| **SOFI.EXE** como animación adicional | **Unificado en `error` (011)** | Es el mismo concepto/recurso |
| **`poking` con teclado** | **Obsoleto y descartado** | Solo ratón y toque; easter egg opcional |
| **Seguimiento permanente y miradas aleatorias** | **Descartados** | `i-see-you` ocasional y reactivo al puntero |
| **Memory Wipe en salida rápida** | **Prohibido** | La salida rápida es inmediata y sobria |
| **Memory Wipe al borrar solo expediente** | **No previsto** | Borrar una ficha no es borrado completo |
| **Favoriting al guardar expediente** | **No previsto** | Favoritos y expediente son acciones semánticamente diferentes |
| **Exclamaciones rosas de 004** en «Volver a la consulta» | **Retiradas en 004** | Asset original conservado, no integrarlo automáticamente |
| **Animaciones de resultado como prueba de certeza** | **Prohibido** | 005 usa señales independientes, sin ganador obligatorio |
| **Animaciones nuevas de Thinking/Reading** | **No justificadas en este inventario** | Estados cubiertos por los recursos actuales; no ampliar catálogo sin una necesidad nueva |

**No borrar arte histórico únicamente porque esté fuera de alcance.** Es válido conservarlo en archivos de origen no publicados, pero no introducirlo en el bundle, el catálogo activo ni las rutas de producción.

## 12. Decisiones de producto todavía abiertas (sin bloquear el inventario)

Estas dudas **no** justifican crear nuevos spritesheets ni cambiar el significado aprobado de los existentes. Se resuelven en Design Lab o tras 006, según corresponda.

| Decisión | Cuándo se resuelve | Criterio |
|---|---|---|
| Validar `sofing` (análisis) y `rolling` (carga de la app o de una vista) | Design Lab; mediciones de rendimiento para `rolling` | No distraer ni introducir espera ficticia; respetar tono sensible |
| Duración del primer ciclo y límite máximo (§6.4) | Design Lab | Aprobación visual; nunca para resultados críticos ni errores |
| Retraso visual mínimo del loader para evitar flash | Plan 008, con medidas | Nunca retener análisis; no añadir duración arbitraria solo para enseñar sprites |
| Pausas de `talking`: boca quieta o `blink` | Design Lab | Evitar saltos y sincronización incorrecta |
| Escala/recorte de `rolling`, `favoriting`, `error`, `eureka` | Design Lab | Cuerpo y FX sin cortes ni «despegue» indeseado de bordes |
| Selección exacta de `eureka` vs `suspicious` | Después de 006 | Reglas respaldadas por señales comunicables; si no, neutral |
| Fotograma reducido definitivo de cada ZIP | Design Lab, tras inspección | Estado estático comprensible y visualmente aprobado |
| Una pasada en assets que exportan `infinite` | Plan técnico 008, validado en Lab | No modificar arte; no repetir celebraciones/errores |
| Forma de coordinar `getAnimations`, timers y controladores JS | Plan técnico 008 | Basarse en pruebas reales y evitar duraciones duplicadas |
| Ubicación exacta de easter eggs y manos sobre bordes | Design Lab | Respetar composición responsiva y no tapar controles |
| Velocidad de producción de cada animación | Design Lab | Ajuste individual por spritesheet; no confundirlo con la preferencia pública |

## 13. Checklist de cierre previo a implementación

- [x] Los **14 recursos activos** y sus dependencias están identificados realmente en el repositorio: 001–006 y 008–015 (007 no existe por decisión). Verificado el 2026-10-23 (`asset-provenance.md` §8).
- [ ] `uncertain` y `memory-wipe` tienen ZIP/fuentes verificables en la ubicación acordada y sus nombres finales corresponden al inventario; no se inventaron rutas.
- [ ] No se reprocesaron ni alteraron los fotogramas artísticamente definitivos.
- [ ] El Design Lab muestra cada sprite real, controla individualmente su velocidad y prueba sus capas y transiciones.
- [ ] Se revisaron en navegador bucles, una pasada, interrupciones, limpieza y concurrencia de easter eggs.
- [ ] `prefers-reduced-motion` y `data-motion='reduce'` detienen correctamente **CSS y JS** con fallback visible.
- [ ] Los sprites decorativos están excluidos del árbol de accesibilidad sin ocultar texto ni controles; los cambios funcionales se anuncian una sola vez desde sus componentes, sin narración de fotogramas ni anuncios duplicados.
- [ ] `poking` permanece como gag opcional solo para ratón/toque, sin falso botón ni foco de teclado; todas las acciones reales siguen siendo accesibles.
- [ ] Los bucles automáticos que lo requieran tienen mecanismo de pausa/parada/ocultación, y el glitch ha superado una verificación de destellos.
- [ ] Las animaciones funcionales no retrasan contenido, borrado ni decisiones de seguridad.
- [ ] Los controladores no descargan tiras innecesarias ni duplican listeners/CSS.
- [ ] Los recortes, bordes y efectos funcionan en las composiciones aprobadas y distintos tamaños.
- [ ] El borrado total se realiza antes de `memory-wipe` y la salida rápida nunca reproduce ese asset.
- [ ] El plan y las tareas de 008 referencian este catálogo sin copiar sus fichas.
- [ ] Las decisiones aún abiertas están asignadas a Design Lab, plan 008 o 006, sin inventar respuestas.

## 14. Referencias y trazabilidad

**Fuentes normativas del proyecto:**

- `AGENTS.md`: fuentes de verdad, reutilización de componentes, aprobación de cambios visuales y alcance.
- `spec/constitution/mission.md`: límites editoriales y de interpretación responsable.
- `spec/constitution/roadmap.md` §11: Phase 008, esperas reales, animaciones sin bloquear y alternativa estática.
- `spec/constitution/tech-stack.md` §§44–46.1: accesibilidad, movimiento reducido e integración de spritesheets.
- `spec/constitution/art-direction/README.md`: dirección C «Exclusiva», composición y pendientes de 007.
- `spec/features/002-design-system-&-visual-identity/002-spec.md` y Design Lab `Motion & Sound` (tableros 4.1, 4.3, 4.4).
- `spec/features/004-partner-profile-&-onboarding/004-plan.md` §§5–6; `src/features/partner-profile/sofiGuide.ts` y `sofiVisuals.ts`.
- `spec/features/005-analysis-domain/005-spec.md` y `spec/features/007-ask-sofi-chat/007-spec.md`.
- `src/styles/sprites/` y cada ZIP definitivo: **autoridad de las secuencias y timing de los assets**.

**Reconstrucción de decisiones:** conversaciones del proyecto Ask Sofi («002 — Design System & Visual Identity», «Crear assets para Sofi» y revisión de 007), decisiones explícitas de la autora hasta el 2026-10-21, más auditoría técnica del agente adjunta el mismo día. La autora confirmó que 002–006 y 008–013 son artísticamente definitivos; descartó `listening`, Red Flags, Ghosting, Escaping the Div y `poking` por teclado; unificó SOFI.EXE con `error`; mantuvo Memory Wipe para el borrado completo y pidió tratar todos los recursos como disponibles para redactar este catálogo.

**Nota de verificación:** las observaciones sobre el estado anterior del repositorio proceden de la auditoría, mientras que la disponibilidad total descrita en §1 es el **supuesto de planificación** indicado por la autora. El agente debe contrastar archivos y ZIP antes de realizar cambios. Este catálogo **no afirma** que haya ejecuciones o pruebas de navegador superadas, ni desbloquea 006 o autorizaciones de gasto.
