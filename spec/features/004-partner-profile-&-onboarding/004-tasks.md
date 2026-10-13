# 004 — Partner Profile & Onboarding — Tasks

## Status

In Review

## 1. Audit & preparation

- [x] **T001** — Auditar los componentes, servicios de diálogo y sonido de `002`, y los contratos de persistencia de `003`. Identificar qué puede reutilizarse sin duplicación.
- [x] **T002** — Inventariar los recursos visuales disponibles de Sofi y asociarlos provisionalmente a los estados de `004-plan.md`. Documentar únicamente los assets que falten y los fallbacks necesarios.

## 2. Profile contracts & persistence

- [x] **T003** — Escribir tests del modelo de perfil: seis áreas, valores estables, respuestas opcionales, estados de incertidumbre, notas y validación de expediente vacío.
- [x] **T004** — Implementar el modelo tipado y sus validadores siguiendo `004-plan.md`.
- [x] **T005** — Escribir tests de creación, lectura, actualización, eliminación, recuperación tras recarga y tratamiento de datos inválidos o versiones incompatibles.
- [x] **T006** — Implementar el repositorio del perfil sobre la infraestructura de `003`, sin accesos directos a Web Storage desde los componentes.
- [x] **T007** — Escribir tests del estado de invitación única, incluidos rechazo, recarga, eliminación del perfil y borrado global.
- [x] **T008** — Implementar la persistencia del onboarding e integrar el perfil y su estado en el borrado global, sin alterar otros datos.

## 3. Sofi behavior & visual approval

- [x] **T009** — Definir y probar las transiciones entre estados de Sofi, diferenciando preguntas habladas de reacciones cortas y evitando avances automáticos.
- [x] **T010** — Implementar la correspondencia centralizada entre estados y placeholders existentes, con alternativa estática y sin depender de rutas multimedia dentro de la lógica del cuestionario.
- [x] **T011** — Preparar en el Design Lab las composiciones de invitación, cuestionario, edición, guardado y eliminación, incluyendo estados de Sofi y variantes móvil/escritorio.
- [x] **T012** — Obtener aprobación visual de las composiciones y registrar únicamente las decisiones nuevas en la fuente de verdad correspondiente. No comenzar la implementación definitiva de las pantallas sin esta aprobación.

## 4. Onboarding & questionnaire

- [x] **T013** — Escribir tests de integración para la invitación no bloqueante, su aparición única y el acceso permanente al expediente.
- [x] **T014** — Integrar la invitación y el acceso al expediente en el consultorio utilizando los componentes aprobados.
- [x] **T015** — Escribir tests de interacción para selección, modificación y omisión de respuestas, navegación directa entre áreas y conservación de cambios sin guardar.
- [x] **T016** — Implementar la ficha única: pregunta activa en el bocadillo de Sofi, opciones debajo, acceso a las seis áreas y notas adicionales, reutilizando el Design System.
- [x] **T017** — Verificar que seleccionar una respuesta no avanza automáticamente y que las preguntas pueden cambiarse en cualquier orden.

## 5. Dialogue, sprites & sound

- [x] **T018** — Escribir tests que distingan intervenciones habladas de reacciones breves, incluyendo preferencias de sonido, movimiento reducido e interrupciones.
- [x] **T019** — Integrar typewriter y sonido existentes en las preguntas de Sofi, reutilizando el desbloqueo de audio y evitando reproducciones superpuestas.
- [x] **T020** — Implementar las reacciones visuales cortas sin typewriter ni sonido de hablar, conservando visible la pregunta activa.
- [x] **T021** — Conectar los estados con los placeholders y sus alternativas estáticas; comprobar que los recursos ausentes o fallidos no impiden utilizar el formulario.
- [x] **T022** — Verificar que navegar, responder o abandonar el expediente cancela los efectos anteriores y que las tecnologías de asistencia reciben el texto completo sin anuncios carácter por carácter.

## 6. Profile management

- [x] **T023** — Escribir tests de guardado explícito, descarte de modificaciones, validación de expediente vacío, confirmación de eliminación y errores de persistencia.
- [x] **T024** — Implementar las acciones de guardar, descartar y eliminar con feedback de Sofi, distinguiendo éxito persistente de conservación temporal en memoria.
- [x] **T025** — Añadir pruebas de navegador para creación, edición, recarga, eliminación individual y almacenamiento bloqueado. El borrado global no tiene interfaz: su integración se cubre con los tests de T007–T008.

## 7. Performance, accessibility & privacy

- [x] **T026** — Comprobar en la build de producción que los recursos exclusivos del expediente se cargan bajo demanda y que el audio y las animaciones no generan trabajo innecesario.
- [x] **T027** — Verificar la respuesta de los controles durante el typewriter, los cambios rápidos de pregunta, la salida de la vista y condiciones móviles limitadas. Optimizar únicamente problemas observados.
- [x] **T028** — Ejecutar pruebas de accesibilidad y responsive: teclado, foco, lector de pantalla, texto ampliado, temas y movimiento reducido.
- [x] **T029** — Comprobar que la creación y edición del expediente no realizan solicitudes externas ni exponen contenido privado en logs, y que las indicaciones de privacidad son correctas.

