# Ask Sofi — Roadmap

## 1. Propósito del roadmap

Este documento define la evolución prevista de **Ask Sofi — Relationship Intelligence Agency**.

El roadmap establece:

- qué capacidades forman parte del producto;
- en qué orden deberían desarrollarse;
- qué funcionalidades pertenecen a la primera versión pública;
- qué mejoras se reservan para iteraciones posteriores;
- qué decisiones se posponen deliberadamente para evitar complejidad innecesaria.

Este documento describe **qué construiremos y cuándo**.

Las decisiones técnicas concretas pertenecen a `tech-stack.md`.

Los requisitos detallados de cada funcionalidad pertenecen a su correspondiente carpeta dentro de `spec/features/`.

---

# 2. Estrategia general

Ask Sofi se desarrollará de forma incremental.

Cada fase debe dejar el proyecto en un estado funcional y verificable antes de comenzar la siguiente.

El orden general será:

```text
Foundation
    ↓
Design system
    ↓
Local persistence
    ↓
Partner profile
    ↓
Analysis domain
    ↓
Jev integration
    ↓
Ask Sofi experience
    ↓
Evaluation
    ↓
Security
    ↓
MCP
    ↓
Polish & accessibility
    ↓
Public release
```

No se implementarán varias features grandes simultáneamente salvo que exista una dependencia clara entre ellas.

---

# 3. Definition of v1

La primera versión pública de Ask Sofi debe permitir que una persona:

1. entre en la aplicación sin registrarse;
2. configure opcionalmente cómo suele comunicarse su pareja;
3. escriba un mensaje recibido;
4. añada contexto sobre la situación;
5. reciba varias interpretaciones probabilísticas;
6. entienda claramente que esas interpretaciones no son certezas;
7. pueda aportar más contexto cuando el sistema no tenga suficiente información;
8. guarde preferencias y datos localmente;
9. consulte y gestione su historial si decide activarlo;
10. guarde análisis favoritos;
11. consulte estadísticas básicas sobre sus análisis;
12. pueda borrar los datos que Ask Sofi recuerda;
13. utilice la aplicación mediante teclado, lector de pantalla o movimiento reducido;
14. elija entre tema claro, oscuro o el tema del sistema;
15. disfrute de una experiencia visual y narrativa protagonizada por Sofi;
16. pueda consultar públicamente el código y contribuir al proyecto.

La v1 debe poder utilizarse sin coste económico para la autora del proyecto.

---

# 4. Phase 001 — Project Foundation

**Objetivo:** establecer una base pequeña, consistente y verificable antes de desarrollar funcionalidades.

Feature prevista:

```text
spec/features/001-project-foundation/
```

Incluye:

- inicialización del proyecto;
- estructura base de carpetas;
- configuración de TypeScript;
- linting;
- formatting;
- testing;
- scripts de desarrollo;
- variables de entorno;
- estructura inicial de CI;
- documentación mínima del repositorio;
- `AGENTS.md`;
- convenciones de nombres;
- estrategia básica de branches y commits.

También debe quedar fijada la convención lingüística del proyecto:

### Código

En inglés:

- variables;
- funciones;
- componentes;
- tipos;
- interfaces;
- nombres de archivo;
- nombres de carpetas técnicas;
- branches;
- commits.

### Comentarios

Los comentarios de código se escribirán en español y deberán explicar decisiones o motivos relevantes, no traducir literalmente lo que hace el código.

### Especificaciones

Los documentos de `/spec` se escribirán principalmente en español.

### Interfaz

El idioma inicial del producto será español.

La arquitectura no debe impedir una futura internacionalización, pero **i18n completo no forma parte de la v1**.

---

# 5. Phase 002 — Design System & Visual Identity

**Objetivo:** establecer la identidad visual de Ask Sofi antes de construir pantallas completas.

Feature prevista:

```text
spec/features/002-design-system/
```

Dirección visual inicial:

> **Fashion editorial + Y2K + gossip magazine + dark feminine**

Referencias conceptuales:

- revistas editoriales de moda;
- consultorio sentimental;
- dossier de investigación;
- pequeñas influencias Y2K;
- estética sofisticada y descarada;
- interfaces editoriales antes que interfaces SaaS genéricas.

Debe evitar:

- estética kawaii como lenguaje visual principal;
- apariencia infantil;
- exceso de tarjetas redondeadas;
- estética genérica de producto de IA;
- dependencia excesiva de gradientes morados;
- diseño que sacrifique legibilidad por estilo.

