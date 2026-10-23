# Procedencia artística y técnica de los spritesheets de Sofi

**Proyecto:** Ask Sofi · repositorio de spritesheets  
**Corte documental:** 21 de octubre de 2026, actualizado el 23 de octubre de 2026 (§8)  
**Alcance:** entregas `001`–`015`, excluida `007-listening` (sin spritesheet exportado)

## 1. Propósito y alcance

Este documento describe **cómo se obtuvo y preparó el arte**, qué parte del proceso fue humana, qué herramientas de IA participaron y qué puede comprobarse. No es una declaración de ilustración manual íntegra, una certificación de autenticidad ni una garantía de reproducibilidad universal.

La **función, activación, interrupciones y accesibilidad** de cada animación se definen en el catálogo de animaciones (`animation-catalog.md`); este documento no duplica esas reglas. Los tiempos y fotogramas efectivos pertenecen a los parciales SCSS y a los controladores de cada animación.

## 2. Autoría y contribuciones

- **Origen creativo declarado por la autora:** el personaje partió de un GIF original de Sofi que la autora dibujó a través de la app Pixquare. 
- **Dirección artística y producto — autora:** identidad del personaje, briefings individuales, selección y aprobación de expresiones y secuencias, solicitudes de corrección y decisiones sobre sus usos en la interfaz.
- **Generación asistida por IA — ChatGPT:** los PNG utilizados como fotogramas fuente se desarrollaron con asistencia generativa. En 92 de los 93 PNG examinados hay manifiestos C2PA cuyas cadenas atribuyen la creación a `ChatGPT` / `gpt-image` y los califican como `trainedAlgorithmicMedia`. La auditoría **leyó** esos manifiestos, pero **no validó criptográficamente sus firmas**. El origen del archivo restante, `010-needs-context/img/nmc-question-mark.png`, no está acreditado por metadatos de procedencia.
- **Procesamiento, composición y exportación — Claude Code:** sesiones de Claude generaron y ajustaron las salidas WebP y sus recursos auxiliares con código de procesamiento de imágenes, siguiendo las decisiones visuales indicadas por la autora. Las sesiones auditadas emplearon los modelos `claude-opus-5-5` y `claude-sonnet-5-5`.
- **Retoques manuales de la autora:** se realizaron algunos ajustes con iPad durante el desarrollo.

## 3. Flujo técnico verificado

Las sesiones registradas entre el **9 y el 21 de octubre de 2026** procesaron imágenes mediante scripts propios de **JavaScript/Node.js**, principalmente con `sharp` (libvips/libwebp). El flujo general reconstruido a partir de registros y archivos fue:

1. **Selección y estabilización:** composición sobre un fotograma maestro; máscaras de diferencia, operaciones morfológicas y mezcla con alfa premultiplicado para evitar temblores de silueta entre fotogramas.
2. **Limpieza de transparencias:** normalización de alfa y eliminación de motas aisladas, según la animación.
3. **Normalización espacial:** reducción por media de área con alfa premultiplicado, normalmente a un lienzo de **384 × 384 px**. Ciertos efectos y atlas de recortes usan otras dimensiones justificadas.
4. **Normalización cromática:** cuantización k-means y reutilización de colores de referencias anteriores, a menudo reforzando la importancia de los colores de la cara. **No existe una única paleta de 64 colores para todos los archivos**: la auditoría identificó entre 16 y 211 colores por imagen, según el recurso.
5. **Ajustes especializados:** corrección geométrica de choker, ojos y boca; giros con supermuestreo; recoloreado por materiales en OKLab; re-pixelado selectivo; extracción de caras y efectos a atlas.
6. **Codificación:** WebP sin pérdida (`VP8L`; `lossless`, `effort: 6`). Algunos recursos se generaron con `exact: false`, que puede modificar los valores RGB ocultos detrás de alfa cero, no los píxeles visibles.
7. **Animación y entrega:** parciales SCSS con fotogramas únicos y tiempos propios; controladores JavaScript sin dependencias para ciertas interacciones complejas; `scripts/export.mjs` genera un ZIP independiente por recurso.

**Herramientas confirmadas por la auditoría:** Node.js 22.17.1, Sharp 0.35.5 (salvo versión no determinada para `001`), libvips 8.18.7, libwebp 1.6.0, Sass 1.105.1, `puppeteer-core` 25.13.0 y Microsoft Edge headless para inspecciones. `gifenc` se utilizó en un GIF derivado de demostración, no en las entregas principales.

