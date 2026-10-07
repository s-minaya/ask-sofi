# Ask Sofi — Tech Stack & Engineering Guidelines

## 1. Propósito

Este documento define las decisiones técnicas, arquitectónicas y de desarrollo de **Ask Sofi — Relationship Intelligence Agency**.

Su función es establecer una base común para:

- arquitectura;
- herramientas;
- estructura del proyecto;
- responsive design;
- accesibilidad;
- persistencia;
- testing;
- seguridad;
- integración con servicios externos;
- convenciones de código;
- despliegue.

Las decisiones específicas de una feature deben documentarse en su correspondiente `plan.md`.

Este archivo representa las convenciones técnicas globales.

---

## 2. Principios técnicos

Ask Sofi seguirá los siguientes principios:

```text
Simple before clever.
Mobile first.
Accessible by default.
Local first when possible.
Server only when necessary.
External providers behind adapters.
No duplicated business logic.
No unnecessary dependencies.
No premature abstraction.
No unexpected costs.
```

La arquitectura debe ser suficientemente limpia para evolucionar, pero suficientemente sencilla para que una desarrolladora junior pueda:

- comprenderla;
- explicarla;
- modificarla;
- probarla;
- defender sus decisiones en una entrevista técnica.

Una abstracción sólo se introducirá cuando resuelva un problema real.

---

## 3. Stack principal

### Frontend

```text
React
TypeScript
Vite
```

#### React

React será responsable de:

- composición de la interfaz;
- estado de presentación;
- formularios;
- navegación;
- interacción con el dominio;
- gestión de estados asíncronos;
- preferencias del usuario.

No se utilizará un framework full-stack como Next.js mientras no exista una necesidad concreta de:

- SSR;
- server components;
- generación dinámica en servidor;
- routing basado en servidor.

Ask Sofi es principalmente una aplicación interactiva cliente-side, por lo que una SPA es suficiente.

---

### TypeScript

Todo el código de aplicación utilizará TypeScript.

Se utilizará configuración estricta.

Objetivos:

- detectar errores durante desarrollo;
- documentar estructuras mediante tipos;
- mantener contratos claros entre dominio, infraestructura y UI;
- evitar conversiones implícitas innecesarias.

Debe evitarse el uso de:

```ts
any
```

salvo que exista una justificación técnica documentada.

Cuando un dato provenga del exterior debe considerarse:

```ts
unknown
```

hasta ser validado.

---

### Vite

Vite será utilizado para:

- desarrollo local;
- build de producción;
- variables de entorno públicas;
- integración con Vitest;
- manejo de assets.

No se añadirán plugins de Vite que no solucionen una necesidad concreta.

---

## 4. Package manager

Se utilizará:

```text
npm
```

Razones:

- viene incluido con Node.js;
- reduce herramientas adicionales;
- es ampliamente conocido;
- facilita la incorporación de contribuidores;
- es suficiente para el tamaño del proyecto.

El repositorio deberá mantener:

```text
package.json
package-lock.json
```

El lockfile se versionará.

---

## 5. Routing

Se utilizará **React Router** cuando existan suficientes vistas para justificar navegación.

Rutas previstas conceptualmente:

```text
/
    Ask Sofi
/profile
    Partner profile
/saved
    Saved analyses / favorites
/insights
    Drama Report
/settings
    Preferences / privacy
/about
    How Ask Sofi works
```

La estructura definitiva deberá definirse durante las features correspondientes.

No se utilizará routing únicamente para dividir componentes visuales pequeños.

---

## 6. Styling

Se utilizará:

```text
SCSS
+
CSS Modules
+
CSS Custom Properties
```

### SCSS

SCSS se utilizará principalmente para:

- organización;
- nesting moderado;
- mixins cuando aporten valor real;
- reutilización de pequeñas reglas;
- estructura de estilos.

No debe convertirse en una segunda capa de programación.

Se evitarán:

- nesting excesivo;
- selectores profundamente acoplados al DOM;
- mixins gigantes;
- sistemas propios demasiado abstractos.

---

### CSS Modules

Los estilos específicos de componentes utilizarán módulos:

```text
Component.module.scss
```

Esto permite:

- aislar estilos;
- evitar colisiones;
- mantener relación directa componente-estilo;
- evitar metodologías de nombres innecesariamente complejas.

---

### CSS Custom Properties

Los design tokens globales se expondrán mediante custom properties.

Ejemplo conceptual:

```css
:root {
  --color-background: ...;
  --color-surface: ...;
  --color-text: ...;
  --color-accent: ...;
  --space-xs: ...;
  --space-sm: ...;
  --space-md: ...;
  --radius-sm: ...;
  --radius-md: ...;
  --content-max-width: ...;
}
```

SCSS no sustituirá a las variables CSS para propiedades que necesiten cambiar dinámicamente, especialmente:

- themes;
- semantic colors;
- runtime preferences.

---

## 7. Design tokens

Se crearán tokens para evitar valores arbitrarios repetidos.

Categorías previstas:

```text
color
typography
spacing
radius
shadow
motion
layout
z-index
```

Los tokens deberán expresar intención cuando sea posible.

Preferir:

```css
--color-text-primary
--color-text-muted
--color-danger
```

frente a:

```css
--gray-700
--red-500
```

cuando el token tenga una función semántica.

---

## 8. Themes

Ask Sofi soportará:

```text
Light
Dark
System
```

La preferencia por defecto será:

```text
System
```

La implementación utilizará:

