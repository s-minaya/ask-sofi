# 004 — Partner Profile & Onboarding — Plan

## Status

In Review

## Approach

Se implementará una ficha de perfil local guiada por Sofi, reutilizando la infraestructura de las features `002` y `003`.

Orden previsto:

```text
Existing code & asset audit
    ↓
Profile contracts
    ↓
Persistence integration
    ↓
Sofi interaction model
    ↓
Design Lab approval
    ↓
Profile interface
    ↓
Integration & verification
```

La interfaz no se implementará definitivamente hasta validar su nueva composición visual.

## 1. Existing infrastructure audit

Antes de desarrollar nuevos componentes:

- Identificar los contratos y repositorios de almacenamiento disponibles en `003`.
- Revisar los componentes de formulario, diálogo, typewriter y sonido de `002`.
- Inventariar las imágenes, expresiones y spritesheets de Sofi realmente disponibles.
- Identificar los controles, layouts y estados que pueden reutilizarse o extenderse.

Se priorizará la extensión de componentes existentes frente a la creación de alternativas paralelas.

### Resultado de la auditoría (T001)

| Necesidad | Se reutiliza | Hueco detectado |
|---|---|---|
| Persistencia del perfil y del onboarding | `versionedRecord` (sobre + versión + Zod), `localArea`, `WriteResult` / `PersistFailure`, `STORAGE_KEYS` | Faltan las dos claves y su ámbito en `storageEvents` |
| Borrado global | `clearUserData` borra todo `ask-sofi:*` en ambos almacenamientos y en memoria | Las claves nuevas quedan cubiertas solo si llevan el prefijo. No existe interfaz que lo invoque: en `004` su integración se verifica con tests, sin crear interfaz |
| Pregunta hablada | `SofiSpeech`: typewriter, «Ver todo», cancelación por `key`, anuncio único `aria-live`, fragmento con movimiento reducido, `onStateChange` para sincronizar a Sofi | Nada pausa la escritura ni la voz cuando la página deja de estar visible |
| Reacción breve | `SofiDialog` / `SofiDialogText` sin typewriter | — |
| Sonido | `SoundProvider` + `speechAudio`: un contexto, un buffer, un canal, desbloqueo en gesto | La app usa `deferAudio`: hay que llamar a `unlock` en el gesto que abre el expediente |
| Movimiento reducido | `useReducedMotion`, `MotionPreferenceProvider` | — |
| Opciones | `OptionGroup` (radios nativos en `fieldset`) | `value` es obligatorio: se extiende para representar «sin responder» y permitir «Quitar respuesta» |
| Notas | `TextArea` con `Counter` y error al enviar | `Counter` no muestra el límite |
| Acciones y avisos | `Button` (`loading`, `aria-disabled`), `Notice` / `InlineNotice`, `FieldMessage` | — |
| Navegación entre áreas | — | No existe componente; `SegmentedControl` no está pensado para seis entradas con estado de respuesta |
| Confirmar eliminación | `Notice` + `NoticeActions`: confirmación accesible en línea | No se crea un diálogo modal |
| Retrato de Sofi | `SofiPortrait` (estado → fotograma) | Acoplado a `sofi-blink.webp`: no admite imágenes estáticas ni otros spritesheets |

## 2. Profile data model

Definir un modelo tipado que represente las seis áreas de `004-spec.md` mediante identificadores y valores estables.

Cada respuesta será opcional.

Se diferenciarán explícitamente:

- Pregunta sin responder.
- Incertidumbre declarada.
- Respuesta condicionada.
- Respuesta concreta. «Cambia bastante según el momento» es una respuesta concreta, distinta de «Depende» y «No lo sé».

Las notas adicionales tendrán validación de longitud y contenido, con un límite inicial propuesto de 500 caracteres.

Se utilizará Zod para validar los datos persistidos. Cada campo se recupera por separado, como las preferencias: una respuesta desconocida deja su área sin responder y unas notas no válidas se descartan, sin perder el resto del expediente.

Modelo y esquema: `src/domain/partner-profile/`.

El modelo no incluirá interpretaciones psicológicas, puntuaciones ni inferencias sobre la pareja.

## 3. Profile persistence

Extender la infraestructura existente de `003` con las operaciones específicas del expediente.

Implementar:

- Lectura y validación del perfil.
- Creación y actualización explícita.
- Eliminación individual.
- Integración con el borrado global.
- Persistencia del estado de la invitación inicial.

El estado de edición se mantendrá separado del perfil persistido hasta guardar.

Los errores de lectura o escritura utilizarán los mecanismos de recuperación existentes.

No se introducirá otro sistema de almacenamiento ni un nuevo contexto global sin necesidad.

### Contratos (T005–T008)

| Dato | Almacenamiento | Clave | Módulo |
|---|---|---|---|
| Expediente | `localStorage` | `ask-sofi:partner-profile` | `partnerProfileStorage` |
| Invitación presentada | `localStorage` | `ask-sofi:onboarding` | `onboardingStorage` |

- **Guardar** valida con `prepareProfileForSave` y devuelve `saved`, `memory-only` (con el motivo de `003`) o `rejected`. Solo `saved` puede presentarse como guardado.
- **Leer** devuelve el `ReadOutcome` de `003`: los datos no válidos o de una versión posterior nunca se utilizan, y una versión posterior no se sobrescribe.
- **Eliminar** borra solo el expediente, también su copia en memoria.
- **Avisos:** guardar, eliminar y el borrado global avisan con `subscribeToPartnerProfile`, para que React no conserve un expediente obsoleto.
- **Onboarding:** el registro se escribe al presentar la invitación. Si existe pero no se puede leer (corrupto o de una versión posterior), cuenta como presentada: solo puede existir si ya se mostró. Con el almacenamiento bloqueado no se repite en la sesión; tras recargar sí puede volver, porque no hay dónde recordarlo.
- **Borrado global:** `clearUserData` ya cubre ambas claves por su prefijo, también lo que solo vivía en memoria, y deja la invitación pendiente. No se ha modificado.