El sistema de diseño debe definir:

- typography;
- spacing;
- borders;
- radii;
- shadows;
- layout;
- breakpoints;
- focus states;
- motion;
- semantic colors;
- confidence visualization;
- form controls;
- feedback states.

## Theme preferences

La aplicación debe soportar desde la v1:

```text
Light
Dark
System
```

El valor inicial será:

```text
System
```

La elección del usuario debe persistir localmente.

El diseño no debe considerar el dark mode como una simple inversión automática de colores. Ambos temas deben diseñarse intencionadamente y mantener:

- jerarquía visual;
- contraste;
- legibilidad;
- identidad editorial;
- accesibilidad.

---

# 6. Phase 003 — Local Persistence

**Objetivo:** crear una capa de persistencia local antes de que las features empiecen a depender directamente del almacenamiento del navegador.

Feature prevista:

```text
spec/features/003-local-persistence/
```

Ask Sofi seguirá un enfoque **local-first**.

## sessionStorage

Se utilizará para información temporal como:

- borrador actual;
- contexto actual;
- último análisis;
- estado de la sesión;
- caché temporal de resultados.

Esta información puede desaparecer cuando finaliza la sesión.

## localStorage

Se utilizará para información que el usuario decida conservar:

- preferencias;
- theme;
- onboarding completado;
- preferencias de animación;
- historial;
- favoritos;
- perfil de comunicación de la pareja;
- estadísticas derivadas;
- configuración relacionada con privacidad.

El acceso al almacenamiento debe centralizarse detrás de una capa propia.

Los componentes no deben acceder arbitrariamente a `localStorage` o `sessionStorage`.

## Storage versioning

Los datos persistidos deberán incluir una versión que permita:

- detectar estructuras antiguas;
- migrar información;
- invalidar datos incompatibles;
- evitar errores después de cambios importantes.

---

# 7. Phase 004 — Partner Profile & Onboarding

**Objetivo:** permitir que Sofi conozca tendencias generales de comunicación sin convertirlas en verdades absolutas.

Feature prevista:

```text
spec/features/004-partner-profile/
```

El onboarding debe ser opcional.

Primera experiencia aproximada:

```text
Want better reads?

Tell Sofi how your partner usually communicates.

[ Build her profile ]
[ I'll do it later ]
```

El perfil debe centrarse en comportamientos observables.

Posibles áreas:

- directness;
- sarcasm;
- communication during conflict;
- preference for space;
- preference for reassurance;
- initiative;
- tendency to minimize problems;
- communication confidence;
- relationship stage;
- optional additional notes.

Siempre debe existir una respuesta equivalente a:

```text
I don't know
It depends
```

cuando sea necesario.

El usuario podrá:

- crear el perfil;
- consultarlo;
- editarlo;
- eliminarlo.

El perfil se almacena exclusivamente en el dispositivo.

La aplicación deberá indicar que, cuando ese perfil se utilice para realizar un análisis, la información relevante será enviada temporalmente para su procesamiento.

---

# 8. Phase 005 — Analysis Domain

**Objetivo:** construir la lógica central de Ask Sofi sin depender todavía de una interfaz concreta o de un proveedor específico.

Feature prevista:

```text
spec/features/005-analysis-domain/
```

El dominio deberá poder representar conceptos como:

- message;
- current context;
- partner profile;
- interpretations;
- probabilities;
- confidence;
- tone;
- indirectness;
- emotional needs;
- context sufficiency;
- analysis result.

El sistema debe admitir varias interpretaciones simultáneas.

Posibles categorías iniciales:

```text
literal_permission
needs_reassurance
wants_initiative
wants_space
expressing_disappointment
setting_boundary
playful_teasing
unclear
insufficient_context
```

La lista definitiva se establecerá durante la specification de la feature.

El dominio debe permitir que el resultado sea:

```text
insufficient context
```

sin tratarlo como un error.

---

# 9. Phase 006 — Jev Integration

**Objetivo:** conectar el dominio de Ask Sofi con un motor probabilístico sin acoplar toda la aplicación a un proveedor concreto.

Feature prevista:

```text
spec/features/006-jev-integration/
```

La integración deberá analizar información mediante varias decisiones estructuradas en lugar de depender de una única pregunta genérica.

Ejemplo conceptual:

```text
message
+
current context
+
partner profile
        ↓
context sufficiency
tone
literalness
sarcasm
likely need
possible interpretation
        ↓
analysis result
```

