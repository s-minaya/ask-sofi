# 001 — Project Foundation

## Status

Complete

## Objective

Preparar una base de desarrollo reproducible y verificable sobre la que puedan construirse las siguientes features de Ask Sofi.

Esta feature no implementa funcionalidad de producto.

## Requirements

Al finalizar esta feature:

- el proyecto debe poder instalarse y ejecutarse localmente;
- debe existir un build de producción válido;
- deben poder ejecutarse lint, formatting y type checking;
- debe existir infraestructura funcional para unit tests y component tests;
- debe existir API mocking funcional para desarrollo y testing;
- React Compiler debe quedar habilitado o existir una incompatibilidad documentada;
- debe existir una configuración inicial de CI;
- las variables de entorno deben gestionarse de forma segura;
- el repositorio debe contener únicamente la estructura necesaria para el código existente;
- otro desarrollador debe poder clonar el repositorio y comenzar a trabajar siguiendo la documentación disponible.

## Acceptance Criteria

- [ ] La aplicación arranca correctamente en desarrollo.
- [ ] El build de producción finaliza correctamente.
- [ ] El typecheck puede ejecutarse de forma independiente.
- [ ] El lint finaliza correctamente.
- [ ] El formatter puede ejecutarse desde el proyecto.
- [ ] Los unit tests pueden ejecutarse correctamente.
- [ ] Los component tests pueden ejecutarse correctamente.
- [ ] Una petición HTTP de prueba puede ser interceptada mediante la infraestructura de API mocking.
- [ ] Los tests normales no requieren servicios externos ni credenciales.
- [ ] React Compiler está habilitado o su exclusión está documentada.
- [ ] La CI comprueba las validaciones iniciales definidas para el proyecto.
- [ ] No existen secretos versionados.
- [ ] El proyecto puede configurarse a partir de la documentación del repositorio.
- [ ] No existen carpetas o dependencias añadidas únicamente para anticipar features futuras.

## Out of Scope

No forma parte de esta feature implementar comportamiento específico de Ask Sofi, incluyendo análisis de mensajes, perfil de pareja, persistencia de producto, diseño visual definitivo, integraciones de IA, seguridad de producción o MCP.

## References

Las decisiones globales de producto, arquitectura, testing, responsive, accesibilidad, seguridad, rendimiento y convenciones se definen en:

- `spec/constitution/mission.md`
- `spec/constitution/roadmap.md`
- `spec/constitution/tech-stack.md`
- `AGENTS.md`

Este documento no debe duplicar esas decisiones.