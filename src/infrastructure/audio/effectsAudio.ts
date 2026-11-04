// Controlador de los efectos sonoros contextuales de Sofi (spec 008 §9, plan §11.1), separado de la
// voz: usa siempre el AudioContext que le presta `SoundProvider` y jamás crea ni cierra uno.
// Es un controlador de audio, no de producto: no decide cuándo toca un efecto, solo cuándo NO
// puede sonar. Un efecto nunca puede romper, retrasar ni condicionar lo que ocurre en la aplicación.
import {
  defaultFetchData,
  type AudioContextLike,
  type SpeechAudio,
} from './speechAudio'

export type EffectDefinition = {
  src: string
  // Los efectos de `memory-wipe`: solo suenan tras el borrado total efectivo (spec §9).
  afterErasure?: boolean
}

// Lo que la aplicación sabe en este momento. Cada llamada a `setSituation` sustituye la anterior.
export type EffectsSituation = {
  // Seguridad (`safety_concern` o evaluación no disponible), salida rápida y estados sensibles:
  // silencio absoluto.
  safety?: boolean
  quickExit?: boolean
  sensitive?: boolean
  // El borrado total ya es efectivo.
  dataErased?: boolean
}

export type EffectsAudioOptions<Id extends string> = {
  // Contexto prestado: el dueño es `SoundProvider`, que lo cierra.
  context: () => AudioContextLike
  effects: Record<Id, EffectDefinition>
  // La voz de Sofi: mientras suena, ningún efecto.
  voice: Pick<SpeechAudio, 'getStatus' | 'subscribe'>
  fetchData?: (src: string) => Promise<ArrayBuffer>
}

export type EffectsAudio<Id extends string> = {
  // Debe llamarse dentro de un gesto del usuario: pide y reanuda el contexto ahí mismo.
  prepare(): Promise<void>
  // Fire-and-forget: no devuelve nada que esperar y nunca lanza.
  play(id: Id): void
  setSituation(situation: EffectsSituation): void
  disable(): void
  dispose(): void
}

export function createEffectsAudio<Id extends string>({
  context: borrowContext,
  effects,
  voice,
  fetchData = defaultFetchData,
}: EffectsAudioOptions<Id>): EffectsAudio<Id> {
  let enabled = false
  let context: AudioContextLike | null = null
  let situation: EffectsSituation = {}
  const buffers = new Map<string, AudioBuffer>()
  const loading = new Map<string, Promise<void>>()
  let current: AudioBufferSourceNode | null = null
  let unwatchVoice: (() => void) | null = null

  const silenced = () =>
    Boolean(situation.safety || situation.quickExit || situation.sensitive)

  // Nunca lanza: se llama desde escuchas de otros (la voz) y desde la limpieza.
  function stopCurrent() {
    const source = current
    if (!source) return
    current = null
    source.onended = null
    try {
      source.stop()
    } catch {
      // Ya había terminado o no llegó a empezar.
    }
    try {
      source.disconnect()
    } catch {
      // Ya estaba desconectado.
    }
  }

  // Un efecto jamás tapa la voz: si la voz empieza mientras suena uno, cede el efecto.
  function watchVoice() {
    unwatchVoice ??= voice.subscribe(() => {
      if (voice.getStatus() === 'playing') stopCurrent()
    })
  }

  function load(id: string, src: string, ctx: AudioContextLike) {
    if (buffers.has(id)) return Promise.resolve()
    let pending = loading.get(id)
    if (!pending) {
      pending = fetchData(src)
        .then((data) => ctx.decodeAudioData(data))
        .then((decoded) => {
          buffers.set(id, decoded)
        })
        // Un archivo que falla solo se queda sin sonar; el siguiente `prepare` lo reintenta.
        .catch(() => undefined)
        .finally(() => loading.delete(id))
      loading.set(id, pending)
    }
    return pending
  }

  async function prepare() {
    let ctx: AudioContextLike
    try {
      // Antes de cualquier espera: es lo que ocurre dentro del gesto.
      context ??= borrowContext()
      ctx = context
    } catch {
      return
    }
    enabled = true
    watchVoice()
    if (ctx.state !== 'running') ctx.resume().catch(() => undefined)
    await Promise.all(
      Object.entries<EffectDefinition>(effects).map(([id, { src }]) =>
        load(id, src, ctx),
      ),
    )
  }

  function play(id: Id) {
    try {
      const definition: EffectDefinition | undefined = effects[id]
      const buffer = buffers.get(id)
      if (!enabled || !context || context.state !== 'running') return
      if (!definition || !buffer) return
      if (silenced()) return
      if (definition.afterErasure && !situation.dataErased) return
      if (voice.getStatus() === 'playing') return

      // Un efecto a la vez: el más reciente sustituye al que suena.
      stopCurrent()
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(context.destination)
      source.onended = () => {
        if (current === source) current = null
        source.disconnect()
      }
      current = source
      source.start()
    } catch {
      // Un efecto que no puede sonar se queda en silencio: nunca afecta a la aplicación.
    }
  }

  function setSituation(next: EffectsSituation) {
    situation = { ...next }
    if (silenced()) stopCurrent()
  }

  function disable() {
    enabled = false
    stopCurrent()
  }

  function dispose() {
    disable()
    unwatchVoice?.()
    unwatchVoice = null
    // Prestado: se olvida, no se cierra. El siguiente `prepare` lo vuelve a pedir.
    context = null
  }

  return { prepare, play, setSituation, disable, dispose }
}
