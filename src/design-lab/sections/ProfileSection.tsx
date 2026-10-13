import { useState } from 'react'
import type { MotionPreference } from '../../app/providers/MotionPreference'
import { SofiPortrait } from '../../components/sofi/SofiPortrait/SofiPortrait'
import { Button } from '../../components/ui/Button/Button'
import { MOOD_ALT } from '../../features/partner-profile/profileCopy'
import {
  SOFI_MOODS,
  type SofiMood,
} from '../../features/partner-profile/sofiGuide'
import { visualFor } from '../../features/partner-profile/sofiVisuals'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import {
  LabCap,
  LabChoice,
  LabCode,
  LabMast,
  LabNote,
  LabProv,
  LabSpec,
  LabUses,
} from '../parts/LabParts'
import {
  CONSULTATION_PRESETS,
  PROFILE_PRESETS,
  SHEET_PRESETS,
  type ProfilePresetKey,
} from '../profile/profilePresets'
import { ScaledFrame } from '../profile/ScaledFrame'
import styles from './ProfileSection.module.scss'

// Para qué sirve cada estado (004-plan §5).
const MOOD_PURPOSE: Record<SofiMood, string> = {
  inviting: 'Presentar la invitación inicial',
  asking: 'Formular una pregunta, con typewriter y voz',
  waiting: 'Esperar una respuesta',
  acknowledging: 'Reaccionar a una respuesta, quitarla o descartar cambios',
  uncertain: 'Reconocer «Depende» o «No lo sé»',
  saved: 'Confirmar un guardado',
  validationError: 'Avisar: expediente vacío o guardado solo en memoria',
  deleting: 'Acompañar la confirmación de eliminación',
  deleted: 'Quedarse neutra tras eliminar el expediente',
}

const MOBILE = { width: 390, height: 844, label: 'Móvil' }
const DESKTOP = { width: 1280, height: 800, label: 'Escritorio' }
// Móviles con los que se revisó en T012: del más pequeño soportado al horizontal.
const PHONES = {
  '320': { width: 320, height: 568, label: 'Móvil' },
  '375': { width: 375, height: 667, label: 'Móvil' },
  '390': MOBILE,
  '430': { width: 430, height: 932, label: 'Móvil' },
  landscape: { width: 844, height: 390, label: 'Móvil en horizontal' },
} as const
type Phone = keyof typeof PHONES

const frameSrc = (
  preset: ProfilePresetKey,
  motion: MotionPreference,
  run: number,
) => `/design-lab?frame=profile&preset=${preset}&motion=${motion}&run=${run}`

function assetName(src: string) {
  return src.split('/').pop()?.replace(/\..*$/, '') ?? src
}

function StatesSpec() {
  const reducedMotion = useReducedMotion()
  const [resource, setResource] = useState<'placeholder' | 'fallback'>(
    'placeholder',
  )
  return (
    <LabSpec
      id="p-states"
      kicker="6.1 · Personaje"
      title="Estados de Sofi en el expediente"
      desc="Cada estado de la interacción tiene una representación propia. La correspondencia vive en un solo registro: cuando lleguen los spritesheets de 008, cambia el recurso y no el cuestionario. Mientras una imagen carga, o si falla, se ve el fotograma del parpadeo."
      codes={
        <>
          <LabCode>sofiVisuals.ts</LabCode>
          <LabCode>{'<SofiPortrait image>'}</LabCode>
          <LabProv>Placeholders provisionales · 008</LabProv>
        </>
      }
    >
      <LabChoice
        label="Recurso"
        value={resource}
        onChange={setResource}
        options={[
          { value: 'placeholder', label: 'Placeholder' },
          { value: 'fallback', label: 'Alternativa' },
        ]}
        hint="La alternativa es lo que se ve mientras carga o si falla."
      />
      <ul className={styles.states}>
        {SOFI_MOODS.map((mood) => {
          const visual = visualFor(mood, { reducedMotion })
          const showImage =
            visual.kind === 'image' && resource === 'placeholder'
          const frame = visual.kind === 'image' ? visual.fallback : visual.frame
          return (
            <li key={mood} className={styles.state}>
              <SofiPortrait
                size={192}
                image={showImage ? visual.src : undefined}
                frame={frame}
                alt={MOOD_ALT[mood]}
                outline
              />
              <LabCap as="h3">{mood}</LabCap>
              <p className={styles.statePurpose}>{MOOD_PURPOSE[mood]}</p>
              <p className={styles.stateAsset}>
                {showImage && visual.kind === 'image'
                  ? assetName(visual.src)
                  : `sofi-blink · ${frame === 'blink' ? 'bucle' : `F${frame}`}`}
              </p>
            </li>
          )
        })}
      </ul>
      <LabNote>
        Con movimiento reducido, el parpadeo se queda en su primer fotograma.
        Las imágenes estáticas no se animan nunca.
      </LabNote>
    </LabSpec>
  )
}

