# 008 — Sofi Character & Motion — Tasks

## Status

Approved — 2026-10-27. Ningún bloque está abierto: la implementación empieza con T001 cuando la autora lo indique.

## Cómo leer este desglose

- **Tarea (`T###`):** trabajo del agente. Los bloques A–D son los del plan (`008-plan.md`, «Approach»); el cierre va aparte.
- **Hito:** punto de control explícito, de tres tipos. Un hito solo se marca con su evidencia registrada en `008-verification.md`, fuente única de resultados y evidencias de esta feature (se crea con el primer registro, EX1). Las decisiones y aprobaciones no se copian allí: permanecen en su fuente de verdad (spec, plan, `art-direction/README.md`) y la verificación solo remite a ellas.
  - `VT#` — verificación técnica. La ejecuta el agente.
  - `EX#` — experimento de rendimiento o carga, con el protocolo de plan §7. El agente mide; cuando se indica, decide la autora con las cifras.
  - `AV#` — aprobación visual en el Design Lab, con la numeración de plan §9. Solo la autora la da, de forma expresa, y se registra en su fuente de verdad (plan §8). **Ver un prototipo funcionando no es una aprobación:** `PreviewFlow`, lo marcado con `LabProv`, las composiciones de resultados y los fotogramas provisionales del Lab no son referencia vinculante.
- **Ciclo:** lógica pura en RED → GREEN (plan §10): una tarea escribe la prueba y la siguiente implementa lo mínimo. Una tarea de implementación no se marca hasta que pasen las pruebas de su pareja. Lo puramente visual no exige prueba primero (`tech-stack.md` §42.1), pero sí la comprobación indicada.
- **Parada:** ante una incompatibilidad del mecanismo de movimiento (plan §2 y §4), un conflicto entre spec y código, o una ambigüedad visual en los assets, se detiene el bloque y se informa antes de ampliar el alcance de ningún mecanismo (plan, «Approach»; `tech-stack.md` §46.1).
- **Lo manual** (audio real, lectores de pantalla, dispositivos de `015`) no se da por hecho: se registra como pendiente.
- Sin llamadas reales a Jev. Sin commit ni push salvo petición expresa.

### Mapa de hitos

| Hito | Qué cierra | Tras | Decide |
|---|---|---|---|
| EX1 | Línea base y dispersión de la medición | T001 | Agente |
| VT1 | Integridad de los 14 recursos. **Obligatorio antes de A2 y A3**, y puerta de todo lo posterior (catálogo §10) | T002–T008 | Agente |
| VT2 | La transformación PostCSS sobre los módulos dueños reales | T009–T016 | Agente |
| VT3 | Adaptador con los controladores reales en jsdom: limpieza y causas de pausa | T035–T042 | Agente |
| VT4 | D-1/D-9 con la implementación en los tres motores (hosts existentes) | T043–T046 | Agente |
| VT5 | Observaciones de composición reproducidas o descartadas | T072 | Agente |
| VT6 | Movimiento completo (14 recursos), velocidad, ciclo y gags en navegador, con los anfitriones del Lab ya construidos | T073–T076 | Agente |
| AV1–AV9 | Aprobaciones visuales de plan §9 | Propuestas de B | **Autora** |
| EX2 | `rolling` en el arranque (D-6) | VT1, T028 | **Autora**, con cifras |
| EX3 | Carga de `talking` y `uncertain` | VT1, T028 | **Autora**, con cifras |
| VT7 | Producción: carga selectiva, tiras caídas, conexión lenta | Bloque C | Agente |
| VT8 | Destellos de `error` y WCAG 2.2.2 | AV3, AV4, T082–T083 | Agente |
| EX4 | Objetivos provisionales tras integrar | Bloque C | **Autora**, con cifras |

---

## Bloque A — Base técnica (sin aprobaciones visuales)

### A0. Puerta de navegadores y línea base

- [x] **A0** — Puerta Firefox/WebKit superada el 2026-10-27 con pruebas de concepto (plan §2). Su confirmación con la implementación son VT4 y VT6.
- [ ] **T001** — Crear el arnés de medición del protocolo de plan §7 como script versionado en `scripts/`: build en carpeta temporal y `vite preview`; perfiles CDP sin limitar, Fast 4G + CPU 4× y Slow 4G + CPU 4×; caché fría; mediana de 5; FCP, LCP, bytes transferidos, CSS de entrada y peticiones de tiras por pantalla. **Sin dependencias nuevas** (usa las ya instaladas, como Playwright) y **sin ejecución automática**: no se engancha a `build`, a scripts `pre`/`post` ni a CI; solo se invoca a mano (a lo sumo una entrada en `package.json`, como `verify:bundle`). Sus funciones puras (mediana, dispersión) llevan prueba. Se valida reproduciendo E2 sobre el HEAD actual dentro de su dispersión.
- [ ] **EX1** — Línea base, **antes de T004** (primer cambio que afecta a la build): medir el HEAD actual y repetir la mediana de 5 las veces necesarias para obtener su dispersión. Con ella se confirma o se corrige el margen provisional de +50 ms de FCP y se anota el CSS de entrada de partida (plan §7; E1, E2). Crear `008-verification.md` con este primer registro de cifras y dispersión.

### A1. Recursos (spec §1; `tech-stack.md` §46.1)

