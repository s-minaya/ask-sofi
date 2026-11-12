# 008 — Sofi Character & Motion — Verification

## Status

En curso. Registrados T001 y EX1 (2026-10-27) y revisados el mismo día con las cuatro decisiones aprobadas de plan §11.2: EX1 como línea base reproducible, sin umbral automático de FCP, `gzipSync` con opciones fijas y comparaciones A/B intercaladas. Registrados también T002 y T003 (2026-11-03): inventario y verificación de los 13 ZIP, sin discrepancias (§3). T004–T008 y VT1 completados (2026-11-03); la incidencia de pruebas de §4.4 está resuelta. A2 (T009–T016 y VT2) completado el mismo día (§5). T017–T026 (capa visual pura, parte 1) completadas el mismo día (§6). T027–T031 (registro, velocidades y estáticas) completadas el mismo día (§7). T032–T034 (modo efectivo durante `memory-wipe`) completadas el mismo día (§8). T035–T038 (`SofiSprite` y `SofiPortrait`) completadas el mismo día (§9). T039–T042 y VT3 (habla y controladores) completadas el mismo día (§10). T043–T044 (contrato de build y límite de incrustación) completadas el mismo día (§11). T045–T046 y VT4 (movimiento en Chromium, Firefox y WebKit) completadas el 2026-11-04 (§12). T047–T050 (contexto de audio compartido) completadas el mismo día (§13). T051–T053 (controlador de efectos sonoros y contrato de licencias) completadas el mismo día (§14). T054 (cierre del bloque A) completada el mismo día (§15). T055–T057 (playground frente a plan §8 y estado de sesión del inspector) completadas el mismo día (§16). T058 (inspector de los 14 recursos, con la excepción aprobada de `poking` a 1× y la sincronía de las capas CSS de los gags) completada el 2026-11-05 (§17). T059 (tamaño, fondos, pixelado y contenedores del inspector) completada el mismo día (§18). T060 (línea de tiempo por fotograma) completada el mismo día (§19). T061 (peso y memoria decodificada) completada el mismo día (§20). T062 (modos de movimiento en el Lab) completada el 2026-11-06 (§21). T063 (4.3 con `talking` y `onSpeakingChange`) completada el mismo día (§22). T064 (escenarios y secuencias del contrato) completada el mismo día (§23). T065 (Preview con los recursos reales y `presentationGate`) completada el mismo día (§24). T066 completada el 2026-11-12 (§34): prototipo parcial de la consulta móvil registrado el 2026-11-06 (§25), con su defecto de convivencia corregido el 2026-11-09 (§25.7) y la zona sensible limitada a lo visible el 2026-11-09 (§26) y probados los tres gags sobre el retrato grande de la consulta ancha, con dos candidatas de ubicación para el expediente (§27) y la candidata A prototipada (§28), con la composición de 4.8 revisada (§29), AV6 aprobada y la versión reducida presentada para AV4 (§30) y, con la nueva dirección, rehecha conservando los gags (§31), con la espera de `poking` a 5 s (§32) y aprobada el 2026-11-12, con las fuentes normativas al día (§33), y cerrada con el diagnóstico de los tiempos límite de 4.3 (§34). El resto de los hitos de `008-tasks.md` no se ha ejecutado.

## Cómo se lee

- Es la fuente única de resultados y evidencias de la implementación de 008 (`008-tasks.md`, «Cómo leer este desglose»). No copia decisiones ni aprobaciones: permanecen en su fuente de verdad (spec, plan, `art-direction/README.md`) y aquí solo se remite a ellas.
- Remite a E1–E13 del plan (`008-plan.md` §2) por su número cuando los confirma o los corrige.
- Cada registro lleva fecha, entorno, comando y límites. Lo que no se ha comprobado consta como pendiente.
- Las cifras de tiempo dependen del equipo y de su estado en ese momento (§1.7). Solo son comparables las medidas con el mismo arnés y las mismas opciones, y mejor si son de la misma sesión.

## Hitos registrados

| Hito | Estado | Registro |
|---|---|---|
| T001 — arnés de medición | Entregado y validado con el criterio revisado de `008-tasks.md`: pruebas de las funciones puras (92), validación de las peticiones y comprobación mínima del protocolo A/B (§1.8). **E2 no se reprodujo,** ni siquiera con el guion que la produjo (§1.4): EX1 la sustituye como línea base | §1 |
| EX1 — línea base de HEAD y su dispersión | Medido y registrado. El margen provisional de +50 ms de FCP con Slow 4G + CPU 4× **no se distingue del ruido** (§2.3) y se retira (plan §11.2). CSS de entrada de partida: 9 780 B con `gzipSync` (§2.4) | §2 |
| T002 — inventario de los 13 ZIP | Completo frente al catálogo §3 y a las fuentes de `17aca4f`; `_sprite.scss` idéntico en los 13; controladores `006`, `008` y `009` con sus tipos. Sin ausencias | §3.2 |
| T003 — verificación de los ZIP | Los 7 actualizados coinciden con los SHA-256 del informe de correcciones; los 6 restantes, byte a byte con las fuentes de `17aca4f` | §3.3 |
| T004–T008 y VT1 — integración e integridad | Recursos integrados: 61 de 61 idénticos a `17aca4f`; T005–T008 hechas. Completados tras corregir `serverBoundary.test.ts` (§4.4); suite completa en verde | §4 |
| T009–T016 y VT2 — movimiento (A2) | Preferencia `motion`, estado efectivo de los seis modos, `u.reduced-motion` sin especificidad y plugin PostCSS de sprites. VT2 sobre los 14 módulos reales: 62 bloques transformados y parciales intactos. Lab en modo forzado: 0 diferencias en 11 224 estados | §5 |
| T017–T026 — `presentationGate`, `select`, `ambient`, `activityLabels` (A3) | Cuatro módulos puros con 71 pruebas, cada pareja vista fallar antes del código. Decisiones D-17 a D-22 aprobadas y comprobadas (§6.3) | §6 |
| T027–T031 — registro, velocidades y estáticas (A3) | `SOFI_REGISTRY` contrastado con el catálogo y los parciales (74 pruebas), `rateFor` con sobrescritura de sesión (8) y rutas de estáticas movidas al registro sin cambiar `visualFor`. Entrada de la build: CSS idéntico, JS +189 B | §7 |
| T032–T034 — modo efectivo durante `memory-wipe` (A3) | `holdMotion` fija el modo inicial con el único `data-motion` de `<html>`; 11 pruebas con los tres modos de entrada y la coordinación con el proveedor. Contrato remitido en el plan (D-23). Firefox y WebKit: confirmado en T046 (§12); queda T073 | §8 |
| T035–T038 — `SofiSprite` y `SofiPortrait` (A4) | Carga con decodificación previa, pasada única, velocidad y eventos de ciclo; el retrato usa el módulo dueño y obedece a `full` (control de E11, 12 de 12 en Chromium). Firefox y WebKit: confirmado en T046 (§12); queda T073 | §9 |
| T039–T042 y VT3 — habla y controladores (A4) | `onSpeakingChange` avisa solo al cambiar el booleano. `useSofiController` monta los tres controladores reales y los destruye sin residuos (escuchas, observadores, temporizadores, fotogramas, capas y atributos), también con StrictMode; las causas simultáneas no se anulan. 48 pruebas nuevas con sensibilidad comprobada. Navegador real pendiente (VT6) | §10 |
| T043–T044 — contrato de build y límite de incrustación (A4) | Las 35 tiras de producción salen como archivos (antes, 15 iban incrustadas) y ninguna del Lab llega a la build; 11 chunks diferidos propios, controladores y keyframes únicos fuera de la entrada. CSS de entrada idéntico (9 871 B; +91 B sobre EX1, objetivo provisional sin aplicar); chunks diferidos −36 % de CSS y −77 % de JS. 11 pruebas de build y 4 estáticas con sensibilidad comprobada | §11 |
| T045–T046 y VT4 — movimiento en tres motores (A4) | Proyectos de Firefox y WebKit solo para `e2e/motion/`; los seis modos en `SofiPortrait`, `Spinner`, `Loader` y `Ticker`, la especificidad medida con las reglas reales y `holdMotion` (13 pruebas): **13 de 13 en Chromium, Firefox y WebKit, con los mismos resultados.** Los 12 módulos con el mixin: 16 de 16 reglas reducidas excluyen `full`, también en el CSS de la build. Sin incompatibilidades. Sensibilidad comprobada; una incidencia de `profile.spec.ts` sin explicar (§12.6) | §12 |
| T047–T050 — contexto de audio compartido (A5) | `createSpeechAudio` admite un contexto prestado (`context`) que `dispose()` no cierra; `SoundProvider` lo crea la primera vez que se pide, dentro del gesto que desbloquea el sonido, y lo cierra al desmontarse después de liberar la voz. 11 pruebas nuevas (6 + 5) con cada RED visto fallar y 5 mutaciones detectadas; las 12 suites que dependen de los dos módulos (137 pruebas) pasan. Efectos (T051–T052) y audio real pendientes | §13 |
| T051–T053 — efectos sonoros: controlador y licencias (A5) | `createEffectsAudio` con contexto siempre prestado, un efecto a la vez, sin tapar la voz, en silencio en seguridad, salida rápida y estados sensibles, `memory-wipe` solo tras el borrado efectivo y sin condicionar nunca la aplicación; el proveedor libera efectos y voz antes de cerrar el contexto. Manifiesto de licencias vacío y su contrato. 68 pruebas nuevas (34 + 2 + 32) con cada RED visto fallar y 19 mutaciones detectadas; las 14 suites dependientes (205 pruebas) pasan. Decisiones D-24 a D-29 aprobadas (plan §11.4). Sin sonidos elegidos ni audio real | §14 |
| T054 — cierre del bloque A | Formato, lint, tipos, build y `verify:bundle` sin errores; Vitest completo 100 archivos y 1 813 pruebas; CSS de entrada igual que en §11 (9 871 B). Playwright en los tres motores: la CI (nº 26 y nº 27), no en local. De los 27 criterios de la spec, **7 verificados, 14 parciales y 6 pendientes** de otros bloques; ninguna casilla de la spec se marca. Recursos reverificados (61 de 61 archivos y 13 de 13 ZIP) | §15 |
| T055–T057 — playground y estado de sesión del inspector (B1) | Playground leído en `17aca4f` sin modificarlo, con las 6 filas de plan §8 contrastadas: 9 divergencias y una coincidencia (el pixelado) registradas. Ninguna contradice el plan: varias dejan decisiones a T058–T061 y T064. `createInspectorState` e `inspectorReducer` guardan la velocidad, la pausa, el tamaño, el fondo y el pixelado de cada recurso, y se conservan al cambiar de recurso, sin tocar preferencias públicas, `PRODUCTION_RATES` ni `rateFor`. 8 pruebas nuevas (RED: 3 fallan y 5 pasan) y 9 mutaciones detectadas. Sin conectar a ningún componente (T058) | §16 |
| T058 — inspector de los 14 recursos (B1) | Selector y ficha, reproducir, pausar, reiniciar, velocidad con `LabRange`, comparar con 1×, bucle o pasada, evento nuevo y cancelación, con `PENDING_IN_LAB` retirado. `poking` conserva 1× (excepción aprobada, spec §8). Corrige `useSofiController`: las capas CSS de `are-u-still-here` e `i-see-you` ya siguen la velocidad (medido en Chromium; VT3 sigue pasando). 565 pruebas en `design-lab` y `sofi`, axe 0 en 32 estados, e2e 57 de 57. Firefox y WebKit: T074 | §17 |
| T059 — tamaño, fondos, pixelado y contenedores (B1) | Tamaño de 64 a 512 px en pasos de 8 px (192 px de partida), los tres fondos de `LabStage`, pixelado desactivado de partida y conservado por recurso; contenedores escenario entero, busto apoyado e insignia con los recortes aprobados escalados, y ancho completo o de 320 px. 593 pruebas en `design-lab` y `sofi`, axe 0 en 10 estados, e2e de accesibilidad 42 de 42. Hallazgo sin decidir: el recuadro del busto recorta elementos de varios recursos (§18.4) | §18 |
| T060 — línea de tiempo por fotograma (B1) | Derivada de `getKeyframes()` de la animación real de la tira, sin duraciones ni fotogramas propios: tramos a escala con el lenguaje de 4.4, miniaturas y desplazamiento manual (puntero, miniatura y teclado), también sobre una pasada ya terminada. Fidelidad en Chromium: 660 de 660 frente al fotograma pintado, y los tramos suman el ciclo en los 11 recursos CSS. Las máquinas no admiten una línea fiel: nota, sin alternativa. 641 pruebas, axe 0. Una incidencia corregida (pasada terminada) | §19 |
| T061 — peso y memoria decodificada (B1) | Por recurso y por tira: bytes del archivo (medidos con Resource Timing, idénticos al disco en los 14: 830,2 KB, la cifra de E3), memoria estimada (ancho × alto × 4, declarada como estimación) y transferencia de red, que **no se puede medir en el Lab** porque el service worker de MSW atiende las peticiones (no se presenta como caché ni como cero). Sin servidor, dependencias ni mediciones duplicadas; una duplicación de la máscara de `memory-wipe` hallada y corregida (16 peticiones, ninguna repetida). 712 pruebas, axe 0 | §20 |
| T062 — modos de movimiento en el Lab (B1) | El selector global del Lab pasa a `system \| reduce \| full`, sin selector nuevo en el inspector. Los 14 recursos en los 6 modos en Chromium: reducidos, sin animaciones, sin capas y con la misma imagen en los tres; `full` anima aunque el sistema pida reducir; al pasar a «Reducido» no sobrevive ningún controlador (CDP y sonda). Dos hallazgos corregidos: los marcos de Preview y Perfil perdían `full`, y la ficha decía «Reproduciendo» con movimiento reducido | §21 |
| T063 — 4.3 con `talking` y `onSpeakingChange` (B1) | El hueco provisional pasa a `SyncSlot`: `SofiSprite` con lo que decide `selectVisual({ speaking })`, alimentado por un único booleano de `SofiSpeech.onSpeakingChange`. Hablar, pausar, terminar, cambiar texto, «Ver todo», reducido y desmontar, en jsdom y en Chromium; sin repintados por carácter; las pausas son el reposo del contrato, rotulado como provisional hasta AV5. Límite: el primer `talking` llega con la carga diferida (EX3) | §22 |
| T064 — escenarios y secuencias del contrato (B1) | Sección 4.6 de Motion & Sound: señales simuladas en local que consume `selectVisual` (con `wipeAfter` y `ambient`), con los tres gags reales, pasadas únicas con su fin real y el orden de la salida rápida y del borrado en un registro, sin persistencia simulada. RED real: el borrado descartaba la seguridad. Observación abierta: con movimiento reducido una pasada única no termina (AV4/009) | §23 |
| T065 — Preview con recursos reales y `presentationGate` (B1) | Las pantallas de la Preview reciben, con props opcionales, el recurso que decide `selectVisual` (producción no cambia); `presentationGate` retiene solo la presentación de un resultado no crítico hasta el fin del primer ciclo o el límite, con límite, velocidad de `sofing` y latencia ajustables en la mesa y una tabla viva de lo que espera y lo que no. En Chromium: 3,03 s al límite, 1,77 s al fin del ciclo a 2×, error en el acto, cancelar y reducido sin esperar. Abiertos: el recorte de `error` corta el brazo, AV2 sin aprobar (el texto durante la retención se corrigió después, §24.6) | §24 |
| T066 — gags en el Lab (B1) | Los tres gags reales en la insignia móvil (4.7), el retrato grande de la consulta ancha (4.8) y el retrato del expediente (4.9), con zona sensible limitada a lo visible y su precisión, inactividad ajustable y la versión reducida conservando los gags. Ubicación e inactividad aprobadas con AV6; versión reducida de los gags aprobada el 2026-11-12 (AV4 sigue pendiente de T069). Los tiempos límite de `MotionSync.test.tsx` con la suite completa no son defecto de T066, pero 4.7–4.9 encarecen esas pruebas: queda pendiente (§34.3) | §25–§34 |

---

## 1. T001 — Arnés de medición de carga

### 1.1 Qué se entrega

- `scripts/measureLoad.ts`: el arnés. Se invoca a mano con `npm run measure:load -- <opciones>`, una entrada nueva y única de `package.json`. No cuelga de `build`, de scripts `pre`/`post` ni de CI. Las opciones están en la cabecera del script. Tiene dos modos: una versión (línea base y dispersión) y comparación A/B (`--a`, `--b`, `--blocks`; §1.8).
- `scripts/loadMetrics.ts`: funciones puras (`median`, `dispersion`, `assetStem`, `entryAssets`, `cpuBusyFraction`, y para la revisión de §1.8: `gzipSize`, `abbaSchedule`, `pairedDifferences`, `tCritical95`, `summarizeDifferences`, `requestProblems`, `checkEntryDownloads`). `pairsBeyond`, que contaba los pares de medianas de ronda separados más de 50 ms, se retiró al retirarse ese margen: sus cifras de §2.3 salen de la tabla de §2.2.
- `scripts/loadMetrics.test.ts`: 92 pruebas de esas funciones. La primera entrega llevaba 28, de las que 4 (las de `pairsBeyond`) se retiraron con la función.
- Sin dependencias nuevas: usa el Playwright 1.64.0 y el Vite 8.3.4 ya instalados. `package-lock.json` no cambia.

### 1.2 Protocolo implementado

Es el de plan §7 («el de E2»), con el método de E2 recuperado en §1.4.

| Aspecto | Valor |
|---|---|
| Build | `vite build --outDir <carpeta temporal>`; la carpeta se borra al terminar |
| Servidor | `vite preview` (CLI), `--strictPort`, puerto 4199 (`LOAD_PORT`), host `127.0.0.1`. Antes de medir comprueba que lo que responde es esa build. No usa el 4173: estaba ocupado por un `vite preview` de otro proyecto, que no se ha tocado |
| Navegador | Chromium 156.0.8078.4 (headless shell de Playwright), uno para toda la sesión. Su primera carga se descarta: paga el arranque del propio navegador (§1.6). `--fresh-browser` lanza uno nuevo por muestra |
| Muestra | Contexto nuevo (caché fría), viewport 390×844, DPR 1. Perfil por CDP (`Network.emulateNetworkConditions` y `Emulation.setCPUThrottlingRate`). Tras `load` espera a que existan FCP y LCP, luego 500 ms sin peticiones y dos fotogramas |
| Qué mide | FCP; LCP (último candidato); bytes transferidos (suma de `encodedDataLength`, cabeceras incluidas); peticiones; cascada de recursos; WebP por pantalla; CSS de entrada |
| Ronda | Mediana de 5 muestras, métrica a métrica |
| Dispersión | `--rounds R` repite la ronda R veces, intercaladas entre perfiles. Se informa mín, máx, rango y σ muestral (n − 1) de las medianas de ronda |
| CSS de entrada | El que referencia `index.html` de la build, en bytes y en `gzipSync` de Node con opciones fijas (`level` 6, `memLevel` 8, `windowBits` 15, estrategia por defecto). No es lo descargado: cada muestra contrasta ambos (§1.8) |
| Validez de la muestra | Todas las peticiones con estado 2xx y el tipo de contenido esperado, y todo lo que `index.html` referencia descargado por la red. Si no, el arnés aborta con la causa (§1.8) |
| Comparación A/B | `--a` y `--b`: dos builds servidas a la vez por dos `vite preview` (puertos 4199 y 4200), cargadas ABBA y BAAB, con calentamiento predefinido y análisis de diferencias emparejadas (§1.8) |
| WebP por pantalla | Recorrido en frío portada → consulta → expediente, con las acciones de una persona. «Tira» es un WebP cuyo nombre sin hash coincide con un fichero de `src/styles/sprites/` |

### 1.3 Perfiles

Latencia en ms y caudales en bytes/s. La CPU se limita con `rate: 4` en los dos perfiles limitados.

| Perfil | Latencia | Descarga | Subida |
|---|---|---|---|
| Sin limitar | — | — | — |
| Fast 4G + CPU 4× | 150 | 1 179 648 (9 × 1024 × 1024 / 8) | 196 608 |
| Slow 4G + CPU 4× | 400 | 209 715 (1,6 × 1024 × 1024 / 8) | 96 000 |

El plan solo nombra los perfiles. Estos números son los del guion que produjo E2, recuperados del historial local de la sesión que lo ejecutó (§1.4). **No son los presets de Chrome DevTools** (Fast 4G: 165 ms y 1 012 500 B/s; Slow 4G: 562,5 ms y 180 000 B/s, leídos el 2026-10-27 de `front_end/core/sdk/NetworkManager.ts` de devtools-frontend), que el arnés conserva como `fast4g-devtools` y `slow4g-devtools` para medir cuánto depende la cifra de la definición del perfil (§2.6).

### 1.4 Validación frente a E2

El criterio original de T001 era: «se valida reproduciendo E2 sobre el HEAD actual dentro de su dispersión». **No se cumplió.** El 2026-10-27 la autora aprobó que EX1 sustituya a E2 como línea base reproducible y que E2 conserve sus cifras históricas con esta discrepancia documentada (plan §11.2); el criterio de T001 se revisó en consecuencia (`008-tasks.md`). Lo que sigue es el intento de reproducción tal como se hizo, sin cambios.

**Método de E2 recuperado.** E2 se produjo con un guion que no está en el repositorio (plan §2). Su texto y su salida constan en el historial local de la sesión que lo ejecutó (2026-10-23, 12:56 UTC, «Measure baseline FCP/LCP of production build under throttling»). La salida de ese guion contiene las cifras de la fila E2 del plan (FCP 536 / 1728 / 2712 ms) y además el `load` de cada perfil (208 / 817 / 1788 ms). Su método:

- los perfiles de §1.3;
- un único `chromium.launch()` para las 15 cargas, sin calentamiento, y un contexto nuevo por carga;
- `preview()` de la API de Vite y `http://localhost:5297/`;
- espera de `h1` visible más 300 ms, FCP leído de `performance` y mediana igual al elemento central.

**Las cifras de E2 no se reproducen hoy, ni con su propio guion.** Se ejecutó el guion de E2 sin cambiar su método sobre la misma build que el arnés. Solo se le cambiaron las rutas de los módulos y de la build, el host y el número de repeticiones, y cada repetición lanza un navegador nuevo, como una ejecución del guion. Son 20 ejecuciones completas, cada una con su mediana de 5 por perfil. FCP en ms, media de las ejecuciones y entre paréntesis mín–máx:

| Tanda · host | Ejecuciones | Sin limitar | Fast 4G + CPU 4× | Slow 4G + CPU 4× |
|---|---|---|---|---|
| **E2, registrado** (2026-10-23) | 1 | **536** | **1728** | **2712** |
| 1.ª (11:06–11:12 UTC) · `localhost` | 8 | 184 (172–192) | 1545 (1436–1636) | 2532 (2456–2600) |
| 1.ª · `127.0.0.1` | 4 | 180 (176–184) | 1459 (1420–1500) | 2450 (2436–2472) |
| 2.ª (11:27–11:31 UTC) · `localhost` | 4 | 185 (180–192) | 1475 (1412–1580) | 2464 (2448–2476) |
| 2.ª · `127.0.0.1` | 4 | 179 (176–184) | 1484 (1432–1528) | 2485 (2424–2516) |

El valor registrado queda fuera del rango de las 20 ejecuciones en los tres perfiles: por encima del máximo en +344 ms (sin limitar), +92 ms (Fast) y +112 ms (Slow). Frente a la media de las 20 (182, 1502 y 2492 ms) son +354, +226 y +220 ms, es decir, 63,5, 3,5 y 4,5 desviaciones típicas de esas ejecuciones.

**El arnés equivale a ese método.** Medias de las medianas de ronda del arnés frente a las del guion de E2, ejecutados en la misma sesión (t de Welch):

| Host | Perfil | Arnés (n, σ) | Guion de E2 (n, σ) | Diferencia | t |
|---|---|---|---|---|---|
| `127.0.0.1` | Sin limitar | 180,0 (10, 2,7) | 179,5 (8, 4,0) | +0,5 ms | 0,3 |
| `127.0.0.1` | Fast 4G | 1454,0 (10, 55,6) | 1471,5 (8, 36,2) | −17,5 ms (−1,2 %) | −0,8 |
| `127.0.0.1` | Slow 4G | 2416,0 (10, 41,9) | 2467,5 (8, 35,6) | −51,5 ms (−2,1 %) | −2,8 |
| `localhost` | Sin limitar | 181,0 (8, 5,1) | 184,3 (12, 5,8) | −3,3 ms | −1,4 |
| `localhost` | Fast 4G | 1445,5 (8, 44,6) | 1521,7 (12, 73,7) | −76,2 ms (−5,0 %) | −2,9 |
| `localhost` | Slow 4G | 2432,5 (8, 50,4) | 2509,0 (12, 51,3) | −76,5 ms (−3,0 %) | −3,3 |

- En `127.0.0.1` coinciden en sin limitar y en Fast 4G. En Slow 4G el arnés queda 52 ms (2,1 %) por debajo, con t = −2,8: una diferencia pequeña que en esta comparación sí se distingue del ruido.
- Con `localhost` el guion de la primera tanda salió ≈ 80 ms más lento que en `127.0.0.1` (pero esas 8 ejecuciones fueron además las primeras de la sesión), y en la segunda tanda ya no (Fast 1475 frente a 1484; Slow 2464 frente a 2485) y el arnés no muestra efecto del host (`localhost` menos `127.0.0.1`: Fast −8,5 ms y Slow +16,5 ms, ambos con |t| < 1). Lo más consistente con los datos es una deriva de la máquina dentro de la sesión (§2.7) y no un efecto del host. Las diferencias con `localhost` de la tabla están infladas por esa primera tanda.
- El arnés queda por debajo del guion en todas las comparaciones de perfiles limitados. Una posible causa estructural, **no comprobada**: el guion lleva el servidor y el cliente de Playwright en el mismo proceso de Node, y el arnés los separa.

**Dónde está la diferencia con E2.** E2 registró también `load`. Comparado con el arnés de hoy (medianas del conjunto A de §2.2), en ms:

| Perfil | E2: FCP / load / FCP − load | Hoy: FCP / load / FCP − load | Diferencia en `load` | Diferencia en FCP − load |
|---|---|---|---|---|
| Sin limitar | 536 / 208 / 328 | 180 / 68 / 112 | +140 | +216 |
| Fast 4G + CPU 4× | 1728 / 817 / 911 | 1462 / 728 / 734 | +89 (+12 %) | +177 |
| Slow 4G + CPU 4× | 2712 / 1788 / 924 | 2410 / 1706 / 704 | +82 (+5 %) | +220 |

Bajo limitación, `load` casi coincide (+12 % con Fast 4G y +5 % con Slow 4G): la red emulada y los perfiles son los mismos. La diferencia se concentra en el tramo entre `load` y el primer fotograma, y es de ≈ +200 ms **en los tres perfiles** (+216, +177, +220), es decir, aditiva y no proporcional a la limitación de CPU. Además, los bytes de JS y CSS que E2 registró (`transferSize`: 105,8 y 9,8 KiB) coinciden con los de hoy (106,0 y 9,9 KiB con `encodedDataLength`, que cuenta más cabeceras).

**Hipótesis, no demostrada:** el 2026-10-23 el primer fotograma se presentó ≈ 200 ms más tarde que hoy, por un estado del compositor o de la máquina que no está registrado. Es el mismo tipo de retraso que aparece hoy cuando cada muestra lanza un navegador nuevo (FCP − load sin limitar = 520 ms, §2.6). Con lo registrado no se puede saber cuál fue la causa.

**Conclusión de esta validación:**

- El arnés reproduce el método de E2 y, bajo limitación, la parte de red y los bytes de E2.
- No reproduce las cifras de FCP registradas en el plan §2 (E2), y esas cifras tampoco se reproducen con el guion original. La causa no se ha podido establecer.
- **Resolución aprobada (plan §11.2):** E2 queda como evidencia histórica de ese día, no como línea base reproducible de este equipo. La referencia para comparar es la de EX1 (§2), y el plan §2 (fila E2) y §7 lo reflejan.

### 1.5 Comprobaciones de la primera entrega

Las de la revisión posterior (92 pruebas, 1320 en la suite completa) constan en §1.8.

| Comprobación | Resultado |
|---|---|
| RED → GREEN de las funciones puras (`npx vitest run scripts/loadMetrics.test.ts`) | RED: falla por módulo inexistente. GREEN: 28 de 28 |
| `npm run lint`, `npm run format:check`, `npm run typecheck` (repositorio completo) | Sin errores |
| `npm test` (suite completa, sin llamadas reales a Jev) | 80 ficheros y 1256 pruebas en verde, entre ellas las 28 nuevas |
| La build coincide con E1 | Vite informa JS 336,34 kB (gzip 109,33) y CSS 48,29 kB (gzip 9,82), como E1. Los nombres con hash (`index-BF--mqqv.js`, `index-D8OyO5bk.css`) son los del `dist/` anterior. De las tiras de `src/styles/sprites/` solo sale `sofi-blink` |
| La limitación se aplica | Cada muestra limitada exige que el documento termine de llegar en ≥ 0,8 × la latencia y el arnés aborta si no. Medido (mediana): 175 ms con Fast 4G y 426 ms con Slow 4G |
| Los bytes son deterministas | Las 150 muestras del conjunto A transfieren exactamente 227 982 B en 7 peticiones |
| Recorrido de pantallas | Idéntico en los tres perfiles (§2.5) |
| Salida limpia | Código de salida 0, sin procesos del arnés ni carpetas temporales. El servidor del 4173, ajeno, sigue intacto |

### 1.6 Defectos del arnés hallados al validarlo

Se corrigieron antes de medir. Quedan anotados porque afectan a cualquier medición de este tipo:

- **El primer fotograma puede publicarse después de que la red quede en reposo.** En la primera carga de un navegador recién lanzado, FCP y LCP no existen al leer si se espera solo a `networkidle`. El arnés espera a que existan. El guion de E2 tiene el mismo defecto: en 13 de sus 20 ejecuciones la primera muestra sin limitar salió sin FCP (`NaN`), y la mediana lo disimula.
- **`waitForLoadState('networkidle')` solo vale para el documento.** Tras la primera carga se resuelve al instante, así que en Slow 4G el recorrido de pantallas perdía la descarga de `sofi-peek`. El arnés usa un detector de reposo propio sobre CDP.
- **La latencia emulada no aparece en el TTFB.** Chromium la aplica antes del cuerpo (`responseStart` queda en unos pocos ms aunque la latencia sea de 400). La comprobación de que la limitación se aplica usa cuándo termina de llegar el documento.
- **El proceso no terminaba.** El servidor de preview, hijo del arnés, mantenía vivo el bucle de eventos y la limpieza esperaba a un evento que nunca llegaba. Ahora `main` sale con `process.exit` y limpia en orden inverso.
- **Los perfiles supuestos eran los de DevTools,** y no los de E2. Se descubrió al recuperar el guion de E2.

### 1.7 Limitaciones

- **El equipo no está en reposo.** Es el portátil de trabajo: Intel Core i7-7700HQ (4 núcleos, 8 lógicos), 7,9 GB de RAM con 0,5–1,2 GB libres al empezar cada ejecución, Windows 11, plan «Alto rendimiento», con el editor y varios navegadores abiertos durante todas las mediciones. Carga de CPU de fondo medida por el propio arnés: 4–12 %.
- **«CPU 4×» pesa más que 4× en este equipo.** Un bucle de CPU fijo, medido tres veces por perfil, tarda 4,5–6,3 veces más con `rate: 4` que sin limitar (116–149 ms sin limitar; 660–799 ms limitado, en tres ejecuciones). Es una propiedad de este equipo y, presumiblemente, también afectó a E2, que se midió en el mismo.
- **Casi todo el ruido del FCP limitado procede de la CPU, no de la red.** Sin limitar, σ de una muestra = 12 ms; limitado, 92–97 ms. Es una inferencia por contraste de perfiles, **no una medición aislada**: no se ha probado CPU sin red ni red sin CPU.
- **El gzip de Vite no es comparable con el de Node.** Vite 8 lo calcula con su reporter nativo (CSS 9,82 kB y JS 109,33 kB) y `gzipSync` de Node da 9,78 y 108,08 kB. Decidido (plan §11.2): el objetivo de CSS de entrada se mide con `gzipSync` y opciones fijas, con referencia inicial de 9780 B. Esa cifra depende del zlib de Node, que es el de Chromium (aquí 1.3.0.1-motley-780819f, x64): no se ha comprobado que salga idéntica en otra máquina, arquitectura o versión de Node, y el arnés anota la versión de zlib junto a cada medición.
- **Chromium headless shell de Playwright.** No es Safari de macOS ni de iOS (`015`). También se probó el canal `chromium` (headless nuevo) en una sola ronda de 5, con los presets de DevTools y un navegador nuevo por muestra: Slow 4G dio 3128 ms frente a 2876–3040 ms con el headless shell en esa misma configuración, y su sin limitar fue más ruidoso (388–876 ms). No se ha usado.
- **DPR 1.** Con otro factor de píxel es probable que el navegador descargue otra variante del logotipo (`logo-540` o `logo-1080` en lugar de `logo-336`) y cambien los bytes y, quizá, el LCP; no se ha medido.
- **Las pantallas se recorren en secuencia.** Lo que una pantalla reutiliza de la anterior no se vuelve a pedir, así que cada fila es lo que cuesta llegar a esa pantalla desde la anterior, no lo que necesitaría en frío por sí sola.
- **Un solo navegador, un solo equipo y una sola sesión.** No hay medidas en otra máquina.
- **El arnés compara dos versiones por ejecución.** EX2 y EX3 comparan tres variantes: hasta ampliarlo a N versiones se resuelven con comparaciones por parejas contra una referencia.
- **No mide la disponibilidad funcional** (acción principal pintada y clic atendido; plan §7, métricas de `rolling`). T001 no la incluía, y antes de EX2 y EX4 falta definir qué es «la acción principal» de cada pantalla.

### 1.8 Revisión del 2026-10-27: protocolo A/B y validez de las muestras

Tras las cuatro decisiones de plan §11.2 se amplió el arnés y se validó con lo que sigue. Mismo equipo, misma sesión y misma build que EX1 (los ficheros con hash de §1.5). La toma de la muestra no cambia: contexto nuevo, perfiles, esperas y métricas son los de EX1. Lo añadido solo puede abortar una muestra, no alterar lo que se mide.

**Qué se añadió**

- **gzip fijo.** `gzipSize` usa `gzipSync` con `level` 6, `memLevel` 8, `windowBits` 15 y la estrategia por defecto. Sobre la build de HEAD da 9 780 B de CSS y 108 083 B de JS: lo mismo que con las opciones por defecto de Node, y el mismo valor en 20 repeticiones. Con `level` 9 el CSS saldría en 9 720 B, otra medida no comparable. zlib 1.3.0.1-motley-780819f.
- **Calendario.** `abbaSchedule` alterna ABBA y BAAB. El calentamiento son 2 bloques (`WARMUP_BLOCKS`: constante del protocolo, no opción) y `--blocks` debe ser par, para que lo medido quede equilibrado entre ABBA y BAAB.
- **Análisis.** `pairedDifferences` calcula B − A en cada bloque y excluye el calentamiento por regla. `summarizeDifferences` da media, mediana, σ, error típico, intervalo del 95 % con la t de Student y en cuántos bloques B es más lenta. La tabla de la t (`tCritical95`) se contrastó con una inversión numérica independiente de la distribución: 33 entradas, peor diferencia 0,00047, y entre entradas nunca queda por debajo del valor exacto, más allá del redondeo a tres decimales (grados de libertad de 1 a 400).
- **Todas las muestras se conservan.** El JSON guarda cada carga con su versión, perfil, bloque, posición, si es de calentamiento y el instante. No se descarta ni se recorta nada.
- **Validez de las peticiones** (`requestProblems`, `checkEntryDownloads`), abajo.

**Peticiones fallidas**

Una muestra solo vale si todas sus peticiones terminaron con estado 2xx; el documento llegó como `text/html`, las hojas como `text/css` y los scripts como JavaScript, y ningún otro recurso llegó como HTML; hay petición del documento; y todo lo que `index.html` referencia se descargó por la red, no desde caché. En el recorrido de pantallas ninguna petición puede fallar. Si no se cumple, el arnés aborta con la causa, sin reintentar y sin guardar resultados (código de salida 1, sin JSON). El caso que importa es `vite preview` respondiendo `200` con `index.html` a una ruta que no existe: la red «funciona» y el recurso no se aplica.

Controles, con `--a <HEAD> --b <variante> --blocks 2 --profiles unthrottled`. «Anulada» es una copia temporal del arnés con `assertValid` desactivada (`if (false && …)`), que existió en `scripts/` solo mientras corría y se borró al terminar:

| Escenario (carpeta B) | Con la comprobación | Con la comprobación anulada |
|---|---|---|
| Falta la tira de la portada (`sofi-blink`) desde el principio | Aborta en el primer bloque de calentamiento: «`/assets/sofi-blink-B3I2mMtZ.webp` (Image) llegó como HTML: ¿ruta inexistente servida por el fallback de la SPA?» | Código 0 y JSON guardado: FCP «B − A +1 ms, IC −12 a +14 ms». Único indicio, 211,37 kB transferidos frente a 227,98 kB |
| El CSS de entrada desaparece a mitad de ejecución | Aborta: «`/assets/index-D8OyO5bk.css`: se esperaba text/css y llegó text/html» | Código 0 y JSON guardado: **FCP «B − A −49 ms, IC −138 a +40 ms».** Una página sin estilos (4 peticiones y 124,85 kB frente a 7 y 227,98 kB) aparece como una mejora |
| El JS de entrada desaparece a mitad de ejecución | Aborta con «sin primer fotograma» y la causa: «`/assets/index-BF--mqqv.js` falló: net::ERR_ABORTED» | No probado |
| Falta la tira de la consulta (`sofi-peek`); la portada carga bien | Los bloques miden con normalidad y el recorrido de pantallas aborta: «`/assets/sofi-peek-BPvAFgc9.webp` (Image) llegó como HTML» | No probado |
| Falta el CSS o el JS de entrada antes de empezar | Aborta al leer la build (`ENOENT`), antes de servir nada | No aplica |

**Referenciado y descargado.** «CSS de entrada» es lo que referencia `index.html`; lo descargado es otra medida, y el JSON guarda las dos (lo referenciado, una vez por build; lo descargado, en cada muestra). En las 105 muestras de la build de HEAD con esta validación (9 del modo de una versión y 96 del control A/A, calentamiento incluido) salió siempre lo mismo:

| Recurso | Referenciado por `index.html` (en disco) | `gzipSync` | Descargado (`encodedDataLength`, con cabeceras) |
|---|---|---|---|
| `/assets/index-D8OyO5bk.css` | 48 292 B | 9 780 B | 10 145 B |
| `/assets/index-BF--mqqv.js` | 336 343 B | 108 083 B | 108 534 B |
| Hojas de estilos o scripts descargados sin estar en `index.html` | — | — | ninguno |

Siempre 227 982 B en 7 peticiones, como en las 150 muestras del conjunto A de §2.2. Estas se midieron con la versión anterior del arnés, sin la validación: que el total de bytes y de peticiones sea idéntico en las 150 es evidencia de consistencia (un recurso servido como `index.html` lo habría cambiado), no una validación individual: no descarta por sí solo todos los fallos de recursos y las muestras no se revalidaron una a una.

**Comprobación mínima del protocolo A/B**

2026-10-27, 14:05–14:13 UTC, `127.0.0.1`, A en el puerto 4199 y B en el 4200, 6 bloques medidos más 2 de calentamiento, los tres perfiles. Comando: `npm run measure:load -- --a <carpeta A> --b <carpeta B> --blocks 6 --json <ruta>` (la segunda ejecución, con `--no-screens`). Las carpetas se compilaron con `vite build --outDir <carpeta> --emptyOutDir` desde el árbol de HEAD, fuera del repositorio. Los JSON de estas ejecuciones y de los controles no se versionan (quedan en una carpeta temporal de la sesión): lo registrado son las tablas de abajo.

- **Control A/A:** B es una copia exacta de A en otra carpeta.
- **Diferencia conocida:** B es A con 70 006 B de texto aleatorio, casi incompresible, añadidos al CSS de entrada: +53 775 B de `gzipSync` y +53 810 B transferidos.

En las dos ejecuciones el calendario ejecutado es el diseñado (ABBA BAAB ABBA BAAB ABBA BAAB ABBA BAAB, comprobado carga a carga por posición) y se conservan 96 muestras de 96, 48 por versión, 24 de ellas de calentamiento y marcadas como tales. LCP coincide con FCP en las 192 muestras (el elemento es el titular `H2`), así que solo se muestra FCP.

FCP, diferencia B − A por bloque en ms (positivo: B más lenta). Los bloques 1, 3 y 5 son ABBA, y los 2, 4 y 6, BAAB.

*Control A/A*

| Perfil | b1 | b2 | b3 | b4 | b5 | b6 | Media | σ | IC 95 % | B más lenta en |
|---|---|---|---|---|---|---|---|---|---|---|
| Sin limitar | +26 | +12 | −12 | +10 | −8 | −6 | +3,7 | 14,7 | −11,8 a +19,1 | 3 de 6 |
| Fast 4G + CPU 4× | +132 | −44 | +104 | −32 | −2 | −8 | +25,0 | 74,2 | −52,9 a +102,9 | 2 de 6 |
| Slow 4G + CPU 4× | −62 | −108 | +32 | −44 | −46 | +22 | −34,3 | 52,9 | −89,9 a +21,2 | 2 de 6 |

*Diferencia conocida (+53 775 B de CSS gzip)*

| Perfil | b1 | b2 | b3 | b4 | b5 | b6 | Media | σ | IC 95 % | B más lenta en |
|---|---|---|---|---|---|---|---|---|---|---|
| Sin limitar | −4 | +2 | +2 | −16 | +4 | +8 | −0,7 | 8,5 | −9,5 a +8,2 | 4 de 6 |
| Fast 4G + CPU 4× | +18 | +28 | +180 | +34 | −92 | −10 | +26,3 | 88,4 | −66,4 a +119,1 | 4 de 6 |
| Slow 4G + CPU 4× | +236 | +124 | +192 | +386 | +382 | +266 | +264,3 | 104,3 | +154,9 a +373,8 | 6 de 6 |

Medianas de FCP de las 12 cargas medidas de cada versión, en ms: A/A, A 182 / 1538 / 2466 y B 186 / 1534 / 2462; diferencia conocida, A 184 / 1518 / 2474 y B 188 / 1542 / 2750 (sin limitar / Fast 4G / Slow 4G).

Contraste con lo esperado en la diferencia conocida. El valor esperado es un modelo mínimo (solo la transferencia de los bytes añadidos, sin CPU ni latencia extra), no una predicción:

| Perfil | Esperado | Observado: media (IC 95 %) | ¿Distingue de 0? |
|---|---|---|---|
| Sin limitar | ≈ 0 (bucle local) | −0,7 (−9,5 a +8,2) | No |
| Fast 4G + CPU 4× | +45,6 ms (53 810 B ÷ 1 179 648 B/s) | +26,3 (−66,4 a +119,1) | No: la semianchura, ±93 ms, es mayor que el efecto |
| Slow 4G + CPU 4× | +256,6 ms (53 810 B ÷ 209 715 B/s) | +264,3 (+154,9 a +373,8) | Sí, en 6 de 6 bloques |

Lectura:

- **A/A:** los tres intervalos contienen el 0, como corresponde a dos copias idénticas. No calibra la cobertura del intervalo: son tres intervalos de una sola ejecución.
- **Diferencia conocida:** con 6 bloques el protocolo distingue un efecto de unos +257 ms en Slow 4G, cuyo intervalo contiene el valor esperado, y no distingue uno de unos +46 ms en Fast 4G, donde la semianchura es de ±93 ms. Sin limitar no inventa una diferencia. Los bytes sí se comparan sin ruido: la diferencia de `gzipSync` del CSS (+53 775 B) y la de bytes transferidos (+53 810 B) son exactas y no varían entre muestras.
- **Resolución.** Con 6 bloques la semianchura del intervalo fue de ±15 / ±78 / ±55 ms en el A/A y de ±9 / ±93 / ±110 ms en la diferencia conocida (sin limitar / Fast 4G / Slow 4G). Los bloques que haría falta para otras semianchuras están en la tabla de después de la lista.
- **Posición y calentamiento.** El FCP medio por posición dentro del bloque no muestra un efecto consistente entre las dos ejecuciones (Fast 4G: 1466 · 1581 · 1522 · 1531 ms en el A/A y 1533 · 1503 · 1555 · 1508 ms en la conocida). El calentamiento tampoco se distingue de lo medido: 189 frente a 192 / 1464 frente a 1525 / 2520 frente a 2460 ms en el A/A y 193 frente a 190 / 1500 frente a 1525 / 2620 frente a 2618 ms en la conocida, con signos distintos según el perfil. No reproduce el transitorio de §2.7 (40–80 ms), pero con σ ≈ 80 ms por carga y 8 cargas de calentamiento por perfil tampoco habría podido verlo: ni lo confirma ni lo descarta.
- **Entorno.** Carga de CPU de fondo medida por el arnés: 8,4 % al empezar y 20,7 % al terminar el A/A, y 7,7 % y 23,2 % en la conocida, con 0,8 GB libres. No se ha atribuido el aumento.

Bloques medidos necesarios para una semianchura dada del intervalo, con la σ conjunta de las dos ejecuciones (la raíz cuadrada de la media de sus varianzas):

| Perfil | σ de las diferencias entre bloques (A/A · conocida · conjunta) | ±50 ms | ±25 ms | ±10 ms |
|---|---|---|---|---|
| Sin limitar | 14,7 · 8,5 · 12,0 | 3 | 4 | 9 |
| Fast 4G + CPU 4× | 74,2 · 88,4 · 81,6 | 13 | 44 | 262 |
| Slow 4G + CPU 4× | 52,9 · 104,3 · 82,7 | 13 | 45 | 269 |

Es un orden de magnitud: cada σ sale de 6 bloques y es muy incierta. Un bloque con los tres perfiles tarda unos 30 s (237 s los 8 bloques del A/A), así que ±25 ms en los perfiles limitados pide unos 45 bloques, unos 22 minutos con los tres perfiles.

**Comprobaciones de la revisión**

| Comprobación | Resultado |
|---|---|
| RED → GREEN de las funciones puras (`npx vitest run scripts/loadMetrics.test.ts`) | RED: fallaban 67 de las 92 por exportaciones inexistentes; las 25 restantes eran las 24 anteriores y una nueva que solo ejercitaba el gzip de Node, que se sustituyó por una que ejercita `gzipSize`. GREEN: 92 de 92 |
| `npm run lint`, `npm run format:check`, `npm run typecheck` (repositorio completo) | Sin errores |
| `npm test` (suite completa) | 80 ficheros y 1320 pruebas en verde |
| Modo de una versión tras el refactor (`--rounds 1 --samples 3`) | CSS de entrada de 9 780 B con `gzipSync`; 227,98 kB en 7 peticiones; mismas WebP por pantalla que EX1 |
| Salida limpia | Sin procesos del arnés, sin carpetas temporales suyas y con el servidor del 4173, ajeno, intacto |

**Sin comprobar:** la cobertura real del intervalo del 95 % (supone diferencias aproximadamente normales e independientes entre bloques; una deriva lenta puede dejarlo más estrecho de lo que debe); el protocolo en otra máquina o con otro navegador; la disponibilidad funcional (§1.7); el JS que desaparece y el recorrido de pantallas con la comprobación anulada.

---

## 2. EX1 — Línea base de HEAD y su dispersión

### 2.1 Entorno y orden de ejecución

| | |
|---|---|
| Fecha | 2026-10-27. Conjunto A: 11:14–11:21 UTC |
| Código medido | Commit `e95055c`. Lo que la build lee es idéntico a HEAD salvo `package.json` (una línea: la entrada `measure:load`, que no entra en el bundle). `git diff --stat HEAD -- src public index.html vite.config.ts package-lock.json tsconfig*.json` está vacío |
| Equipo | Intel Core i7-7700HQ, 8 CPU lógicas, 7,9 GB de RAM (1,1 GB libres), Windows 11 (10.0.26200) |
| Programas | Node 22.17.1, Playwright 1.64.0, Chromium 156.0.8078.4 (headless shell), Vite 8.3.4 |
| Carga de CPU de fondo | 4,2 % antes y 4,0 % después |
| Comando | `npm run measure:load -- --rounds 10 --json <ruta>` |
| Opciones | Las del arnés por defecto: perfiles de §1.3, navegador compartido y calentado, `127.0.0.1`, viewport 390×844, DPR 1, 10 rondas de 5 muestras |

Orden de la sesión: conjunto D (navegador nuevo y presets de DevTools), guion de E2 (primera tanda), conjuntos A y B del arnés, guion de E2 (segunda tanda). Las mediciones no se solaparon entre sí; durante ellas solo se hicieron lecturas ligeras (búsquedas en ficheros y scripts de análisis de milisegundos). La búsqueda en el historial local de §1.4 coincidió con las últimas rondas del conjunto D. El arnés tuvo antes ejecuciones de depuración cortas, que no se registran.

### 2.2 Resultados: conjunto A (línea base de HEAD)

FCP en ms. Cada celda lista las 5 muestras y, en negrita, su mediana. LCP coincide con FCP en las 150 muestras (el elemento es el titular `H2`), por lo que no aporta información independiente en este arranque.

| Ronda | Sin limitar | Fast 4G + CPU 4× | Slow 4G + CPU 4× |
|---|---|---|---|
| 1 | 192 · 248 · 180 · 172 · 172 → **180** | 1596 · 1480 · 1756 · 1468 · 1536 → **1536** | 2724 · 2480 · 2468 · 2428 · 2508 → **2480** |
| 2 | 176 · 192 · 176 · 180 · 184 → **180** | 1384 · 1504 · 1432 · 1692 · 1396 → **1432** | 2432 · 2476 · 2604 · 2460 · 2528 → **2476** |
| 3 | 176 · 184 · 180 · 180 · 184 → **180** | 1608 · 1564 · 1484 · 1332 · 1380 → **1484** | 2412 · 2392 · 2652 · 2292 · 2336 → **2392** |
| 4 | 180 · 180 · 180 · 180 · 180 → **180** | 1448 · 1604 · 1524 · 1400 · 1432 → **1448** | 2344 · 2412 · 2344 · 2492 · 2388 → **2388** |
| 5 | 184 · 176 · 176 · 176 · 180 → **176** | 1484 · 1324 · 1388 · 1392 · 1440 → **1392** | 2424 · 2324 · 2512 · 2580 · 2448 → **2448** |
| 6 | 180 · 176 · 184 · 184 · 180 → **180** | 1440 · 1484 · 1432 · 1528 · 1556 → **1484** | 2404 · 2356 · 2396 · 2564 · 2380 → **2396** |
| 7 | 200 · 184 · 180 · 196 · 168 → **184** | 1680 · 1400 · 1520 · 1596 · 1492 → **1520** | 2416 · 2512 · 2384 · 2488 · 2372 → **2416** |
| 8 | 180 · 176 · 176 · 176 · 176 → **176** | 1392 · 1524 · 1580 · 1396 · 1392 → **1396** | 2344 · 2308 · 2424 · 2524 · 2320 → **2344** |
| 9 | 196 · 176 · 208 · 184 · 180 → **184** | 1420 · 1580 · 1476 · 1516 · 1464 → **1476** | 2404 · 2432 · 2388 · 2544 · 2388 → **2404** |
| 10 | 180 · 184 · 180 · 192 · 180 → **180** | 1352 · 1424 · 1372 · 1564 · 1352 → **1372** | 2416 · 2372 · 2484 · 2340 · 2588 → **2416** |

Resumen de las medianas de ronda:

| Perfil | Mediana de las medianas | Mín–máx | Rango | σ | Pares de rondas > 50 ms | E2 registrado | E2 − mediana |
|---|---|---|---|---|---|---|---|
| Sin limitar | 180 | 176–184 | 8 | 2,7 | 0 de 45 | 536 | +356 |
| Fast 4G + CPU 4× | 1462 | 1372–1536 | 164 | 55,6 | 28 de 45 | 1728 | +266 |
| Slow 4G + CPU 4× | 2410 | 2344–2480 | 136 | 41,9 | 22 de 45 | 2712 | +302 |

Otras medianas de ronda, que no entran en ningún objetivo: `load` 68 / 728 / 1706 ms; transferido 227,98 kB en 7 peticiones en todas las muestras (documento, CSS, JS, dos fuentes, `logo-336` y `sofi-blink`).

### 2.3 Dispersión y margen de +50 ms

El plan §7 fijaba como objetivo provisional que el FCP no empeorara más de 50 ms con Slow 4G + CPU 4×, y pedía medir antes la dispersión de la línea base. La pregunta práctica es cuántas veces el ruido por sí solo habría parecido una regresión: comparando la línea base consigo misma, cuántos pares de medianas de ronda se separan más de 50 ms.

Perfil Slow 4G + CPU 4×, conjunto A (45 pares de las 10 rondas):

| | |
|---|---|
| Pares separados más de 50 ms | **22 de 45 (49 %)** |
| Diferencia absoluta entre pares de medianas | p50 48 ms · p90 88 · p95 104 · máx 136 |
| σ de la mediana de 5 | 41,9 ms |
| σ de la diferencia entre dos medianas (√2·σ) | 59,3 ms; 50 ms son 0,84 σ de la diferencia |
| σ de una muestra suelta (50 muestras) | 92,4 ms |

La conclusión se repite en los tres conjuntos independientes de §2.6: σ de la mediana de 5 en Slow 4G de 41,9 (A), 50,4 (B) y 65,4 ms (D); pares > 50 ms: 22 de 45, 11 de 28 y 30 de 45.

**Resultado:** con esta dispersión, un umbral de +50 ms sobre la mediana de 5 se dispararía por ruido en torno a la mitad de las comparaciones entre dos medidas de la misma build. **El margen provisional de +50 ms no se sostiene.** Con Fast 4G ocurre lo mismo (28 de 45); solo la medición sin limitar es estable (0 de 45, rango 8 ms).

Lo que la dispersión permite sostener: la mayor diferencia entre dos medianas de la misma build fue de 136 ms (conjunto A) y de 156 ms (B), con p95 de 104 y 144 ms. Reducir la dispersión midiendo más cargas por mediana cuesta mucho: si el ruido fuera independiente entre cargas, que +50 ms fueran 3 σ de la diferencia exigiría ≈ 97 cargas por mediana (≈ 5 minutos por medición en Slow 4G). La autora aprobó retirar el margen como umbral automático y que EX4 fije los criterios con comparaciones A/B (plan §11.2; §1.8). `pairsBeyond`, la función que contaba esos pares, se retiró con el margen: las cifras de arriba se reproducen a partir de las medianas de ronda de §2.2.

### 2.4 CSS de entrada de partida

| Fichero | Tamaño | gzip (`gzipSync`, opciones fijas) | gzip según Vite (no es la medida) |
|---|---|---|---|
| `/assets/index-D8OyO5bk.css` | 48 292 B (48,29 kB) | **9 780 B** | 9,82 kB |
| `/assets/index-BF--mqqv.js` | 336 343 B (336,34 kB) | 108 083 B | 109,33 kB |

`index.html` (0,39 kB) no referencia `modulepreload` ni más CSS: la entrada es un único CSS y un único JS. Los tamaños y las cifras de Vite coinciden con E1. **La referencia aprobada (plan §7, §11.2) son 9 780 B de CSS de entrada medidos con `gzipSync` y opciones fijas;** con el margen provisional de +2 kB, el techo sería 11 780 B. Se midió en la sesión de EX1 con las opciones por defecto de Node y se volvió a medir con las opciones fijas del arnés final: la misma cifra (§1.8). Lo que descarga la red es otra medida (10 145 B codificados, con cabeceras) y no entra en el objetivo.

### 2.5 Descargas de WebP por pantalla

Recorrido en frío portada → consulta → expediente, igual en los tres perfiles. Ninguna descarga se repite y ninguna petición falla.

| Pantalla | WebP pedidos | Tiras de `src/styles/sprites/` |
|---|---|---|
| Portada | `logo-336` (14 974 B), `sofi-blink` (17 002 B) | `sofi-blink` (1) |
| Consulta | `sofi-peek` (45 914 B) | ninguna |
| Expediente | ninguno nuevo | ninguna |

Es coherente con E1 («solo se emite `sofi-blink.webp`»): la build emite además seis estáticas y tres tamaños de logotipo, pero de las tiras solo `sofi-blink`. La fila del expediente refleja el recorrido secuencial (§1.7): no prueba que el expediente no use imágenes.

### 2.6 Sensibilidad al régimen y a la definición de los perfiles

Conjuntos medidos con otras opciones. FCP en ms: mediana de las medianas de ronda, entre corchetes mín–máx y σ.

| Conjunto | Régimen | Perfiles de red | Host | Rondas | Sin limitar | Fast 4G + CPU 4× | Slow 4G + CPU 4× | Pares > 50 ms (Slow) |
|---|---|---|---|---|---|---|---|---|
| **A** (línea base) | Navegador compartido | E2 | `127.0.0.1` | 10 | 180 [176–184] σ 2,7 | 1462 [1372–1536] σ 55,6 | 2410 [2344–2480] σ 41,9 | 22 de 45 |
| B | Navegador compartido | E2 | `localhost` | 8 | 180 [176–192] σ 5,1 | 1434 [1392–1508] σ 44,6 | 2420 [2384–2540] σ 50,4 | 11 de 28 |
| D | Navegador nuevo por muestra | Presets de DevTools (165 ms y 1 012 500 B/s; 562,5 ms y 180 000 B/s) | `127.0.0.1` | 10 | 602 [592–628] σ 10,1 | 1668 [1568–1780] σ 57,6 | 3028 [2892–3116] σ 65,4 | 30 de 45 |

- **El régimen cambia la cifra sin limitar.** Con un navegador nuevo por muestra el FCP sin limitar es ≈ 3,3 veces mayor (602 frente a 180 ms; FCP − load = 520 frente a 112 ms) porque cada carga paga el arranque del navegador. Con limitación no se puede aislar este efecto: el conjunto D usa además otros perfiles de red.
- **La definición del perfil cambia la cifra limitada** (Slow 4G: 3028 ms con los presets de DevTools frente a 2410 ms con los de E2) y la dispersión sigue siendo del mismo orden (σ 65,4 frente a 41,9 ms). Por eso las cifras de FCP solo valen frente a medidas del mismo arnés con las mismas opciones.
- El conjunto D se midió antes de recuperar el guion de E2, con los perfiles que entonces se suponían; sus ids en el JSON son `fast4g` y `slow4g`, pero sus parámetros son los de `fast4g-devtools` y `slow4g-devtools`.

### 2.7 Transitorio inicial de la sesión

Observado, sin causa establecida: las primeras mediciones con limitación de una sesión salen más lentas que las siguientes.

- En el conjunto A, las rondas 1–2 frente a las 3–10: Slow 4G 2478 frente a 2400,5 ms (+77 ms) y Fast 4G 1484 frente a 1446,5 ms (+37 ms).
- En el guion de E2, las 8 primeras ejecuciones (11:06–11:10 UTC, todas con `localhost`) dieron de media 1545 ms en Fast 4G y 2532 ms en Slow 4G, frente a 1473 y 2466 ms de las 12 siguientes (+72 y +65 ms).
- Sin limitar no hay transitorio.

Esta deriva forma parte de la dispersión de §2.3 y es una razón más para comparar medidas de la misma sesión.

### 2.8 Pendiente y no medido

- **Reproducción de E2**: cerrada por decisión (plan §11.2): EX1 la sustituye. La causa de la diferencia sigue sin establecerse (§1.4).
- **Margen de FCP**: retirado (plan §11.2). Los criterios definitivos de FCP, LCP y disponibilidad funcional los propone EX4 con el protocolo A/B (§1.8).
- **Objetivos tras integrar** (EX4), **`rolling`** (EX2) y **`talking`/`uncertain`** (EX3): no se han ejecutado.
- **Otro equipo, otro navegador, otro DPR y CPU sin red (o al revés)**: no medidos.
- **Pantallas en frío por separado** (T091, EX4): el recorrido secuencial no las sustituye.

---

## 3. T002 y T003 — Inventario y verificación de los 13 ZIP

### 3.1 Entorno y método

| | |
|---|---|
| Fecha | 2026-11-03 |
| ZIP verificados | Los 13 de `spec/features/007-ask-sofi-chat/` (sin modificar; siguen sin seguimiento en Git) |
| Extracción | Una carpeta nueva y vacía por ZIP, en el directorio temporal de la sesión, **fuera del repositorio** (`Expand-Archive`) |
| Fuente de referencia | Repositorio de spritesheets, commit `17aca4f` (`catálogo §1`; `asset-provenance.md` §7–§8). Árbol de trabajo limpio y `main` sincronizado con `origin/main` en el momento de la comprobación. Los archivos se leyeron con `git show 17aca4f:<ruta>`, no del disco |
| Hashes de referencia | Cierre (§11) de `auditorias/2026-10-22-correcciones-artisticas/informe.md`, mismo repositorio |
| Comparación | SHA-256 de los ZIP; byte a byte (`Buffer.compare`) de cada archivo extraído contra su fuente en `17aca4f` |

### 3.2 T002 — Inventario

El catálogo §3 lista 14 recursos: `001` sin ZIP (integrado), `007` reservado e inexistente y 13 ZIP.

| Comprobación | Resultado |
|---|---|
| ZIP presentes | 13 de 13: 002–006 y 008–015. `001` y `007` no tienen ZIP, como corresponde |
| Estructura | Todos con un único directorio raíz `sprites/` y 71 archivos en total |
| Archivos de cada ZIP frente a la fuente de `17aca4f` | Para cada recurso, todos los `.webp`, `.scss`, `.js` y `.d.ts` de su carpeta fuente (salvo los `demo.js`, que no se exportan) están en su ZIP, y el ZIP no trae nada que no esté en la fuente (más el `_sprite.scss`). Sin ausencias ni sobrantes |
| `_sprite.scss` | Idéntico en los 13 ZIP (2 142 B, SHA-256 `332e7a88…af76cc`) y byte a byte igual a `scss/_sprite.scss` de `17aca4f` |
| Controladores y tipos | `006` (`poking.js` + `poking.d.ts`), `008` (`are-u-still-here.js` + `.d.ts`) y `009` (`i-see-you.js` + `.d.ts`): cada controlador trae sus tipos. Ningún otro ZIP trae controlador |

Archivos por ZIP: 002 (3), 003 (4), 004 (4), 005 (5), 006 (8), 008 (6), 009 (5), 010 (5), 011 (4), 012 (5), 013 (4), 014 (4), 015 (14).

### 3.3 T003 — Verificación

**Los siete actualizados, frente al cierre del informe de correcciones** (SHA-256 completo y tamaño):

| ZIP | Bytes | SHA-256 | Informe |
|---|---|---|---|
| 002-sofing | 121 095 | `3D3F6B40649C4A795CC2CCE1974E104BC6387753B464B5D78B7B0237C03B594B` | coincide |
| 003-rolling | 64 397 | `0085D65C74C1B8AB5199C7E30FA03F45FEA0B5A0E4D6C607C97520B9A061728F` | coincide |
| 005-favoriting | 59 779 | `E4126C9117CD136C5DD29E3040470C814181F38FF3B3DB9A3166AA43F06BA7F7` | coincide |
| 008-are-u-still-here | 68 749 | `ABAE8750266DA9BFE9A080E2FB94510B9BF049E23BE61EEA4B50DDB99E7924A9` | coincide |
| 012-eureka | 84 971 | `21AA468A402205F3DD649C7110FD395AAE2251B54477B96AB8B3DD356A3B1380` | coincide |
| 013-suspicious | 66 613 | `EDA6C768FD14484F7AA2F04C3D4C80310931029644A2CF3568863E9675820DB6` | coincide |
| 015-memory-wipe | 113 463 | `FFFBF3973C09DE5EEB911285F0C81FAD706108B4138479AAA2E2D4C0BDDFAD3B` | coincide |

**Los seis restantes, por contenido frente a los recursos fuente de `17aca4f`** (no tienen hash de referencia, `asset-provenance.md` §8): 004, 006, 009, 010, 011 y 014. Todos los archivos extraídos son byte a byte iguales a su fuente. SHA-256 de los ZIP, registrados como referencia a partir de hoy (no son una referencia anterior):

| ZIP | Bytes | SHA-256 |
|---|---|---|
| 004-talking | 20 300 | `4739B6BE39C8FB8A4478D51143F03E83EF108B21798290C93342EE095238B39D` |
| 006-poking | 62 430 | `16CD383800F47CC971ACB90DCF51A6C091412F0D2772AD1F6F60334304D98C5A` |
| 009-i-see-you | 35 560 | `3ECF26C16490E4657B80FB2818A601F29C4036F60B68A79A5FEB8379B5040DFF` |
| 010-needs-context | 92 744 | `74FB39FE5FA6AAFF2196CB69A8A31C5A7B533057D1DC04A523C0533765A71D44` |
| 011-error | 49 653 | `7CF6366CCE7445AD1AA82D443842A7CBA2544708BE30AF95EEED1BACAAAE451D` |
| 014-uncertain | 65 171 | `D659E365C1DD0BD9DD85CF5CAC8A4FADBF39393590CF6681ECA7F4BF15EFB3FB` |

**Comprobación adicional (no exigida por T003):** el contenido de los siete ZIP actualizados también coincide byte a byte con las fuentes de `17aca4f`.

### 3.4 Observaciones y límites

- **ZIP frente a `dist/` del repositorio de spritesheets.** Los ZIP de 002, 003, 005, 008, 012, 013 y 015 son byte a byte iguales a los de `dist/` (en `dist/` el de eureka se llama `012-eureka-new.zip`). Los de 004, 006, 009, 010, 011 y 014 **no** lo son. No se ha investigado la causa ni se ha comparado el contenido de esos `dist/` con la fuente: el criterio de T003 para esos seis es el contenido frente a `17aca4f`, que se cumple. `asset-provenance.md` §5 decía que los 14 coincidían byte a byte el 2026-10-21; hoy eso no se cumple para esos seis.
- **Alcance de «igual a la fuente».** Garantiza que el ZIP contiene lo que `17aca4f` publica; no valida el arte (ver `asset-provenance.md` §6) ni la integridad de cada WebP más allá de su igualdad byte a byte. La integridad funcional de los recursos (decodificación, dimensiones, rutas del SCSS, etc.) es VT1 y no se ha ejecutado.
- **Sin discrepancias:** ausencias, sobrantes, hashes y diferencias de contenido: ninguno. No se ha integrado ni modificado nada; T004 y VT1 no se han iniciado.

---

## 4. T004–T008 y VT1 — Integración de los recursos y comprobación de integridad

### 4.1 Qué se hizo

| Tarea | Resultado |
|---|---|
| T004 | Contenido de los 13 ZIP copiado tal cual a `src/styles/sprites/` (extraídos fuera del repositorio, §3.1). Cambian solo `sofing.webp` y `rolling.webp`; `_sprite.scss`, `_sofing.scss` y `_rolling.scss` ya eran iguales a los de los ZIP. `sofi-blink` se conserva. 61 archivos: 40 `.webp`, 14 parciales + `_sprite.scss`, 3 `.js` y 3 `.d.ts` (`poking`, `are-u-still-here`, `i-see-you`) |
| T005 | `_index.scss` retirado. Ningún archivo de `src`, `scripts`, `e2e`, `evals`, `index.html` ni `vite.config.ts` lo importaba |
| T006–T008 | 14 módulos dueños en `src/components/sofi/sprites/` (`<id>.module.scss` y `<id>.ts`): lote 1 (`sofi-blink`, `sofing`, `rolling`, `talking`, `favoriting`, `needs-context`, `error`, `uncertain`, `memory-wipe`), lote 2 (`poking`, `are-u-still-here`, `i-see-you`) y lote 3 (`eureka`, `suspicious`). Cada `.module.scss` es solo el `@use` relativo de su parcial; cada `.ts` exporta `className` y `strips` (glob ansioso limitado a su prefijo). Los controladores no se importan |

Prueba escrita antes que los módulos (RED con 43 fallos y 14 aciertos) y luego en verde: `src/components/sofi/sprites/sprites.test.ts`, 57 pruebas. Comprueba que cada parcial tiene su módulo y viceversa; que el `.module.scss` es solo el `@use` de su parcial; que todas las tiras que usa el parcial existen y llevan el prefijo de su recurso (ninguna sale de él); que `strips` contiene exactamente las tiras de ese prefijo; y que, compilado con Sass y CSS Modules mediante `preprocessCSS` y la configuración real de Vite, expone la clase del recurso con las URL de las tiras rebasadas desde el módulo.

### 4.2 VT1 — Identidad con el commit `17aca4f`

Fuente: repositorio de spritesheets en `17aca4f` (HEAD, árbol limpio). Se compararon los 61 archivos de `src/styles/sprites/`, incluido `001` (`sofi-blink.webp` y `_sofi-blink.scss`, sin ZIP) y `_sprite.scss` (frente a `scss/_sprite.scss`).

| Comprobación | Resultado |
|---|---|
| Contenido byte a byte | 61 de 61 idénticos. Además, `git hash-object` de cada archivo coincide con el blob de `17aca4f` (la comparación no depende de la conversión de saltos de línea) |
| Recursos fuente sin integrar | Ninguno. Cada `.webp`, parcial, `.js` y `.d.ts` de 001–006 y 008–015 (salvo `demo.js`, que no se exporta) está integrado |
| Archivos sin fuente | Ninguno |
| Decodificación | Los 40 `.webp` decodifican con sharp (comprobación adicional) |
| `sofing.webp` y `rolling.webp` frente al HEAD anterior | Mismas dimensiones (2304×384 y 1920×384). Alfa distinto en 0 píxeles. RGB distinto en 211 309 de 884 736 y 106 534 de 737 280 píxeles. Es el cambio que describe `asset-provenance.md` §8 (armonización cromática de 002 y 003); aquí solo se registra la medida |
| `git status` | Solo recursos integrados, `_index.scss` eliminado, los 14 módulos dueños con su prueba y los dos documentos; los 13 ZIP siguen sin versionar |
| `asset-provenance.md` | Conserva el commit `17aca4f` (3 menciones) y la remisión a `auditorias/` (§7) |

### 4.3 Comprobaciones técnicas

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | Sin errores |
| `npx eslint .` | Sin errores |
| `npx prettier --check .` | Sin diferencias (la carpeta de sprites queda fuera por `.prettierignore`; el resto, incluidos los módulos nuevos, cumple) |
| `npm run build` | Correcta. Los archivos de entrada conservan el nombre con hash de la línea base (`index-D8OyO5bk.css`, `index-BF--mqqv.js`) y el mismo tamaño; `dist/assets` no contiene tiras de `sofing`, `rolling`, `poking`, `memory-wipe` ni `eureka`, porque nada importa aún los módulos |
| `npx vitest run` | Primera ejecución: 1 372 de 1 377; las 5 que fallaban eran de `src/server/serverBoundary.test.ts` (§4.4). Tras la corrección: **81 archivos y 1 377 pruebas, todas pasan**; `typecheck`, `eslint`, `prettier --check` y `build` repetidos sin cambios (mismos archivos de entrada) |

### 4.4 Incidencia: los `.d.ts` de los controladores rompen `serverBoundary.test.ts`

Los tres `.d.ts` que T004 manda importar tal cual (`poking.d.ts`, `are-u-still-here.d.ts`, `i-see-you.d.ts`) coinciden con el glob `import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw' })` de esa prueba, y para ellos Vite devuelve `undefined` en lugar del texto. La prueba falla con `Cannot read properties of undefined (reading 'replace')` en cinco de sus once casos: las guardas de la frontera cliente/servidor, que dejan de ejecutarse. Comprobado con una sonda: exactamente esos tres archivos devuelven un valor que no es texto, de 226. **Corrección autorizada (2026-11-03):** `read()` excluye solo los `.d.ts`; el resto de las guardas (código ejecutable de `src` y `api`) no cambia. Se añade una regresión en «encuentra los ficheros que protege»: todas las fuentes leídas son texto y ninguna es un `.d.ts`. Los recursos y controladores no se tocaron y no se amplió el alcance de 006.

### 4.5 Notas

- `eureka` y `needs-context` definen además una clase suelta (`.eureka-spark`, `.needs-context-question`) que el catálogo, la spec y el plan no mencionan; los módulos dueños no la exportan. Queda anotado por si 008 la necesita.
- `SofiPortrait.module.scss` sigue importando el parcial de `sofi-blink` directamente; pasa al módulo dueño en la capa visual (plan §5.4), no en estas tareas. Mientras tanto hay dos módulos que importan ese parcial, sin que ninguno cargue el nuevo.
- Con §4.4 resuelta, T004 y VT1 cumplen sus criterios.

---

## 5. A2 — Movimiento (T009–T016 y VT2)

Fecha: 2026-11-03. Antes de empezar: A1 cerrado y VT1 aprobado (§4); el árbol de trabajo estaba limpio sobre `3bf765f`.

### 5.1 Qué se hizo

| Tarea | Resultado |
|---|---|
| T009 y T010 | Campo `motion` (`system \| reduce \| full`) en `preferencesStorage`: valor por defecto `system`, `z.catch` por campo y sin cambiar de versión (registro `version: 1`). Un registro anterior sin el campo se lee como `system`. `clearUserData` lo devuelve a `system`: borra todo el espacio de nombres, y la prueba lo confirma con `motion: 'full'` guardado. Las pruebas que comparaban las preferencias completas incorporan `motion` |
| T011 y T012 | `src/app/providers/motion.ts` (`applyMotionPreference`, `isReducedMotion`). `useReducedMotion` devuelve el estado efectivo de los seis modos de plan §4.1. `MotionPreferenceProvider` conserva `value` y escribe `data-motion` en `<html>` (sin `div`); al desmontarse o cambiar, devuelve lo que había. `main.tsx` aplica la preferencia guardada antes del primer render. `src/test/setup.ts` limpia `dataset.motion` entre pruebas. Los consumidores (`SofiSpeech`, desplazamientos, retratos) y los tres usos del Lab (`DesignLab`, `PreviewFrameRoot`, `ProfileFrameRoot`) no cambian de código; la prueba del Lab comprueba ahora que el único ámbito es `<html>` |
| T013 y T014 | `u.reduced-motion` genera `@media (prefers-reduced-motion: reduce) { :where(:root:not([data-motion='full'])) & }` y `:where(:root[data-motion='reduce']) &`. Prueba compilando con Sass (`src/styles/utilities/reducedMotion.test.ts`, 5 pruebas) |
| T015 y T016 | Plugin PostCSS en línea `scripts/spriteReducedMotion.ts`, registrado en `vite.config.ts` (`css.postcss.plugins`), sin dependencias nuevas. 26 pruebas con `preprocessCSS` (`scripts/spriteReducedMotion.test.ts`) |
| VT2 | Los 14 módulos dueños reales con la configuración real (§5.4) |

RED → GREEN: las pruebas de T009 (20 fallos), T013 (3 de 5 fallos antes del cambio del mixin) y T015 (la importación del plugin no existía) se vieron fallar antes de su código. En T011 los casos del hook que ya cubría el comportamiento previo (cinco de los ocho) pasaban de entrada; fallaron el modo `full` con sistema reducido y todo el archivo del proveedor, que no podía importar `motion.ts`.

### 5.2 Especificidad y comparación en el Lab (T014)

Plan §12 pide revisar el Lab en modo forzado porque la rama forzada pierde el `(0,1,0)` que le daba su atributo. Se midió en Chromium sobre los 12 módulos que usan el mixin (`SofiDialog`, `SofiPortrait`, `SofiSpeech`, `Button`, `Indicators`, `Loader`, `OptionGroup`, `Spinner`, `TextLink`, `Ticker`, `MotionSection` y `ProfileSheet`):

- Se volcaron `animation-name`, `animation-duration`, `animation-iteration-count`, `transition-property`, `transition-duration` y `display` de todos los elementos de `#lab-main` y de los iframes de las seis secciones del Lab, en tres modos (normal, sistema reducido y forzado desde el botón «Reducido»), con el mixin anterior y con el nuevo.
- Resultado: 11 224 estados de elementos comparados, **0 diferencias** (se normalizó el hash de CSS Modules de los nombres de animación, que cambia con el contenido del mixin). Con el mixin anterior el modo forzado sí cambia 854 de 3 574 elementos frente al normal, por lo que la comparación no es trivial.
- Al no cambiar ningún elemento, no se toman capturas antes/después.
- **Sin comprobar:** el `:hover` real de `Button` y `OptionGroup` (el volcado no pasa el ratón; la variante `data-force-state='hover'` sí está en el Lab). Por lectura del código, sus reglas reducidas (`&:hover { transform: none }`) quedan en la misma especificidad `(0,2,0)` que la base y después de ella, y la rama del sistema ya era así. Tampoco se mide Firefox ni WebKit (§5.6).

### 5.3 Efecto en la build

| | Antes (`3bf765f`) | Ahora |
|---|---|---|
| CSS de entrada | 48 292 B; `gzipSync` 9 780 B | 49 006 B (+714); `gzipSync` 9 806 B (+26) |
| JS de entrada | 336 343 B | 336 652 B (+309) |

El aumento del CSS viene del mixin (cada uso lleva dos prefijos más); el del JS, de `motion.ts` y del efecto del proveedor. La referencia de EX1 (9 780 B) sigue siendo la de la build del commit de la línea base, que es la A de EX4.

### 5.4 VT2 — Módulos dueños reales con el plugin

`src/components/sofi/sprites/reducedMotion.test.ts`, con la configuración real de `vite.config.ts` (Sass, plugin y CSS Modules):

| Comprobación | Resultado |
|---|---|
| Los 14 módulos compilan | Sí, sin romper el build ni la tabla de plan §4.3 |
| Solo ellos son alcanzados | Los 14 parciales compilados por su propia ruta quedan sin prefijos. El resto del CSS de la app solo cambia por el mixin (§5.3) |
| Reglas | En los 14, quitando los prefijos y los clones se obtiene exactamente el CSS del parcial. Cada regla de cada `@media` lleva su prefijo en el sitio y su clon forzado justo detrás, en el mismo orden y con las mismas declaraciones. 62 bloques en total (36 `reduce` y 26 `no-preference`), sin otra forma de media |
| Parciales intactos | `git status` no los muestra modificados. La comparación de VT1 se repitió después de todos los cambios: 61 de 61 archivos idénticos a `17aca4f` |
| Formas rechazadas | Ningún parcial usa `html`, `:root` ni `body`, reglas anidadas, ni `@keyframes` dentro de un bloque de movimiento |

### 5.5 Comprobaciones técnicas

| Comprobación | Resultado |
|---|---|
| `npm run typecheck`, `npx eslint .`, `npx prettier --check .` | Sin errores |
| `npm run build` | Correcta |
| `npx vitest run` | 86 archivos, 1 476 pruebas, todas pasan |
| `npx playwright test` (Chromium, servidor propio del puerto 5199) | 158 pruebas, todas pasan, incluidas dos nuevas en `e2e/persistence.spec.ts`: la preferencia `full` guardada llega a `<html>` y sin preferencia no hay `data-motion` |

### 5.6 Pendiente y notas

- **Firefox y WebKit:** no se han ejecutado. La confirmación con la implementación es VT4 y VT6.
- **La aplicación real no monta `MotionPreferenceProvider` con la preferencia guardada.** `main.tsx` pone `data-motion` en `<html>` (el CSS ya obedece), pero `useReducedMotion` solo ve la preferencia a través del proveedor, que hoy usan el Lab y las pruebas. Mientras no haya un control que guarde `reduce` o `full`, el valor guardado es siempre `system` y no hay efecto visible. El proveedor con la preferencia, su suscripción y el control son de C6/T071, tras AV7; queda anotado.
- **Plan §10 punto 7 dice «entorno `node`».** `src/test/setup.ts` usa `window`, así que las pruebas del plugin corren en el entorno por defecto (jsdom). El plugin y `preprocessCSS` son de Node y no dependen del DOM.
- **`SofiPortrait`** sigue importando el parcial de `sofi-blink` fuera del alcance del plugin; ese cambio pertenece a la capa visual (plan §5.4).

---

## 6. A3 — Capa visual pura, parte 1 (T017–T026)

Fecha: 2026-11-03. Antes de empezar: A2 cerrado (§5). Todo en `src/components/sofi/visual/`, sin React ni archivos. Ninguno de estos módulos lo importa aún la aplicación: la build de producción no cambia (mismos archivos de entrada que en §5.5).

### 6.1 Módulos y pruebas

Cada pareja RED → GREEN se vio fallar antes del código (la importación del módulo no existía; en `ambient` se retiró el módulo ya escrito para comprobarlo).

| Tareas | Módulo | Qué hace | Pruebas |
|---|---|---|---|
| T017–T018 | `presentationGate.ts` | `presentationGate({ kind, firstCycleEnded, elapsedMs, limitMs, reducedMotion })` devuelve `{ present: true }` o `{ present: false, waitMs }` (lo que falta hasta el límite). Solo `interpreted` y `needs_context` esperan; los otros siete tipos del catálogo §6.4 (error, ambas seguridades, privacidad, borrado, cancelación, salida rápida) y el movimiento reducido presentan en el acto. No conoce la operación, así que no puede retrasarla. Un límite o un tiempo no válido presenta | 18: cada tipo, el final del ciclo, el límite (justo antes, en él y después), la espera nunca por encima del límite y un escenario con reloj falso |
| T019–T022 | `select.ts`, `types.ts` | `selectVisual(estado, { lab })` es una función pura del estado semántico actual. Cubre la tabla del catálogo §5, la jerarquía §6.1 y la matriz §6.3, y `wipeAfter(señal)` fija el contrato de las dos señales del borrado total | 35: tabla del catálogo §5, `talking` por `speaking`, `interpreted` en producción y en el Lab, pasada única sin cola, nueve combinaciones de jerarquía, salida rápida, el barrido de 2 304 combinaciones (`memory-wipe` solo con borrado efectivo y nunca en salida rápida; nada de `eureka`/`suspicious` fuera del Lab; ninguna animación con seguridad o salida rápida) y las dos señales de borrado |
| T023–T024 | `ambient.ts` | `createAmbient()`: causas de pausa de la escena (`busy`, `interaction`, `sensitive`, `hidden`), un solo gag activo y `pause()`/`resume()` sin argumentos solo al pasar de ninguna causa a alguna y al revés | 10 |
| T025–T026 | `activityLabels.ts` | `activityLabel({ kind, pending, elapsedMs, reducedMotion })` sigue un calendario y devuelve `null` cuando la operación real ya no está pendiente, aunque la animación esté en su primer ciclo | 8 |

Total 71 pruebas nuevas tras el cierre (§6.3). `types.ts` lista los 14 identificadores del catálogo §3 (el 007 sigue reservado). El estado selecciona 11 de ellos; los tres gags (`poking`, `i-see-you`, `are-u-still-here`) viven sobre el reposo y los coordina `ambient`.

### 6.2 Comprobaciones técnicas

| Comprobación | Resultado |
|---|---|
| `npm run typecheck`, `npx eslint .`, `npx prettier --check .` | Sin errores |
| `npm run build` | Correcta; sin cambios en los archivos de entrada |
| `npx vitest run` | 90 archivos, 1 547 pruebas, todas pasan (tras el cierre de §6.3) |

### 6.3 Cierre de T017–T026: decisiones aprobadas

La autora aprobó el 2026-11-03 las seis decisiones de diseño de esta parte; su texto vive en `008-plan.md` §11.3 (D-17 a D-22) y no se repite aquí. Comprobación del código frente a cada una:

| Decisión | Resultado |
|---|---|
| D-17 retención de 3000 ms experimental | Cumple. `PROVISIONAL_RETENTION_LIMIT_MS` vale 3000 y lo fija una prueba; el gate no tiene valor por defecto (el límite entra como parámetro) y solo retiene `interpreted` y `needs_context`. Se aclaró en su comentario que es experimental hasta AV2 |
| D-18 prioridades | **Un incumplimiento corregido:** `favoriting` quedaba por detrás de `talking`, aunque su ficha (catálogo §4) no lista el habla entre sus interrupciones, así que el habla la cortaba. Ahora `favoriting` se reproduce antes de `talking` y `uncertain`, cuya ficha sí lista la intervención hablada, sigue cediendo. Dos filas nuevas en las pruebas de jerarquía (una vista fallar antes del cambio). El resto de las animaciones ya respetaba las interrupciones de su ficha |
| D-19 el flujo gestiona las señales | Cumple: `selectVisual` es una función pura que no guarda nada; `settled` y `outcome` los pasa y retira quien posee el estado (comentarios del tipo `SofiState`) |
| D-20 etiquetas fijas con movimiento reducido | Cumple: se queda la primera etiqueta de la actividad; cambia solo con otra actividad o al terminar la operación. Fijado en una prueba |
| D-21 copy provisional | Cumple, y la prueba por defecto lo fija: «sofing…», «cooking…» a los 4000 ms y «rolling…» |
| D-22 `hidden` independiente | Cumple: es una causa propia y la prueba de varias causas la incluye y comprueba que el gag sigue pausado cuando las demás se van |

### 6.4 Pendiente

- El registro (T027–T028), las velocidades (T029–T030), `sofiVisuals` (T031), el modo durante `memory-wipe` (T032–T033) y la remisión en el plan (T034) no se han hecho.
- La conexión de `selectVisual` con `SofiSprite`, con `SofiSpeech.speaking` y con las señales de `009` es de A4 y de las features emisoras.

---

## 7. A3 — Capa visual pura, parte 2 (T027–T031)

Fecha: 2026-11-03. Antes de empezar: A2 y T017–T026 cerradas y publicadas (`d57acc5` y `f17e162`). Su CI en GitHub Actions terminó en éxito (ejecución de `f17e162`, la única que lanzó el push de los dos commits). `gh` no está autenticado en esta máquina; el estado se leyó de la API pública del repositorio.

### 7.1 Qué se hizo

| Tareas | Resultado |
|---|---|
| T027–T028 | `visual/registry.ts`: tabla `SOFI_REGISTRY` de los 14 recursos con `playback` (`loop`, `once` o `machine`, catálogo §3), `reducedPose`, `maskStrips`, `singlePassClass` donde el parcial lo pide y `load`, el cargador `import()` de su módulo dueño. `eureka` y `suspicious` no tienen cargador. Incluye `SOFI_STATICS`, el catálogo de las seis estáticas aprobadas, que pasa a ser el único sitio con sus rutas |
| T029–T030 | `visual/rates.ts`: `rateFor(id)` (1× por defecto), `PRODUCTION_RATES` (tabla única, hoy vacía hasta AV3) y la sobrescritura de sesión en memoria (`setSessionRate`, `clearSessionRates`) |
| T031 | `sofiVisuals.ts` conserva `SOFI_VISUALS` y `visualFor` y toma las rutas de `SOFI_STATICS`. Solo cambian sus importaciones; sus pruebas de 004 no se tocaron |

Las pruebas se vieron fallar antes del código (el registro y las velocidades no existían; el catálogo de estáticas ya lo incumplía `sofiVisuals.ts`, que aún importaba las imágenes).

### 7.2 Pruebas

`registry.test.ts` (74) contrasta el registro con el catálogo y con los parciales de los ZIP, que son la fuente de verdad:

- los 14 recursos y su tipo de reproducción, escritos aparte desde el catálogo §3;
- su tira principal existe y, para cada cargador, el módulo dueño exporta exactamente las tiras de su prefijo;
- pose reducida: la del parcial (compilado con Sass) anula la animación base bajo `reduce`; los tres gags solo se mueven bajo `no-preference`; una desviación solo puede apuntar a un fotograma existente de otro recurso;
- `singlePassClass` coincide con los parciales que piden `animation-iteration-count: 1` para una pasada (`favoriting`, `error`, `needs-context`), y los demás `once` ya llegan como una sola pasada;
- `maskStrips` coincide con las tiras que el parcial usa en `mask`/`mask-image` (hoy solo `memory-wipe-dissolve.webp`);
- `eureka` y `suspicious` sin cargador y sin ninguna mención en el código del registro;
- las entradas no llevan duraciones;
- `SOFI_STATICS` coincide con los `.webp` de `src/assets/sofi/` y ningún otro archivo de `src` los importa.

`rates.test.ts` (8): 1× para los 14, tabla de producción de factores válidos, sobrescritura de sesión que solo cambia el recurso indicado, no persiste (sin `localStorage` ni `sessionStorage`) y rechaza 0, negativos, `NaN` e infinito conservando el valor anterior.

Sensibilidad: se quitó a propósito `singlePassClass` de `error`, la tira de máscara de `memory-wipe` y el tipo de `poking`; fallaron seis pruebas y se restauró.

### 7.3 Efecto en la build

| | Antes de T031 | Ahora |
|---|---|---|
| CSS de entrada | 49 006 B; `gzipSync` 9 806 B | Idéntico (mismo archivo, `index-Dl-0FquU.css`) |
| JS de entrada | 336 657 B; `gzipSync` 108 186 B | 336 846 B (+189); `gzipSync` 108 210 B (+24) |
| `.webp` en `dist/assets` | 10 | 29 |

La entrada no referencia ninguna tira de los recursos diferidos ni ningún `import()`: `SOFI_REGISTRY` no tiene aún consumidores y el bundler lo descarta. Sin embargo, al entrar los módulos dueños en el grafo, Vite emite sus tiras como archivos, así que `dist` lleva 19 `.webp` que nadie pide todavía. No se descargan; pasan a estar referenciados por los chunks diferidos cuando `SofiSprite` use el registro (T035–T037). `eureka` y `suspicious`: 0 tiras en la build.

### 7.4 Comprobaciones técnicas

| Comprobación | Resultado |
|---|---|
| `npm run typecheck`, `npx eslint .`, `npx prettier --check .` | Sin errores |
| `npm run build` | Correcta |
| `npx vitest run` | 92 archivos, 1 629 pruebas, todas pasan |
| `npx playwright test` | 158 pruebas; en la primera pasada falló una (`a11y`, Design Lab · foundations, claro: la navegación del Lab no apareció en 5 s). Repetido `e2e/a11y.spec.ts`: 42 de 42 |

Los fallos de esa pasada (esa y ocho pruebas de Vitest con tiempos de ~5 s) coinciden con haber lanzado a la vez Vitest y Playwright, que comparten CPU en este equipo (la primera carga del Lab en frío tarda 3–4 s por sí sola). Repetidos por separado, todo pasa; no se subió ningún tiempo límite.

### 7.5 Notas

- **Cuando `SofiPortrait` pase al módulo dueño de `sofi-blink` (T038)**, ese módulo estará a la vez en la entrada y detrás del cargador del registro; Vite lo avisará como importación dinámica ineficaz. Se decide en T038: o `sofi-blink` sin cargador, o se acepta el aviso.
- **`PRODUCTION_RATES` está vacía** hasta AV3 (T082). No hay suscripción a cambios de velocidad: `SofiSprite` (T037) decide cómo se entera el Lab.
- **Textos que mencionan a `sofiVisuals.ts` como único sitio con rutas** (`004-plan.md` §6, descripción de la sección del expediente en el Lab) describen el estado anterior. Con T031 las rutas están en el registro y la correspondencia sigue en `sofiVisuals.ts`; no se tocaron, el Lab por no introducir cambios visuales.

---

## 8. A3 — Modo efectivo durante `memory-wipe` (T032–T034)

Fecha: 2026-11-03. Antes de empezar: T027–T031 publicadas (`0a133b3`); su CI en GitHub Actions terminó en éxito. La decisión es D-23 de `008-plan.md` §11.3; aquí solo consta cómo se comprobó.

### 8.1 Qué se hizo

| Tareas | Resultado |
|---|---|
| T032 | `src/app/providers/motionHold.test.tsx`, 11 pruebas, vistas fallar antes del código (`holdMotion` no existía) |
| T033 | `holdMotion` en `src/app/providers/motion.ts`. Captura el modo efectivo inicial leyendo el único `data-motion` de `<html>` y el sistema, y lo fija como `reduce` o `full`. Mientras dura, `applyMotionPreference` no escribe y recuerda la última petición; `restoreMotionAttribute` (la limpieza del proveedor) se descarta. Al terminar se aplica la última petición o, si no hubo, la preferencia vigente que pasa quien libera. `useReducedMotion` sigue el modo retenido con `useSyncExternalStore`. No se necesita otro ámbito de movimiento |
| T034 | `008-plan.md` §5.2: remisión a `visual/select.ts` (intenciones y señales de borrado) y a `holdMotion` (modo), sin copiar su contenido; el orden de las llamadas queda documentado en el comentario de `holdMotion`. El riesgo de §12 pasa a resuelto, y D-23 se añade a §11.3 |

Cambios de apoyo: `MotionPreferenceProvider` usa `restoreMotionAttribute` en su limpieza, y `src/test/setup.ts` reinicia la reacción retenida entre pruebas (es estado del módulo).

### 8.2 Contrato para 007 y 009

Quien orquesta el borrado total llama a `holdMotion()` **antes** de borrar y guarda la función que devuelve. Al terminar la confirmación funcional, o al interrumpirse la reacción (navegación, cierre de la vista), la llama con `readPreferences().motion`. Repetir la llamada no vuelve a escribir. Una segunda `holdMotion()` mientras dura la primera devuelve la misma función. La interfaz de borrado es de 009 y no se ha tocado.

### 8.3 Pruebas

- **Los tres modos de entrada y las dos situaciones del sistema** (`system`, `reduce`, `full` × reduce del sistema sí/no, seis casos): tras `clearUserData()` la preferencia guardada es `system`, pero `data-motion` y `useReducedMotion` siguen en el modo inicial; al terminar vuelve a `system`, el atributo desaparece y no se escribe nada en el almacenamiento. Un aplicador que sigue a las preferencias guardadas, como tendrá el control de C6, intenta escribir el valor restablecido y no pisa la reacción.
- El sistema cambia a mitad de la reacción: no la altera.
- Interrumpirla da el mismo resultado y repetir el fin no pisa un valor posterior.
- Una segunda reacción mientras dura la primera conserva el modo inicial.
- Coordinación con el proveedor: un cambio de su valor durante la reacción se aplica al terminar (manda lo último pedido); desmontarlo durante la reacción no la interrumpe.

Sensibilidad: se quitó a propósito, una a una, la guardia de `applyMotionPreference` (8 pruebas fallan), la de `restoreMotionAttribute` (1) y la petición diferida (2); se restauró.

### 8.4 Comprobaciones técnicas

| Comprobación | Resultado |
|---|---|
| `npm run typecheck`, `npx eslint .`, `npx prettier --check .` | Sin errores |
| `npm run build` | Correcta. CSS de entrada idéntico (49 006 B; `gzipSync` 9 806 B). JS de entrada 337 071 B (+225 B; `gzipSync` 108 333 B, +123 B) |
| `npx vitest run` | 93 archivos, 1 640 pruebas, todas pasan |
| `npx playwright test` (Chromium) | 158 pruebas, todas pasan |

### 8.5 Pendiente

- **Firefox y WebKit:** la reacción retenida solo se ha probado en jsdom y en el entorno de pruebas; el comportamiento real de `data-motion` y de la reacción va en T046 y T073.
- **Consumo real:** nada llama aún a `holdMotion` ni emite las señales de borrado (009 y el Lab, que las simula). El mecanismo es el mismo `data-motion` de `<html>` para CSS y `useReducedMotion` para JS.

---

## 9. A4 — Pintura: `SofiSprite` y `SofiPortrait` (T035–T038)

Fecha: 2026-11-03. Antes de empezar: A3 cerrado (§8, commit `6494c5e`) y su CI en GitHub Actions terminada en éxito (ejecución de `6494c5e`, leída de la API pública del repositorio).

### 9.1 Qué se hizo

| Tareas | Resultado |
|---|---|
| T035–T036 | `SofiSprite.test.tsx`, 21 pruebas, vistas fallar antes del código (no existían `SofiSprite` ni `loadSprite`). Módulos y tiras simulados; Web Animations simuladas solo con `getAnimations` y `playbackRate` |
| T037 | `src/components/sofi/SofiSprite/`: `SofiSprite.tsx`, `loadSprite.ts` (módulo dueño + decodificación de todas sus tiras, con `crossOrigin='anonymous'` en las de máscara que declara el registro) y `SofiSprite.module.scss` |
| T038 | `SofiPortrait` gana `animation`, pinta el parpadeo con el módulo dueño `sprites/sofi-blink` y ya no importa el parcial. Recorte, contorno y tamaño no cambian |

### 9.2 Contrato de `SofiSprite`

- **Carga:** hasta que el módulo carga y todas sus tiras se decodifican se ve el fotograma de reposo de `sofi-blink` (quieto). Solo entonces se aplica la clase del recurso. Si algo falla se queda la estática, y el fallo no se recuerda: el siguiente montaje lo reintenta. Un recurso ya cargado se pinta de entrada. Una carga en curso la comparten los que piden el mismo recurso.
- **Pasada única:** la clase propia solo donde el registro la declara (`favoriting`, `needs-context`, `error`).
- **Velocidad:** `playbackRate` sobre el subárbol, reaplicado en `animationstart`. Los cambios de sesión del Lab llegan por `subscribeToRates`: sin suscripción, leer `rateFor` en el render queda obsoleto con el compilador de React.
- **Ciclo:** `onFirstCycle` en la primera vuelta de un bucle o al acabar la pasada, y `onEnd` al acabar una pasada única; cada uno una sola vez, aunque acaben varias capas. Con movimiento reducido o sin Web Animations no hay animación y no se emite (el estado efectivo de movimiento es entrada de `presentationGate`).
- **Accesibilidad:** siempre `aria-hidden`, sin `role` (D-3).
- **Estática:** `sofi-blink` se pinta de entrada, sin cargador ni decodificación; `eureka` y `suspicious`, sin cargador de producción, se quedan en la estática.

### 9.3 Decisiones de implementación dentro del alcance

- **`sofi-blink` sin cargador en el registro** (la nota de §7.5): es estática (plan §7) y `SofiSprite` ya importa su módulo como respaldo, así que un `import()` suyo no lo movería de chunk. Prueba nueva en `registry.test.ts`. La build no emite ningún aviso.
- **Eventos de animación nativos** (`addEventListener` en un efecto), como en la medición E5, no las propiedades de React: en jsdom React escucha `animationend` con prefijo de proveedor y los eventos no llegan.
- **Un `SofiSprite` por recurso** (`key={animation}`): cambiar de animación reinicia la carga y el recuento del primer ciclo.
- **Especificidad en lugar de orden:** el parcial llega por otro CSS (los recursos diferidos, por un chunk que se carga después), así que `.root.fallback`, `.root.singlePass` y `.sprite.frame0/1/2` ganan por especificidad, no por posición en la cascada.
- **`SofiPortrait` con `animation` distinto de `sofi-blink`:** `expression` y `frame` no se usan, y el retrato se envuelve como con imagen o recorte, de modo que la alternativa (`alt`) vive en el contenedor y el recurso sigue decorativo.

### 9.4 Pruebas

- **Vitest:** `SofiSprite.test.tsx` (21), `SofiPortrait.test.tsx` (5), más una prueba en `sprites.test.ts` (ningún otro módulo SCSS importa un parcial de sprites; falla antes del cambio con `SofiPortrait.module.scss`), una en `rates.test.ts` (suscripción) y una en `registry.test.ts` (`sofi-blink` estática).
- **Sensibilidad:** se rompió a propósito, una a una, 11 guardas (clase antes de decodificar, `crossOrigin` de máscara, reaplicar en `animationstart`, las dos guardas de una sola vez, la clave por animación, la clase de pasada única, eventos con la estática, recordar un fallo, `role="img"` y que el retrato ignore `animation`). Las 11 las detecta alguna prueba. Una de ellas, recordar un fallo, no la detectaba ninguna: se añadió su prueba.
- **Chromium, versionado (`e2e/sofi-motion.spec.ts`, 12 pruebas):** el parpadeo y un fotograma fijo del retrato de «Sofi Components» en los seis modos (sistema normal o reducido × sin atributo, `reduce`, `full`). **Control de E11:** antes del cambio, 11 de 12 pasaban y fallaba `sistema reduce · data-motion full` (el parpadeo ignoraba `full`); con el módulo dueño pasan 12 de 12. Este archivo es la semilla de T046, que lo amplía a Firefox y WebKit.
- **Chromium, comprobación puntual con una página temporal que no se versiona (13 de 13):** `sofing` con la estática antes de cargar y el recurso animado después (velocidad 10× aplicada, un solo `onFirstCycle` y ningún `onEnd` tras varias vueltas); `favoriting` a 8× con una pasada, `first,end` una vez cada uno y 0 animaciones vivas; `rolling` a 4× en sus 8 capas y cambio en vivo a 2×; pose reducida sin animación ni eventos con el sistema en reduce y con `data-motion=reduce`; animado y con eventos con `full` aunque el sistema pida reducir; una tira bloqueada deja la estática; la tira de máscara de `memory-wipe` se pide una sola vez como imagen. El conteo de peticiones de la primera pasada daba 2 porque incluía la petición de módulo de Vite en desarrollo (`?import&url`); la sonda se corrigió para contar solo imágenes.

### 9.5 Efecto en la build

| | Antes (§8) | Ahora |
|---|---|---|
| CSS de entrada | 49 006 B; `gzipSync` 9 806 B | 49 424 B (+418); `gzipSync` 9 871 B (+65). Frente a la línea base de EX1 (9 780 B): +91 B |
| JS de entrada | 337 071 B; `gzipSync` 108 333 B | 344 222 B (+7 151); `gzipSync` 111 063 B (+2 730) |
| Chunks diferidos | — | 11 de JS y 11 de CSS, uno por módulo dueño (todos menos `sofi-blink`, `eureka` y `suspicious`) |
| `.webp` en `dist/assets` | 29 | 29, ahora referenciados por los chunks diferidos. Ninguno de `eureka` ni de `suspicious` |

El aumento del JS de entrada viene del registro, que deja de descartarse porque ya tiene consumidor, de `SofiSprite` y su cargador, y del ayudante de precarga de Vite. El CSS crece por `SofiSprite.module.scss` y por el clon forzado que el plugin añade al parcial de parpadeo, que ahora sí pasa por él.

### 9.6 Comprobaciones técnicas

| Comprobación | Resultado |
|---|---|
| `npm run typecheck`, `npx eslint .`, `npx prettier --check .` | Sin errores |
| `npm run build` | Correcta, sin avisos |
| `npx vitest run` | 95 archivos, 1 669 pruebas, todas pasan (incluida la nueva de excepciones temporales del Lab) |
| `npx playwright test` (Chromium) | 170 pruebas (158 anteriores y 12 nuevas), todas pasan |

### 9.7 Pendiente y notas

- **Firefox y WebKit:** no se han ejecutado. La confirmación con la implementación es VT4 (T045–T046) y VT6.
- **Design Lab (decisión aprobada):** `SofiSprite` aún no se ve en el Lab, y no se declara cubierto por `SofiPortrait`. `coverage.test.ts` lleva una excepción temporal explícita, `PENDING_IN_LAB`, separada de `COVERED_BY_PARENT` y vinculada a T058, con una prueba que obliga a retirarla en cuanto el Lab lo muestre. No se adelantó el inspector ni se tocó el Lab visualmente.
- **Sin consumidor real:** solo `SofiPortrait` usa `SofiSprite`, y ninguna pantalla pasa todavía `animation` (el selector de recursos y el controlador son de T042 y del bloque C).
- **Movimiento reducido:** `SofiSprite` no añade movimiento propio. La pose reducida es la del parcial, resuelta por el plugin de PostCSS (D-1); se comprobó en Chromium con los tres casos de arriba, y la equivalencia completa de los seis modos por recurso es T046.

---

## 10. A4 — Habla y controladores (T039–T042 y VT3)

Fecha: 2026-11-03. Antes de empezar: `main` en `76fc014` (A4, T035–T038), con su CI en GitHub Actions superada según indicó la autora al autorizar el bloque.

### 10.1 Qué se hizo

| Tareas | Resultado |
|---|---|
| T039 | 7 pruebas nuevas en `SofiSpeech.test.tsx`, vistas fallar antes del código (6 fallaban; la de movimiento reducido pasa en vacío antes y después, y es una guarda) |
| T040 | `SofiSpeech` gana `onSpeakingChange` (D-12). Reutiliza el aviso de voz de `useSpeechTimeline`, que ya solo se llama al cambiar `speaking` y al cancelar mientras suena. `onStateChange` no cambia |
| T041 | `useSofiController.test.tsx` (35 pruebas) con los **tres controladores reales** de los ZIP (`poking.js`, `are-u-still-here.js`, `i-see-you.js`, sin simular ni tocar). Se simulan solo los módulos dueños, la decodificación de las tiras y los observadores que jsdom no implementa. Vistas fallar antes del código (el módulo no existía) |
| T041 (instrumentación) | `src/test/leakProbe.ts`, solo de pruebas: envuelve `addEventListener` (de `EventTarget.prototype` y de `window`, que no lo hereda), `setTimeout`, `setInterval` y `requestAnimationFrame`, y sustituye `IntersectionObserver` y `ResizeObserver`. `leakProbe.test.ts` (6) deja escapar cada tipo de fuga a propósito y comprueba que se ve. No se ha modificado ni instrumentado producción |
| T042 | `src/components/sofi/useSofiController.ts` |
| VT3 | Ver §10.3 |

### 10.2 Contrato del adaptador

- `useSofiController(kind, host, { ambient, calm })` devuelve la clase del gag (o `undefined`). Monta solo con `calm`, movimiento efectivo no reducido, anfitrión montado y las tiras del gag decodificadas (con `loadSprite`, el mismo cargador que `SofiSprite`). Sin esas condiciones no se pide ni una tira ni se carga el controlador.
- El `import()` de cada controlador va dentro del hook y se espera **antes** de montar: si la limpieza llega mientras carga, no se crea nada que haya que deshacer. Una prueba de contrato sobre el código fuente impide un import estático (T043 lo comprobará sobre la build).
- Pasa `idleAfter: STILL_HERE_IDLE_MS` (150 000 ms, provisional, plan §6) a `are-u-still-here`, no el 90 000 ms del ZIP, y la velocidad de `visual/rates` con `setRate`, al montar y en vivo.
- Se inscribe en `visual/ambient` con `pause()` y `resume()` sin argumentos, también con `attachPoking`, que pierde el motivo al delegar; se da de baja antes de destruir el controlador.
- Declara el gag activo cuando sale del reposo (`i-see-you`: reaccionar; mirar no cuenta) y lo desactiva al volver.

### 10.3 VT3 — resultados (jsdom, controladores reales)

| Comprobación | Resultado |
|---|---|
| Al desmontar, sin StrictMode y con él, para los tres gags: escuchas (`window`, `document`, anfitrión), observadores, temporizadores, fotogramas, capas y atributos | La instantánea de la sonda vuelve **exactamente** a la línea base previa al montaje (6 casos), y antes de desmontar la sonda ve algo que limpiar |
| Montar–destruir–montar de StrictMode | Mismo conjunto añadido que sin él (escuchas, temporizadores, observadores y capas), con y sin las tiras ya en caché (6 casos). El segundo es el que ejerce la cancelación de la limpieza |
| Desmontar mientras carga el controlador | No se monta nada ni quedan escuchas globales (3 casos) |
| Pasar a movimiento reducido, o dejar de estar en escena tranquila | Destruye el controlador y deja la línea base (3 + 3 casos). Con reducido desde el inicio no se pide ninguna tira |
| Tiras sin decodificar o con fallo | No se aplica la clase ni se monta; el fallo no se propaga |
| Causas simultáneas con el temporizador real | `poking` (pierde el motivo): con `busy` y `sensitive`, reanudar `busy` no reanuda; el reposo de 10 s corre al quitar la última. `are-u-still-here`: la cuenta atrás espera a la última causa. Un controlador que nace con causas activas nace pausado |
| Umbral de inactividad | `idle` a los 149 000 ms y `drowsy` a los 150 500 ms (no a los 90 000 ms) |
| Velocidad | Al montar con 10×, `drowsy` a los 15 s; en vivo a 0,5× se duplica lo que falta |
| Un solo gag activo | `poking` se declara activo con el primer pinchazo, una vez, y se desactiva al volver al reposo; `i-see-you` en `watching` no activa y con el cursor encima (`caught`) sí; un fotograma de mirada pendiente se cancela al desmontar |
| Baja de `ambient` | Cada inscripción se da de baja al desmontar (3 casos) |

**Sensibilidad.** Se rompió a propósito, una a una, cada guarda y se comprobó que alguna prueba falla: sin `destroy()` (13 fallan), sin `unregister` (3), sin la cancelación de la limpieza (4), sin `idleAfter` (4), ignorando el movimiento reducido (3), ignorando la escena tranquila (15), montando sin esperar a las tiras (7), sin inscribirse en `ambient` (6), sin `activate` (2), sin `deactivate` (1), sin velocidad inicial (1), sin velocidad en vivo (1) y contando `watching` como actividad (1). En `SofiSpeech`: emitir por carácter (6), no avisar al cancelar (3) y cambiar `onStateChange` (2). Dos no las detectaba ninguna prueba al primer intento y se reforzaron: la cancelación de la limpieza (la prueba desmontaba antes de que existiera la clase, así que nunca llegaba al `import()`) y la baja de `ambient` (una inscripción olvidada no deja escuchas, pero sí una referencia).

**Incidencia de la sonda.** El motor de selectores de jsdom (`dom-selector`) registra sus propias escuchas en un objeto `Window` interno la primera vez que se llama a `querySelector`; engrosaban la cuenta a mitad de prueba. La sonda solo cuenta destinos que son `window`, `document` o elementos. Se halló la causa raíz con una traza, sin ampliar márgenes.

**Límites declarados.** jsdom no es un navegador: no hay capas pintadas, ni `IntersectionObserver` real (se sustituye por uno que notifica visible), ni geometría (el sprite se simula con una caja). La sonda no ve las propiedades `onX` ni las escuchas `once` (plan §2). La comprobación en navegador va en VT6. Las animaciones CSS no son temporizadores de JS y no entran en la cuenta.

### 10.4 Comprobaciones técnicas

| Comprobación | Resultado |
|---|---|
| `npm run typecheck`, `npx eslint .`, `npx prettier --check .` | Sin errores |
| `npm run build` | Correcta. CSS de entrada **idéntico** (49 424 B; `gzipSync` 9 871 B). JS de entrada 344 339 B (+117 B; `gzipSync` 111 105 B, +42 B), por `onSpeakingChange`. El adaptador aún no tiene consumidor y no entra en la build; los `.webp` siguen siendo 29 y ninguno es de `eureka` ni de `suspicious` |
| `npx vitest run` | 97 archivos, 1 717 pruebas (48 nuevas), todas pasan |
| `npx playwright test` (Chromium) | 170 pruebas, todas pasan en la repetición con la máquina libre. **Incidencia:** la primera pasada dio 168 de 170: fallaron `a11y.spec.ts` «tema claro · Design Lab · foundations» y «· ui», mientras corrían a la vez las mutaciones de sensibilidad (3 hilos de Vitest). No se capturó su mensaje de error, así que la causa no está demostrada; ambas pasan solas (21 de 21 del grupo «tema claro») y en la suite completa. Si reaparecen sin carga, se investigan |
| `src/styles/sprites/` | Sin cambios respecto a `HEAD` (`git diff` vacío): los controladores siguen siendo los originales |

### 10.5 Pendiente y notas

- **Navegador real:** la limpieza y las causas de pausa en Chromium, Firefox y WebKit van en VT6 (T073–T076) y T046.
- **Sin consumidor:** nada llama aún a `useSofiController` ni pasa `onSpeakingChange` (T063, T084, T087, T088).
- **Pregunta abierta para T087/T088 (no bloquea esto):** el adaptador solo congela los tiempos (`pause()`/`resume()`), como fijan el plan §6 y T023. Los controladores documentan además `reset()` + `pause()` para interrumpir (por ejemplo, cuando Sofi tiene que hablar). Con solo `pause()`, un gag a mitad de reacción queda congelado en su estado hasta que desaparecen las causas. Mientras el anfitrión solo exista en escena tranquila el caso es poco probable; si el consumidor monta el gag en una pantalla donde pueden aparecer causas, habrá que decidir si interrumpir equivale a `reset()`.

---

## 11. A4 — Contrato de build y límite de incrustación (T043–T044)

Fecha: 2026-11-03. Antes de empezar: `main` en `1f5f568` y su CI en GitHub Actions terminada en éxito (ejecución nº 21, leída de la API pública del repositorio); árbol de trabajo limpio salvo los 13 ZIP sin versionar.

### 11.1 Qué se hizo

| Tareas | Resultado |
|---|---|
| T043 | `e2e/production-build.spec.ts` pasa de 3 a 14 pruebas, sobre la misma compilación compartida, y `src/components/sofi/sprites/staticContract.test.ts` (4 pruebas de Vitest). Vistas fallar antes del cambio: la prueba de tiras incrustadas falló con las 15 tiras de producción pequeñas (`are-u-still-here-fx`, `favoriting-sparkle`, `memory-wipe-dissolve` y otras 9 de `memory-wipe`, `needs-context-question`, `poking-fx`, `rolling-fx`, `talking-mouth`; 17 284 B en total, la mayor de 3 224 B), como anticipaba E12. El resto del contrato ya se cumplía por construcción (carga diferida del bloque A4) y las pruebas son su guarda |
| T044 | `build.assetsInlineLimit` como función en `vite.config.ts`: `false` si el archivo está en `src/styles/sprites/` y `undefined` (límite por defecto de Vite, 4096 B) para el resto. Los parciales, las tiras y los controladores no se han tocado (`git diff` vacío sobre `src/styles/sprites/`) |

### 11.2 Contrato de build (`production-build.spec.ts`)

Los identificadores no se repiten en la prueba: los recursos diferidos se leen del registro (`load: () => import(…)`), los propietarios de los módulos dueños, y los exclusivos del Lab son los que ni son estáticos ni tienen cargador (deben ser `eureka` y `suspicious`). Las tiras se reconocen por **contenido** (SHA-256 y principio en base64), no por nombre, porque Vite las renombra con un hash.

| Prueba | Qué garantiza |
|---|---|
| Ids | Estático: `sofi-blink`; exclusivos del Lab: `eureka` y `suspicious`; toda tira pertenece a un recurso |
| Tiras como archivo | Las 35 tiras de producción salen como `.webp` y **ninguna** (de las 40) está incrustada en CSS o JS |
| Exclusivos del Lab | Ni sus 5 tiras, ni su CSS ni su JS están en la build |
| Chunks diferidos | Cada recurso diferido (11) tiene un chunk de JS y uno de CSS propios, el documento no los carga, y `sofi-blink` no tiene chunk |
| Entrada y tiras | La entrada (CSS y JS) solo referencia tiras de `sofi-blink` |
| CSS de entrada | No contiene nada definido por un chunk diferido (clases con hash ni `@keyframes` por nombre local) y sí lleva `sofi-blink` |
| Keyframes | Los nombres son únicos en todo el CSS, y cada `@keyframes` de un recurso (diferidos y `sofi-blink`) aparece una sola vez por nombre local; ninguno de los exclusivos del Lab |
| Orden de los gags | Su CSS no está en la hoja del documento (llega después, en sus chunks) y la hoja del documento lleva `sofi-blink` (plan §4.4) |
| Controladores | `data-poking-layer`, `data-still-here-layer` y `data-i-see-you-layer` no están en el JS de entrada |
| Objetivos provisionales | Se registran en cada build (anotación `provisional-targets` y salida de consola) y **no se aplican**: solo se comprueba que la medida existe |

Contrato estático (Vitest): no existe `_index.scss` ni nadie lo importa; los estilos globales no mencionan sprites; cada módulo dueño lista solo `/src/styles/sprites/<id>.webp` y `<id>-*.webp`; ningún otro código usa un glob sobre las tiras. La importación de un parcial por otro módulo SCSS ya la cubría `sprites.test.ts`.

**Dos defectos de mis primeras pruebas, hallados al comprobar su sensibilidad** (no estaban en el producto): el análisis de `@keyframes` por nombre local en los parciales no veía `sofi-blink`, cuyo `@keyframes` genera el mixin; y comparar clases por nombre local daba falso positivo con `error` (la aplicación tiene `.error` en tres componentes). Ahora los keyframes se leen de la build y se comparan por su nombre local, que es de cada recurso.

### 11.3 Sensibilidad

Se introdujo a propósito cada regresión y se comprobó que el contrato la detecta (las demás pruebas del archivo, en modo serie, no llegan a ejecutarse tras el primer fallo):

| Regresión | Detectada por |
|---|---|
| Revertir `assetsInlineLimit` | tiras como archivo |
| Importar `sofing` de forma estática desde la entrada | chunks diferidos |
| Importar `eureka` desde la entrada | exclusivos del Lab |
| Importar `poking` (CSS) de forma estática | chunks diferidos |
| Usar el controlador `poking.js` desde la entrada | controladores fuera de la entrada |
| `@use` del parcial de `sofi-blink` desde otro módulo | keyframes |
| Una tira de `talking` referenciada desde la entrada (comprobada aislada) | entrada y tiras |
| `@use` del parcial de `poking` en un módulo de la entrada (aislada) | CSS de entrada, y orden de los gags |
| `@use` del parcial de `eureka` en la entrada (aislada) | keyframes |
| `_index.scss` creado; sprite en estilos globales; glob central en un módulo dueño; glob de tiras fuera de los dueños | las 4 pruebas del contrato estático, una cada vez |

Una mutación no era real y no cuenta: `import 'poking.js'` sin usar su exportación se elimina por tree-shaking y la build no cambia; se repitió usándola.

### 11.4 Métricas (build de `HEAD` + T043–T044, `gzipSync` con las opciones fijas de `scripts/loadMetrics.ts`)

| Medida | EX1 / antes | Ahora |
|---|---|---|
| CSS de entrada | 9 780 B (EX1); 9 871 B antes de T044 | **49 424 B; 9 871 B gzipSync.** Idéntico antes y después de T044. +91 B (+0,9 %) sobre EX1 |
| JS de entrada | 344 339 B; 111 105 B (§10.4) | 344 339 B; 111 103 B. Sin cambio (cambia su hash, por el mapa de dependencias) |
| Objetivo provisional de D-5 (+2 kB sobre 9 780 B) | — | Cumplido por 1 909 B de margen. **No es un umbral aprobado:** solo se registra |
| `.webp` en `dist/assets` | 29 | **44** (+15, las tiras pequeñas) |
| Tiras de Sofi como archivo | 20 (las 15 pequeñas iban incrustadas) | **35** (706 748 B); 5 del Lab, ninguna |
| CSS de los 11 chunks diferidos | 124,5 kB; 32,6 kB gzip (Vite) | **79 985 B** (−36 %); 13 876 B `gzipSync` |
| JS de los 11 chunks diferidos | 29,5 kB; 20,2 kB gzip (Vite) | **6 679 B** (−77 %); 2 787 B `gzipSync` |
| Mayor chunk de CSS | `memory-wipe` 36,1 kB (12,9 gzip) | `memory-wipe` 19,1 kB (3,1 gzip) |

Los «antes» de los chunks diferidos son las cifras que imprime Vite (su gzip es otra medida que `gzipSync`, plan §7) y los «ahora» están medidos con `gzipSync`, así que el gzip no es comparable entre columnas; los bytes sí. **No se ha medido FCP, LCP ni descargas por red:** T043–T044 no tienen consumidor en pantalla (la entrada es idéntica en CSS y de igual tamaño en JS, así que el arranque no cambia por construcción), y el protocolo de `measureLoad` queda para EX2–EX4 y el bloque C. Lo que sí cambia, para esas mediciones, es que decodificar `memory-wipe` pasa de 3 a 12 peticiones de tira (E12), con la espera de decodificación previa de `SofiSprite` (E13).

### 11.5 Comprobaciones técnicas

| Comprobación | Resultado |
|---|---|
| `npm run typecheck`, `npx eslint .`, `npx prettier --check .` | Sin errores |
| `npm run build` | Correcta, sin avisos |
| `npx vitest run` | 98 archivos, 1 721 pruebas (4 nuevas), todas pasan |
| `npx playwright test` (Chromium) | 181 pruebas (170 anteriores y 11 nuevas del contrato de build), todas pasan |
| `src/styles/sprites/` | Sin cambios respecto a `HEAD` |

### 11.6 Pendiente y notas

- **Sin consumidor:** el adaptador de gags y `SofiSprite` en pantalla no existen todavía en producción, así que «los controladores no están en la entrada» se cumple también porque ningún código los usa; la prueba pasará a ser decisiva con T088. Mientras tanto no hay chunk de controlador que comprobar.
- **`talking` y `uncertain`:** el registro los declara diferidos y el contrato lo sigue, sin fijarlo: la decisión es de EX3.
- **Firefox y WebKit:** sin cambios; T045–T046.
- **`reset()` frente a `pause()`:** sigue pendiente para T087–T088.

---

## 12. A4 — Movimiento en tres motores (T045–T046 y VT4)

Fecha: 2026-11-04. Antes de empezar: `main` en `ca3f464` (T043–T044) y su CI en GitHub Actions terminada en éxito (ejecución nº 22, leída de la API pública del repositorio); árbol de trabajo limpio salvo los 13 ZIP sin versionar.

### 12.1 Qué se hizo

| Tareas | Resultado |
|---|---|
| T045 | `playwright.config.ts` con tres proyectos. Chromium lo ejecuta todo (183 pruebas); Firefox y WebKit, solo `e2e/motion/` (13 cada uno). El job `browser` de `ci.yml` instala los tres motores y ejecuta `npm run test:a11y`, que ahora recorre los tres proyectos. Firefox 157.0 (`firefox-1555`) y WebKit 27.2 (`webkit-2370`) ya estaban instalados desde la puerta A0 y son los que pide Playwright 1.64 (`install --dry-run`): no se instaló nada y `package.json` y `package-lock.json` no cambian. RED: antes de la configuración, `playwright test --project=firefox --project=webkit` fallaba con «Project(s) "firefox", "webkit" not found». Además, `workers: 2` fuera de CI (§12.6) |
| T046 | `e2e/motion/` con `modes.spec.ts` (los seis modos y la especificidad), `hold.spec.ts` (el modo efectivo de T033) y `support.ts` (los seis modos y su aplicación). La semilla `e2e/sofi-motion.spec.ts` (12 pruebas de Chromium) se movió a `modes.spec.ts` y se reorganizó, sin duplicarla. Plan §10 anota la carpeta |
| VT4 | Los criterios de `008-tasks.md` (§12.5), más la medida de especificidad de plan §4.2. Sin incompatibilidad entre motores |

### 12.2 Pruebas de movimiento (`e2e/motion/`)

Cada motor se compara **consigo mismo**: no hay capturas de referencia versionadas ni dependencia de que Chromium, Firefox y WebKit pinten igual.

- **Los seis modos en los anfitriones del Lab** (`modes.spec.ts`, una prueba por anfitrión): `SofiPortrait` (parpadeo y fotograma fijo), `Spinner`, `Loader` y `Ticker`. Para cada modo (sistema normal o reducido × sin atributo, `reduce`, `full`, cambiados en vivo con `emulateMedia` y el único `data-motion` de `<html>`) se mide el número de animaciones vivas del subárbol del anfitrión, su definición (nombre, duración, retardo, iteraciones) y una captura del elemento con la animación congelada a un instante en que se distingue de la pose reducida. Se exige que los tres modos que animan sean iguales entre sí en definición y captura, y lo mismo los tres que reducen; y, como control, que una captura animada y una reducida **difieran** (así una comparación en blanco no pasa). El fotograma fijo es un único grupo: no se anima en ningún modo, tampoco con `full`.
- **Especificidad** (`modes.spec.ts`, una prueba por anfitrión con interfaz de usuario): se localiza en las hojas la regla reducida real de `Spinner`, `Loader` y `Ticker` (rama del sistema y rama forzada) y se mide si su prefijo suma algo: una regla posterior con el selector del consumidor, sin prefijo, tiene que ganarle. El control es una regla anterior con `:root` delante, que sí suma especificidad y le gana a esa misma regla posterior. La regla se localiza también si el prefijo fuera `:is()` o no existiera, para que la regresión falle por la medida y no por no encontrar la regla.
- **Modo efectivo durante `memory-wipe`** (`hold.spec.ts`, 5 pruebas): `holdMotion` se llama sobre el retrato del Lab. Con los cuatro estados iniciales (`full` con el sistema reduciendo, `reduce` sin que el sistema lo pida, y `system` con el sistema sin pedir reducir o reduciendo), la preferencia vuelve a `system`, el sistema cambia a mitad y el anfitrión no cambia de estado hasta terminar; al terminar manda la preferencia vigente. La quinta prueba comprueba que lo último pedido durante la reacción es lo que se aplica al terminar y que repetir el fin no vuelve a escribir; esa petición la hace el proveedor real del Lab (control «Reducido»), así que vale también para la integración y comprueba que el módulo importado en la página es el de la aplicación.
- **12 módulos de la aplicación con el mixin** (VT4): `src/styles/utilities/reducedMotion.test.ts` compila con Sass cada `*.module.scss` de la aplicación que usa `u.reduced-motion` y comprueba que todas sus reglas reducidas llevan el prefijo que excluye `full`, que cada una tiene su clon forzado y que no hay otra forma de `prefers-reduced-motion`. `e2e/production-build.spec.ts` lo repite sobre el CSS **minificado** de la build (una prueba más, sobre la compilación ya compartida).

#### Cifras de las reglas reducidas

- Fuente: 12 módulos, **16 selectores reducidos y 16 clones forzados**, todos con el prefijo que excluye `full`. En E11 eran 15 de 16: la restante era la del parcial de parpadeo que importaba `SofiPortrait` y que T038 movió al módulo dueño.
- Build (todo el CSS emitido, entrada y chunks): 40 selectores reducidos del sistema, 49 de `no-preference` y 89 forzados, es decir, uno por cada uno de los otros dos; ninguna regla reducida sin prefijo. Faltan en la build los módulos que solo usa el Lab (por ejemplo `Loader`), que cubre la prueba de la fuente.

### 12.3 Resultados por navegador

Compilaciones de Playwright 1.64 para Windows: Chromium 156.0.8078.4, Firefox 157.0 y WebKit 27.2 (no es Safari de macOS ni de iOS, cuya verificación corresponde a `015`).

| Prueba | Chromium | Firefox | WebKit |
|---|---|---|---|
| `SofiPortrait` · parpadeo, seis modos | pasa | pasa | pasa |
| `SofiPortrait` · fotograma fijo, seis modos | pasa | pasa | pasa |
| `Spinner`, seis modos | pasa | pasa | pasa |
| `Loader`, seis modos | pasa | pasa | pasa |
| `Ticker`, seis modos | pasa | pasa | pasa |
| Especificidad: `Spinner`, `Loader` y `Ticker` (3) | pasan | pasan | pasan |
| `holdMotion` (5) | pasan | pasan | pasan |
| **Total de `e2e/motion/`** | **13 de 13** | **13 de 13** | **13 de 13** |

- **Resultados idénticos en los tres motores:** en los tres, los tres modos que animan coinciden entre sí en definición y captura, y lo mismo los tres que reducen; `full` anima aunque el sistema pida reducir; el fotograma fijo no se anima en ningún modo; y la regla reducida de cada anfitrión empata en especificidad con el selector del consumidor en las dos ramas. No hay diferencias de comportamiento que informar.
- **Repeticiones con el diseño final:** Chromium, las cinco pruebas de anfitrión por 15 (75 de 75); Firefox y WebKit, `e2e/motion/` entera por 3 (39 de 39 cada uno).
- **Suite completa** (`npx playwright test`, con 2 trabajadores, sin nada más en ejecución): **209 pruebas, todas pasan, en 9,0 min**: 183 de Chromium (las 181 anteriores menos las 12 semilla de movimiento, más 13 de movimiento y 1 de la build) y 13 de Firefox y de WebKit.

### 12.4 Sensibilidad

Se rompió a propósito, una a una, cada guarda, y se comprobó que la detecta alguna prueba. Todo se restauró y `git diff` queda vacío sobre los archivos de producción.

| Regresión | Detectada por |
|---|---|
| Mixin sin `:where` en ambas ramas (el estado anterior a D-1: el prefijo suma especificidad) | Especificidad (`Spinner`, `Loader`, `Ticker`) en Chromium, Firefox y WebKit: la regla posterior sin prefijo ya no gana. En Vitest, 16 pruebas (4 del mixin y las 12 de módulos) |
| `:where` cambiado por `:is` (suma especificidad sin dejar de envolver) | Especificidad, en los tres motores |
| Rama del sistema sin la exclusión de `full` | `sistema reduce · data-motion full` en `SofiPortrait`, `Spinner`, `Loader` y `Ticker`, en Chromium, Firefox y WebKit; 15 pruebas de Vitest |
| Una declaración extra solo en la rama forzada | La comparación de capturas en `SofiPortrait` (parpadeo y fotograma fijo), `Spinner` y `Ticker`; las animaciones coincidían, solo las capturas fallaron. `Loader` no la ve porque sus celdas están ocultas en reducido |
| El plugin de sprites sin la exclusión de `full` (el parcial de `sofi-blink`) | `SofiPortrait · parpadeo` con `sistema reduce · data-motion full` |
| `applyMotionPreference` ignora la retención | Las 5 pruebas de `hold.spec.ts`; la quinta, que usa el proveedor real, falla con `reduce` en vez de `full` |
| `holdMotion` no escribe el modo inicial | Las dos de partida en `system` y la de «lo último pedido». Las de partida con atributo explícito no la ven: ya lo tenían |
| Al terminar no se aplica lo último pedido | «Lo último pedido se aplica al terminar» |
| Una regla `@media (prefers-reduced-motion: reduce)` propia en un módulo | La prueba de Vitest de ese módulo y la de la build |

### 12.5 Criterios de VT4

| Criterio (`008-tasks.md`) | Resultado |
|---|---|
| T046 verde en Chromium, Firefox y WebKit | 13 de 13 en cada uno (§12.3) |
| El `SofiPortrait` de T038 pasa con `full` | Sí, en los tres motores: con `full` (también con el sistema reduciendo) tiene 1 animación viva y la captura de los otros modos animados; con `reduce` o el sistema reduciendo, 0 y la pose reducida. Su fotograma fijo no se anima con `full`. Su regla propia (`SofiPortrait.module.scss`) ya excluye `full` |
| En los 12 módulos de la app con el mixin, todas las reglas reducidas excluyen `full` | Sí: 16 de 16 selectores, cada uno con su clon forzado (E11: 15 de 16), y lo mismo en el CSS minificado de la build (§12.2) |
| Especificidad CSS (plan §4.2 y §4.3) | Medida: en `Spinner`, `Loader` y `Ticker`, y en las ramas del sistema y forzada, el prefijo no suma especificidad en los tres motores; con el control que sí suma, la medida lo distingue |
| Una incompatibilidad detiene el bloque A | No hay ninguna: los tres motores dan el mismo resultado |

### 12.6 Incidencias

**Del entorno y de la ejecución (no del producto):**

- **Firefox, con 4 trabajadores.** La primera ejecución completa dio 2 fallos de Firefox, por tiempo agotado (30 s). Medido: sin carga, esas pruebas tardan 5–11 s; con 4 trabajadores a la vez, 17–28 s, y una repetición falló porque el retrato del Lab no se vio en 5 s. El equipo tiene 7,9 GB de RAM (3,4 GB libres en reposo) y la causa es la contención de cuatro navegadores y el servidor de desarrollo, no la lógica. Con 2 trabajadores, 39 repeticiones de Firefox pasaron sin superar 11,5 s. No se subió ningún tiempo límite: `playwright.config.ts` fija `workers: 2` fuera de CI, como `maxWorkers` de Vitest, y en CI se usan los de por defecto.
- **Una prueba de `profile.spec.ts`, una sola vez.** En una ejecución completa, `desde el índice, el foco pasa a las respuestas y la pregunta se ve a 375 px` (Chromium, anterior a este bloque) agotó los 30 s esperando el botón «Empezar». La traza muestra `net::ERR_CONNECTION_REFUSED` al pedir `/src/main.tsx` con el WebSocket de Vite ya conectado, y el registro del servidor no muestra reinicio ni error. **Causa no determinada.** No se repitió: aislada, `profile.spec.ts` pasó 99 de 99 (3 repeticiones) y la ejecución completa siguiente pasó entera. Consta como incidencia sin explicar, como la de §10.4; si reaparece sin carga, investigarla.

**De mis primeras versiones de las pruebas, hallados al ejecutarlas (ninguno del producto):**

- **Captura inestable del `Ticker`.** La primera captura del `Ticker` salía a veces con el texto más grueso (8 de 25 repeticiones de la prueba en Chromium). Hipótesis descartadas con medidas: no depende del orden de los modos (se probó fotografiar primero los reducidos, y falló igual), ni de repetir la captura hasta que coincidan dos (la diferencia era estable hasta que cambiaba sola), ni de las fuentes (todas cargadas), ni de los estilos calculados (idénticos antes y después). Con la página cargada y sin aplicar ningún modo, el raster cambia solo, entre 1 y 4 s después; una página estática con el mismo texto no cambia. **Causa medida:** el servidor de desarrollo sigue sirviendo módulos del Lab después del evento `load` (decenas, hasta más de 0,5 s después, con el anfitrión ya visible) y la rasterización del texto cambia cuando acaban. Con `waitUntil: 'networkidle'` en la navegación, la primera captura ya salió en el estado final 3 de 3 veces (sin esperar, 0 de 3), y la prueba pasó 75 de 75 en Chromium y 39 de 39 en Firefox y WebKit. Se retiraron los dos arreglos probados antes (el orden de los modos y repetir la captura), que no hacían falta. El mecanismo interno del navegador que cambia el raster no se investigó.
- **Animaciones congeladas que no se descongelan.** Congelar el anfitrión con `pause()` lo deja pausado en el modo siguiente, porque una animación CSS que no cambia de definición no se recrea; el último modo daba 0 vivas. Ahora se sueltan tras la captura.
- **Captura de todo el `Ticker`.** La diferencia de la primera captura recaía solo en los píxeles de la etiqueta «Última hora» (508 píxeles dentro de x 16–104, y 15–26). Se fotografía la ventana de titulares, que es donde se mueve el texto; las animaciones medidas no cambian.
- **`Loader` en la prueba de especificidad.** Con `position: absolute`, un `inline-block` se calcula como `block`, así que no valía de control; se usa `flex`.
- **Barras invertidas y comillas invertidas.** Al escribir las pruebas desde el shell se perdieron (`/\s+/` quedó `/s+/` y se borró un `toHaveScreenshot` entre comillas invertidas). Se corrigió con la herramienta de edición.

### 12.7 Comprobaciones técnicas

| Comprobación | Resultado |
|---|---|
| `npm run typecheck`, `npx eslint .`, `npx prettier --check .` | Sin errores |
| `npm run build` | Correcta, sin avisos |
| `npx vitest run` | 98 archivos, 1 734 pruebas (13 nuevas: 12 módulos y la comprobación de que se encuentran), todas pasan |
| `npx playwright test` | 209 pruebas (Chromium 183, Firefox 13, WebKit 13), todas pasan, 9,0 min |
| `src/styles/sprites/`, código de producción, `package.json` y `package-lock.json` | Sin cambios respecto a `HEAD` |

### 12.8 Pendiente y notas

- **CI en Linux:** los resultados de arriba son de las compilaciones de Windows. El job `browser` instala Firefox y WebKit en `ubuntu-latest`: la ejecución nº 23 de GitHub Actions (`a000df8`) terminó en éxito, con el paso de accesibilidad, teclado, tamaño de texto y movimiento en los tres motores en 282 s (job `browser` 372 s; `foundation` 128 s). Sin incompatibilidad entre motores tampoco en Linux.
- **Solo los anfitriones que ya existen.** Los 14 recursos, la velocidad, los gags y la limpieza en navegador real van en VT6 (T073–T076).
- **`useReducedMotion` durante la retención** (el lado de JavaScript) solo está probado en jsdom (§8): en navegador se verifica el atributo de `<html>` que lee el CSS. Sigue sin haber consumidor de `holdMotion` (`009`).
- **Dependencia de la prueba de retención:** importa `/src/app/providers/motion.ts` del servidor de desarrollo en la página; la quinta prueba comprueba que es la misma copia que usa la aplicación.
- **Lo manual** (dispositivos, Safari de macOS y de iOS) sigue sin hacerse: `015`.
- **`reset()` frente a `pause()`:** sigue pendiente para T087–T088.

---

## 13. A5 — Contexto de audio compartido (T047–T050)

Fecha: 2026-11-04. Antes de empezar: `main` en `a6b1fba` (política de ejecución de pruebas, `tech-stack.md` §42.7) con su CI en GitHub Actions terminada en éxito (ejecución nº 25, leída de la API pública del repositorio); la de `a000df8` (nº 23) también, ver §12.8. Árbol de trabajo limpio salvo los 13 ZIP sin versionar. La decisión es D-11 de `008-plan.md` (§11.1); aquí solo consta cómo se comprobó.

### 13.1 Qué se hizo

| Tareas | Resultado |
|---|---|
| T047 | RED en `speechAudio.test.ts`: 6 pruebas de contexto prestado. Con la opción `context` ignorada, las 6 fallaron y las 11 existentes siguieron pasando. El doble de `AudioContext` solo ganó `disconnect` en la ganancia y el registro de las ganancias creadas |
| T048 | `createSpeechAudio` admite `context: () => AudioContextLike`: `prepare()` lo pide al prepararse y `dispose()` no lo cierra. Sin la opción, `createContext` crea uno propio que `dispose()` cierra, como hasta ahora: las 11 pruebas anteriores, con las mismas aserciones, siguen en verde |
| T049 | RED en `SoundProvider.test.tsx`: 5 pruebas con el controlador de voz real y un doble de `AudioContext`. Con el proveedor sin cambios, 4 fallaron; la quinta (no crea nada al montar ni con el sonido desactivado) pasó, como corresponde: protege contra una implementación que cree el contexto antes de tiempo (la mutación M5 de §13.4 la hace fallar) |
| T050 | `SoundProvider` es dueño del `AudioContext` compartido: lo crea la primera vez que alguien lo pide, lo cierra al desmontarse después de `audio.dispose()` y lo olvida para que un nuevo gesto cree otro |

### 13.2 Contrato

- **`createSpeechAudio`:** `context` y `createContext` son excluyentes en el tipo (`never` en el otro), de modo que no se pueden dar los dos. Con contexto prestado, `dispose()` además desconecta su nodo de ganancia del contexto, que sigue vivo para otros, y olvida el contexto: el siguiente `prepare()` lo vuelve a pedir. Si pedirlo lanza, el estado es `unavailable`, la misma ruta que un `createContext` que lanza. `defaultCreateContext` pasa a exportarse para que el proveedor lo use por defecto.
- **`SoundProvider`:** `createAudio` recibe ahora el getter del contexto compartido (`(context) => SpeechAudio`); la aplicación real lo pasa a `createSpeechAudio`. Una prop nueva, `createContext`, permite sustituir su creación en pruebas. El contexto se crea dentro de `audio.prepare()`, que `unlock()` llama sin ninguna espera previa, es decir, en el gesto; con `deferAudio` y con el sonido desactivado, nadie lo pide.
- **Compatibilidad:** los `createAudio={() => audio}` de los tests y el `createSimulatedAudio` del Design Lab (que sigue con su `createContext` propio y su bloqueo simulado) no cambian y no crean contexto compartido, porque no lo piden. `src/design-lab/simulatedAudio.ts` y `src/test/fakeAudio.ts` quedan intactos.

### 13.3 Pruebas

- **`speechAudio.test.ts`** (17: 11 anteriores + 6 nuevas): no pide el contexto hasta preparar y entonces reanuda y decodifica con él; lo pide una sola vez aunque se prepare varias veces; la voz suena por él; `dispose()` no lo cierra, para la fuente y desconecta la ganancia; tras `dispose()` pide el contexto de nuevo y suena por el nuevo; si no se puede obtener, `unavailable`.
- **`SoundProvider.test.tsx`** (9: 4 anteriores + 5 nuevas): no lo crea al montar, ni con la preparación diferida, ni al silenciar, ni al desmontar sin haber desbloqueado; lo crea una sola vez y mientras el clic que desbloquea está en curso (el doble lo registra entre la captura y la burbuja del `click`) y reanuda el contexto; lo crea también al activar el sonido cuando no se aplaza la preparación (Design Lab); al desmontarse llama a `dispose()` de la voz antes que a `close()` del contexto, y `close()` se llama una vez (la voz no lo cierra por su cuenta); si el proveedor se oculta (`Activity`) y se muestra de nuevo, cierra el primer contexto, crea otro en el siguiente gesto y no reutiliza el cerrado.

### 13.4 Sensibilidad

Cada mutación se aplicó a una copia del código, se ejecutó su archivo de pruebas y se restauró (los diffs de los archivos de producción eran idénticos antes y después).

| Mutación | Prueba que la detecta |
|---|---|
| M1 `dispose()` cierra también el contexto prestado | `dispose() no cierra el contexto prestado…` |
| M2 `dispose()` no desconecta la ganancia | la misma |
| M3 el proveedor cierra el contexto antes de liberar la voz | `al desmontarse libera la voz, después cierra el contexto…` |
| M4 el proveedor no olvida el contexto cerrado | `si el proveedor se oculta y se muestra de nuevo…` |
| M5 el proveedor crea el contexto al montar | 7 de 9 (entre ellas, `no lo crea al montar…` y `lo crea una sola vez, dentro del primer gesto…`) |

### 13.5 Comprobaciones técnicas

Según la política de ejecución de `tech-stack.md` §42.7: pruebas dirigidas durante RED/GREEN y, al cerrar, las pertinentes. `SoundProvider` envuelve toda la aplicación, así que se ejecutaron las pruebas de todo lo que importa los dos módulos.

| Comprobación | Resultado |
|---|---|
| `npx vitest run` sobre los dos archivos de las tareas | 26 pruebas (17 + 9), todas pasan |
| `npx vitest related` sobre `SoundProvider.tsx` y `speechAudio.ts` | 12 archivos, 137 pruebas, todas pasan |
| `npx tsc -b`, `npx eslint .`, `npx prettier --check` sobre lo tocado | Sin errores |
| `src/styles/sprites/`, `package.json`, `package-lock.json`, `src/design-lab/`, `src/test/fakeAudio.ts` | Sin cambios |

No se ejecutaron la suite completa de Vitest, Playwright ni `build`: el cambio no toca configuración, estilos ni dependencias, y esos pasos los ejecuta la CI; el cierre del bloque (T054) pide la batería completa.

### 13.6 Pendiente y notas

- **Efectos (T051–T052):** resuelto en §14: el proveedor libera también los efectos antes de cerrar el contexto.
- **Gesto real del navegador:** en jsdom se comprueba que el contexto se crea y se reanuda de forma síncrona durante el despacho del clic, sin esperas intermedias. Que el navegador lo considere una activación de usuario (política de reproducción automática) y que el audio suene no se puede comprobar aquí: es manual y queda pendiente (VT6, `015`). No se ha oído ningún audio.
- **`Activity`:** el caso de ocultar y volver a mostrar el proveedor sin desmontarlo no existe hoy en la aplicación; se prueba porque es la forma de ejecutar la limpieza del efecto sin perder el estado, y evita que un contexto cerrado se reutilice.
- **Sin concentrador:** D-11 descarta un `close()` simulado y un concentrador; el proveedor solo guarda y cierra el contexto, sin enrutar voz ni efectos.

---

## 14. A5 — Efectos sonoros: controlador y licencias (T051–T053)

Fecha: 2026-11-04. Antes de empezar: `main` en `bb5d4ed` (T047–T050) con su CI en GitHub Actions terminada en éxito (ejecución nº 26, leída de la API pública del repositorio: `foundation` 124 s, `browser` 445 s; el paso de Playwright tardó 341 s frente a los 282 s de la nº 23 sin que haya cambiado ninguna prueba de navegador); árbol de trabajo limpio salvo los 13 ZIP sin versionar. Las restricciones son las de spec §9 y plan §11.1; las decisiones de implementación que no fijaban son D-24 a D-29 de plan §11.4, aprobadas el 2026-11-04 tal como están implementadas. No se ha elegido ni incorporado ningún sonido.

### 14.1 Qué se hizo

| Tareas | Resultado |
|---|---|
| T051 | RED. `effectsAudio.test.ts` (34 pruebas) con el esqueleto inerte de `createEffectsAudio` (sus métodos no hacen nada): **20 fallan y 14 pasan** (las que afirman que no suena nada se cumplen sin código; la sensibilidad de §14.4 demuestra que sí discriminan). Más 2 pruebas de liberación en `SoundProvider.test.tsx`: **las 2 fallan** (el proveedor ignoraba `createEffects`) |
| T052 | GREEN. `createEffectsAudio` (D-24 a D-27) y la integración en `SoundProvider` (D-28): libera efectos y voz y después cierra el contexto. 34 de 34 y 11 de 11 |
| T053 | Contrato en `effectsLicenses.test.ts` (32 pruebas) y `src/assets/sofi/effects/licenses.json` vacío (D-29). RED: las 2 pruebas sobre el manifiesto real fallaban por `ENOENT` (las 30 sobre datos sintéticos no dependen de él); con el manifiesto, 32 de 32 |

Cambio de pruebas compartido: el doble de `AudioContext` de `speechAudio.test.ts` pasa a `src/test/fakeAudio.ts` (`fakeAudioContext`, con `onended` y `end()` en las fuentes) porque ahora lo usan la voz y los efectos. Las aserciones de `speechAudio.test.ts` no cambian (17 de 17). `defaultFetchData` de `speechAudio.ts` pasa a exportarse para no duplicarla.

### 14.2 Contrato de `createEffectsAudio`

- **Contexto siempre prestado:** no hay `createContext` ni cierre. `prepare()` lo pide antes de cualquier espera (en el gesto) y lo reanuda; `dispose()` lo olvida sin cerrarlo y el siguiente `prepare()` lo vuelve a pedir.
- **Sin sonido activado no suena nada:** antes de `prepare()`, tras `disable()` (que además corta el efecto en curso) y tras `dispose()`. Tampoco suena con el contexto suspendido o que el navegador no deja reanudar; `prepare()` no espera a esa reanudación.
- **Un efecto a la vez:** el nuevo sustituye al que suena; al terminar por sí solo el hueco queda libre sin cortar nada.
- **Nunca mientras habla la voz:** no suena si `voice.getStatus() === 'playing'` y no queda en cola; si la voz empieza mientras suena uno, se corta. Deja de escuchar a la voz en `dispose()`.
- **Seguridad, salida rápida y estado sensible:** silencio absoluto y corte en el acto, incluso tras un borrado efectivo.
- **`memory-wipe`:** los efectos marcados `afterErasure` no suenan hasta `dataErased`; los demás no cambian.
- **Sin condicionar la aplicación:** `play()` devuelve `undefined` y no lanza ante una fuente que falla, un efecto desconocido, una voz o un contexto rotos; `prepare()` no rechaza si el contexto no se puede obtener ni si un archivo no carga (los demás efectos siguen sonando; que el siguiente `prepare()` reintente el que falló está implementado, pero sin prueba propia).

### 14.3 Proveedor y contrato de licencias

- **`SoundProvider`:** prop nueva `createEffects({ context, voice })`, sin valor por defecto. El `context` es el mismo getter de D-11 (la prueba comprueba que devuelve el contexto compartido y que no crea uno al montar) y `voice` es la voz del proveedor. En la limpieza llama a `effects.dispose()`, `audio.dispose()` y por último cierra el contexto (la prueba comprueba el orden de las dos primeras respecto al cierre). Los contratos existentes no cambian: las 9 pruebas anteriores del proveedor siguen en verde y no se ha tocado `SoundContext`, `src/design-lab/simulatedAudio.ts` ni los `createAudio` de los tests.
- **Contrato de licencias:** cada audio de la carpeta tiene su entrada, y cada entrada su archivo, sin duplicados ni rutas; campos obligatorios; `source` y `licenseUrl` en https; fecha ISO real; solo las licencias de D-29 (NC, ND, SA, licencias de sitio y desconocidas se rechazan); CC-BY exige atribución; ningún campo puede mencionar Myinstants ni Nintendo. La comprobación es de metadatos: que la licencia declarada sea verdadera es la verificación humana de T097.

### 14.4 Sensibilidad

Cada mutación se aplicó al código, se ejecutó su archivo de pruebas y se restauró (el diff de los archivos de producción era idéntico antes y después).

| Mutación | Pruebas que la detectan |
|---|---|
| E1 `play()` ignora seguridad, salida rápida y estado sensible | 3 (una por situación) |
| E2 `setSituation()` no corta el efecto que suena | 3 |
| E3 los de `memory-wipe` suenan sin borrado efectivo | `no suenan hasta que el borrado total es efectivo` |
| E4 suena aunque la voz esté sonando | `no suena mientras la voz suena, y no queda en cola` |
| E5 la voz que empieza no corta el efecto | `si la voz empieza mientras suena un efecto, el efecto se corta` |
| E6 `dispose()` cierra el contexto prestado | `dispose() no lo cierra` |
| E7 un efecto nuevo no corta el anterior | 3 |
| E8 suena sin haber activado el sonido | `tras silenciar, y el que sonaba se corta al instante` |
| E9 `play()` propaga los errores | `no lanza si la fuente falla al empezar` |
| E10 `dispose()` sigue escuchando a la voz | `tras dispose() deja de escuchar a la voz` |
| E11 suena con el contexto suspendido | 2 |
| E12 al terminar por sí solo no libera el hueco | `al terminar por sí solo libera el hueco sin cortar nada más` |
| E13 el contexto se reanuda tras una espera, fuera del gesto | `no lo pide hasta que se prepara, y entonces lo reanuda en el gesto` |
| E14 un archivo que falla rechaza `prepare()` | `un archivo que no carga no impide los demás` |
| P1 el proveedor no libera los efectos | `al desmontarse libera la voz y los efectos…` |
| P2 el proveedor libera los efectos tras cerrar el contexto | la misma |

Contrato de licencias, sobre la carpeta real (se ensució y se restauró; manifiesto y carpeta idénticos al final): L1 un audio sin licencia registrada, L2 una entrada `CC-BY-NC-4.0` y L3 una entrada de `myinstants.com` con licencia válida fallan en la prueba del manifiesto real; el control L4 (entrada completa y válida con su archivo) pasa. **Límite:** el filtro `-t` del guion se partió por los espacios y seleccionó 7 pruebas del archivo en lugar de 1 (en L1–L3 falló exactamente 1 de las 7; en L4 pasaron las 7), de modo que la atribución a la prueba del manifiesto real es por exclusión: es la única que depende de la carpeta. Los casos sintéticos del contrato comprueban cada regla con el mensaje concreto que esperan.

### 14.5 Comprobaciones técnicas

Según `tech-stack.md` §42.7: pruebas dirigidas durante RED/GREEN y, al cerrar, las pertinentes. `fakeAudio.ts` y `SoundProvider` los usan muchos tests, así que se ejecutaron todos los que dependen de los módulos tocados.

| Comprobación | Resultado |
|---|---|
| `npx vitest run` sobre `src/infrastructure/audio/` y `SoundProvider.test.tsx` | 94 pruebas (17 voz + 34 efectos + 32 licencias + 11 proveedor), todas pasan |
| `npx vitest related` sobre `fakeAudio.ts`, `SoundProvider.tsx`, `speechAudio.ts`, `effectsAudio.ts` y el contrato de licencias | 14 archivos, 205 pruebas, todas pasan |
| `npx tsc -b`, `npx eslint .`, `npx prettier --check src spec/features/008-sofi-character` | Sin errores (un error de lint por un parámetro sin usar en la prueba, corregido) |
| `src/styles/sprites/`, `package.json`, `package-lock.json`, `src/design-lab/`, `SoundContext` | Sin cambios |

No se ejecutaron la suite completa de Vitest, Playwright ni `build`: no hay cambios de configuración, estilos ni dependencias, el manifiesto no entra en la build (nadie lo importa) y la CI ejecuta esos pasos; T054 pide la batería completa.

### 14.6 Pendiente y notas

- **Conexión (T100–T101):** `createEffects` no tiene valor por defecto y el proveedor no expone los efectos ni los prepara, silencia ni conecta al borrado de datos. Hasta entonces, en la aplicación real no se crea ningún controlador de efectos.
- **Pregunta abierta de `memory-wipe`** (plan §11.4): al borrar los datos `SoundProvider` vuelve al silencio inicial; hay que decidir cómo encaja un efecto que solo puede sonar tras el borrado. No se resuelve aquí.
- **Audio real:** no se ha oído ningún sonido ni se ha reproducido ningún archivo; las pruebas usan dobles de `AudioContext`. La reproducción real, con el gesto del navegador, queda para VT6/T098 y `015`.
- **Licencias:** el contrato valida metadatos. La lista de licencias admitidas es la política aprobada en D-29 (plan §11.4); ampliarla es editar una constante de la prueba, con aprobación.
- **Voz entre fragmentos:** «mientras habla la voz» es el estado de audio `playing` (el bucle de `SofiSpeech` suena mientras habla y se detiene en las pausas), no el booleano `speaking` del texto; en una pausa del texto un efecto puede sonar, y la voz lo corta si reanuda (D-26).

---

## 15. Cierre del bloque A (T054)

Fecha: 2026-11-04. Antes de empezar: `main` en `a2e8367` (T051–T053) con su CI en GitHub Actions terminada en éxito (ejecución nº 27, leída de la API pública del repositorio); árbol de trabajo limpio salvo los 13 ZIP sin versionar. Las aprobaciones de D-24 a D-29 constan solo en su fuente normativa, plan §11.4; aquí no se copian.

### 15.1 Qué se hizo

| Concepto | Resultado |
|---|---|
| Aprobaciones | D-24 a D-29 registradas como aprobadas en plan §11.4, con dos precisiones de la autora: `prepare()` carga todos los efectos registrados (D-24) y la exclusión de SA es una política del proyecto, no una incompatibilidad jurídica general con MIT (D-29). Sin cambios de comportamiento: el único cambio en código es el comentario de `effectsLicenses.test.ts` que explica esa política |
| Cierre técnico | §15.2 |
| Criterios de la spec | §15.3: 27 criterios revisados; ninguna casilla de `008-spec.md` se marca, porque se marcan al cerrar la feature (T102) |

### 15.2 Comprobaciones técnicas

Según `tech-stack.md` §42.7: T054 es un hito que pide formato, lint, tipos, tests y build, así que se ejecutan las suites amplias que pide y nada más.

| Comprobación | Resultado |
|---|---|
| `npm run format:check`, `npm run lint`, `npm run typecheck` | Sin errores |
| `npm run test` | 100 archivos, 1 813 pruebas, todas pasan (187 s). Frente a §12.7 (98 y 1 734): +2 archivos y +79 pruebas, las de A5 (11 en §13 y 68 en §14) |
| `npm run build` | Correcta. CSS de entrada: `index-DVOvylSK.css`, 49 424 B, 9 871 B con el `gzip` del arnés (idéntico a §11: sigue sin haber cambio de CSS desde T044) |
| `npm run verify:bundle` | Bundle del cliente limpio (25 ficheros revisados) |
| Código de efectos en la build | Ausente: `createEffectsAudio`, `afterErasure` y el manifiesto no aparecen en `dist/assets` (nadie los importa fuera de las pruebas) |
| Playwright | **No se ejecuta en local en este cierre.** La última ejecución local completa fue la de §12.7 (209 pruebas, Chromium 183, Firefox 13, WebKit 13). Desde entonces solo cambia la infraestructura de audio y los documentos, y la CI ejecutó los tres motores sobre esos cambios: ejecución nº 26 (`bb5d4ed`) y nº 27 (`a2e8367`), ambas en éxito (`browser` 468 s en la nº 27; paso de Playwright 331 s). Es el árbol exacto de este cierre, que solo añade documentos y un comentario |
| `src/styles/sprites/`, `package.json`, `package-lock.json` | Sin cambios respecto a `HEAD` |

### 15.3 Criterios de aceptación de la spec

Estado de los 27 criterios al cerrar el bloque A. **Verificado** es lo que A puede dar por cumplido con la evidencia citada; **parcial** es la parte que sí se ha comprobado (con su límite) y lo que falta; **pendiente** es lo que depende de otros bloques y no se da por cumplido.

**Resumen:** 7 verificados, 14 parciales y 6 pendientes.

#### Recursos

| Criterio | Estado | Evidencia y límite |
|---|---|---|
| Cada recurso original importado es idéntico a su fuente (`001` sin ZIP) | Verificado | VT1 (§4.2). Reverificado hoy: los 61 archivos de `src/styles/sprites/` coinciden (`git hash-object`) con un blob de `17aca4f` del mismo nombre, 61 de 61. La carpeta no tiene commits desde su integración (`3bf765f`) |
| Los ZIP de los siete paquetes actualizados coinciden con los SHA-256 del informe; los seis restantes, por contenido | Verificado | T003 (§3.3). Reverificado hoy: los 13 ZIP conservan tamaño y SHA-256 registrados |
| Ningún fotograma se ha alterado | Verificado | Consecuencia de la identidad byte a byte de arriba; decodificación de los 40 `.webp` en VT1 |
| Solo se versionan los recursos integrados; los ZIP siguen sin versionar | Verificado a la fecha | 0 ZIP en `git ls-files`, 13 sin versionar. Se vuelve a comprobar en T102 |
| `asset-provenance.md` mantiene la procedencia | Verificado | Conserva el commit `17aca4f` (3 menciones) y la remisión al informe de correcciones en `auditorias/` |
| En la build, cada pantalla carga solo el CSS y las tiras que usa; sin `_index.scss` ni sprites en estilos globales | Parcial | Verificada la parte estructural (T043–T044, §11): ningún módulo importa `_index.scss`, no hay sprites en estilos globales, la entrada solo lleva los recursos de producción y los 11 diferidos salen en chunks propios. «Cada pantalla» necesita los consumidores del bloque C y el experimento EX3 (plan §12) |
| Con un recurso lento o caído, Sofi conserva una representación estática | Parcial | `SofiSprite` conserva la estática si el módulo o las tiras fallan (T035–T037, §9), en jsdom. Conexión lenta y tiras caídas en producción: VT7 |

#### Comportamiento

| Criterio | Estado | Evidencia y límite |
|---|---|---|
| Pruebas unitarias de la selección semántica y de las prioridades del catálogo §6 | Verificado | T019–T022 (`visual/select`, §6): tabla del catálogo §5, jerarquía §6.1 y matriz de interrupciones §6.3, cada pareja vista fallar antes del código |
| Ninguna operación se retrasa | Parcial | `presentationGate` prueba que la operación nunca espera a la animación (T017–T018, §6). No hay operaciones reales conectadas (`007`, bloque C) |
| La retención del primer ciclo respeta su límite, solo en resultados no críticos y sin afectar a seguridad, privacidad, cancelación, salida rápida, movimiento reducido ni carga | Parcial | Lógica pura con las exclusiones del catálogo §6.4 probadas una a una (T017–T018). Límite de 3000 ms provisional hasta AV2 (D-17); falta la integración |
| Todo error se muestra en cuanto se conoce | Parcial | El `presentationGate` presenta los errores en el acto (T017–T018). Falta la integración con los emisores |
| Al terminar la operación, etiqueta e indicador dejan de indicar actividad | Parcial | Las etiquetas, también durante la retención (T025–T026). El indicador (D-8) es del Lab y de la integración |
| `safety_concern` no muestra sprites, la salida rápida no anima y `memory-wipe` solo aparece tras un borrado total efectivo | Parcial | Selección pura (T019–T022). Su presentación en pantalla y los emisores de `007` y `009` están pendientes |
| `eureka` y `suspicious` no aparecen en producción | Verificado | El registro de producción no declara cargadores para ellos (T027, `registry.test.ts`) y ninguno sale en la build (T043, `production-build.spec.ts`). Esas pruebas lo siguen vigilando mientras se integra C |
| En el expediente, `talking` solo mientras `speaking` y `uncertain` usa el recurso 014, sin cambiar el formulario | Pendiente | Bloque C. A aporta `onSpeakingChange` (T039–T040) y la selección |

#### Easter eggs y controladores

| Criterio | Estado | Evidencia y límite |
|---|---|---|
| Un solo easter egg activo; la reanudación de una causa no anula las demás, incluido `attachPoking` | Parcial | `ambient` (T023–T024) y VT3 con los controladores reales en jsdom (§10.3). Navegador real: VT6 |
| Ningún gag durante escritura, interacción, habla, procesamiento ni estados sensibles; `poking` sin teclado ni foco | Pendiente | T087–T088. A solo aporta las causas de pausa y la condición de escena tranquila |
| Al desmontar, también con StrictMode, no quedan escuchas, observadores, temporizadores, capas ni atributos | Parcial | VT3 en jsdom, con instrumentación propia (§10). Navegador real: VT6 |
| `are-u-still-here` no se activa antes del umbral aprobado | Pendiente | T087. A comprueba solo que el adaptador pasa el umbral al controlador (T041); el valor sigue provisional |

#### Accesibilidad y movimiento

| Criterio | Estado | Evidencia y límite |
|---|---|---|
| Sprites, capas e indicador fuera del árbol de accesibilidad; los hechos se anuncian una vez | Parcial | `SofiSprite` es decorativo (`aria-hidden`, sin `role="img"`; T035–T037, D-3). El indicador y los anuncios son de B y C |
| Sistema, modo forzado y `reduce` dan la misma pose estática y detienen CSS y JS; con `full` se anima (Playwright en los tres motores) | Parcial | Los seis modos en `SofiPortrait`, `Spinner`, `Loader` y `Ticker`, la especificidad y `holdMotion`, 13 de 13 en Chromium, Firefox y WebKit en Windows (VT4, §12); el paso de la CI de Linux con los tres motores terminó en éxito. Faltan la pose aprobada de los 14 recursos (T069, AV) y su prueba (VT6, T073) |
| La preferencia propia persiste, es reversible y vuelve a `system` al borrar todos los datos | Parcial | Valor por defecto, registro anterior y valor corrupto (T009–T010) y vuelta a `system` al borrar (`userData.test.ts`). El control de la persona y su reversibilidad desde la interfaz son de B (T071, AV) |
| La verificación de destellos de `error` y WCAG 2.2.2 están documentadas | Pendiente | VT8 |

#### Velocidad, sonido y Lab

| Criterio | Estado | Evidencia y límite |
|---|---|---|
| Cambiar la velocidad mantiene sincronizadas capas y controlador, sin duraciones copiadas a JS | Parcial | `visual/rates` guarda un factor, no una duración (T029–T030); `SofiSprite` aplica `playbackRate` y el adaptador usa `setRate` (T036–T042), en jsdom con Web Animations simuladas. La sincronía real: VT6 |
| Sin sonido activado no suena ningún efecto; seguridad y salida rápida no suenan; ningún efecto tapa la voz; los de `memory-wipe` solo tras el borrado efectivo; cada archivo tiene su licencia registrada | Parcial | Controlador y contrato de licencias verificados (T051–T053, §14), con dobles de `AudioContext`. No existe ningún archivo de efecto y la conexión al contrato de eventos es T100–T101, con la pregunta abierta de plan §11.4 |
| El Design Lab cumple el catálogo §8 y la checklist §13, con las aprobaciones registradas | Pendiente | Bloque B |
| Hay pruebas según `tech-stack.md` §42 y el catálogo §9.11, y se cumplen los criterios de accesibilidad y responsive en los contenedores afectados | Pendiente | Se evalúa al cerrar la feature (T102). A sigue §42 (RED antes de GREEN y sensibilidad comprobada), pero los contenedores afectados no están integrados |

### 15.4 Límites reales del cierre

- **Playwright no se repite en local** (§15.2): la evidencia de los tres motores es la de la CI sobre el mismo código. Si la CI de este commit falla, el cierre no se sostiene.
- **jsdom no es un navegador:** lo marcado como parcial por esta razón (limpieza, causas de pausa, velocidad, estática ante tiras caídas) se completa en VT6 y VT7.
- **Audio:** no se ha oído ningún sonido ni se ha reproducido ningún archivo; las pruebas usan dobles de `AudioContext`. Lo manual (audio real, lectores de pantalla, dispositivos) sigue sin hacerse: VT6, T098 y `015`.
- **Reverificación de recursos:** la comparación con `17aca4f` empareja cada archivo por nombre con los blobs de ese commit; VT1 (§4.2) ya comparó por ruta y descartó archivos sin fuente o sin integrar.
- **Medidas de rendimiento:** el CSS de entrada es el de §11. Los objetivos de plan §7 siguen siendo provisionales; EX2, EX3 y EX4 no se han ejecutado.

### 15.5 Pendiente reservado

- **T087–T088:** `reset()` y `pause()` frente a solo `pause()` al interrumpir un gag (§10.5, §12.8).
- **T100–T101 (y `009`):** cómo encaja un efecto de `memory-wipe` con el silencio al que vuelve `SoundProvider` tras el borrado (plan §11.4).
- **Bloque B** y sus aprobaciones (AV1–AV9); **VT5–VT8**; **EX2–EX4**.
- **Incidencia sin explicar:** un `ERR_CONNECTION_REFUSED` aislado en `profile.spec.ts` (§12.6) y un fallo intermitente de accesibilidad anterior (§10.4). No han reaparecido en la CI (ejecuciones nº 23 a nº 27, todas en éxito).

---

## 16. B1 — Playground y estado de sesión del inspector (T055–T057)

Fecha: 2026-11-04. Antes de empezar: `main` en `1ce2206` (T054) con su CI en GitHub Actions terminada en éxito (ejecución nº 28, leída de la API pública del repositorio); árbol de trabajo limpio salvo los 13 ZIP sin versionar. No se ha tocado el Design Lab visible (`MotionSection.tsx` y estilos sin cambios), las preferencias públicas, `visual/rates` ni el repositorio de spritesheets.

### 16.1 T055 — Playground frente a plan §8

Lectura, solo lectura, de `spritesheets/spritesheet/playground/` (`index.html`, `playground.js` y las reglas de tamaño, fondo y pixelado de `playground.scss`), del contrato de las demos (`setRate`, `pause`, `resume` y `restart` en los `demo.js` de `008` y `012`) y de cómo calcula los pesos `scripts/dev.mjs`. El repositorio estaba en `17aca4f` con el árbol limpio, y siguió así al terminar. Se contrastaron las seis filas de la tabla de plan §8; solo constan las divergencias que afectan a lo que se adapta, más la coincidencia del pixelado, que justifica cómo se empieza.

| Fila de plan §8 | Divergencia del playground | Consecuencia |
|---|---|---|
| Velocidad, pausa y reinicio | Un solo estado **global**: la velocidad y la pausa afectan a todas las tarjetas a la vez. La velocidad solo admite ¼×, ½×, 1× y 2× | El catálogo §8 pide una velocidad independiente por recurso, y T056–T057 lo hacen por recurso. Qué valores ofrece el control es de T058 (`LabRange`) y no se fija aquí |
| Velocidad, pausa y reinicio | Aplica `playbackRate` directamente a `getAnimations({ subtree: true })` una sola vez, sin volver a aplicarlo en `animationstart`, y a las demos con `setRate` | En Ask Sofi la velocidad pasa por `visual/rates`: `SofiSprite` la aplica al subárbol y la vuelve a aplicar en `animationstart`, y el adaptador usa `setRate` (plan §5.5, T029–T042). El estado del inspector solo guarda la velocidad elegida, y conectarla con `setSessionRate` es de T058. No existe «comparar con 1×» |
| Velocidad, pausa y reinicio | Pasa todo a pausa de forma global al desplazarse por la línea de tiempo | Hay que tenerlo en cuenta en T060: la pausa de Ask Sofi es por recurso |
| Tamaño, fondos y pixelado | Tamaño de 64 a 512 px en pasos de 8, empezando en 192, y un tamaño común para todas las tarjetas | En Ask Sofi es por recurso. El rango y el valor de partida son de T059: el estado los recibe de quien lo crea |
| Tamaño, fondos y pixelado | Fondos «Claro», «Oscuro» y «Cuadros» del escenario, independientes del tema de la página | En el Lab, el tema es global (`ThemeSwitch`) y `LabStage` ofrece su fondo propio, `plain` o `dots`. No hay cuadros. Las opciones no se corresponden una a una y elegirlas es de T059: el estado guarda un fondo de un tipo que define el inspector |
| Tamaño, fondos y pixelado | Pixelado desactivado al principio (`image-rendering: pixelated` en el sprite y las miniaturas) | Igual que en producción, donde ningún estilo de `src/` aplica `image-rendering`. Se empieza sin pixelar |
| Línea de tiempo (T060) | Lee los tramos del primer `getAnimations()` y su `backgroundPositionX`. Las miniaturas usan `background-size` sobre la imagen | Se volverá a leer antes de T060. No se adapta aquí |
| Peso y memoria (T061) | Los bytes salen del manifiesto de su servidor (`fs.statSync` de cada archivo) y la memoria, de ancho × alto × 4 tras `decode()` | En Ask Sofi no existe ese servidor: T061 tendrá que sacar los bytes de otra fuente. No se adapta aquí |
| Escenarios de las demos (T064) | Cada `demo.js` construye su propio DOM y sus temporizadores y devuelve `setRate`, `pause`, `resume` y `restart` | La idea se adapta con `useSofiController` (plan §8). No se adapta aquí |
| Plantillas, `localStorage`, EventSource, servidor | Guarda tamaño, velocidad, fondo, pixelado y pausa en `localStorage` (`sprites:*`) y recarga con EventSource | Se descarta (plan §8). El estado del inspector vive en memoria y desaparece al recargar (T056) |

### 16.2 T056–T057 — Estado de sesión del inspector

Se añade a `src/design-lab/motionLab.ts`, aparte del reductor de habla, que no cambia:

- `createInspectorState({ size, background })` crea una entrada para cada uno de los 14 recursos de `SOFI_ANIMATION_IDS` y selecciona el primero. Cada entrada empieza a 1× (catálogo §8: la línea de tiempo original), sin pausa, sin pixelar y con el tamaño y el fondo que se le pasan.
- `inspectorReducer`: `select` cambia el recurso seleccionado y no toca ningún ajuste. `rate`, `paused`, `size`, `background` y `pixelated` cambian solo el recurso seleccionado. Una velocidad o un tamaño que no sean un número finito y positivo se ignoran (devuelve el mismo estado), con el mismo criterio que `setSessionRate`.
- Es lógica pura: no lee ni escribe almacenamiento, preferencias ni `visual/rates`.

| Tarea | Resultado |
|---|---|
| T056 | RED. 8 pruebas nuevas en `motionLab.test.ts` con un esqueleto inerte: **3 fallan y 5 pasan**. Las que pasan afirman que algo no ocurre (rechazos y no tocar preferencias ni velocidades), y un esqueleto que no hace nada las cumple. La sensibilidad de §16.3 demuestra que sí discriminan. Las 14 pruebas anteriores del reductor de habla siguen en verde |
| T057 | GREEN. 22 de 22 |

### 16.3 Sensibilidad

Cada mutación se aplicó a `motionLab.ts`, se ejecutó su archivo de pruebas y se restauró. El SHA-256 del archivo era el mismo antes y después (`95418bf5…`).

| Mutación | Pruebas que la detectan |
|---|---|
| M1 acepta cualquier velocidad | Las 4 de valores no válidos (0, −1, NaN, ∞) |
| M2 acepta cualquier tamaño | Las mismas 4 |
| M3 cambiar de recurso reinicia los ajustes | `keeps the values of each resource when switching between entries` |
| M4 un ajuste cambia todos los recursos | 2 (`changes only the selected resource` y la anterior) |
| M5 escribe en `localStorage` | `touches neither the public preferences, nor the production speeds, nor the speed SofiSprite reads` |
| M6 llama a `setSessionRate` | La misma |
| M7 escribe la preferencia pública `motion` | La misma |
| M8 empieza a 0,5× | 2 |
| M9 empieza pixelado | 3 |

**Límite:** con `PRODUCTION_RATES` vacío, la prueba no distingue entre «empieza a 1×» y «empieza a la velocidad de producción». El código no lee `PRODUCTION_RATES`. Ver §16.5.

### 16.4 Comprobaciones técnicas

Según `tech-stack.md` §42.7: las pruebas del archivo durante RED y GREEN y, al cerrar, las suites que dependen de `motionLab.ts`, los tipos, el lint y el formato.

| Comprobación | Resultado |
|---|---|
| `npx vitest run src/design-lab/motionLab.test.ts` | 22 de 22 |
| `npx vitest related src/design-lab/motionLab.ts --run` | 3 archivos (`motionLab`, `DesignLab` y `PropPlaygrounds`), 36 pruebas, todas pasan |
| `npx tsc -b`, `npx eslint .`, `npx prettier --check` sobre los archivos tocados y `spec/features/008-sofi-character` | Sin errores. Prettier reformateó la prueba, y después se volvieron a pasar las suites relacionadas |
| `MotionSection.tsx`, estilos del Lab, `visual/rates`, `preferencesStorage`, `src/styles/sprites/`, `package.json`, repositorio de spritesheets | Sin cambios |

No se ejecutaron la suite completa de Vitest, Playwright ni `build`, porque no cambian configuración, estilos, dependencias ni nada que se pinte: el estado nuevo no lo usa todavía ningún componente. Esos pasos los ejecuta la CI.

### 16.5 Pendiente y notas

- **Conexión (T058):** el estado no se usa todavía en ningún componente. T058 tiene que pasar la velocidad elegida a `setSessionRate` (y quitarla con «comparar con 1×» sin perderla) y aplicar la pausa al recurso que se ve.
- **Valores de partida y opciones (T059):** el tamaño, el fondo y sus opciones se eligen en T059. El estado no fija ninguno.
- **1× frente a la velocidad de producción:** el catálogo §8 pide empezar en 1×, y hoy las dos cosas coinciden porque `PRODUCTION_RATES` está vacío. Si con AV3 alguna velocidad de producción deja de ser 1×, habrá que decidir si el inspector parte de 1× o de esa velocidad. No se decide aquí.
- **Sesión:** el estado vive en el `useReducer` de quien lo monte, así que se pierde al recargar, igual que la sobrescritura de `visual/rates`.

---

## 17. B1 — Inspector de los 14 recursos (T058)

Fecha: 2026-11-05. Antes de empezar: `main` en `eef8c9d` (T055–T057) con su CI en éxito (nº 29). Se corrigió una decisión durante la tarea (§17.2): `poking` conserva su velocidad original y no se experimenta con ella.

### 17.1 Qué se entrega

- **Inspector** (`Motion & Sound`, sección 4.5, `InspectorSpec.tsx`): selector de los 14 recursos y ficha (número, intención, tipo —bucle, una pasada o máquina—, activación, disponibilidad y estado); pausar y reproducir, reiniciar, velocidad de 0,25× a 4× en pasos de 0,25× con `LabRange`, «Comparar con 1×» (temporal, conserva la velocidad elegida), «Ver como» bucle o una pasada, «Nuevo evento» y «Cancelar a mitad». Reutiliza `LabRange`, `LabChoice`, `LabCheck`, `LabStage` y el estado de sesión de T056–T057 (`motionLab.ts`). Los datos de la ficha y las reglas puras viven en `spriteInspector.ts`; el estado transitorio (evento, cancelación, comparar, ciclo), en `inspectorRunReducer`.
- **`PENDING_IN_LAB`** de `coverage.test.ts` queda vacío (la propia prueba lo exigía al mostrar `SofiSprite`).
- **Cargadores solo del Lab:** `eureka` y `suspicious` no tienen cargador de producción (E12). `provideLabOnlyLoaders()` se los añade en el Lab con `??=`, sin tocar `loadSprite` ni el registro. El Lab no existe en la build pública (`import.meta.env.DEV`).
- **Reiniciar:** rehace la instancia (`key`), conservando pausa y velocidad. Un primer diseño que rebobinaba con Web Animations no servía: una pasada única terminada desaparece de `getAnimations()`.

### 17.2 Excepción aprobada: `poking` a 1× y sincronía de las capas CSS

- **Decisión de la autora (2026-11-05):** `poking` conserva su velocidad original. No tiene control de velocidad ni «comparar con 1×» en el inspector y no escribe ninguna velocidad de sesión. Los otros 13 recursos conservan ambos. La regla está en la spec §8 (fuente única) y el catálogo §8 la remite; AV3 la cita en `008-tasks.md`.
- **Incidencia previa (medida en Chromium):** `useSofiController` solo llamaba a `controller.setRate`, que mueve los temporizadores. Las animaciones CSS de las capas que crea el controlador nacían a 1×: con la sesión a 2×, `poking-huff` iba a 1×. Ocurría igual en `are-u-still-here` e `i-see-you`. La spec §8 pide la velocidad sobre «todas sus capas y los tiempos de su controlador».
- **Corrección** (`useSofiController.ts`, plan §5.5): con una velocidad distinta de 1×, el adaptador reaplica `applyRate` (movida de `SofiSprite` a `visual/rates`, sin cambios de comportamiento) al anfitrión al cambiar la velocidad, en un `MutationObserver` del anfitrión (atributos, hijos y subárbol) y en `animationstart`. La medición mostró que `animationstart` no basta: las capas con retardo (los `Zzz` de `are-u-still-here`, 600/1100/1600 ms) no avisan hasta que vence, y nacían y avanzaban a 1× ese tiempo. A 1× no escucha ni toca nada, y al volver a 1× restituye lo tocado. Los controladores y los spritesheets no se han modificado (`git diff -- src/styles/sprites` vacío).

### 17.3 Pruebas

Según `tech-stack.md` §42.7: archivos afectados durante RED y GREEN y, al cerrar, las suites de `src/design-lab` y `src/components/sofi`.

| Qué | RED | GREEN |
|---|---|---|
| `inspectorRunReducer` y `effectiveRate` (`motionLab.test.ts`) | Vistas fallar antes del código | 38 de 38 |
| `spriteInspector` (ficha, velocidad, cargadores del Lab, `hasSpeedControl`) | Las de ficha, velocidad y cargadores, antes del código. **`hasSpeedControl` se escribió antes que su prueba**: su detección consta por la mutación M6 | 10 de 10 |
| Adaptador, capas CSS (`useSofiController.test.tsx`, 15 nuevas) | 6 de las 11 primeras fallaban antes del código (las 5 restantes, la de `poking` y las de limpieza, pasaban en vacío: son guardas). Las 4 del observador fallaban antes de añadirlo (las de «nacen ya a la velocidad común» y «desconecta el observador», en los dos gags) | 50 de 50. **VT3 sigue pasando**: las pruebas de limpieza previas, más una con la velocidad cambiada: la sonda vuelve a la línea base |
| `InspectorSpec.test.tsx` | La de `poking` sin controles fallaba antes del cambio; las demás se escribieron junto al componente. Para «Reiniciar» se cambiaron prueba y código a la vez (RED solo del reductor): lo cubren C6 y R1–R3 | 58 de 58 (43 de antes más 15 de `poking`) |
| `npx vitest run src/design-lab src/components/sofi` | — | **28 archivos, 565 pruebas, todas pasan** (antes de esta corrección, 534) |

**Sensibilidad.** Del inspector: 13 mutaciones, 12 detectadas a la primera y una reforzada (C4a: un evento nuevo no rehacía una máquina). De la corrección, sobre `useSofiController.ts`: sin escucha de `animationstart` (6 fallan), sin aplicar al cambiar la velocidad (2), sin restituir a 1× (2), sin quitar la escucha (6), sin observar (4), sin desconectar el observador (2), observando solo atributos (2) y escuchando también a 1× (1: protege a `poking`). Sobre el inspector (M6–M8): `poking` con control de velocidad (3 fallan), escribiendo la sesión (1) y mostrando siempre los controles (2). Archivos restaurados byte a byte.

### 17.4 Navegador real (Chromium)

Método: Playwright contra el servidor de desarrollo, leyendo `getAnimations({ subtree: true })` cada 50 ms y registrando, por estado, la velocidad de cada capa. Una capa con más de 150 ms de vida a una velocidad distinta de la común se cuenta como fallo. Los guiones están fuera del repositorio (carpeta de trabajo de la sesión).

| Recurso | Antes de la corrección | Después |
|---|---|---|
| `are-u-still-here` a 4× (`idle`, `drowsy`, `nodding`, `asleep`) | Todas las capas a 1× | Todas a 4×, ninguna fuera de velocidad (los `Zzz` con retardo, también) |
| `i-see-you` a 2× (mirada en 4 sentidos) | Todas a 1× | Todas a 2× |
| `i-see-you` a 2×, pillada (`caught`, `smirk`, `tease`, `giggle`) | No medido | `caught`, `tease` y `giggle` a 2×; `smirk` no tiene capas CSS |
| `i-see-you` a 3×, comparar con 1×, 0,5× y evento nuevo | — | 3× → 1× al comparar → 3× al dejarlo → 0,5×, que se conserva tras «Nuevo evento» |
| `poking` (sin control de velocidad ni de comparar; `curious`, `skeptical`, `stop`, `offended`, `hide`) | Todas a 1× | Todas a 1×, con las mismas capas por estado (`hop/pop/bob`, `flinch`, `jolt/pop/throb`, `huff`, `duck/hide-rise/grab`): comportamiento original |
| Los otros 13 recursos a 2×, comparar, 0,25× y pausa | — | 2× → 1× → 0,25× → en pausa, en los 13 (11 CSS, `memory-wipe` y los gags) |
| «Una pasada» sobre `talking` | — | Corre 6 433 ms y se queda quieta («Primera pasada completada») |

Sin errores en la consola. La sincronía de los controladores con su temporizador (a 10× el `drowsy` a los 15 s; a 0,5× se duplica lo que falta) ya constaba en §10.3 y sigue pasando.

### 17.5 Accesibilidad, responsive y build

| Comprobación | Resultado |
|---|---|
| axe sobre el inspector en 32 estados (14 recursos, comparar con pausa y cancelado; claro y oscuro) | 0 violaciones, 23 reglas pasan |
| Teclado | El rango avanza de 0,25 en 0,25 con las flechas, `Home` y `End` llegan a los extremos y la tabulación sigue el orden visual (comprobado antes de la excepción; en `poking` desaparecen dos controles y el resto no cambia) |
| Desbordamiento horizontal | Ninguno a 390 y a 320 px (comprobado antes de la excepción) |
| `npx playwright test e2e/a11y.spec.ts e2e/production-build.spec.ts` (Chromium) | **57 de 57**. Incluye el contrato de E12: ni `eureka` ni `suspicious` llegan a la build. CSS de entrada 49 424 B, `gzipSync` 9 871 B (igual que en §11) |
| `npx tsc -b`, `npx eslint .`, `npx prettier --check src spec/features/008-sofi-character` | Sin errores |
| `src/styles/sprites/`, repositorio de spritesheets, preferencias públicas, `PRODUCTION_RATES` | Sin cambios |

### 17.6 Criterios de T058

| Criterio | Estado |
|---|---|
| Selector y ficha de los 14 | Cumplido |
| Reproducir, pausar, reiniciar y comparar con 1× | Cumplido. «Comparar» es temporal y conserva la velocidad |
| Velocidad individual sobre todas las capas y el controlador | Cumplido para 13. `poking`, a 1× por decisión de la autora |
| Bucle frente a pasada única, reinicio por evento nuevo y cancelación | Cumplido (jsdom y Chromium) |
| `LabRange`, `LabChoice`, `LabCheck` y `LabStage` | Reutilizados |
| `PENDING_IN_LAB` retirado | Cumplido |
| Accesibilidad de los controles | axe, teclado y 320 px, arriba |

### 17.7 Límites y pendiente

- **Firefox y WebKit:** el inspector y la corrección solo se han medido en Chromium. La velocidad y el ciclo en los tres motores van en T074; la limpieza del adaptador, en T073–T076.
- **Disparar las máquinas** (pinchazo, inactividad, mirada) en escena queda para T064 y T066; el inspector las prueba con el puntero y esperando.
- **Datos de la ficha:** son un resumen del catálogo §3 que vive en el Lab (el tipo, la disponibilidad y los 150 s se leen del registro y del adaptador). Duplican texto, no reglas.
- **Tamaño y fondo:** 240 px y puntos fijos, provisionales; sus controles son de T059. El inspector no hacía nada especial con movimiento reducido (resuelto en T062, §21).
- **1× frente a la velocidad de producción:** el inspector parte de 1× y escribe una sobrescritura de 1×. Si con AV3 alguna velocidad de producción deja de ser 1×, hay que decidir si parte de 1× o de ella (T082).
- **Primer instante de una capa nueva:** el `MutationObserver` corre antes de pintar, pero no se ha medido a nivel de fotograma si una capa llega a pintarse un fotograma a 1×. No se ha observado ningún salto.
- **Siguiente tarea:** T059. No se ha aprobado ningún `AV#` ni se han tocado T087–T088.

---

## 18. B1 — Tamaño, fondos, pixelado y contenedores (T059)

Fecha: 2026-11-05. Antes de empezar: `main` en `bc53011` (T058) con su CI en éxito (nº 30). Decisiones aprobadas y registradas en plan §8: tamaño de partida de 192 px, rango de 64 a 512 px en pasos de 8 px, y los fondos que ya tiene `LabStage` (sin fondos nuevos ni revisión de contraste).

### 18.1 Qué se entrega

- **Controles nuevos del inspector** (`InspectorSpec.tsx`, `spriteInspector.ts`): `LabRange` «Tamaño» (192 px de partida), `LabChoice` «Fondo» (Base, Liso y Puntos, los tres de `LabStage`; parte de Puntos, como en T058), `LabCheck` «Pixelado» (desactivado de partida), `LabChoice` «Contenedor» y `LabChoice` «Ancho». Usan el estado de T056–T057: tamaño, fondo y pixelado se conservan por recurso.
- **Pixelado:** `image-rendering: pixelated` en el contenedor del recurso. La propiedad se hereda, así que alcanza a las capas y a los pseudoelementos sin tocar los parciales.
- **Contenedores** (catálogo §8): el escenario entero (sprite suelto), el **busto apoyado** (155 × 190 px a 192 px, desplazamiento 20/7, fondo blanco; la pantalla de error, decisión 6 del README de dirección artística) y la **insignia** (96 × 96, desplazamiento 50/36, rosa suave; ficha 3.1 del Lab). Los recortes escalan con el tamaño del sprite para conservar la composición. Valen también para las máquinas. Se eligen una vez para todos los recursos, para compararlos en el mismo marco.
- **Ancho:** completo o 320 px (el móvil estrecho que ya usa la Preview). Para que limite de verdad, `.stageInner` pasa a una columna `minmax(0, 1fr)`; sin ella crecía con su contenido y el ancho estrecho no limitaba nada (visto en la captura de 512 px, corregido).
- **Retirado:** la nota «Tamaño y fondo de partida, provisionales» y el 240 px provisional de T058.
- **Excepción de `poking`:** sin cambios. Sigue sin velocidad ni «comparar»; sí tiene los ajustes de aspecto, que no escriben ninguna velocidad de sesión.
- No se tocan producción, los parciales ni los spritesheets.

### 18.2 Pruebas

| Qué | RED | GREEN |
|---|---|---|
| `spriteInspector.test.ts` (tamaño, fondos, contenedores y ancho) | 9 de 9 nuevas fallaban | 19 de 19 |
| `InspectorSpec.test.tsx` (tamaño, fondo, pixelado, contenedores, ancho y `poking`) | 19 de 19 nuevas fallaban; las otras 58 pasaban | 77 de 77 |
| `npx vitest run src/design-lab src/components/sofi` | — | **28 archivos, 593 pruebas** (antes, 565) |
| `npx tsc -b`, `npx eslint src/design-lab`, `npx prettier --check src spec/features/008-sofi-character` | — | Sin errores |
| `npx playwright test e2e/a11y.spec.ts` (Chromium) | — | 42 de 42 |

**Sensibilidad** (10 mutaciones, todas detectadas; archivos restaurados): sin clase de pixelado (3 fallan), pixelado siempre activo (2), el fondo no llega a `LabStage` (2), el tamaño no llega al sprite (2), el recorte ignora el tamaño (1), sin desplazamiento (2), ancho estrecho ignorado (1), recorte sin escalar (2), tamaño de partida de 240 px (8) y rango hasta 1024 px (2). La prueba de «parte desactivado» cubre el pixelado de partida. No hay prueba de la corrección del `scss` (jsdom no calcula el layout): la cubre la medición de §18.3.

### 18.3 Navegador real (Chromium)

| Comprobación | Resultado |
|---|---|
| Pixelado | De partida, `image-rendering: auto` en el contenedor, el sprite y su `::before`. Activo: `pixelated` en los tres, en claro y en oscuro |
| Tamaño | 64, 192 y 512 px dan cajas de 64, 192 y 512 px. Teclado: las flechas avanzan de 8 en 8 (192 → 208), `End` llega a 512 y `Home` a 64 |
| Ancho estrecho | El interior mide 320 px. A 512 px el sprite suelto se reduce a 320 px; el busto apoyado se recorta a 320 px. A 192 px y completo, el busto mide 155 px |
| Desbordamiento a 390 y 320 px, con 512 px y los tres contenedores | Ninguno (`scrollWidth` igual al ancho de la ventana) |
| axe, en claro y en oscuro: 192 px, busto, insignia, favoriting con pixelado, liso y 320 px, y estrecho con 512 px y busto | 0 violaciones en las 10 comprobaciones. Sin errores de consola |

Capturas locales (no versionadas), en la carpeta de trabajo de la sesión, `shots59\`: `light-` y `dark-` más `box-<recurso>.png` e `badge-<recurso>.png` de los 14, `inspector-pixelado-liso-320.png`, `inspector-estrecho-512-busto.png`, `light-narrow-512-box-fixed.png`, y las hojas `sheet-box.png` y `sheet-badge.png`.

### 18.4 Lo que enseña el recuadro del busto apoyado (hallazgo, sin decidir)

A 192 px, en el recuadro de 155 × 190 px, la composición de varios recursos queda recortada por los bordes: el sello de `favoriting` queda fuera, y el portátil de `sofing`, la pose invertida de `rolling` y los bordes de `uncertain` y `memory-wipe` (manos y destellos) se ven parcialmente. Es lo que pide comprobar el catálogo («que brazos, estrellas, sellos o saltos no se corten»), pero qué recurso se admite en qué contenedor es una decisión visual que no se toma aquí. Queda a la vista para el `AV#` correspondiente.

### 18.5 Criterios de T059

| Criterio | Estado |
|---|---|
| Tamaño (192 px; 64–512 px; pasos de 8 px) | Cumplido, con ajuste individual conservado al cambiar de recurso |
| Fondos | Los de `LabStage`; conservado por recurso |
| Pixelado | Desactivado de partida; conservado por recurso |
| Contenedores: escenario entero, insignia, busto apoyado | Cumplido con los recortes aprobados |
| Layouts ancho y estrecho | Cumplido: completo y 320 px |
| Ambos temas | El Lab usa un único tema global: axe y capturas en claro y oscuro. Sin el contorno crema del retrato (no se ha decidido ponerlo en el inspector) |
| Reutiliza `LabRange`, `LabChoice`, `LabCheck`, `LabStage` y el estado del inspector | Sí |

### 18.6 Límites y pendiente

- Solo Chromium. El resto de motores, en T073–T074.
- El contenedor y el ancho son del inspector, no de cada recurso: si se prefiere por recurso, es un cambio de estado de T056–T057.
- El recorte escalado con redondeo a píxel puede diferir 1 px de uno diseñado a mano a otro tamaño: se parte de las medidas de 192 px.
- **Siguiente tarea:** T060. No se ha aprobado ningún `AV#`.

---

## 19. B1 — Línea de tiempo por fotograma (T060)

Fecha: 2026-11-05. Antes de empezar: `main` en `9b8088b` (T059) con su CI en éxito (nº 31); árbol de trabajo limpio salvo los 13 ZIP.

### 19.1 Playground, otra vez en modo lectura (T055)

Se releyó `playground.js` (`addCard`, `tick`) del repositorio de spritesheets, en `17aca4f` y sin modificarlo. Lo que se adapta y lo que cambia:

| En el playground | En el inspector |
|---|---|
| Toma la primera animación del propio elemento (`sprite.getAnimations()[0]`) y de ella la duración y los `getKeyframes()` | Igual, pero sin suponer que es la primera: busca la del elemento (no la de un pseudoelemento) cuyos fotogramas clave mueven `background-position-x` |
| Traduce `backgroundPositionX` a fotograma con `round(% / 100 × (fotogramas − 1))`, sin comprobar nada | Solo acepta una posición que cae en un fotograma y entre fotogramas exige `steps(…)`. Si no, **no dibuja** una línea de tiempo (no inventa) |
| El desplazamiento escribe `currentTime` en todas las animaciones del subárbol y pausa todo | Igual, pero la pausa es la del recurso que se mira (T056–T057) |
| Salta a un fotograma al centro de su primer tramo, porque en el borde el navegador puede redondear al anterior | Igual |
| Las flechas mueven 100 ms | Igual, y se añaden `Inicio` y `Fin` (patrón de deslizador) |
| Si no hay animación, quita la línea de tiempo | Igual, con aviso |
| Nada para una pasada ya terminada | Se reinicia y se coloca al nacer la nueva (§19.2) |

### 19.2 Qué se entrega

- **`spriteTimeline.ts`** (lógica pura): `frameOf`, `buildTimeline`, `stepDuration`, `frameDuration`, `frameAtProgress`, `seekTimeOfFrame`, `progressAtPointer`, `timeAtProgress` y `nudgeTime`. Recibe los fotogramas clave y la duración de la propia animación; no guarda ninguna duración ni ningún fotograma.
- **`FrameTimeline.tsx`** (y su `.module.scss`), bajo el escenario del inspector: tramos a escala con el lenguaje de 4.4 (F0 crema, F1 mantequilla, F2 rosa, rótulo en los tramos de 1 s o más, cabezal), un deslizador accesible (`role="slider"`, `aria-valuetext` con el fotograma y el tiempo), una miniatura por fotograma con lo que dura en el ciclo y desplazamiento manual por puntero, miniatura y teclado.
- **Pasada única terminada:** el navegador deja de exponer su animación. Recorrerla pausa, reinicia el recurso (la misma acción que «Reiniciar») y, cuando nace la nueva, se coloca en el punto pedido, una sola vez.
- **Máquinas** (`poking`, `are-u-still-here`, `i-see-you`): sin línea de tiempo (§19.5).
- **4.4 intacta:** `BLINK_TIMELINE`, `foundationsData.ts`, `MotionSection.tsx` y su prueba de contrato sin cambios. Producción, `src/styles/` y los spritesheets, tampoco.
- **`poking`:** conserva su velocidad original. No se toca.

### 19.3 Pruebas

| Qué | RED | GREEN |
|---|---|---|
| `spriteTimeline.test.ts` | Vista fallar (el módulo no existía); un error de mis datos de prueba corregido después | 27 de 27 |
| `FrameTimeline.test.tsx` | **No se vio fallar antes del código**: escribí las pruebas y el componente seguidos y ejecuté después. La regresión de la pasada terminada sí: fallaba antes de la corrección (§19.4). La detección del resto consta por mutación | 15 de 15 |
| `InspectorSpec.test.tsx` (6 nuevas: debajo del escenario, recorrer pausa, pasada terminada, máquina, máquina cancelada, cambio de recurso) | Escritas con el componente; el fallo de dos de ellas fue de la prueba (`getByRole('slider')` también encontraba los rangos del panel) | 83 de 83 |
| `npx vitest run src/design-lab src/components/sofi` | — | **30 archivos, 641 pruebas** (antes, 593) |
| `npx tsc -b`, `npx eslint .`, `npx prettier --check src spec/features/008-sofi-character` | — | Sin errores |
| `npx playwright test e2e/a11y.spec.ts` (Chromium) | — | 42 de 42 |

**Sensibilidad** (18 mutaciones, todas detectadas tras reforzar una; archivos restaurados): recorrer sin pausar (6 fallan), sin reiniciar una pasada terminada (3), reiniciar varias veces (1), no colocar lo pendiente (2), **no limpiar lo pendiente (0 al principio; se añadió la prueba «lo pedido se usa una sola vez» y ahora falla 1)**, mover solo la animación del cuerpo (3), dibujar línea para una máquina (2), cabezal quieto (1), `Fin` a 1 (1), tolerancia de fotograma amplia (2), aceptar cualquier interpolación (2), progreso que llega a 1 (1), saltar al borde del tramo (5), sin dar la vuelta al ciclo (1), contar tramos de longitud cero (4), y en el inspector: la línea sin la máquina (2), recorrer sin pausar (2) y sin reiniciar (1).

### 19.4 Navegador real (Chromium)

Método: Playwright contra el servidor de desarrollo. Guiones fuera del repositorio (carpeta de trabajo de la sesión).

| Comprobación | Resultado |
|---|---|
| **Fidelidad** en los 11 recursos CSS: 60 puntos de la barra por recurso; el fotograma que dice la línea de tiempo frente al `background-position-x` realmente pintado en el sprite | **660 de 660** coinciden |
| Los tramos y las miniaturas suman el ciclo | Exacto en los 11: 4 200, 6 440, 5 800, 6 410, 4 150, 6 280, 8 400, 3 000, 3 500, 4 380 y 6 500 ms, los de la propia animación |
| Miniatura 3 de `sofing` a 2× | Pausa el recurso, pinta el fotograma 3, no cambia la velocidad (sigue en 2×), queda quieto en pausa y al reproducir avanza desde ahí (67 % → 86 %) |
| Teclado | `Inicio` 1 %, `→` 2 %, `Fin` 100 % y `→` da la vuelta (2 %) |
| Pasada única terminada (`favoriting`, 4 150 ms, 0 animaciones tras terminar) | Recorrer el fotograma 2 la reinicia en pausa y la deja con 5 animaciones a 2 350 ms, con el fotograma 2 pintado |
| Máquinas | Las tres muestran la nota y ningún deslizador. Cancelada una, cede a `sofi-blink` y muestra su línea de tiempo |
| axe (claro y oscuro; `sofing`, `favoriting`, `memory-wipe` y `poking`) | 0 violaciones en las 8 comprobaciones. Sin errores de consola |
| Desbordamiento horizontal | Ninguno a 390 y a 320 px |

**Incidencia encontrada y corregida con esta medición:** la primera versión daba por viva a una pasada ya terminada porque Chromium la sigue conectada y con estado `finished`; recorrerla movía una lista vacía y no hacía nada (`favoriting`: fotograma 0 pintado en lugar del 2). Ahora «viva» es «sigue entre las animaciones del elemento». Prueba de regresión añadida y vista fallar antes.

Capturas locales (no versionadas), en la carpeta de trabajo de la sesión, `shots60\`: `light-` y `dark-inspector-sofing.png`, `light-` y `dark-timeline-memory-wipe.png`, `light-` y `dark-timeline-poking.png`, `light-timeline-rolling.png`, `light-timeline-error.png` y `narrow-390-timeline.png` y `narrow-320-timeline.png`.

### 19.5 Limitaciones reales

- **Máquinas.** `poking`, `are-u-still-here` e `i-see-you` no admiten una representación fiel con `getKeyframes()`: el elemento solo tiene la animación de parpadeo de su reposo y cada estado crea sus propias capas (a veces con retardos de 600 a 1 600 ms) mientras los temporizadores del controlador deciden cuándo cambian. Dibujar la del reposo como si fuera la de la máquina engañaría. **No se introduce ninguna alternativa:** el inspector lo dice. Una línea de tiempo por estado (por ejemplo, la de `poking-huff` en `offended`) sería una decisión de diseño nueva y queda para consultar.
- **Una sola pista.** La línea es la de la tira del cuerpo. Las capas y los efectos (pseudoelementos, giros, opacidad, recortes) tienen sus propias pistas, que se mueven con el cabezal pero no se dibujan. `memory-wipe` cambia además el tamaño del fondo y el temblor del cuerpo: se ve en el sprite, no en las miniaturas.
- **Miniaturas.** Pintan la tira cruda del cuerpo, sin las capas de cara de `needs-context`, `error`, `eureka`, `suspicious` y `uncertain` (van en un `::before`): no son el fotograma compuesto.
- **Primer salto en marcha.** Al recorrer un recurso que se está reproduciendo, la pausa se aplica un fotograma después: el primer salto puede quedar hasta 16 ms por delante (medido: 16,5 ms en `sofing`). Después queda quieto.
- **Colores de F3 a F5.** 4.4 solo define F0 a F2. Los fotogramas 3, 4 y 5 usan lila, rosa suave y bruma de la paleta; son provisionales. El texto de cada tramo largo y de cada miniatura lleva el número del fotograma, así que el color no es lo único que distingue.
- **Un único motor.** Solo Chromium. La velocidad y el ciclo en tres motores van en T074.
- **No hay medición a nivel de fotograma de la sincronía del cabezal** (se lee en `requestAnimationFrame`); la comprobación de fidelidad es por posición en la barra, no por vídeo.

### 19.6 Criterios de T060

| Criterio | Estado |
|---|---|
| Línea de tiempo por fotograma con `getKeyframes()` | Cumplido en los 11 recursos CSS y `sofi-blink` |
| Sin duraciones copiadas ni fotogramas inventados | Cumplido: todo sale de la animación, y si no es representable no se dibuja |
| Miniaturas | Cumplido (tira cruda del cuerpo) |
| Desplazamiento manual | Cumplido: puntero, miniatura y teclado |
| 4.4 conserva `BLINK_TIMELINE` y su test de contrato | Sin cambios |
| Máquinas | Limitación documentada; no se introduce alternativa |
| Accesibilidad en navegador | axe 0, teclado y 320 px |

**Siguiente tarea:** T061. No se ha aprobado ningún `AV#`.

---

## 20. B1 — Peso y memoria decodificada (T061)

Fecha: 2026-11-05. Antes de empezar: `main` en `e8dec13` (T060), con la CI nº 32 en éxito en su segundo intento (el primero se canceló al agotar los 20 minutos en «Install Playwright browsers», sin relación con el código); árbol de trabajo limpio salvo los 13 ZIP.

### 20.1 Playground, otra vez en modo lectura (T055)

`playground.js` del repositorio de spritesheets, en `17aca4f` y sin modificarlo:

| En el playground | En el inspector |
|---|---|
| **Bytes:** suma de `assets[].bytes`, que sale de un servidor propio (`fs.statSync` de cada archivo) | Sin servidor: los bytes de cada tira son los que el navegador registra al cargarla (Resource Timing, `decodedBodySize`) |
| **Memoria:** `ancho × alto × 4` tras `Image.decode()` de todas las imágenes | Igual, y presentada como estimación (no cuenta mipmaps, copia en la GPU ni formato interno) |
| Una sola cifra de «descarga», que es el tamaño del archivo | Se separan los **bytes del archivo** y la **transferencia de red**: no son lo mismo |
| Totales de toda la página | Por recurso y por tira |
| Decodifica todas las imágenes de la lista, se hayan pedido o no | Solo las que el navegador ya cargó: pedir una tira para medirla cambiaría la estrategia de carga |

### 20.2 Qué se entrega

- **`spriteWeight.ts`** (lógica pura): `readTiming`, `decodedMemory`, `formatBytes`, `summarize`, `measureStrips`, `keepResourceTimings` y el entorno real del navegador (`browserEnvironment`). Lo que no se sabe es `null`, nunca un cero.
- **`ResourceWeight.tsx`** («Peso y memoria»), bajo la línea de tiempo: tiras, bytes del archivo (medido), transferencia de red, memoria decodificada (estimación `ancho × alto × 4`) y una fila por tira con su tamaño. Se mide después de la carga que ya existe (`loadSprite`) y se vuelve a medir sola si una tira acaba de cargar más tarde (`PerformanceObserver`); deja de vigilar al completarse, al cambiar de recurso y al salir.
- **`stripsOf(id)`** (`spriteInspector.ts`): las tiras del módulo dueño, sin cargar nada que no estuviera cargado.
- No se añaden servidor, dependencias ni mediciones duplicadas; producción, `src/styles/` y los spritesheets, sin cambios. 4.4 y su `BLINK_TIMELINE`, tampoco.

### 20.3 Tres hallazgos de la medición en navegador (corregidos)

1. **La transferencia de red no se puede medir en el Lab.** MSW registra un service worker en desarrollo que atiende **todas** las peticiones: el navegador informa de `transferSize = 0` con `encodedBodySize` completo, también en la primera carga con la caché fría (comprobado con una petición nueva: 119 278 B de cuerpo y 0 de red). Mostrarlo como «0 B, desde la caché» habría sido falso. Con un service worker delante, la ficha dice «no medible aquí: lo atiende el service worker de MSW» y no cuenta la tira como parcial. La transferencia real de cada pantalla sigue midiéndola `scripts/measureLoad.ts` (T001), que es donde corresponde.
2. **El búfer de recursos del navegador (250 entradas) se llena con los módulos del Lab:** en los recursos que se miraban después de los primeros, la ficha decía «sin medir». `keepResourceTimings()` lo amplía una vez al cargar el inspector y de nuevo cada vez que se llena.
3. **La primera versión duplicaba una descarga.** Decodificar la máscara `memory-wipe-dissolve.webp` sin `crossOrigin` es una segunda petición de la misma imagen (E13). Con la ficha había 17 peticiones de tira y sin ella, 16. Ahora la decodificación usa CORS en las tiras que el registro declara como máscara, como hace la carga: **16 peticiones, ninguna repetida**, igual que sin la ficha.

Un cuarto, de presentación: la ficha avisaba de «medición parcial» con todo medido, porque la red es siempre desconocida en el Lab. Corregido (RED visto), y a 320 px los términos pasan encima de sus valores.

### 20.4 Pruebas

| Qué | RED | GREEN |
|---|---|---|
| `spriteWeight.test.ts` | Vista fallar antes del módulo; los casos del service worker, el búfer, las máscaras y la completitud, antes del código | 29 |
| `ResourceWeight.test.tsx` | **No se vio fallar antes del componente** (pruebas y componente escritos seguidos, y ejecutados después). Sí se vieron fallar la vigilancia (2), las máscaras (1), el service worker (1) y la completitud (1) antes de su código | 21 |
| `spriteInspector.test.ts` (`stripsOf`, 15) y `InspectorSpec.test.tsx` (peso y búfer, 6) | Fallaban antes de `stripsOf` (15); las de la integración se escribieron con el componente | 34 y 89 |
| `npx vitest run src/design-lab src/components/sofi` | — | **32 archivos, 712 pruebas** (antes, 641) |
| `npx tsc -b`, `npx eslint .`, `npx prettier --check src spec/features/008-sofi-character` | — | Sin errores |
| `npx playwright test e2e/a11y.spec.ts` (Chromium) | — | 42 de 42 |

**Sensibilidad** (26 mutaciones, todas detectadas tras reforzar cinco): bytes comprimidos en vez de descomprimidos, red como cuerpo, revalidación contada como descarga, ceros en lugar de «sin dato», memoria ×3, escalón de 1 000, suma siempre completa, decodificar lo no cargado, suma desconocida a cero, sin ordenar por inicio (**sobrevivía; añadida la prueba de dos descargas**), medir sin esperar a la carga (**sobrevivía; ahora se comprueba que la decodificación precede a la medida**), no descartar lo que llega tarde y pintar el resultado de otro recurso (**sobrevivían; añadidas las dos pruebas de carrera**), lecturas fuera de orden (**sobrevivía; añadida la prueba de la lectura lenta**), memoria presentada como medida, caché confundida con descarga, estático sin tiras, y las de vigilancia, service worker y búfer (X1–X10). Archivos restaurados.

### 20.5 Navegador real (Chromium)

Método: Playwright contra el servidor de desarrollo, cada recurso por turno, y contraste **independiente** con los archivos en disco (`fs.statSync` y cabecera WebP con `sharp`).

| Comprobación | Resultado |
|---|---|
| Bytes del archivo de los 14 recursos frente al disco | **Idénticos en los 14** (por ejemplo `sofing` 116,5 KB; `rolling` 59,1 KB en 2 tiras; `memory-wipe` 102,0 KB en 12). Suma: **830,2 KB**, la cifra de E3 |
| Memoria estimada frente a ancho × alto × 4 con las dimensiones de la cabecera WebP | **Idéntica en los 14.** Suma de los 14: 28,9 MB (la de cada uno es independiente: la memoria de un recurso no se carga a la vez que la de los demás) |
| Número de tiras por recurso | 1, 1, 2, 2, 3, 4, 2, 1, 3, 2, 3, 2, 2 y 12 |
| Peticiones de tiras durante la visita de los 14 | 40 imágenes, ninguna más de una vez. Con y sin la ficha, las mismas (16 en la comprobación de `memory-wipe`, `sofing` y `rolling`) |
| Transferencia de red | «No medible aquí» en los 14 (§20.3, 1) |
| axe (claro y oscuro; `sofi-blink`, `sofing`, `rolling`, `poking`, `memory-wipe` y `eureka`) | 0 violaciones en las 12 comprobaciones. Sin errores de consola |
| Desbordamiento horizontal con `memory-wipe` (12 filas) | Ninguno a 390 y 320 px |

Capturas locales (no versionadas), en la carpeta de trabajo de la sesión, `shots61\`: `light-` y `dark-weight-rolling.png` y `-memory-wipe.png`, `light-` y `dark-inspector-sofing.png`, y `narrow-390-` y `narrow-320-weight-memory-wipe.png`.

### 20.6 Limitaciones reales

- **Transferencia de red:** no se mide en el Lab (service worker de MSW). Es la que pide EX1–EX4 y sale de `scripts/measureLoad.ts`, con un build y `vite preview`. Una alternativa (apagar MSW en el Lab, medir con CDP) cambiaría el arranque del Lab o añadiría un arnés: no se introduce sin consultar.
- **Servidor de desarrollo:** los bytes son los del archivo servido sin minificar ni comprimir. Los de producción pueden diferir (T043 midió las 35 tiras de la build).
- **Memoria:** es una estimación. No cuenta mipmaps, la copia en la GPU ni el formato interno. Las dimensiones salen de la decodificación (`Image.decode()`), que usa la caché del navegador; con la caché desactivada sería una segunda petición.
- **Solo lo ya cargado:** una tira que el navegador aún no ha pedido sale «sin medir». Para los gags eso no ocurre: la carga decodifica todas sus tiras antes de montar el controlador.
- **Sin CSS ni JS:** el peso del módulo dueño y de su parcial no se incluye; en desarrollo no son representativos. Los de la build constan en §11.
- **Búfer de recursos:** `keepResourceTimings()` amplía el del Lab (solo en desarrollo). Las entradas anteriores a esa llamada no se recuperan.
- **Un único motor.** Solo Chromium.

### 20.7 Criterios de T061

| Criterio | Estado |
|---|---|
| Peso por recurso | Cumplido: bytes del archivo, medidos, en los 14 |
| Memoria decodificada por recurso | Cumplido, como estimación declarada |
| Distinguir bytes reales, transferencia y estimación | Cumplido; la transferencia, «no medible aquí» y remitida al arnés (§20.6) |
| Sin servidor propio ni dependencias ni mediciones duplicadas | Cumplido |
| No alterar la estrategia de carga ni producción | Cumplido: 16 peticiones, ninguna repetida |

**Siguiente tarea:** T062. No se ha aprobado ningún `AV#`.

---

## 21. B1 — Modos de movimiento en el Lab (T062)

Fecha: 2026-11-06. Antes de empezar: `main` en `45944f1` (T061), con la CI nº 33 en éxito (`foundation` y `browser`); árbol de trabajo limpio salvo los 13 ZIP.

### 21.1 Qué se entrega

- **Un solo selector.** El selector global «Movimiento» del Lab (`DesignLab.tsx`) pasa de `system | reduce` a `system | reduce | full` («Sistema», «Reducido», «Completo»). El inspector **no tiene selector propio** y lo gobierna, como ya hacían los demás apartados, con el único `data-motion` de `<html>` (plan §4.1). No se duplica lógica: el estado efectivo sigue saliendo de `useReducedMotion` e `isReducedMotion`, que ya conocían `full`.
- **Los marcos del Lab ya no pierden `full`.** La Preview y el Perfil son iframes que reciben el modo por la URL y lo leían como `reduce ? 'reduce' : 'system'`: con «Completo» habrían arrancado en `system` sin avisar. Ahora lo leen con `motionFromParam` (`motionParam.ts`), contra `MOTION_PREFERENCES`.
- **La ficha dice la verdad con movimiento reducido.** Antes decía «Estado: Reproduciendo» con una pose estática. Ahora dice «Pose estática: movimiento reducido» (usa `useReducedMotion`; «Cancelado a mitad» conserva su texto). Producción, `src/styles/sprites/`, las poses, el registro y `memory-wipe` no se han tocado.

### 21.2 Pruebas

| Qué | RED | GREEN |
|---|---|---|
| `DesignLab.test.tsx` (selector global: tres modos y su orden, `full` en `<html>`, un único atributo al alternar, devuelve `<html>` al salir, un solo selector) | Vista fallar (3) | 5 nuevas |
| `PreviewSection.test.tsx` (el marco recibe los tres modos; arranca con `full` en la URL) | No fallan: por mensaje y por la URL de la sección `full` ya llegaba bien. Protegen contra regresiones. Lo que se perdía era la lectura **dentro** del marco (`PreviewFrameRoot`, `ProfileFrameRoot`), que no tiene prueba de componente: la cubren `motionParam.test.ts` y el navegador (§21.3) | 4 nuevas |
| `motionParam.test.ts` | Falla antes del módulo | 9 |
| `InspectorSpec.test.tsx`, estado con movimiento reducido | Vista fallar (2) | 6 nuevas |
| `MotionModes.test.tsx`: el Lab completo con el selector real y los **controladores reales** de `poking`, `are-u-still-here` e `i-see-you` (limpieza total al pasar a «Reducido» según la sonda de VT3: escuchas, observadores, temporizadores y fotogramas; `full` con el sistema pidiendo reducir; «Sistema» en vivo; alternar sin acumular) | Pasaron a la primera: el comportamiento ya existía y lo que faltaba era el selector. Se comprobó con mutaciones | 12 |
| `npx vitest run src/design-lab src/components/sofi src/app src/hooks` | — | **45 archivos, 839 pruebas** |
| `npx tsc -b`, `npx eslint .`, `npx prettier --check src spec/features/008-sofi-character` | — | Sin errores |
| `npx playwright test e2e/a11y.spec.ts e2e/motion --project=chromium` | — | 55 de 55 |

**Sensibilidad** (3 mutaciones, todas detectadas; archivos restaurados): el adaptador ignora el movimiento reducido (9 fallos), `full` no anula al sistema (3) y el selector sin «Completo» (12).

### 21.3 Navegador real (Chromium)

Método: Playwright contra el servidor de desarrollo y el selector real del Lab (botones «Sistema», «Reducido» y «Completo»), con el sistema en `no-preference` o `reduce` (`emulateMedia`), es decir, los seis modos. Cada recurso se elige después del modo, para que arranque de cero; en los animados se espera a que acabe la carga en frío.

| Comprobación | Resultado |
|---|---|
| Los 14 recursos × los 6 modos | **0 fallos.** En los tres modos reducidos (Sistema con el sistema reducido; «Reducido» con y sin el sistema reducido): ninguna animación en marcha, ninguna capa de controlador ni atributo de máquina, y **la misma imagen en los tres** (comparada con un hash de la captura). En los tres animados («Sistema» sin reducir; «Completo» con y sin el sistema reducido): animaciones en marcha (1 a 8 según el recurso) o, en los tres gags, el controlador montado con sus capas (8, 8 y 3) |
| `full` aunque el sistema pida reducir | Anima los 14 recursos, con el controlador de los tres gags montado |
| Poses reducidas | Las de los parciales, vistas en las 14 capturas, incluida `memory-wipe` (la pose aterrorizada con su cartel, D-16). Los tres gags quedan en la pose de `sofi-blink`, sin controlador ni capas |
| Limpieza completa al pasar a «Reducido» (`poking`, `are-u-still-here`, `i-see-you`; CDP `DOMDebugger.getEventListeners` y envoltorio de `setTimeout`/`setInterval` inyectado) | Tras «Completo» → «Reducido»: capas 0, atributos de máquina 0 y las mismas escuchas (en `window`, `document` y los descendientes del escenario) y los mismos temporizadores que antes de montarlo. Con «Completo» había 1 a 7 escuchas más en `document` y 0 a 2 en descendientes. Tras dos vueltas más, igual: no se acumula nada |
| Marcos de Perfil (4 iframes) y Preview | Con «Completo» → `data-motion="full"`, con «Reducido» → `reduce`, con «Sistema» → sin atributo (la URL del marco lleva el valor) |
| Errores de consola | Ninguno |

Capturas locales (no versionadas), en la carpeta de trabajo de la sesión, `shots62\`: `poses-reducidas.png` (las 14 en una hoja), `pose-<recurso>.png`, y `inspector-eureka-Reducido.png`, `inspector-poking-Reducido.png` e `inspector-poking-Completo.png`.

### 21.4 Hallazgos

1. **`full` se perdía en los marcos** (Preview y Perfil): corregido (§21.1) con prueba.
2. **«Estado: Reproduciendo» con una pose estática:** corregido (§21.1) con prueba.
3. Una primera medida de `memory-wipe` en `0` animaciones era la carga en frío de sus 12 tiras (la comprobación esperaba solo 900 ms), no un fallo. Con la espera adecuada, 5 animaciones en los tres modos animados.

### 21.5 Limitaciones reales

- **Solo Chromium.** La equivalencia de los seis modos en tres motores con los 14 recursos va en T073.
- **Los tres gags en reducido** muestran la pose de `sofi-blink`: es lo que hay hoy (sin controlador). La versión reducida propuesta de los gags es de T066 y su aprobación, de `AV#`; no se anticipa.
- **Las poses reducidas no se han comparado contra un patrón externo:** se comparan entre los tres modos reducidos y con los parciales por VT2 (`reducedMotion.test.ts`), y se han visto a ojo. Su aprobación visual (AV4) no se ha tocado.
- **El estado de pausa** que fija el inspector («Pausar») sigue disponible con movimiento reducido: solo guarda la preferencia del recurso.
- **Los temporizadores** se cuentan con un envoltorio que solo ve los creados tras cargar la página, y las escuchas por CDP no incluyen las propiedades `onX`. Los observadores solo constan en la sonda de jsdom.
- **Sin `AV#`:** no se ha aprobado ninguno; T063 y T073 no se han empezado.

### 21.6 Criterios de T062

| Criterio | Estado |
|---|---|
| Modos sistema, `reduce` y `full` en el Lab, con el selector global | Cumplido, sin selector nuevo |
| Se ve la pose estática correcta (14 recursos) | Cumplido en Chromium; poses de los parciales y `memory-wipe` sin cambios |
| `full` anima aunque el sistema pida reducir | Cumplido (14 recursos) |
| No sobrevive ningún controlador al pasar a `reduce` | Cumplido (3 gags, con CDP y con la sonda) |

**Siguiente tarea:** T063. No se ha aprobado ningún `AV#`.

---

## 22. B1 — 4.3 con `talking` y `onSpeakingChange` (T063)

Fecha: 2026-11-06. Antes de empezar: `main` en `f07ef26` (T062), con la CI nº 34 en éxito (`foundation` y `browser`); árbol de trabajo limpio salvo los 13 ZIP.

### 22.1 Qué se entrega

- **`SyncSlot.tsx`** (nuevo, en el Lab): el hueco de 4.3. Recibe solo el booleano de `SofiSpeech.onSpeakingChange` y pinta con `SofiSprite` lo que decide `selectVisual({ speaking })`: `talking` mientras habla y, si no, el reposo que ya da el contrato (`sofi-blink`). No elige recurso ni pose por su cuenta. Sustituye al marcador «Sprite hablando · pendiente 008».
- **`MotionSection.tsx`:** `MotionSection` guarda un único `useState<boolean>` que alimenta `onSpeakingChange` de 4.1 y el hueco de 4.3 (y su fila `speaking`). El estado por carácter de 4.1 (`onStateChange`, su registro y sus lecturas) no cambia. El texto, las etiquetas y el marco de 4.3 se actualizan; el resto de 4.1, 4.2 y 4.4, no.
- **Sin duplicar:** `SofiSpeech`, `useSpeechTimeline`, `selectVisual`, `SofiSprite`, el registro y la carga no se tocan. No se añade ningún `AV#`, pose ni temporizador.
- **Pausas:** en las pausas y al terminar se ve `sofi-blink` **solo como lo que el contrato da hoy**; el hueco lo declara provisional («Pausas · pendiente AV5») y no fija la boca quieta ni el regreso a `blink`. Lo decide AV5 (T070) y entrará por el registro (T083).

### 22.2 Pruebas

| Qué | RED | GREEN |
|---|---|---|
| `SyncSlot.test.tsx` (talking al hablar; reposo del contrato al callar; cambia en los dos sentidos; decorativo; marca de estado) | Falla antes del módulo | 5 |
| `MotionSync.test.tsx`, con el Lab entero, `SofiSpeech` real y el audio simulado del Lab: reposo inicial sin marcador; habla y calla en cada pausa de acuerdo con la lectura de 4.1 en cada paso; **no se repinta por carácter** (el hueco se pinta solo al cambiar el booleano); cambiar el texto a mitad; reiniciar a mitad; «Ver todo» de la mesa y del diálogo a mitad; cambiar la simulación de audio a mitad (se estrena el proveedor); movimiento reducido (nunca habla), activarlo a mitad y `full` con el sistema pidiendo reducir; desmontar a mitad, con y sin StrictMode (sin avisos de React y los mismos temporizadores que al empezar) | La primera ejecución falló en el reposo inicial (el marcador seguía ahí). Las demás se escribieron junto con el hueco y se ejecutaron después: **sin RED propio**; se comprobó con mutaciones | 13 |
| `npx vitest run src/design-lab src/components/sofi src/app src/hooks` | — | **47 archivos, 857 pruebas** (T062: 839) |
| `npx tsc -b`, `npx eslint .`, `npx prettier --check src spec/features/008-sofi-character` | — | Sin errores |
| `npx playwright test e2e/a11y.spec.ts e2e/motion --project=chromium` | — | 55 de 55 |

**Sensibilidad** (4 mutaciones, todas detectadas; archivos restaurados): `onSpeakingChange` sin conectar (11 fallos), el hueco remontado por carácter (1: la de repintados), el hueco con otra pose en pausa (11) y `useSpeechTimeline` sin avisar de que calla al cancelar (6, sobre código ajeno; ya lo cubrían sus pruebas de `SofiSpeech`, y estas lo cubren a través del Lab).

**Un fallo propio, corregido en la causa:** dos de las pruebas pasaban solas pero superaban los 5 s dentro de la suite completa, porque recorrían una respuesta larga en pasos de 10 ms con todo el Lab montado. Ahora usan un texto propio y corto (con pausas) y avanzan de temporizador en temporizador (un paso por letra); no se subió ningún tiempo límite.

### 22.3 Navegador real (Chromium)

Método: Playwright contra el servidor de desarrollo; un muestreo en la página cada 30 ms del recurso del hueco (por la clase del sprite), de la bandera `data-speaking` y de la lectura «Hablando» de 4.1.

| Comprobación | Resultado |
|---|---|
| Frase completa de la respuesta (reposo → hablar → pausas → fin) | `blink › talking › blink › talking › …` (7 veces `talking`; en otra ejecución, 6 y de vuelta a `blink` al terminar). 316 muestras; **una** en que 4.1 y la bandera dicen «habla» y el sprite aún es el de reposo: el primer `talking` (ver límites) |
| Peticiones de las tiras de `talking` | `talking.webp` y `talking-mouth.webp`, **una vez cada una**, sin duplicados |
| Animaciones del hueco | Con `talking`, 2 en marcha; con el reposo, 1 (el parpadeo) |
| Cambiar el texto a mitad | `blink › talking › blink`, en reposo al instante |
| «Ver todo» a mitad (el de la mesa y el del diálogo) | `blink › talking › blink`; Estado «completo» |
| Movimiento reducido antes de reproducir | Nunca `talking`, 0 animaciones, texto completo, «Hablando: no» |
| Activar «Reducido» a mitad | `blink › talking › blink`, sin volver a hablar |
| «Completo» con el sistema pidiendo reducir | Habla con `talking` |
| Salir de la sección a mitad de la frase | Sin errores ni avisos de consola; al volver, el hueco en reposo |
| axe (hueco, con la frase en marcha; 1280 claro y oscuro, 390 claro y 320 oscuro) | 0 violaciones; sin desbordamiento horizontal; marco de 150 × 150 px |

Capturas locales (no versionadas), en la carpeta de trabajo de la sesión, `shots63\`: `estados.png` (hablando, pausa y reducido), `hablando.png`, `pausa.png`, `reducido.png` y `sync-final.png`.

### 22.4 Limitaciones reales

- **El primer `talking` llega con retraso.** El módulo y las tiras de `talking` se cargan de forma diferida (plan §7, pendiente de EX3): hasta que están decodificadas, `SofiSprite` muestra su estático (el reposo). En el servidor de desarrollo local fueron entre 1 y 6 muestras de 30 ms. Con red lenta sería más; es justo lo que mide EX3. No se ha cambiado la estrategia de carga ni se ha precargado nada.
- **Renders:** se comprueba con un contador de renderizados del hueco en la prueba. No se ha pasado el React Profiler de plan §7 («los renderizados de `talking`»), que sigue pendiente; el estado por carácter de 4.1 sigue repintando 4.1 a propósito (es lo que demuestra).
- **Dependencia del compilador de React:** que el hueco no se repinte por carácter descansa en que `react({ compiler: true })` memoiza su elemento (no hay `memo` manual). La prueba falla si deja de ocurrir.
- **Solo Chromium** para el navegador real; jsdom en el resto. Firefox y WebKit, en T073–T076.
- **Las pausas son el reposo actual (`sofi-blink`), no una decisión:** AV5 no se ha aprobado, y T070 las propondrá (boca quieta o `blink`, y el paso `blink → talking`). El salto que se ve en cada pausa es justo lo que AV5 debe valorar.
- **4.1 conserva sus expresiones provisionales** (`SofiPortrait expression="talking"`): no era alcance de T063.

### 22.5 Criterios de T063

| Criterio | Estado |
|---|---|
| 4.3 usa `talking` conectado a `SofiSpeech.onSpeakingChange` | Cumplido |
| Desaparece el hueco «Sprite hablando · pendiente 008» | Cumplido |
| Transiciones: hablar, pausar, terminar, cambiar texto, «Ver todo», reducido y desmontar | Cumplido en jsdom y en Chromium |
| Sin renders por carácter ni sincronización duplicada | Cumplido (un único booleano; contador de repintados) |
| Sin decidir la pose de pausa | Cumplido: el reposo del contrato, rotulado como provisional |

**Siguiente tarea:** T064. No se ha aprobado ningún `AV#`.

---

## 23. B1 — Escenarios y secuencias del contrato (T064)

Fecha: 2026-11-06. Antes de empezar: `main` en `9cc683e` (T063), con la CI nº 35 en éxito; árbol de trabajo limpio salvo los 13 ZIP.

### 23.1 Qué se entrega

- **Sección «4.6 · Escenarios y secuencias»** en Motion & Sound (`ScenariosSpec.tsx`). Cada botón emite una señal del contrato, como lo harán 007 y 009, y lo que se ve lo decide `selectVisual` (con la marca del Lab). Rotulada «Simulación local».
- **`scenarioLab.ts`** (reductor puro): solo guarda las señales (`SofiState`), un historial de lo visto y un registro numerado. Las prioridades, el recurso y las interrupciones salen de `selectVisual`; el borrado, de `wipeAfter`. No hay `presentationGate` (es de T065).
- **Eventos:** hablar, pausa y «Ver todo»; petición pendiente; falta de contexto, error, interpretada sin señales, y los dos tonos de `interpreted`; «No sé más»; favorito guardado; borrado efectivo y fin de su confirmación; salida rápida; `safety_concern` y seguridad no evaluada, con «Seguridad resuelta»; reiniciar. El fin de la pasada única de `SofiSprite` es el real (`onEnd`), y se consulta el estado actual, sin cola.
- **Resultados elegidos a mano:** el tono `eureka`/`suspicious` lo elige quien prueba y la sección lo dice (la regla es de 006). No se infiere nada.
- **Privacidad:** el registro cuenta el orden del contrato (1 borrado real, que lo hace 009 y aquí no borra nada; 2 señal `data-erased`; luego `confirmation-ended`), y el de la salida rápida (1 oculto, 2 controladores cancelados, 3 sin sprite). No hay almacenamiento, borrado ni consulta simulados.
- **Gags:** los tres controladores reales (`GagHost`, extraído de `InspectorSpec` sin cambiar su comportamiento) comparten un `ambient` (`observeAmbient` solo reenvía y cuenta) con las cuatro causas de pausa y el registro de quién se activa, a quién se rechaza y qué pausas y reanudaciones llegan. Solo hay gags en una escena tranquila (representación de reserva); cualquier otra cosa los cancela. `poking` conserva su 1×: no se toca ninguna velocidad.
- **Adaptador:** `useSofiController` admite `idleAfter` opcional (la demostración de «inactividad y despertar» usa 5 s). Su valor por defecto sigue siendo `STILL_HERE_IDLE_MS` (150 000 ms provisionales) y no es la inactividad ajustable de T066. Sin cambios de producción.

### 23.2 Pruebas

| Qué | RED | GREEN |
|---|---|---|
| `useSofiController.test.tsx` (`idleAfter`) | Vista fallar | 1 nueva |
| `scenarioLab.test.ts` | Vista fallar (3): el borrado descartaba también la seguridad y la salida rápida. Corregido | 26 |
| `observeAmbient.test.ts` | **Sin RED visto** (prueba e implementación juntas); se comprobó con una mutación | 4 |
| `ScenariosSpec.test.tsx` (Lab real, controladores reales, sprite del escenario simulado) | **Sin RED visto** (escrita con el componente, ejecutada después); se comprobó con mutaciones | 26 |
| `npx vitest run src/design-lab src/components/sofi src/app src/hooks` | — | **50 archivos, 914 pruebas** (T063: 857) |
| `npx tsc -b`, `npx eslint .`, `npx prettier --check src spec/features/008-sofi-character` | — | Sin errores |
| `npx playwright test e2e/a11y.spec.ts e2e/motion --project=chromium` | — | 55 de 55 |

**Sensibilidad** (7 mutaciones, todas detectadas; archivos restaurados y comprobados con `cmp`): el fin de la pasada sin despachar (2 fallos), los gags siempre «tranquilos» (2), un `ambient` propio por gag (3), el borrado que descarta seguridad (6), `observeAmbient` ignorando el rechazo (1), `idleAfter` ignorado (2) y la escena sobria contada como tranquila (1). Una primera «mutación» de la escena sobria era equivalente (no cambiaba el comportamiento) y se rehízo.

Un ajuste ajeno: `MotionSync.test.tsx` buscaba el último «Ver todo» de toda la sección y 4.6 trae el suyo: ahora busca solo en 4.1.

### 23.3 Navegador real (Chromium)

Método: Playwright contra el servidor de desarrollo, con los recursos y controladores reales. En las pasadas únicas se espera su fin natural. Temporizadores con un envoltorio inyectado y escuchas por CDP.

| Comprobación | Resultado |
|---|---|
| `blink → talking → blink` | `talking` al hablar y reposo al callar |
| `processing → resultado`, `needs-context → uncertain` | `sofing › needs-context › sofi-blink › uncertain › sofi-blink`; ambas pasadas terminan solas |
| `favoriting → blink` | Termina sola; un guardado nuevo la repite |
| Resultados (`error`, `eureka`, `suspicious`, sin señales) | `error`, `eureka`, `suspicious` y reposo; los tres primeros terminan solos |
| `memory-wipe → neutral` | La animación termina y **sigue `memory-wipe`** (9 s después, 0 animaciones vivas) hasta la señal `confirmation-ended`, que devuelve a neutral |
| Seguridad | Con `safety_concern` («sin sprite») y con seguridad no evaluada («sobria»), nada de habla, petición, favorito o borrado cambia lo que se ve; los gags, 0 capas y 0 anfitriones. Al resolverla se representa el estado actual |
| Salida rápida | Sin sprite, 0 animaciones, ningún `memory-wipe` aunque llegue un borrado. Los gags se cancelan: `window` 19 y `document` 1 escuchas y los mismos temporizadores que con la escena ocupada (con los gags montados había 21 y 15), 0 capas |
| Gags | Toque secuencial: `poking` pasa a `skeptical` y es el gag activo; `i-see-you` y `are-u-still-here` quedan pausados por `ambient`, y el puntero sobre `i-see-you` no lo activa. `are-u-still-here` pasa a `drowsy` (8,5 s en esa prueba por haber estado pausado) y a `asleep`, y con actividad pasa a `startled` |
| Causas de pausa | Dos causas a la vez: una sola pausa por gag; quitar una no reanuda; quitar la última reanuda a los tres |
| Escena ocupada | Con habla, 0 gags; al volver al reposo, 3 anfitriones con 19 capas |
| Movimiento reducido | Sin controladores; `favoriting` queda como pose estática con 0 animaciones |
| Desmontar a mitad | Sin errores ni avisos de consola; mismos temporizadores que en las demás pruebas (2) |
| axe (1280 claro y oscuro, 390 claro, 320 oscuro y 1280 con texto ×2) | 0 violaciones tras corregir una: la opacidad del estado «cancelados» bajaba el contraste del texto de los gags; ahora solo atenúa el marco. Sin desbordamiento horizontal |

Capturas locales (no versionadas), en la carpeta de trabajo de la sesión, `shots64\`: `seccion-1280-light-x1.png`, `seccion-320-dark-x1.png` y las de 390 y ×2; `memory-wipe-final.png`, `salida-rapida.png`, `seguridad-*.png`, `gags.png` y `reducido-favoriting.png`.

### 23.4 Hallazgos y observaciones

1. **El borrado descartaba las señales de seguridad** (RED de §23.2): corregido; un borrado de datos no quita esas prioridades.
2. **Contraste:** corregido (§23.3).
3. **Peticiones repetidas de tiras.** En una pasada de Playwright con el service worker de MSW salieron 5 tiras con dos respuestas (`talking*` y `memory-wipe-face-*`). El inspector que ya existía, con la misma técnica, muestra 12 tiras repetidas y 2 respuestas por cada una (todas `200` por el service worker), y en otra pasada solo de 4.6 no hubo ninguna. Es un efecto de contar respuestas con MSW en desarrollo, no de esta sección; no se midió con un build (T001/EX3).
4. **Observación abierta, sin decidir (reducido):** sin animación no hay fin de pasada (`SofiSprite`, plan §5.4), así que una reacción de pasada única (p. ej. `favoriting` o `needs-context`) se queda como pose estática hasta el siguiente evento. El catálogo fija la pose reducida de cada recurso pero no cuánto dura en pantalla; es parte de AV4 (T069) y de quien posea el estado (007, 009).
5. Al resolver la seguridad con otras señales pendientes se ve la que corresponda al estado actual (por ejemplo `memory-wipe` si llegó un borrado), sin cola de lo vencido: es el contrato, no un fallo.

### 23.5 Limitaciones reales

- **Es una simulación manual:** las secuencias se recorren con los botones (y el historial las demuestra), sin reproducción automática; los tiempos entre eventos los pone quien prueba.
- **La escena tranquila de los gags** es una suposición del Lab (la representación de reserva); la regla real la pondrán 007 y 009.
- **Inactividad:** 5 s de demostración frente a los 150 s provisionales del plan; la definitiva es de AV6/T066.
- **Sin `presentationGate`** (T065), sin `holdMotion` (D-16 ya probado en T046; el Lab no escribe preferencias) y sin restablecer la preferencia de movimiento.
- **Solo Chromium** en navegador real. Firefox y WebKit, en T073–T076.
- **Seguridad sobria y sin sprite** se muestran como marcadores de texto: su diseño no existe (art-direction, README 10).
- **Sin `AV#`:** no se ha aprobado ninguno.

### 23.6 Criterios de T064

| Criterio | Estado |
|---|---|
| Eventos del contrato (habla/pausa/«Ver todo», petición, falta de contexto, incierta, favorito, toque, puntero, inactividad, borrado, salida rápida) | Cumplido (simulación local) |
| Secuencias `blink → talking → blink`, `processing → resultado`, `needs-context → uncertain`, `favoriting → blink`, `memory-wipe → neutral` | Cumplido, con pasadas reales |
| Prioridades de seguridad y de gags, interrupciones y limpieza | Cumplido (jsdom, CDP y consola) |
| Sin lógica funcional duplicada ni resultados inferidos | Cumplido |
| Privacidad: orden fiel, sin persistencia simulada | Cumplido |

**Siguiente tarea:** T065. No se ha aprobado ningún `AV#`.

---

## 24. B1 — Preview con los recursos reales y `presentationGate` (T065)

Fecha: 2026-11-06. Antes de empezar: `main` en `542e1a7` (T064), con la CI nº 36 en éxito; árbol de trabajo limpio salvo los 13 ZIP.

### 24.1 Qué se entrega

- **Recursos reales en las pantallas de siempre.** `SofiStage`, `SofiPortrait` y `ProcessingScreen`, `ReadingScreen`, `NeedsContextScreen` y `ErrorScreen` aceptan, **de forma opcional**, `visual` (recurso, primer ciclo y fin de la pasada) y, las dos que hablan, `onSpeakingChange`. Sin ellas se ven y se comportan exactamente como antes (producción no las pasa). Con `visual`, el reposo es el parpadeo real y la expresión provisional (F1, F2) deja de mandar. Layout, marcos y copy no cambian.
- **Quién decide qué se pinta:** la Preview emite las señales a `selectVisual` (con la marca del Lab): `sofing` al procesar, `needs-context` y `error` de pasada única y luego reposo, `talking` solo mientras habla (`onSpeakingChange`, un booleano, sin repintar por letra) y reposo el resto. **No** pinta `eureka` ni `suspicious` (sin tono: lo decide 006).
- **`presentationGate` demostrada:** el resultado *llega* tras la latencia simulada (la operación no se retrasa) y `useResultGate` pregunta a la función pura cuándo presentarlo: un resultado no crítico espera al fin del primer ciclo de `sofing` o al límite; el error, la cancelación y el movimiento reducido, en el acto. Un solo temporizador, limpio al cancelar, cambiar de escenario o desmontar; un aviso repetido (StrictMode) no presenta dos veces. «Cancelar» sigue disponible durante la espera.
- **Mesa de control:** límite de retención (0–10 s), velocidad de `sofing` (0,25–4×, por la vía de producción `visual/rates`) y latencia simulada (0–10 s), con «Valores por defecto»; el marco los recupera si se recarga. Una frase dice qué pasó con el resultado (retenido, por el ciclo, por el límite, en el acto o por movimiento reducido) y una tabla viva con **la propia `presentationGate`** enseña qué espera y qué no, incluidas seguridad, privacidad, borrado y salida rápida, que **no tienen pantalla** en la Preview (sin diseño, README 10).
- **Valores:** el límite parte del provisional de producción (3 s, `PROVISIONAL_RETENTION_LIMIT_MS`, sin cambiarlo) y la latencia, de la que ya había (1,6 s). Ninguno está aprobado: la mesa lo dice y **no se aprueba AV2**.

### 24.2 Pruebas

| Qué | RED | GREEN |
|---|---|---|
| `ResultScreens.visual.test.tsx` (las props opcionales y el reposo sin expresión provisional) | Vista fallar (6 y luego 2) | 12 |
| `useResultGate.test.ts` | Falla antes del módulo | 19 |
| `previewFlowReducer.test.ts` (llegada y presentación) | Vista fallar (7) | 8 nuevas |
| `PreviewSection.test.tsx` (ajustes, estado de la retención y tabla viva) | Vista fallar (16) | 16 nuevas |
| `PreviewFlow.gate.test.tsx` (la Preview con el sprite simulado: recursos, retención, cancelación, reducido, ajustes, StrictMode, desmontar) | **Sin RED visto** (escritas con la implementación y ejecutadas después); se comprobó con mutaciones | 23 |
| `PreviewFlow.test.tsx` y `PreviewSection.test.tsx` previas | Actualizadas a propósito: un resultado no crítico ya espera al límite y el estado de la Preview lleva `gate` | — |
| `npx vitest run` (todo) | — | **116 archivos, 2 256 pruebas** |
| `npx tsc -b`, `npx eslint .`, `npx prettier --check src spec/features/008-sofi-character` | — | Sin errores |
| `npx playwright test --project=chromium` (todo) | — | 183 de 183 |

**Sensibilidad** (11 mutaciones, todas detectadas; archivos restaurados y comprobados con `cmp`): el hook ignora el fin del ciclo (4 fallos), todo se trata como error (12), un aviso tardío presenta (2), el movimiento reducido se ignora (1), la velocidad no llega a `sofing` (1), el fin de la pasada no se anota (2), el hook no limpia su temporizador (4), la tabla ignora el movimiento reducido (1), la latencia (1) y el límite (2) de la mesa no llegan. Una (ajuste no finito aceptado) **sobrevivía** con `NaN` porque `NaN` ya se rechazaba por otra vía; añadí `Infinity` y ahora se detecta (1).

Un fallo mío, corregido: mi `.srOnly` usaba `1px` y la prueba de unidades del proyecto lo rechazó; ahora usa el mixin `visually-hidden`.

### 24.3 Navegador real (Chromium)

Método: Playwright contra el servidor de desarrollo, con la Preview en su iframe, un muestreo de la mesa cada 30 ms y los controles reales. Tiempos desde que se pulsa «Leer entre líneas» (incluye 0,45 s del envío simulado).

| Comprobación | Resultado |
|---|---|
| Éxito con los valores de partida | La operación termina a 2,1 s (retenido) y se presenta a 5,2 s **al límite**: retenido 3,03 s |
| `sofing` a 2× | El primer ciclo dura 3,2 s: se presenta **al fin del ciclo**, retenido 1,77 s. Con 4× y 3 s de latencia, el ciclo ya había terminado: presentado en 29 ms |
| Velocidad acelerada | `playbackRate` de la animación de `sofing` en el marco: 1, 2 y 4 según el ajuste (duración 6 440 ms), por la vía de producción |
| Límite ajustable | 1 s → a 3,2 s; 0 → a 2,2 s; 6 s → al fin del ciclo (≈ 6,4 s tras empezar). La operación llega siempre a 2,1 s |
| Falta de contexto | Igual que el éxito: retenida y presentada al límite |
| Error | Presentado en el acto (30 ms tras llegar) |
| Cancelar durante la retención | La consulta vuelve al instante y a los 9 s no hay lectura |
| Movimiento reducido | Con «Reducido» del Lab y con el sistema en reducir: presentado en el acto. «Completo» con el sistema en reducir **sí retiene** (al límite) |
| axe de la mesa (1280 claro y oscuro, 390, 320 oscuro y 1280 con texto ×2) | 0 violaciones propias; sin desbordamiento horizontal. Queda la regla `region` de la barra superior del Lab (`_bar`), anterior a este cambio |
| Errores de consola | Ninguno |

Capturas locales (no versionadas), en la carpeta de trabajo de la sesión, `shots65\`: `procesando-sofing.png`, `lectura-talking.png`, `needs-context.png`, `error.png`, `error-secuencia.png`, `mesa-1280.png`, `mesa-320-dark.png` y `tabla-1280.png`.

### 24.4 Limitaciones y decisiones abiertas

1. **El recorte de `error` corta el brazo.** Su marco (155 × 190 px, pegatina) se diseñó para la pose fija «ups»; con el recurso `error` el fotograma final apoya la mano en la cabeza y el brazo izquierdo queda cortado por el recorte (`error-secuencia.png`). El catálogo deja la escala y el recorte de `error` al Lab: **no se cambia el recorte sin aprobación**.
2. **`sofing` ocupa su caja con el portátil cortado por la izquierda** (`procesando-sofing.png`), igual que en el escenario del inspector; es la misma decisión pendiente de escala y recorte.
3. **Durante la retención el texto decía «Sofi está leyendo tu mensaje.»** aunque la operación ya había terminado. Corregido en §24.6, con copy provisional (la etiqueta definitiva es de T068/AV1).
4. **Seguridad, privacidad, borrado y salida rápida** no tienen pantalla en la Preview (sin diseño): solo se ven en la tabla, con la decisión real de la función. `eureka` y `suspicious`, tampoco (006).
5. **Se amplían las pantallas de producción con props opcionales** (`visual`, `onSpeakingChange`, y en `SofiPortrait` `onFirstCycle` y `onEnd`). Producción no las pasa y se ve igual; cuando `007` integre los recursos, decidirá cómo las usa. No se tocan valores de producción.
6. **Retención en jsdom:** sin Web Animations no hay fin de ciclo; en esas pruebas manda el límite. El fin del ciclo real solo consta en Chromium.
7. **Solo Chromium** para la medición en navegador; Firefox y WebKit, en T073–T076.
8. **Peticiones de tiras en la Preview:** no se ha vuelto a contar con la técnica de MSW (§23.4, 3); no se ha medido el efecto de la Preview en la carga (EX3).
9. **Sin `AV#`:** AV2 no se aprueba; el límite y la latencia son de prototipo.

### 24.5 Criterios de T065

| Criterio | Estado |
|---|---|
| La Preview usa los recursos reales conservando su layout y reutilizando los componentes | Cumplido, con las salvedades 1 y 2 de §24.4 |
| `presentationGate` con el primer ciclo, el límite ajustable y la velocidad acelerada | Cumplido, en navegador |
| Resultados no críticos, errores, seguridad, cancelación y movimiento reducido | Cumplido; la seguridad, en la tabla (sin pantalla) |
| Sin retrasar acciones funcionales | Cumplido: la operación llega siempre a su hora y «Cancelar» responde al instante |
| Prototipo: sin decisiones de 007 ni AV2, sin valores de producción cambiados | Cumplido |

### 24.6 Corrección: operación pendiente frente a presentación pendiente

Fecha: 2026-11-06. Parte de `9c0f3bd` (T065), con la CI nº 37 en éxito. Corrige la salvedad 3 de §24.4: durante la retención la Preview seguía diciendo «Sofi está leyendo tu mensaje» con el resultado ya recibido.

- **Qué cambia.** `ProcessingState` y `ProcessingScreen` aceptan, de forma opcional, `resultReady` (producción no lo pasa y se ven igual). Con él, nada afirma que se siga procesando: titular, estado anunciado (`role="status"`, uno solo), rótulo sobre el mensaje, nombre accesible y diálogo del escenario de Sofi, y la cabecera de la Preview. La barra de actividad no se enseña. Manda sobre el aviso de espera larga. «Cancelar», el mensaje y el contexto se conservan. El copy está en `READY_COPY`, marcado como provisional: la etiqueta de actividad definitiva y su texto son de T068/AV1, que no se anticipan. Reutiliza los mismos componentes, sin uno nuevo.
- **Cuándo.** Solo con el resultado recibido y por presentar. Se decide **una vez, al llegar**: la Preview le pregunta a la propia `presentationGate` (a través de `decideGate`, que reutiliza la función y no copia su regla) si esperaría, y lo recuerda (`holding`). Lo que no espera (error, movimiento reducido, límite a cero) no pasa ni un fotograma por «ya la tengo»; la mesa tampoco marca «Retenido» para un error, que antes parpadeaba 30 ms.
- **Caso límite corregido (revisión del diff).** La primera versión recalculaba «lista» en cada render con las entradas actuales, así que al terminar el primer ciclo, bajar el límite a cero o activar el movimiento reducido con el resultado ya retenido, «lista» pasaba a `false` un commit antes de que el efecto presentara y reaparecía «Leyendo entre líneas…». Ahora «lista» se mantiene hasta presentar. Pruebas de regresión primero (RED visto: la secuencia de lo que dijo «Procesando» era `[false, true, false]` en los tres casos, y en falta de contexto y con StrictMode), con el registro de cada render y de cada estado que la Preview comunica; el fin del límite y lo inmediato ya cumplían y quedan como guarda. 6 mutaciones, todas detectadas. En Chromium, un `MutationObserver` dentro del marco no ve ningún regreso a «Leyendo…» en los tres casos ni con el límite agotado, y el error y el límite a cero desde el principio siguen sin «Ya tengo tu lectura». Todo: 117 archivos y 2 285 pruebas; `tsc`, `eslint` y `prettier` sin errores; `a11y.spec.ts` y `e2e/motion` 55 de 55.
- **Pruebas.** `ResultScreens.ready.test.tsx` (8; RED visto en 5) y 10 nuevas en `PreviewFlow.gate.test.tsx` (RED visto en 4: el copy retenido y el parpadeo de «Retenido» en lo inmediato, con un `MutationObserver` que registra cualquier fotograma de «ya la tengo»). Se actualizaron a propósito las pruebas anteriores que comprobaban el texto equivocado durante la retención. 8 mutaciones, todas detectadas; la del aviso de espera larga era equivalente en su primera forma y se rehízo. Con esta primera versión: 117 archivos, 2 274 pruebas, `tsc`, `eslint` y `prettier` sin errores; `playwright --project=chromium` 183 de 183. Tras el ajuste del caso límite (siguiente punto) la cifra final es la de ese punto.
- **Navegador (Chromium).** Con los valores de partida, el marco pasa de «Leyendo entre líneas… · Sofi está leyendo tu mensaje.» (con barra) a las 2,1 s, al llegar el resultado, a «Ya tengo tu lectura · Ya la he leído: ahora te la enseño.» (sin barra) y a las 5,2 s a la lectura. Ningún fotograma muestra a la vez el titular de lectura lista y una afirmación de leer. Error, límite 0 y movimiento reducido: 0 de 87, 87 y 86 fotogramas con «Ya tengo tu lectura». Cancelar en esa fase vuelve a la consulta. «Carga» sigue leyendo con su aviso de espera larga. axe en el momento de la retención (1280 claro y oscuro, 390 y 320 oscuro): 0 violaciones del marco; solo `landmark-unique` del `<header>` del Lab y `region` de su barra superior, que salen igual con la operación pendiente y son anteriores. Sin errores de consola. Capturas locales, en la carpeta de trabajo de la sesión: `shots66\\retenido.png` y `retenido-390.png`.
- **Límites.** El sprite `sofing` sigue en su primer ciclo durante la retención (es la excepción del catálogo §6.4, no se toca) y puede seguir pareciendo que trabaja: si debe seguir así o pasar a otra pose lo decide AV2/AV4, no esta corrección. El copy es provisional y solo en español. Sin Firefox ni WebKit. No se tocó ninguna pantalla de resultado ni valor de producción.

## 25. B1 — Gags en la insignia de la consulta móvil (T066, prototipo parcial)

Fecha: 2026-11-06. Antes de empezar: `main` en `2a87b4d` (T065 y su corrección); árbol de trabajo limpio salvo los 13 ZIP. **T066 no está completada**: es un prototipo parcial que pidió la autora, solo de la consulta móvil, sin `AV#`. No se commitea ni se integra nada en producción ni se avanza al expediente ni a T087–T088.

### 25.1 Alcance

Instrucciones de la autora para este prototipo. **No son aprobaciones** (ver un prototipo funcionando no lo es, `008-tasks.md`): mantener la insignia actual («alternativa A1»), dejar que los efectos de los gags sobresalgan de ella y que `poking` se esconda tras el borde inferior de la propia insignia. «A1» no consta como etiqueta en ningún archivo de la feature; se ha leído como «la insignia de la consulta en una columna, sin cambios» (`art-direction/README.md`, decisión 5).

Queda fuera, y por tanto pendiente de T066: la ubicación en el expediente y en la consulta a dos columnas, y la segunda candidata de ubicación (con A1 decidida no se prototipa).

### 25.2 Qué se entrega

- **Sección «4.7 · Gags en la insignia»** en Motion & Sound (`GagsSpec.tsx`, `GagBadge.tsx`, `GagsSpec.module.scss`). La insignia de la consulta (recuadro de 100 × 130 px, sprite de 128 px desplazado −16/−3) con los **tres controladores reales sobre un único anfitrión**, como en producción (plan §6), a través del adaptador de producción (`useSofiController` ×3 y `createAmbient`). Dentro de una «pantalla» de 320 px con el diálogo y el paso 1 de la consulta.
- **Efectos que sobresalen:** el recuadro no lleva `overflow: hidden` (el de `SofiPortrait` sí). **`poking`:** el borde donde se esconde (`--poking-edge`) es el 100 %, que es el borde inferior interior de la insignia: con 2,5 px de borde el alto interior es 125 px y el sprite, desplazado 3 px, termina justo ahí. Consta en el SCSS aunque sea el valor por defecto.
- **Inactividad ajustable** de `are-u-still-here` (5 s a 3 min, de 5 en 5 s). Parte de los 150 000 ms provisionales del plan §6 y dice si el valor cabe en la horquilla de 2–3 min de la spec §5. Cambiarla reinicia los tres controladores.
- **Propuesta reducida** al lado, con la insignia de producción (`SofiPortrait`, fotograma 0): sin gags, controladores ni capas, y tocarla no hace nada. Es lo que ya decide D-1 y una de las opciones del catálogo (§4: los tres gags admiten suprimirse en reducido); no es una aprobación (AV4).
- **Controles:** qué gags están montados, las cuatro causas de pausa y el registro de lo que hace `ambient` (extraído de 4.6 a `gagLog.ts`, sin cambio de comportamiento).
- **Reutiliza** `LabSpec`, `LabStage`, `LabRange`, `LabCheck`, `LabReadout`, `LabNote`, `SofiDialog`, `StepTag`, `SofiPortrait`, `observeAmbient`. Ningún componente nuevo de la biblioteca.
- **Sin cambios de producción.** Los únicos archivos fuera de lo nuevo: `MotionSection.tsx` (enlace 4.7 y la sección), `ScenariosSpec.tsx` (importa el registro movido) y `src/styles/units.test.ts` (excepción justificada de `width: 320px`, la misma razón que la de `UiSection`: píxeles de la pantalla, no del texto).
- **Decisión de implementación:** el marco mide siempre 320 px, sin escalar (el pixel art se emborronaría y no sería el 320 real). Si la ventana es más estrecha, el contenedor se desplaza en horizontal, con foco de teclado (`role="region"`, `tabIndex`; ESLint lo desaconseja en general y la regla se desactiva en esa línea con su motivo: axe exige el foco en una región desplazable).

### 25.3 Pruebas

| Qué | RED | GREEN |
|---|---|---|
| `gagBadge.test.ts` (rango y formato de la inactividad) | Visto fallar (módulo inexistente) | 11 |
| `gagBadge.contract.test.tsx`: la geometría del prototipo es la de `ConsultationScreen` (renderizada) y dos decisiones del CSS leídas como texto (recuadro sin `overflow`; `--poking-edge` igual al borde inferior calculado con el token) | **Sin RED** (caracterizan lo que ya existe); se comprobó con 7 mutaciones | 5 |
| `GagsSpec.test.tsx` (Lab real, controladores reales; solo se simulan los módulos dueños y la decodificación) | Visto fallar (módulo inexistente); dos expectativas mías mal escritas se corrigieron. El defecto de §25.5.1 se dejó como `it.fails` y se convirtió en prueba normal al corregirlo (§25.7) | 19 |
| `ScenariosSpec.test.tsx` tras mover el registro | — | 26, sin cambios |

**Sensibilidad** (12 mutaciones, todas detectadas; archivos restaurados y comprobados con `cmp`): geometría (`offsetX`, alto, tamaño del sprite, `offsetY`: 4), `overflow: hidden` en el recuadro, `--poking-edge` a 90 % y sin declarar (3), `calm` de `poking` siempre verdadero (3 fallos), `aria-hidden` fuera (1), `idleAfter` sin llegar a `are-u-still-here` (2), inactividad de partida a 90 s (3) y la propuesta reducida montando los gags (2).

Comprobaciones del repo: `npx tsc -b`, `npx eslint .` y `npx prettier --check .` sin errores. `npx vitest run`: **120 archivos y 2 320 pruebas** (T065: 117 y 2 285), de las que 2 319 pasan y 1 era el fallo esperado de §25.5.1 (tras §25.7: 2 336 y ninguno esperado). Una ejecución anterior de la suite completa falló una vez en `MotionSync` (5,5 s sobre su límite de 5 s); sola tarda 1,7–2,0 s con y sin 4.7 (3 pasadas cada una), así que fue contención de los tres hilos, y la repetición pasó entera. `npx playwright test e2e/a11y.spec.ts e2e/motion --project=chromium`: **55 de 55**, con el axe de `?s=motion` incluida la sección nueva.

### 25.4 Navegador real (Chromium, Playwright 1.64)

Método: servidor de desarrollo propio en el puerto 5188, con los recursos y controladores reales. Toques con CDP (`Input.dispatchTouchEvent`, también de ~90 ms apoyado, que es lo que dura un toque humano), móvil emulado con `hasTouch`, a 3× y 2×. Guiones de usar y tirar, fuera del repositorio; las capturas son locales y no se versionan.

| Comprobación | Resultado |
|---|---|
| Geometría en navegador | Recuadro 100 × 130, `overflow: visible`, anfitrión de 128 × 128 con las tres clases y 12 capas, sin errores de consola |
| **Fidelidad con producción** | La insignia del prototipo (reducido forzado) frente a la de `SofiPortrait` de la tira de al lado, píxel a píxel: **0 píxeles distintos** de 19 096 (claro 1×), 171 864 (claro 3×) y 171 864 (oscuro 3×) |
| Marco a 320 px | 320 px exactos con la ventana en 430 y en 320 (en 320 el contenedor se desplaza: 252 visibles de 336); sin desbordamiento horizontal de la página (320 = 320) antes, durante y después de los toques |
| `poking` con toques reales | `curious → skeptical → stop → offended → hide` en 430 y en 320. Escondida, queda recortada por el borde inferior de la insignia, con las manos agarradas a él por delante (claro y oscuro) |
| Efectos que sobresalen | El «?» de `poking` cruza el borde derecho; los Zzz y la alerta «!!» de `i-see-you` salen por la esquina superior derecha. Ninguno recortado |
| `are-u-still-here` con 5 s | `idle → drowsy (4,7 s) → nodding → drowsy → nodding → asleep (14,2 s)`; un toque: `startled → guilty`. Con los 150 s de partida solo hay prueba con reloj simulado (jsdom), no en reloj real |
| `i-see-you` con el dedo apoyado 3 s | `idle → watching → caught → smirk → tease` |
| Arrastrar desde la insignia | La página se desplaza (`touch-action: manipulation`): el gag no bloquea el scroll |
| Movimiento reducido | Sistema normal: gags vivos. **Sistema en reducir**, **«Reducido» del Lab** y el cambio en vivo completo → reducido: 0 capas, 0 atributos, 0 animaciones, y los toques no hacen nada; reducido → completo los recrea (12 capas, 4 atributos). **«Completo» con el sistema en reducir:** gags vivos (D-9) |
| axe (WCAG 2.x A/AA y 2.2) sobre `#m-gags` | 0 violaciones en 1280 claro y oscuro, 390, 320 oscuro, y 1280 y 320 con el texto al 200 %; sin desbordamiento de página; 0 errores de consola |
| Texto ampliado (100/150/200 %) | La insignia no cambia (px de la pantalla, como en producción); el diálogo crece como el de producción |
| Tema oscuro | `curious` y `hide` correctos (anillo crema, sin artefactos) |

Capturas locales de la sesión, en la carpeta de trabajo `shots\`: `p1-curious`, `p3-stop`, `p5-hide` (escritorio, 3×), `t320-poking-toque1` y `toque5`, `t430-toque3` y `toque5` (el solape de §25.5), `g-still-asleep-zzz`, `g-still-startled`, `g-see-caught`, `r-*` (reducido), `k-curious` y `k-hide` (oscuro), `v320-a-seccion`.

### 25.5 Hallazgos y decisiones abiertas

Numeradas para aprobarlas por número.

1. **Defecto del adaptador: `i-see-you` dejaba su cara pintada mientras actuaba `poking`. RESUELTO el 2026-11-09 con autorización expresa (§25.7).** Se describió así: los controladores documentan el patrón `quiet` (al salir uno del reposo, los demás hacen `reset()` y `pause()`) y el adaptador solo hacía `pause()`; como `watching` cuenta como reposo, `poking` podía activarse con `i-see-you` mirando y la cara de este se quedaba (en `hide`, dos ojos flotando en el hueco). Aparecía en el primer toque de móvil (toque humano de ~90 ms: `poking`/`watching` a la vez en los 5 toques a 430 px).
2. **Zona sensible mayor que la insignia visible. DECIDIDO el 2026-11-09 y prototipado en §26:** los gags solo responden sobre las partes visibles de Sofi (incluidas cabeza y manos cuando sobresalgan); lo transparente no. Sin el recorte, el anfitrión (128 × 128) respondía al toque y al puntero 14 px a cada lado del recuadro (100 px visibles).
3. **Propuesta reducida. SIN DECISIÓN NUEVA (revisado el 2026-11-09):** ya la fijan plan §6 y D-1, y la deja a la autora AV4 (plan §9, punto 4; spec, «Provisional and pending»). Se propone «sin gags, pose de reposo» porque es lo que ya decide D-1 y una opción del catálogo. Mantener reacciones estáticas (catálogo §4) exigiría montar controladores con movimiento reducido, que contradice D-1: **no se prototipa**; si quieres verlas, hay que revisar D-1 antes. La aprobación es de AV4.
4. **Contenedor «Insignia» del inspector (4.5) distinto de la insignia actual. SIN DECISIÓN NUEVA (revisado el 2026-11-09):** son dos cosas con el mismo nombre. «Insignia» del inspector es el tamaño `badge` de `SofiPortrait` (ficha 3.1, recorte de cara de 96 px), un marco genérico para comparar recursos (T059, cerrada); la insignia de la consulta es la decisión 5 del README (Sofi entera). Ninguna contradice a la otra ni afecta a los gags. `spriteInspector.ts` define «Insignia» como un recorte a la cara de 96 × 96 a 192 px (ficha 3.1), mientras que la decisión 5 del README y la consulta usan a Sofi entera en 100 × 130 con el busto apoyado en el borde. No se ha tocado (T059 está cerrada); queda anotado por si debe alinearse.
5. **Las pruebas de movimiento de Firefox y WebKit son inestables en esta máquina, también en HEAD.** Cargan `?s=sofi` y `?s=ui`, donde 4.7 no se renderiza, y fallan al azar por esperas (5 s en `toBeVisible`, 30 s por prueba). Medido con `npx playwright test e2e/motion --project=firefox --project=webkit` (26 pruebas): HEAD limpio (`2a87b4d`) 1 fallo; con 4.7, 3 y 2 fallos (y 6 de 81 en una ejecución con Vitest y mutaciones en paralelo); falla una prueba distinta cada vez. `Spinner` en WebKit va al filo del límite (≈ 20–33 s para 30 s): en HEAD limpio dio 0 fallos en una tanda y **8 de 8** en otra posterior (31–33 s), y con 4.7, 4 de 8. Se probó y se descartó una hipótesis (el *warmup* del servidor también transforma los `.test.tsx`: quitando mis dos archivos de prueba, 7 de 24 fallos). No se ha identificado la causa, que varía entre tandas; no se ha tocado ningún tiempo de espera ni hay evidencia de que este cambio lo empeore. Chromium: 55 de 55. El presupuesto de 30 s de esas pruebas en WebKit es el punto frágil.

### 25.7 Corrección del defecto de §25.5.1 (2026-11-09)

Autorizada por la autora, limitada a `ambient.ts` y `useSofiController.ts`: al activarse un gag, los demás vuelven a `idle` con `reset()` y siguen pausados; las causas de la escena **no** resetean. Sin tocar spritesheets ni los controladores originales.

- **`visual/ambient.ts`:** `PauseTarget` gana `reset?()` (opcional: sin él, el gag solo se pausa). `activate` llama a `reset()` de cada uno de los demás **y después** a `pause()` (orden del patrón `quiet`), solo cuando el gag entra (no al repetir la activación del activo ni en un intento rechazado). Se fija `active` antes del reset: el reset hace que el controlador avise de su reposo y eso llama a `deactivate`, que no debe liberar al recién activado.
- **`useSofiController.ts`:** registra `reset: () => attached.reset()`. Los tres controladores lo exponen.
- **Un archivo fuera de los dos autorizados, solo del Lab:** `design-lab/observeAmbient.ts` reconstruía el objetivo con `pause`/`resume` y **descartaba `reset`**, así que la corrección no llegaba a 4.7. Reenvía `reset` si existe (2 líneas, con prueba). Y se retiró la nota «Solape conocido» de 4.7.
- **Pruebas (RED visto primero):** `ambient.test.ts` (8 nuevas; 6 en rojo antes, las otras 2 son guardas), `useSofiController.test.tsx` (6 nuevas con los **tres controladores reales sobre un mismo anfitrión**; 3 en rojo quitando la línea del adaptador: `i-see-you` se queda en `watching`), `observeAmbient.test.ts` (2; 1 en rojo) y el `it.fails` de `GagsSpec.test.tsx` pasa a normal. Casos: `poking` con `i-see-you` mirando → `idle`; sigue pausado y se reanuda al volver `poking` al reposo; las causas no resetean; `are-u-still-here` entrando en somnolencia con `i-see-you` mirando → `idle`; un objetivo sin `reset` no falla; reentrada.
- **Sensibilidad** (5 mutaciones, todas detectadas; `cmp` tras restaurar): reset en cada causa (10 fallos), sin la guarda de entrada (1), reset también al activo (25), orden `pause` antes de `reset` (3) y reset antes de fijar `active` (16).
- **Comprobaciones:** `tsc -b`, `eslint .` y `prettier --check .` sin errores; `vitest run`: **120 archivos, 2 336 pruebas, todas en verde**; `playwright e2e/a11y.spec.ts e2e/motion --project=chromium`: 55 de 55.
- **Navegador (Chromium, controladores y CSS reales):** el toque humano de ~90 ms a 430 px da `curious/idle → skeptical/idle → stop/idle → offended/idle → hide/idle` (antes `/watching` en los cinco); con el ratón (mira y pincha) igual. Escondida ya no flotan los ojos (misma captura `t430-toque5`, regenerada). Una causa de pausa con `i-see-you` mirando **no** lo resetea (sigue `watching`); mirar + pinchar → `curious/idle`; a los 11 s `poking` vuelve a `idle` y `i-see-you` se reanuda y vuelve a mirar. 0 errores de consola.
- **Límites:** Firefox y WebKit no se han ejecutado para esta corrección (las pruebas de movimiento son inestables en esta máquina, §25.5.5; el cambio es de lógica pura sin CSS). El caso de `are-u-still-here` activándose con `i-see-you` mirando está probado con reloj simulado, no en navegador real. Con el `reset`, `i-see-you` no recentra su mirada (el controlador solo la recentra al reaccionar): no se ve, porque su capa solo se pinta en `watching` y en la reacción.

### 25.6 Límites

- Solo Chromium para lo visual y los toques. Firefox y WebKit, y la limpieza de gags en navegador, son de T073–T076; esto no los sustituye.
- Los toques son emulados (CDP), no un dispositivo real: sensación táctil, teclado virtual y Safari de iOS son de `015`.
- Los 150 s de partida solo se han comprobado con reloj simulado; en navegador, con 5 s.
- Con la ventana en 320 px la «pantalla» de 320 px se desplaza dentro de su contenedor; el resto de la sección y la página no desbordan.
- A 1× el navegador redondea el borde de 2,5 px a 2 px y queda 1 px entre el pie del sprite y el borde (a 3×, 0,3 px); es igual en producción.
- Sin `AV#`: ni A1, ni el desbordamiento, ni el escondite de `poking`, ni la propuesta reducida, ni la inactividad están aprobados.

## 26. B1 — Zona sensible de los gags: solo las partes visibles de Sofi (T066, prototipo parcial)

Fecha: 2026-11-09. Antes de empezar: `main` en `2a87b4d`; los cambios locales eran los de §25. Solo Design Lab: no se toca producción, ni parciales, ni controladores, ni tiras. Sin commit ni push.

### 26.1 Decisión

Aprobada por la autora el 2026-11-09 y registrada en `008-spec.md` §5 (con su criterio de aceptación), `008-plan.md` §6 y `008-tasks.md` T087: en la insignia móvil, los gags solo responden a toques sobre las partes visibles de Sofi, incluidas cabeza y manos cuando sobresalgan; las zonas transparentes no son interactivas.

### 26.2 Estudio

Los controladores escuchan en el propio anfitrión (`click`, `pointerenter`/`pointerleave`), así que la solución tenía que hacer que esos eventos solo lleguen desde lo visible, sin tocarlos.

| Alternativa | Resultado |
|---|---|
| `clip-path` sobre el anfitrión | **Descartada:** recorta también lo pintado, y los efectos (el «?», los Zzz, la alerta) deben sobresalir |
| Interceptar en captura (`stopPropagation`) con una prueba de alfa en JS | Posible y exacta por fotograma, pero exige componer en vivo todas las capas y transformaciones, y un `pointerenter` ya perdido no se recupera al entrar en lo visible. **No hecha** |
| Un elemento aparte que reenvíe eventos sintéticos | Descartada: eventos falsos hacia controladores que no se modifican |
| **Anfitrión sin respuesta propia y un `::after` suyo recortado con la silueta** | **Adoptada.** Un pseudoelemento no es un destino aparte: el toque llega al propio anfitrión, que es donde escuchan los controladores. Ningún parcial usa `::after` en el anfitrión |
| Cabeza y manos: `clip-path` sobre la capa | Descartada: no se recorta lo pintado. Se usa el `::after` de cada capa, que sigue sus animaciones |

Las siluetas salen de las **tiras reales**, sin modificarlas: máscara por bloques de 3 px de sprite (= 1 px de pantalla a 128), donde un bloque cuenta si algún píxel suyo tiene alfa ≥ 32 (≥ 1 en cabeza y manos). El alfa de las tiras es casi binario (≈ 99,5 % de los píxeles en 0 o ≥ 224).

### 26.3 Qué se entrega

- `scripts/gagHitShapes.ts` (puro: máscara por bloques, pegado con desplazamiento, rectángulos y trazado `path()`; qué recorte de qué tira por cada pose), `gagHitShapesFiles.ts` (lee con `sharp`, solo lee) y `generateGagHitShapes.ts` (CLI: `npm run assets:gag-hit`, solo a mano). Sin dependencias nuevas.
- `src/design-lab/sections/_gagHitShapes.scss`: **generado** (13 KB, diez formas). Seis de cuerpo (reposo, «¡quieto!» con la palma, ofendida, cabezada, dormida, susto y pillada) y cuatro de capa (cabeza y manos, escondida y asomada).
- `GagsSpec.module.scss`: `.host { pointer-events: none }`; `.host::after` con la silueta del estado; en `hide`, `peek` y `nope` el `::after` del cuerpo desaparece y responde el `::after` de cabeza y manos. Las capas dejan de ser sensibles con `!important`, porque el parcial de poking las hacía sensibles con su propio selector.
- 4.7: «Mostrar la zona sensible» (tiñe los `::after`, para revisarla) y una nota con lo que responde y lo que no.

### 26.4 Pruebas

| Qué | RED | GREEN |
|---|---|---|
| `scripts/gagHitShapes.test.ts` (máscara, pegado, rectángulos, trazado que reconstruye exactamente la máscara, posición de cada pose, formato del SCSS) | Visto fallar (módulo inexistente; después `buildHitShapes` inexistente) | 22 |
| `scripts/gagHitShapesFiles.test.ts` (con las tiras reales: el SCSS versionado está al día y ninguna forma queda vacía) | Sin RED (caracterización) | 2 |
| `gagHitArea.contract.test.ts` (CSS compilado con Sass y leído con PostCSS: el anfitrión no responde, `::after` activo y recortado, diez recortes, **ningún recorte fuera de un `::after`**, cuerpo apagado escondida, capas no sensibles, el tinte no toca la forma, el recuadro sigue sin recortar) | Sin RED; **5 mutaciones, todas detectadas** (anfitrión sensible, recorte sobre una capa, capas sensibles, cuerpo sensible escondida, recuadro recortando) | 8 |
| `GagsSpec.test.tsx` (interruptor del tinte solo en la insignia viva y sin cambiar el DOM; la nota) | Sin RED | +2 (21) |

`vitest run`: **123 archivos y 2 370 pruebas** (§25.7: 120 y 2 336), todas en verde; `tsc -b`, `eslint .` y `prettier --check .` sin errores; `playwright e2e/a11y.spec.ts e2e/motion --project=chromium`: **55 de 55**. Una ejecución parcial del Lab dio un tiempo agotado en `MotionSync` (6,3 s sobre 5 s), que sola tarda 1,9–2,3 s y que pasó en la repetición: es carga, como en §25.3.

### 26.5 Navegador real

Servidor de desarrollo propio (5188), controladores y CSS reales, toques con CDP de ~90 ms; guiones de usar y tirar, fuera del repositorio.

| Comprobación | Resultado |
|---|---|
| Barrido de los 128 × 128 px del anfitrión en reposo frente al alfa real de la tira | **Chromium, Firefox y WebKit idénticos:** 9 387 bloques visibles, 9 387 sensibles, **0 visibles sin respuesta y 0 sensibles sin nada visible en su bloque**. La zona sensible pasa del 100 % de la caja al 57,3 % |
| Pintado con y sin los pseudoelementos, por estado (animaciones anuladas en ambas capturas) | **0 píxeles distintos** en reposo, «¡quieto!», ofendida, escondida y asomada, en Chromium y Firefox; en WebKit, 0 en todos los estados medibles (la asomada pasó a su vuelta entre las dos capturas: es el método). Una primera medida dio ~25 000 píxeles distintos y era **ruido de fase de las animaciones infinitas** (la vena, la mirada) entre dos capturas; un control con una regla irrelevante y la comparación determinista lo mostraron |
| Toques en zonas transparentes (huecos a ambos lados y las dos esquinas del recuadro; 3 toques cada una) | `poking` sigue en `idle`; ningún punto es sensible |
| Secuencia completa de `poking` tocando **solo lo visible** (320 px) | `curious → skeptical → stop → offended → hide → peek → nope → idle`. Igual con clics en los tres motores |
| Escondida | Responde solo la franja baja (cabeza y manos: 3 990 px² frente a 9 574 en reposo); la mitad superior, nada. Tocar el vacío cada 0,5 s no retrasa la asomada (a los 2,0 s) |
| Poses de `are-u-still-here` | Cabezada, dormida y susto/pillada con su silueta (8 260, 7 988 y 9 190 px²); los Zzz no responden; el pelo que sobresale del recuadro sí |
| `i-see-you` con el dedo 1,7 s | «Pillada» **solo** con el dedo sobre Sofi; en el hueco o la esquina transparente, no (ver §26.6.1) |
| Desplazamiento | Arrastrar desde Sofi o desde una zona transparente desplaza la página 97 px; sin desbordamiento horizontal a 320 |
| Accesibilidad | axe: 0 violaciones en 1280 claro y oscuro, 390, 320 oscuro y texto al 200 % a 1280 y a 320; el anfitrión sigue sin foco ni teclado |
| Movimiento reducido | Sistema en reducir y «Reducido» del Lab: 0 capas, atributos y animaciones; «Completo» con el sistema reduciendo, gags vivos; el cambio en vivo los destruye y recrea |

Capturas locales de la sesión, en `shots\`: `h-1-idle`, `h-4-stop`, `h-5-offended`, `h-6-hide`, `h-7-peek`, `h-still-asleep`, `h-still-startled` (la zona sensible en azul sobre cada pose), `tint-idle` y `tint-peek` (el interruptor de 4.7).

### 26.6 Límites y decisiones abiertas

1. **La mirada de `i-see-you` sigue al toque y al puntero en toda la página.** Lo hace el controlador con oyentes en `document` (así «mira hacia donde se toca»): un toque en una zona transparente, o en cualquier parte de la pantalla, la hace mirar. La **reacción** («pillada») y los otros dos gags sí cumplen la decisión. Cumplirla también para la mirada exige impedir que el controlador vea los toques que no caen en Sofi, y eso rompería el seguimiento del puntero y que cualquier toque despierte a `are-u-still-here` (que es actividad real). Alternativas: **A)** aceptarlo (la mirada es seguimiento, no una respuesta al toque sobre Sofi); **B)** en táctil, filtrar en captura en `window` los toques fuera de la silueta solo para `i-see-you`: los oyentes comparten tipos de evento con los de `are-u-still-here`, así que no se pueden separar sin tocar los controladores; **C)** cambiar el controlador (no autorizado). Recomiendo A. **DECIDIDO el 2026-11-09: A**, registrado en `008-spec.md` §5. No hay nada que implementar: el controlador no se modifica.
2. **Precisión.** Un bloque de 1 px de pantalla: la zona sensible cubre siempre lo pintado y se pasa, como mucho, 1 px de borde. Es una silueta **fija por pose**: cuando el cuerpo se mueve dentro de su pose (la cabezada de 0,36 s, el respingo del susto de 0,5 s, la subida de la asomada de 1,45 s) la zona no lo acompaña y hay un desajuste transitorio de unos píxeles. Las sacudidas de `poking` sí la acompañan (mueven el anfitrión, y su `::after` va con él).
3. **Medidas en px.** Los trazados son para una insignia de 128 px; si cambia de tamaño hay que regenerarlos (o pasar a un `clip-path` en unidades relativas, con un SVG).
4. **Producción (T088), a decidir.** Habría que llevar el mismo mecanismo: el SCSS generado (13 KB sin comprimir) en el CSS de los gags, el `::after` del anfitrión, la regla `!important` de las capas (para vencer al parcial de poking) y la dependencia de que ningún parcial use `::after` en el anfitrión. Es un coste de carga para medir en EX4. Safari real y dispositivos son de `015`.
5. **Depende de los nombres de los parciales** (`data-poking`, `data-still-here`, `data-poking-layer`): si cambian, hay que repetir el contrato de §26.4 y el barrido de §26.5.
6. **Sin `AV#`.** La decisión de la zona sensible es de la autora; el resto de T066 (ubicación en el expediente y consulta ancha, reducida, inactividad) sigue sin aprobar.

## 27. B1 — Gags sobre el retrato grande de la consulta ancha y candidatas para el expediente (T066, prototipo parcial)

Fecha: 2026-11-09. Antes de empezar: `main` en `2a87b4d`; los cambios locales eran los de §25 y §26. Solo Design Lab: no se toca producción, ni parciales, ni controladores, ni tiras. Sin commit ni push. **No son aprobaciones**: las instrucciones de la autora para este prototipo (los tres gags sobre el retrato grande existente, sin otra Sofi) no aprueban ninguna ubicación; no se cierra T066 ni se aprueba AV4 o AV6.

### 27.1 Qué se entrega

- **Sección «4.8 · Gags en el retrato grande»** (`GagsWideSpec.tsx`, `GagPortrait.tsx`, `GagsWideSpec.module.scss`, `gagWide.ts`). La columna «Sofi escucha» de la consulta a dos columnas, con los componentes reales (`LiveIndicator`, `SofiPortrait`, `SofiDialog`, `Tag`, `TextLink`) y las medidas de `ConsultationScreen.module.scss` desde 1080 px copiadas (producción no las exporta). **No hay otra Sofi:** el anfitrión de los tres controladores es el elemento de `sofi-blink` que renderiza el propio `SofiPortrait` de 384 px, con sus mismas props (`expression="attentive"`, `outline`, `alt`). Como `SofiPortrait` no expone su elemento, se localiza desde un envoltorio sin caja (`display: contents`).
- **Anchura de la columna** (384, 460, 520 y 720 px): las medidas de la columna izquierda en la aplicación real a 1080, 1280, 1440 y 1920 px de ventana (383,7 · 459,7 · 520,5 · 720). El retrato no crece (384 px); solo lo hacen el diálogo y el aire.
- **Escondite de `poking`:** *(sustituido el 2026-11-11 por el borde del 100 %, sin solape: §29)* `--poking-edge: 75 %`, que es (384 − 96) / 384: el diálogo sube 96 px sobre el pie del retrato (`.listenDialog`, `margin-top: -96px`), así que su borde superior cae a 288 px, justo el mínimo que pide el parcial (≳ 75 %). Durante la broma el anfitrión sube por encima del diálogo (`--poking-z`): el cuerpo, recortado en el borde, no lo pisa, y las manos se agarran a su borde por delante. *Corregido en §29.1: solo se recortan la escondida y la asomada; en `curious`, `skeptical` y `stop` el cuerpo tapaba el texto.*
- **Zona sensible (decisión de §26) a escala ×3:** el mixin compartido `_gagHit.scss` (que 4.7 también usa, con escala 1) emite el mismo `::after` recortado con las mismas siluetas, sin regenerarlas: el `::after` mide un tercio del anfitrión y se amplía ×3 desde la esquina. Con el diálogo superpuesto, la caja del cuerpo no baja del borde de `poking`: lo que queda por debajo está tapado por el diálogo y el toque es suyo.
- **Casilla «Etiqueta «Sofi» por encima de Sofi (alternativa)»:** solo para ver el hallazgo 27.4.1. **Retirada el mismo 2026-11-09**, al aprobarse la alternativa (§28.1): 4.8 lleva la etiqueta por encima.
- **Refactor sin cambios de comportamiento:** el panel de controles y el estado de la escena salen de `GagsSpec` a `GagPanel.tsx` y `useGagScene.ts`, y los usan 4.7 y 4.8 (cada uno con su estado). 4.7 conserva sus 21 pruebas.

### 27.2 Pruebas

| Qué | Resultado |
|---|---|
| `gagWide.contract.test.tsx` (CSS compilado de producción desde 1080 px frente al del Lab: `.listen`, `.listenDots`, `.listenTag`, `.listenDialog` y el margen del retrato; el solape de 96 px; el borde del 75 %; el `SofiPortrait` de producción de 384 px) | 8 (9 en §28.3, con la etiqueta por encima) |
| `gagHitArea.contract.test.ts` (ahora sobre los dos módulos, y la escala 3: el `::after` es un tercio ampliado ×3, no baja del borde de `poking`, las capas de cabeza y manos se amplían igual, y las siluetas son las mismas que en 4.7) | 20 (eran 8) |
| `GagsWideSpec.test.tsx` (un anfitrión con los tres controladores y sus capas; una sola Sofi, la del `SofiPortrait`; sin foco ni teclado; toque; reducido; anchura; tinte; casilla; inactividad; causas; desmontaje con y sin StrictMode) | 17 (15 en §28.3, sin la casilla retirada) |
| Sensibilidad (5 mutaciones, todas detectadas; archivos restaurados): borde 75 → 100 %, sin límite en el borde, escala 3 → 1, solape −96 → −80 px, una segunda Sofi | 5 de 5 |

Sin RED previo: se escribieron después del prototipo, y la sensibilidad se comprobó con las mutaciones.

`vitest run`: **125 archivos y 2 407 pruebas** (§26.4: 123 y 2 370), todas en verde; `tsc -b`, `eslint .` y `prettier --check .` sin errores. `src/styles/units.test.ts` pedía una excepción por los px de `GagsWideSpec.module.scss` (los mismos solapes que ya admite `ConsultationScreen`) y se añadió con su motivo. `playwright e2e/a11y.spec.ts e2e/motion --project=chromium`: **55 de 55**, pero no a la primera: con los 4 trabajadores por defecto salió un fallo distinto en cada una de tres ejecuciones (`Experience Preview · portada · 390 px`, `Design Lab · profile` por 30 s y `Experience Preview · consulta · 390 px` por 5 s de `toBeVisible`), cada uno de ellos pasa repetido solo, y la máquina tenía **0,8 GB libres de 8** (el Firefox del usuario abierto, el servidor de desarrollo y los navegadores de Playwright). Con `--workers=2`, `a11y.spec.ts` dio 42 de 42; el movimiento (13) pasó en la primera tanda. No se ha cambiado ningún tiempo de espera ni se ha probado que HEAD limpio se comporte igual: la causa que sostiene la medida es la memoria libre.

### 27.3 Navegador real

Servidor de desarrollo propio (5188), controladores y CSS reales, toques con CDP de ~90 ms; guiones de usar y tirar, fuera del repositorio.

| Comprobación | Resultado |
|---|---|
| Fidelidad con producción (1280 px, animaciones anuladas) | La franja del retrato y la etiqueta «Sofi está escuchando»: **0 píxeles distintos**. El diálogo mide lo mismo (201 px de alto, mismos hijos) pero su texto se rasteriza con diferencias menores (5 421 píxeles de 87 000 en la franja del diálogo): no se ha investigado |
| Barrido de los 384 × 384 px del anfitrión frente al alfa real, en Chromium, Firefox y WebKit (columnas de 384, 460 y 720) | **0 píxeles visibles sin respuesta** salvo los que tapa el propio diálogo, **0 sensibles sin nada visible en su bloque**, 0 sensibles bajo el borde del 75 %. La zona sensible es el 41,4 % de la caja. Lo que tapa el diálogo: 213 px en Chromium y WebKit (la fila inmediatamente sobre el borde, donde gana el diálogo por el redondeo de medio píxel de una posición fraccionaria) y, con la columna de 384 px, 105 más (la etiqueta «Sofi», 27.4.1) |
| Pintado con y sin los pseudoelementos (reposo, «¡quieto!», ofendida y escondida) | **0 valores de píxel distintos** en Chromium, Firefox y WebKit |
| Toques en zonas transparentes de la caja (esquinas y junto a los hombros, 3 toques cada una) | `poking` sigue en `idle`; ningún punto es sensible |
| Secuencia completa de `poking`, con toques reales (Chromium) tocando solo lo visible | `curious → skeptical → stop → offended → hide → peek → nope → return → idle`. Con clics, igual en Chromium, Firefox y WebKit (columna de 384) |
| Toque sobre lo que queda bajo el borde con `stop` y `offended` (el anfitrión sobre el diálogo) | 0 puntos del anfitrión bajo el borde; el enlace «Abrir expediente» sigue siendo lo que recibe el toque |
| Escondida: zona sensible | Solo cabeza y manos; las manos agarradas al borde del diálogo responden 8 px por debajo de él. Clics en el vacío cada 0,5 s no retrasan la asomada (1,6 s en Chromium, 1,7 en Firefox, 1,8 en WebKit) |
| Desplazamiento (arrastrar desde Sofi y desde una zona transparente) | La página se desplaza 97 px en los dos casos |
| Desbordamiento de los efectos (caja de cada capa visible durante `poking`, `are-u-still-here` hasta `startled` y `guilty`, e `i-see-you`) | Lo que sobresale de la caja de 384 px: **como mucho 11 px por arriba** (la alerta de `i-see-you` y el estallido del susto) **y 1 px por la derecha**. Queda dentro de la columna (≥ 28 px de aire por encima, con 460 px de columna) y no toca la etiqueta «Sofi está escuchando». Los Zzz, el «?» y la vena quedan dentro del anfitrión |
| Accesibilidad (axe, WCAG 2.2 AA) | 0 violaciones en 1280 claro y oscuro, 1920 (columna de 720), 1080 (384), 390, 320 oscuro y texto al 200 % a 1280 y a 320; sin desbordamiento horizontal de la página. A 390 y 320 la columna (460 px) se desplaza dentro de una región con foco (como en 4.7) |
| Movimiento reducido | Sistema reducido y «Reducido» del Lab: 0 capas, atributos y animaciones; tocar no hace nada. «Completo» con el sistema reduciendo: gags vivos (12 capas) |

Capturas locales de la sesión, en `shots\` del directorio temporal de la sesión: `c460\w-1-idle`, `c460\w-4-stop`, `c460\w-5-offended`, `c460\w-6-hide`, `c460\w-7-peek` (la zona sensible en azul; columna de 460), `w-384-hide-actual` y `w-384-hide-nametop` (el hallazgo 27.4.1, sin y con la alternativa) y `cand-A` y `cand-B` (27.5).

### 27.4 Hallazgos y decisiones abiertas

Numeradas para aprobarlas por número.

1. **Con la columna estrecha, el pelo de Sofi escondida o asomada cubre la etiqueta «Sofi» del diálogo.** Se da con ventanas de 1080 a unos 1245 px (columna < ≈ 447 px): el pelo empieza a 58 px del lado izquierdo del retrato y la etiqueta termina a 89 px del lado del diálogo, y durante la broma el anfitrión (`z-index: 1`) queda por encima. Es pasajero (escondida y asomada duran unos 8 s), no tapa texto del diálogo y no afecta a la zona sensible de los controles, pero la etiqueta queda a medio cubrir (captura `w-384-hide-actual`). Alternativas: **A)** aceptarlo; **B)** subir la etiqueta por encima de Sofi (`z-index: 2`; en el Lab, la casilla; en producción sería un cambio de `SofiDialog` o de `ConsultationScreen`, que no estoy autorizado a hacer y que decide T088); **C)** subir el borde del escondite por encima de la etiqueta, que ya no sería el borde del diálogo. Recomiendo B. **DECIDIDO el 2026-11-09: la etiqueta queda por encima del retrato**, registrado en `art-direction/README.md` (decisión 11). El Lab 4.8 ya la lleva así y la casilla de la alternativa se retiró.
2. **Precisión de la zona sensible a ×3.** Con las siluetas de 128 px ampliadas, un bloque es de 3 px de pantalla: cubre siempre lo pintado y se pasa, como mucho, 3 px de borde (en la insignia, 1 px). Alternativa: generar un juego de siluetas de 1 px para el retrato (más pesado, unas nueve veces más rectángulos). Recomiendo aceptarlo.
3. **`SofiPortrait` no expone su elemento.** Para llevar esto a producción, el retrato grande de `ConsultationScreen` necesita dar su anfitrión a los controladores (una prop o una referencia en `SofiPortrait`). Es un cambio de un componente de producción: lo decide T088, no lo he hecho.
4. **Reducido.** Sin propuesta aparte: con movimiento reducido el retrato grande es el que ya hay, sin controladores (D-1). Lo apruebe o no la autora, es AV4.
5. **La columna es una copia.** Si cambian las medidas de `.listen`, `.listenDots`, `.listenTag` o `.listenDialog` en `ConsultationScreen`, salta `gagWide.contract.test.tsx`.
6. **Sin `AV#`.** Ni la ubicación en la consulta ancha ni en el expediente están aprobadas, ni la versión reducida.

### 27.5 Candidatas de ubicación para el expediente (no implementadas)

Hechos medidos en la aplicación real (320, 390, 1080, 1280 y 1920 px de ventana), sin tocar nada:

- El expediente ya tiene **una sola Sofi**, el retrato del cuestionario (192 px en una columna, 384 desde 1080 px; decisión 7 del README de dirección artística) justo encima del bocadillo de la pregunta, **sin solape: el pie del retrato es el borde superior del bocadillo** (hueco 0 en todos los anchos). Es el escondite natural (`--poking-edge: 100 %`, el valor por defecto) y no hace falta tocar el diálogo.
- Ese retrato solo es el elemento de `sofi-blink` (el anfitrión) cuando Sofi está en `asking` o `waiting` (`sofiVisuals.ts`); en las reacciones (`acknowledging`, `uncertain`, `saved`, `validationError`, `deleting`, `deleted`) se ve una imagen estática. Los gags solo pueden vivir en esos dos estados, y la spec (§5) los excluye mientras se escribe, se interactúa con controles o Sofi habla: en la práctica, `waiting` sin foco en las respuestas ni en las notas, que es justo el momento en que `are-u-still-here` tiene sentido.
- Los efectos (≤ 11 px por arriba a 384, ≈ 5,5 px a 192) caben en el hueco sobre el retrato: 8 px bajo el botón «Volver a la consulta» en una columna y 28 px a dos.
- El pelo cubre la etiqueta «Sofi» del bocadillo como en 27.4.1, y además en una columna: a 320 px, 2 px; a 1080 px, 43 px; a 1280 px, 5 px; desde 1920, nada.
- Zona sensible: a 384 px, la ampliación ×3 de 4.8; a 192 px, ×1,5 (bloques de 1,5 px).

| | Candidata A · el retrato del cuestionario, en las dos anchuras | Candidata B · el retrato del cuestionario, solo desde 1080 px |
|---|---|---|
| Dónde | Sobre el retrato existente (192 y 384 px), con el borde superior del bocadillo como escondite | Igual, pero solo a dos columnas (384 px); en una columna el retrato queda como hoy |
| Cuándo | `waiting`, escena tranquila (spec §5) | Igual, solo a dos columnas |
| A favor | Una sola Sofi (decisión 7); mismo mecanismo en consulta y expediente en ambos anchos; en móvil, la zona sensible y los efectos van ya probados a ×1,5 con el mismo método | Menos superficie táctil junto a los controles en el móvil (el retrato queda por encima de las respuestas); menos código y carga en una columna |
| En contra | En una columna el retrato mide 192 px y está pegado a las respuestas: un toque a Sofi y uno a una opción están cerca; ×1,5 es una escala no entera | La experiencia difiere entre anchos y la consulta sí los lleva en una columna (insignia, 4.7); deja sin cubrir el móvil, donde la inactividad es más probable |
| Mockup | `cand-A` | `cand-B` |

Recomiendo la A; B si se prefiere no tener gags junto a los controles en el móvil. Descartada una tercera (una insignia aparte en el expediente) porque añade una segunda Sofi, contra la decisión 7 del README; si la autora la quiere, se estudia. **Ninguna se implementa antes de que elija**, y elegir es parte de AV6.

### 27.6 Límites

- Los toques reales (CDP) son de Chromium; Firefox y WebKit se han probado con clics. Safari real, VoiceOver y TalkBack y los dispositivos son de `015`.
- La zona sensible a ×3 se ha barrido en los tres motores con la columna de 384 y 460 px (Chromium también con 720); el barrido con toques y la secuencia con clics, con la columna de 384.
- No se ha medido el coste de carga de llevar esto a producción (EX4).
- La comparación píxel a píxel con producción excluye la rasterización del texto del diálogo (27.3).

## 28. B1 — Candidata A del expediente: los tres gags sobre el retrato del cuestionario (T066, prototipo parcial)

Fecha: 2026-11-09. Antes de empezar: `main` en `2a87b4d`; los cambios locales eran los de §25–§27. Solo Design Lab: no se toca producción (`ProfileSheet`, `SofiPortrait`, `ConsultationScreen` y demás), ni parciales, ni controladores, ni tiras. Sin commit ni push. **No son aprobaciones:** el prototipo es para decidir la ubicación definitiva; no se cierra T066 ni se aprueba AV4 o AV6.

### 28.1 Decisión registrada

**Etiqueta «Sofi» por encima del retrato cuando se solapen** (consulta ancha), aprobada el 2026-11-09 y registrada en `art-direction/README.md` (decisión 11), con un puntero en T087. El Lab 4.8 ya la lleva así y se retiró su casilla de alternativa. El mismo solape se da en el expediente (28.4.4): el prototipo 4.9 la aplica también, pendiente de que la autora lo confirme. **Confirmado el 2026-11-10** (decisión 11; 28.11.5).

### 28.2 Qué se entrega

- **Sección «4.9 · Gags en el expediente»** (`GagsProfileSpec.tsx`). Dos marcos de iframe, móvil (320 o 390 px) y escritorio (1280 px), como los de 6.3: la pantalla de verdad, con sus media queries. La composición es **el `ProfilePrototype` del Lab, que monta el `ProfileSheet` real** (formulario, índice, notas, guardado), sin modificar. Las composiciones de partida: «Sofi espera la respuesta» (nueva, `waiting`), «Sin completar», «Respuesta y reacción» y «Guardado y editable». Controles: qué gags, zona sensible e inactividad, enviados a los marcos por un `BroadcastChannel` sin recargarlos (el selector de «qué es interactuar con los controles» que tuvo esta sección se retiró al decidirse: 28.8). La sección muestra qué dice cada marco de su escena (estado de Sofi, si los gags viven y por qué).
- **`SheetGags`** (`design-lab/profile/`): el Lab encuentra el retrato en el DOM (`section[aria-label="La pregunta de Sofi"] [role="img"]`, si es el elemento de `sofi-blink`) y le añade las clases de los gags, las de la zona sensible y las del escenario. Es una técnica de prototipo: `ProfileSheet` y `SofiPortrait` no exponen su elemento (28.4.5). Se vuelve a buscar con cada cambio del escenario, porque el retrato cambia de elemento al pasar a la imagen de una reacción.
- **Estados permitidos (spec §5):** los gags solo viven con Sofi **esperando** la respuesta (`waiting`) y el retrato siendo el sprite. Preguntando (habla), con una reacción (imagen estática), borrando o con movimiento reducido se desmontan del todo: ni controladores, ni capas, ni tiras, ni escuchas. Causas de pausa: el foco en un control de la ficha (28.8) y la página oculta.
- **Zona sensible (§26) a ×1,5 y ×3:** el mismo mixin `_gagHit.scss` con la escala en una variable (`--hit-scale`: 1,5 con el retrato de 192 px, 3 desde 1080 px con el de 384), las mismas siluetas.
- **Escondite:** `--poking-edge: 100 %`, el valor por defecto del parcial: el pie del retrato es el borde superior del bocadillo (hueco 0 en todos los anchos), sin solape. Las manos se agarran al borde por delante y pisan 8 px del bocadillo.

### 28.3 Pruebas

| Qué | Resultado |
|---|---|
| `gagProfile.test.ts` (qué estados permiten gags, la configuración por la URL, el foco en un control y su vigilante; las lecturas de interacción de esta primera entrega se retiraron en 28.8) | 12 (hoy 18: 28.8) |
| `SheetGags.test.tsx` con el `ProfilePrototype` real y los tres controladores del ZIP (retrato existente con los tres y sus capas; una sola Sofi; clases del Lab; preguntando sin gags y esperando con ellos; reacción sin anfitrión y vuelta; reducido; cada gag solo si está marcado; toque; foco; página oculta; el estado que cuenta el marco; desmontaje con y sin StrictMode) | 18 (hoy 21: 28.8) |
| `gagHitArea.contract.test.ts` (ahora sobre tres módulos: ×1, ×3 y la escala variable del expediente; el borde del 100 %; la etiqueta por encima) | 32 (eran 20) |
| `gagWide.contract.test.tsx` (+ la etiqueta por encima del retrato) y `GagsWideSpec.test.tsx` (sin la casilla retirada) | 9 y 15 |
| Sensibilidad (5 mutaciones, todas detectadas; archivos restaurados): gags también preguntando, escala ×1,5 → ×2, borde 100 → 90 %, etiqueta sin `z-index`, la interacción no pausa | 5 de 5 |

Sin RED previo: se escribieron después del prototipo, y la sensibilidad se comprobó con las mutaciones.

`vitest run`: **127 archivos y 2 448 pruebas** (§27: 125 y 2 407), todas en verde; en la primera ejecución completa fallaron por tiempo (6,2 s y 5,4 s sobre 5 s) dos pruebas de `MotionSync.test.tsx`, que sola da 13 de 13 y que ya flaqueó bajo carga en §25.3: no se ha cambiado ningún tiempo de espera. `tsc -b`, `eslint .` y `prettier --check .` sin errores. `playwright e2e/a11y.spec.ts e2e/motion --project=chromium --workers=2`: **55 de 55**.

### 28.4 Navegador real

Servidor de desarrollo propio (5188), controladores y CSS reales, en el marco `?frame=gags-profile` abierto a la anchura real (Chromium; Firefox y WebKit donde se indica); toques con CDP de ~90 ms; guiones de usar y tirar, fuera del repositorio.

| Comprobación | Resultado |
|---|---|
| **La composición no cambia con los gags** (reposo, animaciones anuladas, página entera) a 320, 390, 844 × 390, 1280 y 1920 | **0 píxeles distintos** y las mismas medidas con y sin ellos. Retrato de 192 px (escala 1,5) o 384 px (escala 3); hueco retrato-bocadillo 0; hueco «Volver a la consulta» → retrato, 8 px (una columna) o 28 px (dos); sin desplazamiento horizontal |
| Barrido de la zona sensible frente al alfa real (192 y 384 px) | **Firefox y WebKit: 0 píxeles visibles sin respuesta y 0 sensibles sin nada visible**; Chromium a 384: 0; Chromium a 192 (×1,5): 17–18 píxeles de 20 977 (0,08 %) en el borde de la silueta, donde a medio píxel solo queda un píxel de sprite opaco. **Corregido en 28.11.4:** medido sobre lo que se pinta y en más anchuras, hay hasta 54 en Chromium y 41 en WebKit. La zona sensible es el 57 % de la caja. Los píxeles que tapa el diálogo son los del último píxel de fila (redondeo) y, a 384 px, los de su etiqueta «Sofi» |
| Toques en transparente (esquinas y junto a los hombros) | `poking` sigue en `idle` a 390 (CDP) y a 1280 |
| Secuencia completa tocando solo lo visible | `curious → skeptical → stop → offended → hide → peek → nope → return → idle`, a 390 con toques reales (CDP) y a 1280 y 1080 con clics; con clics también en Firefox y WebKit a 390 y a 1280. Clics en el vacío con Sofi escondida no retrasan la asomada (1,5–1,6 s) |
| **Controles del formulario** en cada pose (`curious`, `skeptical`, `stop`, `offended`, `hide`, `peek`) | Las cuatro opciones, «Siguiente pregunta» y la nota reciben el toque (5 de 5 a 390 y a 1280): el anfitrión, elevado sobre el bocadillo durante la broma, no tapa nada. Con la zona sensible limitada a lo que se ve, solo las manos (8 px) pisan el borde del bocadillo |
| **Responder en mitad del escondite** | La respuesta queda marcada; Sofi pasa a la imagen de la reacción (sin anfitrión, sin atributos ni capas del gag) y 2,3 s después vuelve a esperar y los gags se montan de nuevo |
| **Estados** (composiciones del Lab) | Preguntando: sprite sin gags (a los ~2 s, esperando, con los tres). `answered`, `uncertain`, `completed`, `saved`, `empty-save`, `memory` y `deleting`: imagen estática, 0 de 3 gags. `waiting`: 3 de 3 |
| **Interactuar con los controles** | Esta primera entrega comparó dos lecturas (con foco / solo escribiendo o pulsando). La autora eligió el foco el 2026-11-09 y las medidas vigentes son las de 28.8. Un hecho de entonces se mantiene: un clic en Sofi **quita el foco** del control y cuenta como pinchazo, así que la suspensión solo afecta a los gags pasivos (`are-u-still-here`, `i-see-you`) |
| `i-see-you` con el puntero | Sin foco: `watching → caught → smirk`. Con foco en un control: no reacciona (28.8) |
| Desplazamiento a 390 | Arrastrar desde Sofi o desde una zona transparente desplaza la página 97 px |
| Desbordamiento de los efectos (caja de cada capa visible, los tres gags) | A 384 px: como mucho **11 px por arriba** (alerta de `i-see-you`), 7 por la derecha (el «?») y 5 (estallido del susto). A 192 px: como mucho 6 por arriba y 5 por la derecha. Dentro de la ventana; sin desbordamiento horizontal. En una columna la alerta de `i-see-you` (y su caja, 3 px) llega a la altura del botón «Volver a la consulta» (8 px más arriba) pero su dibujo no lo pisa (a 390 y a 320: capturas) |
| Accesibilidad (axe, WCAG 2.2 AA) | **0 violaciones** en el marco a 320 oscuro, 390, 844 × 390, 1080, 1280 oscuro, y con el texto al 200 % a 1280 y a 320; con Sofi **escondida y asomada** a 390 oscuro y a 1280. En la sección 4.9 del Lab: 0 en 1280 claro y oscuro, 390, 320 oscuro y texto al 200 %. El retrato no tiene foco ni `tabindex` y el orden de tabulación (19 elementos) es idéntico con y sin gags |
| Movimiento reducido | Sistema reducido y «Reducido» del Lab: 0 capas, atributos, clases de gag y animaciones; tocar no hace nada. **Corregido en 28.10.3:** quedaba la clase de la zona sensible del Lab, que tapaba parte de «Volver a la consulta». «Completo» con el sistema reduciendo: gags vivos (12 capas) |
| Controles de la sección 4.9 | Quitar un gag o mostrar la zona sensible llega a los dos marcos sin recargarlos |

Capturas locales de la sesión, en `shots\` del directorio temporal de la sesión: `p-mobile-idle` y `p-desktop-idle` (con la zona sensible en azul), `p-mob-hide`, `p-mob-peek`, `p-mob-stop`, `p-mob-offended`, `p-wide-hide`, `p-wide-peek`, `p-wide-stop`, `p-wide-offended`, `p-1080-hide-crop` (la etiqueta por encima del pelo), `p-alert-390` y `p-alert-320` (la alerta junto al botón «Volver»), `p-lab-desktop`, `p-lab-mobile` y `p-lab-desktop-2` (la sección 4.9).

### 28.5 Hallazgos y decisiones abiertas

Numeradas para aprobarlas por número.

1. ~~Qué es «interactuar con los controles».~~ **Resuelta el 2026-11-09 por la autora: el foco** (spec §5, «Foco en los controles del expediente»). Medidas y hallazgos nuevos en 28.8; las decisiones que quedan de ahí son 7 a 10.
2. ~~Zona sensible a ×1,5.~~ **Resuelta el 2026-11-10 por la autora con un criterio geométrico** (spec §5, «Precisión de la zona sensible»; 28.12). Incumplimientos del prototipo en 28.12.4. Lo que se planteaba: **detenida el 2026-11-10** (28.11.4). La autora aprobó tolerar 17 píxeles aislados en el contorno, siempre que no afecte perceptiblemente a la interacción ni cree zonas táctiles transparentes. Medido sobre lo que se pinta:
   - Chromium: hasta 54 píxeles en anchuras habituales (375, 393, 412 y 430 px). WebKit: hasta 41. Firefox: 0.
   - No están aislados: forman franjas de 1 px de ancho y hasta 20 de alto.
   - Todos están a 1 px como mucho de la zona sensible. La zona sensible sin nada pintado no pasa de 2 px de la silueta.

   Opciones:

   - **A)** Registrar la tolerancia con lo medido: el contorno puede no responder solo a 1 px como mucho de la zona sensible, y la zona sensible sin nada pintado solo a 2 px como mucho de la silueta.
   - **B)** Ajustar el Lab con siluetas propias para el retrato de 192 px (bloques de 1 px de pantalla), más pesadas, y volver a medir. Ensanchar la zona 1 px dejaría 0 píxeles sin respuesta, pero ampliaría el borde transparente.
   - **C)** Dejarlo para T088.

   Recomiendo A: una franja de 1 px no se nota al tocar. Lo que se planteaba: cubre lo pintado salvo 17 píxeles de 20 977 en Chromium; con ×3 no hay ninguno.
3. ~~La decisión 11 también vale para el expediente.~~ **Resuelta el 2026-11-10 por la autora: sí** (README, decisión 11; 28.11.5). Lo que se planteaba: Con la columna estrecha el pelo cubre la etiqueta «Sofi» del bocadillo igual que en la consulta ancha, y además en una columna (2 px a 320 px; 43 px a 1080 px; 5 px a 1280 px). 4.9 la lleva por encima; hay que confirmar que la decisión se extiende.
4. **Producción (T088).** Para llevar esto a producción, `ProfileSheet` (o `SofiPortrait`) tendría que dar su anfitrión a los controladores y saber que Sofi espera; la causa `interaction` debería salir de los manejadores del propio formulario (`onFocus`/`onBlur` de la ficha, con la misma regla de adónde va el foco que `watchControlFocus`, 28.8) y no de escuchas en `document`, como en el prototipo. Es un cambio de componentes de producción: lo decide T088, no lo he hecho.
5. **Reducido.** Sin propuesta aparte: el retrato es el que ya hay, sin controladores (D-1). La aprobación es de AV4.
6. **Sin `AV#`.** La ubicación en el expediente quedó aprobada el 2026-11-10 (A, spec §5), y también la inactividad (plan §6). AV6 sigue sin marcar porque incluye la ubicación en la consulta en reposo, que no está aprobada. Lo que se planteaba: la ubicación en el expediente no está aprobada (la regla del foco sí consta en la spec, pero no es un `AV#`).
7. ~~Gag congelado en su pose con el foco.~~ **Resuelta el 2026-11-10 por la autora: al entrar el foco se cancela y Sofi vuelve al reposo** (spec §5; 28.9). Lo que se medía antes: **un gag en marcha cuando llega el foco queda congelado en su pose** mientras dure el foco, y al perderlo continúa donde estaba (28.8.3). Ejemplo: Sofi «escondida» (`hide`) se queda escondida mientras la persona contesta con el teclado. Aceptarlo, o que al empezar el foco los gags vuelvan al reposo (`reset()`): eso es un cambio de `ambient.ts` (la regla vigente es que las causas de la escena no hacen `reset()`) y de T088.
8. ~~Mirada pendiente al reanudar.~~ **Resuelta con la 7** (28.9): ya no aparece. Lo que se medía antes: Si el puntero se mueve unos 90 ms antes de que llegue el foco, `i-see-you` conserva congelada su mirada pendiente y la muestra (`watching`, hasta 2,5 s) al reanudar, aunque el puntero ya no se mueva (28.8.3). No llega a `caught`. Mismo origen que el 7: el controlador congela sus temporizadores al pausar, no los borra. Aceptarlo o resolverlo junto con el 7.
9. ~~El foco depende del navegador.~~ **Resuelta el 2026-11-10 por la autora: foco nativo, también en WebKit, sin forzarlo; las acciones del formulario prevalecen** (spec §5; 28.10). Lo que se planteaba: En Chromium y Firefox, clic o toque en una opción le da el foco; en WebKit (el motor de Safari) no: tras responder con el ratón o el dedo no hay foco en la opción y los gags no se suspenden. Con el teclado sí, en los tres. La regla es de foco, así que se cumple en todos; lo que cambia es cuándo hay foco (28.8.4). Confirmar que es lo que se quiere.
10. ~~Qué es «control del formulario».~~ **Resuelta el 2026-11-10 por la autora: todos los controles del expediente, no los de la cabecera general** (spec §5; 28.10). Lo que se planteaba: El prototipo cuenta cualquier control de la ficha: opciones, notas, «Siguiente pregunta», el índice de áreas, «Volver a la consulta» y «Guardar expediente». No cuentan los de la cabecera de la página (tema, sonido, portada), que no son del expediente. Confirmar la lectura o acotarla (por ejemplo, solo opciones y notas).

### 28.6 Para decidir la ubicación definitiva

La candidata A funciona en las dos anchuras sin cambiar la composición (0 px de diferencia), sin tapar controles en ninguna pose y con el escondite natural en el borde del bocadillo. Lo que cambia entre **A (dos anchuras)** y **B (solo desde 1080 px)** es solo si en una columna, con el retrato de 192 px pegado a las respuestas, hay gags. La evidencia de 28.4 no muestra un problema a 192 px (controles alcanzables, sin solape, zona sensible al 57 %, axe a cero); la decisión es de producto. Recomiendo A. **Decidido el 2026-11-10: A** (spec §5).

### 28.7 Límites

- Toques reales (CDP) solo en Chromium; Firefox y WebKit, con clics. Safari real, lectores de pantalla y dispositivos son de `015`.
- La zona sensible a ×1,5 y ×3 se barrió en los tres motores; los efectos y los estados se midieron en Chromium.
- El marco usa el audio simulado del Lab: no se ha probado con voz real.
- No se ha medido el coste de carga de llevar esto a producción (EX4).
- Las comprobaciones del retrato de 4.9 se hicieron con el marco abierto directamente a cada anchura (el iframe de la sección lo escala para que quepa): lo que se ve en la sección es la misma pantalla reducida.

### 28.8 Foco en los controles del expediente (decisión aprobada el 2026-11-09)

Fecha: 2026-11-09. Solo Design Lab y la spec; sin tocar producción ni los controladores del ZIP, sin commit ni push, sin `AV#`.

**28.8.1 Decisión y dónde consta.** Los gags del expediente permanecen suspendidos mientras cualquier control del formulario tenga el foco. Su única fuente normativa es `008-spec.md` §5 («Foco en los controles del expediente»); aquí no se repite. La spec no fijaba qué ocurre con un gag en marcha o con lo pendiente al reanudar (28.5, puntos 7 y 8); se decidió el 2026-11-10 (28.9). T088 sigue decidiendo el mecanismo de producción.

**28.8.2 Qué cambia en el prototipo.**

- Se retira de 4.9 el selector «Interactuar con los controles es…», la lectura «solo escribiendo o pulsando» y el parámetro `interaction` de la URL del marco (con `isTextEntry`, `pressed` y las escuchas de puntero y tecla): ya no hay dos lecturas, solo el foco.
- `watchControlFocus` (`gagProfile.ts`) sustituye a las escuchas de `SheetGags`: avisa solo al cambiar el estado. Al ganar el foco lee el elemento activo; al perderlo mira adónde va (`relatedTarget`) y, si no va a ningún sitio, el elemento activo, con una lectura de confirmación en la tarea siguiente. Motivo: con Tab o las flechas de un grupo de opciones, el navegador reparte `focusout` y `focusin` con un punto de control de microtareas en medio, en el que el foco está en el documento; leerlo ahí reanudaría los gags un instante entre dos controles. Si la ventana pierde el foco, el control sigue siendo el elemento activo y los gags siguen suspendidos.
- La sección 4.9 dice qué marco está suspendido («suspendidos: un control del formulario tiene el foco») y lo explica en una nota.

**28.8.3 Pruebas.**

| Qué | Resultado |
|---|---|
| `gagProfile.test.ts` (+ el foco en un control y `watchControlFocus`: avisa al ganar sin esperar y al perder sin esperar; de un control a otro, ni en el hueco entre los dos eventos; ventana que pierde el foco; darse de baja) | 18 |
| `SheetGags.test.tsx` (foco en una opción, las notas o un botón suspende; Tab entre controles; un toque a Sofi con foco no activa `poking`; al perder el foco nada reaparece) | 21 |
| Sensibilidad (6 mutaciones, todas detectadas; archivos restaurados): el foco no pausa; el foco nunca cuenta; la pérdida se lee sin `relatedTarget`; la baja no cancela la lectura pendiente; una ventana sin foco reanuda; (en el navegador) lo mismo sin `relatedTarget` | 6 de 6 |
| `vitest run` completo | **127 archivos y 2 457 pruebas**, en verde |
| `tsc -b`, `eslint`, `prettier --check .` | sin errores |
| `playwright e2e/a11y.spec.ts e2e/motion --project=chromium --workers=2` | **55 de 55** |

**28.8.4 Navegador real.** Servidor de desarrollo propio, controladores y CSS reales, el marco `?frame=gags-profile` abierto a la anchura real; guiones de usar y tirar, fuera del repositorio.

| Comprobación | Resultado |
|---|---|
| **Teclado**: cada parada del tabulador (26) frente al estado que cuenta el marco | Chromium y WebKit: 15 paradas en la ficha; Firefox: 21. **0 desajustes** entre «control de la ficha con foco» y «suspendidos». Entre dos controles de la ficha, **ninguna reanudación**. En Chromium y WebKit la secuencia `T F T F T F` es salir de la ficha por la cabecera (tema, sonido, portada, 5 controles) y volver a entrar, no un hueco. Con la versión mutada (sin `relatedTarget`), 28 reanudaciones entre controles: la comprobación detecta el fallo |
| **Foco** y `are-u-still-here` (5 s) | Sin foco: `drowsy` a los 3 s del montaje y `nodding` después. Con foco en un control: **`idle` durante 12 s**. Al perder el foco la cuenta empieza de cero: `drowsy` a los 5,0 s |
| **Foco** y `i-see-you` | Con foco, mover el puntero por Sofi no cambia nada (`idle`). Ya reanudado, el puntero la hace mirar y la pilla (`watching → caught → smirk`). Sin ningún evento de puntero tras soltar el foco, no hay reacción (control sin mover el puntero, y con el puntero movido durante el foco y aparcado) |
| **Perder el foco** y `poking` | Un clic (pulsar y soltar sin demora, o con 90 ms) o un toque sobre Sofi con el foco en un control **quita el foco y activa `curious`**: en Chromium, Firefox y WebKit, y con toque a 390. La pérdida se decide al pulsar, antes del clic |
| **Responder con el teclado** (foco en la opción) | La respuesta se marca; Sofi pasa a la reacción (imagen estática) y a los ~2,3 s vuelve a esperar con los tres gags **montados pero suspendidos** (el foco sigue en la opción): `idle` durante 9 s con `are-u-still-here` a 5 s. Al soltar el foco, `drowsy` a los 5,0–5,1 s. Igual en Chromium, Firefox y WebKit |
| **Gag en marcha cuando llega el foco** (`poking`; hallazgos 7 y 8) | Se congela en su pose mientras dure el foco: `curious`, `offended` y `hide` aguantan 6 s inmóviles. Al perder el foco continúa donde estaba: `hide → peek` 1,4 s después, `return` 5 s más tarde, `idle` 1,5 s después; `offended`, `idle` tras los ~9,6 s que dura sin foco; `curious`, `idle` 10 s después. Sin foco, `offended → idle` a los 9,6 s. Nada se repite ni empieza de nuevo. `are-u-still-here` no se congela: la propia pulsación del tabulador cuenta como actividad y lo devuelve a `idle` |
| **Mirada pendiente** (`i-see-you`; hallazgo 8) | Si el puntero se mueve unos 90 ms antes de que llegue el foco, el gag pierde el control con la mirada aún por confirmar y la confirma al reanudar: `watching` a los 2,2 s (al soltar) y `idle` a los 2,4 s (reposo del cursor). Con el movimiento 3,5 s antes, o sin moverlo nunca, no pasa. Nunca llega a `caught` |
| **Clic o toque da foco** (hallazgo 9) | Chromium (ratón y toque a 390) y Firefox: una opción, las notas y «Siguiente pregunta» reciben el foco y suspenden. **WebKit: una opción no recibe el foco con clic ni con toque** (no suspende); las notas y el botón, sí. **Matizado en 28.10.5:** ese botón recibe el foco por la gestión de foco de `ProfileSheet`, no por el clic; «Guardar expediente», pulsado, no lo recibe en WebKit |
| Accesibilidad (axe, WCAG 2.2 AA) de la sección 4.9 del Lab, ya sin el selector | 0 violaciones a 1280 claro y oscuro, 390, 320 oscuro y texto al 200 %; sin desplazamiento horizontal; los controles en vivo siguen llegando a los dos marcos sin recargarlos; el resumen de cada marco dice «suspendidos» al darle el foco y vuelve a «sí» al quitarlo |

Capturas locales de la sesión, en `shots\` del directorio temporal: `f-lab-focus` (la sección 4.9 con el foco en una opción del marco móvil) y `f-focus-pose-390` (Sofi congelada en `stop` con el foco en un control a 390).

**28.8.5 Límites.**

- Los toques son de Playwright (`touchscreen.tap`, sin demora) en Chromium y WebKit; no hay Safari real ni dispositivos (`015`).
- «Ventana sin foco» solo se prueba en `jsdom` (evento sintético); en el navegador no se ha forzado.
- Los hallazgos 7 y 8 se midieron con `poking` e `i-see-you` en Chromium; `are-u-still-here` no los tiene.

### 28.9 Al entrar el foco, Sofi vuelve al reposo (decisión aprobada el 2026-11-10)

Fecha: 2026-11-10. Solo Design Lab (4.9) y la spec. No se modifican producción, `ambient.ts`, `useSofiController.ts` ni los controladores del ZIP (fechas de modificación anteriores a esta sesión), ni las demás causas de pausa. Sin commit ni push, sin `AV#`.

**28.9.1 Decisión y dónde consta.** Al entrar el foco en un control del formulario se cancelan los gags activos y Sofi vuelve al reposo; quedan suspendidos hasta perder el foco y, al reanudarse, no continúa ninguna reacción ni mirada pendiente. Única fuente normativa: `008-spec.md` §5 («Foco en los controles del expediente») y su criterio de aceptación. Resuelve los puntos 7 y 8 de 28.5.

**28.9.2 Cómo lo hace el prototipo, sin tocar producción.** El adaptador ya registra en `ambient` un `reset()` por gag (el que `ambient` pide a los demás cuando uno se activa). `trackGagTargets` (`gagProfile.ts`) envuelve el `ambient` del Lab, como ya hacía `observeAmbient`, recuerda esos registros y ofrece `resetAll()`. Todo lo demás lo reenvía sin cambiar ninguna regla. En `SheetGags`, al entrar el foco en un control, primero se pone la causa `interaction` y después `resetAll()`. En ese orden, el gag activo, al volver al reposo, libera a los demás (`deactivate`) sin que ninguno se reanude ni un instante. Al perder el foco solo se quita la causa. Lo que hace `reset()` en cada controlador, sin cambiarlo:

- `poking`: reposo sin animación de vuelta, cancela el tramo en curso y olvida el último pinchazo.
- `i-see-you`: reposo, cancela la mirada pendiente, el reposo del cursor, el «cursor encima» y la reacción. Si estaba reaccionando, cuenta como reacción acabada y abre su espera de 15 s sin dejarse pillar, su regla de siempre (28.9.4).
- `are-u-still-here`: reposo sin susto y la cuenta de inactividad vuelve a empezar.

Ninguna otra causa (página oculta, ocupada, sensible) hace `reset()`: la regla general de `ambient` sigue igual.

**28.9.3 Pruebas.**

| Qué | Resultado |
|---|---|
| `SheetGags.test.tsx` con los controladores reales: `poking` en `curious` y en `hide` vuelve al reposo al instante y no sigue (20 s después, solo `idle`; un toque empieza de nuevo por `curious`); `i-see-you` pillada no sigue con la sonrisa; su reacción pendiente (cursor encima, aún sin pillarla) no se retoma; `are-u-still-here` dormida vuelve al reposo sin susto y la cuenta empieza de cero (4,9 s en reposo, `drowsy` a los 5,1); pasar de un control a otro no reanuda; la página oculta solo pausa (`curious` sigue en `curious`) | 28 (eran 21) |
| `gagProfile.test.ts` (+ `trackGagTargets`: `reset()` a cada gag y solo cuando se pide; una causa sigue sin `reset()`; reenvía `activate`/`deactivate`; la baja de StrictMode) | 22 (eran 18) |
| RED antes de implementar | 5 fallos, por el motivo esperado; las dos pruebas de alcance ya pasaban |
| Sensibilidad (mutaciones; archivos restaurados) | Sin `reset` al entrar el foco: 5 fallos. `reset` solo a parte de los gags: 7. Baja sin comprobar el registro: 1. `reset` también al perder el foco: **no se detecta**, y es equivalente (al perder el foco todo está ya en reposo y durante la suspensión nada puede arrancar) |
| `vitest run` completo | **127 archivos y 2 468 pruebas**, en verde |
| `tsc -b`, `eslint .`, `prettier --check .` | sin errores |
| `playwright e2e/a11y.spec.ts e2e/motion --project=chromium --workers=2` | **55 de 55** |

**28.9.4 Navegador real** (servidor propio, controladores y CSS reales, el marco a 1280 salvo donde se indica). El foco entra como lo haría la persona: con el tabulador desde el último botón de la cabecera hasta «Volver a la consulta». Cada cambio de atributo del anfitrión se registró con un `MutationObserver` y el número de fotograma, para saber qué estados llegan a pintarse.

| Comprobación | Chromium | Firefox | WebKit |
|---|---|---|---|
| `poking` en `curious`, `offended` y `hide` → Tab | `idle` en el mismo instante; al soltar el foco, 12 s sin ningún cambio | igual | igual |
| `i-see-you` pillada (`caught`) → Tab | `idle` al instante; al soltar, 6 s sin cambios | igual | igual |
| `i-see-you` mirando (`watching`) → Tab | `idle` al instante; al soltar, sin cambios | igual | igual |
| **Mirada pendiente** (puntero movido justo antes del Tab: el caso del punto 8) | **Ningún `watching`**, ni con foco ni al soltar (antes: `watching` al reanudar) | igual | igual |
| `are-u-still-here` en `drowsy` → Tab | `idle`; 8 s en reposo con foco; al soltar, `drowsy` a los 5,0 s | igual (5,3 s) | igual (5,0 s) |
| `are-u-still-here` dormida (`asleep`) → Tab | La pulsación del tabulador cuenta como actividad y la despierta (`startled`), pero el foco la devuelve a `idle` **en el mismo fotograma: el susto no se pinta**. Al soltar, `drowsy` a los 5,0 s | igual | igual |

También en Chromium:

- **Sin regresiones del foco:** las 26 paradas del tabulador dan 0 desajustes y ninguna reanudación entre controles, como en 28.8. Un clic sobre Sofi con el foco en un control quita el foco y activa `curious`, con 0 y con 90 ms de pulsación. Al responder con el teclado, los tres gags se montan suspendidos y en reposo (9 s en `idle`), y al soltar, `drowsy` a los 5,1 s.
- **Los gags siguen vivos tras reanudar:** `poking` cancelado en `hide` empieza de nuevo con cinco toques (`curious → skeptical → stop → offended → hide`). `i-see-you` cancelado en `caught` vuelve a mirar al puntero, pero con el cursor encima no se deja pillar durante los 20 s medidos. Es su espera tras una reacción («si estaba reaccionando, cuenta como reacción acabada»), no una reacción pendiente; dura 15 s de su reloj, que no corre mientras el foco lo suspende.
- **Accesibilidad:** axe de la sección 4.9 con la nota nueva, 0 violaciones a 1280 claro y oscuro, 390, 320 oscuro y texto al 200 %. Los controles en vivo siguen llegando a los marcos sin recargarlos.

Capturas locales de la sesión (`shots\` del directorio temporal): `f-reset-before-390` (Sofi escondida, `hide`, a 390) y `f-reset-after-390` (tras dos Tab, con el foco en la primera opción: Sofi en reposo).

**28.9.5 Límites.**

- El foco entra con el tabulador; con clic y toque, la entrada del foco depende del motor (28.5, punto 9, sin decidir).
- La espera de `i-see-you` tras cancelar una reacción es del controlador y no se ha cambiado. Si se quisiera que pudiera pillarse enseguida, haría falta otro mecanismo, y se consultaría antes.
- Sin Safari real, lectores de pantalla ni dispositivos (`015`).

### 28.10 Foco nativo y alcance de los controles (puntos 9 y 10, decisiones aprobadas el 2026-11-10)

Fecha: 2026-11-10. Solo Design Lab (4.9) y la spec. Sin tocar producción ni controladores, sin commit ni push, sin `AV#`.

**28.10.1 Decisiones y dónde constan.** Única fuente: `008-spec.md` §5 («Foco en los controles del expediente») y sus criterios de aceptación.

- **Punto 9:** se respeta el foco nativo de cada navegador, también en WebKit; no se fuerza al tocar o pulsar respuestas, y las acciones del formulario siempre prevalecen sobre los gags.
- **Punto 10:** todos los controles del expediente suspenden los gags mientras tienen el foco, y se excluyen los de la cabecera general.

**28.10.2 Qué ya cumplía el prototipo.**

- No fuerza el foco: `SheetGags`, `gagProfile.ts` y el marco no llaman a `focus()`. El único `focus()` del prototipo es el del título de la ficha al cambiar de vista (`ProfilePrototype`), que imita la gestión de foco de producción (`AppShell`) y no toca las respuestas.
- El alcance es «dentro de la ficha» (`main`), y la cabecera queda fuera.

**28.10.3 Contradicción encontrada y corregida (solo en el Lab).** La zona sensible del Lab (`styles.host`) se ponía en el retrato aunque no hubiera ningún gag montado: con todos desmarcados, con **movimiento reducido** (del sistema o «Reducido» del Lab) y durante la carga de las tiras. Su `::after` se coloca respecto al anfitrión gracias al `position: relative` que le dan los parciales de los gags. Sin ninguno, quedaba colocado respecto al escenario y, ampliado ×3, **tapaba parte de «Volver a la consulta»**: 85 de 91 puntos a 1280 y 49 de 91 a 390, cuando el marco de producción del Lab (`frame=profile`) no tapa ninguno. Eso incumplía «las acciones del formulario siempre prevalecen». También corrige lo dicho en 28.4 («Movimiento reducido: 0 … clases de gag; tocar no hace nada»): en reducido quedaba la clase de la zona sensible del Lab, y con ella el bloqueo. Corrección: la clase solo se pone con algún gag montado. Producción no tenía el problema.

**28.10.4 Pruebas.**

| Qué | Resultado |
|---|---|
| `SheetGags.test.tsx` (+ sin ningún gag marcado, sin zona sensible; con un solo gag, sí; con movimiento reducido, tampoco) | 30 (eran 28). Sin la corrección fallan 2 |
| `vitest run` completo | **127 archivos y 2 470 pruebas**, en verde |
| `tsc -b`, `eslint .`, `prettier --check .` | sin errores |
| `playwright e2e/a11y.spec.ts e2e/motion --project=chromium --workers=2` | **55 de 55** |

**28.10.5 Navegador real** (servidor propio, Chromium, Firefox y WebKit).

| Comprobación | Resultado |
|---|---|
| **Punto 10, inventario** de lo enfocable en 9 composiciones (`empty`, `waiting`, `answered`, `uncertain`, `completed`, `saved`, `empty-save`, `memory`, `deleting`) | Los tres motores dan lo mismo. En la ficha hay de 14 a 17 controles según la composición, y **todos cuentan**. Lo enfocable que no cuenta son el título de la ficha (`h1`, `tabindex=-1`, solo lector de pantalla) y, al borrar, el título del aviso (`h3`, `tabindex=-1`): son títulos, no controles. Fuera de la ficha solo están los 5 controles de la cabecera general (portada, Claro, Oscuro, Sistema, Sonido de Sofi), que no suspenden; no hay ningún otro control fuera de `main` |
| **Punto 10, recorrido con el tabulador** | Sin cambios respecto a 28.8 y 28.9: 0 desajustes entre «control de la ficha con foco» y «suspendidos» |
| **Punto 9, dónde queda el foco tras cada acción** (Sofi esperando, con el ratón) | **Chromium y Firefox:** el índice de áreas lleva el foco a la primera opción (lo hace `ProfileSheet`), «Siguiente pregunta» a su propio botón, las notas a sí mismas, una opción a sí misma (al volver a esperar sigue ahí) y «Guardar expediente» a sí mismo: todo suspende. **WebKit:** el índice, «Siguiente pregunta» y las notas, igual; **pulsar una opción o «Guardar expediente» no da el foco** (queda en el documento), así que los gags no se suspenden por esa pulsación, como pide la decisión. Corrige lo dicho en 28.8.4: el botón que allí recibía el foco en WebKit era «Siguiente pregunta», y lo recibe por la gestión de foco de `ProfileSheet`, no por el clic |
| **Punto 9, las acciones prevalecen**: rejilla de 7 × 5 puntos sobre cada control visible de la ficha, en reposo, en cada pose de `poking` (`curious`, `skeptical`, `stop`, `offended`, `hide`, `peek`), con `i-see-you` pillada (con su alerta) y con `are-u-still-here` dormida (con sus Zzz) | En Chromium, Firefox y WebKit a 1280 y en WebKit a 390, **exactamente los mismos puntos que sin gags** en todas las poses. Los únicos puntos que no responden, también sin gags, son de «Ir a guardar» y «Quitar respuesta», que en esa composición están ocultos e inertes (`visibility: hidden` dentro de un `span` con `inert`): no son controles disponibles |
| **Punto 9, responder con un gag en marcha** | Con Sofi asomada (`peek`), la opción queda marcada y Sofi pasa a la reacción; con Sofi dormida, la opción queda marcada. En los tres motores |
| **La corrección de 28.10.3**, frente al marco de producción del Lab, en 9 estados (sin gags, los tres, cada uno solo, reducido del sistema, «Reducido» del Lab, preguntando, reacción) a 1280 y 390 | **0 puntos de más** en los tres motores. Antes: 31 de más a 1280 y 15 a 390 (Chromium), sin gags y en reducido |

Guiones de usar y tirar, fuera del repositorio.

**28.10.6 Lo que hay que saber.**

- **En WebKit, pulsar una respuesta no suspende los gags**, porque el navegador no da el foco. No choca con el resto de §5: la pulsación marca la respuesta y Sofi pasa a la reacción, que desmonta los gags, y una pulsación en un control no es un toque a Sofi (`poking` no se activa). Sí cuenta como actividad para `are-u-still-here`, y la mirada de `i-see-you` puede seguirla (excepción aprobada de §5).
- Al entrar en la vista, el foco está en el título de la ficha (lo pone la gestión de foco de producción), que no es un control: los gags viven.

**28.10.7 Límites.** Toques con Playwright sin demora; sin Safari real, lectores de pantalla ni dispositivos (`015`). La rejilla de las acciones a 390 es de WebKit; Chromium y Firefox, a 1280 (a 390, con el barrido de estados de 28.10.5).

### 28.11 Decisión 11 en el expediente, ubicación A e inactividad (decisiones aprobadas el 2026-11-10); tolerancia de la zona sensible, detenida

Fecha: 2026-11-10. Solo Design Lab y fuentes normativas. Sin tocar producción ni controladores, sin commit ni push, sin `AV#`.

**28.11.1 Dónde constan.**

| Decisión | Única fuente |
|---|---|
| La etiqueta «Sofi» queda por encima del retrato cuando se solapan, también en el expediente | `art-direction/README.md`, decisión 11 |
| Ubicación A en el expediente: sobre el retrato del cuestionario, en móvil y escritorio | `008-spec.md` §5 |
| `are-u-still-here`: 150 000 ms | `008-plan.md` §6 (la spec §5 remite al plan) |
| Tolerancia de 17 píxeles aislados en el contorno de la zona sensible móvil | **No registrada**: lo medido no cabe en ella (28.11.4) |

T066 (`008-tasks.md`) ya no llama provisional al valor. AV6 sigue sin marcar: incluye la ubicación en la consulta en reposo (4.7 y 4.8), que no está aprobada.

**28.11.2 Qué cambia en el Lab.** Solo textos y comentarios:

- 4.9 pasa a «ubicación A», pendiente solo de AV4. Su nota dice que la ubicación y la inactividad están aprobadas y que la etiqueta queda por encima (decisión 11).
- 4.7, 4.8, la nota de inactividad (`GagPanel`), los escenarios de 4.4 y el inspector ya no llaman provisional al umbral. 4.7 y 4.8 siguen remitiendo a AV6 para la ubicación en la consulta.
- El comportamiento no cambia: el marco ya partía de `STILL_HERE_IDLE_MS` (150 000 ms) y la etiqueta ya iba por encima (28.1).

**28.11.3 Evidencia del umbral definitivo (150 000 ms).**

Pruebas (Vitest, temporizadores falsos, controlador real a través del adaptador):

| Prueba | Resultado |
|---|---|
| `SheetGags.test.tsx` (nuevas, 4.9 con los tres gags): el marco parte de 150 000 ms; a 149 999 ms `idle`, a 150 000 ms `drowsy`; con una tecla a los 100 s, a 149 999 ms de ella `idle` y a 150 000 ms `drowsy` | 2 de 2. Con el valor del marco cambiado a 149 000 ms fallan las dos (archivo restaurado) |
| Ya existentes: `useSofiController.test.tsx` (149 000 ms `idle`, 150 500 ms `drowsy`), 4.7 (`GagsSpec.test.tsx`) y 4.8 (`GagsWideSpec.test.tsx`) | En verde, sin cambios de lógica |

Navegador real (marco 4.9, controlador real, reloj de Playwright que el controlador lee a través de `performance.now`). Se mide desde la última actividad que el controlador cuenta, en pasos de 1 ms:

| Motor | Anchura · gags | Actividad | A 149,990 s | Pasa a `drowsy` |
|---|---|---|---|---|
| Chromium | 390 y 320 · solo `are-u-still-here` | ratón | `idle` | a los **150,000 s** |
| Chromium | 390 y 320 · solo `are-u-still-here` | tecla | `idle` | a los **150,000 s** |
| Chromium | 1280 · los tres | tecla | `idle` | a los **150,000 s** |
| Firefox | 390 y 320 · solo `are-u-still-here` | ratón | `idle` | a los **150,000 s** |
| Firefox | 390 y 320 · solo `are-u-still-here` | tecla | `idle` | a los **150,000 s** |
| Firefox | 1280 · los tres | tecla | `idle` | a los **150,000 s** |
| WebKit | 390 y 320 · solo `are-u-still-here` | tecla | `idle` | a los **150,000 s** |
| WebKit | 1280 · los tres | tecla | `idle` | a los **150,000 s** |
| Chromium y Firefox | 390 · solo `are-u-still-here` | rueda (desde el `scroll` que provoca) | — | **150,00 s** después del `scroll` |

Sobre el método:

- **Ratón en WebKit.** El movimiento sintético de Playwright llega sin desplazamiento (`movementX` y `movementY` a 0). El controlador no cuenta un movimiento así: lo descarta a propósito, porque el navegador manda esos eventos al hacer scroll. Por eso, en WebKit el ratón no se pudo medir y se midió con tecla. En Chromium y Firefox, el primer movimiento tampoco tiene desplazamiento y no cuenta; el segundo, sí.
- **Rueda.** Con el reloj parado, el navegador entrega la rueda y su `scroll` en el siguiente fotograma. Medido desde ese `scroll`, el paso es exacto (Chromium: 31,08 → 181,08 s; Firefox: 30,49 → 180,49 s).
- **Reloj falso.** Hizo falta dar a `performance` un `addEventListener` vacío, porque el de Playwright no lo tiene y la página no arrancaba. No cambia el reloj.

**28.11.4 Tolerancia de la zona sensible móvil: contradicción, detenida.** La tolerancia aprobada habla de 17 píxeles aislados. Esa cifra salió de 28.4: Chromium, 390 px, comparando la zona sensible con el alfa calculado de la tira. Antes de registrarla se volvió a medir con lo que se pinta de verdad:

- dos capturas con el fondo del anfitrión en magenta y en verde, con solo Sofi visible y animaciones paradas;
- cada píxel del retrato de 192 px (escala ×1,5) probado con `elementFromPoint` en su centro;
- Sofi en reposo.

| Motor | Anchuras de ventana | Pintados sin respuesta | Mayor grupo | Distancia a lo sensible |
|---|---|---|---|---|
| Chromium | 320, 360, 390, 480, 600 | 11–12 | 2 px | ≤ 1 px |
| Chromium | 321, 333, 375, 393, 412, 430 | **54** (19 grupos) | **20 px** | ≤ 1 px |
| Chromium | 768, 844, 1000, 1079 | 0 | — | — |
| WebKit | 320, 360, 390, 412, 430 | 0 | — | — |
| WebKit | 321, 375, 393, 1079 (retrato en medio píxel) | **41** (10 grupos) | **20 px** | ≤ 1 px |
| Firefox | 320 a 1079 (9 anchuras) | 0 | — | — |

- **Lo que no cabe en lo aprobado.** En anchuras móviles habituales (375, 393, 412 y 430 px) hay más de 17 píxeles: 54 en Chromium y 41 en WebKit. Y no están aislados: el mayor grupo es una franja de 1 px de ancho y 20 de alto en el borde derecho del pelo rubio y el hombro (captura `g4-chromium-412`). Depende de dónde cae el retrato respecto a la rejilla de píxeles.
- **Lo que sí se cumple.** Todo píxel pintado sin respuesta está a 1 px como mucho de la zona sensible. Por el otro lado, hay de 327 a 447 píxeles sensibles sin nada pintado, todos a 2 px o menos de lo pintado: es el borde que deja la silueta por bloques de 1,5 px (26.6.2). No hay zona sensible más allá de ese borde.
- **Medida anterior.** El método del alfa calculado de 28.4 descuadra con el retrato en medio píxel: a 1079 px daba 95 píxeles sensibles sin nada visible que la captura real no confirma. Queda sustituido por este.

No se ha registrado la tolerancia ni se ha tocado la zona sensible. Las alternativas, para la autora, están en 28.5.2.

**28.11.5 Decisión 11 en el expediente: el Lab la cumple.** Marco 4.9, `poking` llevado a escondida y asomada con clics. En cada píxel de la etiqueta «Sofi» se mira qué elemento queda encima.

| Ventana | Solape de la caja de la etiqueta con el retrato | Encima de la etiqueta (Chromium, Firefox, WebKit) |
|---|---|---|
| 320 | 19 × 19 px (WebKit, 20 × 19) | la etiqueta en todos sus puntos; el retrato en ninguno, en las dos poses |
| 390 | ninguno | la etiqueta |
| 1080 y 1280 | 47 × 22 px | la etiqueta en todos sus puntos; el retrato en ninguno, en las dos poses |
| 1920 | ninguno | la etiqueta |

En los tres motores, el contenedor de la etiqueta tiene `z-index: 2`. En WebKit a 320 px, 2 de 1 240 puntos dan en otro elemento del bocadillo (redondeo del borde), nunca en el retrato. Capturas: `g5-<motor>-<anchura>-hide` y `-peek` (por ejemplo, `g5-chromium-1080-hide`: el pelo pasa por detrás de la etiqueta).

**28.11.6 Pruebas.**

| Qué | Resultado |
|---|---|
| `vitest run` completo | **127 archivos y 2 472 pruebas**, en verde (eran 2 470: +2 de umbral en `SheetGags.test.tsx`) |
| `tsc -b`, `eslint .`, `prettier --check .` | sin errores |
| `playwright e2e/a11y.spec.ts e2e/motion --project=chromium --workers=2` | **55 de 55** |

Guiones de usar y tirar, fuera del repositorio. Capturas locales de la sesión, en `shots\` del directorio temporal de la sesión.

**28.11.7 Límites.**

- El umbral se midió con el reloj simulado de Playwright, sin esperar 2,5 min reales, y sin Safari real ni dispositivos (`015`).
- La zona sensible se midió en reposo; las demás poses, como en 26.5 y 28.4.
- En el código de producción (`useSofiController.ts`), un comentario dice que el valor definitivo lo aprueba el Lab (AV6). No se ha tocado; se actualiza en T088.

### 28.12 Precisión geométrica de la zona sensible (decisión aprobada el 2026-11-10)

Fecha: 2026-11-10. Solo la spec y una medición del Lab 4.9. No se toca el código, ni se generan máscaras, ni se modifica producción ni los controladores. Sin commit ni push, sin `AV#`.

**28.12.1 Decisión y dónde consta.** Sustituye a la tolerancia de 17 píxeles, que no llegó a registrarse (28.11.4). Su única fuente es `008-spec.md` §5 («Precisión de la zona sensible»), y el criterio de aceptación de la zona sensible remite a ella.

**28.12.2 Método.**

- Marco 4.9 con los controladores reales y el reloj de Playwright parado en cada pose, para que el controlador no cambie de pose durante la medida.
- Las animaciones CSS corren en tiempo real, así que se espera 2,2 s a que acabe la entrada de la pose y luego se pausan donde estén.
- **Pintado:** dos capturas con solo Sofi visible, sin los efectos (el «?», la vena, los Zzz y el estallido no responden por diseño), y el fondo del lienzo en magenta y en verde. Lo que no cambia es opaco, dentro y fuera de la caja.
- **Sensible:** `elementFromPoint` en el centro de cada píxel, con 16 px de margen, cae en el anfitrión o en una de sus capas.
- **Distancia:** de tablero (Chebyshev), en píxeles de pantalla.
- **Matriz:**
  - 8 poses: reposo; `curious`, `skeptical`, `stop`, `offended`, `hide` y `peek` de `poking`; y `are-u-still-here` dormida;
  - 5 anchuras: 320, 375 y 412 px con el retrato de 192 px (×1,5); 1080 y 1281 px con el de 384 px (×3);
  - 3 motores: 120 medidas.
- **Corrección del método:** una primera versión comparaba lo que sobresale de la caja con la página sin Sofi. Daba falsos «sensibles sin pintar» bajo las manos, donde la piel se parece al fondo crema, y contaba la vena de `stop` como Sofi sin respuesta. Se descartó.

**28.12.3 Resultado.** Por escala y pose, el peor caso de las anchuras y los motores:

| Pose | ×1,5 (192 px) | Peor ×1,5 (sin respuesta / sin pintar) | ×3 (384 px) | Peor ×3 (sin respuesta / sin pintar) |
|---|---|---|---|---|
| Reposo, `curious`, `skeptical` | 9/9 cumplen | 1 px / 2 px | **3/6** (falla 1080) | 0 / **3 px**, 1–2 píxeles |
| `stop`, `offended` | 9/9 | 1 / 2 | 6/6 | 0 / 2 |
| `hide` | 9/9 | 1 / 2 | **0/6** | 0 / **3 px**, 14 píxeles |
| `peek` | **6/9** (Chromium 375; Firefox 375 y 412) | **3 / 4 px** | **0/6** | **9 / 11 px** (Firefox; Chromium y WebKit, 1 / 3 px) |
| Dormida | **8/9** (WebKit 375) | **2 / 4 px** | 6/6 | 0 / 2 |

Cumplen 95 de 120 medidas. En las que fallan, nunca hay zona sensible lejos de Sofi: el peor caso son 11 px junto a su contorno. Los efectos no responden en ninguna.

**28.12.4 Incumplimientos (no corregidos: exigen máscaras nuevas).**

1. **El borde de 3 px a ×3.**
   - Con el retrato de 384 px, la zona sensible se pasa de lo pintado hasta **3 px** en puntos sueltos del contorno: de 1 a 40 píxeles por pose.
   - Ocurre en reposo, `curious` y `skeptical` (a 1080 px), en `hide` (siempre) y en `peek`.
   - Causa: las siluetas son de bloques de 1 px de la insignia de 128 px, que a ×3 son bloques de 3 px de pantalla (ya anotado en 27.4.2).
   - Para cumplir los 2 px harían falta siluetas propias del retrato de 384 px. Afecta igual a 4.8, que usa las mismas siluetas a ×3 (medido en 28.13).
2. **Movimiento dentro de la pose (`peek` y la dormida).** *Corregido en 28.13.7: la medida por fotograma no reproduce estas cifras, salvo la dormida de WebKit a 375 px, que es fija.*
   - La silueta es fija por pose (26.6.2): cuando Sofi mira a un lado y a otro asomada, o se mece dormida, se desplaza dentro de su pose y la zona no la sigue.
   - En el fotograma medido: hasta **3 px** sin respuesta y **4 px** sensibles sin pintar a ×1,5; **9 y 11 px** a ×3 (Firefox, en el punto más lejano de la mirada; captura `g9-firefox-1080-peek`).
   - Depende de en qué momento de la animación se mide. Es pasajero: vuelve a cumplir cuando Sofi regresa a su posición.
   - Cumplirlo exigiría una silueta por fotograma o que la zona siguiera la animación.
3. **Lo que sí se cumple siempre:** en las poses quietas a ×1,5 (reposo, `curious`, `skeptical`, `stop`, `offended` y `hide`, en todas las anchuras y motores), y en `stop`, `offended` y la dormida a ×3.

**28.12.5 Límites.**

- No se ha medido `i-see-you` (pillada) ni la cabezada y el susto de `are-u-still-here` (medidos en 28.13).
- Se mide un fotograma por pose: en las poses con movimiento, el peor caso real puede ser algo mayor.
- Sin Safari real ni dispositivos (`015`). La insignia (4.7, ×1) y la consulta ancha (4.8, ×3) no se han vuelto a medir.

Capturas de los casos que fallan: `g9-<motor>-<anchura>-<pose>` en `shots\` del directorio temporal de la sesión.

### 28.13 Poses dinámicas con las máscaras actuales: medida por fotograma y toques reales (estudio, 2026-11-10)

Fecha: 2026-11-10. Solo medidas del Lab. No se generan máscaras, ni se modifica producción ni los controladores, ni cambia el criterio de spec §5.

La autora aceptó el 2026-11-10 hasta 3 px de desviación en el contorno estático del retrato de 384 px (×3). Esa aceptación aún no consta en spec §5 (*registrada el 2026-11-11: 28.14*). Las desviaciones de las poses dinámicas se estudian aquí sin aprobarlas.

**28.13.1 Método.**

- **Fotogramas:**
  - Controladores reales, llevados a cada estado con el reloj de Playwright parado.
  - Todas las animaciones del anfitrión, en pausa y recorridas con `currentTime` cada 80 ms, hasta 6 s.
  - Cada fotograma distinto se mide como en 28.12.2.
- **Estados medidos:**
  - `poking`: `peek`, `nope` y `return`.
  - `i-see-you`: `watching` con sus cuatro miradas, `caught`, `smirk`, `tease` y `giggle`.
  - `are-u-still-here`: `drowsy`, `nodding`, `asleep`, `startled` y `guilty`.
- **Superficies:**
  - 4.7, insignia a ×1, con 1280 px de ancho;
  - 4.8, retrato grande a ×3, con 1440 px;
  - 4.9, expediente a ×1,5 con 390 px y a ×3 con 1280 px;
  - además, `peek` y la dormida a 375 y 412 px, y `peek` de Firefox a 1080 y 1281 px.
- **Motores:** los tres.
- **Toques reales:** son toques táctiles de Playwright. Chromium los recibe por CDP, que también permite la pulsación larga; WebKit y Firefox, con `touchscreen.tap`. Se prueban dos fotogramas por estado y dos puntos en cada uno:
  - **Interior:** todo sensible a 6 px a la redonda.
  - **Transparente próximo:** nada sensible a 6 px, el más cercano posible (a 8 px) y a más de 16 px de cualquier control.
- **Controles próximos:** los que están a 160 px o menos. Se prueba una rejilla de 7 × 5 puntos por control en cada fotograma, para ver si alguno lo recibe Sofi.
- **Ajuste de toque:** toques transparentes a 3–40 px de la zona sensible y a más de 24 px de los controles. También la franja bajo «← Volver a la consulta».
- **Corrección del método en 4.8.**
  - Bajo Sofi hay una capa decorativa de puntos, hermana del retrato.
  - La medida descartaba esos píxeles, así que «sin respuesta» salía siempre 0.
  - Se repitió dejando esa capa transparente al toque, solo durante la medida.

**28.13.2 Dónde tiene función la zona sensible.** Lo fijan los controladores:

- **`poking`** cuenta el clic sobre el anfitrión en reposo y en `curious`…`peek`. En `hide`, el toque retrasa la asomada. En `nope` y `return` lo ignora.
- **`i-see-you`:** `watching` cuenta como reposo, así que `poking` responde y el puntero quieto sobre Sofi la pilla. En `caught`…`giggle`, los otros gags están en pausa.
- **`are-u-still-here`:** cualquier actividad en la página la despierta. Fuera del reposo, los otros gags están en pausa.

Por tanto, la zona solo tiene efecto en estos estados: reposo, `curious`…`peek` y `watching`. En los demás, un desajuste es solo de píxeles.

**28.13.3 Estados con función táctil.** Peor caso de los fotogramas, en px: sin respuesta / sensible sin pintar. El criterio de spec §5 es ≤ 1 / ≤ 2.

| Estado | 4.7 (×1) | 4.9 (×1,5) | 4.9 (×3) | 4.8 (×3) |
|---|---|---|---|---|
| `peek` | 1 / 2; Chromium **2** / 1 (2 píxeles, en 2 de 62 fotogramas) | 1 / 2 (Firefox, 375–412); Chromium a 375 **2** / 2 (1 píxel); WebKit a 375 1 / **3** (1 píxel, 1 fotograma) | 1 / **3**; Firefox 1 / **4** (4 píxeles), igual a 1080, 1280 y 1281 | 1 / **3**; Firefox 1 / **5** (15 píxeles por encima de 3 px) |
| `watching` (4 miradas) | ≤ 1 / ≤ 1 | ≤ 1 / 2 | 0 / 2 | 0 / 2; Firefox 1 / **3** (fijo: es el contorno estático) |

- A ×1 y ×1,5, `peek` y `watching` cumplen, salvo píxeles sueltos a 2 o 3 px.
- A ×3, `watching` queda dentro de los 3 px aceptados.
- **`peek` a ×3 en Firefox** es lo único que pasa de 3 px: hasta 4 px en 4.9 y 5 px en 4.8, en unos pocos píxeles del contorno del pelo.

**28.13.4 Estados sin función táctil: diferencias de píxeles sin efecto.**

| Estado | Peor caso | Por qué no tiene efecto |
|---|---|---|
| `nope` | Hasta 99 px sin respuesta a ×3 (18 px a ×1,5). La cabeza sube y la zona se queda a la altura de `peek`. | `poking` ignora el toque. |
| `return` | Hasta 99 px sensibles sin pintar. La zona vuelve a la silueta completa mientras la cabeza aún asoma. | `poking` ignora el toque. |
| `nodding` | 11 px a ×3. | Cualquier actividad la despierta, y los demás gags están en pausa. |
| `startled` | 17–18 px. | Lo mismo. |
| `guilty` | 3–5 px. | Lo mismo. |
| `caught` y `giggle` | 3–4 px a ×3. | Los demás gags están en pausa. |
| `drowsy` y `asleep` | Cumplen, o se quedan en los 3 px estáticos a ×3, salvo la dormida de WebKit a 375 px, con 2 / 4 px fijos (redondeo de esa anchura). | Lo mismo. |

- Ningún control próximo pierde toques en ninguno de estos fotogramas.
- El cursor no cambia sobre Sofi, así que el desajuste no se ve.
- **Esto es evidencia, no una tolerancia.** En estos estados no responde nada, así que el criterio de aceptación («los gags solo responden sobre las partes visibles») se cumple. Los límites de spec §5 no se relajan para ellos: si uno de estos estados pasara a responder al toque, se le aplicarían enteros.

**28.13.5 Toques reales.** Se probaron las tres superficies con los tres motores y la mirada de WebKit a 192 px. En todos los casos dieron el resultado esperado.

- **`peek`:** un toque transparente próximo no tiene reacción (4/4; 5/5 en 4.8). Un toque sobre Sofi da `nope` (4/4; 5/5).
- **`watching`:** un toque transparente no tiene reacción y un toque sobre Sofi da `curious`, 2/2 por mirada. La mirada en el momento del toque no se fijó en cada pasada (el atributo leído iba a veces una mirada por detrás). Las miradas comparten silueta, y cada una se midió en 28.13.3.
- **Puntero quieto 1,3 s:** sobre la zona transparente queda en reposo o en `watching`; sobre Sofi da `caught`.
- **Pulsación larga** (solo Chromium): sobre la zona transparente no la pilla y `poking` sigue en reposo; sobre Sofi da `caught`.
- **Dormida:** un toque transparente la despierta (`startled`), porque es actividad en cualquier parte de la página.
- **Controles próximos:** ninguno pierde toques en ningún estado, fotograma, superficie ni motor:
  - 4.9: 2 controles a ×1,5 y 9 a ×3;
  - 4.8: 5;
  - 4.7: ninguno a 160 px o menos.

**28.13.6 Ajuste de toque de WebKit (hallazgo; no depende de las máscaras).**

- **Hacia Sofi.** WebKit lleva el clic de un toque al elemento con clic más próximo.
  - Un toque transparente a 3 px de la zona sensible hace reaccionar a Sofi (`curious`) en las cuatro superficies; a 5 px o más, no.
  - Chromium y Firefox no hacen ese ajuste.
  - En WebKit, el alcance efectivo es unos 3 px mayor que la zona. Sigue sin haber zona táctil alejada de Sofi.
- **Hacia «← Volver a la consulta».** En 4.9, a 320–412 px, el botón está 8 px por encima de la caja de Sofi, y lo pintado de Sofi empieza 18 px por debajo de él.
  - WebKit lleva al botón los toques hasta 10 px por debajo, haya gags o no.
  - Ningún píxel visible de Sofi queda dentro de esa franja.
  - Un toque transparente a 11 px del botón cerró el expediente durante la primera pasada de las pruebas. Es el comportamiento normal de la plataforma.
- No se ha comprobado en Safari real ni en dispositivos (`015`).

**28.13.7 Corrección de 28.12.4.2.** La medida por fotograma no reproduce lo que daba el fotograma único de 28.12.

| Caso | 28.12 (fotograma único) | 28.13 (por fotograma) |
|---|---|---|
| `peek` ×3, Firefox | 9 / 11 px | 1 / 4 px, a 1080, 1280 y 1281 px |
| `peek` ×1,5 | 3 / 4 px (Chromium a 375; Firefox a 375 y 412) | Firefox cumple a 375 y 412. Chromium a 375: 1 píxel a 2 px sin respuesta |

- En la captura de 28.12 (`g9-firefox-1080-peek`) todo el pintado está desplazado de lado respecto de la zona, en rojo a un lado y en azul al otro.
- Encaja con un pintado y un mapa de toques tomados en instantes distintos de una animación en curso.
- En `peek`, la zona de la cabeza va en la misma capa que la cabeza y la sigue. Por eso no es cierto que «la zona no la sigue».
- La dormida de WebKit a 375 px (2 / 4 px) sí se reproduce, pero es fija: viene de redondear esa anchura, no del movimiento.

**28.13.8 Conclusión.**

- No aparece ningún fallo funcional perceptible:
  - los toques sobre Sofi reaccionan;
  - los toques transparentes próximos no;
  - ningún control pierde toques.
- Todos los incumplimientos del criterio son diferencias de píxeles:
  - unos van de 2 a 5 px junto al contorno, en estados con función;
  - otros son mayores, en estados en los que el toque no tiene efecto.
- Lo único que supera los 3 px aceptados en un estado con función es `peek` a ×3 en Firefox: un toque a 4–5 px del pelo cuenta como toque a Sofi. No se aprueba aquí (*aprobado el 2026-11-11 como excepción de spec §5: 28.14*).

**28.13.9 Límites.**

- Toques sintéticos de Playwright, sin Safari real ni dispositivos (`015`).
- Pulsación larga, solo en Chromium.
- Fotogramas cada 80 ms.
- Con movimiento reducido no hay gags (D-1).
- No se mide la versión reducida.

Guiones y capturas en el directorio temporal de la sesión:

- **Guiones:** `g10-frames.mjs`, `g12-frames.mjs` (4.8), `g13-frames.mjs` (anchuras), `g11-taps.mjs` y `g14-taps.mjs` (toques), `g16-band.mjs` y `g18-adjust.mjs` (ajuste de toque).
- **Capturas:** en `shots\`.

### 28.14 Excepciones de precisión táctil registradas en spec §5 (2026-11-11)

Fecha: 2026-11-11. Solo documentación. No se generan máscaras, ni se modifica producción ni los controladores, ni se mide nada nuevo: se contrastan las medidas de 28.12 y 28.13.

**28.14.1 Registro.**

- **Dónde:** `008-spec.md` §5, «Precisión de la zona sensible», única fuente.
- **Qué recoge:** dos excepciones aprobadas por la autora.
  - Hasta 3 px en el contorno estático del retrato de 384 px (2026-11-10).
  - Hasta 5 px solo durante `peek` a ×3 en Firefox (2026-11-11).
- **Alcance:** las dos afectan solo al segundo límite, la zona sensible sin nada pintado debajo. El primero (un píxel visible sin respuesta, a 1 px o menos) sigue igual. No hay ninguna otra excepción (*ampliadas el 2026-11-11 con las de `peek`: 28.15*).
- **Trazabilidad:**
  - el criterio de aceptación sigue remitiendo a §5 sin repetirla;
  - T066 remite a §5 y a esta evidencia;
  - el plan no repite límites;
  - el README de dirección de arte y el catálogo de animaciones no mencionan la precisión.

**28.14.2 Contraste con lo medido, solo en los estados con función táctil** (28.13.2). Cifras en px, sin respuesta / sensible sin pintar:

| Caso | Medido | ¿Dentro de §5? |
|---|---|---|
| Poses quietas a ×1,5: reposo, `curious`…`hide` y `watching` | ≤ 1 / ≤ 2 | Sí, en la regla general |
| `watching` a ×1 | ≤ 1 / ≤ 1 | Sí, en la regla general |
| Poses quietas a ×3, en 4.8 y 4.9: reposo, `curious`, `skeptical`, `hide` y `watching` | 0–1 / 3 | Sí, en la excepción del contorno estático |
| `peek` a ×3 en Firefox, en 4.8 y 4.9 | 1 / 4–5 | Sí, en la excepción de `peek` |
| `peek` a ×3 en Chromium y WebKit | 1 / 3 | **Por decidir.** La silueta de `peek` es fija, pero Sofi se mueve dentro de ella. Si eso es «contorno estático», entra en la primera excepción. Si no, queda fuera, porque la segunda es solo para Firefox. |
| `peek` a ×1 en Chromium | **2** / 1 (2 píxeles, en 2 de 62 fotogramas) | **No**: supera el primer límite |
| `peek` a ×1,5 en Chromium, a 375 px | **2** / 2 (1 píxel) | **No**: supera el primer límite |
| `peek` a ×1,5 en WebKit, a 375 px | 1 / **3** (1 píxel, 1 fotograma) | **No**: supera el segundo límite, y a ×1,5 no hay excepción |

- Los tres «No» son píxeles sueltos de `peek`.
- Los toques reales dieron lo esperado en todos los casos (28.13.5), así que no hay fallo funcional.
- No se aprueban aquí ni se cubren con las excepciones. Se quedan como incumplimientos abiertos (*aprobados el 2026-11-11, junto con `peek` a ×3 en Chromium y WebKit: 28.15*).

**28.14.3 Poses no interactivas.** La evidencia de 28.13.4 se queda en este documento. No pasa a la spec ni es una tolerancia general (28.13.4, último punto).

### 28.15 Excepciones de `peek` registradas en spec §5; investigación de precisión concluida (2026-11-11)

Fecha: 2026-11-11. Solo documentación. No se mide nada nuevo, no se modifican máscaras, producción ni controladores.

**28.15.1 Registro.** `008-spec.md` §5, «Precisión de la zona sensible», única fuente, recoge las excepciones de `peek` aprobadas por la autora:

- a ×3, Chromium y WebKit: hasta 3 px sensibles sin pintar;
- a ×1,5, Chromium: hasta 2 px de píxel visible sin respuesta;
- a ×1,5, WebKit: hasta 3 px sensibles sin pintar;
- a ×1, Chromium: hasta 2 px de píxel visible sin respuesta.

Se agrupan con la de Firefox a ×3, bajo «Mientras dura `peek`». La del contorno estático y los dos límites generales no cambian. Cada excepción vale solo para el límite, la escala y los motores que nombra.

**28.15.2 Coherencia con la evidencia.** Ninguna excepción es más amplia que lo medido. Ningún caso de los estados con función táctil queda fuera de §5.

| Caso de `peek` | Medido (28.13.3) | Excepción |
|---|---|---|
| ×3 (4.8 y 4.9), Chromium y WebKit | 1 / 3 | 3 px sensibles sin pintar |
| ×3, Firefox | 1 / 4–5 | 5 px sensibles sin pintar |
| ×1,5, Chromium (a 375 px; a 390 y 412, 1 / 2) | 2 / 2 | 2 px sin respuesta |
| ×1,5, WebKit (a 375 px; a 390, 1 / 2) | 1 / 3 | 3 px sensibles sin pintar |
| ×1,5, Firefox | 1 / 2 | ninguna: regla general |
| ×1, Chromium | 2 / 1 | 2 px sin respuesta |
| ×1, Firefox y WebKit | 1 / 2 | ninguna: regla general |

Siguen como estaban:

- las poses quietas a ×1 y ×1,5, dentro de la regla general;
- las poses quietas a ×3, dentro de la excepción del contorno estático;
- las poses no interactivas, como evidencia y no como tolerancia (28.14.3).

**28.15.3 Cierre.** Queda concluida la investigación de precisión táctil de T066:

- **Incumplimientos de 28.12.4:** todos están corregidos (28.13.7) o cubiertos por §5. La excepción es la dormida de WebKit a 375 px, que no tiene función táctil (28.13.4).
- **Funcionamiento:** los toques reales dieron lo esperado (28.13.5).
- **Si se reabre:** solo ante un defecto funcional nuevo.

Lo que queda pendiente es:

- el mecanismo de producción (T088);
- Safari real y los dispositivos (`015`).

## 29. B1 — Revisión de 4.8: Sofi entera y el diálogo sin tapar (T066, prototipo)

Fecha: 2026-11-11. Solo Design Lab. No se toca producción, ni los controladores, ni las máscaras. Sin commit ni push. **No es una aprobación:** 4.8 sigue pendiente de AV6, y T066 y AV4 siguen abiertos. *(Actualización del mismo día: la autora aprobó AV6, con esta composición de 4.8; consta en §30.)*

### 29.1 Problemas de la versión revisada por la autora

- **Sofi cortada por el cuello.** La columna copiaba la consulta real: el diálogo sube 96 px sobre el pie del retrato (`.listenDialog`, `margin-top: -96px`) y tapa el busto.
- **Durante `poking`, el cuerpo tapa el texto del diálogo.**
  - El anfitrión sube por encima del diálogo (`--poking-z`).
  - El parcial solo recorta en el borde las poses escondida y asomada.
  - En `curious`, `skeptical` y `stop`, el jersey pasa por encima del texto: **unos 17 000 píxeles del texto tapados**, con cualquier anchura de columna (29.3).
- **27.1 se equivocaba** al decir que «el cuerpo, recortado en el borde, no lo pisa». La comprobación de entonces (27.3) solo medía la zona sensible, no lo pintado por encima del texto.

### 29.2 Qué cambia

Con 4.9 como referencia de composición, el retrato apoya el pie en el borde superior del diálogo, sin solaparse.

| | Antes | Ahora |
|---|---|---|
| Solape del diálogo (`.dialog`, `margin-top`) | −96 px, copia de producción | 0 |
| Escondite de `poking` (`--poking-edge`) | 75 % | 100 %, el valor por defecto del parcial, como 4.9 |
| Constantes (`gagWide.ts`) | `WIDE_OVERLAP = 96` | `PRODUCTION_OVERLAP = 96` (la pantalla real) y `WIDE_OVERLAP = 0` (la propuesta); `WIDE_EDGE_PERCENT` pasa a 100 |

Se mantiene lo demás:

- una sola Sofi (el `SofiPortrait` de 384 px);
- la etiqueta «Sofi» por encima del retrato (decisión 11);
- la zona sensible ×3 y su límite en el borde;
- la etiqueta «Sofi está escuchando», los puntos, el diálogo y su pie;
- los gags y su comportamiento.

La columna sigue siendo la de la consulta. Lo único que difiere de producción es el solape.

Cambian también:

- **Textos:** la descripción de la sección y los comentarios.
- **`gagWide.contract.test.tsx`:**
  - sigue comparando con producción todo lo demás;
  - comprueba que producción sigue con 96 px;
  - comprueba que la propuesta no se solapa y que su borde está al 100 %.
- **`units.test.ts`:** se quita la excepción de `margin-top: -96px`, que ya no se usa.

### 29.3 Verificación

Servidor propio (5188), con los controladores y el CSS reales. Para medir la versión fallida se inyectan en la página sus dos valores antiguos.

| Comprobación | Antes | Ahora |
|---|---|---|
| Píxeles del texto del diálogo que cambian al ocultar a Sofi (reposo y `poking` hasta `peek`, columnas de 384, 460, 520 y 720 px, Chromium) | Reposo: 0. `curious`, `skeptical` y `stop`: **15 962–17 125** | **0** en todas |
| Pie del retrato y borde del diálogo | El borde 96 px por encima del pie | Coinciden al píxel en las cuatro columnas |
| Cada fotograma de los tres gags (`poking` `peek`/`nope`/`return`; `i-see-you` con sus 4 miradas, `caught`…`giggle`; `are-u-still-here` de `drowsy` a `guilty`), cada 160 ms, Chromium, Firefox y WebKit, a 1440 px | — | **0 píxeles del texto tapados** |
| Texto al 150 y al 200 % (reposo, `curious` y `peek`, columnas de 384 y 460) | — | 0 tapados; el pie coincide con el borde |
| axe (WCAG 2.2 AA) en la sección 4.8: 1440 claro y oscuro, 1280 con texto al 200 % y 390 | — | 0 violaciones y sin desbordamiento horizontal de la página |

En el pie del diálogo cambian 58–72 píxeles en algunos fotogramas. Son el triángulo de «Abrir expediente», que parpadea (`TextLink`, `animation: blink`), no Sofi: salen también en `return`, con ella ya escondida.

Capturas de la sesión, en `shots\`:

- **Antes:** `g20-antes-chromium-460-reposo` y `g20-antes-chromium-460-curious`.
- **Ahora:** `g20-despues-chromium-<columna>-<estado>`, y con el texto al 200 %, `g20-zoom200-chromium-<columna>-<estado>`.

**Pruebas:**

- `gagWide.contract.test.tsx`, `gagHitArea.contract.test.ts` y `GagsWideSpec.test.tsx`: 57 de 57. `units.test.ts`: 2 de 2.
- Sensibilidad: con el solape de −96 px, la prueba de la propuesta falla. El valor se restauró a 0.
- Lab completo (`src/design-lab`): 657 de 657 en dos ejecuciones. Una primera, a la vez que las medidas en tres navegadores, dio 1 fallo que no se identificó.
- Suite completa (`vitest run`): 2 471 de 2 473. Fallaron dos pruebas de 4.3 (`MotionSync.test.tsx`), que no se ha tocado, por superar los 5 s de tiempo de espera. Solas pasan 13 de 13, dos veces. No se ha investigado la causa ni se ha cambiado ningún tiempo de espera.
- `tsc -b`, ESLint y Prettier, sin errores, en los archivos tocados.

### 29.4 Consecuencias y decisiones abiertas

Numeradas para aprobarlas por número.

1. ~~Aprobar la composición de 4.8.~~ **Aprobada el 2026-11-11 con AV6** (§30).
2. **La consulta real sigue solapando 96 px.** Llevar la propuesta a producción es un cambio de `ConsultationScreen`, que decide T088. Ahí también hay que decidir si la consulta en reposo, sin gags, cambia igual. No se ha tocado. *(2026-11-11: la decisión 11 fija la composición de la consulta ancha sin solape, sin distinguir si hay gags; T086 y T087 remiten a ella y el cambio va en T088. §30.)*
3. ~~Decisión 11 del README.~~ **Actualizada el 2026-11-11** (§30). Lo que se planteaba: Su texto dice cuándo se solapan la etiqueta y el retrato («con ventanas de 1080 a unos 1245 px»). Sin solape del diálogo, la etiqueta sobresale siempre por encima de su borde y se solapa con el pie del retrato cuando caen en la misma vertical: en reposo con la columna de 384 px, y más con el texto grande. La etiqueta sigue por encima. Si se aprueba 4.8, ese rango hay que actualizarlo en el README. No se ha cambiado, porque la composición no está aprobada.

**Siguiente tarea:** T066 sigue abierta, a la espera de revisar AV4. Quedan *(actualizado en §30.5: la ubicación quedó aprobada con AV6)*:

- la versión reducida;
- la ubicación en la consulta en reposo (4.7 y 4.8; la composición revisada de 4.8, §29.4);
- los hallazgos de §27.4 y §28.5 pendientes.

No se ha aprobado ningún `AV#`.

## 30. B1 — AV6 registrada y versión reducida de los gags para AV4 (T066, prototipo)

Fecha: 2026-11-11. Fuentes normativas, Design Lab y su registro. No se toca producción, ni los controladores, ni las máscaras. Sin commit ni push. **AV4 sigue sin marcar y T066, abierta.**

### 30.1 Dónde consta AV6

La autora aprobó AV6 el 2026-11-11: las ubicaciones de 4.7, 4.8 y 4.9 y el umbral de inactividad de 150 000 ms.

| Decisión | Única fuente |
|---|---|
| Ubicación en la consulta en reposo: la insignia en una columna (4.7) y el retrato de 384 px desde 1080 px (4.8), sin otra Sofi | `008-spec.md` §5 (nueva) |
| Ubicación en el expediente (4.9) | `008-spec.md` §5 (ya constaba desde el 2026-11-10) |
| Composición de la consulta ancha: retrato entero, diálogo sin solape y texto legible en reposo y durante los gags; la etiqueta «Sofi», por encima del retrato cuando coinciden | `art-direction/README.md`, decisión 11 (reescrita) |
| `are-u-still-here`: 150 000 ms, definitivos | `008-plan.md` §6 |

Trazabilidad, sin copiar las decisiones:

- **`008-tasks.md`:**
  - AV6 marcada, con remisión a sus fuentes;
  - T066 dice que solo queda la versión reducida (AV4);
  - T086 no cambia el layout, y el solape de la consulta ancha lo retira T088;
  - T087 remite a la decisión 11 para la composición y la etiqueta.
- **`008-plan.md`:** §6 (superficies e inactividad) y §9, punto 6.
- **`008-spec.md`:** en «Provisional and pending» solo queda la versión reducida de los gags. Además, el umbral remite al plan.

**Decisión 11.** Ya no da el rango de «1080 a unos 1245 px». Sin solape, la etiqueta sobresale siempre por encima del borde del diálogo (§29.4.3), así que coincidir con el retrato depende de la anchura de la columna y del tamaño del texto. El README lo dice así, sin cifras.

### 30.2 Qué cambia en el Lab

- **Textos:**
  - 4.7 y 4.8 pasan a «Prototipo T066 · pendiente AV4»;
  - las notas de 4.7, 4.8 y 4.9 dicen que la ubicación y la inactividad están aprobadas (AV6) y cómo ver la versión reducida;
  - comentarios en `gagBadge.ts`, `gagWide.ts`, `GagsWideSpec.module.scss` y la prueba de contrato.
- **Rótulo:** la tira de 4.7 y la columna de 4.8 dicen «Movimiento reducido · sin gags» con movimiento reducido. Antes decían «Completo · gags vivos» también entonces.
- **Cómo se presenta la versión reducida.** Se ve con «Reducido» en Movimiento, en la cabecera del Lab, que es el mismo mecanismo que en producción. Los marcos de 4.9 lo reciben por la URL. No hay una copia reducida aparte en 4.8 ni en 4.9:
  - el documento tiene un único `data-motion` (plan §4.1), así que una copia en la misma página no estaría reducida de verdad;
  - la tira «Movimiento reducido» de 4.7 es una imagen fija del fotograma 0, y la nota lo dice.

**Defecto del Lab corregido.** Con un gag activo, pasar a reducido (o desmarcar el gag) dejaba la lectura «Gag activo» en ese gag, aunque ya no había ninguno.

- **Causa:** `ambient` libera al gag activo al darlo de baja, sin pasar por `deactivate`, y el envoltorio del Lab (`observeAmbient`) no avisaba de la baja. **Producción no tiene el defecto:** `ambient` ya libera bien, y lo prueba «dar de baja el gag activo libera a los demás» (`ambient.test.ts`).
- **Corrección:** `observeAmbient` avisa con `unregister`. `gagReducer` libera al gag activo y anota «‹gag› se desmonta»; si no era el activo, no anota nada. Vale para 4.6–4.9, que comparten el registro.
- **Pruebas (RED primero):** 4 en rojo antes de corregir:
  - `gagLog.test.ts` (nuevo);
  - las 2 de `observeAmbient.test.ts`, de las que la de baja cambia de expectativa: ahora la anota;
  - la de 4.8 «pasar a reducido con poking en marcha»: las capas ya desaparecían y solo fallaba la lectura.

  El rótulo también tuvo su RED: 2 pruebas, una en 4.7 y otra en 4.8.

### 30.3 Verificación de la versión reducida

Servidor propio (5188), con los controladores y el CSS reales.

| Comprobación | Chromium | Firefox | WebKit |
|---|---|---|---|
| Tres vías (sistema en reducir con «Sistema»; sistema normal con «Reducido»; sistema en reducir con «Reducido»), en 4.7, 4.8 y los marcos de 4.9 a 390 y 1280 px: sin atributos de gag, capas ni animaciones vivas; lectura «Reducido…» | sí | sí | sí |
| Tras 5 toques o clics sobre Sofi, el puntero por encima y la espera: 0 píxeles cambiados, registro vacío, «Gag activo» en ninguno, ni capas ni atributos | 0 en todos | 0 en todos | 0 en todos |
| Control, sistema en reducir con «Completo»: gags vivos (12 capas) | sí | sí | sí |
| Pasar a «Reducido» en mitad de cada gag (`poking` escondida, `i-see-you` mirando, `are-u-still-here` dormida), en 4.7 y 4.8: a los 150 ms, sin atributos, capas ni animaciones y «Gag activo» en ninguno; en 4.8, 0 píxeles del texto tapados y el pie en el borde | sí, los 6 | sí, los 6 | sí, los 6 |
| Volver a «Completo»: renacen en reposo y responden (`curious`, `watching`, `drowsy` tras el umbral) | sí | sí | sí |

La espera es de 151 s de reloj simulado (más que el umbral aprobado) en Chromium y WebKit. En Firefox, el reloj simulado de Playwright impide montar la página, así que se usa tiempo real: 7 s con la inactividad al mínimo del Lab (5 s) en 4.7 y 4.8, y en los marcos de 4.9 solo los toques y el puntero.

**Pose de reposo (F0), Chromium, claro y oscuro:**

- 4.7 reducida frente a su copia fija del fotograma 0: 0 de 19 096 píxeles distintos;
- 4.8 reducida frente a `sofi-blink` en «Completo» con sus animaciones paradas en el instante 0: 0 de 147 456.

**axe** (WCAG 2.2 AA, sistema en reducir) en 4.7, 4.8 y 4.9:

- 0 violaciones a 1440 px en claro y en oscuro, a 1280 con el texto al 200 % y a 390;
- sin desbordamiento horizontal de la página;
- los marcos de 4.9 a 390 y 1280 px, en claro y en oscuro: 0.

**Capturas de la sesión,** en `shots\`:

- `r3-<tema>-4.7`, `r3-<tema>-4.8-384` y `-460`, `r3-<tema>-4.9-movil` y `-escritorio`: la versión reducida;
- `r2-<motor>-<sección>-<gag>-antes` y `-reducido`: el cambio a mitad de gag;
- `r1-<motor>-…`: el estado reducido tras toques y espera.

Lo que muestran:

- En las tres ubicaciones, Sofi entera en reposo.
- En 4.8 y 4.9, el busto apoyado en el borde del diálogo y el texto legible.

### 30.4 Hallazgos

Numerados para decidirlos por número.

1. **«Gag activo» se quedaba en el gag que estaba activo. RESUELTO** (30.2): es solo del Lab.
2. **Firefox: `InvalidStateError` en la consola al cambiar el selector de movimiento del Lab.**
   - Sale cuando se recargan los marcos (`iframe`): en Motion & Sound, los dos de 4.9; en la sección Perfil (004, sin gags), los suyos. En las secciones sin marcos que se recarguen, no sale.
   - No sale al abrir o cerrar un marco suelto, ni en Chromium.
   - Sin efecto visible. No es de T066, ni lo introduce este cambio: la sección Perfil también lo da.
   - No se ha investigado la causa. Se anota para T073/VT6.
3. **Zona sensible inerte con movimiento reducido.** En 4.7 y 4.8 el `::after` del anfitrión existe aunque no haya controladores. Recibe el toque y no pasa nada (0 píxeles, sin registro). En producción, T088 decide si existe con movimiento reducido.
4. **Medida aislada en Firefox, sin reproducir.** Una medida de r2 con movimiento completo dio 15 444 píxeles del texto «tapados» al entrar en `hide` en 4.8.
   - Su captura muestra el texto despejado.
   - En cinco repeticiones del mismo escenario dio 0, y también fotograma a fotograma en §29.3.
   - No se ha identificado la causa. No cambia lo medido en §29.
5. **Del arnés, no de la página.** El reloj simulado de Playwright sustituye `performance` y el Lab da 2 errores (`performance.addEventListener is not a function`). Sin el reloj, 0.

### 30.5 Pendientes de T066 antes de proponer su cierre

1. **AV4, versión reducida de los gags.** *(Sustituido el 2026-11-12: nueva dirección de la autora, los gags se conservan en reducido; propuesta en §31.)* Es de la autora. La propuesta era «sin gags, Sofi en su pose de reposo (F0), tocarla no hace nada», que es lo que ya decide D-1 y una de las opciones del catálogo (§4 y §7.2). La alternativa del catálogo son reacciones estáticas breves, o la pose de sueño fija para `are-u-still-here`. Exigiría montar controladores con movimiento reducido, contra D-1, así que habría que revisar D-1 antes de prototiparla. Las poses reducidas de los demás recursos son de T069, no de T066.
2. **La suite completa.** Resultado de esta sesión en 30.6.
3. **Nada más de T066:**
   - candidatas y ubicaciones: §25, §27, §28 y AV6;
   - inactividad: AV6;
   - versión reducida: esta sección;
   - precisión de la zona sensible: §28.12–28.15.

   Lo que queda en §27.4 y §28.5 es de T088 (`SofiPortrait` y `ProfileSheet` sin anfitrión expuesto, causa de foco en producción) o de AV4. Además, en producción hay un comentario de `useSofiController.ts` que todavía dice que el umbral lo aprueba AV6; se actualiza en T088, que es quien toca ese archivo.

### 30.6 Pruebas y comprobaciones

- **Suite completa** (`vitest run`, sin navegadores en marcha): 128 archivos, **2 477 de 2 477**. Esta vez pasan también las dos de 4.3 que en §29.3 superaron los 5 s con la máquina cargada. No se ha investigado aquella causa.
- **Lab de los gags** (`src/design-lab/sections` y `profile`, con `gagWide.contract.test.tsx`): 291 de 291 en tres ejecuciones.
  - Una cuarta, la primera tras editar, dio 1 fallo que no se repitió. Su marco de error apuntaba a la línea 584, que solo existe en `InspectorSpec.test.tsx` (4.5, sin cambios aquí).
  - Es el segundo fallo aislado del Lab sin identificar (el otro, en §29.3).
- **Tipos, lint y formato:** `tsc -b`, `eslint .` y `prettier --check .`, sin errores.

**Siguiente tarea:** T066 sigue abierta, solo a la espera de AV4 (30.5.1). No se ha marcado AV4 ni se ha avanzado T067.

## 31. B1 — Versión reducida de los gags: propuesta con los gags conservados (T066, AV4 pendiente)

Fecha: 2026-11-12. Solo Design Lab, más la dirección en la spec. No se toca producción (`useSofiController`, `ambient`, `ConsultationScreen`, `ProfileSheet`), ni los controladores, ni los parciales, ni las tiras. Sin arte nuevo. Sin commit ni push. **AV4 sigue sin marcar y T066, abierta.** Sustituye a la propuesta «sin gags» de §30.5.1.

### 31.1 Dirección y dónde consta

La autora aprobó el 2026-11-12 una dirección: conservar los tres gags también con movimiento reducido, en versiones estáticas o mínimamente cambiantes, sin movimiento continuo ni seguimiento animado. Consta en `008-spec.md` §5. La versión concreta de cada gag es AV4.

**Contradicción abierta (31.5.1).** Plan §6 dice que el adaptador monta el controlador solo si el estado efectivo no es reducido, y lo mismo D-1 en plan §4. La dirección nueva exige cambiarlo. No se ha tocado: cambiarlo es tocar `useSofiController` (producción), y hay que consultarlo.

### 31.2 Cómo se prototipa

- **Las máquinas de estados de los ZIP, sin modificar.** `createPokingMachine`, `createISeeYouMachine` y `createStillHereMachine` las ofrece cada controlador para «pintar tú las capas» (comentario de cabecera de cada `.js`).
- **Las poses fijas de cada parcial.** Los tres parciales ya definen una pose fija por estado y solo animan con `prefers-reduced-motion: no-preference` («se ven los mismos estados, sin desplazamientos»). Con movimiento reducido, la transformación de D-1 deja solo esas poses.
- **El Lab solo decide qué entradas cuentan y qué estado se pinta** (`src/design-lab/reducedGags.ts`).
- **`useReducedGag`** (`src/design-lab/useReducedGag.ts`) es el espejo del adaptador para movimiento reducido:
  - misma escena tranquila, mismas causas de pausa y un solo gag activo (`ambient`);
  - tiras decodificadas antes de aplicar la clase;
  - pausa con la pestaña oculta o fuera de pantalla;
  - limpieza completa.
- **`useLabGags`** junta los dos adaptadores en 4.7, 4.8 y 4.9: con movimiento completo, el de producción; con reducido, este. Nunca conviven.
- **La tira fija «Movimiento reducido · propuesta» de 4.7 se retira:** enseñaba la propuesta anterior. La versión reducida se ve con «Reducido» en Movimiento. El rótulo pasa a «Movimiento reducido · gags reducidos».
- **Una nota común** (`ReducedGagsNote`) en las tres secciones, y pistas del panel para reducido.

### 31.3 La propuesta, gag a gag

| | `poking` | `i-see-you` | `are-u-still-here` |
|---|---|---|---|
| **Se activa** | Toque o clic sobre la zona sensible de Sofi, como en completo. Teclado, no | Puntero quieto 1,2 s sobre la zona sensible, o el dedo apoyado ese tiempo (el `dwell` del controlador). Mover el puntero por la página no hace nada | Inactividad real con el umbral aprobado (150 000 ms), contada con la misma actividad que en completo (`ACTIVITY`) |
| **Qué se ve** | Un escalón por toque (cada 300 ms como mucho): curiosa con el «?» fijo, escéptica, «¡quieto!» con la palma y la vena fijas, y ofendida de brazos cruzados. Ahí se queda; a los 10 s sin toques, reposo | Pillada (cara 04 y la alerta «!» fija) 1,1 s; después, la sonrisa pícara (06) hasta el reposo, 4,2 s más | Somnolienta (fotograma 1 de `sofi-blink` con los párpados pesados y la boca de 01, quietos) mientras dura el adormecerse (9,4 s). Después, dormida (03) con los Zzz quietos hasta que vuelve la actividad. Al volver, la cara de pillada (05 sobre la pose 04) 3,1 s, y reposo. Si vuelve antes de dormirse, reposo directo |
| **Fotogramas** | `poking-face.webp` (celdas 0–2 y palma), `poking-fx.webp` («?» y vena), `poking.webp` (ofendida) | `i-see-you.webp` (pillada, sonrisa, alerta) | `sofi-blink` F1, `are-u-still-here.webp` (párpados, boca, dormida, pose 04, cara 05), `are-u-still-here-fx.webp` (Zzz) |
| **Se elimina** | Brinco, retroceso, sacudidas y bufido. El «?» que salta y flota y la vena que late. Y toda la parte de esconderse: escondida, asomada, «¡NOPE!» y volver a subir (Sofi desaparecía de golpe tras el borde) | Seguir al puntero por toda la página (escuchas en `document`, miradas en cinco direcciones) y pillarla «jugando» con él. El parpadeo al mirar, el respingo, la alerta que aparece y se va, la lengua con el destello (`tease`) y la risita con saltitos (`giggle`) | El parpadeo lento de somnolienta, las dos cabezadas (que, aun quietas, alternan la pose cuatro veces), los Zzz que flotan, el susto con su estallido y su temblor, y el balanceo de la cara de pillada |

### 31.4 Verificación

**Pruebas (RED primero):**

- `reducedGags.test.ts`, 11:
  - qué estados aceptan toques y qué se pinta;
  - las capas son las mismas que crea cada controlador del ZIP. Si un ZIP las cambia, falla.
- `useReducedGag.test.tsx`, 20, con las máquinas reales y la sonda de fugas:
  - **`poking`:** la secuencia de 8 toques; reposo a los 10 s; teclado no; gag activo en `ambient`.
  - **`i-see-you`:** el puntero por la página no cambia nada; en la página solo escucha `visibilitychange`; quieto encima → `caught`, `smirk` y reposo; si se va antes, nada.
  - **`are-u-still-here`:** nunca `nodding` ni `startled`; parte de 150 000 ms.
  - **Los tres:**
    - con movimiento completo no hace nada;
    - pasar a completo en mitad de la reacción lo quita del todo;
    - al irse, también con StrictMode, la sonda vuelve a la referencia.
- **Sensibilidad.** Tres mutaciones de `reducedGags.ts`, cada una detectada por 1 prueba, y el archivo restaurado (`cmp`):
  - aceptar toques en cualquier estado;
  - pintar la lengua y la risita;
  - pintar las cabezadas.
- **Pruebas que cambian de expectativa** porque cambia la dirección (antes afirmaban «sin gags»): las de reducido de 4.7, 4.8 y 4.9, y el estado del marco de 4.9, que ahora dice «escena tranquila, en versión reducida». Lab: 693 de 693.
- **Suite completa:** 130 archivos, 2 508 de 2 509. Falló «habla, calla en cada pausa…» de 4.3 (`MotionSync.test.tsx`, sin cambios aquí), por superar los 5 s.
  - Sola tarda 1,8–2,0 s; quitando los ganchos reducidos de `useLabGags`, 2,4–3,8 s. No lo causa este cambio (archivo restaurado, `cmp`).
  - La prueba monta Motion & Sound entera y avanza el reloj carácter a carácter. Con la suite en paralelo va al límite de sus 5 s; es la tercera vez (§29.3).
  - No se ha subido ningún tiempo de espera. Queda como pendiente: o la prueba monta solo 4.1 y 4.3, o se mide qué la encarece.
- **Tipos, lint y formato:** `tsc -b`, `eslint .` y `prettier --check .`, sin errores.

**Navegador** (servidor propio, 5188; «Reducido» en el Lab y, en 4.9, `motion=reduce`):

| Comprobación | Chromium | Firefox | WebKit |
|---|---|---|---|
| 4.7 y 4.8, `poking`: 6 clics reales sobre Sofi dan curiosa, escéptica, «¡quieto!» y ofendida tres veces | sí | sí | sí |
| `i-see-you`: el puntero por la página, reposo y mirada al centro; quieto encima, pillada; a los 1,6 s de la sonrisa, sigue la sonrisa; luego reposo | sí | sí | sí |
| `are-u-still-here` (inactividad al mínimo del Lab, 5 s): somnolienta, y 5 s después sigue somnolienta (sin cabezada); dormida; al pulsar una tecla, pillada (sin susto); reposo | sí | sí | sí |
| Animaciones vivas en Sofi, en cada uno de esos estados | 0 | 0 | 0 |
| 4.8: píxeles del texto del diálogo tapados, en cada estado | 0 | 0 | 0 |
| 4.9, marcos de 390 (toque) y 1280 px: los tres gags reducidos montados; 5 toques hasta ofendida; 0 animaciones vivas; «Volver a la consulta» libre; foco en una opción, los tres al reposo (spec §5) | sí | sí | sí |
| axe (WCAG 2.2 AA, sistema en reducir), 4.7, 4.8 y 4.9: 1440 claro y oscuro, 1280 con texto al 200 % y 390; marcos de 4.9 a 390 y 1280 en claro y oscuro | 0 violaciones, sin desbordamiento | — | — |

En Firefox, el toque de 4.9 a 390 px es un clic: Firefox no admite `isMobile`.

**Capturas,** en `shots\`:

- `r20-chromium-<sección>-<gag>-<estado>.png`, cada pose en 4.7 y 4.8;
- `r20-mosaico-4.8.png`, las diez poses juntas;
- `r21-chromium-<anchura>-ofendida.png`, 4.9.

### 31.5 Decisiones abiertas y riesgos

Numerados para decidirlos por número.

1. **D-1 y plan §6.** Para llevar esto a producción, el adaptador tendría que montar las máquinas también con movimiento reducido, con una variante como la del Lab o un modo de `useSofiController`. Es un cambio de producción y del plan (§4 y §6) que hay que consultar antes, después de AV4. Las pruebas de `useSofiController` que afirman «con reducido, nada» cambiarían de expectativa.
2. **«Reacción estática muy breve»** (catálogo §7.2, para `poking` e `i-see-you`):
   - en `poking` cada pose se queda hasta el siguiente toque o 10 s, el tiempo del controlador;
   - en `i-see-you` la reacción dura 5,3 s, con dos cambios.

   Se pueden acortar con la opción `timing` de las máquinas, que no modifica el controlador, pero no se ha hecho sin decisión.
3. **Cara de pillada sobre la pose del susto.** El parcial pinta la cara 05 sobre el cuerpo 04, el del susto, con el pelo revuelto: quieta, pero parece recién asustada. Alternativa con fotogramas existentes: volver directamente al reposo, sin cara de pillada, que pierde el «no he hecho nada». No se ha prototipado.
4. **Cambios de pose bruscos.** No hay movimiento, pero cada estado cambia la imagen de golpe. Los más grandes: ofendida (pose entera) y dormida, con el cuerpo más bajo. No son destellos (WCAG 2.3.1): `poking` se queda en ofendida tras cuatro cambios, y el controlador no cuenta toques a menos de 300 ms.
5. **`i-see-you` con el dedo:** hace falta una pulsación larga de 1,2 s sobre Sofi. Puede coincidir con gestos largos del sistema (menú contextual, lupa) en algunos dispositivos. Es de `015`.
6. **Sin seguimiento no hay «pillada jugando»:** solo se activa quedándose encima. Mantiene la intención (la pillan mirándola), pero es más difícil de descubrir.
7. **`are-u-still-here` sigue escuchando la actividad en la página** (como en completo). Lo permite spec §5, porque el gag puede activarse. `i-see-you` reducido, en cambio, no escucha en la página.
8. **4.6 (Escenarios)** sigue sin gags con movimiento reducido: no es una de las ubicaciones y no se ha tocado.

### 31.6 Límites

- Las tres vías de reducido (sistema, «Reducido» y las dos a la vez) comparten `useReducedMotion`, y en §30.3 se comprobó que coinciden. Esta propuesta se ha medido con «Reducido» del Lab (y `motion=reduce` en 4.9), no con las tres por separado.
- La inactividad real de 150 s solo se comprueba con reloj simulado (prueba de `useReducedGag`); en el navegador, con el mínimo del Lab (5 s).
- Safari real, lectores de pantalla y dispositivos son de `015`.

**Siguiente tarea:** T066 sigue abierta, a la espera de AV4 sobre esta propuesta (31.3) y de las decisiones de 31.5. No se ha marcado AV4 ni se ha avanzado T067.

## 32. B1 — Versión reducida: `poking` con 5 s de espera (T066, AV4 pendiente)

Fecha: 2026-11-12. Solo los prototipos de movimiento reducido del Design Lab. No se toca producción ni los controladores. Sin commit ni push. **AV4 sigue sin marcar y T066, abierta.**

### 32.1 Qué cambia

| | Antes (§31) | Ahora |
|---|---|---|
| `poking`: espera sin toques hasta el reposo | 10 s, el `TIMING.reset` del controlador | **5 s** (`POKING_REDUCED_RESET_MS`), pasados con la opción `timing` de `createPokingMachine`, que no modifica el controlador. Las cuatro reacciones estáticas no cambian |
| `i-see-you` | 5,3 s (pillada 1,1 s y sonrisa 4,2 s) | Igual |
| `are-u-still-here`: reacción al despertar | 3,1 s de cara de pillada | Igual |

Con movimiento completo, `poking` sigue con los 10 s del controlador (adaptador de producción, sin cambios).

También cambian la nota común de 4.7–4.9 y la pista del panel: «a los 5 s sin toques, reposo (en prueba; en completo, 10 s)».

### 32.2 Pruebas

- **`useReducedGag.test.tsx`, 29.** Las 6 de `poking` estaban en rojo con los 10 s y pasan con los 5 s:
  - 4 999 ms en la reacción y, 1 ms después, reposo;
  - lo mismo en cada una de las cuatro reacciones;
  - un toque que cuenta vuelve a empezar los 5 s;
  - en «ofendida» los toques no cuentan ni alargan la espera;
  - tras el reposo, otro toque empieza otra serie;
  - una causa de pausa congela la espera, y al quitarla sigue lo que faltaba.
- **Guardas de lo que no cambia,** en verde también antes del cambio:
  - **`i-see-you`:** 1 099 ms en pillada, 4 199 en sonrisa y luego reposo. Irse durante la reacción no la corta. Luego hay 15 s sin dejarse pillar, el reposo del controlador.
  - **`are-u-still-here`:** 3 099 ms en pillada y luego reposo; más actividad no la alarga. Desde el reposo, el umbral entero otra vez. Con actividad antes de dormirse, reposo directo.
- **`reducedGags.test.ts`:** fija la comparación (5 000 ms en reducido; `TIMING.reset` del controlador, 10 000).
- **Lab:** 703 de 703. La suite completa, en 32.5.

### 32.3 Navegador

Servidor propio (5188), tiempo real, muestreo cada 25 ms; 4.8 con «Reducido» y 4.9 con `motion=reduce`.

| Medida | Chromium | Firefox | WebKit |
|---|---|---|---|
| `poking`, un toque, hasta el reposo: reducido | 5,02 s | 5,09 s | 5,00 s |
| Lo mismo con movimiento completo (los 10 s anteriores) | 10,01 s | 10,34 s | 10,05 s |
| Reinicio: segundo toque a los 3 s (escéptica); reposo tras ese toque | 5,03 s | 5,09–5,20 s | 5,03 s |
| Cuatro toques, `curious`→`skeptical`→`stop`→`offended`; dos toques más en ofendida no cuentan; reposo tras el 4.º | 5,01 s | 5,07–5,22 s (véase 32.4.3) | 5,03 s |
| «Sofi ocupada» de los 2 a los 8 s: a los 8 s sigue curiosa; reposo tras quitarla (faltaban 3 s) | 2,97 s | 2,18 s | 2,79 s |
| `i-see-you`: pillada / sonrisa / total | 1,07 / 4,22 / 5,30 s | 0,90 / 4,25 / 5,15 s | 1,08 / 4,29 / 5,37 s |
| `are-u-still-here`: de la tecla a la pillada / al reposo | 0,01 / 3,08 s | 0,05 / 3,31 s | 0,01 / 3,13 s |
| 4.9 (390 px): `poking` hasta el reposo | 5,02 s | 5,26 s | 5,02 s |
| 4.9: foco en una respuesta, los gags al reposo (spec §5) | sí | sí | sí |
| Animaciones vivas en Sofi | 0 | 0 | 0 |

Las diferencias de algunas centésimas, o pocas décimas en Firefox, son del muestreo y de la carga: los tiempos los dan los temporizadores del controlador.

**axe** (WCAG 2.2 AA, sistema en reducir), 4.7, 4.8 y 4.9:

- 0 violaciones a 1440 en claro y en oscuro, a 1280 con el texto al 200 % y a 390;
- sin desbordamiento;
- los marcos de 4.9 en claro y oscuro: 0.

### 32.4 Hallazgos

1. **Tocar a Sofi con el foco en una respuesta (4.9) la hace reaccionar,** en reducido y en completo por igual, en los tres motores. El toque saca el foco del control (queda en `body`), así que deja de haber causa `interaction` y los gags se reanudan. Es la regla aprobada del foco nativo (spec §5: el foco no se fuerza). No es una regresión de la propuesta reducida.
2. **«Sofi ocupada» congela la espera:** los 5 s cuentan solo el tiempo sin causas de pausa, como en completo.
3. **Firefox, una medida aislada sin reproducir.** En la primera ejecución completa del guion, un toque en «ofendida» dio `curious`, y el reposo llegó a los 10,62 s del 4.º toque. En dos ejecuciones completas más, y en dos aisladas con registro de cada cambio, da lo esperado: los toques se ignoran y el reposo llega 5,03–5,22 s después. No se ha identificado la causa.
4. **Servidor:** al relanzar el de 5188, el anterior seguía vivo (huérfano tras pararlo). Se cerró por su PID, comprobando antes que era el de 5188.

### 32.5 Contradicciones y decisiones abiertas

Numeradas para decidirlas por número.

*(Actualización del mismo día: la autora aprobó la versión reducida; las cinco quedan resueltas en los documentos en §33.2–§33.3, y el mecanismo de producción, pendiente en §33.8.)*

1. **D-1 y plan §6:** siguen como en §31.5.1. La propuesta exige montar las máquinas con movimiento reducido. El cambio es de producción y hay que consultarlo tras AV4.
2. **Catálogo, ficha de `poking`:** «vuelve al reposo tras el descanso/reinicio previsto por su controlador». Con movimiento reducido el reinicio ya no es el previsto (10 s), sino 5 s, aunque se pase por una opción del propio controlador. Si se aprueba, habría que decir en el plan (§6) que en reducido el reinicio es otro. No contradice el catálogo §7.2 («reacción estática muy breve»), al que se acerca más.
3. **Spec §8, excepción de `poking` (conserva su velocidad original, 1×).** No es un cambio de velocidad: solo cambia un tiempo, solo en reducido, y la pausa entre toques sigue en 300 ms. Pero se puede leer como una excepción a esa excepción. Si se aprueba, conviene dejar claro en la spec o en el plan que el 1× es de velocidad y no impide un reinicio propio en reducido.
4. **`i-see-you` dura 5,3 s.** Es más que «muy breve» (catálogo §7.2), aunque son dos caras quietas. Se mantiene por decisión de la autora. Para WCAG 2.2.2 no es contenido que se mueva o parpadee: dos cambios de imagen.
5. **`are-u-still-here`:** los 3,1 s de la cara de pillada siguen sobre la pose del susto (§31.5.3).

**Suite completa:** 130 archivos, **2 519 de 2 519** (esta vez, también las de 4.3). `tsc -b`, `eslint .` y `prettier --check .`, sin errores.

**Siguiente tarea:** T066 sigue abierta, a la espera de AV4 sobre esta propuesta y de las decisiones de 32.5 y 31.5. No se ha marcado AV4 ni se ha avanzado T067.

## 33. B1 — Versión reducida de los gags aprobada: fuentes normativas y criterios de T066

Fecha: 2026-11-12. Fuentes normativas, copy y comentarios del Design Lab. No se toca producción (`useSofiController`, `ambient`, pantallas), ni los controladores, ni los parciales, ni las tiras. Sin commit ni push. **AV4 sigue sin marcar** (quedan las poses reducidas, T069), **T066 sigue abierta** a la espera de la autora, y no se avanza T067 ni T088.

### 33.1 Dónde consta la aprobación

La autora aprobó el 2026-11-12 las versiones reducidas de los tres gags tal como están en el Lab (§31), con el retorno de `poking` a los 5 s (§32). Cada parte vive en una sola fuente; aquí solo se remite:

| Qué | Fuente |
|---|---|
| Regla general: reacción estática frente a animación completa | Catálogo §7.2 (párrafo nuevo y filas de los gags) |
| Versión de cada gag | Catálogo, fichas 006, 008 y 009 («Reducido»; en 006, también «Termina») |
| Mecanismo, entradas, estados pintados y espera de 5000 ms | `008-plan.md` §6 |
| Requisito de la feature | `008-spec.md` §5 (remite a las dos anteriores), §6, §7, §8 y un criterio nuevo en «Easter eggs y controladores» |
| Estado de AV4 y tareas afectadas | `008-tasks.md`: T066, AV4, T073, C5, T087 y T088; plan §9, punto 4 |

### 33.2 Contradicción con D-1 y el plan §6, resuelta en los documentos

- **D-1 no prohíbe nada de esto.** Solo fija la transformación PostCSS de los módulos dueños, y es la que deja con reducido las poses fijas de cada estado que pinta la reacción estática. No cambia. En §30.5.1 y §31.5.1 se atribuyó a D-1 algo que decían otras frases; consta aquí la corrección.
- **Lo que chocaba** era «lo monta solo si … el estado efectivo no es reducido» (plan §6), junto con «detener CSS y JS» y «limpiar temporizadores de animación» (catálogo §7.2, spec §7 y su criterio, checklist del catálogo). Además, el catálogo §6.3 contaba «motion reduce» entre las causas de pausa.
- **Resolución:** el catálogo §7.2 distingue la **animación completa** (el controlador `attach*`, que con reducido no se monta nunca) de la **reacción estática** (la máquina de estados del mismo ZIP, que cambia de pose fija sin movimiento). Las demás frases remiten a esa distinción. La de plan §6 sigue siendo cierta para el controlador completo, y la sigue el bloque nuevo.

### 33.3 Las contradicciones de §32.5, una por una

1. **D-1 y plan §6:** resuelta en 33.2. Queda el mecanismo de producción (33.6).
2. **Ficha de `poking` («reinicio previsto por su controlador»):** la ficha dice ahora que, con reducido, vuelve al reposo tras la espera de su versión reducida, y el valor está en plan §6.
3. **Excepción de `poking` a 1× (spec §8):** aclarada: es de velocidad y no impide la espera de la versión reducida.
4. **«Muy breve» del catálogo §7.2:** la fila ya no lo dice; remite a las fichas, que describen la reacción aprobada, incluidos los 5,3 s de `i-see-you`.
5. **Cara de pillada sobre la pose del despertar:** aprobada tal como está; plan §6 lo describe.

### 33.4 Coherencia documental

- Se buscaron en la constitution, la spec, el plan, las tareas y `AGENTS.md` estas frases: «motion reduce», «muy breve», «desactivación del gag», «gag desactivado», «supresión de la secuencia», «versión reducida de los easter eggs», «pendiente (de) AV4», «no es reducido», «sin controlador», «controladores JS», «JS activo», y «reducido» cerca de «controlador». No queda ninguna sin matizar. Las de §30–§32 de este registro son históricas y no se reescriben.
- `tech-stack.md`, `roadmap.md` y `art-direction/README.md` no dicen nada del comportamiento reducido de los gags.
- **Duraciones:** no se copian. Plan §6 fija solo la espera de `poking` (5000 ms), que es un valor propio de Ask Sofi, como el umbral de inactividad. Los demás tiempos son los del controlador; las cifras medidas, en §32.3.

### 33.5 Design Lab

- La nota común de 4.7–4.9 pasa a «Movimiento reducido (aprobado el 2026-11-12)», sin «en prueba». El rótulo de las tres secciones pasa a «Prototipo T066 · aprobado, producción en T088», y su lectura, a «Reducido: gags en versión reducida».
- La nota de la zona sensible dice ahora que la mirada por toda la página de `i-see-you` es solo con movimiento completo. Con reducido no la hay, y antes la nota lo daba por hecho en los dos modos.
- Los comentarios de `reducedGags.ts`, `useReducedGag.ts`, `useLabGags.ts`, `gagBadge.ts`, `gagWide.ts`, `gagProfile.ts`, `SheetGags.tsx`, `GagBadge.tsx`, `GagPortrait.tsx` y sus pruebas remiten a la aprobación.
- **Pruebas:** las de 4.7 y 4.8 sobre la nota se cambiaron antes que el copy y se vieron fallar. Comprueban el texto aprobado, que no queda «en prueba» ni ninguna mención a AV4, y el rótulo de T088. La de 4.7 comprueba también la nota de la mirada. Sin cambios de comportamiento: las 29 de `useReducedGag` y las 12 de `reducedGags`, sin tocar, siguen en verde.

### 33.6 Criterios de T066

| Criterio (`008-tasks.md`) | Estado | Evidencia |
|---|---|---|
| Dos candidatas de ubicación, consulta en reposo y expediente | Cumplido; ubicación aprobada (AV6) | §25, §27–§30 |
| Inactividad ajustable, 150 000 ms aprobados | Cumplido (AV6) | §25, §30 |
| Versión reducida propuesta | Cumplido; aprobada el 2026-11-12 | §31–§32, 33.1 |
| Zona sensible con la precisión de spec §5 y sus excepciones | Cumplido | §28.12–§28.15 |
| Investigación de precisión táctil concluida | Cumplido, sin defectos funcionales nuevos | §28.15.3, §31, §32 |
| Lab: componentes nuevos visibles y con pruebas (`AGENTS.md`) | Cumplido | §25–§33 |
| Pruebas, tipos, lint, formato | Véase 33.7 | — |
| Responsive y accesibilidad | axe 0 y sin desbordamiento en 4.7–4.9; solo cambia el texto de las notas | §31, §32.3 |

**Propuesta:** con la aprobación de la autora, T066 puede cerrarse. No se marca aquí.

### 33.7 Ejecución

- Lab: **703 de 703**.
- `tsc -b`, `eslint .` y `prettier --check .`, sin errores.
- Suite completa, dos ejecuciones: **2 518 de 2 519** y **2 517 de 2 519**. Solo fallan pruebas de `MotionSync.test.tsx` (4.3), por pasar de los 5 s de su tiempo límite: en la primera, «habla, calla en cada pausa…»; en la segunda, esa (7,9 s) y «no se repinta por carácter» (7,6 s). El archivo solo pasa 13 de 13 dos veces seguidas (1,9 s la más lenta), y en la ejecución del Lab entero también. Este turno no toca nada que use 4.3: solo textos y comentarios. **No es verde:** consta como pendiente en 33.8.

### 33.8 Decisiones de arquitectura pendientes de la autora (para T088)

Constan en plan §6 como pendientes; no se decide ninguna aquí.

1. **Dónde vive la reacción estática en producción.** Opciones:
   - un modo de `useSofiController`, el mismo hook que elige completo o reducido;
   - un adaptador hermano, como el `useReducedGag` del Lab;
   - un hook que componga los dos, como `useLabGags`.
2. **Dónde viven las reglas de entradas y estados pintados** (`pokingAccepts`, `seeYouShown`, `stillHereShown` y la espera de 5000 ms): hoy, en `src/design-lab/reducedGags.ts`. Producción no puede importar del Lab (D-4), así que habría que moverlas a la capa visual (`visual/`) o junto al adaptador.
3. **Las capas del controlador** (`REDUCED_LAYERS`) son una copia del marcado que crea cada `attach*`, que no lo exporta. Una prueba de contrato las compara. Las opciones son:
   - aceptar la copia con su prueba;
   - pedir al repositorio de spritesheets que exporte las capas (un recurso nuevo: fuera de esta feature).
4. **Cambio de expectativa en las pruebas de `useSofiController`** que afirman «con reducido, nada»: pasarían a «con reducido, ni controlador completo ni animaciones, y la reacción estática».
5. **Escuchas de `are-u-still-here` con reducido:** la actividad se escucha en el documento, como con el controlador completo. Lo permite spec §5 (el gag puede activarse), pero sigue el riesgo de plan §12 («Listeners globales»).

**Otros puntos abiertos, no de arquitectura** (§31.5):

- `i-see-you` en táctil se activa dejando el dedo apoyado 1,2 s, lo que puede chocar con la pulsación larga del sistema (`015`).
- La sección 4.6 (Escenarios) no muestra los gags reducidos.
- **`MotionSync.test.tsx` (4.3) con la suite completa** (33.7): dos de sus pruebas pasan de los 5 s, con 1,9 s ejecutadas solas. Ya ocurrió en §32, y un A/B de entonces lo descartó como efecto de T066. No se ha subido el tiempo límite. Queda investigar la causa; parece que esas pruebas van en tiempo real con la suite cargada. Es de T063, no de T066.

**Siguiente tarea:** T066, a la espera de que la autora apruebe su cierre (33.6) y decida 33.8 antes de T088. No se ha marcado AV4 ni se ha avanzado T067.

## 34. B1 — Cierre de T066 y diagnóstico de los tiempos límite de 4.3

Fecha: 2026-11-12. La autora pidió cerrar T066 si se cumplen sus criterios y verificaciones (`008-tasks.md`; `tech-stack.md` §42.7). Sin cambios de código de producción ni del Lab en este registro, salvo copias temporales de diagnóstico, ya borradas. Sin commit ni push. **AV4 sigue pendiente de T069**, la arquitectura de T088 no se decide (§33.8) y no se avanza T067.

### 34.1 Criterios y evidencias

Los de §33.6, revisados con sus registros:

- **Ubicación y candidatas:** cumplido, aprobado con AV6 (§25, §27–§30).
- **Inactividad ajustable:** cumplido, 150 000 ms aprobados con AV6 (§25, §30).
- **Versión reducida:** aprobada el 2026-11-12 (§31–§33).
- **Zona sensible y su precisión:** cumplido (§28.12–§28.15).
- **Precisión táctil:** investigación concluida, sin defectos funcionales nuevos (§28.15.3, §31, §32).

**Verificaciones propias (§42.7: pruebas de la tarea, tipos y lint):**

- Lab, **703 de 703**, incluidas las 29 de `useReducedGag`, las 12 de `reducedGags` y las de 4.7, 4.8 y 4.9.
- `tsc -b`, `eslint .` y `prettier --check .`, sin errores.

Todo es de la última ejecución tras el último cambio de código (§33.5 y §33.7). Desde entonces solo han cambiado documentos, así que no se repite.

**Navegador:** tres motores, axe 0, sin desbordamiento y 0 animaciones vivas (§31, §32.3). Los textos de las notas cambiaron después (§33.5). No se ha vuelto a pasar axe con ellos: son texto dentro de las mismas `LabNote`, y queda para T076, que audita estas secciones.

**T066 se marca completada.**

### 34.2 Diagnóstico de `MotionSync.test.tsx`

**Síntoma:**

- Con la suite completa, «habla, calla en cada pausa…» y «no se repinta por carácter» pasan del tiempo límite por defecto de 5 s: 5,5–7,9 s, en tres ejecuciones completas de §32 y §33 (en la última de §32 pasó).
- El archivo solo pasa, con 1,9–2,5 s la más lenta.
- No se ha cambiado ningún tiempo límite.

**Método:** dos copias temporales de la prueba, con 4 ejecuciones aisladas de cada variante, alternadas y decididas de antemano. Las copias estaban instrumentadas para contar pasos, temporizadores y elementos, y medir con el reloj real (`performance.now`, guardado antes de los temporizadores falsos, que también falsean `performance` y `process.hrtime`):

- **A:** como es, con 4.7–4.9;
- **B:** con `GagsSpec`, `GagsWideSpec` y `GagsProfileSpec` sustituidas por `null`.

**Resultados:**

| Medida | A (con 4.7–4.9) | B (sin ellas) |
|---|---|---|
| Pasos de `runToEnd` | 215 | 215 |
| Temporizadores pendientes al terminar | 1 | 1 |
| Elementos en el documento | 789 | 539 |
| «habla, calla…» (3 ejecuciones) | 2,44–2,70 s | 1,93–2,30 s |
| «no se repinta…» (3 ejecuciones) | 2,01–2,16 s | 1,53–1,73 s |
| Montar la sección (`open`, 2 ejecuciones) | 286–302 ms | 198–202 ms |
| Preparar el texto y reproducir (2 ejecuciones) | 1 011–1 036 ms | 602–684 ms |
| Recorrido letra a letra (`runToEnd`, 2 ejecuciones) | 1 152–1 238 ms | 1 045–1 198 ms |

Las secciones de 4.7–4.9 se pintan una vez en toda la pasada, no en cada letra: el recuento con un envoltorio da 2 pintados.

**Conclusiones:**

1. **No es un defecto de T066 ni de 4.3.**
   - 4.7–4.9 no añaden pasos, temporizadores ni repintados al habla de 4.3.
   - Las aserciones nunca fallan: solo vence el tiempo.
   - Las pruebas de T066 no fallan.
2. **La causa es el coste de CPU de las dos pruebas.** Montan Motion & Sound entera y recorren 215 pasos con `act()`. Solas tardan unos 2–2,5 s; con la suite completa en paralelo van 2,5–3,5 veces más lentas y pasan de 5 s. Sin 4.7–4.9 tardan 1,5–2,3 s, también sin margen ante esa carga.
3. **T066 sí las encarece, un 20–30 %.** No es por el habla, sino por montar la sección (+0,1 s) y por preparar el texto (+0,35–0,43 s). La preparación busca los controles en todo el documento (`screen.getByRole`, `getByLabelText`), y 4.7–4.9 añaden 250 elementos, muchos de ellos controles.

### 34.3 Pendiente e incertidumbre

- **Pendiente, de T063 y no de T066:** quitar el margen sin tocar el tiempo límite. Una vía es buscar con `within` dentro de 4.1, en vez de en todo el documento. Otra es pintar solo 4.1 y 4.3 en lugar de Motion & Sound entera. No se hace aquí, por ser un cambio ajeno a T066. Mientras tanto, la suite completa puede fallar por tiempo en máquinas cargadas, también en CI.
- **Incertidumbre:**
  - El reparto dentro de la preparación (búsquedas frente a pintado del cambio de texto) se infiere, no se midió por separado.
  - No se midió el desglose con la suite completa: el factor de carga sale de comparar los tiempos aislados con los de la suite.
  - No se sabe con qué frecuencia falla en CI.

**Siguiente tarea:** T067, que no se ha empezado.
