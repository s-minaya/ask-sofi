import { SofiSprite } from '../../components/sofi/SofiSprite/SofiSprite'
import { selectVisual } from '../../components/sofi/visual/select'
import styles from './MotionSection.module.scss'

// El hueco de 4.3 (T063): pinta lo que `selectVisual` decide para «habla / no habla», el mismo
// contrato que usará la capa visual (plan 008 §5.1). No elige recurso ni pose por su cuenta: la
// pose de las pausas la aprueba AV5 (T070) y entrará por el registro, no por aquí.
// Recibe solo el booleano de `SofiSpeech.onSpeakingChange`, que cambia en las frases y no en
// cada letra: por eso no se repinta por carácter.
export function SyncSlot({ speaking }: { speaking: boolean }) {
  const intent = selectVisual({ speaking })
  return (
    <div
      className={styles.slot}
      data-speaking={speaking}
      // Decorativo (D-3): el texto de SofiSpeech es lo que se anuncia.
      aria-hidden="true"
    >
      {intent.kind === 'animation' && (
        <SofiSprite animation={intent.id} style={{ width: '100%' }} />
      )}
    </div>
  )
}
