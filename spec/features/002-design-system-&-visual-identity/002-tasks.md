# 002 — Design System & Visual Identity — Tasks

## Status

Complete

## Tasks

### Visual Foundations

- [x] T001 — Concretar la paleta y los valores visuales de los design tokens definidos para Ask Sofi.
- [x] T002 — Implementar los tokens mediante CSS Custom Properties y organizar los estilos globales con SCSS.
- [x] T003 — Integrar las tipografías y establecer sus estilos y jerarquías.
- [x] T004 — Implementar los temas Light y Dark utilizando tokens semánticos.
- [x] T005 — Implementar la selección Light / Dark / System y el adaptador mínimo para conservar la preferencia de tema.

### UI Components

- [x] T006 — Implementar Button e IconButton con sus variantes y estados necesarios.
- [x] T007 — Implementar los campos de texto, textareas y sus estados de validación.
- [x] T008 — Implementar los controles de selección necesarios para la landing y las preferencias visuales.
- [x] T009 — Implementar los elementos compartidos de navegación, etiquetas e indicadores.
- [x] T010 — Implementar los componentes de feedback, loading y estados vacíos.
- [x] T011 — Añadir component tests para las interacciones y estados relevantes de los componentes UI.

### Sofi Components

- [x] T012 — Implementar los componentes de presentación para el mensaje recibido y el contexto adicional.
- [x] T013 — Implementar los componentes de presentación de interpretaciones.
- [x] T014 — Implementar la visualización de confianza e incertidumbre.
- [x] T015 — Implementar los estados visuales de procesamiento, error y contexto insuficiente.
- [x] T016 — Añadir component tests para los componentes específicos de Sofi.

### SofiSpeech & Audio

- [x] T017 — Implementar `SofiSpeech` con aparición progresiva del texto mediante typewriter.
- [x] T018 — Implementar el revelado inmediato del texto y la cancelación segura de la animación.
- [x] T019 — Incorporar el comportamiento de movimiento reducido y la exposición accesible del contenido.
- [x] T020 — Implementar un controlador de audio reutilizable con activación mediante interacción del usuario y gestión de bloqueos.
- [x] T021 — Integrar el sonido proporcionado con el typewriter, incluyendo mute, interrupción y prevención de reproducciones superpuestas.
- [x] T022 — Exponer un estado de presentación que permita sincronizar `SofiSpeech` con futuros spritesheets sin depender de sus assets.
- [x] T023 — Añadir tests de progresión, cancelación, accesibilidad, sincronización y fallos de audio.

### Landing

- [x] T024 — Implementar la landing editorial con la presentación visual de Sofi y la acción «Empezar».
- [x] T025 — Integrar la elección de sonido y su preparación durante la interacción de entrada.
- [x] T026 — Conectar la entrada de la landing con la experiencia principal provisional.
- [x] T027 — Añadir tests para la navegación y los comportamientos de entrada con y sin sonido.

### Design Lab

- [x] T028 — Crear el Design Lab con acceso exclusivo en desarrollo.
- [x] T029 — Implementar las secciones Foundations, UI Components y Sofi Components utilizando los componentes reales.
- [x] T030 — Incorporar controles para explorar variantes, estados, temas y tamaños de visualización.
- [x] T031 — Implementar Motion & Sound para probar velocidades, pausas, sonido y estados de `SofiSpeech`.

### Experience Preview

- [x] T032 — Crear fixtures locales y escenarios deterministas para la demostración.
- [x] T033 — Componer el flujo visual de consulta, procesamiento, respuesta y resultados reutilizando los componentes existentes.
- [x] T034 — Implementar la selección de escenarios de éxito, carga, error y contexto insuficiente.
- [x] T035 — Integrar la Experience Preview en el Design Lab e identificar claramente sus datos simulados.
- [x] T036 — Añadir tests del recorrido visual y la selección de escenarios sin servicios externos.

### Units

- [x] T043 — Adaptar los estilos de la feature a las convenciones de unidades de `tech-stack.md`: `rem` para tipografía, espaciado y dimensiones, `px` para bordes y detalles gráficos; comprobar que la apariencia a tamaño de texto por defecto no cambia y que el contenido resiste un tamaño de texto del 200 %.

### Review adjustments

- [x] T044 — Fijar los objetivos táctiles en 44 CSS px como mínimo con altura adaptable al contenido y documentar la excepción de unidades.
- [x] T045 — Evitar el desbordamiento del titular de la portada a 320 px con el texto al 200 % sin ocultar contenido ni alterar el diseño normal.
- [x] T046 — Sustituir el aviso provisional de la consulta por el texto de demostración aprobado.
- [x] T047 — Integrar las comprobaciones de Playwright y axe en GitHub Actions.
- [x] T048 — Recuperar `--color-border` como alias semántico y usarlo en los contornos de estructura.
- [x] T049 — Verificar que el Design Lab es un playground de los componentes reales de producción, con ejemplos individuales, variantes, estados y props explorables.

### Verification

- [x] T037 — Verificar que el Design Lab y sus fixtures de demostración no forman parte del build público.
- [x] T038 — Comprobar el rendimiento del typewriter, el audio y los recursos visuales, incluyendo renders innecesarios, limpieza de temporizadores y estabilidad del layout.
- [x] T039 — Ejecutar las comprobaciones automáticas y manuales de accesibilidad aplicables según `tech-stack.md`.
- [x] T040 — Verificar los componentes, la landing y la preview en los tamaños, orientaciones y temas definidos para QA responsive.
- [x] T041 — Ejecutar la verificación técnica completa y contrastar los resultados con los acceptance criteria de `002-spec.md`.
- [x] T042 — Actualizar el estado de la feature cuando todos los criterios estén verificados.

## Completion

La feature se considerará terminada únicamente cuando:

- todas las tasks aplicables estén completadas;
- los acceptance criteria de `002-spec.md` estén verificados;
- no existan problemas conocidos de accesibilidad, rendimiento o comportamiento introducidos por esta feature;
- los componentes del Design System puedan reutilizarse en las siguientes features sin depender del Design Lab.