# 001 — Project Foundation — Plan

## Status

Complete

## Approach

La foundation se construirá de forma incremental, manteniendo el proyecto ejecutable después de cada bloque de configuración.

El orden de implementación será:

```text
application scaffold
    ↓
code quality
    ↓
testing
    ↓
API mocking
    ↓
React Compiler
    ↓
environment configuration
    ↓
CI
    ↓
developer documentation
    ↓
final verification
```

## Project initialization

Se inicializará una aplicación mínima con la configuración definida en `tech-stack.md`.

El scaffold generado se limpiará para conservar únicamente:

- entry point;
- aplicación mínima;
- estilos globales mínimos;
- archivos de configuración necesarios.

Se eliminarán assets, estilos y código de demostración que no pertenezcan a Ask Sofi.

No se crearán todavía carpetas correspondientes a features futuras.

## Code quality

Se configurarán los comandos necesarios para ejecutar de forma independiente:

```text
lint
format
typecheck
```

Linting y formatting mantendrán responsabilidades separadas.

La configuración deberá poder reutilizarse posteriormente por CI y por los contribuidores sin requerir herramientas globales.

## Testing foundation

Se preparará un entorno común para:

- unit tests;
- React component tests.

Se añadirá únicamente el código de prueba mínimo necesario para verificar que ambas capas funcionan.

Los tests de esta feature validarán infraestructura, no comportamiento futuro de Ask Sofi.

## API mocking

MSW se configurará para funcionar en:

- desarrollo local;
- entorno de tests.

Se creará un handler mínimo de prueba para demostrar que una petición HTTP puede interceptarse correctamente.

Los contratos y fixtures reales de `/api/interpret` no se definirán todavía.

La activación de MSW en navegador quedará condicionada al entorno de desarrollo.

## React Compiler

React Compiler se integrará durante esta feature y se verificará mediante el build y los tests existentes.

Si aparece una incompatibilidad con la configuración real del proyecto, se documentará antes de modificar la decisión establecida en la constitution.

## Environment configuration

Se establecerá la separación entre:

- configuración pública;
- secretos server-side.

Sólo se añadirá `.env.example` cuando exista alguna variable que necesite ser conocida por una persona que clone el repositorio.

Los archivos locales con secretos permanecerán fuera de Git.

## Continuous Integration

Se creará un workflow inicial que ejecute las verificaciones básicas del proyecto sobre un entorno limpio.

La CI reutilizará los mismos scripts disponibles localmente.

El pipeline inicial seguirá conceptualmente:

```text
install
  ↓
lint
  ↓
typecheck
  ↓
test
  ↓
build
```

No se incluirán todavía evals de Jev ni tests que dependan de servicios externos.

## Documentation

La documentación de inicio deberá permitir que una persona pueda:

```text
clone
↓
install
↓
run development
↓
verify the project
```

sin conocer previamente la configuración interna.

La documentación específica de contribución más completa se desarrollará en la feature correspondiente del roadmap.

## Verification

Antes de cerrar la feature se ejecutará una verificación desde un estado equivalente a una instalación limpia.

Se comprobarán los criterios definidos en `001-spec.md`, incluyendo:

- desarrollo;
- build;
- lint;
- formatting;
- typecheck;
- tests;
- MSW;
- CI;
- ausencia de secretos;
- ausencia de estructura o dependencias prematuras.

## References

Requisitos:

- `001-spec.md`

Decisiones globales de implementación:

- `spec/constitution/tech-stack.md`

Reglas de trabajo para agentes:

- `AGENTS.md`