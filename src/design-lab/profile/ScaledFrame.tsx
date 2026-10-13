import { useEffect, useRef, useState } from 'react'
import styles from './ScaledFrame.module.scss'

type ScaledFrameProps = {
  src: string
  title: string
  label: string
  width: number
  height: number
}

// Un iframe del tamaño de la pantalla que representa, reducido para caber:
// dentro, la composición responde a sus media queries reales.
export function ScaledFrame({
  src,
  title,
  label,
  width,
  height,
}: ScaledFrameProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(width)

  useEffect(() => {
    const element = boxRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) =>
      setAvailable(Math.round(entry.contentRect.width)),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const scale = Math.min(1, available / width)

  return (
    <figure className={styles.frame}>
      <figcaption className={styles.caption}>
        {label} · {width} × {height} px · {Math.round(scale * 100)} %
      </figcaption>
      <div ref={boxRef} className={styles.box}>
        <div
          className={styles.holder}
          style={{
            width: Math.round(width * scale),
            height: Math.round(height * scale),
          }}
        >
          <iframe
            className={styles.device}
            src={src}
            title={title}
            width={width}
            height={height}
            style={{ transform: `scale(${scale.toFixed(4)})` }}
          />
        </div>
      </div>
    </figure>
  )
}
