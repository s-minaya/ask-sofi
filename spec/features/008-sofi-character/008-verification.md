# 008 — Sofi Character & Motion — Verification

## Status

En curso. Registrados T001 y EX1 (2026-10-27) y revisados el mismo día con las cuatro decisiones aprobadas de plan §11.2: EX1 como línea base reproducible, sin umbral automático de FCP, `gzipSync` con opciones fijas y comparaciones A/B intercaladas. Registrados también T002 y T003 (2026-11-03): inventario y verificación de los 13 ZIP, sin discrepancias (§3). T004–T008 y VT1 completados (2026-11-03); la incidencia de pruebas de §4.4 está resuelta. El resto de los hitos de `008-tasks.md` no se ha ejecutado.

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
