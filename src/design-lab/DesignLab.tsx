import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import {
  MotionPreferenceProvider,
  type MotionPreference,
} from '../app/providers/MotionPreference'
import { SoundProvider } from '../app/providers/SoundProvider'
import { Logo } from '../components/ui/Logo/Logo'
import { SegmentedControl } from '../components/ui/SegmentedControl/SegmentedControl'
import { SkipLink } from '../components/ui/SkipLink/SkipLink'
import { useTheme } from '../hooks/useTheme'
import type { ThemePreference } from '../infrastructure/storage/preferencesStorage'
import styles from './DesignLab.module.scss'
import {
  LAB_SECTIONS,
  sectionFromSearch,
  sectionHref,
  type LabSectionKey,
} from './labSections'
import { LabGroupLabel } from './parts/LabParts'
import { FoundationsSection } from './sections/FoundationsSection'
import { MotionSection } from './sections/MotionSection'
import { PreviewSection } from './sections/PreviewSection'
import { SofiSection } from './sections/SofiSection'
import { UiSection } from './sections/UiSection'

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
] as const satisfies ReadonlyArray<{ value: ThemePreference; label: string }>

const MOTION_OPTIONS = [
  { value: 'system', label: 'Sistema' },
  { value: 'reduce', label: 'Reducido' },
] as const satisfies ReadonlyArray<{ value: MotionPreference; label: string }>

const SECTIONS: Record<
  LabSectionKey,
  (props: { motion: MotionPreference }) => ReactNode
> = {
  foundations: () => <FoundationsSection />,
  ui: () => <UiSection />,
  sofi: () => <SofiSection />,
  motion: () => <MotionSection />,
  preview: ({ motion }) => <PreviewSection motion={motion} />,
}

const FOOTER_NOTES: Record<LabSectionKey, [string, string]> = {
  foundations: [
    'Valores aprobados en el diseño C «Exclusiva».',
    'Los componentes solo leen tokens semánticos.',
  ],
  ui: [
    'Los estados forzados de las rejillas son muestras visuales; los ejemplares vivos responden de verdad.',
    'Botones sin acción: son ejemplares de componente.',
  ],
  sofi: [
    'Fixtures locales: ningún componente sabe de dónde vienen sus datos.',
    'Porcentajes, preguntas y textos de error: datos de demostración.',
  ],
  motion: [
    'Audio: talking-sound.mp3 de la feature 002, sin modificar.',
    'Nada de esto es una preferencia pública.',
  ],
  preview: [
    'El marco se desplaza por dentro: rueda, trackpad o teclado.',
    'Sin peticiones reales · fixtures deterministas · el audio solo suena tras un gesto.',
  ],
}

// Laboratorio de desarrollo. Nunca forma parte del build público.
export function DesignLab() {
  const [section, setSection] = useState<LabSectionKey>(() =>
    sectionFromSearch(window.location.search),
  )
  const [motion, setMotion] = useState<MotionPreference>('system')
  const { preference, setPreference, systemTheme } = useTheme()

  useEffect(() => {
    const onPopState = () =>
      setSection(sectionFromSearch(window.location.search))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (
    event: MouseEvent<HTMLAnchorElement>,
    key: LabSectionKey,
  ) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
      return
    event.preventDefault()
    window.history.pushState(null, '', sectionHref(key))
    setSection(key)
    window.scrollTo(0, 0)
  }

  const current = LAB_SECTIONS.find((item) => item.key === section)
  const [footA, footB] = FOOTER_NOTES[section]

  return (
    <SoundProvider>
      <MotionPreferenceProvider value={motion}>
        <div className={styles.lab}>
          <SkipLink href="#lab-main" />
          <div className={styles.bar}>
            <p className={styles.barLabel}>Design Lab</p>
            <p className={styles.barText}>
              Solo en desarrollo · No forma parte del build público
            </p>
            <p className={styles.barMeta}>
              Ask Sofi · Feature 002 · Dirección C «Exclusiva»
            </p>
          </div>
          <header className={`${styles.head} ${styles.wrap}`}>
            <div className={styles.brand}>
              <Logo
                alt="Ask Sofi"
                className={styles.brandLogo}
                sizes="8.25em"
              />
              <p className={styles.brandName}>Design Lab</p>
            </div>
            <div className={styles.controls}>
              <div
                className={styles.controls}
                style={{ gap: '0.5rem 0.75rem' }}
              >
                <LabGroupLabel id="lab-theme">Tema</LabGroupLabel>
                <SegmentedControl
                  labelledBy="lab-theme"
                  options={THEME_OPTIONS}
                  value={preference}
                  onChange={setPreference}
                />
                {preference === 'system' && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-subtle)',
                    }}
                  >
                    Tu sistema: {systemTheme === 'dark' ? 'oscuro' : 'claro'}
                  </span>
                )}
              </div>
              <div
                className={styles.controls}
                style={{ gap: '0.5rem 0.75rem' }}
              >
                <LabGroupLabel id="lab-motion">Movimiento</LabGroupLabel>
                <SegmentedControl
                  labelledBy="lab-motion"
                  options={MOTION_OPTIONS}
                  value={motion}
                  onChange={setMotion}
                />
              </div>
            </div>
          </header>
          <nav className={styles.nav} aria-label="Secciones del Design Lab">
            {LAB_SECTIONS.map((item) => (
              <a
                key={item.key}
                href={sectionHref(item.key)}
                aria-current={item.key === section ? 'page' : undefined}
                onClick={(event) => navigate(event, item.key)}
              >
                <span className={styles.navNum}>{item.num}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <main id="lab-main" tabIndex={-1} aria-label={current?.label}>
            {SECTIONS[section]({ motion })}
          </main>
          <footer className={`${styles.foot} ${styles.wrap}`}>
            <p>{footA}</p>
            <p>{footB}</p>
          </footer>
        </div>
      </MotionPreferenceProvider>
    </SoundProvider>
  )
}
