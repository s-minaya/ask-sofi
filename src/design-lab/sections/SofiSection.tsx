import { useState } from 'react'
import {
  ContextInput,
  CouponFrame,
} from '../../components/sofi/ContextInput/ContextInput'
import {
  ERROR_COPY,
  ErrorState,
} from '../../components/sofi/ErrorState/ErrorState'
import { ConfidenceMeter } from '../../components/sofi/ConfidenceMeter/ConfidenceMeter'
import {
  InterpretationLead,
  InterpretationList,
  ReliabilityBadges,
} from '../../components/sofi/Interpretations/Interpretations'
import {
  BubbleFrame,
  MessageBubble,
  MessageInput,
} from '../../components/sofi/MessageBubble/MessageBubble'
import { PhotoBooth } from '../../components/sofi/PhotoBooth/PhotoBooth'
import { PROCESSING_LINES } from '../../components/sofi/ProcessingState/ProcessingState'
import {
  ContextQuestions,
  FinePrint,
  MissingData,
  ReadingBoxes,
  SofiAdvice,
} from '../../components/sofi/ReadingBoxes/ReadingBoxes'
import {
  SofiDialog,
  SofiDialogText,
} from '../../components/sofi/SofiDialog/SofiDialog'
import {
  SofiPortrait,
  type SofiFrame,
} from '../../components/sofi/SofiPortrait/SofiPortrait'
import {
  SofiSpeech,
  SpeechCaret,
  type SpeechState,
} from '../../components/sofi/SofiSpeech/SofiSpeech'
import { SoundNoticeDemo } from '../parts/SoundNoticeDemo'
import { Burst } from '../../components/ui/Burst/Burst'
import { Button } from '../../components/ui/Button/Button'
import { Counter } from '../../components/ui/Counter/Counter'
import { FieldMessage } from '../../components/ui/FieldMessage/FieldMessage'
import { Badge, HintList } from '../../components/ui/Indicators/Indicators'
import { LockIcon } from '../../components/ui/icons/icons'
import { InlineNotice } from '../../components/ui/Notice/Notice'
import { KickerRow, StepTag, Tag } from '../../components/ui/Tag/Tag'
import { TextLink } from '../../components/ui/TextLink/TextLink'
import { Loader } from '../../components/ui/Loader/Loader'
import {
  FIXTURE_CONTEXT,
  FIXTURE_MESSAGE,
  LEAD,
  LEAD_CLOSE,
  MISSING_QUESTIONS,
  ADVICE,
  NEEDS_QUESTIONS,
  OTHER_VERSIONS,
  SPEECH,
} from '../fixtures'
import {
  LabCap,
  LabChoice,
  LabCode,
  LabGrid,
  LabJumpLink,
  LabMast,
  LabNote,
  LabPanel,
  LabPlaceholder,
  LabProv,
  LabReadout,
  LabRow,
  LabSpec,
  LabSplit,
  LabStage,
  LabSub,
  LabToolbar,
} from '../parts/LabParts'
import { STAGE_WIDTHS, stageMaxWidth, type StageWidth } from '../stageWidths'
import {
  BoxesPlayground,
  DialogPlayground,
  LeadPlayground,
  MeterPlayground,
  ReliabilityPlayground,
  StagePlayground,
} from './PropPlaygrounds'
import styles from './SofiSection.module.scss'

type PortraitSize = 'stage' | 'mid' | 'badge'
type PortraitFrame = 'blink' | 'f0' | 'f1' | 'f2'
const FRAMES: Record<PortraitFrame, SofiFrame> = {
  blink: 'blink',
  f0: 0,
  f1: 1,
  f2: 2,
}