- `prefers-color-scheme`;
- CSS custom properties;
- una preferencia persistida localmente cuando el usuario elija manualmente un tema.

Conceptualmente:

```text
system
   ↓
prefers-color-scheme
light / dark
   ↓
explicit user preference
```

Una preferencia explícita tendrá prioridad sobre el sistema.

### Dark y light son diseños reales

No se implementará dark mode mediante una simple inversión automática de colores.

Ambos temas deberán mantener:

- identidad editorial;
- contraste;
- jerarquía;
- legibilidad;
- estados interactivos;
- foco visible;
- percepción coherente de profundidad.

---

## 9. Responsive Design

### Mobile First

Ask Sofi se diseñará siguiendo una estrategia:

> **Mobile first, fluid by default.**

Los estilos base deben funcionar en las pantallas pequeñas.

Los layouts más complejos se añadirán progresivamente cuando exista suficiente espacio.

Ejemplo conceptual:

```scss
.component {
  // Layout móvil y comportamiento base.
  @media (min-width: ...) {
    // Mejora del layout cuando el contenido lo necesita.
  }
}
```

No se diseñará primero una pantalla desktop para después intentar comprimirla.

---

## 10. Content-driven responsive design

No se definirán layouts basados en modelos concretos de dispositivo como:

```text
iPhone
iPad
Laptop
Desktop
```

Los breakpoints existirán cuando **el contenido necesite cambiar su disposición**.

La pregunta será:

> ¿En qué punto este layout deja de funcionar correctamente?

No:

> ¿Cuál es el ancho de un iPad?

Esto permite que la aplicación funcione también en tamaños intermedios y dispositivos futuros.

---

## 11. Breakpoint strategy

Se evitará mantener una colección extensa de breakpoints.

Como principio:

```text
base/mobile
    ↓
wide layout when needed
    ↓
large-screen refinement only when justified
```

Idealmente la mayoría de las pantallas necesitarán:

- estilos base;
- uno o dos cambios estructurales.

No se crearán breakpoints sólo para ajustar pequeños márgenes.

Antes de introducir uno nuevo deberán explorarse soluciones fluidas.

---

## 12. Fluid Layout

Se priorizarán herramientas nativas de CSS como:

```css
display: grid;
display: flex;
min();
max();
clamp();
minmax();
auto-fit;
auto-fill;
width: 100%;
max-width: ...;
```

Ejemplo conceptual:

```css
.page {
  width: min(100% - 2rem, 80rem);
  margin-inline: auto;
}
```

Esto permite que el contenido:

- aproveche pantallas pequeñas;
- crezca progresivamente;
- deje de expandirse cuando deja de mejorar la experiencia.

---

## 13. Fluid typography and spacing

Cuando aporte valor se utilizará `clamp()` para evitar saltos bruscos entre dispositivos.

Ejemplo conceptual:

```css
font-size: clamp(2rem, 6vw, 5rem);
```

Especialmente útil para:

- titulares editoriales;
- spacing de página;
- hero sections;
- gaps grandes.

No debe utilizarse `clamp()` en cada propiedad únicamente porque exista.

---

## 14. Large screens

Ask Sofi debe aprovechar pantallas grandes sin convertir el contenido en líneas de texto gigantes o grandes zonas vacías.

En large desktop:

- el contenido podrá distribuirse en varias columnas;
- Sofi podrá ocupar una zona visual propia;
- contexto y análisis podrán coexistir cuando exista espacio;
- elementos secundarios podrán moverse lateralmente;
- los resultados podrán utilizar composiciones editoriales más amplias.

Ejemplo conceptual:

```text
MOBILE
┌─────────────────┐
│      SOFI       │
│                 │
│    MESSAGE      │
│                 │
│    ANALYSIS     │
└─────────────────┘
```

```text
DESKTOP
┌─────────────────────────────────────┐
│                                     │
│   SOFI       │   MESSAGE / CONTEXT  │
│              │                      │
│              │   ANALYSIS           │
│              │                      │
└─────────────────────────────────────┘
```

```text
LARGE DESKTOP
┌──────────────────────────────────────────────┐
│                                              │
│ SOFI │ MESSAGE / CONTEXT │ RESULTS / DETAILS │
│      │                   │                   │
└──────────────────────────────────────────────┘
```

La tercera columna sólo deberá aparecer cuando realmente mejore la experiencia.

Nunca se utilizará simplemente para rellenar espacio.

---

## 15. No excessive empty space

El layout debe adaptarse naturalmente al viewport.

Se evitarán:

- containers excesivamente estrechos en desktop;
- grandes laterales vacíos sin intención visual;
- paneles con alturas fijas innecesarias;
- secciones `100vh` que obliguen a dejar contenido vacío;
- componentes que no aprovechen el espacio disponible.

Al mismo tiempo, aprovechar espacio no significa estirar todo hasta los extremos.

Los textos largos mantendrán un ancho de lectura cómodo.

La interfaz debe encontrar un equilibrio entre:

```text
use available space
        +
preserve readable line length
```

---

## 16. Portrait and landscape

Ask Sofi deberá funcionar correctamente tanto en:

```text
portrait
landscape
```

La orientación no se tratará automáticamente como un tipo diferente de dispositivo.

Se priorizará que el layout responda al espacio realmente disponible.

Sólo se utilizarán media queries como:

```css
@media (orientation: landscape)
```

cuando exista un problema específico que no pueda resolverse mediante layout fluido.

Esto es especialmente importante para:

