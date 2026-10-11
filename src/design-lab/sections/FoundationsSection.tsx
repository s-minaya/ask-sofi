import { Fragment, type ReactNode } from 'react'
import {
  BubbleFrame,
  BubbleTail,
} from '../../components/sofi/MessageBubble/MessageBubble'
import { SofiDialogText } from '../../components/sofi/SofiDialog/SofiDialog'
import { SofiPortrait } from '../../components/sofi/SofiPortrait/SofiPortrait'
import { SpeechCaret } from '../../components/sofi/SofiSpeech/SofiSpeech'
import { DEFAULT_SPEECH_TIMING } from '../../components/sofi/SofiSpeech/speechTimeline'
import { Burst } from '../../components/ui/Burst/Burst'
import { Button } from '../../components/ui/Button/Button'
import { Counter } from '../../components/ui/Counter/Counter'
import { IconButton } from '../../components/ui/IconButton/IconButton'
import {
  CloseIcon,
  ErrorPixelIcon,
  LiveSquareIcon,
  LockIcon,
  MoonIcon,
  MoreIcon,
  PauseIcon,
  PlayIcon,
  RetryIcon,
  ScissorsIcon,
  SoundOffIcon,
  SoundOnIcon,
  SparkIcon,
  SunIcon,
  SystemIcon,
} from '../../components/ui/icons/icons'
import { Loader } from '../../components/ui/Loader/Loader'
import { Logo } from '../../components/ui/Logo/Logo'
import { OptionPill } from '../../components/ui/OptionGroup/OptionGroup'
import { Spinner } from '../../components/ui/Spinner/Spinner'
import { Kicker, KickerRow, Tag } from '../../components/ui/Tag/Tag'
import { TextLink } from '../../components/ui/TextLink/TextLink'
import { Ticker } from '../../components/ui/Ticker/Ticker'
import { cx } from '../../utils/cx'
import { formatPercent } from '../../utils/format'
import { contrastLevel, contrastRatio, formatRatio } from '../contrast'
import {
  CONTRAST_PAIRS,
  DURATIONS_MS,
  PALETTE,
  SEMANTIC_TOKENS,
  SPACE_SCALE,
  THRESHOLDS,
  displayValue,
  formatDuration,
  type Theme,
} from '../foundationsData'
import {
  LabCap,
  LabCode,
  LabCodes,
  LabGrid,
  LabJumpLink,
  LabMast,
  LabNote,
  LabProv,
  LabRow,
  LabSpec,
  LabSub,
} from '../parts/LabParts'
import styles from './FoundationsSection.module.scss'

// --- 1.1 · Paleta de marca ---

function PaletteSpec() {
  return (
    <LabSpec
      id="f-color"
      kicker="1.1 · Color"
      title="Paleta de marca"
      desc="Tinta y crema hacen el trabajo; rosa, mantequilla y lila ponen el titular. La franja de la derecha es el valor en tema oscuro cuando cambia."
    >
      <LabGrid as="ul" min={250} cellPadding="1.125rem 1.125rem 1.375rem">
        {PALETTE.map((color) => (
          <li key={color.name} className={styles.paletteItem}>
            {color.isNew && (
              <Tag tone="butter" className={styles.newTag}>
                Nuevo
              </Tag>
            )}
            <div className={styles.chip} style={{ background: color.hex }}>
              {color.dark && (
                <span
                  className={styles.chipDark}
                  style={{
                    background: color.dark.background,
                    color: color.dark.color,
                  }}
                >
                  {color.dark.label}
                </span>
              )}
            </div>
            <div>
              <p className={styles.colorName}>{color.name}</p>
              <p className={styles.hex}>{color.hex.toUpperCase()}</p>
            </div>
            <LabCodes>
              {color.tokens.map((token) => (
                <LabCode key={token}>{token}</LabCode>
              ))}
            </LabCodes>
            <LabNote>{color.note}</LabNote>
          </li>
        ))}
      </LabGrid>
    </LabSpec>
  )
}

// --- 1.2 · Tokens semánticos ---