## 4. Onboarding integration

Integrar la invitación inicial dentro del consultorio sin alterar su flujo principal.

La aplicación distinguirá:

- Invitación todavía no presentada.
- Invitación presentada y registrada.
- Perfil inexistente.
- Perfil existente.

Una vez presentada, la invitación no volverá a mostrarse automáticamente.

El acceso permanente al expediente será independiente del estado de la invitación.

La invitación es lo primero que dice Sofi (revisión visual, 2026-10-13): el primer diálogo de la consulta, con Sofi asomándose sobre el borde de su propio bocadillo en lugar del retrato (una sola Sofi) y sin bloquear nada. Antes iba como una tarjeta tras «Leer entre líneas», donde se arriesgaba a pasar inadvertida. El acceso permanente queda en el pie de su diálogo.

La eliminación global restablecerá ambos estados a sus valores iniciales.

### Implementación (T013–T014, T034)

`ConsultationScreen` recibe `invitation` (`onOpen`, `onDismiss`) y `profileAccess` (`saved`, `onOpen`); `ProvisionalConsultation` los conecta con `onOpenProfile`. El hueco `after` queda para el aviso de la vista previa.

- **Invitación.** Primer diálogo de Sofi: «Espera, antes de empezar… ¿me das un poco de contexto?» y «Son seis preguntas opcionales sobre cómo se comunica tu pareja. Así tendré más pistas para interpretar sus mensajes. Puedes guardar las respuestas solo en este dispositivo.», con «Responder preguntas» y «Ahora no». El mismo texto en móvil y escritorio; el copy vive en `INVITATION_COPY`.
- **Sofi asomada.** Es `sofi-peek` y sustituye al retrato mientras dura la invitación. En una columna mide 192 px (la mitad exacta del sprite; antes 168 px, una fracción que emborronaba el pixel art). A dos columnas se adapta al **alto de la ventana**, no al dispositivo: 384 px (sprite entero, texto a 20 px) desde 840 px de alto, 288 px (3/4, texto a 18 px) desde 712 px y 192 px por debajo (`$bp-roomy` y `$bp-regular`, en em: crecen con el texto). Antes era 288 px con cualquier alto, y a 1920 × 1080 dejaba 200 px de banda vacía. Medido con texto al 100 %, las acciones quedan a la vista de 320 × 568 a 1920 × 1080, también en 1366 × 650, el área útil de un portátil de 768 px con la barra del navegador; con texto ampliado en una pantalla muy baja se acepta el scroll.
- **Etiqueta de la región.** Durante la invitación se llama «Sofi te pide contexto» (lo que sucede); el resto del tiempo, «Sofi está escuchando», igual que el indicador visible a dos columnas. Sustituye a «Sofi te escucha».
- **«Ahora no»** vuelve al diálogo de siempre y lleva el foco a lo que dice Sofi, para no perderlo en el documento.
- **Acceso permanente.** En el pie del diálogo: «Abrir expediente» o, con expediente guardado, «Editar expediente» (en escritorio, con la etiqueta «Expediente»). Ya no hay línea aparte ni «Guardado en este dispositivo».
- `useProfileInvitation` lee el estado de `onboardingStorage` al montar y registra la presentación en un efecto: durante esta visita a la consulta sigue en pantalla hasta que se descarta y no vuelve al recargar ni al regresar de la ficha.
- `useSavedPartnerProfile` lee el expediente y se suscribe a `subscribeToPartnerProfile`: el acceso cambia sin recargar. Un expediente ilegible o de una versión posterior no cuenta como guardado.
- `AppShell` añade la vista `profile`. No se recuerda en `sessionStorage` (su borrador vive en memoria): una recarga durante la edición vuelve a la consulta, cuyo borrador sí se conserva. Abrir el expediente llama a `unlock` dentro del gesto, para que el audio diferido pueda sonar con la pregunta.

## 5. Sofi interaction model

Definir un conjunto mínimo de estados semánticos para esta feature:

| State | Purpose |
|---|---|
| `inviting` | Presentar la invitación inicial |
| `asking` | Formular una pregunta |
| `waiting` | Esperar una respuesta |
| `acknowledging` | Reaccionar a una selección |
| `uncertain` | Reconocer «Depende» o «No lo sé» |
| `saved` | Confirmar un guardado |
| `validationError` | Comunicar un formulario vacío |
| `deleting` | Acompañar la confirmación de eliminación |
| `deleted` | Quedarse neutra tras eliminar: borrar no se celebra |

Estos estados pertenecen a la experiencia de interfaz y no al modelo persistido de la pareja.

La selección de respuestas no avanzará automáticamente a otra pregunta.

Las reacciones breves no sustituirán ni reiniciarán el texto de la pregunta activa.

### Implementación (T009)

`src/features/partner-profile/sofiGuide.ts`: reducer puro con el área activa, la intervención hablada en curso, la reacción breve y la confirmación de eliminación. No conoce ningún archivo multimedia.

- Cada pregunta formulada es una intervención numerada: cambiar de área la sustituye y cancela el typewriter y la voz anteriores.
- Toda reacción deja la pregunta escrita entera y sin voz, y dura `REACTION_MS` (1,8 s). Responder mientras Sofi habla completa la pregunta al instante.
- Causas y estados: responder, quitar respuesta o descartar → `acknowledging`; «Depende» o «No lo sé» → `uncertain`; guardar → `saved`; guardar vacío o solo en memoria → `validationError`; eliminar → `deleted`.
- Ocultar la página detiene la intervención hablada.

### Integración (T018–T022)

`ProfileScreen` conecta el reducer con la ficha a través de `useSofiGuide` (reacción que termina sola a los `REACTION_MS` y parada al ocultar la página; el Design Lab usa el mismo hook).

