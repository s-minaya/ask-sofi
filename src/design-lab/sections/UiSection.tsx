import { useId, useState, type CSSProperties } from 'react'
import { SiteHeader } from '../../components/layout/SiteHeader/SiteHeader'
import { SofiPortrait } from '../../components/sofi/SofiPortrait/SofiPortrait'
import { Burst } from '../../components/ui/Burst/Burst'
import { Button } from '../../components/ui/Button/Button'
import { Counter } from '../../components/ui/Counter/Counter'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { IconButton } from '../../components/ui/IconButton/IconButton'
import {
  CloseIcon,
  SoundOffIcon,
  SoundOnIcon,
} from '../../components/ui/icons/icons'
import {
  Badge,
  ClueList,
  HintList,
  LiveIndicator,
} from '../../components/ui/Indicators/Indicators'
import { Loader } from '../../components/ui/Loader/Loader'
import {
  InlineNotice,
  Notice,
  NoticeActions,
  NoticeRows,
  NoticeText,
} from '../../components/ui/Notice/Notice'
import { OptionPill } from '../../components/ui/OptionGroup/OptionGroup'
import { SkipLink } from '../../components/ui/SkipLink/SkipLink'
import {
  SoundChoice,
  type SoundChoiceValue,
} from '../../components/ui/SoundChoice/SoundChoice'
import { Kicker, KickerRow, StepTag, Tag } from '../../components/ui/Tag/Tag'
import { TextArea, TextField } from '../../components/ui/TextField/TextField'
import { TextLink } from '../../components/ui/TextLink/TextLink'
import { ThemeSwitch } from '../../components/ui/ThemeSwitch/ThemeSwitch'
import { Ticker, TickerPauseButton } from '../../components/ui/Ticker/Ticker'
import { useSound } from '../../hooks/useSound'
import {
  LabCap,
  LabChoice,
  LabCheck,
  LabCode,
  LabGrid,
  LabMast,
  LabNote,
  LabPanel,
  LabReadout,
  LabRow,
  LabSpec,
  LabSplit,
  LabStage,
  LabSub,
  LabToolbar,
  LabUses,
} from '../parts/LabParts'
import { STAGE_WIDTHS, stageMaxWidth, type StageWidth } from '../stageWidths'
import {
  BurstPlayground,
  EmptyStatePlayground,
  IndicatorPlayground,
  InlineNoticePlayground,
  NoticePlayground,
  SelectionPlayground,
  TagPlayground,
} from './PropPlaygrounds'
import styles from './UiSection.module.scss'

const HEADLINES = [
  'Un «no pasa nada» no siempre significa que no pase nada',
  'Sofi confirma: el contexto lo cambia todo',
  'Ninguna lectura es una sentencia',
]

type ButtonVariant = 'primary' | 'secondary' | 'link'
type ButtonSize = 'lg' | 'md' | 'sm'
type ButtonState =
  'rest' | 'hover' | 'active' | 'focus' | 'loading' | 'disabled'

const FORCED = {
  rest: undefined,
  hover: 'hover',
  active: 'active',
  focus: 'focus',
  loading: undefined,
  disabled: undefined,
} as const

