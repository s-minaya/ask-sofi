# 008 — Sofi Character & Motion — Plan

## Status

Approved - 27 de octubre de 2026. Desarrolla las decisiones D-1 a D-13, aprobadas el 2026-10-23 con las precisiones de §11, las posteriores del 2026-10-27 (§11.2) y las de la capa visual del 2026-11-03 (§11.3).

## Approach

Cuatro bloques:

```text
A. Base técnica, sin aprobaciones visuales
   A0 puerta Firefox/WebKit (§2, superada) → A1 recursos → A2 movimiento → A3 capa visual pura → A4 pintura y controladores → A5 infraestructura de audio
B. Design Lab
   inspector y escenarios (§8) → propuestas → aprobaciones visuales (§9)
C. Producción
   accesibilidad (D-3) → expediente y consulta en reposo → gags → control de preferencia
D. Mediciones y sonido
   rendimiento antes y después (§7) · experimentos de carga: rolling (D-6) y talking/uncertain (§7) · latencias reales de Jev · selección y licencias de efectos
```

- **Dependencias entre bloques:**
  - A no depende de B.
  - Cada parte de C espera a la aprobación de B que le afecta.
  - D va en paralelo, salvo las latencias de Jev, que esperan al Bloque C de `006`. Los experimentos de carga y los objetivos de rendimiento no dependen de Jev.
  - Las latencias de Jev no condicionan el cierre de esta feature: constan como trabajo posterior, con su responsable, en `008-tasks.md` («Trabajo posterior»).
- **A0 se superó el 2026-10-27** con pruebas de concepto (§2). Si la implementación encuentra una incompatibilidad, se detiene el bloque A y se informa antes de ampliar el alcance de ningún mecanismo.
- **Qué no hace el plan:** no repite `008-spec.md`, el catálogo (`animation-catalog.md`) ni `tech-stack.md` §44–46.1; fija lo que delegan.

## 1. Auditoría de lo existente

| Necesidad | Se reutiliza | Hueco |
|---|---|---|
| Pintar a Sofi | `SofiPortrait`: tamaño, recorte, contorno, imagen con reserva | Acoplado al parcial de parpadeo, que importa directamente. `role="img"` con textos de gesto (D-3) |
| Recursos visuales del expediente | `sofiVisuals.ts`, `visualFor` (`004-plan.md` §6) | Mezcla los estados del expediente con las rutas, y vive en `partner-profile` aunque la consulta lo importa |
| Sincronía con el habla | `SofiSpeech.onStateChange` (`speechTimeline.ts`) | Se llama en cada carácter; falta un aviso solo cuando cambia `speaking` (D-12) |
| Movimiento reducido | `MotionPreferenceProvider`, `useReducedMotion`, `u.reduced-motion` | Solo `system \| reduce`; el atributo va en un `div` envolvente; el mixin no conoce `full`. Los parciales no responden a `data-motion` |
| Sonido | `SoundProvider`, `createSpeechAudio` (opción `createContext`), `src/test/fakeAudio.ts` | Sin efectos. El contexto lo crea y lo cierra el controlador de voz (`dispose`, probado en `speechAudio.test.ts`) |
| Design Lab | `Motion & Sound` (4.1–4.4), `LabParts` (`LabRange`, `LabChoice`, `LabCheck`, `LabStage`…), `PreviewFlow` con latencia simulada (prototipo provisional, §8) | Sin inspector de sprites ni escenarios de prioridad |
| Técnicas de inspección | Playground del repositorio de spritesheets (§8) | Es JS sobre el DOM, fuera de React |
| Pruebas | `matchMedia`, `intersection`, `fakeAudio`; `e2e/production-build.spec.ts` | jsdom no implementa Web Animations. Playwright solo tiene el proyecto Chromium |
| Recursos | `src/styles/sprites/`: `sofi-blink` (definitivo), `sofing` y `rolling` (anteriores a la corrección), `_index.scss` (exportación antigua) | 11 animaciones, 3 controladores y la actualización de 2 tiras |

**Auditoría de movimiento fuera de los mecanismos** (2026-10-23, CSS compilado de los 12 módulos de la app con el mixin):
- Las 13 declaraciones de `animation`/`transition` tienen su anulación reducida. `Loader` lo hace ocultando la pieza.
- No hay `scroll-behavior` ni bloques `no-preference` propios.
- Los `scrollIntoView` de `ProfileSheet` y `useScrollIntoViewOnRequest` eligen `smooth` o `auto` con `useReducedMotion`.

## 2. Evidencia y puerta de navegadores

Pruebas de concepto aisladas, del 2026-10-23, salvo E13 y la puerta A0, del 2026-10-27. No forman parte del repositorio: §10 las convierte en pruebas automáticas. Son la evidencia histórica de este plan y no se reproducen en otro documento: los resultados de la implementación (hitos `VT#` y `EX#` de `008-tasks.md`) constan en `008-verification.md`, que remite a E1–E13 por su número cuando los confirma o los corrige.

