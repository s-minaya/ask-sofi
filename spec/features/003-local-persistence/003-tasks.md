# 003 — Local Persistence — Tasks

## Status

Complete

## 1. Audit & contracts

- [x] **T001** — Auditar los usos actuales de Web Storage, las claves y los flujos de preferencias de `002`. Identificar datos preexistentes que deban conservarse.
- [x] **T002** — Definir los contratos mínimos de almacenamiento, claves con namespace y límites entre `localStorage`, `sessionStorage` y estado en memoria, siguiendo `003-plan.md`.

## 2. Storage infrastructure

- [x] **T003** — Escribir tests para lectura, escritura, eliminación, almacenamiento vacío y fallos de acceso o escritura, incluida cuota agotada y fallback en memoria.
- [x] **T004** — Implementar el adaptador tipado de Web Storage y el fallback, con inyección de dependencias para pruebas y resultados que distingan guardado persistido de guardado solo en memoria.
- [x] **T005** — Escribir tests de parseo, validación de datos/versiones, incompatibilidades y migraciones explícitas conocidas; proteger versiones futuras contra sobrescritura accidental.
- [x] **T006** — Implementar los validadores y el formato versionado necesarios para los datos reales de `003`, sin sistema genérico de migraciones ni modelos prematuros.

## 3. Existing preferences

- [x] **T007** — Escribir tests que caractericen los valores por defecto, la lectura de datos válidos de `002` y su migración sin pérdida de preferencias.
- [x] **T008** — Integrar las preferencias existentes con la nueva infraestructura, eliminando accesos directos y evitando una segunda fuente de verdad.
- [x] **T009** — Verificar mediante tests de integración que tema, sonido y movimiento conservan su comportamiento y que las preferencias persistentes se recuperan tras recargar.

## 4. Session draft & context

- [x] **T010** — Definir únicamente la estructura temporal necesaria para borrador y contexto, a partir de los formularios existentes; no anticipar el modelo de análisis real.
- [x] **T011** — Escribir tests de guardado, recuperación, actualización y limpieza de la consulta durante una sesión, incluida la ausencia de persistencia accidental en `localStorage`.
- [x] **T012** — Implementar las operaciones tipadas sobre `sessionStorage`, con validación y fallback seguro.
- [x] **T013** — Conectar borrador y contexto a la interfaz existente reutilizando su estado/componentes; evitar escrituras innecesarias durante la edición.
- [x] **T014** — Añadir pruebas de integración y navegador para restauración tras recarga, limpieza y ausencia de regresiones en el formulario.

## 5. Deletion & privacy

- [x] **T015** — Escribir tests para limpiar la consulta, borrar únicamente las claves de historial propias de Ask Sofi cuando existan y eliminar todos los datos de Ask Sofi sin afectar claves ajenas.
- [x] **T016** — Implementar las operaciones de borrado correspondientes, sin introducir almacenamiento de historial ni nuevos modelos de producto.
- [x] **T017** — Verificar que el borrado total restablece también el estado React y el fallback en memoria, sin dejar preferencias o borradores obsoletos visibles.
- [x] **T018** — Comprobar que ninguna consulta, análisis o historial se guarda de forma persistente sin una acción o preferencia explícita y que los errores/logs no exponen su contenido.

## 6. Verification & closure

- [x] **T019** — Añadir pruebas de navegador para almacenamiento bloqueado/no disponible y para la persistencia real tras recarga, sin depender de servicios externos.
- [x] **T020** — Comprobar que los componentes de aplicación no acceden directamente a Web Storage y que no hay duplicación de repositorios, lógica o componentes existentes.
- [x] **T021** — Ejecutar lint, formato, typecheck, tests y build; corregir cualquier fallo.
- [x] **T022** — Ejecutar las verificaciones de regresión aplicables de interfaz, accesibilidad y responsive, especialmente en preferencias y consulta.
  - Automático: suite Playwright completa (axe en claro y oscuro, teclado, texto al 200 % sin desbordes a 320, 390 y 1280 px) y tests de componentes.
  - Manual, confirmado: teclado/foco, lector de pantalla, tema Light/Dark/System y responsive visual.
- [x] **T023** — Revisar todos los criterios de `003-spec.md` y documentar únicamente los límites o comprobaciones realmente pendientes.
- [x] **T024** — Actualizar el estado de spec, plan y tasks conforme a los resultados; no marcar la feature como completa con criterios sin verificar.

## 7. Manual review corrections

- [x] **T025** — Reproducir en navegador real la causa del sonido sin efecto y documentarla: la aplicación no tiene todavía ningún `SofiSpeech`, que solo existe en el Design Lab.
- [x] **T026** — Mantener el aviso de demostración aprobado (T046 de `002`) y verificar en navegador real que la voz de `SofiSpeech` arranca en el Design Lab con el gesto de «Empezar»; la audición queda como comprobación manual.
- [x] **T027** — Escribir tests y persistir la pantalla activa en `sessionStorage`; restaurarla tras recargar y mantener la coherencia al borrar la consulta, volver a la portada o eliminar todos los datos.
- [x] **T028** — Escribir tests y desplazar al aviso de demostración al pedir la lectura solo en una columna: una vez por petición, sin animación con movimiento reducido, sin robar el foco y sin forzarlo a varias columnas.
- [x] **T029** — Pruebas de navegador de los tres comportamientos y de regresión del resto (lint, formato, typecheck, tests, build, axe, teclado, texto al 200 %).
- [x] **T030** — Documentar lo comprobado y lo que requiere validación manual (audición del sonido); mantener `003` en «In Review» hasta la confirmación manual (confirmada después; ver T022).
- [x] **T031** — Escribir tests de que la aplicación real conserva la elección de sonido sin descargar ni preparar el audio, y de que el Design Lab conserva su preparación con el gesto.
- [x] **T032** — Diferir la preparación del audio en la aplicación real (`deferAudio`) sin cambiar el Design Lab ni las preferencias.
- [x] **T033** — Verificar en navegador real que la aplicación no pide el MP3 ni crea contexto de audio y que el Design Lab sigue arrancando la voz.

## References

- `003-spec.md`
- `003-plan.md`
- `spec/constitution/tech-stack.md`
- `AGENTS.md`
