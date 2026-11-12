import type { GagId, SceneCause } from '../../components/sofi/visual/ambient'
import {
  IDLE_DEFAULT_MS,
  IDLE_MAX_MS,
  IDLE_MIN_MS,
  IDLE_STEP_MS,
  formatIdle,
} from '../gagBadge'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { LabCheck, LabNote, LabRange, LabSub } from '../parts/LabParts'
import styles from './GagsSpec.module.scss'
import type { GagScene } from './useGagScene'

// Los controles de los gags del Lab (4.7 y 4.8): qué gags están montados, la zona sensible, la
// inactividad de are-u-still-here, las causas de pausa y el registro de lo que hace `ambient`.

// Cómo se prueba cada gag; con movimiento reducido, su versión reducida (`useReducedGag`).
const GAGS: ReadonlyArray<{ kind: GagId; hint: string; reduced: string }> = [
  {
    kind: 'poking',
    hint: 'Toca a Sofi varias veces seguidas.',
    reduced:
      'Toca a Sofi: cada toque, otra pose, hasta ofendida; 5 s sin tocarla, reposo.',
  },
  {
    kind: 'i-see-you',
    hint: 'Pasa el puntero por encima o deja el dedo apoyado.',
    reduced: 'Deja el puntero quieto sobre Sofi, o el dedo apoyado.',
  },
  {
    kind: 'are-u-still-here',
    hint: 'No toques nada: se duerme sola.',
    reduced: 'No toques nada: se duerme sola.',
  },
]

const CAUSES: ReadonlyArray<{ cause: SceneCause; label: string }> = [
  { cause: 'busy', label: 'Sofi ocupada' },
  { cause: 'interaction', label: 'Escritura o controles' },
  { cause: 'sensitive', label: 'Estado sensible' },
  { cause: 'hidden', label: 'Pestaña oculta' },
]

export function GagPanel({
  scene,
  empty,
}: {
  scene: GagScene
  // Lo que dice el registro mientras está vacío.
  empty: string
}) {
  const { gags, causes, idle, log, showHit } = scene
  const reducedMotion = useReducedMotion()
  return (
    <div className={styles.panel}>
      <div role="group" aria-label="Gags activos" className={styles.group}>
        <LabSub>Gags activos</LabSub>
        {GAGS.map(({ kind, hint, reduced }) => (
          <div key={kind} className={styles.gag}>
            <LabCheck
              label={kind}
              checked={gags[kind]}
              onChange={(checked) => scene.setGag(kind, checked)}
            />
            <p className={styles.hint}>{reducedMotion ? reduced : hint}</p>
          </div>
        ))}
      </div>

      <LabCheck
        label="Mostrar la zona sensible"
        checked={showHit}
        onChange={scene.setShowHit}
      />
      <LabNote>
        Los gags solo responden al toque sobre las partes visibles de Sofi: su
        silueta en cada pose y, escondida o asomada, la cabeza y las manos. Lo
        transparente no responde, ni los efectos (el «?», los Zzz, la alerta).
        Con movimiento completo, la mirada de i-see-you sigue al puntero y al
        toque en toda la página: es del controlador y está aprobado así; con
        reducido, no hay mirada.
      </LabNote>

      <LabRange
        label="Inactividad de are-u-still-here"
        value={idle}
        min={IDLE_MIN_MS}
        max={IDLE_MAX_MS}
        step={IDLE_STEP_MS}
        display={formatIdle(idle)}
        onChange={scene.setIdle}
      />
      <LabNote>
        Valor de partida: {formatIdle(IDLE_DEFAULT_MS)}, el aprobado (plan §6).
        La spec (§5) fija entre 2 y 3 minutos. Cambiarlo reinicia la cuenta de
        los gags.
      </LabNote>

      <div role="group" aria-label="Causas de pausa" className={styles.group}>
        <LabSub>Causas de pausa</LabSub>
        {CAUSES.map(({ cause, label }) => (
          <LabCheck
            key={cause}
            label={label}
            checked={causes.has(cause)}
            onChange={(active) => scene.setCause(cause, active)}
          />
        ))}
      </div>

      <div className={styles.group}>
        <LabSub>Registro</LabSub>
        <ol aria-label="Registro de los gags" className={styles.log}>
          {log.entries.map((entry) => (
            <li key={entry.id}>
              <span>{entry.id}</span>
              <span>{entry.text}</span>
            </li>
          ))}
        </ol>
        {log.entries.length === 0 && <LabNote>{empty}</LabNote>}
      </div>
    </div>
  )
}