Fuentes locales comprobadas al preparar este desglose: repositorio de spritesheets en `../spritesheets/spritesheet` (commit `17aca4f` presente) e informes de correcciones en `../spritesheets/auditorias`. Los ZIP siguen en `spec/features/007-ask-sofi-chat/`, sin versionar.

- [ ] **T002** — Inventario previo (catálogo §1, §13): extraer los 13 ZIP en una carpeta nueva y vacía **fuera del repositorio**, listar su contenido y contrastarlo con el catálogo §3 (14 recursos; `001` sin ZIP; `007` inexistente). Comprobar también que el `_sprite.scss` de todos los ZIP es el mismo y que cada controlador trae sus tipos. Comunicar ausencias o discrepancias **antes** de integrar; no sustituir nada en silencio. No integra nada.
- [ ] **T003** — Verificar los ZIP: SHA-256 de los siete actualizados (002, 003, 005, 008, 012, 013, 015) frente al cierre del informe de correcciones; por contenido, frente a los recursos fuente de `17aca4f`, los seis restantes (004, 006, 009, 010, 011, 014). Registrar el resultado en `008-verification.md`.
- [ ] **T004** — Integrar en `src/styles/sprites/` (§46.1, paso 1): `_sprite.scss` de los ZIP, parciales, tiras y controladores con sus tipos, tal cual. Se actualizan `sofing` y `rolling`; `sofi-blink` se conserva. Sin reprocesar ni tocar el arte. Comprobar que `format`, `lint` y `typecheck` no reescriben ni rechazan lo importado (Prettier ya ignora la carpeta; ESLint solo mira `.ts/.tsx`).
- [ ] **T005** — Retirar `src/styles/sprites/_index.scss` (D-13) y comprobar que nada lo importa.
- [ ] **T006** — Módulos dueños, lote 1, en `src/components/sofi/sprites/`: `sofi-blink` y los recursos de flujo (`sofing`, `rolling`, `talking`, `favoriting`, `needs-context`, `error`, `uncertain`, `memory-wipe`). Cada `<id>.module.scss` es el único `@use` relativo de su parcial; cada `<id>.ts` exporta la clase y las URL de sus tiras con el `import.meta.glob` ansioso limitado a su prefijo (plan §5.4). Nunca un glob central. Si un parcial referencia una tira fuera de su prefijo, se informa antes de seguir.
- [ ] **T007** — Módulos dueños, lote 2: los gags `poking`, `are-u-still-here` e `i-see-you`, igual que T006. Sus controladores no se importan aquí: los carga `useSofiController`.
- [ ] **T008** — Módulos dueños, lote 3: `eureka` y `suspicious`, que solo importará el Lab (spec §2).
- [ ] **VT1** — Integridad de los recursos: cada recurso original importado (tiras, parciales, mixin y controladores; `001` sin ZIP) es idéntico por contenido a su fuente en `17aca4f`; ningún fotograma alterado; `git status` muestra solo recursos integrados y los ZIP siguen sin versionar; `asset-provenance.md` conserva commit de origen y remisión al informe. Registrar la evidencia en `008-verification.md`. **Sin VT1 no se empieza A2 ni A3** (catálogo §10).

### A2. Movimiento (D-1, D-2, D-9; plan §4)

Requiere VT1.

- [ ] **T009** — RED del campo `motion` de las preferencias: `system | reduce | full`, valor por defecto `system`, `z.catch` ante un valor corrupto, sin cambiar de versión; `clearUserData` lo devuelve a `system` (hoy borra todo el espacio de nombres: la prueba lo confirma).
- [ ] **T010** — GREEN en `preferencesStorage`.
- [ ] **T011** — RED del estado efectivo y su aplicación: los seis modos del plan §4.1 en `useReducedMotion`; `data-motion` en `<html>` (no en un `div`), un único ámbito por documento; `main.tsx` lo aplica antes del primer render, como el tema; `src/test/setup.ts` limpia `dataset.motion` entre pruebas.
- [ ] **T012** — GREEN. `MotionPreferenceProvider` conserva su API `value`; los consumidores actuales (`SofiSpeech`, desplazamientos, retratos) no cambian. Adaptar al ámbito único los usos del Lab (`DesignLab.tsx`, `PreviewFrameRoot.tsx`, `ProfileFrameRoot.tsx`) y sus pruebas. Seguir el patrón de `ThemeProvider`.
- [ ] **T013** — RED de `u.reduced-motion` (plan §4.2): compilar el mixin con Sass y comprobar las dos reglas (`@media … reduce` con `:where(:root:not([data-motion='full']))`, y `:where(:root[data-motion='reduce'])`), sin añadir especificidad.
- [ ] **T014** — GREEN del mixin. Revisar en el Lab, en modo forzado, los 12 módulos de la app que lo usan: la rama forzada pierde el `(0,1,0)` que tenía (plan §12). Capturas antes/después de los que cambien.
- [ ] **T015** — RED de `scripts/spriteReducedMotion.ts` con `preprocessCSS` en entorno `node` (plan §10, punto 7): alcance por ruta (solo `src/components/sofi/sprites/`); las cuatro reglas de la tabla de plan §4.3; fallo de build ante otras formas de media, selectores `html`/`:root`/`body` dentro de un parcial y reglas anidadas; los parciales no se modifican.
- [ ] **T016** — GREEN: plugin en línea y sin dependencias, registrado en `vite.config.ts`.
- [ ] **VT2** — Compilar los 14 módulos dueños reales con el plugin: solo ellos son alcanzados, los parciales quedan intactos y las reglas coinciden con plan §4.3. Registrar en `008-verification.md`. Si algún parcial rompe el build o la tabla, **parar** (regla de parada).