| # | Qué se probó | Resultado | Límite |
|---|---|---|---|
| E1 | Build de producción actual | JS 336,34 kB (109,33 gzip), CSS 48,29 kB (9,82 gzip). Solo se emite `sofi-blink.webp`. CSS Modules aplica hash también a los keyframes | — |
| E2 | Arranque de la build con `vite preview`: 390×844, caché fría, mediana de 5 | FCP: 536 ms sin limitar · 1728 ms con Fast 4G + CPU 4× · 2712 ms con Slow 4G + CPU 4× | Chromium, servidor local. Evidencia histórica del 2026-10-23: EX1 no la reprodujo, ni con su propio guion, y la sustituye como línea base (§11.2; `008-verification.md`) |
| E3 | Peso de los 14 recursos | CSS 66,2 kB (13,6 gzip) · controladores 31,9 kB (11,6 gzip) · WebP 830,2 kB, que solo se descargan al pintarse | — |
| E5 | Web Animations sobre los parciales | El subárbol incluye pseudoelementos. La pasada única desde fuera funciona. Velocidad común sin deriva, reaplicada en `animationstart`. `animationiteration` marca el primer ciclo (6440 ms el de `sofing`) | Chromium; A0 lo repite en Firefox y WebKit |
| E6–E7 | Controladores, y React 19 en StrictMode | `destroy` no deja listeners, capas ni atributos; montar–destruir–montar no duplica capas; la agregación de causas corrige `attachPoking`; React no emite avisos | Chromium y jsdom; A0 repite E6 en Firefox y WebKit |
| E8 | TypeScript y la cadena real de Vite | `poking.js` con `.d.ts` y las `.webp` tipan con el `tsconfig` actual. `preprocessCSS` ejecuta Sass, CSS Modules y plugin | — |
| E11 | **D-1/D-9 con alcance por ruta.** PostCSS solo en `src/components/sofi/sprites/`, `u.reduced-motion` ampliado (en memoria), atributo en `<html>` | **19 casos equivalentes en los seis modos** (sistema normal o reduce × sin atributo, `reduce` o `full`): 14 recursos, 5 estados de controlador con parpadeo y gag en módulos distintos, y `Spinner`, `Loader` y `Ticker` reales. El plugin solo tocó los 14 módulos dueños. En los 12 módulos de la app con el mixin, 15 de sus 16 reglas reducidas excluyen `full`; la restante es la del parcial de parpadeo que importa `SofiPortrait`. **Control:** el `SofiPortrait` actual falla con `full`, porque importa el parcial fuera de la carpeta dueña | Chromium 156; A0 lo repite en Firefox y WebKit |
| E12 | **Carga selectiva con `import.meta.glob` ansioso.** Build aislada con los 14 parciales y las 40 tiras reales (3 recursos estáticos, 9 diferidos, `eureka` y `suspicious` sin cargador) y descargas en Chromium con caché fría. Cuatro variantes: sin glob; glob central de todas las tiras; glob limitado al prefijo dentro de cada módulo dueño; esa misma con las tiras fuera de la incrustación | El glob central **perjudica** la estrategia: el JS de entrada pasa de 1,97 a 21,35 kB gzip, referencia las 24 tiras emitidas y emite las de `eureka` y `suspicious`, que solo usa el Lab. El glob **dentro de cada módulo dueño** no la perjudica: la referencia viaja en el chunk de su dueño y no descarga nada. Las tiras se piden al pintarse o al decodificarse; no con `display: none`, sí con `visibility: hidden`. El arranque descarga una sola tira (`sofi-blink`) en las cuatro variantes. El límite de incrustación de Vite (4096 B) afecta a 16 de las 40 tiras: las 15 pequeñas de producción salen duplicadas en el CSS y en el JS de su dueño | Chromium; sin la transformación de D-1; las cifras absolutas son del arnés y solo valen las diferencias |
| E13 | **Tiras fuera de la incrustación, con conexión lenta.** Las builds de E12 con las tiras pequeñas incrustadas (B) y con todas como archivos (C), con Slow 4G + CPU 4× (el perfil de E2), caché fría y mediana de 3. Se aplica la clase del módulo dueño sin esperar, o se decodifican antes sus tiras. Aparte, una prueba mínima de la tira que un parcial usa como máscara | Las animaciones avanzan en los tres recursos medibles (`memory-wipe`, `rolling`, `talking`). Sin esperar a las tiras, la animación corre sin ellas entre 0,7 y 1,6 s, y es lo mismo en B y en C porque lo domina la tira grande (`rolling` 723 frente a 740 ms, `memory-wipe` 1637 frente a 1617 ms, `talking` 970 frente a 974 ms). Decodificando antes las tiras, el hueco es de 0 ms, a cambio de empezar más tarde (`rolling`: 1208 ms frente a 461 ms desde la intención). Excepción: `memory-wipe-dissolve`, que el parcial usa como máscara (`mask-image`), precargada sin `crossOrigin` se pide dos veces (hueco de 437 ms en C); con `crossOrigin = 'anonymous'`, una. Esto último, en Chromium, Firefox y WebKit | Slow 4G + CPU 4× solo en Chromium (CDP). `poking` no es informativo: su controlador crea las capas. Sin la transformación de D-1 |

**Numeración:** sigue el orden de ejecución del análisis previo, que consta fuera de Ask Sofi. E4 y E10 aplicaban la transformación PostCSS a todo el CSS (E4 con `system | reduce`, E10 añadiendo `full`), y E11 las sustituye al limitar D-1 el alcance a los módulos dueños. E9 estudió el patrón de referencia de D-8 (§11). Por eso la tabla no las incluye.

**Puerta A0**, ejecutada el 2026-10-27 con los navegadores de Playwright 1.64: Chromium 156, Firefox 157 y WebKit 27.2. Se instalaron solo `firefox-1555` y `webkit-2370`, sin tocar dependencias. Un único arnés en memoria reúne E5, E6 y E11, con el plugin limitado por ruta de D-1 y la misma instrumentación en los tres motores:

| Comprobación | Chromium | Firefox | WebKit |
|---|---|---|---|
| E5 · `getAnimations({ subtree: true })` con pseudoelementos, en 9 animaciones | 9 de 9 | 9 de 9, mismas capas, iteraciones y duraciones | 9 de 9, idéntico |
| E5 · pasada única desde fuera (`favoriting`, `needs-context`, `error`) a 8× | terminan, 0 vivas | idem | idem |
| E5 · velocidad común 4× en las 8 capas de `rolling`, y animaciones nuevas reaplicadas en `animationstart` | 3,99×, sin deriva | 3,99×, sin deriva | 3,89×, sin deriva |
| E5 · `animationiteration` de `sofing` a 10× (esperado ≈644 ms) y `animationend` de `eureka` a 8× | 595 ms; 6 de 6 | 592 ms; 6 de 6 | 599 ms; 6 de 6 |
| E6 · montar, destruir y montar los 3 controladores: capas, atributos, escuchas y observadores | sin residuos | sin residuos | sin residuos |
| E6 · causas de pausa de `attachPoking` | defecto reproducido y corregido con agregación | idem | idem |
| E11 · 19 casos en los seis modos | 19 de 19 | 19 de 19 | 19 de 19 |
| E11 · control: el `SofiPortrait` actual con `full` | falla | falla | falla |

- **Resultado:** sin incompatibilidades. D-1 y D-9 quedan demostradas con pruebas de concepto en los tres motores. Falta confirmarlas con la implementación, mediante las pruebas de §10.
- **Límites:**
  - son las compilaciones de Playwright para Windows: WebKit no es Safari de macOS ni de iOS, cuya verificación corresponde a `015`;
  - las escuchas se cuentan con una instrumentación propia de `addEventListener`, validada contra CDP en Chromium (mismos resultados); no ve las propiedades `onX` ni las escuchas `once`;
  - no se midieron temporizadores pendientes.

## 3. Estructura

```text
src/styles/sprites/                  recursos importados tal cual (tech-stack §46.1), con sus controladores .js/.d.ts
src/components/sofi/sprites/         módulos dueños: <id>.module.scss (único @use del parcial) y <id>.ts (clases y tiras); alcance de PostCSS
src/components/sofi/visual/          capa visual compartida y pura: registro, selección, prioridades, retención, gags, velocidades y etiquetas
src/components/sofi/SofiSprite/      primitiva de pintura (React)
src/components/sofi/useSofiController.ts  adaptador de los controladores (React)
src/components/ui/ActivityIndicator/ indicador de actividad (Design System)
src/features/partner-profile/sofiVisuals.ts  solo correspondencia de estados del expediente → intenciones; visualFor se conserva
scripts/spriteReducedMotion.ts       plugin PostCSS en línea, sin dependencias, registrado en vite.config.ts
```