El perfil debe considerarse una tendencia secundaria.

La evidencia actual debe tener prioridad.

```text
Current evidence
      >
Profile tendencies
```

Los resultados externos deberán transformarse al modelo propio del dominio antes de llegar a la interfaz.

Ask Sofi debe poder sustituir el proveedor de decisiones en el futuro sin reescribir la lógica principal.

---

# 10. Phase 007 — Ask Sofi Chat Experience

**Objetivo:** construir la experiencia principal de consulta.

Feature prevista:

```text
spec/features/007-ask-sofi-chat/
```

La interfaz inicial tendrá apariencia conversacional, pero no necesitará funcionar todavía como una conversación multi-turn completa.

Flujo principal:

```text
message
   +
optional current context
   ↓
analyse
   ↓
Sofi processing state
   ↓
interpretations
   ↓
optional follow-up context
```

El usuario podrá:

- introducir un mensaje;
- añadir contexto;
- editar ambos;
- solicitar análisis;
- recibir varias interpretaciones;
- consultar probabilidades;
- entender el nivel de incertidumbre;
- aportar más información si el contexto resulta insuficiente.

Los resultados deben diferenciar claramente:

```text
model probability
≠
objective truth
```

---

# 11. Phase 008 — Sofi Character & Motion

**Objetivo:** convertir a Sofi en una parte reconocible de la experiencia.

Feature prevista:

```text
spec/features/008-sofi-character/
```

Se utilizará una ilustración propia de Sofi como personaje principal.

Estados iniciales posibles:

```text
idle
listening
thinking
reading
suspicious
eureka
error
```

Durante una espera real pueden aparecer pequeños mensajes como:

```text
Sofi is reading between the lines...
Sofi is investigating...
Sofi is judging...
Sofi found something...
```

Las animaciones:

- no deben retrasar artificialmente el análisis;
- sólo aparecerán cuando exista espera real;
- deberán tener alternativa estática;
- deberán respetar `prefers-reduced-motion`;
- nunca serán necesarias para comprender información importante.

La interfaz podrá retrasar ligeramente la aparición visual del loader para evitar flashes cuando las respuestas sean extremadamente rápidas.

---

# 12. Phase 009 — History, Saved Analyses & Favorites

**Objetivo:** permitir que el usuario saque partido de la persistencia local.

Feature prevista:

```text
spec/features/009-personal-library/
```

El historial persistente deberá ser **opt-in**.

El usuario podrá:

- activar o desactivar historial;
- consultar análisis anteriores;
- eliminar análisis concretos;
- borrar todo el historial;
- guardar favoritos;
- quitar favoritos;
- reutilizar contexto cuando tenga sentido.

No se almacenarán conversaciones remotamente.

La interfaz deberá mostrar claramente que estos datos pertenecen al dispositivo actual.

---

# 13. Phase 010 — Personal Insights & Drama Report

**Objetivo:** aprovechar únicamente los datos locales para generar valor adicional.

Feature prevista:

```text
spec/features/010-personal-insights/
```

Ask Sofi podrá calcular estadísticas como:

- number of analyses;
- most common interpretation;
- most frequent confidence range;
- recurring communication patterns;
- saved analyses;
- favorite categories.

Podrá existir una experiencia visual tipo:

> **Your Drama Report**

o equivalente dentro del tono editorial del producto.

Todas las estadísticas se calcularán localmente.

No se enviarán datos históricos completos a ningún servidor únicamente para generar estadísticas.

## Shareable reports

Una evolución de esta feature podrá generar tarjetas compartibles.

Por privacidad:

- no incluirán mensajes privados por defecto;
- deberán mostrar únicamente estadísticas explícitamente seleccionadas por el usuario;
- la generación podrá realizarse en el propio navegador.

---

# 14. Phase 011 — Evaluation System

**Objetivo:** comprobar empíricamente el comportamiento del análisis probabilístico dentro del dominio concreto de Ask Sofi.

Feature prevista:

```text
spec/features/011-evaluation-system/
```

Se creará:

```text
evals/
├── fixtures/
├── runner/
└── reports/
```

El conjunto de evaluación deberá contener escenarios como:

- literal communication;
- sarcasm;
- reassurance;
- disappointment;
- boundaries;
- need for space;
- indirect requests;
- ambiguous messages;
- insufficient context;
- misleading partner profiles.

Se comparará, cuando resulte útil:

```text
message only

vs

message + current context

vs

message + current context + partner profile
```

