# 008 — Sofi Character & Motion

## Status

Approved — 2026-10-23

## Objective

Integrar los recursos animados de Sofi en la capa visual y coordinar su comportamiento con los estados reales de la interfaz: transiciones, prioridades, actividad, easter eggs, sonido y movimiento reducido. Una animación nunca decide un resultado ni es necesaria para entenderlo.

Fuentes que no se repiten aquí: significado, disparadores, interrupciones, retención del primer ciclo y versión reducida de cada animación en `spec/constitution/art-direction/sofi/animation-catalog.md` («catálogo»); integración de assets en `tech-stack.md` §46.1, movimiento, carga y assets en §44–46 y pruebas en §42; composición aprobada en `art-direction/README.md` y el Design Lab; procedencia en `art-direction/sofi/asset-provenance.md`; alcance en `roadmap.md` §11.

## Dependencies

- `002` (Design Lab, `SofiSpeech`, sonido), `003` (preferencias y borrado), `004` (estados de Sofi del expediente y registro de recursos visuales), `005` (estados del resultado).
- Emisores todavía pendientes, que conectarán con el contrato de esta feature: `007` (procesamiento, resultados, errores, seguridad y salida rápida), `009` (favorito guardado) y la feature que incorpore «Borrar todos mis datos», sin asignar.
- `006`: las reglas de `eureka`/`suspicious` y las latencias reales esperan su desbloqueo.
- Relacionada: `015` (verificación en dispositivos).

## Requirements

### 1. Recursos

- Los 14 recursos del catálogo §3 quedan integrados según `tech-stack.md` §46.1. Los 13 que llegan en ZIP definitivo (002–006 y 008–015) se integran desde esos ZIP, lo que actualiza `sofing` y `rolling`. `001` (`sofi-blink`) ya está integrado, no tiene ZIP en esta entrega y se conserva. El arte no se modifica (catálogo §9.12).
- Se versionan solo los recursos integrados. Los ZIP no se versionan: se conservan en `spec/features/007-ask-sofi-chat/` hasta verificar la integración y se retiran solo con aprobación expresa.
- Trazabilidad (`asset-provenance.md` §8): cada recurso original importado se verifica por contenido frente a su recurso fuente en el commit de origen; el código de integración propio de Ask Sofi no se compara con el repositorio artístico. El SHA-256 del ZIP solo se exige a los siete paquetes actualizados, cuyos hashes registra el cierre del informe de correcciones de spritesheets.
- Carga selectiva: cada pantalla descarga solo las tiras y los controladores que usa. Mientras un recurso no está disponible, o si falla, se ve su representación estática de reserva (catálogo §2.8).

### 2. Capa visual y contrato

- Las pantallas emiten una intención semántica; la capa visual elige el recurso según el catálogo §5–§6. El dominio no conoce animaciones (`tech-stack.md` §45). Hay un único registro de recursos visuales (catálogo §3; `004-plan.md` §6).
- Se extienden los componentes de Sofi existentes. Un componente nuevo solo se crea si hace falta, y entonces se muestra en el Design Lab con pruebas (`AGENTS.md`).
- Consumidores en esta feature:
  - expediente: `talking` se sincroniza con `SofiSpeech.speaking`, no con el estado `asking` (catálogo, ficha 004). En las pausas y al terminar se ve la representación de pausa aprobada en el Lab. `uncertain` usa el recurso 014. El resto de estados conserva sus estáticas aprobadas;
  - consulta en reposo: `sofi-blink`;
  - pantallas de resultado del Design Lab: los recursos del catálogo §5 sustituyen a los fotogramas provisionales.
- Para los eventos que la aplicación aún no emite (procesamiento real, resultados, errores, seguridad, salida rápida, favorito guardado y borrado total), esta feature define el contrato y lo prueba con simulaciones; conectarlo corresponde a la feature emisora.
- `eureka` y `suspicious` solo aparecen en el Design Lab hasta que `006` respalde sus reglas. En producción, un `interpreted` se representa en reposo.
- `memory-wipe` se reproduce en la vista de destino una vez completado el borrado total, sin retrasarlo, y nunca en la salida rápida (catálogo §4).