## 4. Movimiento (D-1, D-2, D-9)

### 4.1 Preferencia y estado efectivo

| Preferencia | Sistema normal | Sistema reduce |
|---|---|---|
| `system` (por defecto) | animado | reducido |
| `reduce` | reducido | reducido |
| `full` | animado | animado |

- **Almacenamiento:** `preferencesStorage` añade `motion` con `z.catch` y valor por defecto `system`, sin cambiar de versión. `clearUserData` lo devuelve a `system`.
- **Aplicación:**
  - `MotionPreferenceProvider` conserva su API (`value`) y escribe `data-motion` en `<html>`, como `applyThemePreference`;
  - `main.tsx` lo aplica antes del primer render;
  - hay **un único ámbito por documento**: la app, el Design Lab y cada iframe de la Preview tienen el suyo, y no se anidan proveedores.
- **JS:** `useReducedMotion` devuelve el estado efectivo de la tabla. Sus consumidores actuales (`SofiSpeech`, desplazamientos, retratos) no cambian.
- **Pruebas:** `src/test/setup.ts` limpia `dataset.motion` entre pruebas, como ya hace con `dataset.theme`.

### 4.2 CSS propio: `u.reduced-motion`

- **Reglas que genera:**
  - una regla reducida bajo `@media (prefers-reduced-motion: reduce)`, prefijada con `:where(:root:not([data-motion='full']))`;
  - otra con `:where(:root[data-motion='reduce'])`.
- **Especificidad:** ninguno de los dos prefijos añade especificidad. La rama forzada pierde el `(0,1,0)` que aporta hoy su atributo y pasa a comportarse igual que la del sistema. Se verifica con capturas en el Lab (§10).

### 4.3 CSS de sprites: transformación PostCSS

- **Alcance:** solo los módulos de `src/components/sofi/sprites/`, identificados por `root.source.input.file`.
- **Transformación:**

  | Bloque | En el sitio | Clon después del bloque |
  |---|---|---|
  | `reduce` | prefijo `:where(:root:not([data-motion='full']))` | prefijo `:where(:root[data-motion='reduce'])` |
  | `no-preference` | prefijo `:where(:root:not([data-motion='reduce']))` | prefijo `:where(:root[data-motion='full'])` |

  Ningún prefijo añade especificidad, y el clon ocupa la misma posición en la cascada.
- **Rompe el build si encuentra:** otras formas de media, selectores `html`, `:root` o `body` dentro de un parcial, o reglas anidadas.
- Los parciales no se modifican.

### 4.4 Poses reducidas y orden

- **Poses:**
  - por defecto, la del propio parcial (D-2);
  - `memory-wipe`, la que fija el catálogo (ficha 015): la pose aterrorizada dura lo que la confirmación funcional del borrado y, al terminar esta, la intención vuelve a neutral (D-16). La capa visual no usa temporizador ni animación para ello: la señal de fin la emite la interfaz dueña, `009` (D-15);
  - una desviación aprobada en el Lab solo puede sustituir la pose por otro recurso o fotograma existente.
- **Orden de los gags:** su CSS va después del de `sofi-blink`, como en el playground. Se cumple por construcción: el parpadeo es estático (§7) y los gags son diferidos. La build lo comprueba.

## 5. Capa visual (D-4)

### 5.1 Responsabilidades

| Módulo | Hace | No conoce |
|---|---|---|
| `visual/registry` | Qué recursos existen: tipo, cargador del módulo dueño, pasada única, pose reducida, velocidad, controlador | React, pantallas |
| `visual/select` | Qué representación toca según las señales, con la jerarquía y la matriz del catálogo §6 | React, archivos |
| `visual/presentationGate` | Si se presenta ya un resultado (catálogo §6.4) | React, archivos |
| `visual/ambient` | Un solo gag activo y causas de pausa | React, controladores concretos |
| `visual/activityLabels` | Calendario de etiquetas a partir del estado real | React |
| `sprites/<id>` | Clases y tiras de un recurso | Lógica |
| `SofiSprite`, `useSofiController` | Pintar y montar controladores | Prioridades |
| `partner-profile/sofiVisuals` | Estados del expediente → intención | Recursos físicos |

- Las funciones de `visual/` son puras. Pertenecen a la capa visual compartida, no al dominio de negocio (`tech-stack.md` §59).
- No se añaden librerías de estado (§21).
- Se conservan `SofiPortrait`, `SofiStage` y `visualFor`. Se extienden; no se sustituyen.

### 5.2 Registro y selección

- **Identificadores:** los del catálogo §3.
- **Estáticas:** las imágenes de `sofiVisuals.ts` pasan al registro compartido, que sigue siendo el único sitio con rutas (`004-plan.md` §6).
- **Selección:** la tabla del catálogo §5 y la matriz §6.3 se convierten en pruebas de tabla, y se escriben antes que el código.
- **Fin de una pasada única:** se consulta el estado actual, sin cola.
- **`eureka` y `suspicious`:** solo se referencian desde el Lab (spec §2). El registro de producción no declara sus cargadores: el bundler emite todo lo que alcanza un `import()` y, sin cargador, no sale ninguna de sus tiras (E12). El Lab los añade desde su propio código.
- **Borrado total (D-15, D-16):** el contrato recibe dos señales de la interfaz de `009`: el borrado efectivo, que inicia `memory-wipe`, y el fin de su confirmación funcional, que devuelve a neutral. Ninguna espera a la animación. Hasta que `009` las emita, el Lab y las pruebas las simulan (spec §2).
  - **Modo de movimiento (D-16):** el borrado restablece la preferencia a `system` (§4.1). La reacción mantiene el modo efectivo con el que empezó hasta que termina la confirmación, y no restaura la preferencia ni los datos borrados. Se mantiene con el único `data-motion` de `<html>` (§4.1) mediante `holdMotion` (D-23); su prueba en los tres motores va en T046 y T073.
  - **Dónde está el contrato (para `007` y `009`):** las intenciones y las señales de borrado en `src/components/sofi/visual/select.ts` (`SofiState`, `selectVisual`, `wipeAfter`) y el modo de movimiento en `src/app/providers/motion.ts` (`holdMotion`). El orden de las llamadas está documentado en esos módulos y no se repite aquí.
  - **Borrado efectivo (D-15):** hoy `clearUserData()` devuelve `void` y `remove` traga los errores del almacenamiento: deja una lápida en memoria y la clave puede seguir en el almacenamiento. El contrato con `009` exige verificar el borrado efectivo antes de anunciar el éxito o de emitir la señal que activa `memory-wipe`. La vía (un resultado de `clearUserData()`, una relectura u otra) y cualquier cambio en `003` se deciden en `009` con `003`; esta feature no los implementa.

### 5.3 Retención del primer ciclo (D6)