// Cada panel fuerza su tema: las muestras leen el token real dentro de él.
function TokenPanel({ theme }: { theme: Theme }) {
  const light = theme === 'light'
  return (
    <div
      className={cx(styles.panel, !light && styles.panelDark)}
      data-theme={theme}
    >
      <KickerRow
        tag={light ? 'Claro' : 'Oscuro'}
        kicker={light ? 'Tinta sobre crema' : 'Crema sobre tinta'}
        className={styles.panelHead}
      />
      <ul>
        {SEMANTIC_TOKENS.map((token) => (
          <li key={token.name} className={styles.token}>
            <span
              className={styles.swatch}
              style={{ background: `var(${token.name})` }}
            />
            <div>
              <LabCode>{token.name}</LabCode>
              <LabNote style={{ marginTop: '0.25rem' }}>{token.role}</LabNote>
            </div>
            <span className={styles.tokenValue}>
              {displayValue(token, theme)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TokensSpec() {
  return (
    <LabSpec
      id="f-tokens"
      kicker="1.2 · Color"
      title="Tokens semánticos"
      desc="Los componentes solo leen estos nombres. Los dos temas se diseñan a la vez, no se invierten: el oscuro aclara el rosa y pasa el foco a mantequilla."
      codes={
        <>
          <LabCode>[data-theme="light"]</LabCode>
          <LabCode>[data-theme="dark"]</LabCode>
        </>
      }
    >
      <div className={styles.themes}>
        <TokenPanel theme="light" />
        <TokenPanel theme="dark" />
      </div>
      <LabNote style={{ marginTop: '1.125rem', maxWidth: '72ch' }}>
        Mantequilla, lila, rosa chicle y cereza no cambian con el tema: sus
        cajas llevan siempre texto tinta (blanco en cereza) y fijan su propio
        foco tinta para que el anillo mantequilla del tema oscuro no desaparezca
        sobre ellas.
      </LabNote>
    </LabSpec>
  )
}

// --- 1.3 · Contraste ---

function ContrastSpec() {
  return (
    <LabSpec
      id="f-contrast"
      kicker="1.3 · Color"
      title="Contraste comprobado"
      desc="Parejas de texto permitidas, con su ratio WCAG 2.2. El mínimo para texto normal es 4,5:1; los elementos gráficos y el foco piden 3:1."
    >
      <LabGrid as="ul" min={220} cellPadding="0.875rem">
        {CONTRAST_PAIRS.map((pair) => {
          const ratio = contrastRatio(pair.foreground, pair.background)
          const level = contrastLevel(ratio)
          return (
            <li key={pair.label} className={styles.pair}>
              <span
                className={styles.pairSample}
                aria-hidden="true"
                // El contraejemplo «no apto» es una muestra, no un texto que haya que leer.
                data-contrast={level ? undefined : 'insuficiente'}
                style={{ background: pair.background, color: pair.foreground }}
              >
                Aa
              </span>
              <div>
                <p className={styles.pairLabel}>{pair.label}</p>
                <p className={styles.pairRatio}>
                  {formatRatio(ratio)}
                  <span className={cx(styles.level, !level && styles.levelBad)}>
                    {level ?? 'No apto para texto'}
                  </span>
                </p>
              </div>
            </li>
          )
        })}
      </LabGrid>
      <LabNote style={{ marginTop: '1.125rem', maxWidth: '72ch' }}>
        La regla suave (--color-rule-soft) solo separa filas: nunca se usa para
        texto ni para delimitar un control. Si un texto no aparece en esta
        lista, no tiene contraste comprobado.
      </LabNote>
    </LabSpec>
  )
}

// --- 1.4 · Tipografía ---

type ScaleRow = {
  label: string
  code: string
  sample: ReactNode
  spec: ReadonlyArray<string>
}

const SCALE: ReadonlyArray<ScaleRow> = [
  {
    label: 'Display XL',
    code: 'u.type-display-xl',
    sample: (
      <p className={styles.displayXl}>
        ¿Qué ha querido decir con <span className={styles.hit}>«vale»</span>?
      </p>
    ),
    spec: [
      'Bodoni 900 cursiva',
      '46 → 116 px · interlínea 0,9',
      'tracking −0,04 em · titular de portada',
    ],
  },
  {
    label: 'Display L',
    code: 'u.type-display-l',
    sample: <p className={styles.displayL}>Cuatro versiones de la historia</p>,
    spec: [
      '44 → 92 px · interlínea 0,92',
      'tracking −0,04 em · titular de lectura',
    ],
  },
  {
    label: 'Cifra',
    code: 'u.type-figure',
    sample: (
      <p className={styles.figure}>
        52<span className={styles.unit}>%</span>
      </p>
    ),
    spec: [
      '96 → 150 px · interlínea 0,82',
      'el signo % a 0,42 em, separado 0,08 em',
      'versiones secundarias: u.type-figure-s (56 → 44 px)',
    ],
  },
  {
    label: 'Display M',
    code: 'u.type-display-m',
    sample: <p className={styles.displayM}>Pégalo tal cual te llegó</p>,
    spec: [
      '34 → 50 px · interlínea 0,98',
      'tracking −0,03 em · etiquetas de los pasos',
    ],
  },
  {
    label: 'Titular',
    code: 'u.type-head',
    sample: <p className={styles.head}>Le ha sentado regular</p>,
    spec: [
      '30 px (25 en contenedor estrecho)',
      'interlínea 1 · versiones y cajas',
    ],
  },
  {
    label: 'Nombre',
    code: 'u.type-name',
    sample: (
      <p>
        <span className={styles.nameSample}>Sofi</span>
      </p>
    ),
    spec: ['24 px · 20 y 17 px en compacto', 'solo en la pestaña del diálogo'],
  },
  {
    label: 'Diálogo',
    code: '<SofiDialogText>',
    sample: (
      <SofiDialogText className={styles.dialogText}>
        Un «vale» con punto y sin emoji, de alguien que normalmente te manda
        medio teclado…
      </SofiDialogText>
    ),
    spec: [
      'Space Grotesk 500',
      '23 px · interlínea 1,5',
      '18 px en contenedor estrecho',
    ],
  },
  {
    label: 'Entradilla',
    code: 'u.type-deck',
    sample: (
      <p className={styles.deck}>
        Sofi lee entre líneas y te cuenta todas las versiones de la historia que
        se sostienen.
      </p>
    ),
    spec: [
      '20 px · interlínea 1,5 · 16 px en móvil',
      'medida máxima 40 caracteres',
    ],
  },
  {
    label: 'Cuerpo',
    code: 'u.type-body',
    sample: (
      <p className={styles.body}>
        Contaba con esa comida y el cambio le ha decepcionado. El punto final y
        la falta de emojis encajan con esta lectura.
      </p>
    ),
    spec: ['17 px · interlínea 1,55', 'medida 46–62 caracteres'],
  },
  {
    label: 'Secundario',
    code: 'u.type-small',
    sample: (
      <p className={styles.small}>
        No te lo va a pedir, pero agradecería que propusieras otro día para ir a
        esa comida.
      </p>
    ),
    spec: ['15 px · interlínea 1,5 · texto secundario'],
  },
  {
    label: 'Antetítulo y etiqueta',
    code: '<Kicker> · <Tag>',
    sample: <KickerRow tag="Exclusiva" kicker="Sofi lo cuenta todo" />,
    spec: [
      '12 px · 700 · mayúsculas',
      'tracking +0,1 em · nunca en frases largas',
    ],
  },
  {
    label: 'Micro',
    code: 'u.type-micro · <Counter>',
    sample: <Counter count={27} />,
    spec: ['12 px · cifras tabulares', 'contadores y metadatos'],
  },
]

type MicroRule = { title: string; yes: string; no: string }

const MICROTYPOGRAPHY: ReadonlyArray<MicroRule> = [
  {
    title: 'Comillas',
    yes: 'Un «vale» con punto. Dentro: «me dijo “vale” y ya».',
    no: 'Un "vale" con punto.',
  },
  {
    title: 'Porcentajes',
    yes: `En texto: un ${formatPercent(52)} con espacio fino. En cifra grande, el signo reducido.`,
    no: 'Un 52% pegado en mitad de una frase.',
  },
  {
    title: 'Interrogación y exclamación',
    yes: '¿Ya sabía lo del cumple? ¡Falta el salseo!',
    no: 'Ya sabía lo del cumple?',
  },
  {
    title: 'Puntos suspensivos e incisos',
    yes: 'Medio teclado… Un carácter. Incisos con raya —así—.',
    no: 'Medio teclado... Incisos con guion - así -.',
  },
  {
    title: 'Mayúsculas',
    yes: 'Solo en antetítulos, etiquetas y botones, con tracking.',
    no: 'Titulares o frases enteras en mayúsculas.',
  },
  {
    title: 'Tamaños mínimos',
    yes: 'Bodoni desde 15 px y solo en cursiva de apoyo.',
    no: 'Párrafos o controles en Bodoni.',
  },
]

function TypeSpec() {
  return (
    <LabSpec
      id="f-type"
      kicker="1.4 · Tipografía"
      title="Dos voces: revista y pantalla"
      desc="Bodoni Moda pone el drama en titulares y cifras; Space Grotesk se encarga de todo lo que hay que leer o pulsar, incluida la voz de Sofi en el diálogo."
    >
      <div className={styles.families}>
        <div>
          <Kicker as="p">Display · titulares y cifras</Kicker>
          <p className={cx(styles.aa, styles.aaDisplay)}>Aa</p>
          <p className={styles.familyName}>Bodoni Moda</p>
          <LabNote style={{ marginTop: '0.625rem' }}>
            900 cursiva en titulares · 700 cursiva en apartes · 600 en
            paréntesis. Óptico automático: el eje opsz afina el contraste a cada
            tamaño.
          </LabNote>
        </div>
        <div>
          <Kicker as="p">Interfaz · lectura y controles</Kicker>
          <p className={cx(styles.aa, styles.aaUi)}>Aa</p>
          <p className={styles.familyName}>Space Grotesk</p>
          <LabNote style={{ marginTop: '0.625rem' }}>
            400 en lectura larga · 500 en diálogo y campos · 600 en controles ·
            700 en antetítulos, etiquetas y botones.
          </LabNote>
        </div>
      </div>

      <LabSub style={{ marginTop: '2.75rem' }}>Escala</LabSub>
      <div>
        {SCALE.map((row) => (
          <div key={row.label} className={styles.scaleRow}>
            <div className={styles.scaleMeta}>
              <LabCap style={{ margin: 0 }}>{row.label}</LabCap>
              <LabCode>{row.code}</LabCode>
            </div>
            {row.sample}
            <p className={styles.scaleSpec}>
              {row.spec.map((line, index) => (
                <Fragment key={line}>
                  {index > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </p>
          </div>
        ))}
      </div>

      <LabSub style={{ marginTop: '2.75rem' }}>
        Microtipografía en español
      </LabSub>
      <LabGrid as="ul" min={300} cellPadding="1.25rem 1.25rem 1.375rem">
        {MICROTYPOGRAPHY.map((rule) => (
          <li key={rule.title} className={styles.microItem}>
            <Kicker as="p">{rule.title}</Kicker>
            {/* El tachado no llega a los lectores de pantalla: la marca se dice en texto oculto. */}
            <p className={styles.yes}>
              <span className={styles.mark} aria-hidden="true">
                SÍ
              </span>
              <span>
                <span className={styles.srOnly}>Correcto: </span>
                {rule.yes}
              </span>
            </p>
            <p className={styles.no}>
              <span className={styles.mark} aria-hidden="true">
                NO
              </span>
              <span>
                <span className={styles.srOnly}>Incorrecto: </span>
                {rule.no}
              </span>
            </p>
          </li>
        ))}
      </LabGrid>
    </LabSpec>
  )
}

// --- 1.5 · Espacio y retícula ---

type Diagram = {
  kicker: string
  columns: string
  cells: ReadonlyArray<[string, string?]>
  codes: ReadonlyArray<string>
  base?: boolean
}

const LAYOUTS: ReadonlyArray<Diagram> = [
  {
    kicker: `Portada · desde ${THRESHOLDS.columns} px`,
    columns: '7fr 5fr',
    cells: [['Titular, sonido y Empezar'], ['Fotomatón y diálogo', 'pink']],
    codes: ['7fr · 5fr', 'hueco 48'],
  },
  {
    kicker: `Consulta · desde ${THRESHOLDS.columns} px`,
    columns: '5fr 7fr',
    cells: [['Sofi escucha', 'pink'], ['Paso 1 y Paso 2']],
    codes: ['5fr · 7fr', 'hueco 64'],
  },
  {
    kicker: `Escenario de lectura · desde ${THRESHOLDS.stage} px`,
    columns: '3fr 7fr',
    cells: [['Sofi 384 px', 'pink'], ['Diálogo']],
    codes: ['384px · 1fr', 'hueco 48'],
  },
  {
    kicker: `Versiones · desde ${THRESHOLDS.columns} px`,
    columns: '7fr 5fr',
    cells: [['Versión 1', 'pink'], ['Versiones 2 a 4']],
    codes: ['7fr · 5fr', 'hueco 48'],
  },
  {
    kicker: 'Cajas · cualquier ancho',
    columns: 'repeat(3, minmax(0, 1fr))',
    cells: [
      ['Letra pequeña', 'butter'],
      ['Falta un dato', 'ink'],
      ['Consejo', 'soft'],
    ],
    codes: ['flex · base 17,5 rem'],
  },
  {
    kicker: 'Base · una columna',
    columns: 'minmax(0, 1fr)',
    cells: [['Sofi', 'pink'], ['Mensaje y contexto'], ['CTA fijo', 'butter']],
    codes: ['CTA sticky abajo en la consulta'],
    base: true,
  },
]

const RULER_MAX = 1920

function rulerPercent(px: number): string {
  return `${(px / RULER_MAX) * 100}%`
}

const RULER_SEGMENTS = [
  {
    label: 'Base · una columna',
    from: 0,
    to: THRESHOLDS.header,
    tone: styles.segCream,
  },
  {
    label: 'Cabecera',
    from: THRESHOLDS.header,
    to: THRESHOLDS.stage,
    tone: styles.segStage,
  },
  {
    label: 'Sofi',
    from: THRESHOLDS.stage,
    to: THRESHOLDS.columns,
    tone: styles.segButter,
  },
  {
    label: 'Dos columnas',
    from: THRESHOLDS.columns,
    to: RULER_MAX,
    tone: styles.segPink,
  },
]

const THRESHOLD_NOTES = [
  {
    px: THRESHOLDS.header,
    title: 'Cabecera ancha',
    note: 'El selector de tema pasa a texto, aparece el estallido de portada y la acción principal deja de ocupar todo el ancho.',
  },
  {
    px: THRESHOLDS.stage,
    title: 'Sofi junto al diálogo',
    note: 'El escenario de lectura pasa de apilado a 384 px + diálogo.',
  },
  {
    px: THRESHOLDS.columns,
    title: 'Dos columnas',
    note: 'Portada, consulta y versiones se abren en dos columnas; la cabecera suma el antetítulo «En directo».',
  },
]

function SpaceSpec() {
  return (
    <LabSpec
      id="f2-space"
      kicker="1.5 · Espacio y retícula"
      title="Escala de espacio"
      desc="Once pasos, de 4 en 4 hasta 24 y luego más largos. Se miden en px a tamaño de texto por defecto, pero el código los emite en rem y crecen con él. Los márgenes de página crecen con el ancho y se detienen en 64 px."
      codes={<LabCode>--gutter: clamp(1rem, 4.4vw, 4rem)</LabCode>}
    >
      <ul className={styles.space}>
        {SPACE_SCALE.map((value, index) => (
          <li key={value}>
            <span
              className={styles.spaceBar}
              style={{ width: `var(--space-${index + 1})` }}
            />
            <span className={styles.spaceValue}>{value}</span>
            <LabCode>{`--space-${index + 1}`}</LabCode>
          </li>
        ))}
      </ul>

      <LabSub style={{ marginTop: '2.75rem' }}>Composiciones aprobadas</LabSub>
      <LabGrid as="ul" min={300} cellPadding="1.25rem 1.25rem 1.375rem">
        {LAYOUTS.map((layout) => (
          <li key={layout.kicker} className={styles.layoutItem}>
            <Kicker as="p">{layout.kicker}</Kicker>
            <div
              className={cx(styles.diagram, layout.base && styles.diagramBase)}
              style={{ gridTemplateColumns: layout.columns }}
            >
              {layout.cells.map(([label, tone]) => (
                <span
                  key={label}
                  className={tone ? styles[`cell-${tone}`] : undefined}
                >
                  {label}
                </span>
              ))}
            </div>
            <LabCodes>
              {layout.codes.map((code) => (
                <LabCode key={code}>{code}</LabCode>
              ))}
            </LabCodes>
          </li>
        ))}
      </LabGrid>

      <LabSub style={{ marginTop: '2.75rem' }}>Umbrales</LabSub>
      <LabNote style={{ maxWidth: '70ch' }}>
        Tres cambios estructurales, puestos donde el contenido deja de caber.
        Ninguno corresponde a un dispositivo; las vistas de QA se prueban en
        Experience Preview.
      </LabNote>
      {/* La regla es un dibujo: las tarjetas de debajo dicen lo mismo en texto. */}
      <div className={styles.ruler} aria-hidden="true">
        <div className={styles.rulerBar}>
          {RULER_SEGMENTS.map((segment) => (
            <span
              key={segment.label}
              className={segment.tone}
              style={{ width: rulerPercent(segment.to - segment.from) }}
            >
              {segment.label}
            </span>
          ))}
        </div>
        <span className={cx(styles.tick, styles.tickStart)}>0</span>
        {THRESHOLD_NOTES.map((item, index) => (
          <span
            key={item.px}
            className={cx(styles.tick, index % 2 === 1 && styles.tickLow)}
            style={{ left: rulerPercent(item.px) }}
          >
            {item.px}
          </span>
        ))}
        <span className={cx(styles.tick, styles.tickEnd)}>{RULER_MAX} px</span>
      </div>
      <LabGrid as="ul">
        {THRESHOLD_NOTES.map((item) => (
          <li key={item.px}>
            <Kicker as="p">{item.px} px</Kicker>
            <p className={styles.thresholdTitle}>{item.title}</p>
            <LabNote style={{ marginTop: '0.5rem' }}>{item.note}</LabNote>
          </li>
        ))}
      </LabGrid>
    </LabSpec>
  )
}

// --- 1.6 · Forma ---

const LINES = [
  {
    name: '2,5 px tinta',
    className: styles.lineStructure,
    note: 'Estructura: reglas de sección, pegatinas, cajas y versiones.',
  },
  {
    name: '2 px tinta',
    className: styles.lineControl,
    note: 'Controles: botones de icono, segmentados, opciones y campos.',
  },
  {
    name: '1,5 px tinta',
    className: styles.lineDetail,
    note: 'Chips, pistas, reglas internas del cupón y filas de tablas.',
  },
  {
    name: '1 px al 25 %',
    className: styles.lineHairline,
    note: 'Filas dentro de cajas tinta, como «Me falta un dato».',
  },
  {
    name: '2,5 px discontinuo',
    className: styles.lineDashed,
    note: 'Solo el cupón del contexto. Si es discontinuo, se puede recortar.',
  },
]

function FormsSpec() {
  return (
    <LabSpec
      id="f2-forms"
      kicker="1.6 · Forma"
      title="Bordes, radios y elevación"
      desc="Línea de rotulador, esquinas rectas y pegatinas en lugar de sombras. Cada grosor tiene un trabajo."
    >
      <ul className={styles.lines}>
        {LINES.map((line) => (
          <li key={line.name}>
            <p className={styles.lineName}>{line.name}</p>
            <span className={cx(styles.line, line.className)} />
            <LabNote>{line.note}</LabNote>
          </li>
        ))}
      </ul>
      <LabGrid
        as="ul"
        min={300}
        style={{ marginTop: '1.75rem' }}
        className={styles.forms}
      >
        <li>
          <Kicker as="p">Radio · 0 px</Kicker>
          <div className={styles.square} />
          <LabNote>
            Todo es cuadrado. Sin tarjetas redondeadas en ningún tamaño.
          </LabNote>
        </li>
        <li>
          <Kicker as="p">Esquina pixel · escalón de 4 px</Kicker>
          <div className={styles.pixelEdge}>
            <p className={styles.pixelPaper}>Vale.</p>
          </div>
          <LabNote>
            Recorte escalonado con clip-path. Solo en la burbuja del mensaje.
          </LabNote>
        </li>
        <li>
          <Kicker as="p">Elevación · pegatina</Kicker>
          <div className={styles.stickerSample} />
          <LabNote>
            2,5 px tinta + 4 px de anillo + 1,5 px tinta. Sin sombras difusas ni
            desenfoques.
          </LabNote>
        </li>
        <li>
          <Kicker as="p">Inclinación decorativa</Kicker>
          <div className={styles.tilts}>
            <Tag className={styles.tiltLeft}>−2°</Tag>
            <Tag tone="pink" className={styles.tiltRight}>
              +3°
            </Tag>
            <Burst kicker="+12°" size={72} rotate={12} kickerSize={10} />
          </div>
          <LabNote>
            Solo pegatinas, fotomatón y estallidos. Nunca un párrafo ni un
            campo.
          </LabNote>
        </li>
      </LabGrid>
    </LabSpec>
  )
}

// --- 1.7 · Foco ---

function FocusSpec() {
  return (
    <LabSpec
      id="f2-focus"
      kicker="1.7 · Accesibilidad"
      title="Estados de foco"
      desc="Un contorno de 3 px que nunca se quita: tinta en claro, mantequilla en oscuro. Las cajas de color fijo fuerzan tinta para que siempre se vea. Muestras con el foco forzado."
      codes={
        <>
          <LabCode>--color-focus</LabCode>
          <LabCode>:focus-visible</LabCode>
        </>
      }
    >
      <LabGrid
        as="ul"
        min={280}
        cellPadding="1.5rem 1.625rem 2.125rem"
        inert
        className={styles.focusGrid}
      >
        <li>
          <LabCap style={{ margin: 0 }}>
            Botón · a 10 px, fuera del anillo
          </LabCap>
          <Button
            size="sm"
            arrow
            data-force-state="focus"
            className={styles.focusButton}
          >
            Empezar
          </Button>
        </li>
        <li>
          <LabCap style={{ margin: 0 }}>Burbuja · a 5 px</LabCap>
          <BubbleFrame
            forceFocus
            className={styles.focusBubble}
            paperClassName={styles.focusBubblePaper}
          >
            <p>Vale. Que te lo pases bien.</p>
          </BubbleFrame>
        </li>
        <li>
          <LabCap style={{ margin: 0 }}>Opción · a 3 px</LabCap>
          <OptionPill
            name="lab-focus-option"
            value="on"
            label="Con sonido"
            checked={false}
            data-force-state="focus"
          />
        </li>
        <li>
          <LabCap style={{ margin: 0 }}>Botón de icono y enlace</LabCap>
          <LabRow>
            <IconButton label="Sin sonido" data-force-state="focus">
              <SoundOffIcon />
            </IconButton>
            <TextLink data-force-state="focus">Nueva consulta</TextLink>
          </LabRow>
        </li>
        <li className={styles.focusInk}>
          <LabCap style={{ margin: 0, color: 'var(--tone-butter)' }}>
            Sobre caja tinta · mantequilla
          </LabCap>
          <Button
            size="sm"
            arrow
            data-force-state="focus"
            className={styles.focusButton}
          >
            Añadir contexto
          </Button>
        </li>
        <li className={styles.focusButter}>
          <LabCap style={{ margin: 0, color: 'var(--tone-ink)' }}>
            Sobre mantequilla · tinta
          </LabCap>
          <TextLink data-force-state="focus">Activar sonido</TextLink>
        </li>
      </LabGrid>
    </LabSpec>
  )
}

// --- 1.8 · Movimiento ---

function MotionDemo({
  title,
  demo,
  demoClassName,
  codes,
  children,
}: {
  title: string
  demo: ReactNode
  demoClassName?: string
  codes: ReadonlyArray<string>
  children: ReactNode
}) {
  return (
    <li className={styles.motionItem}>
      <Kicker as="p">{title}</Kicker>
      <div className={cx(styles.demo, demoClassName)}>{demo}</div>
      <LabCodes>
        {codes.map((code) => (
          <LabCode key={code}>{code}</LabCode>
        ))}
      </LabCodes>
      <LabNote>{children}</LabNote>
    </li>
  )
}

function MotionSpec() {
  const timing = DEFAULT_SPEECH_TIMING
  return (
    <LabSpec
      id="f2-motion"
      kicker="1.8 · Movimiento"
      title="El pixel se mueve a saltos"
      desc="Pasos discretos y duraciones cortas, sin rebotes ni easing elástico. La información nunca depende de una animación; cada token tiene su alternativa reducida."
      codes={
        <LabJumpLink href="?s=motion">
          Probar en Motion &amp; Sound →
        </LabJumpLink>
      }
    >
      <LabGrid as="ul" min={300} cellPadding="1.375rem 1.375rem 1.5rem">
        <MotionDemo
          title="Respuesta de control"
          demo={<Button size="sm">Pasa por aquí</Button>}
          codes={[formatDuration(DURATIONS_MS.ui), '−2 px · −1°']}
        >
          Hover: mantequilla, sube 2 px y se inclina. Pulsado: baja 1 px.{' '}
          <strong>Reducido:</strong> solo cambia el color.
        </MotionDemo>
        <MotionDemo
          title="Cursor de escritura"
          demo={
            <p className={styles.caretSample}>
              Pero ojo
              <SpeechCaret />
            </p>
          }
          codes={[`${formatDuration(DURATIONS_MS.caret)} · steps(1)`]}
        >
          Parpadea mientras Sofi escribe y desaparece al terminar.{' '}
          <strong>Reducido:</strong> no se muestra.
        </MotionDemo>
        <MotionDemo
          title="Parpadeo de Sofi"
          demoClassName={styles.demoCenter}
          demo={
            <SofiPortrait
              size={192}
              expression="attentive"
              crop={{ width: 120, height: 96, offsetX: 36, offsetY: 40 }}
            />
          }
          codes={[
            `${formatDuration(DURATIONS_MS.blink)} · step-end`,
            '_sofi-blink.scss',
          ]}
        >
          Un parpadeo y uno doble, con la línea de tiempo del spritesheet.{' '}
          <strong>Reducido:</strong> fotograma 0 fijo.
        </MotionDemo>
        <MotionDemo
          title="Titulares"
          demoClassName={styles.demoTicker}
          demo={
            <Ticker
              label="Última hora"
              headlines={[
                'Ninguna lectura es una sentencia',
                'Probabilidades, no profecías',
              ]}
              className={styles.tickerSample}
            />
          }
          codes={[
            `${formatDuration(DURATIONS_MS.ticker)} · lineal`,
            'pausable',
          ]}
        >
          Se pausa con su botón y nunca lleva información que no esté en otro
          sitio. <strong>Reducido:</strong> quieto.
        </MotionDemo>
        <MotionDemo
          title="Carga"
          demoClassName={styles.demoStack}
          demo={
            <>
              <p className={styles.loadingText}>Leyendo entre líneas…</p>
              <Loader />
            </>
          }
          codes={[`${formatDuration(DURATIONS_MS.loader)} · steps(24)`]}
        >
          Cuatro celdas recorren el medidor: no simula un progreso que no
          existe. <strong>Reducido:</strong> queda el texto.
        </MotionDemo>
        <MotionDemo
          title="Escritura de Sofi"
          demo={
            <LabCodes>
              <LabCode>{timing.charDelay} ms letra</LabCode>
              <LabCode>{timing.shortPause} ms coma</LabCode>
              <LabCode>{timing.longPause} ms punto</LabCode>
              <LabCode>{timing.startDelay} ms inicio</LabCode>
            </LabCodes>
          }
          codes={['SofiSpeech']}
        >
          Valores por defecto, ajustables en Motion &amp; Sound.{' '}
          <strong>Reducido:</strong> texto completo al instante y, con sonido,
          un único fragmento breve.
        </MotionDemo>
      </LabGrid>
    </LabSpec>
  )
}

// --- 1.9 · Recursos gráficos ---

const SPRITE_FRAMES = [
  {
    frame: 0,
    caption: 'F0 · abiertos',
    alt: 'Fotograma 0: ojos abiertos',
    background: 'var(--tone-pink-soft)',
  },
  {
    frame: 1,
    caption: 'F1 · entrecerrados',
    alt: 'Fotograma 1: ojos entrecerrados',
    background: 'var(--tone-butter)',
  },
  {
    frame: 2,
    caption: 'F2 · cerrados',
    alt: 'Fotograma 2: ojos cerrados',
    background: 'var(--tone-lilac)',
  },
] as const

const STROKE_ICONS: ReadonlyArray<[string, ReactNode]> = [
  ['Con sonido', <SoundOnIcon key="on" size={28} />],
  ['Sin sonido', <SoundOffIcon key="off" size={28} />],
  ['Claro', <SunIcon key="sun" size={28} />],
  ['Oscuro', <MoonIcon key="moon" size={28} />],
  ['Sistema', <SystemIcon key="system" size={28} />],
  ['Privacidad', <LockIcon key="lock" size={28} />],
  ['Recortar', <ScissorsIcon key="cut" size={28} />],
  ['Reproducir', <PlayIcon key="play" size={28} />],
  ['Pausar', <PauseIcon key="pause" size={28} />],
  ['Reintentar', <RetryIcon key="retry" size={28} />],
  ['Cerrar', <CloseIcon key="close" size={28} />],
  [
    'Flecha de texto',
    <span key="arrow" className={styles.arrowGlyph} aria-hidden="true">
      →
    </span>,
  ],
]

const PIXEL_ICONS: ReadonlyArray<[string, ReactNode]> = [
  [
    'Chispa',
    <SparkIcon
      key="spark"
      width={24}
      height={24}
      className={styles.sparkSample}
    />,
  ],
  ['Sigue leyendo', <MoreIcon key="more" width={20} height={12} />],
  ['Cola de burbuja', <BubbleTail key="tail" className={styles.tailSample} />],
  ['En directo', <LiveSquareIcon key="live" width={14} height={14} />],
  [
    'Error',
    <ErrorPixelIcon key="error" size={22} className={styles.errorSample} />,
  ],
  ['Trabajando', <Spinner key="spin" className={styles.spinSample} />],
]

function IconCatalog({ icons }: { icons: ReadonlyArray<[string, ReactNode]> }) {
  return (
    <LabGrid
      as="ul"
      min={118}
      cellPadding="1.125rem 0.5rem 1rem"
      className={styles.icons}
    >
      {icons.map(([label, icon]) => (
        <li key={label}>
          {icon}
          {label}
        </li>
      ))}
    </LabGrid>
  )
}

function ResourcesSpec() {
  return (
    <LabSpec
      id="f2-res"
      kicker="1.9 · Recursos gráficos"
      title="Logo, Sofi, iconos y texturas"
      desc="Los recursos que ya existen, tal cual. Lo que aún es provisional lleva su marca."
    >
      <LabGrid
        as="ul"
        min={300}
        cellPadding="1.375rem"
        className={styles.resources}
      >
        <li>
          <KickerRow kicker="Logo">
            <LabCode>{'<Logo>'}</LabCode>
          </KickerRow>
          <div className={styles.logoLight}>
            <Logo
              alt="Ask Sofi sobre crema"
              sizes="15.75em"
              className={styles.logoImg}
            />
          </div>
          <div className={styles.logoDark}>
            <Logo
              alt="Ask Sofi sobre tinta"
              sizes="15.75em"
              className={styles.logoImg}
            />
          </div>
          <LabNote>
            Mínimo 132 px de ancho en cabeceras compactas. WebP en 336, 540 y
            1080 px, exportado del PNG original.
          </LabNote>
        </li>
        <li>
          <KickerRow kicker="Sofi · spritesheet">
            <LabProv>Provisional · 008</LabProv>
          </KickerRow>
          <div className={styles.frames}>
            {SPRITE_FRAMES.map((item) => (
              <figure key={item.frame} className={styles.frame}>
                <SofiPortrait
                  size={192}
                  frame={item.frame}
                  alt={item.alt}
                  crop={{
                    width: 96,
                    height: 96,
                    offsetX: 48,
                    offsetY: 42,
                    background: item.background,
                  }}
                />
                <figcaption className={styles.frameCaption}>
                  {item.caption}
                </figcaption>
              </figure>
            ))}
          </div>
          <LabNote>
            sofi-blink.webp · 3 fotogramas de 384 px. Se muestra a 384, 192 y en
            recortes de insignia; en oscuro lleva contorno crema de 2 px.
          </LabNote>
        </li>
        <li>
          <Kicker as="p">Texturas</Kicker>
          <div className={styles.textures}>
            <div className={styles.texDots} />
            <div className={styles.texBox}>
              <span className={styles.texBurst} />
            </div>
            <div className={styles.texBox}>
              <span className={styles.texTitle}>
                <span className={styles.hit}>«vale»</span>
              </span>
            </div>
            <div className={styles.texBox}>
              <span className={styles.texPixel} />
            </div>
          </div>
          <LabNote>
            Trama de puntos 11 px · estallido de 36 puntas · subrayado
            «exclusiva» a −2° · esquina pixel.
          </LabNote>
        </li>
      </LabGrid>

      <LabSub style={{ marginTop: '2.75rem' }}>
        Iconos de trazo · 2 px sobre 24
      </LabSub>
      <IconCatalog icons={STROKE_ICONS} />

      <LabSub style={{ marginTop: '2.75rem' }}>
        Iconos pixel · crispEdges
      </LabSub>
      <IconCatalog icons={PIXEL_ICONS} />
    </LabSpec>
  )
}

export function FoundationsSection() {
  return (
    <>
      <LabMast
        titleId="f-h1"
        tag="Sección 01"
        kicker="Los cimientos"
        title="Foundations"
        deck="Color y tipo: las dos piezas que hacen que una pantalla parezca de Sofi aunque no salga el logo. Y el espacio, los bordes, el foco y el movimiento que hacen que el desorden de revista se lea ordenado."
        jumps={[
          { href: '#f-color', num: '1.1', label: 'Color' },
          { href: '#f-tokens', num: '1.2', label: 'Tokens semánticos' },
          { href: '#f-contrast', num: '1.3', label: 'Contraste' },
          { href: '#f-type', num: '1.4', label: 'Tipografía' },
          { href: '#f2-space', num: '1.5', label: 'Espacio y retícula' },
          { href: '#f2-forms', num: '1.6', label: 'Bordes y elevación' },
          { href: '#f2-focus', num: '1.7', label: 'Foco' },
          { href: '#f2-motion', num: '1.8', label: 'Movimiento' },
          { href: '#f2-res', num: '1.9', label: 'Recursos gráficos' },
        ]}
        aside={
          <Burst
            tone="lilac"
            kicker="Tokens"
            size={150}
            rotate={9}
            kickerSize={11}
            mainSize={22}
            mainGap={4}
          >
            aprobados
          </Burst>
        }
      />
      <PaletteSpec />
      <TokensSpec />
      <ContrastSpec />
      <TypeSpec />
      <SpaceSpec />
      <FormsSpec />
      <FocusSpec />
      <MotionSpec />
      <ResourcesSpec />
    </>
  )
}