- teléfonos en horizontal;
- tablets;
- dispositivos plegables;
- ventanas de navegador redimensionadas.

---

## 17. Viewport height

Se evitará depender indiscriminadamente de:

```css
height: 100vh;
```

especialmente en dispositivos móviles.

Cuando resulte necesario ocupar el viewport podrán utilizarse unidades modernas como:

```text
dvh
svh
```

sin impedir que el contenido pueda crecer.

Preferir:

```css
min-height: 100dvh;
```

frente a alturas rígidas.

La interfaz nunca debe cortar contenido porque el viewport sea bajo.

---

## 18. Responsive components

Los componentes deben intentar ser responsables de su propio comportamiento antes de requerir reglas específicas de página.

Se utilizarán principalmente:

- Flexbox;
- CSS Grid;
- intrinsic sizing;
- wrapping;
- min/max sizes.

Las container queries podrán utilizarse cuando resuelvan claramente un componente reutilizable que deba reaccionar al espacio de su contenedor y no al viewport.

No se introducirán por defecto.

---

## 19. Responsive media

Imágenes, ilustraciones y animaciones deberán:

- mantener su relación de aspecto;
- evitar overflow;
- responder al contenedor;
- utilizar dimensiones máximas razonables;
- no desplazar contenido durante la carga.

La ilustración y animaciones de Sofi deberán diseñarse pensando desde el principio en:

```text
small portrait
small landscape
tablet
desktop
large desktop
```

No se crearán versiones completamente diferentes de la interfaz para cada dispositivo salvo necesidad real.

---

## 20. Responsive QA

Cada feature visual deberá comprobarse al menos en:

```text
narrow mobile
standard mobile
mobile landscape
tablet-like width
laptop
desktop
large desktop
```

Las pruebas no dependerán únicamente de presets de dispositivos.

También deberá redimensionarse progresivamente el navegador para encontrar:

- puntos de ruptura accidentales;
- overflows;
- huecos;
- líneas demasiado largas;
- componentes aplastados.

Los tamaños exactos utilizados en QA se definirán en las features de testing correspondientes.

---

## 21. State management

No se utilizará inicialmente:

```text
Redux
Zustand
MobX
```

React ofrece suficientes herramientas para el alcance previsto.

Se priorizarán:

```text
useState
useReducer
Context
custom hooks
```

### Estado local primero

Si un estado sólo pertenece a un componente, permanecerá en ese componente.

El estado no deberá elevarse globalmente sin necesidad.

Context podrá utilizarse para concerns realmente transversales como:

- theme;
- preferences;
- local profile;
- privacy settings.

Si la complejidad futura demuestra que React no es suficiente, se reevaluará esta decisión.

---

## 22. Forms

Los formularios utilizarán inicialmente capacidades nativas de React y HTML.

No se añadirá una biblioteca de formularios hasta que la complejidad lo justifique.

Se priorizarán:

- `<form>`;
- `<label>`;
- `<fieldset>`;
- `<legend>`;
- controles HTML nativos;
- validación clara;
- mensajes de error asociados semánticamente.

El formulario debe funcionar mediante teclado y tecnologías de asistencia.

---

## 23. Validation

Se utilizará:

```text
Zod 4
```

para validar datos que crucen límites del sistema.

Por ejemplo:

```text
browser
   ↓
API
storage
   ↓
application
external provider
   ↓
domain
```

Los tipos TypeScript no sustituyen la validación runtime.

Una entrada externa nunca debe considerarse válida sólo porque exista una interfaz TypeScript correspondiente.

---

## 24. Domain architecture

La lógica principal deberá ser independiente de:

- React;
- Vercel;
- Jev;
- MCP;
- localStorage.

Conceptualmente:

```text
                 ┌─────────────────┐
                 │     DOMAIN      │
                 │                 │
                 │ interpretMessage│
                 └────────┬────────┘
                          │
                  DecisionProvider
                          │
                 ┌────────┴─────────┐
                 │                  │
              JevProvider       FakeProvider
```

React consume el dominio.

Jev implementa un contrato del dominio.

El dominio no importa Jev.

---

## 25. DecisionProvider

Se creará una abstracción similar conceptualmente a:

```ts
interface DecisionProvider {
  evaluate(
    input: AnalysisInput,
  ): Promise<DecisionResult>;
}
```

Su API definitiva se definirá durante la correspondiente feature.

Implementaciones previstas:

```text
JevDecisionProvider
FakeDecisionProvider
```

El provider falso permitirá:

- unit tests;
- integration tests;
- desarrollo offline;
- demos controladas;
- testing sin consumir recursos externos.

---

## 26. Jev

Jev será el proveedor probabilístico inicial.

Se utilizará para:

- decisiones estructuradas;
- probabilidades;
- clasificación;
- scoring cuando corresponda.

No se utilizará como generador libre de todo el contenido de la interfaz.

Ask Sofi mantendrá el control sobre:

- labels;
- explicaciones;
- recomendaciones;
- copy;
- mensajes de error;
- presentación.

Conceptualmente:

```text
Jev
 ↓
structured decisions
 ↓
Ask Sofi domain
 ↓
product copy
 ↓
UI
```

Esto permite que el producto siga siendo:

- testeable;
- consistente;
- explicable.

---

## 27. AI Gateway

La integración inicial de Jev se realizará mediante:

```text
Vercel AI Gateway
```

El acceso a modelos debe estar encapsulado dentro de infraestructura.

Nunca deberá invocarse directamente desde componentes React.