- **Entradas de `presentationGate`:**
  - tipo de resultado;
  - fin del primer ciclo (`onFirstCycle` de `SofiSprite`);
  - tiempo desde la llegada del resultado;
  - límite;
  - estado efectivo de movimiento.
- **Salida:** presentar ahora o esperar.
- **Exclusiones:** las del catálogo §6.4 presentan en el acto, y se prueban todas.
- **Límite:** es un valor de experiencia aprobado en el Lab (experimental hasta AV2: D-17). **Ojo:** el primer ciclo de `sofing` dura 6440 ms a 1× (E5), así que el límite decide cuánto puede esperar un resultado rápido.
- **Integración:** la consume la pantalla de resultados de `007`. En 008 se demuestra en la Preview del Lab, que es un prototipo provisional (§8): no fija el flujo de resultados de `007`.

### 5.4 Pintura

- **`SofiSprite`:**
  - carga el módulo dueño con `import()`; `sofi-blink`, estática (§7), se importa directamente y no tiene cargador en el registro;
  - mantiene el fotograma de `sofi-blink` hasta que el módulo carga y las tiras se decodifican. Las URL de las tiras las exporta cada módulo dueño (`sprites/<id>.ts`) con un `import.meta.glob` ansioso limitado a su prefijo, por ejemplo `import.meta.glob(['/src/styles/sprites/poking.webp', '/src/styles/sprites/poking-*.webp'], { query: '?url', import: 'default', eager: true })`; `export.mjs` garantiza ese prefijo. **Nunca un glob central de `*.webp`:** referenciaría desde la entrada todas las tiras, también las del Lab (E12). Una referencia no descarga nada: la tira se pide al pintarse o al decodificarse (§7). La clase del recurso se aplica cuando sus tiras están decodificadas, sin hueco con la animación en marcha (E13). Las que el parcial usa como máscara se precargan con `crossOrigin = 'anonymous'` y el registro las declara (hoy, solo `memory-wipe-dissolve`);
  - aplica la clase de pasada única (la que indican los propios parciales) y la velocidad;
  - se entera de los cambios de velocidad del Lab por `subscribeToRates` (`visual/rates`), no volviendo a pintar;
  - emite `onFirstCycle` y `onEnd`;
  - es siempre decorativo (D-3);
  - sin Web Animations (jsdom) degrada: sin velocidad ni eventos de ciclo.
- **`SofiPortrait`:**
  - gana la propiedad `animation`;
  - deja de importar el parcial de parpadeo y usa el módulo dueño `sprites/sofi-blink` (control de E11);
  - conserva el recorte, el contorno y el tamaño.
- **D-3:** se retiran `role="img"`, el `alt` de `SofiStage` y `MOOD_ALT`. Pruebas que hay que actualizar:
  - unitarias: `sofiComponents.test.tsx`, `DesignLab.test.tsx`, `PropPlaygrounds.test.tsx`, `ProfileSheet.test.tsx`, `ProfileScreen.dialogue.test.tsx`, `ProvisionalConsultation.profile.test.tsx`;
  - e2e: `e2e/profile.spec.ts`.

### 5.5 Habla y velocidad

- **Habla (D-12):** `SofiSpeech` gana `onSpeakingChange`, que solo avisa cuando cambia el booleano (y avisa de que calla si el texto cambia, «Ver todo» lo completa o el diálogo se desmonta mientras suena, para que la capa visual no se quede en `talking`). El expediente lo pasa a la capa visual: `talking` mientras habla y la pose de pausa aprobada en el Lab.
- **Velocidad (D-7):**
  - `visual/rates` guarda una velocidad por recurso, 1× por defecto;
  - el Lab la sobrescribe solo durante la sesión;
  - `SofiSprite` aplica `playbackRate` al subárbol y la reaplica en `animationstart`;
  - el adaptador usa `setRate`.

## 6. Controladores y gags (D9 de la spec)

- **`useSofiController(kind, host, opciones)`:**
  - importa el controlador del ZIP de forma diferida, sin modificarlo;
  - lo monta solo si la escena está tranquila, el estado efectivo no es reducido, el anfitrión está montado y sus tiras están decodificadas (las capas las crea el controlador y piden sus tiras entonces: E12, E13);
  - lo destruye en la limpieza del efecto (E6, E7);
  - recibe `{ ambient, calm }` (las causas compartidas y si la escena está tranquila) y **devuelve la clase del gag**, que el consumidor aplica al anfitrión: es `undefined` hasta que las tiras están decodificadas y mientras no pueda montarse. El controlador no se monta hasta que esa clase está aplicada, y el estado efectivo de movimiento lo lee él mismo;
  - la velocidad llega con `setRate`, al montar y en vivo; el umbral de `are-u-still-here` es la constante `STILL_HERE_IDLE_MS`.
- **Anfitrión:** el elemento de `sofi-blink` con la clase del gag, sin hijos de React.
- **Causas de pausa** (`visual/ambient`):
  - el adaptador agrega en un conjunto: Sofi ocupada, otro gag, escritura o interacción, estado sensible;
  - llama a `pause()`/`resume()` solo al pasar de vacío a no vacío y al revés;
  - un solo gag activo, con el patrón `quiet` que documentan los propios controladores: sale del reposo (`i-see-you`: reaccionar, no mirar) y se declara activo en `ambient`.
- **Inactividad de `are-u-still-here`:** 150 000 ms como valor provisional, dentro de los 2–3 minutos de la spec; el definitivo en el Lab.
- **Superficies:** consulta en reposo y expediente, en la ubicación aprobada en el Lab.

## 7. Rendimiento y carga (D-5, D-6)

**Objetivos provisionales de D-5**, frente a la línea base de EX1 (`008-verification.md`). E1 sigue valiendo para los tamaños de la build. No son presupuestos aprobados: se confirman o se corrigen con las mediciones de este apartado, y solo entonces pasan a umbral de prueba:
- **CSS de entrada:** como mucho +2 kB gzip sobre la referencia inicial de **9780 B**. Se mide con `gzipSync` de Node y las opciones fijas de `scripts/loadMetrics.ts`, no con el «gzip» del informe de Vite 8, que es otra medida (9,82 kB). El margen de +2 kB sigue siendo provisional.
- **FCP, LCP y disponibilidad funcional:** sin umbral automático. El margen provisional de +50 ms de FCP se retiró: con Slow 4G + CPU 4×, dos medianas de la misma build lo superan con frecuencia por ruido (EX1). EX4 fija los criterios definitivos con comparaciones A/B (más abajo) y la autora los confirma.

| Recurso | Carga |
|---|---|
| `sofi-blink` | Estática: la pantalla lo necesita al montarse |
| `talking`, `uncertain` | Pendiente del experimento de carga (más abajo): diferida, precarga contextual o carga inicial. No se decide sin mediciones |
| Gags (CSS y controlador) | Diferida, al poder activarse en una escena tranquila |
| `sofing`, `needs-context`, `error` y demás recursos de flujo | Diferida, con precarga en reposo cuando el emisor (`007`, `009`) los haga probables |
| `eureka`, `suspicious` | Solo desde el Lab, hasta `006` |