function PortraitSpec() {
  const [size, setSize] = useState<PortraitSize>('stage')
  const [frame, setFrame] = useState<PortraitFrame>('blink')
  const shown = FRAMES[frame]
  return (
    <LabSpec
      id="s-portrait"
      kicker="3.1 · Personaje"
      title="SofiPortrait"
      desc="Sofi tal cual existe hoy: el spritesheet de parpadeo. El retrato recibe un estado de la interfaz y elige fotograma; cuando lleguen las animaciones de 008, cambia el recurso, no el componente."
      codes={
        <>
          <LabCode>{'<SofiPortrait size expression>'}</LabCode>
          <LabProv>Spritesheet provisional · 008</LabProv>
        </>
      }
    >
      <LabSplit>
        <LabPanel>
          <LabChoice
            stacked
            label="Tamaño"
            value={size}
            onChange={setSize}
            options={[
              { value: 'stage', label: 'Escenario · 384' },
              { value: 'mid', label: 'Medio · 192' },
              { value: 'badge', label: 'Insignia · 96' },
            ]}
          />
          <LabChoice
            stacked
            label="Fotograma"
            value={frame}
            onChange={setFrame}
            options={[
              { value: 'blink', label: 'Parpadeo' },
              { value: 'f0', label: 'F0' },
              { value: 'f1', label: 'F1' },
              { value: 'f2', label: 'F2' },
            ]}
          />
          <LabReadout
            rows={[
              [
                'Recurso',
                `sofi-blink.webp · ${frame === 'blink' ? 'parpadeo 4,2 s' : `fotograma ${frame.toUpperCase()}`}`,
              ],
              [
                'Escala',
                size === 'stage'
                  ? '1× · 384 px'
                  : size === 'mid'
                    ? '0,5× · 192 px'
                    : 'recorte de 96 px sobre 192',
              ],
              ['Oscuro', 'contorno crema de 2 px'],
              ['Reducido', 'F0 fijo, sin parpadeo'],
            ]}
          />
        </LabPanel>
        <LabStage dots className={styles.portraitStage}>
          <div className={styles.portraitCenter}>
            {size === 'stage' && (
              <SofiPortrait
                size={384}
                frame={shown}
                outline
                alt="Sofi, atenta"
              />
            )}
            {size === 'mid' && (
              <SofiPortrait
                size={192}
                frame={shown}
                outline
                alt="Sofi, atenta"
              />
            )}
            {size === 'badge' && (
              <SofiPortrait
                size={192}
                frame={shown}
                alt="Sofi, atenta"
                crop={{
                  width: 96,
                  height: 96,
                  offsetX: 50,
                  offsetY: 36,
                  background: 'var(--tone-pink-soft)',
                  frame: 'sticker',
                }}
              />
            )}
          </div>
        </LabStage>
      </LabSplit>

      <LabSub style={{ marginTop: '2.5rem' }}>
        Del estado de la interfaz a la expresión
      </LabSub>
      <LabGrid min={200} cellPadding="1.125rem" className={styles.expr}>
        {(
          [
            [
              'Atenta',
              'idle · escucha. F0 + parpadeo.',
              'attentive',
              'var(--tone-pink-soft)',
              'Disponible',
            ],
            [
              'Pensando',
              'submitting · processing. F1 fijo.',
              'thinking',
              'var(--tone-butter)',
              'Provisional',
            ],
            [
              'Poco convencida',
              'needs_context. F1 fijo.',
              'unconvinced',
              'var(--tone-lilac)',
              'Provisional',
            ],
            [
              'Ups',
              'error. F2 fijo.',
              'oops',
              'var(--tone-white)',
              'Provisional',
            ],
          ] as const
        ).map(([name, note, expression, background, status]) => (
          <div key={name}>
            <SofiPortrait
              size={240}
              expression={expression}
              crop={{
                width: 120,
                height: 120,
                offsetX: 60,
                offsetY: 52,
                background,
                frame: 'border',
              }}
            />
            <p className={styles.exprName}>{name}</p>
            <LabNote>{note}</LabNote>
            {status === 'Disponible' ? (
              <Tag tone="outline">Disponible</Tag>
            ) : (
              <LabProv>Provisional</LabProv>
            )}
          </div>
        ))}
        <div>
          <LabPlaceholder style={{ width: 120, height: 120 }}>
            Sprite «hablando»
          </LabPlaceholder>
          <p className={styles.exprName}>Hablando</p>
          <LabNote>success · mientras escribe. Hoy: F0 + parpadeo.</LabNote>
          <LabProv>Pendiente · 008</LabProv>
        </div>
      </LabGrid>
      <LabNote style={{ marginTop: '1rem', maxWidth: '72ch' }}>
        El texto alternativo describe la expresión cuando aporta («Sofi
        entrecierra los ojos, poco convencida») y queda vacío cuando el retrato
        acompaña a un texto que ya lo dice.
      </LabNote>

      <LabSub style={{ marginTop: '2.5rem' }}>Fotomatón · la portada</LabSub>
      <LabStage dots style={{ padding: '2.25rem 1.75rem 2.5rem' }}>
        <div className={styles.booths}>
          <PhotoBooth orientation="vertical" size="md" />
          <div className={styles.boothSide}>
            <PhotoBooth orientation="horizontal" />
            <LabNote style={{ maxWidth: '38ch' }}>
              Vertical a +3° en la portada ancha; horizontal a −2° en la
              estrecha. Los tres fotogramas en orden, como una tira de
              fotomatón. Decorativo: alt vacío y un pie que lo cuenta.
            </LabNote>
          </div>
        </div>
      </LabStage>
    </LabSpec>
  )
}