- Preguntas: `SofiSpeech` con typewriter, voz y «Ver todo». Cada pregunta es una instancia nueva (`playToken`): cambiar de área o salir de la ficha cancela temporizadores y voz de la anterior (la voz calla en la limpieza del efecto), sin solaparse.
- Reacciones: responder o quitar una respuesta dispara `answer` o `clearAnswer`. El comentario aprobado aparece en el pie ya reservado, sin typewriter ni voz; la pregunta queda entera. Cada reacción tiene su temporizador: una nueva cancela el de la anterior y un temporizador viejo no cierra la nueva. Cambiar de área descarta la reacción.
- Sonido: abrir el expediente con el sonido activado, o activarlo desde la cabecera estando en él, llama a `unlock` en ese gesto (audio diferido). En la consulta, activarlo no descarga el audio. Con movimiento reducido suena un único fragmento por pregunta y las reacciones no suenan.
- Anuncios: la pregunta se anuncia entera, una vez, en su región `aria-live`; el comentario, en la región `role="status"` persistente. La copia que se escribe y la reserva de alto van `aria-hidden`.
- Recursos: el estado visual sale de `sofiVisuals`. Mientras una imagen carga o si falla se ve el fotograma de reserva, y la ficha sigue respondiendo. Guardar, descartar y eliminar (T023–T024) aún no reaccionan.

### Completar y volver (T041–T044)

La sexta respuesta, cuando deja las seis áreas respondidas **con cambios sin guardar**, es una reacción propia de Sofi (`completed`, expresión de reconocimiento, comentario «Seis de seis. Solo falta guardarlo.», que es también el anuncio). `ProfileScreen` lo decide (`isProfileComplete` del dominio) y lo pasa al reductor como `completes`; no se deduce en un efecto. «No lo sé» y «Depende» cuentan como respuestas. Cambiar una respuesta de una ficha ya completa, o abrir un expediente completo, no lo celebra.

- **Salto de «Guardar».** Al completar, «Guardar» da un salto breve (`cta-hop`, `--duration-celebrate`: 0,6 s), una sola vez y sin bucle. Es una celebración **debida** (`celebration` en el estado de Sofi) que se paga **cuando «Guardar» está entero en la pantalla** y la página lleva 150 ms quieta (`SETTLE_MS`): no depende de lo que dura la reacción, porque con «Guardar» fuera de la pantalla se daba donde nadie lo veía. Si «Guardar» sale a mitad, vuelve a deberse; guardar, descartar o quitar la respuesta la anulan. Con movimiento reducido no se mueve. Aparece solo si hay algo que guardar.
- **Guía a «Guardar».** Con las seis áreas y algo sin guardar, si «Guardar» no está entero en la pantalla, el pie del bocadillo ofrece «Ir a guardar» (`SHEET_COPY.goSave`), que sustituye al comentario de la reacción cuando este acaba, en su misma celda: el pie no cambia de alto. Activarla lleva el botón real al centro de la pantalla (`scrollIntoView`, inmediato con movimiento reducido) y le da el foco; no guarda, no lo pulsa y no hay un segundo botón de guardar. Responder no desplaza la página. Se observa con `useInViewport` (`IntersectionObserver`; sin soporte no guía y el salto se da en el momento): cuenta la última notificación de cada entrega, la primera podía estar vieja y dejaba el botón «visible» estando fuera de la pantalla.
- **El rosa acompaña al siguiente paso.** «Guardar» ya es el botón principal (el rosa de marca), por lo que no hay un cambio de color en él: lo que cambia es dónde está el rosa. Tras guardar (`notice` y sin cambios pendientes: también una ficha parcial o solo en memoria), «Guardar» baja a secundario y aparece «Volver a la consulta» en rosa y con un salto, justo después en el orden de lectura. «Guardar» conserva su sitio y su foco: una segunda pulsación no saca de la pantalla. Al editar de nuevo, vuelve a ser «Guardar» la acción principal.
- **Cabecera.** «Volver a la consulta» pasa de enlace de línea a botón secundario con flecha, siempre visible arriba. Tras guardar hay dos botones con ese nombre: llevan al mismo sitio.
- **Adorno retirado (2026-10-13).** Los tres signos de exclamación rosas (`sofi-exclamation-burst`, de la animación «Are you still here?») acompañaron esta celebración y se retiraron por decisión del producto: ni imagen, ni animación `burst-pop`, ni el hueco que se reservaba junto al texto de privacidad. El original se conserva en `spec/constitution/art-direction/sofi/sofi-exclamation-burst.png` para otros usos; se había procesado con recorte x 172, y 146, 936 × 936 px y salida de 72 × 72 px (13 px de origen por píxel, el grano nativo del dibujo), por si se reintegra con `npm run assets:sofi` (`tech-stack.md` §46.1).

### Gestión del expediente (T023–T025)

`ProfileScreen` conecta `management` con el repositorio de `003`:

- **Guardar** llama a `savePartnerProfile`: `saved` muestra «Expediente guardado en este dispositivo» y la reacción de satisfacción; `memory-only` muestra el aviso de que se perderá al recargar y la reacción de aviso, nunca como guardado; `rejected` por expediente vacío avisa bajo las acciones y Sofi se sorprende (unas notas demasiado largas solo marcan su campo). Un expediente de una versión posterior no se pisa: se conserva en memoria con el aviso; datos corruptos se sustituyen al guardar.
- **Descartar** vuelve a la última versión guardada (o a la ficha en blanco) sin tocar el almacenamiento; abandonar la ficha tampoco lo modifica. «Descartar cambios» solo aparece con cambios.
- **Eliminar** pide confirmación en línea; el foco sigue el flujo descrito arriba (`useDeleteConfirmationFocus`). Solo borra el expediente: preferencias, borrador de la consulta e invitación no cambian.
- **Aviso de sonido.** Llega tras preparar el audio (~0,3 s, o varios segundos con red lenta) y solo si el navegador lo bloquea o no hay audio: la ruta rara. Va en el flujo, bajo el bocadillo de Sofi (`SofiSpeech` lo pinta con `SoundNotice`), y nunca tapa nada. A dos columnas está en la columna de Sofi y no mueve el índice ni las notas; en una columna solo baja lo que va debajo (54–300 px según el ancho y el texto). Se descartó reservar su hueco (al retirarlo movía 80 px el escenario, layout-shift 0,037) y hacerlo flotar en el aire bajo la columna (con texto de 125 % o más tapaba el índice, hasta 154 px). La medida está en §12.

