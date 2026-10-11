import { Fragment, useState } from 'react'
import { cx } from '../../../utils/cx'
import { SparkIcon, TickerPauseIcon, TickerPlayIcon } from '../icons/icons'
import styles from './Ticker.module.scss'

type TickerPauseButtonProps = {
  paused: boolean
  onToggle: () => void
  className?: string
}

export function TickerPauseButton({
  paused,
  onToggle,
  className,
}: TickerPauseButtonProps) {
  return (
    <button
      type="button"
      className={cx(styles.pause, className)}
      aria-pressed={paused}
      aria-label="Pausar titulares"
      onClick={onToggle}
    >
      {paused ? <TickerPlayIcon /> : <TickerPauseIcon />}
    </button>
  )
}

type TickerProps = {
  label: string
  headlines: ReadonlyArray<string>
  className?: string
}

// Titulares en bucle. Siempre se pueden pausar (WCAG 2.2.2) y nunca llevan
// información que no esté en otro sitio.
export function Ticker({ label, headlines, className }: TickerProps) {
  const [paused, setPaused] = useState(false)

  return (
    <div className={cx(styles.ticker, className)} data-paused={paused}>
      <p className={styles.label}>{label}</p>
      <div className={styles.window}>
        <div className={styles.track}>
          {[false, true].map((copy) =>
            headlines.map((headline) => (
              <Fragment key={`${copy}-${headline}`}>
                {/* La copia del bucle se oculta: el lector oye cada titular una vez. */}
                <span aria-hidden={copy || undefined}>{headline}</span>
                <SparkIcon className={styles.spark} />
              </Fragment>
            )),
          )}
        </div>
      </div>
      <TickerPauseButton
        paused={paused}
        onToggle={() => setPaused((value) => !value)}
      />
    </div>
  )
}