function DialogSpec({ stageMax }: { stageMax?: string }) {
  const [playToken, setPlayToken] = useState(1)
  const [revealed, setRevealed] = useState(false)
  const [state, setState] = useState<SpeechState | null>(null)
  const status =
    !state || state.status === 'idle'
      ? 'en espera'
      : state.status === 'done'
        ? 'completo'
        : 'escribiendo'
  return (
    <LabSpec
      id="s-dialog"
      kicker="3.2 · La voz de Sofi"
      title="SofiDialog"
      desc="El cuadro de novela visual donde habla Sofi. Es el contenedor de SofiSpeech: la pestaña con su nombre, el texto y una fila de acciones que cambia cuando termina de escribir."
      codes={
        <>
          <LabCode>{'<SofiDialog size>'}</LabCode>
          <LabCode>{'<SofiSpeech text>'}</LabCode>
          <LabJumpLink href="?s=motion">
            Ajustar en Motion &amp; Sound →
          </LabJumpLink>
        </>
      }
    >
      <LabSplit>
        <LabPanel>
          <LabReadout
            rows={[
              ['Estado', status],
              [
                'Progreso',
                `${state?.index ?? 0} / ${SPEECH.short.length} caracteres`,
              ],
            ]}
          />
          <LabRow style={{ gap: '0.75rem 1.25rem' }}>
            <Button
              size="sm"
              onClick={() => {
                setRevealed(false)
                setPlayToken((token) => token + 1)
              }}
            >
              Repetir
            </Button>
            <TextLink onClick={() => setRevealed(true)}>Ver todo</TextLink>
          </LabRow>
          <LabNote>
            Ejemplar vivo con los tiempos por defecto y sin sonido. Con
            movimiento reducido aparece entero.
          </LabNote>
        </LabPanel>
        <LabStage dots maxWidth={stageMax} style={{ paddingTop: '3.5rem' }}>
          <SofiSpeech
            text={SPEECH.short}
            playToken={playToken}
            revealed={revealed}
            announce={false}
            onStateChange={setState}
            doneAction={
              <TextLink href="#s-dialog-h" continues>
                Ver las versiones
              </TextLink>
            }
          />
        </LabStage>
      </LabSplit>

      <LabSub style={{ marginTop: '2.5rem' }}>Estados</LabSub>
      <LabGrid
        min={420}
        cellPadding="1.75rem 1.625rem 1.875rem"
        cellBackground="var(--color-bg-alt)"
        className={styles.dialogCells}
        inert
      >
        <div>
          <LabCap>Escribiendo · cursor y «Ver todo»</LabCap>
          <div className={`${styles.dialogCell} ${styles.cq}`}>
            <SofiDialog footer={<TextLink>Ver todo</TextLink>}>
              <SofiDialogText>
                Un «vale» con punto y sin emoji, de alguien que normalmente te
                manda medio
                <SpeechCaret />
              </SofiDialogText>
            </SofiDialog>
          </div>
        </div>
        <div>
          <LabCap>Completo · «Ver las versiones»</LabCap>
          <div className={`${styles.dialogCell} ${styles.cq}`}>
            <SofiDialog
              footer={
                <TextLink href="#s-dialog-h" continues>
                  Ver las versiones
                </TextLink>
              }
            >
              <SofiDialogText>
                Esto tiene bastante pinta de que le ha sentado regular. Pero
                ojo: con lo que me cuentas no puedo jurarlo.
              </SofiDialogText>
            </SofiDialog>
          </div>
        </div>
        <div>
          <LabCap>Movimiento reducido · entero desde el principio</LabCap>
          <div className={`${styles.dialogCell} ${styles.cq}`}>
            <SofiDialog footer={<TextLink>Ver las versiones</TextLink>}>
              <SofiDialogText>
                Antes de dar nada por hecho, pregúntale cómo lo lleva.
              </SofiDialogText>
            </SofiDialog>
          </div>
        </div>
        <div>
          <LabCap>Sonido bloqueado · el texto sigue</LabCap>
          <div
            className={`${styles.dialogCell} ${styles.cq}`}
            style={{ display: 'grid', gap: '1.25rem' }}
          >
            <SofiDialog footer={<TextLink>Ver todo</TextLink>}>
              <SofiDialogText>
                Un «vale» con punto y sin emoji
                <SpeechCaret />
              </SofiDialogText>
            </SofiDialog>
            <InlineNotice>
              <span>Tu navegador ha bloqueado el sonido.</span>
              <TextLink size="sm">Activar sonido</TextLink>
            </InlineNotice>
          </div>
        </div>
      </LabGrid>

      <LabSub style={{ marginTop: '2.5rem' }}>Tamaños</LabSub>
      <LabGrid
        min={420}
        cellPadding="1.75rem 1.625rem 1.875rem"
        cellBackground="var(--color-bg-alt)"
        className={styles.dialogCells}
        inert
      >
        <div>
          <LabCap>Grande · lectura · 23 px</LabCap>
          <div className={styles.dialogCell}>
            <SofiDialog>
              <SofiDialogText>
                Pero ojo: con lo que me cuentas no puedo jurarlo.
              </SofiDialogText>
            </SofiDialog>
          </div>
        </div>
        <div>
          <LabCap>Media · consulta · 20 px</LabCap>
          <div className={styles.dialogCell}>
            <SofiDialog size="md" more>
              <SofiDialogText>{SPEECH.listening}</SofiDialogText>
            </SofiDialog>
          </div>
        </div>
        <div>
          <LabCap>Compacta · con insignia · 15 px</LabCap>
          <div className={styles.compactRow}>
            <SofiPortrait
              size={192}
              expression="attentive"
              crop={{
                width: 92,
                height: 92,
                offsetX: 50,
                offsetY: 36,
                background: 'var(--tone-pink-soft)',
                frame: 'sticker',
              }}
            />
            <SofiDialog size="sm">
              <SofiDialogText>
                A ver, cuéntamelo todo. ¿Qué te ha escrito exactamente?
              </SofiDialogText>
            </SofiDialog>
          </div>
        </div>
      </LabGrid>

      <LabSub style={{ marginTop: '2.5rem' }}>Lectura accesible</LabSub>
      <ul className={styles.a11y}>
        <li>
          <LabCode>texto oculto</LabCode>
          <span>
            Texto completo desde el primer momento. El lector lo oye una vez, al
            aparecer, y no letra a letra.
          </span>
        </li>
        <li>
          <LabCode>copia fantasma</LabCode>
          <span>
            Copia invisible con aria-hidden: reserva el alto final, así nada
            salta mientras escribe.
          </span>
        </li>
        <li>
          <LabCode>capa animada</LabCode>
          <span>
            Lo que se ve escribirse, con aria-hidden. El cursor es decorativo.
          </span>
        </li>
        <li>
          <LabCode>Ver todo</LabCode>
          <span>
            Botón real: completa el texto y corta el sonido; el foco pasa a la
            acción que aparece. Los resultados no esperan a que termine.
          </span>
        </li>
      </ul>
      <LabSub style={{ marginTop: '2.5rem' }}>Aviso de sonido</LabSub>
      <SoundNoticeDemo />
      <>
        <DialogPlayground />
        <StagePlayground />
      </>
    </LabSpec>
  )
}

