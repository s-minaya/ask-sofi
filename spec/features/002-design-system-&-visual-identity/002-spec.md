# 002 — Design System & Visual Identity

## Status

Draft

## Objective

Materializar la identidad visual de Ask Sofi mediante un sistema de componentes reutilizables, una landing de entrada y un playground interactivo que permita validar la experiencia del producto antes de integrar su lógica real.

## Requirements

Al finalizar esta feature:

- deben estar definidos e implementados los design tokens y estilos visuales específicos de Ask Sofi;
- debe existir una colección de componentes UI reutilizables que cubra controles, formularios, navegación y feedback;
- deben existir componentes visuales para mensajes, contexto, interpretaciones, confianza y estados del análisis;
- debe existir una landing editorial con una presentación de Sofi y una acción principal para comenzar;
- el usuario debe poder elegir si desea utilizar sonido antes de entrar en la experiencia;
- debe existir un componente `SofiSpeech` que presente progresivamente el texto mediante un efecto typewriter;
- `SofiSpeech` debe admitir sonido opcional sincronizado con la escritura, permitir revelar inmediatamente el texto completo y ofrecer una alternativa accesible;
- la reproducción de audio debe iniciarse mediante interacción del usuario y recuperarse correctamente cuando el navegador la bloquee;
- debe existir un Design Lab accesible únicamente en desarrollo, organizado en Foundations, UI Components, Sofi Components, Motion & Sound y Experience Preview;
- el Design Lab debe permitir explorar componentes reales, variantes, estados, temas y diferentes tamaños de visualización;
- debe existir una Experience Preview navegable que conecte landing, consulta, procesamiento y resultados mediante escenarios simulados;
- los escenarios deben representar éxito, carga, error y contexto insuficiente, sin depender de servicios externos.

## Acceptance Criteria

- [x] Los design tokens están implementados y son utilizados por los componentes.
- [x] Los componentes UI previstos pueden reutilizarse fuera del Design Lab.
- [x] Los componentes permiten visualizar e interactuar con sus variantes y estados relevantes.
- [x] La landing permite iniciar la experiencia y muestra a Sofi o su alternativa visual.
- [x] La experiencia ofrece una elección explícita de sonido y no reproduce audio antes de la interacción autorizada.
- [x] Un bloqueo de reproducción de audio no impide utilizar la aplicación.
- [x] `SofiSpeech` muestra progresivamente el texto y permite revelarlo inmediatamente.
- [x] El sonido de `SofiSpeech` puede activarse y desactivarse sin afectar a la presentación del texto.
- [ ] `SofiSpeech` respeta el movimiento reducido y proporciona una lectura coherente para tecnologías de asistencia.
- [x] El Design Lab permite comprobar los temas Light, Dark y System.
- [x] El Design Lab incluye controles para explorar distintos tamaños de visualización y estados de los componentes.
- [ ] Motion & Sound permite probar el comportamiento visual y sonoro de `SofiSpeech`.
- [x] La Experience Preview permite recorrer el flujo visual completo y alternar entre los escenarios simulados.
- [x] Los resultados simulados distinguen claramente las interpretaciones de las certezas.
- [x] El Design Lab no está disponible en la aplicación pública de producción.
- [ ] La landing, los componentes, el Design Lab y la Experience Preview han superado las verificaciones de accesibilidad aplicables, tanto automáticas como manuales, conforme a `tech-stack.md`.

## Out of Scope

No forma parte de esta feature implementar análisis probabilístico real, integración con Jev, persistencia general de datos, perfil de pareja, flujo funcional definitivo de consultas ni el sistema completo de ilustraciones y animaciones del personaje.

## References

Las decisiones globales de producto, identidad visual, arquitectura, responsive, accesibilidad, testing y convenciones se definen en:

- `spec/constitution/mission.md`
- `spec/constitution/roadmap.md`
- `spec/constitution/tech-stack.md`
- `AGENTS.md`

Este documento no debe duplicar esas decisiones.