**Referencia y descarga (E12).** Una referencia en el bundle no es una descarga. Se miden por separado los bytes y las referencias de la build, y las peticiones efectivas de WebP de cada pantalla.

| Recurso | En el bundle | Se descarga |
|---|---|---|
| Estático (hoy, `sofi-blink`) | Clase y URL de sus tiras en la entrada | Sus tiras, al pintarse. En el arnés de E12, el arranque descarga una sola (`sofi-blink`) |
| Diferido | Todo en el chunk de su módulo dueño; nada en la entrada | El chunk, cuando llega la intención o la precarga en reposo. Sus tiras, al pintarse o decodificarse |
| Gag | Como el diferido, más su controlador | Controlador y tiras solo en escena tranquila. Las capas las crea el controlador: sin él, `.poking` no pide ninguna tira |
| Solo del Lab | Nada en producción | Nada |

- **Visibilidad:** con `display: none` el navegador no pide la tira; con `visibility: hidden` sí. Un recurso que no deba descargarse no se oculta con `visibility: hidden`.
- **Incrustación de Vite (aprobado):** solo las tiras de Sofi (`src/styles/sprites/`) se excluyen de la incrustación en base64. El resto de assets conserva el límite por defecto (4096 B). Mecanismo: `build.assetsInlineLimit` como función en `vite.config.ts`, que devuelve `false` para esos archivos y `undefined` para los demás. Sin la exclusión, 16 de las 40 tiras (15 en producción) viajan duplicadas en el CSS y en el JS de su dueño. En E12 deja el CSS de entrada del arnés en 1,05 kB gzip (1,90 con incrustación), a cambio de más peticiones pequeñas: al decodificar `memory-wipe`, sus 12 tiras frente a 3.
- **Conexiones lentas (E13):** la exclusión no empeora la reproducción. Las animaciones medidas avanzan y el hueco entre el arranque y la llegada de las tiras es el mismo con y sin ella, porque lo domina la tira grande. Para que ese hueco sea 0, las tiras se decodifican antes de aplicar la clase (§5.4) y, entretanto, se ve el respaldo estático. Las tiras que un parcial usa como máscara se precargan con `crossOrigin = 'anonymous'`: sin él se piden dos veces, en los tres motores.

**Protocolo de medición** (el de E2, con el arnés `scripts/measureLoad.ts`):
- build en una carpeta temporal y `vite preview`;
- perfiles de CDP (sin limitar, Fast 4G + CPU 4×, Slow 4G + CPU 4×), caché fría, mediana de 5. El plan solo los nombra: sus parámetros constan en `008-verification.md`;
- se miden FCP, LCP, bytes transferidos, CSS de entrada y descargas de tiras por pantalla;
- **una muestra solo es válida si todas sus peticiones tuvieron éxito y todo lo que `index.html` referencia se descargó por la red.** El CSS de entrada es el que referencia `index.html`, no el que se descargó, y el arnés contrasta ambos. Una petición fallida, una respuesta que no sea 2xx o un recurso con el tipo de contenido equivocado aborta la medición, sin reintentar ni descartar en silencio. El caso traicionero: `vite preview` responde `200` con `index.html` a una ruta que no existe, y la página se mediría sin ese recurso;
- se mide antes y después del bloque C;
- las cifras obtenidas se registran en `008-verification.md`; este plan conserva solo los objetivos provisionales.

**Comparaciones A/B** (EX2 a EX4). La máquina deriva, así que una mediana de hoy no se compara con la de otro día (EX1). Toda comparación entre dos versiones usa el mismo arnés y:
- **Intercalado:** las dos versiones se sirven a la vez, con el mismo servidor, navegador, perfiles y configuración, y se cargan alternadas en bloques ABBA y BAAB, en igual número;
- **Calentamiento predefinido:** un número fijo de bloques completos, iguales para A y B, antes de los medidos (`WARMUP_BLOCKS`, en `scripts/loadMetrics.ts`). Es una constante del protocolo, no una opción por ejecución;
- **Todas las muestras se conservan,** también las de calentamiento, que el análisis excluye por regla y no por su valor. No se recorta ningún valor por parecer atípico;
- **Análisis emparejado:** la diferencia B − A de cada bloque, con su media, el intervalo del 95 % y en cuántos bloques B es más lenta. Una diferencia cuyo intervalo contiene el 0 no se distingue del ruido de esa medición.

**`rolling` (D-6):** se evalúan por separado el arranque inicial y las vistas diferidas, con las mismas métricas.
- **Métricas, con el protocolo de arriba:**
  - FCP y LCP;
  - disponibilidad funcional: tiempo hasta que la acción principal está pintada y un clic suyo se atiende;
  - coste de recursos: bytes transferidos, peticiones, CSS y JS de la entrada, memoria decodificada y CPU del hilo principal;
- **Arranque inicial:** hoy es un hueco en blanco hasta el FCP (`index.html` solo tiene `#root`; E2). Se comparan tres variantes: nada, marcador CSS en línea y `rolling` en línea con precarga;
- **Vista diferida:** hoy no existe ninguna, porque la build es un solo chunk (E1). Consta como no aplicable hasta la primera vista diferida real; entonces se mide con este mismo protocolo, sin crear una para el experimento;
- cada caso se decide por separado: solo se adopta si la carga supera el umbral de carga perceptible que apruebe la autora y no empeora los objetivos provisionales de arriba;
- si no cumple, no hay `rolling` en ese caso y se usa la alternativa ligera (catálogo, ficha 003).

**Carga de `talking` y `uncertain`.** Queda pendiente de un experimento comparativo. No se decide sin mediciones, no introduce esperas artificiales y no depende de Jev: puede hacerse en cuanto estén integrados los recursos (A1) y sus módulos dueños. Se comparan tres variantes con el protocolo de arriba:
- **diferida:** su módulo dueño no está en la entrada y se carga cuando la pantalla lo necesita;
- **precarga contextual:** diferida, pero se pide en reposo cuando la pantalla lo hace probable;
- **carga inicial:** en la entrada, con un loader real mientras dure la carga si esta es perceptible, sin retraso añadido.

Además de las métricas de `rolling`, se mide por pantalla el tiempo hasta que el recurso está listo cuando llega la intención y el tiempo con el respaldo estático visible (`sofi-blink`, §5.4). Decide la autora con las cifras. El criterio de aceptación de la spec sobre el CSS de cada pantalla (Recursos) se evalúa con ellas.