## 6. Sprite assets & placeholders

Crear únicamente una correspondencia centralizada entre los estados semánticos de Sofi y los recursos visuales disponibles.

El registro de recursos permitirá:

- Asignar un asset existente a varios estados cuando sea necesario.
- Definir una representación estática alternativa.
- Sustituir una imagen provisional por un spritesheet sin cambiar los componentes consumidores.
- Mantener la lógica de interacción independiente de los archivos.

El inventario realizado al inicio determinará los placeholders reales; no se asumirán archivos inexistentes.

No se desarrollará un motor genérico de animaciones ni se anticipará la implementación completa de `008`.

### Inventario (T002)

Disponibles en `src/styles/sprites/`, terminados:

| Recurso | Contenido | Uso en `004` |
|---|---|---|
| `sofi-blink.webp` | 3 fotogramas de 384 px: abiertos · entrecerrados · cerrados, con bucle de parpadeo | Base y fallback de todos los estados; ya se carga en el consultorio |
| `sofing.webp` | 6 fotogramas: Sofi investiga en el portátil | No corresponde a ningún estado del expediente |
| `rolling.webp` + `rolling-fx.webp` | Loader principal | No corresponde a ningún estado del expediente |

Estáticas provisionales en `src/assets/sofi/`, preparadas según tech-stack §46.1: `sofi-neutral`, `sofi-surprised`, `sofi-thinking`, `sofi-smug`, `sofi-approved` y `sofi-peek`.

Correspondencia provisional aprobada; su composición se valida en T011–T012:

| Estado | Placeholder | Fallback |
|---|---|---|
| `inviting` | `sofi-peek`, apoyada sobre un borde real de la interfaz (el borde cae en el 87,5 % de la altura de la imagen) | `sofi-blink` |
| `waiting` | `sofi-blink`, bucle | Fotograma 0 |
| `asking` | `sofi-blink`, bucle (como `talking` hoy) | Fotograma 0 |
| `acknowledging` | `sofi-smug` | `sofi-blink` |
| `uncertain` | `sofi-thinking` | `sofi-blink`, fotograma 1 |
| `saved` | `sofi-approved` | `sofi-blink` |
| `validationError` | `sofi-surprised` | `sofi-blink`, fotograma 2 |
| `deleting` | `sofi-thinking` | `sofi-blink`, fotograma 1 |
| `deleted` | `sofi-neutral` | `sofi-blink` |

Faltan:

- Animación de habla para `asking`. Hasta que exista, el parpadeo la sustituye.
- Versiones definitivas de todas las reacciones: las estáticas son placeholders.

`sofi-peek` solo se descarga cuando la invitación va a mostrarse. `sofi-neutral` y `sofi-surprised` no están alineadas píxel a píxel, así que no sirven como fotogramas de una misma animación.

### Implementación (T010)

`src/features/partner-profile/sofiVisuals.ts` es el único sitio con rutas de imágenes: `SOFI_VISUALS` aplica la tabla anterior y `visualFor` devuelve una alternativa sin animación con movimiento reducido. `SofiPortrait` acepta `image`: mientras carga o si falla, se ve el fotograma de reserva. `SofiStage` reenvía `image` y `frame`.

## 7. Dialogue, typewriter & audio

Reutilizar los componentes y servicios existentes del Design System.

Comportamiento previsto:

- Preguntas de Sofi: typewriter, animación de habla y sonido cuando esté permitido.
- Respuestas cortas: aparición inmediata, sin typewriter ni sonido.
- Cambio de pregunta: cancelación de la reproducción anterior.
- Salida del expediente: limpieza de los efectos activos.
- Movimiento reducido: texto completo y alternativa visual estática.

El sonido utilizará el proveedor actual y su mecanismo de desbloqueo asociado a una interacción válida del usuario.

El sistema no volverá a cargar o decodificar el audio por cada pregunta.

La presentación accesible del texto será independiente de su animación visual, evitando anuncios carácter por carácter a tecnologías de asistencia.

## 8. Questionnaire interface

La ficha utilizará una única vista editable.

Contendrá:

- Sofi y su bocadillo con la pregunta activa.
- Opciones de la pregunta activa inmediatamente debajo.
- Acceso directo a las seis áreas y sus respuestas.
- Notas adicionales opcionales.
- Acciones de guardar, descartar y eliminar cuando correspondan.

La navegación entre áreas conservará las respuestas todavía no guardadas.

«Quitar respuesta» devuelve el área activa al estado sin responder.

Las respuestas van dentro del bocadillo, a cualquier ancho (revisión visual, 2026-10-13). Nada va fijo ni cambia con el desplazamiento:

- **Una columna:** Sofi a 192 px (la mitad exacta del sprite, sin emborronar el pixel art) sobre su bocadillo; todo se desplaza junto y el bocadillo no se corta. Se acepta el scroll.
- **Desde 1080 px, como la consulta:** Sofi a 384 px arriba a la izquierda, sobre su banda de puntos, con el bocadillo debajo. La pregunta y las cuatro respuestas, en dos columnas, van dentro de él. A la derecha, las seis áreas, las notas y las acciones.

Las notas muestran el contador «x / 500», que se lee «x de 500 caracteres».

Si el expediente solo se ha podido conservar en memoria, el aviso advierte de que se perderá al recargar o cerrar la página.

La composición no se mueve al responder, reaccionar, quitar una respuesta ni guardar:

- El pie del bocadillo reserva el alto del comentario más largo, también mientras Sofi escribe.
- La fila de «Quitar respuesta» y cada fila del índice miden siempre lo mismo.
- En estrecho, la barra fija solo lleva «Guardar»; «Descartar cambios» queda en el flujo, debajo.
- Los avisos de guardado y de expediente vacío van bajo las acciones.

