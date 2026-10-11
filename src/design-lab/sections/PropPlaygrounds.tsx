import { useState, type ReactNode } from 'react'
import { ConfidenceMeter } from '../../components/sofi/ConfidenceMeter/ConfidenceMeter'
import {
  InterpretationLead,
  ReliabilityBadges,
} from '../../components/sofi/Interpretations/Interpretations'
import {
  FinePrint,
  MissingData,
  ReadingBoxes,
  SofiAdvice,
} from '../../components/sofi/ReadingBoxes/ReadingBoxes'
import {
  SofiDialog,
  SofiDialogText,
  type SofiDialogSize,
} from '../../components/sofi/SofiDialog/SofiDialog'
import type { SofiExpression } from '../../components/sofi/SofiPortrait/SofiPortrait'
import { SofiStage } from '../../components/sofi/SofiStage/SofiStage'
import type {
  ConfidenceLevel,
  ContextLevel,
  LeadTone,
} from '../../components/sofi/types'
import { Burst } from '../../components/ui/Burst/Burst'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Badge } from '../../components/ui/Indicators/Indicators'
import { Counter } from '../../components/ui/Counter/Counter'
import {
  InlineNotice,
  Notice,
  NoticeText,
} from '../../components/ui/Notice/Notice'
import type { NoticeTone } from '../../components/ui/Notice/Notice'
import { SoundChoice } from '../../components/ui/SoundChoice/SoundChoice'
import type { SoundChoiceValue } from '../../components/ui/SoundChoice/SoundChoice'
import { Tag, type TagTone } from '../../components/ui/Tag/Tag'
import { ThemeSwitch } from '../../components/ui/ThemeSwitch/ThemeSwitch'
import { ADVICE, LEAD, LEAD_CLOSE, MISSING_QUESTIONS } from '../fixtures'
import {
  LabCheck,
  LabChoice,
  LabNote,
  LabPanel,
  LabRange,
  LabReadout,
  LabSplit,
  LabStage,
  LabSub,
} from '../parts/LabParts'

// Cada «playground» pone un componente real de producción junto a sus props:
// lo que se toca en el panel es lo que recibe el componente de la derecha.
type PlaygroundProps = {
  title: string
  // Las props tal como se escribirían en JSX.
  props: string
  controls: ReactNode
  note?: ReactNode
  plain?: boolean
  dots?: boolean
  children: ReactNode
}

function Playground({
  title,
  props,
  controls,
  note,
  plain,
  dots,
  children,
}: PlaygroundProps) {
  return (
    <>
      <LabSub style={{ marginTop: '2.5rem' }}>{title}</LabSub>
      <LabSplit>
        <LabPanel>
          {controls}
          <LabReadout rows={[['Props', props || '—']]} />
        </LabPanel>
        <div>
          <LabStage plain={plain} dots={dots}>
            {children}
          </LabStage>
          {note && <LabNote style={{ marginTop: '1rem' }}>{note}</LabNote>}
        </div>
      </LabSplit>
    </>
  )
}

