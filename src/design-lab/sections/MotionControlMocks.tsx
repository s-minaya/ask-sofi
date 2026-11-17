import { useId, useState } from 'react'
import type { MotionPreference } from '../../app/providers/MotionPreference'
import headerStyles from '../../components/layout/SiteHeader/SiteHeader.module.scss'
import { IconButton } from '../../components/ui/IconButton/IconButton'
import {
  MoonIcon,
  SoundOffIcon,
  SoundOnIcon,
  SunIcon,
  SystemIcon,
} from '../../components/ui/icons/icons'
import { Logo } from '../../components/ui/Logo/Logo'
import {
  SegmentedControl,
  type SegmentOption,
} from '../../components/ui/SegmentedControl/SegmentedControl'
import { KickerRow } from '../../components/ui/Tag/Tag'
import { TextLink } from '../../components/ui/TextLink/TextLink'
import type { ThemePreference } from '../../infrastructure/storage/preferencesStorage'
import { cx } from '../../utils/cx'
import {
  MOTION_CONTROL_OPTIONS,
  WHY_FULL_LINK,
  WHY_FULL_TEXT,
} from '../motionControl'
import styles from './MotionControlMocks.module.scss'

// T071 · piezas del control de movimiento aprobado con AV7 (spec 008 §7; plan §11.9), en el Lab.
// Los controles no escriben ninguna preferencia y la maqueta de cabecera reutiliza los
// componentes y los estilos reales sin tocar producción, que es de T089–T090.

// Solo etiquetas, en todos los tamaños: sin iconos (decisión del 2026-11-17).
const SEGMENTS: ReadonlyArray<SegmentOption<MotionPreference>> =
  MOTION_CONTROL_OPTIONS

export type MotionControlProps = {
  value: MotionPreference
  onChange: (value: MotionPreference) => void
  className?: string
}

// El control: el mismo `SegmentedControl` que el tema (botones con aria-pressed en un grupo con
// nombre), siempre con texto. «Completo» lleva el acento como fondo con texto tinta, el mismo uso
// que el botón principal: distinto del seleccionado, que es tinta sobre fondo. El acento como
// color de texto no cumple contraste (2,7:1 en claro, 2,4:1 en oscuro).
export function MotionSwitchProto({
  value,
  onChange,
  className,
}: MotionControlProps) {
  return (
    <SegmentedControl
      label="Movimiento"
      options={SEGMENTS}
      value={value}
      onChange={onChange}
      display="text"
      className={cx(styles.accentFull, className)}
    />
  )
}

// El enlace «¿Por qué Completo?» y su explicación: un botón con aria-expanded (teclado y tacto)
// que muestra u oculta el texto aprobado. Sin componente nuevo: `TextLink` y dos párrafos. El
// enlace y el panel van por separado para que, en la cabecera, el panel ocupe su propia fila
// sin mover los controles; en el DOM, el panel sigue justo después de los controles.
function useWhyFull() {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return { open, panelId, toggle: () => setOpen((value) => !value) }
}

type WhyFull = ReturnType<typeof useWhyFull>

function WhyFullLink({ why, className }: { why: WhyFull; className?: string }) {
  return (
    <TextLink
      size="sm"
      className={cx(styles.why, className)}
      aria-expanded={why.open}
      aria-controls={why.panelId}
      onClick={why.toggle}
    >
      {WHY_FULL_LINK}
    </TextLink>
  )
}

function WhyFullPanel({
  why,
  className,
}: {
  why: WhyFull
  className?: string
}) {
  return (
    <div
      id={why.panelId}
      className={cx(styles.explain, className)}
      hidden={!why.open}
    >
      {WHY_FULL_TEXT.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

export function WhyFullDisclosure() {
  const why = useWhyFull()
  return (
    <>
      <WhyFullLink why={why} />
      <WhyFullPanel why={why} />
    </>
  )
}

// --- Maqueta de la cabecera ---

const THEME_LOOK: ReadonlyArray<SegmentOption<ThemePreference>> = [
  { value: 'light', label: 'Claro', icon: <SunIcon size={18} /> },
  { value: 'dark', label: 'Oscuro', icon: <MoonIcon size={18} /> },
  { value: 'system', label: 'Sistema', icon: <SystemIcon size={18} /> },
]

// El selector de tema tal como se ve en la cabecera, con estado propio: una maqueta no cambia
// el tema real del Lab ni necesita su proveedor. Conserva su regla aprobada: texto desde 760 px.
function ThemeSwitchLook() {
  const [theme, setTheme] = useState<ThemePreference>('system')
  return (
    <SegmentedControl
      label="Tema"
      options={THEME_LOOK}
      value={theme}
      onChange={setTheme}
      display="responsive"
    />
  )
}

type HeaderMockProps = {
  // Sin el control de movimiento: la cabecera de hoy, como referencia.
  motion?: MotionControlProps
  className?: string
}

// La cabecera real (`SiteHeader`) pieza a pieza, con sus estilos, más el control y la
// explicación. Se replica aquí para no tocar producción antes de T089–T090. Sin el control
// es la cabecera de hoy, tal cual. Con él, todas sus piezas fluyen en una sola secuencia que
// envuelve (logo, tema, movimiento, sonido y enlace, en el orden del DOM y del foco): lo que no
// cabe baja a otra línea, alineado a la derecha, y la explicación abierta ocupa la suya.
// Distribución medida en `008-verification.md` §43.
export function HeaderMock({ motion, className }: HeaderMockProps) {
  const [sound, setSound] = useState(false)
  const why = useWhyFull()
  return (
    <header
      className={cx(headerStyles.header, motion && styles.flow, className)}
      data-motion-control={motion ? 'true' : 'false'}
    >
      <span className={cx(headerStyles.home, motion && styles.brand)}>
        <Logo
          alt="Ask Sofi"
          className={headerStyles.logo}
          sizes="(max-width: 22.5em) 6.25em, (min-width: 47.5em) 10.5em, 8.25em"
        />
      </span>
      <KickerRow
        tag="En directo"
        kicker="El consultorio de Sofi"
        className={cx(headerStyles.kickers, motion && styles.kickers)}
      />
      <div className={cx(headerStyles.tools, motion && styles.tools)}>
        <ThemeSwitchLook />
        {motion && <MotionSwitchProto {...motion} />}
        <IconButton
          label="Sonido de Sofi"
          pressed={sound}
          onClick={() => setSound((value) => !value)}
        >
          {sound ? <SoundOnIcon /> : <SoundOffIcon />}
        </IconButton>
        {motion && <WhyFullLink why={why} />}
      </div>
      {motion && <WhyFullPanel why={why} className={styles.explainRow} />}
    </header>
  )
}