Las credenciales:

- nunca llegarán al navegador;
- vivirán exclusivamente en variables de entorno del servidor.

El consumo deberá mantenerse dentro de los recursos gratuitos disponibles.

Si el recurso gratuito no está disponible:

> Ask Sofi debe fallar de forma segura antes que generar costes inesperados.

---

## 28. Server API

La aplicación pública utilizará una API HTTP convencional para solicitar análisis.

Conceptualmente:

```text
POST /api/interpret
```

La API será responsable de:

```text
request
   ↓
validation
   ↓
abuse protection
   ↓
domain
   ↓
provider
   ↓
response
```

El navegador nunca deberá llamar directamente a Jev.

---

## 29. API responses

Las respuestas internas utilizarán estructuras explícitas.

Ejemplo conceptual:

```ts
type AnalysisResponse = {
  status: "success" | "needs_context";
  interpretations: Interpretation[];
  confidence: ConfidenceLevel;
};
```

Los errores previsibles deberán representarse claramente.

No se dependerá del texto de una excepción para determinar lógica de producto.

---

## 30. Vercel

La aplicación pública se desplegará inicialmente mediante:

```text
Vercel Hobby
```

Vercel alojará:

- frontend;
- static assets;
- API functions.

La infraestructura específica de Vercel deberá mantenerse en los límites exteriores de la arquitectura.

El dominio no dependerá de APIs propietarias de Vercel.

---

## 31. Cloud portability

No existirá un segundo deployment activo en Cloudflare durante v1.

Sin embargo:

```text
domain
business rules
schemas
providers
```

deberán permanecer suficientemente independientes para facilitar una futura migración.

No se introducirán abstracciones complejas exclusivamente para conseguir hipotética portabilidad.

La portabilidad debe surgir principalmente de:

- separación de responsabilidades;
- Web APIs estándar;
- aislamiento de infraestructura.

---

## 32. Bot protection

Para la aplicación web pública se utilizará:

```text
Cloudflare Turnstile
```

Turnstile protegerá las operaciones que puedan consumir recursos externos.

El token deberá verificarse en servidor.

Nunca se considerará válida una verificación realizada exclusivamente en cliente.

La protección deberá integrarse evitando degradar innecesariamente la experiencia de personas reales.

---

## 33. Rate limiting

El endpoint público de análisis tendrá protección server-side contra abuso.

El límite exacto no se fijará en este documento.

Se definirá en:

```text
spec/features/013-security/
```

de acuerdo con:

- experiencia de usuario;
- recursos gratuitos disponibles;
- comportamiento observado;
- riesgo de abuso.

Los datos almacenados en navegador nunca serán utilizados como fuente de verdad para rate limiting.

---

## 34. Local persistence

Ask Sofi no tendrá base de datos en v1.

Se utilizarán:

```text
localStorage
sessionStorage
```

mediante una capa de infraestructura propia.

---

## 35. sessionStorage

Datos previstos:

- current draft;
- current context;
- current analysis;
- temporary analysis cache;
- temporary navigation state.

Estos datos pueden desaparecer al finalizar la sesión.

---

## 36. localStorage

Datos previstos:

- UI preferences;
- theme;
- animation preferences;
- onboarding state;
- partner profile;
- optional history;
- favorites;
- saved analyses;
- privacy preferences.

Las estadísticas personales se derivarán de estos datos siempre que sea posible.

---

## 37. Storage abstraction

Los componentes no deberán utilizar directamente:

```ts
localStorage.getItem()
localStorage.setItem()
sessionStorage.getItem()
```

Se creará una capa equivalente a:

```text
infrastructure/storage/
```

con APIs específicas.

Ejemplo:

```ts
getPreferences();
savePreferences();
getPartnerProfile();
savePartnerProfile();
getSavedAnalyses();
saveAnalysis();
clearHistory();
clearUserData();
```

Esto evita:

- duplicación;
- parsing disperso;
- keys inconsistentes;
- dificultad para migraciones.

---

## 38. Storage versioning

Los datos persistidos incluirán versión.

Ejemplo conceptual:

```ts
{
  version: 1,
  data: {}
}
```

La aplicación deberá ser capaz de:

- validar datos almacenados;
- migrarlos;
- ignorar datos incompatibles;
- recuperar un estado seguro.

Nunca se asumirá que `localStorage` contiene datos válidos.

---

## 39. Client cache

Resultados idénticos podrán reutilizarse temporalmente para evitar solicitudes innecesarias.

La caché deberá tener en cuenta al menos:

```text
message
context
relevant partner profile
analysis version
```

La estrategia concreta y TTL se definirá en su feature correspondiente.

La caché:

- mejora experiencia;
- reduce llamadas;
- evita doble envío accidental.

No sustituye el rate limiting de servidor.

---

## 40. MCP

Se utilizará:

```text
Official MCP TypeScript SDK v2
```

El servidor MCP inicial será:

```text
local / self-hosted
```

La primera integración priorizará `stdio` para clientes locales.

La arquitectura deberá permitir un futuro transporte HTTP sin reescribir el dominio.

El MCP consumirá exactamente la misma lógica central que la web.

```text
Web API ─────┐
             │
             ▼
      interpretMessage()
             ▲
             │
MCP ─────────┘
```

No existirán dos implementaciones del traductor.

---

## 41. MCP remote

Un servidor MCP remoto público no forma parte de la primera implementación.

Cuando se estudie deberá valorar:

- authorization;
- authentication;
- rate limiting;
- quota ownership;
- abuse protection;
- secrets;
- cost.

Nunca se publicará un MCP anónimo que permita utilizar ilimitadamente las credenciales privadas del proyecto.

---

## 42. Testing strategy

Se utilizarán diferentes niveles de tests.

```text
Unit
 ↓
Integration
 ↓
E2E
 ↓
Accessibility
 ↓
Evaluation
```

Cada nivel responde a una pregunta distinta.

---

### 42.1. Testing approach

Ask Sofi combinará Spec Driven Development con prácticas de Test Driven Development cuando aporten claridad y seguridad.

La especificación define el comportamiento esperado antes de implementar una feature.

Cuando una unidad de lógica tenga entradas y resultados claramente verificables, se favorecerá el ciclo:

```text
RED
write a failing test
GREEN
implement the minimum behavior
REFACTOR
improve the implementation without changing behavior
```

TDD será especialmente apropiado para:

- domain logic;
- validation;
- storage;
- migrations;
- statistics;
- analysis mapping;
- caching;
- reliability rules;
- API behavior;
- security-related behavior.

No será obligatorio escribir primero un test para cada detalle puramente visual.

Los criterios de aceptación definidos en las specifications deberán orientar los tests de integración y end-to-end.

Los tests deben verificar comportamiento observable y contratos, no detalles internos de implementación.

### 42.2. Unit testing

Se utilizará:

```text
Vitest
```

Principalmente para:

- domain functions;
- storage;
- mappers;
- validation;
- utility functions;
- analysis logic;
- statistics.

Los unit tests no llamarán a Jev.

---

### 42.3. Component testing

Se utilizará:

```text
Testing Library
```

Los tests deberán aproximarse a cómo interactúa una persona.

Preferir:

```text
getByRole
getByLabelText
getByText
```

antes que seleccionar componentes mediante:

```text
class
id
implementation details
```

---

### 42.4. API Mocking

Se utilizará **Mock Service Worker (MSW)** para simular las fronteras HTTP de Ask Sofi durante desarrollo y testing.

La principal frontera simulada será:

```text
POST /api/interpret
```

MSW permitirá desarrollar y verificar la interfaz sin depender de:

- un backend activo;
- Jev;
- disponibilidad de servicios externos;
- consumo de cuota;
- respuestas impredecibles.

Los mocks deberán representar estados relevantes del contrato HTTP, incluyendo:

```text
success
needs_context
low_confidence
slow_response
validation_error
rate_limited
provider_unavailable
unexpected_error
```

#### Responsabilidad de MSW

MSW prueba el comportamiento del cliente frente al contrato HTTP.

```text
React UI
   ↓
HTTP request
   ↓
MSW
   ↓
controlled HTTP response
```

MSW no sustituye a `FakeDecisionProvider`.

```text
MSW
→ mocks the HTTP boundary.
FakeDecisionProvider
→ mocks the probabilistic provider behind the domain.
```

Ambos permiten probar capas diferentes de forma independiente.

#### Shared handlers

Cuando resulte razonable, los handlers y fixtures podrán reutilizarse entre:

- local development;
- component tests;
- integration tests.

Los escenarios deberán mantenerse centralizados para evitar respuestas simuladas inconsistentes repartidas por los tests.

Estructura inicial prevista:

```text
src/
└── mocks/
    ├── fixtures/
    ├── handlers/
    ├── browser.ts
    └── server.ts
```

La estructura definitiva sólo se creará cuando la feature correspondiente la necesite.

#### Production

MSW nunca deberá activarse accidentalmente en producción.

Los mocks pertenecen exclusivamente a:

```text
development
testing
controlled demos
```

Los tests normales no realizarán llamadas reales a Jev.

Las llamadas reales se reservarán para:

```text
explicit evaluation runs
manual integration verification
controlled smoke tests
```

### 42.5. End-to-end testing

Se utilizará:

```text
Playwright
```

para verificar flujos como:

```text
onboarding
partner profile
analysis
insufficient context
history
favorites
theme
privacy settings
responsive flows
```

Las pruebas automáticas utilizarán un provider controlado cuando sea posible para evitar dependencias externas y costes.

---

### 42.6. Accessibility testing

Se utilizará:

```text
@axe-core/playwright
```

como parte de las comprobaciones automáticas.

Las comprobaciones automáticas no sustituyen:

- navegación manual con teclado;
- revisión de foco;
- pruebas con lector de pantalla;
- zoom;
- responsive;
- reduced motion.

Objetivo:

```text
WCAG 2.2 AA
```

---

## 43. Accessibility-first HTML

Se preferirá HTML nativo siempre que exista un elemento adecuado.

Preferir:

```html
<button>
<nav>
<main>
<form>
<label>
<fieldset>
<legend>
```

antes que recrear esos comportamientos con:

```html
<div>
```

ARIA se utilizará para complementar semántica cuando sea necesario, no para sustituir HTML correcto.

---

## 44. Motion accessibility

La aplicación respetará:

```css
prefers-reduced-motion
```

Las animaciones de Sofi deberán disponer de una alternativa estática.

La información nunca dependerá de una animación.

El usuario podrá disponer además de una preferencia propia relacionada con animaciones.

---

## 45. Loading states

Los estados asíncronos deberán diferenciar:

```text
idle
submitting
processing
success
needs_context
error
```

Las animaciones visuales de Sofi se conectarán a esos estados de UI.

La lógica de dominio no conocerá animaciones.