Las métricas pueden incluir:

- accuracy;
- Brier score;
- calibration;
- confusion matrix;
- abstention behavior.

Los resultados servirán para decidir:

- umbrales de confianza;
- cuándo pedir contexto;
- qué categorías funcionan mal;
- qué información mejora realmente los análisis.

Las cifras de evaluación nunca deberán inventarse para documentación o marketing.

---

# 15. Phase 012 — Reliability & Abstention

**Objetivo:** utilizar los resultados de evaluación para decidir cuándo Sofi debe evitar una conclusión.

Feature prevista:

```text
spec/features/012-analysis-reliability/
```

El sistema podrá pedir más información cuando:

- la confianza sea demasiado baja;
- las interpretaciones principales estén demasiado igualadas;
- el contexto sea insuficiente;
- existan señales contradictorias.

Los umbrales no se fijarán arbitrariamente durante el diseño inicial.

Deberán basarse, siempre que sea posible, en los resultados obtenidos mediante las evaluaciones.

---

# 16. Phase 013 — Security & Abuse Prevention

**Objetivo:** proteger los recursos públicos antes del lanzamiento.

Feature prevista:

```text
spec/features/013-security/
```

Se contemplarán:

- server-side rate limiting;
- bot protection;
- input validation;
- request size limits;
- duplicate request protection;
- safe error handling;
- secret management;
- privacy-safe logging;
- external service exhaustion;
- malformed input;
- automated abuse.

Los límites concretos deberán definirse y ajustarse durante la implementación.

El navegador nunca será la fuente de verdad para controles de seguridad.

---

# 17. Phase 014 — MCP Server

**Objetivo:** exponer las capacidades centrales de Ask Sofi mediante Model Context Protocol.

Feature prevista:

```text
spec/features/014-mcp-server/
```

La primera versión del MCP será:

> **local / self-hosted**

El usuario utilizará sus propias credenciales para los servicios externos necesarios.

El MCP deberá reutilizar la misma lógica de dominio utilizada por la aplicación web.

No se duplicará la lógica de interpretación.

Conceptualmente:

```text
Web UI ─────────┐
                ├── interpretMessage()
MCP ────────────┘
```

El MCP podrá comenzar con una herramienta similar a:

```text
interpret_partner_message
```

La publicación de un MCP remoto compartiendo recursos de Ask Sofi **no forma parte de la v1 inicial**.

---

# 18. Phase 015 — Accessibility & UX Verification

**Objetivo:** realizar una revisión transversal antes de considerar la aplicación lista para lanzamiento.

Feature prevista:

```text
spec/features/015-accessibility-verification/
```

Aunque la accesibilidad debe desarrollarse desde cada feature, esta fase verificará de forma completa:

- keyboard navigation;
- focus order;
- screen reader behavior;
- forms;
- validation errors;
- semantic structure;
- color contrast;
- light mode;
- dark mode;
- system theme;
- reduced motion;
- responsive layout;
- zoom;
- reflow;
- loading announcements;
- result announcements.

Objetivo:

> **WCAG 2.2 AA**

Los tests automáticos complementarán, pero no sustituirán, las pruebas manuales.

---

# 19. Phase 016 — Open Source Readiness

**Objetivo:** preparar el repositorio para recibir contribuciones reales.

Feature prevista:

```text
spec/features/016-open-source-readiness/
```

El repositorio deberá incluir progresivamente:

```text
README.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE
AGENTS.md
```

También:

- issue templates;
- pull request template;
- contribution workflow;
- development instructions;
- architecture overview;
- testing instructions;
- accessibility expectations.

Etiquetas recomendadas:

```text
good first issue
help wanted
frontend
mcp
a11y
testing
design
documentation
security
```

La documentación debe facilitar que alguien contribuya sin tener que leer todo el proyecto.

---

# 20. Phase 017 — Public Deployment

**Objetivo:** publicar Ask Sofi y permitir que pueda compartirse fácilmente.

Feature prevista:

```text
spec/features/017-public-deployment/
```

El deployment inicial tendrá un único proveedor principal.

La aplicación debe permanecer suficientemente desacoplada para que una futura migración sea viable.

El deployment deberá incluir:

- production environment;
- environment variables;
- public URL;
- error handling;
- monitoring mínimo;
- protection limits;
- deployment documentation;
- CI checks before release.

El coste operativo previsto continuará siendo:

> **0 €**

Si los recursos gratuitos se agotan, el sistema deberá degradarse antes que generar gastos inesperados.

