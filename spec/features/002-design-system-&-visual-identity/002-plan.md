# 002 — Design System & Visual Identity — Plan

## Status

Complete

## Approach

El sistema de diseño se construirá progresivamente, reutilizando los componentes reales en el Design Lab y en la aplicación.

Orden previsto:

```text
design tokens
    ↓
themes & typography
    ↓
UI components
    ↓
Sofi components
    ↓
SofiSpeech & audio
    ↓
landing
    ↓
Design Lab
    ↓
Experience Preview
    ↓
verification
```

## Approved design

La referencia visual definitiva es la dirección C «Exclusiva», aprobada el 2026-10-10 en el lienzo [Ask Sofi — Direcciones artísticas](https://claude.ai/artifact/1kZ5Cu2ZSQhM94Dqy6ueKB), versión 33:

- la página «Design Lab · C Exclusiva» recorre Foundations, UI Components, Sofi Components, Motion & Sound y Experience Preview;
- la página «Direcciones artísticas» contiene las pantallas C de escritorio y móvil.

Copias locales de ambas páginas y el logotipo original: `spec/constitution/art-direction/`.

Si ambas páginas difieren, prevalecerá el Design Lab, que incorpora los ajustes aprobados después de las pantallas: el selector de tema compacto con System, el tamaño del logotipo de portada, el antetítulo «En directo» solo en pantallas anchas, los botones de 44 px en los selectores y el enlace para saltar al contenido.

El prototipo es una referencia visual y de comportamiento: su código no se trasladará a la aplicación, que seguirá `tech-stack.md`, y lo que marca como provisional no es definitivo. Si contradice este plan, prevalecerá el plan, como en el comportamiento del sonido con movimiento reducido o en la simulación de tamaños del Design Lab.

La implementación y su audio real han sido verificados manualmente contra este prototipo.

## Visual foundations

Los valores visuales se tomarán del diseño aprobado, que concreta la identidad establecida en `roadmap.md`.

Los tokens se organizarán mediante CSS Custom Properties y los estilos de componentes mediante CSS Modules.

Se definirán únicamente los tokens necesarios para los componentes existentes, ampliándolos conforme aparezcan nuevas necesidades.

La paleta incorpora un color semántico de error, cereza, reservado a los errores y acompañado siempre de icono y texto.

## Units

Los estilos seguirán `tech-stack.md` («CSS units & styling conventions») sin repetirlo aquí. Decisiones propias de esta feature:

- Los valores del diseño aprobado no cambian: a tamaño de texto por defecto, `1 rem` equivale a `16 px` y la implementación se ve exactamente igual. Cambia que ahora crecen con el texto del usuario.
- Se conservan en `px` los bordes, anillos y sombras duras, los iconos de píxel, las cuadrículas de puntos y celdas y todo lo medido sobre el spritesheet.
- Los umbrales se siguen documentando en `px` (`760`, `960`, `1080`), pero las media queries los emiten en `em` para que respondan al tamaño de texto.
- Una prueba de contrato impide reintroducir `px` en tipografía, espaciado y dimensiones.
- Los objetivos táctiles miden 44 CSS px como mínimo (`min-height` / `min-width` en `px`) y crecen con el contenido; la excepción está documentada en `tech-stack.md`.
- `--color-border` es un alias semántico de `--color-text`, declarado en cada tema, que usan los contornos de estructura. El contorno de las pegatinas sigue siendo tinta fija.
- Con el texto agrandado, el contenido se recoloca en lugar de recortarse: los textos de una sola línea (botones, insignias) y la cabecera pasan a varias líneas cuando la pantalla mide menos de `19,99 em` (319,84 px a tamaño por defecto, por debajo del mínimo soportado) y una palabra se parte antes que ensanchar la página.

## Themes

Se utilizarán tokens semánticos con valores diferenciados para Light y Dark.

El modo System responderá a `prefers-color-scheme`, mientras que una selección explícita tendrá prioridad.

La preferencia de tema se conservará mediante un adaptador mínimo, sin anticipar la infraestructura general de persistencia de la feature `003`.

## UI Components

Los componentes compartidos se desarrollarán de forma independiente del playground.

Se priorizarán:

- acciones y botones;
- campos de texto y controles de selección;
- elementos de navegación;
- etiquetas e indicadores;
- feedback, loading y estados vacíos;
- overlays únicamente cuando exista un caso de uso.

Las variantes se definirán según necesidades reales, evitando crear una biblioteca de componentes genéricos innecesariamente extensa.

## Sofi Components

Se crearán componentes de presentación reutilizables para:

- introducción del mensaje recibido;
- contexto adicional;
- estados de procesamiento;
- interpretaciones;
- visualización de confianza e incertidumbre;
- feedback y contexto insuficiente.

Los componentes recibirán datos de presentación independientes del proveedor de análisis.

Los ejemplos utilizarán fixtures locales, sin implementar contratos definitivos del dominio.

La interpretación destacada tendrá una variante «Reñido» para cuando las dos primeras estén igualadas. El componente la recibirá como dato de presentación: su umbral no se fijará en 002, sino con el dominio y las evaluaciones (fases 005 y 012 de `roadmap.md`).

El aviso de carga lenta del estado de procesamiento y su umbral de 6 s son provisionales; se revisarán cuando existan latencias reales.

## SofiSpeech

`SofiSpeech` separará el contenido textual de su presentación progresiva.

El comportamiento de escritura utilizará una secuencia temporizada que permita:

- revelar texto progresivamente;
- completar inmediatamente la respuesta;
- cancelar correctamente la animación al cambiar de contenido o desmontar el componente.

La velocidad y las pausas podrán ajustarse desde Motion & Sound durante desarrollo, sin convertirlas necesariamente en preferencias públicas.

El texto completo permanecerá disponible para tecnologías de asistencia sin anunciar cada carácter individualmente.

Con movimiento reducido, el contenido aparecerá directamente.

## Sofi animation integration

SofiSpeech expondrá el estado necesario para sincronizar la escritura y el sonido con las futuras animaciones del personaje, sin acoplarse directamente a sus assets.
Se contempla el uso de spritesheets para las animaciones pixel art de Sofi. Su formato definitivo, reproducción y gestión de estados se desarrollarán en 008 — Sofi Character & Motion.
Durante 002, podemos utilizar de manera provisional el primer spritesheet que tenemos listo, que se encuentra en `src\styles\sprites`

Hasta 008, las expresiones sin sprite propio reutilizarán fotogramas del spritesheet actual: «pensando» y «poco convencida», el de ojos entrecerrados, y «ups», el de ojos cerrados. «Hablando» se mostrará como un marcador provisional identificado.

## Performance

Los componentes animados deberán minimizar renders innecesarios, temporizadores activos y desplazamientos del layout.
SofiSpeech mantendrá las actualizaciones de escritura aisladas del resto de la interfaz. El audio se reutilizará durante la reproducción, evitando cargas o instancias innecesarias.
Los recursos visuales y sonoros se cargarán cuando sean necesarios, siguiendo las directrices de rendimiento de `tech-stack.md`.

## Audio

El sonido utilizará el asset proporcionado para Sofi, que se sirve desde `src/assets/sofi/talking-sound.mp3`.

Se implementará un controlador pequeño y reutilizable, separado de la lógica del typewriter.

La reproducción:

- se habilitará desde la interacción de entrada cuando el usuario haya elegido sonido;
- utilizará fragmentos breves sincronizados con la aparición del texto;
- evitará reproducciones superpuestas;
- podrá silenciarse o interrumpirse inmediatamente;
- no bloqueará el texto si el audio falla o es rechazado por el navegador.

No se asumirá que una interacción inicial garantiza permiso permanente de reproducción.

La preferencia inicial de sonido será silenciosa. Su persistencia definitiva pertenecerá a `003`.

El sonido y el movimiento reducido serán preferencias independientes. Con movimiento reducido, el texto aparecerá completo y, si el sonido está activado, lo acompañará un único fragmento breve.

## Landing

La landing será un componente real de la aplicación, independiente del Design Lab.

Incluirá la composición editorial de bienvenida, presentación visual de Sofi y una acción principal «Empezar».

El usuario podrá elegir activar el sonido antes de entrar.

Al pulsar «Empezar», se realizará directamente la preparación necesaria del audio dentro de esa interacción, cuando corresponda.

La landing dará acceso a la interfaz principal, sin depender de que el análisis real esté implementado.

Mientras no exista el análisis, enviar un mensaje válido solo muestra un aviso de demostración: Sofi «todavía está calentando motores» y el mensaje no se ha enviado ni analizado.

## Design Lab

Se creará un entorno de desarrollo organizado en:

```text
Foundations
UI Components
Sofi Components
Motion & Sound
Experience Preview
```

El laboratorio utilizará los mismos componentes y estilos que la aplicación.

Cada sección mostrará ejemplos interactivos y estados relevantes.

Cada componente exportado por la biblioteca tendrá al menos un ejemplo individual con sus variantes y estados, y los que reciben props tendrán un panel que las explora sobre el componente real. Una prueba de contrato impide dejar un componente sin ejemplo.

Se incorporarán controles para probar temas, tamaños de visualización y escenarios.

La Experience Preview se mostrará en un iframe del tamaño elegido, para que el layout responda a sus media queries reales; los componentes aislados se probarán en contenedores de ancho variable.

El Design Lab se cargará únicamente en desarrollo, evitando incluir su código y fixtures de demostración en el bundle público.

No se introducirá una dependencia de documentación de componentes ni un sistema de routing completo únicamente para esta herramienta.

## Experience Preview

Se compondrá un recorrido visual con los componentes reales:

```text
landing
    ↓
message & context
    ↓
processing
    ↓
SofiSpeech
    ↓
interpretations & confidence
```

Los escenarios se controlarán mediante estado local y fixtures deterministas.

Se incluirán variantes de éxito, contexto insuficiente, carga y error.

La simulación permanecerá identificada como demo y no realizará peticiones reales.

La presentación de los resultados no dependerá de que el usuario complete la animación del texto.

## Verification

Se implementarán pruebas de comportamiento específicas para:

- cambio de tema y prioridad de preferencias;
- navegación desde la landing;
- elección inicial de sonido;
- reproducción bloqueada o no disponible;
- progresión, cancelación y revelado completo de `SofiSpeech`;
- movimiento reducido y exposición accesible del texto;
- independencia entre sonido y movimiento reducido;
- reutilización de los componentes en la preview;
- selección de escenarios simulados;
- exclusión del Design Lab del build público.

Se revisará visualmente la composición editorial y sus variaciones de layout frente al diseño aprobado.

La reproducción real del sonido se comprobará manualmente en navegador, ya que las pruebas automáticas no la cubren.

Las comprobaciones automáticas y manuales de accesibilidad seguirán los criterios globales correspondientes.

La verificación final contrastará la implementación con `002-spec.md`.

## References

Requisitos de esta feature:

- `002-spec.md`

Decisiones globales:

- `spec/constitution/mission.md`
- `spec/constitution/roadmap.md`
- `spec/constitution/tech-stack.md`

Reglas para agentes:

- `AGENTS.md`