function jsx(...parts: ReadonlyArray<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

// --- UI ---

const TAG_TONES: ReadonlyArray<TagTone> = [
  'ink',
  'pink',
  'butter',
  'lilac',
  'cherry',
  'outline',
]

export function TagPlayground() {
  const [tone, setTone] = useState<TagTone>('ink')
  return (
    <Playground
      title="Tag · props"
      props={jsx('<Tag', tone !== 'ink' && `tone="${tone}"`, '>')}
      controls={
        <LabChoice
          stacked
          label="Tono"
          value={tone}
          onChange={setTone}
          options={TAG_TONES.map((value) => ({ value, label: value }))}
        />
      }
      dots
    >
      <Tag tone={tone}>Exclusiva</Tag>
    </Playground>
  )
}

type BurstTone = 'butter' | 'pink' | 'lilac'

export function BurstPlayground() {
  const [tone, setTone] = useState<BurstTone>('butter')
  const [size, setSize] = useState(150)
  const [rotate, setRotate] = useState(9)
  const [weight, setWeight] = useState<'900' | '700'>('900')
  return (
    <Playground
      title="Burst · props"
      props={jsx(
        '<Burst',
        tone !== 'butter' && `tone="${tone}"`,
        `size={${size}}`,
        `rotate={${rotate}}`,
        weight === '700' && 'mainWeight={700}',
        '>',
      )}
      controls={
        <>
          <LabChoice
            stacked
            label="Tono"
            value={tone}
            onChange={setTone}
            options={[
              { value: 'butter', label: 'Mantequilla' },
              { value: 'pink', label: 'Rosa' },
              { value: 'lilac', label: 'Lila' },
            ]}
          />
          <LabRange
            label="Tamaño"
            value={size}
            min={90}
            max={220}
            step={2}
            display={`${size} px`}
            onChange={setSize}
          />
          <LabRange
            label="Inclinación"
            value={rotate}
            min={-20}
            max={20}
            step={1}
            display={`${rotate}°`}
            onChange={setRotate}
          />
          <LabChoice
            stacked
            label="Peso de la cifra"
            value={weight}
            onChange={setWeight}
            options={[
              { value: '900', label: '900 · cifras' },
              { value: '700', label: '700 · apartes' },
            ]}
          />
        </>
      }
      dots
    >
      <Burst
        kicker="Consulta"
        tone={tone}
        size={size}
        rotate={rotate}
        mainWeight={weight === '700' ? 700 : 900}
      >
        0&nbsp;€
      </Burst>
    </Playground>
  )
}

type BadgeTone = 'plain' | 'fill' | 'warn'

export function IndicatorPlayground() {
  const [tone, setTone] = useState<BadgeTone>('fill')
  const [filled, setFilled] = useState(2)
  const [count, setCount] = useState(240)
  return (
    <Playground
      title="Badge y Counter · props"
      props={jsx(
        `<Badge tone="${tone}" pips={{ filled: ${filled}, total: 3 }}>`,
        `<Counter count={${count}} />`,
      )}
      controls={
        <>
          <LabChoice
            stacked
            label="Tono de la insignia"
            value={tone}
            onChange={setTone}
            options={[
              { value: 'plain', label: 'Plana' },
              { value: 'fill', label: 'Rellena' },
              { value: 'warn', label: 'Aviso' },
            ]}
          />
          <LabRange
            label="Cuadritos llenos"
            value={filled}
            min={0}
            max={3}
            step={1}
            display={`${filled} de 3`}
            onChange={setFilled}
          />
          <LabRange
            label="Caracteres"
            value={count}
            min={0}
            max={1200}
            step={10}
            display={String(count)}
            onChange={setCount}
          />
        </>
      }
      plain
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <Badge tone={tone} pips={{ filled, total: 3 }}>
          Confianza:&nbsp;
          <strong>{['nula', 'baja', 'media', 'alta'][filled]}</strong>
        </Badge>
        <Counter count={count} />
      </div>
    </Playground>
  )
}

export function SelectionPlayground() {
  const [display, setDisplay] = useState<'text' | 'icon' | 'responsive'>('text')
  const [sound, setSound] = useState<SoundChoiceValue>('off')
  const [fill, setFill] = useState(false)
  return (
    <Playground
      title="ThemeSwitch y SoundChoice · props"
      props={jsx(
        `<ThemeSwitch display="${display}" />`,
        `<SoundChoice value="${sound}"`,
        fill && 'fill',
        '/>',
      )}
      controls={
        <>
          <LabChoice
            stacked
            label="ThemeSwitch · display"
            value={display}
            onChange={setDisplay}
            options={[
              { value: 'text', label: 'Texto' },
              { value: 'icon', label: 'Iconos' },
              { value: 'responsive', label: 'Responsive' },
            ]}
          />
          <LabChoice
            stacked
            label="SoundChoice · value"
            value={sound}
            onChange={setSound}
            options={[
              { value: 'off', label: 'Sin sonido' },
              { value: 'on', label: 'Con sonido' },
            ]}
          />
          <LabCheck
            label="SoundChoice · fill"
            checked={fill}
            onChange={setFill}
          />
        </>
      }
      note="El selector de tema es el real: cambiarlo aquí cambia el tema de todo el laboratorio. La elección de sonido de este ejemplo es local."
    >
      <div style={{ display: 'grid', gap: '1.5rem', justifyItems: 'start' }}>
        <ThemeSwitch display={display} />
        <div style={{ width: '100%' }}>
          <SoundChoice value={sound} onChange={setSound} fill={fill} />
        </div>
      </div>
    </Playground>
  )
}

const NOTICE_TONES: ReadonlyArray<NoticeTone> = [
  'attention',
  'info',
  'soft',
  'pink',
  'ink',
  'danger',
]

export function NoticePlayground() {
  const [tone, setTone] = useState<NoticeTone>('attention')
  const [role, setRole] = useState<'status' | 'alert'>('status')
  const [level, setLevel] = useState<'h2' | 'h3' | 'h4'>('h3')
  const [kicker, setKicker] = useState(true)
  const [text, setText] = useState(true)
  return (
    <Playground
      title="Notice · props"
      props={jsx(
        `<Notice tone="${tone}"`,
        kicker && 'kicker',
        `role="${role}"`,
        `titleAs="${level}"`,
        '>',
      )}
      controls={
        <>
          <LabChoice
            stacked
            label="Tono"
            value={tone}
            onChange={setTone}
            options={NOTICE_TONES.map((value) => ({ value, label: value }))}
          />
          <LabChoice
            stacked
            label="Rol"
            value={role}
            onChange={setRole}
            options={[
              { value: 'status', label: 'status · no interrumpe' },
              { value: 'alert', label: 'alert · interrumpe' },
            ]}
            hint="Solo se anuncia al insertarse tras una acción."
          />
          <LabChoice
            stacked
            label="Nivel del titular"
            value={level}
            onChange={setLevel}
            options={[
              { value: 'h2', label: 'h2' },
              { value: 'h3', label: 'h3' },
              { value: 'h4', label: 'h4' },
            ]}
          />
          <LabCheck
            label="Con antetítulo"
            checked={kicker}
            onChange={setKicker}
          />
          <LabCheck label="Con texto" checked={text} onChange={setText} />
        </>
      }
      plain
    >
      <Notice
        tone={tone}
        kicker={kicker ? 'Aviso' : undefined}
        title="Tu mensaje sigue aquí"
        titleAs={level}
        // Es una muestra: el rol se expone, pero el aviso no se anuncia al montarse.
        role={role}
      >
        {text && (
          <NoticeText>
            Nada sale de tu navegador hasta que pulses «Leer entre líneas».
          </NoticeText>
        )}
      </Notice>
    </Playground>
  )
}

export function InlineNoticePlayground() {
  const [tone, setTone] = useState<'attention' | 'plain'>('attention')
  return (
    <Playground
      title="InlineNotice · props"
      props={jsx(
        '<InlineNotice',
        tone !== 'attention' && `tone="${tone}"`,
        '>',
      )}
      controls={
        <LabChoice
          stacked
          label="Tono"
          value={tone}
          onChange={setTone}
          options={[
            { value: 'attention', label: 'Atención' },
            { value: 'plain', label: 'Plano' },
          ]}
        />
      }
      plain
    >
      <InlineNotice tone={tone} role="status">
        Sin sonido: Sofi escribe en silencio.
      </InlineNotice>
    </Playground>
  )
}

export function EmptyStatePlayground() {
  const [text, setText] = useState(true)
  const [action, setAction] = useState(true)
  const [level, setLevel] = useState<'h2' | 'h3' | 'p'>('h3')
  return (
    <Playground
      title="EmptyState · props"
      props={jsx(
        '<EmptyState title',
        text && 'text',
        action && 'action',
        `titleAs="${level}"`,
        '/>',
      )}
      controls={
        <>
          <LabCheck label="Con texto" checked={text} onChange={setText} />
          <LabCheck label="Con acción" checked={action} onChange={setAction} />
          <LabChoice
            stacked
            label="Etiqueta del titular"
            value={level}
            onChange={setLevel}
            options={[
              { value: 'h2', label: 'h2' },
              { value: 'h3', label: 'h3' },
              { value: 'p', label: 'p' },
            ]}
          />
        </>
      }
      plain
    >
      <EmptyState
        title="Todavía no hay nada que leer"
        text={
          text
            ? 'Pega un mensaje y Sofi te cuenta qué ha podido querer decir.'
            : undefined
        }
        action={action ? <Button size="sm">Pegar mensaje</Button> : undefined}
        titleAs={level}
      />
    </Playground>
  )
}

// --- Sofi ---

export function DialogPlayground() {
  const [size, setSize] = useState<SofiDialogSize>('md')
  const [name, setName] = useState<'Sofi' | 'Sofi, de guardia'>('Sofi')
  const [more, setMore] = useState(false)
  const [long, setLong] = useState(false)
  return (
    <Playground
      title="SofiDialog · props"
      props={jsx(
        '<SofiDialog',
        `size="${size}"`,
        name !== 'Sofi' && `name="${name}"`,
        more && 'more',
        '>',
      )}
      controls={
        <>
          <LabChoice
            stacked
            label="Tamaño"
            value={size}
            onChange={setSize}
            options={[
              { value: 'lg', label: 'Grande' },
              { value: 'md', label: 'Mediano' },
              { value: 'sm', label: 'Pequeño' },
            ]}
          />
          <LabChoice
            stacked
            label="Nombre"
            value={name}
            onChange={setName}
            options={[
              { value: 'Sofi', label: 'Sofi' },
              { value: 'Sofi, de guardia', label: 'Sofi, de guardia' },
            ]}
          />
          <LabCheck
            label="Con «seguir» (more)"
            checked={more}
            onChange={setMore}
          />
          <LabCheck label="Texto largo" checked={long} onChange={setLong} />
        </>
      }
      dots
    >
      <SofiDialog size={size} name={name} more={more}>
        <SofiDialogText>
          {long
            ? 'Con un «vale» a secas no hago milagros. Cuéntame qué pasó antes, cómo suele escribirte y si esto es normal en su tono: con eso puedo darte versiones que se sostengan.'
            : 'Con un «vale» no hago milagros. Dame contexto.'}
        </SofiDialogText>
      </SofiDialog>
    </Playground>
  )
}

const EXPRESSIONS: ReadonlyArray<[SofiExpression, string, string]> = [
  ['attentive', 'Atenta', 'Sofi, atenta a lo que le cuentas'],
  ['thinking', 'Pensando', 'Sofi, pensando con los ojos entrecerrados'],
  ['unconvinced', 'Poco convencida', 'Sofi, poco convencida'],
  ['oops', 'Ups', 'Sofi cierra los ojos: algo ha fallado'],
  ['talking', 'Hablando', 'Sofi, hablando'],
]

export function StagePlayground() {
  const [expression, setExpression] = useState<SofiExpression>('attentive')
  const alt = EXPRESSIONS.find(([value]) => value === expression)?.[2] ?? ''
  return (
    <Playground
      title="SofiStage · props"
      props={jsx('<SofiStage', `expression="${expression}"`, 'alt label>')}
      controls={
        <LabChoice
          stacked
          label="Expresión"
          value={expression}
          onChange={setExpression}
          options={EXPRESSIONS.map(([value, label]) => ({ value, label }))}
        />
      }
      note="Dónde Sofi lee, responde o pide contexto: retrato y diálogo. Es el escenario de las pantallas de lectura, de contexto y de error."
      plain
    >
      <SofiStage expression={expression} alt={alt} label="Sofi responde">
        <SofiDialog name="Sofi" size="md">
          <SofiDialogText>Esto es lo que veo entre líneas.</SofiDialogText>
        </SofiDialog>
      </SofiStage>
    </Playground>
  )
}

export function LeadPlayground() {
  const [tone, setTone] = useState<LeadTone>('clear')
  const [percentage, setPercentage] = useState(52)
  const [runnerUp, setRunnerUp] = useState(31)
  const base = tone === 'close' ? LEAD_CLOSE : LEAD
  return (
    <Playground
      title="InterpretationLead · props"
      props={jsx(
        '<InterpretationLead',
        `tone="${tone}"`,
        `interpretation={{ percentage: ${percentage}, … }}`,
        tone === 'close' && `runnerUp={${runnerUp}}`,
        '>',
      )}
      controls={
        <>
          <LabChoice
            stacked
            label="Tono"
            value={tone}
            onChange={setTone}
            options={[
              { value: 'clear', label: 'Clara' },
              { value: 'close', label: 'Reñido' },
            ]}
          />
          <LabRange
            label="Porcentaje de la versión"
            value={percentage}
            min={20}
            max={95}
            step={1}
            display={`${percentage} %`}
            onChange={setPercentage}
          />
          {tone === 'close' && (
            <LabRange
              label="Segunda versión"
              value={runnerUp}
              min={15}
              max={60}
              step={1}
              display={`${runnerUp} %`}
              onChange={setRunnerUp}
            />
          )}
        </>
      }
      note="El umbral de «reñido» sigue abierto: quien prepara los datos decide el tono; aquí se elige a mano."
      plain
    >
      <InterpretationLead
        interpretation={{ ...base, percentage }}
        tone={tone}
        runnerUp={tone === 'close' ? runnerUp : undefined}
        headingLevel={3}
      />
    </Playground>
  )
}

export function MeterPlayground() {
  const [percentage, setPercentage] = useState(52)
  return (
    <Playground
      title="ConfidenceMeter · props"
      props={`<ConfidenceMeter percentage={${percentage}} />`}
      controls={
        <LabRange
          label="Porcentaje"
          value={percentage}
          min={0}
          max={100}
          step={1}
          display={`${percentage} % · ${Math.round(percentage / 5)} celdas`}
          onChange={setPercentage}
        />
      }
      plain
    >
      <div style={{ maxWidth: '24rem' }}>
        <ConfidenceMeter percentage={percentage} />
      </div>
    </Playground>
  )
}

export function ReliabilityPlayground() {
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium')
  const [context, setContext] = useState<ContextLevel>('partial')
  const [note, setNote] = useState(false)
  return (
    <Playground
      title="ReliabilityBadges · props"
      props={jsx(
        `<ReliabilityBadges confidence="${confidence}" context="${context}"`,
        note && 'note="Sin porcentajes"',
        '/>',
      )}
      controls={
        <>
          <LabChoice
            stacked
            label="Confianza"
            value={confidence}
            onChange={setConfidence}
            options={[
              { value: 'low', label: 'Baja' },
              { value: 'medium', label: 'Media' },
              { value: 'high', label: 'Alta' },
            ]}
          />
          <LabChoice
            stacked
            label="Contexto"
            value={context}
            onChange={setContext}
            options={[
              { value: 'insufficient', label: 'Insuficiente' },
              { value: 'partial', label: 'Parcial' },
              { value: 'sufficient', label: 'Suficiente' },
            ]}
          />
          <LabCheck
            label="Con nota (sin porcentajes)"
            checked={note}
            onChange={setNote}
          />
        </>
      }
      note="Los umbrales de cada nivel los decide el dominio; el componente solo pinta el nivel que recibe."
      plain
    >
      <ReliabilityBadges
        confidence={confidence}
        context={context}
        note={note ? 'Sin porcentajes' : undefined}
      />
    </Playground>
  )
}

export function BoxesPlayground() {
  const [versions, setVersions] = useState(4)
  const [questions, setQuestions] = useState(2)
  const [sufficient, setSufficient] = useState(false)
  const asked = [
    ...MISSING_QUESTIONS,
    '¿Había pasado algo parecido antes?',
  ].slice(0, questions)
  return (
    <Playground
      title="ReadingBoxes · props"
      props={jsx(
        `<FinePrint versions={${versions}} />`,
        !sufficient && `<MissingData questions={${questions}} />`,
        '<SofiAdvice />',
      )}
      controls={
        <>
          <LabRange
            label="Versiones"
            value={versions}
            min={2}
            max={5}
            step={1}
            display={String(versions)}
            onChange={setVersions}
          />
          <LabRange
            label="Preguntas pendientes"
            value={questions}
            min={1}
            max={3}
            step={1}
            display={String(questions)}
            onChange={setQuestions}
          />
          <LabCheck
            label="Contexto suficiente"
            checked={sufficient}
            onChange={setSufficient}
          />
        </>
      }
      plain
    >
      <ReadingBoxes>
        <FinePrint versions={versions} headingLevel={3} />
        {!sufficient && (
          <MissingData
            questions={asked}
            onAddContext={() => {}}
            headingLevel={3}
          />
        )}
        <SofiAdvice title={ADVICE.title} text={ADVICE.text} headingLevel={3} />
      </ReadingBoxes>
    </Playground>
  )
}