### 3. Prioridades y espera

- Se aplican la jerarquía, la matriz de interrupción, la coordinación de easter eggs y la retención del primer ciclo del catálogo §6.
- `sofing` (análisis) y `rolling` (carga de la app o de una vista) siguen sus fichas del catálogo, sin esperas artificiales. El retraso anti-destello del loader solo se añade si lo justifican mediciones con latencias reales (`roadmap.md` §11).

### 4. Actividad

- Una etiqueta contextual acompaña cada actividad real (p. ej. «sofing…», «cooking…»). Su copy se aprueba en el Design Lab.
- Un indicador reutilizable acompaña la etiqueta. Reproduce el patrón animado del indicador de trabajo de Claude Code (un glifo que cambia en ciclo), adaptado al pixel art y a la paleta de Sofi, sin logotipos ni elementos de marca. Antes de fijar símbolos y temporización se estudia el patrón de referencia; diseño y velocidad se aprueban en el Lab. Antes de crearlo se evalúa extender `Spinner` o `Loader`.
- Etiqueta e indicador siguen el estado real: al terminar la operación dejan de indicar actividad, también durante la retención del primer ciclo.
- Son decorativos: el estado accesible es el texto de estado del componente funcional, anunciado una vez, y los cambios de etiqueta no se anuncian (catálogo §7.1). Con movimiento reducido, el indicador queda quieto.

### 5. Easter eggs

- `poking`, `are-u-still-here` e `i-see-you` se integran solo en la consulta en reposo y en el expediente, en la ubicación aprobada en el Lab, según el catálogo §4 y §6.3. No se activan mientras se escribe, se interactúa con controles, Sofi habla, se procesa o hay un estado sensible.
- `are-u-still-here` se activa tras una inactividad real de 2–3 minutos. El valor exacto se fija en el plan o el Lab; no se usa el que trae por defecto el controlador.
- Sin escuchas globales ni trabajo por movimiento de puntero mientras el gag no pueda activarse.

### 6. Controladores

- Los controladores de los ZIP se usan sin modificar, a través de un adaptador de Ask Sofi que debe:
  - agregar las causas de pausa de Ask Sofi, de modo que la reanudación de una no anule las demás, también con `attachPoking`, que pierde el motivo;
  - conectar y desconectar cada controlador según la escena;
  - limpiarlos al desmontar, también con StrictMode;
  - pasarles el umbral de inactividad y la velocidad;
  - aplicar el movimiento reducido también a su JS.
- Que el adaptador cumpla esto, junto con el movimiento reducido de §7, es un riesgo técnico que el plan debe demostrar antes de implementar (véase «Provisional and pending»).

### 7. Movimiento reducido

- Se cumple el catálogo §7.2: `prefers-reduced-motion`, el modo forzado y la preferencia propia producen el mismo resultado en CSS y JS, con la pose estática aprobada para cada recurso.
- Preferencia propia de movimiento reducido, junto a tema y sonido, guardada con `003`. Por defecto sigue al sistema y su diseño se aprueba en el Lab (`tech-stack.md` §44).
- Se evalúa si algún bucle automático necesita además un control de pausa (WCAG 2.2.2; catálogo §7.2).

### 8. Velocidad

- La velocidad de producción de cada animación se define en un único lugar de Ask Sofi, como factor sobre la línea de tiempo de su parcial (1× por defecto). Se aplica a la vez a todas sus capas, pseudoelementos y efectos incluidos, y a los tiempos de su controlador. El parcial sigue siendo la única fuente de duraciones: no se copian a JS. No es una preferencia pública (catálogo §8, §12).

### 9. Sonido

