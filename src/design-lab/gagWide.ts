// Prototipo de T066 (gags sobre el retrato grande de la consulta a dos columnas). La ubicación y la
// composición están aprobadas (AV6: spec §5, `art-direction/README.md` decisión 11), y la versión
// reducida también (2026-11-12, plan §6).

// Es el de `ConsultationScreen` (`listenBig`): Sofi atenta a 384 px, el fotograma real del sprite.
export const WIDE_SPRITE = 384

// En la pantalla real el diálogo se solapa con el pie del retrato: `.listenDialog` sube 96 px sobre
// él (`margin-top: -96px`, desde 1080 px). Corta a Sofi por el cuello y, durante `poking`, su cuerpo
// tapa el texto del diálogo. `gagWide.contract.test.tsx` lo comprueba en la pantalla real.
export const PRODUCTION_OVERLAP = 96

// Composición aprobada (AV6, 2026-11-11; decisión 11), con la de 4.9 como referencia: el retrato
// apoya el pie en el borde superior del diálogo, sin solape. Es lo único que cambia respecto de la
// columna real, hasta que T088 la lleve a producción.
export const WIDE_OVERLAP = 0

// `poking` se esconde tras el borde superior del diálogo, que es el «borde real» del contenedor:
// `--poking-edge` es su altura medida desde arriba, en % del retrato. Sin solape, el diálogo
// empieza en el pie del retrato: el 100 %, el valor por defecto del parcial, como en 4.9.
export const WIDE_EDGE_PERCENT =
  ((WIDE_SPRITE - WIDE_OVERLAP) / WIDE_SPRITE) * 100

// Anchos de la columna de «Sofi escucha» (5 de 12 de la rejilla de `.work`) con el texto por
// defecto y la ventana indicada. Medidos en la aplicación real (008-verification §27.2): el
// retrato no crece (384 px), solo lo hace el diálogo y el aire a los lados.
export const WIDE_COLUMNS = [
  { value: '384', label: '384 · ventana de 1080', width: 384 },
  { value: '460', label: '460 · 1280', width: 460 },
  { value: '520', label: '520 · 1440', width: 520 },
  { value: '720', label: '720 · 1920', width: 720 },
] as const

export type WideColumn = (typeof WIDE_COLUMNS)[number]['value']

export const WIDE_TEXT =
  'A ver, cuéntamelo todo. ¿Qué te ha escrito exactamente? Pégalo tal cual, que aquí cada punto cuenta.'