Los comentarios breves de Sofi aprobados están en `draftCopy.ts`.

### Implementación (T015–T017)

`src/features/partner-profile/`: `ProfileSheet` (presentación; la usan la aplicación y el Design Lab), `ProfileScreen` (borrador, área activa y lectura del expediente guardado) y `profileCopy.ts` (preguntas, respuestas, comentarios y textos de la ficha).

- El borrador está separado de lo guardado: editar no toca el expediente hasta guardar. Cambiar de área, responder, quitar y escribir notas conservan el borrador; la pregunta activa solo cambia con el índice o con «Siguiente pregunta».
- `ProfileSheet` acepta `comments` (reacciones, T020) y `management` (guardar, descartar y eliminar, T023–T024). Sin ellos no hay comentario, hueco reservado ni acciones: la aplicación los conectará en esas tareas y la composición no cambia. El Design Lab los pasa para mostrar la composición completa.
- Con `SofiSpeech` la pregunta se escribe con la voz existente. La región `aria-live` está fuera de la cabeza y siempre en la misma posición: al cruzar los 960 px conserva su texto.

**Composición (T035).** `ProfileSheet` ya no usa `SofiStage`: compone `SofiPortrait` y `SofiSpeech` en su propio escenario (`.layout` → `.stage` + `.work`).

- Una columna: Sofi (192 px) sobre el bocadillo; el índice, las notas y las acciones debajo, en el flujo.
- A partir de 1080 px (`$bp-columns`, el umbral de la consulta): columnas 5fr / 7fr. A la izquierda, Sofi a 384 px y el bocadillo con las respuestas en dos columnas; la altura de la banda no crece con ellas. A la derecha, el índice, las notas y las acciones. Entre 960 y 1079 px sigue la composición de una columna.
- A 1280 × 800 las respuestas empiezan en y 746 y terminan 50 px bajo el pliegue; a 1440 × 900 y 1920 × 1080 se ven enteras. Las seis áreas y las notas se ven sin desplazarse. Se acepta el scroll corto.
- No hay cabeza fijada, ventana fija ni medición del alto (se retiró lo de T016–T028: `framing="sticky"`, `pinned`, `--stage-head-h`, `data-stage-stack`).

**Foco y anuncios al cambiar de pregunta (T036).** El bocadillo se rehace al cambiar de pregunta y con él sus controles; en la composición anterior eso dejaba el foco en `<body>` tras «Siguiente pregunta» en una columna, y elegir una pregunta desde el índice lo dejaba en el índice, con las respuestas atrás. Ahora:

- **Desde el índice**, el foco pasa a las respuestas de la pregunta elegida (a la marcada, si la hay). Si la pregunta ha quedado por encima de la pantalla o sus respuestas por debajo, el escenario se trae a la vista con un salto instantáneo (la etiqueta del radio, no el radio nativo de 1 px, es lo que debe caber); nunca se centra de un salto.
- El grupo de respuestas se explica solo: su leyenda dice «Pregunta 3 de 6: Conflictos. Cuando discutís, ¿qué suele preferir?». Por eso, en ese cambio, la región `aria-live` se calla y la pregunta no se oye dos veces.
- **«Siguiente pregunta»** deja el foco en el mismo enlace de la pregunta nueva (para poder seguir pasando) y la región sí anuncia la pregunta. En la última pregunta, sin enlace, el foco va a las respuestas.
- Falta la validación con VoiceOver y TalkBack reales (§12).

Eliminar se confirma en línea con `Notice` y `NoticeActions`: el foco pasa a la confirmación al abrirla y vuelve a la acción de origen al cancelar. Al confirmar, la acción de origen desaparece con el expediente: el foco pasa al titular de la ficha, que ya muestra el expediente vacío, y la reacción de Sofi se anuncia como estado.

Se utilizarán controles semánticos y componentes existentes del Design System.

Los estados de guardado, validación, error y eliminación tendrán feedback claro.

No se añadirán rutas o pasos obligatorios para cada pregunta.

Extensiones del Design System: `OptionGroup` admite `value` sin definir (sin responder) y `grid` (columnas iguales para respuestas largas); `SofiSpeech` reserva el hueco de `doneAction` mientras escribe y admite `body` (contenido bajo el texto, dentro del bocadillo); `SofiStage` no cambia; `SofiPortrait` con imagen sigue el tamaño de su contenedor (la ficha lo usa a 192 y 384 px); `Counter` y `TextField` admiten un máximo (`max`, `maxCount`). Las preguntas y respuestas de la spec viven en `profileCopy.ts`, separadas de los valores guardados.

## 9. Visual validation

Preparar en el Design Lab las composiciones correspondientes a:

- Invitación discreta en el consultorio.
- Expediente sin completar.
- Pregunta activa con Sofi hablando.
- Respuesta seleccionada y reacción breve.
- Expediente guardado y editable.
- Validación y confirmación de eliminación.

Validar su adaptación móvil y escritorio con la dirección artística C «Exclusiva».

Los placeholders utilizados en esta revisión deberán poder sustituirse por assets definitivos conservando la composición aprobada.

Registrar únicamente las decisiones visuales nuevas en la fuente de verdad correspondiente.

### Composiciones (T011)

Sección 06 «Expediente» del Design Lab: estados de Sofi, invitación y acceso, y cuestionario, en marcos de móvil (390 px) y escritorio (1280 px) con sus media queries reales. Es un prototipo en memoria que reutiliza el modelo y el registro: no guarda ni envía nada. Las decisiones pendientes están en su ficha 6.4 y se registran aquí al aprobarse (T012).

Primera revisión (T012): composiciones aprobadas con ajustes, ya aplicados y registrados arriba (encuadre en estrecho, expresiones al eliminar, contador y aviso en memoria). Segunda revisión: composición estable, comentarios aprobados e invitación tras «Leer entre líneas», registrados arriba. Queda abierto el encuadre de la pantalla de error (ficha 6.5).