### A3. Capa visual pura (D-4; plan §5)

Requiere VT1. Todo en `src/components/sofi/visual/`, sin React ni archivos, salvo el registro. Las pruebas de tabla se escriben antes que el código (plan §5.2).

- [ ] **T017** — RED de `presentationGate` con reloj falso (plan §5.3): presentar/esperar según tipo de resultado, fin del primer ciclo, tiempo desde la llegada, límite y estado efectivo de movimiento. Solo `interpreted` y `needs_context` esperan; todas las exclusiones del catálogo §6.4 presentan en el acto y se prueban una a una; la operación nunca se retrasa. El límite entra como parámetro provisional, marcado como tal (AV2).
- [ ] **T018** — GREEN.
- [ ] **T019** — RED de `visual/select`, selección: tabla del catálogo §5 y jerarquía §6.1. Incluye: `talking` por `speaking` y no por `asking`; `uncertain` usa 014; `interpreted` en reposo en producción (`eureka` y `suspicious` solo con la marca del Lab); `safety_concern` sin sprites; consulta del estado actual al terminar una pasada única, sin cola.
- [ ] **T020** — GREEN.
- [ ] **T021** — RED de `visual/select`, interrupciones: matriz del catálogo §6.3, y el contrato del borrado total (D-15, D-16): dos señales, borrado efectivo (inicia `memory-wipe`) y fin de su confirmación funcional (vuelve a neutral). Nada espera a la animación; salida rápida sin animación; `memory-wipe` nunca en salida rápida ni sin borrado efectivo.
- [ ] **T022** — GREEN.
- [ ] **T023** — RED de `visual/ambient`: causas de pausa simultáneas (Sofi ocupada, otro gag, escritura o interacción, estado sensible); `pause()`/`resume()` solo al pasar de vacío a no vacío y al revés; la reanudación de una causa no anula las demás; un solo gag activo.
- [ ] **T024** — GREEN.
- [ ] **T025** — RED de `activityLabels`: calendario de etiquetas a partir del estado real; al terminar la operación dejan de indicar actividad, también durante la retención del primer ciclo. El copy entra como datos provisionales (AV1).
- [ ] **T026** — GREEN.
- [ ] **T027** — RED de la integridad del registro (plan §10, punto 5): 14 recursos con el tipo de reproducción del catálogo §3; prefijos de tira existentes en `src/styles/sprites/`; poses reducidas válidas; clase de pasada única donde la indique el parcial; tiras usadas como máscara declaradas (hoy `memory-wipe-dissolve`, con `crossOrigin`); el registro de producción no declara cargadores de `eureka` ni `suspicious`.
- [ ] **T028** — GREEN de `visual/registry`: cargadores `import()` de los módulos dueños y tabla de recursos. Pasa a él el catálogo de estáticas (único sitio con rutas, `004-plan.md` §6).
- [ ] **T029** — RED de `visual/rates`: 1× por defecto, un factor por recurso en un único lugar, sobrescritura solo de sesión (la usa el Lab), sin duraciones de los parciales copiadas a JS.
- [ ] **T030** — GREEN.
- [ ] **T031** — `sofiVisuals.ts` queda en la correspondencia estados del expediente → intenciones; `visualFor` y sus pruebas de `004` se conservan sin cambio de comportamiento.
- [ ] **T032** — RED del modo efectivo durante `memory-wipe` (plan §5.2): el borrado restablece la preferencia a `system`, pero la reacción mantiene el modo con el que empezó hasta el fin de la confirmación; no restaura la preferencia ni los datos. Cubre los tres modos de entrada.
- [ ] **T033** — GREEN. El mecanismo se decide aquí (p. ej. aplazar la aplicación del valor restablecido al `<html>`, plan §5.2). Si exige algo distinto de un único `data-motion` por documento, **se propone a la autora antes de implementarlo**. Su prueba en los tres motores va en T046 y T073.
- [ ] **T034** — Registrar en `008-plan.md` §5.2 la remisión a los módulos del contrato (intenciones y señales de borrado) para que `007` y `009` los consuman, sin copiar su contenido.

### A4. Pintura y controladores (plan §5.4–5.5, §6)