Este resumen describe el **proceso observado**, no supone que todos los pasos o parámetros se aplicaran idénticamente a cada recurso.

## 4. Inventario de entregas y particularidades

| Entrega | Evidencia técnica distintiva | Sesión(es) de referencia |
|---|---|---|
| `001-sofi-blink` | Tres fotogramas únicos; evolución desde un borrador de 42 fotogramas; 64 colores. | `8b249ed0` |
| `002-sofing` | Seis fotogramas; manos y portátil estabilizados; composición de efectos; 128 colores (158 tras §8). | `e3120e3e` |
| `003-rolling` | Cinco fotogramas; giro corregido, choker reconstruido, re-pixelado y atlas de efectos. | `111a66cc` |
| `004-talking` | Reutiliza `sofi-blink.webp`; seis bocas definidas mediante mapas de caracteres en scripts. | `9ad0fa18`, `f42154ca` |
| `005-favoriting` | Compone sello y destellos; incorpora `sofi-approved.webp` del repositorio de Ask Sofi. | `f83d6a93`, `7dd15558` |
| `006-poking` | Composición por capas y controlador JS. `poking-hide.webp` recibió un reempaquetado posterior. | `9618e5db`, `984fc801` |
| `008-are-u-still-here` | Atlas de recortes, efectos independientes, retoques de choker y párpados; controlador JS. | `ffaddb54` |
| `009-i-see-you` | Atlas de expresiones y controlador JS; utiliza `talking.webp` como referencia. | `7dd15558` |
| `010-needs-context` | Escala normalizada, choker corregido, interrogación separada. | `e577f65f` |
| `011-error` | Choker y bocas ajustados mediante scripts; glitch definido en CSS. | `2aff27bc` |
| `012-eureka` | Reutiliza un fotograma de `needs-context`; sonrisa y choker corregidos. | `cd61009b` |
| `013-suspicious` | Ojos y boca rotados mediante transformación programática; transición intermedia. | `b4a2af61` |
| `014-uncertain` | Reutiliza recursos de `suspicious`; choker reconstruido. | `aeb8cbd0` |
| `015-memory-wipe` | Recoloreado por materiales en OKLab; disolución y partículas mediante CSS; se descartó un intento de re-pixelado. | `dfd72586` |

`007-listening` conserva imágenes de origen y briefing, pero **no produjo SCSS, WebP ni ZIP** y fue descartado del catálogo funcional del producto. Red Flags, Ghosting y Escaping the Div no pertenecen al conjunto aprobado de spritesheets.

## 5. Trazabilidad, límites y reproducibilidad

### Evidencias utilizadas

- **Archivos (`[A]`):** dimensiones y contenido de PNG/WebP, metadatos C2PA presentes, hashes, scripts existentes y estructura de ZIP.
- **Registros (`[R]`):** órdenes y resultados en **17 sesiones de Claude Code**, incluidas verificaciones de compilación, pruebas visuales y comprobaciones de reproducción.
- **Notas del agente (`[N]`):** contexto adicional, menos sólido que archivos o registros.
- **Inferencias (`[I]`):** no se presentan como hechos documentados.
- **Desconocido (`[D]`):** firmas C2PA no verificadas criptográficamente, origen técnico del GIF base, prompts exactos, procedencia de la interrogación de `010`, primer intento de `002` y versión exacta de Sharp en `001`.

### Estado al 21 de octubre de 2026

Las cifras y afirmaciones de esta sección describen el corte del 21-oct; donde cambiaron después, prevalece §8.

- Los **14 ZIP exportables** (001–006 y 008–015) coincidían byte a byte con los archivos correspondientes del repositorio local **en el momento de la auditoría**. Esto no implica que todos estén integrados en la aplicación Ask Sofi.
- Los scripts de procesamiento **no forman parte del repositorio**, conforme a la convención existente. Para **001 y 002** ya no estaban disponibles en disco; de **003** solo quedaba una parte. Las sesiones permiten reconstruir parte de su historia, pero no garantizan regeneración automática.
- Para **004–015** seguían existiendo scripts `final.sh` y auxiliares en carpetas temporales. La mayoría había superado verificaciones de salida idéntica; **`006/poking-hide.webp` es una excepción conocida** después de su reempaquetado.
- Varias animaciones utilizan **WebP de animaciones anteriores como entrada**. Modificar esas referencias puede alterar resultados posteriores aunque el script de una animación no cambie. Dependencias registradas: `sofi-blink → 004, 006, 008–015`; `talking → 009–013`; `i-see-you → 011`; `needs-context → 012`; `suspicious → 014`; `uncertain → 015`.