function MessageSpec({ stageMax }: { stageMax?: string }) {
  const [message, setMessage] = useState(FIXTURE_MESSAGE)
  const [checked, setChecked] = useState(false)
  const invalid = checked && !message.trim()
  return (
    <LabSpec
      id="s-msg"
      kicker="3.3 · El mensaje"
      title="MessageInput y MessageBubble"
      desc="La burbuja de chat pixel donde se pega el mensaje recibido, y su versión de solo lectura para citarlo después. Es un TextArea con piel de burbuja."
      codes={
        <>
          <LabCode>{'<MessageInput>'}</LabCode>
          <LabCode>{'<MessageBubble>'}</LabCode>
        </>
      }
    >
      <LabStage plain maxWidth={stageMax}>
        <StepTag step={1} label="El mensaje" />
        <MessageInput
          headingLevel={3}
          label="Pégalo tal cual te llegó"
          help="Con sus puntos, sus mayúsculas y sus emojis: aquí todo es una pista."
          value={message}
          onChange={(next) => {
            setMessage(next)
            if (next.trim()) setChecked(false)
          }}
          error={invalid ? 'Pega el mensaje para que pueda leerlo.' : undefined}
        />
        <LabRow style={{ marginTop: '2.5rem', gap: '1rem 1.75rem' }}>
          <Button fluid arrow onClick={() => setChecked(true)}>
            Leer entre líneas
          </Button>
          <TextLink
            onClick={() => {
              setMessage('')
              setChecked(false)
            }}
          >
            Borrar
          </TextLink>
        </LabRow>
        <LabNote style={{ marginTop: '0.875rem' }}>
          Vacíalo y pulsa «Leer entre líneas» para ver la validación. Aquí no se
          envía nada.
        </LabNote>
      </LabStage>

      <LabSub style={{ marginTop: '2.5rem' }}>Estados</LabSub>
      <LabGrid
        min={340}
        cellPadding="1.5rem 1.5rem 2.5rem"
        className={styles.states}
        inert
      >
        <div>
          <LabCap>Vacío</LabCap>
          <BubbleFrame paperClassName={styles.bubbleSample}>
            <p className={styles.placeholderText}>
              Pega aquí el mensaje, con sus puntos y sus emojis
            </p>
          </BubbleFrame>
        </div>
        <div>
          <LabCap>Foco</LabCap>
          <BubbleFrame forceFocus paperClassName={styles.bubbleSample}>
            <p>
              Vale.
              <SpeechCaret />
            </p>
          </BubbleFrame>
        </div>
        <div>
          <LabCap>Relleno</LabCap>
          <BubbleFrame paperClassName={styles.bubbleSample}>
            <p>{FIXTURE_MESSAGE}</p>
            <p className={styles.bubbleCount}>
              <Counter count={FIXTURE_MESSAGE.length} />
            </p>
          </BubbleFrame>
        </div>
        <div>
          <LabCap>Error · al enviar vacío</LabCap>
          <BubbleFrame tone="invalid" paperClassName={styles.bubbleSample}>
            <p className={styles.placeholderText}>
              Pega aquí el mensaje, con sus puntos y sus emojis
            </p>
          </BubbleFrame>
          <FieldMessage id="s-msg-sample-error" className={styles.sampleError}>
            Pega el mensaje para que pueda leerlo.
          </FieldMessage>
        </div>
        <div>
          <LabCap>Mientras Sofi lee · solo lectura</LabCap>
          <BubbleFrame tone="disabled" paperClassName={styles.bubbleSample}>
            <p className={styles.placeholderText}>{FIXTURE_MESSAGE}</p>
          </BubbleFrame>
        </div>
        <div>
          <LabCap>MessageBubble · cita de solo lectura</LabCap>
          <p
            className={styles.kickerMuted}
            style={{ marginBottom: '0.625rem' }}
          >
            Lo único que tengo
          </p>
          <MessageBubble message="Vale." size="lg" />
        </div>
      </LabGrid>
    </LabSpec>
  )
}