- [ ] **T035** — RED de `SofiSprite`, carga: mantiene el fotograma de `sofi-blink` hasta que carga el módulo dueño y se decodifican las tiras; conserva la estática si falla; aplica la clase del recurso solo con las tiras decodificadas; precarga con `crossOrigin='anonymous'` las tiras de máscara declaradas; decorativo (`aria-hidden`, sin `role="img"`).
- [ ] **T036** — RED de `SofiSprite`, ciclo: pasada única; `playbackRate` sobre el subárbol, reaplicado en `animationstart`; `onFirstCycle` y `onEnd`; degrada sin velocidad ni eventos de ciclo cuando no hay Web Animations (jsdom). Con Web Animations simuladas; el comportamiento real va en VT4 y VT6.
- [ ] **T037** — GREEN de `SofiSprite` (`src/components/sofi/SofiSprite/`).
- [ ] **T038** — `SofiPortrait`: gana la propiedad `animation`, usa el módulo dueño `sprites/sofi-blink` en lugar de importar el parcial y conserva recorte, contorno y tamaño. Es el control de E11: debe dejar de fallar con `full`.
- [ ] **T039** — RED de `SofiSpeech.onSpeakingChange` (D-12): avisa solo cuando cambia el booleano; el estado por carácter no provoca re-render del consumidor; el contrato actual de `onStateChange` no cambia.
- [ ] **T040** — GREEN.
- [ ] **T041** — RED de `useSofiController(kind, host, opciones)` con los controladores reales: carga diferida y sin modificar; monta solo con escena tranquila, estado efectivo no reducido, anfitrión montado y tiras decodificadas; destruye en la limpieza, también con montar–destruir–montar de StrictMode; pasa el umbral de inactividad (no el del controlador) y la velocidad con `setRate`; agrega las causas de `visual/ambient` también con `attachPoking`; pasar a reducido lo destruye. Las escuchas y los temporizadores se cuentan con instrumentación instalada por la propia prueba (envoltorio de `addEventListener`, `setTimeout` y `setInterval` en el entorno de prueba), incluido el montar–destruir–montar de StrictMode. No se modifica ni se instrumenta producción.
- [ ] **T042** — GREEN en `src/components/sofi/useSofiController.ts`.
- [ ] **VT3** — Con los controladores reales (no simulados) en jsdom: al desmontar, también con StrictMode, no quedan escuchas, observadores, temporizadores pendientes, capas ni atributos; con causas simultáneas la reanudación no anula las demás. Se cuentan escuchas y **temporizadores** (E6 no midió estos últimos, plan §2, «Límites») con la instrumentación de T041. Límite declarado: no es un navegador; la comprobación en navegador va en VT6. Registrar en `008-verification.md`.
- [ ] **T043** — RED del contrato de build (amplía `production-build.spec.ts` y un contrato estático, plan §10): las tiras de Sofi salen como archivos y no se incrustan en CSS ni JS; el CSS de entrada solo lleva los recursos de producción; keyframes únicos; el CSS de los gags va después del de `sofi-blink` (plan §4.4); los controladores no están en el chunk de entrada; la entrada solo referencia tiras de recursos estáticos y ninguna de `eureka` ni `suspicious` sale en la build; ningún módulo importa parciales fuera de su dueño ni `_index.scss`; no hay sprites en `src/styles/globals`. Los objetivos provisionales de plan §7 se registran en cada build sin ser todavía umbral.
- [ ] **T044** — GREEN: `build.assetsInlineLimit` como función en `vite.config.ts`, `false` para `src/styles/sprites/` y `undefined` para el resto (plan §7).
- [ ] **T045** — Playwright: proyectos de Firefox y WebKit **solo para las pruebas de movimiento** (T046, T073, T074); todo el resto de E2E (T075, T076, T091 y los existentes) sigue solo en Chromium (D-10, plan §10). Instalarlos solo si faltan, sin tocar dependencias. Ajustar el job `browser` de `.github/workflows/ci.yml` para instalar y ejecutar esos tres motores únicamente en las pruebas de movimiento.
- [ ] **T046** — Pruebas de movimiento de navegador sobre los anfitriones que ya existen en el Lab (`SofiPortrait`/`sofi-blink`, `Spinner`, `Loader`, `Ticker`): equivalencia de los seis modos (sistema normal o reduce × sin atributo, `reduce`, `full`) con capturas; `full` activa las animaciones aunque el sistema pida reducir; el modo efectivo de T033.
- [ ] **VT4** — D-1/D-9 con la implementación: T046 verde en Chromium, Firefox y WebKit; el `SofiPortrait` de T038 pasa con `full`; en los 12 módulos de la app con el mixin, todas las reglas reducidas excluyen `full`. Registrar. Una incompatibilidad **detiene el bloque A** y se informa. Registrar en `008-verification.md`.

### A5. Infraestructura de audio (D-11; plan §11.1)

- [ ] **T047** — RED de `createSpeechAudio`: opción `context: () => AudioContextLike`; con contexto prestado, `prepare()` lo usa y `dispose()` no lo cierra; sin la opción, `createContext` crea uno propio que `dispose()` cierra, como hoy (`speechAudio.test.ts` sigue verde).
- [ ] **T048** — GREEN.
- [ ] **T049** — RED de `SoundProvider`: crea el `AudioContext` dentro del primer gesto que desbloquea el sonido, no antes ni con el sonido desactivado, y lo cierra al desmontarse tras liberar voz y efectos.
- [ ] **T050** — GREEN.
- [ ] **T051** — RED de `createEffectsAudio` con `src/test/fakeAudio.ts`: contexto siempre prestado; un efecto a la vez; nunca mientras habla la voz; nunca en seguridad, salida rápida ni estados sensibles; los de `memory-wipe` solo tras el borrado efectivo y sin condicionarlo; sin sonido activado no suena nada.
- [ ] **T052** — GREEN.
- [ ] **T053** — Manifiesto JSON de licencias junto a los archivos de efectos y prueba de contrato (cada archivo con licencia registrada, compatible con publicar; ningún audio de Myinstants ni de Nintendo). No se elige ningún sonido aquí.
- [ ] **T054** — Cierre del bloque A: formato, lint, typecheck, tests y build. Revisar los criterios de la spec que se puedan verificar en este bloque y registrar los resultados en `008-verification.md`.