## 6. Alcance de futuras comprobaciones

La inspección de metadatos y el recuento de colores **no constituyen una auditoría de consistencia artística**. Esa comprobación (paleta del personaje, proporciones, choker, contornos y transiciones entre recursos) se hizo después, de solo lectura y con las correcciones autorizadas por separado: ver §8. Cualquier corrección visual posterior requiere una nueva decisión artística.

## 7. Fuentes de esta reconstrucción

- Informes de la **auditoría de consistencia artística** (2026-10-21) y de las **correcciones artísticas** (2026-10-22, con cierre del 2026-10-23), conservados en la carpeta `auditorias/` del repositorio de spritesheets, fuera de Ask Sofi. Estado publicado en el commit `17aca4f` de ese repositorio.
- `AGENTS.md` del repositorio de spritesheets: reglas y convenciones previstas, **no evidencia suficiente de ejecución**.
- **Auditoría de procedencia técnica de los spritesheets**, 21-10-2026 (`eager-shimmying-wand.md`): inventario de sesiones, trazabilidad por archivo y limitaciones.
- Rutas auditadas: `001-*` … `015-*` (excepto la entrega 007), `scss/`, `scripts/`, `playground/`, `dist/` y el historial Git. Primer commit registrado: `6dbf203`.

> **Resumen público sugerido:** Sofi parte de un diseño y una animación inicial que la autora creó. Los fotogramas adicionales se desarrollaron con ayuda de ChatGPT; la autora dirigió sus expresiones, secuencias y revisiones, y Claude Code procesó y optimizó los recursos para su uso en la aplicación. No se atribuye ilustración manual íntegra de los fotogramas generados.

## 8. Actualización del 23 de octubre de 2026: consistencia y correcciones

Tras la auditoría de consistencia cromática, la autora aprobó una revisión final (cierre del 2026-10-23, commit `17aca4f` del repositorio de spritesheets). Los informes completos (método, métricas, comparativas y scripts) permanecen en ese repositorio; aquí solo consta su efecto sobre la procedencia.

- **Armonización cromática (6 animaciones):** `002-sofing`, `003-rolling`, `005-favoriting`, `008-are-u-still-here`, `012-eureka` y `015-memory-wipe` ajustaron los materiales del personaje (jersey, piel, iris, esclerótica o rubio, según el caso) a la referencia del fotograma 0 de `sofi-blink`. `003` además adelgazó 1 px el contorno exterior de F1–F4, salvo el rubio. El ajuste fue un paso determinista sobre las tiras ya generadas: alfa, siluetas, poses, expresiones, efectos, temporizaciones y CSS compilado no cambian.
- **Reconstrucción artística (1 animación):** en `013-suspicious`, el fotograma 2 (F2) se reconstruyó desde fuentes limpias porque la reutilización de los ojos de otra animación dejaba artefactos. F0, F1 y F3 no cambian. Fue una decisión artística separada, aprobada tras rechazar un primer retoque de píxeles.
- **Cifras que cambian:** colores por tira `002` 128→158, `003` 128→159, `005` 96→98, `008` 128→133, `015` 130→135; `012` (211) y `013` (149) no cambian. El resto de lo descrito en §4 no se ve afectado.
- **ZIP:** se regeneraron los de `002`, `003`, `005`, `008`, `012`, `013` y `015`; las entregas `001`, `004`, `006`, `009`, `010`, `011` y `014` no cambian de contenido. El cierre del informe de correcciones registra los SHA-256 de los siete ZIP regenerados. Los seis ZIP restantes no tienen un hash de referencia documentado: su contenido es idéntico al de los recursos fuente del commit `17aca4f`, que son la referencia para verificarlos. `001` no tiene ZIP en esta entrega.
- **Reproducibilidad:** `final.sh` de `005`, `008`, `012`, `013` y `015` ya no produce la tira definitiva, sino la anterior a las correcciones; lo mismo vale para `002` y `003` (cuyos scripts originales ya no existen). Cualquier cambio futuro debe partir de las tiras corregidas y reaplicar el paso de corrección descrito en los informes.
- **Pendientes menores aceptados:** blancos de los ojos de `003` y `012` F1 (ΔE00 ≈ 4,6 frente a la referencia) y otras diferencias artísticas catalogadas en el informe de correcciones; ninguna se corrigió.
