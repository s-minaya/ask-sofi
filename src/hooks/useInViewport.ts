import { useEffect, useState, type RefObject } from 'react'

type Options = {
  // Milisegundos sin desplazarse para dar el elemento por visible. Un
  // desplazamiento suave lo atraviesa entero mientras aún se mueve la página: lo
  // que depende de verse esperaría a que se asiente, para no activarse (ni
  // parpadear) por el camino.
  settleMs?: number
}

// Si el elemento está entero en la pantalla (y la página asentada). Sin
// IntersectionObserver se da por visible: no se oculta nada y quien lo usa para
// guiar simplemente no guía.
export function useInViewport(
  ref: RefObject<Element | null>,
  { settleMs = 0 }: Options = {},
): boolean {
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    let timer: number | undefined
    const clear = () => {
      window.clearTimeout(timer)
      timer = undefined
    }
    const settle = () => {
      clear()
      timer = window.setTimeout(() => {
        timer = undefined
        setVisible(true)
      }, settleMs)
    }
    // Cada desplazamiento mientras se espera reinicia la espera.
    const onScroll = () => {
      if (timer !== undefined) settle()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Si la página se movió entre fotogramas llegan varias juntas: vale la última.
        const entry = entries[entries.length - 1]
        if (entry.intersectionRatio < 1) {
          clear()
          setVisible(false)
        } else if (settleMs > 0) settle()
        else setVisible(true)
      },
      { threshold: 1 },
    )
    observer.observe(element)
    if (settleMs > 0)
      window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      clear()
    }
  }, [ref, settleMs])

  return visible
}
