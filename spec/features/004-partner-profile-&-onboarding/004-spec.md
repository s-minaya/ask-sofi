# 004 — Partner Profile & Onboarding

## Status

Complete

## Objective

Permitir que el usuario cree y gestione un expediente opcional sobre los patrones habituales de comunicación de su pareja, mediante una experiencia interactiva guiada por Sofi.

El expediente proporciona contexto para futuros análisis, sin atribuir certezas, intenciones ni diagnósticos a otra persona.

## Requirements

### 1. Onboarding

- El usuario entra directamente al consultorio, sin necesidad de crear un perfil.
- En su primera visita, Sofi ofrece abrir un expediente mediante una invitación conversacional y no bloqueante: es el primer diálogo de Sofi en el consultorio y explica para qué sirve el expediente y que es opcional.
- La invitación solo se muestra una vez. No reaparece después de rechazarla, recargar la página o eliminar el perfil.
- Existe un acceso permanente al expediente desde el consultorio, en el pie del diálogo de Sofi, con independencia de que haya un perfil guardado.
- El estado de la invitación se conserva mediante la infraestructura de `003`.

### 2. Partner profile

El expediente es una ficha única y editable con seis áreas de comunicación.

| Área | Pregunta | Opciones |
|---|---|---|
| Comunicación directa | Cuando algo le molesta, ¿cómo suele expresarlo? | Lo dice claramente / Suele dar indirectas / Depende / No lo sé |
| Sarcasmo | ¿Utiliza la ironía o el sarcasmo al escribir? | A menudo / A veces / Casi nunca / Depende / No lo sé |
| Conflictos | Cuando discutís, ¿qué suele preferir? | Hablarlo en el momento / Retomarlo más tarde / Depende / No lo sé |
| Espacio personal | Cuando está pasando por algo difícil, ¿suele necesitar espacio? | Normalmente sí / Normalmente no / Depende / No lo sé |
| Iniciativa | Cuando un plan cambia, ¿suele proponer alternativas? | Sí / Suele esperar a que las proponga yo / Depende / No lo sé |
| Estilo habitual de mensajes | ¿Cómo suele escribirte normalmente? | Mensajes cortos y directos, incluso cuando todo va bien / Mensajes largos, expresivos o con muchos detalles / Cambia bastante según el momento / No lo sé |

- Todas las preguntas son opcionales.
- Las respuestas pueden seleccionarse y modificarse en cualquier orden.
- Una respuesta seleccionada puede quitarse, y la pregunta vuelve a quedar sin responder.
- Una pregunta sin responder, «Depende» y «No lo sé» representan estados diferentes.
- Se incluye un campo opcional de notas adicionales con límite de caracteres.
- Para guardar un expediente debe existir al menos una respuesta seleccionada o una nota no vacía.
- Los valores almacenados deben ser independientes del microcopy presentado en pantalla.

### 3. Sofi-guided experience

Sofi es la guía activa del expediente, no una ilustración decorativa.

- El cuestionario permanece en una única vista, sin pasos obligatorios ni navegación entre páginas.
- Existe una pregunta activa que Sofi presenta en su bocadillo de diálogo.
- Las opciones correspondientes aparecen dentro del mismo bocadillo, bajo la pregunta.
- El usuario puede acceder directamente a cualquiera de las seis áreas, comprobar sus respuestas y modificarlas sin reiniciar la ficha.
- Sofi cambia de expresión o animación según la interacción.
- Seleccionar una respuesta no provoca un avance automático.
- Las animaciones y diálogos nunca bloquean la edición ni retrasan artificialmente las acciones del usuario.
- La pregunta y sus opciones siguen siendo comprensibles y utilizables sin sonido ni animaciones.

### 4. Typewriter, sound & sprite behavior

El comportamiento de Sofi distingue entre intervenciones habladas y reacciones breves.

| Interaction | Typewriter | Talking sound | Sofi behavior |
|---|---|---|---|
| Formular una pregunta | Sí | Sí | Animación de habla |
| Cambiar a otra pregunta | Sí | Sí | Transición y animación de habla |
| Seleccionar o modificar una respuesta | No | No | Reacción visual breve |
| Seleccionar «Depende» o «No lo sé» | No | No | Reacción de reconocimiento de incertidumbre |
| Mostrar un comentario corto | No | No | Expresión correspondiente |
| Responder la sexta área (las seis respondidas, con cambios sin guardar) | No | No | Reacción de celebración breve que guía a «Guardar» |
| Guardar correctamente | No | No | Reacción de satisfacción |
| Intentar guardar vacío | No | No | Reacción de aviso |
| Descartar o eliminar | No | No | Reacción contextual |