function ButtonSpec({ stageMax }: { stageMax?: string }) {
  const [variant, setVariant] = useState<ButtonVariant>('primary')
  const [size, setSize] = useState<ButtonSize>('md')
  const [state, setState] = useState<ButtonState>('rest')
  const [width, setWidth] = useState<'auto' | 'block'>('auto')
  const heights = { lg: '62 px', md: '58 px', sm: '46 px' }
  const props = [
    `variant="${variant}"`,
    size !== 'md' && `size="${size}"`,
    width === 'block' ? 'block' : 'fluid',
    state === 'loading' && 'loading',
    state === 'disabled' && 'disabled',
  ].filter(Boolean)

  return (
    <LabSpec
      id="ui-btn"
      kicker="2.1 · Acciones"
      title="Button"
      desc="La pegatina rosa es la acción que hace avanzar la historia. El secundario y el enlace acompañan, nunca compiten."
      codes={
        <>
          <LabCode>{'<Button variant size>'}</LabCode>
          <LabCode>{'<TextLink>'}</LabCode>
        </>
      }
    >
      <LabSplit>
        <LabPanel>
          <LabChoice
            stacked
            label="Variante"
            value={variant}
            onChange={setVariant}
            options={[
              { value: 'primary', label: 'Principal' },
              { value: 'secondary', label: 'Secundario' },
              { value: 'link', label: 'Enlace' },
            ]}
          />
          <LabChoice
            stacked
            label="Tamaño"
            value={size}
            onChange={setSize}
            options={[
              { value: 'lg', label: 'L · 62' },
              { value: 'md', label: 'M · 58' },
              { value: 'sm', label: 'S · 46' },
            ]}
          />
          <LabChoice
            stacked
            label="Estado"
            value={state}
            onChange={setState}
            options={[
              { value: 'rest', label: 'Reposo' },
              { value: 'hover', label: 'Hover' },
              { value: 'active', label: 'Pulsado' },
              { value: 'focus', label: 'Foco' },
              { value: 'loading', label: 'Cargando' },
              { value: 'disabled', label: 'Desactivado' },
            ]}
          />
          <LabChoice
            stacked
            label="Ancho"
            value={width}
            onChange={setWidth}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'block', label: 'Bloque' },
            ]}
          />
          <LabReadout
            rows={[
              ['Props', variant === 'link' ? '<TextLink>' : props.join(' ')],
              [
                'Alto',
                variant === 'link' ? '44 px de área táctil' : heights[size],
              ],
              [
                'ARIA',
                state === 'loading'
                  ? 'aria-busy="true"'
                  : state === 'disabled'
                    ? 'aria-disabled="true"'
                    : '—',
              ],
            ]}
          />
        </LabPanel>
        <LabStage dots maxWidth={stageMax}>
          <div className={styles.stageRow}>
            {variant === 'link' ? (
              <TextLink
                data-force-state={
                  state === 'hover' || state === 'focus' ? state : undefined
                }
              >
                Editar mensaje y contexto
              </TextLink>
            ) : (
              <Button
                variant={variant}
                size={size}
                block={width === 'block'}
                fluid={width === 'auto'}
                loading={state === 'loading'}
                loadingLabel="Leyendo…"
                disabled={state === 'disabled'}
                arrow={variant === 'primary'}
                data-force-state={FORCED[state]}
              >
                {variant === 'secondary' ? 'Reintentar' : 'Leer entre líneas'}
              </Button>
            )}
          </div>
        </LabStage>
      </LabSplit>

      <LabSub style={{ marginTop: '2.5rem' }}>Estados · principal</LabSub>
      <ButtonMatrix variant="primary" label="Empezar" loadingLabel="Leyendo…" />
      <LabSub style={{ marginTop: '2rem' }}>Estados · secundario</LabSub>
      <ButtonMatrix
        variant="secondary"
        label="Reintentar"
        loadingLabel="Probando…"
      />
      <LabSub style={{ marginTop: '2rem' }}>Estados · enlace</LabSub>
      <LabGrid className={styles.matrix} inert>
        <div>
          <LabCap>Reposo</LabCap>
          <TextLink>Nueva consulta</TextLink>
        </div>
        <div>
          <LabCap>Hover · subrayado rosa</LabCap>
          <TextLink data-force-state="hover">Nueva consulta</TextLink>
        </div>
        <div>
          <LabCap>Foco</LabCap>
          <TextLink data-force-state="focus">Nueva consulta</TextLink>
        </div>
        <div>
          <LabCap>Sobre caja tinta</LabCap>
          <span className={styles.inkBox}>
            <TextLink data-force-state="focus">Ver las versiones</TextLink>
          </span>
        </div>
      </LabGrid>
      <LabUses
        style={{ marginTop: '1.375rem' }}
        items={[
          'Una sola acción principal por pantalla; el resto, secundario o enlace.',
          'En móvil, la acción principal ocupa todo el ancho; en la consulta, además, se queda fija abajo.',
          'Mejor validar al enviar que desactivar: un botón desactivado no explica qué falta.',
          <>
            «Cargando» conserva el ancho, cambia el texto y se anuncia con{' '}
            <LabCode>aria-busy</LabCode>.
          </>,
        ]}
      />
    </LabSpec>
  )
}

