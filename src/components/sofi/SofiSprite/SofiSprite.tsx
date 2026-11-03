import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react'
import { cx } from '../../../utils/cx'
import { className as blinkClass } from '../sprites/sofi-blink'
import { rateFor, subscribeToRates } from '../visual/rates'
import { SOFI_REGISTRY } from '../visual/registry'
import type { SofiAnimationId } from '../visual/types'
import { loadedClassOf, loadSprite } from './loadSprite'
import styles from './SofiSprite.module.scss'

// Primitiva de pintura de un recurso animado de Sofi (plan 008 §5.4). No decide qué se pinta
// (eso es `selectVisual`), no pone movimiento propio (el reducido lo resuelven los parciales
// vía PostCSS, D-1) y es siempre decorativo (D-3): el significado lo da el texto de la pantalla.
type SofiSpriteProps = {
  animation: SofiAnimationId
  className?: string
  style?: CSSProperties
  // Fin del primer ciclo: la primera vuelta de un bucle o la pasada única (plan §5.3).
  // Sin Web Animations o con movimiento reducido no hay animación y no se emite.
  onFirstCycle?: () => void
  // Fin de una pasada única. Quien lo recibe consulta el estado actual, sin cola (plan §5.2).
  onEnd?: () => void
}

// Una instancia por recurso: al cambiar de animación vuelve a esperar su carga y a contar su
// primer ciclo.
export function SofiSprite({ animation, ...props }: SofiSpriteProps) {
  return <Sprite key={animation} animation={animation} {...props} />
}

function Sprite({
  animation,
  className,
  style,
  onFirstCycle,
  onEnd,
}: SofiSpriteProps) {
  const element = useRef<HTMLSpanElement>(null)
  const cycle = useRef({ first: false, end: false })
  // La clase del recurso, solo cuando su módulo está cargado y sus tiras decodificadas.
  const [painted, setPainted] = useState(() => loadedClassOf(animation))
  const rate = useSyncExternalStore(subscribeToRates, () => rateFor(animation))

  useEffect(() => {
    if (painted) return
    let current = true
    // Un fallo deja la estática: Sofi nunca se queda sin representación.
    loadSprite(animation).then(
      (loadedClass) => current && setPainted(loadedClass),
      () => {},
    )
    return () => {
      current = false
    }
  }, [animation, painted])

  const applyCurrentRate = useEffectEvent(() => {
    if (element.current) applyRate(element.current, rate)
  })
  const finishCycle = useEffectEvent((single: boolean) => {
    if (!cycle.current.first) {
      cycle.current.first = true
      onFirstCycle?.()
    }
    if (single && !cycle.current.end) {
      cycle.current.end = true
      onEnd?.()
    }
  })

  // Eventos de animación nativos, como en la medición (E5): React los escucha con el prefijo
  // del proveedor cuando el navegador no declara `AnimationEvent`, y entonces no llegan.
  useEffect(() => {
    const node = element.current
    if (!painted || !node) return
    // Las capas nuevas (otra iteración, otro pseudoelemento) nacen a 1×.
    const start = () => applyCurrentRate()
    const iteration = () => finishCycle(false)
    const end = () => finishCycle(true)
    node.addEventListener('animationstart', start)
    node.addEventListener('animationiteration', iteration)
    node.addEventListener('animationend', end)
    return () => {
      node.removeEventListener('animationstart', start)
      node.removeEventListener('animationiteration', iteration)
      node.removeEventListener('animationend', end)
    }
  }, [painted])

  useEffect(() => {
    if (painted) applyCurrentRate()
  }, [painted, rate])

  return (
    <span
      ref={element}
      aria-hidden="true"
      className={cx(
        styles.root,
        painted ?? cx(blinkClass, styles.fallback),
        painted &&
          SOFI_REGISTRY[animation].singlePassClass &&
          styles.singlePass,
        className,
      )}
      style={style}
    />
  )
}

// Velocidad común sobre el subárbol, pseudoelementos incluidos (E5). jsdom no implementa Web
// Animations: sin ellas no hay velocidad que aplicar.
function applyRate(element: Element, rate: number) {
  for (const animation of element.getAnimations?.({ subtree: true }) ?? []) {
    if (animation.playbackRate !== rate) animation.playbackRate = rate
  }
}