Reglas de interacción:

- El efecto typewriter y el sonido de hablar se aplican a las preguntas formuladas por Sofi.
- El sonido respeta las preferencias existentes y las restricciones de reproducción del navegador.
- Las reacciones cortas aparecen inmediatamente, sin reiniciar la escritura de la pregunta.
- La pregunta activa permanece disponible y legible durante las reacciones.
- Cambiar de pregunta o salir del expediente interrumpe la reproducción y animación anteriores, sin superposiciones.
- El usuario puede omitir la animación de escritura sin perder contenido.
- Con movimiento reducido, las preguntas se muestran directamente y Sofi utiliza una alternativa visual no animada.
- Los cambios del bocadillo deben anunciarse de forma accesible, sin exponer cada carácter del typewriter como un anuncio independiente.
- Los sprites o expresiones utilizados deben corresponder a estados de interacción definidos, no reproducirse de forma arbitraria.

Esta feature implementa únicamente los comportamientos de Sofi necesarios para el expediente. El sistema ampliado de personajes, expresiones y animaciones pertenece a `008`.

### 5. Profile management

- Se admite un único expediente por dispositivo.
- El usuario puede crear, consultar, editar y eliminar el expediente.
- Guardar requiere una acción explícita. Completar las seis áreas no guarda ni redirige: guía a «Guardar» y, ya guardado, a «Volver a la consulta».
- Con las seis áreas respondidas y algo sin guardar, si «Guardar» queda fuera de la pantalla, el diálogo de Sofi ofrece «Ir a guardar»: una acción explícita que lleva el botón a la vista y le da el foco. Nunca desplaza la página al responder ni guarda por sí misma.
- Tras guardar (también un expediente parcial, porque las áreas son opcionales, o uno que solo se conserva en memoria), «Volver a la consulta» pasa a ser la acción destacada, junto a «Guardar».
- Abandonar o descartar una edición no modifica la última versión guardada.
- Eliminar el expediente exige confirmación.
- La eliminación del perfil no afecta a preferencias, borradores ni otros datos.
- El expediente se incluye en la eliminación global de datos de Ask Sofi.
- El borrado global también restablece el estado de la invitación inicial.

### 6. Persistence & privacy

- El expediente y el estado de onboarding utilizan la infraestructura de `003`.
- La lectura y escritura del perfil respetan los contratos de validación, versionado y manejo de errores existentes.
- Los fallos de almacenamiento no bloquean el consultorio ni se presentan como guardados persistentes cuando no lo son.
- La creación y edición del expediente no realizan solicitudes a servicios externos.
- La interfaz explica que el expediente se almacena localmente y que, cuando se utilice en futuros análisis, la información relevante podrá enviarse temporalmente para su procesamiento.

### 7. Visual experience

- La interfaz sigue la dirección artística C «Exclusiva».
- La invitación, el expediente, el bocadillo y los estados de Sofi deben validarse visualmente en el Design Lab antes de su implementación.
- Se reutilizan los componentes, comportamientos de texto, sonido y recursos visuales existentes conforme a `AGENTS.md`.
- Antes de implementar, se identifican los estados que pueden cubrir los spritesheets disponibles y los recursos adicionales que realmente resulten necesarios.
- Los estados sin animación disponible mantienen una representación visual válida; no se improvisan assets ni se amplía el alcance de `008` sin aprobarlo.
- La composición mantiene la relación entre Sofi, pregunta y opciones tanto en móvil como en escritorio, sin ocultar controles ni generar espacios vacíos innecesarios.

### 8. Feature performance

- La entrada al consultorio no debe cargar anticipadamente todos los recursos multimedia del expediente.
- Los spritesheets del cuestionario se cargan cuando son necesarios, sin bloquear la presentación de las preguntas ni de los controles.
- Sofi detiene o suspende la reproducción y el trabajo innecesario al abandonar el expediente o cuando la página deja de estar visible.
- Los cambios del typewriter y las animaciones no deben perjudicar la respuesta inmediata de las opciones y demás controles.
- El sonido reutiliza la infraestructura existente, evitando inicializaciones y decodificaciones repetidas.
- La experiencia debe conservar su funcionalidad si un recurso multimedia tarda en cargar o falla.

### Placeholder assets