- Efectos sonoros contextuales, sujetos a la preferencia de sonido existente: no suenan si la persona no ha activado el sonido, y el audio solo se prepara dentro de un gesto (`002`).
- Seguridad, salida rápida y estados sensibles permanecen en silencio. Los efectos no tapan la voz de `SofiSpeech`.
- Durante `memory-wipe` se permiten efectos exclusivamente después de completar el borrado total; nunca lo retrasan ni lo condicionan.
- Sonido y movimiento reducido son preferencias independientes (`002`).
- Cada efecto requiere selección aprobada y licencia verificada, compatible con publicar el proyecto y registrada junto al archivo. No se incorporan audios de Myinstants ni de Nintendo.

### 10. Design Lab

- Se amplía `Motion & Sound` según el catálogo §8, sin crear un segundo laboratorio. El hueco «Sprite hablando · pendiente 008» pasa a usar `talking`.
- Antes de construir el inspector se inspecciona el playground del repositorio de spritesheets y se reutilizan o adaptan sus capacidades aprovechables, por ejemplo: velocidad común de animaciones y controladores, tamaño, fondos, pixelado, línea de tiempo por fotograma, peso y memoria, y demos. No se presupone que toda su implementación sea reutilizable ni se duplican componentes que el Design Lab ya tiene.
- El Lab simula los eventos del contrato (§2), la retención del primer ciclo, la actividad (§4) y el sonido (§9), y registra las aprobaciones de «Provisional and pending».

### 11. Composición

Las incidencias de composición se resuelven en los contenedores, sin tocar el arte, y se aprueban en el Lab (catálogo §9.8 y §12):

- el contorno del tema oscuro durante la disolución de `memory-wipe`;
- la base que se levanta con los saltos de `eureka`, `error` y `memory-wipe` en el escenario ancho;
- la base de `sofing`, a 10 px del borde;
- la cara de `are-u-still-here`, que queda fuera del recorte estrecho;
- los desbordamientos por diseño: sello de `favoriting`, `Zzz`, «!» de `i-see-you` y marcas de `error`.

## Acceptance Criteria

### Recursos

- [ ] Cada recurso original importado (tiras, parciales, mixin y controladores) es idéntico a su recurso fuente en el commit de origen. `001` se verifica así, sin ZIP. El código de integración propio de Ask Sofi queda fuera de esta comparación.
- [ ] Los ZIP de los siete paquetes actualizados (002, 003, 005, 008, 012, 013, 015) coinciden con los SHA-256 del cierre del informe de correcciones. Los seis restantes (004, 006, 009, 010, 011, 014), sin hashes documentados, se verifican solo por contenido.
- [ ] Ningún fotograma se ha alterado.
- [ ] Solo se versionan los recursos integrados. Los ZIP siguen disponibles y sin versionar hasta que se apruebe su retirada.
- [ ] `asset-provenance.md` mantiene la procedencia: commit de origen y remisión al informe de correcciones.
- [ ] En la build de producción, cada pantalla carga solo el CSS y las tiras que usa; ningún módulo importa `_index.scss` y no hay sprites en estilos globales.
- [ ] Con un recurso lento o caído, Sofi conserva una representación estática.

### Comportamiento

- [ ] Hay pruebas unitarias de la selección semántica y de las prioridades del catálogo §6.
- [ ] Ninguna operación se retrasa.
- [ ] La retención del primer ciclo respeta su límite, solo se aplica a resultados no críticos y no afecta a seguridad, privacidad, cancelación, salida rápida, movimiento reducido ni carga de la página (catálogo §6.4).
- [ ] Todo error se muestra en cuanto se conoce, sin esperar al ciclo de Sofi.
- [ ] Al terminar la operación, etiqueta e indicador dejan de indicar actividad.
- [ ] `safety_concern` no muestra sprites, la salida rápida no anima y `memory-wipe` solo aparece tras un borrado total efectivo.
- [ ] `eureka` y `suspicious` no aparecen en producción.
- [ ] En el expediente, `talking` se anima solo mientras `SofiSpeech.speaking` es verdadero y `uncertain` usa el recurso 014, sin cambiar el formulario ni su comportamiento.