## 8. Verification & closure

- [x] **T030** — Ejecutar formato, lint, typecheck, tests y build; corregir cualquier fallo o regresión de `002` y `003`.
- [x] **T031** — Revisar los criterios de `004-spec.md`, el uso real de placeholders y las decisiones visuales aprobadas. Registrar las comprobaciones manuales pendientes sin asumir que se han realizado.
- [x] **T032** — Actualizar los estados de spec, plan y tasks según la evidencia. No marcar la feature como completa hasta verificar todos los criterios.

## 9. Visual revision (post-closure)

Revisión visual del onboarding y del cuestionario, aprobada el 2026-10-13 tras el cierre inicial (T030–T032). No cambia contratos, persistencia ni comportamiento de Sofi.

- [x] **T033** — Registrar las decisiones aprobadas en spec, plan y dirección artística.
- [x] **T034** — Integrar la invitación conversacional como primer diálogo de Sofi en la consulta, con Sofi asomada sin duplicarse, «Ahora no» y el acceso permanente en el pie del diálogo; adaptar sus medidas a portátiles bajos.
- [x] **T035** — Recomponer la ficha: respuestas dentro del bocadillo, Sofi a 192 px en una columna sin sticky y, desde 1080 px, Sofi a 384 px con el bocadillo debajo y las respuestas en dos columnas; retirar el código de encuadre fijo, la medición del alto y el aviso de sonido flotante.
- [x] **T036** — Corregir en producción el foco al cambiar de pregunta (índice y «Siguiente pregunta») y el anuncio de la pregunta, con tests de regresión.
- [x] **T037** — Actualizar el Design Lab (6.2–6.4) con los componentes reales y retirar los borradores.
- [x] **T038** — Tests unitarios y de navegador: invitación a la vista en pantallas bajas, foco, accesibilidad y texto ampliado.
- [x] **T039** — Ejecutar formato, lint, typecheck, tests y build, y revisar regresiones de `002` y `003`.
- [x] **T040** — Registrar las comprobaciones manuales pendientes (lectores de pantalla y dispositivos reales) sin darlas por hechas.

## 10. Final polish (pre-close)

Tres ajustes pedidos antes de cerrar, en producción y sin tocar contratos ni persistencia.

- [x] **T041** — Reforzar «Volver a la consulta» (botón secundario en la cabecera; acción destacada junto a «Guardar» tras guardar, también un expediente parcial).
- [x] **T042** — Celebrar la sexta respuesta: reacción `completed`, efecto breve que guía a «Guardar» sin guardar ni redirigir, y alternativa con movimiento reducido (el adorno `sofi-exclamation-burst` se retiró en T049).
- [x] **T043** — Revisar tamaños de Sofi y contenedores (invitación según el alto de la ventana, 192 px limpio en una columna) y etiquetas «Sofi está escuchando» / «Sofi te pide contexto».
- [x] **T044** — Tests de regresión (dominio, reductor, pantalla y navegador) y registro de las decisiones; la feature sigue en In Review.
- [x] **T045** — Investigar por qué el efecto no se veía (causa exacta registrada en plan §12) antes de tocarlo.
- [x] **T046** — Guiar hacia «Guardar» con «Ir a guardar» en el diálogo (móvil, tablet y escritorio), sin desplazar al responder ni duplicar el guardado.
- [x] **T047** — Mostrar el efecto cuando «Guardar» está en pantalla (y la página quieta), una sola vez, sin tapar texto de privacidad ni controles.
- [x] **T048** — Regresiones (reductor, `useInViewport`, pantalla y navegador en 3 tamaños, claro y oscuro, con y sin movimiento reducido) y verificación visual.

## 11. Retirada del adorno (pre-close)

Decisión del producto tras la verificación visual: la celebración de las seis áreas no lleva las tres exclamaciones rosas. Se conserva el resto.

- [x] **T049** — Retirar la imagen, su animación y el código, el asset procesado, el hueco de privacidad y los tests exclusivos del adorno; conservar el original en art-direction.
- [x] **T050** — Actualizar plan, tareas, dirección artística y Design Lab donde lo mencionaban.
- [x] **T051** — Regresiones: formato, lint, typecheck, tests, build y navegador (guía «Ir a guardar», salto de «Guardar», accesos «Volver», rosa tras guardar, accesibilidad).
- [x] **T052** — Cierre según T032: la feature sigue en In Review mientras haya criterios por verificar a mano (typewriter y sonido reales, lectores de pantalla, comprobaciones globales).

## References

- `004-spec.md`
- `004-plan.md`
- `spec/constitution/tech-stack.md`
- `spec/constitution/art-direction/README.md`
- `AGENTS.md`