- La experiencia guiada por Sofi debe funcionar aunque no estén terminados todos sus spritesheets.
- Se reutilizarán los recursos visuales disponibles como placeholders de los estados definidos en esta feature.
- Los estados de Sofi serán independientes de los nombres y rutas de sus archivos multimedia.
- Los placeholders se centralizarán para facilitar su sustitución posterior sin modificar la lógica de interacción.
- Cuando no exista una animación adecuada, se utilizará una imagen o expresión estática disponible.
- La ausencia o fallo de un recurso visual nunca impedirá responder, guardar o gestionar el expediente.
- No se crearán spritesheets definitivos ni un sistema general de animaciones como parte de `004`.

## Acceptance Criteria

### Onboarding

- [x] Es posible entrar al consultorio sin crear un expediente.
- [x] La invitación se muestra una sola vez y no bloquea la consulta.
- [x] Su estado persiste tras recargar, rechazar la invitación o eliminar el perfil.
- [x] El acceso permanente permite abrir el expediente con o sin perfil guardado.

### Questionnaire

- [x] Las seis áreas contienen las preguntas y opciones especificadas.
- [x] Se pueden responder, omitir, modificar y quitar libremente.
- [x] Una respuesta no provoca avance automático.
- [x] El usuario puede navegar entre áreas sin perder respuestas en edición.
- [x] Las respuestas desconocidas, condicionadas y ausentes se diferencian correctamente.
- [x] Se puede guardar un expediente parcial, pero no completamente vacío.

### Sofi interaction

- [x] Sofi presenta la pregunta activa en su bocadillo, con sus opciones dentro de él.
- [x] Cada nueva pregunta utiliza typewriter y sonido de hablar cuando las preferencias y el navegador lo permiten.
- [x] Las reacciones cortas no utilizan typewriter ni sonido de hablar.
- [x] Sofi muestra estados visuales coherentes al preguntar, responder, guardar y gestionar errores.
- [x] La reproducción anterior se interrumpe al cambiar de pregunta o abandonar la vista.
- [x] El usuario puede interactuar durante el typewriter y omitirlo.
- [x] El cuestionario funciona correctamente con sonido desactivado y movimiento reducido.
- [x] Las preguntas, cambios de estado y opciones son accesibles mediante teclado y lector de pantallas de Windows.

### Profile management & privacy

- [x] Se puede consultar, editar y recuperar el expediente después de recargar.
- [x] Descartar cambios conserva los datos guardados.
- [x] Eliminar exige confirmación y afecta únicamente al expediente.
- [x] El borrado global elimina también el perfil y restablece el onboarding.
- [x] Los datos inválidos y los errores de almacenamiento tienen una recuperación segura.
- [x] La interfaz distingue correctamente almacenamiento local y futuro procesamiento externo.

### Verification

- [x] Las nuevas composiciones y estados de Sofi están aprobados en el Design Lab.
- [x] Existen pruebas de los flujos de creación, edición, persistencia y eliminación.
- [x] Existen pruebas de interacción para typewriter, preferencias de sonido, interrupciones y movimiento reducido.
- [x] Se verifican mediante pruebas automatizadas y revisión manual disponible los criterios de accesibilidad, responsive y calidad correspondientes a esta feature. La validación transversal en dispositivos, navegadores y lectores de pantalla adicionales corresponde a 015 — Accessibility & UX Verification.

### Additional acceptance criteria

- [x] El consultorio no descarga recursos exclusivos del expediente antes de necesitarlos.
- [x] Cambiar rápidamente de pregunta o abandonar el expediente no deja animaciones ni audio anteriores ejecutándose.
- [x] La interacción con las opciones permanece fluida durante el typewriter y las animaciones.
- [x] Se verifica el comportamiento de los recursos multimedia y la respuesta de la interfaz en una build de producción, incluyendo condiciones móviles limitadas.
- [x] Todos los estados de Sofi disponen de una representación visual, aunque sea provisional.
- [x] Los placeholders pueden sustituirse sin modificar la lógica del cuestionario.
- [x] No existen dependencias de archivos multimedia inexistentes.
- [x] Se cumplen los criterios de rendimiento específicos del expediente definidos en esta specification.

## Out of Scope

- Múltiples expedientes o perfiles de diferentes parejas.
- Autenticación, sincronización o almacenamiento remoto.
- Análisis reales, probabilidades o interpretaciones personalizadas.
- Envío del expediente a Jev u otros proveedores.
- Diagnósticos, estilos de apego o clasificaciones psicológicas.
- Estadísticas derivadas del expediente.
- Implementación del sistema completo de spritesheets y animaciones previsto para `008`.

## References

- `spec/constitution/mission.md`
- `spec/constitution/roadmap.md`
- `spec/constitution/tech-stack.md`
- `spec/constitution/art-direction/README.md`
- `AGENTS.md`
- `003 — Local Persistence`
- `002 — Design System & Visual Identity`