---

## Bloque B — Design Lab

Depende de A. Se amplía `Motion & Sound` sin crear un segundo laboratorio. Los controles del Lab no alteran por sí solos las preferencias públicas (catálogo §8). Todo lo construido aquí es un **prototipo hasta su `AV#`**.

### B1. Inspector y escenarios

- [ ] **T055** — Antes de cada capacidad del inspector que se adapte, releer la parte correspondiente del playground del repositorio de spritesheets (`playground/`, solo lectura; ese repositorio no se modifica) y contrastarla con la tabla de plan §8. Registrar las divergencias, si las hay, en `008-verification.md` sin presuponer que lo demás sea reutilizable.
- [ ] **T056** — RED del estado de sesión del inspector (`motionLab.ts`): velocidad, pausa, tamaño, fondo y pixelado por recurso, conservados al cambiar de entrada, sin tocar preferencias públicas ni las velocidades de producción.
- [ ] **T057** — GREEN.
- [ ] **T058** — Inspector de los 14 recursos: selector y ficha (nombre, intención, bucle/pasada/máquina, estado de activación); reproducir, pausar, reiniciar y comparar con 1×; velocidad individual sobre todas las capas y el controlador; bucle frente a pasada única; reinicio por nuevo evento; cancelación a mitad de transición. Reutiliza `LabRange`, `LabChoice`, `LabCheck` y `LabStage`.
- [ ] **T059** — Tamaño, fondos y pixelado, y contenedores representativos: escenario entero, insignia, busto apoyado en borde, layouts ancho y estrecho, ambos temas.
- [ ] **T060** — Línea de tiempo por fotograma con `getKeyframes()`, miniaturas y desplazamiento manual. 4.4 conserva `BLINK_TIMELINE` y su test de contrato.
- [ ] **T061** — Peso y memoria decodificada por recurso (sirve a EX1–EX4).
- [ ] **T062** — Modos de movimiento en el Lab: sistema, forzado `reduce` y `full`; se ve la pose estática correcta y no sobrevive ningún controlador.
- [ ] **T063** — 4.3 pasa a usar `talking` y `onSpeakingChange`; desaparece el hueco «Sprite hablando · pendiente 008».
- [ ] **T064** — Escenarios de eventos del contrato y secuencias (catálogo §8): `speaking`/pausa/«Ver todo», petición pendiente o completada, falta de contexto, respuesta incierta, favorito guardado, toque secuencial, puntero, inactividad y despertar, borrado efectivo y fin de su confirmación, salida rápida; `blink → talking → blink`, `processing → resultado`, `needs-context → uncertain`, `favoriting → blink`, `memory-wipe → neutral` y prioridades de gags.
- [ ] **T065** — Preview: sustituir los fotogramas provisionales por los recursos del catálogo §5 conservando su layout, y demostrar `presentationGate` con el primer ciclo, el límite ajustable y velocidad acelerada, incluidos error, seguridad y movimiento reducido. Sigue siendo un prototipo: no fija el flujo de resultados de `007`.
- [ ] **T066** — Gags en el Lab: dos candidatas de ubicación para la consulta en reposo y el expediente, inactividad ajustable (150 000 ms provisional, plan §6) y versión reducida propuesta.
- [ ] **T067** — Indicador de actividad, evaluación previa: si se extiende `Spinner` o `Loader` o hace falta un componente nuevo (spec §4). Registrar la decisión y su motivo en `008-plan.md` (es una decisión de implementación, no una evidencia); si es nuevo, se muestra en el Lab con pruebas (`AGENTS.md`).
- [ ] **T068** — Indicador y etiquetas en el Lab: dos o tres variantes de formas de píxel y ritmo (120 ms solo como punto de partida, D-8), sin logotipos ni código de Claude, y copy de etiquetas ligado a estados reales. Con movimiento reducido, quieto.
- [ ] **T069** — Pose reducida propuesta de cada recurso (la del parcial, D-2; `memory-wipe` fijada por el catálogo). Una desviación solo puede usar otro recurso o fotograma existente.
- [ ] **T070** — Pausas de `talking` propuestas (boca quieta o `blink`) y el paso `blink → talking`.
- [ ] **T071** — Control de preferencia de movimiento: propuestas de ubicación y diseño (cabecera y portada junto a `ThemeSwitch` son solo el punto de partida), sin escribir preferencias públicas desde el Lab.
- [ ] **T072** — Composición (spec §11): reproducir en componentes reales las observaciones de la auditoría (contorno oscuro de `memory-wipe`, base que se levanta, base de `sofing`, cara de `are-u-still-here`, desbordamientos por diseño). Anotar cuáles se reproducen (VT5). Solo esas pasan a AV8; el contorno de `memory-wipe` no se toca por defecto.
- [ ] **VT5** — Composición: cada observación consta en `008-verification.md` como reproducida (con captura) o descartada (con captura).
- [ ] **T073** — Playwright de movimiento, en Chromium, Firefox y WebKit: equivalencia de los seis modos para los 14 recursos con capturas; `full` con el sistema en reducir; poses estáticas; sin animaciones vivas ni controladores tras pasar a reducido; el modo efectivo de `memory-wipe` (T033).
- [ ] **T074** — Playwright de velocidad y ciclo, en los tres motores: velocidad común sin deriva en todas las capas y pseudoelementos y reaplicada en `animationstart`; pasada única; `animationiteration` del primer ciclo a velocidad acelerada. Sin duraciones copiadas a JS.
- [ ] **T075** — Playwright de limpieza de gags en Chromium, sobre los anfitriones del Lab ya construidos (sin anfitrión de prueba aparte): escuchas por CDP, observadores, capas y atributos tras desmontar, y temporizadores pendientes (envoltorio de `setTimeout`/`setInterval` inyectado por la prueba con `addInitScript`), incluido el montar–desmontar–montar de StrictMode; un solo gag activo. No se instrumenta producción.
- [ ] **T076** — axe y responsive en las secciones nuevas del Lab, con texto ampliado al 200 %, ambos temas y los anchos del Lab.
- [ ] **VT6** — T073–T076 en verde en el entorno indicado de cada una; confirmación completa de D-1/D-9 con 14 recursos. Registrar evidencia y límites en `008-verification.md` (WebKit de Playwright no es Safari: `015`).