function InviteSpec({ motion }: { motion: MotionPreference }) {
  const [preset, setPreset] =
    useState<(typeof CONSULTATION_PRESETS)[number]>('first-visit')
  return (
    <LabSpec
      id="p-invite"
      kicker="6.2 · Consulta"
      title="Invitación y acceso al expediente"
      desc="En la primera visita, la invitación es el primer diálogo de Sofi: se asoma sobre su propio bocadillo, en lugar del retrato, y explica para qué sirve el expediente y que es opcional. No bloquea la consulta y no vuelve a aparecer. Después, el acceso queda en el pie de su diálogo, con o sin expediente guardado. Prototipo interactivo: «Responder preguntas» lleva a la ficha."
      codes={
        <>
          <LabCode>{'<ConsultationScreen invitation>'}</LabCode>
          <LabCode>{'<ConsultationScreen profileAccess>'}</LabCode>
          <LabProv>Aprobado · revisión de 004</LabProv>
        </>
      }
    >
      <div className={styles.controls}>
        <LabChoice
          label="Visita"
          value={preset}
          onChange={setPreset}
          options={CONSULTATION_PRESETS.map((key) => ({
            value: key,
            label: PROFILE_PRESETS[key].label,
          }))}
        />
      </div>
      <div className={styles.frames}>
        {[MOBILE, DESKTOP].map((size) => (
          <ScaledFrame
            key={size.label}
            src={frameSrc(preset, motion, 0)}
            title={`Consulta · ${PROFILE_PRESETS[preset].label} · ${size.label}`}
            label={size.label}
            width={size.width}
            height={size.height}
          />
        ))}
      </div>
    </LabSpec>
  )
}