No se introducirán retrasos artificiales para mantener un loader visible.

---

## 46. Sofi media assets

Las animaciones deberán ser:

- pequeñas;
- optimizadas;
- lazy-loaded cuando tenga sentido;
- responsive;
- sin autoplay con sonido;
- sustituibles por imagen estática.

Se valorarán formatos web eficientes como:

```text
WebM
WebP
```

según las características del asset.

Debe existir fallback cuando corresponda.

---

## 47. Fonts

La identidad visual utilizará inicialmente:

```text
Bodoni Moda
    → display / editorial headings
Space Grotesk
    → interface / body
```

Las fuentes deberán servirse de forma que no sea necesario depender de una petición runtime a un proveedor externo siempre que sea razonable.

Se deberán cargar únicamente:

- pesos necesarios;
- estilos necesarios.

La ausencia temporal de la fuente personalizada no debe hacer ilegible la aplicación.

---

## 48. Performance

Ask Sofi no necesita optimizaciones prematuras, pero sí buenas prácticas básicas.

Se prestará atención a:

- bundle size;
- font loading;
- image dimensions;
- animation weight;
- lazy loading;
- unnecessary re-renders;
- unnecessary network calls;
- layout shifts.

No se introducirán complejas técnicas de optimización sin medir primero el problema.

---

### 48.1. React Rendering Strategy

Ask Sofi aprovechará el modelo de renderizado de React antes de introducir optimizaciones manuales.

La estrategia será:

```text
local state
    ↓
pure components
    ↓
minimal effects
    ↓
React Compiler
    ↓
measure
    ↓
optimize only when necessary
```

#### State locality

El estado debe mantenerse tan cerca como sea posible de los componentes que lo utilizan.

No se elevará estado a:

- page level;
- Context;
- application level;

únicamente por comodidad.

El estado temporal de una feature debe permanecer dentro de esa feature siempre que sea posible.

Esto es especialmente importante para estados que cambian con frecuencia, como:

- text inputs;
- current context;
- open/closed UI state;
- hover state;
- temporary filters.

---

### 48.2. React Compiler

Ask Sofi utilizará React Compiler salvo que durante Project Foundation se detecte una incompatibilidad concreta que justifique no hacerlo.

El compilador se encargará de gran parte de la memoización de componentes y valores.

Esto no sustituye una arquitectura correcta.

El código deberá continuar respetando:

- Rules of React;
- pure rendering;
- correct state ownership;
- correct Effect dependencies.

---

### 48.3. Manual memoization

No se utilizarán preventivamente:

```text
React.memo
useMemo
useCallback
```

únicamente con el objetivo genérico de "mejorar rendimiento".

Podrán utilizarse cuando:

- exista trabajo mediblemente costoso;
- una identidad estable sea necesaria;
- exista una interacción que haya demostrado problemas;
- React Compiler no pueda resolver adecuadamente el caso;
- React DevTools Profiler muestre un beneficio razonable.

La memoización manual deberá resolver un problema identificable.

---

### 48.4. Effects

`useEffect` no deberá utilizarse para calcular valores que puedan derivarse durante render.

Evitar:

```text
state A changes
    ↓
effect
    ↓
set state B
    ↓
second render
```

cuando sea posible obtener B directamente a partir de A.

Los Effects se reservarán principalmente para sincronización con sistemas externos.

---

### 48.5. Derived state

No se almacenará información que pueda derivarse de forma sencilla de otro estado.

Preferir:

```ts
const favoriteCount = favorites.length;
```

frente a mantener independientemente:

```ts
favorites
favoriteCount
```

si ambos representan la misma información.

Esto evita:

- estados inconsistentes;
- actualizaciones adicionales;
- renders innecesarios.

---

### 48.6. Context performance

Context se utilizará únicamente para información realmente transversal.

Se evitará un único contexto global que contenga estados con frecuencias de actualización muy diferentes.

Ejemplos razonables:

```text
ThemeContext
PreferencesContext
```

El estado específico de:

```text
analysis
partner-profile form
history filters
drama report
```

deberá permanecer dentro de sus correspondientes features salvo necesidad demostrada.

---

### 48.7. Non-blocking updates

Cuando una actualización costosa no necesite bloquear una interacción inmediata, podrán utilizarse capacidades nativas de React como:

```text
useTransition
useDeferredValue
```

Sólo se introducirán cuando exista trabajo suficiente para justificarlo.

Posibles candidatos futuros:

- filtering large local histories;
- Drama Report calculations;
- complex local visualizations;
- search over saved analyses.

---

### 48.8. Code splitting

Las partes de la aplicación que no sean necesarias para la experiencia inicial podrán cargarse bajo demanda.

Posibles candidatos:

```text
Drama Report
Saved analyses
About
large Sofi media assets
secondary settings
```

El code splitting deberá responder a una mejora medible o razonable del initial load.

No se dividirá cada componente pequeño en un chunk independiente.

---

### 48.9. Render measurement

Las optimizaciones de renderizado deberán basarse preferentemente en medición.

Herramientas previstas:

```text
React DevTools Profiler
browser Performance tools
production build testing
Lighthouse
```

El comportamiento de desarrollo no se utilizará como única referencia de rendimiento.

Cuando se investigue un problema de rendimiento se probará también:

- production build;
- CPU throttling cuando resulte útil;
- mobile viewport;
- slower network conditions cuando afecte a recursos.

---

### 48.10. Performance priorities

Para Ask Sofi se priorizará:

1. respuesta inmediata al escribir e interactuar;
2. evitar network requests innecesarias;
3. evitar renders causados por estado mal ubicado;
4. mantener pequeño el initial bundle;
5. optimizar imágenes, fuentes y animaciones;
6. cargar contenido secundario cuando sea necesario;
7. memoizar manualmente únicamente después de identificar un problema.

La optimización no deberá reducir innecesariamente la legibilidad del código.

> Performance should be designed, measured and justified — not guessed.

## 49. Evaluation system

Las evaluaciones probabilísticas vivirán fuera de los tests normales de UI.

Estructura prevista:

```text
evals/
├── fixtures/
├── runner/
└── reports/
```

Las evals podrán utilizar llamadas reales a Jev de manera controlada.

No se ejecutarán automáticamente en cada:

```text
npm test
```

ni en cada Pull Request si eso implica consumo externo.

Se ejecutarán de forma explícita cuando necesitemos validar el modelo.

---

## 50. Continuous Integration

Se utilizará:

```text
GitHub Actions
```

El pipeline inicial deberá comprobar:

```text
install
 ↓
lint
 ↓
typecheck
 ↓
unit tests
 ↓
build
```

Posteriormente se incorporarán:

```text
E2E
accessibility checks
```

cuando las correspondientes features existan.

Las evals de Jev no deberán ejecutarse automáticamente en cada commit.

---

## 51. Linting

Se utilizará:

```text
ESLint
typescript-eslint
eslint-plugin-jsx-a11y
```

El objetivo del linting es detectar problemas reales y mantener consistencia.

No se añadirá un número excesivo de reglas puramente estilísticas.

---

## 52. Formatting

Se utilizará:

```text
Prettier
```

El formato automático debe evitar discusiones de estilo irrelevantes.

Prettier será responsable de formatting.

ESLint será responsable de calidad y reglas de código.

---

## 53. Naming conventions

El código utilizará inglés.

### Variables and functions

```ts
camelCase
```

### Components and types

```ts
PascalCase
```

### Constants

Cuando representen constantes globales reales:

```ts
UPPER_SNAKE_CASE
```

No todas las variables `const` deben utilizar mayúsculas.

---

## 54. File naming

Los componentes utilizarán nombres claros.

Ejemplo:

```text
SofiAvatar/
├── SofiAvatar.tsx
├── SofiAvatar.module.scss
└── SofiAvatar.test.tsx
```

Hooks:

```text
useTheme.ts
usePartnerProfile.ts
```

Utilities:

```text
calculateConfidence.ts
```

Schemas:

```text
analysisSchema.ts
```

---

## 55. Code comments

Los comentarios de código se escribirán en español.

Deben explicar principalmente:

> **por qué**

y no:

> **qué**

Evitar:

```ts
// Incrementamos el índice.
index++;
```

Preferir cuando exista una razón no evidente:

```ts
// Conservamos la versión en la clave para invalidar
// resultados generados con un análisis anterior.
```

Código suficientemente claro no necesita comentarios adicionales.

---

## 56. Documentation language

La convención será:

```text
Code                  → English
Identifiers           → English
Types                 → English
Technical filenames   → English
Branches              → English
Commits               → English
Code comments         → Spanish
Specifications        → Spanish
Initial UI            → Spanish
```

README podrá utilizar inglés o una combinación ES/EN en función de la estrategia open source que se defina posteriormente.

---

## Commit convention

Ask Sofi utilizará **Conventional Commits**.

Formato:

```text
type(scope): description
```

El `scope` será opcional y se utilizará cuando ayude a identificar claramente el área afectada.

Tipos principales:

```text
feat      → nueva funcionalidad
fix       → corrección de un bug
docs      → documentación
test      → tests
refactor  → cambio interno sin modificar comportamiento
perf      → mejora de rendimiento
style     → cambios de formato sin impacto funcional
build     → build system o dependencias
ci        → integración continua
chore     → mantenimiento que no encaja en categorías anteriores
```

Ejemplos:

```text
feat(analysis): add probabilistic interpretation domain
fix(storage): handle invalid persisted profile
docs: define project constitution
test(api): add rate limit scenarios
refactor(profile): simplify communication preferences mapping
perf(media): lazy load Sofi animations
ci: add pull request checks
```

Las descripciones deberán:

- escribirse en inglés;
- ser breves y específicas;
- comenzar en minúscula;
- utilizar forma imperativa;
- no terminar en punto.

Se preferirán commits pequeños y coherentes frente a commits grandes que mezclen cambios no relacionados.

Cada commit debería representar una unidad de trabajo comprensible.

## 57. Suggested source structure

La estructura evolucionará durante el proyecto, pero la dirección inicial será:

```text
src/
├── app/
│   ├── router/
│   └── providers/
│
├── components/
│   ├── ui/
│   └── layout/
│
├── features/
│   ├── analysis/
│   ├── partner-profile/
│   ├── history/
│   ├── favorites/
│   ├── insights/
│   └── settings/
│
├── domain/
│   └── analysis/
│
├── infrastructure/
│   ├── ai/
│   ├── storage/
│   └── security/
│
├── hooks/
│
├── styles/
│   ├── tokens/
│   ├── globals/
│   └── utilities/
│
├── assets/
│   └── sofi/
│
└── main.tsx
```

No es necesario crear todas estas carpetas antes de utilizarlas.

> **No empty architecture.**

Una carpeta aparece cuando existe código que pertenece a ella.

---

## 58. Feature organization