---

# 21. V1 Release

La v1 se considerará lista cuando incluya:

### Core

- Ask Sofi message analysis;
- current conversational context;
- multiple probabilistic interpretations;
- insufficient-context handling;
- partner communication profile.

### Personalization

- light mode;
- dark mode;
- system theme;
- animation preferences;
- local profile;
- local preferences.

### Local data

- draft persistence;
- temporary result caching;
- optional history;
- favorites;
- saved analyses;
- personal statistics;
- delete remembered data.

### Experience

- Sofi character;
- responsive interface;
- editorial visual identity;
- meaningful loading states;
- reduced-motion support.

### Reliability

- domain-specific evaluation dataset;
- calibration analysis;
- abstention strategy;
- clear uncertainty communication.

### Engineering

- automated tests;
- accessibility checks;
- abuse protection;
- CI;
- documented architecture;
- open-source contribution setup.

### Integrations

- public web application;
- local/self-hosted MCP server.

---

# 22. Post-v1 — Improvements

Después del lanzamiento inicial se podrán valorar mejoras únicamente si existe una razón real para introducirlas.

## Better contextual analysis

Explorar:

- mejores preguntas de contexto;
- evolución del partner profile;
- context-aware follow-up questions;
- diferentes analysis modes.

## Internationalization

Posible soporte para:

```text
Spanish
English
```

y posteriormente otros idiomas.

La internacionalización se abordará sólo cuando la experiencia inicial en español sea estable.

## Expanded Drama Report

Posibles mejoras:

- period comparisons;
- trends;
- richer visual reports;
- optional shareable cards;
- locally generated summaries.

## More Sofi states

Nuevas expresiones o pequeñas animaciones cuando aporten personalidad sin perjudicar rendimiento o accesibilidad.

---

# 23. Future Infrastructure — Cloud Portability

Ask Sofi no mantendrá dos infraestructuras activas únicamente como medida preventiva.

Sin embargo, el proyecto deberá evitar un acoplamiento innecesario al proveedor inicial.

Future milestone:

```text
Validate Cloudflare deployment
        ↓
Document migration
        ↓
Verify MCP compatibility
        ↓
Verify security controls
```

Cloudflare podrá evaluarse como:

- alternativa de hosting;
- estrategia de migración;
- posible fallback futuro.

No será un deployment secundario activo en la primera versión.

---

# 24. Future MCP — Remote Server

Un MCP remoto público podrá estudiarse después de la v1.

Antes de ofrecerlo deberán resolverse:

- authentication;
- authorization;
- quota ownership;
- rate limiting;
- abuse prevention;
- credential isolation;
- cost control.

Ask Sofi no financiará peticiones MCP anónimas e ilimitadas con credenciales propias.

---

# 25. Explicitly Not Planned

Actualmente no está previsto introducir:

- user accounts;
- login;
- remote user database;
- cloud conversation history;
- cross-device synchronization;
- social features;
- direct messaging;
- partner tracking;
- automatic ingestion of private conversations;
- WhatsApp scraping;
- invasive relationship monitoring;
- native mobile apps;
- microservices;
- Kubernetes;
- unnecessary infrastructure.

Estas exclusiones pueden revisarse únicamente cuando aparezca una necesidad real y documentada.

---

# 26. Scope Control

Durante el desarrollo aparecerán ideas nuevas.

No todas deben implementarse inmediatamente.

Una nueva propuesta deberá responder:

1. ¿Resuelve un problema real del usuario?
2. ¿Pertenece a la misión de Ask Sofi?
3. ¿Puede esperar hasta después de la v1?
4. ¿Añade dependencias o infraestructura?
5. ¿Tiene impacto en privacidad?
6. ¿Tiene impacto en accesibilidad?
7. ¿Tiene impacto en costes?
8. ¿Podemos evaluarla o probarla?
9. ¿Podrá mantenerse razonablemente?

Si una idea es interesante pero no necesaria, se añadirá al roadmap futuro en lugar de ampliar automáticamente el alcance de la v1.

---

# 27. Current Product Direction

La dirección actual de Ask Sofi puede resumirse como:

```text
small product
+
strong personality
+
probabilistic reasoning
+
real context
+
local-first privacy
+
measured reliability
+
accessible design
+
open-source engineering
```

El proyecto debe crecer en profundidad antes que en tamaño.

La meta no es conseguir muchas features.

La meta es conseguir que cada feature existente tenga una razón clara para estar ahí.