Quinta revisión (2026-10-13, aprobada definitivamente; sustituye a lo de la cuarta que se indica): la invitación pasa a ser el primer diálogo de Sofi, con ella asomada sobre su bocadillo y sin duplicarse; el acceso, al pie de su diálogo; el cuestionario, con las respuestas dentro del bocadillo, a 192 px en una columna y sin sticky, y a dos columnas desde 1080 px con Sofi a 384 px y las respuestas en dos columnas. Se exploraron y descartaron: Sofi a 128 px en una columna, bocadillo a la derecha de Sofi con las respuestas en dos columnas, y Sofi a 192 px a dos columnas. Queda sin efecto la ventana fija de la cuarta revisión (la escala responsive de Sofi a 384 px y «aceptamos el scroll» se mantienen).

Cuarta revisión (T012 cerrada): aprobada la composición móvil con las respuestas en el bocadillo y la opción B de la pantalla de error (Sofi entera, decisión 6 de la dirección artística). Sofi no se reduce más en pantallas pequeñas y se acepta el scroll; el sello «Sofi approved» se ve completo sin cambiar el tamaño del personaje. Todo ello ya está en la aplicación y registrado en §8.

Tercera revisión: la composición móvil con la pregunta, las respuestas, «Quitar respuesta», «Siguiente pregunta» y el comentario dentro del bocadillo está aprobada como dirección visual, pendiente de las correcciones registradas en §8 (ficha 6.3, «En móvil»). La composición de escritorio está aprobada y no cambia.

## 10. Performance strategy

La carga de los recursos multimedia del expediente será diferida respecto a la entrada inicial al consultorio.

El registro de placeholders evitará importar indiscriminadamente todos los spritesheets futuros.

El estado de edición y el progreso del typewriter se mantendrán localizados para evitar actualizaciones innecesarias del formulario completo.

Las animaciones y reproducciones se cancelarán o suspenderán cuando dejen de ser necesarias.

La pregunta y sus controles deberán estar disponibles sin esperar a que finalice la carga de imágenes o audio.

No se añadirán optimizaciones complejas sin evidencia de un problema real.

### Resultados medidos (T026–T027)

Medidos con la composición anterior (cabeza fijada). La revisión visual retira trabajo (medición del alto en cada cambio de tamaño, sticky) y no añade recursos: la carga inicial no cambia, pero estas cifras no se han repetido.

Build de producción servida con `vite preview`, Chromium, 375 × 667; los scripts de medida no forman parte del repositorio.

| Qué | Medido |
|---|---|
| Carga de la portada | CSS 10 kB + JS 105 kB (gzip), sin ninguna estática de Sofi |
| Entrada en la consulta | `sofi-blink`, fuentes y `sofi-peek` (45 kB, solo si se muestra la invitación) |
| Abrir el expediente, sin sonido | 0 peticiones nuevas |
| Abrir el expediente, con sonido | `talking-sound.mp3` (167 kB), solo en ese gesto |
| Primera reacción de cada expresión | su imagen (45–50 kB) a demanda, nunca antes |
| Imagen de la primera reacción visible | red local 25 ms · Fast 3G 0,44 s · Slow 3G 1,39 s (la reacción dura 1,8 s) |
| Salir de la ficha hablando / ficha en reposo | 0 temporizadores y 0 frames programados |
| Controles durante el typewriter (25 interacciones), CPU ×1 · ×4 · ×6 | mediana 24 · 38 · 78 ms; máx 28 · 92 · 131 ms; tareas largas 0 · 0 · 13 (50–80 ms) |
| Hueco reservado para el aviso de sonido (descartado) | se retiraba a 0,28 s (red local), 1,1 s (Fast 3G) y 3,9–4,0 s (Slow 3G) y movía 80 px el escenario en escritorio; ver «Aviso de sonido» en §5 |

No se ha introducido ninguna optimización: nada supera los umbrales (respuesta ≤ 200 ms) y las imágenes llegan antes de que termine la reacción incluso con Slow 3G. Medido y no aplicado:

- La ficha (23,99 kB / 9,8 kB gzip de JS y 7,8 kB / 2,3 kB gzip de CSS) va en el paquete principal. Cargarla bajo demanda con `React.lazy` la sacaría de la carga inicial (~12 kB gzip, un 11 %); no es un problema observado y exige estado de carga y gestión del foco, así que queda como opción si el presupuesto de carga la pidiera.
- Precargar las estáticas de reacción al abrir la ficha adelantaría la primera reacción en Slow 3G (hoy a 1,39 s de 1,8 s).

## 11. Testing strategy

Priorizar pruebas de comportamiento y contratos.

**Unit & integration**

- Valores y validación del perfil.
- Persistencia, recuperación y eliminación.
- Estado de invitación mostrada una sola vez.
- Gestión de respuestas parcialmente completadas.
- Estados de Sofi y correspondencia con placeholders.
- Interrupción de typewriter y sonido.

**Browser**

- Acceso al consultorio sin onboarding obligatorio.
- Creación, edición, descarte y recuperación tras recarga.
- Navegación entre preguntas sin perder respuestas.
- Funcionamiento con sonido desactivado y movimiento reducido.
- Recuperación ante almacenamiento bloqueado o recursos multimedia fallidos.
- Accesibilidad del formulario y de los cambios de diálogo.

No se realizarán peticiones reales a servicios de IA.

## 12. Verification

Además de las comprobaciones habituales del proyecto:

- Revisar que no aparecen peticiones de multimedia exclusivo del expediente antes de necesitarlo.
- Verificar que no quedan reproducciones activas al cambiar de pregunta o abandonar la vista.
- Evaluar la respuesta de los controles durante el typewriter.
- Revisar la interfaz en una build de producción, incluyendo condiciones móviles limitadas.
- Comprobar que cambiar la correspondencia de placeholders no exige modificar la lógica del expediente.
- Confirmar que el consultorio y la persistencia de `003` no presentan regresiones.

La Feature 004 puede cerrarse una vez verificados sus criterios de implementación y aceptación. Las comprobaciones manuales multiplataforma pendientes se realizarán durante `015 — Accessibility & UX Verification`, sobre el entorno de prepublicación de `017 — Public Deployment`. Permanecen pendientes de verificación y no bloquean el cierre de implementación de 004, pero sí la validación necesaria para el lanzamiento público.