function ContextSpec({ stageMax }: { stageMax?: string }) {
  const [context, setContext] = useState(FIXTURE_CONTEXT)
  return (
    <LabSpec
      id="s-ctx"
      kicker="3.4 · El contexto"
      title="ContextInput"
      desc="El cupón de «Recorta y envía a Sofi»: opcional, pero es lo que hace que una lectura sea honesta. Las pistas ayudan a pensar qué contar."
      codes={
        <>
          <LabCode>{'<ContextInput>'}</LabCode>
          <LabCode>{'<HintList>'}</LabCode>
        </>
      }
    >
      <LabStage plain maxWidth={stageMax}>
        <StepTag step={2} label="El contexto · opcional, pero clave" />
        <ContextInput
          headingLevel={3}
          label="Y ahora, el salseo"
          help="¿Qué pasó antes del mensaje? ¿Cómo suele escribirte? Cuantos más detalles, mejor lectura."
          value={context}
          onChange={setContext}
          className={styles.liveContext}
        />
        <p
          style={{
            display: 'flex',
            gap: '0.625rem',
            alignItems: 'flex-start',
            marginTop: '1.5rem',
            maxWidth: '62ch',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: 'var(--color-text-muted)',
          }}
        >
          <LockIcon
            size={18}
            style={{ flex: 'none', marginTop: '0.0625rem' }}
          />
          <span>
            Al pedir la lectura, el mensaje y el contexto se envían de forma
            temporal para procesarse. No se guardan en ningún servidor.
          </span>
        </p>
      </LabStage>

      <LabSub style={{ marginTop: '2.5rem' }}>Estados</LabSub>
      <LabGrid
        min={340}
        cellPadding="1.5rem 1.5rem 2.5rem"
        className={styles.states}
        inert
      >
        <div>
          <LabCap>Vacío · con pistas</LabCap>
          <CouponFrame
            standalone
            cutSize={10}
            className={styles.couponSample}
            foot={
              <HintList
                label="Pistas"
                hints={['¿Qué pasó antes?', '¿Cómo suele escribirte?']}
              />
            }
          >
            <p className={`${styles.couponText} ${styles.couponPlaceholder}`}>
              Por ejemplo: le pregunté si le importaba que el viernes llegara
              tarde…
            </p>
          </CouponFrame>
        </div>
        <div>
          <LabCap>Foco · el recorte se vuelve sólido</LabCap>
          <CouponFrame
            standalone
            forceFocus
            cutSize={10}
            className={styles.couponSample}
          >
            <p className={styles.couponText}>
              Hace dos semanas le dije que este sábado iría a comer con su
              familia.
              <SpeechCaret />
            </p>
          </CouponFrame>
        </div>
        <div>
          <LabCap>Relleno · con contador</LabCap>
          <CouponFrame
            standalone
            cutSize={10}
            className={styles.couponSample}
            foot={
              <>
                <span />
                <Counter count={232} />
              </>
            }
          >
            <p className={styles.couponText}>
              Hoy le he escrito que al final no puedo, porque es el cumple de
              Marta. Ha tardado 25 minutos en contestar…
            </p>
          </CouponFrame>
        </div>
        <div>
          <LabCap>Mientras Sofi lee · solo lectura</LabCap>
          <CouponFrame
            standalone
            disabled
            cutSize={10}
            className={styles.couponSample}
          >
            <p className={styles.couponText}>
              Hace dos semanas le dije que este sábado iría a comer con su
              familia…
            </p>
          </CouponFrame>
        </div>
      </LabGrid>
    </LabSpec>
  )
}