### B2. Aprobaciones visuales (autora)

El agente presenta cada propuesta con capturas y ejemplos; no marca ningún `AV#`. Cada aprobación se registra **solo** en su fuente de verdad (no en `008-verification.md`): lo visual global en `art-direction/README.md`; el comportamiento de la feature en `008-spec.md` o `008-plan.md` (`AGENTS.md`).

- [ ] **AV1** — Indicador de actividad: formas de píxel, ritmo de ida y vuelta y copy de las etiquetas (T068).
- [ ] **AV2** — Duración y límite del primer ciclo (T065). El valor aprobado es el de la feature; su recalibración con latencias reales es trabajo posterior.
- [ ] **AV3** — Velocidad de producción de cada recurso (T058).
- [ ] **AV4** — Poses reducidas, salvo `memory-wipe`, y versión reducida de los gags (T066, T069).
- [ ] **AV5** — Pausas de `talking` y paso `blink → talking` (T070).
- [ ] **AV6** — Ubicación de los gags e inactividad definitiva de `are-u-still-here` (T066).
- [ ] **AV7** — Ubicación y diseño del control de preferencia de movimiento (T071).
- [ ] **AV8** — Composición, solo de lo que VT5 haya marcado como reproducido. Si no se reproduce nada, consta «sin cambios».
- [ ] **AV9** — Selección de efectos sonoros, **tras T097** (licencias verificadas) y **tras escuchar la autora los efectos reales** en la sección del Lab (T098), con el sonido activado.

---

## Bloque C — Producción

Cada parte espera a la aprobación que le afecta. Si una aprobación cambia el comportamiento de la spec, se actualiza antes la spec y, si procede, el plan y estas tareas (SDD).

### C1. Accesibilidad de los sprites (D-3; sin esperar a ningún AV)

- [ ] **T077** — RED: actualizar las pruebas afectadas a sprites decorativos, sin `role="img"` ni textos de gesto: `sofiComponents.test.tsx`, `DesignLab.test.tsx`, `PropPlaygrounds.test.tsx`, `ProfileSheet.test.tsx`, `ProfileScreen.dialogue.test.tsx`, `ProvisionalConsultation.profile.test.tsx` y `e2e/profile.spec.ts` (plan §5.4).
- [ ] **T078** — GREEN: retirar `role="img"`, el `alt` de `SofiStage` y `MOOD_ALT`. D-3 cambia un comportamiento aprobado en `004`: dejar constancia donde `004` lo describa. Comprobar que cada hecho funcional se anuncia una sola vez desde su componente y que no se añade ninguna región viva.

### C2. Indicador de actividad (tras AV1)

- [ ] **T079** — RED: decorativo, fuera del árbol de accesibilidad; quieto con movimiento reducido; los cambios de etiqueta no se anuncian y el estado accesible es el texto de estado del componente funcional, anunciado una vez; deja de indicar actividad al terminar, también durante la retención del primer ciclo.
- [ ] **T080** — GREEN según la decisión de T067, en `src/components/ui/ActivityIndicator/` si es nuevo, y en el Lab.
- [ ] **T081** — Integrar etiqueta e indicador en `ProcessingState`, sin cambiar su API si es posible; si hay que cambiarla, se consulta. Lo consumen la Preview del Lab y, después, `007`.

### C3. Valores aprobados

- [ ] **T082** — Fijar el límite del primer ciclo (AV2) y las velocidades de producción (AV3) en `presentationGate` y `visual/rates`, con sus pruebas.
- [ ] **T083** — Fijar las poses reducidas (AV4) y las pausas de `talking` (AV5) en el registro, con sus pruebas.

### C4. Expediente y consulta en reposo (tras AV4, AV5 y EX3)