### Resultados (T026–T029)

Medido con la composición anterior a la revisión visual: la cabeza fijada y el aviso flotante de estos resultados ya no existen (véase «Revisión visual» al final). Se conserva como historia de por qué se retiraron.

**Demostrado automáticamente** (tests unitarios, Playwright con axe y medidas en la build):

- **Accesibilidad:** axe sin violaciones WCAG 2.2 AA en consulta con invitación y en la ficha (por defecto, vacío, guardado, confirmación, solo en memoria, sonido bloqueado), temas claro y oscuro, a 320, 375, 768, 844 × 390 y 1280 px. Recorrido completo con teclado y foco visible en cada parada. Foco no tapado por la ventana ni la cabeza fijadas en 6 anchos × 4 tamaños de texto (100–200 %), sin scroll horizontal; con texto al 200 % la ficha no desborda a 320, 390 y 1280 px.
- **Privacidad:** crear, editar, guardar, descartar y eliminar no hacen peticiones fuera del origen ni distintas de GET, ninguna petición contiene el contenido ni sus valores, nada del contenido llega a consola ni a la URL, y la nota solo existe en `ask-sofi:partner-profile`. Una prueba sobre el código impide `console`, red, acceso directo al almacenamiento y cookies en los ficheros del expediente.
- **Carga y trabajo:** tabla de §10.
- **Layout:** sin saltos en 5 anchos durante escritura, reacción, imagen cargada y reacción terminada. El aviso de sonido bloqueado no mueve ni tapa nada en escritorio, y en estrecho solo baja el índice (§5), con texto de 100 a 200 % de 320 a 1920 px.

**Hallazgos de esta fase:** (1) con texto al 200 % y pantalla alta, la cabeza fijada ocupaba toda la pantalla y tapaba las opciones: corregido midiendo (§8); (2) reservar el hueco del aviso de sonido movía 80 px el escenario en escritorio: sustituido por aviso flotante, que a su vez tapaba controles en estrecho con texto ≥ 125 % (hallado en T031): ahora flota solo en escritorio y en estrecho va en el flujo (§5); (3) la espera en frío de Vite (3,8 s) causaba los tiempos agotados de Playwright: `server.warmup` la reduce a 0,8–2 s; (4) Vitest: con 7 hilos en 8 GB el test más lento pasaba de 1 s a 2,5–4 s: `maxWorkers: 3` en local.

**Requieren una persona o dispositivos reales** (no se han realizado):

- VoiceOver y TalkBack: orden de lectura, un único anuncio de la pregunta, comentario y avisos sin duplicar, y foco tras abrir, cancelar y confirmar la eliminación.
- Audio real en Safari, Firefox y Chrome: voz sin solaparse, silencio al salir, bloqueo real por la política de autoplay y reintento con «Activar sonido».
- iOS Safari y Android Chrome: ventana de Sofi fija con la barra del navegador que aparece y desaparece, teclado en pantalla sobre las notas y «Guardar» fijo.
- Almacenamiento desactivado de verdad (modo privado de Safari y Firefox), no solo simulado.
- Red y CPU reales de gama baja: el primer cambio de expresión y la respuesta de los controles.

### Cierre (T030–T032)

**Comprobaciones del proyecto** (previas a la revisión visual; las vigentes están en «Revisión visual»): formato, ESLint y tipos limpios; Vitest 557 pruebas en 55 ficheros; build de producción (CSS 48,6 kB, JS 334,2 kB / 108,8 kB gzip); Playwright 127/127 con axe en su propio servidor (puerto 5199), sin regresiones de `002` ni `003`.

**Criterios de `004-spec.md`:** 33 de 36 demostrados automáticamente y marcados (flujos y persistencia: tests de dominio, repositorio, `ProfileScreen` y navegador; Sofi: `sofiGuide`, `sofiVisuals`, diálogo y tests de navegador; privacidad: `privacy.test.ts` y `profile-privacy.spec.ts`; rendimiento: §10). Siguen sin marcar:

- **Typewriter y sonido de hablar «cuando el navegador lo permite»:** el comportamiento está probado con audio simulado y con el audio real de Chromium, pero no se ha oído en Safari ni Firefox ni se ha comprobado el bloqueo real por autoplay.
- **Accesibilidad con tecnologías de asistencia:** teclado y axe están automatizados; falta VoiceOver/TalkBack.
- **Comprobaciones globales de la constitution:** `tech-stack.md` pide también pruebas con lector de pantalla y revisión en dispositivos; ver la lista siguiente.

**Placeholders:** los seis estáticos (`peek`, `smug`, `thinking`, `approved`, `surprised`, `neutral`) y el parpadeo cubren los nueve estados de `sofiVisuals`; es el único fichero con rutas y la build no tiene referencias rotas. No faltan assets para usar el formulario; siguen pendientes las animaciones definitivas (`008`).

**Decisiones visuales:** las de T012 se mantienen salvo lo sustituido por la revisión visual (§9, quinta revisión).

**Texto de privacidad (ajustado antes del cierre):** distingue guardar en el dispositivo («guardarlo no envía nada») de un análisis futuro («podrá enviarse de forma temporal»), como en la spec, y la invitación dice «Se guarda solo en este dispositivo» en lugar de «Se queda…», que podía leerse como que nunca saldría. Lo prueba `ProfileSheet.test.tsx`.

## References

- `004-spec.md`
- `spec/constitution/mission.md`
- `spec/constitution/roadmap.md`
- `spec/constitution/tech-stack.md`
- `spec/constitution/art-direction/README.md`
- `AGENTS.md`
### Pulido final (T041–T048)

