import { useContext, useEffect, useRef, useState } from 'react'
import { MotionPreferenceContext } from '../../app/providers/MotionPreference'
import { Button } from '../../components/ui/Button/Button'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import {
  IDLE_DEFAULT_MS,
  IDLE_MAX_MS,
  IDLE_MIN_MS,
  IDLE_STEP_MS,
  formatIdle,
} from '../gagBadge'
import {
  DEFAULT_FRAME_CONFIG,
  GAGS_CHANNEL,
  GAG_IDS,
  GAG_SHEET_PRESETS,
  type GagsChannelMessage,
  type GagsFrameConfig,
  type GagsFrameStatus,
} from '../gagProfile'
import {
  LabCheck,
  LabChoice,
  LabCode,
  LabNote,
  LabProv,
  LabRange,
  LabReadout,
  LabSpec,
  LabSub,
} from '../parts/LabParts'
import { PROFILE_PRESETS } from '../profile/profilePresets'
import { ScaledFrame } from '../profile/ScaledFrame'
import layout from './GagsSpec.module.scss'
import styles from './ProfileSection.module.scss'
import { ReducedGagsNote } from './ReducedGagsNote'

// T066 · prototipo de la ubicación A del expediente (aprobada, spec §5): los tres gags sobre el
// retrato del cuestionario que ya existe. La composición es el `ProfileSheet` real, en un iframe de verdad
// (sus media queries son las de la pantalla), y el Lab no lo modifica.

const PHONES = {
  '320': { width: 320, height: 568, label: 'Móvil', id: 'movil' },
  '390': { width: 390, height: 844, label: 'Móvil', id: 'movil' },
} as const
type Phone = keyof typeof PHONES
const DESKTOP = {
  width: 1280,
  height: 800,
  label: 'Escritorio',
  id: 'escritorio',
}

const frameSrc = (preset: string, motion: string, run: number, id: string) =>
  `/design-lab?frame=gags-profile&preset=${preset}&motion=${motion}&run=${run}&id=${id}`

function describe(status: GagsFrameStatus | undefined) {
  if (!status) return 'sin datos aún'
  const why = !status.sprite
    ? 'no: el retrato es una imagen estática'
    : status.mood !== 'waiting'
      ? 'no: Sofi no espera la respuesta'
      : status.interaction
        ? 'suspendidos: un control del formulario tiene el foco'
        : status.reduced
          ? 'sí, en versión reducida'
          : 'sí'
  return `${status.mood} · gags vivos: ${why}${status.active ? ` · activo: ${status.active}` : ''}`
}