- [ ] **T084** — RED: `talking` se anima solo mientras `SofiSpeech.speaking` es verdadero y muestra la pausa aprobada en las pausas y al terminar; `uncertain` usa 014; el resto de estados conserva sus estáticas; el formulario y su comportamiento no cambian (pruebas de `004` en verde); sin re-render por carácter; con movimiento reducido, rostro estático.
- [ ] **T085** — GREEN. La carga de `talking` y `uncertain` sigue lo que decida EX3.
- [ ] **T086** — Consulta en reposo: usa la capa visual con `sofi-blink`, sin cambiar su layout aprobado.

### C5. Gags (tras AV4 y AV6)

- [ ] **T087** — RED: solo en consulta en reposo y expediente, en la ubicación aprobada; ninguno se activa durante escritura, interacción con controles, habla, procesamiento ni estados sensibles; `poking` no responde al teclado ni recibe foco; `are-u-still-here` no se activa antes del umbral aprobado; sin escuchas globales ni trabajo por movimiento de puntero mientras no puedan activarse; sin escuchas, observadores, temporizadores, capas ni atributos al desmontar, también con StrictMode.
- [ ] **T088** — GREEN con `useSofiController` y `visual/ambient`.

### C6. Preferencia de movimiento (tras AV7)

- [ ] **T089** — RED: control accesible por teclado, `system` por defecto, persistido con `003`, reversible y devuelto a `system` por «borrar todos los datos»; aplicado antes del primer render.
- [ ] **T090** — GREEN reutilizando el Design System; si el componente es nuevo, se muestra en el Lab con pruebas. Prueba de navegador: persiste tras recargar, sin parpadeo de modo.

### C7. Producción en navegador

- [ ] **T091** — Playwright en Chromium: peticiones de WebP por pantalla (solo las tiras de lo que se pinta y ninguna dos veces, también la de máscara); con una tira lenta o caída (`route`) Sofi conserva su representación estática; conexión lenta por CDP (Slow 4G + CPU 4×): las tiras llegan antes de que arranque la animación, esta avanza y `sofi-blink` hace de respaldo entretanto.
- [ ] **VT7** — Producción: T043 y T091 en verde sobre la build final; cada pantalla carga solo el CSS y las tiras que usa (el criterio de la spec, evaluado con las cifras de EX3); cero sprites en estilos globales. Registrar en `008-verification.md`.
- [ ] **T092** — Destellos de `error`: medirlos a la velocidad de producción de AV3 y con la pose de AV4, en claro y oscuro (catálogo §7.2). Documentar el método y el resultado en `008-verification.md`.
- [ ] **T093** — Evaluar WCAG 2.2.2 para cada bucle automático (`sofi-blink`, `sofing`, `rolling` y gags). Si la conclusión es que algún bucle necesita un control de pausa, **se detiene**: es un requisito nuevo y se actualiza antes la spec. Registrar la evaluación en `008-verification.md`.
- [ ] **VT8** — T092 y T093 documentados en `008-verification.md`.

---

## Bloque D — Mediciones y sonido

Va en paralelo, con el arnés de T001. Los experimentos preparan sus variantes en **copias temporales del árbol de trabajo, fuera del repositorio y sin crear ramas**: nada se fusiona salvo la opción que se adopte, con su propia tarea. Las cifras de cada experimento se registran en `008-verification.md`; las decisiones que se deriven, en su fuente de verdad.

### D1. Experimentos de carga y rendimiento

- [ ] **EX2** — `rolling` en el arranque inicial (D-6, plan §7): variantes nada, marcador CSS en línea y `rolling` en línea con precarga; FCP, LCP, disponibilidad funcional (acción principal pintada y clic atendido) y coste (bytes, peticiones, CSS y JS de la entrada, memoria decodificada, CPU). Solo se adopta un loader si la carga supera el umbral de carga perceptible que apruebe la autora y no empeora los objetivos provisionales. **No mostrar ningún loader es una opción válida cuando no existe una espera perceptible:** la variante «nada» puede ser la elegida (catálogo, ficha 003: si la aplicación aparece al instante, no se muestra). **Vista diferida:** consta «no aplicable» hasta que exista la primera vista diferida real; entonces se mide con este mismo protocolo, sin crear una para el experimento.
- [ ] **T094** — Condicional a EX2: implementar la opción adoptada. Si es «nada», no se implementa ningún loader y la tarea se cierra con esa constancia; si hay carga perceptible y `rolling` no cumple, la alternativa ligera del catálogo (ficha 003).
- [ ] **EX3** — Carga de `talking` y `uncertain` (plan §7): diferida, precarga contextual y carga inicial con loader real si la carga es perceptible, sin retraso añadido y sin depender de Jev. Métricas de EX2 más, por pantalla, el tiempo hasta que el recurso está listo al llegar la intención y el tiempo con el respaldo estático visible. Decide la autora y se actualiza la tabla de plan §7. **Desbloquea T085.**
- [ ] **EX4** — Tras el bloque C: objetivos provisionales de plan §7 (CSS de entrada y FCP) frente a EX1, y descargas efectivas de WebP por pantalla con los recursos integrados, registradas en `008-verification.md`. La autora los confirma o corrige; solo entonces pasan a umbral de prueba en `production-build.spec.ts`.
- [ ] **T095** — Medir los renders de `talking` con React Profiler en el expediente: ni el escenario ni el formulario se re-renderizan por carácter.

### D2. Sonido (spec §9; plan §11.1)

