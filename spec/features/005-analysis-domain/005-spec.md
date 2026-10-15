# 005 — Analysis Domain

## Status

Draft — pendiente de aprobación.

## Objective

Definir el dominio tipado y verificable que representa las entradas, decisiones e interpretaciones de Ask Sofi, independientemente de React y de cualquier proveedor externo.

Esta feature establece el contrato que utilizarán `006 — Jev Integration` y `007 — Ask Sofi Chat Experience`; no interpreta mensajes reales todavía.

## Requirements

### 1. Entrada y contexto

- Una solicitud de análisis contiene un mensaje no vacío, contexto actual opcional y expediente de pareja opcional.
- El expediente utiliza los datos y valores estables de `004`; no se duplica su modelo ni se infieren respuestas ausentes.
- El contexto inmediato y las tendencias aportadas por el usuario se representan por separado.
- Las entradas que cruzan límites de confianza se validan en tiempo de ejecución y tienen límites de longitud explícitos definidos durante el plan, en coherencia con la constitution.
- El dominio no depende del almacenamiento del navegador, una pantalla o una sesión.

### 2. Interpretaciones

- El resultado puede contener varias interpretaciones simultáneas, sin forzar alternativas de relleno cuando no sean justificables.
- Cada interpretación utiliza un identificador de categoría estable, independiente del texto o del idioma de la interfaz.
- Categorías iniciales propuestas, a confirmar en esta spec:
  - `literal_permission`
  - `needs_reassurance`
  - `wants_initiative`
  - `wants_space`
  - `expressing_disappointment`
  - `setting_boundary`
  - `playful_teasing`
  - `unclear`
- `insufficient_context` no es una interpretación de la pareja: se representa como un estado del resultado.
- El dominio puede representar, cuando exista información sustentada, tono, indirectividad y necesidades emocionales, sin obligar a completar todos esos campos.

### 3. Incertidumbre y resultados

- Se distinguen explícitamente un análisis con interpretaciones y otro que necesita más contexto. Ambos son resultados válidos.
- La falta de contexto no se confunde con fallos de validación, red o proveedor.
- El nivel de confianza global es distinto del apoyo asignado a cada interpretación; ambos pueden ser desconocidos o no estar disponibles.
- Los valores numéricos, si se aportan, deben ser finitos, estar dentro de su rango declarado y proceder de una decisión explícita. No se generan porcentajes por defecto ni se normalizan automáticamente para sumar 100 %.
- El dominio no presenta esos valores como probabilidades objetivas de pensamientos o emociones de terceras personas.
- Si el contexto es insuficiente, puede representarse qué información adicional sería útil sin inventar una conclusión.
- Los umbrales de abstención, la calibración y las reglas empíricas de confianza no se fijan en esta feature: corresponden a `011` y `012`.

### 4. Contratos y escenarios controlados

- El dominio ofrece un contrato de proveedor sustituible, conforme a `tech-stack.md`, sin importar SDKs externos.
- Existe una implementación falsa y determinista para pruebas y futuras demostraciones; sus resultados son escenarios predefinidos, no interpretaciones calculadas a partir del mensaje.
- Los datos recibidos de proveedores son tratados como no confiables y deben ajustarse al contrato del dominio antes de consumirse.
- Los códigos de estado y error son explícitos; no se decide el flujo a partir del texto de una excepción.
- Las funciones y contratos centrales son reutilizables por la futura API web y el MCP, sin duplicar lógica de negocio.

### 5. Límites de alcance

- No se integra Jev, Vercel AI Gateway, una API HTTP ni un MCP.
- No se crean pantallas, componentes visuales, animaciones o nuevas exploraciones en el Design Lab.
- No se incorpora persistencia, lógica heurística de interpretación, porcentajes inventados ni reglas de fiabilidad sin evaluación.
- La presentación de resultados y los componentes visuales ya existentes en `002` se abordarán en `007`.
- Se siguen las convenciones técnicas, de privacidad y de testing de `AGENTS.md` y la constitution, sin duplicarlas aquí.

## Acceptance Criteria

- [ ] La entrada admite mensaje, contexto actual y expediente opcional, reutilizando el modelo existente de `004`.
- [ ] Las entradas y salidas externas son validadas y los datos inválidos se rechazan de manera controlada.
- [ ] Las categorías de interpretación poseen identificadores estables y no dependen del copy.
- [ ] Se representan varias interpretaciones cuando corresponda sin generar alternativas artificiales.
- [ ] `needs_context` es un resultado válido, distinto de un error técnico y de la categoría `unclear`.
- [ ] La confianza global y el apoyo por interpretación son datos separados y pueden no existir.
- [ ] Los valores numéricos inválidos se rechazan y no se inventan ni renormalizan probabilidades.
- [ ] Los campos de tono, indirectividad o necesidades pueden estar ausentes sin inducir inferencias.
- [ ] Existe un `DecisionProvider` desacoplado y un fake determinista, sin llamadas a servicios reales.
- [ ] Las pruebas unitarias cubren validación, multiplicidad, ausencia de contexto, incertidumbre y errores mediante Vitest.
- [ ] El dominio no importa React, Jev, SDKs, infraestructura de despliegue ni almacenamiento del navegador.
- [ ] No se han creado interfaces ni duplicado modelos, persistencia o componentes de las features anteriores.

## Pending product decisions

- Confirmar la taxonomía inicial propuesta y la diferencia entre `unclear` y el estado `needs_context`.
- Confirmar que los valores numéricos de apoyo serán opcionales hasta disponer de una fuente y evaluación que justifiquen su uso; la 007 decidirá su presentación.