function ProcessingSpec({ stageMax }: { stageMax?: string }) {
  const [mode, setMode] = useState<'normal' | 'slow'>('normal')
  return (
    <LabSpec
      id="s2-proc"
      kicker="3.5 · La espera"
      title="ProcessingState"
      desc="Mientras Sofi lee: su retrato, una frase que dice qué está pasando, la barra de celdas y la salida. El mensaje queda a la vista para que sepas qué se está leyendo."
      codes={
        <>
          <LabCode>{'<ProcessingState slow onCancel>'}</LabCode>
          <LabCode>submitting → processing</LabCode>
        </>
      }
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem 0.75rem',
          marginBottom: '1.125rem',
        }}
      >
        <LabChoice
          label="Variante"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'slow', label: 'Carga lenta' },
          ]}
        />
        {mode === 'slow' && <LabProv>Umbral de «lenta» por definir</LabProv>}
      </div>
      <LabStage dots maxWidth={stageMax} innerClassName={styles.proc}>
        <div className={styles.procStage}>
          <div className={styles.procPortrait}>
            <SofiPortrait
              size={192}
              expression="thinking"
              outline
              alt="Sofi entrecierra los ojos, concentrada"
            />
            <LabProv>Expresión provisional</LabProv>
          </div>
          <SofiDialog size="md">
            <SofiDialogText>
              {mode === 'slow'
                ? PROCESSING_LINES.slow
                : PROCESSING_LINES.normal}
            </SofiDialogText>
          </SofiDialog>
        </div>
        <div className={styles.procStatus}>
          <p>Leyendo entre líneas…</p>
          <Loader />
        </div>
        <div className={styles.procFoot}>
          <div className={styles.procReading}>
            <p className={styles.kickerMuted}>Sofi está leyendo</p>
            <MessageBubble message={FIXTURE_MESSAGE} />
            <p className={styles.count}>Con contexto · 232 caracteres</p>
          </div>
          <TextLink>Cancelar</TextLink>
        </div>
      </LabStage>
      <LabGrid style={{ marginTop: '1.75rem' }}>
        <div>
          <LabCap>submitting · el botón espera</LabCap>
          <Button loading loadingLabel="Enviando…">
            Leer entre líneas
          </Button>
        </div>
        <div>
          <LabCap>Anuncio para lectores</LabCap>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>
            Un único role="status": «Sofi está leyendo tu mensaje». Si tarda, se
            anuncia una vez el aviso de carga lenta.
          </p>
        </div>
        <div>
          <LabCap>Cancelar</LabCap>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>
            Vuelve a la consulta con el mensaje y el contexto intactos, y el
            foco en «Leer entre líneas».
          </p>
        </div>
      </LabGrid>
    </LabSpec>
  )
}

function LeadSpec({ stageMax }: { stageMax?: string }) {
  return (
    <LabSpec
      id="s2-lead"
      kicker="3.6 · Interpretaciones"
      title="InterpretationLead"
      desc="La versión con más apoyo, en portada. El estallido dice «la más probable (no la única)»; si las dos primeras están cerca, no hay portada para nadie: la variante «reñido» quita el rosa y lo dice."
      codes={
        <>
          <LabCode>{'<InterpretationLead tone="clear | close">'}</LabCode>
          <LabProv>Umbral de «reñido» · dominio</LabProv>
        </>
      }
    >
      <LabStage plain maxWidth={stageMax} innerClassName={styles.leads}>
        <InterpretationLead interpretation={LEAD} headingLevel={3} />
        <InterpretationLead
          interpretation={LEAD_CLOSE}
          tone="close"
          runnerUp={31}
          headingLevel={3}
        />
      </LabStage>
      <LeadPlayground />
    </LabSpec>
  )
}

function ListSpec() {
  const scale: ReadonlyArray<[number, string]> = [
    [0, '0 celdas'],
    [9, '2 celdas'],
    [24, '5 celdas'],
    [52, '10 celdas'],
    [100, '20 celdas'],
  ]
  return (
    <LabSpec
      id="s2-list"
      kicker="3.7 · Interpretaciones"
      title="InterpretationList y ConfidenceMeter"
      desc="El resto de versiones, en columna de revista: número, titular, una explicación y su medidor. El medidor de celdas es el mismo en todas partes."
      codes={
        <>
          <LabCode>{'<InterpretationList>'}</LabCode>
          <LabCode>{'<ConfidenceMeter percentage>'}</LabCode>
        </>
      }
    >
      <div className={styles.listBlock}>
        <LabStage plain maxWidth="min(100%, 560px)">
          <InterpretationList
            interpretations={OTHER_VERSIONS}
            headingLevel={3}
          />
        </LabStage>
        <div>
          <LabSub>Escala del medidor · 20 celdas de 5 %</LabSub>
          <ul className={styles.meters}>
            {scale.map(([value, cells]) => (
              <li key={value}>
                <LabCode>{value} %</LabCode>
                <ConfidenceMeter percentage={value} />
                <LabNote>{cells}</LabNote>
              </li>
            ))}
            <li className={styles.meterOnPink}>
              <LabCode>52 % · sobre rosa</LabCode>
              <ConfidenceMeter percentage={52} />
              <span style={{ fontSize: '0.875rem' }}>10 celdas</span>
            </li>
          </ul>
          <LabNote style={{ marginTop: '1rem', maxWidth: '72ch' }}>
            Se redondea a la celda más cercana y la cifra exacta siempre está
            escrita al lado. El medidor es aria-hidden: lo que se lee es el
            número. Las versiones reparten el apoyo entre ellas; ninguna barra
            mide lo que siente nadie.
          </LabNote>
        </div>
      </div>
      <MeterPlayground />
    </LabSpec>
  )
}