function ButtonMatrix({
  variant,
  label,
  loadingLabel,
}: {
  variant: 'primary' | 'secondary'
  label: string
  loadingLabel: string
}) {
  const arrow = variant === 'primary'
  return (
    <LabGrid className={styles.matrix} inert>
      {(
        [
          ['Reposo', {}],
          ['Hover', { 'data-force-state': 'hover' }],
          ['Pulsado', { 'data-force-state': 'active' }],
          ['Foco', { 'data-force-state': 'focus' }],
          ['Cargando', { loading: true }],
          ['Desactivado', { disabled: true }],
        ] as const
      ).map(([caption, extra]) => (
        <div key={caption}>
          <LabCap>{caption}</LabCap>
          <Button
            variant={variant}
            arrow={arrow}
            loadingLabel={loadingLabel}
            {...extra}
          >
            {label}
          </Button>
        </div>
      ))}
    </LabGrid>
  )
}

function IconButtonSpec({ stageMax }: { stageMax?: string }) {
  const [soundOn, setSoundOn] = useState(false)
  const [paused, setPaused] = useState(false)
  return (
    <LabSpec
      id="ui-ibtn"
      kicker="2.2 · Acciones"
      title="IconButton"
      desc="Cuadrado de 44 px con borde de 2 px. Si es un interruptor, se rellena de rosa al activarse y lo dice con aria-pressed. Siempre lleva nombre accesible."
      codes={<LabCode>{'<IconButton label pressed>'}</LabCode>}
    >
      <LabSplit>
        <LabPanel>
          <LabReadout
            rows={[
              ['Sonido', soundOn ? 'Activado' : 'Silenciado'],
              [
                'ARIA',
                `aria-label="Sonido de Sofi" · aria-pressed="${soundOn}"`,
              ],
            ]}
          />
          <LabNote>
            Pulsa los ejemplares: el de sonido es un interruptor; el de pausa,
            el del ticker sobre tinta.
          </LabNote>
        </LabPanel>
        <LabStage dots maxWidth={stageMax}>
          <div className={styles.stageRow} style={{ minHeight: '7.5rem' }}>
            <IconButton
              label="Sonido de Sofi"
              pressed={soundOn}
              onClick={() => setSoundOn((value) => !value)}
            >
              {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
            </IconButton>
            <IconButton label="Cerrar aviso">
              <CloseIcon />
            </IconButton>
            <div style={{ display: 'flex', background: 'var(--tone-ink)' }}>
              <TickerPauseButton
                paused={paused}
                onToggle={() => setPaused((value) => !value)}
                className={styles.pauseAlone}
              />
            </div>
          </div>
        </LabStage>
      </LabSplit>
      <LabSub style={{ marginTop: '2.5rem' }}>Estados</LabSub>
      <LabGrid className={styles.matrix} inert>
        <div>
          <LabCap>Reposo</LabCap>
          <IconButton label="Sonido de Sofi">
            <SoundOffIcon />
          </IconButton>
        </div>
        <div>
          <LabCap>Hover</LabCap>
          <IconButton label="Sonido de Sofi" data-force-state="hover">
            <SoundOffIcon />
          </IconButton>
        </div>
        <div>
          <LabCap>Activado · pressed</LabCap>
          <IconButton label="Sonido de Sofi" pressed>
            <SoundOnIcon />
          </IconButton>
        </div>
        <div>
          <LabCap>Foco</LabCap>
          <IconButton label="Sonido de Sofi" data-force-state="focus">
            <SoundOffIcon />
          </IconButton>
        </div>
      </LabGrid>
    </LabSpec>
  )
}

function SelectionSpec() {
  const [choice, setChoice] = useState<SoundChoiceValue>('off')
  const name = useId()
  return (
    <LabSpec
      id="ui-sel"
      kicker="2.3 · Selección"
      title="ThemeSwitch y SoundChoice"
      desc="Los dos controles de selección que pide la feature: el tema de la interfaz y el sonido antes de entrar. Estos ejemplares están conectados al laboratorio."
      codes={
        <>
          <LabCode>{'<ThemeSwitch>'}</LabCode>
          <LabCode>{'<SoundChoice>'}</LabCode>
        </>
      }
    >
      <LabGrid min={340}>
        <div>
          <LabCap>ThemeSwitch · completo, desde 760 px</LabCap>
          <ThemeSwitch display="text" />
          <LabNote style={{ marginTop: '1rem' }}>
            Botones con aria-pressed dentro de un grupo con nombre. «Sistema»
            sigue a prefers-color-scheme; una elección explícita manda.
          </LabNote>
        </div>
        <div>
          <LabCap>ThemeSwitch · compacto, en cabeceras estrechas</LabCap>
          <ThemeSwitch display="icon" />
          <LabNote style={{ marginTop: '1rem' }}>
            Sustituye al interruptor sol/luna de las pantallas móviles
            aprobadas: así «Sistema» también existe en móvil. Ocupa 128 px.
          </LabNote>
        </div>
        <div>
          <LabCap>SoundChoice · antes de entrar</LabCap>
          <SoundChoice value={choice} onChange={setChoice} />
          <LabNote style={{ marginTop: '1rem' }}>
            Radios nativos en un fieldset. Empieza en «Sin sonido»; el audio se
            prepara al pulsar «Empezar», nunca antes.
          </LabNote>
        </div>
      </LabGrid>
      <LabSub style={{ marginTop: '2.25rem' }}>Estados · opción</LabSub>
      <LabGrid className={styles.matrix} inert>
        <div>
          <LabCap>Reposo</LabCap>
          <OptionPill
            name={`${name}-a`}
            value="on"
            label="Con sonido"
            checked={false}
          />
        </div>
        <div>
          <LabCap>Hover</LabCap>
          <OptionPill
            name={`${name}-b`}
            value="on"
            label="Con sonido"
            checked={false}
            data-force-state="hover"
          />
        </div>
        <div>
          <LabCap>Seleccionada</LabCap>
          <OptionPill
            name={`${name}-c`}
            value="on"
            label="Con sonido"
            checked
          />
        </div>
        <div>
          <LabCap>Foco</LabCap>
          <OptionPill
            name={`${name}-d`}
            value="on"
            label="Con sonido"
            checked={false}
            data-force-state="focus"
          />
        </div>
        <div>
          <LabCap>Ancho completo · móvil</LabCap>
          <span
            style={
              {
                display: 'flex',
                gap: '0.5rem',
                width: '100%',
                '--option-flex': '1 1 0',
              } as CSSProperties
            }
          >
            <OptionPill
              name={`${name}-e`}
              value="off"
              label="Sin sonido"
              checked
            />
            <OptionPill
              name={`${name}-e`}
              value="on"
              label="Con sonido"
              checked={false}
            />
          </span>
        </div>
      </LabGrid>
      <SelectionPlayground />
    </LabSpec>
  )
}

function FieldSpec({ stageMax }: { stageMax?: string }) {
  const [value, setValue] = useState(
    'Antes de dar nada por hecho, pregúntale cómo lo lleva.',
  )
  const [checked, setChecked] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const invalid = checked && value.trim().length === 0
  return (
    <LabSpec
      id="ui-field"
      kicker="2.4 · Formularios"
      title="TextField y TextArea"
      desc="La base de todos los campos: etiqueta, ayuda, control, contador y error, bien conectados. La burbuja del mensaje y el cupón del contexto son pieles de esta base y viven en Sofi Components."
      codes={
        <>
          <LabCode>{'<TextField>'}</LabCode>
          <LabCode>{'<TextArea>'}</LabCode>
          <LabCode>{'<FieldMessage>'}</LabCode>
        </>
      }
    >
      <div className={styles.anatomy}>
        <LabStage plain maxWidth={stageMax}>
          <div className={styles.anatomyField}>
            <TextArea
              label="Texto de prueba para Sofi"
              help="Motion & Sound lo usa para probar la escritura con tu propio texto."
              placeholder="Escribe aquí lo que quieres que diga Sofi…"
              value={value}
              onChange={(next) => {
                setValue(next)
                if (next.trim()) setChecked(false)
              }}
              disabled={disabled}
              error={
                invalid ? 'Escribe algo para que Sofi pueda leerlo.' : undefined
              }
              showCount
            />
          </div>
          <LabRow
            style={{
              paddingLeft: '2rem',
              marginTop: '1rem',
              gap: '0.75rem 1.25rem',
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setChecked(true)}
            >
              Comprobar
            </Button>
            <LabCheck
              label="Desactivado"
              checked={disabled}
              onChange={setDisabled}
            />
          </LabRow>
        </LabStage>
        <ol className={styles.legend}>
          <li>
            <span className={styles.pin}>1</span>
            <span>
              <strong>Etiqueta</strong> · Space Grotesk 700, 15 px. Siempre
              visible, unida con for/id.
            </span>
          </li>
          <li>
            <span className={styles.pin}>2</span>
            <span>
              <strong>Ayuda</strong> · 14 px tinta 2, enlazada con
              aria-describedby.
            </span>
          </li>
          <li>
            <span className={styles.pin}>3</span>
            <span>
              <strong>Control</strong> · papel, 2 px tinta, 52 px de alto
              mínimo, 17 px de texto.
            </span>
          </li>
          <li>
            <span className={styles.pin}>4</span>
            <span>
              <strong>Contador</strong> · informativo, cifras tabulares. Sin
              límite inventado: si algún día hay máximo, lo fija la spec.
            </span>
          </li>
          <li>
            <span className={styles.pin}>5</span>
            <span>
              <strong>Error</strong> · aparece al enviar, no mientras escribes;
              icono pixel + texto cereza y aria-invalid. Se va en cuanto el
              campo es válido.
            </span>
          </li>
        </ol>
      </div>
      <LabSub style={{ marginTop: '2.5rem' }}>Estados · TextField</LabSub>
      <LabGrid
        className={`${styles.matrix} ${styles.matrixStretch} ${styles.fieldStates}`}
        min={300}
        inert
      >
        <div>
          <LabCap>Vacío</LabCap>
          <TextField
            label="Nombre del escenario"
            value=""
            onChange={() => {}}
            placeholder="Nombre del escenario"
          />
        </div>
        <div>
          <LabCap>Hover</LabCap>
          <TextField
            label="Nombre del escenario"
            value=""
            onChange={() => {}}
            placeholder="Nombre del escenario"
            forceState="hover"
          />
        </div>
        <div>
          <LabCap>Foco</LabCap>
          <TextField
            label="Nombre del escenario"
            value="Carga lenta"
            onChange={() => {}}
            forceState="focus"
          />
        </div>
        <div>
          <LabCap>Relleno</LabCap>
          <TextField
            label="Nombre del escenario"
            value="Carga lenta"
            onChange={() => {}}
          />
        </div>
        <div>
          <LabCap>Error</LabCap>
          <TextField
            label="Nombre del escenario"
            value=""
            onChange={() => {}}
            placeholder="Nombre del escenario"
            error="Ponle un nombre al escenario."
          />
        </div>
        <div>
          <LabCap>Desactivado</LabCap>
          <TextField
            label="Nombre del escenario"
            value="Carga lenta"
            onChange={() => {}}
            disabled
          />
        </div>
      </LabGrid>
    </LabSpec>
  )
}

function NavigationSpec() {
  const sound = useSound()
  return (
    <LabSpec
      id="ui-nav"
      kicker="2.5 · Navegación"
      title="SiteHeader, SkipLink, Ticker y enlaces"
      desc="La cabecera es la misma pieza en todos los anchos: se reorganiza, no se sustituye. El logo vuelve siempre a la portada."
      codes={
        <>
          <LabCode>{'<SiteHeader>'}</LabCode>
          <LabCode>{'<SkipLink>'}</LabCode>
          <LabCode>{'<Ticker>'}</LabCode>
          <LabCode>{'<StepTag>'}</LabCode>
        </>
      }
    >
      <LabSub>SiteHeader · ancho</LabSub>
      <div className={styles.frame}>
        <SiteHeader
          onHome={() => {}}
          tag="En directo"
          kicker="El consultorio de Sofi"
          soundEnabled={sound.enabled}
          onToggleSound={sound.toggle}
        />
      </div>
      <LabGrid min={340} style={{ marginTop: '1.75rem' }}>
        <div>
          <LabCap>SiteHeader · compacto, menos de 760 px</LabCap>
          {/* Un iframe de 390 px: la cabecera responde a sus media queries reales. */}
          <iframe
            className={`${styles.frame} ${styles.frameNarrow}`}
            src="/design-lab?frame=header"
            title="Cabecera compacta a 390 px"
          />
          <LabNote style={{ marginTop: '0.875rem' }}>
            132 + 128 + 44 px caben en 358 px útiles. Se quita el antetítulo,
            nunca un control.
          </LabNote>
        </div>
        <div>
          <LabCap>SkipLink · visible al recibir foco</LabCap>
          <div className={`${styles.frame} ${styles.skipFrame}`} inert>
            <SkipLink href="#ui-nav" data-force-state="focus" />
            <div className={styles.skipGhost}>
              <span />
              <span />
            </div>
          </div>
          <LabNote style={{ marginTop: '0.875rem' }}>
            Primer elemento enfocable de cada pantalla. Nuevo: no estaba en las
            pantallas aprobadas.
          </LabNote>
        </div>
      </LabGrid>
      <LabSub style={{ marginTop: '2.25rem' }}>
        Ticker · titulares con pausa
      </LabSub>
      <div style={{ border: '2.5px solid var(--tone-ink)' }}>
        <Ticker label="Última hora" headlines={HEADLINES} />
      </div>
      <LabUses
        style={{ marginTop: '1rem' }}
        items={[
          'Solo en la portada. Pausable siempre (WCAG 2.2.2) y quieto con movimiento reducido.',
          'Los titulares duplicados del bucle van con aria-hidden: el lector los oye una vez.',
        ]}
      />
      <LabGrid style={{ marginTop: '2rem' }}>
        <div>
          <LabCap>StepTag</LabCap>
          <StepTag step={1} label="El mensaje" />
          <StepTag step={2} label="El contexto · opcional, pero clave" />
        </div>
        <div>
          <LabCap>TextLink · acciones terciarias</LabCap>
          <LabRow style={{ gap: '0.25rem 1.5rem' }}>
            <TextLink>Nueva consulta</TextLink>
            <TextLink>Editar mensaje y contexto</TextLink>
            <TextLink>Borrar todo</TextLink>
          </LabRow>
        </div>
        <div>
          <LabCap>Enlace de continuación</LabCap>
          <TextLink href="#ui-tags" continues>
            Ver las versiones
          </TextLink>
          <LabNote>
            Salta dentro de la misma página. El cursor pixel parpadea; con
            movimiento reducido, fijo.
          </LabNote>
        </div>
      </LabGrid>
    </LabSpec>
  )
}

function TagsSpec() {
  return (
    <LabSpec
      id="ui-tags"
      kicker="2.6 · Etiquetas e indicadores"
      title="Tag, Burst, pistas y contadores"
      desc="El vocabulario de portada. Etiquetan, no se pulsan: ninguna de estas piezas tiene hover ni cursor de mano."
      codes={
        <>
          <LabCode>{'<Tag tone>'}</LabCode>
          <LabCode>{'<Kicker>'}</LabCode>
          <LabCode>{'<Burst>'}</LabCode>
          <LabCode>{'<HintList>'}</LabCode>
          <LabCode>{'<ClueList>'}</LabCode>
        </>
      }
    >
      <LabGrid min={340} className={styles.cells}>
        <div>
          <LabCap>Tag · tonos</LabCap>
          <LabRow style={{ gap: '0.625rem' }}>
            <Tag>Exclusiva</Tag>
            <Tag tone="pink">En directo</Tag>
            <Tag tone="pink">Última hora</Tag>
            <Tag tone="lilac">Demo</Tag>
            <Tag tone="butter">Nuevo</Tag>
            <Tag tone="cherry">Error</Tag>
            <Tag tone="outline">Opcional</Tag>
          </LabRow>
          <LabNote>
            Tinta por defecto; rosa solo para lo que pasa ahora; lila para demo;
            cereza solo para errores.
          </LabNote>
        </div>
        <div>
          <LabCap>Kicker · antetítulo</LabCap>
          <KickerRow tag="Exclusiva" kicker="Sofi lo cuenta todo" />
          <Kicker as="p">Sobre «Vale. Que te lo pases bien.»</Kicker>
          <LabNote>
            Siempre encima de un titular o de un grupo. Nunca solo.
          </LabNote>
        </div>
        <div>
          <LabCap>Burst · estallido</LabCap>
          <LabRow style={{ gap: '1.125rem' }}>
            <Burst
              kicker="Consulta"
              size={104}
              rotate={10}
              kickerSize={9}
              mainSize={26}
            >
              0&nbsp;€
            </Burst>
            <Burst
              kicker="La más probable"
              size={118}
              rotate={12}
              kickerSize={10}
              mainSize={13}
              mainWeight={700}
              mainGap={3}
            >
              (no la única)
            </Burst>
          </LabRow>
          <LabNote>
            Texto real, no imagen. Máximo uno por pantalla y nunca encima de una
            cifra.
          </LabNote>
        </div>
        <div>
          <LabCap>LiveIndicator · Sofi atenta</LabCap>
          <LiveIndicator>Sofi está escuchando</LiveIndicator>
          <LabNote>
            El cuadrado es decorativo; el estado lo dice el texto.
          </LabNote>
        </div>
        <div>
          <LabCap>HintList · sugerencias del contexto</LabCap>
          <HintList
            label="Pistas para el contexto"
            hints={[
              '¿Qué pasó antes?',
              '¿Cómo suele escribirte?',
              '¿Es su tono de siempre?',
            ]}
          />
          <LabNote>
            Lista, no botones: ayudan a pensar, no rellenan nada.
          </LabNote>
        </div>
        <div>
          <LabCap>ClueList · pistas de una versión</LabCap>
          <ClueList clues={['Punto final', 'Sin emojis', 'Plan cancelado']} />
          <LabNote>
            Toma el color del texto: tinta sobre rosa, crema sobre tinta.
          </LabNote>
        </div>
        <div>
          <LabCap>Counter</LabCap>
          <LabRow style={{ gap: '1.25rem' }}>
            <Counter count={27} />
            <Counter count={232} />
            <Counter count={1} />
          </LabRow>
          <LabNote>
            Informativo y en singular cuando toca. No se anuncia en cada
            pulsación.
          </LabNote>
        </div>
        <div>
          <LabCap>Badge · con pips</LabCap>
          <Badge tone="fill" pips={{ filled: 2 }}>
            Confianza:&nbsp;<strong>media</strong>
          </Badge>
          <LabNote>
            La base de las insignias de fiabilidad (Sofi Components 3.8).
          </LabNote>
        </div>
      </LabGrid>
      <>
        <TagPlayground />
        <BurstPlayground />
        <IndicatorPlayground />
      </>
    </LabSpec>
  )
}

function FeedbackSpec() {
  return (
    <LabSpec
      id="ui-feed"
      kicker="2.7 · Feedback"
      title="Notice, Loader y EmptyState"
      desc="Cajas de revista a todo color para avisar, y una barra de celdas para esperar. El color acompaña; el aviso lo cuentan el antetítulo y el texto."
      codes={
        <>
          <LabCode>{'<Notice tone>'}</LabCode>
          <LabCode>{'<InlineNotice>'}</LabCode>
          <LabCode>{'<Loader>'}</LabCode>
          <LabCode>{'<EmptyState>'}</LabCode>
        </>
      }
    >
      <div className={styles.notices}>
        <Notice
          tone="attention"
          kicker="Atención"
          title={
            <>
              La letra pequeña{' '}
              <span style={{ fontWeight: 600 }}>(que aquí no es pequeña)</span>
            </>
          }
        >
          <NoticeText>
            Los porcentajes reparten el apoyo entre estas versiones según lo que
            me has contado. No miden lo que siente tu pareja.
          </NoticeText>
        </Notice>
        <Notice tone="info" kicker="Demo" title="Estás viendo datos simulados">
          <NoticeText>
            Esta vista previa no hace peticiones: lo que escribas aquí no sale
            de tu navegador.
          </NoticeText>
        </Notice>
        <Notice
          tone="danger"
          kicker="Error de conexión"
          title="Se ha cortado la línea"
        >
          <NoticeText>
            No he podido leer tu mensaje esta vez. Tu mensaje y tu contexto
            siguen aquí: no se ha perdido nada.
          </NoticeText>
          <NoticeActions>
            <Button variant="secondary" size="sm">
              Reintentar
            </Button>
            <TextLink>Editar mensaje</TextLink>
          </NoticeActions>
        </Notice>
        <Notice
          tone="ink"
          kicker="Contexto parcial"
          title="Me falta un dato (o dos)"
        >
          <NoticeRows
            items={[
              '¿Ya sabía que ese día era el cumple de Marta?',
              '¿Cómo suele reaccionar cuando cambian los planes?',
            ]}
          />
          <div style={{ marginTop: '1.375rem' }}>
            <Button size="sm" arrow>
              Añadir contexto
            </Button>
          </div>
        </Notice>
      </div>
      <LabNote style={{ marginTop: '1rem', maxWidth: '72ch' }}>
        Un error que aparece después de una acción se inserta con role="alert" y
        lleva el foco a su titular; los avisos que no interrumpen usan
        role="status". Aquí son ejemplares estáticos y no se anuncian.
      </LabNote>
      <LabSub style={{ marginTop: '2.5rem' }}>
        InlineNotice · avisos de una línea
      </LabSub>
      <div className={styles.inlineNotices}>
        <InlineNotice icon={<SoundOffIcon size={18} />}>
          <span>Tu navegador ha bloqueado el sonido.</span>
          <TextLink size="sm">Activar sonido</TextLink>
          <TextLink size="sm">Seguir sin sonido</TextLink>
        </InlineNotice>
        <InlineNotice tone="plain" icon={<SoundOffIcon size={18} />}>
          <span>
            El sonido no está disponible. Sofi seguirá escribiendo en silencio.
          </span>
        </InlineNotice>
      </div>
      <LabGrid min={340} style={{ marginTop: '2.25rem' }}>
        <div>
          <LabCap>Loader · indeterminado</LabCap>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <p
              style={{
                fontSize: '0.9375rem',
                lineHeight: 1.5,
                fontWeight: 600,
              }}
            >
              Leyendo entre líneas…
            </p>
            <Loader />
          </div>
          <LabNote style={{ marginTop: '0.875rem' }}>
            Anuncia el estado con role="status". Con movimiento reducido
            desaparecen las celdas y queda el texto.
          </LabNote>
        </div>
        <div>
          <LabCap>Spinner · dentro del botón</LabCap>
          <Button loading loadingLabel="Leyendo…">
            Leer entre líneas
          </Button>
          <LabNote style={{ marginTop: '1.375rem' }}>
            Tres píxeles en secuencia. Solo junto a un texto que diga qué está
            pasando.
          </LabNote>
        </div>
        <div>
          <LabCap>Overlays</LabCap>
          <p className={styles.bigNote}>Ninguno en 002</p>
          <LabNote style={{ marginTop: '0.625rem' }}>
            Ningún flujo de esta feature necesita un modal ni un toast. Cuando
            aparezca un caso real, se diseñará aquí.
          </LabNote>
        </div>
      </LabGrid>
      <LabSub style={{ marginTop: '2.5rem' }}>EmptyState</LabSub>
      <EmptyState
        titleAs="p"
        title="Aquí aún no hay salseo"
        text="Cuando me pegues un mensaje, aquí aparecerán todas sus versiones."
        illustration={
          <SofiPortrait
            size={192}
            expression="attentive"
            crop={{
              width: 96,
              height: 96,
              offsetX: 48,
              offsetY: 42,
              background: 'var(--tone-pink-soft)',
              frame: 'sticker',
            }}
          />
        }
        action={<Button arrow>Empezar una consulta</Button>}
      />
      <>
        <NoticePlayground />
        <InlineNoticePlayground />
        <EmptyStatePlayground />
      </>
    </LabSpec>
  )
}

export function UiSection() {
  const [width, setWidth] = useState<StageWidth>('full')
  const stageMax = stageMaxWidth(width)
  return (
    <>
      <LabMast
        titleId="ui-h1"
        tag="Sección 02"
        kicker="Acciones, selección, campos, navegación y feedback"
        title="UI Components"
        deck="Las piezas genéricas: sirven fuera del laboratorio y no saben nada de Sofi. Cada una con sus variantes, sus estados y un ejemplar vivo."
        jumps={[
          { href: '#ui-btn', num: '2.1', label: 'Button' },
          { href: '#ui-ibtn', num: '2.2', label: 'IconButton' },
          { href: '#ui-sel', num: '2.3', label: 'Selección' },
          { href: '#ui-field', num: '2.4', label: 'Campos' },
          { href: '#ui-nav', num: '2.5', label: 'Navegación' },
          { href: '#ui-tags', num: '2.6', label: 'Etiquetas e indicadores' },
          { href: '#ui-feed', num: '2.7', label: 'Feedback' },
        ]}
      />
      <LabToolbar>
        <LabChoice
          label="Ancho del contenedor"
          options={STAGE_WIDTHS}
          value={width}
          onChange={setWidth}
        />
        <LabNote>
          Los escenarios cambian de ancho; los componentes responden a su
          contenedor, no a la ventana.
        </LabNote>
      </LabToolbar>
      <ButtonSpec stageMax={stageMax} />
      <IconButtonSpec stageMax={stageMax} />
      <SelectionSpec />
      <FieldSpec stageMax={stageMax} />
      <NavigationSpec />
      <TagsSpec />
      <FeedbackSpec />
    </>
  )
}