function SheetSpec({ motion }: { motion: MotionPreference }) {
  const [preset, setPreset] = useState<(typeof SHEET_PRESETS)[number]>('empty')
  const [run, setRun] = useState(0)
  const [phone, setPhone] = useState<Phone>('390')
  return (
    <LabSpec
      id="p-sheet"
      kicker="6.3 · Expediente"
      title="Cuestionario guiado por Sofi"
      desc="Una sola vista: Sofi formula la pregunta activa en su bocadillo, con las respuestas dentro de él. Responder no avanza; las seis áreas están siempre a mano. Las reacciones son inmediatas, sin typewriter ni voz, y no tocan la pregunta. Cada composición es un punto de partida: desde ahí se puede seguir usando."
      codes={
        <>
          <LabCode>sofiGuide.ts</LabCode>
          <LabCode>{'<ProfileSheet>'}</LabCode>
          <LabProv>Aprobado · revisión de 004</LabProv>
        </>
      }
    >
      <div className={styles.controls}>
        <LabChoice
          stacked
          label="Composición"
          value={preset}
          onChange={(next) => {
            setPreset(next)
            setRun(0)
          }}
          options={SHEET_PRESETS.map((key) => ({
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
            { value: '375', label: '375 × 667' },
            { value: '390', label: '390 × 844' },
            { value: '430', label: '430 × 932' },
            { value: 'landscape', label: '844 × 390' },
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
        {[PHONES[phone], DESKTOP].map((size) => (
          <ScaledFrame
            key={size.label}
            src={frameSrc(preset, motion, run)}
            title={`Expediente · ${PROFILE_PRESETS[preset].label} · ${size.label}`}
            label={size.label}
            width={size.width}
            height={size.height}
          />
        ))}
      </div>
      <LabNote>
        La voz suena con un audio simulado si se activa el sonido en la cabecera
        de cada marco. Nada se guarda: al volver a empezar, la composición
        recupera su estado inicial.
      </LabNote>
    </LabSpec>
  )
}

// Decisiones de la revisión visual de 004 (004-plan §4, §8 y §9): ya están en las
// pantallas definitivas.
const APPROVED = [
  'Invitación conversacional: primer diálogo de Sofi, con ella asomada sobre su bocadillo en lugar del retrato (una sola Sofi). Mismo texto en móvil y escritorio; acciones «Responder preguntas» y «Ahora no». Con «Ahora no» vuelve el diálogo de siempre y el foco pasa a lo que dice Sofi.',
  'Acceso permanente al expediente en el pie del diálogo de Sofi, con o sin expediente guardado.',
  'La invitación se adapta al alto de la ventana, no al dispositivo: a dos columnas, Sofi asomada a 384 px (sprite entero) con alto de sobra, a 288 px (3/4) y el texto a 18 px con menos, y a 192 px (mitad) en portátiles bajos; en una columna, 192 px. Sus acciones se mantienen a la vista.',
  'La región de la invitación se llama «Sofi te pide contexto»; mientras se redacta la consulta, «Sofi está escuchando».',
  'Cuestionario en una columna: Sofi a 192 px (mitad exacta del sprite) sobre su bocadillo, sin nada fijo. Pregunta, respuestas, «Quitar respuesta», «Siguiente pregunta» y comentario van dentro del bocadillo, que se desplaza entero y no se corta. Se acepta el scroll.',
  'Cuestionario a dos columnas (≥ 1080 px), como la consulta: Sofi a 384 px arriba a la izquierda sobre su banda de puntos, con el bocadillo debajo; las cuatro respuestas, en dos columnas dentro de él. A la derecha, las seis áreas, las notas y las acciones.',
  'Pantalla de error con Sofi entera, apoyada en el borde del recuadro (antes, recortada a la cara).',
]

// Ajustes de las revisiones de T012, ya aplicados y aprobados.
const APPLIED = [
  'Composición estable: responder, reaccionar, quitar una respuesta o guardar no mueve el formulario. El bocadillo reserva el alto del comentario más largo, también mientras Sofi escribe.',
  'En estrecho, la barra fija solo lleva «Guardar»; «Descartar cambios» queda debajo, en el flujo. Los avisos de guardado van bajo las acciones.',
  'Comentarios breves de Sofi aprobados.',
  'Elegir una pregunta desde el índice lleva el foco a sus respuestas (a la marcada, si la hay) y trae el escenario a la vista si hace falta. Su grupo de respuestas dice área y pregunta, y por eso la región de anuncios se calla en ese cambio. «Siguiente pregunta» deja el foco en su mismo enlace y anuncia la pregunta.',
  'El aviso de sonido bloqueado va en el flujo, bajo el bocadillo: no tapa nada y solo empuja lo que hay debajo.',
  '«Volver a la consulta» es un botón secundario en la cabecera. Al completar las seis áreas, Sofi lo dice («Seis de seis. Solo falta guardarlo.») y el diálogo ofrece «Ir a guardar» mientras «Guardar» queda fuera de la pantalla, y «Guardar» da un salto una vez cuando se ve, sin guardar ni redirigir. Tras guardar, también una ficha parcial o solo en memoria, el rosa pasa a «Volver a la consulta», junto a «Guardar», que baja a secundario. Con movimiento reducido, nada salta.',
]

function PendingSpec() {
  return (
    <LabSpec
      id="p-pending"
      kicker="6.4 · Decisiones"
      title="Decisiones aprobadas"
      desc="Lo que se cerró en la revisión visual de 004, sobre T012. Estas composiciones son los componentes reales de la feature: la consulta y el expediente de la aplicación los usan tal cual."
    >
      <LabUses items={APPROVED} />
      <LabCap as="h3" style={{ marginTop: '1.75rem' }}>
        Ajustes y comportamiento
      </LabCap>
      <LabUses items={APPLIED} />
    </LabSpec>
  )
}

export function ProfileSection({ motion }: { motion: MotionPreference }) {
  return (
    <>
      <LabMast
        tag="004"
        kicker="Aprobado · revisión de 004"
        title="Expediente"
        titleId="p-title"
        deck="El expediente de la pareja: la invitación, el cuestionario, el guardado y la eliminación, con los componentes de la feature (aprobados en T012). Sofi usa los placeholders aprobados y estas composiciones funcionan en memoria: no se guarda ni se envía nada."
        jumps={[
          { href: '#p-states', num: '6.1', label: 'Estados de Sofi' },
          { href: '#p-invite', num: '6.2', label: 'Invitación y acceso' },
          { href: '#p-sheet', num: '6.3', label: 'Cuestionario' },
          { href: '#p-pending', num: '6.4', label: 'Decisiones' },
        ]}
      />
      <StatesSpec />
      <InviteSpec motion={motion} />
      <SheetSpec motion={motion} />
      <PendingSpec />
    </>
  )
}