function BadgesSpec() {
  return (
    <LabSpec
      id="s2-badges"
      kicker="3.8 · Incertidumbre"
      title="ReliabilityBadges"
      desc="Dos insignias que acompañan siempre al titular de la lectura: cuánta confianza tiene Sofi y cuánto contexto le has dado. El nivel se lee en el texto; los cuadritos solo ayudan a escanear."
      codes={
        <>
          <LabCode>{'<ReliabilityBadges confidence context>'}</LabCode>
          <LabProv>Umbrales · dominio</LabProv>
        </>
      }
    >
      <LabGrid min={300} cellPadding="1.375rem" className={styles.badgeCells}>
        <div>
          <LabCap>Confianza</LabCap>
          {(['baja', 'media', 'alta'] as const).map((level, index) => (
            <Badge key={level} tone="fill" pips={{ filled: index + 1 }}>
              Confianza:&nbsp;<strong>{level}</strong>
            </Badge>
          ))}
        </div>
        <div>
          <LabCap>Contexto</LabCap>
          {(['insuficiente', 'parcial', 'suficiente'] as const).map(
            (level, index) => (
              <Badge
                key={level}
                tone={index === 0 ? 'warn' : 'plain'}
                pips={{ filled: index + 1 }}
              >
                Contexto:&nbsp;<strong>{level}</strong>
              </Badge>
            ),
          )}
        </div>
        <div>
          <LabCap>En la lectura</LabCap>
          <ReliabilityBadges confidence="medium" context="partial" />
          <LabNote>
            Lista con nombre propio para lectores: «Fiabilidad de la lectura».
            Van siempre juntas, debajo del titular.
          </LabNote>
        </div>
      </LabGrid>
      <ReliabilityPlayground />
    </LabSpec>
  )
}

function BoxesSpec({ stageMax }: { stageMax?: string }) {
  return (
    <LabSpec
      id="s2-boxes"
      kicker="3.9 · Cierre de la lectura"
      title="FinePrint, MissingData y SofiAdvice"
      desc="Las tres cajas que cierran cada lectura. La letra pequeña no es pequeña; lo que falta se pide con preguntas concretas; el consejo siempre empuja a hablar."
      codes={
        <>
          <LabCode>{'<FinePrint>'}</LabCode>
          <LabCode>{'<MissingData questions>'}</LabCode>
          <LabCode>{'<SofiAdvice>'}</LabCode>
        </>
      }
    >
      <LabStage
        plain
        maxWidth={stageMax}
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <ReadingBoxes>
          <FinePrint versions={4} headingLevel={3} />
          <MissingData
            questions={MISSING_QUESTIONS}
            onAddContext={() => {}}
            headingLevel={3}
          />
          <SofiAdvice
            title={ADVICE.title}
            text={ADVICE.text}
            headingLevel={3}
          />
        </ReadingBoxes>
        <LabNote style={{ marginTop: '1rem' }}>
          Con contexto suficiente, MissingData no aparece y las otras dos cajas
          se reparten el ancho solas.
        </LabNote>
      </LabStage>
      <BoxesPlayground />
    </LabSpec>
  )
}

function NeedsSpec({ stageMax }: { stageMax?: string }) {
  const [context, setContext] = useState('')
  return (
    <LabSpec
      id="s2-nc"
      kicker="3.10 · needs_context"
      title="NeedsContext"
      desc="Cuando no hay contexto suficiente, Sofi no inventa porcentajes: lo dice, enseña lo único que tiene y pide lo que le falta. No es un error y no se pinta como tal: nada de cereza."
      codes={
        <LabCode>
          {'<ContextQuestions> · <ContextInput> · <ReliabilityBadges>'}
        </LabCode>
      }
    >
      <LabStage dots maxWidth={stageMax}>
        <div className={styles.needs}>
          <div className={styles.needsSofi}>
            <SofiPortrait
              size={288}
              expression="unconvinced"
              outline
              alt="Sofi entrecierra los ojos, poco convencida"
            />
            <SofiDialog size="md">
              <SofiDialogText as="blockquote">
                Con un «vale» a secas no hago milagros. Dame contexto y te lo
                leo como se merece.
              </SofiDialogText>
            </SofiDialog>
          </div>
          <div className={styles.needsBox}>
            <KickerRow
              tag="Última hora"
              tagTone="pink"
              kicker="Lectura en pausa"
            />
            <h3 className={styles.needsTitle}>¡Falta el salseo!</h3>
            <p className={styles.needsText}>
              Sin contexto, cualquier porcentaje sería inventado. Y aquí no
              inventamos.
            </p>
            <ReliabilityBadges
              context="insufficient"
              note="Sin porcentajes"
              className={styles.needsBadges}
            />
            <p
              className={styles.kickerMuted}
              style={{ marginTop: '1.375rem', marginBottom: '0.625rem' }}
            >
              Lo único que tengo
            </p>
            <MessageBubble message="Vale." size="lg" />
            <ContextQuestions
              questions={NEEDS_QUESTIONS}
              headingLevel={4}
              className={styles.needsQuestions}
            />
            <ContextInput
              label="Y ahora, el salseo"
              labelPlacement="inside"
              value={context}
              onChange={setContext}
              rows={4}
              hints={[]}
              showCount={false}
              className={styles.needsCoupon}
            />
            <LabRow style={{ marginTop: '1.875rem', gap: '1rem 1.75rem' }}>
              <Button fluid arrow>
                Volver a leer
              </Button>
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.5,
                  color: 'var(--color-text-muted)',
                }}
              >
                Pedir contexto también es una respuesta. Y a veces, la mejor.
              </p>
            </LabRow>
          </div>
        </div>
      </LabStage>
    </LabSpec>
  )
}

