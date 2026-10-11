# Dirección artística — C «Exclusiva»

Referencia visual y de comportamiento de Ask Sofi. Las reglas para usarla están en `AGENTS.md` («Visual and layout decisions»); la aprobación y su contexto, en «Approved design» del plan de la feature `002`.

## Contenido

| Archivo                           | Qué es                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `design-lab-c-exclusiva.html`     | Export del Design Lab C «Exclusiva»: 8 tableros, de Foundations a Experience Preview |
| `approved-screens-c-exclusiva.pdf` | Pantallas C aprobadas de escritorio y móvil                                      |
| `logo-master.png`                 | Logotipo original sin pérdida. Las variantes de producción son `src/assets/brand/logo-*.webp` |

## Producción

Nada de esta carpeta se publica. El build emite solo lo que importa `src/` y lo que hay en `public/`; `e2e/production-build.spec.ts` lo comprueba, y comprueba también que no salen el worker de MSW ni el Design Lab.

## Decisiones posteriores a la aprobación

Registradas el 2026-10-11. Cuando el Design Lab y las pantallas difieren, manda el Design Lab.

1. **Resultados.** La experiencia de resultados (lectura, procesamiento, falta de contexto) se implementa en su feature. Hasta entonces, la consulta real muestra solo el aviso de demostración aprobado; la voz y el typewriter de Sofi se verifican en el Design Lab.
2. **Diálogo de la consulta en una columna.** Usa la variante corta del Design Lab: «A ver, cuéntamelo todo. ¿Qué te ha escrito exactamente?». A dos columnas, el texto completo.
3. **Titulares de la portada.** Son los tres del Design Lab. «Probabilidades, no profecías» queda fuera.
4. **Solape del diálogo sobre la tira de fotos.** Se mantiene el valor actual: lo que importa es que no haya solapamientos que tapen contenido y que la composición sea responsive, no copiar desplazamientos exactos de capturas anteriores.