**Mediciones que faltan:**
- **Latencia real de Jev**, que registrarán los experimentos de `006-plan.md` §5 cuando se desbloquee su Bloque C. Hoy solo consta el timeout del SDK, 10 s por intento (`jev.md`). La necesitan:
  - el retraso anti-destello del loader;
  - el límite de D6;
  - la revisión de `PROVISIONAL_SLOW_THRESHOLD_MS`.
- El experimento de `rolling` en el arranque y, cuando exista, en una vista diferida.
- El experimento de carga de `talking` y `uncertain`, que no depende de Jev.
- Los objetivos provisionales después de integrar, para confirmarlos o corregirlos (EX4).
- Las descargas efectivas de WebP de cada pantalla con los recursos integrados (E12 es previo a la integración).
- Los renderizados de `talking` con React Profiler.

## 8. Design Lab

El Design Lab sigue siendo experimental: un prototipo, aunque funcione, no es una aprobación visual. El plan distingue tres estados, y solo el primero es referencia vinculante:

| Estado | Qué es | En producción |
|---|---|---|
| Aprobado | El diseño C «Exclusiva» (`002-plan.md`, «Approved design»); las decisiones de `art-direction/README.md` (1–8); el expediente de `004` (T012 cerrada) | Referencia visual. Prevalece sobre las pantallas exportadas, nunca sobre requisitos funcionales, accesibilidad ni privacidad (`AGENTS.md`) |
| Prototipo provisional | `PreviewFlow` y sus escenarios (latencia simulada de 1,6 s, «Carga» sin fin, aviso de carga lenta a los 6 s); todo lo marcado con `LabProv`; las composiciones de resultados pendientes de `007` (README, 9) y la seguridad, sin diseño (README, 10) | No es requisito. Lo confirma o lo cambia la feature dueña |
| Pendiente de aprobación | Lo nuevo de esta feature: §9 | Se decide en el Lab con la aprobación de la autora, antes de pasar al Bloque C |

`PreviewFlow` y las composiciones actuales no se convierten en requisitos por estar en el Lab: sus previsualizaciones y contenidos provisionales no son requisitos de implementación (`AGENTS.md`). Una aprobación existe solo cuando la autora la da expresamente y se registra en su fuente de verdad; ver un prototipo funcionando no la sustituye.

Se amplía `Motion & Sound` (catálogo §8):
- 4.3 pasa a usar `talking`;
- secciones nuevas: inspector de los 14 recursos, secuencias y prioridades con D6, gags, actividad y efectos;
- la Preview sustituye sus fotogramas provisionales por los sprites reales y conserva su layout (catálogo §8); sigue siendo un prototipo.

| Capacidad del playground | Decisión |
|---|---|
| Velocidad, pausa y reinicio con Web Animations y `setRate` | Se adapta: por recurso, en estado de sesión |
| Línea de tiempo con `getKeyframes()`, miniaturas y desplazamiento manual | Se adapta a React (4.4 conserva `BLINK_TIMELINE` y su test de contrato) |
| Tamaño, fondos y pixelado | Se adapta con `LabRange`, `LabChoice` y `LabCheck` |
| Peso y memoria decodificada | Se adapta: sirve a los objetivos de §7 |
| Escenarios de las demos (eureka → talking, inactividad limitada al escenario, temporizadores de Web Animations) | Se adapta la idea con el adaptador real |
| Plantillas de DOM, `localStorage`, recarga por EventSource, servidor propio | Se descarta |

## 9. Aprobaciones visuales pendientes en el Design Lab

Cada punto se aprueba expresamente y se registra en su fuente de verdad (§8).

1. Indicador de actividad: formas de píxel, ritmo de ida y vuelta (120 ms como referencia de partida, no definitiva) y copy de las etiquetas.
2. Duración y límite del primer ciclo (§5.3).
3. Velocidad de producción de cada recurso.
4. Poses reducidas, salvo `memory-wipe`, y versión reducida de los gags.
5. Pausas de `talking` y paso `blink` → `talking`.
6. Ubicación de los gags.
7. Ubicación y diseño del control de preferencia de movimiento. Cabecera y portada, junto a `ThemeSwitch`, son solo la propuesta de partida.
8. Composición, solo para las observaciones que se reproduzcan (spec §11). El contorno de `memory-wipe` no se toca por defecto.
9. Selección de efectos sonoros, tras verificar sus licencias.

## 10. Estrategia de pruebas

- **TDD, RED → GREEN, por este orden:**
  1. `presentationGate` con reloj falso;
  2. `visual/select`, a partir de las tablas §5 y §6.3 del catálogo;
  3. `visual/ambient`, con causas simultáneas;
  4. `activityLabels`;
  5. integridad del registro: 14 recursos, prefijos de tira existentes, poses válidas y tiras usadas como máscara declaradas;
  6. campo `motion` de las preferencias;
  7. `scripts/spriteReducedMotion.ts` con `preprocessCSS` en entorno `node`: alcance por ruta, las cuatro reglas y los fallos.
- **Componentes:**
  - reserva de `SofiSprite` mientras carga y cuando falla, y su camino sin Web Animations;
  - sprites decorativos;
  - sin re-render por carácter;
  - `ActivityIndicator`;
  - control de preferencia;
  - efectos con `fakeAudio`.
- **Playwright en Chromium, Firefox y WebKit** (D-10): un proyecto por motor para la especificación de movimiento, y Chromium para el resto. Las pruebas de movimiento viven en `e2e/motion/`, y `playwright.config.ts` solo asigna esa carpeta a Firefox y WebKit. Cubre:
  - equivalencia de los seis modos por recurso, con capturas (E11);
  - pasada única;
  - velocidad;
  - peticiones de WebP de cada pantalla: solo las tiras de lo que se pinta, y ninguna dos veces (E12, E13);
  - conexión lenta (Slow 4G + CPU 4× por CDP, solo Chromium): las tiras llegan antes de que arranque la animación, esta avanza y `sofi-blink` hace de respaldo entretanto (E13);
  - limpieza de gags (listeners por CDP en Chromium);
  - D6 a velocidad acelerada;
  - `talking` en las pausas;
  - axe en las secciones nuevas.
- **Build** (amplía `production-build.spec.ts`):
  - el CSS de entrada solo lleva los recursos de producción;
  - keyframes únicos;
  - el CSS de los gags va después del de `sofi-blink`;
  - los controladores no están en el chunk de entrada;
  - la entrada solo referencia tiras de recursos estáticos, y ninguna tira de `eureka` ni `suspicious` sale en la build (E12);
  - los objetivos provisionales de §7 se registran en cada build y pasan a umbral de prueba cuando se aprueben.

## 11. Decisiones aprobadas (2026-10-23)