function ErrorSpec({ stageMax }: { stageMax?: string }) {
  return (
    <LabSpec
      id="s2-err"
      kicker="3.11 · error"
      title="ErrorState"
      desc="El único sitio con cereza. Dice qué ha pasado sin culpar a nadie, garantiza que no se ha perdido nada y ofrece reintentar. El humor baja un punto: aquí lo importante es salir del paso."
      codes={
        <>
          <LabCode>{'<ErrorState kind onRetry onEdit>'}</LabCode>
          <LabProv>Textos provisionales</LabProv>
        </>
      }
    >
      <LabStage plain maxWidth={stageMax}>
        <div className={styles.err}>
          <div className={styles.errSide}>
            <SofiPortrait
              size={300}
              expression="oops"
              alt="Sofi cierra los ojos: algo ha fallado"
              crop={{
                width: 150,
                height: 150,
                offsetX: 75,
                offsetY: 66,
                background: 'var(--tone-white)',
                frame: 'sticker',
              }}
            />
            <LabProv>Expresión provisional</LabProv>
          </div>
          <div style={{ display: 'grid', gap: '1.375rem' }}>
            <ErrorState titleAs="h3" onRetry={() => {}} onEdit={() => {}} />
            <ul className={styles.copy}>
              {(['offline', 'service', 'unexpected'] as const).map((kind) => (
                <li key={kind}>
                  <p
                    className={styles.kickerMuted}
                    style={{ color: 'var(--color-text)' }}
                  >
                    {kind === 'offline'
                      ? 'Sin conexión'
                      : kind === 'service'
                        ? 'El servicio no responde'
                        : 'Algo inesperado'}
                  </p>
                  <p>
                    <strong>{ERROR_COPY[kind].title}.</strong>{' '}
                    {ERROR_COPY[kind].text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </LabStage>
    </LabSpec>
  )
}

export function SofiSection() {
  const [width, setWidth] = useState<StageWidth>('full')
  const stageMax = stageMaxWidth(width)
  return (
    <>
      <LabMast
        titleId="s-h1"
        tag="Sección 03"
        kicker="Sofi, su voz, la consulta y la lectura"
        title="Sofi Components"
        deck="Piezas de presentación que solo existen en Ask Sofi. Reciben datos ya preparados, sin saber de dónde vienen: aquí, de fixtures locales. Aquí se juega la honestidad del producto: cada pieza separa lo que Sofi interpreta de lo que sabe."
        jumps={[
          { href: '#s-portrait', num: '3.1', label: 'SofiPortrait' },
          { href: '#s-dialog', num: '3.2', label: 'SofiDialog' },
          { href: '#s-msg', num: '3.3', label: 'MessageInput' },
          { href: '#s-ctx', num: '3.4', label: 'ContextInput' },
          { href: '#s2-proc', num: '3.5', label: 'Procesando' },
          { href: '#s2-lead', num: '3.6', label: 'Versión destacada' },
          { href: '#s2-list', num: '3.7', label: 'Versiones y medidor' },
          { href: '#s2-badges', num: '3.8', label: 'Fiabilidad' },
          { href: '#s2-boxes', num: '3.9', label: 'Cajas de lectura' },
          { href: '#s2-nc', num: '3.10', label: 'Falta contexto' },
          { href: '#s2-err', num: '3.11', label: 'Error' },
        ]}
        aside={
          <Burst
            tone="lilac"
            kicker="Datos"
            size={150}
            rotate={-8}
            kickerSize={11}
            mainSize={22}
            mainGap={4}
          >
            simulados
          </Burst>
        }
      />
      <LabToolbar>
        <LabChoice
          label="Ancho del contenedor"
          options={STAGE_WIDTHS}
          value={width}
          onChange={setWidth}
        />
        <LabNote>
          Afecta al diálogo, la burbuja, el cupón y las versiones: por debajo de
          560 px pasan a su versión compacta.
        </LabNote>
      </LabToolbar>
      <PortraitSpec />
      <DialogSpec stageMax={stageMax} />
      <MessageSpec stageMax={stageMax} />
      <ContextSpec stageMax={stageMax} />
      <ProcessingSpec stageMax={stageMax} />
      <LeadSpec stageMax={stageMax} />
      <ListSpec />
      <BadgesSpec />
      <BoxesSpec stageMax={stageMax} />
      <NeedsSpec stageMax={stageMax} />
      <ErrorSpec stageMax={stageMax} />
    </>
  )
}
