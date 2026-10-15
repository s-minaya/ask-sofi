# Dirección artística — C «Exclusiva»

Referencia visual y de comportamiento de Ask Sofi. Las reglas para usarla están en `AGENTS.md` («Visual and layout decisions»); la aprobación y su contexto, en «Approved design» del plan de la feature `002`.

## Contenido

| Archivo                           | Qué es                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `design-lab-c-exclusiva.html`     | Export del Design Lab C «Exclusiva»: 8 tableros, de Foundations a Experience Preview |
| `approved-screens-c-exclusiva.pdf` | Pantallas C aprobadas de escritorio y móvil                                      |
| `logo-master.png`                 | Logotipo original sin pérdida. Las variantes de producción son `src/assets/brand/logo-*.webp` |
| `sofi/`                           | Originales sin pérdida de las imágenes estáticas de Sofi. Las de producción están en `src/assets/sofi/` (tech-stack §46.1) |

## Producción

Nada de esta carpeta se publica. El build emite solo lo que importa `src/` y lo que hay en `public/`; `e2e/production-build.spec.ts` lo comprueba, y comprueba también que no salen el worker de MSW ni el Design Lab.

## Decisiones posteriores a la aprobación

Registradas el 2026-10-11. Cuando el Design Lab y las pantallas difieren, manda el Design Lab.

1. **Resultados.** La experiencia de resultados (lectura, procesamiento, falta de contexto) se implementa en su feature. Hasta entonces, la consulta real muestra solo el aviso de demostración aprobado; la voz y el typewriter de Sofi se verifican en el Design Lab.
2. **Diálogo de la consulta en una columna.** Usa la variante corta del Design Lab: «A ver, cuéntamelo todo. ¿Qué te ha escrito exactamente?». A dos columnas, el texto completo.
3. **Titulares de la portada.** Son los tres del Design Lab. «Probabilidades, no profecías» queda fuera.
4. **Solape del diálogo sobre la tira de fotos.** Se mantiene el valor actual: lo que importa es que no haya solapamientos que tapen contenido y que la composición sea responsive, no copiar desplazamientos exactos de capturas anteriores.
5. **Insignia de la consulta en una columna** (2026-10-12). Sofi se ve entera dentro del recuadro, con el busto apoyado en su borde inferior; no se recorta a la cara.
6. **Pantalla de error** (2026-10-12). Sofi se ve entera, con el busto apoyado en el borde inferior del recuadro, como en la insignia de la consulta; no se recorta a la cara (ficha 6.5 del Design Lab, opción B: sprite de 192 px en un recuadro de 155 × 190).
7. **Invitación y cuestionario del expediente** (2026-10-13, revisión visual de 004). La invitación es el primer diálogo de Sofi en la consulta, con ella asomada sobre su bocadillo en lugar del retrato (una sola Sofi); el acceso permanente va en el pie de su diálogo. En el cuestionario, las respuestas van dentro del bocadillo: Sofi a 192 px sobre él en una columna y, desde 1080 px, Sofi a 384 px arriba a la izquierda con el bocadillo debajo y las respuestas en dos columnas, con las seis áreas y las notas a la derecha. Nada va fijo. Detalle y medidas en `spec/features/004-partner-profile-&-onboarding/004-plan.md` §4, §8 y §9.
8. **Siguiente paso destacado** (2026-10-13, pulido de 004). El rosa de la pegatina acompaña al paso que toca: una acción terminada pasa a secundaria y la siguiente toma el rosa. Las celebraciones son breves, de una sola vez y sin bucle; no mueven el layout, no tapan texto ni controles, no fuerzan navegación, se dan cuando la acción a la que acompañan está en pantalla y tienen una alternativa estática con movimiento reducido. `sofi-exclamation-burst` (las tres exclamaciones rosas) quedó sin uso en 2026-10-13: su original se conserva en `sofi/` y su procesado, en `004-plan.md` §4. Los tamaños de Sofi son fracciones limpias del sprite (384, 192; 288 solo como paso intermedio aprobado) y las composiciones que no caben por alto se adaptan al alto de la ventana, no al dispositivo.

### Pendiente para 007

9. **Adaptación editorial y semántica de resultados.** Las estimaciones del análisis son independientes y no suman 100 %. Los textos, leyendas y tarjetas de resultados del Design Lab que impliquen reparto exclusivo («versiones», «empate técnico», porcentajes que suman 100 %) requerirán revisión editorial en 007 para reflejar la semántica aprobada sin destruir el aspecto visual. El aspecto visual aprobado se conserva como referencia; el ajuste es de copy y semántica, no de layout.
10. **Pantalla de seguridad y salida rápida.** No existe actualmente una pantalla aprobada para el estado `safety_concern`. Su diseño visual se define en 007.