| Decisión | Aprobado, con precisiones |
|---|---|
| D-1 | PostCSS solo en los módulos dueños, identificados por ruta. El resto, con `u.reduced-motion` ampliado. Pruebas en tres motores; ante una incompatibilidad, se informa antes de ampliar el alcance |
| D-2 | Poses del propio parcial. `memory-wipe` conserva la suya (catálogo, ficha 015) |
| D-3 | Sprites decorativos, sin textos de gesto |
| D-4 | Registro, selección, pintura y adaptador separados; pantallas sin recursos; Lab fuera de producción; selección y prioridades puras en la capa visual, no en el dominio. Lógica del expediente separada; APIs conservadas; sin abstracciones innecesarias |
| D-5 | Carga estática de `sofi-blink` y diferida de gags y flujo (§7); `talking` y `uncertain` quedan pendientes de un experimento. +2 kB gzip de CSS de entrada es un objetivo provisional, no un presupuesto aprobado; el margen de FCP se retiró y EX4 fija los criterios con comparaciones A/B (§7, §11.2) |
| D-6 | `rolling` solo tras el experimento, que mide por separado el arranque inicial y las vistas diferidas (§7) |
| D-7 | Velocidad centralizada y reaplicada |
| D-8 | Indicador reconocible para quien usa Claude Code: progresión de glifos, ida y vuelta y etiquetas dinámicas, con acabado de píxel de Sofi. Sin logotipos ni código de Claude. Las etiquetas reflejan estados reales y respetan el movimiento reducido |
| D-9 | `system \| reduce \| full`, reversible, con `system` por defecto |
| D-10 | Verificación en Chromium, Firefox y WebKit |
| D-11 | `SoundProvider`, dueño único del ciclo de vida del `AudioContext` compartido. Voz y efectos lo usan sin cerrarlo. Sin `close()` simulado ni concentrador. Detalle: §11.1 |
| D-12 | `onSpeakingChange` en `SofiSpeech` |
| D-13 | Se retira `src/styles/sprites/_index.scss` |

### 11.1 Audio (D-11)

- **`SoundProvider`:**
  - crea el `AudioContext` dentro del primer gesto que desbloquea el sonido;
  - lo cierra al desmontarse, después de liberar voz y efectos.
- **`createSpeechAudio`, extensión compatible:**
  - una opción nueva, `context: () => AudioContextLike`, para un contexto prestado: `prepare()` lo usa y `dispose()` no lo cierra;
  - sin esa opción, `createContext` sigue creando un contexto propio que `dispose()` cierra, como hoy.
- **`createEffectsAudio`:**
  - siempre con contexto prestado;
  - un efecto a la vez;
  - nunca mientras habla la voz;
  - nunca en seguridad, salida rápida ni estados sensibles;
  - los de `memory-wipe`, solo tras el borrado efectivo (spec §9).
- **Licencias:** un manifiesto JSON junto a los archivos y una prueba de contrato. No se elige ningún sonido en este plan.

### 11.2 Decisiones posteriores (2026-10-27)

| Tema | Decisión |
|---|---|
| WebP | Solo las tiras de Sofi se excluyen de la incrustación en base64 de Vite. Se verifica la carga y la reproducción en conexiones lentas (§7, §10) |
| Carga de `talking` y `uncertain` | Pendiente de un experimento comparativo: diferida, precarga contextual y carga inicial con posible loader real. Sin esperas artificiales; no depende de Jev (§7) |
| D-15 | `009` es dueña de la interfaz «Borrar todos mis datos», que reutiliza `003` y el contrato visual de `008`. Su contrato exige verificar el borrado efectivo antes de anunciar el éxito o activar `memory-wipe` (§5.2) |
| D-16 | Con movimiento reducido, `memory-wipe` muestra la pose aterrorizada estática hasta que termina la confirmación funcional del borrado. Después vuelve a neutral, sin animación ni temporizador (§4.4). El borrado restablece la preferencia a `system`, pero la reacción mantiene el modo con el que empezó hasta el fin de la confirmación (§5.2) |
| Design Lab | Sigue siendo experimental: sus prototipos no son aprobaciones visuales (§8) |
| Línea base de carga | EX1 sustituye a E2 como línea base reproducible. E2 conserva sus cifras históricas y consta que no se reprodujo (§2; `008-verification.md`) |
| Margen de FCP | Se retira +50 ms como umbral automático. FCP, LCP y disponibilidad funcional siguen siendo relevantes, y EX4 fija sus criterios definitivos con comparaciones A/B (§7) |
| gzip del CSS de entrada | `gzipSync` de Node con opciones fijas. Referencia inicial: 9780 B. El margen de +2 kB sigue siendo provisional (§7) |
| Comparaciones entre versiones | Protocolo A/B intercalado (ABBA/BAAB) con calentamiento predefinido y equivalente, todas las muestras conservadas, análisis de diferencias emparejadas con su incertidumbre y la misma configuración para las dos versiones (§7) |

### 11.3 Capa visual pura (2026-11-03)

D-17 a D-22 se aprobaron al cerrar T017–T026 y D-23 al autorizar T032–T034. El código está en `src/components/sofi/visual/` y `src/app/providers/motion.ts`; esta tabla no repite su contenido.

| Decisión | Aprobado |
|---|---|
| D-17 | La retención del primer ciclo es de 3000 ms, solo como valor experimental hasta AV2. Se aplica la excepción del catálogo §6.4 tal cual: únicamente resultados no críticos |
| D-18 | Prioridades de `selectVisual`: salida rápida y `safety_concern` (sin sprite), seguridad no evaluada (estática sobria), borrado efectivo, carga, procesamiento, reacción al resultado y `favoriting`, habla y `uncertain`, reposo. Solo con señales vigentes del catálogo §5, y sin cortar una animación por una señal que su ficha no lista entre sus interrupciones (`talking` no corta `favoriting`; sí cede `uncertain`). La seguridad prevalece sobre el borrado |
| D-19 | El flujo funcional gestiona las señales: retira el resultado cuando lo sustituye una acción de la persona y limpia la pasada terminada ante un nuevo disparador. `selectVisual` no almacena estado de negocio |
| D-20 | Con movimiento reducido, las etiquetas decorativas permanecen fijas salvo cambio funcional |
| D-21 | Copy provisional hasta AV1: `sofing…`, `cooking…` (a los 4000 ms) y `rolling…` |
| D-22 | La página no visible (`hidden`) es una causa de pausa independiente de las demás |
| D-23 | Durante `memory-wipe`, el modo efectivo inicial se captura y se conserva con el único `data-motion` de `<html>`, aunque el borrado restablezca la preferencia a `system`. Al terminar o interrumpirse la confirmación se aplica la preferencia vigente, sin restaurar datos borrados. El proveedor de movimiento no sobrescribe la reacción en curso |

### 11.4 Infraestructura de efectos sonoros (2026-11-04) — propuestas pendientes de aprobación

El plan §11.1 fija las restricciones; estas son las decisiones de implementación que no fijaba, tomadas al hacer T051–T053. El código está en `src/infrastructure/audio/effectsAudio.ts`, `src/app/providers/SoundProvider.tsx` y `src/assets/sofi/effects/`. **Son propuestas:** la autora las aprueba (o las corrige) por su número.