**Integrado en producción** según §4 («Completar y volver»): «Volver a la consulta» como botón secundario en la cabecera y como acción destacada tras guardar; celebración de la sexta respuesta (reacción de Sofi, «Ir a guardar» y salto de «Guardar»); etiquetas «Sofi está escuchando» / «Sofi te pide contexto»; tamaños de Sofi en la invitación según el alto de la ventana (192 px en una columna). El Design Lab añade la composición «Seis de seis» y su texto lo recoge.

**Demostrado automáticamente:** dominio (`isProfileComplete`), reductor (`completed`), `ProfileScreen` (celebración solo en la transición a seis, con «No lo sé», sin repetirse; «Volver» del pie tras guardar, también parcial y en memoria; «Guardar» conserva el foco y precede a «Volver»), tamaños de la invitación por alto (192/288/384 y acciones a la vista en 320 × 568, 375 × 667, 1280 × 720, 1366 × 650, 1366 × 768 y 1920 × 1080) y el salto de «Guardar» en navegador, con y sin movimiento reducido (animación o `none`, termina solo y no se repite). Las pruebas fallan sin la lógica (comprobado rompiéndola).

**Causa de que no se viera (T045, el adorno).** El efecto se disparaba y se pintaba bien (visibilidad, opacidad y animación correctas), pero ligado a la reacción de 1,8 s y anclado a «Guardar», que está fuera de la pantalla al completar en todos los casos reales: a 1366 × 650 en y 835, a 390 × 844 en y 1421 y a 768 × 1024 en y 1170. En una columna, además, la barra fija no se fija hasta llegar a las notas (su contenedor es la sección de notas). Medido con el recorrido real: durante los 1,8 s, el adorno estaba visible a 0 % dentro de la pantalla. Solo se veía en pantallas altas (1920 × 1080).

**Ajustes finales (T045–T048):** guía «Ir a guardar» en el diálogo y la celebración condicionada a que «Guardar» se vea (y la página esté quieta); el adorno se colgó entonces sobre el hueco de la privacidad con el asset a 72 px y después se retiró (ver abajo). Evidencia visual (Chromium, claro y oscuro): 1366 × 650, 768 × 1024, 390 × 844 y 360 × 640, con el efecto entero dentro de la pantalla y sin solapes con texto ni controles; 1920 × 1080, donde «Guardar» ya está en pantalla y el efecto se ve al completar. Fallaron de forma intermitente los e2e móviles hasta encontrar un fallo real: `useInViewport` leía la primera notificación de una entrega en lote (ya vieja) y daba por visible un botón que ya no lo estaba.

**Retirada del adorno (T049–T052).** Se eliminan la imagen, su animación y todo lo que existía solo por ella: el asset procesado y su entrada del manifiesto, el hueco de `.privacy` (vuelve a `max-width: 62ch`, sin la línea extra en móvil), el ancla posicionada de `.actionRow`, el descuento de la altura del adorno en `useInViewport` (`topInset`) y sus tests. Se conservan sin cambios la reacción `completed` y su comentario, «Ir a guardar» con su visibilidad (`useInViewport`, `SETTLE_MS`), el salto de «Guardar» y el de «Volver» tras guardar, los dos accesos «Volver a la consulta» y el cambio del rosa. `--duration-celebrate` pasa de 1,8 s (lo que duraba el adorno) a 0,6 s, la duración real del salto de «Guardar», sin cambio visible; el test que exige que el token y `CELEBRATE_MS` coincidan sigue vigente.

**Pendiente de una persona:** que VoiceOver y TalkBack anuncien una sola vez «Seis de seis. Solo falta guardarlo.» y el guardado, que lean «Ir a guardar» donde corresponde y que el foco pase a «Guardar» al activarla; y el orden Guardar → Volver.

### Revisión visual (T033–T040)

**Integrado en producción** según §4, §5, §8 y §9: invitación conversacional en el diálogo de la consulta, acceso en su pie, ficha con respuestas en el bocadillo (192 px en una columna; 384 px a dos columnas desde 1080 px), sin sticky; foco y anuncios corregidos; Design Lab (6.2–6.4) con los componentes reales.

**Retirado:** `ProfileInvitation` y `ProfileAccess`; `SofiStage` vuelve a su forma original (sin `framing`, `frame` ni `image`); `SofiSpeech` sin `pinned`, sin medición del alto y sin `soundNotice`; `SoundNotice` sin `floating`.

**Demostrado automáticamente:**

- **Foco (regresiones de producción):** desde el índice, el foco pasa a las respuestas (o a la marcada); «Siguiente pregunta» conserva el foco en su enlace; en la última pregunta va a las respuestas; la leyenda incluye la pregunta y la región de anuncios se calla en ese cambio. Los tests fallan sin la corrección (comprobado quitando `focus()`).
- **Navegador:** acciones de la invitación a la vista a 320 × 568, 375 × 667, 1280 × 720 y 1366 × 768; una sola Sofi; «Ahora no» deja el foco en lo que dice Sofi; desde el índice, el primer control y la pregunta quedan a la vista y sin nada encima a 320, 375 y 1280 px.
- **Accesibilidad y texto ampliado:** axe sin violaciones (claro y oscuro, 320 a 1280 px), recorrido por teclado y texto al 200 % sin desbordes, ya existentes y actualizados.
- **Aviso de sonido bloqueado:** a dos columnas no mueve nada de lo que se ve (solo crece el final de la página); en una columna solo baja el índice; en ningún ancho tapa controles, ni a 200 %.

**Desviaciones y avisos**
- La invitación a dos columnas adapta Sofi y el texto al alto de la ventana (384/288/192 px; ver §4), lo que se aprobó como «adaptar proporcionalmente». En una columna usa 192 px (antes 168 px).
- Con Sofi a 384 px, las respuestas del cuestionario a dos columnas quedan parcialmente bajo el pliegue en pantallas de 800 px de alto (50 px a 1280 × 800); se acepta el scroll.
- Las cifras de rendimiento de §10 son anteriores a esta revisión.
- Siguen pendientes de una persona o de dispositivos reales los puntos de la lista anterior; VoiceOver y TalkBack ahora deben comprobar además el foco y los anuncios desde el índice y con «Siguiente pregunta».