Las funcionalidades suficientemente grandes podrán agrupar internamente:

```text
components/
hooks/
schemas/
services/
types/
```

sólo cuando los necesiten.

No todas las features tienen que contener la misma estructura.

Se evitarán carpetas vacías creadas simplemente para mantener simetría.

---

## 59. Dependency direction

La dirección ideal será:

```text
UI
 ↓
application / domain
 ↓
contracts
infrastructure
 ↓
implements contracts
```

El dominio no deberá importar:

```text
React
Vercel
Jev SDK
MCP SDK
browser storage
```

Esto facilita:

- testing;
- portabilidad;
- reutilización;
- comprensión.

---

## 60. Error handling

Los errores se dividirán conceptualmente entre:

```text
validation errors
rate limit errors
external provider errors
network errors
unexpected errors
```

El usuario debe recibir mensajes comprensibles.

No se mostrarán:

- stack traces;
- nombres de secretos;
- respuestas internas del proveedor;
- detalles innecesarios de infraestructura.

---

## 61. Privacy-safe logging

No deberán registrarse deliberadamente:

```text
partner messages
current conversation context
relationship profile free text
API keys
security tokens
```

Los logs deberán centrarse en información operacional como:

```text
request status
error type
duration
provider availability
```

sin conservar contenido privado.

---

## 62. Environment variables

Los secretos vivirán exclusivamente en variables server-side.

Se distinguirán explícitamente:

```text
public environment variables
server-only secrets
```

Una variable que contenga una credencial privada nunca deberá utilizar prefijos que permitan exponerla al bundle del cliente.

Se proporcionará:

```text
.env.example
```

sin valores reales.

---

## 63. Security boundaries

Se considerarán datos no confiables:

```text
form input
localStorage
sessionStorage
URL parameters
API responses
MCP inputs
external provider output
```

Todos deberán validarse en el límite correspondiente.

---

## 64. Dependency policy

Antes de instalar una dependencia se deberá responder:

1. ¿Qué problema resuelve?
2. ¿Podemos resolverlo claramente con la plataforma?
3. ¿Está mantenida?
4. ¿Aumenta significativamente el bundle?
5. ¿Introduce vendor lock-in?
6. ¿Añade complejidad que tendremos que explicar?
7. ¿Es realmente necesaria?

No se medirá la calidad del proyecto por el número de librerías utilizadas.

---

## 65. Progressive enhancement

Cuando sea posible se partirá de capacidades web nativas.

Ejemplos:

```text
HTML forms
CSS Grid
Flexbox
CSS variables
native buttons
native dialogs when appropriate
localStorage
sessionStorage
media queries
prefers-* queries
```

Una biblioteca debe mejorar claramente la solución antes de introducirla.

---

## 66. Browser strategy

Ask Sofi estará orientado a navegadores modernos con soporte razonable de:

```text
ES modules
CSS Grid
Flexbox
CSS custom properties
modern viewport units
localStorage
sessionStorage
```

No se añadirá complejidad significativa para navegadores obsoletos.

Cuando una capacidad moderna pueda fallar de forma segura, se aplicará progressive enhancement.

---

## 67. No database

Ask Sofi v1 no utilizará:

```text
PostgreSQL
Supabase
Firebase
MongoDB
SQLite remote storage
```

La ausencia de una base de datos es una decisión de arquitectura, no una limitación pendiente.

Actualmente no existe ningún requisito que justifique almacenar remotamente datos personales del usuario.

---

## 68. No authentication

La aplicación web pública no requerirá:

```text
login
account
password
OAuth user session
```

Esto reduce:

- fricción;
- almacenamiento;
- superficie de seguridad;
- infraestructura;
- tratamiento de datos personales.

La futura autenticación del MCP remoto, si llega a existir, constituye un problema separado.

---

## 69. Cost requirement

El coste esperado del proyecto será:

```text
0 €
```

Esto afecta directamente a las decisiones técnicas.

Antes de añadir un servicio deberá comprobarse:

- free tier;
- límites;
- comportamiento al agotarlo;
- posibilidad de generar cargos;
- alternativas.

Cuando exista conflicto entre:

```text
service availability
vs
unexpected spending
```

se priorizará evitar gasto.

---

## 70. Definition of Done técnica

Una feature no estará terminada únicamente porque “funcione en mi pantalla”.

Cuando corresponda deberá verificar:

```text
✓ Specification satisfied
✓ TypeScript passes
✓ Lint passes
✓ Tests pass
✓ Keyboard works
✓ Focus is correct
✓ Light mode works
✓ Dark mode works
✓ System theme works
✓ Narrow mobile works
✓ Mobile landscape works
✓ Tablet-like width works
✓ Desktop works
✓ Large desktop works
✓ No unexpected horizontal overflow
✓ Reduced motion works
✓ Error state exists
✓ Loading state exists
✓ Empty state exists
✓ Privacy implications reviewed
✓ Security implications reviewed
```

No todos los puntos aplicarán a todas las features.

Los que apliquen no deberán dejarse para una futura fase de “polish”.

---

## 71. Responsive principle

La regla final para cualquier componente visual será:

> **The interface adapts to the space. The user should not have to adapt to the interface.**

Ask Sofi no tendrá una versión móvil y una versión desktop independientes.

Tendrá **un único sistema responsive** capaz de reorganizarse naturalmente desde una pantalla pequeña en vertical hasta un monitor grande.

Los breakpoints serán excepciones necesarias.

El layout fluido será la norma.
