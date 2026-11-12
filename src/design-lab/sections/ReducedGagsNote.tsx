import { LabNote } from '../parts/LabParts'

// La versión reducida de los gags (aprobada el 2026-11-12: catálogo §7.2 y fichas 006, 008 y 009;
// plan §6), igual en 4.7, 4.8 y 4.9 (`useReducedGag`). Una sola nota para no contarla tres veces.
export function ReducedGagsNote() {
  return (
    <LabNote>
      Movimiento reducido (aprobado el 2026-11-12): los tres gags siguen, con
      las poses fijas de sus parciales y sin saltos, sacudidas ni seguimiento.
      Poking: cada toque cambia la pose (curiosa, escéptica, «¡quieto!»,
      ofendida), no se esconde y, a los 5 s sin toques, vuelve al reposo (en
      completo, 10 s). I-see-you: no sigue al puntero; con el puntero o el dedo
      quieto sobre Sofi, la pillan, con la alerta fija, y se queda con la
      sonrisa pícara. Are-u-still-here: tras la inactividad, somnolienta y
      dormida con los Zzz quietos, sin cabezadas; al volver, cara de pillada sin
      susto. Se ve eligiendo «Reducido» en Movimiento, en la cabecera del Lab.
    </LabNote>
  )
}
