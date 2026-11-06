import { useEffect, useReducer, useState } from 'react'
import { SofiSprite } from '../../components/sofi/SofiSprite/SofiSprite'
import {
  clearSessionRates,
  setSessionRate,
} from '../../components/sofi/visual/rates'
import { SOFI_REGISTRY } from '../../components/sofi/visual/registry'
import {
  SOFI_ANIMATION_IDS,
  type SofiAnimationId,
} from '../../components/sofi/visual/types'
import { Button } from '../../components/ui/Button/Button'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cx } from '../../utils/cx'
import {
  createInspectorRun,
  createInspectorState,
  effectiveRate,
  inspectorReducer,
  inspectorRunReducer,
  type InspectorAction,
  type InspectorCycle,
  type InspectorEntry,
  type InspectorRun,
} from '../motionLab'
import {
  LabCheck,
  LabChoice,
  LabCode,
  LabNote,
  LabRange,
  LabReadout,
  LabRow,
  LabSpec,
  LabStage,
  LabSub,
} from '../parts/LabParts'
import {
  BACKGROUND_DEFAULT,
  BACKGROUND_OPTIONS,
  CONTAINER_OPTIONS,
  PLAYBACK_NAMES,
  RATE_MAX,
  RATE_MIN,
  RATE_STEP,
  RESOURCE_INFO,
  SIZE_DEFAULT,
  SIZE_MAX,
  SIZE_MIN,
  SIZE_STEP,
  WIDTH_OPTIONS,
  availability,
  containerBox,
  formatRate,
  formatSize,
  hasSpeedControl,
  isGag,
  provideLabOnlyLoaders,
  stageBackground,
  stageMaxWidth,
  type Container,
  type StageBackground,
  type StageWidth,
} from '../spriteInspector'
import { keepResourceTimings } from '../spriteWeight'
import { FrameTimeline } from './FrameTimeline'
import { GagHost } from './GagHost'
import { ResourceWeight } from './ResourceWeight'
import styles from './InspectorSpec.module.scss'

// Inspector de los 14 recursos (catálogo §8, T058): cada uno se pinta con `SofiSprite` o, si es
// una máquina, con su controlador real. Prototipo hasta su `AV#`: los controles del Lab no
// alteran las preferencias públicas ni las velocidades de producción.

provideLabOnlyLoaders()
// Sin esto el búfer de recursos del navegador (250) se llena con los módulos del Lab y la ficha de
// peso no encuentra las tiras que se miran después.
keepResourceTimings()

const reducer = inspectorReducer<StageBackground>
type Dispatch = (action: InspectorAction<StageBackground>) => void

const RESOURCE_OPTIONS = SOFI_ANIMATION_IDS.map((id) => ({
  value: id,
  label: id,
}))

const CYCLE_OPTIONS = [
  { value: 'loop', label: 'Bucle' },
  { value: 'once', label: 'Una pasada' },
] as const satisfies ReadonlyArray<{ value: InspectorCycle; label: string }>

export function InspectorSpec() {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInspectorState<StageBackground>({
      size: SIZE_DEFAULT,
      background: BACKGROUND_DEFAULT,
    }),
  )
  // El marco en el que se mira (recorte y ancho) es común a todos los recursos: así se comparan
  // en el mismo contenedor. Tamaño, fondo y pixelado, en cambio, son de cada uno.
  const [container, setContainer] = useState<Container>('stage')
  const [width, setWidth] = useState<StageWidth>('full')

  return (
    <LabSpec
      id="m-inspector"
      kicker="4.5 · Inspector"
      title="Recursos de Sofi"
      desc="Elige uno de los 14 recursos y pruébalo con el componente real: cada uno guarda su velocidad mientras dure el Lab (salvo poking, que conserva la original). Puedes pausarlo, reiniciarlo, compararlo con 1×, verlo en bucle o en una sola pasada, lanzarle un evento nuevo o cancelarlo a mitad. También ajustas su tamaño, su fondo, el pixelado y el contenedor en el que se ve."
      codes={
        <>
          <LabCode>{'<SofiSprite animation>'}</LabCode>
          <LabCode>useSofiController</LabCode>
          <LabCode>setSessionRate</LabCode>
        </>
      }
    >
      <div className={styles.inspector}>
        <LabChoice
          stacked
          label="Recurso"
          options={RESOURCE_OPTIONS}
          value={state.selected}
          onChange={(id) => dispatch({ type: 'select', id })}
        />
        {/* Una instancia por recurso: lo transitorio (comparar, evento, cancelación) no pasa de uno a otro. */}
        <ResourceInspector
          key={state.selected}
          id={state.selected}
          entry={state.entries[state.selected]}
          dispatch={dispatch}
          container={container}
          onContainer={setContainer}
          width={width}
          onWidth={setWidth}
        />
      </div>
    </LabSpec>
  )
}

