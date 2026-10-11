import type { ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import { IconButton } from '../../ui/IconButton/IconButton'
import { SoundOffIcon, SoundOnIcon } from '../../ui/icons/icons'
import { Logo } from '../../ui/Logo/Logo'
import { KickerRow, type TagTone } from '../../ui/Tag/Tag'
import { ThemeSwitch } from '../../ui/ThemeSwitch/ThemeSwitch'
import styles from './SiteHeader.module.scss'

type SiteHeaderProps = {
  // El logo vuelve siempre a la portada.
  onHome: () => void
  tag?: ReactNode
  tagTone?: TagTone
  kicker?: ReactNode
  soundEnabled: boolean
  onToggleSound: () => void
  className?: string
}

export function SiteHeader({
  onHome,
  tag,
  tagTone = 'pink',
  kicker,
  soundEnabled,
  onToggleSound,
  className,
}: SiteHeaderProps) {
  return (
    <header className={cx(styles.header, className)}>
      <button
        type="button"
        className={styles.home}
        onClick={onHome}
        aria-label="Ask Sofi, volver a portada"
      >
        <Logo
          alt=""
          className={styles.logo}
          sizes="(max-width: 22.5em) 6.25em, (min-width: 47.5em) 10.5em, 8.25em"
        />
      </button>
      {(tag || kicker) && (
        <KickerRow
          tag={tag}
          tagTone={tagTone}
          kicker={kicker}
          className={styles.kickers}
        />
      )}
      <div className={styles.tools}>
        <ThemeSwitch display="responsive" />
        <IconButton
          label="Sonido de Sofi"
          pressed={soundEnabled}
          onClick={onToggleSound}
        >
          {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
        </IconButton>
      </div>
    </header>
  )
}
