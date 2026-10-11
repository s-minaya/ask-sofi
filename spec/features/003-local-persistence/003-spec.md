# 003 — Local Persistence

## Status

Complete

## Objective

Implementar una capa de persistencia local segura y reutilizable para conservar el estado de sesión y las preferencias del usuario, preparando el almacenamiento de las próximas funcionalidades sin anticipar su implementación.

## Requirements

Al finalizar esta feature:

- debe existir una infraestructura centralizada para acceder al almacenamiento del navegador;
- debe poder guardarse y recuperarse el estado temporal de la consulta, incluyendo borrador, contexto y datos de sesión compatibles con las funcionalidades existentes;
- deben poder persistirse las preferencias de interfaz, incluyendo las ya implementadas en `002`;
- la persistencia debe integrarse con los componentes existentes sin duplicar su lógica;
- los datos almacenados deben validarse antes de utilizarse;
- debe existir una estrategia de versionado y evolución de los datos;
- el almacenamiento debe manejar correctamente datos corruptos, versiones incompatibles, restricciones del navegador y errores de escritura;
- deben existir operaciones específicas para borrar datos de sesión, historial y todos los datos del usuario pertenecientes a Ask Sofi;
- el historial persistente y los análisis guardados deben requerir una acción o preferencia explícita del usuario;
- deben quedar preparados contratos de almacenamiento para las funcionalidades futuras previstas, sin implementar anticipadamente su lógica de producto;
- la aplicación debe continuar funcionando cuando el almacenamiento no esté disponible;
- la consulta activa debe restaurarse directamente tras una recarga dentro de la misma sesión, con sus datos, y empezar una consulta, borrarla o eliminar todos los datos debe dejar siempre un estado coherente;
- la aplicación real no debe descargar ni preparar audio que ninguno de sus componentes reproduce, y debe conservar la elección de sonido;
- al pedir la lectura en una disposición de una sola columna, la página debe llevar al aviso de demostración sin forzar el desplazamiento cuando la interfaz ya se muestra a varias columnas.

## Acceptance Criteria

- [x] La infraestructura permite leer, escribir y eliminar datos de ambos tipos de almacenamiento.
- [x] Los componentes de aplicación no acceden directamente a las Web Storage APIs.
- [x] Las preferencias implementadas en `002` sobreviven a una recarga cuando corresponde, sin perder su comportamiento anterior.
- [x] El borrador y contexto de una consulta pueden recuperarse durante la sesión.
- [x] Los datos temporales y persistentes respetan sus ámbitos de almacenamiento.
- [x] Los valores almacenados se validan y utilizan un formato versionado.
- [x] Los datos previos compatibles pueden recuperarse o migrarse cuando corresponda.
- [x] Los datos inválidos o incompatibles no provocan errores no controlados.
- [x] Una lectura o escritura bloqueada no impide utilizar las funcionalidades principales.
- [x] El historial no se conserva automáticamente de forma persistente sin autorización del usuario.
- [x] Las operaciones de borrado eliminan únicamente los datos correspondientes, sin afectar a información ajena a Ask Sofi.
- [x] La eliminación completa de datos permite recuperar un estado inicial coherente.
- [x] Existen tests de los comportamientos de almacenamiento, recuperación, migración, errores y borrado.
- [x] Al recargar con la consulta activa se restauran directamente la pantalla de consulta y sus textos; al borrarla, volver a la portada o eliminar todos los datos no reaparece información obsoleta.
- [x] La elección de sonido se conserva y activa sin descargar ni preparar el audio mientras la aplicación real no lo reproduce. El Design Lab mantiene su preparación con el gesto y su voz.
- [x] La voz de Sofi se oye en el Design Lab al elegir «Con sonido». _Comprobado manualmente._
- [x] Al pedir la lectura en una columna, la página se desplaza una sola vez hasta el aviso de demostración, sin animación con movimiento reducido; a varias columnas no se fuerza el desplazamiento.
- [x] Se verifican los criterios globales aplicables de la constitution. _Automáticos (typecheck, lint, tests, build, axe, teclado, texto al 200 %) y manuales de `tech-stack.md` §70 verificados._

## Out of Scope

No forma parte de esta feature implementar las pantallas definitivas de historial, favoritos, perfil de pareja o configuración; el análisis real de mensajes; estadísticas; sincronización entre dispositivos; autenticación; bases de datos externas ni la estrategia definitiva de caché de resultados.

Los modelos de datos y las operaciones que dependan de esas funcionalidades se concretarán en sus respectivas features.

## References

- `spec/constitution/mission.md`
- `spec/constitution/roadmap.md`
- `spec/constitution/tech-stack.md`
- `AGENTS.md`

Este documento define únicamente el comportamiento específico de `003`, sin duplicar las decisiones globales.