type ResourceInspectorProps = {
  id: SofiAnimationId
  entry: InspectorEntry<StageBackground>
  dispatch: Dispatch
  container: Container
  onContainer: (container: Container) => void
  width: StageWidth
  onWidth: (width: StageWidth) => void
}

function ResourceInspector({
  id,
  entry,
  dispatch,
  container,
  onContainer,
  width,
  onWidth,
}: ResourceInspectorProps) {
  const playback = SOFI_REGISTRY[id].playback
  const [run, runDispatch] = useReducer(
    inspectorRunReducer,
    playback,
    createInspectorRun,
  )
  // El estado efectivo del selector global del Lab (`system | reduce | full`): el inspector no
  // tiene el suyo, solo cuenta lo que ve.
  const reduced = useReducedMotion()
  const adjustable = hasSpeedControl(id)
  const rate = effectiveRate(entry.rate, run)
  const frozen = entry.paused || run.held
  const info = RESOURCE_INFO[id]
  const box = containerBox(container, entry.size)
  // El escenario del recurso, del que la línea de tiempo lee sus animaciones.
  const [scope, setScope] = useState<HTMLElement | null>(null)

  // La velocidad llega a `SofiSprite` y al controlador por `visual/rates`, la misma vía que usará
  // producción. Solo se sobrescribe el recurso que se mira y se deja limpio al irse.
  useEffect(() => {
    if (!adjustable) return
    setSessionRate(id, rate)
    return clearSessionRates
  }, [id, rate, adjustable])

  const sprite =
    isGag(id) && !run.cancelled ? (
      <GagHost key={run.token} kind={id} frozen={frozen} />
    ) : (
      <SofiSprite
        key={run.token}
        animation={run.cancelled ? 'sofi-blink' : id}
        style={{ width: '100%' }}
        onFirstCycle={() => runDispatch({ type: 'first-cycle' })}
        onEnd={() => runDispatch({ type: 'end' })}
      />
    )

  return (
    <div className={styles.layout}>
      <div className={styles.visual}>
        <LabStage
          {...stageBackground(entry.background)}
          maxWidth={stageMaxWidth(width)}
          className={styles.stage}
          innerClassName={styles.stageInner}
        >
          <div
            className={cx(
              styles.sprite,
              frozen && styles.frozen,
              entry.pixelated && styles.pixelated,
            )}
            data-frozen={frozen}
            ref={setScope}
            style={box ? undefined : { width: entry.size }}
          >
            {box ? (
              <div
                className={styles.crop}
                style={{
                  width: box.width,
                  height: box.height,
                  background: box.background,
                }}
              >
                <div
                  style={{
                    width: entry.size,
                    marginLeft: -box.offsetX,
                    marginTop: -box.offsetY,
                  }}
                >
                  {sprite}
                </div>
              </div>
            ) : (
              sprite
            )}
          </div>
        </LabStage>
        <FrameTimeline
          scope={scope}
          paused={entry.paused}
          onPause={() => dispatch({ type: 'paused', value: true })}
          onRestart={() => runDispatch({ type: 'restart' })}
          machine={isGag(id) && !run.cancelled}
        />
        <ResourceWeight id={id} />
      </div>

      <div className={styles.panel}>
        <section className={styles.ficha} aria-label="Ficha del recurso">
          <LabSub>
            {info.number} · {id}
          </LabSub>
          <LabReadout
            rows={[
              ['Intención', info.intent],
              ['Tipo', PLAYBACK_NAMES[playback]],
              ['Activación', info.activation],
              ['Disponibilidad', availability(id)],
              ['Estado', statusOf(entry, run, reduced)],
            ]}
          />
          {playback === 'machine' && (
            <LabNote>
              Una máquina la dirige su controlador: no tiene bucle ni pasada. Se
              dispara con el puntero o con la inactividad de la página.
            </LabNote>
          )}
        </section>

        <hr className={styles.sep} />

        <LabRow>
          <Button
            onClick={() => dispatch({ type: 'paused', value: !entry.paused })}
          >
            {entry.paused ? 'Reproducir' : 'Pausar'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => runDispatch({ type: 'restart' })}
          >
            Reiniciar
          </Button>
        </LabRow>

        {adjustable ? (
          <>
            <LabRange
              label="Velocidad"
              value={entry.rate}
              min={RATE_MIN}
              max={RATE_MAX}
              step={RATE_STEP}
              display={formatRate(entry.rate)}
              onChange={(value) => dispatch({ type: 'rate', value })}
            />
            <LabCheck
              label="Comparar con 1×"
              checked={run.comparing}
              onChange={(value) => runDispatch({ type: 'compare', value })}
            />
            {run.comparing && (
              <LabNote>
                Mostrando 1×. La velocidad elegida ({formatRate(entry.rate)}) se
                conserva.
              </LabNote>
            )}
          </>
        ) : (
          <LabNote>
            {id} conserva su velocidad original (1×): no se ajusta ni se
            compara.
          </LabNote>
        )}

        {playback !== 'machine' && (
          <LabChoice
            stacked
            label="Ver como"
            options={CYCLE_OPTIONS}
            value={run.cycle}
            onChange={(value) => runDispatch({ type: 'cycle', value })}
          />
        )}

        <LabRow>
          <Button
            variant="secondary"
            onClick={() => runDispatch({ type: 'event' })}
          >
            Nuevo evento
          </Button>
          <Button
            variant="secondary"
            disabled={id === 'sofi-blink' || run.cancelled}
            onClick={() => runDispatch({ type: 'cancel' })}
          >
            Cancelar a mitad
          </Button>
        </LabRow>

        <hr className={styles.sep} />

        <LabRange
          label="Tamaño"
          value={entry.size}
          min={SIZE_MIN}
          max={SIZE_MAX}
          step={SIZE_STEP}
          display={formatSize(entry.size)}
          onChange={(value) => dispatch({ type: 'size', value })}
        />
        <LabChoice
          stacked
          label="Fondo"
          options={BACKGROUND_OPTIONS}
          value={entry.background}
          onChange={(value) => dispatch({ type: 'background', value })}
        />
        <LabCheck
          label="Pixelado"
          checked={entry.pixelated}
          onChange={(value) => dispatch({ type: 'pixelated', value })}
        />
        <LabChoice
          stacked
          label="Contenedor"
          options={CONTAINER_OPTIONS}
          value={container}
          onChange={onContainer}
        />
        <LabChoice
          stacked
          label="Ancho"
          options={WIDTH_OPTIONS}
          value={width}
          onChange={onWidth}
        />
      </div>
    </div>
  )
}

function statusOf(
  entry: InspectorEntry<StageBackground>,
  run: InspectorRun,
  reduced: boolean,
): string {
  if (run.cancelled) return 'Cancelado a mitad: cede a sofi-blink'
  // Con movimiento reducido no hay animación ni controlador: decir «Reproduciendo» sería falso.
  if (reduced) return 'Pose estática: movimiento reducido'
  if (run.held) return 'Primera pasada completada, quieto'
  return entry.paused ? 'En pausa' : 'Reproduciendo'
}