export function GagsProfileSpec() {
  const motion = useContext(MotionPreferenceContext)
  const reducedMotion = useReducedMotion()
  const [config, setConfig] = useState<GagsFrameConfig>(DEFAULT_FRAME_CONFIG)
  const [preset, setPreset] =
    useState<(typeof GAG_SHEET_PRESETS)[number]>('waiting')
  const [phone, setPhone] = useState<Phone>('390')
  const [run, setRun] = useState(0)
  const [statuses, setStatuses] = useState<Record<string, GagsFrameStatus>>({})
  const [channel, setChannel] = useState<BroadcastChannel | null>(null)

  // El último valor, para contestar a un marco que se acaba de cargar.
  const configRef = useConfigRef(config)

  // Un canal con los marcos: ellos preguntan (`hello`) al cargar y cuentan cómo está la escena.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const opened = new BroadcastChannel(GAGS_CHANNEL)
    opened.onmessage = (event: MessageEvent<GagsChannelMessage>) => {
      const message = event.data
      if (message.type === 'hello') {
        const reply: GagsChannelMessage = {
          type: 'config',
          config: configRef.current,
        }
        opened.postMessage(reply)
      } else if (message.type === 'status') {
        setStatuses((current) => ({
          ...current,
          [message.status.frame]: message.status,
        }))
      }
    }
    setChannel(opened)
    return () => {
      opened.onmessage = null
      opened.close()
      setChannel(null)
    }
  }, [configRef])

  const update = (next: Partial<GagsFrameConfig>) => {
    const merged = { ...config, ...next }
    setConfig(merged)
    const message: GagsChannelMessage = { type: 'config', config: merged }
    channel?.postMessage(message)
  }

  const size = [PHONES[phone], DESKTOP]

  return (
    <LabSpec
      id="m-gags-profile"
      kicker="4.9 · Gags · ubicación A"
      title="Gags en el expediente"
      desc="El cuestionario del expediente, sin cambios, con los tres gags reales sobre el retrato de Sofi que ya tiene (192 px en una columna, 384 desde 1080 px). Poking se esconde tras el borde superior del bocadillo de la pregunta, donde apoya Sofi. Solo viven con Sofi esperando la respuesta y con ningún control del formulario con el foco. Cada marco es la pantalla de verdad: tócala o usa el puntero."
      codes={
        <>
          <LabCode>{'<ProfileSheet>'}</LabCode>
          <LabCode>useSofiController ×3</LabCode>
          <LabProv>Prototipo T066 · aprobado, producción en T088</LabProv>
        </>
      }
    >
      <div>
        <div className={styles.controls}>
          <LabChoice
            stacked
            label="Composición"
            value={preset}
            onChange={(next) => {
              setPreset(next)
              setRun(0)
            }}
            options={GAG_SHEET_PRESETS.map((key) => ({
              value: key,
              label: PROFILE_PRESETS[key].label,
            }))}
          />
          <LabChoice
            label="Pantalla"
            value={phone}
            onChange={setPhone}
            options={[
              { value: '320', label: '320 × 568' },
              { value: '390', label: '390 × 844' },
            ]}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRun((value) => value + 1)}
          >
            Volver a empezar
          </Button>
        </div>
        <div className={styles.frames}>
          {size.map((screen) => (
            <ScaledFrame
              key={screen.label}
              src={frameSrc(preset, motion, run, screen.id)}
              title={`Expediente con gags · ${screen.label}`}
              label={screen.label}
              width={screen.width}
              height={screen.height}
            />
          ))}
        </div>
      </div>
      <div className={layout.layout}>
        <div className={layout.visual}>
          <LabReadout
            rows={[
              [
                'Movimiento',
                reducedMotion
                  ? 'Reducido: gags en versión reducida'
                  : 'Completo: gags activos',
              ],
              ['Móvil', describe(statuses.movil)],
              ['Escritorio', describe(statuses.escritorio)],
            ]}
          />
          <LabNote>
            Estados permitidos (spec §5): el retrato solo es el sprite de Sofi
            con ella preguntando o esperando; los gags solo viven esperando la
            respuesta, sin foco en los controles, con la página visible y sin
            estado sensible. Al hablar, reaccionar (imagen estática) o confirmar
            un borrado, se desmontan del todo. La ubicación (sobre este retrato,
            en móvil y escritorio: spec §5) y la inactividad (plan §6) están
            aprobadas (AV6). Cuando el pelo de Sofi escondida o asomada llega a
            la etiqueta «Sofi» del bocadillo, la etiqueta queda por encima
            (decisión 11 de la dirección artística).
          </LabNote>
          <ReducedGagsNote />
        </div>

        <div className={layout.panel}>
          <div role="group" aria-label="Gags activos" className={layout.group}>
            <LabSub>Gags activos</LabSub>
            {GAG_IDS.map((kind) => (
              <LabCheck
                key={kind}
                label={kind}
                checked={config.gags[kind]}
                onChange={(checked) =>
                  update({ gags: { ...config.gags, [kind]: checked } })
                }
              />
            ))}
          </div>
          <LabCheck
            label="Mostrar la zona sensible"
            checked={config.showHit}
            onChange={(showHit) => update({ showHit })}
          />
          <LabNote>
            Los gags solo responden al toque sobre las partes visibles de Sofi:
            su silueta en cada pose y, escondida o asomada, la cabeza y las
            manos. Lo transparente no responde. La mirada de i-see-you sigue al
            puntero y al toque en toda la página.
          </LabNote>
          <LabNote>
            Foco (aprobado, spec §5): al entrar el foco en cualquier control del
            expediente (no los de la cabecera), el gag en marcha se cancela y
            Sofi vuelve al reposo; los gags quedan suspendidos mientras el foco
            siga en un control y, al perderlo, se reanudan sin continuar nada
            pendiente. El foco es el nativo de cada navegador y no se fuerza: en
            Chromium y Firefox, tras responder se queda en la opción; en WebKit,
            pulsar una opción o un botón no da el foco. Las acciones del
            formulario siempre prevalecen sobre los gags.
          </LabNote>
          <LabRange
            label="Inactividad de are-u-still-here"
            value={config.idle}
            min={IDLE_MIN_MS}
            max={IDLE_MAX_MS}
            step={IDLE_STEP_MS}
            display={formatIdle(config.idle)}
            onChange={(idle) => update({ idle })}
          />
          <LabNote>
            Valor de partida: {formatIdle(IDLE_DEFAULT_MS)}, el aprobado (plan
            §6). Cambiarlo reinicia la cuenta de los gags.
          </LabNote>
        </div>
      </div>
    </LabSpec>
  )
}

// El último valor de `config` para el canal, que se abre una sola vez.
function useConfigRef(config: GagsFrameConfig) {
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  })
  return configRef
}