- [ ] **T096** — Listar los eventos que admiten efecto (sin seguridad, salida rápida ni estados sensibles; `memory-wipe` solo tras el borrado efectivo) y proponer fuentes candidatas a la autora.
- [ ] **T097** — Verificar las licencias de las candidatas (compatibles con publicar el proyecto; ni Myinstants ni Nintendo) y registrar cada una junto a su archivo candidato. Sin licencia verificada, no hay candidata.
- [ ] **T098** — Sección de efectos en el Lab que reproduce los **archivos reales** de las candidatas (con el sonido activado y el audio preparado dentro de un gesto), para que la autora los escuche y decida en AV9. Los archivos solo los usa el Lab; los no elegidos se retiran tras AV9.
- [ ] **T099** — Tras AV9: integrar los efectos aprobados con su entrada en el manifiesto de T053.
- [ ] **T100** — RED de la conexión de efectos al contrato: respetan la preferencia de sonido, no tapan la voz de `SofiSpeech`, silencio en seguridad, salida rápida y estados sensibles, `memory-wipe` solo tras el borrado efectivo, y sonido y movimiento reducido son preferencias independientes.
- [ ] **T101** — GREEN.

---

## Cierre

El cierre de 008 **no espera a Jev** ni a las features emisoras. Lo que dependa de ellas no se da por verificado ni queda como tarea abierta de esta feature: consta en «Trabajo posterior».

- [ ] **T102** — Formato, lint, typecheck, tests, build y `npm run verify:bundle`. Playwright: las pruebas de movimiento (T046, T073, T074) en Chromium, Firefox y WebKit; el resto de E2E solo en Chromium. Comprobar que la suite no hace llamadas reales y que `git status` no incluye los ZIP.
- [ ] **T103** — Revisar uno a uno los criterios de `008-spec.md` con su evidencia en `008-verification.md`. Un criterio se marca verificado solo con evidencia de su alcance: para los eventos que emiten otras features, el alcance es el contrato probado con simulaciones (spec §2), y la conexión real **no** se da por verificada, sino que consta en «Trabajo posterior». Nada se marca verificado por estar pendiente de otro.
- [ ] **T104** — Actualizar la checklist del catálogo §13 solo con lo realmente verificado; confirmar que `asset-provenance.md` mantiene la procedencia.
- [ ] **T105** — Registrar en `008-verification.md` las comprobaciones manuales pendientes sin darlas por hechas: mezcla real de voz y efectos (AV9 solo cubre la escucha de los efectos), lectores de pantalla, Safari de macOS y de iOS y dispositivos reales (`015`).
- [ ] **T106** — Solicitar a la autora la retirada de los ZIP de `spec/features/007-ask-sofi-chat/`. **No se retiran sin su aprobación expresa**, y no antes de VT1 ni del cierre.
- [ ] **T107** — Actualizar los estados de spec, plan y tasks según la evidencia. Lo que figura en «Trabajo posterior» no retiene el cierre; un criterio propio sin verificar, sí.

## Trabajo posterior

Fuera del alcance y del cierre de 008. No son tareas de este desglose ni llevan casilla: no se marcan, no se dan por verificadas y no mantienen abierta la feature. Cada una tiene responsable y desencadenante; 008 solo deja probado su contrato con simulaciones. Cuando se desencadenen, se tratan según SDD (spec → plan → tasks) en la feature responsable o como revisión de 008 si cambia algún requisito.

| Trabajo | Responsable | Se desencadena con | Trazabilidad |
|---|---|---|---|
| Latencias reales de Jev: retraso anti-destello del loader (solo si lo justifican; hasta entonces no se añade ningún retraso), recalibración del límite de D6 (AV2) y revisión de `PROVISIONAL_SLOW_THRESHOLD_MS` | `006` produce las latencias (`006-plan.md` §5); la autora decide la revisión de 008 | Bloque C de `006` | Spec, «Dependencies» y «Se decide con mediciones»; plan §7 y §12 |
| Reglas de `eureka`/`suspicious`; hasta entonces solo en el Lab y un `interpreted` se representa en reposo | `006` | Desbloqueo de `006` | Spec §2, «Out of Scope» y «Pendiente de `006`» |
| Emitir procesamiento, resultados, errores, seguridad y salida rápida; consumir `presentationGate`, el indicador y las etiquetas | `007` | Su implementación | Spec §2 y «Out of Scope»; plan §5.3 |
| Emitir favorito guardado; interfaz «Borrar todos mis datos» con verificación del borrado efectivo (D-15) y fin de su confirmación (D-16) | `009` | Su spec y su implementación | Spec §2 y «Out of Scope»; plan §5.2 y §12 |
| Safari de macOS y de iOS y dispositivos reales | `015` | Su implementación | Spec, «Out of Scope» |
| Medir `rolling` en una vista diferida (EX2, «no aplicable» hasta entonces) | La feature que introduzca la primera vista diferida | Existencia de esa vista | Plan §7 |

## References

- `008-spec.md`
- `008-plan.md`
- `008-verification.md` (se crea con EX1)
- `spec/constitution/art-direction/sofi/animation-catalog.md`
- `spec/constitution/art-direction/sofi/asset-provenance.md`
- `spec/constitution/art-direction/README.md`
- `spec/constitution/tech-stack.md` §42, §44–46.1
- `spec/constitution/roadmap.md` §11
- `AGENTS.md`
