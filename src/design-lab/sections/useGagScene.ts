import { useReducer, useState } from 'react'
import {
  createAmbient,
  type GagId,
  type SceneCause,
} from '../../components/sofi/visual/ambient'
import { IDLE_DEFAULT_MS } from '../gagBadge'
import { createGagLog, gagReducer } from '../gagLog'
import { observeAmbient } from '../observeAmbient'

export const ALL_ON: Readonly<Record<GagId, boolean>> = {
  poking: true,
  'i-see-you': true,
  'are-u-still-here': true,
}

// El estado de una escena de gags del Lab (4.7 y 4.8): las causas de pausa compartidas
// (`ambient`), qué gags están montados, la inactividad y el registro de lo que hace `ambient`.
// Cada escena tiene el suyo: una pantalla móvil y una ancha no se dan a la vez.
export function useGagScene() {
  const [log, report] = useReducer(gagReducer, undefined, createGagLog)
  const [ambient] = useState(() => observeAmbient(createAmbient(), report))
  const [gags, setGags] = useState(ALL_ON)
  const [causes, setCauses] = useState<ReadonlySet<SceneCause>>(new Set())
  const [idle, setIdle] = useState(IDLE_DEFAULT_MS)
  const [showHit, setShowHit] = useState(false)

  const setGag = (kind: GagId, checked: boolean) =>
    setGags((current) => ({ ...current, [kind]: checked }))

  const setCause = (cause: SceneCause, active: boolean) => {
    ambient.setCause(cause, active)
    setCauses((current) => {
      const next = new Set(current)
      if (active) next.add(cause)
      else next.delete(cause)
      return next
    })
  }

  return {
    ambient,
    log,
    gags,
    setGag,
    causes,
    setCause,
    idle,
    setIdle,
    showHit,
    setShowHit,
  }
}

export type GagScene = ReturnType<typeof useGagScene>