### Easter eggs y controladores

- [ ] Solo hay un easter egg activo, y la reanudación de una causa no anula las demás, incluido `attachPoking`.
- [ ] Ningún gag se activa durante escritura, interacción con controles, habla, procesamiento ni estados sensibles; `poking` no responde al teclado ni recibe foco.
- [ ] Al desmontar, también con StrictMode, no quedan listeners, observadores, timers, capas ni atributos.
- [ ] `are-u-still-here` no se activa antes del umbral aprobado.

### Accesibilidad y movimiento

- [ ] Sprites, capas e indicador quedan fuera del árbol de accesibilidad, y los hechos se anuncian una vez desde sus componentes.
- [ ] Sistema, modo forzado y preferencia propia producen la misma pose estática aprobada y detienen CSS y JS (Playwright).
- [ ] La preferencia propia persiste, es revocable y vuelve al valor por defecto al borrar todos los datos.
- [ ] La verificación de destellos de `error` y la evaluación de WCAG 2.2.2 están documentadas.

### Velocidad, sonido y Lab

- [ ] Cambiar la velocidad mantiene sincronizadas todas las capas y el controlador, sin duraciones copiadas a JS.
- [ ] Sin el sonido activado no suena ningún efecto. Seguridad y salida rápida no suenan, ningún efecto tapa la voz y los de `memory-wipe` solo suenan tras un borrado total efectivo. Cada archivo tiene su licencia registrada.
- [ ] El Design Lab cumple el catálogo §8 y la checklist §13, con las aprobaciones registradas.
- [ ] Hay pruebas según `tech-stack.md` §42 y el catálogo §9.11, y se cumplen los criterios de accesibilidad y responsive de la constitution en los contenedores afectados.

## Out of Scope

- Nuevos spritesheets, animaciones descartadas (catálogo §11) y retoques del arte.
- Modificar el repositorio de spritesheets.
- Retirar los ZIP sin aprobación expresa.
- Interfaz de resultados, seguridad y salida rápida (`007`); favoritos (`009`); el control «Borrar todos mis datos».
- Reglas de `eureka`/`suspicious` (tras `006`).
- Verificación en dispositivos reales (`015`).

## Provisional and pending

**Se aprueba en el Design Lab:**

- copy de actividad e indicador;
- duración y límite del primer ciclo;
- velocidad de producción de cada animación;
- pose reducida de cada recurso;
- pausas de `talking` y paso `blink` → `talking`;
- composición (§11);
- ubicación y versión reducida de los easter eggs;
- diseño de la preferencia de movimiento;
- selección de efectos sonoros.

**Se decide con mediciones:** `rolling` en la carga de la app o de una vista y su precarga; el retraso anti-destello, con latencias reales.

**Riesgo técnico para el plan, sin demostrar:** el plan debe demostrar que el adaptador controla CSS, JS y poses estáticas en los tres modos de movimiento reducido sin duplicar reglas incompatibles con los parciales. La dificultad es que los parciales solo definen su pose reducida dentro de `prefers-reduced-motion`, y ni el modo forzado ni la preferencia propia la activan. Si no se demuestra, se vuelve a decidir antes de implementar.

**Pendiente de asignar:** la feature dueña de «Borrar todos mis datos».

**Pendiente de `006`:** las reglas de `eureka`/`suspicious`.

## References

- `spec/constitution/art-direction/sofi/animation-catalog.md`
- `spec/constitution/art-direction/sofi/asset-provenance.md`
- `spec/constitution/art-direction/README.md`
- `spec/constitution/tech-stack.md` §42, §44–46.1
- `spec/constitution/roadmap.md` §11
- `002`, `003`, `004-plan.md` §5–6, `005`, `006`, `007-spec.md` §6 y §8
- `AGENTS.md`