| Decisión | Propuesta |
|---|---|
| D-24 | `createEffectsAudio({ context, effects, voice })` registra los efectos por identificador y expone `prepare()` (dentro del gesto: pide y reanuda el contexto prestado y descarga los archivos), `play(id)`, `setSituation(...)`, `disable()` y `dispose()`. `play` no devuelve nada que esperar y nunca lanza, para no condicionar jamás lo que ocurre en la aplicación. Sin `prepare()` o tras `disable()`/`dispose()` no suena nada. No hay identificadores ni archivos: no se ha elegido ningún sonido |
| D-25 | Un efecto a la vez: uno nuevo sustituye al que suena (no se encola ni se descarta el nuevo) |
| D-26 | La voz manda: un efecto no suena mientras la voz suena (`getStatus() === 'playing'`) y no queda en cola; si la voz empieza mientras suena uno, el efecto se corta |
| D-27 | `setSituation({ safety, quickExit, sensitive, dataErased })`: con seguridad, salida rápida o estado sensible no suena ningún efecto y el que suena se corta en el acto. `dataErased` habilita los efectos marcados `afterErasure` (los de `memory-wipe`), que sin él no suenan; seguridad y salida rápida prevalecen sobre el borrado, como en D-18 |
| D-28 | `SoundProvider` gana la prop `createEffects({ context, voice })`, sin valor por defecto, y libera los efectos y la voz antes de cerrar el contexto compartido. **No** expone los efectos en `SoundContext` ni los conecta a `unlock`, `disable` ni al borrado de datos: eso es T100–T101 |
| D-29 | Manifiesto de licencias en `src/assets/sofi/effects/licenses.json` (`{ "effects": [] }`). Cada entrada: `file`, `title`, `author`, `source` (https), `license`, `licenseUrl` (https), `attribution` (obligatoria con CC-BY) y `verifiedOn` (fecha ISO). Licencias admitidas: `CC0-1.0`, `CC-BY-3.0`, `CC-BY-4.0`, `MIT`, `Apache-2.0` y `LicenseRef-AskSofi-Original` (creado por la autora). Quedan fuera NC, ND, SA, las licencias propias de un sitio y las desconocidas. Ningún campo puede mencionar Myinstants ni Nintendo. El contrato está en `effectsLicenses.test.ts` |

**Pregunta abierta para T100–T101 (y `009`).** Al borrar los datos, `SoundProvider` vuelve al silencio inicial (`subscribeToUserDataCleared` desactiva el sonido). Los efectos de `memory-wipe` solo pueden sonar tras el borrado efectivo (spec §9), con el sonido activado: hay que decidir cómo encajan, porque con el sonido ya desactivado no sonaría ninguno. No se resuelve aquí: `createEffectsAudio` solo garantiza que nunca suenan antes del borrado.

## 12. Riesgos y pendientes

- **Firefox y WebKit:** la puerta A0 se superó con pruebas de concepto (§2). Falta confirmarlo con la implementación (§10). Safari de macOS y de iOS corresponde a `015`.
- **Un ámbito de movimiento por documento:** los proveedores anidados no están soportados.
- **Especificidad:** la rama forzada del mixin la pierde (§4.2), así que hay que revisar el Lab en modo forzado.
- **Velocidad:** entre el nacimiento de una animación y su `animationstart` va a 1×; se revisa en el Lab con velocidades distintas de 1×.
- **Listeners globales:** los gags escuchan en `document` y `window` mientras están montados, solo en escena tranquila (E6).
- **D-3:** cambia comportamiento y pruebas aprobados en `004`.
- **Tiras fuera de la incrustación:** más peticiones pequeñas (al decodificar `memory-wipe`, sus 12 tiras frente a 3 en E12). E13 no encontró empeoramiento con Slow 4G + CPU 4× y dejó una condición: precargar con `crossOrigin` las tiras usadas como máscara. Solo se midió ese perfil y solo en Chromium; el resto, en las pruebas de §10.
- **Carga de `talking` y `uncertain`:** pendiente del experimento (§7). Con un único chunk, lo estático entra en el CSS de entrada de toda la app: el criterio de la spec «cada pantalla carga solo el CSS y las tiras que usa» se evalúa con sus resultados.
- **Sin latencias reales de Jev:** quedan pendientes el anti-destello y la calibración del límite de D6 (§7).
- **Interfaz «Borrar todos mis datos»:** la asume `009` (D-15), que aún no tiene spec. Hasta entonces el contrato de esta feature se prueba con simulaciones. `009` tendrá que emitir el borrado efectivo y el fin de su confirmación funcional, que es lo que devuelve a Sofi a neutral con movimiento reducido (D-16). Además, el borrado efectivo hay que verificarlo antes de anunciar el éxito: `clearUserData()` hoy no lo confirma (§5.2).
- **Modo efectivo durante `memory-wipe`:** resuelto con `holdMotion` (D-23), sin otro ámbito de movimiento. Queda confirmarlo en Firefox y WebKit (T046, T073) y que `009` lo llame antes de borrar.

## 13. Documentación cambiada

- **En el commit `19a6da9`:** `animation-catalog.md`, `asset-provenance.md`, `AGENTS.md`, `roadmap.md` §11, `tech-stack.md` §45 y `008-spec.md`.
- **Sin commit todavía:**
  - catálogo: ficha 015, §7.2, área de uso de 015 y reparto de `009` (§10);
  - `tech-stack.md` §44 (tres modos, ámbito en `<html>`, mixin y PostCSS limitado) y §46.1 (módulos dueños, tiras fuera de la incrustación y verificación con conexión lenta);
  - `roadmap.md` §12 (borrado total en `009`);
  - `008-spec.md` (§7, §11, criterios y riesgos, dependencias, fuera de alcance y mediciones);
  - este plan (`008-plan.md`), nuevo y aprobado, y `008-tasks.md`, nuevo y aprobado el 2026-10-27.

## References

- `spec/features/008-sofi-character/008-spec.md`
- `spec/features/008-sofi-character/008-tasks.md`
- `spec/features/008-sofi-character/008-verification.md` (resultados y evidencias de la implementación; se crea con el primer hito)
- `spec/constitution/art-direction/sofi/animation-catalog.md`, `asset-provenance.md`
- `spec/constitution/tech-stack.md` §21, §42, §44–46.1, §48.8, §59, §64
- `spec/constitution/jev.md`
- `spec/constitution/roadmap.md` §11–12
- `spec/features/003-local-persistence/003-plan.md` (`clearUserData`)
- `spec/features/004-partner-profile-&-onboarding/004-plan.md` §5–6
- `spec/features/006-jev-integration/006-plan.md` §5
- `spec/features/007-ask-sofi-chat/007-spec.md`
- `AGENTS.md`
